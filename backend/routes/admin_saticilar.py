from flask import Blueprint, request, jsonify, session, send_file, current_app
from models import (db, Kullanici, SellerApplication, SellerDocument,
                    MarketplaceStore, StoreMember, SellerBalance, SellerAuditLog)
from datetime import datetime
import os

admin_saticilar_bp = Blueprint('admin_saticilar', __name__)


# ─── YETKİ YARDIMCISI ─────────────────────────────────────────

def admin_mi():
    kid = session.get('kullanici_id')
    if not kid:
        return False
    k = Kullanici.query.get(kid)
    return k and k.rol == 'admin'


def audit_log(islem, detay='', basvuru_id=None, store_id=None):
    kid = session.get('kullanici_id')
    entry = SellerAuditLog(
        basvuru_id=basvuru_id,
        store_id=store_id,
        yapan_id=kid,
        islem=islem,
        detay=detay,
        ip=request.remote_addr or '',
    )
    db.session.add(entry)


# ─── 1. BAŞVURU LİSTESİ ────────────────────────────────────────

@admin_saticilar_bp.route('/basvurular', methods=['GET'])
def basvurular_listele():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    durum = request.args.get('durum', '')
    arama = request.args.get('arama', '')
    sayfa = request.args.get('sayfa', 1, type=int)
    limit = 20
    offset = (sayfa - 1) * limit

    q = SellerApplication.query

    if durum:
        q = q.filter(SellerApplication.durum == durum)

    if arama:
        q = q.filter(
            SellerApplication.ticari_unvan.ilike(f'%{arama}%') |
            SellerApplication.yetkili_email.ilike(f'%{arama}%') |
            SellerApplication.magaza_adi.ilike(f'%{arama}%')
        )

    total = q.count()
    basvurular = q.order_by(SellerApplication.olusturma.desc()).offset(offset).limit(limit).all()

    return jsonify({
        'basvurular': [b.to_dict(include_belgeler=False) for b in basvurular],
        'total': total,
        'sayfa': sayfa,
    })


# ─── 2. BAŞVURU DETAYI ─────────────────────────────────────────

@admin_saticilar_bp.route('/basvuru/<int:bid>', methods=['GET'])
def basvuru_detay(bid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    b = SellerApplication.query.get_or_404(bid)
    return jsonify({'basvuru': b.to_dict(include_belgeler=True, public=False)})


# ─── 3. BELGE ONAYLA ───────────────────────────────────────────

@admin_saticilar_bp.route('/basvuru/<int:bid>/belge-onayla/<int:did>', methods=['POST'])
def belge_onayla(bid, did):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    doc = SellerDocument.query.filter_by(id=did, basvuru_id=bid).first_or_404()
    admin_id = session.get('kullanici_id')

    doc.durum = 'approved'
    doc.inceleyen_id = admin_id
    doc.inceleme_tarihi = datetime.utcnow()

    audit_log(
        islem='belge_onaylandi',
        detay=f'Belge #{did} ({doc.tur}) onaylandı',
        basvuru_id=bid,
    )
    db.session.commit()

    return jsonify({'ok': True, 'belge': doc.to_dict()})


# ─── 4. BELGE REDDET ───────────────────────────────────────────

@admin_saticilar_bp.route('/basvuru/<int:bid>/belge-reddet/<int:did>', methods=['POST'])
def belge_reddet(bid, did):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    data = request.get_json() or {}
    red_nedeni = (data.get('red_nedeni') or '').strip()
    if len(red_nedeni) < 10:
        return jsonify({'hata': 'Red nedeni en az 10 karakter olmalıdır'}), 400

    doc = SellerDocument.query.filter_by(id=did, basvuru_id=bid).first_or_404()
    admin_id = session.get('kullanici_id')

    doc.durum = 'rejected'
    doc.red_nedeni = red_nedeni
    doc.inceleyen_id = admin_id
    doc.inceleme_tarihi = datetime.utcnow()

    audit_log(
        islem='belge_reddedildi',
        detay=f'Belge #{did} ({doc.tur}) reddedildi: {red_nedeni}',
        basvuru_id=bid,
    )
    db.session.commit()

    return jsonify({'ok': True, 'belge': doc.to_dict()})


# ─── 5. EK BELGE İSTE ─────────────────────────────────────────

@admin_saticilar_bp.route('/basvuru/<int:bid>/ek-belge-iste', methods=['POST'])
def ek_belge_iste(bid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    data = request.get_json() or {}
    not_ = (data.get('not') or '').strip()
    if not not_:
        return jsonify({'hata': 'Açıklama notu gereklidir'}), 400

    b = SellerApplication.query.get_or_404(bid)
    b.durum = 'additional_document_required'
    b.inceleme_notu = not_
    b.guncelleme = datetime.utcnow()

    audit_log(
        islem='ek_belge_istendi',
        detay=not_,
        basvuru_id=bid,
    )
    db.session.commit()

    return jsonify({'ok': True, 'basvuru': b.to_dict(include_belgeler=True, public=False)})


# ─── 6. BAŞVURU ONAYLA ─────────────────────────────────────────

@admin_saticilar_bp.route('/basvuru/<int:bid>/onayla', methods=['POST'])
def basvuru_onayla(bid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    b = SellerApplication.query.get_or_404(bid)
    if b.durum not in ('submitted', 'under_review'):
        return jsonify({'hata': f"Başvuru '{b.durum}' durumunda, onaylanamaz"}), 400

    data = request.get_json() or {}
    not_ = (data.get('not') or '').strip()
    admin_id = session.get('kullanici_id')
    now = datetime.utcnow()

    # Başvuruyu onayla
    b.durum = 'approved'
    b.reviewer_id = admin_id
    b.inceleme_tarihi = now
    if not_:
        b.inceleme_notu = not_
    b.guncelleme = now

    # Mağaza oluştur
    store = MarketplaceStore(
        slug=b.magaza_slug,
        magaza_adi=b.magaza_adi,
        ticari_unvan=b.ticari_unvan,
        vergi_no=b.vergi_no,
        iban=b.iban,
        banka_hesap_sahibi=b.banka_hesap_sahibi,
        aciklama=b.magaza_aciklama,
        logo=b.logo,
        kapak_gorsel=b.kapak_gorsel,
        basvuru_id=b.id,
        kullanici_id=b.kullanici_id,
        aktif=True,
    )
    db.session.add(store)
    db.session.flush()  # store.id'yi almak için

    # Başlangıç bakiyesi oluştur
    bakiye = SellerBalance(
        store_id=store.id,
        bekleyen_tl=0.0,
        kullanilabilir_tl=0.0,
        odenmis_tl=0.0,
    )
    db.session.add(bakiye)

    # Sahibi üye olarak ekle
    uye = StoreMember(
        store_id=store.id,
        kullanici_id=b.kullanici_id,
        rol='sahip',
        aktif=True,
    )
    db.session.add(uye)

    audit_log(
        islem='basvuru_onaylandi',
        detay=f'Başvuru #{bid} onaylandı, mağaza #{store.id} ({store.magaza_adi}) oluşturuldu',
        basvuru_id=bid,
        store_id=store.id,
    )
    db.session.commit()

    return jsonify({'ok': True, 'magaza': store.to_dict(public=False)})


# ─── 7. BAŞVURU REDDET ─────────────────────────────────────────

@admin_saticilar_bp.route('/basvuru/<int:bid>/reddet', methods=['POST'])
def basvuru_reddet(bid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    data = request.get_json() or {}
    red_nedeni = (data.get('red_nedeni') or '').strip()
    if len(red_nedeni) < 10:
        return jsonify({'hata': 'Red nedeni en az 10 karakter olmalıdır'}), 400

    b = SellerApplication.query.get_or_404(bid)
    admin_id = session.get('kullanici_id')
    now = datetime.utcnow()

    b.durum = 'rejected'
    b.red_nedeni = red_nedeni
    b.reviewer_id = admin_id
    b.inceleme_tarihi = now
    b.guncelleme = now

    audit_log(
        islem='basvuru_reddedildi',
        detay=red_nedeni,
        basvuru_id=bid,
    )
    db.session.commit()

    return jsonify({'ok': True, 'basvuru': b.to_dict(include_belgeler=True, public=False)})


# ─── 8. MAĞAZA LİSTESİ ─────────────────────────────────────────

@admin_saticilar_bp.route('/magazalar', methods=['GET'])
def magazalar_listele():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    arama = request.args.get('arama', '')
    askida_filtre = request.args.get('askida', '')
    sayfa = request.args.get('sayfa', 1, type=int)
    limit = 20
    offset = (sayfa - 1) * limit

    q = MarketplaceStore.query

    if arama:
        q = q.filter(
            MarketplaceStore.magaza_adi.ilike(f'%{arama}%') |
            MarketplaceStore.ticari_unvan.ilike(f'%{arama}%') |
            MarketplaceStore.slug.ilike(f'%{arama}%')
        )

    if askida_filtre == '1' or askida_filtre == 'true':
        q = q.filter(MarketplaceStore.askida == True)
    elif askida_filtre == '0' or askida_filtre == 'false':
        q = q.filter(MarketplaceStore.askida == False)

    total = q.count()
    magazalar = q.order_by(MarketplaceStore.olusturma.desc()).offset(offset).limit(limit).all()

    return jsonify({
        'magazalar': [m.to_dict(public=False) for m in magazalar],
        'total': total,
        'sayfa': sayfa,
    })


# ─── 9. MAĞAZA ASKIYA AL ───────────────────────────────────────

@admin_saticilar_bp.route('/magaza/<int:sid>/askiya-al', methods=['POST'])
def magaza_askiya_al(sid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    data = request.get_json() or {}
    neden = (data.get('neden') or '').strip()
    if not neden:
        return jsonify({'hata': 'Askıya alma nedeni gereklidir'}), 400

    store = MarketplaceStore.query.get_or_404(sid)
    store.askida = True

    audit_log(
        islem='magaza_askiya_alindi',
        detay=neden,
        store_id=sid,
        basvuru_id=store.basvuru_id,
    )
    db.session.commit()

    return jsonify({'ok': True})


# ─── 10. MAĞAZA AKTİF ET ──────────────────────────────────────

@admin_saticilar_bp.route('/magaza/<int:sid>/aktif-et', methods=['POST'])
def magaza_aktif_et(sid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    store = MarketplaceStore.query.get_or_404(sid)
    store.askida = False

    audit_log(
        islem='magaza_aktif_edildi',
        detay=f'Mağaza #{sid} ({store.magaza_adi}) askıdan çıkarıldı',
        store_id=sid,
        basvuru_id=store.basvuru_id,
    )
    db.session.commit()

    return jsonify({'ok': True})


# ─── 11. MAĞAZA GÜNCELLE (Admin) ───────────────────────────────

@admin_saticilar_bp.route('/magaza/<int:sid>', methods=['PUT'])
def magaza_guncelle(sid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    store = MarketplaceStore.query.get_or_404(sid)
    data = request.get_json() or {}

    guncellenebilir = [
        'magaza_adi', 'ticari_unvan', 'aciklama', 'slug',
        'vergi_no', 'iban', 'banka_hesap_sahibi',
        'komisyon_orani', 'aktif', 'askida',
    ]

    if 'slug' in data and data['slug'] != store.slug:
        existing = MarketplaceStore.query.filter(
            MarketplaceStore.slug == data['slug'],
            MarketplaceStore.id != sid
        ).first()
        if existing:
            return jsonify({'hata': 'Bu slug başka mağazada kullanılıyor'}), 400

    for alan in guncellenebilir:
        if alan in data:
            setattr(store, alan, data[alan])

    audit_log(
        islem='magaza_guncellendi',
        detay=f'Admin tarafından güncellendi: {store.magaza_adi}',
        store_id=sid,
    )
    db.session.commit()
    return jsonify({'ok': True, 'magaza': store.to_dict(public=False)})


# ─── 12. MAĞAZA OLUŞTUR (Admin) ────────────────────────────────

@admin_saticilar_bp.route('/magaza', methods=['POST'])
def magaza_olustur():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    data = request.get_json() or {}
    magaza_adi = (data.get('magaza_adi') or '').strip()
    slug = (data.get('slug') or '').strip().lower().replace(' ', '-')

    if not magaza_adi or not slug:
        return jsonify({'hata': 'Mağaza adı ve slug zorunludur'}), 400

    if MarketplaceStore.query.filter_by(slug=slug).first():
        return jsonify({'hata': 'Bu slug kullanımda'}), 400

    store = MarketplaceStore(
        slug=slug,
        magaza_adi=magaza_adi,
        ticari_unvan=data.get('ticari_unvan') or magaza_adi,
        aciklama=data.get('aciklama', ''),
        vergi_no=data.get('vergi_no', ''),
        iban=data.get('iban', ''),
        banka_hesap_sahibi=data.get('banka_hesap_sahibi', ''),
        komisyon_orani=float(data.get('komisyon_orani', 15.0)),
        aktif=True,
        askida=False,
        toplam_satis=0,
        puan=0.0,
        yorum_sayisi=0,
    )
    db.session.add(store)
    db.session.flush()

    bakiye = SellerBalance(
        store_id=store.id,
        bekleyen_tl=0.0,
        kullanilabilir_tl=0.0,
        odenmis_tl=0.0,
    )
    db.session.add(bakiye)

    audit_log(
        islem='magaza_olusturuldu',
        detay=f'Admin tarafından oluşturuldu: {magaza_adi}',
        store_id=store.id,
    )
    db.session.commit()
    return jsonify({'ok': True, 'magaza': store.to_dict(public=False)}), 201


# ─── 13. BELGE İNDİR ──────────────────────────────────────────

@admin_saticilar_bp.route('/belge/<int:did>/indir', methods=['GET'])
def belge_indir(did):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403

    doc = SellerDocument.query.get_or_404(did)

    upload_folder = current_app.config.get('UPLOAD_FOLDER') or os.path.join(
        os.path.dirname(__file__), '..', 'uploads'
    )

    # dosya_yolu may already start with 'belgeler/' or be an absolute-ish relative path
    if os.path.isabs(doc.dosya_yolu):
        dosya_tam = doc.dosya_yolu
    else:
        dosya_tam = os.path.join(upload_folder, doc.dosya_yolu)

    dosya_tam = os.path.abspath(dosya_tam)

    if not os.path.isfile(dosya_tam):
        return jsonify({'hata': 'Dosya bulunamadı'}), 404

    ext = os.path.splitext(doc.dosya_yolu)[1]  # e.g. '.pdf'
    indir_adi = f'{doc.tur}_{doc.id}{ext}'

    return send_file(dosya_tam, as_attachment=True, download_name=indir_adi)


# ─── 13. ÜRÜN ONAY ROUTES ──────────────────────────────────────

@admin_saticilar_bp.route('/urunler/bekleyenler', methods=['GET'])
def urunler_bekleyenler():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    from models import Urun, MarketplaceStore
    sayfa = request.args.get('sayfa', 1, type=int)
    limit = 20
    q = Urun.query.filter_by(urun_durum='pending_review', aktif=True)
    total = q.count()
    urunler = q.order_by(Urun.olusturma.asc()).offset((sayfa-1)*limit).limit(limit).all()
    sonuc = []
    for u in urunler:
        d = u.to_dict(include_gorseller=True)
        if u.store_id:
            store = MarketplaceStore.query.get(u.store_id)
            d['magaza_adi'] = store.magaza_adi if store else ''
            d['magaza_slug'] = store.slug if store else ''
        sonuc.append(d)
    return jsonify({'urunler': sonuc, 'total': total, 'sayfa': sayfa})


@admin_saticilar_bp.route('/urun/<int:uid>/onayla', methods=['POST'])
def urun_onayla(uid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    from models import Urun, SellerAuditLog
    urun = Urun.query.get_or_404(uid)
    urun.urun_durum = 'active'
    kid = session.get('kullanici_id')
    log = SellerAuditLog(
        store_id=urun.store_id,
        yapan_id=kid,
        islem='urun_onaylandi',
        detay=f'Ürün #{uid} aktif edildi',
        ip=request.remote_addr or '',
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'ok': True, 'urun_durum': 'active'})


@admin_saticilar_bp.route('/urun/<int:uid>/reddet', methods=['POST'])
def urun_reddet(uid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    from models import Urun, SellerAuditLog
    data = request.get_json() or {}
    neden = (data.get('neden') or '').strip()
    if len(neden) < 5:
        return jsonify({'hata': 'Red nedeni zorunlu (min 5 karakter)'}), 400
    urun = Urun.query.get_or_404(uid)
    urun.urun_durum = 'rejected'
    kid = session.get('kullanici_id')
    log = SellerAuditLog(
        store_id=urun.store_id,
        yapan_id=kid,
        islem='urun_reddedildi',
        detay=f'Ürün #{uid} reddedildi: {neden}',
        ip=request.remote_addr or '',
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'ok': True, 'urun_durum': 'rejected'})


# ─── 12. ÖZET (Sidebar badge) ─────────────────────────────────

@admin_saticilar_bp.route('/ozet', methods=['GET'])
def ozet():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    from models import Urun

    bekleyen = SellerApplication.query.filter_by(durum='submitted').count()
    inceleniyor = SellerApplication.query.filter_by(durum='under_review').count()
    bekleyen_urun = Urun.query.filter_by(urun_durum='pending_review', aktif=True).count()

    return jsonify({
        'bekleyen_basvuru': bekleyen,
        'inceleniyor': inceleniyor,
        'bekleyen_urun': bekleyen_urun,
    })
