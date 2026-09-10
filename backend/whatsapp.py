import os
import urllib.request
import urllib.parse


def admin_whatsapp_gonder(mesaj: str) -> bool:
    """
    Admin panelinde önemli bir hareket olduğunda (yeni kayıt, yeni ödeme vb.)
    sahibin kendi WhatsApp numarasına bildirim gönderir.

    CallMeBot (callmebot.com) ücretsiz kişisel-bildirim API'si kullanılır —
    Meta'nın resmi WhatsApp Business API'si değildir, bu yüzden:
      - Kurulumu saniyeler sürer (Business hesabı onayı beklemez)
      - Tamamen ücretsizdir
      - Tek seferlik kurulum gerektirir: ADMIN_WHATSAPP_NUMBER numarasından
        +34 644 59 71 07 (CallMeBot) numarasına "I allow callmebot to send
        me messages" yazılır, dönen apikey ADMIN_WHATSAPP_NUMBER ve
        CALLMEBOT_APIKEY olarak .env'e eklenir.

    .env'de ADMIN_WHATSAPP_NUMBER / CALLMEBOT_APIKEY tanımlı değilse
    sessizce hiçbir şey yapmaz (bildirim sistemi zorunlu değildir).
    """
    numara = os.environ.get('ADMIN_WHATSAPP_NUMBER', '')
    apikey = os.environ.get('CALLMEBOT_APIKEY', '')
    if not numara or not apikey:
        return False
    try:
        params = urllib.parse.urlencode({'phone': numara, 'text': mesaj, 'apikey': apikey})
        url = f'https://api.callmebot.com/whatsapp.php?{params}'
        urllib.request.urlopen(url, timeout=10)
        return True
    except Exception as e:
        print(f'[WhatsApp] Admin bildirimi gönderilemedi: {e}')
        return False
