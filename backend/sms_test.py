"""SMS ayarlarını tek bir test mesajıyla doğrular.
Kullanım (sunucuda, backend klasöründen):  venv/bin/python sms_test.py 905331234567
Önce .env içinde SMS_PROVIDER + SMS_KULLANICI/SMS_SIFRE (Netgsm) veya TWILIO_* dolu olmalı."""
import sys

from dotenv import load_dotenv

load_dotenv('.env')

from sms import sms_gonder, sms_hazir  # noqa: E402

if len(sys.argv) < 2:
    sys.exit('Kullanım: python sms_test.py <telefon, örn. 905331234567>')
if not sms_hazir():
    sys.exit('SMS ayarları .env içinde eksik (SMS_KULLANICI/SMS_SIFRE veya TWILIO_*).')

ok = sms_gonder(sys.argv[1], 'Ada Usta SMS test mesaji. Bu mesaji aldiysaniz SMS ayarlari calisiyor.')
print('GONDERILDI' if ok else 'BASARISIZ (sağlayıcı hata döndürdü, kimlik/bakiye/başlık kontrol edin)')
