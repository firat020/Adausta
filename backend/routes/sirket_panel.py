from flask import Blueprint, request, jsonify, session, current_app
from models import db, Sirket, Kullanici, SirketIsTalebi
from functools import wraps
from werkzeug.utils import secure_filename
import os, uuid

sirket_panel_bp = Blueprint('sirket_panel', __name__)

ALLOWED = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def izin_verilen(dosya_adi):
    return '.' in dosya_adi and dosya_adi.rsplit('.', 1)[1].lower() in ALLOWED

def sirket_gerekli(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('kullanici_id') or session.get('rol') != 'sirket':
            return jsonify({'hata': 'Yetkisiz'}), 401
        return f(*args, **kwargs)
    return decorated

def aktif_sirket():
    return Sirket.query.filter_by(kullanici_id=session['kullanici_id']).first_or_404()


@sirket_panel_bp.route('/panel', methods=['GET'])
@sirket_gerekli
def panel():
    s = aktif_sirket()
    bekleyen = SirketIsTalebi.query.filter_by(sirket_id=s.id, durum='bekliyor').count()
    toplam_talep = SirketIsTalebi.query.filter_by(sirket_id=s.id).count()
    return jsonify({
        'sirket': s.to_dict(),
        'istatistik': {
            'toplam_talep': toplam_talep,
            'bekleyen_talep': bekleyen,
        }
    })


@sirket_panel_bp.route('/profil', methods=['GET'])
@sirket_gerekli
def profil_getir():
    s = aktif_sirket()
    return jsonify({'sirket': s.to_dict()})


@sirket_panel_bp.route('/profil', methods=['PUT'])
@sirket_gerekli
def profil_guncelle():
    s = aktif_sirket()
    data = request.get_json()
    for alan in ['sirket_adi', 'yetkili_ad', 'telefon', 'whatsapp', 'adres', 'aciklama', 'website', 'vergi_no']:
        if alan in data:
            setattr(s, alan, data[alan])
    if 'sehir_id' in data and data['sehir_id']:
        s.sehir_id = int(data['sehir_id'])
    if 'ilce_id' in data:
        s.ilce_id = int(data['ilce_id']) if data['ilce_id'] else None
    if 'kategori_id' in data and data['kategori_id']:
        s.kategori_id = int(data['kategori_id'])
    db.session.commit()
    return jsonify({'mesaj': 'Profil güncellendi', 'sirket': s.to_dict()})


@sirket_panel_bp.route('/profil/logo', methods=['POST'])
@sirket_gerekli
def logo_yukle():
    s = aktif_sirket()
    if 'dosya' not in request.files:
        return jsonify({'hata': 'Dosya yok'}), 400
    dosya = request.files['dosya']
    if not izin_verilen(dosya.filename):
        return jsonify({'hata': 'Desteklenmeyen format'}), 400
    uzanti = dosya.filename.rsplit('.', 1)[1].lower()
    dosya_adi = f"logo_{uuid.uuid4().hex}.{uzanti}"
    kayit_yolu = os.path.join(current_app.config['UPLOAD_FOLDER'], dosya_adi)
    dosya.save(kayit_yolu)
    if s.logo:
        eski = os.path.join(current_app.config['UPLOAD_FOLDER'], s.logo)
        if os.path.exists(eski):
            os.remove(eski)
    s.logo = dosya_adi
    db.session.commit()
    return jsonify({'url': f'/uploads/{dosya_adi}', 'logo': dosya_adi}), 201


@sirket_panel_bp.route('/is-talepleri', methods=['GET'])
@sirket_gerekli
def is_talepleri():
    s = aktif_sirket()
    durum = request.args.get('durum', '')
    q = SirketIsTalebi.query.filter_by(sirket_id=s.id)
    if durum:
        q = q.filter_by(durum=durum)
    talepler = q.order_by(SirketIsTalebi.olusturma.desc()).all()
    return jsonify({'talepler': [t.to_dict() for t in talepler]})


@sirket_panel_bp.route('/is-talepleri/<int:id>', methods=['PUT'])
@sirket_gerekli
def talep_guncelle(id):
    s = aktif_sirket()
    talep = SirketIsTalebi.query.filter_by(id=id, sirket_id=s.id).first_or_404()
    data = request.get_json()
    if 'durum' in data:
        talep.durum = data['durum']
    if 'sirket_notu' in data:
        talep.sirket_notu = data['sirket_notu']
    db.session.commit()
    return jsonify({'mesaj': 'Güncellendi', 'talep': talep.to_dict()})
