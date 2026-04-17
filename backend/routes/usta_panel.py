from flask import Blueprint, request, jsonify, session
from models import db, Kullanici, Usta, IsTalebi, IletisimLog, Yorum, Fotograf
from datetime import datetime, timedelta
from functools import wraps
import uuid, os
from werkzeug.utils import secure_filename

usta_panel_bp = Blueprint('usta_panel', __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
IZIN_UZANTILAR = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def usta_gerekli(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        kid = session.get('kullanici_id')
        if not kid or session.get('rol') != 'usta':
            return jsonify({'hata': 'Bu işlem için usta girişi gereklidir'}), 403
        usta = Usta.query.filter_by(kullanici_id=kid).first()
        if not usta:
            return jsonify({'hata': 'Usta profili bulunamadı'}), 404
        return f(usta, *args, **kwargs)
    return decorated


# ──────────────────────────────────────────────────────────
# Dashboard — özet istatistikler
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/panel', methods=['GET'])
@usta_gerekli
def panel(usta):
    simdi = datetime.utcnow()
    bu_ay_bas = simdi.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    son_30 = simdi - timedelta(days=30)

    toplam_talep = IsTalebi.query.filter_by(usta_id=usta.id).count()
    bekleyen = IsTalebi.query.filter_by(usta_id=usta.id, durum='bekliyor').count()
    kabul = IsTalebi.query.filter_by(usta_id=usta.id, durum='kabul').count()
    tamamlandi = IsTalebi.query.filter_by(usta_id=usta.id, durum='tamamlandi').count()
    bu_ay_talep = IsTalebi.query.filter(
        IsTalebi.usta_id == usta.id,
        IsTalebi.olusturma >= bu_ay_bas
    ).count()

    toplam_yorum = Yorum.query.filter_by(usta_id=usta.id, onaylanmis=True).count()
    puan = usta.ortalama_puan()

    goruntuleme = IletisimLog.query.filter(
        IletisimLog.usta_id == usta.id,
        IletisimLog.tur == 'goruntule',
        IletisimLog.tarih >= son_30
    ).count()
    arama = IletisimLog.query.filter(
        IletisimLog.usta_id == usta.id,
        IletisimLog.tur == 'ara',
        IletisimLog.tarih >= son_30
    ).count()
    whatsapp = IletisimLog.query.filter(
        IletisimLog.usta_id == usta.id,
        IletisimLog.tur == 'whatsapp',
        IletisimLog.tarih >= son_30
    ).count()

    # Son 7 gün günlük talep
    gunluk = []
    for i in range(6, -1, -1):
        gun = simdi - timedelta(days=i)
        bas = gun.replace(hour=0, minute=0, second=0, microsecond=0)
        bit = bas + timedelta(days=1)
        sayi = IsTalebi.query.filter(
            IsTalebi.usta_id == usta.id,
            IsTalebi.olusturma >= bas,
            IsTalebi.olusturma < bit
        ).count()
        gunluk.append({'gun': bas.strftime('%d.%m'), 'sayi': sayi})

    # Son 5 talep
    son_talepler = IsTalebi.query.filter_by(usta_id=usta.id)\
        .order_by(IsTalebi.olusturma.desc()).limit(5).all()

    return jsonify({
        'usta': usta.to_dict(),
        'istatistik': {
            'toplam_talep': toplam_talep,
            'bekleyen': bekleyen,
            'kabul': kabul,
            'tamamlandi': tamamlandi,
            'bu_ay_talep': bu_ay_talep,
            'toplam_yorum': toplam_yorum,
            'puan': puan,
            'goruntuleme_30gun': goruntuleme,
            'arama_30gun': arama,
            'whatsapp_30gun': whatsapp,
        },
        'gunluk_talep': gunluk,
        'son_talepler': [t.to_dict() for t in son_talepler],
    })


# ──────────────────────────────────────────────────────────
# Profil — görüntüle / güncelle
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/profil', methods=['GET'])
@usta_gerekli
def profil_getir(usta):
    return jsonify({'usta': usta.to_dict()})


@usta_panel_bp.route('/profil', methods=['PUT'])
@usta_gerekli
def profil_guncelle(usta):
    data = request.get_json()
    alanlar = ['ad', 'soyad', 'telefon', 'whatsapp', 'email',
               'aciklama', 'deneyim_yil', 'sehir_id', 'ilce_id',
               'lat', 'lng', 'musaitlik']
    for alan in alanlar:
        if alan in data:
            setattr(usta, alan, data[alan])
    db.session.commit()
    return jsonify({'mesaj': 'Profil güncellendi', 'usta': usta.to_dict()})


@usta_panel_bp.route('/profil/fotograf', methods=['POST'])
@usta_gerekli
def fotograf_yukle(usta):
    if 'dosya' not in request.files:
        return jsonify({'hata': 'Dosya seçilmedi'}), 400
    f = request.files['dosya']
    ext = f.filename.rsplit('.', 1)[-1].lower()
    if ext not in IZIN_UZANTILAR:
        return jsonify({'hata': 'Desteklenmeyen dosya türü'}), 400
    ad = f'{uuid.uuid4().hex}.{ext}'
    f.save(os.path.join(UPLOAD_FOLDER, ad))
    foto = Fotograf(usta_id=usta.id, dosya=ad)
    db.session.add(foto)
    db.session.commit()
    return jsonify({'mesaj': 'Fotoğraf yüklendi', 'fotograf': foto.to_dict()}), 201


@usta_panel_bp.route('/profil/fotograf/<int:fid>', methods=['DELETE'])
@usta_gerekli
def fotograf_sil(usta, fid):
    foto = Fotograf.query.filter_by(id=fid, usta_id=usta.id).first_or_404()
    yol = os.path.join(UPLOAD_FOLDER, foto.dosya)
    if os.path.exists(yol):
        os.remove(yol)
    db.session.delete(foto)
    db.session.commit()
    return jsonify({'mesaj': 'Fotoğraf silindi'})


# ──────────────────────────────────────────────────────────
# Müsaitlik toggle
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/musaitlik', methods=['PUT'])
@usta_gerekli
def musaitlik_toggle(usta):
    data = request.get_json()
    usta.musaitlik = data.get('musaitlik', not usta.musaitlik)
    db.session.commit()
    return jsonify({'musaitlik': usta.musaitlik})


# ──────────────────────────────────────────────────────────
# İş talepleri
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/is-talepleri', methods=['GET'])
@usta_gerekli
def is_talepleri(usta):
    durum = request.args.get('durum', 'hepsi')
    q = IsTalebi.query.filter_by(usta_id=usta.id)
    if durum != 'hepsi':
        q = q.filter_by(durum=durum)
    talepler = q.order_by(IsTalebi.olusturma.desc()).all()
    return jsonify({'talepler': [t.to_dict() for t in talepler]})


@usta_panel_bp.route('/is-talepleri/<int:tid>', methods=['PUT'])
@usta_gerekli
def talep_guncelle(usta, tid):
    talep = IsTalebi.query.filter_by(id=tid, usta_id=usta.id).first_or_404()
    data = request.get_json()
    if 'durum' in data and data['durum'] in ['bekliyor', 'kabul', 'red', 'tamamlandi']:
        talep.durum = data['durum']
    if 'usta_notu' in data:
        talep.usta_notu = data['usta_notu']
    talep.guncelleme = datetime.utcnow()
    db.session.commit()
    return jsonify({'mesaj': 'Talep güncellendi', 'talep': talep.to_dict()})


# ──────────────────────────────────────────────────────────
# Müşteriler — usta ile iletişime geçmiş kişiler
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/musteriler', methods=['GET'])
@usta_gerekli
def musteriler(usta):
    # İş taleplerinden gelen müşteriler (tekrarsız)
    talepler = IsTalebi.query.filter_by(usta_id=usta.id)\
        .order_by(IsTalebi.olusturma.desc()).all()

    musteri_map = {}
    for t in talepler:
        key = t.musteri_telefon
        if key not in musteri_map:
            musteri_map[key] = {
                'ad': t.musteri_ad,
                'telefon': t.musteri_telefon,
                'adres': t.musteri_adres,
                'ilk_talep': t.olusturma.isoformat(),
                'son_talep': t.olusturma.isoformat(),
                'toplam_talep': 0,
                'tamamlandi': 0,
                'talepler': [],
            }
        musteri_map[key]['toplam_talep'] += 1
        if t.durum == 'tamamlandi':
            musteri_map[key]['tamamlandi'] += 1
        musteri_map[key]['son_talep'] = t.olusturma.isoformat()
        musteri_map[key]['talepler'].append(t.to_dict())

    return jsonify({'musteriler': list(musteri_map.values())})


# ──────────────────────────────────────────────────────────
# İstatistikler — detaylı analitik
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/istatistikler', methods=['GET'])
@usta_gerekli
def istatistikler(usta):
    aralik = int(request.args.get('aralik', 30))
    simdi = datetime.utcnow()
    bas = simdi - timedelta(days=aralik)

    # Günlük iletişim trendi
    gunluk_iletisim = []
    for i in range(aralik - 1, -1, -1):
        gun = simdi - timedelta(days=i)
        gun_bas = gun.replace(hour=0, minute=0, second=0, microsecond=0)
        gun_bit = gun_bas + timedelta(days=1)
        ara = IletisimLog.query.filter(
            IletisimLog.usta_id == usta.id, IletisimLog.tur == 'ara',
            IletisimLog.tarih >= gun_bas, IletisimLog.tarih < gun_bit
        ).count()
        wp = IletisimLog.query.filter(
            IletisimLog.usta_id == usta.id, IletisimLog.tur == 'whatsapp',
            IletisimLog.tarih >= gun_bas, IletisimLog.tarih < gun_bit
        ).count()
        goruntule = IletisimLog.query.filter(
            IletisimLog.usta_id == usta.id, IletisimLog.tur == 'goruntule',
            IletisimLog.tarih >= gun_bas, IletisimLog.tarih < gun_bit
        ).count()
        gunluk_iletisim.append({
            'gun': gun_bas.strftime('%d.%m'),
            'ara': ara, 'whatsapp': wp, 'goruntule': goruntule
        })

    # Talep durum dağılımı
    durum_dagilim = {}
    for durum in ['bekliyor', 'kabul', 'red', 'tamamlandi']:
        durum_dagilim[durum] = IsTalebi.query.filter(
            IsTalebi.usta_id == usta.id,
            IsTalebi.olusturma >= bas
        ).filter_by(durum=durum).count()

    # Yorumlar
    yorumlar = Yorum.query.filter_by(usta_id=usta.id, onaylanmis=True)\
        .order_by(Yorum.tarih.desc()).all()
    puan_dagilim = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for y in yorumlar:
        puan_dagilim[y.puan] = puan_dagilim.get(y.puan, 0) + 1

    return jsonify({
        'gunluk_iletisim': gunluk_iletisim,
        'durum_dagilim': durum_dagilim,
        'puan_dagilim': puan_dagilim,
        'toplam_yorum': len(yorumlar),
        'ort_puan': usta.ortalama_puan(),
        'yorumlar': [y.to_dict() for y in yorumlar[:20]],
    })


# ──────────────────────────────────────────────────────────
# Yorumlar listesi (usta paneli için)
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/yorumlar', methods=['GET'])
@usta_gerekli
def yorumlar(usta):
    tum = Yorum.query.filter_by(usta_id=usta.id)\
        .order_by(Yorum.tarih.desc()).all()
    return jsonify({'yorumlar': [y.to_dict() for y in tum]})
