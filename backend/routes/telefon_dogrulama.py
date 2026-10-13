"""Twilio Verify ile telefon sahipliği doğrulaması (SMS / WhatsApp).

Güvenlik tasarımı
- Doğrulama oturumdaki kullanıcıya bağlıdır; telefon numarası istemciden değil sunucudaki istek kaydından okunur.
- Gönderilen numara, hesabın profilindeki güncel numarayla eşleşmelidir (başkasının numarasına SMS yağdırılamaz).
- İstemcinin "doğrulandı" demesi hiçbir şey ifade etmez; yalnızca Twilio status == 'approved' kabul edilir.
- Sınırlar (bekleme, telefon, IP, kullanıcı, kod deneme) veritabanından hesaplanır: yeniden başlatma / çok worker'a dayanıklı.
  SMS ve WhatsApp ortak sayılır; kanal değiştirerek sınır aşılamaz.
- Twilio hatasında doğrulama başarılı sayılmaz; sahte kod / bypass yoktur.
- Kod, token ve tam telefon numarası loglanmaz.
"""
import os
import re
from datetime import datetime, timedelta

from flask import Blueprint, current_app, jsonify, request, session

import twilio_verify
from models import Kullanici, TelefonDogrulamaIstegi, db
from phone_utils import TelefonHatasi, ULKELER, e164_yap, maskele, numara_eslesiyor

telefon_dogrulama_bp = Blueprint('telefon_dogrulama', __name__)

BEKLEME_SN = 60             # aynı kullanıcı/numara için iki gönderim arası (kanal fark etmez)
TELEFON_SAATLIK = 5         # bir numaraya (tüm kullanıcılar, tüm kanallar) saatte en fazla
TELEFON_GUNLUK = 10
IP_SAATLIK = 10
KULLANICI_SAATLIK = 8
KOD_DENEME_MAX = 5          # bir doğrulama isteği için hatalı kod hakkı
KULLANICI_KONTROL_SAATLIK = 20
GECERLILIK_DK = 10          # Twilio kodu ~10 dk geçerlidir; biz de aynı sınırı uygularız
AMACLAR = ('kayit', 'profil')


def _simdi():
    return datetime.utcnow()


def _istemci_ip() -> str:
    """nginx arkasında gerçek istemci IP'si. X-Forwarded-For yalnızca doğrudan bağlanan eş loopback/özel ağdaysa
    (yani kendi reverse proxy'miz) güvenilir kabul edilir."""
    ip = request.remote_addr or ''
    if ip.startswith(('127.', '10.', '192.168.')) or ip == '::1':
        xff = (request.headers.get('X-Forwarded-For') or request.headers.get('X-Real-IP') or '').split(',')[0].strip()
        if xff:
            return xff[:64]
    return ip[:64]


def _zorunlu_mu() -> bool:
    return os.environ.get('TELEFON_DOGRULAMA_ZORUNLU', '').lower() in ('1', 'true', 'evet')


def _giris_gerekli():
    kid = session.get('kullanici_id')
    k = Kullanici.query.get(kid) if kid else None
    if not k or not k.aktif:
        return None, (jsonify({'hata': 'Giriş gerekli'}), 401)
    return k, None


def _say(*kosullar) -> int:
    return TelefonDogrulamaIstegi.query.filter(*kosullar).count()


def _bekleme_kalan(kullanici_id, e164) -> int:
    """Aynı kullanıcı veya aynı numara için son BAŞARILI gönderimden bu yana kalan bekleme (sn)."""
    son = (TelefonDogrulamaIstegi.query
           .filter(TelefonDogrulamaIstegi.durum != 'hata')
           .filter(db.or_(TelefonDogrulamaIstegi.kullanici_id == kullanici_id,
                          TelefonDogrulamaIstegi.telefon_e164 == e164))
           .order_by(TelefonDogrulamaIstegi.olusturma.desc()).first())
    if not son:
        return 0
    gecen = (_simdi() - son.olusturma).total_seconds()
    return max(0, int(BEKLEME_SN - gecen + 0.999))


def _bekleyen(kullanici_id):
    return (TelefonDogrulamaIstegi.query
            .filter_by(kullanici_id=kullanici_id, durum='bekliyor')
            .order_by(TelefonDogrulamaIstegi.id.desc()).first())


def _gecerli_mi(istek) -> bool:
    return _simdi() <= istek.olusturma + timedelta(minutes=GECERLILIK_DK)


def _limit_yaniti(mesaj, bekleme=None):
    govde = {'hata': mesaj}
    yanit = jsonify(govde)
    if bekleme:
        govde['bekleme_sn'] = bekleme
        yanit = jsonify(govde)
        yanit.headers['Retry-After'] = str(bekleme)
    return yanit, 429


# ─────────────────────────────────────────────────────────────
@telefon_dogrulama_bp.route('/ayarlar', methods=['GET'])
def ayarlar():
    return jsonify({
        'yapilandirildi': twilio_verify.yapilandirildi(),
        'zorunlu': _zorunlu_mu(),
        'kanallar': list(twilio_verify.KANALLAR),
        'varsayilan_kanal': 'sms',
        'kod_uzunluk': 6,
        'bekleme_sn': BEKLEME_SN,
        'ulkeler': [{'kod': u['kod'], 'ad': u['ad'], 'dial': u['dial']} for u in ULKELER],
    })


@telefon_dogrulama_bp.route('/durum', methods=['GET'])
def durum():
    k, hata = _giris_gerekli()
    if hata:
        return hata
    profil_tel = k.aktif_telefon_ham()
    dogrulandi = k.telefon_dogrulandi_mi()
    bekleyen = _bekleyen(k.id)
    bekleyen_bilgi = None
    if bekleyen and _gecerli_mi(bekleyen):
        bekleyen_bilgi = {
            'kanal': bekleyen.kanal,
            'telefon_maske': maskele(bekleyen.telefon_e164),
            'bekleme_sn': _bekleme_kalan(k.id, bekleyen.telefon_e164),
        }
    return jsonify({
        'dogrulandi': dogrulandi,
        'dogrulama_tarihi': k.telefon_dogrulama_tarihi.isoformat() if dogrulandi and k.telefon_dogrulama_tarihi else None,
        'profil_telefonu': profil_tel or '',
        'zorunlu': _zorunlu_mu(),
        'yapilandirildi': twilio_verify.yapilandirildi(),
        'bekleyen': bekleyen_bilgi,
    })


@telefon_dogrulama_bp.route('/gonder', methods=['POST'])
def gonder():
    k, hata = _giris_gerekli()
    if hata:
        return hata
    data = request.get_json(silent=True) or {}
    kanal = (data.get('kanal') or 'sms').lower()
    amac = (data.get('amac') or 'profil').lower()
    if kanal not in twilio_verify.KANALLAR:
        return jsonify({'hata': 'Geçersiz gönderim yöntemi'}), 400
    if amac not in AMACLAR:
        return jsonify({'hata': 'Geçersiz işlem amacı'}), 400

    if not twilio_verify.yapilandirildi():
        current_app.logger.error('Telefon dogrulama yapilandirilmamis, eksik: %s', ','.join(twilio_verify.eksik_degiskenler()))
        return jsonify({'hata': 'Telefon doğrulama şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.', 'kod': 'yapilandirilmadi'}), 503

    try:
        e164 = e164_yap(data.get('telefon'), data.get('ulke'))
    except TelefonHatasi as e:
        return jsonify({'hata': str(e)}), 400

    # Numara hesabın profilindeki güncel numarayla aynı olmalı
    profil_tel = k.aktif_telefon_ham()
    if profil_tel:
        if not numara_eslesiyor(profil_tel, e164):
            return jsonify({'hata': 'Bu numara profilinizdeki telefonla eşleşmiyor. Önce profilinizde numarayı güncelleyin.', 'kod': 'numara_eslesmiyor'}), 400
    elif k.rol in ('usta', 'sirket'):
        return jsonify({'hata': 'Profilinizde kayıtlı telefon yok. Önce profilinize telefon ekleyin.', 'kod': 'numara_yok'}), 400

    if k.telefon_dogrulanan == e164 and k.telefon_dogrulandi_mi():
        return jsonify({'zaten_dogrulandi': True, 'mesaj': 'Bu numara zaten doğrulanmış.'})

    # ── Sınırlar (veritabanı tabanlı, kanaldan bağımsız) ──
    bekleme = _bekleme_kalan(k.id, e164)
    if bekleme > 0:
        return _limit_yaniti(f'Yeni kod için {bekleme} saniye bekleyin.', bekleme)
    saat_once = _simdi() - timedelta(hours=1)
    gun_once = _simdi() - timedelta(days=1)
    ip = _istemci_ip()
    T = TelefonDogrulamaIstegi
    if _say(T.telefon_e164 == e164, T.olusturma >= saat_once) >= TELEFON_SAATLIK or \
            _say(T.telefon_e164 == e164, T.olusturma >= gun_once) >= TELEFON_GUNLUK:
        return _limit_yaniti('Bu numaraya çok fazla kod gönderildi. Lütfen daha sonra tekrar deneyin.')
    if ip and _say(T.ip == ip, T.olusturma >= saat_once) >= IP_SAATLIK:
        return _limit_yaniti('Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin.')
    if _say(T.kullanici_id == k.id, T.olusturma >= saat_once) >= KULLANICI_SAATLIK:
        return _limit_yaniti('Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin.')

    # Önceki bekleyen istekleri geçersiz kıl (numara/kanal değişse bile eski kod kullanılamasın)
    for eski in T.query.filter_by(kullanici_id=k.id, durum='bekliyor').all():
        eski.durum = 'iptal'
    istek = T(kullanici_id=k.id, amac=amac, telefon_e164=e164, kanal=kanal, durum='bekliyor', ip=ip)
    db.session.add(istek)
    db.session.commit()  # gönderimden ÖNCE kaydet: Twilio çağrısı takılsa bile sınırlar işler

    try:
        sonuc = twilio_verify.kod_gonder(e164, kanal, 'tr')
        if sonuc not in ('pending', 'approved'):
            raise twilio_verify.VerifyHatasi(http=200, kod=None)
    except twilio_verify.VerifyYapilandirmaHatasi:
        istek.durum = 'hata'
        db.session.commit()
        return jsonify({'hata': 'Telefon doğrulama şu anda kullanılamıyor.', 'kod': 'yapilandirilmadi'}), 503
    except twilio_verify.VerifyHatasi as e:
        istek.durum = 'hata'
        db.session.commit()
        current_app.logger.warning('Twilio Verify gonderim hatasi: kanal=%s http=%s kod=%s tel=%s', kanal, e.http, e.kod, maskele(e164))
        diger = 'whatsapp' if kanal == 'sms' else 'sms'
        if e.http == 429 or e.kod == 60203:
            return _limit_yaniti('Bu numaraya çok fazla kod gönderildi. Lütfen daha sonra tekrar deneyin.')
        if e.kod == 60205:
            return jsonify({'hata': 'Bu numara SMS alamıyor. WhatsApp ile kod göndermeyi deneyin.', 'diger_kanal': 'whatsapp'}), 502
        if e.http == 400 or e.kod in (60200, 21211):
            return jsonify({'hata': 'Telefon numarası kabul edilmedi. Numarayı ve ülkeyi kontrol edin.'}), 400
        return jsonify({'hata': 'Kod gönderilemedi. İsterseniz diğer yöntemi deneyebilirsiniz.', 'diger_kanal': diger}), 502

    return jsonify({
        'gonderildi': True,
        'kanal': kanal,
        'telefon_maske': maskele(e164),
        'bekleme_sn': BEKLEME_SN,
        'gecerlilik_dk': GECERLILIK_DK,
    })


@telefon_dogrulama_bp.route('/dogrula', methods=['POST'])
def dogrula():
    k, hata = _giris_gerekli()
    if hata:
        return hata
    data = request.get_json(silent=True) or {}
    kod = str(data.get('kod') or '').strip()
    if not re.fullmatch(r'\d{4,10}', kod):
        return jsonify({'hata': 'Kod yalnızca rakamlardan oluşmalıdır (6 hane).'}), 400

    if not twilio_verify.yapilandirildi():
        return jsonify({'hata': 'Telefon doğrulama şu anda kullanılamıyor.', 'kod': 'yapilandirilmadi'}), 503

    T = TelefonDogrulamaIstegi
    istek = _bekleyen(k.id)
    if not istek:
        return jsonify({'hata': 'Önce doğrulama kodu isteyin.', 'kod': 'istek_yok'}), 400
    if not _gecerli_mi(istek):
        istek.durum = 'iptal'
        db.session.commit()
        return jsonify({'hata': 'Kodun süresi doldu. Yeni kod isteyin.', 'kod': 'suresi_doldu'}), 400
    if istek.kontrol_sayisi >= KOD_DENEME_MAX:
        istek.durum = 'iptal'
        db.session.commit()
        return jsonify({'hata': 'Çok fazla hatalı deneme. Yeni kod isteyin.', 'kod': 'deneme_asildi'}), 429
    saat_once = _simdi() - timedelta(hours=1)
    toplam = db.session.query(db.func.coalesce(db.func.sum(T.kontrol_sayisi), 0)) \
        .filter(T.kullanici_id == k.id, T.olusturma >= saat_once).scalar()
    if toplam >= KULLANICI_KONTROL_SAATLIK:
        return _limit_yaniti('Çok fazla kod denemesi yaptınız. Lütfen daha sonra tekrar deneyin.')

    # Hak, Twilio çağrısından ÖNCE düşülür (çağrı hata verse bile deneme sayılır)
    istek.kontrol_sayisi += 1
    db.session.commit()
    kalan = max(0, KOD_DENEME_MAX - istek.kontrol_sayisi)

    try:
        durum_twilio = twilio_verify.kod_kontrol(istek.telefon_e164, kod)  # numara DB'den, istemciden değil
    except twilio_verify.VerifyHatasi as e:
        current_app.logger.warning('Twilio Verify kontrol hatasi: http=%s kod=%s tel=%s', e.http, e.kod, maskele(istek.telefon_e164))
        if e.http == 404:
            istek.durum = 'iptal'
            db.session.commit()
            return jsonify({'hata': 'Kodun süresi doldu. Yeni kod isteyin.', 'kod': 'suresi_doldu'}), 400
        if e.http == 429 or e.kod == 60202:
            istek.durum = 'iptal'
            db.session.commit()
            return jsonify({'hata': 'Çok fazla hatalı deneme. Yeni kod isteyin.', 'kod': 'deneme_asildi'}), 429
        return jsonify({'hata': 'Kod şu anda doğrulanamadı. Lütfen tekrar deneyin.'}), 502  # başarı SAYILMAZ
    except twilio_verify.VerifyYapilandirmaHatasi:
        return jsonify({'hata': 'Telefon doğrulama şu anda kullanılamıyor.', 'kod': 'yapilandirilmadi'}), 503

    if durum_twilio != 'approved':
        if durum_twilio in ('max_attempts_reached', 'expired', 'canceled', 'deleted', 'failed'):
            istek.durum = 'iptal'
            db.session.commit()
            return jsonify({'hata': 'Kodun süresi doldu veya deneme hakkı bitti. Yeni kod isteyin.', 'kod': 'suresi_doldu'}), 400
        return jsonify({'hata': f'Kod hatalı. {kalan} deneme hakkınız kaldı.', 'kalan_hak': kalan, 'kod': 'kod_hatali'}), 400

    # approved — numara bu arada profilde değiştirildiyse sonucu kullanma
    profil_tel = k.aktif_telefon_ham()
    if profil_tel and not numara_eslesiyor(profil_tel, istek.telefon_e164):
        istek.durum = 'iptal'
        db.session.commit()
        return jsonify({'hata': 'Telefon numaranız değişmiş. Yeni numara için tekrar kod isteyin.', 'kod': 'numara_degisti'}), 409

    istek.durum = 'onaylandi'
    istek.tamamlanma = _simdi()
    k.telefon_dogrulanan = istek.telefon_e164
    k.telefon_dogrulama_tarihi = istek.tamamlanma
    if not profil_tel and k.rol not in ('usta', 'sirket'):
        k.telefon = istek.telefon_e164  # profilde numara yoktu: doğrulanan numara profile yazılır
    for diger in T.query.filter(T.kullanici_id == k.id, T.durum == 'bekliyor', T.id != istek.id).all():
        diger.durum = 'iptal'
    db.session.commit()
    return jsonify({'dogrulandi': True, 'telefon_maske': maskele(istek.telefon_e164)})
