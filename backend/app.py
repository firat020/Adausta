from flask import Flask, send_from_directory, Response
from flask_cors import CORS
from models import db
from extensions import limiter
import os
from datetime import datetime, timedelta

def _load_env():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip())
_load_env()

app = Flask(__name__)
_secret = os.environ.get('SECRET_KEY')
if not _secret:
    raise RuntimeError('SECRET_KEY ortam değişkeni ayarlanmamış')
app.secret_key = _secret
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///adausta.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

CORS(app, supports_credentials=True, origins=[
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://192.168.88.253:5000',
    'http://192.168.88.253:8080',
    # APK (Capacitor WebView)
    'capacitor://localhost',
    'https://localhost',
    'http://localhost',
    'https://adausta.com',
    'http://adausta.com',
    'https://www.adausta.com',
    'http://www.adausta.com',
])

db.init_app(app)
limiter.init_app(app)

from routes.auth import auth_bp
from routes.ustalar import ustalar_bp
from routes.kategoriler import kategoriler_bp, istatistikler_bp
from routes.admin import admin_bp
from routes.analitik import analitik_bp
from routes.usta_panel import usta_panel_bp
from routes.reklamlar import reklamlar_bp
from routes.musteri_panel import musteri_panel_bp
from routes.ayarlar import ayarlar_bp
from routes.sirketler import sirketler_bp
from routes.sirket_panel import sirket_panel_bp
from routes.odeme import odeme_bp
from routes.odeme_cardplus import odeme_cardplus_bp
from routes.telefon_dogrulama import telefon_dogrulama_bp
from routes.magaza import magaza_bp
from routes.satici_basvuru import satici_basvuru_bp
from routes.admin_saticilar import admin_saticilar_bp
from routes.fcm_token import fcm_token_bp
from routes.satici_panel import satici_panel_bp
from routes.iade import iade_bp
from routes.admin_finans import admin_finans_bp
from routes.satici_yorum import satici_yorum_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(ustalar_bp, url_prefix='/api/ustalar')
app.register_blueprint(kategoriler_bp, url_prefix='/api/kategoriler')
app.register_blueprint(istatistikler_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(analitik_bp, url_prefix='/api/analitik')
app.register_blueprint(usta_panel_bp, url_prefix='/api/usta')
app.register_blueprint(reklamlar_bp, url_prefix='/api/reklamlar')
app.register_blueprint(musteri_panel_bp, url_prefix='/api/musteri')
app.register_blueprint(ayarlar_bp, url_prefix='/api/ayarlar')
app.register_blueprint(sirketler_bp, url_prefix='/api/sirketler')
app.register_blueprint(sirket_panel_bp, url_prefix='/api/sirket')
app.register_blueprint(odeme_bp, url_prefix='/api/odeme')
app.register_blueprint(odeme_cardplus_bp, url_prefix='/api/odeme/cardplus')
app.register_blueprint(telefon_dogrulama_bp, url_prefix='/api/telefon-dogrulama')
app.register_blueprint(magaza_bp, url_prefix='/api/magaza')
app.register_blueprint(satici_basvuru_bp, url_prefix='/api/satici')
app.register_blueprint(admin_saticilar_bp, url_prefix='/api/admin')
app.register_blueprint(fcm_token_bp, url_prefix='/api/fcm')
app.register_blueprint(satici_panel_bp, url_prefix='/api/satici-panel')
app.register_blueprint(iade_bp, url_prefix='/api/iade')
app.register_blueprint(admin_finans_bp, url_prefix='/api/admin/finans')
app.register_blueprint(satici_yorum_bp, url_prefix='/api/satici-yorum')

@app.after_request
def guvenlik_basliklari(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(self), microphone=()'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://accounts.google.com; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com; "
        "frame-src https://accounts.google.com; "
        "object-src 'none';"
    )
    return response


@app.route('/uploads/<path:dosya>')
def uploads(dosya):
    return send_from_directory(app.config['UPLOAD_FOLDER'], dosya)

def _slug_uret(metin):
    """Frontend'deki addenSlug() ile birebir aynı algoritma (hizmetler.js)."""
    import re
    metin = (metin or '').lower()
    metin = metin.replace(' & ', '-').replace(' ', '-')
    for a, b in (('ç','c'),('ş','s'),('ğ','g'),('ü','u'),('ö','o'),('ı','i'),('İ','i')):
        metin = metin.replace(a, b)
    return re.sub(r'[^a-z0-9-]', '', metin)


# Blog yazıları statik (frontend/src/pages/Blog.jsx içinde tanımlı, DB'de yok)
_BLOG_SLUGLARI = [
    'kibris-su-kacagi-tespiti',
    'kktc-elektrikci-bulma-rehberi',
    'lefkosa-klima-servisi',
    'kibris-boya-badana-fiyatlari',
    'kktc-ev-temizligi-hizmetleri',
    'girne-nakliyat-rehberi',
]

# 5 şehir (frontend/src/data/hizmetler.js SEHIR_SLUG ile birebir aynı)
_SEHIR_SLUGLARI = ['lefkosa', 'girne', 'gazimagusa', 'guzelyurt', 'iskele']


@app.route('/sitemap.xml')
def sitemap():
    from models import Usta, Kategori, Sirket
    base = 'https://adausta.com'
    urls = []

    def ekle(path, pri, freq):
        urls.append(f'<url><loc>{base}{path}</loc><changefreq>{freq}</changefreq><priority>{pri}</priority></url>')

    static_pages = [
        ('/', '1.0', 'daily'),
        ('/ustalar', '0.9', 'daily'),
        ('/kategoriler', '0.8', 'weekly'),
        ('/sirketler', '0.8', 'weekly'),
        ('/en-yakin', '0.7', 'weekly'),
        ('/blog', '0.7', 'weekly'),
        ('/usta-kayit', '0.6', 'monthly'),
        ('/sirket-kayit', '0.6', 'monthly'),
    ]
    for path, pri, freq in static_pages:
        ekle(path, pri, freq)

    # Usta profilleri — SEO'lu slug ile (frontend ustaSlugUrl() ile aynı format)
    from usta_gorunurluk import gizli_usta_idleri
    ustalar = Usta.query.filter_by(onaylanmis=True, aktif=True).filter(~Usta.id.in_(gizli_usta_idleri())).all()
    for u in ustalar:
        ad_soyad = f'{u.ad} {u.soyad}'.strip()
        parcalar = ' '.join(filter(None, [ad_soyad, u.kategori.ad if u.kategori else '', u.sehir.ad if u.sehir else '']))
        slug = _slug_uret(parcalar)
        yol = f'/usta/{u.id}-{slug}' if slug else f'/usta/{u.id}'
        ekle(yol, '0.9', 'weekly')

    # Şirket profilleri
    sirketler = Sirket.query.filter_by(onaylanmis=True, aktif=True).all()
    for s in sirketler:
        ekle(f'/sirket/{s.id}', '0.7', 'weekly')

    # Kategori (hizmet) sayfaları + kategori×şehir kombinasyonları
    kategoriler = Kategori.query.filter_by(aktif=True).all()
    for k in kategoriler:
        kslug = _slug_uret(k.ad)
        if not kslug:
            continue
        ekle(f'/hizmet/{kslug}', '0.85', 'weekly')
        for sslug in _SEHIR_SLUGLARI:
            ekle(f'/hizmet/{kslug}/{sslug}', '0.8', 'weekly')

    # Blog yazıları
    for bslug in _BLOG_SLUGLARI:
        ekle(f'/blog/{bslug}', '0.6', 'monthly')

    xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join(urls) + '</urlset>'
    return Response(xml, mimetype='application/xml')


@app.route('/robots.txt')
def robots():
    content = "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nSitemap: https://adausta.com/sitemap.xml\n"
    return Response(content, mimetype='text/plain')


@app.route('/google6ecd33fc3d70a635.html')
def google_dogrulama():
    return Response('google-site-verification: google6ecd33fc3d70a635.html', mimetype='text/html')


@app.route('/api/saglik')
def saglik():
    return {'durum': 'OK', 'platform': 'AdaUsta KKTC'}

def abonelik_kontrol():
    from abonelik_isleri import abonelik_kontrol as _kontrol
    _kontrol()


def abonelik_uyari_bildirim():
    """Üyeliği 7/3/1 gün içinde veya bugün biten ustalara FCM bildirimi gönder.
    Otomatik yenilemesi açık (kayıtlı kartı olan) ustalara 'giriş yapıp yenileyin' yerine
    otomatik tahsilatın yaklaştığını bildiren bir metin gider — aksi halde gereksiz
    endişe/karışıklık yaratır (bkz. deneme süresi + otomatik ödeme akışı)."""
    from models import Usta, FCMToken, BildirimGecmisi, Abonelik
    simdi = datetime.utcnow()
    bugun = simdi.date()
    bugun_baslangic = datetime(simdi.year, simdi.month, simdi.day)

    ustalar = Usta.query.filter(
        Usta.plan != 'ucretsiz',
        Usta.plan_bitis != None,
        Usta.aktif == True,
        Usta.kullanici_id != None,
    ).all()

    for u in ustalar:
        kalan = (u.plan_bitis.date() - bugun).days
        if kalan > 14 or kalan < 0:
            continue

        # Bugün zaten bildirim gönderildi mi?
        zaten = BildirimGecmisi.query.filter(
            BildirimGecmisi.kullanici_id == u.kullanici_id,
            BildirimGecmisi.tur == 'uyelik_uyari',
            BildirimGecmisi.olusturma >= bugun_baslangic,
        ).first()
        if zaten:
            continue

        ab = Abonelik.query.filter_by(usta_id=u.id, durum='aktif').order_by(Abonelik.id.desc()).first()
        otomatik_acik = bool(ab and ab.otomatik_yenileme and u.cardplus_safekey)
        deneme_mi = bool(ab and ab.deneme_mi)
        # Normal üyelikte 7/3/1/0, kartsız denemede ek olarak 14 gün kala hatırlat (ödemeye dönüşüm için daha çok temas)
        if kalan not in ((14, 7, 3, 1, 0) if deneme_mi else (7, 3, 1, 0)):
            continue

        if otomatik_acik:
            if kalan == 0:
                baslik = 'Deneminiz Sona Erdi' if deneme_mi else 'Aboneliginiz Yenileniyor'
                icerik = ('Ucretsiz deneme sureniz bugun sona eriyor, kayitli kartinizdan otomatik tahsilat denenecek.'
                           if deneme_mi else 'Kayitli kartinizdan otomatik yenileme tahsilati bugun denenecek.')
            else:
                baslik = f'{"Deneminiz" if deneme_mi else "Aboneliginiz"} {kalan} Gun Sonra Bitiyor'
                icerik = (f'Ucretsiz deneme sureniz {kalan} gun icinde sona eriyor, kayitli kartinizdan otomatik tahsilat baslayacak. '
                           f'Istemiyorsaniz panelinizden otomatik yenilemeyi kapatabilirsiniz.' if deneme_mi else
                           f'Aboneliginiz {kalan} gun icinde kayitli kartinizdan otomatik olarak yenilenecek.')
        elif deneme_mi:
            # Kartsız 90 gün deneme: tahsilat otomatik yapılmaz, kullanıcıyı ödemeye çağırıyoruz.
            if kalan == 0:
                baslik = 'Ucretsiz Deneminiz Bugun Bitiyor'
                icerik = 'Ucretsiz deneme sureniz bugun bitiyor. Odeme yapmazsaniz hesabiniz kapatilacak ve profiliniz yayindan kalkacak. Devam etmek icin kredi kartiyla odeme yapin.'
            else:
                baslik = f'Deneminiz {kalan} Gun Sonra Bitiyor'
                icerik = (f'Ucretsiz deneme sureniz {kalan} gun icinde sona erecek. Odeme yapmazsaniz hesabiniz '
                           f'kapatilacak ve profiliniz yayindan kalkacak. Devam etmek icin kredi kartiyla odeme yapin.')
        elif kalan == 0:
            baslik = 'Uyeliginiz Sona Erdi'
            icerik = 'AdaUsta uyeliginiz sona erdi. Yenilemek icin giris yapiniz.'
        else:
            baslik = f'Uyeliginiz {kalan} Gun Sonra Bitiyor'
            icerik = f'AdaUsta uyeliginiz {kalan} gun icinde sona erecek. Yenilemek icin giris yapiniz.'

        tokenlar = [t.token for t in FCMToken.query.filter_by(kullanici_id=u.kullanici_id, aktif=True).all()]

        gecmis = BildirimGecmisi(
            kullanici_id=u.kullanici_id,
            baslik=baslik,
            icerik=icerik,
            tur='uyelik_uyari',
            gonderildi=False,
        )
        db.session.add(gecmis)

        if tokenlar:
            from fcm import toplu_bildirim_gonder
            sonuc = toplu_bildirim_gonder(tokenlar, baslik, icerik, {'ekran': 'abonelik'})
            gecmis.gonderildi = sonuc['basarili'] > 0
            if sonuc['gecersiz']:
                FCMToken.query.filter(FCMToken.token.in_(sonuc['gecersiz'])).delete(synchronize_session=False)

        # Kartsız denemede push yetmez (uygulaması/izni olmayan çok kişi var): SMS de gönder.
        # Ayarlardaki "Abonelik ve deneme hatırlatmaları" kapalıysa saygı göster.
        if deneme_mi and u.telefon and u.bildirim_tercihi().get('abonelik_bildirim', True):
            from sms import sms_gonder
            if sms_gonder(u.telefon, f'Ada Usta - {baslik}: {icerik} adausta.com/usta/panel/abonelik'):
                gecmis.gonderildi = True

    db.session.commit()
    _deneme_bitti_geri_kazanim()


def _deneme_bitti_geri_kazanim():
    """Kartsız deneme bitmiş (askida) ve ödeme yapmamış ustalara bitişten 1 ve 7 gün sonra
    'ödeme yaparak geri dön' SMS'i/bildirimi gönderir. Aynı gün tekrar gönderilmez."""
    from models import Usta, FCMToken, BildirimGecmisi, Abonelik
    simdi = datetime.utcnow()
    bugun = simdi.date()
    bugun_baslangic = datetime(simdi.year, simdi.month, simdi.day)

    adaylar = Abonelik.query.filter(
        Abonelik.deneme_mi == True,  # noqa: E712
        Abonelik.durum == 'askida',
        Abonelik.bitis != None,
    ).all()
    for ab in adaylar:
        gecen = (bugun - ab.bitis.date()).days
        if gecen not in (1, 7):
            continue
        u = Usta.query.get(ab.usta_id)
        if not u or not u.aktif or not u.kullanici_id:
            continue
        # Bu arada ücretli abonelik almışsa rahatsız etme
        if Abonelik.query.filter(Abonelik.usta_id == u.id, Abonelik.durum == 'aktif').first():
            continue
        if BildirimGecmisi.query.filter(
            BildirimGecmisi.kullanici_id == u.kullanici_id,
            BildirimGecmisi.tur == 'deneme_bitti',
            BildirimGecmisi.olusturma >= bugun_baslangic,
        ).first():
            continue
        if not u.bildirim_tercihi().get('abonelik_bildirim', True):
            continue

        baslik = 'Ucretsiz Deneminiz Bitti'
        icerik = 'Hesabiniz kapali, profiliniz yayinda degil. Musteri taleplerini almak icin kredi kartiyla odeme yaparak hesabinizi yeniden acin.'
        gecmis = BildirimGecmisi(kullanici_id=u.kullanici_id, baslik=baslik, icerik=icerik,
                                 tur='deneme_bitti', gonderildi=False)
        db.session.add(gecmis)
        tokenlar = [t.token for t in FCMToken.query.filter_by(kullanici_id=u.kullanici_id, aktif=True).all()]
        if tokenlar:
            from fcm import toplu_bildirim_gonder
            sonuc = toplu_bildirim_gonder(tokenlar, baslik, icerik, {'ekran': 'abonelik'})
            gecmis.gonderildi = sonuc['basarili'] > 0
        if u.telefon:
            from sms import sms_gonder
            if sms_gonder(u.telefon, f'Ada Usta - {baslik}: {icerik} adausta.com/usta/panel/abonelik'):
                gecmis.gonderildi = True
    db.session.commit()


def bekleyen_talep_uyari():
    """48 saattir 'bekliyor' durumunda kalan ve okunmamış iş taleplerini admin'e bildirir.
    Aynı talep için birden fazla bildirim düşmesin diye mesaj metnine talep id'si
    gömülür ve önceden bildirilmiş mi diye buradan kontrol edilir."""
    from models import IsTalebi, AdminBildirim
    esik = datetime.utcnow() - timedelta(hours=48)
    talepler = IsTalebi.query.filter(
        IsTalebi.durum == 'bekliyor',
        IsTalebi.okundu == False,
        IsTalebi.olusturma <= esik,
    ).all()

    for t in talepler:
        etiket = f'[talep#{t.id}]'
        zaten = AdminBildirim.query.filter(
            AdminBildirim.tur == 'bekleyen_talep',
            AdminBildirim.mesaj.like(f'%{etiket}%'),
        ).first()
        if zaten:
            continue
        gun = (datetime.utcnow() - t.olusturma).days
        bildirim = AdminBildirim(
            tur='bekleyen_talep',
            mesaj=f'{etiket} "{t.baslik}" talebi {gun} gündür ustaya ulaşılamadan bekliyor — {t.musteri_ad}',
        )
        db.session.add(bildirim)
    db.session.commit()


def fcm_token_temizle():
    """90 günden eski FCM tokenları temizle."""
    from models import FCMToken
    kesim = datetime.utcnow() - timedelta(days=90)
    FCMToken.query.filter(FCMToken.son_guncelleme < kesim).delete(synchronize_session=False)
    db.session.commit()


def _run_with_context(fn):
    def wrapper():
        with app.app_context():
            fn()
    return wrapper


def _baslat_scheduler():
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        scheduler = BackgroundScheduler()
        scheduler.add_job(func=_run_with_context(abonelik_kontrol),
                          trigger='interval', hours=12, id='abonelik_kontrol')
        # Her gün 06:00 UTC (KKTC 09:00): yeniden başlatma günü kaydırıp mesajı kaçırmasın
        scheduler.add_job(func=_run_with_context(abonelik_uyari_bildirim),
                          trigger='cron', hour=6, minute=0, id='abonelik_uyari',
                          misfire_grace_time=6 * 3600, coalesce=True)
        scheduler.add_job(func=_run_with_context(fcm_token_temizle),
                          trigger='interval', days=7, id='fcm_temizle')
        scheduler.add_job(func=_run_with_context(bekleyen_talep_uyari),
                          trigger='interval', hours=6, id='bekleyen_talep_uyari')
        scheduler.start()
    except Exception:
        pass  # APScheduler yoksa sessizce atla


with app.app_context():
    from schema_guard import telefon_dogrulama_semasini_guncelle
    telefon_dogrulama_semasini_guncelle(db)  # eski DB'ye yeni sütunları ekler (create_all eklemez)
    db.create_all()

_baslat_scheduler()

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)
