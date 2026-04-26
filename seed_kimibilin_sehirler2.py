"""
kimibilin.com'dan taranan firmalar (Güzelyurt, İskele, Lefkoşa ek, Girne ek)
-> adausta.com sirketler tablosuna ekle
Sunucuda calistir: /var/www/adausta/venv/bin/python3 seed_kimibilin_sehirler2.py
"""
import sys
sys.path.insert(0, '/var/www/adausta/backend')

from app import app, db
from models import Sirket, Kategori, Sehir

FIRMALAR = [
    # (sirket_adi, yetkili_ad, telefon, whatsapp, kategori_ad, sehir_ad, aciklama, website)

    # ── GÜZELYURTlü FİRMALAR ──────────────────────────────────────────────────
    ("The Wall Güvenlik", "The Wall",
     "05338626065", "05338626065",
     "Anahtar Teslim Tadilat", "Güzelyurt",
     "İnşaat ve güvenlik sistemleri kurulumu. Güzelyurt bölgesinde hizmet vermektedir.",
     ""),
    ("Tamer Tüm Yapı Market", "Tamer",
     "03927145972", "",
     "Anahtar Teslim Tadilat", "Güzelyurt",
     "Yapı market ve inşaat malzemeleri. Güzelyurt'ta geniş ürün yelpazesiyle hizmet vermektedir.",
     ""),
    ("Ahmet Karakaş Tesisat", "Ahmet Karakaş",
     "05428805949", "05428805949",
     "Su Tesisatı", "Güzelyurt",
     "Su tesisatı, sıhhi tesisat ve boru tamiri hizmetleri. Güzelyurt bölgesinde hizmet vermektedir.",
     ""),
    ("Yaman Anmış Ticaret", "Yaman Anmış",
     "05338468089", "05338468089",
     "Su Tesisatı", "Güzelyurt",
     "Su tesisatı malzemeleri ve tesisat hizmetleri. Güzelyurt'ta faaliyet göstermektedir.",
     ""),
    ("Tanpa Ticaret", "Tanpa",
     "03927142633", "",
     "Elektrikçi", "Güzelyurt",
     "Elektrik malzemeleri satışı ve elektrik tesisat hizmetleri. Güzelyurt'ta hizmet vermektedir.",
     ""),
    ("Ramazan Akın", "Ramazan Akın",
     "05338300997", "05338300997",
     "Boya Badana", "Güzelyurt",
     "Boya badana, iç-dış cephe boyama ve bahçe bakım hizmetleri. Güzelyurt bölgesinde faaliyet göstermektedir.",
     ""),

    # ── İSKELE FİRMALARI ──────────────────────────────────────────────────────
    ("Mustafa Soylu Tesisat", "Mustafa Soylu",
     "05428866982", "05428866982",
     "Su Tesisatı", "İskele",
     "Su tesisatı, sıhhi tesisat ve tıkanıklık açma hizmetleri. İskele bölgesinde hizmet vermektedir.",
     ""),
    ("Mahmut Kılıç Demir Doğrama", "Mahmut Kılıç",
     "05338302979", "05338302979",
     "Demir Doğrama", "İskele",
     "Demir doğrama, alüminyum kapı-pencere ve çelik konstrüksiyon hizmetleri. İskele'de faaliyet göstermektedir.",
     ""),
    ("Özkan Milli Alüminyum", "Özkan Milli",
     "05428503718", "05428503718",
     "Demir Doğrama", "İskele",
     "Alüminyum doğrama, demir kapı ve pencere imalatı ile montaj hizmetleri. İskele bölgesinde hizmet vermektedir.",
     ""),

    # ── LEFKOŞA EK FİRMALAR ───────────────────────────────────────────────────
    ("Gürkur Ticaret", "Gürkur",
     "05488508405", "05488508405",
     "Su Tesisatı", "Lefkoşa",
     "Su tesisatı malzemeleri ve tesisat hizmetleri. Lefkoşa'da faaliyet göstermektedir.",
     ""),
    ("İnce Elektronik", "İnce Elektronik",
     "03924444623", "",
     "Klima Servisi", "Lefkoşa",
     "Klima montaj, bakım, onarım ve elektronik cihaz servisi. Lefkoşa'da hizmet vermektedir.",
     ""),
    ("Çelebioğlu Temizlik", "Çelebioğlu",
     "03924440158", "",
     "Ev Temizliği", "Lefkoşa",
     "Profesyonel ev, ofis ve bina temizliği hizmetleri. Lefkoşa'da faaliyet göstermektedir.",
     ""),

    # ── GİRNE EK FİRMALAR ─────────────────────────────────────────────────────
    ("Ermataş Girne", "Ermataş",
     "03928152466", "",
     "Su Deposu & Pompa", "Girne",
     "Dalgıç pompası, hidrofor sistemi, su motoru satış ve servisi. Girne'de faaliyet göstermektedir.",
     ""),
    ("Saber Endüstriyel", "Saber",
     "03928159181", "",
     "Klima Servisi", "Girne",
     "Klima montaj, bakım ve endüstriyel soğutma sistemleri hizmetleri. Girne bölgesinde faaliyet göstermektedir.",
     ""),
    ("Kader Çömez Bahçe Bakımı", "Kader Çömez",
     "05338325900", "05338325900",
     "Bahçe Bakımı", "Girne",
     "Bahçe bakımı, peyzaj düzenlemesi ve çim biçme hizmetleri. Girne bölgesinde hizmet vermektedir.",
     ""),
]


def main():
    with app.app_context():
        db.create_all()
        eklenen = 0
        atlanan = 0

        for (sirket_adi, yetkili_ad, telefon, whatsapp,
             kategori_ad, sehir_ad, aciklama, website) in FIRMALAR:

            mevcut = Sirket.query.filter_by(sirket_adi=sirket_adi).first()
            if mevcut:
                print(f"  [ATLA] {sirket_adi} zaten mevcut")
                atlanan += 1
                continue

            kategori = Kategori.query.filter_by(ad=kategori_ad).first()
            if not kategori:
                print(f"  [HATA] Kategori bulunamadi: {kategori_ad}")
                continue

            sehir = Sehir.query.filter_by(ad=sehir_ad).first()
            if not sehir:
                print(f"  [HATA] Sehir bulunamadi: {sehir_ad}")
                continue

            s = Sirket(
                sirket_adi=sirket_adi,
                yetkili_ad=yetkili_ad,
                telefon=telefon,
                whatsapp=whatsapp,
                email='',
                kategori_id=kategori.id,
                sehir_id=sehir.id,
                aciklama=aciklama,
                website=website,
                onaylanmis=True,
                aktif=True,
                plan='ucretsiz',
            )
            db.session.add(s)
            eklenen += 1
            print(f"  [OK] {sirket_adi} ({kategori_ad} / {sehir_ad})")

        db.session.commit()
        print(f"\nToplam: {eklenen} eklendi, {atlanan} atlandı.")


if __name__ == '__main__':
    main()
