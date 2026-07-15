from flask import Blueprint, request, jsonify, session
from models import (db, Marka, UrunModeli, Urun, UrunGorsel, UrunSiparis,
                    MagazaSiparis, MagazaSiparisKalemi, MagazaSiparisDurumLog,
                    Odeme, Kullanici, Usta)
from datetime import datetime
import os, uuid
from werkzeug.utils import secure_filename

magaza_bp = Blueprint('magaza', __name__)

ALLOWED = {'png', 'jpg', 'jpeg', 'webp'}

def admin_mi():
    kid = session.get('kullanici_id')
    if not kid:
        return False
    k = Kullanici.query.get(kid)
    return k and k.rol == 'admin'

def usta_mi():
    kid = session.get('kullanici_id')
    if not kid:
        return False
    k = Kullanici.query.get(kid)
    return k and k.rol == 'usta'

def _guncel_kur():
    try:
        import urllib.request, xml.etree.ElementTree as ET
        with urllib.request.urlopen('https://www.tcmb.gov.tr/kurlar/today.xml', timeout=5) as r:
            tree = ET.parse(r)
            root = tree.getroot()
            for cur in root.iter('Currency'):
                if cur.get('CurrencyCode') == 'USD':
                    forex_buy = cur.find('ForexBuying')
                    if forex_buy is not None and forex_buy.text:
                        return round(float(forex_buy.text.replace(',', '.')), 4)
    except Exception:
        pass
    return None

# ─── KUR ───────────────────────────────────────────────────

@magaza_bp.route('/kur', methods=['GET'])
def kur():
    k = _guncel_kur()
    if k:
        return jsonify({'kur': k, 'kaynak': 'TCMB'})
    return jsonify({'kur': None, 'kaynak': None, 'hata': 'TCMB ulaşılamadı'}), 503

# ─── MARKA ─────────────────────────────────────────────────

@magaza_bp.route('/markalar', methods=['GET'])
def markalar_listele():
    markalar = Marka.query.filter_by(aktif=True).order_by(Marka.ad).all()
    return jsonify([m.to_dict() for m in markalar])

@magaza_bp.route('/markalar', methods=['POST'])
def marka_olustur():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    data = request.get_json()
    ad = (data.get('ad') or '').strip()
    if not ad:
        return jsonify({'hata': 'Marka adı zorunlu'}), 400
    if Marka.query.filter_by(ad=ad).first():
        return jsonify({'hata': 'Bu marka zaten var'}), 409
    m = Marka(ad=ad)
    db.session.add(m)
    db.session.commit()
    return jsonify(m.to_dict()), 201

@magaza_bp.route('/markalar/<int:mid>', methods=['DELETE'])
def marka_sil(mid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    m = Marka.query.get_or_404(mid)
    m.aktif = False
    db.session.commit()
    return jsonify({'ok': True})

# ─── MODEL ─────────────────────────────────────────────────

@magaza_bp.route('/modeller', methods=['GET'])
def modeller_listele():
    marka_id = request.args.get('marka_id', type=int)
    q = UrunModeli.query.filter_by(aktif=True)
    if marka_id:
        q = q.filter_by(marka_id=marka_id)
    return jsonify([m.to_dict() for m in q.order_by(UrunModeli.ad).all()])

@magaza_bp.route('/modeller', methods=['POST'])
def model_olustur():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    data = request.get_json()
    ad = (data.get('ad') or '').strip()
    marka_id = data.get('marka_id')
    if not ad or not marka_id:
        return jsonify({'hata': 'Ad ve marka_id zorunlu'}), 400
    Marka.query.get_or_404(marka_id)
    m = UrunModeli(ad=ad, marka_id=marka_id)
    db.session.add(m)
    db.session.commit()
    return jsonify(m.to_dict()), 201

@magaza_bp.route('/modeller/<int:mid>', methods=['DELETE'])
def model_sil(mid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    m = UrunModeli.query.get_or_404(mid)
    m.aktif = False
    db.session.commit()
    return jsonify({'ok': True})

# ─── ÜRÜN ──────────────────────────────────────────────────

def _hesapla_tl(usd, kur, marj, kargo, kdv_dahil):
    base = usd * kur
    ara = base + base * (marj / 100) + kargo
    return round(ara * 1.20 if kdv_dahil else ara, 2)

@magaza_bp.route('/urunler', methods=['GET'])
def urunler_listele():
    sayfa = request.args.get('sayfa', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    arama = request.args.get('arama', '')
    aktif = request.args.get('aktif', None)

    q = Urun.query
    if arama:
        q = q.filter(Urun.ad.ilike(f'%{arama}%'))
    if aktif is not None:
        q = q.filter_by(aktif=(aktif == '1'))
    total = q.count()
    urunler = q.order_by(Urun.olusturma.desc()).offset((sayfa-1)*limit).limit(limit).all()
    return jsonify({
        'urunler': [u.to_dict() for u in urunler],
        'total': total,
        'sayfa': sayfa,
        'sayfa_sayisi': (total + limit - 1) // limit
    })

@magaza_bp.route('/urunler', methods=['POST'])
def urun_olustur():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    data = request.get_json()
    ad = (data.get('ad') or '').strip()
    usd = float(data.get('usd_fiyat') or 0)
    kur = float(data.get('kur') or 0)
    if not ad or not usd or not kur:
        return jsonify({'hata': 'Ad, usd_fiyat ve kur zorunlu'}), 400

    kar_marji_val = data.get('kar_marji')
    marj = float(kar_marji_val) if kar_marji_val is not None else 25
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
        aktif=bool(data.get('aktif', True)),
        marka_id=data.get('marka_id'),
        model_id=data.get('model_id'),
        kategori=data.get('kategori', ''),
    )
    db.session.add(u)
    db.session.commit()
    return jsonify(u.to_dict()), 201

@magaza_bp.route('/urunler/<int:uid>', methods=['GET'])
def urun_detay(uid):
    u = Urun.query.get_or_404(uid)
    return jsonify(u.to_dict(include_gorseller=True))

@magaza_bp.route('/urunler/<int:uid>', methods=['PUT'])
def urun_guncelle(uid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    u = Urun.query.get_or_404(uid)
    data = request.get_json()
    for field in ('ad', 'aciklama', 'sku', 'barkod', 'kategori'):
        if field in data:
            setattr(u, field, data[field])
    for field in ('usd_fiyat', 'kur', 'kar_marji', 'kargo_ucreti'):
        if field in data:
            setattr(u, field, float(data[field]))
    if 'kdv_dahil' in data:
        u.kdv_dahil = bool(data['kdv_dahil'])
    if 'stok' in data:
        u.stok = int(data['stok'])
    if 'aktif' in data:
        u.aktif = bool(data['aktif'])
    if 'marka_id' in data:
        u.marka_id = data['marka_id']
    if 'model_id' in data:
        u.model_id = data['model_id']
    u.tl_fiyat = _hesapla_tl(u.usd_fiyat, u.kur, u.kar_marji, u.kargo_ucreti, u.kdv_dahil)
    u.guncelleme = datetime.utcnow()
    db.session.commit()
    return jsonify(u.to_dict())

@magaza_bp.route('/urunler/<int:uid>', methods=['DELETE'])
def urun_sil(uid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    u = Urun.query.get_or_404(uid)
    u.aktif = False
    db.session.commit()
    return jsonify({'ok': True})

@magaza_bp.route('/gorseller/<int:gid>', methods=['DELETE'])
def gorsel_sil(gid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    g = UrunGorsel.query.get_or_404(gid)
    dosya_tam = os.path.join(os.path.dirname(__file__), '..', 'uploads', g.dosya_yolu)
    try:
        if os.path.exists(dosya_tam):
            os.remove(dosya_tam)
    except Exception:
        pass
    db.session.delete(g)
    db.session.commit()
    return jsonify({'ok': True})

@magaza_bp.route('/urunler/<int:uid>/gorsel', methods=['POST'])
def gorsel_yukle(uid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    u = Urun.query.get_or_404(uid)
    if 'gorsel' not in request.files:
        return jsonify({'hata': 'Dosya yok'}), 400
    f = request.files['gorsel']
    ext = f.filename.rsplit('.', 1)[-1].lower() if '.' in f.filename else ''
    if ext not in ALLOWED:
        return jsonify({'hata': 'Desteklenmeyen format'}), 400
    dosya_adi = f'urun_{uid}_{uuid.uuid4().hex[:8]}.{ext}'
    from flask import current_app
    klasor = os.path.join(current_app.config['UPLOAD_FOLDER'], 'urunler')
    os.makedirs(klasor, exist_ok=True)
    f.save(os.path.join(klasor, dosya_adi))
    sira = UrunGorsel.query.filter_by(urun_id=uid).count()
    g = UrunGorsel(urun_id=uid, dosya_yolu=f'urunler/{dosya_adi}', sira=sira)
    db.session.add(g)
    db.session.commit()
    return jsonify({'yol': g.dosya_yolu, 'id': g.id}), 201

# ─── PUBLIC MAĞAZA ─────────────────────────────────────────

@magaza_bp.route('/public/filtreler', methods=['GET'])
def public_filtreler():
    from models import MarketplaceStore
    kategoriler = [r[0] for r in db.session.query(Urun.kategori).filter(
        Urun.aktif == True, Urun.kategori != None, Urun.kategori != ''
    ).distinct().order_by(Urun.kategori).all()]
    markalar = [m.to_dict() for m in Marka.query.filter_by(aktif=True).order_by(Marka.ad).all()
                if db.session.query(Urun.id).filter_by(marka_id=m.id, aktif=True).first()]
    magazalar = [{'id': s.id, 'ad': s.magaza_adi, 'slug': s.slug}
                 for s in MarketplaceStore.query.filter_by(aktif=True, askida=False).order_by(MarketplaceStore.magaza_adi).all()]
    return jsonify({'kategoriler': kategoriler, 'markalar': markalar, 'magazalar': magazalar})


@magaza_bp.route('/public/urunler', methods=['GET'])
def public_urunler():
    from models import MarketplaceStore
    arama = request.args.get('arama', '')
    kategori = request.args.get('kategori', '')
    marka_id = request.args.get('marka_id', type=int)
    store_id = request.args.get('store_id', type=int)
    store_slug = request.args.get('store_slug', '')
    fiyat_min = request.args.get('fiyat_min', type=float)
    fiyat_max = request.args.get('fiyat_max', type=float)
    siralama = request.args.get('siralama', 'yeni')  # yeni / fiyat_asc / fiyat_desc / cok_satan
    sayfa = request.args.get('sayfa', 1, type=int)
    limit = 20
    q = Urun.query.filter(Urun.aktif == True, db.or_(Urun.urun_durum == 'active', Urun.urun_durum == None))
    if arama:
        q = q.filter(Urun.ad.ilike(f'%{arama}%'))
    if kategori:
        q = q.filter_by(kategori=kategori)
    if marka_id:
        q = q.filter_by(marka_id=marka_id)
    if store_id:
        q = q.filter(Urun.store_id == store_id)
    elif store_slug:
        store = MarketplaceStore.query.filter_by(slug=store_slug, aktif=True, askida=False).first()
        if store:
            q = q.filter(Urun.store_id == store.id)
    if fiyat_min is not None:
        q = q.filter(Urun.usd_fiyat >= fiyat_min)
    if fiyat_max is not None:
        q = q.filter(Urun.usd_fiyat <= fiyat_max)
    if siralama == 'fiyat_asc':
        q = q.order_by(Urun.usd_fiyat.asc())
    elif siralama == 'fiyat_desc':
        q = q.order_by(Urun.usd_fiyat.desc())
    else:
        q = q.order_by(Urun.olusturma.desc())
    total = q.count()
    urunler = q.offset((sayfa - 1) * limit).limit(limit).all()
    return jsonify({'urunler': [u.to_dict() for u in urunler], 'total': total, 'sayfa': sayfa})

@magaza_bp.route('/public/urunler/<int:uid>', methods=['GET'])
def public_urun_detay(uid):
    u = Urun.query.filter_by(id=uid, aktif=True).first_or_404()
    return jsonify(u.to_dict(include_gorseller=True))

@magaza_bp.route('/public/kategoriler', methods=['GET'])
def public_kategoriler():
    sonuc = db.session.query(Urun.kategori).filter(
        Urun.aktif == True, Urun.kategori != None, Urun.kategori != ''
    ).distinct().all()
    return jsonify([r[0] for r in sonuc])

@magaza_bp.route('/public/siparis', methods=['POST'])
def public_siparis():
    data = request.get_json()
    items = data.get('items', [])
    misafir_ad = (data.get('ad') or '').strip()
    misafir_soyad = (data.get('soyad') or '').strip()
    misafir_telefon = (data.get('telefon') or '').strip()
    misafir_email = (data.get('email') or '').strip()

    if not items:
        return jsonify({'hata': 'Sepet boş'}), 400
    if not misafir_ad or not misafir_telefon:
        return jsonify({'hata': 'Ad ve telefon zorunlu'}), 400
    # Legal consent validation
    if not data.get('on_bilgilendirme_onaylandi'):
        return jsonify({'hata': 'Ön Bilgilendirme Formu onayı zorunludur'}), 400
    if not data.get('mesafeli_satis_onaylandi'):
        return jsonify({'hata': 'Mesafeli Satış Sözleşmesi onayı zorunludur'}), 400
    if not data.get('iptal_iade_onaylandi'):
        return jsonify({'hata': 'İptal ve İade Koşulları onayı zorunludur'}), 400
    if not data.get('gizlilik_onaylandi'):
        return jsonify({'hata': 'Gizlilik metni onayı zorunludur'}), 400

    # Validate items & recalculate totals from DB
    urunler_map = {}
    for item in items:
        uid = item.get('urun_id')
        miktar = max(1, int(item.get('miktar') or 1))
        urun = Urun.query.filter_by(id=uid, aktif=True).first()
        if not urun:
            return jsonify({'hata': f'Ürün bulunamadı (id={uid})'}), 400
        if urun.stok is not None and urun.stok < miktar:
            return jsonify({'hata': f'"{urun.ad}" için yeterli stok yok (mevcut: {urun.stok})'}), 400
        urunler_map[uid] = (urun, miktar)

    siparis_no = uuid.uuid4().hex[:8].upper()

    # Calculate totals
    ara_toplam_tl = sum(u.tl_fiyat * m for u, m in urunler_map.values())
    ara_toplam_usd = sum(u.usd_fiyat * m for u, m in urunler_map.values())
    genel_toplam_tl = round(ara_toplam_tl, 2)
    genel_toplam_usd = round(ara_toplam_usd, 2)

    siparis = MagazaSiparis(
        siparis_no=siparis_no,
        misafir_ad=misafir_ad,
        misafir_soyad=misafir_soyad,
        misafir_telefon=misafir_telefon,
        misafir_email=misafir_email,
        fatura_tipi=data.get('fatura_tipi', 'bireysel'),
        fatura_ad=data.get('fatura_ad', ''),
        vergi_no=data.get('vergi_no', ''),
        vergi_dairesi=data.get('vergi_dairesi', ''),
        teslimat_adres=(data.get('adres') or '').strip(),
        teslimat_ilce=(data.get('ilce') or '').strip(),
        teslimat_not=(data.get('not_') or '').strip(),
        ara_toplam_tl=round(ara_toplam_tl, 2),
        ara_toplam_usd=round(ara_toplam_usd, 2),
        kdv_tl=0.0,
        kargo_tl=0.0,
        indirim_tl=0.0,
        genel_toplam_tl=genel_toplam_tl,
        genel_toplam_usd=genel_toplam_usd,
        odeme_yontemi=(data.get('odeme_yontemi') or '').strip(),
        odeme_durumu='bekliyor',
        durum='yeni',
        musteri_notu=(data.get('musteri_notu') or '').strip(),
        on_bilgilendirme_onaylandi=True,
        mesafeli_satis_onaylandi=True,
        iptal_iade_onaylandi=True,
        gizlilik_onaylandi=True,
        sozlesme_tarih=datetime.utcnow(),
    )
    db.session.add(siparis)
    db.session.flush()  # get siparis.id

    for uid, (urun, miktar) in urunler_map.items():
        kalem = MagazaSiparisKalemi(
            siparis_id=siparis.id,
            urun_id=urun.id,
            urun_ad=urun.ad,
            urun_sku=urun.sku or '',
            miktar=miktar,
            birim_fiyat_tl=urun.tl_fiyat,
            birim_fiyat_usd=urun.usd_fiyat,
            toplam_tl=round(urun.tl_fiyat * miktar, 2),
            toplam_usd=round(urun.usd_fiyat * miktar, 2),
            kapak_gorsel=urun.gorseller[0].dosya_yolu if urun.gorseller else '',
        )
        db.session.add(kalem)
        if urun.stok is not None:
            urun.stok -= miktar

    # Group kalemler by store_id and create SellerOrders
    from models import SellerOrder, Commission, MarketplaceStore
    satici_gruplar = {}  # store_id -> {'store': ..., 'toplam_tl': 0}
    for uid, (urun, miktar) in urunler_map.items():
        sid = urun.store_id
        if sid not in satici_gruplar:
            store = MarketplaceStore.query.get(sid) if sid else None
            satici_gruplar[sid] = {'store': store, 'toplam_tl': 0.0}
        satici_gruplar[sid]['toplam_tl'] += round(urun.tl_fiyat * miktar, 2)

    for store_id, grup in satici_gruplar.items():
        store = grup['store']
        komisyon_orani = store.komisyon_orani if store else 15.0
        brut = grup['toplam_tl']
        kom_tl = round(brut * komisyon_orani / 100, 2)
        net_tl = round(brut - kom_tl, 2)
        so_no = siparis_no + ('-' + store.slug[:6].upper() if store else '-ADAUSTA')
        seller_order = SellerOrder(
            siparis_id=siparis.id,
            store_id=store_id or 1,
            siparis_no=so_no,
            durum='yeni',
            ara_toplam_tl=brut,
            komisyon_orani=komisyon_orani,
            komisyon_tl=kom_tl,
            satici_net_tl=net_tl,
            hakediş_durumu='pending',
        )
        db.session.add(seller_order)
        db.session.flush()
        kom = Commission(
            seller_order_id=seller_order.id,
            store_id=store_id or 1,
            siparis_id=siparis.id,
            komisyon_orani=komisyon_orani,
            brut_tutar_tl=brut,
            komisyon_tl=kom_tl,
            net_tutar_tl=net_tl,
            durum='pending',
        )
        db.session.add(kom)

    # Durum log
    log = MagazaSiparisDurumLog(
        siparis_id=siparis.id,
        eski_durum='',
        yeni_durum='yeni',
        aciklama='Sipariş oluşturuldu',
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'ok': True, 'siparis_no': siparis_no, 'genel_toplam_tl': genel_toplam_tl}), 201


@magaza_bp.route('/public/siparis/<siparis_no>', methods=['GET'])
def public_siparis_detay(siparis_no):
    telefon = request.args.get('telefon', '')
    email = request.args.get('email', '')
    s = MagazaSiparis.query.filter_by(siparis_no=siparis_no.upper()).first()
    if not s:
        return jsonify({'hata': 'Sipariş bulunamadı'}), 404
    if telefon and s.misafir_telefon == telefon:
        pass
    elif email and s.misafir_email == email:
        pass
    else:
        return jsonify({'hata': 'Erişim reddedildi'}), 403
    return jsonify(s.to_dict(include_kalemler=True))


@magaza_bp.route('/cardplus/callback', methods=['POST'])
def cardplus_callback():
    data = request.get_json() or {}
    siparis_no = data.get('siparis_no', '')
    payment_source = data.get('payment_source', '')
    provider_transaction_id = data.get('transaction_id', '')
    status = data.get('status', '')
    idempotency_key = data.get('idempotency_key', provider_transaction_id)

    # Idempotency check
    if idempotency_key:
        existing = Odeme.query.filter_by(idempotency_key=idempotency_key).first()
        if existing:
            return jsonify({'ok': True, 'already_processed': True})

    if payment_source == 'store_order':
        siparis = MagazaSiparis.query.filter_by(siparis_no=siparis_no).first()
        if not siparis:
            return jsonify({'hata': 'Sipariş bulunamadı'}), 404
        if siparis.odeme_durumu == 'odendi':
            return jsonify({'ok': True, 'already_paid': True})
        if status == 'success':
            siparis.odeme_durumu = 'odendi'
            siparis.durum = 'hazirlaniyor'
            log = MagazaSiparisDurumLog(
                siparis_id=siparis.id,
                eski_durum='yeni',
                yeni_durum='hazirlaniyor',
                aciklama='CardPlus ödeme onaylandı',
            )
            db.session.add(log)
            odeme = Odeme(
                usta_id=None,
                tutar=siparis.genel_toplam_tl,
                para_birimi='TRY',
                siparis_no=siparis_no,
                durum='basarili',
                payment_source='store_order',
                reference_type='magaza_siparis',
                reference_id=siparis.id,
                provider_transaction_id=provider_transaction_id,
                idempotency_key=idempotency_key or None,
                paid_at=datetime.utcnow(),
            )
            db.session.add(odeme)
            # Credit seller balances
            from models import SellerOrder, SellerBalance, Commission
            seller_orders = SellerOrder.query.filter_by(siparis_id=siparis.id).all()
            for so in seller_orders:
                # Get or create SellerBalance for this store
                balance = SellerBalance.query.filter_by(store_id=so.store_id).first()
                if not balance:
                    balance = SellerBalance(store_id=so.store_id)
                    db.session.add(balance)
                    db.session.flush()
                balance.bekleyen_tl = round((balance.bekleyen_tl or 0.0) + so.satici_net_tl, 2)
                balance.guncelleme = datetime.utcnow()
                so.hakediş_durumu = 'on_hold'
                # Mark commission as confirmed
                kom = Commission.query.filter_by(seller_order_id=so.id).first()
                if kom:
                    kom.durum = 'confirmed'
            db.session.commit()
        else:
            siparis.odeme_durumu = 'basarisiz'
            db.session.commit()
    return jsonify({'ok': True})


@magaza_bp.route('/admin/magaza-siparisler', methods=['GET'])
def admin_magaza_siparisler():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    durum = request.args.get('durum', '')
    odeme_durumu = request.args.get('odeme_durumu', '')
    arama = request.args.get('arama', '')
    sayfa = request.args.get('sayfa', 1, type=int)
    limit = 30
    q = MagazaSiparis.query
    if durum:
        q = q.filter_by(durum=durum)
    if odeme_durumu:
        q = q.filter_by(odeme_durumu=odeme_durumu)
    if arama:
        q = q.filter(db.or_(
            MagazaSiparis.siparis_no.ilike(f'%{arama}%'),
            MagazaSiparis.misafir_ad.ilike(f'%{arama}%'),
            MagazaSiparis.misafir_telefon.ilike(f'%{arama}%'),
            MagazaSiparis.misafir_email.ilike(f'%{arama}%'),
        ))
    total = q.count()
    siparisler = q.order_by(MagazaSiparis.olusturma.desc()).offset((sayfa-1)*limit).limit(limit).all()
    return jsonify({'siparisler': [s.to_dict() for s in siparisler], 'total': total, 'sayfa': sayfa})


@magaza_bp.route('/admin/magaza-siparisler/<int:sid>', methods=['GET'])
def admin_magaza_siparis_detay(sid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    s = MagazaSiparis.query.get_or_404(sid)
    return jsonify(s.to_dict(include_kalemler=True))


@magaza_bp.route('/admin/magaza-siparisler/<int:sid>/durum', methods=['PUT'])
def admin_magaza_siparis_durum(sid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    s = MagazaSiparis.query.get_or_404(sid)
    data = request.get_json()
    yeni_durum = data.get('durum', s.durum)
    aciklama = data.get('aciklama', '')
    if yeni_durum != s.durum:
        log = MagazaSiparisDurumLog(
            siparis_id=s.id,
            eski_durum=s.durum,
            yeni_durum=yeni_durum,
            aciklama=aciklama,
            admin_id=session.get('kullanici_id'),
        )
        db.session.add(log)
        s.durum = yeni_durum
        s.guncelleme = datetime.utcnow()
    if 'admin_notu' in data:
        s.admin_notu = data['admin_notu']
    db.session.commit()
    return jsonify(s.to_dict(include_kalemler=True))


@magaza_bp.route('/admin/magaza-dashboard', methods=['GET'])
def admin_magaza_dashboard():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    from sqlalchemy import func
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    bugun_siparis = MagazaSiparis.query.filter(MagazaSiparis.olusturma >= today).count()
    bekleyen = MagazaSiparis.query.filter_by(durum='yeni').count()
    odeme_bekleyen = MagazaSiparis.query.filter_by(odeme_durumu='bekliyor').count()
    odendi = MagazaSiparis.query.filter_by(odeme_durumu='odendi').count()
    basarisiz = MagazaSiparis.query.filter_by(odeme_durumu='basarisiz').count()
    toplam_ciro = db.session.query(func.sum(MagazaSiparis.genel_toplam_tl)).filter_by(odeme_durumu='odendi').scalar() or 0
    bugun_ciro = db.session.query(func.sum(MagazaSiparis.genel_toplam_tl)).filter(
        MagazaSiparis.olusturma >= today, MagazaSiparis.odeme_durumu == 'odendi'
    ).scalar() or 0
    return jsonify({
        'bugun_siparis': bugun_siparis,
        'bekleyen': bekleyen,
        'odeme_bekleyen': odeme_bekleyen,
        'odendi': odendi,
        'basarisiz': basarisiz,
        'toplam_ciro': round(float(toplam_ciro), 2),
        'bugun_ciro': round(float(bugun_ciro), 2),
    })


# ─── USTA MAĞAZA ───────────────────────────────────────────

@magaza_bp.route('/usta/urunler', methods=['GET'])
def usta_urunler():
    if not usta_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    arama = request.args.get('arama', '')
    sayfa = request.args.get('sayfa', 1, type=int)
    limit = 20
    q = Urun.query.filter_by(aktif=True)
    if arama:
        q = q.filter(Urun.ad.ilike(f'%{arama}%'))
    total = q.count()
    urunler = q.order_by(Urun.olusturma.desc()).offset((sayfa-1)*limit).limit(limit).all()
    return jsonify({'urunler': [u.to_dict() for u in urunler], 'total': total})

@magaza_bp.route('/usta/siparis', methods=['POST'])
def usta_siparis():
    if not usta_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    data = request.get_json()
    urun_id = data.get('urun_id')
    miktar = int(data.get('miktar') or 1)
    u = Urun.query.get_or_404(urun_id)
    if u.stok is not None and u.stok < miktar:
        return jsonify({'hata': 'Yetersiz stok'}), 400
    kid = session['kullanici_id']
    usta = Usta.query.filter_by(kullanici_id=kid).first()
    s = UrunSiparis(
        urun_id=urun_id,
        usta_id=usta.id if usta else None,
        miktar=miktar,
        birim_fiyat_tl=u.tl_fiyat,
        toplam_tl=round(u.tl_fiyat * miktar, 2),
    )
    if u.stok is not None:
        u.stok -= miktar
    db.session.add(s)
    db.session.commit()
    return jsonify({'ok': True, 'siparis_id': s.id}), 201

@magaza_bp.route('/usta/siparislerim', methods=['GET'])
def usta_siparislerim():
    if not usta_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    kid = session['kullanici_id']
    usta = Usta.query.filter_by(kullanici_id=kid).first()
    if not usta:
        return jsonify([])
    siparisler = UrunSiparis.query.filter_by(usta_id=usta.id).order_by(UrunSiparis.olusturma.desc()).all()
    return jsonify([s.to_dict() for s in siparisler])

# ─── ADMİN SİPARİŞLER ──────────────────────────────────────

@magaza_bp.route('/admin/siparisler/ozet', methods=['GET'])
def admin_siparisler_ozet():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    toplam      = UrunSiparis.query.count()
    bekliyor    = UrunSiparis.query.filter_by(durum='bekliyor').count()
    hazirlaniyor = UrunSiparis.query.filter_by(durum='hazırlanıyor').count()
    kargoda     = UrunSiparis.query.filter_by(durum='kargoda').count()
    teslim      = UrunSiparis.query.filter_by(durum='teslim_edildi').count()
    iptal       = UrunSiparis.query.filter_by(durum='iptal').count()
    ciro        = db.session.query(db.func.sum(UrunSiparis.toplam_tl)).filter(
        UrunSiparis.durum == 'teslim_edildi'
    ).scalar() or 0
    return jsonify({
        'toplam': toplam,
        'bekliyor': bekliyor,
        'hazirlaniyor': hazirlaniyor,
        'kargoda': kargoda,
        'teslim_edildi': teslim,
        'iptal': iptal,
        'teslim_ciro': round(float(ciro), 2),
    })

@magaza_bp.route('/admin/siparisler', methods=['GET'])
def admin_siparisler():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    durum = request.args.get('durum', '')
    arama = request.args.get('arama', '')
    sayfa = request.args.get('sayfa', 1, type=int)
    limit = 50
    q = UrunSiparis.query
    if durum:
        q = q.filter_by(durum=durum)
    if arama:
        q = q.filter(db.or_(
            UrunSiparis.misafir_ad.ilike(f'%{arama}%'),
            UrunSiparis.siparis_kodu.ilike(f'%{arama}%'),
            UrunSiparis.misafir_telefon.ilike(f'%{arama}%'),
        ))
    total = q.count()
    siparisler = q.order_by(UrunSiparis.olusturma.desc()).offset((sayfa - 1) * limit).limit(limit).all()
    return jsonify({'siparisler': [s.to_dict() for s in siparisler], 'total': total, 'sayfa': sayfa})

@magaza_bp.route('/admin/siparisler/<int:sid>', methods=['PUT'])
def siparis_durum(sid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    s = UrunSiparis.query.get_or_404(sid)
    data = request.get_json()
    s.durum = data.get('durum', s.durum)
    db.session.commit()
    return jsonify(s.to_dict())


@magaza_bp.route('/public/magaza/<slug>', methods=['GET'])
def public_magaza_detay(slug):
    from models import MarketplaceStore
    store = MarketplaceStore.query.filter_by(slug=slug, aktif=True, askida=False).first()
    if not store:
        return jsonify({'hata': 'Mağaza bulunamadı'}), 404
    return jsonify({'magaza': store.to_dict(public=True)})


@magaza_bp.route('/public/magaza/<slug>/urunler', methods=['GET'])
def public_magaza_urunleri(slug):
    from models import MarketplaceStore
    store = MarketplaceStore.query.filter_by(slug=slug, aktif=True, askida=False).first()
    if not store:
        return jsonify({'hata': 'Mağaza bulunamadı'}), 404
    sayfa = request.args.get('sayfa', 1, type=int)
    arama = request.args.get('arama', '')
    kategori = request.args.get('kategori', '')
    limit = 20
    q = Urun.query.filter(
        Urun.aktif == True,
        Urun.store_id == store.id,
        db.or_(Urun.urun_durum == 'active', Urun.urun_durum == None)
    )
    if arama:
        q = q.filter(Urun.ad.ilike(f'%{arama}%'))
    if kategori:
        q = q.filter_by(kategori=kategori)
    total = q.count()
    urunler = q.order_by(Urun.olusturma.desc()).offset((sayfa-1)*limit).limit(limit).all()
    return jsonify({
        'magaza': store.to_dict(public=True),
        'urunler': [u.to_dict() for u in urunler],
        'total': total,
    })


@magaza_bp.route('/public/saticilar', methods=['GET'])
def public_saticilar():
    from models import MarketplaceStore
    arama = request.args.get('arama', '')
    sayfa = request.args.get('sayfa', 1, type=int)
    limit = 20
    q = MarketplaceStore.query.filter_by(aktif=True, askida=False)
    if arama:
        q = q.filter(MarketplaceStore.magaza_adi.ilike(f'%{arama}%'))
    total = q.count()
    magazalar = q.order_by(MarketplaceStore.toplam_satis.desc()).offset((sayfa-1)*limit).limit(limit).all()
    return jsonify({
        'magazalar': [m.to_dict(public=True) for m in magazalar],
        'total': total,
        'sayfa': sayfa,
    })
