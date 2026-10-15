"""sshd sertlestirme: sifre ile girisi kapatir, root sadece anahtarla girer.
Guvenlik: mevcut oturum ACIK tutulur; yeni ayri anahtar baglantisi dogrulanmazsa ayar GERI ALINIR."""
import paramiko
from ssh_baglan import baglan, HOST, USER, KEY

DROPIN = '/etc/ssh/sshd_config.d/00-adausta-guvenlik.conf'
ICERIK = """# Adausta guvenlik: sifre girisi kapali, root yalniz anahtarla
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 30
"""

c = baglan()  # bu oturum ACIK kalir


def run(cmd):
    _, o, e = c.exec_command(cmd)
    return (o.read().decode(errors='replace') + e.read().decode(errors='replace')).strip()


ETKIN = "sshd -T | grep -E '^(passwordauthentication|permitrootlogin|kbdinteractiveauthentication)'"
print('Onceki etkin ayar:', run(ETKIN).replace('\n', ' | '))
print('Yedek:', run("d=/root/sshd_config.bak_$(date +%Y%m%d_%H%M%S); cp -a /etc/ssh $d && echo $d"))


def geri_al(neden):
    run(f'rm -f {DROPIN}')
    run('systemctl reload ssh || systemctl reload sshd')
    print('Etkin ayar (geri alindi):', run(ETKIN).replace('\n', ' | '))
    raise SystemExit(neden)


sftp = c.open_sftp()
sftp.file(DROPIN, 'w').write(ICERIK)
out = run('sshd -t 2>&1 && echo SSHD-TEST-OK')
print(out)
if 'SSHD-TEST-OK' not in out:
    geri_al('sshd -t basarisiz, degisiklik geri alindi')
yeni = run(ETKIN)
print('Yeni etkin ayar (reload oncesi dogrulama):', yeni.replace('\n', ' | '))
if 'passwordauthentication no' not in yeni or 'permitrootlogin without-password' not in yeni.replace('prohibit-password', 'without-password'):
    geri_al('Etkin ayar beklenen degerde degil, geri alindi')
run('systemctl reload ssh || systemctl reload sshd')


def dene(**kw):
    k = paramiko.SSHClient(); k.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        k.connect(HOST, username=USER, timeout=20, look_for_keys=False, allow_agent=False, **kw)
        _, o, _ = k.exec_command('whoami')
        return True, o.read().decode().strip()
    except Exception as ex:
        return False, str(ex)
    finally:
        k.close()


ok_key, msg_key = dene(key_filename=KEY)
print('Anahtarla YENI baglanti:', 'OK' if ok_key else 'BASARISIZ', '-', msg_key)
ok_pw, msg_pw = dene(password='yanlis-deneme-sifresi')
print('Sifreyle giris reddedildi mi:', 'EVET' if not ok_pw else 'HAYIR (HATA)', '-', msg_pw[:80])
if not ok_key:
    geri_al('Anahtar girisi dogrulanamadi: sertlestirme GERI ALINDI, sifre girisi yeniden acik')
print('SERTLESTIRME-TAMAM')
c.close()
