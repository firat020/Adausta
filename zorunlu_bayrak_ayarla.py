"""Sunucu backend/.env içinde TELEFON_DOGRULAMA_ZORUNLU değerini ayarlar.
Kullanım: python zorunlu_bayrak_ayarla.py [true|false]   (varsayılan true)
.env yedeklenir, yalnız bu satır eklenir/güncellenir, servis yeniden başlatılır, canlı /ayarlar ile doğrulanır."""
import json, os, re, sys, time, urllib.request
import paramiko
from ssh_baglan import baglan

deger = (sys.argv[1] if len(sys.argv) > 1 else 'true').lower()
if deger not in ('true', 'false'):
    sys.exit('Değer true veya false olmalı')
KOK = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(KOK, 'deploy_all.py'), encoding='utf-8').read()
HOST = re.search(r"^HOST\s*=\s*'([^']+)'", src, re.M).group(1)
USER = re.search(r"^USER\s*=\s*'([^']+)'", src, re.M).group(1)
PW = None  # sifre kullanilmaz; anahtar (ssh_baglan.py)
ENV = '/var/www/adausta/backend/.env'
c = baglan(HOST, USER)


def run(cmd):
    _, o, e = c.exec_command(cmd)
    return (o.read().decode(errors='replace') + e.read().decode(errors='replace')).strip()


yedek = f'{ENV}.bak_{time.strftime("%Y%m%d_%H%M%S")}'
run(f'cp -p {ENV} {yedek}')
run(f"grep -q '^TELEFON_DOGRULAMA_ZORUNLU=' {ENV} && sed -i 's/^TELEFON_DOGRULAMA_ZORUNLU=.*/TELEFON_DOGRULAMA_ZORUNLU={deger}/' {ENV} || echo 'TELEFON_DOGRULAMA_ZORUNLU={deger}' >> {ENV}")
print('Yedek:', yedek)
print('Satır:', run(f"grep '^TELEFON_DOGRULAMA_ZORUNLU=' {ENV}"))
print('Restart:', run('systemctl restart adausta; sleep 4; systemctl is-active adausta'))
c.close()
with urllib.request.urlopen('https://adausta.com/api/telefon-dogrulama/ayarlar', timeout=20) as r:
    a = json.loads(r.read().decode())
print('Canlı: zorunlu =', a.get('zorunlu'), '| yapilandirildi =', a.get('yapilandirildi'))
