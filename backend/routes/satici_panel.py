from flask import Blueprint, request, jsonify, session
from models import (
    db, Kullanici, MarketplaceStore, StoreMember, SellerBalance,
    SellerAuditLog, SellerHakedis, Urun, UrunGorsel, MagazaSiparis,
    MagazaSiparisKalemi, MagazaSiparisDurumLog, SellerApplication,
)
from datetime import datetime, timedelta
import os
import uuid
from werkzeug.utils import secure_filename

satici_panel_bp = Blueprint('satici_panel', __name__)

ALLOWED = {'png', 'jpg', 'jpeg', 'webp'}

# ──────────────────────────────────────────────────────────────
# Auth helper
# ──────────────────────────────────────────────────────────────

def satici_bilgi_al():
    """Returns (kullanici_id, store_member, store) or (None, None, None) if not authorized seller."""
    kid = session.get('kullanici_id')
    if not kid:
        return None, None, None
    member = StoreMember.query.filter_by(kullanici_id=kid, aktif=True).first()
    if not member:
        return None, None, None
    store = MarketplaceStore.query.filter_by(
        id=member.store_id, aktif=True, askida=False
    ).first()
    if not store:
        return None, None, None
    return kid, member, store


def _auth_error():
    """Return correct 401/403 based on whether the user is logged in at all."""
    return (401, 'Giriş gerekli') if not session.get('kullanici_id') else (403, 'Satıcı yetkisi yok')


# ──────────────────────────────────────────────────────────────
# Price helper (mirrors magaza.py)
# ──────────────────────────────────────────────────────────────

def _hesapla_tl(usd, kur, marj, kargo, kdv_dahil):
    base = usd * kur
    ara = base + base * (marj / 100) + kargo
    return round(ara * 1.20 if kdv_dahil else ara, 2)


# ──────────────────────────────────────────────────────────────
# 1. GET /ben — who am I as a seller?
# ──────────────────────────────────────────────────────────────

@satici_panel_bp.route('/ben', methods=['GET'])
def ben():
    kid = session.get('kullanici_id')
    if not kid:
        return jsonify({'hata': 'Giriş gerekli'}), 401
    member = StoreMember.query.filter_by(kullanici_id=kid, aktif=True).first()
    if not member:
        return jsonify({'hata': 'Satıcı yetkisi yok'}), 403
    store = MarketplaceStore.query.filter_by(
        id=member.store_id, aktif=True, askida=False
    ).first()
    if not store:
        return jsonify({'hata': 'Aktif mağaza bulunamadı'}), 403
    k = Kullanici.query.get(kid)
    return jsonify({
        'kullanici_id': kid,
        'email': k.email if k else '',
        'magaza': store.to_dict(public=False),
        'rol': member.rol,
    })


# ──────────────────────────────────────────────────────────────
# 2. GET /dashboard
# ──────────────────────────────────────────────────────────────

@satici_panel_bp.route('/dashboard', methods=['GET'])
def dashboard():
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code

    urun_sayisi = Urun.query.filter_by(store_id=store.id, aktif=True).count()

    # Subquery: siparis ids that contain at least one product from this store
    siparis_id_sq = (
        db.session.query(MagazaSiparisKalemi.siparis_id)
        .join(Urun, MagazaSiparisKalemi.urun_id == Urun.id)
        .filter(Urun.store_id == store.id)
        .distinct()
    )

    bekleyen_siparis = MagazaSiparis.query.filter(
        MagazaSiparis.id.in_(siparis_id_sq),
        MagazaSiparis.durum == 'yeni',
    ).count()

    son_siparisler = (
        MagazaSiparis.query
        .filter(MagazaSiparis.id.in_(siparis_id_sq))
        .order_by(MagazaSiparis.olusturma.desc())
        .limit(5)
        .all()
    )

    bakiye = SellerBalance.query.filter_by(store_id=store.id).first()

    return jsonify({
        'magaza': store.to_dict(public=False),
        'urun_sayisi': urun_sayisi,
        'bekleyen_siparis': bekleyen_siparis,
        'bakiye': bakiye.to_dict() if bakiye else None,
        'son_siparisler': [s.to_dict() for s in son_siparisler],
    })


# ──────────────────────────────────────────────────────────────
# 3. GET /urunler — paginated product list
# ──────────────────────────────────────────────────────────────

@satici_panel_bp.route('/urunler', methods=['GET'])
def urunler_listele():
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code

    arama = request.args.get('arama', '')
    urun_durum = request.args.get('urun_durum', '')
    sayfa = request.args.get('sayfa', 1, type=int)
    limit = 20

    q = Urun.query.filter_by(store_id=store.id)
    if arama:
        q = q.filter(Urun.ad.ilike(f'%{arama}%'))
    if urun_durum:
        q = q.filter(Urun.urun_durum == urun_durum)

    total = q.count()
    urunler = q.order_by(Urun.olusturma.desc()).offset((sayfa - 1) * limit).limit(limit).all()

    return jsonify({
        'urunler': [u.to_dict(include_gorseller=True) for u in urunler],
        'total': total,
        'sayfa': sayfa,
        'sayfa_sayisi': (total + limit - 1) // limit,
    })


# ──────────────────────────────────────────────────────────────
# 4. POST /urun — create product (goes to pending_review)
# ──────────────────────────────────────────────────────────────

@satici_panel_bp.route('/urun', methods=['POST'])
def urun_olustur():
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code
    if member.rol not in ('sahip', 'yonetici', 'urun_yetkilisi'):
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403

    data = request.get_json() or {}
    ad = (data.get('ad') or '').strip()
    usd = float(data.get('usd_fiyat') or 0)
    kur = float(data.get('kur') or 0)
    if not ad or not usd or not kur:
        return jsonify({'hata': 'Ad, usd_fiyat ve kur zorunlu'}), 400

    marj = float(data['kar_marji']) if data.get('kar_marji') is not None else 25.0
    kargo = float(data.get('kargo_ucreti') or 0)
    kdv_dahil = bool(data.get('kdv_dahil', True))
    tl = _hesapla_tl(usd, kur, marj, kargo, kdv_dahil)

    u = Urun(
        ad=ad,
        aciklama=data.get('aciklama', ''),
        usd_fiyat=usd,
        kur=kur,
        kar_marji=marj,
        kargo_ucreti=kargo,
        kdv_dahil=kdv_dahil,
        tl_fiyat=tl,
        sku=data.get('sku', ''),
        barkod=data.get('barkod', ''),
        stok=int(data.get('stok') or 0),
        aktif=True,
        marka_id=data.get('marka_id'),
        model_id=data.get('model_id'),
        kategori=data.get('kategori', ''),
        store_id=store.id,
        urun_durum='active',
    )
    db.session.add(u)
    db.session.commit()
    return jsonify(u.to_dict()), 201


# ──────────────────────────────────────────────────────────────
# 5. PUT /urun/<uid> — update product
# ──────────────────────────────────────────────────────────────

@satici_panel_bp.route('/urun/<int:uid>', methods=['PUT'])
def urun_guncelle(uid):
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code
    if member.rol not in ('sahip', 'yonetici', 'urun_yetkilisi'):
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403

    u = Urun.query.filter_by(id=uid, store_id=store.id).first_or_404()
    data = request.get_json() or {}
    significant_change = False

    # Non-significant text fields
    for field in ('aciklama', 'sku', 'barkod', 'kategori'):
        if field in data:
            setattr(u, field, data[field])

    # Significant: product name
    if 'ad' in data:
        if data['ad'] != u.ad:
            significant_change = True
        u.ad = data['ad']

    # Significant: pricing fields
    for field in ('usd_fiyat', 'kur', 'kar_marji', 'kargo_ucreti'):
        if field in data:
            new_val = float(data[field])
            if getattr(u, field) != new_val:
                significant_change = True
            setattr(u, field, new_val)

    if 'kdv_dahil' in data:
        u.kdv_dahil = bool(data['kdv_dahil'])
    if 'stok' in data:
        u.stok = int(data['stok'])
    if 'marka_id' in data:
        u.marka_id = data['marka_id']
    if 'model_id' in data:
        u.model_id = data['model_id']

    u.tl_fiyat = _hesapla_tl(u.usd_fiyat, u.kur, u.kar_marji, u.kargo_ucreti, u.kdv_dahil)

    u.guncelleme = datetime.utcnow()
    db.session.commit()
    return jsonify(u.to_dict())


# ──────────────────────────────────────────────────────────────
# 6. DELETE /urun/<uid> — soft delete
# ──────────────────────────────────────────────────────────────

@satici_panel_bp.route('/urun/<int:uid>', methods=['DELETE'])
def urun_sil(uid):
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code
    if member.rol not in ('sahip', 'yonetici', 'urun_yetkilisi'):
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403

    u = Urun.query.filter_by(id=uid, store_id=store.id).first_or_404()
    u.aktif = False
    db.session.commit()
    return jsonify({'ok': True})


# ──────────────────────────────────────────────────────────────
# 7. POST /urun/<uid>/gorsel — upload product image
# ──────────────────────────────────────────────────────────────

@satici_panel_bp.route('/urun/<int:uid>/gorsel', methods=['POST'])
def gorsel_yukle(uid):
    from flask import current_app
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code
    if member.rol not in ('sahip', 'yonetici', 'urun_yetkilisi'):
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403

    u = Urun.query.filter_by(id=uid, store_id=store.id).first_or_404()

    if 'gorsel' not in request.files:
        return jsonify({'hata': 'Dosya yok'}), 400
    f = request.files['gorsel']
    if '.' not in f.filename:
        return jsonify({'hata': 'Geçersiz dosya adı'}), 400
    ext = f.filename.rsplit('.', 1)[-1].lower()
    if ext not in ALLOWED:
        return jsonify({'hata': 'Desteklenmeyen format'}), 400

    dosya_adi = f'urun_{uid}_{uuid.uuid4().hex[:8]}.{ext}'
    klasor = os.path.join(current_app.config['UPLOAD_FOLDER'], 'urunler')
    os.makedirs(klasor, exist_ok=True)
    f.save(os.path.join(klasor, dosya_adi))

    sira = UrunGorsel.query.filter_by(urun_id=uid).count()
    g = UrunGorsel(urun_id=uid, dosya_yolu=f'urunler/{dosya_adi}', sira=sira)
    db.session.add(g)
    db.session.commit()
    return jsonify({'yol': g.dosya_yolu, 'id': g.id}), 201


# ──────────────────────────────────────────────────────────────
# Helper: subquery — siparis ids containing this store's products
# ──────────────────────────────────────────────────────────────

def _siparis_id_subquery(store_id):
    return (
        db.session.query(MagazaSiparisKalemi.siparis_id)
        .join(Urun, MagazaSiparisKalemi.urun_id == Urun.id)
        .filter(Urun.store_id == store_id)
        .distinct()
    )


# ──────────────────────────────────────────────────────────────
# 8. GET /siparisler — paginated orders list
# ──────────────────────────────────────────────────────────────

@satici_panel_bp.route('/siparisler', methods=['GET'])
def siparisler_listele():
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code

    durum = request.args.get('durum', '')
    sayfa = request.args.get('sayfa', 1, type=int)
    limit = 20

    q = MagazaSiparis.query.filter(
        MagazaSiparis.id.in_(_siparis_id_subquery(store.id))
    )
    if durum:
        q = q.filter(MagazaSiparis.durum == durum)

    total = q.count()
    siparis_list = (
        q.order_by(MagazaSiparis.olusturma.desc())
        .offset((sayfa - 1) * limit)
        .limit(limit)
        .all()
    )

    return jsonify({
        'siparisler': [s.to_dict() for s in siparis_list],
        'total': total,
        'sayfa': sayfa,
        'sayfa_sayisi': (total + limit - 1) // limit,
    })


# ──────────────────────────────────────────────────────────────
# 9. GET /siparis/<sid> — order detail (seller's kalemler only)
# ──────────────────────────────────────────────────────────────

@satici_panel_bp.route('/siparis/<int:sid>', methods=['GET'])
def siparis_detay(sid):
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code

    siparis = MagazaSiparis.query.get_or_404(sid)

    seller_kalemler = [
        k for k in siparis.kalemler
        if k.urun and k.urun.store_id == store.id
    ]
    if not seller_kalemler:
        return jsonify({'hata': 'Bu siparişe erişim yetkiniz yok'}), 403

    d = siparis.to_dict()
    d['kalemler'] = [k.to_dict() for k in seller_kalemler]
    d['durum_gecmisi'] = [
        g.to_dict()
        for g in sorted(siparis.durum_gecmisi, key=lambda x: x.tarih)
    ]
    return jsonify(d)


# ──────────────────────────────────────────────────────────────
# 10. PUT /siparis/<sid>/durum — update order status (limited)
# ──────────────────────────────────────────────────────────────

SATICI_IZIN_DURUM = ('hazirlaniyor', 'kargoda', 'teslim_edildi', 'iptal')


@satici_panel_bp.route('/siparis/<int:sid>/durum', methods=['PUT'])
def siparis_durum_guncelle(sid):
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code

    siparis = MagazaSiparis.query.get_or_404(sid)

    seller_kalemler = [
        k for k in siparis.kalemler
        if k.urun and k.urun.store_id == store.id
    ]
    if not seller_kalemler:
        return jsonify({'hata': 'Bu siparişe erişim yetkiniz yok'}), 403

    data = request.get_json() or {}
    yeni_durum = data.get('durum', '')
    aciklama = data.get('aciklama', '')

    if yeni_durum not in SATICI_IZIN_DURUM:
        return jsonify({
            'hata': f'Geçersiz durum. İzin verilenler: {", ".join(SATICI_IZIN_DURUM)}'
        }), 400

    # odeme_durumu cannot be changed by seller — it is not touched here

    if yeni_durum != siparis.durum:
        log = MagazaSiparisDurumLog(
            siparis_id=siparis.id,
            eski_durum=siparis.durum,
            yeni_durum=yeni_durum,
            aciklama=aciklama,
            admin_id=kid,
        )
        db.session.add(log)
        siparis.durum = yeni_durum
        siparis.guncelleme = datetime.utcnow()

        if yeni_durum == 'teslim_edildi':
            existing = SellerHakedis.query.filter_by(
                siparis_id=siparis.id, store_id=store.id
            ).first()
            if not existing:
                brut = round(sum(k.toplam_tl for k in seller_kalemler), 2)
                komisyon_oran = getattr(store, 'komisyon_orani', None) or 15.0
                komisyon = round(brut * komisyon_oran / 100, 2)
                net = round(brut - komisyon, 2)
                now = datetime.utcnow()
                hakedis = SellerHakedis(
                    store_id=store.id,
                    siparis_id=siparis.id,
                    siparis_no=siparis.siparis_no,
                    brut_tl=brut,
                    komisyon_tl=komisyon,
                    net_tl=net,
                    durum='bekliyor',
                    teslim_tarihi=now,
                    kullanilabilir_tarih=now + timedelta(days=14),
                )
                db.session.add(hakedis)
                bakiye = SellerBalance.query.filter_by(store_id=store.id).first()
                if bakiye:
                    bakiye.bekleyen_tl = round(bakiye.bekleyen_tl + net, 2)
                    bakiye.guncelleme = now

    db.session.commit()

    d = siparis.to_dict()
    d['kalemler'] = [k.to_dict() for k in seller_kalemler]
    d['durum_gecmisi'] = [
        g.to_dict()
        for g in sorted(siparis.durum_gecmisi, key=lambda x: x.tarih)
    ]
    return jsonify(d)


# ──────────────────────────────────────────────────────────────
# 11. GET /bakiye — seller balance
# ──────────────────────────────────────────────────────────────

@satici_panel_bp.route('/bakiye', methods=['GET'])
def bakiye_getir():
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code

    b = SellerBalance.query.filter_by(store_id=store.id).first()
    if not b:
        return jsonify({
            'store_id': store.id,
            'bekleyen_tl': 0.0,
            'kullanilabilir_tl': 0.0,
            'odenmis_tl': 0.0,
            'guncelleme': None,
        })
    return jsonify(b.to_dict())


# ──────────────────────────────────────────────────────────────
# 12. GET /personel — list store members (sahip / yonetici only)
# ──────────────────────────────────────────────────────────────

@satici_panel_bp.route('/personel', methods=['GET'])
def personel_listele():
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code
    if member.rol not in ('sahip', 'yonetici'):
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403

    uyeler = StoreMember.query.filter_by(store_id=store.id).all()
    return jsonify({'personel': [u.to_dict() for u in uyeler]})


# ──────────────────────────────────────────────────────────────
# 13. POST /personel — add store member
# ──────────────────────────────────────────────────────────────

GECERLI_ROLLER = ('sahip', 'yonetici', 'urun_yetkilisi', 'muhasebe')


@satici_panel_bp.route('/personel', methods=['POST'])
def personel_ekle():
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code
    if member.rol not in ('sahip', 'yonetici'):
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403

    data = request.get_json() or {}
    email = (data.get('email') or '').strip()
    rol = data.get('rol', 'urun_yetkilisi')

    if not email:
        return jsonify({'hata': 'Email zorunlu'}), 400
    if rol not in GECERLI_ROLLER:
        return jsonify({'hata': f'Geçersiz rol. İzin verilenler: {", ".join(GECERLI_ROLLER)}'}), 400
    # Only a sahip can assign sahip role
    if rol == 'sahip' and member.rol != 'sahip':
        return jsonify({'hata': 'Sahip rolü eklemek için sahip yetkisi gerekli'}), 403

    k = Kullanici.query.filter_by(email=email, aktif=True).first()
    if not k:
        return jsonify({'hata': 'Bu e-postaya ait aktif kullanıcı bulunamadı'}), 404

    existing = StoreMember.query.filter_by(store_id=store.id, kullanici_id=k.id).first()
    if existing:
        if existing.aktif:
            return jsonify({'hata': 'Bu kullanıcı zaten mağaza üyesi'}), 409
        # Re-activate a previously removed member
        existing.aktif = True
        existing.rol = rol
        db.session.commit()
        return jsonify(existing.to_dict())

    yeni_uye = StoreMember(
        store_id=store.id,
        kullanici_id=k.id,
        rol=rol,
        aktif=True,
    )
    db.session.add(yeni_uye)
    db.session.commit()
    return jsonify(yeni_uye.to_dict()), 201


# ──────────────────────────────────────────────────────────────
# 14. DELETE /personel/<mid> — remove store member (sahip only)
# ──────────────────────────────────────────────────────────────

@satici_panel_bp.route('/personel/<int:mid>', methods=['DELETE'])
def personel_sil(mid):
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code
    if member.rol != 'sahip':
        return jsonify({'hata': 'Bu işlem için sahip yetkisi gerekli'}), 403

    hedef = StoreMember.query.filter_by(id=mid, store_id=store.id).first_or_404()

    if hedef.kullanici_id == kid:
        return jsonify({'hata': 'Kendinizi mağazadan çıkaramazsınız'}), 400

    hedef.aktif = False
    db.session.commit()
    return jsonify({'ok': True})


# ──────────────────────────────────────────────────────────────
# 15. GET /magaza — store info
# ──────────────────────────────────────────────────────────────

@satici_panel_bp.route('/magaza', methods=['GET'])
def magaza_getir():
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code
    return jsonify(store.to_dict(public=False))


# ──────────────────────────────────────────────────────────────
# 16. PUT /magaza — update store (limited fields)
# ──────────────────────────────────────────────────────────────

# NOT updatable via this endpoint: slug, vergi_no, iban, komisyon_orani
_MAGAZA_GUNCELLENE_BILIR = ('magaza_adi', 'aciklama')


@satici_panel_bp.route('/magaza', methods=['PUT'])
def magaza_guncelle():
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code
    if member.rol not in ('sahip', 'yonetici'):
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403

    data = request.get_json() or {}
    for alan in _MAGAZA_GUNCELLENE_BILIR:
        if alan in data:
            setattr(store, alan, data[alan])

    db.session.commit()
    return jsonify(store.to_dict(public=False))


# ──────────────────────────────────────────────────────────────
# 17. GET /hakedisler — seller earning history
# ──────────────────────────────────────────────────────────────

@satici_panel_bp.route('/hakedisler', methods=['GET'])
def hakedisler_listele():
    kid, member, store = satici_bilgi_al()
    if not store:
        code, msg = _auth_error()
        return jsonify({'hata': msg}), code

    now = datetime.utcnow()

    # Lazily promote bekliyor → kullanilabilir when 14 days passed
    vadesi_gelenler = SellerHakedis.query.filter_by(
        store_id=store.id, durum='bekliyor'
    ).filter(SellerHakedis.kullanilabilir_tarih <= now).all()

    if vadesi_gelenler:
        bakiye = SellerBalance.query.filter_by(store_id=store.id).first()
        for h in vadesi_gelenler:
            h.durum = 'kullanilabilir'
            if bakiye:
                bakiye.bekleyen_tl = max(0.0, round(bakiye.bekleyen_tl - h.net_tl, 2))
                bakiye.kullanilabilir_tl = round(bakiye.kullanilabilir_tl + h.net_tl, 2)
        if bakiye:
            bakiye.guncelleme = now
        db.session.commit()

    hakedisler = SellerHakedis.query.filter_by(store_id=store.id).order_by(
        SellerHakedis.olusturma.desc()
    ).all()

    return jsonify({'hakedisler': [h.to_dict() for h in hakedisler]})
