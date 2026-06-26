from flask import Blueprint, request, jsonify, session
from models import db, Marka, UrunModeli, Urun, UrunGorsel, UrunSiparis, Kullanici, Usta
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

    marj = float(data.get('kar_marji') or 25)
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

@magaza_bp.route('/public/urunler', methods=['GET'])
def public_urunler():
    arama = request.args.get('arama', '')
    sayfa = request.args.get('sayfa', 1, type=int)
    limit = 20
    q = Urun.query.filter_by(aktif=True)
    if arama:
        q = q.filter(Urun.ad.ilike(f'%{arama}%'))
    total = q.count()
    urunler = q.order_by(Urun.olusturma.desc()).offset((sayfa-1)*limit).limit(limit).all()
    return jsonify({'urunler': [u.to_dict() for u in urunler], 'total': total})

@magaza_bp.route('/public/siparis', methods=['POST'])
def public_siparis():
    data = request.get_json()
    items = data.get('items', [])
    ad = (data.get('ad') or '').strip()
    telefon = (data.get('telefon') or '').strip()
    if not items:
        return jsonify({'hata': 'Sepet boş'}), 400
    if not ad or not telefon:
        return jsonify({'hata': 'Ad ve telefon zorunlu'}), 400

    siparis_kodu = uuid.uuid4().hex[:8].upper()
    for item in items:
        urun = Urun.query.get(item.get('urun_id'))
        if not urun or not urun.aktif:
            continue
        miktar = max(1, int(item.get('miktar') or 1))
        if urun.stok is not None and urun.stok < miktar:
            return jsonify({'hata': f'"{urun.ad}" için yeterli stok yok'}), 400
        s = UrunSiparis(
            urun_id=urun.id,
            miktar=miktar,
            birim_fiyat_tl=urun.tl_fiyat,
            toplam_tl=round(urun.tl_fiyat * miktar, 2),
            birim_fiyat_usd=urun.usd_fiyat,
            toplam_usd=round(urun.usd_fiyat * miktar, 2),
            siparis_kodu=siparis_kodu,
            misafir_ad=ad,
            misafir_telefon=telefon,
            misafir_email=(data.get('email') or '').strip(),
            misafir_adres=(data.get('adres') or '').strip(),
        )
        if urun.stok is not None:
            urun.stok -= miktar
        db.session.add(s)
    db.session.commit()
    return jsonify({'ok': True, 'siparis_kodu': siparis_kodu}), 201

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

@magaza_bp.route('/admin/siparisler', methods=['GET'])
def admin_siparisler():
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    siparisler = UrunSiparis.query.order_by(UrunSiparis.olusturma.desc()).limit(100).all()
    return jsonify([s.to_dict() for s in siparisler])

@magaza_bp.route('/admin/siparisler/<int:sid>', methods=['PUT'])
def siparis_durum(sid):
    if not admin_mi():
        return jsonify({'hata': 'Yetkisiz'}), 403
    s = UrunSiparis.query.get_or_404(sid)
    data = request.get_json()
    s.durum = data.get('durum', s.durum)
    db.session.commit()
    return jsonify(s.to_dict())
