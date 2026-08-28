import os
import uuid
import requests as _requests
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, session
from models import db, Odeme, Usta, Abonelik, Plan

_kur_cache = {'rate': None, 'zaman': None}

def _usd_try_kur():
    global _kur_cache
    now = datetime.utcnow()
    if _kur_cache['rate'] and _kur_cache['zaman'] and (now - _kur_cache['zaman']) < timedelta(hours=1):
        return _kur_cache['rate']
    try:
        r = _requests.get('https://open.er-api.com/v6/latest/USD', timeout=5)
        rate = r.json()['rates']['TRY']
        _kur_cache = {'rate': round(rate, 2), 'zaman': now}
        return _kur_cache['rate']
    except Exception:
        return _kur_cache['rate'] or 38.0

odeme_bp = Blueprint('odeme', __name__)


# ---------------------------------------------------------------------------
# GET /api/odeme/planlar  — herkese açık, aktif plan listesi (fiyatlar USD)
# ---------------------------------------------------------------------------
@odeme_bp.route('/planlar', methods=['GET'])
def planlar_listele_public():
    planlar = Plan.query.filter_by(aktif=True).order_by(Plan.fiyat).all()
    return jsonify({'planlar': [p.to_dict() for p in planlar]})


# ---------------------------------------------------------------------------
# POST /api/odeme/havale
# Body: { usta_id, ad_soyad, email, tutar, referans_no }
# ---------------------------------------------------------------------------
@odeme_bp.route('/havale', methods=['POST'])
def havale_bildir():
    if not session.get('kullanici_id'):
        return jsonify({'hata': 'Giriş gerekli'}), 401
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
# GET /api/odeme/kur  — USD→TRY anlık kur (1 saatlik cache)
# ---------------------------------------------------------------------------
@odeme_bp.route('/kur', methods=['GET'])
def doviz_kur():
    rate = _usd_try_kur()
    return jsonify({'USD_TRY': rate, 'guncelleme': datetime.utcnow().strftime('%H:%M UTC')})


# ---------------------------------------------------------------------------
# POST /api/odeme/admin/onayla/<id>  — Bekleyen ödemeyi onayla + abonelik aktifleştir
# ---------------------------------------------------------------------------
@odeme_bp.route('/admin/onayla/<int:id>', methods=['POST'])
def admin_odeme_onayla(id):
    from flask import session as s
    if s.get('rol') != 'admin':
        return jsonify({'hata': 'Yetkisiz'}), 403

    odeme = Odeme.query.get_or_404(id)
    if odeme.durum != 'bekliyor':
        return jsonify({'hata': 'Sadece bekleyen ödemeler onaylanabilir'}), 400

    odeme.durum = 'basarili'

    # Abonelik yoksa yeni oluştur, varsa aktifleştir
    usta = Usta.query.get(odeme.usta_id)
    if usta:
        mevcut = Abonelik.query.filter_by(usta_id=usta.id, durum='askida').first()
        if mevcut:
            mevcut.durum = 'aktif'
            mevcut.baslangic = datetime.utcnow()
            ek_gun = mevcut.plan.sure_gun() if mevcut.plan else 30
            mevcut.bitis = datetime.utcnow() + timedelta(days=ek_gun)
            mevcut.yenileme_tarihi = mevcut.bitis
            usta.plan = mevcut.plan.ad if mevcut.plan else 'aylik'
            usta.plan_bitis = mevcut.bitis
            odeme.abonelik_id = mevcut.id
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

    db.session.commit()
    return jsonify({'mesaj': 'Ödeme onaylandı, abonelik aktifleştirildi'})


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
