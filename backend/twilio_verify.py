"""Twilio Verify v2 istemcisi (SMS + WhatsApp telefon doğrulaması).

- Kodları Twilio üretir ve doğrular; bizde kod üretimi/saklaması yoktur.
- Kimlik bilgileri yalnızca ortam değişkenlerinden okunur:
  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID
- Verify SMS için satın alınmış bir 'From' numarası kullanılmaz/zorunlu tutulmaz.
- Token, telefon numarası ve kod ASLA loglanmaz.
Normal SMS/bildirim gönderimi (sms.py) bu modülden bağımsızdır.
"""
import base64
import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request

log = logging.getLogger(__name__)

VERIFY_BASE = 'https://verify.twilio.com/v2/Services'
KANALLAR = ('sms', 'whatsapp')
GEREKLI_DEGISKENLER = ('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_VERIFY_SERVICE_SID')
ZAMAN_ASIMI_SN = 15


class VerifyYapilandirmaHatasi(Exception):
    def __init__(self, eksik):
        super().__init__('Twilio Verify yapılandırması eksik: ' + ', '.join(eksik))
        self.eksik = list(eksik)


class VerifyHatasi(Exception):
    """Twilio isteği başarısız. kod: Twilio hata kodu (varsa), http: HTTP durumu (0 = ağ hatası)."""
    def __init__(self, http=0, kod=None):
        super().__init__(f'Twilio Verify hatası (http={http}, kod={kod})')
        self.http = http
        self.kod = kod


def eksik_degiskenler():
    return [k for k in GEREKLI_DEGISKENLER if not os.environ.get(k)]


def yapilandirildi() -> bool:
    return not eksik_degiskenler()


def _istek(yol: str, alanlar: dict) -> dict:
    eksik = eksik_degiskenler()
    if eksik:
        raise VerifyYapilandirmaHatasi(eksik)
    sid = os.environ['TWILIO_ACCOUNT_SID']
    token = os.environ['TWILIO_AUTH_TOKEN']
    servis = os.environ['TWILIO_VERIFY_SERVICE_SID']

    url = f'{VERIFY_BASE}/{servis}/{yol}'
    govde = urllib.parse.urlencode(alanlar).encode()
    kimlik = base64.b64encode(f'{sid}:{token}'.encode()).decode()
    req = urllib.request.Request(url, data=govde, method='POST', headers={
        'Authorization': f'Basic {kimlik}',
        'Content-Type': 'application/x-www-form-urlencoded',
    })
    try:
        with urllib.request.urlopen(req, timeout=ZAMAN_ASIMI_SN) as res:
            return json.loads(res.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        kod = None
        try:
            kod = json.loads(e.read().decode() or '{}').get('code')
        except Exception:
            pass
        raise VerifyHatasi(http=e.code, kod=kod) from None  # telefon/token içeren yanıt gövdesini taşıma
    except (urllib.error.URLError, TimeoutError, OSError):
        raise VerifyHatasi(http=0, kod=None) from None


def kod_gonder(e164: str, kanal: str, locale: str = 'tr') -> str:
    """Doğrulama kodu gönderir. Döndürür: Twilio 'status' (normalde 'pending')."""
    if kanal not in KANALLAR:
        raise ValueError('Geçersiz kanal')
    yanit = _istek('Verifications', {'To': e164, 'Channel': kanal, 'Locale': locale})
    return str(yanit.get('status') or '')


def kod_kontrol(e164: str, kod: str) -> str:
    """Kodu Twilio'ya sorar. Döndürür: Twilio 'status'. Yalnızca 'approved' başarıdır."""
    yanit = _istek('VerificationCheck', {'To': e164, 'Code': kod})
    return str(yanit.get('status') or '')
