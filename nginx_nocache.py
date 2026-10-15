"""nginx: index.html için Cache-Control: no-cache ekler (deploy sonrası eski paketin önbellekten gelmesini önler).
Tek seferlik, tekrar çalıştırılabilir: blok zaten varsa değişiklik yapmaz.
Güvenlik: yapılandırma yedeklenir, `nginx -t` başarısızsa geri alınır ve reload yapılmaz."""
import os
import re
import sys
import time

import paramiko
from ssh_baglan import baglan

KOK = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(KOK, 'deploy_all.py'), encoding='utf-8').read()
HOST = re.search(r"^HOST\s*=\s*'([^']+)'", src, re.M).group(1)
USER = re.search(r"^USER\s*=\s*'([^']+)'", src, re.M).group(1)
SIFRE = None  # sifre kullanilmaz; anahtar (ssh_baglan.py)
CONF = '/etc/nginx/sites-enabled/adausta'

BLOK = """    # index.html her zaman sunucuya sorulsun (ETag ile 304); hash'li /assets dosyaları etkilenmez
    location = /index.html {
        add_header Cache-Control "no-cache";
    }

"""
HEDEF = "    location / {\n        try_files $uri $uri/ /index.html;\n    }\n"

c = baglan(HOST, USER)
sftp = c.open_sftp()
with sftp.open(CONF, 'r') as f:
    icerik = f.read().decode('utf-8')

if 'location = /index.html' in icerik:
    print('Zaten ekli, değişiklik yapılmadı.')
    sys.exit(0)
if icerik.count(HEDEF) != 1:
    print('HATA: beklenen "location /" bloğu bulunamadı; elle müdahale gerekir. Hiçbir şey değiştirilmedi.')
    sys.exit(1)

# Yedek sites-enabled içine konmaz (nginx include'una girer); /root'a alınır
yedek = f'/root/adausta_nginx.bak_{time.strftime("%Y%m%d_%H%M%S")}'
with sftp.open(yedek, 'w') as f:
    f.write(icerik)
with sftp.open(CONF, 'w') as f:
    f.write(icerik.replace(HEDEF, BLOK + HEDEF, 1))
print('Yapılandırma güncellendi, yedek:', yedek)


def calistir(cmd):
    _, o, e = c.exec_command(cmd)
    cikti = (o.read().decode() + e.read().decode()).strip()
    return o.channel.recv_exit_status(), cikti


kod, cikti = calistir('nginx -t')
print('nginx -t:', cikti.replace('\n', ' | '))
if kod != 0:
    with sftp.open(CONF, 'w') as f:
        f.write(icerik)
    print('nginx -t BAŞARISIZ -> eski yapılandırma geri yüklendi, reload yapılmadı.')
    sys.exit(1)

kod, cikti = calistir('systemctl reload nginx && echo RELOAD_OK')
print('Reload:', cikti)
sftp.close()
c.close()
