"""
AdaUsta tek-komut deploy script'i.

Kullanim:
    python deploy_all.py            -> backend + frontend
    python deploy_all.py backend    -> sadece backend
    python deploy_all.py frontend   -> sadece frontend

Guvenlik ozellikleri:
    - Yuklemeden once tum .py dosyalarinin syntax'i lokal olarak derlenir;
      hatali dosya varsa sunucuya hic dokunulmaz.
    - Degistirilecek her backend dosyasinin sunucudaki mevcut hali,
      tek seferde /var/www/adausta/backups/<timestamp>/ altina yedeklenir
      (instance/, uploads/, .env asla dokunulmayan/yedeklenmeyen alanlardir).
    - Restart sonrasi servis aktif degilse VEYA health-check basarisizsa
      VEYA loglarda taze bir Traceback varsa, yedekten OTOMATIK ROLLBACK
      yapilir ve servis eski haline dondurulup tekrar baslatilir.
    - Frontend deploy'dan once frontend otomatik yeniden build edilir,
      boylece sunucudaki dist/ her zaman guncel kaynakla eslesir.
    - Eski dist/ silinmez, dist_backup_<timestamp> olarak sunucuda tutulur
      (son 3 yedek disinda otomatik temizlenir).
"""
import paramiko
from scp import SCPClient
import os
import shlex
import subprocess
import sys
import time
import py_compile
from datetime import datetime

# Windows konsolu varsayilan olarak cp1252 kullanir ve Turkce karakterler
# (ı, ş, ğ, ü, ö, ç) icin UnicodeEncodeError firlatir. utf-8'e zorla.
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except AttributeError:
    pass

HOST = '31.210.53.135'
PORT = 22
USER = 'root'
PASSWORD = os.environ.get('ADAUSTA_SSH_PASSWORD', 'iU7FTMHC')

ROOT = os.path.dirname(os.path.abspath(__file__))
REMOTE_BACKEND = '/var/www/adausta/backend'
REMOTE_BACKUP_ROOT = '/var/www/adausta/backups'
REMOTE_VENV_PIP = '/var/www/adausta/venv/bin/pip'
REMOTE_FRONTEND = '/var/www/adausta/frontend'

HEALTH_ENDPOINTS = [
    '/api/saglik',
    '/api/kategoriler/',
    '/api/ustalar/',
    '/api/sirketler/',
    '/api/magaza/urunler',
]


def make_client(retries=3):
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)
            return client
        except Exception as e:
            last_err = e
            print(f"  SSH baglanti denemesi {attempt}/{retries} basarisiz: {e}")
            time.sleep(2)
    raise RuntimeError(f"Sunucuya baglanilamadi: {last_err}")


def run_cmd(client, cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors='replace').strip()
    err = stderr.read().decode(errors='replace').strip()
    exit_code = stdout.channel.recv_exit_status()
    return exit_code, out, err


def git_tracked_backend_files():
    """backend/ altinda git'e commit edilmis dosyalarin listesini doner.
    .env, instance/, uploads/, __pycache__ gibi gitignore'lu seyler
    git ls-files ciktisina hic girmez -- bu yuzden production sirlarini
    veya kullanici verilerini asla ezmez."""
    result = subprocess.run(
        ['git', 'ls-files', 'backend/'],
        cwd=ROOT, capture_output=True, text=True, check=True,
    )
    files = [f.strip() for f in result.stdout.splitlines() if f.strip()]
    return [f for f in files if not f.endswith('.gitignore')]


def syntax_check(files):
    """Yuklemeden once tum .py dosyalarini lokal derler. Hata varsa liste doner."""
    errors = []
    for rel_path in files:
        if not rel_path.endswith('.py'):
            continue
        local_path = os.path.join(ROOT, rel_path.replace('/', os.sep))
        try:
            py_compile.compile(local_path, doraise=True, quiet=2)
        except py_compile.PyCompileError as e:
            errors.append((rel_path, str(e)))
        except SyntaxError as e:
            errors.append((rel_path, str(e)))
    return errors


def check_local_git_status():
    result = subprocess.run(
        ['git', 'status', '--porcelain'],
        cwd=ROOT, capture_output=True, text=True,
    )
    if result.stdout.strip():
        print("  UYARI: Local'de commit edilmemis degisiklikler var, onlar da deploy edilecek:")
        for line in result.stdout.strip().splitlines():
            print(f"    {line}")


def remote_backup_files(client, remote_rels, timestamp):
    """Degistirilecek her dosyanin sunucudaki MEVCUT halini backups/<ts>/ altina kopyalar.
    instance/, uploads/, .env asla bu listede olmadigi icin dokunulmaz."""
    backup_dir = f'{REMOTE_BACKUP_ROOT}/{timestamp}'
    quoted = ' '.join(shlex.quote(r) for r in remote_rels)
    script = f'''
set -e
mkdir -p {shlex.quote(backup_dir)}
cd {shlex.quote(REMOTE_BACKEND)}
for f in {quoted}; do
  if [ -f "$f" ]; then
    mkdir -p "{backup_dir}/$(dirname "$f")"
    cp "$f" "{backup_dir}/$f"
  fi
done
echo BACKUP_DONE
'''
    code, out, err = run_cmd(client, script)
    if code != 0 or 'BACKUP_DONE' not in out:
        raise RuntimeError(f"Yedekleme basarisiz oldu, guvenlik icin deploy durduruldu: {err or out}")
    return backup_dir


def remote_rollback_files(client, remote_rels, backup_dir):
    quoted = ' '.join(shlex.quote(r) for r in remote_rels)
    script = f'''
cd {shlex.quote(REMOTE_BACKEND)}
for f in {quoted}; do
  if [ -f "{backup_dir}/$f" ]; then
    cp "{backup_dir}/$f" "$f"
  fi
done
echo ROLLBACK_DONE
'''
    code, out, err = run_cmd(client, script)
    return code == 0 and 'ROLLBACK_DONE' in out


def verify_backend_health(client):
    """Servis aktif mi, health endpoint'ler 5xx donuyor mu, loglarda taze
    Traceback var mi kontrol eder. Sorun varsa (ok=False, sebep) doner."""
    time.sleep(3)

    code, out, err = run_cmd(client, 'systemctl is-active adausta')
    if out.strip() != 'active':
        code2, log_out, log_err = run_cmd(client, 'journalctl -u adausta -n 40 --no-pager')
        return False, f"servis aktif degil (durum: {out.strip() or err.strip()})\n--- son loglar ---\n{log_out or log_err}"

    for endpoint in HEALTH_ENDPOINTS:
        code, out, err = run_cmd(
            client,
            f'curl -s -o /dev/null -w "%{{http_code}}" http://127.0.0.1:5001{endpoint}'
        )
        status = out.strip()
        # 2xx ve 3xx (trailing-slash redirect) normal, 4xx/5xx/bos yanit sorun demek
        if not status or status.startswith('5') or status == '000':
            return False, f"{endpoint} -> HTTP {status or 'yanit yok'}"

    code, log_out, log_err = run_cmd(client, 'journalctl -u adausta -n 25 --no-pager')
    if 'Traceback' in log_out or 'OperationalError' in log_out:
        return False, f"restart sonrasi loglarda hata var:\n{log_out}"

    return True, None


def cleanup_old_backups(client, glob_pattern, keep=5):
    """glob_pattern altina uyan en eski girdileri, son `keep` tanesi disinda siler."""
    run_cmd(
        client,
        f'ls -1dt {glob_pattern} 2>/dev/null | tail -n +{keep + 1} | xargs -r rm -rf'
    )


# ── BACKEND DEPLOY ─────────────────────────────────────────────────────────
def deploy_backend():
    print("=" * 60)
    print("BACKEND DEPLOY")
    print("=" * 60)

    files = git_tracked_backend_files()
    print(f"  {len(files)} git-tracked dosya bulundu.")

    print("  Syntax kontrolu yapiliyor (sunucuya dokunulmadan once) ...")
    errors = syntax_check(files)
    if errors:
        print("  SYNTAX HATASI BULUNDU - deploy durduruldu, sunucuya HICBIR sey yuklenmedi:")
        for rel, msg in errors:
            print(f"    {rel}: {msg}")
        return False
    print("  Syntax OK.")

    remote_rels = [f[len('backend/'):] if f.startswith('backend/') else f for f in files]
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    client = make_client()
    try:
        print("  Sunucuya baglanildi.")

        print("  Mevcut dosyalarin yedegi aliniyor ...")
        backup_dir = remote_backup_files(client, remote_rels, timestamp)
        print(f"  Yedek konumu: {backup_dir}")

        remote_dirs = sorted({os.path.dirname(r) for r in remote_rels if os.path.dirname(r)})
        for rel_dir in remote_dirs:
            run_cmd(client, f'mkdir -p {shlex.quote(REMOTE_BACKEND + "/" + rel_dir)}')

        with SCPClient(client.get_transport()) as scp:
            for rel_path, remote_rel in zip(files, remote_rels):
                local_path = os.path.join(ROOT, rel_path.replace('/', os.sep))
                remote_path = REMOTE_BACKEND + '/' + remote_rel
                print(f"  Yukleniyor: {rel_path}")
                scp.put(local_path, remote_path)
        print("  Tum dosyalar yuklendi.")

        print("  pip install -r requirements.txt calistiriliyor ...")
        code, out, err = run_cmd(client, f'{REMOTE_VENV_PIP} install -q -r {REMOTE_BACKEND}/requirements.txt')
        if code != 0:
            print(f"  UYARI: pip install basarisiz oldu (exit {code}): {err or out}")

        print("  adausta servisi yeniden baslatiliyor ...")
        code, out, err = run_cmd(client, 'systemctl restart adausta && echo OK')
        if code != 0 or 'OK' not in out:
            print(f"  HATA: servis restart basarisiz (exit {code}): {err or out}")
            print("  Rollback baslatiliyor ...")
            remote_rollback_files(client, remote_rels, backup_dir)
            run_cmd(client, 'systemctl restart adausta')
            print("  Eski kod geri yuklendi ve servis yeniden baslatildi.")
            return False

        print("  Health check yapiliyor ...")
        healthy, reason = verify_backend_health(client)
        if not healthy:
            print(f"  HATA: deploy sonrasi saglik kontrolu basarisiz: {reason}")
            print("  OTOMATIK ROLLBACK baslatiliyor ...")
            if remote_rollback_files(client, remote_rels, backup_dir):
                run_cmd(client, 'systemctl restart adausta')
                time.sleep(3)
                rb_healthy, rb_reason = verify_backend_health(client)
                if rb_healthy:
                    print("  Rollback basarili: sunucu onceki calisir haline dondu.")
                else:
                    print(f"  KRITIK: rollback sonrasi da servis saglikli degil: {rb_reason}")
                    print("  MANUEL MUDAHALE GEREKIYOR.")
            else:
                print("  KRITIK: rollback basarisiz oldu. MANUEL MUDAHALE GEREKIYOR.")
                print(f"  Yedek burada duruyor: {backup_dir}")
            return False

        cleanup_old_backups(client, REMOTE_BACKUP_ROOT + '/*', keep=5)
        print("  Servis aktif, tum health-check endpoint'leri saglikli.")
        return True
    finally:
        client.close()


# ── FRONTEND DEPLOY ────────────────────────────────────────────────────────
def build_frontend():
    print("  Frontend yeniden build ediliyor (npm run build) ...")
    frontend_dir = os.path.join(ROOT, 'frontend')
    result = subprocess.run(
        ['npm', 'run', 'build'],
        cwd=frontend_dir, capture_output=True, text=True, shell=True,
        encoding='utf-8', errors='replace',
    )
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr)
        return False
    return True


def deploy_frontend():
    print("=" * 60)
    print("FRONTEND DEPLOY")
    print("=" * 60)

    if not build_frontend():
        print("  HATA: npm run build basarisiz oldu, deploy durduruldu.")
        return False

    dist_local = os.path.join(ROOT, 'frontend', 'dist')
    if not os.path.isdir(dist_local):
        print(f"  HATA: {dist_local} bulunamadi.")
        return False

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    client = make_client()
    try:
        print("  Sunucuya baglanildi.")

        # Eski dist'i SILMEK yerine yedekle (geri donus noktasi)
        code, out, err = run_cmd(
            client,
            f'if [ -d {REMOTE_FRONTEND}/dist ]; then '
            f'mv {REMOTE_FRONTEND}/dist {REMOTE_FRONTEND}/dist_backup_{timestamp}; fi && '
            f'mkdir -p {REMOTE_FRONTEND}/dist'
        )
        if code != 0:
            raise RuntimeError(f"Eski dist yedeklenemedi: {err}")
        print("  Eski dist yedeklendi (dist_backup_* olarak saklaniyor).")

        with SCPClient(client.get_transport()) as scp:
            print("  frontend/dist yukleniyor (recursive) ...")
            scp.put(dist_local, REMOTE_FRONTEND + '/', recursive=True)
        print("  Dosyalar yuklendi.")

        code, out, err = run_cmd(client, 'systemctl reload nginx && echo OK')
        if code != 0 or 'OK' not in out:
            print(f"  HATA: nginx reload basarisiz (exit {code}): {err or out}")
            return False
        print("  nginx reload edildi.")

        cleanup_old_backups(client, REMOTE_FRONTEND + '/dist_backup_*', keep=3)
        return True
    finally:
        client.close()


def main():
    args = set(a.lower() for a in sys.argv[1:])
    do_backend = 'frontend' not in args
    do_frontend = 'backend' not in args

    check_local_git_status()

    backend_ok = frontend_ok = None
    if do_backend:
        backend_ok = deploy_backend()
        print()

    if do_frontend:
        frontend_ok = deploy_frontend()
        print()

    print("=" * 60)
    print("DEPLOY OZETI")
    print("=" * 60)
    if backend_ok is not None:
        print(f"  Backend  : {'BASARILI' if backend_ok else 'BASARISIZ (rollback denendi)'}")
    if frontend_ok is not None:
        print(f"  Frontend : {'BASARILI' if frontend_ok else 'BASARISIZ'}")

    if (backend_ok is False) or (frontend_ok is False):
        sys.exit(1)


if __name__ == '__main__':
    main()
