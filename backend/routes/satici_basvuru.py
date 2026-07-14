from flask import Blueprint, request, jsonify, session
from models import (db, Kullanici, SellerApplication, SellerDocument,
                    MarketplaceStore, StoreMember, SellerBalance, SellerAuditLog)
from datetime import datetime
import os, uuid, re
from werkzeug.utils import secure_filename

satici_basvuru_bp = Blueprint('satici_basvuru', __name__)

ALLOWED_BELGE = {'pdf', 'png', 'jpg', 'jpeg', 'webp'}
MAX_BELGE_BOYUT = 5 * 1024 * 1024  # 5 MB
DUZENLENEBILIR_DURUMLAR = ('draft', 'additional_document_required')

# ─── YARDIMCI FONKSİYONLAR ─────────────────────────────────

def kullanici_id_al():
    return session.get('kullanici_id') or None


def _slug_olustur(magaza_adi):
    slug = magaza_adi.lower().strip()
    slug = re.sub(r'[çÇ]', 'c', slug)
    slug = re.sub(r'[ğĞ]', 'g', slug)
    slug = re.sub(r'[ıİ]', 'i', slug)
    slug = re.sub(r'[öÖ]', 'o', slug)
    slug = re.sub(r'[şŞ]', 's', slug)
    slug = re.sub(r'[üÜ]', 'u', slug)
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')
    suffix = uuid.uuid4().hex[:4]
    return f'{slug}-{suffix}'


def _belge_klasoru():
    from flask import current_app
    klasor = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), 'belgeler')
    os.makedirs(klasor, exist_ok=True)
    return klasor


# ─── BAŞVURU OLUŞTUR ────────────────────────────────────────

@satici_basvuru_bp.route('/basvuru', methods=['POST'])
def basvuru_olustur():
    kid = kullanici_id_al()
    if not kid:
        return jsonify({'hata': 'Giriş yapmalısınız'}), 401

    data = request.get_json() or {}

    ticari_unvan   = (data.get('ticari_unvan') or '').strip()
    magaza_adi     = (data.get('magaza_adi') or '').strip()
    yetkili_ad     = (data.get('yetkili_ad') or '').strip()
    yetkili_telefon = (data.get('yetkili_telefon') or '').strip()
    yetkili_email  = (data.get('yetkili_email') or '').strip()

    if not ticari_unvan:
        return jsonify({'hata': 'Ticari ünvan zorunludur'}), 400
    if not magaza_adi:
        return jsonify({'hata': 'Mağaza adı zorunludur'}), 400
    if not yetkili_ad:
        return jsonify({'hata': 'Yetkili adı zorunludur'}), 400
    if not yetkili_telefon:
        return jsonify({'hata': 'Yetkili telefonu zorunludur'}), 400
    if not yetkili_email:
        return jsonify({'hata': 'Yetkili e-postası zorunludur'}), 400

    mevcut = SellerApplication.query.filter(
        SellerApplication.kullanici_id == kid,
        SellerApplication.durum.in_(('draft', 'submitted', 'under_review',
                                     'additional_document_required', 'approved'))
    ).first()
    if mevcut:
        return jsonify({'hata': 'Zaten aktif bir başvurunuz bulunmaktadır', 'basvuru_id': mevcut.id}), 409

    slug = _slug_olustur(magaza_adi)

    basvuru = SellerApplication(
        kullanici_id=kid,
        ticari_unvan=ticari_unvan,
        magaza_adi=magaza_adi,
        magaza_slug=slug,
        sirket_turu=(data.get('sirket_turu') or '').strip(),
        vergi_no=(data.get('vergi_no') or '').strip(),
        vergi_dairesi=(data.get('vergi_dairesi') or '').strip(),
        sirket_kayit_no=(data.get('sirket_kayit_no') or '').strip(),
        yetkili_ad=yetkili_ad,
        yetkili_telefon=yetkili_telefon,
        yetkili_email=yetkili_email,
        adres=(data.get('adres') or '').strip(),
        durum='draft',
    )
    db.session.add(basvuru)
    db.session.flush()

    log = SellerAuditLog(
        basvuru_id=basvuru.id,
        kullanici_id=kid,
        islem='basvuru_olusturuldu',
        detay=f'Başvuru taslak olarak oluşturuldu. Mağaza: {magaza_adi}',
    )
    db.session.add(log)
    db.session.commit()

    return jsonify(basvuru.to_dict()), 201


# ─── BAŞVURU GÜNCELLE ───────────────────────────────────────

@satici_basvuru_bp.route('/basvuru/<int:bid>', methods=['PUT'])
def basvuru_guncelle(bid):
    kid = kullanici_id_al()
    if not kid:
        return jsonify({'hata': 'Giriş yapmalısınız'}), 401

    basvuru = SellerApplication.query.get_or_404(bid)

    if basvuru.kullanici_id != kid:
        return jsonify({'hata': 'Bu başvuruya erişim yetkiniz yok'}), 403

    if basvuru.durum not in DUZENLENEBILIR_DURUMLAR:
        return jsonify({'hata': f'"{basvuru.durum}" durumundaki başvuru düzenlenemez'}), 400

    data = request.get_json() or {}

    str_alanlar = (
        'ticari_unvan', 'magaza_adi', 'sirket_turu', 'vergi_no',
        'vergi_dairesi', 'sirket_kayit_no', 'yetkili_ad',
        'yetkili_telefon', 'yetkili_email', 'adres',
        'banka_hesap_sahibi', 'iban', 'magaza_aciklama',
    )
    for alan in str_alanlar:
        if alan in data:
            setattr(basvuru, alan, (data[alan] or '').strip())

    basvuru.guncelleme = datetime.utcnow()
    db.session.commit()

    return jsonify(basvuru.to_dict())


# ─── BELGE YÜKLE ────────────────────────────────────────────

@satici_basvuru_bp.route('/basvuru/<int:bid>/belge', methods=['POST'])
def belge_yukle(bid):
    kid = kullanici_id_al()
    if not kid:
        return jsonify({'hata': 'Giriş yapmalısınız'}), 401

    basvuru = SellerApplication.query.get_or_404(bid)

    if basvuru.kullanici_id != kid:
        return jsonify({'hata': 'Bu başvuruya erişim yetkiniz yok'}), 403

    if basvuru.durum not in DUZENLENEBILIR_DURUMLAR:
        return jsonify({'hata': f'"{basvuru.durum}" durumundaki başvuruya belge eklenemez'}), 400

    tur = (request.form.get('tur') or '').strip()
    if not tur:
        return jsonify({'hata': 'Belge türü zorunludur'}), 400

    if 'dosya' not in request.files:
        return jsonify({'hata': 'Dosya alanı bulunamadı'}), 400

    dosya = request.files['dosya']
    if not dosya or not dosya.filename:
        return jsonify({'hata': 'Dosya seçilmedi'}), 400

    ext = dosya.filename.rsplit('.', 1)[-1].lower() if '.' in dosya.filename else ''
    if ext not in ALLOWED_BELGE:
        return jsonify({'hata': f'Desteklenmeyen dosya formatı. İzin verilenler: {", ".join(ALLOWED_BELGE)}'}), 400

    dosya.seek(0, 2)
    boyut = dosya.tell()
    dosya.seek(0)
    if boyut > MAX_BELGE_BOYUT:
        return jsonify({'hata': 'Dosya boyutu 5 MB sınırını aşıyor'}), 400

    dosya_adi = f'belge_{bid}_{uuid.uuid4().hex[:8]}.{ext}'
    klasor = _belge_klasoru()
    kayit_yolu = os.path.join(klasor, dosya_adi)
    dosya.save(kayit_yolu)

    belge_no         = (request.form.get('belge_no') or '').strip() or None
    verilis_tarihi   = (request.form.get('verilis_tarihi') or '').strip() or None
    son_gecerlilik   = (request.form.get('son_gecerlilik') or '').strip() or None

    belge = SellerDocument(
        basvuru_id=bid,
        tur=tur,
        belge_no=belge_no,
        verilis_tarihi=verilis_tarihi,
        son_gecerlilik=son_gecerlilik,
        dosya_yolu=f'belgeler/{dosya_adi}',
        durum='pending',
    )
    db.session.add(belge)
    db.session.commit()

    return jsonify(belge.to_dict()), 201


# ─── BELGE SİL ──────────────────────────────────────────────

@satici_basvuru_bp.route('/basvuru/<int:bid>/belge/<int:did>', methods=['DELETE'])
def belge_sil(bid, did):
    kid = kullanici_id_al()
    if not kid:
        return jsonify({'hata': 'Giriş yapmalısınız'}), 401

    basvuru = SellerApplication.query.get_or_404(bid)

    if basvuru.kullanici_id != kid:
        return jsonify({'hata': 'Bu başvuruya erişim yetkiniz yok'}), 403

    if basvuru.durum not in DUZENLENEBILIR_DURUMLAR:
        return jsonify({'hata': f'"{basvuru.durum}" durumundaki başvurudan belge silinemez'}), 400

    belge = SellerDocument.query.get_or_404(did)

    if belge.basvuru_id != bid:
        return jsonify({'hata': 'Belge bu başvuruya ait değil'}), 403

    from flask import current_app
    tam_yol = os.path.join(
        current_app.config.get('UPLOAD_FOLDER', 'uploads'),
        belge.dosya_yolu,
    )
    try:
        if os.path.exists(tam_yol):
            os.remove(tam_yol)
    except Exception:
        pass

    db.session.delete(belge)
    db.session.commit()

    return jsonify({'ok': True})


# ─── BAŞVURU GÖNDER ─────────────────────────────────────────

@satici_basvuru_bp.route('/basvuru/<int:bid>/gonder', methods=['POST'])
def basvuru_gonder(bid):
    kid = kullanici_id_al()
    if not kid:
        return jsonify({'hata': 'Giriş yapmalısınız'}), 401

    basvuru = SellerApplication.query.get_or_404(bid)

    if basvuru.kullanici_id != kid:
        return jsonify({'hata': 'Bu başvuruya erişim yetkiniz yok'}), 403

    if basvuru.durum not in DUZENLENEBILIR_DURUMLAR:
        return jsonify({'hata': f'"{basvuru.durum}" durumundaki başvuru gönderilemez'}), 400

    belge_sayisi = SellerDocument.query.filter_by(basvuru_id=bid).count()
    if belge_sayisi < 2:
        return jsonify({
            'hata': 'Başvuru göndermek için en az 2 belge yüklemeniz gerekmektedir',
            'mevcut_belge_sayisi': belge_sayisi,
        }), 400

    basvuru.durum = 'submitted'
    basvuru.gonderme_tarihi = datetime.utcnow()
    basvuru.guncelleme = datetime.utcnow()

    log = SellerAuditLog(
        basvuru_id=basvuru.id,
        kullanici_id=kid,
        islem='basvuru_gonderildi',
        detay=f'Başvuru inceleme için gönderildi. Belge sayısı: {belge_sayisi}',
    )
    db.session.add(log)
    db.session.commit()

    return jsonify(basvuru.to_dict())


# ─── KENDİ BAŞVURUM ─────────────────────────────────────────

@satici_basvuru_bp.route('/basvurum', methods=['GET'])
def basvurum():
    kid = kullanici_id_al()
    if not kid:
        return jsonify({'hata': 'Giriş yapmalısınız'}), 401

    basvuru = (
        SellerApplication.query
        .filter_by(kullanici_id=kid)
        .order_by(SellerApplication.olusturma.desc())
        .first()
    )

    if not basvuru:
        return jsonify({'basvuru': None})

    return jsonify({'basvuru': basvuru.to_dict(include_belgeler=True)})


# ─── BAŞVURU DURUM SORGULA ──────────────────────────────────

@satici_basvuru_bp.route('/basvuru/<int:bid>/durum', methods=['GET'])
def basvuru_durum(bid):
    kid = kullanici_id_al()
    if not kid:
        return jsonify({'hata': 'Giriş yapmalısınız'}), 401

    basvuru = SellerApplication.query.get_or_404(bid)

    if basvuru.kullanici_id != kid:
        return jsonify({'hata': 'Bu başvuruya erişim yetkiniz yok'}), 403

    belgeler = SellerDocument.query.filter_by(basvuru_id=bid).all()
    belgeler_durum = [
        {
            'id': b.id,
            'tur': b.tur,
            'durum': b.durum,
            'red_nedeni': getattr(b, 'red_nedeni', None),
        }
        for b in belgeler
    ]

    return jsonify({
        'basvuru_id': basvuru.id,
        'durum': basvuru.durum,
        'red_nedeni': getattr(basvuru, 'red_nedeni', None),
        'inceleme_notu': getattr(basvuru, 'inceleme_notu', None),
        'gonderme_tarihi': basvuru.gonderme_tarihi.isoformat() if getattr(basvuru, 'gonderme_tarihi', None) else None,
        'belgeler': belgeler_durum,
    })
