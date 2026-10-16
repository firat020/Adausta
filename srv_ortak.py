"""Sunucu sertlestirme adimlari icin ortak yardimcilar (baglanti + dogrulama). Reboot YAPMAZ."""
import urllib.error
import urllib.request
import paramiko
from ssh_baglan import baglan, HOST, USER, KEY

SITELER = ('https://adausta.com/api/saglik', 'https://mirteknikservis.com/')


def run(c, cmd, t=900):
    _, o, e = c.exec_command(cmd, timeout=t)
    return (o.read().decode(errors='replace') + e.read().decode(errors='replace')).strip()


def ssh_yeni_baglanti_ok():
    """Ayri, yeni bir baglantida yalnizca anahtarla giris yapilabiliyor mu?"""
    k = paramiko.SSHClient(); k.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        k.connect(HOST, username=USER, key_filename=KEY, timeout=20, look_for_keys=False, allow_agent=False)
        return True
    except Exception as ex:
        print('  SSH HATASI:', ex)
        return False
    finally:
        k.close()


class _YonlendirmeYok(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def siteler():
    """[(url, durum_kodu, ok)] — 200/301/302 saglikli sayilir."""
    op = urllib.request.build_opener(_YonlendirmeYok)
    sonuc = []
    for u in SITELER:
        try:
            try:
                kod = op.open(u, timeout=20).status
            except urllib.error.HTTPError as he:
                kod = he.code
            sonuc.append((u, kod, kod in (200, 301, 302)))
        except Exception as ex:
            sonuc.append((u, str(ex), False))
    return sonuc


def dogrula(adim):
    s = siteler(); k = ssh_yeni_baglanti_ok()
    print(f'  [{adim}] SSH yeni baglanti: {"OK" if k else "BASARISIZ"} | siteler: {[(u.split("//")[1][:22], kod) for u, kod, _ in s]}')
    return k and all(ok for *_, ok in s)
