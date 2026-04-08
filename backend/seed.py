"""
Veritabanını başlangıç verileriyle doldurur.
Çalıştır: python seed.py
"""
from app import app, db
from models import Sehir, Ilce, Kategori, Kullanici

with app.app_context():
    db.create_all()

    # --- ŞEHİRLER & İLÇELER ---
    sehirler_data = {
        'Lefkoşa': ['Lefkoşa Merkez', 'Gönyeli', 'Ortaköy', 'Yenişehir', 'Küçük Kaymaklı', 'Hamitköy', 'Alayköy', 'Değirmenlik'],
        'Girne': ['Girne Merkez', 'Alsancak', 'Lapta', 'Karaoğlanoğlu', 'Çatalköy', 'Esentepe', 'Bellapais', 'Ozanköy'],
        'Gazimağusa': ['Gazimağusa Merkez', 'Baykal', 'Çanakkale', 'Dumlupınar', 'Maraş', 'Yeni Boğaziçi', 'Tuzla'],
        'Güzelyurt': ['Güzelyurt Merkez', 'Akdoğan', 'Bostancı', 'Serdarköy', 'Doğancı'],
        'İskele': ['İskele Merkez', 'Boğaz', 'Tatlısu', 'Yialousa', 'Karpaz', 'Dipkarpaz', 'Bogaz'],
    }

    for sehir_ad, ilceler in sehirler_data.items():
        s = Sehir.query.filter_by(ad=sehir_ad).first()
        if not s:
            s = Sehir(ad=sehir_ad)
            db.session.add(s)
            db.session.flush()
        for ilce_ad in ilceler:
            if not Ilce.query.filter_by(ad=ilce_ad, sehir_id=s.id).first():
                db.session.add(Ilce(ad=ilce_ad, sehir_id=s.id))

    # --- KATEGORİLER ---
    kategoriler_data = [
        # Elektrik & Teknoloji
        ('Elektrikçi', '⚡', 'Elektrik arızası, sigorta, kablo çekimi ve tüm elektrik işleri.', 'Elektrik & Teknoloji', 1),
        ('Güvenlik Kamera', '📷', 'CCTV ve IP kamera montajı, güvenlik sistemi kurulumu.', 'Elektrik & Teknoloji', 2),
        ('Alarm Sistemi', '🚨', 'Hırsız alarmı, yangın alarm sistemi kurulumu.', 'Elektrik & Teknoloji', 3),
        ('Uydu & Anten', '📡', 'Uydu çanağı montajı, anten kurulumu ve onarımı.', 'Elektrik & Teknoloji', 4),
        ('Solar Panel', '☀️', 'Güneş enerjisi sistemi kurulumu ve bakımı.', 'Elektrik & Teknoloji', 5),
        ('Akıllı Ev', '🏠', 'Akıllı ev sistemleri, otomasyon kurulumu.', 'Elektrik & Teknoloji', 6),
        ('Jeneratör Servisi', '🔋', 'Jeneratör bakımı, onarımı ve kurulumu.', 'Elektrik & Teknoloji', 7),

        # Su & Isıtma
        ('Su Tesisatı', '🔧', 'Tıkanıklık açma, kaçak tespiti, boru onarımı.', 'Su & Isıtma', 8),
        ('Kombi Servisi', '🌡️', 'Kombi bakımı, onarımı ve kurulumu, tüm markalar.', 'Su & Isıtma', 9),
        ('Su Deposu & Pompa', '💧', 'Su deposu temizliği, pompa montajı ve onarımı.', 'Su & Isıtma', 10),
        ('Şofben & Termosifon', '🚿', 'Şofben montajı, onarımı ve bakımı.', 'Su & Isıtma', 11),
        ('Doğalgaz Tesisatı', '🔥', 'Doğalgaz hattı döşeme, bakım ve onarımı.', 'Su & Isıtma', 12),
        ('Gider Açma', '🪠', 'Lavabo, tuvalet, banyo gider açma hizmetleri.', 'Su & Isıtma', 13),
        ('Su Kaçağı Tespiti', '🔍', 'Gizli kaçak tespiti ve onarımı.', 'Su & Isıtma', 14),
        ('Havuz Yapımı & Bakımı', '🏊', 'Yüzme havuzu inşası, bakım ve onarımı.', 'Su & Isıtma', 15),
        ('Sulama Sistemi', '🌿', 'Otomatik sulama sistemi kurulumu ve bakımı.', 'Su & Isıtma', 16),

        # Klima & Havalandırma
        ('Klima Servisi', '❄️', 'Klima montajı, gaz dolumu, bakım ve onarımı.', 'Klima & Havalandırma', 17),
        ('Havalandırma', '💨', 'Havalandırma sistemi kurulumu ve bakımı.', 'Klima & Havalandırma', 18),
        ('Isı Pompası', '♨️', 'Isı pompası montajı ve servis hizmeti.', 'Klima & Havalandırma', 19),

        # İnşaat & Yapı
        ('Boya Badana', '🖌️', 'İç ve dış cephe boya, badana, dekoratif boya işleri.', 'İnşaat & Yapı', 20),
        ('Fayans & Seramik', '🪨', 'Banyo, mutfak, zemin fayans ve seramik döşeme.', 'İnşaat & Yapı', 21),
        ('Parke Döşeme', '🪵', 'Laminat, masif parke döşeme, zımpara ve cila.', 'İnşaat & Yapı', 22),
        ('Alçıpan & Asma Tavan', '🏗️', 'Bölme duvar, asma tavan, dekoratif alçıpan işleri.', 'İnşaat & Yapı', 23),
        ('Sıva Ustası', '🧱', 'İç ve dış sıva, alçı sıva işleri.', 'İnşaat & Yapı', 24),
        ('Mantolama', '🏢', 'Dış cephe ısı yalıtımı ve mantolama.', 'İnşaat & Yapı', 25),
        ('Çatı Tamiri & Yapımı', '🏚️', 'Çatı onarımı, su yalıtımı, çatı yapımı.', 'İnşaat & Yapı', 26),
        ('Beton & Temel', '⚙️', 'Beton dökme, temel işleri, inşaat.', 'İnşaat & Yapı', 27),
        ('Mermer & Granit', '💎', 'Mermer döşeme, granit tezgah, taş işçiliği.', 'İnşaat & Yapı', 28),
        ('Mozaik Ustası', '🎨', 'Mozaik döşeme ve dekoratif taş işleri.', 'İnşaat & Yapı', 29),
        ('Anahtar Teslim Tadilat', '🔑', 'Tasarımdan teslime komple tadilat hizmeti.', 'İnşaat & Yapı', 30),
        ('Prefabrik Ev', '🏠', 'Prefabrik ev yapımı ve kurulumu.', 'İnşaat & Yapı', 31),

        # Demir & Metal
        ('Demirci', '⚒️', 'Demir işleri, kaynak, metal konstrüksiyon.', 'Demir & Metal', 32),
        ('Demir Doğrama', '🚪', 'Demir kapı, pencere, korkuluk yapımı.', 'Demir & Metal', 33),
        ('Çelik Kapı', '🔐', 'Çelik kapı montajı, değişimi ve onarımı.', 'Demir & Metal', 34),
        ('Korkuluk & Balkon Demiri', '🛡️', 'Merdiven korkuluğu, balkon demiri yapımı.', 'Demir & Metal', 35),
        ('Kaynakçı', '🔩', 'Her türlü kaynak işleri, paslanmaz çelik.', 'Demir & Metal', 36),
        ('Ferforje', '🌹', 'Dekoratif ferforje kapı, pencere, merdiven.', 'Demir & Metal', 37),
        ('Sac & Çatı Sacı', '🏭', 'Sac işleri, çatı sacı döşeme ve onarımı.', 'Demir & Metal', 38),

        # Doğrama & Cam
        ('Alüminyum Doğrama', '🪟', 'Alüminyum kapı, pencere sistemi kurulumu.', 'Doğrama & Cam', 39),
        ('PVC & Pimapen', '🏠', 'PVC pencere, kapı montajı ve onarımı.', 'Doğrama & Cam', 40),
        ('Cam Balkon', '🌅', 'Isıcamlı cam balkon sistemi kurulumu.', 'Doğrama & Cam', 41),
        ('Camcı', '🪞', 'Cam kesme, ayna montajı, cam onarımı.', 'Doğrama & Cam', 42),
        ('Çilingir', '🗝️', 'Kapı açma, kilit değişimi, kasa açma.', 'Doğrama & Cam', 43),
        ('Kepenk & Panjur', '🎚️', 'Kepenk, panjur, stor perde montajı.', 'Doğrama & Cam', 44),
        ('Garaj Kapısı', '🚘', 'Otomatik garaj kapısı montajı ve onarımı.', 'Doğrama & Cam', 45),

        # Mobilya & İç Mekan
        ('Mobilya Montaj', '🛋️', 'IKEA ve tüm marka mobilya montaj ve kurulumu.', 'Mobilya & İç Mekan', 46),
        ('Mobilya Tamiri', '🔨', 'Kırık mobilya, sandalye, dolap tamiri.', 'Mobilya & İç Mekan', 47),
        ('Mutfak Dolabı', '🍳', 'Mutfak dolabı tasarımı, yapımı ve montajı.', 'Mobilya & İç Mekan', 48),
        ('Duvar Kağıdı', '🖼️', 'Duvar kağıdı uygulama ve dekoratif kaplama.', 'Mobilya & İç Mekan', 49),
        ('Halı Yıkama', '🧹', 'Fabrikada veya evde halı, koltuk yıkama.', 'Mobilya & İç Mekan', 50),
        ('Perde Montajı', '🪟', 'Perde, stor, jaluzi montajı.', 'Mobilya & İç Mekan', 51),
        ('Marangoz', '🪚', 'Ahşap işleri, dolap yapımı, özel mobilya.', 'Mobilya & İç Mekan', 52),

        # Ev Hizmetleri
        ('Ev Temizliği', '🧽', 'Düzenli ev temizliği, inşaat sonrası temizlik.', 'Ev Hizmetleri', 53),
        ('Ofis Temizliği', '🏢', 'Ofis, işyeri temizlik hizmetleri.', 'Ev Hizmetleri', 54),
        ('Böcek İlaçlama', '🦟', 'Haşere ilaçlama, fare, böcek kontrol.', 'Ev Hizmetleri', 55),
        ('Duşakabin Montajı', '🚿', 'Duşakabin montajı, onarımı.', 'Ev Hizmetleri', 56),
        ('Mutfak Tadilat', '🍽️', 'Mutfak yenileme, tadilat ve tasarımı.', 'Ev Hizmetleri', 57),

        # Nakliyat
        ('Evden Eve Nakliyat', '🚚', 'Sigortalı, asansörlü ev eşyası taşımacılığı.', 'Nakliyat', 58),
        ('Ofis Taşıma', '📦', 'Ofis ve işyeri taşıma hizmetleri.', 'Nakliyat', 59),
        ('Parça Eşya Taşıma', '📫', 'Tek parça eşya ve küçük taşıma işleri.', 'Nakliyat', 60),
        ('Oto Çekici', '🚗', 'Araç çekici ve yol yardım hizmetleri.', 'Nakliyat', 61),
        ('Motokurye', '🛵', 'Motosiklet ile hızlı kurye hizmeti.', 'Nakliyat', 62),

        # Beyaz Eşya & Elektronik
        ('Beyaz Eşya Servisi', '🫧', 'Buzdolabı, çamaşır, bulaşık makinesi tamiri.', 'Beyaz Eşya & Elektronik', 63),
        ('TV & Elektronik Tamir', '📺', 'Televizyon, elektronik cihaz onarımı.', 'Beyaz Eşya & Elektronik', 64),
        ('Bilgisayar Tamiri', '💻', 'Bilgisayar, laptop onarımı ve bakımı.', 'Beyaz Eşya & Elektronik', 65),
        ('Telefon Tamiri', '📱', 'Cep telefonu onarımı, ekran değişimi.', 'Beyaz Eşya & Elektronik', 66),

        # Bahçe & Dış Alan
        ('Bahçe Bakımı', '🌳', 'Bahçe düzenleme, çim biçme, peyzaj tasarımı.', 'Bahçe & Dış Alan', 67),
        ('Ağaç Budama', '🌲', 'Ağaç budama, kesme, temizleme.', 'Bahçe & Dış Alan', 68),
        ('Dış Cephe Temizliği', '🏘️', 'Bina dış cephesi, teras yıkama, basınçlı yıkama.', 'Bahçe & Dış Alan', 69),

        # Araç & Oto
        ('Oto Tamiri', '🔧', 'Araç mekanik, motor ve genel tamir.', 'Araç & Oto', 70),
        ('Kaporta & Boya', '🎨', 'Araç kaporta onarımı ve oto boya.', 'Araç & Oto', 71),
        ('Oto Elektrik', '⚡', 'Araç elektrik sistemleri onarımı.', 'Araç & Oto', 72),
        ('Lastik & Balans', '🛞', 'Lastik değişimi, balans ayarı, rot.', 'Araç & Oto', 73),
        ('Araç Seramik Kaplama', '✨', 'Araç cam filmi, seramik kaplama.', 'Araç & Oto', 74),
        ('Araç Yıkama', '🚿', 'Detaylı araç yıkama ve temizleme.', 'Araç & Oto', 75),

        # Profesyonel Hizmetler
        ('Fotoğrafçı', '📸', 'Düğün, ürün, portre, etkinlik fotoğrafçılığı.', 'Profesyonel', 76),
        ('Düğün Organizasyonu', '💒', 'Düğün, nişan organizasyonu ve dekorasyon.', 'Profesyonel', 77),
        ('İç Mimar', '🏛️', 'İç mekan tasarımı, dekorasyon ve 3D görselleştirme.', 'Profesyonel', 78),
        ('Mimar', '📐', 'Mimari proje, ruhsat işlemleri.', 'Profesyonel', 79),
        ('Catering & Yemek', '🍽️', 'Organizasyon yemek, catering hizmeti.', 'Profesyonel', 80),
        ('Terzi & Dikiş', '🧵', 'Elbise dikimi, tadilat ve onarımı.', 'Profesyonel', 81),
        ('Veteriner (Evde)', '🐾', 'Evde veteriner muayene ve tedavi.', 'Profesyonel', 82),
        ('Evcil Hayvan Bakımı', '🐶', 'Pet otel, tımar ve bakım hizmetleri.', 'Profesyonel', 83),
    ]

    for ad, ikon, aciklama, grup, sira in kategoriler_data:
        if not Kategori.query.filter_by(ad=ad).first():
            db.session.add(Kategori(ad=ad, ikon=ikon, aciklama=aciklama, grup=grup, sira=sira))

    # --- ADMIN KULLANICI ---
    if not Kullanici.query.filter_by(email='admin@adausta.com').first():
        admin = Kullanici(email='admin@adausta.com', rol='admin')
        admin.sifre_set('admin123')
        db.session.add(admin)

    db.session.commit()
    print("✅ Veritabanı başarıyla oluşturuldu!")
    print(f"   {Sehir.query.count()} şehir")
    print(f"   {Ilce.query.count()} ilçe")
    print(f"   {Kategori.query.count()} kategori")
    print(f"   Admin: admin@adausta.com / admin123")
