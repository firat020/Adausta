import os
import urllib.request
import urllib.parse
import urllib.error


def sms_hazir() -> bool:
    """SMS sağlayıcısının kimlik bilgileri .env'de dolu mu? (OTP gibi SMS'e bağımlı akışları
    SMS çalışmıyorken kilitlememek için kullanılır.)"""
    provider = os.environ.get('SMS_PROVIDER', 'netgsm')
    if provider == 'twilio':
        return bool(os.environ.get('TWILIO_ACCOUNT_SID') and os.environ.get('TWILIO_AUTH_TOKEN')
                    and _twilio_from())
    return all(os.environ.get(k) for k in ('SMS_KULLANICI', 'SMS_SIFRE'))


def sms_gonder(telefon: str, mesaj: str) -> bool:
    """
    SMS gönder. Sağlayıcı .env'den okunur (SMS_PROVIDER=netgsm|twilio).
    Döndürür: True = başarılı, False = hata (sessizce geçer, kayıt loglanır).
    """
    provider = os.environ.get('SMS_PROVIDER', 'netgsm')
    try:
        if provider == 'netgsm':
            return _netgsm_gonder(telefon, mesaj)
        elif provider == 'twilio':
            return _twilio_gonder(telefon, mesaj)
    except Exception as e:
        print(f'[SMS] Hata: {e}')
    return False


def _netgsm_gonder(telefon: str, mesaj: str) -> bool:
    kullanici = os.environ.get('SMS_KULLANICI', '')
    sifre = os.environ.get('SMS_SIFRE', '')
    baslik = os.environ.get('SMS_BASLIK', 'AdaUsta')

    if not kullanici or not sifre:
        print('[SMS] Netgsm credentials eksik (SMS_KULLANICI / SMS_SIFRE)')
        return False

    # Telefonu normalize et: +90 → 90, sadece rakam
    tel = telefon.replace('+', '').replace(' ', '').replace('-', '')
    if tel.startswith('00'):
        tel = tel[2:]

    params = urllib.parse.urlencode({
        'usercode': kullanici,
        'password': sifre,
        'gsmno': tel,
        'text': mesaj,
        'msgheader': baslik,
    })
    url = f'https://api.netgsm.com.tr/sms/send/get/?{params}'
    req = urllib.request.urlopen(url, timeout=10)
    yanit = req.read().decode()
    # Netgsm başarı kodları: 00 01 02
    return yanit[:2] in ('00', '01', '02')


def _twilio_from() -> str:
    return os.environ.get('TWILIO_FROM') or os.environ.get('TWILIO_PHONE_NUMBER', '')


def _e164(telefon: str) -> str:
    """Twilio E.164 ister (+90...). KKTC/TR yazımlarını çevirir: 0533..., 533..., 90533..., 0090533..."""
    t = ''.join(ch for ch in str(telefon or '') if ch.isdigit() or ch == '+')
    if t.startswith('+'):
        return t
    t = t.lstrip('+')
    if t.startswith('00'):
        return '+' + t[2:]
    if t.startswith('90') and len(t) >= 12:
        return '+' + t
    if t.startswith('0') and len(t) == 11:
        return '+90' + t[1:]
    if len(t) == 10 and t.startswith('5'):
        return '+90' + t
    return '+' + t


def _twilio_gonder(telefon: str, mesaj: str) -> bool:
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID', '')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN', '')
    from_no = _twilio_from()

    if not account_sid or not auth_token or not from_no:
        print('[SMS] Twilio credentials eksik (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM veya TWILIO_PHONE_NUMBER)')
        return False

    import base64
    data = urllib.parse.urlencode({
        'To': _e164(telefon),
        'From': from_no,
        'Body': mesaj,
    }).encode()
    url = f'https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json'
    creds = base64.b64encode(f'{account_sid}:{auth_token}'.encode()).decode()
    req = urllib.request.Request(url, data=data, headers={'Authorization': f'Basic {creds}'})
    res = urllib.request.urlopen(req, timeout=10)
    return res.status in (200, 201)
