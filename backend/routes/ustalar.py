from guvenlik import icerir, baslar
from flask import Blueprint, request, jsonify, session, current_app
from models import db, Usta, Fotograf, Yorum, IsTalebi, Kullanici, Kategori, Sehir, usta_kategoriler, AdminBildirim, TelefonOtp, FCMToken, BildirimGecmisi, UstaBelge, Abonelik, UstaSikayet, UstaEkipUyesi, UstaSertifika, UstaOdul
from werkzeug.utils import secure_filename
from sms import sms_gonder
from whatsapp import admin_whatsapp_gonder
from extensions import limiter
from promosyon import referans_kaydet
from usta_gorunurluk import gizli_usta_idleri, usta_gizli_mi
from datetime import datetime, timedelta
from sqlalchemy.orm import selectinload
import os, uuid, random, hashlib

ustalar_bp = Blueprint('ustalar', __name__)

ALLOWED = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def izin_verilen(dosya_adi):
    return '.' in dosya_adi and dosya_adi.rsplit('.', 1)[1].lower() in ALLOWED

@ustalar_bp.route('/', methods=['GET'])
def listele():
    kategori_id = request.args.get('kategori_id', type=int)
    sehir_id    = request.args.get('sehir_id', type=int)
    sehir_ad    = request.args.get('sehir', '')
    ilce_id     = request.args.get('ilce_id', type=int)
    arama       = request.args.get('arama', '')
    dil         = request.args.get('dil', '').strip().lower()
    lat  = request.args.get('lat', type=float)
    lng  = request.args.get('lng', type=float)
    yakin = request.args.get('yakin', type=int, default=0)
    sayfa = request.args.get('sayfa', 1, type=int)
    limit = request.args.get('limit', 20, type=int)

    # Şehir adından ID bul (hero search'ten gelen sehir= parametresi için)
    if sehir_ad and not sehir_id:
        s = Sehir.query.filter(baslar(Sehir.ad, sehir_ad)).first()
        if s:
            sehir_id = s.id

    q = Usta.query.filter_by(onaylanmis=True, aktif=True)

    # Profilini duraklatan ustalar (SoliHoli kıyaslaması — Faz 1 "Profili Duraklat"):
    # aboneliği aktif ama kendi isteğiyle duraklattığı için arama/listelerde gizlenir.
    q = q.filter(~Usta.id.in_(gizli_usta_idleri()))  # duraklatılmış + süresi dolan deneme (hesap kapalı)

    if kategori_id:
        # Ana kategori VEYA ek kategoriler içinde ara
        q = q.filter(
            (Usta.kategori_id == kategori_id) |
            Usta.id.in_(
                db.session.query(usta_kategoriler.c.usta_id).filter(
                    usta_kategoriler.c.kategori_id == kategori_id
                )
            )
        )
    if sehir_id:
        q = q.filter_by(sehir_id=sehir_id)
    if ilce_id:
        q = q.filter_by(ilce_id=ilce_id)
    if arama:
        # "Osman Çelik" gibi ad+soyad birlikte aranınca da bulunsun diye
        # kelime kelime eşleşiyor: her kelime ad/soyad/açıklama/kategoriden
        # en az birine denk gelmeli (bkz. admin.py /ustalar aynı düzeltme).
        q = q.join(Kategori, Usta.kategori_id == Kategori.id, isouter=True)
        for kelime in arama.split():
            q = q.filter(
                icerir(Usta.ad, kelime) |
                icerir(Usta.soyad, kelime) |
                icerir(Usta.aciklama, kelime) |
                icerir(Kategori.ad, kelime)
            )

    # yorum/fotoğraf/ek kategori ilişkileri toplu yüklenir (sıralama puanı ve to_dict her usta için bunlara bakar)
    ustalar = q.options(selectinload(Usta.yorumlar), selectinload(Usta.fotograflar), selectinload(Usta.ek_kategoriler)).all()

    # Hizmet dili filtresi: usta profiline eklenen diller. Dil bilgisi girmemiş ustalar Türkçe kabul edilir.
    if dil:
        if dil not in Usta.EKSTRA_DILLER:
            return jsonify({'hata': 'Geçersiz dil'}), 400
        ustalar = [u for u in ustalar if (dil in u.ekstra().get('diller', [])) or (dil == 'tr' and not u.ekstra().get('diller'))]

    # Öne çıkarma için ilgili kategori: açık kategori filtresi ya da arama kelimesi tam bir kategori adıysa o kategori
    promo_kat = kategori_id
    if not promo_kat and arama:
        k = Kategori.query.filter(db.func.lower(Kategori.ad) == arama.strip().lower()).first()
        promo_kat = k.id if k else None

    # En yakın usta filtresi
    if lat and lng and yakin:
        ustalar = [u for u in ustalar if u.mesafe_hesapla(lat, lng) is not None and u.mesafe_hesapla(lat, lng) <= yakin]
        ustalar.sort(key=lambda u: (0 if u.oncelikli_mi(promo_kat) else 1, u.mesafe_hesapla(lat, lng)))
    elif lat and lng:
        # Konuma göre: önce (satın alınmış) öne çıkarılanlar, sonra mesafe
        ustalar = sorted(ustalar, key=lambda u: (0 if u.oncelikli_mi(promo_kat) else 1, u.mesafe_hesapla(lat, lng) or 9999))
    else:
        # Konum yoksa: öne çıkarılan / ücretli / yorumlu / dolu profiller üstte (kararlı sıralama)
        vitrin = request.args.get('vitrin', type=int, default=0) == 1
        ustalar = sorted(ustalar, key=lambda u: (-u.siralama_puani(promo_kat, vitrin), u.id))

    toplam = len(ustalar)
    baslangic = (sayfa - 1) * limit
    ustalar = ustalar[baslangic:baslangic + limit]

    return jsonify({
        'ustalar': [u.to_dict(lat, lng) for u in ustalar],
        'toplam': toplam,
        'sayfa': sayfa,
        'toplam_sayfa': (toplam + limit - 1) // limit
    })

@ustalar_bp.route('/son-yorumlar', methods=['GET'])
def son_yorumlar():
    """Ana sayfa için: gerçek, onaylı ve anlamlı yorumlar (uydurma yorum gösterilmez)."""
    limit = min(request.args.get('limit', 3, type=int), 6)
    adaylar = Yorum.query.filter(Yorum.onaylanmis == True, Yorum.puan >= 4)        .order_by(Yorum.tarih.desc()).limit(60).all()
    sonuc = []
    for y in adaylar:
        if not y.yorum or len(y.yorum.strip()) < 20 or not y.usta or not y.usta.aktif:
            continue
        parcalar = (y.musteri_adi or '').split()
        kisa_ad = parcalar[0] + (f' {parcalar[-1][0]}.' if len(parcalar) > 1 else '') if parcalar else 'Müşteri'
        sonuc.append({
            'id': y.id, 'ad': kisa_ad, 'puan': y.puan, 'yorum': y.yorum.strip()[:220],
            'sehir': y.usta.sehir.ad if y.usta.sehir else '',
            'usta': {'id': y.usta.id, 'ad_soyad': f"{y.usta.ad} {y.usta.soyad}".strip(), 'kategori': y.usta.kategori.ad if y.usta.kategori else '',
                     'ad': y.usta.ad, 'soyad': y.usta.soyad, 'sehir': y.usta.sehir.ad if y.usta.sehir else ''},
        })
        if len(sonuc) >= limit:
            break
    return jsonify({'yorumlar': sonuc})


@ustalar_bp.route('/<int:id>', methods=['GET'])
def detay(id):
    u = Usta.query.get_or_404(id)
    # Kapalı hesap (süresi dolan deneme / duraklatılmış) herkese açık sayfada görünmez; sahibi ve admin görebilir
    if session.get('rol') != 'admin' and u.kullanici_id != session.get('kullanici_id') and usta_gizli_mi(u.id):
        return jsonify({'hata': 'Usta bulunamadı'}), 404
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    veri = u.to_dict(lat, lng)
    veri['yorumlar'] = [y.to_dict() for y in u.yorumlar if y.onaylanmis]
    # Yalnızca admin onaylı ustalık belgesi varsa herkese açık "Belgeli" rozeti gösterilir
    veri['onayli_belge'] = UstaBelge.query.filter_by(
        usta_id=u.id, tur='ustalik_belgesi', durum='onaylandi').count() > 0
    # Faz 2 — Ekibimiz / Public Sertifikalarım / Ödüller (tamamı görünüm amaçlı, vitrin verisi)
    veri['ekip'] = [e.to_dict() for e in UstaEkipUyesi.query.filter_by(usta_id=u.id).order_by(UstaEkipUyesi.sira, UstaEkipUyesi.id).all()]
    veri['sertifikalar'] = [s.to_dict() for s in UstaSertifika.query.filter_by(usta_id=u.id).order_by(UstaSertifika.sira, UstaSertifika.id).all()]
    veri['oduller'] = [o.to_dict() for o in UstaOdul.query.filter_by(usta_id=u.id).order_by(UstaOdul.sira, UstaOdul.id).all()]
    return jsonify(veri)

@ustalar_bp.route('/kayit', methods=['POST'])
def kayit():
    data = request.get_json()
    zorunlu = ['ad', 'telefon', 'kategori_id', 'sehir_id', 'email', 'sifre']
    for alan in zorunlu:
        if not data.get(alan):
            return jsonify({'hata': f'{alan} zorunludur'}), 400
    if len(data.get('sifre', '')) < 8:
        return jsonify({'hata': 'Şifre en az 8 karakter olmalı'}), 400

    # Email zaten var mı kontrol et
    if Kullanici.query.filter_by(email=data['email']).first():
        return jsonify({'hata': 'Bu email adresi zaten kayıtlı'}), 400

    # Kullanıcı hesabı oluştur
    k = Kullanici(email=data['email'], rol='usta')
    k.sifre_set(data['sifre'])
    db.session.add(k)
    db.session.flush()  # k.id'yi al

    u = Usta(
        kullanici_id=k.id,
        ad=data['ad'],
        soyad=data.get('soyad', ''),
        telefon=data['telefon'],
        whatsapp=data.get('whatsapp', data['telefon']),
        email=data['email'],
        sehir_id=data['sehir_id'],
        ilce_id=data.get('ilce_id'),
        kategori_id=data['kategori_id'],
        aciklama=data.get('aciklama', ''),
        deneyim_yil=data.get('deneyim_yil', 0),
        lat=data.get('lat'),
        lng=data.get('lng'),
        onaylanmis=False,  # kayıt + ödeme sonrası admin onayı bekler, listelemede görünmez
        aktif=True
    )
    db.session.add(u)
    db.session.flush()  # u.id'yi al

    # Ek kategoriler
    ek_ids = data.get('ek_kategori_ids', [])
    for kid in ek_ids:
        kat = Kategori.query.get(kid)
        if kat and kat not in u.ek_kategoriler:
            u.ek_kategoriler.append(kat)

    # Davet kodu ile gelindiyse kaydet (geçersiz kod kaydı engellemez)
    if data.get('referans_kodu'):
        referans_kaydet(u, data['referans_kodu'])

    # Admin bildirimi
    bildirim = AdminBildirim(
        tur='yeni_usta',
        mesaj=f'Yeni usta kaydı: {data["ad"]} {data.get("soyad", "")} — {data["telefon"]}'
    )
    db.session.add(bildirim)
    db.session.commit()
    admin_whatsapp_gonder(f'🔧 Yeni usta kaydı\n{data["ad"]} {data.get("soyad", "")} — {data["telefon"]}\nKategori: {u.kategori.ad if u.kategori else "-"}')

    # Otomatik giriş yap
    session['kullanici_id'] = k.id
    session['rol'] = 'usta'

    # SMS bildirimi (başarısız olsa da kayıt tamamlanır)
    sms_gonder(
        data['telefon'],
        f'Merhaba {data["ad"]}, Ada Usta\'ya kaydınız alındı! Profiliniz oluşturuldu. Herhangi bir sorun için 0548 851 07 00 numarasını arayabilirsiniz.'
    )

    return jsonify({'mesaj': 'Kayıt başarılı', 'id': u.id, 'usta_id': u.id, 'kullanici': k.to_dict()}), 201

def _telefon_normalize(t):
    t = (t or '').replace(' ', '').replace('-', '').replace('+', '')
    if t.startswith('00'):
        t = t[2:]
    return t[-9:]  # son 9 hane — ülke kodu yazım farklarını tolere eder


@ustalar_bp.route('/<int:id>/sahiplen/kod-gonder', methods=['POST'])
@limiter.limit('3 per minute; 10 per hour')
def sahiplen_kod_gonder(id):
    u = Usta.query.get_or_404(id)
    if u.kullanici_id:
        return jsonify({'hata': 'Bu profil zaten sahiplenilmiş'}), 400

    data = request.get_json() or {}
    telefon = (data.get('telefon') or '').strip()
    if not telefon:
        return jsonify({'hata': 'Telefon zorunludur'}), 400
    if _telefon_normalize(telefon) != _telefon_normalize(u.telefon):
        return jsonify({'hata': 'Bu telefon numarası profildeki numarayla eşleşmiyor'}), 400

    kod = f'{random.randint(0, 999999):06d}'
    otp = TelefonOtp(
        telefon=u.telefon,
        kod_hash=hashlib.sha256(kod.encode()).hexdigest(),
        amac='profil_sahiplen',
        usta_id=u.id,
        son_kullanma=datetime.utcnow() + timedelta(minutes=5)
    )
    db.session.add(otp)
    db.session.commit()

    gonderildi = sms_gonder(u.telefon, f'Ada Usta dogrulama kodunuz: {kod}. 5 dakika icinde gecerlidir.')
    if not gonderildi:
        return jsonify({'hata': 'SMS gönderilemedi, lütfen tekrar deneyin'}), 502

    return jsonify({'mesaj': 'Doğrulama kodu gönderildi'})


@ustalar_bp.route('/<int:id>/sahiplen/dogrula', methods=['POST'])
@limiter.limit('5 per minute; 15 per hour')
def sahiplen_dogrula(id):
    u = Usta.query.get_or_404(id)
    if u.kullanici_id:
        return jsonify({'hata': 'Bu profil zaten sahiplenilmiş'}), 400

    data = request.get_json() or {}
    kod = (data.get('kod') or '').strip()
    email = (data.get('email') or '').strip().lower()
    sifre = data.get('sifre', '')

    if not kod or not email or not sifre:
        return jsonify({'hata': 'kod, email ve sifre zorunludur'}), 400
    if len(sifre) < 8:
        return jsonify({'hata': 'Şifre en az 8 karakter olmalı'}), 400
    if Kullanici.query.filter_by(email=email).first():
        return jsonify({'hata': 'Bu email adresi zaten kayıtlı'}), 400

    otp = TelefonOtp.query.filter_by(
        usta_id=u.id, amac='profil_sahiplen', dogrulandi=False
    ).order_by(TelefonOtp.id.desc()).first()

    if not otp:
        return jsonify({'hata': 'Önce doğrulama kodu isteyin'}), 400
    if otp.deneme_sayisi >= 5:
        return jsonify({'hata': 'Çok fazla hatalı deneme. Yeni kod isteyin.'}), 429
    if otp.suresi_gecti_mi():
        return jsonify({'hata': 'Kodun süresi doldu, yeni kod isteyin'}), 400
    if not otp.kod_kontrol(kod):
        otp.deneme_sayisi += 1
        db.session.commit()
        return jsonify({'hata': 'Kod hatalı'}), 400

    otp.dogrulandi = True

    k = Kullanici(email=email, rol='usta')
    k.sifre_set(sifre)
    db.session.add(k)
    db.session.flush()  # k.id'yi al

    u.kullanici_id = k.id
    if not u.email:
        u.email = email
    db.session.commit()

    session['kullanici_id'] = k.id
    session['rol'] = 'usta'

    return jsonify({'mesaj': 'Profil başarıyla sahiplenildi', 'usta_id': u.id, 'kullanici': k.to_dict()})


@ustalar_bp.route('/<int:id>/fotograf', methods=['POST'])
def fotograf_yukle(id):
    kid = session.get('kullanici_id')
    if not kid:
        return jsonify({'hata': 'Giriş gerekli'}), 401
    if session.get('rol') != 'admin':
        sahip = Usta.query.filter_by(id=id, kullanici_id=kid).first()
        if not sahip:
            return jsonify({'hata': 'Yetkisiz'}), 403
    u = Usta.query.get_or_404(id)
    if 'dosya' not in request.files:
        return jsonify({'hata': 'Dosya yok'}), 400
    dosya = request.files['dosya']
    if not izin_verilen(dosya.filename):
        return jsonify({'hata': 'Desteklenmeyen format'}), 400
    uzanti = dosya.filename.rsplit('.', 1)[1].lower()
    dosya_adi = f"{uuid.uuid4().hex}.{uzanti}"
    kayit_yolu = os.path.join(current_app.config['UPLOAD_FOLDER'], dosya_adi)
    dosya.save(kayit_yolu)
    f = Fotograf(usta_id=id, dosya=dosya_adi)
    db.session.add(f)
    db.session.commit()
    return jsonify({'url': f'/uploads/{dosya_adi}'}), 201

def _opsiyonel_alt_puan(data, anahtar):
    """1-5 arası opsiyonel alt puan: boş/None geçilebilir, geçersizse yok sayılır (isteği reddetmez)."""
    deger = data.get(anahtar)
    if deger in (None, ''):
        return None
    try:
        deger = int(deger)
    except (TypeError, ValueError):
        return None
    return deger if 1 <= deger <= 5 else None


@ustalar_bp.route('/<int:id>/yorum', methods=['POST'])
def yorum_ekle(id):
    Usta.query.get_or_404(id)
    data = request.get_json()
    if not data.get('musteri_adi') or not data.get('puan'):
        return jsonify({'hata': 'Ad ve puan zorunludur'}), 400
    puan = int(data['puan'])
    if puan < 1 or puan > 5:
        return jsonify({'hata': 'Puan 1-5 arası olmalı'}), 400
    y = Yorum(
        usta_id=id,
        musteri_adi=data['musteri_adi'],
        puan=puan,
        yorum=data.get('yorum', ''),
        onaylanmis=False,
        # Faz 2 Görev 10 — kategori bazlı alt puanlar opsiyoneldir, boş geçilebilir
        puan_is_kalitesi=_opsiyonel_alt_puan(data, 'puan_is_kalitesi'),
        puan_iletisim=_opsiyonel_alt_puan(data, 'puan_iletisim'),
        puan_fiyat_performans=_opsiyonel_alt_puan(data, 'puan_fiyat_performans'),
    )
    db.session.add(y)
    db.session.commit()
    return jsonify({'mesaj': 'Yorumunuz alındı, onay bekliyor'}), 201

@ustalar_bp.route('/<int:id>/is-talebi', methods=['POST'])
def is_talebi_gonder(id):
    """Müşteri bir ustaya iş/arıza talebi gönderir."""
    usta = Usta.query.get_or_404(id)
    if usta_gizli_mi(usta.id):
        return jsonify({'hata': 'Bu usta şu anda hizmet vermiyor'}), 404
    data = request.get_json()
    if not data.get('musteri_ad') or not data.get('musteri_telefon') or not data.get('baslik'):
        return jsonify({'hata': 'Ad, telefon ve başlık zorunludur'}), 400

    talep = IsTalebi(
        usta_id=usta.id,
        musteri_id=session.get('kullanici_id'),
        musteri_ad=data['musteri_ad'],
        musteri_telefon=data['musteri_telefon'],
        musteri_adres=data.get('musteri_adres', ''),
        baslik=data['baslik'],
        aciklama=data.get('aciklama', ''),
        tercih_tarih=data.get('tercih_tarih', ''),
        durum='bekliyor',
    )
    db.session.add(talep)
    db.session.commit()

    # Ustaya yeni talep push bildirimi (usta uygulamayı açmadan da haberdar olsun)
    _usta_bildirim_gonder(
        usta,
        baslik='Yeni iş talebi',
        icerik=f'{data["musteri_ad"]}: {data["baslik"]}',
        data={'ekran': 'talepler', 'talep_id': talep.id},
    )

    return jsonify({'mesaj': 'Talebiniz iletildi! Usta en kısa sürede sizinle iletişime geçecek.',
                    'talep_id': talep.id}), 201


def _usta_bildirim_gonder(usta, baslik, icerik, data=None):
    """Bir ustanın kayıtlı cihazlarına FCM push bildirimi gönderir ve geçmişe kaydeder."""
    if not usta.kullanici_id:
        return
    tercih = usta.bildirim_tercihi()
    # İsteğe bağlı SMS (varsayılan kapalı; ustanın Ayarlar sayfasından açtığı)
    if tercih['talep_sms'] and usta.telefon:
        sms_gonder(usta.telefon, f'Ada Usta - {baslik}: {icerik[:100]}. Detay için usta panelinizi açın.')
    tokenlar = [t.token for t in FCMToken.query.filter_by(kullanici_id=usta.kullanici_id, aktif=True).all()] if tercih['talep_push'] else []
    gecmis = BildirimGecmisi(kullanici_id=usta.kullanici_id, baslik=baslik, icerik=icerik, tur='talep')
    if tokenlar:
        from fcm import toplu_bildirim_gonder
        sonuc = toplu_bildirim_gonder(tokenlar, baslik, icerik, data)
        gecmis.gonderildi = sonuc['basarili'] > 0
        if sonuc['gecersiz']:
            FCMToken.query.filter(FCMToken.token.in_(sonuc['gecersiz'])).delete(synchronize_session=False)
    db.session.add(gecmis)
    db.session.commit()


SIKAYET_SEBEPLERI = ('yaniltici', 'kotu_davranis', 'dolandiricilik', 'diger')


@ustalar_bp.route('/<int:id>/sikayet', methods=['POST'])
@limiter.limit('5 per hour')
def sikayet_gonder(id):
    """Ziyaretçi bir usta profilini bildirir (Faz 1 — Şikayet Et / Bildir)."""
    usta = Usta.query.get_or_404(id)
    data = request.get_json(silent=True) or {}

    sebep = (data.get('sebep') or '').strip()
    aciklama = (data.get('aciklama') or '').strip()
    if sebep not in SIKAYET_SEBEPLERI:
        return jsonify({'hata': 'Geçerli bir sebep seçin'}), 400
    if not aciklama or len(aciklama) < 5:
        return jsonify({'hata': 'Lütfen şikayetinizi biraz detaylandırın'}), 400

    sikayet = UstaSikayet(
        usta_id=usta.id,
        sikayet_eden_ad=(data.get('sikayet_eden_ad') or '').strip()[:150],
        sikayet_eden_iletisim=(data.get('sikayet_eden_iletisim') or '').strip()[:150],
        sebep=sebep,
        aciklama=aciklama,
    )
    db.session.add(sikayet)
    db.session.add(AdminBildirim(
        tur='usta_sikayeti',
        mesaj=f'Şikayet: {usta.ad} {usta.soyad} (#{usta.id}) — sebep: {sebep}'
    ))
    db.session.commit()
    return jsonify({'mesaj': 'Şikayetiniz alındı, ekibimiz inceleyecek.'}), 201


@ustalar_bp.route('/en-yakin', methods=['GET'])
def en_yakin():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    kategori_id = request.args.get('kategori_id', type=int)
    limit = request.args.get('limit', 10, type=int)

    if not lat or not lng:
        return jsonify({'hata': 'Konum gerekli'}), 400

    q = Usta.query.filter_by(onaylanmis=True, aktif=True)
    q = q.filter(~Usta.id.in_(gizli_usta_idleri()))  # duraklatılmış + süresi dolan deneme (hesap kapalı)
    if kategori_id:
        q = q.filter_by(kategori_id=kategori_id)

    ustalar = q.all()
    ustalar_mesafe = []
    for u in ustalar:
        m = u.mesafe_hesapla(lat, lng)
        if m is not None:
            ustalar_mesafe.append((u, m))

    ustalar_mesafe.sort(key=lambda x: x[1])
    ustalar_mesafe = ustalar_mesafe[:limit]

    return jsonify({
        'ustalar': [u.to_dict(lat, lng) for u, _ in ustalar_mesafe]
    })
