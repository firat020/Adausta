from flask import Blueprint, request, jsonify, session
from models import db, Kullanici, IsTalebi, Usta, Kategori, IsTalebiMesaj, Abonelik, usta_kategoriler
from extensions import limiter
from datetime import datetime
from functools import wraps
import uuid

musteri_panel_bp = Blueprint('musteri_panel', __name__)

# Faz 3 Görev 13 — "Hizmet Talep Et": toplu dağıtımda en fazla bu kadar ustaya talep gider.
TOPLU_TALEP_MAX_USTA = 12


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


def _mesaj_okunmamis_map(talep_idleri, gonderen):
    """Verilen talep id'leri için, belirtilen taraftan gelen okunmamış mesaj sayısı (id -> sayı)."""
    if not talep_idleri:
        return {}
    satirlar = db.session.query(IsTalebiMesaj.is_talebi_id, db.func.count(IsTalebiMesaj.id)) \
        .filter(IsTalebiMesaj.is_talebi_id.in_(talep_idleri), IsTalebiMesaj.gonderen == gonderen, IsTalebiMesaj.okundu == False) \
        .group_by(IsTalebiMesaj.is_talebi_id).all()  # noqa: E712
    return dict(satirlar)


@musteri_panel_bp.route('/taleplerim', methods=['GET'])
@musteri_gerekli
def taleplerim(musteri):
    durum = request.args.get('durum', 'hepsi')
    q = IsTalebi.query.filter_by(musteri_id=musteri.id)
    if durum != 'hepsi':
        q = q.filter_by(durum=durum)
    talepler = q.order_by(IsTalebi.olusturma.desc()).all()
    okunmamis_map = _mesaj_okunmamis_map([t.id for t in talepler], 'usta')

    sonuc = []
    for t in talepler:
        d = t.to_dict()
        usta = Usta.query.get(t.usta_id)
        d['usta_ad'] = f"{usta.ad} {usta.soyad}".strip() if usta else '-'
        d['usta_kategori'] = usta.kategori.ad if usta and usta.kategori else '-'
        d['usta_telefon'] = usta.telefon if usta else ''
        d['usta_whatsapp'] = usta.whatsapp if usta else ''
        d['mesaj_okunmamis'] = okunmamis_map.get(t.id, 0)
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


@musteri_panel_bp.route('/talep-takip', methods=['GET'])
def talep_takip():
    """Misafir kullanıcı telefon numarası ile taleplerini takip edebilir."""
    telefon = request.args.get('telefon', '').strip()
    if not telefon or len(telefon) < 7:
        return jsonify({'hata': 'Geçerli telefon numarası girin'}), 400
    talepler = IsTalebi.query.filter_by(musteri_telefon=telefon)\
        .order_by(IsTalebi.olusturma.desc()).all()
    okunmamis_map = _mesaj_okunmamis_map([t.id for t in talepler], 'usta')
    sonuc = []
    for t in talepler:
        d = t.to_dict()
        usta = Usta.query.get(t.usta_id)
        d['usta_ad'] = f"{usta.ad} {usta.soyad}".strip() if usta else '-'
        d['usta_kategori'] = usta.kategori.ad if usta and usta.kategori else '-'
        d['usta_telefon'] = usta.telefon if usta else ''
        d['usta_whatsapp'] = usta.whatsapp if usta else ''
        d['mesaj_okunmamis'] = okunmamis_map.get(t.id, 0)
        sonuc.append(d)
    return jsonify({'talepler': sonuc})


# ──────────────────────────────────────────────────────────
# Faz 3 Görev 13 — "Hizmet Talep Et": toplu talep dağıtımı.
# Tek-usta teklif akışının (ustalar.py -> is_talebi_gonder) validasyon/oluşturma mantığı
# burada bir USTA LİSTESİ üzerinde DÖNGÜYLE tekrarlanır (kopyala/yapıştır değil, aynı deseni
# yeniden kullanır): her eşleşen usta için ayrı bir IsTalebi satırı, hepsi aynı grup_id ile.
# ──────────────────────────────────────────────────────────
@musteri_panel_bp.route('/toplu-talep', methods=['POST'])
@limiter.limit('10 per hour')
def toplu_talep_gonder():
    data = request.get_json(silent=True) or {}
    kategori_id = data.get('kategori_id')
    sehir_id = data.get('sehir_id')
    ilce_id = data.get('ilce_id')
    musteri_ad = (data.get('musteri_ad') or '').strip()
    musteri_telefon = (data.get('musteri_telefon') or '').strip()
    musteri_adres = (data.get('musteri_adres') or '').strip()
    aciklama = (data.get('aciklama') or '').strip()
    tercih_tarih = (data.get('tercih_tarih') or '').strip()

    if not kategori_id or not sehir_id:
        return jsonify({'hata': 'Hizmet kategorisi ve şehir zorunludur'}), 400
    if not musteri_ad or not musteri_telefon:
        return jsonify({'hata': 'Ad ve telefon zorunludur'}), 400

    kategori = Kategori.query.get(kategori_id)
    if not kategori:
        return jsonify({'hata': 'Geçersiz kategori'}), 400

    try:
        kategori_id = int(kategori_id)
        sehir_id = int(sehir_id)
        ilce_id = int(ilce_id) if ilce_id else None
    except (TypeError, ValueError):
        return jsonify({'hata': 'Geçersiz kategori/şehir/ilçe'}), 400

    # Profilini duraklatan ustalar (ustalar.py listele() ile aynı dışlama — Faz 1)
    duraklatilan_usta_idleri = db.session.query(Abonelik.usta_id).filter(
        Abonelik.durum == 'aktif', Abonelik.duraklatildi_mi == True  # noqa: E712
    )

    q = Usta.query.filter(
        Usta.onaylanmis == True, Usta.aktif == True,  # noqa: E712
        Usta.sehir_id == sehir_id,
        ~Usta.id.in_(duraklatilan_usta_idleri),
    )
    q = q.filter(
        (Usta.kategori_id == kategori_id) |
        Usta.id.in_(db.session.query(usta_kategoriler.c.usta_id).filter(usta_kategoriler.c.kategori_id == kategori_id))
    )
    if ilce_id:
        q = q.filter(Usta.ilce_id == ilce_id)

    adaylar = q.all()
    # En iyi sıralamaya göre (Usta.siralama_puani — yeni bir sıralama mantığı icat edilmedi) en üstten seç
    adaylar.sort(key=lambda u: -u.siralama_puani(kategori_id))
    secilenler = adaylar[:TOPLU_TALEP_MAX_USTA]

    if not secilenler:
        return jsonify({
            'hata': 'Şu an bu bölgede/kategoride hizmet veren usta yok, lütfen daha sonra tekrar deneyin.',
            'eslesen_usta_sayisi': 0,
        }), 404

    grup_id = uuid.uuid4().hex
    baslik = f'{kategori.ad} talebi'
    for usta in secilenler:
        talep = IsTalebi(
            usta_id=usta.id,
            musteri_id=session.get('kullanici_id'),
            musteri_ad=musteri_ad,
            musteri_telefon=musteri_telefon,
            musteri_adres=musteri_adres,
            baslik=baslik,
            aciklama=aciklama,
            tercih_tarih=tercih_tarih,
            durum='bekliyor',
            grup_id=grup_id,
        )
        db.session.add(talep)
    db.session.commit()

    return jsonify({
        'mesaj': f'{len(secilenler)} ustaya iletildi!',
        'eslesen_usta_sayisi': len(secilenler),
        'grup_id': grup_id,
    }), 201


# ──────────────────────────────────────────────────────────
# Faz 3 Görev 12 — İş talebi mesajlaşması (thread = bir IsTalebi).
# Aynı güven modeli: giriş yapmış müşteri (session, musteri_id eşleşmeli) VEYA misafir
# (talep-takip ile aynı şekilde SADECE telefon eşleşmesiyle) erişebilir. Yeni/daha güçlü
# bir token sistemi icat edilmedi — projenin mevcut güven modeliyle tutarlı.
# ──────────────────────────────────────────────────────────
def _musteri_talebe_erisebilir(talep, telefon_param):
    kid = session.get('kullanici_id')
    if kid and talep.musteri_id == kid:
        return True
    telefon = (telefon_param or '').strip()
    return bool(telefon) and telefon == talep.musteri_telefon


@musteri_panel_bp.route('/talep-takip/<int:tid>/mesajlar', methods=['GET'])
def talep_mesajlari_getir(tid):
    talep = IsTalebi.query.get_or_404(tid)
    telefon = request.args.get('telefon', '')
    if not _musteri_talebe_erisebilir(talep, telefon):
        return jsonify({'hata': 'Bu talebe erişim yetkiniz yok'}), 403
    liste = IsTalebiMesaj.query.filter_by(is_talebi_id=talep.id).order_by(IsTalebiMesaj.olusturma.asc()).all()
    # Müşteri thread'i açınca usta tarafından gelen okunmamış mesajlar okunmuş sayılır
    IsTalebiMesaj.query.filter_by(is_talebi_id=talep.id, gonderen='usta', okundu=False).update({'okundu': True})
    db.session.commit()
    return jsonify({'mesajlar': [m.to_dict() for m in liste]})


@musteri_panel_bp.route('/talep-takip/<int:tid>/mesajlar', methods=['POST'])
@limiter.limit('20 per hour')
def talep_mesaj_gonder(tid):
    talep = IsTalebi.query.get_or_404(tid)
    data = request.get_json(silent=True) or {}
    telefon = data.get('telefon') or request.args.get('telefon', '')
    if not _musteri_talebe_erisebilir(talep, telefon):
        return jsonify({'hata': 'Bu talebe erişim yetkiniz yok'}), 403

    icerik = (data.get('icerik') or '').strip()
    if not icerik:
        return jsonify({'hata': 'Mesaj içeriği boş olamaz'}), 400
    if len(icerik) > 2000:
        return jsonify({'hata': 'Mesaj çok uzun'}), 400

    m = IsTalebiMesaj(is_talebi_id=talep.id, gonderen='musteri', icerik=icerik)
    db.session.add(m)
    db.session.commit()
    return jsonify({'mesaj': 'Gönderildi', 'kayit': m.to_dict()}), 201


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
