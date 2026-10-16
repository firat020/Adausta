"""ADIM 2: fail2ban kurulumu + sshd jail. ufw / sistem guncellemesi / reboot YAPMAZ.
- Mevcut /etc/fail2ban ayari varsa yedeklenir ve korunur (jail.d altina ayri dosya yazilir, jail.conf'a dokunulmaz)
- Kendi IP'miz ignoreip'e eklenir; hatali giris denemesi YAPILMAZ
- Yapilandirma testi (fail2ban-client -t) basarisizsa jail dosyasi silinir ve durulur"""
import sys
from srv_ortak import baglan, run, dogrula

JAIL = '/etc/fail2ban/jail.d/adausta-sshd.local'

c = baglan()  # bu oturum ACIK kalir

# --- On kontrol (salt okunur)
port = run(c, "sshd -T | awk '/^port /{print $2}' | head -1")
bizim_ip = run(c, 'echo $SSH_CLIENT | cut -d" " -f1')
print('SSH portu:', port, '| bizim IP (sunucunun gordugu):', bizim_ip)
if not port.isdigit() or not bizim_ip:
    sys.exit('Port veya istemci IP tespit edilemedi, durduruldu')
print('Mevcut fail2ban:', run(c, 'dpkg -l fail2ban 2>/dev/null | tail -1 | cut -c1-60; ls /etc/fail2ban 2>&1 | head -3'))

# --- Kurulum
print('Kurulum:', run(c, 'DEBIAN_FRONTEND=noninteractive apt-get install -y -qq fail2ban 2>&1 | tail -3; dpkg -l fail2ban | tail -1 | cut -c1-70', 900))

# --- Mevcut ayari yedekle ve koru
print('Yedek:', run(c, 'd=/root/fail2ban_bak_$(date +%Y%m%d_%H%M%S); cp -a /etc/fail2ban $d && echo $d'))
print('Mevcut jail.d:', run(c, 'ls /etc/fail2ban/jail.d'))
if run(c, f'[ -e {JAIL} ] && echo VAR'):
    run(c, f'cp -a {JAIL} {JAIL}.eski_$(date +%s)')
    print('Eski adausta-sshd.local yedeklendi')

# --- sshd jail (jail.conf'a dokunmadan, jail.d altinda)
jail = f"""[DEFAULT]
ignoreip = 127.0.0.1/8 ::1 {bizim_ip}

[sshd]
enabled  = true
port     = {port}
backend  = systemd
journalmatch = _SYSTEMD_UNIT=ssh.service + _COMM=sshd
maxretry = 4
findtime = 10m
bantime  = 1h
"""
c.open_sftp().file(JAIL, 'w').write(jail)

# --- Yapilandirma testi
t = run(c, 'fail2ban-client -t 2>&1 | tail -3')
print('Yapilandirma testi:', t)
if 'OK' not in t:
    run(c, f'rm -f {JAIL}')
    sys.exit('Yapilandirma testi basarisiz: jail dosyasi silindi, durduruldu')

# --- Etkinlestir
print(run(c, 'systemctl enable fail2ban 2>&1 | tail -1; systemctl restart fail2ban; sleep 3; echo "servis: $(systemctl is-active fail2ban)"'))
durum = run(c, 'fail2ban-client status sshd 2>&1')
print(durum)
print('Jail listesi:', run(c, 'fail2ban-client status | grep -i "jail list"'))

# --- Loglari izlediginin kaniti: filtre journal'da gercek satirlari eslestiriyor mu?
print('Filtre testi (son 2 saat, hafif):', run(c, 'journalctl -u ssh.service --since "-2 hours" --no-pager 2>/dev/null | tail -300 > /tmp/ssh_ornek.log; timeout 60 fail2ban-regex /tmp/ssh_ornek.log /etc/fail2ban/filter.d/sshd.conf 2>&1 | grep -E "^Lines"; rm -f /tmp/ssh_ornek.log', 90))
print('fail2ban log:', run(c, "journalctl -u fail2ban --no-pager -n 8 | cut -c1-150"))

aktif = 'sshd' in run(c, 'fail2ban-client status | grep -i "jail list"') and run(c, 'systemctl is-active fail2ban') == 'active'
ok = aktif and dogrula('adim2')
print('ADIM2-TAMAM' if ok else 'ADIM2-DOGRULAMA-BASARISIZ')
c.close()
sys.exit(0 if ok else 1)
