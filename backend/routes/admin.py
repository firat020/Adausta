from flask import Blueprint, request, jsonify, session
from models import db, Usta, Yorum, Kategori, Kullanici, AdminLog, Abone, IletisimLog, KategoriGoruntuleme, Plan, Abonelik, Odeme
from functools import wraps
from datetime import datetime, timedelta
from sqlalchemy import func

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


@admin_bp.route('/ustalar/<int:id>/aktifet', methods=['POST'])
@admin_gerekli
def aktifet(id):
    u = Usta.query.get_or_404(id)
    u.aktif = True
    u.onaylanmis = False  # Tekrar incelemeye alınır
    db.session.commit()
    log_kaydet('USTA_YASAK_KALDIR', f'Usta #{id} {u.ad} {u.soyad} yasağı kaldırıldı, beklemede')
    return jsonify({'mesaj': 'Yasak kaldırıldı, usta bekleme listesine alındı'})


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


# ─── ANALİTİK & ABONELER ──────────────────────────────────────

@admin_bp.route('/analitik', methods=['GET'])
@admin_gerekli
def analitik():
    aralik = request.args.get('aralik', '30')  # 7 / 30 / 90
    try:
        gun = int(aralik)
    except ValueError:
        gun = 30
    baslangic = datetime.utcnow() - timedelta(days=gun)

    # ── En çok iletişim kurulan ustalar ──
    iletisim_q = (
        db.session.query(
            IletisimLog.usta_id,
            IletisimLog.tur,
            func.count(IletisimLog.id).label('sayi')
        )
        .filter(IletisimLog.tarih >= baslangic)
        .group_by(IletisimLog.usta_id, IletisimLog.tur)
        .all()
    )

    # Usta bazlı topla
    usta_iletisim = {}
    for row in iletisim_q:
        if row.usta_id not in usta_iletisim:
            usta_iletisim[row.usta_id] = {'ara': 0, 'whatsapp': 0, 'goruntule': 0, 'teklif': 0, 'toplam': 0}
        usta_iletisim[row.usta_id][row.tur] = usta_iletisim[row.usta_id].get(row.tur, 0) + row.sayi
        usta_iletisim[row.usta_id]['toplam'] += row.sayi

    top_ustalar = []
    for uid, bilgi in sorted(usta_iletisim.items(), key=lambda x: x[1]['toplam'], reverse=True)[:15]:
        u = Usta.query.get(uid)
        if u:
            top_ustalar.append({
                'id': uid,
                'ad_soyad': f'{u.ad} {u.soyad}',
                'kategori': u.kategori.ad if u.kategori else '',
                'sehir': u.sehir.ad if u.sehir else '',
                **bilgi,
            })

    # ── Kategori yönelimi (iletişim loglarından) ──
    kat_q = (
        db.session.query(
            IletisimLog.kategori_id,
            func.count(IletisimLog.id).label('sayi')
        )
        .filter(IletisimLog.tarih >= baslangic, IletisimLog.kategori_id.isnot(None))
        .group_by(IletisimLog.kategori_id)
        .order_by(func.count(IletisimLog.id).desc())
        .limit(12)
        .all()
    )
    kategori_yonelim = []
    for row in kat_q:
        k = Kategori.query.get(row.kategori_id)
        if k:
            kategori_yonelim.append({'kategori': k.ad, 'ikon': k.ikon, 'sayi': row.sayi})

    # ── Kategori sayfa görüntülemeleri ──
    kat_goruntuleme_q = (
        db.session.query(
            KategoriGoruntuleme.kategori_id,
            func.count(KategoriGoruntuleme.id).label('sayi')
        )
        .filter(KategoriGoruntuleme.tarih >= baslangic)
        .group_by(KategoriGoruntuleme.kategori_id)
        .order_by(func.count(KategoriGoruntuleme.id).desc())
        .limit(12)
        .all()
    )
    kategori_goruntuleme = []
    for row in kat_goruntuleme_q:
        k = Kategori.query.get(row.kategori_id)
        if k:
            kategori_goruntuleme.append({'kategori': k.ad, 'ikon': k.ikon, 'sayi': row.sayi})

    # ── İletişim türü dağılımı ──
    tur_q = (
        db.session.query(
            IletisimLog.tur,
            func.count(IletisimLog.id).label('sayi')
        )
        .filter(IletisimLog.tarih >= baslangic)
        .group_by(IletisimLog.tur)
        .all()
    )
    tur_dagilim = [{'tur': r.tur, 'sayi': r.sayi} for r in tur_q]

    # ── Şehir bazlı ilgi ──
    sehir_q = (
        db.session.query(
            IletisimLog.sehir,
            func.count(IletisimLog.id).label('sayi')
        )
        .filter(IletisimLog.tarih >= baslangic, IletisimLog.sehir != '')
        .group_by(IletisimLog.sehir)
        .order_by(func.count(IletisimLog.id).desc())
        .all()
    )
    sehir_dagilim = [{'sehir': r.sehir, 'sayi': r.sayi} for r in sehir_q]

    # ── Günlük iletişim trendi ──
    gunluk_trend = []
    gun_sayisi = min(gun, 30)
    for i in range(gun_sayisi - 1, -1, -1):
        g = datetime.utcnow() - timedelta(days=i)
        g_bas = datetime(g.year, g.month, g.day)
        g_bit = g_bas + timedelta(days=1)
        ara_s = IletisimLog.query.filter(
            IletisimLog.tarih >= g_bas, IletisimLog.tarih < g_bit, IletisimLog.tur == 'ara'
        ).count()
        wa_s = IletisimLog.query.filter(
            IletisimLog.tarih >= g_bas, IletisimLog.tarih < g_bit, IletisimLog.tur == 'whatsapp'
        ).count()
        gor_s = IletisimLog.query.filter(
            IletisimLog.tarih >= g_bas, IletisimLog.tarih < g_bit, IletisimLog.tur == 'goruntule'
        ).count()
        gunluk_trend.append({
            'tarih': g.strftime('%d.%m'),
            'ara': ara_s,
            'whatsapp': wa_s,
            'goruntule': gor_s,
            'toplam': ara_s + wa_s + gor_s,
        })

    # ── Toplam sayılar ──
    toplam_iletisim = IletisimLog.query.filter(IletisimLog.tarih >= baslangic).count()
    toplam_abone = Abone.query.filter_by(aktif=True).count()
    yeni_abone = Abone.query.filter(Abone.tarih >= baslangic).count()

    # ── Son aboneler ──
    son_aboneler = [a.to_dict() for a in Abone.query.order_by(Abone.tarih.desc()).limit(10).all()]

    return jsonify({
        'aralik_gun': gun,
        'toplam_iletisim': toplam_iletisim,
        'toplam_abone': toplam_abone,
        'yeni_abone': yeni_abone,
        'top_ustalar': top_ustalar,
        'kategori_yonelim': kategori_yonelim,
        'kategori_goruntuleme': kategori_goruntuleme,
        'tur_dagilim': tur_dagilim,
        'sehir_dagilim': sehir_dagilim,
        'gunluk_trend': gunluk_trend,
        'son_aboneler': son_aboneler,
    })


@admin_bp.route('/aboneler', methods=['GET'])
@admin_gerekli
def aboneler():
    arama = request.args.get('arama', '')
    q = Abone.query
    if arama:
        q = q.filter(Abone.email.ilike(f'%{arama}%') | Abone.ad.ilike(f'%{arama}%'))
    liste = q.order_by(Abone.tarih.desc()).all()
    return jsonify({
        'aboneler': [a.to_dict() for a in liste],
        'toplam': len(liste),
        'aktif': sum(1 for a in liste if a.aktif),
    })


@admin_bp.route('/aboneler/<int:id>', methods=['DELETE'])
@admin_gerekli
def abone_sil(id):
    a = Abone.query.get_or_404(id)
    email = a.email
    db.session.delete(a)
    db.session.commit()
    log_kaydet('ABONE_SIL', f'{email} silindi')
    return jsonify({'mesaj': 'Abone silindi'})


@admin_bp.route('/aboneler/<int:id>/durum', methods=['POST'])
@admin_gerekli
def abone_durum(id):
    a = Abone.query.get_or_404(id)
    a.aktif = not a.aktif
    db.session.commit()
    durum = 'aktifleştirildi' if a.aktif else 'devre dışı bırakıldı'
    log_kaydet('ABONE_DURUM', f'{a.email} {durum}')
    return jsonify({'aktif': a.aktif, 'mesaj': f'Abone {durum}'})


# ─── MALİ ÖZET ────────────────────────────────────────────────

@admin_bp.route('/mali/ozet', methods=['GET'])
@admin_gerekli
def mali_ozet():
    bugun = datetime.utcnow()
    bu_ay = datetime(bugun.year, bugun.month, 1)
    gecen_ay_son = bu_ay - timedelta(seconds=1)
    gecen_ay_bas = datetime(gecen_ay_son.year, gecen_ay_son.month, 1)

    toplam_ciro = db.session.query(func.sum(Odeme.tutar)).filter_by(durum='basarili').scalar() or 0
    bu_ay_ciro = db.session.query(func.sum(Odeme.tutar)).filter(
        Odeme.durum == 'basarili', Odeme.tarih >= bu_ay
    ).scalar() or 0
    gecen_ay_ciro = db.session.query(func.sum(Odeme.tutar)).filter(
        Odeme.durum == 'basarili', Odeme.tarih >= gecen_ay_bas, Odeme.tarih < bu_ay
    ).scalar() or 0

    aktif_abone = Abonelik.query.filter_by(durum='aktif').count()
    bekleyen_tahsilat = db.session.query(func.sum(Odeme.tutar)).filter_by(durum='bekliyor').scalar() or 0

    # Döviz bazlı gelir
    usd_toplam = db.session.query(func.sum(Odeme.tutar)).filter(
        Odeme.durum == 'basarili', Odeme.para_birimi == 'USD'
    ).scalar() or 0
    try_toplam = db.session.query(func.sum(Odeme.tutar)).filter(
        Odeme.durum == 'basarili', Odeme.para_birimi == 'TRY'
    ).scalar() or 0
    usd_bu_ay = db.session.query(func.sum(Odeme.tutar)).filter(
        Odeme.durum == 'basarili', Odeme.para_birimi == 'USD', Odeme.tarih >= bu_ay
    ).scalar() or 0
    try_bu_ay = db.session.query(func.sum(Odeme.tutar)).filter(
        Odeme.durum == 'basarili', Odeme.para_birimi == 'TRY', Odeme.tarih >= bu_ay
    ).scalar() or 0

    # 3 gün içinde yenilenecek abonelikler
    uc_gun_sonra = bugun + timedelta(days=3)
    yaklasan_yenileme = Abonelik.query.filter(
        Abonelik.durum == 'aktif',
        Abonelik.yenileme_tarihi <= uc_gun_sonra,
        Abonelik.yenileme_tarihi >= bugun
    ).count()

    # Son 6 ay gelir trendi (area chart için)
    aylik_gelir = []
    for i in range(5, -1, -1):
        if bugun.month - i <= 0:
            yil = bugun.year - 1
            ay = bugun.month - i + 12
        else:
            yil = bugun.year
            ay = bugun.month - i
        bas = datetime(yil, ay, 1)
        if ay == 12:
            bit = datetime(yil + 1, 1, 1)
        else:
            bit = datetime(yil, ay + 1, 1)
        gelir = db.session.query(func.sum(Odeme.tutar)).filter(
            Odeme.durum == 'basarili', Odeme.tarih >= bas, Odeme.tarih < bit
        ).scalar() or 0
        aylik_gelir.append({'ay': bas.strftime('%b %Y'), 'gelir': round(gelir, 2)})

    return jsonify({
        'toplam_ciro': round(toplam_ciro, 2),
        'bu_ay_ciro': round(bu_ay_ciro, 2),
        'gecen_ay_ciro': round(gecen_ay_ciro, 2),
        'aktif_abone': aktif_abone,
        'bekleyen_tahsilat': round(bekleyen_tahsilat, 2),
        'yaklasan_yenileme': yaklasan_yenileme,
        'aylik_gelir': aylik_gelir,
        'usd_toplam': round(usd_toplam, 2),
        'try_toplam': round(try_toplam, 2),
        'usd_bu_ay': round(usd_bu_ay, 2),
        'try_bu_ay': round(try_bu_ay, 2),
    })


# ─── PLAN YÖNETİMİ ─────────────────────────────────────────────

@admin_bp.route('/planlar', methods=['GET'])
@admin_gerekli
def planlar_listele():
    return jsonify({'planlar': [p.to_dict() for p in Plan.query.order_by(Plan.fiyat).all()]})


@admin_bp.route('/planlar', methods=['POST'])
@admin_gerekli
def plan_ekle():
    data = request.get_json()
    p = Plan(
        ad=data['ad'],
        fiyat=data.get('fiyat', 0),
        sure_tip=data.get('sure_tip', 'aylik'),
        ilan_siniri=data.get('ilan_siniri', 1),
        one_cikma=data.get('one_cikma', False),
    )
    db.session.add(p)
    db.session.commit()
    log_kaydet('PLAN_EKLE', f'{p.ad} planı eklendi')
    return jsonify({'mesaj': 'Plan eklendi', 'plan': p.to_dict()}), 201


@admin_bp.route('/planlar/<int:id>', methods=['PUT'])
@admin_gerekli
def plan_guncelle(id):
    p = Plan.query.get_or_404(id)
    data = request.get_json()
    for alan in ['ad', 'fiyat', 'sure_tip', 'ilan_siniri', 'one_cikma', 'aktif']:
        if alan in data:
            setattr(p, alan, data[alan])
    db.session.commit()
    log_kaydet('PLAN_GUNCELLE', f'#{id} {p.ad} güncellendi')
    return jsonify({'mesaj': 'Güncellendi', 'plan': p.to_dict()})


@admin_bp.route('/planlar/<int:id>', methods=['DELETE'])
@admin_gerekli
def plan_sil(id):
    p = Plan.query.get_or_404(id)
    ad = p.ad
    db.session.delete(p)
    db.session.commit()
    log_kaydet('PLAN_SIL', f'#{id} {ad} silindi')
    return jsonify({'mesaj': 'Silindi'})


# ─── ABONELİK YÖNETİMİ ────────────────────────────────────────

@admin_bp.route('/abonelik-listesi', methods=['GET'])
@admin_gerekli
def abonelik_listesi():
    filtre = request.args.get('filtre', 'hepsi')
    arama = request.args.get('arama', '')
    q = Abonelik.query
    if filtre != 'hepsi':
        q = q.filter_by(durum=filtre)
    liste = q.order_by(Abonelik.olusturma.desc()).all()
    if arama:
        liste = [a for a in liste if arama.lower() in (a.usta.ad + ' ' + a.usta.soyad).lower()]
    return jsonify({'abonelikler': [a.to_dict() for a in liste]})


@admin_bp.route('/abonelik-listesi', methods=['POST'])
@admin_gerekli
def abonelik_ekle():
    data = request.get_json()
    plan = Plan.query.get_or_404(data['plan_id'])
    bas = datetime.utcnow()
    if plan.sure_tip == 'yillik':
        bit = bas.replace(year=bas.year + 1)
    else:
        if bas.month == 12:
            bit = bas.replace(year=bas.year + 1, month=1)
        else:
            bit = bas.replace(month=bas.month + 1)
    a = Abonelik(
        usta_id=data['usta_id'],
        plan_id=data['plan_id'],
        baslangic=bas,
        bitis=bit,
        yenileme_tarihi=bit,
        durum='aktif',
    )
    db.session.add(a)
    # Ustanın plan bilgisini güncelle
    usta = Usta.query.get(data['usta_id'])
    if usta:
        usta.plan = plan.ad.lower()
        usta.plan_bitis = bit
    db.session.commit()
    log_kaydet('ABONELİK_EKLE', f'Usta #{data["usta_id"]} için {plan.ad} aboneliği oluşturuldu')
    return jsonify({'mesaj': 'Abonelik oluşturuldu', 'abonelik': a.to_dict()}), 201


@admin_bp.route('/abonelik-listesi/<int:id>/durum', methods=['POST'])
@admin_gerekli
def abonelik_durum(id):
    a = Abonelik.query.get_or_404(id)
    data = request.get_json()
    yeni_durum = data.get('durum')
    if yeni_durum not in ['aktif', 'askida', 'iptal']:
        return jsonify({'hata': 'Geçersiz durum'}), 400
    a.durum = yeni_durum
    # Ustanın durumunu da güncelle
    if a.usta:
        if yeni_durum == 'askida':
            a.usta.aktif = False
        elif yeni_durum == 'aktif':
            a.usta.aktif = True
    db.session.commit()
    log_kaydet('ABONELİK_DURUM', f'Abonelik #{id} → {yeni_durum}')
    return jsonify({'mesaj': f'Abonelik durumu güncellendi: {yeni_durum}'})


# ─── ÖDEME GEÇMİŞİ ────────────────────────────────────────────

@admin_bp.route('/odemeler', methods=['GET'])
@admin_gerekli
def odemeler_listele():
    filtre = request.args.get('filtre', 'hepsi')
    arama = request.args.get('arama', '')
    q = Odeme.query
    if filtre != 'hepsi':
        q = q.filter_by(durum=filtre)
    liste = q.order_by(Odeme.tarih.desc()).all()
    if arama:
        liste = [o for o in liste if arama.lower() in (o.usta.ad + ' ' + o.usta.soyad).lower()]
    return jsonify({'odemeler': [o.to_dict() for o in liste]})


@admin_bp.route('/odemeler', methods=['POST'])
@admin_gerekli
def odeme_ekle():
    data = request.get_json()
    o = Odeme(
        usta_id=data['usta_id'],
        abonelik_id=data.get('abonelik_id'),
        tutar=data['tutar'],
        durum=data.get('durum', 'basarili'),
        aciklama=data.get('aciklama', ''),
    )
    db.session.add(o)
    # Ödeme başarılıysa aboneliği aktifleştir
    if o.durum == 'basarili' and data.get('abonelik_id'):
        ab = Abonelik.query.get(data['abonelik_id'])
        if ab:
            ab.durum = 'aktif'
            if ab.usta:
                ab.usta.aktif = True
    db.session.commit()
    log_kaydet('ÖDEME_EKLE', f'Usta #{data["usta_id"]} için {data["tutar"]} TL ödeme kaydı')
    return jsonify({'mesaj': 'Ödeme kaydedildi', 'odeme': o.to_dict()}), 201


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
