from flask import Blueprint, request, jsonify, session
from models import db, Kullanici, AdminLog
from datetime import datetime, timedelta
import requests as http_requests

auth_bp = Blueprint('auth', __name__)

MAX_DENEME = 5
KILIT_SURE_DK = 15

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

@auth_bp.route('/giris', methods=['POST'])
def giris():
    data = request.get_json()
    kullanici = Kullanici.query.filter_by(email=data.get('email')).first()

    if not kullanici:
        return jsonify({'hata': 'Email veya şifre hatalı'}), 401

    if kullanici.kilitli_mi():
        return jsonify({'hata': f'Hesap kilitli. {KILIT_SURE_DK} dakika sonra tekrar deneyin.'}), 429

    if not kullanici.sifre_kontrol(data.get('sifre', '')):
        kullanici.giris_deneme = (kullanici.giris_deneme or 0) + 1
        if kullanici.giris_deneme >= MAX_DENEME:
            kullanici.kilitli_kadar = datetime.utcnow() + timedelta(minutes=KILIT_SURE_DK)
            kullanici.giris_deneme = 0
            db.session.commit()
            return jsonify({'hata': f'Çok fazla hatalı giriş. Hesap {KILIT_SURE_DK} dakika kilitlendi.'}), 429
        kalan = MAX_DENEME - kullanici.giris_deneme
        db.session.commit()
        return jsonify({'hata': f'Şifre hatalı. {kalan} deneme hakkınız kaldı.'}), 401

    if not kullanici.aktif:
        return jsonify({'hata': 'Hesabınız aktif değil'}), 403

    kullanici.giris_deneme = 0
    kullanici.kilitli_kadar = None
    db.session.commit()

    session['kullanici_id'] = kullanici.id
    session['rol'] = kullanici.rol
    log_kaydet('GİRİŞ', f'{kullanici.email} giriş yaptı')
    return jsonify({'mesaj': 'Giriş başarılı', 'kullanici': kullanici.to_dict()})

@auth_bp.route('/kayit', methods=['POST'])
def kayit():
    data = request.get_json()
    if Kullanici.query.filter_by(email=data.get('email')).first():
        return jsonify({'hata': 'Bu email zaten kayıtlı'}), 400
    k = Kullanici(email=data.get('email'), rol='musteri')
    k.sifre_set(data.get('sifre'))
    db.session.add(k)
    db.session.commit()
    session['kullanici_id'] = k.id
    session['rol'] = k.rol
    return jsonify({'mesaj': 'Kayıt başarılı', 'kullanici': k.to_dict()}), 201

@auth_bp.route('/google', methods=['POST'])
def google_giris():
    data = request.get_json()
    credential = data.get('credential')       # GIS ID token (JWT)
    access_token = data.get('access_token')   # OAuth2 access token

    email = None
    try:
        if credential:
            # Verify ID token via Google tokeninfo endpoint
            r = http_requests.get(
                f'https://oauth2.googleapis.com/tokeninfo?id_token={credential}',
                timeout=5
            )
            if r.status_code != 200:
                return jsonify({'hata': 'Google doğrulama başarısız'}), 401
            info = r.json()
            email = info.get('email')
        elif access_token:
            r = http_requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=5
            )
            if r.status_code != 200:
                return jsonify({'hata': 'Google doğrulama başarısız'}), 401
            email = r.json().get('email')
        else:
            return jsonify({'hata': 'Token gerekli'}), 400
    except Exception:
        return jsonify({'hata': 'Google bağlantısı başarısız'}), 500

    if not email:
        return jsonify({'hata': 'Email alınamadı'}), 400

    kullanici = Kullanici.query.filter_by(email=email).first()
    if not kullanici:
        kullanici = Kullanici(email=email, rol='musteri')
        kullanici.sifre_set('google_oauth_' + email)
        db.session.add(kullanici)
        db.session.commit()

    if not kullanici.aktif:
        return jsonify({'hata': 'Hesabınız aktif değil'}), 403

    session['kullanici_id'] = kullanici.id
    session['rol'] = kullanici.rol
    log_kaydet('GOOGLE_GİRİŞ', f'{email} Google ile giriş yaptı')
    return jsonify({'mesaj': 'Giriş başarılı', 'kullanici': kullanici.to_dict()})

@auth_bp.route('/cikis', methods=['POST'])
def cikis():
    session.clear()
    return jsonify({'mesaj': 'Çıkış yapıldı'})

@auth_bp.route('/ben', methods=['GET'])
def ben():
    kid = session.get('kullanici_id')
    if not kid:
        return jsonify({'kullanici': None})
    k = Kullanici.query.get(kid)
    return jsonify({'kullanici': k.to_dict() if k else None})
