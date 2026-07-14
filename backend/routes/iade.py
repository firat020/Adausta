"""
AdaUsta Marketplace — İade Talepleri
=====================================
Blueprint : iade_bp
Prefix    : /api/iade   (registered in app.py)

Rotalar
-------
POST  /api/iade/olustur                 — Müşteri iade talebi açar (giriş gerektirmez)
GET   /api/iade/sorgula                 — Müşteri kendi siparişinin iadelerini sorgular
PUT   /api/iade/<iid>/satici-cevap      — Satıcı iade talebini yanıtlar
GET   /api/iade/satici/listele          — Satıcı paneli: kendi mağazasına ait iadeler
GET   /api/iade/musteri/listele         — Müşteri: sipariş numarası + doğrulama ile listeler
GET   /api/iade/admin/listele           — Admin: tüm iadeleri listeler (sayfalandırmalı)
PUT   /api/iade/admin/<iid>/karar       — Admin: iade kararını verir
"""

from flask import Blueprint, request, jsonify, session
from models import (
    db,
    ReturnRequest,
    MagazaSiparis,
    MagazaSiparisKalemi,
    SellerOrder,
    MarketplaceStore,
    StoreMember,
    SellerAuditLog,
    Kullanici,
)
from datetime import datetime

iade_bp = Blueprint('iade', __name__)

# ---------------------------------------------------------------------------
# Yardımcı fonksiyonlar
# ---------------------------------------------------------------------------

def satici_store_id():
    """Oturum açmış kullanıcının aktif mağaza üyeliğini döndürür."""
    kid = session.get('kullanici_id')
    if not kid:
        return None
    m = StoreMember.query.filter_by(kullanici_id=kid, aktif=True).first()
    return m.store_id if m else None


def admin_mi():
    """Oturum açmış kullanıcının admin olup olmadığını döndürür."""
    kid = session.get('kullanici_id')
    if not kid:
        return False
    k = Kullanici.query.get(kid)
    return k is not None and k.rol == 'admin'


def _mask_email(email: str) -> str:
    """E-postayı kısmen maskeler: firat@gmail.com  ->  f***@gmail.com"""
    if not email or '@' not in email:
        return email or ''
    local, domain = email.split('@', 1)
    masked_local = (local[0] if local else '') + '***'
    return f"{masked_local}@{domain}"


def _dogrula_siparis(siparis_no: str, telefon: str = '', email: str = ''):
    """
    Sipariş numarası + telefon/e-posta ile sahiplik doğrular.
    Döner: (siparis, hata_mesaji)  — hata_mesaji None ise başarılı.
    """
    if not siparis_no:
        return None, 'Sipariş numarası gereklidir'

    if not telefon and not email:
        return None, 'Telefon veya e-posta gereklidir'

    siparis = MagazaSiparis.query.filter_by(siparis_no=siparis_no.strip()).first()
    if not siparis:
        return None, 'Sipariş bulunamadı'

    matched = False
    if telefon and siparis.misafir_telefon == telefon.strip():
        matched = True
    if email and siparis.misafir_email.strip().lower() == email.strip().lower():
        matched = True

    if not matched:
        return None, 'Sipariş bilgileri doğrulanamadı'

    return siparis, None


def _seller_order_for(siparis_id: int, urun_id=None):
    """
    Verilen sipariş için uygun SellerOrder'ı bulur.
    urun_id verilmişse o ürünün seller_order_id'sini arar.
    """
    if urun_id:
        kalem = MagazaSiparisKalemi.query.filter_by(
            siparis_id=siparis_id, urun_id=urun_id
        ).first()
        if kalem and kalem.seller_order_id:
            return SellerOrder.query.get(kalem.seller_order_id)

    return SellerOrder.query.filter_by(siparis_id=siparis_id).first()


# ---------------------------------------------------------------------------
# 1. POST /api/iade/olustur  — Müşteri iade talebi açar (giriş gerektirmez)
# ---------------------------------------------------------------------------

@iade_bp.route('/olustur', methods=['POST'])
def iade_olustur():
    data        = request.get_json(silent=True) or {}
    siparis_no  = (data.get('siparis_no') or '').strip()
    telefon     = (data.get('telefon') or '').strip()
    email       = (data.get('email') or '').strip()
    urun_id     = data.get('urun_id')          # int veya None
    neden       = (data.get('neden') or '').strip()
    aciklama    = (data.get('aciklama') or '').strip()

    # -- Zorunlu alan: neden (min 10 karakter)
    if not neden or len(neden) < 10:
        return jsonify({'hata': 'İade nedeni en az 10 karakter olmalıdır'}), 400

    # -- Sipariş doğrula
    siparis, hata = _dogrula_siparis(siparis_no, telefon, email)
    if hata:
        return jsonify({'hata': hata}), (404 if 'bulunamadı' in hata else 400)

    # -- Sipariş durumu kontrolü: en azından işleme alınmış olmalı
    IADE_ENGELLEYEN_DURUMLAR = ('yeni', 'bekliyor')
    if siparis.durum in IADE_ENGELLEYEN_DURUMLAR:
        return jsonify({
            'hata': 'Bu siparişin iade talebi oluşturulamaz. '
                    'Siparişin işleme alınmış olması gerekir.'
        }), 422

    # -- İptal edilmiş siparişlerde iade değil iptal prosedürü geçerli
    if siparis.durum == 'iptal':
        return jsonify({'hata': 'İptal edilmiş siparişler için iade talebi açılamaz'}), 422

    # -- Aynı sipariş + ürün için zaten açık iade var mı?
    mevcut_sorgu = ReturnRequest.query.filter_by(siparis_id=siparis.id)
    if urun_id:
        mevcut_sorgu = mevcut_sorgu.filter_by(urun_id=urun_id)
    if mevcut_sorgu.filter(
        ReturnRequest.durum.notin_(['rejected', 'closed'])
    ).first():
        return jsonify({'hata': 'Bu sipariş için zaten açık bir iade talebi bulunmaktadır'}), 409

    # -- İlgili satıcı siparişini bul
    seller_order = _seller_order_for(siparis.id, urun_id)

    iade = ReturnRequest(
        siparis_id      = siparis.id,
        seller_order_id = seller_order.id if seller_order else None,
        store_id        = seller_order.store_id if seller_order else None,
        urun_id         = urun_id,
        siparis_no      = siparis.siparis_no,
        musteri_ad      = f"{siparis.misafir_ad} {siparis.misafir_soyad}".strip(),
        musteri_telefon = siparis.misafir_telefon,
        musteri_email   = siparis.misafir_email,
        neden           = neden,
        aciklama        = aciklama,
        durum           = 'opened',
        olusturma       = datetime.utcnow(),
        guncelleme      = datetime.utcnow(),
    )
    db.session.add(iade)
    db.session.commit()

    return jsonify(iade.to_dict()), 201


# ---------------------------------------------------------------------------
# 2. GET /api/iade/sorgula  — Müşteri siparişine ait iadeleri görür
# ---------------------------------------------------------------------------

@iade_bp.route('/sorgula', methods=['GET'])
def iade_sorgula():
    siparis_no = (request.args.get('siparis_no') or '').strip()
    telefon    = (request.args.get('telefon') or '').strip()
    email      = (request.args.get('email') or '').strip()

    siparis, hata = _dogrula_siparis(siparis_no, telefon, email)
    if hata:
        return jsonify({'hata': hata}), (404 if 'bulunamadı' in hata else 400)

    iadeler = ReturnRequest.query.filter_by(siparis_id=siparis.id) \
        .order_by(ReturnRequest.olusturma.desc()).all()

    sonuc = []
    for i in iadeler:
        d = i.to_dict()
        # Müşteri e-postasını kısmen maskele (gizlilik)
        d['musteri_email'] = _mask_email(d.get('musteri_email', ''))
        sonuc.append(d)

    return jsonify({'iadeler': sonuc, 'toplam': len(sonuc)}), 200


# ---------------------------------------------------------------------------
# 4. PUT /api/iade/<iid>/satici-cevap  — Satıcı iade talebini yanıtlar
# ---------------------------------------------------------------------------

@iade_bp.route('/<int:iid>/satici-cevap', methods=['PUT'])
def satici_cevap(iid: int):
    sid = satici_store_id()
    if not sid:
        return jsonify({'hata': 'Bu işlem için satıcı girişi gereklidir'}), 401

    iade = ReturnRequest.query.get(iid)
    if not iade:
        return jsonify({'hata': 'İade talebi bulunamadı'}), 404

    # Satıcı yalnızca kendi mağazasına ait iadelere cevap verebilir
    if iade.store_id != sid:
        return jsonify({'hata': 'Bu iade talebine erişim yetkiniz yok'}), 403

    # Zaten sonuçlandırılmış iadelere cevap verilemez
    if iade.durum in ('approved', 'rejected', 'closed'):
        return jsonify({'hata': 'Bu iade talebi zaten sonuçlandırılmış'}), 422

    data         = request.get_json(silent=True) or {}
    satici_cevab = (data.get('satici_cevabi') or '').strip()
    oneri        = (data.get('oneri_durum') or '').strip()

    if not satici_cevab:
        return jsonify({'hata': 'Satıcı cevabı gereklidir'}), 400

    GECERLI_ONERILER = ('approve', 'reject', 'replacement')
    if oneri and oneri not in GECERLI_ONERILER:
        return jsonify({
            'hata': f"Geçersiz oneri_durum. Kabul edilen değerler: {', '.join(GECERLI_ONERILER)}"
        }), 400

    iade.satici_cevabi = satici_cevab
    iade.oneri_durum   = oneri

    if oneri == 'approve':
        iade.durum = 'approved'
    elif oneri == 'reject':
        # Satıcı reddetmiş, admin arabuluculuk yapacak
        iade.durum = 'seller_review'
    # 'replacement' için durum değişmez; süreç devam eder

    iade.guncelleme = datetime.utcnow()
    db.session.commit()

    return jsonify(iade.to_dict()), 200


# ---------------------------------------------------------------------------
# 7. GET /api/iade/satici/listele  — Satıcı kendi mağazasının iadelerini listeler
# ---------------------------------------------------------------------------

@iade_bp.route('/satici/listele', methods=['GET'])
def satici_iade_listele():
    sid = satici_store_id()
    if not sid:
        return jsonify({'hata': 'Bu işlem için satıcı girişi gereklidir'}), 401

    durum_filtre = request.args.get('durum', '').strip() or None
    sayfa        = max(int(request.args.get('sayfa', 1) or 1), 1)
    sayfa_boyutu = 20

    sorgu = ReturnRequest.query.filter_by(store_id=sid)
    if durum_filtre:
        sorgu = sorgu.filter_by(durum=durum_filtre)

    sorgu    = sorgu.order_by(ReturnRequest.olusturma.desc())
    toplam   = sorgu.count()
    iadeler  = sorgu.offset((sayfa - 1) * sayfa_boyutu).limit(sayfa_boyutu).all()

    return jsonify({
        'iadeler':    [i.to_dict() for i in iadeler],
        'toplam':     toplam,
        'sayfa':      sayfa,
        'toplam_sayfa': max(1, (toplam + sayfa_boyutu - 1) // sayfa_boyutu),
    }), 200


# ---------------------------------------------------------------------------
# 8. GET /api/iade/musteri/listele  — Müşteri sipariş no + doğrulama ile listeler
# ---------------------------------------------------------------------------

@iade_bp.route('/musteri/listele', methods=['GET'])
def musteri_iade_listele():
    siparis_no = (request.args.get('siparis_no') or '').strip()
    telefon    = (request.args.get('telefon') or '').strip()
    email      = (request.args.get('email') or '').strip()

    siparis, hata = _dogrula_siparis(siparis_no, telefon, email)
    if hata:
        return jsonify({'hata': hata}), (404 if 'bulunamadı' in hata else 400)

    iadeler = ReturnRequest.query.filter_by(siparis_id=siparis.id) \
        .order_by(ReturnRequest.olusturma.desc()).all()

    sonuc = []
    for i in iadeler:
        d = i.to_dict()
        d['musteri_email'] = _mask_email(d.get('musteri_email', ''))
        # Müşteri görünümünde admin notunu gizle
        d.pop('admin_notu', None)
        sonuc.append(d)

    return jsonify({'iadeler': sonuc, 'toplam': len(sonuc)}), 200


# ---------------------------------------------------------------------------
# 5. GET /api/iade/admin/listele  — Admin tüm iadeleri görür
# ---------------------------------------------------------------------------

@iade_bp.route('/admin/listele', methods=['GET'])
def admin_iade_listele():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz erişim'}), 403

    durum_filtre = request.args.get('durum', '').strip() or None
    sayfa        = max(int(request.args.get('sayfa', 1) or 1), 1)
    sayfa_boyutu = 25
    store_filtre = request.args.get('store_id', '').strip() or None

    sorgu = ReturnRequest.query
    if durum_filtre:
        sorgu = sorgu.filter_by(durum=durum_filtre)
    if store_filtre:
        sorgu = sorgu.filter_by(store_id=int(store_filtre))

    sorgu        = sorgu.order_by(ReturnRequest.olusturma.desc())
    toplam       = sorgu.count()
    iadeler      = sorgu.offset((sayfa - 1) * sayfa_boyutu).limit(sayfa_boyutu).all()

    return jsonify({
        'iadeler':      [i.to_dict() for i in iadeler],
        'toplam':       toplam,
        'sayfa':        sayfa,
        'toplam_sayfa': max(1, (toplam + sayfa_boyutu - 1) // sayfa_boyutu),
    }), 200


# ---------------------------------------------------------------------------
# 6. PUT /api/iade/admin/<iid>/karar  — Admin iade kararını verir
# ---------------------------------------------------------------------------

@iade_bp.route('/admin/<int:iid>/karar', methods=['PUT'])
def admin_iade_karar(iid: int):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz erişim'}), 403

    iade = ReturnRequest.query.get(iid)
    if not iade:
        return jsonify({'hata': 'İade talebi bulunamadı'}), 404

    if iade.durum in ('approved', 'rejected', 'closed'):
        return jsonify({'hata': 'Bu iade talebi zaten sonuçlandırılmış'}), 422

    data           = request.get_json(silent=True) or {}
    karar          = (data.get('karar') or '').strip()
    admin_notu_val = (data.get('admin_notu') or '').strip()
    iade_tutari    = data.get('iade_tutari_tl')

    GECERLI_KARARLAR = ('approved', 'rejected')
    if karar not in GECERLI_KARARLAR:
        return jsonify({
            'hata': f"Geçersiz karar. Kabul edilen değerler: {', '.join(GECERLI_KARARLAR)}"
        }), 400

    if karar == 'approved' and iade_tutari is None:
        return jsonify({'hata': 'Onay kararı için iade_tutari_tl gereklidir'}), 400

    iade.durum      = karar
    iade.admin_notu = admin_notu_val
    if karar == 'approved':
        try:
            iade.iade_tutari_tl = float(iade_tutari)
        except (TypeError, ValueError):
            return jsonify({'hata': 'Geçersiz iade_tutari_tl değeri'}), 400

    iade.guncelleme = datetime.utcnow()

    # Denetim günlüğüne kaydet
    kid = session.get('kullanici_id')
    log = SellerAuditLog(
        store_id = iade.store_id,
        yapan_id = kid,
        islem    = f'iade_{karar}',
        detay    = (
            f"İade #{iade.id} | Sipariş: {iade.siparis_no} | "
            f"Karar: {karar}"
            + (f" | Tutar: {iade.iade_tutari_tl} TL" if karar == 'approved' else '')
            + (f" | Not: {admin_notu_val}" if admin_notu_val else '')
        ),
        ip       = request.remote_addr or '',
        tarih    = datetime.utcnow(),
    )
    db.session.add(log)
    db.session.commit()

    return jsonify(iade.to_dict()), 200
