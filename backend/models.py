from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import hashlib
import math

db = SQLAlchemy()

# ──────────────────────────────────────────────────────────
# Yardımcı: tarih formatla
# ──────────────────────────────────────────────────────────
def fmt(dt):
    return dt.strftime('%d.%m.%Y %H:%M') if dt else None

class Kullanici(db.Model):
    __tablename__ = 'kullanicilar'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    sifre_hash = db.Column(db.String(256), nullable=False)
    rol = db.Column(db.String(20), default='musteri')  # admin / usta / musteri
    olusturma = db.Column(db.DateTime, default=datetime.utcnow)
    aktif = db.Column(db.Boolean, default=True)
    giris_deneme = db.Column(db.Integer, default=0)
    kilitli_kadar = db.Column(db.DateTime, nullable=True)
    # Müşteri profil alanları (rol=musteri için)
    ad = db.Column(db.String(100), default='')
    soyad = db.Column(db.String(100), default='')
    telefon = db.Column(db.String(30), default='')
    adres = db.Column(db.Text, default='')

    def sifre_set(self, sifre):
        self.sifre_hash = generate_password_hash(sifre)

    def sifre_kontrol(self, sifre):
        return check_password_hash(self.sifre_hash, sifre)

    def kilitli_mi(self):
        if self.kilitli_kadar and self.kilitli_kadar > datetime.utcnow():
            return True
        return False

    def to_dict(self):
        d = {'id': self.id, 'email': self.email, 'rol': self.rol,
             'ad': self.ad, 'soyad': self.soyad, 'telefon': self.telefon,
             'adres': self.adres, 'olusturma': fmt(self.olusturma)}
        if self.rol == 'usta':
            usta = Usta.query.filter_by(kullanici_id=self.id).first()
            d['usta_id'] = usta.id if usta else None
        if self.rol == 'sirket':
            sirket = Sirket.query.filter_by(kullanici_id=self.id).first()
            d['sirket_id'] = sirket.id if sirket else None
        return d


class TelefonOtp(db.Model):
    __tablename__ = 'telefon_otp'
    id = db.Column(db.Integer, primary_key=True)
    telefon = db.Column(db.String(30), nullable=False)
    kod_hash = db.Column(db.String(128), nullable=False)
    amac = db.Column(db.String(30), nullable=False)  # profil_sahiplen / sifre_sifirla
    usta_id = db.Column(db.Integer, db.ForeignKey('ustalar.id'), nullable=True)
    kullanici_id = db.Column(db.Integer, db.ForeignKey('kullanicilar.id'), nullable=True)
    olusturma = db.Column(db.DateTime, default=datetime.utcnow)
    son_kullanma = db.Column(db.DateTime, nullable=False)
    dogrulandi = db.Column(db.Boolean, default=False)
    deneme_sayisi = db.Column(db.Integer, default=0)

    def kod_kontrol(self, kod):
        return self.kod_hash == hashlib.sha256(kod.encode()).hexdigest()

    def suresi_gecti_mi(self):
        return datetime.utcnow() > self.son_kullanma


class AdminLog(db.Model):
    __tablename__ = 'admin_log'
    id = db.Column(db.Integer, primary_key=True)
    kullanici_id = db.Column(db.Integer, db.ForeignKey('kullanicilar.id'), nullable=True)
    kullanici_email = db.Column(db.String(150), default='')
    islem = db.Column(db.String(100), nullable=False)
    detay = db.Column(db.Text, default='')
    ip = db.Column(db.String(50), default='')
    tarih = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'kullanici_email': self.kullanici_email,
            'islem': self.islem,
            'detay': self.detay,
            'ip': self.ip,
            'tarih': self.tarih.strftime('%d.%m.%Y %H:%M')
        }


class Sehir(db.Model):
    __tablename__ = 'sehirler'
    id = db.Column(db.Integer, primary_key=True)
    ad = db.Column(db.String(100), nullable=False)
    ilceler = db.relationship('Ilce', backref='sehir', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'ad': self.ad,
            'ilceler': [i.to_dict() for i in self.ilceler]
        }


class Ilce(db.Model):
    __tablename__ = 'ilceler'
    id = db.Column(db.Integer, primary_key=True)
    sehir_id = db.Column(db.Integer, db.ForeignKey('sehirler.id'), nullable=False)
    ad = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {'id': self.id, 'ad': self.ad, 'sehir_id': self.sehir_id}


# Many-to-many: usta ↔ ek kategoriler
usta_kategoriler = db.Table(
    'usta_kategoriler',
    db.Column('usta_id', db.Integer, db.ForeignKey('ustalar.id', ondelete='CASCADE'), primary_key=True),
    db.Column('kategori_id', db.Integer, db.ForeignKey('kategoriler.id', ondelete='CASCADE'), primary_key=True)
)


class Kategori(db.Model):
    __tablename__ = 'kategoriler'
    id = db.Column(db.Integer, primary_key=True)
    ad = db.Column(db.String(100), nullable=False)
    ikon = db.Column(db.String(50), default='🔧')
    aciklama = db.Column(db.Text, default='')
    seo_keywords = db.Column(db.Text, default='')
    grup = db.Column(db.String(100), default='Genel')
    sira = db.Column(db.Integer, default=0)
    aktif = db.Column(db.Boolean, default=True)
    ustalar = db.relationship('Usta', backref='kategori', lazy=True)

    def to_dict(self, usta_sayisi=None):
        return {
            'id': self.id,
            'ad': self.ad,
            'ikon': self.ikon,
            'aciklama': self.aciklama,
            'seo_keywords': self.seo_keywords,
            'grup': self.grup,
            'sira': self.sira,
            'usta_sayisi': usta_sayisi if usta_sayisi is not None else len([u for u in self.ustalar if u.onaylanmis])
        }


class Usta(db.Model):
    __tablename__ = 'ustalar'
    id = db.Column(db.Integer, primary_key=True)
    kullanici_id = db.Column(db.Integer, db.ForeignKey('kullanicilar.id'), nullable=True)
    ad = db.Column(db.String(100), nullable=False)
    soyad = db.Column(db.String(100), default='')
    telefon = db.Column(db.String(30), nullable=False)
    whatsapp = db.Column(db.String(30), default='')
    email = db.Column(db.String(150), default='')
    sehir_id = db.Column(db.Integer, db.ForeignKey('sehirler.id'), nullable=True)
    ilce_id = db.Column(db.Integer, db.ForeignKey('ilceler.id'), nullable=True)
    kategori_id = db.Column(db.Integer, db.ForeignKey('kategoriler.id'), nullable=False)
    aciklama = db.Column(db.Text, default='')
    deneyim_yil = db.Column(db.Integer, default=0)
    lat = db.Column(db.Float, nullable=True)   # GPS konum
    lng = db.Column(db.Float, nullable=True)
    onaylanmis = db.Column(db.Boolean, default=False)
    aktif = db.Column(db.Boolean, default=True)
    musaitlik = db.Column(db.Boolean, default=True)   # Müsait mi?
    plan = db.Column(db.String(20), default='ucretsiz')  # ucretsiz / aylik / yillik
    plan_bitis = db.Column(db.DateTime, nullable=True)
    cardplus_safekey = db.Column(db.String(64), nullable=True)  # Payten Merchant Safe kayıtlı kart referansı (otomatik yenileme için)
    olusturma = db.Column(db.DateTime, default=datetime.utcnow)
    fotograflar = db.relationship('Fotograf', backref='usta', lazy=True, cascade='all, delete-orphan')
    yorumlar = db.relationship('Yorum', backref='usta', lazy=True, cascade='all, delete-orphan')
    is_talepleri = db.relationship('IsTalebi', backref='usta', lazy=True, cascade='all, delete-orphan')
    sehir = db.relationship('Sehir', foreign_keys=[sehir_id])
    ilce = db.relationship('Ilce', foreign_keys=[ilce_id])
    ek_kategoriler = db.relationship('Kategori', secondary=usta_kategoriler, lazy=True)

    def profil_tamamlama(self):
        maddeler = [
            {'anahtar': 'foto', 'baslik': 'Profil fotoğrafı ekleyin', 'tamam': len(self.fotograflar) > 0},
            {'anahtar': 'aciklama', 'baslik': 'Hakkınızda açıklama yazın (en az 20 karakter)', 'tamam': bool(self.aciklama and len(self.aciklama.strip()) >= 20)},
            {'anahtar': 'deneyim', 'baslik': 'Deneyim yılınızı belirtin', 'tamam': (self.deneyim_yil or 0) > 0},
            {'anahtar': 'whatsapp', 'baslik': 'WhatsApp numarası ekleyin', 'tamam': bool(self.whatsapp)},
            {'anahtar': 'ilce', 'baslik': 'İlçe/bölge bilginizi ekleyin', 'tamam': self.ilce_id is not None},
            {'anahtar': 'konum', 'baslik': 'Haritada konumunuzu işaretleyin', 'tamam': self.lat is not None and self.lng is not None},
        ]
        tamam_sayisi = sum(1 for m in maddeler if m['tamam'])
        yuzde = round(tamam_sayisi / len(maddeler) * 100)
        return {'yuzde': yuzde, 'maddeler': maddeler}

    def ortalama_puan(self):
        if not self.yorumlar:
            return 0
        return round(sum(y.puan for y in self.yorumlar) / len(self.yorumlar), 1)

    def mesafe_hesapla(self, kullanici_lat, kullanici_lng):
        if not self.lat or not self.lng:
            return None
        R = 6371  # km
        dlat = math.radians(self.lat - kullanici_lat)
        dlng = math.radians(self.lng - kullanici_lng)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(kullanici_lat)) * math.cos(math.radians(self.lat)) * math.sin(dlng/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return round(R * c, 1)

    def to_dict(self, kullanici_lat=None, kullanici_lng=None):
        mesafe = None
        if kullanici_lat and kullanici_lng:
            mesafe = self.mesafe_hesapla(kullanici_lat, kullanici_lng)
        return {
            'id': self.id,
            'ad': self.ad,
            'soyad': self.soyad,
            'ad_soyad': f"{self.ad} {self.soyad}".strip(),
            'telefon': self.telefon,
            'whatsapp': self.whatsapp,
            'email': self.email,
            'sehir': self.sehir.ad if self.sehir else '',
            'ilce': self.ilce.ad if self.ilce else '',
            'sehir_id': self.sehir_id,
            'ilce_id': self.ilce_id,
            'lat': self.lat,
            'lng': self.lng,
            'kategori': self.kategori.ad if self.kategori else '',
            'kategori_id': self.kategori_id,
            'kategori_ikon': self.kategori.ikon if self.kategori else '🔧',
            'aciklama': self.aciklama,
            'deneyim_yil': self.deneyim_yil,
            'puan': self.ortalama_puan(),
            'yorum_sayisi': len(self.yorumlar),
            'fotograflar': [f.to_dict() for f in self.fotograflar],
            'mesafe': mesafe,
            'onaylanmis': self.onaylanmis,
            'aktif': self.aktif,
            'musaitlik': self.musaitlik,
            'uye_mi': bool(self.kullanici_id),
            'profil_tamamlama': self.profil_tamamlama(),
            'plan': self.plan,
            'plan_bitis': fmt(self.plan_bitis) if self.plan_bitis else None,
            'kayitli_kart_var': bool(self.cardplus_safekey),
            'olusturma': self.olusturma.isoformat(),
            'ek_kategoriler': [{'id': k.id, 'ad': k.ad, 'ikon': k.ikon} for k in self.ek_kategoriler],
            'tum_kategoriler': (
                [{'id': self.kategori_id, 'ad': self.kategori.ad, 'ikon': self.kategori.ikon}] if self.kategori else []
            ) + [{'id': k.id, 'ad': k.ad, 'ikon': k.ikon} for k in self.ek_kategoriler if k.id != self.kategori_id]
        }


class Fotograf(db.Model):
    __tablename__ = 'fotograflar'
    id = db.Column(db.Integer, primary_key=True)
    usta_id = db.Column(db.Integer, db.ForeignKey('ustalar.id'), nullable=False)
    dosya = db.Column(db.String(256), nullable=False)
    olusturma = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {'id': self.id, 'dosya': self.dosya, 'url': f'/uploads/{self.dosya}'}


class Yorum(db.Model):
    __tablename__ = 'yorumlar'
    id = db.Column(db.Integer, primary_key=True)
    usta_id = db.Column(db.Integer, db.ForeignKey('ustalar.id'), nullable=False)
    musteri_adi = db.Column(db.String(100), nullable=False)
    puan = db.Column(db.Integer, nullable=False)  # 1-5
    yorum = db.Column(db.Text, default='')
    onaylanmis = db.Column(db.Boolean, default=False)
    tarih = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'musteri_adi': self.musteri_adi,
            'puan': self.puan,
            'yorum': self.yorum,
            'tarih': self.tarih.strftime('%d.%m.%Y')
        }


class Abone(db.Model):
    __tablename__ = 'aboneler'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    ad = db.Column(db.String(100), default='')
    tarih = db.Column(db.DateTime, default=datetime.utcnow)
    aktif = db.Column(db.Boolean, default=True)
    kaynak = db.Column(db.String(50), default='footer')  # footer / popup / mobil

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'ad': self.ad,
            'tarih': self.tarih.strftime('%d.%m.%Y %H:%M'),
            'aktif': self.aktif,
            'kaynak': self.kaynak,
        }


class IletisimLog(db.Model):
    """Kullanıcıların ustalarla iletişime geçme olaylarını kaydeder."""
    __tablename__ = 'iletisim_log'
    id = db.Column(db.Integer, primary_key=True)
    usta_id = db.Column(db.Integer, db.ForeignKey('ustalar.id', ondelete='CASCADE'), nullable=False)
    tur = db.Column(db.String(20), nullable=False)  # ara / whatsapp / goruntule / teklif
    ip = db.Column(db.String(60), default='')
    tarih = db.Column(db.DateTime, default=datetime.utcnow)
    kategori_id = db.Column(db.Integer, nullable=True)
    sehir = db.Column(db.String(100), default='')

    def to_dict(self):
        return {
            'id': self.id,
            'usta_id': self.usta_id,
            'tur': self.tur,
            'tarih': self.tarih.strftime('%d.%m.%Y %H:%M'),
            'sehir': self.sehir,
        }


class KategoriGoruntuleme(db.Model):
    """Kategori sayfası ziyaretlerini kaydeder."""
    __tablename__ = 'kategori_goruntuleme'
    id = db.Column(db.Integer, primary_key=True)
    kategori_id = db.Column(db.Integer, db.ForeignKey('kategoriler.id', ondelete='CASCADE'), nullable=False)
    tarih = db.Column(db.DateTime, default=datetime.utcnow)
    ip = db.Column(db.String(60), default='')


class IsTalebi(db.Model):
    """Müşterinin ustaya gönderdiği iş/arıza talebi."""
    __tablename__ = 'is_talepleri'
    id = db.Column(db.Integer, primary_key=True)
    usta_id = db.Column(db.Integer, db.ForeignKey('ustalar.id', ondelete='CASCADE'), nullable=False)
    musteri_id = db.Column(db.Integer, db.ForeignKey('kullanicilar.id'), nullable=True)
    # Müşteri bilgileri (misafir kullanıcı için de çalışsın)
    musteri_ad = db.Column(db.String(100), nullable=False)
    musteri_telefon = db.Column(db.String(30), nullable=False)
    musteri_adres = db.Column(db.Text, default='')
    # Talep detayları
    baslik = db.Column(db.String(200), nullable=False)
    aciklama = db.Column(db.Text, default='')
    tercih_tarih = db.Column(db.String(100), default='')  # Müşterinin tercih ettiği tarih
    durum = db.Column(db.String(30), default='bekliyor')  # bekliyor / kabul / red / tamamlandi
    usta_notu = db.Column(db.Text, default='')  # Ustanın notu
    okundu = db.Column(db.Boolean, default=False)  # Usta tarafından okundu mu
    olusturma = db.Column(db.DateTime, default=datetime.utcnow)
    guncelleme = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    musteri = db.relationship('Kullanici', foreign_keys=[musteri_id])

    def to_dict(self):
        return {
            'id': self.id,
            'usta_id': self.usta_id,
            'musteri_id': self.musteri_id,
            'musteri_ad': self.musteri_ad,
            'musteri_telefon': self.musteri_telefon,
            'musteri_adres': self.musteri_adres,
            'baslik': self.baslik,
            'aciklama': self.aciklama,
            'tercih_tarih': self.tercih_tarih,
            'durum': self.durum,
            'usta_notu': self.usta_notu,
            'okundu': self.okundu,
            'olusturma': fmt(self.olusturma),
            'guncelleme': fmt(self.guncelleme),
        }


class Plan(db.Model):
    __tablename__ = 'planlar'
    id = db.Column(db.Integer, primary_key=True)
    ad = db.Column(db.String(50), nullable=False)
    fiyat = db.Column(db.Float, default=0.0)
    sure_tip = db.Column(db.String(20), default='aylik')  # aylik / yillik
    ilan_siniri = db.Column(db.Integer, default=1)
    one_cikma = db.Column(db.Boolean, default=False)
    aktif = db.Column(db.Boolean, default=True)
    olusturma = db.Column(db.DateTime, default=datetime.utcnow)
    abonelikler = db.relationship('Abonelik', backref='plan', lazy=True)

    def to_dict(self):
        return {
            'id': self.id, 'ad': self.ad, 'fiyat': self.fiyat,
            'sure_tip': self.sure_tip, 'ilan_siniri': self.ilan_siniri,
            'one_cikma': self.one_cikma, 'aktif': self.aktif,
            'abone_sayisi': len([a for a in self.abonelikler if a.durum == 'aktif']),
            'olusturma': fmt(self.olusturma),
        }


class Abonelik(db.Model):
    __tablename__ = 'abonelikler'
    id = db.Column(db.Integer, primary_key=True)
    usta_id = db.Column(db.Integer, db.ForeignKey('ustalar.id', ondelete='CASCADE'), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey('planlar.id'), nullable=False)
    baslangic = db.Column(db.DateTime, default=datetime.utcnow)
    bitis = db.Column(db.DateTime, nullable=True)
    durum = db.Column(db.String(20), default='aktif')  # aktif / askida / iptal
    yenileme_tarihi = db.Column(db.DateTime, nullable=True)
    otomatik_yenileme = db.Column(db.Boolean, default=False)  # SafeKey ile sessiz (3D'siz) otomatik tahsilat açık mı
    basarisiz_deneme_sayisi = db.Column(db.Integer, default=0)  # otomatik tahsilat dunning sayacı
    son_deneme_tarihi = db.Column(db.DateTime, nullable=True)  # son otomatik tahsilat deneme zamanı (başarılı/başarısız)
    olusturma = db.Column(db.DateTime, default=datetime.utcnow)
    usta = db.relationship('Usta', foreign_keys=[usta_id])
    odemeler = db.relationship('Odeme', backref='abonelik', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'usta_id': self.usta_id,
            'usta_ad': f'{self.usta.ad} {self.usta.soyad}'.strip() if self.usta else '',
            'plan_id': self.plan_id,
            'plan_ad': self.plan.ad if self.plan else '',
            'plan_fiyat': self.plan.fiyat if self.plan else 0,
            'baslangic': fmt(self.baslangic),
            'bitis': fmt(self.bitis),
            'durum': self.durum,
            'yenileme_tarihi': fmt(self.yenileme_tarihi),
            'otomatik_yenileme': self.otomatik_yenileme,
            'basarisiz_deneme_sayisi': self.basarisiz_deneme_sayisi,
            'olusturma': fmt(self.olusturma),
        }


class Odeme(db.Model):
    __tablename__ = 'odemeler'
    id = db.Column(db.Integer, primary_key=True)
    usta_id = db.Column(db.Integer, db.ForeignKey('ustalar.id', ondelete='CASCADE'), nullable=True)
    abonelik_id = db.Column(db.Integer, db.ForeignKey('abonelikler.id'), nullable=True)
    tutar = db.Column(db.Float, nullable=False)
    para_birimi = db.Column(db.String(10), default='TRY')
    siparis_no = db.Column(db.String(100), unique=True, nullable=True)
    islem_id = db.Column(db.String(200), nullable=True)
    kart_son4 = db.Column(db.String(4), nullable=True)
    durum = db.Column(db.String(20), default='bekliyor')  # basarili / basarisiz / bekliyor
    aciklama = db.Column(db.Text, default='')
    tarih = db.Column(db.DateTime, default=datetime.utcnow)
    payment_source          = db.Column(db.String(30), default='subscription')  # subscription / store_order
    reference_type          = db.Column(db.String(30), default='')  # abonelik / magaza_siparis
    reference_id            = db.Column(db.Integer, nullable=True)
    provider_transaction_id = db.Column(db.String(200), nullable=True)
    error_code              = db.Column(db.String(50), default='')
    error_message           = db.Column(db.Text, default='')
    paid_at                 = db.Column(db.DateTime, nullable=True)
    refunded_at             = db.Column(db.DateTime, nullable=True)
    idempotency_key         = db.Column(db.String(100), unique=True, nullable=True)
    safekey_talep_edildi    = db.Column(db.Boolean, default=False)  # ödeme sırasında "kartımı kaydet" işaretlendi mi
    otomatik_tahsilat       = db.Column(db.Boolean, default=False)  # bu ödeme SafeKey ile sessiz otomatik yenilemeden mi geldi
    usta = db.relationship('Usta', foreign_keys=[usta_id])

    def to_dict(self):
        return {
            'id': self.id,
            'usta_id': self.usta_id,
            'usta_ad': f'{self.usta.ad} {self.usta.soyad}'.strip() if self.usta else '',
            'abonelik_id': self.abonelik_id,
            'tutar': self.tutar,
            'para_birimi': self.para_birimi,
            'siparis_no': self.siparis_no,
            'kart_son4': self.kart_son4,
            'durum': self.durum,
            'aciklama': self.aciklama,
            'tarih': fmt(self.tarih),
            'payment_source': self.payment_source,
            'reference_type': self.reference_type,
            'reference_id': self.reference_id,
            'provider_transaction_id': self.provider_transaction_id,
            'error_code': self.error_code,
            'error_message': self.error_message,
            'paid_at': fmt(self.paid_at),
            'refunded_at': fmt(self.refunded_at),
            'idempotency_key': self.idempotency_key,
            'otomatik_tahsilat': self.otomatik_tahsilat,
        }


# Many-to-many: sirket ↔ ek kategoriler
sirket_kategoriler = db.Table(
    'sirket_kategoriler',
    db.Column('sirket_id', db.Integer, db.ForeignKey('sirketler.id', ondelete='CASCADE'), primary_key=True),
    db.Column('kategori_id', db.Integer, db.ForeignKey('kategoriler.id', ondelete='CASCADE'), primary_key=True)
)


class Sirket(db.Model):
    __tablename__ = 'sirketler'
    id = db.Column(db.Integer, primary_key=True)
    kullanici_id = db.Column(db.Integer, db.ForeignKey('kullanicilar.id'), nullable=True)
    sirket_adi = db.Column(db.String(200), nullable=False)
    vergi_no = db.Column(db.String(50), default='')
    yetkili_ad = db.Column(db.String(100), nullable=False)
    telefon = db.Column(db.String(30), nullable=False)
    whatsapp = db.Column(db.String(30), default='')
    email = db.Column(db.String(150), default='')
    sehir_id = db.Column(db.Integer, db.ForeignKey('sehirler.id'), nullable=True)
    ilce_id = db.Column(db.Integer, db.ForeignKey('ilceler.id'), nullable=True)
    kategori_id = db.Column(db.Integer, db.ForeignKey('kategoriler.id'), nullable=False)
    adres = db.Column(db.Text, default='')
    aciklama = db.Column(db.Text, default='')
    website = db.Column(db.String(256), default='')
    logo = db.Column(db.String(256), default='')
    onaylanmis = db.Column(db.Boolean, default=True)
    aktif = db.Column(db.Boolean, default=True)
    plan = db.Column(db.String(20), default='ucretsiz')
    plan_bitis = db.Column(db.DateTime, nullable=True)
    olusturma = db.Column(db.DateTime, default=datetime.utcnow)
    is_talepleri = db.relationship('SirketIsTalebi', backref='sirket', lazy=True, cascade='all, delete-orphan')
    sehir = db.relationship('Sehir', foreign_keys=[sehir_id])
    ilce = db.relationship('Ilce', foreign_keys=[ilce_id])
    kategori = db.relationship('Kategori', foreign_keys=[kategori_id])
    ek_kategoriler = db.relationship('Kategori', secondary=sirket_kategoriler, lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'tip': 'sirket',
            'sirket_adi': self.sirket_adi,
            'vergi_no': self.vergi_no,
            'yetkili_ad': self.yetkili_ad,
            'telefon': self.telefon,
            'whatsapp': self.whatsapp,
            'email': self.email,
            'sehir': self.sehir.ad if self.sehir else '',
            'ilce': self.ilce.ad if self.ilce else '',
            'sehir_id': self.sehir_id,
            'ilce_id': self.ilce_id,
            'kategori': self.kategori.ad if self.kategori else '',
            'kategori_id': self.kategori_id,
            'kategori_ikon': self.kategori.ikon if self.kategori else '🏢',
            'adres': self.adres,
            'aciklama': self.aciklama,
            'website': self.website,
            'logo': self.logo,
            'logo_url': f'/uploads/{self.logo}' if self.logo else None,
            'onaylanmis': self.onaylanmis,
            'aktif': self.aktif,
            'plan': self.plan,
            'plan_bitis': fmt(self.plan_bitis) if self.plan_bitis else None,
            'talep_sayisi': len(self.is_talepleri),
            'olusturma': self.olusturma.isoformat(),
            'ek_kategoriler': [{'id': k.id, 'ad': k.ad, 'ikon': k.ikon} for k in self.ek_kategoriler],
            'tum_kategoriler': (
                [{'id': self.kategori_id, 'ad': self.kategori.ad, 'ikon': self.kategori.ikon}] if self.kategori else []
            ) + [{'id': k.id, 'ad': k.ad, 'ikon': k.ikon} for k in self.ek_kategoriler if k.id != self.kategori_id]
        }


class SirketIsTalebi(db.Model):
    __tablename__ = 'sirket_is_talepleri'
    id = db.Column(db.Integer, primary_key=True)
    sirket_id = db.Column(db.Integer, db.ForeignKey('sirketler.id', ondelete='CASCADE'), nullable=False)
    musteri_id = db.Column(db.Integer, db.ForeignKey('kullanicilar.id'), nullable=True)
    musteri_ad = db.Column(db.String(100), nullable=False)
    musteri_telefon = db.Column(db.String(30), nullable=False)
    musteri_adres = db.Column(db.Text, default='')
    baslik = db.Column(db.String(200), nullable=False)
    aciklama = db.Column(db.Text, default='')
    tercih_tarih = db.Column(db.String(100), default='')
    durum = db.Column(db.String(30), default='bekliyor')
    sirket_notu = db.Column(db.Text, default='')
    olusturma = db.Column(db.DateTime, default=datetime.utcnow)
    guncelleme = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    musteri = db.relationship('Kullanici', foreign_keys=[musteri_id])

    def to_dict(self):
        return {
            'id': self.id,
            'sirket_id': self.sirket_id,
            'musteri_id': self.musteri_id,
            'musteri_ad': self.musteri_ad,
            'musteri_telefon': self.musteri_telefon,
            'musteri_adres': self.musteri_adres,
            'baslik': self.baslik,
            'aciklama': self.aciklama,
            'tercih_tarih': self.tercih_tarih,
            'durum': self.durum,
            'sirket_notu': self.sirket_notu,
            'olusturma': fmt(self.olusturma),
            'guncelleme': fmt(self.guncelleme),
        }


class Reklam(db.Model):
    """Kategori sayfalarında gösterilen reklamlar."""
    __tablename__ = 'reklamlar'
    id = db.Column(db.Integer, primary_key=True)
    baslik = db.Column(db.String(200), nullable=False)
    aciklama = db.Column(db.Text, default='')
    resim_url = db.Column(db.String(500), default='')
    link_url = db.Column(db.String(500), default='')
    firma_adi = db.Column(db.String(150), default='')
    # Hangi kategoride gösterilsin (None = tüm kategorilerde)
    kategori_id = db.Column(db.Integer, db.ForeignKey('kategoriler.id'), nullable=True)
    konum = db.Column(db.String(20), default='sol')  # sol / sag / ust
    aktif = db.Column(db.Boolean, default=True)
    baslangic = db.Column(db.DateTime, nullable=True)
    bitis = db.Column(db.DateTime, nullable=True)
    tiklanma = db.Column(db.Integer, default=0)
    goruntuleme = db.Column(db.Integer, default=0)
    olusturma = db.Column(db.DateTime, default=datetime.utcnow)

    kategori = db.relationship('Kategori', foreign_keys=[kategori_id])

    def aktif_mi(self):
        now = datetime.utcnow()
        if not self.aktif:
            return False
        if self.baslangic and now < self.baslangic:
            return False
        if self.bitis and now > self.bitis:
            return False
        return True

    def to_dict(self):
        return {
            'id': self.id,
            'baslik': self.baslik,
            'aciklama': self.aciklama,
            'resim_url': self.resim_url,
            'link_url': self.link_url,
            'firma_adi': self.firma_adi,
            'kategori_id': self.kategori_id,
            'kategori_ad': self.kategori.ad if self.kategori else 'Tümü',
            'konum': self.konum,
            'aktif': self.aktif,
            'baslangic': fmt(self.baslangic),
            'bitis': fmt(self.bitis),
            'tiklanma': self.tiklanma,
            'goruntuleme': self.goruntuleme,
            'olusturma': fmt(self.olusturma),
        }


# ──────────────────────────────────────────────────────────
# MAĞAZA
# ──────────────────────────────────────────────────────────

class Marka(db.Model):
    __tablename__ = 'markalar'
    id    = db.Column(db.Integer, primary_key=True)
    ad    = db.Column(db.String(100), nullable=False, unique=True)
    aktif = db.Column(db.Boolean, default=True)
    modeller = db.relationship('UrunModeli', backref='marka', lazy=True)

    def to_dict(self):
        return {'id': self.id, 'ad': self.ad}


class UrunModeli(db.Model):
    __tablename__ = 'urun_modelleri'
    id       = db.Column(db.Integer, primary_key=True)
    ad       = db.Column(db.String(150), nullable=False)
    marka_id = db.Column(db.Integer, db.ForeignKey('markalar.id'), nullable=False)
    aktif    = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {'id': self.id, 'ad': self.ad, 'marka_id': self.marka_id}


class Urun(db.Model):
    __tablename__ = 'urunler'
    id           = db.Column(db.Integer, primary_key=True)
    ad           = db.Column(db.String(200), nullable=False)
    aciklama     = db.Column(db.Text, default='')
    usd_fiyat    = db.Column(db.Float, nullable=False)
    kur          = db.Column(db.Float, nullable=False)
    kar_marji    = db.Column(db.Float, default=25.0)
    kargo_ucreti = db.Column(db.Float, default=0.0)
    kdv_dahil    = db.Column(db.Boolean, default=True)
    tl_fiyat     = db.Column(db.Float, nullable=False)
    sku          = db.Column(db.String(100), default='')
    barkod       = db.Column(db.String(100), default='')
    stok         = db.Column(db.Integer, default=0)
    aktif        = db.Column(db.Boolean, default=True)
    marka_id     = db.Column(db.Integer, db.ForeignKey('markalar.id'), nullable=True)
    model_id     = db.Column(db.Integer, db.ForeignKey('urun_modelleri.id'), nullable=True)
    kategori     = db.Column(db.String(100), default='')
    olusturma    = db.Column(db.DateTime, default=datetime.utcnow)
    guncelleme   = db.Column(db.DateTime, default=datetime.utcnow)
    store_id     = db.Column(db.Integer, db.ForeignKey('magazalar.id'), nullable=True)
    urun_durum   = db.Column(db.String(20), default='active')  # draft/pending_review/active/passive/out_of_stock/suspended
    gorseller    = db.relationship('UrunGorsel', backref='urun', lazy=True, order_by='UrunGorsel.sira')
    siparisler   = db.relationship('UrunSiparis', backref='urun', lazy=True)

    def to_dict(self, include_gorseller=False):
        marka = Marka.query.get(self.marka_id) if self.marka_id else None
        model = UrunModeli.query.get(self.model_id) if self.model_id else None
        store = MarketplaceStore.query.get(self.store_id) if self.store_id else None
        d = {
            'id': self.id, 'ad': self.ad, 'aciklama': self.aciklama,
            'usd_fiyat': self.usd_fiyat, 'kur': self.kur,
            'kar_marji': self.kar_marji, 'kargo_ucreti': self.kargo_ucreti,
            'kdv_dahil': self.kdv_dahil, 'tl_fiyat': self.tl_fiyat,
            'sku': self.sku, 'barkod': self.barkod, 'stok': self.stok,
            'aktif': self.aktif, 'kategori': self.kategori,
            'marka_id': self.marka_id, 'marka_ad': marka.ad if marka else None,
            'model_id': self.model_id, 'model_ad': model.ad if model else None,
            'olusturma': fmt(self.olusturma),
            'store_id': self.store_id,
            'magaza_adi': store.magaza_adi if store else 'AdaUsta Resmî Mağaza',
            'magaza_slug': store.slug if store else 'adausta-resmi-magaza',
            'magaza_logo': store.logo if store else '',
            'magaza_puan': store.puan if store else 0,
            'magaza_yorum_sayisi': store.yorum_sayisi if store else 0,
            'magaza_toplam_satis': store.toplam_satis if store else 0,
            'magaza_ucretsiz_kargo_limiti': store.ucretsiz_kargo_limiti if store else 199.0,
            'magaza_teslimat_gun': store.tahmini_teslimat_gun if store else '7-14 iş günü',
            'magaza_iade_gun': store.iade_gun_suresi if store else 14,
            'urun_durum': self.urun_durum,
            'kapak_gorsel': self.gorseller[0].dosya_yolu if self.gorseller else None,
        }
        if include_gorseller:
            d['gorseller'] = [{'id': g.id, 'yol': g.dosya_yolu, 'sira': g.sira} for g in self.gorseller]
        return d


class UrunGorsel(db.Model):
    __tablename__ = 'urun_gorseller'
    id         = db.Column(db.Integer, primary_key=True)
    urun_id    = db.Column(db.Integer, db.ForeignKey('urunler.id'), nullable=False)
    dosya_yolu = db.Column(db.String(300), nullable=False)
    sira       = db.Column(db.Integer, default=0)


class UrunSiparis(db.Model):
    __tablename__ = 'urun_siparisler'
    id              = db.Column(db.Integer, primary_key=True)
    urun_id         = db.Column(db.Integer, db.ForeignKey('urunler.id'), nullable=False)
    usta_id         = db.Column(db.Integer, db.ForeignKey('ustalar.id'), nullable=True)
    miktar          = db.Column(db.Integer, default=1)
    birim_fiyat_tl  = db.Column(db.Float, nullable=False)
    toplam_tl       = db.Column(db.Float, nullable=False)
    birim_fiyat_usd = db.Column(db.Float, nullable=True)
    toplam_usd      = db.Column(db.Float, nullable=True)
    durum           = db.Column(db.String(30), default='bekliyor')
    siparis_kodu    = db.Column(db.String(20), nullable=True)
    misafir_ad      = db.Column(db.String(100), nullable=True)
    misafir_telefon = db.Column(db.String(20), nullable=True)
    misafir_email   = db.Column(db.String(120), nullable=True)
    misafir_adres   = db.Column(db.Text, nullable=True)
    odeme_yontemi   = db.Column(db.String(50), nullable=True)
    olusturma       = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'urun_id': self.urun_id,
            'urun_ad': self.urun.ad if self.urun else None,
            'usta_id': self.usta_id,
            'miktar': self.miktar,
            'birim_fiyat_tl': self.birim_fiyat_tl,
            'toplam_tl': self.toplam_tl,
            'birim_fiyat_usd': self.birim_fiyat_usd,
            'toplam_usd': self.toplam_usd,
            'durum': self.durum,
            'siparis_kodu': self.siparis_kodu,
            'misafir_ad': self.misafir_ad,
            'misafir_telefon': self.misafir_telefon,
            'misafir_email': self.misafir_email,
            'misafir_adres': self.misafir_adres,
            'odeme_yontemi': self.odeme_yontemi,
            'olusturma': fmt(self.olusturma),
        }


class MagazaSiparis(db.Model):
    __tablename__ = 'magaza_siparisler'
    id               = db.Column(db.Integer, primary_key=True)
    siparis_no       = db.Column(db.String(20), unique=True, nullable=False)
    # Müşteri
    kullanici_id     = db.Column(db.Integer, db.ForeignKey('kullanicilar.id'), nullable=True)
    misafir_ad       = db.Column(db.String(100), nullable=False)
    misafir_soyad    = db.Column(db.String(100), default='')
    misafir_telefon  = db.Column(db.String(30), nullable=False)
    misafir_email    = db.Column(db.String(150), default='')
    # Fatura
    fatura_tipi      = db.Column(db.String(20), default='bireysel')  # bireysel / kurumsal
    fatura_ad        = db.Column(db.String(200), default='')
    vergi_no         = db.Column(db.String(50), default='')
    vergi_dairesi    = db.Column(db.String(100), default='')
    # Teslimat / adres
    teslimat_adres   = db.Column(db.Text, default='')
    teslimat_ilce    = db.Column(db.String(100), default='')
    teslimat_not     = db.Column(db.Text, default='')
    # Fiyatlar
    ara_toplam_tl    = db.Column(db.Float, default=0.0)
    ara_toplam_usd   = db.Column(db.Float, default=0.0)
    kdv_tl           = db.Column(db.Float, default=0.0)
    kargo_tl         = db.Column(db.Float, default=0.0)
    indirim_tl       = db.Column(db.Float, default=0.0)
    genel_toplam_tl  = db.Column(db.Float, default=0.0)
    genel_toplam_usd = db.Column(db.Float, default=0.0)
    # Ödeme
    odeme_yontemi    = db.Column(db.String(50), default='')
    odeme_durumu     = db.Column(db.String(20), default='bekliyor')  # bekliyor / odendi / basarisiz / iptal
    # Sipariş durumu
    durum            = db.Column(db.String(30), default='yeni')  # yeni / hazirlaniyor / kargoda / teslim_edildi / iptal / iade
    admin_notu       = db.Column(db.Text, default='')
    musteri_notu     = db.Column(db.Text, default='')
    # Yasal onaylar
    on_bilgilendirme_onaylandi = db.Column(db.Boolean, default=False)
    mesafeli_satis_onaylandi   = db.Column(db.Boolean, default=False)
    iptal_iade_onaylandi       = db.Column(db.Boolean, default=False)
    gizlilik_onaylandi         = db.Column(db.Boolean, default=False)
    # Sözleşme versiyonu (ne zaman onaylandı)
    sozlesme_tarih   = db.Column(db.DateTime, nullable=True)
    # Zaman
    olusturma        = db.Column(db.DateTime, default=datetime.utcnow)
    guncelleme       = db.Column(db.DateTime, default=datetime.utcnow)
    # İlişkiler
    kalemler         = db.relationship('MagazaSiparisKalemi', backref='siparis', lazy=True, cascade='all, delete-orphan')
    durum_gecmisi    = db.relationship('MagazaSiparisDurumLog', backref='siparis', lazy=True)

    def to_dict(self, include_kalemler=False):
        d = {
            'id': self.id,
            'siparis_no': self.siparis_no,
            'kullanici_id': self.kullanici_id,
            'misafir_ad': self.misafir_ad,
            'misafir_soyad': self.misafir_soyad,
            'misafir_telefon': self.misafir_telefon,
            'misafir_email': self.misafir_email,
            'fatura_tipi': self.fatura_tipi,
            'fatura_ad': self.fatura_ad,
            'vergi_no': self.vergi_no,
            'vergi_dairesi': self.vergi_dairesi,
            'teslimat_adres': self.teslimat_adres,
            'teslimat_ilce': self.teslimat_ilce,
            'teslimat_not': self.teslimat_not,
            'ara_toplam_tl': self.ara_toplam_tl,
            'ara_toplam_usd': self.ara_toplam_usd,
            'kdv_tl': self.kdv_tl,
            'kargo_tl': self.kargo_tl,
            'indirim_tl': self.indirim_tl,
            'genel_toplam_tl': self.genel_toplam_tl,
            'genel_toplam_usd': self.genel_toplam_usd,
            'odeme_yontemi': self.odeme_yontemi,
            'odeme_durumu': self.odeme_durumu,
            'durum': self.durum,
            'admin_notu': self.admin_notu,
            'musteri_notu': self.musteri_notu,
            'sozlesme_tarih': fmt(self.sozlesme_tarih),
            'olusturma': fmt(self.olusturma),
            'guncelleme': fmt(self.guncelleme),
        }
        if include_kalemler:
            d['kalemler'] = [k.to_dict() for k in self.kalemler]
            d['durum_gecmisi'] = [g.to_dict() for g in sorted(self.durum_gecmisi, key=lambda x: x.tarih)]
        return d


class MagazaSiparisKalemi(db.Model):
    __tablename__ = 'magaza_siparis_kalemleri'
    id              = db.Column(db.Integer, primary_key=True)
    siparis_id      = db.Column(db.Integer, db.ForeignKey('magaza_siparisler.id', ondelete='CASCADE'), nullable=False)
    urun_id         = db.Column(db.Integer, db.ForeignKey('urunler.id'), nullable=False)
    urun_ad         = db.Column(db.String(200), nullable=False)  # snapshot
    urun_sku        = db.Column(db.String(100), default='')
    miktar          = db.Column(db.Integer, default=1)
    birim_fiyat_tl  = db.Column(db.Float, nullable=False)
    birim_fiyat_usd = db.Column(db.Float, default=0.0)
    toplam_tl       = db.Column(db.Float, nullable=False)
    toplam_usd      = db.Column(db.Float, default=0.0)
    kapak_gorsel    = db.Column(db.String(300), default='')
    seller_order_id = db.Column(db.Integer, db.ForeignKey('satici_siparisler.id'), nullable=True)

    urun = db.relationship('Urun', foreign_keys=[urun_id])

    def to_dict(self):
        return {
            'id': self.id,
            'siparis_id': self.siparis_id,
            'urun_id': self.urun_id,
            'urun_ad': self.urun_ad,
            'urun_sku': self.urun_sku,
            'miktar': self.miktar,
            'birim_fiyat_tl': self.birim_fiyat_tl,
            'birim_fiyat_usd': self.birim_fiyat_usd,
            'toplam_tl': self.toplam_tl,
            'toplam_usd': self.toplam_usd,
            'kapak_gorsel': self.kapak_gorsel,
            'seller_order_id': self.seller_order_id,
        }


class MagazaSiparisDurumLog(db.Model):
    __tablename__ = 'magaza_siparis_durum_log'
    id          = db.Column(db.Integer, primary_key=True)
    siparis_id  = db.Column(db.Integer, db.ForeignKey('magaza_siparisler.id', ondelete='CASCADE'), nullable=False)
    eski_durum  = db.Column(db.String(30), default='')
    yeni_durum  = db.Column(db.String(30), nullable=False)
    aciklama    = db.Column(db.Text, default='')
    admin_id    = db.Column(db.Integer, nullable=True)
    tarih       = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'eski_durum': self.eski_durum,
            'yeni_durum': self.yeni_durum,
            'aciklama': self.aciklama,
            'admin_id': self.admin_id,
            'tarih': fmt(self.tarih),
        }


class FCMToken(db.Model):
    __tablename__ = 'fcm_tokenlar'
    id = db.Column(db.Integer, primary_key=True)
    kullanici_id = db.Column(db.Integer, db.ForeignKey('kullanicilar.id', ondelete='CASCADE'), nullable=False)
    token = db.Column(db.String(500), nullable=False, unique=True)
    platform = db.Column(db.String(20), default='android')
    aktif = db.Column(db.Boolean, default=True)
    olusturma = db.Column(db.DateTime, default=datetime.utcnow)
    son_guncelleme = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BildirimGecmisi(db.Model):
    __tablename__ = 'bildirim_gecmisi'
    id = db.Column(db.Integer, primary_key=True)
    kullanici_id = db.Column(db.Integer, db.ForeignKey('kullanicilar.id', ondelete='SET NULL'), nullable=True)
    baslik = db.Column(db.String(200), nullable=False)
    icerik = db.Column(db.Text, default='')
    tur = db.Column(db.String(50), default='genel')  # uyelik_uyari / sistem / talep
    gonderildi = db.Column(db.Boolean, default=False)
    hata = db.Column(db.String(500), default='')
    olusturma = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'kullanici_id': self.kullanici_id,
            'baslik': self.baslik,
            'icerik': self.icerik,
            'tur': self.tur,
            'gonderildi': self.gonderildi,
            'olusturma': fmt(self.olusturma),
        }


class AdminBildirim(db.Model):
    __tablename__ = 'admin_bildirimler'
    id = db.Column(db.Integer, primary_key=True)
    tur = db.Column(db.String(50), nullable=False)   # yeni_usta / yeni_sirket
    mesaj = db.Column(db.String(300), default='')
    goruldu = db.Column(db.Boolean, default=False)
    olusturma = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'tur': self.tur,
            'mesaj': self.mesaj,
            'goruldu': self.goruldu,
            'olusturma': fmt(self.olusturma),
        }


# ──────────────────────────────────────────────────────────
# Multi-seller marketplace models
# ──────────────────────────────────────────────────────────

class SellerApplication(db.Model):
    __tablename__ = 'satici_basvurular'
    id                = db.Column(db.Integer, primary_key=True)
    kullanici_id      = db.Column(db.Integer, db.ForeignKey('kullanicilar.id'), nullable=True)
    ticari_unvan      = db.Column(db.String(200), nullable=False)
    magaza_adi        = db.Column(db.String(200), nullable=False)
    magaza_slug       = db.Column(db.String(200), unique=True, nullable=True)
    sirket_turu       = db.Column(db.String(50), default='limited')
    vergi_no          = db.Column(db.String(50), default='')
    vergi_dairesi     = db.Column(db.String(100), default='')
    sirket_kayit_no   = db.Column(db.String(100), default='')
    yetkili_ad        = db.Column(db.String(100), nullable=False)
    yetkili_telefon   = db.Column(db.String(30), nullable=False)
    yetkili_email     = db.Column(db.String(150), nullable=False)
    adres             = db.Column(db.Text, default='')
    banka_hesap_sahibi = db.Column(db.String(200), default='')
    iban              = db.Column(db.String(50), default='')
    magaza_aciklama   = db.Column(db.Text, default='')
    logo              = db.Column(db.String(300), default='')
    kapak_gorsel      = db.Column(db.String(300), default='')
    durum             = db.Column(db.String(30), default='draft')  # draft/pending/inceleniyor/onaylandi/reddedildi
    red_nedeni        = db.Column(db.Text, default='')
    inceleme_notu     = db.Column(db.Text, default='')
    reviewer_id       = db.Column(db.Integer, db.ForeignKey('kullanicilar.id'), nullable=True)
    gonderme_tarihi   = db.Column(db.DateTime, nullable=True)
    inceleme_tarihi   = db.Column(db.DateTime, nullable=True)
    olusturma         = db.Column(db.DateTime, default=datetime.utcnow)
    guncelleme        = db.Column(db.DateTime, default=datetime.utcnow)

    belgeler = db.relationship('SellerDocument', backref='basvuru', lazy=True,
                               cascade='all, delete-orphan')

    def to_dict(self, public=True, include_belgeler=False):
        d = {
            'id': self.id,
            'kullanici_id': self.kullanici_id,
            'magaza_adi': self.magaza_adi,
            'magaza_slug': self.magaza_slug,
            'sirket_turu': self.sirket_turu,
            'vergi_dairesi': self.vergi_dairesi,
            'sirket_kayit_no': self.sirket_kayit_no,
            'yetkili_ad': self.yetkili_ad,
            'yetkili_telefon': self.yetkili_telefon,
            'yetkili_email': self.yetkili_email,
            'adres': self.adres,
            'magaza_aciklama': self.magaza_aciklama,
            'logo': self.logo,
            'kapak_gorsel': self.kapak_gorsel,
            'durum': self.durum,
            'red_nedeni': self.red_nedeni,
            'inceleme_notu': self.inceleme_notu,
            'reviewer_id': self.reviewer_id,
            'gonderme_tarihi': fmt(self.gonderme_tarihi),
            'inceleme_tarihi': fmt(self.inceleme_tarihi),
            'olusturma': fmt(self.olusturma),
            'guncelleme': fmt(self.guncelleme),
        }
        if not public:
            d['ticari_unvan'] = self.ticari_unvan
            d['vergi_no'] = self.vergi_no
            d['banka_hesap_sahibi'] = self.banka_hesap_sahibi
            d['iban'] = self.iban
        if include_belgeler:
            d['belgeler'] = [b.to_dict() for b in self.belgeler]
        return d


class SellerDocument(db.Model):
    __tablename__ = 'satici_belgeler'
    id               = db.Column(db.Integer, primary_key=True)
    basvuru_id       = db.Column(db.Integer, db.ForeignKey('satici_basvurular.id', ondelete='CASCADE'), nullable=False)
    tur              = db.Column(db.String(50), nullable=False)
    dosya_yolu       = db.Column(db.String(300), nullable=False)
    belge_no         = db.Column(db.String(100), default='')
    verilis_tarihi   = db.Column(db.Date, nullable=True)
    son_gecerlilik   = db.Column(db.Date, nullable=True)
    durum            = db.Column(db.String(20), default='pending')  # pending/onaylandi/reddedildi
    red_nedeni       = db.Column(db.Text, default='')
    inceleyen_id     = db.Column(db.Integer, db.ForeignKey('kullanicilar.id'), nullable=True)
    inceleme_tarihi  = db.Column(db.DateTime, nullable=True)
    olusturma        = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'basvuru_id': self.basvuru_id,
            'tur': self.tur,
            'has_dosya': bool(self.dosya_yolu),
            'belge_no': self.belge_no,
            'verilis_tarihi': self.verilis_tarihi.strftime('%d.%m.%Y') if self.verilis_tarihi else None,
            'son_gecerlilik': self.son_gecerlilik.strftime('%d.%m.%Y') if self.son_gecerlilik else None,
            'durum': self.durum,
            'red_nedeni': self.red_nedeni,
            'inceleyen_id': self.inceleyen_id,
            'inceleme_tarihi': fmt(self.inceleme_tarihi),
            'olusturma': fmt(self.olusturma),
        }


class MarketplaceStore(db.Model):
    __tablename__ = 'magazalar'
    id                 = db.Column(db.Integer, primary_key=True)
    basvuru_id         = db.Column(db.Integer, db.ForeignKey('satici_basvurular.id'), nullable=True)
    kullanici_id       = db.Column(db.Integer, db.ForeignKey('kullanicilar.id'), nullable=True)
    ticari_unvan       = db.Column(db.String(200), nullable=False)
    magaza_adi         = db.Column(db.String(200), nullable=False)
    slug               = db.Column(db.String(200), unique=True, nullable=False)
    vergi_no           = db.Column(db.String(50), default='')
    iban               = db.Column(db.String(50), default='')
    banka_hesap_sahibi = db.Column(db.String(200), default='')
    logo               = db.Column(db.String(300), default='')
    kapak_gorsel       = db.Column(db.String(300), default='')
    aciklama           = db.Column(db.Text, default='')
    aktif              = db.Column(db.Boolean, default=True)
    askida             = db.Column(db.Boolean, default=False)
    komisyon_orani     = db.Column(db.Float, default=15.0)
    toplam_satis       = db.Column(db.Float, default=0.0)
    puan               = db.Column(db.Float, default=0.0)
    yorum_sayisi       = db.Column(db.Integer, default=0)
    ucretsiz_kargo_limiti = db.Column(db.Float, default=199.0)
    tahmini_teslimat_gun  = db.Column(db.String(50), default='7-14 iş günü')
    iade_gun_suresi       = db.Column(db.Integer, default=14)
    olusturma          = db.Column(db.DateTime, default=datetime.utcnow)

    uyeler  = db.relationship('StoreMember', backref='magaza', lazy=True)
    bakiye  = db.relationship('SellerBalance', backref='magaza', uselist=False, lazy=True)

    def to_dict(self, public=True):
        d = {
            'id': self.id,
            'basvuru_id': self.basvuru_id,
            'kullanici_id': self.kullanici_id,
            'magaza_adi': self.magaza_adi,
            'slug': self.slug,
            'logo': self.logo,
            'kapak_gorsel': self.kapak_gorsel,
            'aciklama': self.aciklama,
            'aktif': self.aktif,
            'askida': self.askida,
            'toplam_satis': self.toplam_satis,
            'puan': self.puan,
            'yorum_sayisi': self.yorum_sayisi,
            'ucretsiz_kargo_limiti': self.ucretsiz_kargo_limiti,
            'tahmini_teslimat_gun': self.tahmini_teslimat_gun,
            'iade_gun_suresi': self.iade_gun_suresi,
            'olusturma': fmt(self.olusturma),
        }
        if not public:
            d['ticari_unvan'] = self.ticari_unvan
            d['vergi_no'] = self.vergi_no
            d['iban'] = self.iban
            d['banka_hesap_sahibi'] = self.banka_hesap_sahibi
            d['komisyon_orani'] = self.komisyon_orani
        return d


class StoreMember(db.Model):
    __tablename__ = 'magaza_uyeler'
    id           = db.Column(db.Integer, primary_key=True)
    store_id     = db.Column(db.Integer, db.ForeignKey('magazalar.id', ondelete='CASCADE'), nullable=False)
    kullanici_id = db.Column(db.Integer, db.ForeignKey('kullanicilar.id'), nullable=False)
    rol          = db.Column(db.String(30), default='urun_yetkilisi')  # sahip/yonetici/urun_yetkilisi/muhasebe
    aktif        = db.Column(db.Boolean, default=True)
    olusturma    = db.Column(db.DateTime, default=datetime.utcnow)

    kullanici = db.relationship('Kullanici', foreign_keys=[kullanici_id])

    def to_dict(self):
        return {
            'id': self.id,
            'store_id': self.store_id,
            'kullanici_id': self.kullanici_id,
            'kullanici_email': self.kullanici.email if self.kullanici else None,
            'rol': self.rol,
            'aktif': self.aktif,
        }


class SellerBalance(db.Model):
    __tablename__ = 'satici_bakiyeleri'
    id                = db.Column(db.Integer, primary_key=True)
    store_id          = db.Column(db.Integer, db.ForeignKey('magazalar.id'), unique=True, nullable=False)
    bekleyen_tl       = db.Column(db.Float, default=0.0)
    kullanilabilir_tl = db.Column(db.Float, default=0.0)
    odenmis_tl        = db.Column(db.Float, default=0.0)
    guncelleme        = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'store_id': self.store_id,
            'bekleyen_tl': self.bekleyen_tl,
            'kullanilabilir_tl': self.kullanilabilir_tl,
            'odenmis_tl': self.odenmis_tl,
            'guncelleme': fmt(self.guncelleme),
        }


class SellerHakedis(db.Model):
    __tablename__ = 'satici_hakedisler'
    id                   = db.Column(db.Integer, primary_key=True)
    store_id             = db.Column(db.Integer, db.ForeignKey('magazalar.id'), nullable=False)
    siparis_id           = db.Column(db.Integer, db.ForeignKey('magaza_siparisler.id'), nullable=True)
    siparis_no           = db.Column(db.String(30), default='')
    brut_tl              = db.Column(db.Float, default=0.0)
    komisyon_tl          = db.Column(db.Float, default=0.0)
    net_tl               = db.Column(db.Float, default=0.0)
    durum                = db.Column(db.String(20), default='bekliyor')  # bekliyor / kullanilabilir / odendi
    teslim_tarihi        = db.Column(db.DateTime, nullable=True)
    kullanilabilir_tarih = db.Column(db.DateTime, nullable=True)
    odeme_tarihi         = db.Column(db.DateTime, nullable=True)
    olusturma            = db.Column(db.DateTime, default=datetime.utcnow)

    store   = db.relationship('MarketplaceStore', foreign_keys=[store_id])
    siparis = db.relationship('MagazaSiparis', foreign_keys=[siparis_id])

    def to_dict(self):
        return {
            'id': self.id,
            'store_id': self.store_id,
            'magaza_adi': self.store.magaza_adi if self.store else '',
            'siparis_id': self.siparis_id,
            'siparis_no': self.siparis_no,
            'brut_tl': self.brut_tl,
            'komisyon_tl': self.komisyon_tl,
            'net_tl': self.net_tl,
            'durum': self.durum,
            'teslim_tarihi': fmt(self.teslim_tarihi),
            'kullanilabilir_tarih': fmt(self.kullanilabilir_tarih),
            'odeme_tarihi': fmt(self.odeme_tarihi),
            'olusturma': fmt(self.olusturma),
        }


class SellerAuditLog(db.Model):
    __tablename__ = 'satici_audit_log'
    id          = db.Column(db.Integer, primary_key=True)
    store_id    = db.Column(db.Integer, db.ForeignKey('magazalar.id'), nullable=True)
    basvuru_id  = db.Column(db.Integer, db.ForeignKey('satici_basvurular.id'), nullable=True)
    yapan_id    = db.Column(db.Integer, db.ForeignKey('kullanicilar.id'), nullable=True)
    islem       = db.Column(db.String(100), nullable=False)
    detay       = db.Column(db.Text, default='')
    ip          = db.Column(db.String(60), default='')
    tarih       = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'store_id': self.store_id,
            'basvuru_id': self.basvuru_id,
            'islem': self.islem,
            'detay': self.detay,
            'tarih': fmt(self.tarih),
        }


class SellerOrder(db.Model):
    __tablename__ = 'satici_siparisler'
    id              = db.Column(db.Integer, primary_key=True)
    siparis_id      = db.Column(db.Integer, db.ForeignKey('magaza_siparisler.id', ondelete='CASCADE'), nullable=False)
    store_id        = db.Column(db.Integer, db.ForeignKey('magazalar.id'), nullable=False)
    siparis_no      = db.Column(db.String(20), nullable=False)
    durum           = db.Column(db.String(30), default='yeni')
    ara_toplam_tl   = db.Column(db.Float, default=0.0)
    komisyon_orani  = db.Column(db.Float, default=0.0)
    komisyon_tl     = db.Column(db.Float, default=0.0)
    satici_net_tl   = db.Column(db.Float, default=0.0)
    hakediş_durumu  = db.Column(db.String(30), default='pending')  # pending/on_hold/available/paid/cancelled
    olusturma       = db.Column(db.DateTime, default=datetime.utcnow)

    magaza = db.relationship('MarketplaceStore', foreign_keys=[store_id])

    def to_dict(self):
        return {
            'id': self.id,
            'siparis_id': self.siparis_id,
            'store_id': self.store_id,
            'siparis_no': self.siparis_no,
            'durum': self.durum,
            'ara_toplam_tl': self.ara_toplam_tl,
            'komisyon_orani': self.komisyon_orani,
            'komisyon_tl': self.komisyon_tl,
            'satici_net_tl': self.satici_net_tl,
            'hakediş_durumu': self.hakediş_durumu,
            'magaza_adi': self.magaza.magaza_adi if self.magaza else '',
            'olusturma': fmt(self.olusturma),
        }


class ReturnRequest(db.Model):
    __tablename__ = 'iade_talepleri'
    id              = db.Column(db.Integer, primary_key=True)
    siparis_id      = db.Column(db.Integer, db.ForeignKey('magaza_siparisler.id', ondelete='CASCADE'), nullable=False)
    seller_order_id = db.Column(db.Integer, db.ForeignKey('satici_siparisler.id'), nullable=True)
    store_id        = db.Column(db.Integer, db.ForeignKey('magazalar.id'), nullable=True)
    urun_id         = db.Column(db.Integer, db.ForeignKey('urunler.id'), nullable=True)
    siparis_no      = db.Column(db.String(20), nullable=False)
    musteri_ad      = db.Column(db.String(200), default='')
    musteri_telefon = db.Column(db.String(30), default='')
    musteri_email   = db.Column(db.String(150), default='')
    neden           = db.Column(db.Text, nullable=False)
    aciklama        = db.Column(db.Text, default='')
    durum           = db.Column(db.String(30), default='opened')
    # opened / seller_review / approved / rejected / closed
    satici_cevabi   = db.Column(db.Text, default='')
    oneri_durum     = db.Column(db.String(30), default='')   # approve / reject / replacement
    admin_notu      = db.Column(db.Text, default='')
    iade_tutari_tl  = db.Column(db.Float, nullable=True)
    olusturma       = db.Column(db.DateTime, default=datetime.utcnow)
    guncelleme      = db.Column(db.DateTime, default=datetime.utcnow)

    siparis      = db.relationship('MagazaSiparis', foreign_keys=[siparis_id])
    magaza       = db.relationship('MarketplaceStore', foreign_keys=[store_id])

    def to_dict(self):
        return {
            'id':              self.id,
            'siparis_id':      self.siparis_id,
            'seller_order_id': self.seller_order_id,
            'store_id':        self.store_id,
            'urun_id':         self.urun_id,
            'siparis_no':      self.siparis_no,
            'musteri_ad':      self.musteri_ad,
            'musteri_telefon': self.musteri_telefon,
            'musteri_email':   self.musteri_email,
            'neden':           self.neden,
            'aciklama':        self.aciklama,
            'durum':           self.durum,
            'satici_cevabi':   self.satici_cevabi,
            'oneri_durum':     self.oneri_durum,
            'admin_notu':      self.admin_notu,
            'iade_tutari_tl':  self.iade_tutari_tl,
            'magaza_adi':      self.magaza.magaza_adi if self.magaza else '',
            'olusturma':       fmt(self.olusturma),
            'guncelleme':      fmt(self.guncelleme),
        }


class SellerReview(db.Model):
    __tablename__ = 'satici_yorumlar'
    id            = db.Column(db.Integer, primary_key=True)
    siparis_id    = db.Column(db.Integer, db.ForeignKey('magaza_siparisler.id'), nullable=False)
    store_id      = db.Column(db.Integer, db.ForeignKey('magazalar.id'), nullable=False)
    urun_id       = db.Column(db.Integer, db.ForeignKey('urunler.id'), nullable=True)
    musteri_ad    = db.Column(db.String(100), default='')
    puan          = db.Column(db.Integer, nullable=False)  # 1-5
    yorum         = db.Column(db.Text, default='')
    satici_cevabi = db.Column(db.Text, default='')
    dogrulandi    = db.Column(db.Boolean, default=True)  # always True (verified purchase)
    moderasyon    = db.Column(db.String(20), default='approved')  # pending/approved/rejected
    olusturma     = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'store_id': self.store_id,
            'urun_id': self.urun_id,
            'musteri_ad': self.musteri_ad,
            'puan': self.puan,
            'yorum': self.yorum,
            'satici_cevabi': self.satici_cevabi,
            'dogrulandi': self.dogrulandi,
            'olusturma': fmt(self.olusturma),
        }


class SellerSubscriptionPlan(db.Model):
    __tablename__ = 'satici_abonelik_planlari'
    id              = db.Column(db.Integer, primary_key=True)
    ad              = db.Column(db.String(100), nullable=False)  # 'Başlangıç'/'Profesyonel'/'Kurumsal'
    slug            = db.Column(db.String(50), unique=True, nullable=False)
    fiyat_tl        = db.Column(db.Float, default=0.0)
    urun_limiti     = db.Column(db.Integer, default=50)
    personel_limiti = db.Column(db.Integer, default=3)
    komisyon_orani  = db.Column(db.Float, default=15.0)
    one_cikarma     = db.Column(db.Integer, default=0)  # featured product slots
    rapor_seviyesi  = db.Column(db.String(20), default='temel')   # temel/gelismis/tam
    destek_seviyesi = db.Column(db.String(20), default='email')   # email/oncelikli/ozel
    aktif           = db.Column(db.Boolean, default=True)
    aciklama        = db.Column(db.Text, default='')
    olusturma       = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'ad': self.ad,
            'slug': self.slug,
            'fiyat_tl': self.fiyat_tl,
            'urun_limiti': self.urun_limiti,
            'personel_limiti': self.personel_limiti,
            'komisyon_orani': self.komisyon_orani,
            'one_cikarma': self.one_cikarma,
            'rapor_seviyesi': self.rapor_seviyesi,
            'destek_seviyesi': self.destek_seviyesi,
            'aktif': self.aktif,
            'aciklama': self.aciklama,
            'olusturma': fmt(self.olusturma),
        }


class SellerSubscription(db.Model):
    __tablename__ = 'satici_abonelikleri'
    id         = db.Column(db.Integer, primary_key=True)
    store_id   = db.Column(db.Integer, db.ForeignKey('magazalar.id'), nullable=False)
    plan_id    = db.Column(db.Integer, db.ForeignKey('satici_abonelik_planlari.id'), nullable=False)
    baslangic  = db.Column(db.DateTime, nullable=False)
    bitis      = db.Column(db.DateTime, nullable=True)
    durum      = db.Column(db.String(20), default='active')  # active/expired/cancelled/suspended
    odeme_id   = db.Column(db.Integer, db.ForeignKey('odemeler.id'), nullable=True)
    olusturma  = db.Column(db.DateTime, default=datetime.utcnow)

    plan = db.relationship('SellerSubscriptionPlan', foreign_keys=[plan_id])

    def to_dict(self):
        return {
            'id': self.id,
            'store_id': self.store_id,
            'plan_id': self.plan_id,
            'plan_ad': self.plan.ad if self.plan else None,
            'baslangic': fmt(self.baslangic),
            'bitis': fmt(self.bitis),
            'durum': self.durum,
        }


class Commission(db.Model):
    __tablename__ = 'komisyonlar'
    id              = db.Column(db.Integer, primary_key=True)
    seller_order_id = db.Column(db.Integer, db.ForeignKey('satici_siparisler.id', ondelete='CASCADE'), nullable=False)
    store_id        = db.Column(db.Integer, db.ForeignKey('magazalar.id'), nullable=False)
    siparis_id      = db.Column(db.Integer, db.ForeignKey('magaza_siparisler.id'), nullable=False)
    urun_id         = db.Column(db.Integer, db.ForeignKey('urunler.id'), nullable=True)
    komisyon_orani  = db.Column(db.Float, nullable=False)
    brut_tutar_tl   = db.Column(db.Float, nullable=False)
    komisyon_tl     = db.Column(db.Float, nullable=False)
    net_tutar_tl    = db.Column(db.Float, nullable=False)
    durum           = db.Column(db.String(20), default='pending')
    olusturma       = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'seller_order_id': self.seller_order_id,
            'store_id': self.store_id,
            'siparis_id': self.siparis_id,
            'urun_id': self.urun_id,
            'komisyon_orani': self.komisyon_orani,
            'brut_tutar_tl': self.brut_tutar_tl,
            'komisyon_tl': self.komisyon_tl,
            'net_tutar_tl': self.net_tutar_tl,
            'durum': self.durum,
            'olusturma': fmt(self.olusturma),
        }
