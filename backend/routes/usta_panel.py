from flask import Blueprint, request, jsonify, session
from models import db, Kullanici, Usta, IsTalebi, IletisimLog, Yorum, Fotograf, Kategori, Sehir, Ilce, Abonelik, Mesaj, UstaBelge, AdminBildirim, Plan, Odeme, Referans, PromosyonSatis, FCMToken, UstaEkipUyesi, UstaSertifika, UstaOdul, IsTalebiMesaj, HizmetOnerisi
from extensions import limiter
from datetime import datetime, timedelta
from functools import wraps
import uuid, os
from promosyon import PROMO_FIYATLARI, PROMO_ACIKLAMA, REFERANS_BONUS_GUN, referans_kodu
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

    # Zengin profil alanları (profil_ekstra JSON) — doğrulanarak kaydedilir
    ekstra = {}
    if 'diller' in data:
        ekstra['diller'] = [d for d in (data['diller'] or []) if d in Usta.EKSTRA_DILLER][:8]
    if 'odeme_yontemleri' in data:
        ekstra['odeme_yontemleri'] = [o for o in (data['odeme_yontemleri'] or []) if o in Usta.EKSTRA_ODEME]
    if 'yedi_yirmi_dort' in data:
        ekstra['yedi_yirmi_dort'] = bool(data['yedi_yirmi_dort'])
    if 'web_sitesi' in data:
        site = str(data['web_sitesi'] or '').strip()[:200]
        if site and not site.lower().startswith(('http://', 'https://')):
            site = 'https://' + site
        ekstra['web_sitesi'] = site
    if 'calisma_saatleri' in data:
        saatler = {}
        gelen = data['calisma_saatleri'] or {}
        for gun in '0123456':
            g = gelen.get(gun)
            if not isinstance(g, dict):
                continue
            bas, bit = str(g.get('bas', ''))[:5], str(g.get('bit', ''))[:5]
            saat_ok = lambda x: len(x) == 5 and x[2] == ':' and x[:2].isdigit() and x[3:].isdigit()
            if g.get('kapali'):
                saatler[gun] = {'kapali': True}
            elif saat_ok(bas) and saat_ok(bit):
                saatler[gun] = {'kapali': False, 'bas': bas, 'bit': bit}
        ekstra['calisma_saatleri'] = saatler
    if ekstra:
        usta.ekstra_guncelle(**ekstra)

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


@usta_panel_bp.route('/profil/logo', methods=['POST'])
@usta_gerekli
def logo_yukle(usta):
    if 'dosya' not in request.files:
        return jsonify({'hata': 'Dosya seçilmedi'}), 400
    f = request.files['dosya']
    ext = f.filename.rsplit('.', 1)[-1].lower()
    if ext not in IZIN_UZANTILAR:
        return jsonify({'hata': 'Desteklenmeyen dosya türü'}), 400
    ad = f'logo_{uuid.uuid4().hex}.{ext}'
    f.save(os.path.join(UPLOAD_FOLDER, ad))
    eski = usta.logo
    usta.logo = ad
    db.session.commit()
    if eski:
        eski_yol = os.path.join(UPLOAD_FOLDER, eski)
        if os.path.exists(eski_yol):
            os.remove(eski_yol)
    return jsonify({'mesaj': 'Logo yüklendi', 'logo': ad, 'logo_url': f'/uploads/{ad}'}), 201


@usta_panel_bp.route('/profil/logo', methods=['DELETE'])
@usta_gerekli
def logo_sil(usta):
    if usta.logo:
        yol = os.path.join(UPLOAD_FOLDER, usta.logo)
        if os.path.exists(yol):
            os.remove(yol)
        usta.logo = ''
        db.session.commit()
    return jsonify({'mesaj': 'Logo silindi'})


@usta_panel_bp.route('/profil/kapak', methods=['POST'])
@usta_gerekli
def kapak_yukle(usta):
    if 'dosya' not in request.files:
        return jsonify({'hata': 'Dosya seçilmedi'}), 400
    f = request.files['dosya']
    ext = f.filename.rsplit('.', 1)[-1].lower()
    if ext not in IZIN_UZANTILAR:
        return jsonify({'hata': 'Desteklenmeyen dosya türü'}), 400
    ad = f'kapak_{uuid.uuid4().hex}.{ext}'
    f.save(os.path.join(UPLOAD_FOLDER, ad))
    eski = usta.ekstra().get('kapak')
    usta.ekstra_guncelle(kapak=ad)
    db.session.commit()
    if eski:
        eski_yol = os.path.join(UPLOAD_FOLDER, eski)
        if os.path.exists(eski_yol):
            os.remove(eski_yol)
    return jsonify({'mesaj': 'Kapak görseli yüklendi', 'kapak_url': f'/uploads/{ad}'}), 201


@usta_panel_bp.route('/profil/kapak', methods=['DELETE'])
@usta_gerekli
def kapak_sil(usta):
    eski = usta.ekstra().get('kapak')
    if eski:
        yol = os.path.join(UPLOAD_FOLDER, eski)
        if os.path.exists(yol):
            os.remove(yol)
        usta.ekstra_guncelle(kapak='')
        db.session.commit()
    return jsonify({'mesaj': 'Kapak görseli silindi'})


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
    # Her talep için müşteriden gelen okunmamış mesaj sayısı (kart üzerinde rozet için)
    okunmamis_map = dict(
        db.session.query(IsTalebiMesaj.is_talebi_id, db.func.count(IsTalebiMesaj.id))
        .filter(IsTalebiMesaj.is_talebi_id.in_([t.id for t in talepler]), IsTalebiMesaj.gonderen == 'musteri', IsTalebiMesaj.okundu == False)  # noqa: E712
        .group_by(IsTalebiMesaj.is_talebi_id).all()
    ) if talepler else {}
    sonuc = []
    for t in talepler:
        d = t.to_dict()
        d['mesaj_okunmamis'] = okunmamis_map.get(t.id, 0)
        sonuc.append(d)
    return jsonify({'talepler': sonuc})


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
    """Analitik: gösterim -> profil görüntüleme -> iletişim hunisi, önceki dönemle karşılaştırma,
    gün/hafta bazlı seri. Tek gruplu sorgu kullanır (eski sürüm gün sayısı x 3 sorgu çalıştırıyordu)."""
    from sqlalchemy import func
    from models import AnalitikGosterim
    try:
        aralik = int(request.args.get('aralik', 30))
    except ValueError:
        aralik = 30
    aralik = aralik if aralik in (7, 30, 90, 365) else 30

    bugun = datetime.utcnow().date()
    bas_gun = bugun - timedelta(days=aralik - 1)
    onceki_bas = bas_gun - timedelta(days=aralik)
    bas_dt = datetime.combine(onceki_bas, datetime.min.time())

    # İletişim kayıtları: (gün, tür) -> adet — hem bu hem önceki dönem için tek sorgu
    satirlar = db.session.query(func.date(IletisimLog.tarih), IletisimLog.tur, func.count(IletisimLog.id)) \
        .filter(IletisimLog.usta_id == usta.id, IletisimLog.tarih >= bas_dt) \
        .group_by(func.date(IletisimLog.tarih), IletisimLog.tur).all()
    gosterim_satirlar = db.session.query(AnalitikGosterim.gun, AnalitikGosterim.adet) \
        .filter(AnalitikGosterim.usta_id == usta.id, AnalitikGosterim.gun >= onceki_bas).all()

    TURLER = ('ara', 'whatsapp', 'goruntule', 'teklif', 'favori', 'paylas', 'gosterim', 'web_sitesi')
    gunluk = {}  # 'YYYY-MM-DD' -> {tur: adet}
    for gun, tur, adet in satirlar:
        gunluk.setdefault(str(gun), {})[tur] = adet
    for gun, adet in gosterim_satirlar:
        gunluk.setdefault(str(gun), {})['gosterim'] = adet

    def topla(baslangic, bitis):
        t = {k: 0 for k in TURLER}
        gun = baslangic
        while gun <= bitis:
            for k, v in gunluk.get(gun.isoformat(), {}).items():
                t[k] = t.get(k, 0) + v
            gun += timedelta(days=1)
        t['iletisim'] = t['ara'] + t['whatsapp'] + t['teklif']
        return t

    ozet = topla(bas_gun, bugun)
    onceki = topla(onceki_bas, bas_gun - timedelta(days=1))

    # Seri: 365 günde haftalık, diğerlerinde günlük
    kova = 7 if aralik == 365 else 1
    seri = []
    gun = bas_gun
    while gun <= bugun:
        son = min(gun + timedelta(days=kova - 1), bugun)
        t = topla(gun, son)
        seri.append({'gun': gun.strftime('%d.%m'), 'gosterim': t['gosterim'], 'goruntule': t['goruntule'],
                     'ara': t['ara'], 'whatsapp': t['whatsapp'], 'teklif': t['teklif'], 'iletisim': t['iletisim']})
        gun = son + timedelta(days=1)

    def oran(pay, payda):
        return round(min(pay / payda * 100, 100), 1) if payda else 0

    huni = {
        'gosterim': ozet['gosterim'], 'goruntule': ozet['goruntule'], 'iletisim': ozet['iletisim'],
        'goruntule_orani': oran(ozet['goruntule'], ozet['gosterim']),
        'iletisim_orani': oran(ozet['iletisim'], ozet['goruntule']),
    }

    # Dile göre talep kırılımı (seçilen aralık) — sadece dolu 'dil' kayıtları sayılır, boş/None toplanmaz
    bas_gun_dt = datetime.combine(bas_gun, datetime.min.time())
    dil_satirlar = db.session.query(IletisimLog.dil, func.count(IletisimLog.id)) \
        .filter(IletisimLog.usta_id == usta.id, IletisimLog.tarih >= bas_gun_dt) \
        .filter(IletisimLog.dil.isnot(None), IletisimLog.dil != '') \
        .group_by(IletisimLog.dil).all()
    dil_dagilim = {dil: adet for dil, adet in dil_satirlar}

    # Talep durum dağılımı (seçilen aralık)
    durum_dagilim = {d: IsTalebi.query.filter(IsTalebi.usta_id == usta.id, IsTalebi.olusturma >= bas_gun_dt).filter_by(durum=d).count()
                     for d in ['bekliyor', 'kabul', 'red', 'tamamlandi']}

    # Yorumlar
    yorumlar = Yorum.query.filter_by(usta_id=usta.id, onaylanmis=True).order_by(Yorum.tarih.desc()).all()
    puan_dagilim = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for y in yorumlar:
        puan_dagilim[y.puan] = puan_dagilim.get(y.puan, 0) + 1

    return jsonify({
        'aralik': aralik,
        'ozet': ozet, 'onceki': onceki, 'huni': huni, 'seri': seri,
        'gunluk_iletisim': seri,   # eski alan adı (geriye dönük uyumluluk)
        'dil_dagilim': dil_dagilim,
        'durum_dagilim': durum_dagilim,
        'puan_dagilim': puan_dagilim,
        'toplam_yorum': len(yorumlar),
        'ort_puan': usta.ortalama_puan(),
        'yorumlar': [y.to_dict() for y in yorumlar[:20]],
    })


# ──────────────────────────────────────────────────────────
# Öne çıkarma performansı — satın alınan promosyonların döneminde
# elde edilen gösterim/iletişim sayıları (basit toplam, "lift" hesabı yok)
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/promosyon-performans', methods=['GET'])
@usta_gerekli
def promosyon_performans(usta):
    from sqlalchemy import func
    from models import AnalitikGosterim

    simdi = datetime.utcnow()
    promosyonlar = (
        PromosyonSatis.query
        .filter_by(usta_id=usta.id)
        .filter(PromosyonSatis.durum.in_(['aktif', 'iptal']))
        .filter(PromosyonSatis.baslangic.isnot(None))
        .order_by(PromosyonSatis.baslangic.desc())
        .limit(10)
        .all()
    )

    sonuc = []
    for p in promosyonlar:
        bitis_eff = min(p.bitis, simdi) if p.bitis else simdi
        aktif_mi = p.durum == 'aktif' and (not p.bitis or p.bitis >= simdi)

        gosterim_toplam = db.session.query(func.sum(AnalitikGosterim.adet)).filter(
            AnalitikGosterim.usta_id == usta.id,
            AnalitikGosterim.gun >= p.baslangic.date(),
            AnalitikGosterim.gun <= bitis_eff.date(),
        ).scalar() or 0

        iletisim_toplam = IletisimLog.query.filter(
            IletisimLog.usta_id == usta.id,
            IletisimLog.tarih >= p.baslangic,
            IletisimLog.tarih <= bitis_eff,
            IletisimLog.tur.in_(['ara', 'whatsapp', 'teklif']),
        ).count()

        sonuc.append({
            'id': p.id,
            'tur': p.tur,  # profil / hizmet / vitrin
            'kategori_ad': p.kategori.ad if p.kategori else None,
            'baslangic': p.baslangic.strftime('%d.%m.%Y'),
            'bitis': p.bitis.strftime('%d.%m.%Y') if p.bitis else None,
            'durum': p.durum,
            'aktif_mi': aktif_mi,
            'gosterim': int(gosterim_toplam),
            'iletisim': iletisim_toplam,
        })

    return jsonify({'promosyonlar': sonuc})


# ──────────────────────────────────────────────────────────
# Ayarlar: bildirim tercihleri, şifre, hesap kapatma
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/ayarlar', methods=['GET'])
@usta_gerekli
def ayarlar_getir(usta):
    k = Kullanici.query.get(usta.kullanici_id)
    return jsonify({
        'email': k.email if k else '',
        'telefon': usta.telefon,
        'bildirim': usta.bildirim_tercihi(),
        'tercih_dil': usta.ekstra().get('tercih_dil') or 'tr',
        'push_cihaz_sayisi': FCMToken.query.filter_by(kullanici_id=usta.kullanici_id, aktif=True).count(),
    })


@usta_panel_bp.route('/ayarlar', methods=['PUT'])
@usta_gerekli
def ayarlar_kaydet(usta):
    data = request.get_json(silent=True) or {}
    gelen = data.get('bildirim')
    if not isinstance(gelen, dict):
        return jsonify({'hata': 'Geçersiz istek'}), 400
    tercih = usta.bildirim_tercihi()
    for anahtar in Usta.VARSAYILAN_BILDIRIM:
        if isinstance(gelen.get(anahtar), bool):
            tercih[anahtar] = gelen[anahtar]

    guncellenecek = {'bildirim': tercih}
    tercih_dil = data.get('tercih_dil')
    if tercih_dil is not None:
        if tercih_dil not in Usta.EKSTRA_DILLER:
            return jsonify({'hata': 'Geçersiz dil'}), 400
        guncellenecek['tercih_dil'] = tercih_dil

    usta.ekstra_guncelle(**guncellenecek)
    db.session.commit()
    return jsonify({'mesaj': 'Ayarlar kaydedildi', 'bildirim': tercih, 'tercih_dil': usta.ekstra().get('tercih_dil') or 'tr'})


@usta_panel_bp.route('/sifre-degistir', methods=['POST'])
@limiter.limit('5 per minute; 20 per hour')
@usta_gerekli
def sifre_degistir(usta):
    data = request.get_json(silent=True) or {}
    eski, yeni = data.get('eski_sifre', ''), data.get('yeni_sifre', '')
    k = Kullanici.query.get(usta.kullanici_id)
    if not k or not k.sifre_kontrol(eski):
        return jsonify({'hata': 'Mevcut şifre hatalı'}), 400
    if len(yeni) < 8:
        return jsonify({'hata': 'Yeni şifre en az 8 karakter olmalı'}), 400
    if yeni == eski:
        return jsonify({'hata': 'Yeni şifre eskisiyle aynı olamaz'}), 400
    k.sifre_set(yeni)
    db.session.commit()
    return jsonify({'mesaj': 'Şifreniz güncellendi'})


@usta_panel_bp.route('/hesap-kapat', methods=['POST'])
@limiter.limit('3 per hour')
@usta_gerekli
def hesap_kapat(usta):
    """Hesabı kapatır: profil yayından kalkar ve giriş devre dışı kalır. Veriler SİLİNMEZ
    (yorumlar, talepler, ödeme kayıtları korunur); geri açma / kalıcı silme için destek gerekir."""
    data = request.get_json(silent=True) or {}
    k = Kullanici.query.get(usta.kullanici_id)
    if not k or not k.sifre_kontrol(data.get('sifre', '')):
        return jsonify({'hata': 'Şifre hatalı'}), 400
    usta.aktif = False
    usta.musaitlik = False
    k.aktif = False
    db.session.add(AdminBildirim(tur='hesap_kapatma', mesaj=f'Usta hesabını kapattı: {usta.ad} {usta.soyad} (#{usta.id}) — {usta.telefon}'))
    db.session.commit()
    session.clear()
    return jsonify({'mesaj': 'Hesabınız kapatıldı'})


# ──────────────────────────────────────────────────────────
# Yorumlar listesi (usta paneli için)
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/yorumlar', methods=['GET'])
@usta_gerekli
def yorumlar(usta):
    tum = Yorum.query.filter_by(usta_id=usta.id)\
        .order_by(Yorum.tarih.desc()).all()
    return jsonify({
        'yorumlar': [y.to_dict() for y in tum],
        'alt_puanlar': usta.ortalama_alt_puanlar(),
    })


# ──────────────────────────────────────────────────────────
# Kategoriler — usta kendi kategorilerini görür
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/kategorilerim', methods=['GET'])
@usta_gerekli
def kategorilerim(usta):
    ana = {'id': usta.kategori_id, 'ad': usta.kategori.ad, 'ikon': usta.kategori.ikon} if usta.kategori else None
    ek = [{'id': k.id, 'ad': k.ad, 'ikon': k.ikon} for k in usta.ek_kategoriler]
    return jsonify({'ana_kategori': ana, 'ek_kategoriler': ek})


# ──────────────────────────────────────────────────────────
# Hizmetlerim: ustanın kendi hizmetlerini (ek kategoriler) yönetmesi + hizmet bazlı fiyat / uzmanlık / 7-24
# Ana kategori değişmez (değişiklik için admin). Toplam hizmet sayısı MAX_TOPLAM_HIZMET ile sınırlı.
# ──────────────────────────────────────────────────────────
def _hizmetlerim_cevap(usta):
    ek = usta.ekstra()
    kayitlar = []
    if usta.kategori:
        kayitlar.append((usta.kategori, True))
    kayitlar += [(k, False) for k in usta.ek_kategoriler if k.id != usta.kategori_id]
    aktif_promo = {p['kategori_id'] for p in usta.aktif_promosyonlar() if p['tur'] == 'hizmet'}
    return {
        'hizmetler': [dict({'id': k.id, 'ad': k.ad, 'ikon': k.ikon, 'grup': k.grup, 'ana': ana,
                            'promosyon_aktif': k.id in aktif_promo}, **Usta._hizmet_detay_ek(ek, k.id)) for k, ana in kayitlar],
        'limit': Usta.MAX_TOPLAM_HIZMET, 'max_uzmanlik': Usta.MAX_UZMANLIK,
    }


@usta_panel_bp.route('/hizmetlerim', methods=['GET'])
@usta_gerekli
def hizmetlerim_getir(usta):
    return jsonify(_hizmetlerim_cevap(usta))


@usta_panel_bp.route('/hizmetlerim', methods=['PUT'])
@usta_gerekli
def hizmetlerim_kaydet(usta):
    data = request.get_json(silent=True) or {}
    istenen = data.get('ek_kategori_ids')
    detaylar = data.get('detaylar') or {}
    if not isinstance(istenen, list) or not isinstance(detaylar, dict):
        return jsonify({'hata': 'Geçersiz istek'}), 400
    try:
        istenen_idler = []
        for i in istenen:
            i = int(i)
            if i != usta.kategori_id and i not in istenen_idler:
                istenen_idler.append(i)
    except (TypeError, ValueError):
        return jsonify({'hata': 'Geçersiz hizmet'}), 400

    kategoriler = Kategori.query.filter(Kategori.id.in_(istenen_idler), Kategori.aktif == True).all() if istenen_idler else []  # noqa: E712
    if len(kategoriler) != len(istenen_idler):
        return jsonify({'hata': 'Seçilen hizmetlerden biri bulunamadı'}), 400

    mevcut_ek = {k.id for k in usta.ek_kategoriler if k.id != usta.kategori_id}
    toplam = 1 + len(istenen_idler)
    eski_toplam = 1 + len(mevcut_ek)
    # Limit yeni eklemeleri sınırlar; limitin üstünde hizmeti olan eski ustalar mevcut sayıları kadar tutabilir
    if toplam > max(Usta.MAX_TOPLAM_HIZMET, eski_toplam):
        return jsonify({'hata': f'En fazla {Usta.MAX_TOPLAM_HIZMET} hizmet ekleyebilirsin (ana hizmet dahil)'}), 400

    # Aktif öne çıkarması (ödenmiş) olan hizmet, süre bitmeden kaldırılamaz
    kaldirilan = mevcut_ek - set(istenen_idler)
    kilitli = [p['kategori_id'] for p in usta.aktif_promosyonlar() if p['tur'] == 'hizmet' and p['kategori_id'] in kaldirilan]
    if kilitli:
        ad = next((k.ad for k in usta.ek_kategoriler if k.id == kilitli[0]), 'Bu hizmet')
        return jsonify({'hata': f'"{ad}" için aktif öne çıkarman var; süresi bitince kaldırabilirsin'}), 400

    gecerli_idler = {usta.kategori_id} | set(istenen_idler)
    temiz = {}
    uzmanlik_sayisi = 0
    for kid_str, d in detaylar.items():
        try:
            kid = int(kid_str)
        except (TypeError, ValueError):
            continue
        if kid not in gecerli_idler or not isinstance(d, dict):
            continue
        fiyat = ' '.join(str(d.get('fiyat') or '').split())[:60]
        uzmanlik = bool(d.get('uzmanlik'))
        if uzmanlik:
            uzmanlik_sayisi += 1
        temiz[str(kid)] = {'fiyat': fiyat, 'uzmanlik': uzmanlik, 'yedi_yirmi_dort': bool(d.get('yedi_yirmi_dort'))}
    if uzmanlik_sayisi > Usta.MAX_UZMANLIK:
        return jsonify({'hata': f'En fazla {Usta.MAX_UZMANLIK} hizmeti "Uzmanlık" olarak işaretleyebilirsin'}), 400

    usta.ek_kategoriler = kategoriler
    usta.ekstra_guncelle(hizmetler=temiz)
    db.session.commit()
    cevap = _hizmetlerim_cevap(usta)
    cevap['mesaj'] = 'Hizmetlerin güncellendi'
    return jsonify(cevap)


# ──────────────────────────────────────────────────────────
# Hizmet Bölgesi: ustanın kendi ilçesi dışında hizmet verdiği ek ilçeleri kendi
# panelinden işaretlemesi (profil_ekstra['hizmet_bolgeleri'] — migrasyon gerekmez).
# Seçenekler ustanın kendi şehrinin ilçeleriyle sınırlı tutulur.
# ──────────────────────────────────────────────────────────
MAX_HIZMET_BOLGESI = 8  # kendi ilçesi dahil en fazla kaç ilçe işaretlenebilir

@usta_panel_bp.route('/hizmet-bolgesi', methods=['GET'])
@usta_gerekli
def hizmet_bolgesi_getir(usta):
    secili = [i['id'] for i in usta.hizmet_bolgesi_ilceleri()]
    ilceler = Ilce.query.filter_by(sehir_id=usta.sehir_id).order_by(Ilce.ad).all() if usta.sehir_id else []
    return jsonify({
        'kendi_ilce_id': usta.ilce_id,
        'secili_ilce_ids': secili,
        'secenekler': [{'id': i.id, 'ad': i.ad} for i in ilceler],
        'limit': MAX_HIZMET_BOLGESI,
    })


@usta_panel_bp.route('/hizmet-bolgesi', methods=['PUT'])
@usta_gerekli
def hizmet_bolgesi_kaydet(usta):
    data = request.get_json(silent=True) or {}
    istenen = data.get('ilce_ids')
    if not isinstance(istenen, list):
        return jsonify({'hata': 'Geçersiz istek'}), 400
    try:
        istenen_idler = {int(i) for i in istenen}
    except (TypeError, ValueError):
        return jsonify({'hata': 'Geçersiz ilçe'}), 400

    istenen_idler.discard(usta.ilce_id)  # kendi ilçesi zaten örtülü dahil, ayrıca tutulmaz
    if len(istenen_idler) + 1 > MAX_HIZMET_BOLGESI:
        return jsonify({'hata': f'En fazla {MAX_HIZMET_BOLGESI} ilçe seçebilirsin (kendi ilçen dahil)'}), 400

    if istenen_idler:
        bulunan = Ilce.query.filter(Ilce.id.in_(istenen_idler), Ilce.sehir_id == usta.sehir_id).all()
        if len(bulunan) != len(istenen_idler):
            return jsonify({'hata': 'Seçilen bölgelerden biri geçersiz'}), 400

    usta.ekstra_guncelle(hizmet_bolgeleri=sorted(istenen_idler))
    db.session.commit()
    return jsonify({'mesaj': 'Hizmet bölgen güncellendi', 'hizmet_bolgesi_ilceler': usta.hizmet_bolgesi_ilceleri()})


# ──────────────────────────────────────────────────────────
# İş talebi okundu işaretle
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/is-talepleri/<int:tid>/okundu', methods=['POST'])
@usta_gerekli
def talep_okundu(usta, tid):
    talep = IsTalebi.query.filter_by(id=tid, usta_id=usta.id).first_or_404()
    talep.okundu = True
    db.session.commit()
    return jsonify({'mesaj': 'Okundu'})


# ──────────────────────────────────────────────────────────
# Okunmamış talep sayısı (badge için)
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/okunmamis-sayisi', methods=['GET'])
@usta_gerekli
def okunmamis_sayisi(usta):
    sayi = IsTalebi.query.filter_by(usta_id=usta.id, okundu=False).count()
    return jsonify({'sayi': sayi})


# ──────────────────────────────────────────────────────────
# Abonelik durumu (güncel plan + otomatik yenileme bilgisi)
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/abonelik', methods=['GET'])
@usta_gerekli
def abonelik_durumu(usta):
    ab = (
        Abonelik.query.filter_by(usta_id=usta.id, durum='aktif').order_by(Abonelik.id.desc()).first()
        or Abonelik.query.filter_by(usta_id=usta.id, durum='askida').order_by(Abonelik.id.desc()).first()
    )
    return jsonify({
        'plan': usta.plan,
        'plan_bitis': usta.plan_bitis.isoformat() if usta.plan_bitis else None,
        'kayitli_kart_var': bool(usta.cardplus_safekey),
        'abonelik': ab.to_dict() if ab else None,
    })


# ──────────────────────────────────────────────────────────
# Abonelik ve Öne Çıkarma sayfası için tek çağrıda özet:
# planlar, mevcut abonelik, profil durumu, öne çıkarma ürünleri, ödeme geçmişi, referans
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/abonelik/ozet', methods=['GET'])
@usta_gerekli
def abonelik_ozet(usta):
    simdi = datetime.utcnow()
    ab = (
        Abonelik.query.filter_by(usta_id=usta.id, durum='aktif').order_by(Abonelik.id.desc()).first()
        or Abonelik.query.filter_by(usta_id=usta.id, durum='askida').order_by(Abonelik.id.desc()).first()
    )
    kalan_gun = max(0, (usta.plan_bitis - simdi).days) if usta.plan_bitis else 0

    planlar = Plan.query.filter_by(aktif=True).order_by(Plan.fiyat).all()
    aylik = next((p for p in planlar if p.sure_tip == 'aylik'), None)
    plan_listesi = []
    for p in planlar:
        ay = max(1, round(p.sure_gun() / 30))
        aylik_fiyat = round(p.fiyat / ay, 2)
        tasarruf = 0
        if aylik and ay > 1 and aylik.fiyat > 0:
            tasarruf = max(0, round((1 - aylik_fiyat / aylik.fiyat) * 100))
        plan_listesi.append({
            'id': p.id, 'ad': p.ad, 'fiyat': p.fiyat, 'sure_tip': p.sure_tip, 'ay': ay,
            'aylik_fiyat': aylik_fiyat, 'tasarruf_yuzde': tasarruf,
        })

    odemeler = Odeme.query.filter_by(usta_id=usta.id).order_by(Odeme.tarih.desc()).limit(30).all()

    referanslar = Referans.query.filter_by(davet_eden_id=usta.id).order_by(Referans.id.desc()).all()
    davetler = []
    for r in referanslar:
        d = r.davet_edilen
        davetler.append({
            'ad': (f"{d.ad} {d.soyad[:1]}.".strip() if d and d.soyad else (d.ad if d else '-')),
            'durum': r.durum, 'bonus_gun': r.bonus_gun,
            'tarih': r.olusturma.strftime('%d.%m.%Y') if r.olusturma else '',
        })
    ek = usta.ekstra()
    site = os.environ.get('SITE_URL', 'https://adausta.com')
    kod = referans_kodu(usta.id)

    return jsonify({
        'usta_id': usta.id,
        'profil': {'durum': 'yayinda' if (usta.onaylanmis and usta.aktif) else ('onay_bekliyor' if usta.aktif else 'pasif'),
                   'onaylanmis': usta.onaylanmis, 'aktif': usta.aktif},
        'abonelik': {
            'plan': usta.plan, 'plan_bitis': usta.plan_bitis.isoformat() if usta.plan_bitis else None,
            'kalan_gun': kalan_gun, 'ucretli': bool(usta.plan and usta.plan != 'ucretsiz' and kalan_gun > 0),
            'durum': ab.durum if ab else None,
            'otomatik_yenileme': bool(ab.otomatik_yenileme) if ab else False,
            'deneme_mi': bool(ab and ab.deneme_mi and ab.durum == 'aktif'),
            'kayitli_kart_var': bool(usta.cardplus_safekey),
            'duraklatildi_mi': bool(ab.duraklatildi_mi) if ab else False,
            'duraklatma_tarihi': ab.duraklatma_tarihi.isoformat() if ab and ab.duraklatma_tarihi else None,
        },
        'planlar': plan_listesi,
        'promosyon': {
            'fiyatlar': {t: [{'sure_gun': g, 'fiyat_usd': f} for g, f in v.items()] for t, v in PROMO_FIYATLARI.items()},
            'aciklamalar': PROMO_ACIKLAMA,
            'aktif': usta.aktif_promosyonlar(),
            'hizmetler': [{'id': k['id'], 'ad': k['ad']} for k in ([{'id': usta.kategori_id, 'ad': usta.kategori.ad}] if usta.kategori else [])
                          + [{'id': k.id, 'ad': k.ad} for k in usta.ek_kategoriler if k.id != usta.kategori_id]],
        },
        'odemeler': [{
            'id': o.id, 'tarih': o.tarih.strftime('%d.%m.%Y %H:%M') if o.tarih else '', 'tutar': o.tutar,
            'para_birimi': o.para_birimi, 'durum': o.durum, 'aciklama': o.aciklama or '',
            'siparis_no': o.siparis_no, 'kart_son4': o.kart_son4,
            'tur': 'promosyon' if o.reference_type == 'promosyon' else 'abonelik',
        } for o in odemeler],
        'referans': {
            'kod': kod, 'link': f'{site}/usta-kayit?ref={kod}', 'bonus_gun': REFERANS_BONUS_GUN,
            'davetler': davetler, 'kazanilan_gun': int(ek.get('bonus_gun_toplam', 0)),
        },
        'linkler': {'profil': f'{site}/usta/{usta.id}', 'yorum': f'{site}/usta/{usta.id}?yorum=1'},
    })


# ──────────────────────────────────────────────────────────
# Otomatik yenilemeyi aç/kapat
# Body: { acik: true/false }
# Kapatmak: sadece bayrağı kapatır, mevcut dönem sonuna kadar plan aktif kalır.
# Açmak: sadece daha önce kart kaydedilmişse (cardplus_safekey varsa) mümkündür —
# kart hiç kaydedilmediyse önce ödeme ekranından "kartımı kaydet" ile ödeme yapılmalı.
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/abonelik/otomatik-yenileme', methods=['POST'])
@usta_gerekli
def otomatik_yenileme_ayarla(usta):
    data = request.get_json() or {}
    acik = bool(data.get('acik'))

    ab = (
        Abonelik.query.filter_by(usta_id=usta.id, durum='aktif').order_by(Abonelik.id.desc()).first()
        or Abonelik.query.filter_by(usta_id=usta.id, durum='askida').order_by(Abonelik.id.desc()).first()
    )
    if not ab:
        return jsonify({'hata': 'Aktif bir aboneliğiniz bulunmuyor'}), 400

    if acik and not usta.cardplus_safekey:
        return jsonify({'hata': 'Otomatik yenileme için önce kayıtlı bir kartınız olmalı. Lütfen ödeme ekranından "kartımı kaydet" seçeneğiyle bir kez ödeme yapın.'}), 400

    ab.otomatik_yenileme = acik
    db.session.commit()
    return jsonify({'mesaj': 'Otomatik yenileme açıldı' if acik else 'Otomatik yenileme kapatıldı, mevcut döneminiz sonuna kadar planınız aktif kalacak', 'otomatik_yenileme': ab.otomatik_yenileme})


# ──────────────────────────────────────────────────────────
# Profili Duraklat (SoliHoli kıyaslaması — Faz 1):
# Ücretli abonelik varken profil aramalardan gizlenir, kalan gün korunur (sayaç durur).
# Devam ettirince duraklama süresi kadar bitiş tarihi ileri kaydırılır.
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/abonelik/duraklat', methods=['POST'])
@usta_gerekli
def abonelik_duraklat(usta):
    simdi = datetime.utcnow()
    ab = Abonelik.query.filter_by(usta_id=usta.id, durum='aktif').order_by(Abonelik.id.desc()).first()
    if not ab or not usta.plan or usta.plan == 'ucretsiz' or not usta.plan_bitis or usta.plan_bitis <= simdi:
        return jsonify({'hata': 'Duraklatabileceğin aktif bir ücretli aboneliğin bulunmuyor'}), 400
    if ab.duraklatildi_mi:
        return jsonify({'hata': 'Profilin zaten duraklatılmış'}), 400

    ab.duraklatildi_mi = True
    ab.duraklatma_tarihi = simdi
    db.session.commit()
    return jsonify({
        'mesaj': 'Profilin duraklatıldı. Arama sonuçlarından gizlendin; kalan abonelik günlerin korunuyor.',
        'abonelik': ab.to_dict(),
    })


@usta_panel_bp.route('/abonelik/devam-ettir', methods=['POST'])
@usta_gerekli
def abonelik_devam_ettir(usta):
    ab = Abonelik.query.filter_by(usta_id=usta.id, duraklatildi_mi=True).order_by(Abonelik.id.desc()).first()
    if not ab:
        return jsonify({'hata': 'Duraklatılmış bir aboneliğin bulunmuyor'}), 400

    simdi = datetime.utcnow()
    duraklama_suresi = simdi - (ab.duraklatma_tarihi or simdi)
    if ab.bitis:
        ab.bitis = ab.bitis + duraklama_suresi
        usta.plan_bitis = ab.bitis
    if ab.yenileme_tarihi:
        ab.yenileme_tarihi = ab.yenileme_tarihi + duraklama_suresi
    ab.duraklatildi_mi = False
    ab.duraklatma_tarihi = None
    db.session.commit()
    return jsonify({
        'mesaj': 'Profilin devam ettirildi, arama sonuçlarında tekrar görünüyorsun.',
        'abonelik': ab.to_dict(),
    })


# ──────────────────────────────────────────────────────────
# Mesajlaşma — usta ile admin arasında tek iş parçacıklı yazışma
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/mesajlar', methods=['GET'])
@usta_gerekli
def mesajlar_getir(usta):
    liste = Mesaj.query.filter_by(usta_id=usta.id).order_by(Mesaj.olusturma.asc()).all()
    # Usta paneli açılınca admin'den gelen okunmamış mesajlar okunmuş sayılır
    Mesaj.query.filter_by(usta_id=usta.id, gonderen='admin', okundu=False).update({'okundu': True})
    db.session.commit()
    return jsonify({'mesajlar': [m.to_dict() for m in liste]})


@usta_panel_bp.route('/mesajlar', methods=['POST'])
@usta_gerekli
def mesaj_gonder(usta):
    data = request.get_json() or {}
    icerik = (data.get('icerik') or '').strip()
    if not icerik:
        return jsonify({'hata': 'Mesaj içeriği boş olamaz'}), 400
    if len(icerik) > 2000:
        return jsonify({'hata': 'Mesaj çok uzun'}), 400

    m = Mesaj(usta_id=usta.id, gonderen='usta', icerik=icerik)
    db.session.add(m)

    bildirim = AdminBildirim(
        tur='usta_mesaj',
        mesaj=f'{usta.ad} {usta.soyad}: {icerik[:120]}'
    )
    db.session.add(bildirim)
    db.session.commit()
    return jsonify({'mesaj': 'Gönderildi', 'kayit': m.to_dict()}), 201


@usta_panel_bp.route('/mesajlar/okunmamis-sayisi', methods=['GET'])
@usta_gerekli
def mesaj_okunmamis_sayisi(usta):
    sayi = Mesaj.query.filter_by(usta_id=usta.id, gonderen='admin', okundu=False).count()
    return jsonify({'sayi': sayi})


# ──────────────────────────────────────────────────────────
# Belgeler — kimlik / ustalık belgesi doğrulama
# ──────────────────────────────────────────────────────────
IZIN_BELGE_UZANTILAR = {'png', 'jpg', 'jpeg', 'pdf'}


@usta_panel_bp.route('/belgeler', methods=['GET'])
@usta_gerekli
def belgeler_getir(usta):
    liste = UstaBelge.query.filter_by(usta_id=usta.id).order_by(UstaBelge.olusturma.desc()).all()
    return jsonify({'belgeler': [b.to_dict() for b in liste]})


@usta_panel_bp.route('/belgeler', methods=['POST'])
@usta_gerekli
def belge_yukle(usta):
    if 'dosya' not in request.files:
        return jsonify({'hata': 'Dosya seçilmedi'}), 400
    f = request.files['dosya']
    ext = f.filename.rsplit('.', 1)[-1].lower() if '.' in f.filename else ''
    if ext not in IZIN_BELGE_UZANTILAR:
        return jsonify({'hata': 'Desteklenmeyen dosya türü (png, jpg, pdf)'}), 400
    tur = request.form.get('tur', 'kimlik')
    if tur not in ('kimlik', 'ustalik_belgesi', 'diger'):
        tur = 'diger'

    ad = f'{uuid.uuid4().hex}.{ext}'
    f.save(os.path.join(UPLOAD_FOLDER, ad))
    belge = UstaBelge(usta_id=usta.id, tur=tur, dosya=ad, durum='bekliyor')
    db.session.add(belge)

    bildirim = AdminBildirim(
        tur='yeni_belge',
        mesaj=f'{usta.ad} {usta.soyad} yeni belge yükledi ({tur})'
    )
    db.session.add(bildirim)
    db.session.commit()
    return jsonify({'mesaj': 'Belge yüklendi, onay bekliyor', 'belge': belge.to_dict()}), 201


@usta_panel_bp.route('/belgeler/<int:bid>', methods=['DELETE'])
@usta_gerekli
def belge_sil(usta, bid):
    belge = UstaBelge.query.filter_by(id=bid, usta_id=usta.id).first_or_404()
    if belge.durum == 'onaylandi':
        return jsonify({'hata': 'Onaylanmış belge silinemez'}), 400
    yol = os.path.join(UPLOAD_FOLDER, belge.dosya)
    if os.path.exists(yol):
        os.remove(yol)
    db.session.delete(belge)
    db.session.commit()
    return jsonify({'mesaj': 'Belge silindi'})


# ──────────────────────────────────────────────────────────
# Yorum yanıtlama — usta bir müşteri yorumuna tek seferlik yanıt verir
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/yorumlar/<int:yid>/cevap', methods=['POST'])
@usta_gerekli
def yorum_cevapla(usta, yid):
    yorum = Yorum.query.filter_by(id=yid, usta_id=usta.id).first_or_404()
    data = request.get_json() or {}
    cevap = (data.get('cevap') or '').strip()
    if not cevap:
        return jsonify({'hata': 'Yanıt boş olamaz'}), 400
    if len(cevap) > 1000:
        return jsonify({'hata': 'Yanıt çok uzun'}), 400
    yorum.cevap = cevap
    yorum.cevap_tarih = datetime.utcnow()
    db.session.commit()
    return jsonify({'mesaj': 'Yanıtınız kaydedildi', 'yorum': yorum.to_dict()})


# ──────────────────────────────────────────────────────────
# Ekibimiz — Faz 2 Görev 7 (SoliHoli kıyaslaması)
# SADECE GÖRÜNÜM amaçlı çalışan listesi (isim + serbest metin rol). Yetkilendirme/izin
# sistemi DEĞİL — satıcı panelindeki rol-bazlı yetki sisteminden tamamen ayrı ve basit.
# ──────────────────────────────────────────────────────────
MAX_EKIP_UYESI = 20


@usta_panel_bp.route('/ekip', methods=['GET'])
@usta_gerekli
def ekip_getir(usta):
    liste = UstaEkipUyesi.query.filter_by(usta_id=usta.id).order_by(UstaEkipUyesi.sira, UstaEkipUyesi.id).all()
    return jsonify({'ekip': [e.to_dict() for e in liste]})


@usta_panel_bp.route('/ekip', methods=['POST'])
@usta_gerekli
def ekip_ekle(usta):
    # multipart/form-data (foto opsiyonel) veya application/json kabul eder
    veri = request.form if request.form else (request.get_json(silent=True) or {})
    ad = (veri.get('ad') or '').strip()
    rol = (veri.get('rol') or '').strip()[:60]
    if not ad:
        return jsonify({'hata': 'Ad zorunludur'}), 400
    if len(ad) > 100:
        return jsonify({'hata': 'Ad çok uzun'}), 400

    mevcut_sayi = UstaEkipUyesi.query.filter_by(usta_id=usta.id).count()
    if mevcut_sayi >= MAX_EKIP_UYESI:
        return jsonify({'hata': f'En fazla {MAX_EKIP_UYESI} ekip üyesi ekleyebilirsin'}), 400

    foto_adi = None
    if 'dosya' in request.files and request.files['dosya'].filename:
        f = request.files['dosya']
        ext = f.filename.rsplit('.', 1)[-1].lower() if '.' in f.filename else ''
        if ext not in IZIN_UZANTILAR:
            return jsonify({'hata': 'Desteklenmeyen dosya türü'}), 400
        foto_adi = f'ekip_{uuid.uuid4().hex}.{ext}'
        f.save(os.path.join(UPLOAD_FOLDER, foto_adi))

    uye = UstaEkipUyesi(usta_id=usta.id, ad=ad, rol=rol, foto=foto_adi, sira=mevcut_sayi)
    db.session.add(uye)
    db.session.commit()
    return jsonify({'mesaj': 'Ekip üyesi eklendi', 'uye': uye.to_dict()}), 201


@usta_panel_bp.route('/ekip/<int:eid>', methods=['DELETE'])
@usta_gerekli
def ekip_sil(usta, eid):
    uye = UstaEkipUyesi.query.filter_by(id=eid, usta_id=usta.id).first_or_404()
    if uye.foto:
        yol = os.path.join(UPLOAD_FOLDER, uye.foto)
        if os.path.exists(yol):
            os.remove(yol)
    db.session.delete(uye)
    db.session.commit()
    return jsonify({'mesaj': 'Ekip üyesi silindi'})


# ──────────────────────────────────────────────────────────
# Public Sertifikalarım — Faz 2 Görev 8 (DİKKAT: GİZLİLİK)
# UstaBelge (kimlik doğrulama, GİZLİ/admin onaylı) ile KARIŞTIRILMAMALI.
# Bu alan ustanın kendi isteğiyle public profilde göstermek istediği sertifika/diploma
# görselleridir — bir vitrin/iddiadır, admin onayı ZORUNLU DEĞİL, her zaman görünür.
# ──────────────────────────────────────────────────────────
IZIN_SERTIFIKA_UZANTILAR = {'png', 'jpg', 'jpeg', 'pdf'}
MAX_SERTIFIKA = 20


@usta_panel_bp.route('/sertifikalar', methods=['GET'])
@usta_gerekli
def sertifikalar_getir(usta):
    liste = UstaSertifika.query.filter_by(usta_id=usta.id).order_by(UstaSertifika.sira, UstaSertifika.id).all()
    return jsonify({'sertifikalar': [s.to_dict() for s in liste]})


@usta_panel_bp.route('/sertifikalar', methods=['POST'])
@usta_gerekli
def sertifika_ekle(usta):
    baslik = (request.form.get('baslik') or '').strip()
    aciklama = (request.form.get('aciklama') or '').strip()
    if not baslik:
        return jsonify({'hata': 'Başlık zorunludur'}), 400
    if len(baslik) > 150:
        return jsonify({'hata': 'Başlık çok uzun'}), 400
    if 'dosya' not in request.files or not request.files['dosya'].filename:
        return jsonify({'hata': 'Dosya seçilmedi'}), 400

    mevcut_sayi = UstaSertifika.query.filter_by(usta_id=usta.id).count()
    if mevcut_sayi >= MAX_SERTIFIKA:
        return jsonify({'hata': f'En fazla {MAX_SERTIFIKA} sertifika ekleyebilirsin'}), 400

    f = request.files['dosya']
    ext = f.filename.rsplit('.', 1)[-1].lower() if '.' in f.filename else ''
    if ext not in IZIN_SERTIFIKA_UZANTILAR:
        return jsonify({'hata': 'Desteklenmeyen dosya türü (png, jpg, pdf)'}), 400
    ad = f'sertifika_{uuid.uuid4().hex}.{ext}'
    f.save(os.path.join(UPLOAD_FOLDER, ad))

    sertifika = UstaSertifika(usta_id=usta.id, baslik=baslik, aciklama=aciklama, dosya=ad, sira=mevcut_sayi)
    db.session.add(sertifika)
    db.session.commit()
    return jsonify({'mesaj': 'Sertifika eklendi', 'sertifika': sertifika.to_dict()}), 201


@usta_panel_bp.route('/sertifikalar/<int:sid>', methods=['DELETE'])
@usta_gerekli
def sertifika_sil(usta, sid):
    sertifika = UstaSertifika.query.filter_by(id=sid, usta_id=usta.id).first_or_404()
    yol = os.path.join(UPLOAD_FOLDER, sertifika.dosya)
    if os.path.exists(yol):
        os.remove(yol)
    db.session.delete(sertifika)
    db.session.commit()
    return jsonify({'mesaj': 'Sertifika silindi'})


# ──────────────────────────────────────────────────────────
# Ödüller — Faz 2 Görev 9 (public, vitrin amaçlı, admin onayı gerekmez)
# ──────────────────────────────────────────────────────────
MAX_ODUL = 20


@usta_panel_bp.route('/oduller', methods=['GET'])
@usta_gerekli
def oduller_getir(usta):
    liste = UstaOdul.query.filter_by(usta_id=usta.id).order_by(UstaOdul.sira, UstaOdul.id).all()
    return jsonify({'oduller': [o.to_dict() for o in liste]})


@usta_panel_bp.route('/oduller', methods=['POST'])
@usta_gerekli
def odul_ekle(usta):
    data = request.get_json(silent=True) or {}
    baslik = (data.get('baslik') or '').strip()
    if not baslik:
        return jsonify({'hata': 'Başlık zorunludur'}), 400
    if len(baslik) > 150:
        return jsonify({'hata': 'Başlık çok uzun'}), 400

    mevcut_sayi = UstaOdul.query.filter_by(usta_id=usta.id).count()
    if mevcut_sayi >= MAX_ODUL:
        return jsonify({'hata': f'En fazla {MAX_ODUL} ödül ekleyebilirsin'}), 400

    yil = data.get('yil')
    try:
        yil = int(yil) if yil not in (None, '') else None
        if yil is not None and (yil < 1950 or yil > datetime.utcnow().year + 1):
            yil = None
    except (TypeError, ValueError):
        yil = None

    odul = UstaOdul(
        usta_id=usta.id,
        baslik=baslik,
        veren_kurum=(data.get('veren_kurum') or '').strip()[:150],
        yil=yil,
        aciklama=(data.get('aciklama') or '').strip(),
        sira=mevcut_sayi,
    )
    db.session.add(odul)
    db.session.commit()
    return jsonify({'mesaj': 'Ödül eklendi', 'odul': odul.to_dict()}), 201


@usta_panel_bp.route('/oduller/<int:oid>', methods=['DELETE'])
@usta_gerekli
def odul_sil(usta, oid):
    odul = UstaOdul.query.filter_by(id=oid, usta_id=usta.id).first_or_404()
    db.session.delete(odul)
    db.session.commit()
    return jsonify({'mesaj': 'Ödül silindi'})


# ──────────────────────────────────────────────────────────
# Faz 3 Görev 12 — Müşteri ↔ Usta mesajlaşması (thread = bir IsTalebi)
# Admin↔usta Mesaj desenine benzer (gönderen/okundu/olusturma) ama IsTalebi'ye bağlı ve
# genel bir sohbet/inbox DEĞİL — her thread belli bir iş talebiyle sınırlı.
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/is-talepleri/<int:tid>/mesajlar', methods=['GET'])
@usta_gerekli
def talep_mesajlari_getir(usta, tid):
    talep = IsTalebi.query.filter_by(id=tid, usta_id=usta.id).first_or_404()
    liste = IsTalebiMesaj.query.filter_by(is_talebi_id=talep.id).order_by(IsTalebiMesaj.olusturma.asc()).all()
    # Usta thread'i açınca müşteriden gelen okunmamış mesajlar okunmuş sayılır
    IsTalebiMesaj.query.filter_by(is_talebi_id=talep.id, gonderen='musteri', okundu=False).update({'okundu': True})
    db.session.commit()
    return jsonify({'mesajlar': [m.to_dict() for m in liste]})


@usta_panel_bp.route('/is-talepleri/<int:tid>/mesajlar', methods=['POST'])
@limiter.limit('30 per hour')
@usta_gerekli
def talep_mesaj_gonder(usta, tid):
    talep = IsTalebi.query.filter_by(id=tid, usta_id=usta.id).first_or_404()
    data = request.get_json(silent=True) or {}
    icerik = (data.get('icerik') or '').strip()
    if not icerik:
        return jsonify({'hata': 'Mesaj içeriği boş olamaz'}), 400
    if len(icerik) > 2000:
        return jsonify({'hata': 'Mesaj çok uzun'}), 400

    m = IsTalebiMesaj(is_talebi_id=talep.id, gonderen='usta', icerik=icerik)
    db.session.add(m)
    db.session.commit()
    return jsonify({'mesaj': 'Gönderildi', 'kayit': m.to_dict()}), 201


@usta_panel_bp.route('/is-talepleri/mesaj-okunmamis-sayisi', methods=['GET'])
@usta_gerekli
def talep_mesaj_okunmamis_sayisi(usta):
    """Nav'daki 'İş Talepleri' rozetinde kullanılır (UstaPanelLayout'taki mesajBadge deseniyle tutarlı)."""
    sayi = db.session.query(IsTalebiMesaj).join(IsTalebi, IsTalebiMesaj.is_talebi_id == IsTalebi.id) \
        .filter(IsTalebi.usta_id == usta.id, IsTalebiMesaj.gonderen == 'musteri', IsTalebiMesaj.okundu == False).count()  # noqa: E712
    return jsonify({'sayi': sayi})


# ──────────────────────────────────────────────────────────
# Faz 3 Görev 14 — "Yeni hizmet öner": usta, kategori listesinde bulamadığı bir hizmeti
# önerir. Admin'e bildirim gider (hesap_kapat/usta_sikayeti ile aynı desen).
# ──────────────────────────────────────────────────────────
@usta_panel_bp.route('/hizmet-oneri', methods=['POST'])
@limiter.limit('10 per hour')
@usta_gerekli
def hizmet_oneri_gonder(usta):
    data = request.get_json(silent=True) or {}
    hizmet_adi = (data.get('hizmet_adi') or '').strip()
    aciklama = (data.get('aciklama') or '').strip()
    if not hizmet_adi or len(hizmet_adi) < 2:
        return jsonify({'hata': 'Hizmet adını girin'}), 400
    if len(hizmet_adi) > 150:
        return jsonify({'hata': 'Hizmet adı çok uzun'}), 400

    oneri = HizmetOnerisi(usta_id=usta.id, hizmet_adi=hizmet_adi, aciklama=aciklama or None)
    db.session.add(oneri)
    db.session.add(AdminBildirim(
        tur='hizmet_onerisi',
        mesaj=f'{usta.ad} {usta.soyad} yeni hizmet önerdi: {hizmet_adi}'
    ))
    db.session.commit()
    return jsonify({'mesaj': 'Öneriniz alındı, teşekkürler! Ekibimiz değerlendirecek.', 'oneri': oneri.to_dict()}), 201
