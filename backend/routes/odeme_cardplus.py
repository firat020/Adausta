import base64
import hashlib
import html as _html
import os
import secrets
import uuid
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify, session
from models import db, Odeme, Usta, Abonelik, Plan, MagazaSiparis, MagazaSiparisDurumLog
from routes.odeme import _usd_try_kur

odeme_cardplus_bp = Blueprint('odeme_cardplus', __name__)

# --- CardPlus (Aktifbank / Payten) Sanal POS Config ---
# TEST ve PROD ortamlarinin clientid/storeKey'leri birbirinden farkli
# (Payten destek yaniti, OP-423236, 01.08.2026: TEST magaza numarasi PROD'dan
# ayri, canli numarayla TEST ortamina post edilirse "Merchant bulunamadi" hatasi aliniyor)
CARDPLUS_MODE = os.environ.get('CARDPLUS_MODE', 'TEST')   # TEST veya PROD

CLIENT_ID = (
    os.environ.get('CARDPLUS_CLIENTID_TEST', '')
    if CARDPLUS_MODE == 'TEST'
    else os.environ.get('CARDPLUS_CLIENTID_PROD', '')
)
STORE_KEY = (
    os.environ.get('CARDPLUS_STOREKEY_TEST', '')
    if CARDPLUS_MODE == 'TEST'
    else os.environ.get('CARDPLUS_STOREKEY_PROD', '')
)

GATEWAY_URL = (
    os.environ.get('CARDPLUS_GATEWAY_URL_TEST', '')
    if CARDPLUS_MODE == 'TEST'
    else os.environ.get('CARDPLUS_GATEWAY_URL_PROD', '')
)

# Server-to-server XML API (SafeKey ile 3D'siz otomatik tahsilat için, `est3Dgate` HPP
# adresinden farklı — `/fim/api`, Payten teyidi OP-425363, 11.08.2026).
# API_USERNAME/API_PASSWORD, panelde "EUPHRATES" adıyla oluşturulan API Kullanıcısına ait
# (api_user + Safekey Ön Provizyon + Order Check,PostAuth,Refund rolleri, 12.08.2026).
API_URL = (
    os.environ.get('CARDPLUS_API_URL_TEST', '')
    if CARDPLUS_MODE == 'TEST'
    else os.environ.get('CARDPLUS_API_URL_PROD', '')
)
API_USERNAME = os.environ.get('CARDPLUS_API_USERNAME', '')
API_PASSWORD = os.environ.get('CARDPLUS_API_PASSWORD', '')

BASE_URL = os.environ.get('SITE_URL', 'https://adausta.com')

CURRENCY_CODES = {
    'TRY': '949',
    'USD': '840',
    'EUR': '978',
}

# Payten destek yanıtı (ticket OP-423236, 31.07.2026): bu mdStatus değerleri
# ödemenin Nestpay API tarafından tamamlanmış sayıldığı değerlerdir.
MDSTATUS_BASARILI = {'1', '2', '3', '4', '5', '7', '8'}

# Merchant Safe (otomatik yenileme / SafeKey) — Payten destek yanıtı (OP-425363, 10.08.2026)
# Kart bilgisini biz saklamıyoruz; Payten'in "Merchant Safe" servisi bizim ürettiğimiz
# bu referans değeri kartla eşleştiriyor, sonraki tahsilatlarda sadece bu değer gönderiliyor.
def _safekey_for_usta(usta_id: int) -> str:
    return f'ADAUSTA-USTA-{usta_id}'


def _hash_ver3(params: dict, store_key: str) -> str:
    """CardPlus 'Hash ver3' algoritması: parametreleri isim bazlı (case-insensitive)
    sıralayıp | ile birleştirir, storeKey'i sona ekler, SHA-512 + Base64 alır."""
    keys = sorted(
        (k for k in params if k.lower() not in ('hash', 'encoding')),
        key=lambda k: k.lower(),
    )

    def _escape(v: str) -> str:
        return str(v).replace('\\', '\\\\').replace('|', '\\|')

    hashval = ''.join(_escape(params[k]) + '|' for k in keys) + _escape(store_key)
    return base64.b64encode(hashlib.sha512(hashval.encode('utf-8')).digest()).decode()


def _client_redirect_html(url: str) -> str:
    """Payten entegrasyon güvenlik rehberine göre okurl/failUrl sayfalarında
    sunucu taraflı (3xx) redirect kullanılamıyor (CSP form-action kısıtlaması).
    Bunun yerine tarayıcı taraflı JS ile yönlendirme yapılır."""
    e_url = _html.escape(url)
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Yönlendiriliyor...</title></head>
<body>
<p>Yönlendiriliyorsunuz, lütfen bekleyin... Otomatik geçiş olmazsa <a href="{e_url}">buraya tıklayın</a>.</p>
<script>window.location.replace("{e_url}");</script>
</body>
</html>"""


# ---------------------------------------------------------------------------
# POST /api/odeme/cardplus/baslat
# Body: { usta_id, plan_id }
# Kart bilgisi burada TOPLANMAZ (3D_PAY_HOSTING) — kullanıcı bankanın kendi
# kart giriş sayfasına yönlendirilir.
# Returns: { form_html } — frontend render edip auto-submit eder
# ---------------------------------------------------------------------------
@odeme_cardplus_bp.route('/baslat', methods=['POST'])
def cardplus_baslat():
    if not session.get('kullanici_id'):
        return jsonify({'hata': 'Giriş gerekli'}), 401

    if not CLIENT_ID or not STORE_KEY:
        return jsonify({'hata': 'CardPlus yapılandırması eksik (CLIENTID/STOREKEY)'}), 500
    if not GATEWAY_URL:
        return jsonify({'hata': 'CardPlus gateway adresi henüz tanımlanmadı'}), 500

    data              = request.get_json()
    usta_id           = data.get('usta_id')
    plan_id           = data.get('plan_id')
    otomatik_yenileme = bool(data.get('otomatik_yenileme'))  # "kartımı kaydet, otomatik yenilensin" onay kutusu

    usta = Usta.query.get(usta_id) if usta_id else None
    if not usta:
        return jsonify({'hata': 'Geçersiz usta'}), 400

    plan = Plan.query.get(plan_id) if plan_id else None
    if not plan:
        return jsonify({'hata': 'Geçersiz plan'}), 400

    # Plan fiyatı USD olarak tutulur, tahsilat günlük kur üzerinden TRY yapılır
    tutar_usd = plan.fiyat
    kur       = _usd_try_kur()
    tutar     = round(tutar_usd * kur, 2)

    order_id = 'CPH' + uuid.uuid4().hex[:16].upper()

    odeme = Odeme(
        usta_id=usta_id,
        abonelik_id=None,
        tutar=float(tutar),
        para_birimi='TRY',
        siparis_no=order_id,
        durum='bekliyor',
        aciklama=f'CardPlus (Aktifbank) — ${tutar_usd} x {kur} TRY kuru',
        safekey_talep_edildi=otomatik_yenileme,
    )
    db.session.add(odeme)
    db.session.commit()

    donus_url    = f'{BASE_URL}/api/odeme/cardplus/donus'
    callback_url = f'{BASE_URL}/api/odeme/cardplus/callback'
    bill_to_name = f'{usta.ad} {usta.soyad}'.strip()

    params = {
        'clientid':      CLIENT_ID,
        'amount':        f'{float(tutar):.2f}',
        'okurl':         donus_url,
        'failUrl':       donus_url,
        'TranType':      'Auth',
        'Instalment':    '',
        'callbackUrl':   callback_url,
        'currency':      CURRENCY_CODES['TRY'],
        'oid':           order_id,   # gateway bu değeri callback/donus'ta aynen geri yollar (rnd farklı bir alan — Payten OP-423236)
        'rnd':           secrets.token_hex(16),
        'storetype':     '3D_PAY_HOSTING',
        'hashAlgorithm': 'ver3',
        'lang':          'tr',
        'BillToName':    bill_to_name,
        'BillToCompany': '',
        'refreshtime':   '5',
    }
    if otomatik_yenileme:
        # Merchant Safe (OP-425363): 3D doğrulama + minimum tutar PreAuth ile kart
        # geçerliliği teyit edilip SafeKey eşleştiriliyor, dönüşte MERCHANTSAFEKEY geri geliyor.
        params['MERCHANTSAFEKEY']     = _safekey_for_usta(usta.id)
        params['MERCHANTSAFEAUTHTYPE'] = '3DPAYAUTH'
    params['HASH'] = _hash_ver3(params, STORE_KEY)

    inputs = ''.join(
        f'<input type="hidden" name="{_html.escape(k)}" value="{_html.escape(str(v))}">\n'
        for k, v in params.items()
    )

    form_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Ödeme Yönlendiriliyor...</title></head>
<body onload="document.getElementById('cpform').submit()">
<p>Güvenli ödeme sayfasına yönlendiriliyorsunuz, lütfen bekleyin...</p>
<form id="cpform" method="POST" action="{GATEWAY_URL}">
{inputs}
</form>
</body>
</html>"""

    return jsonify({'form_html': form_html, 'siparis_no': order_id})


# ---------------------------------------------------------------------------
# POST /api/odeme/cardplus/magaza/baslat
# Body: { siparis_no }  — Mağaza (e-ticaret) siparişi için kredi kartı ödemesi.
# Tutar zaten TL olarak siparişte var, kur çevrimi yapılmaz.
# ---------------------------------------------------------------------------
@odeme_cardplus_bp.route('/magaza/baslat', methods=['POST'])
def cardplus_magaza_baslat():
    if not CLIENT_ID or not STORE_KEY:
        return jsonify({'hata': 'CardPlus yapılandırması eksik (CLIENTID/STOREKEY)'}), 500
    if not GATEWAY_URL:
        return jsonify({'hata': 'CardPlus gateway adresi henüz tanımlanmadı'}), 500

    data = request.get_json()
    siparis_no = data.get('siparis_no')

    siparis = MagazaSiparis.query.filter_by(siparis_no=siparis_no).first() if siparis_no else None
    if not siparis:
        return jsonify({'hata': 'Geçersiz sipariş'}), 400
    if siparis.odeme_durumu == 'odendi':
        return jsonify({'hata': 'Bu sipariş zaten ödenmiş'}), 400

    tutar = siparis.genel_toplam_tl

    order_id = 'CPM' + uuid.uuid4().hex[:16].upper()

    odeme = Odeme(
        usta_id=0,
        abonelik_id=None,
        tutar=float(tutar),
        para_birimi='TRY',
        siparis_no=order_id,
        durum='bekliyor',
        aciklama=f'CardPlus (Aktifbank) — Mağaza Siparişi {siparis.siparis_no}',
        payment_source='store_order',
        reference_type='magaza_siparis',
        reference_id=siparis.id,
    )
    db.session.add(odeme)
    db.session.commit()

    donus_url    = f'{BASE_URL}/api/odeme/cardplus/donus'
    callback_url = f'{BASE_URL}/api/odeme/cardplus/callback'
    bill_to_name = f'{siparis.misafir_ad} {siparis.misafir_soyad}'.strip()

    params = {
        'clientid':      CLIENT_ID,
        'amount':        f'{float(tutar):.2f}',
        'okurl':         donus_url,
        'failUrl':       donus_url,
        'TranType':      'Auth',
        'Instalment':    '',
        'callbackUrl':   callback_url,
        'currency':      CURRENCY_CODES['TRY'],
        'oid':           order_id,
        'rnd':           secrets.token_hex(16),
        'storetype':     '3D_PAY_HOSTING',
        'hashAlgorithm': 'ver3',
        'lang':          'tr',
        'BillToName':    bill_to_name,
        'BillToCompany': '',
        'refreshtime':   '5',
    }
    params['HASH'] = _hash_ver3(params, STORE_KEY)

    inputs = ''.join(
        f'<input type="hidden" name="{_html.escape(k)}" value="{_html.escape(str(v))}">\n'
        for k, v in params.items()
    )

    form_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Ödeme Yönlendiriliyor...</title></head>
<body onload="document.getElementById('cpform').submit()">
<p>Güvenli ödeme sayfasına yönlendiriliyorsunuz, lütfen bekleyin...</p>
<form id="cpform" method="POST" action="{GATEWAY_URL}">
{inputs}
</form>
</body>
</html>"""

    return jsonify({'form_html': form_html, 'siparis_no': order_id})


def _bul_ve_dogrula(params: dict):
    """Callback/donus ortak: HASH doğrula + siparis_no ile Odeme kaydını bul."""
    order_id = params.get('oid', '') or params.get('rnd', '')
    odeme = Odeme.query.filter_by(siparis_no=order_id).first()
    if not odeme:
        return None, False

    received_hash = params.get('HASH', '') or params.get('hash', '')
    hash_ok = bool(received_hash) and _hash_ver3(params, STORE_KEY) == received_hash
    return odeme, hash_ok


def _safekey_kaydet(odeme: Odeme, abonelik: Abonelik, params: dict):
    """Ödeme "kartımı kaydet" ile başlatıldıysa ve gateway dönüşünde MERCHANTSAFEKEY
    geri geldiyse (Merchant Safe eşleştirmesi başarılı demek), SafeKey'i kalıcı olarak
    usta'ya kaydeder ve bu abonelik için otomatik yenilemeyi açar. Eşleştirme başarısız
    olursa (alan boş/hata) sessizce atlanır — ödeme yine de geçerlidir, sadece otomatik
    yenileme açılmaz, usta bir sonraki dönemde yine elle ödeme yapar.
    NOT: Gateway'in bu alanı gerçekten dönüp dönmediği/tam adı henüz canlıda doğrulanmadı
    (doküman örneği HPP dönüşünde MERCHANTSAFEKEY'i "aynı gönderildiği gibi" döndürüyor
    diyor) — ilk gerçek test sonrası teyit/düzeltme gerekebilir.
    """
    if not odeme.safekey_talep_edildi:
        return
    usta = Usta.query.get(odeme.usta_id)
    if not usta:
        return
    donen_safekey = params.get('MERCHANTSAFEKEY', params.get('merchantsafekey', ''))
    beklenen_safekey = _safekey_for_usta(usta.id)
    if donen_safekey and donen_safekey == beklenen_safekey:
        usta.cardplus_safekey = beklenen_safekey
        if abonelik:
            abonelik.otomatik_yenileme = True


def _aktiflestir_abonelik(odeme: Odeme, params: dict):
    usta = Usta.query.get(odeme.usta_id)
    if not usta:
        return
    mevcut = Abonelik.query.filter_by(usta_id=usta.id, durum='askida').first()
    if mevcut:
        mevcut.durum = 'aktif'
        mevcut.baslangic = datetime.utcnow()
        mevcut.bitis = datetime.utcnow() + timedelta(days=mevcut.plan.sure_gun() if mevcut.plan else 30)
        mevcut.yenileme_tarihi = mevcut.bitis
        usta.plan = mevcut.plan.ad if mevcut.plan else 'aylik'
        usta.plan_bitis = mevcut.bitis
        odeme.abonelik_id = mevcut.id
        _safekey_kaydet(odeme, mevcut, params)
    else:
        plan = Plan.query.filter_by(aktif=True).first()
        bitis = datetime.utcnow() + timedelta(days=plan.sure_gun() if plan else 30)
        ab = Abonelik(
            usta_id=usta.id,
            plan_id=plan.id if plan else None,
            durum='aktif',
            bitis=bitis,
            yenileme_tarihi=bitis,
        )
        db.session.add(ab)
        db.session.flush()
        odeme.abonelik_id = ab.id
        usta.plan = plan.ad if plan else 'aylik'
        usta.plan_bitis = bitis
        _safekey_kaydet(odeme, ab, params)


def _odeme_basarili_isle(odeme: Odeme, params: dict):
    """Ödeme başarılı olduğunda kaynağına göre ilgili kaydı günceller:
    abonelik ödemesiyse Abonelik aktifleştirilir, mağaza siparişiyse
    MagazaSiparis ödeme durumu güncellenir."""
    if odeme.reference_type == 'magaza_siparis' and odeme.reference_id:
        siparis = MagazaSiparis.query.get(odeme.reference_id)
        if siparis and siparis.odeme_durumu != 'odendi':
            siparis.odeme_durumu = 'odendi'
            siparis.durum = 'hazirlaniyor'
            db.session.add(MagazaSiparisDurumLog(
                siparis_id=siparis.id,
                eski_durum='yeni',
                yeni_durum='hazirlaniyor',
                aciklama='CardPlus ödeme onaylandı',
            ))
    else:
        _aktiflestir_abonelik(odeme, params)


# ---------------------------------------------------------------------------
# POST /api/odeme/cardplus/donus  — okurl + failUrl (kullanıcı tarayıcısı döner)
# NOT: Payten güvenlik rehberine göre burada sunucu taraflı redirect (3xx)
# kullanılamıyor, JS ile client-side yönlendirme yapılıyor.
# ---------------------------------------------------------------------------
@odeme_cardplus_bp.route('/donus', methods=['POST'])
def cardplus_donus():
    params = request.form.to_dict()
    odeme, hash_ok = _bul_ve_dogrula(params)

    if not odeme:
        return _client_redirect_html(f'{BASE_URL}/odeme-sonuc?durum=hata&sebep=siparis-bulunamadi')

    mdstatus = params.get('mdStatus', params.get('mdstatus', ''))
    basarili = hash_ok and mdstatus in MDSTATUS_BASARILI

    if basarili and odeme.durum != 'basarili':
        odeme.durum = 'basarili'
        odeme.provider_transaction_id = params.get('TransId', params.get('transid', ''))
        odeme.paid_at = datetime.utcnow()
        _odeme_basarili_isle(odeme, params)
        db.session.commit()
        return _client_redirect_html(f'{BASE_URL}/odeme-sonuc?durum=basarili&siparis={odeme.siparis_no}')

    if not basarili and odeme.durum == 'bekliyor':
        odeme.durum = 'basarisiz'
        odeme.error_message = params.get('ErrMsg', params.get('errmsg', 'Hash doğrulanamadı' if not hash_ok else 'İşlem reddedildi'))
        db.session.commit()

    return _client_redirect_html(f'{BASE_URL}/odeme-sonuc?durum=hata&siparis={odeme.siparis_no}')


# ---------------------------------------------------------------------------
# POST /api/odeme/cardplus/callback  — sunucu-sunucu bildirim (browser'dan bağımsız)
# ---------------------------------------------------------------------------
@odeme_cardplus_bp.route('/callback', methods=['POST'])
def cardplus_callback():
    params = request.form.to_dict()
    odeme, hash_ok = _bul_ve_dogrula(params)

    if not odeme or not hash_ok:
        return 'FAIL', 400

    mdstatus = params.get('mdStatus', params.get('mdstatus', ''))
    if mdstatus in MDSTATUS_BASARILI and odeme.durum != 'basarili':
        odeme.durum = 'basarili'
        odeme.provider_transaction_id = params.get('TransId', params.get('transid', ''))
        odeme.paid_at = datetime.utcnow()
        _odeme_basarili_isle(odeme, params)
        db.session.commit()
    elif mdstatus not in MDSTATUS_BASARILI and odeme.durum == 'bekliyor':
        odeme.durum = 'basarisiz'
        odeme.error_message = params.get('ErrMsg', params.get('errmsg', ''))
        db.session.commit()

    return 'OK', 200


# ---------------------------------------------------------------------------
# GET /api/odeme/cardplus/durum/<siparis_no>
# ---------------------------------------------------------------------------
@odeme_cardplus_bp.route('/durum/<siparis_no>', methods=['GET'])
def cardplus_durum(siparis_no):
    odeme = Odeme.query.filter_by(siparis_no=siparis_no).first()
    if not odeme:
        return jsonify({'hata': 'Bulunamadı'}), 404
    return jsonify({
        'siparis_no': odeme.siparis_no,
        'durum': odeme.durum,
        'tutar': odeme.tutar,
        'para_birimi': odeme.para_birimi,
    })
