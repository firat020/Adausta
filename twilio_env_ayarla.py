"""Twilio Verify bilgilerini sunucudaki backend/.env dosyasına güvenle yazar.

Kullanım (KENDİ terminalinde, Claude oturumunda DEĞİL):
    cd C:\\Adausta
    python twilio_env_ayarla.py

- Token terminalde gizli sorulur; ekrana, loga veya sohbete yazılmaz.
- Önce Twilio'ya MESAJ GÖNDERMEDEN bilgilerin geçerli olup olmadığı kontrol edilir (salt-okunur GET).
- Sunucudaki .env yedeklenir (.env.bak_<zaman>), yalnızca 3 Twilio satırı eklenir/güncellenir.
- Sonra servis yeniden başlatılır ve canlı /ayarlar uç noktasından yapilandirildi=true doğrulanır.
"""
import base64
import getpass
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

import paramiko
from ssh_baglan import baglan

KOK = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(KOK, 'deploy_all.py'), encoding='utf-8').read()
HOST = re.search(r"^HOST\s*=\s*'([^']+)'", src, re.M).group(1)
USER = re.search(r"^USER\s*=\s*'([^']+)'", src, re.M).group(1)
SSH_SIFRE = None  # sifre kullanilmaz; anahtar (ssh_baglan.py)
ENV_YOLU = '/var/www/adausta/backend/.env'
VARSAYILAN_VERIFY = 'VA9c9aca023c6c5e3b36c3a63972e35648'


def hata(mesaj):
    print('HATA:', mesaj)
    sys.exit(1)


sid = input('TWILIO_ACCOUNT_SID (AC...): ').strip()
token = getpass.getpass('TWILIO_AUTH_TOKEN (yazarken görünmez): ').strip()
verify = input(f'TWILIO_VERIFY_SERVICE_SID [{VARSAYILAN_VERIFY}]: ').strip() or VARSAYILAN_VERIFY

if not re.fullmatch(r'AC[0-9a-f]{32}', sid):
    hata('Account SID "AC" + 32 karakter olmalı.')
if not re.fullmatch(r'[0-9a-f]{32}', token):
    hata(f'Auth Token 32 karakter (a-f, 0-9) olmalı; girilen {len(token)} karakter. Konsoldan tekrar kopyalayın.')
if not re.fullmatch(r'VA[0-9a-f]{32}', verify):
    hata('Verify Service SID "VA" + 32 karakter olmalı.')

# 1) Mesaj göndermeden kimlik + servis doğrulama (salt-okunur)
kimlik = base64.b64encode(f'{sid}:{token}'.encode()).decode()
req = urllib.request.Request(f'https://verify.twilio.com/v2/Services/{verify}',
                             headers={'Authorization': f'Basic {kimlik}'})
try:
    with urllib.request.urlopen(req, timeout=15) as r:
        servis = json.loads(r.read().decode())
except urllib.error.HTTPError as e:
    hata({401: 'Twilio kimlik doğrulaması başarısız (SID/Token yanlış).',
          404: 'Verify servisi bulunamadı (VA... SID yanlış ya da farklı hesaba ait).'}.get(e.code, f'Twilio HTTP {e.code}'))
except Exception:
    hata('Twilio\'ya ulaşılamadı (ağ).')
print(f'Twilio bilgileri geçerli. Servis: {servis.get("friendly_name")!r}, kod uzunluğu: {servis.get("code_length")}')
if servis.get('code_length') not in (6, None):
    print('UYARI: Servis kod uzunluğu 6 değil; arayüz 6 hane bekliyor.')

# 2) Sunucuya yaz
c = baglan(HOST, USER)
sftp = c.open_sftp()
with sftp.open(ENV_YOLU, 'r') as f:
    icerik = f.read().decode('utf-8')

zaman = time.strftime('%Y%m%d_%H%M%S')
with sftp.open(f'{ENV_YOLU}.bak_{zaman}', 'w') as f:
    f.write(icerik)

anahtarlar = {'TWILIO_ACCOUNT_SID': sid, 'TWILIO_AUTH_TOKEN': token, 'TWILIO_VERIFY_SERVICE_SID': verify}
satirlar = [s for s in icerik.splitlines() if not any(s.startswith(k + '=') for k in anahtarlar)]
satirlar += [f'{k}={v}' for k, v in anahtarlar.items()]
with sftp.open(ENV_YOLU, 'w') as f:
    f.write('\n'.join(satirlar).rstrip('\n') + '\n')
sftp.chmod(ENV_YOLU, 0o600)
sftp.close()
print(f'.env güncellendi (yedek: .env.bak_{zaman}). Değerler ekrana yazılmadı.')

_, o, e = c.exec_command('systemctl restart adausta && sleep 3 && systemctl is-active adausta')
print('Servis:', o.read().decode().strip() or e.read().decode().strip())
c.close()

# 3) Canlı doğrulama
try:
    with urllib.request.urlopen('https://adausta.com/api/telefon-dogrulama/ayarlar', timeout=20) as r:
        d = json.loads(r.read().decode())
    print('Canlı yapilandirildi =', d.get('yapilandirildi'))
except Exception as ex:
    print('Canlı kontrol yapılamadı:', type(ex).__name__)
print('Hazır. Şimdi profilinden SMS/WhatsApp testini yapabilirsin.')
