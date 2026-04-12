"""
Veritabanını başlangıç verileriyle doldurur.
Çalıştır: python seed.py
"""
from app import app, db
from models import Sehir, Ilce, Kategori, Kullanici

with app.app_context():
    db.drop_all()
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
    # (ad, ikon, aciklama, grup, sira, seo_keywords)
    kategoriler_data = [
        # Elektrik & Teknoloji
        ('Elektrikçi', '⚡', 'Elektrik arızası, sigorta, kablo çekimi ve tüm elektrik işleri.', 'Elektrik & Teknoloji', 1,
         'KKTC nöbetçi elektrikçi, Lefkoşa elektrik arıza, Kıbrıs elektrik tesisat döşeme, Girne elektrik ustası'),
        ('Güvenlik Kamera', '📷', 'CCTV ve IP kamera montajı, güvenlik sistemi kurulumu.', 'Elektrik & Teknoloji', 2,
         'KKTC kamera sistemleri, Kıbrıs güvenlik alarm, ev güvenlik sistemleri Lefkoşa, IP kamera kurulumu'),
        ('Alarm Sistemi', '🚨', 'Hırsız alarmı, yangın alarm sistemi kurulumu.', 'Elektrik & Teknoloji', 3,
         'KKTC kamera sistemleri, Kıbrıs güvenlik alarm, ev güvenlik sistemleri Lefkoşa, IP kamera kurulumu'),
        ('Uydu & Anten', '📡', 'Uydu çanağı montajı, anten kurulumu ve onarımı.', 'Elektrik & Teknoloji', 4,
         'Kıbrıs uydu montajı, Lefkoşa çanak anten kurulumu, KKTC TV sinyal yok arızası, Dreambox kurulum Kıbrıs'),
        ('Solar Panel', '☀️', 'Güneş enerjisi sistemi kurulumu ve bakımı.', 'Elektrik & Teknoloji', 5,
         'KKTC güneş enerjisi sistemleri, Kıbrıs solar panel kurulumu, güneş paneli fiyatları KKTC, on-grid sistemler Kıbrıs'),
        ('Akıllı Ev', '🏠', 'Akıllı ev sistemleri, otomasyon kurulumu.', 'Elektrik & Teknoloji', 6,
         'KKTC akıllı ev sistemleri, Kıbrıs ev otomasyonu, Lefkoşa smart home kurulumu, Girne akıllı aydınlatma, otomasyon sistemi KKTC'),
        ('Jeneratör Servisi', '🔋', 'Jeneratör bakımı, onarımı ve kurulumu.', 'Elektrik & Teknoloji', 7,
         'KKTC jeneratör servisi, Kıbrıs jeneratör tamiri, Lefkoşa dizel jeneratör bakımı, Girne jeneratör kurulumu, acil jeneratör KKTC'),

        # Su & Isıtma
        ('Su Tesisatı', '🔧', 'Tıkanıklık açma, kaçak tespiti, boru onarımı.', 'Su & Isıtma', 8,
         'KKTC su tesisatçısı, Lefkoşa acil tesisatçı, Kıbrıs boru tamiri, Girne tesisat ustası, en yakın tesisatçı'),
        ('Kombi Servisi', '🌡️', 'Kombi bakımı, onarımı ve kurulumu, tüm markalar.', 'Su & Isıtma', 9,
         'KKTC kombi bakımı, Kıbrıs kombi tamiri, Lefkoşa gazlı ısıtıcı servisi, merkezi ısıtma sistemleri Kıbrıs'),
        ('Su Deposu & Pompa', '💧', 'Su deposu temizliği, pompa montajı ve onarımı.', 'Su & Isıtma', 10,
         'KKTC su motoru tamiri, Kıbrıs hidrofor servisi, su deposu temizliği Lefkoşa, Girne su pompası kurulumu'),
        ('Şofben & Termosifon', '🚿', 'Şofben montajı, onarımı ve bakımı.', 'Su & Isıtma', 11,
         'KKTC şofben tamiri, Kıbrıs termosifon servisi, Lefkoşa elektrikli su ısıtıcı arızası, Girne şofben montajı, güneş enerjisi şofben KKTC'),
        ('Doğalgaz Tesisatı', '🔥', 'Doğalgaz hattı döşeme, bakım ve onarımı.', 'Su & Isıtma', 12,
         'KKTC doğalgaz tesisatı, Kıbrıs gaz hattı döşeme, Lefkoşa LPG tesisat ustası, Girne doğalgaz bağlantısı, tüp gaz sistemi KKTC'),
        ('Gider Açma', '🪠', 'Lavabo, tuvalet, banyo gider açma hizmetleri.', 'Su & Isıtma', 13,
         'Kıbrıs cihazla su kaçağı tespiti, KKTC tıkalı gider açma, Lefkoşa robotla lavabo açma, kırmadan kaçak tamiri Kıbrıs'),
        ('Su Kaçağı Tespiti', '🔍', 'Gizli kaçak tespiti ve onarımı.', 'Su & Isıtma', 14,
         'Kıbrıs cihazla su kaçağı tespiti, KKTC tıkalı gider açma, Lefkoşa robotla lavabo açma, kırmadan kaçak tamiri Kıbrıs'),
        ('Havuz Yapımı & Bakımı', '🏊', 'Yüzme havuzu inşası, bakım ve onarımı.', 'Su & Isıtma', 15,
         'KKTC yüzme havuzu yapımı, Kıbrıs havuz temizliği, Lefkoşa havuz bakım şirketleri, Girne villa havuzu, havuz kimyasalları KKTC'),
        ('Sulama Sistemi', '🌿', 'Otomatik sulama sistemi kurulumu ve bakımı.', 'Su & Isıtma', 16,
         'Kıbrıs otomatik bahçe sulama, KKTC damlama sulama sistemleri, peyzaj sulama kurulumu Lefkoşa'),

        # Klima & Havalandırma
        ('Klima Servisi', '❄️', 'Klima montajı, gaz dolumu, bakım ve onarımı.', 'Klima & Havalandırma', 17,
         'KKTC klima servisi, Kıbrıs klima montajı, gaz dolumu fiyatları Kıbrıs, ısı pompası kurulumu Lefkoşa, inverter klima bakım'),
        ('Havalandırma', '💨', 'Havalandırma sistemi kurulumu ve bakımı.', 'Klima & Havalandırma', 18,
         'KKTC klima servisi, Kıbrıs klima montajı, gaz dolumu fiyatları Kıbrıs, ısı pompası kurulumu Lefkoşa, inverter klima bakım'),
        ('Isı Pompası', '♨️', 'Isı pompası montajı ve servis hizmeti.', 'Klima & Havalandırma', 19,
         'KKTC klima servisi, Kıbrıs klima montajı, gaz dolumu fiyatları Kıbrıs, ısı pompası kurulumu Lefkoşa, inverter klima bakım'),

        # İnşaat & Yapı
        ('Boya Badana', '🖌️', 'İç ve dış cephe boya, badana, dekoratif boya işleri.', 'İnşaat & Yapı', 20,
         'KKTC boyacı ustası, Kıbrıs ev boyama fiyatları, Lefkoşa dekoratif boya, Girne daire boyama, dış cephe boyası Kıbrıs'),
        ('Fayans & Seramik', '🪨', 'Banyo, mutfak, zemin fayans ve seramik döşeme.', 'İnşaat & Yapı', 21,
         'Kıbrıs fayans ustası, KKTC seramik döşeme, banyo yenileme Lefkoşa, Mağusa fayans işçilik fiyatları'),
        ('Parke Döşeme', '🪵', 'Laminat, masif parke döşeme, zımpara ve cila.', 'İnşaat & Yapı', 22,
         'KKTC laminat parke, Kıbrıs parke ustası, süpürgelik montajı Lefkoşa, Girne parke sistre cila'),
        ('Alçıpan & Asma Tavan', '🏗️', 'Bölme duvar, asma tavan, dekoratif alçıpan işleri.', 'İnşaat & Yapı', 23,
         'Kıbrıs asma tavan modelleri, KKTC alçıpan bölme duvar, Lefkoşa gergi tavan, TV ünitesi alçıpan Kıbrıs'),
        ('Sıva Ustası', '🧱', 'İç ve dış sıva, alçı sıva işleri.', 'İnşaat & Yapı', 24,
         'KKTC dış cephe mantolama, Kıbrıs ısı yalıtımı, Lefkoşa sıva ustası, kaba inşaat işleri Kıbrıs'),
        ('Mantolama', '🏢', 'Dış cephe ısı yalıtımı ve mantolama.', 'İnşaat & Yapı', 25,
         'KKTC dış cephe mantolama, Kıbrıs ısı yalıtımı, Lefkoşa sıva ustası, kaba inşaat işleri Kıbrıs'),
        ('Çatı Tamiri & Yapımı', '🏚️', 'Çatı onarımı, su yalıtımı, çatı yapımı.', 'İnşaat & Yapı', 26,
         'Kıbrıs çatı izolasyonu, KKTC çatı aktarma, Lefkoşa su yalıtımı, Girne çatı yapımı firmaları'),
        ('Beton & Temel', '⚙️', 'Beton dökme, temel işleri, inşaat.', 'İnşaat & Yapı', 27,
         'KKTC çatı tamiri, Kıbrıs prefabrik ev fiyatları, kaba inşaat ustası Lefkoşa, mermer basamak Kıbrıs'),
        ('Mermer & Granit', '💎', 'Mermer döşeme, granit tezgah, taş işçiliği.', 'İnşaat & Yapı', 28,
         'KKTC çatı tamiri, Kıbrıs prefabrik ev fiyatları, kaba inşaat ustası Lefkoşa, mermer basamak Kıbrıs'),
        ('Mozaik Ustası', '🎨', 'Mozaik döşeme ve dekoratif taş işleri.', 'İnşaat & Yapı', 29,
         'KKTC boyacı ustası, Kıbrıs anahtar teslim tadilat, Lefkoşa fayans döşeme, dış cephe mantolama Kıbrıs, parke ustası Girne'),
        ('Anahtar Teslim Tadilat', '🔑', 'Tasarımdan teslime komple tadilat hizmeti.', 'İnşaat & Yapı', 30,
         'KKTC komple ev tadilatı, Kıbrıs tadilat dekorasyon şirketleri, Lefkoşa ev yenileme, anahtar teslim villa inşaatı Kıbrıs'),
        ('Prefabrik Ev', '🏠', 'Prefabrik ev yapımı ve kurulumu.', 'İnşaat & Yapı', 31,
         'KKTC çatı tamiri, Kıbrıs prefabrik ev fiyatları, kaba inşaat ustası Lefkoşa, mermer basamak Kıbrıs'),

        # Demir & Metal
        ('Demirci', '⚒️', 'Demir işleri, kaynak, metal konstrüksiyon.', 'Demir & Metal', 32,
         'KKTC demirci ustası, Kıbrıs kaynak işleri, ferforje korkuluk Lefkoşa, çelik konstrüksiyon KKTC, Girne demir kapı'),
        ('Demir Doğrama', '🚪', 'Demir kapı, pencere, korkuluk yapımı.', 'Demir & Metal', 33,
         'KKTC demirci ustası, Kıbrıs kaynak işleri, ferforje korkuluk Lefkoşa, çelik konstrüksiyon KKTC, Girne demir kapı'),
        ('Çelik Kapı', '🔐', 'Çelik kapı montajı, değişimi ve onarımı.', 'Demir & Metal', 34,
         'KKTC demirci ustası, Kıbrıs kaynak işleri, ferforje korkuluk Lefkoşa, çelik konstrüksiyon KKTC, Girne demir kapı'),
        ('Korkuluk & Balkon Demiri', '🛡️', 'Merdiven korkuluğu, balkon demiri yapımı.', 'Demir & Metal', 35,
         'KKTC demirci ustası, Kıbrıs kaynak işleri, ferforje korkuluk Lefkoşa, çelik konstrüksiyon KKTC, Girne demir kapı'),
        ('Kaynakçı', '🔩', 'Her türlü kaynak işleri, paslanmaz çelik.', 'Demir & Metal', 36,
         'KKTC demirci ustası, Kıbrıs kaynak işleri, ferforje korkuluk Lefkoşa, çelik konstrüksiyon KKTC, Girne demir kapı'),
        ('Ferforje', '🌹', 'Dekoratif ferforje kapı, pencere, merdiven.', 'Demir & Metal', 37,
         'KKTC demirci ustası, Kıbrıs kaynak işleri, ferforje korkuluk Lefkoşa, çelik konstrüksiyon KKTC, Girne demir kapı'),
        ('Sac & Çatı Sacı', '🏭', 'Sac işleri, çatı sacı döşeme ve onarımı.', 'Demir & Metal', 38,
         'KKTC çatı sacı fiyatları, sandviç panel Kıbrıs, oluk tamiri Lefkoşa, çatı kaplama KKTC'),

        # Doğrama & Cam
        ('Alüminyum Doğrama', '🪟', 'Alüminyum kapı, pencere sistemi kurulumu.', 'Doğrama & Cam', 39,
         'KKTC PVC pencere, Kıbrıs cam balkon fiyatları, alüminyum doğrama Lefkoşa, Pimapen tamiri Kıbrıs'),
        ('PVC & Pimapen', '🏠', 'PVC pencere, kapı montajı ve onarımı.', 'Doğrama & Cam', 40,
         'KKTC PVC pencere, Kıbrıs cam balkon fiyatları, alüminyum doğrama Lefkoşa, Pimapen tamiri Kıbrıs'),
        ('Cam Balkon', '🌅', 'Isıcamlı cam balkon sistemi kurulumu.', 'Doğrama & Cam', 41,
         'KKTC PVC pencere, Kıbrıs cam balkon fiyatları, alüminyum doğrama Lefkoşa, Pimapen tamiri Kıbrıs'),
        ('Camcı', '🪞', 'Cam kesme, ayna montajı, cam onarımı.', 'Doğrama & Cam', 42,
         'KKTC çilingir 7/24, Lefkoşa anahtarcı, Kıbrıs camcı, acil kapı açma Girne, ayna montajı Kıbrıs'),
        ('Çilingir', '🗝️', 'Kapı açma, kilit değişimi, kasa açma.', 'Doğrama & Cam', 43,
         'KKTC çilingir 7/24, Lefkoşa anahtarcı, Kıbrıs camcı, acil kapı açma Girne, ayna montajı Kıbrıs'),
        ('Kepenk & Panjur', '🎚️', 'Kepenk, panjur, stor perde montajı.', 'Doğrama & Cam', 44,
         'KKTC otomatik kepenk, Kıbrıs garaj kapısı sistemleri, panjur tamiri Lefkoşa, fotoselli kapı KKTC'),
        ('Garaj Kapısı', '🚘', 'Otomatik garaj kapısı montajı ve onarımı.', 'Doğrama & Cam', 45,
         'KKTC otomatik kepenk, Kıbrıs garaj kapısı sistemleri, panjur tamiri Lefkoşa, fotoselli kapı KKTC'),

        # Mobilya & İç Mekan
        ('Mobilya Montaj', '🛋️', 'IKEA ve tüm marka mobilya montaj ve kurulumu.', 'Mobilya & İç Mekan', 46,
         'KKTC mobilya kurulumu, IKEA montaj Kıbrıs, Lefkoşa marangoz, özel yapım mutfak dolabı Kıbrıs, mobilya boya tamir'),
        ('Mobilya Tamiri', '🔨', 'Kırık mobilya, sandalye, dolap tamiri.', 'Mobilya & İç Mekan', 47,
         'KKTC mobilya kurulumu, IKEA montaj Kıbrıs, Lefkoşa marangoz, özel yapım mutfak dolabı Kıbrıs, mobilya boya tamir'),
        ('Mutfak Dolabı', '🍳', 'Mutfak dolabı tasarımı, yapımı ve montajı.', 'Mobilya & İç Mekan', 48,
         'KKTC mobilya kurulumu, IKEA montaj Kıbrıs, Lefkoşa marangoz, özel yapım mutfak dolabı Kıbrıs, mobilya boya tamir'),
        ('Duvar Kağıdı', '🖼️', 'Duvar kağıdı uygulama ve dekoratif kaplama.', 'Mobilya & İç Mekan', 49,
         'Kıbrıs halı yıkama fabrikası, KKTC duvar kağıdı ustası, koltuk yıkama Lefkoşa, perde montajı Kıbrıs'),
        ('Halı Yıkama', '🧹', 'Fabrikada veya evde halı, koltuk yıkama.', 'Mobilya & İç Mekan', 50,
         'Kıbrıs halı yıkama fabrikası, KKTC duvar kağıdı ustası, koltuk yıkama Lefkoşa, perde montajı Kıbrıs'),
        ('Perde Montajı', '🪟', 'Perde, stor, jaluzi montajı.', 'Mobilya & İç Mekan', 51,
         'Kıbrıs halı yıkama fabrikası, KKTC duvar kağıdı ustası, koltuk yıkama Lefkoşa, perde montajı Kıbrıs'),
        ('Marangoz', '🪚', 'Ahşap işleri, dolap yapımı, özel mobilya.', 'Mobilya & İç Mekan', 52,
         'KKTC mobilya kurulumu, IKEA montaj Kıbrıs, Lefkoşa marangoz, özel yapım mutfak dolabı Kıbrıs, mobilya boya tamir'),

        # Ev Hizmetleri
        ('Ev Temizliği', '🧽', 'Düzenli ev temizliği, inşaat sonrası temizlik.', 'Ev Hizmetleri', 53,
         'KKTC ev temizliği, Kıbrıs ofis temizlik şirketleri, inşaat sonrası temizlik Lefkoşa, gündelikçi bayan Kıbrıs'),
        ('Ofis Temizliği', '🏢', 'Ofis, işyeri temizlik hizmetleri.', 'Ev Hizmetleri', 54,
         'KKTC ev temizliği, Kıbrıs ofis temizlik şirketleri, inşaat sonrası temizlik Lefkoşa, gündelikçi bayan Kıbrıs'),
        ('Böcek İlaçlama', '🦟', 'Haşere ilaçlama, fare, böcek kontrol.', 'Ev Hizmetleri', 55,
         'KKTC ilaçlama şirketleri, Kıbrıs haşere kontrol, Lefkoşa hamam böceği ilaçlama, Girne karınca ilaçlama'),
        ('Duşakabin Montajı', '🚿', 'Duşakabin montajı, onarımı.', 'Ev Hizmetleri', 56,
         'KKTC duşakabin montajı, Kıbrıs banyo yenileme, Lefkoşa duşakabin fiyatları, Girne cam duşakabin kurulumu, banyo tadilat KKTC'),
        ('Mutfak Tadilat', '🍽️', 'Mutfak yenileme, tadilat ve tasarımı.', 'Ev Hizmetleri', 57,
         'KKTC mutfak tadilatı, Kıbrıs mutfak yenileme fiyatları, Lefkoşa tezgah değişimi, Girne mutfak dolabı yenileme, komple mutfak tadilat KKTC'),

        # Nakliyat
        ('Evden Eve Nakliyat', '🚚', 'Sigortalı, asansörlü ev eşyası taşımacılığı.', 'Nakliyat', 58,
         'KKTC ev taşıma, Kıbrıs nakliyat şirketleri, şehirler arası nakliye Kıbrıs, asansörlü taşıma Lefkoşa'),
        ('Ofis Taşıma', '📦', 'Ofis ve işyeri taşıma hizmetleri.', 'Nakliyat', 59,
         'KKTC ev taşıma, Kıbrıs nakliyat şirketleri, şehirler arası nakliye Kıbrıs, asansörlü taşıma Lefkoşa'),
        ('Parça Eşya Taşıma', '📫', 'Tek parça eşya ve küçük taşıma işleri.', 'Nakliyat', 60,
         'KKTC ev taşıma, Kıbrıs nakliyat şirketleri, şehirler arası nakliye Kıbrıs, asansörlü taşıma Lefkoşa'),
        ('Oto Çekici', '🚗', 'Araç çekici ve yol yardım hizmetleri.', 'Nakliyat', 61,
         'KKTC oto çekici, acil yol yardım Kıbrıs, Lefkoşa motokurye, Girne çekici numarası'),
        ('Motokurye', '🛵', 'Motosiklet ile hızlı kurye hizmeti.', 'Nakliyat', 62,
         'KKTC oto çekici, acil yol yardım Kıbrıs, Lefkoşa motokurye, Girne çekici numarası'),

        # Beyaz Eşya & Elektronik
        ('Beyaz Eşya Servisi', '🫧', 'Buzdolabı, çamaşır, bulaşık makinesi tamiri.', 'Beyaz Eşya & Elektronik', 63,
         'KKTC beyaz eşya tamiri, Lefkoşa çamaşır makinesi servisi, buzdolabı tamircisi Kıbrıs, Arçelik/Beko servis KKTC'),
        ('TV & Elektronik Tamir', '📺', 'Televizyon, elektronik cihaz onarımı.', 'Beyaz Eşya & Elektronik', 64,
         'Kıbrıs TV tamircisi, Lefkoşa LED TV panel tamiri, elektronik kart onarımı KKTC'),
        ('Bilgisayar Tamiri', '💻', 'Bilgisayar, laptop onarımı ve bakımı.', 'Beyaz Eşya & Elektronik', 65,
         'KKTC laptop tamiri, Lefkoşa bilgisayar format, Kıbrıs gaming PC toplama, teknik servis KKTC'),
        ('Telefon Tamiri', '📱', 'Cep telefonu onarımı, ekran değişimi.', 'Beyaz Eşya & Elektronik', 66,
         'Kıbrıs ekran değişimi, KKTC iPhone tamiri, Lefkoşa telefon teknik servis, pil değişimi Kıbrıs'),

        # Bahçe & Dış Alan
        ('Bahçe Bakımı', '🌳', 'Bahçe düzenleme, çim biçme, peyzaj tasarımı.', 'Bahçe & Dış Alan', 67,
         'KKTC peyzaj düzenleme, Kıbrıs bahçıvan hizmetleri, Girne çim biçme, bahçe tasarımı Lefkoşa'),
        ('Ağaç Budama', '🌲', 'Ağaç budama, kesme, temizleme.', 'Bahçe & Dış Alan', 68,
         'Kıbrıs ağaç kesme, KKTC palmiye budama, bahçe temizliği Kıbrıs, tehlikeli ağaç kesimi Girne'),
        ('Dış Cephe Temizliği', '🏘️', 'Bina dış cephesi, teras yıkama, basınçlı yıkama.', 'Bahçe & Dış Alan', 69,
         'KKTC bina yıkama, Kıbrıs cam temizliği, dış cephe basınçlı yıkama, Girne villa temizliği'),

        # Araç & Oto
        ('Oto Tamiri', '🔧', 'Araç mekanik, motor ve genel tamir.', 'Araç & Oto', 70,
         'KKTC oto tamirci, Lefkoşa araç bakım, Girne motor tamiri, Kıbrıs oto servis, en yakın oto tamirci'),
        ('Kaporta & Boya', '🎨', 'Araç kaporta onarımı ve oto boya.', 'Araç & Oto', 71,
         'Kıbrıs oto boya, KKTC kaporta düzeltme, fırın boya Lefkoşa, araç boyama fiyatları Kıbrıs'),
        ('Oto Elektrik', '⚡', 'Araç elektrik sistemleri onarımı.', 'Araç & Oto', 72,
         'KKTC oto elektrikçi, Girne araç beyin tamiri, oto klima elektrik arıza, marş dinamosu tamiri Kıbrıs'),
        ('Lastik & Balans', '🛞', 'Lastik değişimi, balans ayarı, rot.', 'Araç & Oto', 73,
         'Kıbrıs lastikçi, Lefkoşa rot balans, KKTC çıkma lastik, en ucuz lastik fiyatları Kıbrıs, Mağusa lastik değişimi'),
        ('Araç Seramik Kaplama', '✨', 'Araç cam filmi, seramik kaplama.', 'Araç & Oto', 74,
         'KKTC seramik kaplama, Kıbrıs cam filmi, araç kaplama Lefkoşa, detaylı iç temizlik Kıbrıs'),
        ('Araç Yıkama', '🚿', 'Detaylı araç yıkama ve temizleme.', 'Araç & Oto', 75,
         'Lefkoşa oto yıkama, KKTC detaylı araç temizliği, Girne buharlı oto yıkama, araç yıkama fiyatları'),

        # Profesyonel Hizmetler
        ('Fotoğrafçı', '📸', 'Düğün, ürün, portre, etkinlik fotoğrafçılığı.', 'Profesyonel', 76,
         'KKTC düğün fotoğrafçısı, Kıbrıs dış çekim fiyatları, Lefkoşa ürün fotoğrafçılığı, Girne doğum fotoğrafçısı'),
        ('Düğün Organizasyonu', '💒', 'Düğün, nişan organizasyonu ve dekorasyon.', 'Profesyonel', 77,
         'KKTC düğün fotoğrafçısı, Kıbrıs dış çekim mekanları, organizasyon şirketleri Lefkoşa, nişan organizasyon Kıbrıs'),
        ('İç Mimar', '🏛️', 'İç mekan tasarımı, dekorasyon ve 3D görselleştirme.', 'Profesyonel', 78,
         'KKTC mimarlık ofisleri, Kıbrıs iç mimari tasarım, villa projesi çizimi Lefkoşa, Girne dekorasyon danışmanlığı'),
        ('Mimar', '📐', 'Mimari proje, ruhsat işlemleri.', 'Profesyonel', 79,
         'KKTC mimarlık ofisleri, Kıbrıs iç mimari tasarım, villa projesi çizimi Lefkoşa, Girne dekorasyon danışmanlığı'),
        ('Catering & Yemek', '🍽️', 'Organizasyon yemek, catering hizmeti.', 'Profesyonel', 80,
         'KKTC catering şirketleri, Kıbrıs toplu yemek hizmeti, Lefkoşa düğün yemeği, evlere paket yemek Kıbrıs'),
        ('Terzi & Dikiş', '🧵', 'Elbise dikimi, tadilat ve onarımı.', 'Profesyonel', 81,
         'Lefkoşa terzi, KKTC elbise tadilatı, Kıbrıs özel dikim abiye, Girne pantolon paçası yapımı'),
        ('Veteriner (Evde)', '🐾', 'Evde veteriner muayene ve tedavi.', 'Profesyonel', 82,
         'KKTC veteriner kliniği, 7/24 nöbetçi veteriner Kıbrıs, Lefkoşa pet shop, Girne köpek oteli'),
        ('Evcil Hayvan Bakımı', '🐶', 'Pet otel, tımar ve bakım hizmetleri.', 'Profesyonel', 83,
         'KKTC veteriner kliniği, 7/24 nöbetçi veteriner Kıbrıs, Lefkoşa pet shop, Girne köpek oteli'),
    ]

    for ad, ikon, aciklama, grup, sira, seo_keywords in kategoriler_data:
        k = Kategori.query.filter_by(ad=ad).first()
        if k:
            k.seo_keywords = seo_keywords  # Mevcut kaydı güncelle
        else:
            db.session.add(Kategori(ad=ad, ikon=ikon, aciklama=aciklama, grup=grup, sira=sira, seo_keywords=seo_keywords))

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
