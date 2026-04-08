from flask import Flask, send_from_directory
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

CORS(app, supports_credentials=True, origins=['http://localhost:5173', 'http://localhost:3000'])

db.init_app(app)

from routes.auth import auth_bp
from routes.ustalar import ustalar_bp
from routes.kategoriler import kategoriler_bp
from routes.admin import admin_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(ustalar_bp, url_prefix='/api/ustalar')
app.register_blueprint(kategoriler_bp, url_prefix='/api/kategoriler')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

@app.route('/uploads/<path:dosya>')
def uploads(dosya):
    return send_from_directory(app.config['UPLOAD_FOLDER'], dosya)

@app.route('/api/saglik')
def saglik():
    return {'durum': 'OK', 'platform': 'AdaUsta KKTC'}

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
