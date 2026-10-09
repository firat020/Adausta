from flask import Blueprint, request, jsonify, session
from datetime import date
from models import db, Usta, Kategori, Abone, IletisimLog, KategoriGoruntuleme, AnalitikGosterim
from extensions import limiter

analitik_bp = Blueprint('analitik', __name__)


@analitik_bp.route('/iletisim', methods=['POST'])
def iletisim_log():
    """Kullanıcı bir usta ile iletişime geçince çağrılır (ara / whatsapp / goruntule / teklif / favori / paylas / web_sitesi)."""
    data = request.get_json(silent=True) or {}
    usta_id = data.get('usta_id')
    tur = data.get('tur', 'goruntule')
    if tur not in ('ara', 'whatsapp', 'goruntule', 'teklif', 'favori', 'paylas', 'web_sitesi'):
        tur = 'goruntule'
    # Ziyaretçinin arayüz dili — opsiyonel, gelmezse None kalır (eski çağrılar da çalışır)
    dil = (data.get('dil') or '').strip().lower()[:5] or None

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
        dil=dil,
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'durum': 'ok'})


@analitik_bp.route('/gosterim', methods=['POST'])
@limiter.limit('120 per minute')
def gosterim_kaydet():
    """Liste sayfalarında görünen ustaların toplu gösterim kaydı. Body: { usta_ids: [1,2,...] }
    Günlük sayaç artırılır; aynı tarayıcı oturumunda aynı ustayı saatte bir kez gönderme işi frontend'dedir."""
    ids = (request.get_json(silent=True) or {}).get('usta_ids') or []
    try:
        ids = list({int(i) for i in ids})[:40]
    except (TypeError, ValueError):
        return jsonify({'hata': 'Geçersiz liste'}), 400
    if not ids:
        return jsonify({'durum': 'ok', 'kaydedilen': 0})
    gecerli = {u.id for u in Usta.query.filter(Usta.id.in_(ids), Usta.onaylanmis == True, Usta.aktif == True).all()}  # noqa: E712
    bugun = date.today()
    mevcut = {g.usta_id: g for g in AnalitikGosterim.query.filter(AnalitikGosterim.usta_id.in_(gecerli), AnalitikGosterim.gun == bugun).all()}
    for uid in gecerli:
        if uid in mevcut:
            mevcut[uid].adet = (mevcut[uid].adet or 0) + 1
        else:
            db.session.add(AnalitikGosterim(usta_id=uid, gun=bugun, adet=1))
    db.session.commit()
    return jsonify({'durum': 'ok', 'kaydedilen': len(gecerli)})


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
