import os
import hashlib
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, redirect, session
from models import db, Odeme, Usta, Abonelik, Plan

odeme_bp = Blueprint('odeme', __name__)

# --- Garanti BBVA Sanal POS Config ---
TERMINAL_ID      = os.environ.get('GARANTI_TERMINAL_ID', '')
MERCHANT_ID      = os.environ.get('GARANTI_MERCHANT_ID', '')
PROV_PASSWORD    = os.environ.get('GARANTI_PROV_PASSWORD', '')
STORE_KEY        = os.environ.get('GARANTI_STORE_KEY', '')
GARANTI_MODE     = os.environ.get('GARANTI_MODE', 'TEST')   # TEST veya PROD

BASE_URL = os.environ.get('SITE_URL', 'https://adausta.com')

GARANTI_3D_URL = (
    'https://3dsecuretest.garanti.com.tr/3dsecure/3DHost.aspx'
    if GARANTI_MODE == 'TEST'
    else 'https://3dsecure.garanti.com.tr/3dsecure/3DHost.aspx'
)

CURRENCY_CODES = {
    'TRY': '949',
    'USD': '840',
    'EUR': '978',
}


def _sha1(text: str) -> str:
    return hashlib.sha1(text.encode('utf-8')).hexdigest().upper()


def _security_data() -> str:
    terminal_9 = str(TERMINAL_ID).zfill(9)
    return _sha1(PROV_PASSWORD.upper() + terminal_9)


def _hash_data(order_id, amount_str, currency_code, success_url, error_url) -> str:
    sec = _security_data()
    raw = (
        TERMINAL_ID +
        order_id +
        amount_str +
        currency_code +
        success_url +
        error_url +
        'sales' +
        '' +          # installment count (tek çekim)
        STORE_KEY +
        sec
    )
    return _sha1(raw)


def _verify_callback_hash(params: dict) -> bool:
    hashparams = params.get('hashparams', '')
    received_hash = params.get('hash', '')
    if not hashparams or not received_hash:
        return False
    parts = [params.get(p, '') for p in hashparams.split(':')]
    raw = ''.join(parts) + STORE_KEY
    return _sha1(raw) == received_hash.upper()


# ---------------------------------------------------------------------------
# POST /api/odeme/baslat
# Body: { usta_id, plan_id, tutar, para_birimi, kart_no, kart_ay, kart_yil,
#         kart_isim, cvv, email, ip }
# Returns: { form_html } — frontend render edip auto-submit eder
# ---------------------------------------------------------------------------
@odeme_bp.route('/baslat', methods=['POST'])
def odeme_baslat():
    data = request.get_json()
    usta_id     = data.get('usta_id')
    plan_id     = data.get('plan_id')
    tutar       = data.get('tutar')
    para_birimi = data.get('para_birimi', 'TRY').upper()
    kart_no     = data.get('kart_no', '').replace(' ', '')
    kart_ay     = str(data.get('kart_ay', '')).zfill(2)
    kart_yil    = str(data.get('kart_yil', ''))[-2:]   # son 2 hane
    kart_isim   = data.get('kart_isim', '')
    cvv         = data.get('cvv', '')
    email       = data.get('email', '')
    ip          = request.remote_addr or data.get('ip', '0.0.0.0')

    if not all([usta_id, tutar, kart_no, kart_ay, kart_yil, kart_isim, cvv]):
        return jsonify({'hata': 'Eksik alan'}), 400

    if para_birimi not in CURRENCY_CODES:
        return jsonify({'hata': 'Geçersiz para birimi'}), 400

    currency_code = CURRENCY_CODES[para_birimi]
    amount_kurus  = str(int(float(tutar) * 100))  # örn 99.90 → "9990"
    order_id      = 'ADA' + uuid.uuid4().hex[:16].upper()

    success_url = f'{BASE_URL}/api/odeme/basarili'
    error_url   = f'{BASE_URL}/api/odeme/hata'

    hash_data = _hash_data(order_id, amount_kurus, currency_code, success_url, error_url)

    # DB'ye bekliyor kaydı
    odeme = Odeme(
        usta_id=usta_id,
        abonelik_id=None,
        tutar=float(tutar),
        para_birimi=para_birimi,
        siparis_no=order_id,
        kart_son4=kart_no[-4:],
        durum='bekliyor',
    )
    db.session.add(odeme)
    db.session.commit()

    # Garanti 3D Secure form HTML
    form_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Ödeme Yönlendiriliyor...</title></head>
<body onload="document.getElementById('gform').submit()">
<p>Güvenli ödeme sayfasına yönlendiriliyorsunuz, lütfen bekleyin...</p>
<form id="gform" method="POST" action="{GARANTI_3D_URL}">
  <input type="hidden" name="mode"                    value="{GARANTI_MODE}">
  <input type="hidden" name="apiversion"              value="v0.01">
  <input type="hidden" name="terminalprovuserid"      value="PROVAUT">
  <input type="hidden" name="terminaluserid"          value="PROVAUT">
  <input type="hidden" name="terminalmerchantid"      value="{MERCHANT_ID}">
  <input type="hidden" name="terminalid"              value="{TERMINAL_ID}">
  <input type="hidden" name="txntype"                 value="sales">
  <input type="hidden" name="txnamount"               value="{amount_kurus}">
  <input type="hidden" name="txncurrencycode"         value="{currency_code}">
  <input type="hidden" name="txninstallmentcount"     value="">
  <input type="hidden" name="orderid"                 value="{order_id}">
  <input type="hidden" name="successurl"              value="{success_url}">
  <input type="hidden" name="errorurl"                value="{error_url}">
  <input type="hidden" name="customeremailaddress"    value="{email}">
  <input type="hidden" name="customeripaddress"       value="{ip}">
  <input type="hidden" name="cardnumber"              value="{kart_no}">
  <input type="hidden" name="cardexpiredatemonth"     value="{kart_ay}">
  <input type="hidden" name="cardexpiredateyear"      value="{kart_yil}">
  <input type="hidden" name="cardholdername"          value="{kart_isim}">
  <input type="hidden" name="cvv2"                    value="{cvv}">
  <input type="hidden" name="secure3dsecuritylevel"   value="3D_PAY">
  <input type="hidden" name="hashdata"                value="{hash_data}">
</form>
</body>
</html>"""

    return jsonify({'form_html': form_html, 'siparis_no': order_id})


# ---------------------------------------------------------------------------
# POST /api/odeme/basarili  — Garanti callback (başarılı 3D)
# ---------------------------------------------------------------------------
@odeme_bp.route('/basarili', methods=['POST'])
def odeme_basarili():
    params = request.form.to_dict()
    order_id  = params.get('orderid', '')
    mdstatus  = params.get('mdstatus', '0')

    odeme = Odeme.query.filter_by(siparis_no=order_id).first()

    if not odeme:
        return redirect(f'{BASE_URL}/odeme-sonuc?durum=hata&sebep=siparis-bulunamadi')

    hash_ok = _verify_callback_hash(params)

    if mdstatus == '1' and hash_ok:
        odeme.durum   = 'basarili'
        odeme.islem_id = params.get('authrnd', '') or params.get('transid', '')
        db.session.commit()
        return redirect(f'{BASE_URL}/odeme-sonuc?durum=basarili&siparis={order_id}')
    else:
        odeme.durum  = 'basarisiz'
        odeme.aciklama = params.get('mderrormessage', '') or f'mdstatus={mdstatus}'
        db.session.commit()
        return redirect(f'{BASE_URL}/odeme-sonuc?durum=hata&sebep={odeme.aciklama}')


# ---------------------------------------------------------------------------
# POST /api/odeme/hata  — Garanti callback (başarısız)
# ---------------------------------------------------------------------------
@odeme_bp.route('/hata', methods=['POST'])
def odeme_hata():
    params   = request.form.to_dict()
    order_id = params.get('orderid', '')

    odeme = Odeme.query.filter_by(siparis_no=order_id).first()
    if odeme:
        odeme.durum    = 'basarisiz'
        odeme.aciklama = params.get('mderrormessage', '') or params.get('errmsg', 'Hata')
        db.session.commit()

    return redirect(f'{BASE_URL}/odeme-sonuc?durum=hata&sebep=islem-basarisiz')


# ---------------------------------------------------------------------------
# POST /api/odeme/havale
# Body: { usta_id, ad_soyad, email, tutar, referans_no }
# ---------------------------------------------------------------------------
@odeme_bp.route('/havale', methods=['POST'])
def havale_bildir():
    data       = request.get_json()
    usta_id    = data.get('usta_id')
    ad_soyad   = data.get('ad_soyad', '').strip()
    email      = data.get('email', '').strip()
    tutar      = data.get('tutar')
    referans   = data.get('referans_no', '').strip()

    if not all([ad_soyad, email, tutar]):
        return jsonify({'hata': 'Ad soyad, e-posta ve tutar zorunlu'}), 400

    order_id = 'HAV' + uuid.uuid4().hex[:16].upper()

    odeme = Odeme(
        usta_id=usta_id or 0,
        tutar=float(tutar),
        para_birimi='TRY',
        siparis_no=order_id,
        durum='bekliyor',
        aciklama=f'Havale — {ad_soyad} | {email} | Ref: {referans or "belirtilmedi"}',
    )
    db.session.add(odeme)
    db.session.commit()

    return jsonify({'mesaj': 'Bildirim alındı', 'siparis_no': order_id}), 201


# ---------------------------------------------------------------------------
# GET /api/odeme/durum/<siparis_no>
# ---------------------------------------------------------------------------
@odeme_bp.route('/durum/<siparis_no>', methods=['GET'])
def odeme_durum(siparis_no):
    odeme = Odeme.query.filter_by(siparis_no=siparis_no).first()
    if not odeme:
        return jsonify({'hata': 'Bulunamadı'}), 404
    return jsonify({
        'siparis_no': odeme.siparis_no,
        'durum': odeme.durum,
        'tutar': odeme.tutar,
        'para_birimi': odeme.para_birimi,
    })
