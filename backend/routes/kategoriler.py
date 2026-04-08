from flask import Blueprint, jsonify
from models import Kategori, Sehir, Usta
from sqlalchemy import func

kategoriler_bp = Blueprint('kategoriler', __name__)

@kategoriler_bp.route('/', methods=['GET'])
def listele():
    kategoriler = Kategori.query.filter_by(aktif=True).order_by(Kategori.sira).all()
    sonuc = []
    for k in kategoriler:
        aktif_usta = Usta.query.filter_by(kategori_id=k.id, onaylanmis=True, aktif=True).count()
        d = k.to_dict(aktif_usta)
        sonuc.append(d)

    # Gruplara göre organize et
    gruplar = {}
    for k in sonuc:
        g = k['grup']
        if g not in gruplar:
            gruplar[g] = []
        gruplar[g].append(k)

    return jsonify({'kategoriler': sonuc, 'gruplar': gruplar})

@kategoriler_bp.route('/sehirler', methods=['GET'])
def sehirler():
    sehirler = Sehir.query.all()
    return jsonify({'sehirler': [s.to_dict() for s in sehirler]})
