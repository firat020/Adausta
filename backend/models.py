from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
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
        return d


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
    olusturma = db.Column(db.DateTime, default=datetime.utcnow)
    fotograflar = db.relationship('Fotograf', backref='usta', lazy=True, cascade='all, delete-orphan')
    yorumlar = db.relationship('Yorum', backref='usta', lazy=True, cascade='all, delete-orphan')
    is_talepleri = db.relationship('IsTalebi', backref='usta', lazy=True, cascade='all, delete-orphan')
    sehir = db.relationship('Sehir', foreign_keys=[sehir_id])
    ilce = db.relationship('Ilce', foreign_keys=[ilce_id])

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
            'plan': self.plan,
            'plan_bitis': fmt(self.plan_bitis) if self.plan_bitis else None,
            'olusturma': self.olusturma.isoformat()
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
            'olusturma': fmt(self.olusturma),
        }


class Odeme(db.Model):
    __tablename__ = 'odemeler'
    id = db.Column(db.Integer, primary_key=True)
    usta_id = db.Column(db.Integer, db.ForeignKey('ustalar.id', ondelete='CASCADE'), nullable=False)
    abonelik_id = db.Column(db.Integer, db.ForeignKey('abonelikler.id'), nullable=True)
    tutar = db.Column(db.Float, nullable=False)
    durum = db.Column(db.String(20), default='bekliyor')  # basarili / basarisiz / bekliyor
    aciklama = db.Column(db.Text, default='')
    tarih = db.Column(db.DateTime, default=datetime.utcnow)
    usta = db.relationship('Usta', foreign_keys=[usta_id])

    def to_dict(self):
        return {
            'id': self.id,
            'usta_id': self.usta_id,
            'usta_ad': f'{self.usta.ad} {self.usta.soyad}'.strip() if self.usta else '',
            'abonelik_id': self.abonelik_id,
            'tutar': self.tutar,
            'durum': self.durum,
            'aciklama': self.aciklama,
            'tarih': fmt(self.tarih),
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
