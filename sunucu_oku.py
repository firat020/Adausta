"""Adausta sunucusunda SALT-OKUNUR tanı. Kullanım: python sunucu_oku.py [SIPARIS_NO]
Sadece SELECT ve journalctl/ls çalıştırır; hiçbir şeyi değiştirmez."""
import os
import re
import sys

import paramiko
from ssh_baglan import baglan

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'deploy_all.py'), encoding='utf-8').read()
HOST = re.search(r"^HOST\s*=\s*'([^']+)'", src, re.M).group(1)
USER = re.search(r"^USER\s*=\s*'([^']+)'", src, re.M).group(1)
PASSWORD = None  # sifre kullanilmaz; anahtar (ssh_baglan.py)

siparis = re.sub(r'[^A-Za-z0-9]', '', sys.argv[1]) if len(sys.argv) > 1 else ''

c = baglan(HOST, USER)


def run(cmd):
    print(f'\n$ {cmd}')
    _, o, e = c.exec_command(cmd)
    print(o.read().decode(errors='replace') + e.read().decode(errors='replace'))


run("systemctl list-units --type=service --no-pager | grep -i -E 'adausta|gunicorn'")
if siparis:
    run(f"journalctl --since '-12 hours' --no-pager | grep -i -E '{siparis}|CardPlus' | tail -40")
else:
    run("journalctl --since '-12 hours' --no-pager | grep -i CardPlus | tail -40")
run("grep -c 'deneme_mi' /var/www/adausta/backend/models.py; ls /var/www/adausta/backend/migrate_*.py | wc -l")
run("cd /var/www/adausta/backend && md5sum routes/odeme_cardplus.py models.py routes/usta_panel.py")
run("cd /var/www/adausta/backend && grep -o '^DATABASE_URL=[a-z+]*' .env; ls instance 2>/dev/null; grep -n 'SQLALCHEMY_DATABASE_URI' config.py app.py | head -3")
SORGU = """
import sqlite3
c = sqlite3.connect('file:/var/www/adausta/backend/instance/adausta.db?mode=ro', uri=True)
tablolar = [r[0] for r in c.execute("select name from sqlite_master where type='table' and name like '%odeme%'")]
print('tablolar:', tablolar)
for t in tablolar:
    kolonlar = [r[1] for r in c.execute(f'pragma table_info({t})')]
    if 'siparis_no' in kolonlar:
        print(kolonlar)
        for r in c.execute(f"select * from {t} order by id desc limit 4"):
            d = dict(zip(kolonlar, r)); print({k: d[k] for k in ('id','usta_id','siparis_no','durum','tutar','reference_type','error_message','tarih')})
"""
sftp = c.open_sftp()
with sftp.open('/tmp/adausta_oku.py', 'w') as f:
    f.write(SORGU)
sftp.close()
run('python3 /tmp/adausta_oku.py; rm -f /tmp/adausta_oku.py')
run("cd /var/www/adausta/backend && for k in SMS_PROVIDER SMS_KULLANICI SMS_SIFRE SMS_BASLIK TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_FROM; do v=$(grep -E \"^$k=\" .env | cut -d= -f2- | tr -d '\\\"' ); if [ -n \"$v\" ]; then echo \"$k: DOLU\"; else echo \"$k: BOS/YOK\"; fi; done; grep -E '^SMS_PROVIDER=' .env")
# HATA_ARA: son 3 saatteki gunicorn hata/traceback satirlari (kisaltilmis)
run("journalctl -u adausta --since '-3 hours' --no-pager | grep -E 'Traceback|Error|ERROR| 500 ' | cut -c1-220 | tail -25")
# NGINX_OKU: aktif site yapilandirmasi (salt-okunur)
run("ls /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>&1; grep -rl 'adausta' /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null")
run("f=$(grep -rl 'adausta.com' /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null | head -1); echo FILE=$f; cat $f")
c.close()
