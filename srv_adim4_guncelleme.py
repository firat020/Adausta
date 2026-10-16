"""ADIM 4: sistem guvenlik/paket guncellemeleri (apt-get upgrade). REBOOT YAPMAZ, servisleri otomatik yeniden BASLATMAZ
(needrestart yalnizca listeleme modunda). Guncelleme sunucuda arka planda calisir (baglanti kopsa da surer).
Dogrulama: sshd -t, yeni anahtar baglantisi, iki site, servis durumlari, bekleyen reboot/yeniden baslatma listesi."""
import sys
import time
from srv_ortak import baglan, run, dogrula

LOG = '/root/apt_upgrade_adim4.log'

c = baglan()  # bu oturum ACIK kalir

# --- Oncesi
print('Oncesi servisler:', run(c, 'systemctl is-active ssh nginx adausta servisapp fail2ban ufw | tr "\\n" " "'))
print('sshd -t:', run(c, 'sshd -t 2>&1 && echo OK'))
print('Surumler (once):', run(c, 'dpkg -l openssh-server nginx systemd python3 2>/dev/null | awk "/^ii/{print \\$2\\"=\\"\\$3}" | tr "\\n" " "'))
print('Yedek paket listesi:', run(c, 'd=/root/paketler_oncesi_$(date +%Y%m%d_%H%M%S).txt; dpkg --get-selections > $d; dpkg -l > $d.surumler; echo $d'))
run(c, 'apt-get update -qq 2>&1 | tail -1')

# --- Arka planda guncelle
run(c, f'rm -f {LOG}')
cmd = ("nohup sh -c 'NEEDRESTART_MODE=l NEEDRESTART_SUSPEND=1 DEBIAN_FRONTEND=noninteractive "
       "apt-get -y -o Dpkg::Options::=--force-confold -o Dpkg::Options::=--force-confdef upgrade "
       f"> {LOG} 2>&1; echo EXIT=$? >> {LOG}' > /dev/null 2>&1 &")
run(c, cmd)
print('Guncelleme baslatildi (arka plan). Izleniyor...')
bitti = False
for i in range(150):  # en fazla ~25 dk
    time.sleep(10)
    try:
        son = run(c, f'tail -n 2 {LOG}', 30)
    except Exception as ex:
        print('  (baglanti gecici kesildi, yeniden baglaniliyor):', ex)
        c = baglan(); continue
    if 'EXIT=' in run(c, f'grep -c EXIT= {LOG} && grep EXIT= {LOG}', 30):
        bitti = True
        break
    if i % 6 == 0:
        print('  ...', son.splitlines()[-1][:100] if son else '')
if not bitti:
    sys.exit('Guncelleme zaman asimi: sunucuda hala calisiyor olabilir, LOG: ' + LOG)

cikis = run(c, f'grep EXIT= {LOG}')
print('Cikis kodu:', cikis)
print('Log sonu:', run(c, f'tail -n 6 {LOG} | cut -c1-140'))
if cikis.strip() != 'EXIT=0':
    sys.exit('apt hata verdi. Log: ' + LOG)

# --- Sonrasi dogrulama
print('Yukseltilen paket sayisi:', run(c, f"grep -c '^Setting up' {LOG}"))
print('sshd -t:', run(c, 'sshd -t 2>&1 && echo OK'))
print('sshd etkin ayar:', run(c, "sshd -T | grep -E '^(passwordauthentication|permitrootlogin|kbdinteractiveauthentication)' | tr '\\n' ' '"))
print('Servisler:', run(c, 'systemctl is-active ssh nginx adausta servisapp fail2ban ufw | tr "\\n" " "'))
print('Yarim kalan paket:', run(c, 'dpkg --audit | head -3') or 'yok')
print('Kalan guncelleme:', run(c, 'apt list --upgradable 2>/dev/null | tail -n +2 | cut -d/ -f1 | tr "\\n" " "'))
print('REBOOT gerekli mi:', run(c, 'cat /var/run/reboot-required 2>&1; cat /var/run/reboot-required.pkgs 2>/dev/null | sort -u | tr "\\n" " "'))
print('Yeniden baslatilmasi gereken servisler (needrestart, SADECE liste):', run(c, 'needrestart -b -r l 2>/dev/null | grep -E "NEEDRESTART-(KSTA|SVC)" | tr "\\n" " "'))
print('Calisan cekirdek:', run(c, 'uname -r'), '| kurulu en yeni:', run(c, 'ls /boot/vmlinuz-* | sort -V | tail -1'))
ok = dogrula('adim4')
print('ADIM4-TAMAM' if ok else 'ADIM4-DOGRULAMA-BASARISIZ')
c.close()
sys.exit(0 if ok else 1)
