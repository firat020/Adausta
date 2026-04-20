from flask import Blueprint, request, jsonify, session
from models import db, Kullanici, IsTalebi, Usta, Kategori
from datetime import datetime
from functools import wraps

musteri_panel_bp = Blueprint('musteri_panel', __name__)


def musteri_gerekli(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        kid = session.get('kullanici_id')
        if not kid:
            return jsonify({'hata': 'Giriş yapmanız gerekiyor'}), 401
        k = Kullanici.query.get(kid)
        if not k or k.rol not in ('musteri', 'admin'):
            return jsonify({'hata': 'Bu işlem için müşteri girişi gereklidir'}), 403
        return f(k, *args, **kwargs)
    return decorated


@musteri_panel_bp.route('/panel', methods=['GET'])
@musteri_gerekli
def panel(musteri):
    talepler = IsTalebi.query.filter_by(musteri_id=musteri.id)\
        .order_by(IsTalebi.olusturma.desc()).all()

    bekleyen    = sum(1 for t in talepler if t.durum == 'bekliyor')
    kabul       = sum(1 for t in talepler if t.durum == 'kabul')
    tamamlandi  = sum(1 for t in talepler if t.durum == 'tamamlandi')
    reddedildi  = sum(1 for t in talepler if t.durum == 'red')

    son_talepler = talepler[:5]
    son_talepler_dict = []
    for t in son_talepler:
        d = t.to_dict()
        usta = Usta.query.get(t.usta_id)
        d['usta_ad'] = f"{usta.ad} {usta.soyad}".strip() if usta else '-'
        d['usta_kategori'] = usta.kategori.ad if usta and usta.kategori else '-'
        son_talepler_dict.append(d)

    return jsonify({
        'musteri': musteri.to_dict(),
        'istatistik': {
            'toplam': len(talepler),
            'bekleyen': bekleyen,
            'kabul': kabul,
            'tamamlandi': tamamlandi,
            'reddedildi': reddedildi,
        },
        'son_talepler': son_talepler_dict,
    })


@musteri_panel_bp.route('/taleplerim', methods=['GET'])
@musteri_gerekli
def taleplerim(musteri):
    durum = request.args.get('durum', 'hepsi')
    q = IsTalebi.query.filter_by(musteri_id=musteri.id)
    if durum != 'hepsi':
        q = q.filter_by(durum=durum)
    talepler = q.order_by(IsTalebi.olusturma.desc()).all()

    sonuc = []
    for t in talepler:
        d = t.to_dict()
        usta = Usta.query.get(t.usta_id)
        d['usta_ad'] = f"{usta.ad} {usta.soyad}".strip() if usta else '-'
        d['usta_kategori'] = usta.kategori.ad if usta and usta.kategori else '-'
        d['usta_telefon'] = usta.telefon if usta else ''
        d['usta_whatsapp'] = usta.whatsapp if usta else ''
        sonuc.append(d)

    return jsonify({'talepler': sonuc})


@musteri_panel_bp.route('/taleplerim/<int:tid>/iptal', methods=['PUT'])
@musteri_gerekli
def talep_iptal(musteri, tid):
    talep = IsTalebi.query.filter_by(id=tid, musteri_id=musteri.id).first_or_404()
    if talep.durum != 'bekliyor':
        return jsonify({'hata': 'Sadece bekleyen talepler iptal edilebilir'}), 400
    talep.durum = 'red'
    talep.usta_notu = 'Müşteri tarafından iptal edildi'
    talep.guncelleme = datetime.utcnow()
    db.session.commit()
    return jsonify({'mesaj': 'Talep iptal edildi'})


@musteri_panel_bp.route('/profil', methods=['GET'])
@musteri_gerekli
def profil_getir(musteri):
    return jsonify({'musteri': musteri.to_dict()})


@musteri_panel_bp.route('/profil', methods=['PUT'])
@musteri_gerekli
def profil_guncelle(musteri):
    data = request.get_json()
    for alan in ('ad', 'soyad', 'telefon', 'adres'):
        if alan in data:
            setattr(musteri, alan, data[alan])
    if data.get('yeni_sifre') and data.get('mevcut_sifre'):
        if not musteri.sifre_kontrol(data['mevcut_sifre']):
            return jsonify({'hata': 'Mevcut şifre yanlış'}), 400
        musteri.sifre_set(data['yeni_sifre'])
    db.session.commit()
    return jsonify({'mesaj': 'Profil güncellendi', 'musteri': musteri.to_dict()})
