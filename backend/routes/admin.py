from flask import Blueprint, request, jsonify, session
from models import db, Usta, Yorum, Kategori, Kullanici, AdminLog
from functools import wraps
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)


def admin_gerekli(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get('rol') != 'admin':
            return jsonify({'hata': 'Yetkisiz'}), 403
        return f(*args, **kwargs)
    return decorated


def log_kaydet(islem, detay=''):
    kid = session.get('kullanici_id')
    k = Kullanici.query.get(kid) if kid else None
    entry = AdminLog(
        kullanici_id=kid,
        kullanici_email=k.email if k else 'anonim',
        islem=islem,
        detay=detay,
        ip=request.remote_addr or ''
    )
    db.session.add(entry)
    db.session.commit()


# ─── İSTATİSTİK ────────────────────────────────────────────────

@admin_bp.route('/istatistik', methods=['GET'])
@admin_gerekli
def istatistik():
    bugun = datetime.utcnow().date()
    bu_ay_baslangic = datetime(bugun.year, bugun.month, 1)
    gecen_ay_baslangic = bu_ay_baslangic - timedelta(days=1)
    gecen_ay_baslangic = datetime(gecen_ay_baslangic.year, gecen_ay_baslangic.month, 1)

    # Son 7 gün günlük kayıt
    son_7_gun = []
    for i in range(6, -1, -1):
        gun = datetime.utcnow() - timedelta(days=i)
        baslangic = datetime(gun.year, gun.month, gun.day)
        bitis = baslangic + timedelta(days=1)
        sayi = Usta.query.filter(Usta.olusturma >= baslangic, Usta.olusturma < bitis).count()
        son_7_gun.append({'tarih': gun.strftime('%d.%m'), 'sayi': sayi})

    # Kategori bazlı usta dağılımı
    kategoriler = Kategori.query.filter_by(aktif=True).all()
    kategori_dagilim = [
        {'kategori': k.ad, 'sayi': len([u for u in k.ustalar if u.onaylanmis])}
        for k in kategoriler
    ]
    kategori_dagilim.sort(key=lambda x: x['sayi'], reverse=True)

    return jsonify({
        'toplam_usta': Usta.query.count(),
        'onaylanan_usta': Usta.query.filter_by(onaylanmis=True).count(),
        'bekleyen_usta': Usta.query.filter_by(onaylanmis=False, aktif=True).count(),
        'toplam_yorum': Yorum.query.count(),
        'bekleyen_yorum': Yorum.query.filter_by(onaylanmis=False).count(),
        'toplam_kategori': Kategori.query.count(),
        'bu_ay_kayit': Usta.query.filter(Usta.olusturma >= bu_ay_baslangic).count(),
        'gecen_ay_kayit': Usta.query.filter(
            Usta.olusturma >= gecen_ay_baslangic,
            Usta.olusturma < bu_ay_baslangic
        ).count(),
        'son_7_gun': son_7_gun,
        'kategori_dagilim': kategori_dagilim[:10],
    })


# ─── USTA YÖNETİMİ ────────────────────────────────────────────

@admin_bp.route('/ustalar', methods=['GET'])
@admin_gerekli
def ustalar():
    filtre = request.args.get('filtre', 'hepsi')  # hepsi / bekleyen / onaylandi / pasif
    arama = request.args.get('arama', '')
    kategori_id = request.args.get('kategori_id', type=int)

    q = Usta.query
    if filtre == 'bekleyen':
        q = q.filter_by(onaylanmis=False, aktif=True)
    elif filtre == 'onaylandi':
        q = q.filter_by(onaylanmis=True, aktif=True)
    elif filtre == 'pasif':
        q = q.filter_by(aktif=False)

    if kategori_id:
        q = q.filter_by(kategori_id=kategori_id)

    if arama:
        q = q.filter(
            Usta.ad.ilike(f'%{arama}%') |
            Usta.soyad.ilike(f'%{arama}%') |
            Usta.telefon.ilike(f'%{arama}%')
        )

    return jsonify({'ustalar': [u.to_dict() for u in q.order_by(Usta.olusturma.desc()).all()]})


@admin_bp.route('/ustalar/<int:id>/onayla', methods=['POST'])
@admin_gerekli
def onayla(id):
    u = Usta.query.get_or_404(id)
    u.onaylanmis = True
    u.aktif = True
    db.session.commit()
    log_kaydet('USTA_ONAYLA', f'Usta #{id} {u.ad} {u.soyad} onaylandı')
    return jsonify({'mesaj': 'Usta onaylandı'})


@admin_bp.route('/ustalar/<int:id>/reddet', methods=['POST'])
@admin_gerekli
def reddet(id):
    u = Usta.query.get_or_404(id)
    u.aktif = False
    u.onaylanmis = False
    db.session.commit()
    log_kaydet('USTA_REDDET', f'Usta #{id} {u.ad} {u.soyad} reddedildi')
    return jsonify({'mesaj': 'Usta reddedildi'})


@admin_bp.route('/ustalar/<int:id>', methods=['PUT'])
@admin_gerekli
def guncelle(id):
    u = Usta.query.get_or_404(id)
    data = request.get_json()
    for alan in ['ad', 'soyad', 'telefon', 'whatsapp', 'email', 'aciklama',
                 'sehir_id', 'ilce_id', 'kategori_id', 'deneyim_yil', 'onaylanmis', 'aktif']:
        if alan in data:
            setattr(u, alan, data[alan])
    db.session.commit()
    log_kaydet('USTA_GUNCELLE', f'Usta #{id} {u.ad} {u.soyad} güncellendi')
    return jsonify({'mesaj': 'Güncellendi'})


@admin_bp.route('/ustalar/<int:id>', methods=['DELETE'])
@admin_gerekli
def sil(id):
    u = Usta.query.get_or_404(id)
    ad = f'{u.ad} {u.soyad}'
    db.session.delete(u)
    db.session.commit()
    log_kaydet('USTA_SIL', f'Usta #{id} {ad} silindi')
    return jsonify({'mesaj': 'Silindi'})


@admin_bp.route('/ustalar/toplu', methods=['POST'])
@admin_gerekli
def toplu_islem():
    data = request.get_json()
    islem = data.get('islem')  # onayla / reddet / sil
    idler = data.get('idler', [])

    if not idler or islem not in ['onayla', 'reddet', 'sil']:
        return jsonify({'hata': 'Geçersiz istek'}), 400

    ustalar = Usta.query.filter(Usta.id.in_(idler)).all()
    for u in ustalar:
        if islem == 'onayla':
            u.onaylanmis = True
            u.aktif = True
        elif islem == 'reddet':
            u.aktif = False
            u.onaylanmis = False
        elif islem == 'sil':
            db.session.delete(u)

    db.session.commit()
    log_kaydet('TOPLU_İŞLEM', f'{len(ustalar)} usta için {islem} yapıldı (idler: {idler})')
    return jsonify({'mesaj': f'{len(ustalar)} usta için işlem tamamlandı'})


# ─── YORUM YÖNETİMİ ────────────────────────────────────────────

@admin_bp.route('/yorumlar', methods=['GET'])
@admin_gerekli
def yorumlar():
    filtre = request.args.get('filtre', 'hepsi')
    q = Yorum.query
    if filtre == 'bekleyen':
        q = q.filter_by(onaylanmis=False)
    elif filtre == 'onaylandi':
        q = q.filter_by(onaylanmis=True)

    liste = []
    for y in q.order_by(Yorum.tarih.desc()).all():
        d = y.to_dict()
        d['usta_ad'] = f'{y.usta.ad} {y.usta.soyad}' if y.usta else ''
        d['usta_id'] = y.usta_id
        d['onaylanmis'] = y.onaylanmis
        liste.append(d)
    return jsonify({'yorumlar': liste})


@admin_bp.route('/yorumlar/<int:id>/onayla', methods=['POST'])
@admin_gerekli
def yorum_onayla(id):
    y = Yorum.query.get_or_404(id)
    y.onaylanmis = True
    db.session.commit()
    log_kaydet('YORUM_ONAYLA', f'Yorum #{id} onaylandı')
    return jsonify({'mesaj': 'Yorum onaylandı'})


@admin_bp.route('/yorumlar/<int:id>', methods=['DELETE'])
@admin_gerekli
def yorum_sil(id):
    y = Yorum.query.get_or_404(id)
    db.session.delete(y)
    db.session.commit()
    log_kaydet('YORUM_SIL', f'Yorum #{id} silindi')
    return jsonify({'mesaj': 'Yorum silindi'})


# ─── KATEGORİ YÖNETİMİ ────────────────────────────────────────

@admin_bp.route('/kategoriler', methods=['GET'])
@admin_gerekli
def kategoriler_listele():
    return jsonify({'kategoriler': [k.to_dict() for k in Kategori.query.order_by(Kategori.sira).all()]})


@admin_bp.route('/kategoriler', methods=['POST'])
@admin_gerekli
def kategori_ekle():
    data = request.get_json()
    k = Kategori(ad=data['ad'], ikon=data.get('ikon', '🔧'), aciklama=data.get('aciklama', ''))
    db.session.add(k)
    db.session.commit()
    log_kaydet('KATEGORİ_EKLE', f'{k.ad} eklendi')
    return jsonify({'mesaj': 'Kategori eklendi', 'id': k.id}), 201


@admin_bp.route('/kategoriler/<int:id>', methods=['PUT'])
@admin_gerekli
def kategori_guncelle(id):
    k = Kategori.query.get_or_404(id)
    data = request.get_json()
    for alan in ['ad', 'ikon', 'aciklama', 'sira', 'aktif']:
        if alan in data:
            setattr(k, alan, data[alan])
    db.session.commit()
    log_kaydet('KATEGORİ_GUNCELLE', f'#{id} {k.ad} güncellendi')
    return jsonify({'mesaj': 'Güncellendi'})


@admin_bp.route('/kategoriler/<int:id>', methods=['DELETE'])
@admin_gerekli
def kategori_sil(id):
    k = Kategori.query.get_or_404(id)
    ad = k.ad
    db.session.delete(k)
    db.session.commit()
    log_kaydet('KATEGORİ_SIL', f'#{id} {ad} silindi')
    return jsonify({'mesaj': 'Silindi'})


# ─── ADMIN LOG ────────────────────────────────────────────────

@admin_bp.route('/log', methods=['GET'])
@admin_gerekli
def log_listele():
    loglar = AdminLog.query.order_by(AdminLog.tarih.desc()).limit(200).all()
    return jsonify({'loglar': [l.to_dict() for l in loglar]})


# ─── ŞİFRE DEĞİŞTİR ──────────────────────────────────────────

@admin_bp.route('/sifre-degistir', methods=['POST'])
@admin_gerekli
def sifre_degistir():
    data = request.get_json()
    kid = session.get('kullanici_id')
    k = Kullanici.query.get_or_404(kid)
    if not k.sifre_kontrol(data.get('eski_sifre', '')):
        return jsonify({'hata': 'Mevcut şifre hatalı'}), 400
    k.sifre_set(data.get('yeni_sifre'))
    db.session.commit()
    log_kaydet('ŞİFRE_DEĞİŞTİR', 'Admin şifresi değiştirildi')
    return jsonify({'mesaj': 'Şifre güncellendi'})
