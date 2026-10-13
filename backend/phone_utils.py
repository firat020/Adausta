"""Telefon numarası normalizasyonu (E.164) ve eşleştirme yardımcıları.

Kural: +90 ASLA otomatik eklenmez. Ülke kodu ya numaranın kendisinde (+.. / 00..) ya da
kullanıcının seçtiği ülkeden gelir. KKTC ve Türkiye ikisi de +90'dır.
"""
import re

# kod: arayüzde seçilen ülke, dial: ülke arama kodu, ad: Türkçe ad
ULKELER = [
    {'kod': 'KKTC', 'ad': 'KKTC', 'dial': '90'},
    {'kod': 'TR', 'ad': 'Türkiye', 'dial': '90'},
    {'kod': 'GB', 'ad': 'Birleşik Krallık', 'dial': '44'},
    {'kod': 'DE', 'ad': 'Almanya', 'dial': '49'},
    {'kod': 'RU', 'ad': 'Rusya', 'dial': '7'},
    {'kod': 'UA', 'ad': 'Ukrayna', 'dial': '380'},
    {'kod': 'AZ', 'ad': 'Azerbaycan', 'dial': '994'},
    {'kod': 'IR', 'ad': 'İran', 'dial': '98'},
    {'kod': 'PK', 'ad': 'Pakistan', 'dial': '92'},
    {'kod': 'IN', 'ad': 'Hindistan', 'dial': '91'},
    {'kod': 'GR', 'ad': 'Yunanistan', 'dial': '30'},
    {'kod': 'CY', 'ad': 'Güney Kıbrıs', 'dial': '357'},
    {'kod': 'NL', 'ad': 'Hollanda', 'dial': '31'},
    {'kod': 'FR', 'ad': 'Fransa', 'dial': '33'},
    {'kod': 'BG', 'ad': 'Bulgaristan', 'dial': '359'},
    {'kod': 'RO', 'ad': 'Romanya', 'dial': '40'},
    {'kod': 'SY', 'ad': 'Suriye', 'dial': '963'},
    {'kod': 'IQ', 'ad': 'Irak', 'dial': '964'},
    {'kod': 'EG', 'ad': 'Mısır', 'dial': '20'},
    {'kod': 'SA', 'ad': 'Suudi Arabistan', 'dial': '966'},
    {'kod': 'AE', 'ad': 'Birleşik Arap Emirlikleri', 'dial': '971'},
    {'kod': 'US', 'ad': 'ABD / Kanada', 'dial': '1'},
]
_ULKE_MAP = {u['kod']: u for u in ULKELER}
_DIALLER = sorted({u['dial'] for u in ULKELER}, key=len, reverse=True)


class TelefonHatasi(ValueError):
    """Kullanıcıya gösterilebilecek Türkçe mesaj taşır."""


def _rakamlar(s) -> str:
    return re.sub(r'\D', '', str(s or ''))


def e164_yap(telefon, ulke=None) -> str:
    """Numarayı E.164'e çevirir (+905331234567). Geçersizse TelefonHatasi fırlatır."""
    ham = re.sub(r'[\s().\-]', '', str(telefon or ''))
    if not ham:
        raise TelefonHatasi('Telefon numarası girin.')

    if ham.startswith('+'):
        tam = _rakamlar(ham)
    elif ham.startswith('00'):
        tam = _rakamlar(ham)[2:]
    else:
        u = _ULKE_MAP.get((ulke or '').upper())
        if not u:
            raise TelefonHatasi('Ülke seçin veya numarayı ülke koduyla (+...) yazın.')
        ulusal = _rakamlar(ham)
        if u['dial'] != '1':
            ulusal = ulusal.lstrip('0') if ulusal.startswith('0') and len(ulusal) > 1 else ulusal
        # Kullanıcı ülke kodunu da yazdıysa (905331234567) tekrar ekleme
        if u['dial'] == '90' and ulusal.startswith('90') and len(ulusal) == 12:
            ulusal = ulusal[2:]
        tam = u['dial'] + ulusal

    if not tam.isdigit() or not (8 <= len(tam) <= 15) or tam.startswith('0'):
        raise TelefonHatasi('Geçerli bir telefon numarası girin.')

    # Türkiye/KKTC: cep telefonu 10 hane ve 5 ile başlar (SMS/WhatsApp için)
    if tam.startswith('90'):
        ulusal = tam[2:]
        if len(ulusal) != 10 or not ulusal.startswith('5'):
            raise TelefonHatasi('Türkiye/KKTC için cep telefonu numarası girin (örn. 533 123 45 67).')
    return '+' + tam


def maskele(e164: str) -> str:
    """Loglara/arayüze güvenli gösterim: +90 ••• ••• ••67."""
    d = _rakamlar(e164)
    if len(d) < 6:
        return '***'
    return '+' + d[:2] + ' ' + '•' * (len(d) - 4) + d[-2:]


def numara_eslesiyor(kayitli_ham, e164) -> bool:
    """Profilde kayıtlı (ham) numara, doğrulanmış E.164 ile aynı numara mı?
    Numara değiştirildiyse False döner (doğrulama kendiliğinden geçersiz olur)."""
    if not kayitli_ham or not e164:
        return False
    cur = _rakamlar(kayitli_ham)
    hedef = _rakamlar(e164)
    if cur.startswith('00'):
        cur = cur[2:]
    if cur == hedef:
        return True
    cur_sifirsiz = cur.lstrip('0')
    if cur_sifirsiz == hedef:
        return True
    for dial in _DIALLER:
        if hedef.startswith(dial) and cur_sifirsiz == hedef[len(dial):]:
            return True
    return False
