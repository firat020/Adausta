from flask import Blueprint, request, jsonify, session
from models import db, FCMToken, BildirimGecmisi
from datetime import datetime

fcm_token_bp = Blueprint('fcm_token', __name__)


def _kid():
    return session.get('kullanici_id')


@fcm_token_bp.route('/token', methods=['POST'])
def token_kaydet():
    kid = _kid()
    if not kid:
        return jsonify({'hata': 'Giris gerekli'}), 401

    data = request.get_json(silent=True) or {}
    token = (data.get('token') or '').strip()
    platform = data.get('platform', 'android')

    if not token or len(token) > 500:
        return jsonify({'hata': 'Gecersiz token'}), 400

    # Başka kullanıcıya ait aynı token → cihaz değişimi, eski kaydı sil
    mevcut = FCMToken.query.filter_by(token=token).first()
    if mevcut:
        if mevcut.kullanici_id != kid:
            db.session.delete(mevcut)
            db.session.flush()
        else:
            mevcut.aktif = True
            mevcut.son_guncelleme = datetime.utcnow()
            db.session.commit()
            return jsonify({'mesaj': 'Token guncellendi'}), 200

    yeni = FCMToken(kullanici_id=kid, token=token, platform=platform)
    db.session.add(yeni)
    db.session.commit()
    return jsonify({'mesaj': 'Token kaydedildi'}), 201


@fcm_token_bp.route('/token', methods=['DELETE'])
def token_sil():
    kid = _kid()
    data = request.get_json(silent=True) or {}
    token = (data.get('token') or '').strip()

    if not token:
        return jsonify({'hata': 'Token gerekli'}), 400

    q = FCMToken.query.filter_by(token=token)
    if kid:
        q = q.filter_by(kullanici_id=kid)
    mevcut = q.first()
    if mevcut:
        db.session.delete(mevcut)
        db.session.commit()
    return jsonify({'mesaj': 'Token silindi'}), 200


@fcm_token_bp.route('/token-sayisi', methods=['GET'])
def token_sayisi():
    if session.get('rol') != 'admin':
        return jsonify({'hata': 'Yetkisiz'}), 403
    sayi = FCMToken.query.filter_by(aktif=True).count()
    return jsonify({'sayi': sayi})


@fcm_token_bp.route('/bildirim-gecmisi', methods=['GET'])
def bildirim_gecmisi_listesi():
    if session.get('rol') != 'admin':
        return jsonify({'hata': 'Yetkisiz'}), 403
    kayitlar = BildirimGecmisi.query.order_by(BildirimGecmisi.olusturma.desc()).limit(50).all()
    return jsonify({'bildirimler': [k.to_dict() for k in kayitlar]})


@fcm_token_bp.route('/bildirim-gonder', methods=['POST'])
def admin_bildirim_gonder():
    if session.get('rol') != 'admin':
        return jsonify({'hata': 'Yetkisiz'}), 403

    data = request.get_json(silent=True) or {}
    kullanici_ids = data.get('kullanici_ids')
    baslik = (data.get('baslik') or '').strip()
    icerik = (data.get('icerik') or '').strip()
    ekran = (data.get('ekran') or '').strip()

    if not baslik or not icerik:
        return jsonify({'hata': 'Baslik ve icerik zorunlu'}), 400

    q = FCMToken.query.filter_by(aktif=True)
    if kullanici_ids:
        q = q.filter(FCMToken.kullanici_id.in_(kullanici_ids))

    tokenlar = [t.token for t in q.all()]
    if not tokenlar:
        return jsonify({'mesaj': 'Gonderilecek token yok', 'gonderilen': 0}), 200

    extra = {'ekran': ekran} if ekran else {}

    from fcm import toplu_bildirim_gonder
    sonuc = toplu_bildirim_gonder(tokenlar, baslik, icerik, extra)

    # Geçersiz tokenları temizle
    if sonuc['gecersiz']:
        FCMToken.query.filter(FCMToken.token.in_(sonuc['gecersiz'])).delete(synchronize_session=False)

    # Geçmişe kaydet
    gecmis = BildirimGecmisi(
        baslik=baslik,
        icerik=icerik,
        tur='admin',
        gonderildi=sonuc['basarili'] > 0,
    )
    db.session.add(gecmis)
    db.session.commit()

    return jsonify({
        'basarili': sonuc['basarili'],
        'basarisiz': sonuc['basarisiz'],
        'toplam': len(tokenlar),
    })
