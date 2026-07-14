from flask import Blueprint, request, jsonify, session
from models import (db, Kullanici, SellerOrder, Commission, SellerBalance,
                    MarketplaceStore, MagazaSiparis, SellerAuditLog,
                    SellerSubscriptionPlan, SellerSubscription, Odeme)
from datetime import datetime
from sqlalchemy import func

admin_finans_bp = Blueprint('admin_finans', __name__)


# ─── YETKİ YARDIMCISI ─────────────────────────────────────────────────────────

def admin_mi():
    kid = session.get('kullanici_id')
    if not kid:
        return False
    k = Kullanici.query.get(kid)
    return k and k.rol == 'admin'


def _audit(islem, detay='', store_id=None):
    kid = session.get('kullanici_id')
    entry = SellerAuditLog(
        store_id=store_id,
        yapan_id=kid,
        islem=islem,
        detay=detay,
        ip=request.remote_addr or '',
    )
    db.session.add(entry)


# ─── 1. ÖZET ──────────────────────────────────────────────────────────────────

@admin_finans_bp.route('/ozet', methods=['GET'])
def finans_ozet():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    # Lazy import to avoid circular dependency
    from models import ReturnRequest

    toplam_komisyon = db.session.query(
        func.coalesce(func.sum(Commission.komisyon_tl), 0.0)
    ).filter(Commission.durum == 'confirmed').scalar()

    bekleyen_hakedis = db.session.query(
        func.coalesce(func.sum(SellerOrder.satici_net_tl), 0.0)
    ).filter(SellerOrder.hakediş_durumu == 'on_hold').scalar()

    kullanilabilir_hakedis = db.session.query(
        func.coalesce(func.sum(SellerOrder.satici_net_tl), 0.0)
    ).filter(SellerOrder.hakediş_durumu == 'available').scalar()

    toplam_satici = MarketplaceStore.query.filter_by(aktif=True).count()

    bekleyen_iade = ReturnRequest.query.filter_by(durum='opened').count()

    return jsonify({
        'toplam_komisyon_tl': round(float(toplam_komisyon), 2),
        'bekleyen_hakediş_tl': round(float(bekleyen_hakedis), 2),
        'kullanilabilir_hakediş_tl': round(float(kullanilabilir_hakedis), 2),
        'toplam_satici': toplam_satici,
        'bekleyen_iade': bekleyen_iade,
    })


# ─── 2. KOMİSYONLAR ───────────────────────────────────────────────────────────

@admin_finans_bp.route('/komisyonlar', methods=['GET'])
def komisyonlar_listele():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    sayfa = max(1, request.args.get('sayfa', 1, type=int))
    store_id = request.args.get('store_id', type=int)
    durum = request.args.get('durum', '').strip()

    q = db.session.query(Commission, MarketplaceStore).join(
        MarketplaceStore, Commission.store_id == MarketplaceStore.id
    )

    if store_id:
        q = q.filter(Commission.store_id == store_id)
    if durum:
        q = q.filter(Commission.durum == durum)

    q = q.order_by(Commission.olusturma.desc())

    total = q.count()
    rows = q.offset((sayfa - 1) * 30).limit(30).all()

    komisyonlar = []
    for kom, magaza in rows:
        d = kom.to_dict()
        d['magaza_adi'] = magaza.magaza_adi
        komisyonlar.append(d)

    return jsonify({
        'komisyonlar': komisyonlar,
        'total': total,
        'sayfa': sayfa,
    })


# ─── 3. HAKEDİŞLER ────────────────────────────────────────────────────────────

@admin_finans_bp.route('/hakedisler', methods=['GET'])
def hakedisler_listele():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    sayfa = max(1, request.args.get('sayfa', 1, type=int))
    store_id = request.args.get('store_id', type=int)
    hakedis_durumu = request.args.get('hakediş_durumu', '').strip()

    q = db.session.query(SellerOrder, MarketplaceStore).join(
        MarketplaceStore, SellerOrder.store_id == MarketplaceStore.id
    )

    if store_id:
        q = q.filter(SellerOrder.store_id == store_id)
    if hakedis_durumu:
        q = q.filter(SellerOrder.hakediş_durumu == hakedis_durumu)

    q = q.order_by(SellerOrder.olusturma.desc())

    total = q.count()
    rows = q.offset((sayfa - 1) * 30).limit(30).all()

    hakedisler = []
    for so, magaza in rows:
        d = so.to_dict()
        d['magaza_adi'] = magaza.magaza_adi
        hakedisler.append(d)

    return jsonify({
        'hakedisler': hakedisler,
        'total': total,
        'sayfa': sayfa,
    })


# ─── 4. HAKEDİŞ SERBEST BIRAK ─────────────────────────────────────────────────

@admin_finans_bp.route('/hakedis/<int:so_id>/serbest-birak', methods=['POST'])
def hakedis_serbest_birak(so_id):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    so = SellerOrder.query.get_or_404(so_id)

    if so.hakediş_durumu != 'on_hold':
        return jsonify({'hata': 'Yalnızca on_hold durumundaki hakedişler serbest bırakılabilir'}), 400

    bakiye = SellerBalance.query.filter_by(store_id=so.store_id).first()
    if not bakiye:
        bakiye = SellerBalance(store_id=so.store_id, bekleyen_tl=0.0,
                               kullanilabilir_tl=0.0, odenmis_tl=0.0)
        db.session.add(bakiye)

    so.hakediş_durumu = 'available'
    bakiye.bekleyen_tl = max(0.0, (bakiye.bekleyen_tl or 0.0) - so.satici_net_tl)
    bakiye.kullanilabilir_tl = (bakiye.kullanilabilir_tl or 0.0) + so.satici_net_tl
    bakiye.guncelleme = datetime.utcnow()

    _audit(
        islem='hakedis_serbest_birakildi',
        detay=f'SellerOrder #{so_id}, tutar={so.satici_net_tl} TL',
        store_id=so.store_id,
    )

    db.session.commit()
    return jsonify({'ok': True})


# ─── 5. HAKEDİŞ ÖDENDİ İŞLE ──────────────────────────────────────────────────

@admin_finans_bp.route('/hakedis/<int:so_id>/odendi-isle', methods=['POST'])
def hakedis_odendi_isle(so_id):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    so = SellerOrder.query.get_or_404(so_id)

    if so.hakediş_durumu != 'available':
        return jsonify({'hata': 'Yalnızca available durumundaki hakedişler ödenebilir'}), 400

    bakiye = SellerBalance.query.filter_by(store_id=so.store_id).first()
    if not bakiye:
        bakiye = SellerBalance(store_id=so.store_id, bekleyen_tl=0.0,
                               kullanilabilir_tl=0.0, odenmis_tl=0.0)
        db.session.add(bakiye)

    so.hakediş_durumu = 'paid'
    bakiye.kullanilabilir_tl = max(0.0, (bakiye.kullanilabilir_tl or 0.0) - so.satici_net_tl)
    bakiye.odenmis_tl = (bakiye.odenmis_tl or 0.0) + so.satici_net_tl
    bakiye.guncelleme = datetime.utcnow()

    _audit(
        islem='hakedis_odendi',
        detay=f'SellerOrder #{so_id}, tutar={so.satici_net_tl} TL',
        store_id=so.store_id,
    )

    db.session.commit()
    return jsonify({'ok': True})


# ─── 6. SATICI BAKİYELERİ ─────────────────────────────────────────────────────

@admin_finans_bp.route('/satici-bakiyeleri', methods=['GET'])
def satici_bakiyeleri():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    rows = db.session.query(SellerBalance, MarketplaceStore).join(
        MarketplaceStore, SellerBalance.store_id == MarketplaceStore.id
    ).order_by(SellerBalance.kullanilabilir_tl.desc()).all()

    bakiyeler = []
    for bakiye, magaza in rows:
        bakiyeler.append({
            'store_id': bakiye.store_id,
            'magaza_adi': magaza.magaza_adi,
            'slug': magaza.slug,
            'bekleyen_tl': round(bakiye.bekleyen_tl or 0.0, 2),
            'kullanilabilir_tl': round(bakiye.kullanilabilir_tl or 0.0, 2),
            'odenmis_tl': round(bakiye.odenmis_tl or 0.0, 2),
        })

    return jsonify({'bakiyeler': bakiyeler})


# ─── 7. ABONELİK PLANLARI LİSTELE ────────────────────────────────────────────

@admin_finans_bp.route('/abonelik-planlari', methods=['GET'])
def abonelik_planlari_listele():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    planlar = SellerSubscriptionPlan.query.order_by(SellerSubscriptionPlan.fiyat_tl.asc()).all()
    return jsonify({'planlar': [p.to_dict() for p in planlar]})


# ─── 8. ABONELİK PLANI OLUŞTUR ────────────────────────────────────────────────

@admin_finans_bp.route('/abonelik-planlari', methods=['POST'])
def abonelik_plani_olustur():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    veri = request.get_json(force=True) or {}

    ad = (veri.get('ad') or '').strip()
    slug = (veri.get('slug') or '').strip()
    fiyat_tl = veri.get('fiyat_tl')
    urun_limiti = veri.get('urun_limiti')
    personel_limiti = veri.get('personel_limiti')
    komisyon_orani = veri.get('komisyon_orani')
    aciklama = (veri.get('aciklama') or '').strip()

    if not ad or not slug or fiyat_tl is None:
        return jsonify({'hata': 'ad, slug ve fiyat_tl zorunludur'}), 400

    if SellerSubscriptionPlan.query.filter_by(slug=slug).first():
        return jsonify({'hata': 'Bu slug zaten kullanımda'}), 409

    plan = SellerSubscriptionPlan(
        ad=ad,
        slug=slug,
        fiyat_tl=float(fiyat_tl),
        urun_limiti=int(urun_limiti) if urun_limiti is not None else None,
        personel_limiti=int(personel_limiti) if personel_limiti is not None else None,
        komisyon_orani=float(komisyon_orani) if komisyon_orani is not None else None,
        aciklama=aciklama,
    )
    db.session.add(plan)
    db.session.commit()

    return jsonify(plan.to_dict()), 201


# ─── 9. ABONELİK PLANI GÜNCELLE ──────────────────────────────────────────────

@admin_finans_bp.route('/abonelik-planlari/<int:pid>', methods=['PUT'])
def abonelik_plani_guncelle(pid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    plan = SellerSubscriptionPlan.query.get_or_404(pid)
    veri = request.get_json(force=True) or {}

    if 'ad' in veri:
        plan.ad = (veri['ad'] or '').strip()
    if 'slug' in veri:
        yeni_slug = (veri['slug'] or '').strip()
        if yeni_slug != plan.slug:
            mevcut = SellerSubscriptionPlan.query.filter_by(slug=yeni_slug).first()
            if mevcut:
                return jsonify({'hata': 'Bu slug zaten kullanımda'}), 409
        plan.slug = yeni_slug
    if 'fiyat_tl' in veri:
        plan.fiyat_tl = float(veri['fiyat_tl'])
    if 'urun_limiti' in veri:
        plan.urun_limiti = int(veri['urun_limiti']) if veri['urun_limiti'] is not None else None
    if 'personel_limiti' in veri:
        plan.personel_limiti = int(veri['personel_limiti']) if veri['personel_limiti'] is not None else None
    if 'komisyon_orani' in veri:
        plan.komisyon_orani = float(veri['komisyon_orani']) if veri['komisyon_orani'] is not None else None
    if 'aciklama' in veri:
        plan.aciklama = (veri['aciklama'] or '').strip()

    db.session.commit()
    return jsonify(plan.to_dict())
