from flask import Blueprint, request, jsonify, session, current_app
from models import db, Usta, Fotograf, Yorum, IsTalebi, Kullanici
from werkzeug.utils import secure_filename
import os, uuid

ustalar_bp = Blueprint('ustalar', __name__)

ALLOWED = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def izin_verilen(dosya_adi):
    return '.' in dosya_adi and dosya_adi.rsplit('.', 1)[1].lower() in ALLOWED

@ustalar_bp.route('/', methods=['GET'])
def listele():
    kategori_id = request.args.get('kategori_id', type=int)
    sehir_id = request.args.get('sehir_id', type=int)
    ilce_id = request.args.get('ilce_id', type=int)
    arama = request.args.get('arama', '')
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    yakin = request.args.get('yakin', type=int, default=0)  # km
    sayfa = request.args.get('sayfa', 1, type=int)
    limit = request.args.get('limit', 20, type=int)

    q = Usta.query.filter_by(onaylanmis=True, aktif=True)

    if kategori_id:
        q = q.filter_by(kategori_id=kategori_id)
    if sehir_id:
        q = q.filter_by(sehir_id=sehir_id)
    if ilce_id:
        q = q.filter_by(ilce_id=ilce_id)
    if arama:
        q = q.filter(Usta.ad.ilike(f'%{arama}%') | Usta.aciklama.ilike(f'%{arama}%'))

    ustalar = q.all()

    # En yakın usta filtresi
    if lat and lng and yakin:
        ustalar = [u for u in ustalar if u.mesafe_hesapla(lat, lng) is not None and u.mesafe_hesapla(lat, lng) <= yakin]
        ustalar.sort(key=lambda u: u.mesafe_hesapla(lat, lng))
    elif lat and lng:
        ustalar = sorted(ustalar, key=lambda u: (u.mesafe_hesapla(lat, lng) or 9999))

    toplam = len(ustalar)
    baslangic = (sayfa - 1) * limit
    ustalar = ustalar[baslangic:baslangic + limit]

    return jsonify({
        'ustalar': [u.to_dict(lat, lng) for u in ustalar],
        'toplam': toplam,
        'sayfa': sayfa,
        'toplam_sayfa': (toplam + limit - 1) // limit
    })

@ustalar_bp.route('/<int:id>', methods=['GET'])
def detay(id):
    u = Usta.query.get_or_404(id)
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    veri = u.to_dict(lat, lng)
    veri['yorumlar'] = [y.to_dict() for y in u.yorumlar if y.onaylanmis]
    return jsonify(veri)

@ustalar_bp.route('/kayit', methods=['POST'])
def kayit():
    data = request.get_json()
    zorunlu = ['ad', 'telefon', 'kategori_id', 'sehir_id', 'email', 'sifre']
    for alan in zorunlu:
        if not data.get(alan):
            return jsonify({'hata': f'{alan} zorunludur'}), 400

    # Email zaten var mı kontrol et
    if Kullanici.query.filter_by(email=data['email']).first():
        return jsonify({'hata': 'Bu email adresi zaten kayıtlı'}), 400

    # Kullanıcı hesabı oluştur
    k = Kullanici(email=data['email'], rol='usta')
    k.sifre_set(data['sifre'])
    db.session.add(k)
    db.session.flush()  # k.id'yi al

    u = Usta(
        kullanici_id=k.id,
        ad=data['ad'],
        soyad=data.get('soyad', ''),
        telefon=data['telefon'],
        whatsapp=data.get('whatsapp', data['telefon']),
        email=data['email'],
        sehir_id=data['sehir_id'],
        ilce_id=data.get('ilce_id'),
        kategori_id=data['kategori_id'],
        aciklama=data.get('aciklama', ''),
        deneyim_yil=data.get('deneyim_yil', 0),
        lat=data.get('lat'),
        lng=data.get('lng'),
        onaylanmis=True,
        aktif=True
    )
    db.session.add(u)
    db.session.commit()

    # Otomatik giriş yap
    session['kullanici_id'] = k.id
    session['rol'] = 'usta'

    return jsonify({'mesaj': 'Kayıt başarılı', 'id': u.id, 'kullanici': k.to_dict()}), 201

@ustalar_bp.route('/<int:id>/fotograf', methods=['POST'])
def fotograf_yukle(id):
    u = Usta.query.get_or_404(id)
    if 'dosya' not in request.files:
        return jsonify({'hata': 'Dosya yok'}), 400
    dosya = request.files['dosya']
    if not izin_verilen(dosya.filename):
        return jsonify({'hata': 'Desteklenmeyen format'}), 400
    uzanti = dosya.filename.rsplit('.', 1)[1].lower()
    dosya_adi = f"{uuid.uuid4().hex}.{uzanti}"
    kayit_yolu = os.path.join(current_app.config['UPLOAD_FOLDER'], dosya_adi)
    dosya.save(kayit_yolu)
    f = Fotograf(usta_id=id, dosya=dosya_adi)
    db.session.add(f)
    db.session.commit()
    return jsonify({'url': f'/uploads/{dosya_adi}'}), 201

@ustalar_bp.route('/<int:id>/yorum', methods=['POST'])
def yorum_ekle(id):
    Usta.query.get_or_404(id)
    data = request.get_json()
    if not data.get('musteri_adi') or not data.get('puan'):
        return jsonify({'hata': 'Ad ve puan zorunludur'}), 400
    puan = int(data['puan'])
    if puan < 1 or puan > 5:
        return jsonify({'hata': 'Puan 1-5 arası olmalı'}), 400
    y = Yorum(
        usta_id=id,
        musteri_adi=data['musteri_adi'],
        puan=puan,
        yorum=data.get('yorum', ''),
        onaylanmis=False
    )
    db.session.add(y)
    db.session.commit()
    return jsonify({'mesaj': 'Yorumunuz alındı, onay bekliyor'}), 201

@ustalar_bp.route('/<int:id>/is-talebi', methods=['POST'])
def is_talebi_gonder(id):
    """Müşteri bir ustaya iş/arıza talebi gönderir."""
    usta = Usta.query.get_or_404(id)
    data = request.get_json()
    if not data.get('musteri_ad') or not data.get('musteri_telefon') or not data.get('baslik'):
        return jsonify({'hata': 'Ad, telefon ve başlık zorunludur'}), 400

    talep = IsTalebi(
        usta_id=usta.id,
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
    return jsonify({'mesaj': 'Talebiniz iletildi! Usta en kısa sürede sizinle iletişime geçecek.',
                    'talep_id': talep.id}), 201


@ustalar_bp.route('/en-yakin', methods=['GET'])
def en_yakin():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    kategori_id = request.args.get('kategori_id', type=int)
    limit = request.args.get('limit', 10, type=int)

    if not lat or not lng:
        return jsonify({'hata': 'Konum gerekli'}), 400

    q = Usta.query.filter_by(onaylanmis=True, aktif=True)
    if kategori_id:
        q = q.filter_by(kategori_id=kategori_id)

    ustalar = q.all()
    ustalar_mesafe = []
    for u in ustalar:
        m = u.mesafe_hesapla(lat, lng)
        if m is not None:
            ustalar_mesafe.append((u, m))

    ustalar_mesafe.sort(key=lambda x: x[1])
    ustalar_mesafe = ustalar_mesafe[:limit]

    return jsonify({
        'ustalar': [u.to_dict(lat, lng) for u, _ in ustalar_mesafe]
    })
