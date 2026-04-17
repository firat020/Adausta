from flask import Blueprint, request, jsonify, session
from models import db, Reklam, Kategori
from datetime import datetime
from functools import wraps

reklamlar_bp = Blueprint('reklamlar', __name__)


def admin_gerekli(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get('rol') != 'admin':
            return jsonify({'hata': 'Yetkisiz'}), 403
        return f(*args, **kwargs)
    return decorated


# ──────────────────────────────────────────────────────────
# Public — kategori sayfasında gösterilecek reklamları getir
# ──────────────────────────────────────────────────────────
@reklamlar_bp.route('/', methods=['GET'])
def reklamlar_listele():
    kategori_id = request.args.get('kategori_id', type=int)
    konum = request.args.get('konum')  # sol / sag / ust

    q = Reklam.query.filter_by(aktif=True)
    if konum:
        q = q.filter_by(konum=konum)

    tum = q.all()
    # Aktif olanları filtrele (tarih aralığı kontrolü) ve kategoriye göre filtrele
    sonuc = []
    for r in tum:
        if not r.aktif_mi():
            continue
        # kategori_id=None ise tüm sayfalarda görünür
        if r.kategori_id is None or r.kategori_id == kategori_id:
            sonuc.append(r)
            # Görüntüleme say
            r.goruntuleme = (r.goruntuleme or 0) + 1

    db.session.commit()

    sol = [r.to_dict() for r in sonuc if r.konum == 'sol']
    sag = [r.to_dict() for r in sonuc if r.konum == 'sag']
    ust = [r.to_dict() for r in sonuc if r.konum == 'ust']

    return jsonify({'sol': sol, 'sag': sag, 'ust': ust})


# ──────────────────────────────────────────────────────────
# Tıklanma kaydı
# ──────────────────────────────────────────────────────────
@reklamlar_bp.route('/<int:rid>/tikla', methods=['POST'])
def reklam_tikla(rid):
    r = Reklam.query.get_or_404(rid)
    r.tiklanma = (r.tiklanma or 0) + 1
    db.session.commit()
    return jsonify({'tiklanma': r.tiklanma})


# ──────────────────────────────────────────────────────────
# Admin — CRUD
# ──────────────────────────────────────────────────────────
@reklamlar_bp.route('/admin', methods=['GET'])
@admin_gerekli
def admin_listele():
    tum = Reklam.query.order_by(Reklam.olusturma.desc()).all()
    return jsonify({'reklamlar': [r.to_dict() for r in tum]})


@reklamlar_bp.route('/admin', methods=['POST'])
@admin_gerekli
def admin_ekle():
    data = request.get_json()
    r = Reklam(
        baslik=data.get('baslik', ''),
        aciklama=data.get('aciklama', ''),
        resim_url=data.get('resim_url', ''),
        link_url=data.get('link_url', ''),
        firma_adi=data.get('firma_adi', ''),
        kategori_id=data.get('kategori_id'),
        konum=data.get('konum', 'sol'),
        aktif=data.get('aktif', True),
    )
    if data.get('baslangic'):
        r.baslangic = datetime.strptime(data['baslangic'], '%Y-%m-%d')
    if data.get('bitis'):
        r.bitis = datetime.strptime(data['bitis'], '%Y-%m-%d')
    db.session.add(r)
    db.session.commit()
    return jsonify({'mesaj': 'Reklam eklendi', 'reklam': r.to_dict()}), 201


@reklamlar_bp.route('/admin/<int:rid>', methods=['PUT'])
@admin_gerekli
def admin_guncelle(rid):
    r = Reklam.query.get_or_404(rid)
    data = request.get_json()
    for alan in ['baslik', 'aciklama', 'resim_url', 'link_url',
                 'firma_adi', 'kategori_id', 'konum', 'aktif']:
        if alan in data:
            setattr(r, alan, data[alan])
    if data.get('baslangic'):
        r.baslangic = datetime.strptime(data['baslangic'], '%Y-%m-%d')
    if data.get('bitis'):
        r.bitis = datetime.strptime(data['bitis'], '%Y-%m-%d')
    db.session.commit()
    return jsonify({'mesaj': 'Reklam güncellendi', 'reklam': r.to_dict()})


@reklamlar_bp.route('/admin/<int:rid>', methods=['DELETE'])
@admin_gerekli
def admin_sil(rid):
    r = Reklam.query.get_or_404(rid)
    db.session.delete(r)
    db.session.commit()
    return jsonify({'mesaj': 'Reklam silindi'})
