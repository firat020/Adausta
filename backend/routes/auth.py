from flask import Blueprint, request, jsonify, session
from models import db, Kullanici, AdminLog, TelefonOtp, Usta, Sirket
from datetime import datetime, timedelta
from extensions import limiter
from sms import sms_gonder
import requests as http_requests
import random
import hashlib

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
@limiter.limit('10 per minute; 30 per hour')
def giris():
    data = request.get_json()
    kullanici = Kullanici.query.filter_by(email=data.get('email')).first()

    if not kullanici:
        return jsonify({'hata': 'Email veya şifre hatalı'}), 401

    if kullanici.sifre_hash is None:
        return jsonify({'hata': 'Bu hesap Google ile giriş yapıyor'}), 403

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
@limiter.limit('5 per minute; 20 per hour')
def kayit():
    data = request.get_json()
    sifre = data.get('sifre', '')
    if len(sifre) < 8:
        return jsonify({'hata': 'Şifre en az 8 karakter olmalı'}), 400
    if Kullanici.query.filter_by(email=data.get('email')).first():
        return jsonify({'hata': 'Bu email zaten kayıtlı'}), 400
    k = Kullanici(email=data.get('email'), rol='musteri')
    k.sifre_set(sifre)
    db.session.add(k)
    db.session.commit()
    session['kullanici_id'] = k.id
    session['rol'] = k.rol
    return jsonify({'mesaj': 'Kayıt başarılı', 'kullanici': k.to_dict()}), 201

def _kullanici_telefon(k):
    """Kullanicinin rolune gore dogrulanmis telefon numarasini bulur."""
    if k.rol == 'usta':
        u = Usta.query.filter_by(kullanici_id=k.id).first()
        return u.telefon if u else None
    if k.rol == 'sirket':
        s = Sirket.query.filter_by(kullanici_id=k.id).first()
        return s.telefon if s else None
    return k.telefon or None


@auth_bp.route('/sifre-sifirla/kod-gonder', methods=['POST'])
@limiter.limit('3 per minute; 10 per hour')
def sifre_sifirla_kod_gonder():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    genel_yanit = jsonify({'mesaj': 'Bu email adresi kayıtlıysa doğrulama kodu gönderildi'})

    if not email:
        return jsonify({'hata': 'Email zorunludur'}), 400

    kullanici = Kullanici.query.filter_by(email=email).first()
    if not kullanici or kullanici.sifre_hash is None:
        return genel_yanit  # kayıt yok ya da Google hesabı — bilgi sızdırma

    telefon = _kullanici_telefon(kullanici)
    if not telefon:
        return genel_yanit  # sistemde telefon kayıtlı değil, SMS gönderilemez

    kod = f'{random.randint(0, 999999):06d}'
    otp = TelefonOtp(
        telefon=telefon,
        kod_hash=hashlib.sha256(kod.encode()).hexdigest(),
        amac='sifre_sifirla',
        kullanici_id=kullanici.id,
        son_kullanma=datetime.utcnow() + timedelta(minutes=5)
    )
    db.session.add(otp)
    db.session.commit()

    sms_gonder(telefon, f'Ada Usta sifre sifirlama kodunuz: {kod}. 5 dakika icinde gecerlidir.')
    return genel_yanit


@auth_bp.route('/sifre-sifirla/dogrula', methods=['POST'])
@limiter.limit('5 per minute; 15 per hour')
def sifre_sifirla_dogrula():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    kod = (data.get('kod') or '').strip()
    yeni_sifre = data.get('yeni_sifre', '')

    if not email or not kod or not yeni_sifre:
        return jsonify({'hata': 'email, kod ve yeni_sifre zorunludur'}), 400
    if len(yeni_sifre) < 8:
        return jsonify({'hata': 'Şifre en az 8 karakter olmalı'}), 400

    kullanici = Kullanici.query.filter_by(email=email).first()
    if not kullanici:
        return jsonify({'hata': 'Kod hatalı veya süresi dolmuş'}), 400

    otp = TelefonOtp.query.filter_by(
        kullanici_id=kullanici.id, amac='sifre_sifirla', dogrulandi=False
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
    kullanici.sifre_set(yeni_sifre)
    kullanici.giris_deneme = 0
    kullanici.kilitli_kadar = None
    db.session.commit()
    log_kaydet('SIFRE_SIFIRLANDI', f'{kullanici.email} şifresini sıfırladı')

    return jsonify({'mesaj': 'Şifreniz güncellendi, giriş yapabilirsiniz'})


@auth_bp.route('/google', methods=['POST'])
@limiter.limit('10 per minute')
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
        kullanici.sifre_hash = None  # OAuth kullanıcısı — şifre yok
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
