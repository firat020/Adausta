from flask import Flask, send_from_directory, Response
from flask_cors import CORS
from models import db
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
])

db.init_app(app)

from routes.auth import auth_bp
from routes.ustalar import ustalar_bp
from routes.kategoriler import kategoriler_bp
from routes.admin import admin_bp
from routes.analitik import analitik_bp
from routes.usta_panel import usta_panel_bp
from routes.reklamlar import reklamlar_bp
from routes.musteri_panel import musteri_panel_bp
from routes.ayarlar import ayarlar_bp
from routes.sirketler import sirketler_bp
from routes.sirket_panel import sirket_panel_bp
from routes.odeme import odeme_bp
from routes.magaza import magaza_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(ustalar_bp, url_prefix='/api/ustalar')
app.register_blueprint(kategoriler_bp, url_prefix='/api/kategoriler')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(analitik_bp, url_prefix='/api/analitik')
app.register_blueprint(usta_panel_bp, url_prefix='/api/usta')
app.register_blueprint(reklamlar_bp, url_prefix='/api/reklamlar')
app.register_blueprint(musteri_panel_bp, url_prefix='/api/musteri')
app.register_blueprint(ayarlar_bp, url_prefix='/api/ayarlar')
app.register_blueprint(sirketler_bp, url_prefix='/api/sirketler')
app.register_blueprint(sirket_panel_bp, url_prefix='/api/sirket')
app.register_blueprint(odeme_bp, url_prefix='/api/odeme')
app.register_blueprint(magaza_bp, url_prefix='/api/magaza')

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

@app.route('/sitemap.xml')
def sitemap():
    from models import Usta
    base = 'https://adausta.com'
    urls = []

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
        urls.append(f'<url><loc>{base}{path}</loc><changefreq>{freq}</changefreq><priority>{pri}</priority></url>')

    ustalar = Usta.query.filter_by(onaylanmis=True, aktif=True).all()
    for u in ustalar:
        urls.append(f'<url><loc>{base}/usta/{u.id}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>')

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
    """Süresi dolmuş abonelikleri pasife al, 3 gün içinde dolacakları işaretle."""
    from models import Abonelik, Usta
    simdi = datetime.utcnow()
    bitis_gecmis = Abonelik.query.filter(
        Abonelik.durum == 'aktif',
        Abonelik.bitis != None,
        Abonelik.bitis < simdi
    ).all()
    for a in bitis_gecmis:
        a.durum = 'askida'
        usta = Usta.query.get(a.usta_id)
        if usta:
            usta.plan = 'ucretsiz'
    if bitis_gecmis:
        db.session.commit()


def _baslat_scheduler():
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        scheduler = BackgroundScheduler()
        scheduler.add_job(func=lambda: app.app_context().__enter__() or abonelik_kontrol(),
                          trigger='interval', hours=12, id='abonelik_kontrol')
        scheduler.start()
    except Exception:
        pass  # APScheduler yoksa sessizce atla


with app.app_context():
    db.create_all()

_baslat_scheduler()

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)
