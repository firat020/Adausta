from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import math

db = SQLAlchemy()

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

    def sifre_set(self, sifre):
        self.sifre_hash = generate_password_hash(sifre)

    def sifre_kontrol(self, sifre):
        return check_password_hash(self.sifre_hash, sifre)

    def kilitli_mi(self):
        if self.kilitli_kadar and self.kilitli_kadar > datetime.utcnow():
            return True
        return False

    def to_dict(self):
        return {'id': self.id, 'email': self.email, 'rol': self.rol}


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
    olusturma = db.Column(db.DateTime, default=datetime.utcnow)
    fotograflar = db.relationship('Fotograf', backref='usta', lazy=True, cascade='all, delete-orphan')
    yorumlar = db.relationship('Yorum', backref='usta', lazy=True, cascade='all, delete-orphan')
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
