from flask import Blueprint, request, jsonify, session
from models import db, Usta, Kategori, Abone, IletisimLog, KategoriGoruntuleme

analitik_bp = Blueprint('analitik', __name__)


@analitik_bp.route('/iletisim', methods=['POST'])
def iletisim_log():
    """Kullanıcı bir usta ile iletişime geçince çağrılır (ara / whatsapp / goruntule / teklif)."""
    data = request.get_json(silent=True) or {}
    usta_id = data.get('usta_id')
    tur = data.get('tur', 'goruntule')  # ara / whatsapp / goruntule / teklif

    if not usta_id:
        return jsonify({'hata': 'usta_id gerekli'}), 400

    usta = Usta.query.get(usta_id)
    if not usta:
        return jsonify({'hata': 'Usta bulunamadı'}), 404

    log = IletisimLog(
        usta_id=usta_id,
        tur=tur,
        ip=request.remote_addr or '',
        kategori_id=usta.kategori_id,
        sehir=usta.sehir.ad if usta.sehir else '',
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'durum': 'ok'})


@analitik_bp.route('/kategori-goruntule', methods=['POST'])
def kategori_goruntule():
    """Kullanıcı bir kategoriyi ziyaret edince çağrılır."""
    data = request.get_json(silent=True) or {}
    kategori_id = data.get('kategori_id')
    if not kategori_id:
        return jsonify({'hata': 'kategori_id gerekli'}), 400

    g = KategoriGoruntuleme(
        kategori_id=kategori_id,
        ip=request.remote_addr or '',
    )
    db.session.add(g)
    db.session.commit()
    return jsonify({'durum': 'ok'})


@analitik_bp.route('/abone', methods=['POST'])
def abone_ol():
    """E-posta ile abone ol."""
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    ad = (data.get('ad') or '').strip()
    kaynak = data.get('kaynak', 'footer')

    if not email or '@' not in email:
        return jsonify({'hata': 'Geçerli bir e-posta girin'}), 400

    mevcut = Abone.query.filter_by(email=email).first()
    if mevcut:
        if not mevcut.aktif:
            mevcut.aktif = True
            db.session.commit()
            return jsonify({'mesaj': 'Aboneliğiniz yeniden aktifleştirildi!'})
        return jsonify({'mesaj': 'Bu e-posta zaten kayıtlı'}), 200

    abone = Abone(email=email, ad=ad, kaynak=kaynak)
    db.session.add(abone)
    db.session.commit()
    return jsonify({'mesaj': 'Başarıyla abone oldunuz!'}), 201
