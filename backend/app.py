from flask import Flask, send_from_directory, Response
from flask_cors import CORS
from models import db
import os

app = Flask(__name__)
app.secret_key = 'adausta-kktc-2026-gizli-anahtar'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///adausta.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB

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

@app.after_request
def guvenlik_basliklari(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(self), microphone=()'
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


@app.route('/api/saglik')
def saglik():
    return {'durum': 'OK', 'platform': 'AdaUsta KKTC'}

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
