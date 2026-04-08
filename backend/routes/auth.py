from flask import Blueprint, request, jsonify, session
from models import db, Kullanici

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/giris', methods=['POST'])
def giris():
    data = request.get_json()
    kullanici = Kullanici.query.filter_by(email=data.get('email')).first()
    if not kullanici or not kullanici.sifre_kontrol(data.get('sifre', '')):
        return jsonify({'hata': 'Email veya şifre hatalı'}), 401
    if not kullanici.aktif:
        return jsonify({'hata': 'Hesabınız aktif değil'}), 403
    session['kullanici_id'] = kullanici.id
    session['rol'] = kullanici.rol
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
