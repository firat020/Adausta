from flask import Blueprint, request, jsonify, session, current_app
from models import db, Sirket, Kullanici, Kategori, Sehir, SirketIsTalebi
from werkzeug.utils import secure_filename
import os, uuid

sirketler_bp = Blueprint('sirketler', __name__)

ALLOWED = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def izin_verilen(dosya_adi):
    return '.' in dosya_adi and dosya_adi.rsplit('.', 1)[1].lower() in ALLOWED


@sirketler_bp.route('/', methods=['GET'])
def listele():
    kategori_id = request.args.get('kategori_id', type=int)
    sehir_id    = request.args.get('sehir_id', type=int)
    sehir_ad    = request.args.get('sehir', '')
    ilce_id     = request.args.get('ilce_id', type=int)
    arama       = request.args.get('arama', '')
    sayfa       = request.args.get('sayfa', 1, type=int)
    limit       = request.args.get('limit', 20, type=int)

    if sehir_ad and not sehir_id:
        s = Sehir.query.filter(Sehir.ad.ilike(f'{sehir_ad}%')).first()
        if s:
            sehir_id = s.id

    q = Sirket.query.filter_by(onaylanmis=True, aktif=True)

    if kategori_id:
        q = q.filter_by(kategori_id=kategori_id)
    if sehir_id:
        q = q.filter_by(sehir_id=sehir_id)
    if ilce_id:
        q = q.filter_by(ilce_id=ilce_id)
    if arama:
        q = q.join(Kategori, Sirket.kategori_id == Kategori.id, isouter=True).filter(
            Sirket.sirket_adi.ilike(f'%{arama}%') |
            Sirket.aciklama.ilike(f'%{arama}%') |
            Kategori.ad.ilike(f'%{arama}%')
        )

    sirketler = q.order_by(Sirket.olusturma.desc()).all()

    toplam = len(sirketler)
    baslangic = (sayfa - 1) * limit
    sirketler = sirketler[baslangic:baslangic + limit]

    return jsonify({
        'sirketler': [s.to_dict() for s in sirketler],
        'toplam': toplam,
        'sayfa': sayfa,
        'toplam_sayfa': (toplam + limit - 1) // limit
    })


@sirketler_bp.route('/<int:id>', methods=['GET'])
def detay(id):
    s = Sirket.query.get_or_404(id)
    return jsonify(s.to_dict())


@sirketler_bp.route('/kayit', methods=['POST'])
def kayit():
    data = request.get_json()
    zorunlu = ['sirket_adi', 'yetkili_ad', 'telefon', 'kategori_id', 'sehir_id', 'email', 'sifre']
    for alan in zorunlu:
        if not data.get(alan):
            return jsonify({'hata': f'{alan} zorunludur'}), 400

    if Kullanici.query.filter_by(email=data['email']).first():
        return jsonify({'hata': 'Bu email adresi zaten kayıtlı'}), 400

    k = Kullanici(email=data['email'], rol='sirket')
    k.sifre_set(data['sifre'])
    db.session.add(k)
    db.session.flush()

    s = Sirket(
        kullanici_id=k.id,
        sirket_adi=data['sirket_adi'],
        vergi_no=data.get('vergi_no', ''),
        yetkili_ad=data['yetkili_ad'],
        telefon=data['telefon'],
        whatsapp=data.get('whatsapp', data['telefon']),
        email=data['email'],
        sehir_id=data['sehir_id'],
        ilce_id=data.get('ilce_id'),
        kategori_id=data['kategori_id'],
        adres=data.get('adres', ''),
        aciklama=data.get('aciklama', ''),
        website=data.get('website', ''),
        onaylanmis=True,
        aktif=True,
    )
    db.session.add(s)
    db.session.commit()

    session['kullanici_id'] = k.id
    session['rol'] = 'sirket'

    return jsonify({'mesaj': 'Kayıt başarılı', 'id': s.id, 'kullanici': k.to_dict()}), 201


@sirketler_bp.route('/<int:id>/is-talebi', methods=['POST'])
def is_talebi_gonder(id):
    sirket = Sirket.query.get_or_404(id)
    data = request.get_json()
    if not data.get('musteri_ad') or not data.get('musteri_telefon') or not data.get('baslik'):
        return jsonify({'hata': 'Ad, telefon ve başlık zorunludur'}), 400

    talep = SirketIsTalebi(
        sirket_id=sirket.id,
        musteri_id=session.get('kullanici_id'),
        musteri_ad=data['musteri_ad'],
        musteri_telefon=data['musteri_telefon'],
        musteri_adres=data.get('musteri_adres', ''),
        baslik=data['baslik'],
        aciklama=data.get('aciklama', ''),
        tercih_tarih=data.get('tercih_tarih', ''),
        durum='bekliyor',
    )
    db.session.add(talep)
    db.session.commit()
    return jsonify({
        'mesaj': 'Talebiniz iletildi! Şirket en kısa sürede sizinle iletişime geçecek.',
        'talep_id': talep.id
    }), 201


@sirketler_bp.route('/<int:id>/logo', methods=['POST'])
def logo_yukle(id):
    s = Sirket.query.get_or_404(id)
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
