"""ADIM 3: ufw guvenlik duvari. Sistem guncellemesi / reboot YAPMAZ.
Emniyet: ufw acilmadan ONCE sunucuda 5 dk sonra 'ufw disable' calistiracak zamanlayici kurulur; dogrulama
basariliysa iptal edilir (baglanti kopsa bile sunucu kendini kurtarir). Dogrulama basarisizsa hemen ufw disable."""
import sys
from srv_ortak import baglan, run, dogrula

TIMER = 'ufw-guvenlik-geri-al'

c = baglan()  # bu oturum ACIK kalir

print('Oncesi:', run(c, 'ufw status | head -1'))
print('Yedek:', run(c, 'd=/root/ufw_bak_$(date +%Y%m%d_%H%M%S); cp -a /etc/ufw $d && echo $d'))

# 1) Kurtarma zamanlayicisi (5 dk)
run(c, f'systemctl stop {TIMER}.timer {TIMER}.service 2>/dev/null; systemctl reset-failed 2>/dev/null')
print('Kurtarma zamanlayicisi:', run(c, f'systemd-run --unit={TIMER} --on-active=300 /usr/sbin/ufw --force disable 2>&1 | tail -1'))
if 'timer' not in run(c, f'systemctl list-timers --all | grep {TIMER}'):
    sys.exit('Kurtarma zamanlayicisi kurulamadi, ufw ACILMADI')


def geri_al(neden):
    print('GERI ALINIYOR:', neden)
    print(run(c, 'ufw --force disable'))
    run(c, f'systemctl stop {TIMER}.timer 2>/dev/null')
    sys.exit(neden)


# 2) Once izinler, sonra varsayilanlar, en son enable
print(run(c, 'ufw allow 22/tcp comment "ssh" && ufw allow 80/tcp comment "http" && ufw allow 443/tcp comment "https"'))
print(run(c, 'ufw default deny incoming && ufw default allow outgoing && ufw default deny routed'))
print(run(c, 'ufw --force enable'))
print(run(c, 'ufw status verbose'))

# 3) Dogrulamalar
durum = run(c, 'ufw status | head -1')
if 'active' not in durum:
    geri_al('ufw aktif olmadi')
ok = dogrula('ufw')
if not ok:
    geri_al('ufw sonrasi dogrulama basarisiz')

# 4) Mevcut oturum hala canli mi + dis dunyadan port testi
print('Mevcut oturum canli:', run(c, 'echo canli'))
for port in (22, 80, 443):
    print(f'  port {port} dis erisim:', run(c, f'ss -tln | grep -c ":{port} "') != '0')

# 5) Basari: kurtarma zamanlayicisini iptal et
run(c, f'systemctl stop {TIMER}.timer')
print('Zamanlayici iptal:', run(c, f'systemctl list-timers --all | grep -c {TIMER}'), '(0 = kalmadi)')
print('ufw durum son:', run(c, 'ufw status | head -1; systemctl is-enabled ufw'))
print('fail2ban:', run(c, 'systemctl is-active fail2ban; fail2ban-client status sshd | grep -E "Currently|Total" | tr "\\n" " "'))
print('ADIM3-TAMAM')
c.close()
