"""
kimibilin.com'dan taranan firmalar -> adausta.com sirketler tablosuna ekle
Sunucuda calistir: python seed_kimibilin_sirketler.py
"""
import sys
sys.path.insert(0, '/var/www/adausta/backend')

from app import app, db
from models import Sirket, Kategori, Sehir

FIRMALAR = [
    # (sirket_adi, yetkili_ad, telefon, whatsapp, kategori_ad, sehir_ad, aciklama, website)

    # ── ELEKTRİKÇİ ────────────────────────────────────────────────────────────
    ("Özgemici Elektrik Elektronik", "Özgemici",
     "05338364474", "05338364474",
     "Elektrikçi", "Girne",
     "Elektrik tesisat, güvenlik kamerası ve uydu sistemi kurulumu. Girne bölgesinde hizmet vermektedir.",
     ""),
    ("Tektan & Co.", "Tektan",
     "03928152441", "",
     "Elektrikçi", "Girne",
     "Elektrik malzemeleri tedariki ve elektrik tesisat hizmetleri. Girne ve çevresinde faaliyet göstermektedir.",
     ""),
    ("Barer Energy Ltd.", "Barer Energy",
     "03923656788", "05338288899",
     "Elektrikçi", "Gazimağusa",
     "Elektrik mühendisliği, elektrik malzemeleri ve tesisat hizmetleri. Gazimağusa genelinde hizmet vermektedir.",
     ""),
    ("Ali Bey Akten Elektrik", "Ali Bey Akten",
     "03923665741", "",
     "Elektrikçi", "Gazimağusa",
     "Elektrik malzemeleri, güvenlik sistemleri kurulum ve bakım hizmetleri.",
     ""),

    # ── SU TESİSATI ───────────────────────────────────────────────────────────
    ("Mehmet Erdem Tesisat", "Mehmet Erdem",
     "05488403131", "05488403131",
     "Su Tesisatı", "Gazimağusa",
     "Su tesisatı, sıhhi tesisat, tıkanıklık açma ve boru tamiri hizmetleri. Gazimağusa bölgesinde hizmet vermektedir.",
     ""),

    # ── SU DEPOSU & POMPA ─────────────────────────────────────────────────────
    ("Ermataş Mağusa", "Ermataş",
     "03923655500", "",
     "Su Deposu & Pompa",  "Gazimağusa",
     "Dalgıç pompası, hidrofor sistemi, su motoru satış ve servisi. Gazimağusa'da faaliyet göstermektedir.",
     ""),

    # ── BOYA BADANA ───────────────────────────────────────────────────────────
    ("Nasıfoğlu Trading Ltd.", "Nasıfoğlu",
     "05428633287", "05428633287",
     "Boya Badana", "Girne",
     "Boya badana, iç-dış cephe boyama, sıva ve tadilat hizmetleri. Girne bölgesinde deneyimli ekip.",
     ""),

    # ── FAYANS & SERAMİK ──────────────────────────────────────────────────────
    ("Levent Mozaik Ltd.", "Levent",
     "03922335692", "",
     "Fayans & Seramik", "Lefkoşa",
     "Mozaik ve seramik döşeme, zemin kaplama hizmetleri. Lefkoşa'da uzun yıllardır hizmet vermektedir.",
     ""),

    # ── ANAHTAR TESLİM TADİLAT ───────────────────────────────────────────────
    ("Kascon Ltd.", "Kascon",
     "03922253123", "",
     "Anahtar Teslim Tadilat", "Lefkoşa",
     "İnşaat ve anahtar teslim tadilat hizmetleri. Lefkoşa'da faaliyet gösteren köklü firma.",
     ""),
    ("Torno Özis Ltd.", "Torno Özis",
     "03922253844", "",
     "Anahtar Teslim Tadilat", "Lefkoşa",
     "İnşaat, yapı ve tadilat işleri. Lefkoşa merkezde hizmet vermektedir.",
     ""),
    ("Çetin Kürşat Development Ltd.", "Çetin Kürşat",
     "03923649276", "",
     "Anahtar Teslim Tadilat", "Lefkoşa",
     "İnşaat geliştirme, tadilat ve renovasyon projeleri.",
     ""),
    ("TAYF Ltd.", "TAYF",
     "03922234304", "",
     "Anahtar Teslim Tadilat", "Lefkoşa",
     "İnşaat ve yapı hizmetleri. Lefkoşa şubesiyle hizmet vermektedir.",
     ""),
    ("İsmail Dimililer ve Oğulları Ltd.", "İsmail Dimililer",
     "03922254136", "",
     "Anahtar Teslim Tadilat", "Lefkoşa",
     "Köklü aile firması. İnşaat, tadilat ve yapı hizmetleri.",
     ""),
    ("Ergüden Ticaret Ltd.", "Ergüden",
     "03922253200", "",
     "Anahtar Teslim Tadilat", "Lefkoşa",
     "İnşaat ticaret ve genel tadilat hizmetleri.",
     ""),
    ("Salih Köroğlu Construction Ltd.", "Salih Köroğlu",
     "05338692144", "05338692144",
     "Anahtar Teslim Tadilat", "Lefkoşa",
     "Profesyonel inşaat ve tadilat hizmetleri. Kuzey Kıbrıs genelinde proje deneyimi.",
     ""),
    ("Bozkaya Ltd.", "Bozkaya",
     "03922372595", "",
     "Anahtar Teslim Tadilat", "Lefkoşa",
     "İnşaat ve yapı sektöründe hizmet veren köklü firma.",
     ""),

    # ── EV TEMİZLİĞİ ─────────────────────────────────────────────────────────
    ("Akçın Temizlik Ltd.", "Akçın",
     "03922273633", "",
     "Ev Temizliği", "Lefkoşa",
     "Profesyonel ev ve ofis temizliği, derin temizlik ve periyodik temizlik hizmetleri. Lefkoşa'da hizmet vermektedir.",
     ""),
    ("Milsum Trading Ltd.", "Milsum",
     "05338688091", "05338688091",
     "Ev Temizliği", "Gazimağusa",
     "Temizlik hizmetleri ve temizlik ürünleri. Gazimağusa bölgesinde faaliyet göstermektedir.",
     ""),
]


def main():
    with app.app_context():
        db.create_all()  # Eksik tabloları oluştur
        eklenen = 0
        atlanan = 0

        for (sirket_adi, yetkili_ad, telefon, whatsapp,
             kategori_ad, sehir_ad, aciklama, website) in FIRMALAR:

            # Zaten var mı kontrol et
            mevcut = Sirket.query.filter_by(sirket_adi=sirket_adi).first()
            if mevcut:
                print(f"  [ATLA] {sirket_adi} zaten mevcut")
                atlanan += 1
                continue

            # Kategori bul
            kategori = Kategori.query.filter_by(ad=kategori_ad).first()
            if not kategori:
                print(f"  [HATA] Kategori bulunamadi: {kategori_ad}")
                continue

            # Sehir bul
            sehir = Sehir.query.filter_by(ad=sehir_ad).first()

            s = Sirket(
                sirket_adi=sirket_adi,
                yetkili_ad=yetkili_ad,
                telefon=telefon,
                whatsapp=whatsapp,
                email='',
                kategori_id=kategori.id,
                sehir_id=sehir.id if sehir else None,
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
