from flask import Blueprint, request, jsonify, session
from models import db, Usta, Yorum, Kategori, Kullanici
from functools import wraps

admin_bp = Blueprint('admin', __name__)

def admin_gerekli(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get('rol') != 'admin':
            return jsonify({'hata': 'Yetkisiz'}), 403
        return f(*args, **kwargs)
    return decorated

@admin_bp.route('/ustalar', methods=['GET'])
@admin_gerekli
def ustalar():
    onay_bekleyen = request.args.get('onay_bekleyen', type=int)
    q = Usta.query
    if onay_bekleyen:
        q = q.filter_by(onaylanmis=False)
    return jsonify({'ustalar': [u.to_dict() for u in q.order_by(Usta.olusturma.desc()).all()]})

@admin_bp.route('/ustalar/<int:id>/onayla', methods=['POST'])
@admin_gerekli
def onayla(id):
    u = Usta.query.get_or_404(id)
    u.onaylanmis = True
    db.session.commit()
    return jsonify({'mesaj': 'Usta onaylandı'})

@admin_bp.route('/ustalar/<int:id>/reddet', methods=['POST'])
@admin_gerekli
def reddet(id):
    u = Usta.query.get_or_404(id)
    u.aktif = False
    db.session.commit()
    return jsonify({'mesaj': 'Usta reddedildi'})

@admin_bp.route('/ustalar/<int:id>', methods=['PUT'])
@admin_gerekli
def guncelle(id):
    u = Usta.query.get_or_404(id)
    data = request.get_json()
    for alan in ['ad', 'soyad', 'telefon', 'whatsapp', 'email', 'aciklama', 'sehir_id', 'ilce_id', 'kategori_id', 'deneyim_yil', 'onaylanmis', 'aktif']:
        if alan in data:
            setattr(u, alan, data[alan])
    db.session.commit()
    return jsonify({'mesaj': 'Güncellendi'})

@admin_bp.route('/ustalar/<int:id>', methods=['DELETE'])
@admin_gerekli
def sil(id):
    u = Usta.query.get_or_404(id)
    db.session.delete(u)
    db.session.commit()
    return jsonify({'mesaj': 'Silindi'})

@admin_bp.route('/yorumlar', methods=['GET'])
@admin_gerekli
def yorumlar():
    onay_bekleyen = request.args.get('onay_bekleyen', type=int)
    q = Yorum.query
    if onay_bekleyen:
        q = q.filter_by(onaylanmis=False)
    return jsonify({'yorumlar': [y.to_dict() for y in q.order_by(Yorum.tarih.desc()).all()]})

@admin_bp.route('/yorumlar/<int:id>/onayla', methods=['POST'])
@admin_gerekli
def yorum_onayla(id):
    y = Yorum.query.get_or_404(id)
    y.onaylanmis = True
    db.session.commit()
    return jsonify({'mesaj': 'Yorum onaylandı'})

@admin_bp.route('/yorumlar/<int:id>', methods=['DELETE'])
@admin_gerekli
def yorum_sil(id):
    y = Yorum.query.get_or_404(id)
    db.session.delete(y)
    db.session.commit()
    return jsonify({'mesaj': 'Yorum silindi'})

@admin_bp.route('/istatistik', methods=['GET'])
@admin_gerekli
def istatistik():
    return jsonify({
        'toplam_usta': Usta.query.count(),
        'onaylanan_usta': Usta.query.filter_by(onaylanmis=True).count(),
        'bekleyen_usta': Usta.query.filter_by(onaylanmis=False, aktif=True).count(),
        'toplam_yorum': Yorum.query.count(),
        'bekleyen_yorum': Yorum.query.filter_by(onaylanmis=False).count(),
        'toplam_kategori': Kategori.query.count(),
    })
