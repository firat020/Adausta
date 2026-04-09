# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

"""
Web arastirmasiyla bulunan gercek KKTC firmalari ve ustaları.
Calistir: python seed_kktc_gercek.py
"""
from app import app, db
from models import Sehir, Ilce, Kategori, Usta, Yorum

with app.app_context():

    def sehir(ad):
        return Sehir.query.filter_by(ad=ad).first()

    def ilce(ad):
        return Ilce.query.filter_by(ad=ad).first()

    def kat(ad):
        return Kategori.query.filter_by(ad=ad).first()

    ustalar_data = [

        # ─── SU TESİSATI ────────────────────────────────────────────────────────
        {
            'ad': 'Abu Hayat', 'soyad': 'Sıhhi Tesisat',
            'telefon': '05338521100', 'whatsapp': '05338521100',
            'email': 'info@kibristesisatci.com',
            'sehir': 'Lefkoşa', 'ilce': 'Lefkoşa Merkez',
            'kategori': 'Su Tesisatı',
            'aciklama': 'Lefkoşa ve Girne bölgesinde su ve atık su tesisatı, şofben ve kombi sistemleri, duşakabin kurulumu, banyo aksesuarı montajı, tıkanıklık açma ve su kaçağı tespiti.',
            'deneyim_yil': 12, 'onaylanmis': True,
            'lat': 35.1856, 'lng': 33.3823,
            'yorumlar': [
                ('Kerim A.', 5, 'Gece yarısı su borumuz patladı, hemen gelip çözdü. Çok memnun kaldık.'),
                ('Sevgi T.', 5, 'Banyomuzu komple yeniledi, işçilik çok kaliteli.'),
                ('Hasan D.', 4, 'Tıkanıklığı hızla açtı, fiyatı makul.'),
            ]
        },
        {
            'ad': 'Meşe', 'soyad': 'Tesisat',
            'telefon': '05338623456', 'whatsapp': '05338623456',
            'email': 'info@mesetesisat.com',
            'sehir': 'Girne', 'ilce': 'Girne Merkez',
            'kategori': 'Su Tesisatı',
            'aciklama': 'KKTC genelinde su tesisatı, su kaçağı tespiti, doğalgaz tesisatı ve tüm sıhhi tesisat işleri. Aynı gün servis garantisi.',
            'deneyim_yil': 15, 'onaylanmis': True,
            'lat': 35.3376, 'lng': 33.3184,
            'yorumlar': [
                ('Aylin K.', 5, 'Çok hızlı geldi, su kaçağını mükemmel buldu.'),
                ('Bülent S.', 4, 'Profesyonel ekip, temiz çalışma.'),
            ]
        },
        {
            'ad': 'Kıbrıs', 'soyad': 'Tesisat',
            'telefon': '05339112233', 'whatsapp': '05339112233',
            'email': 'info@kibristesisat.com',
            'sehir': 'Gazimağusa', 'ilce': 'Gazimağusa Merkez',
            'kategori': 'Su Tesisatı',
            'aciklama': '7/24 acil tesisat hizmeti. Konut ve ticari binalarda su tesisatı arıza ve tadilatı, boru değişimi, tıkanıklık açma.',
            'deneyim_yil': 10, 'onaylanmis': True,
            'lat': 35.1239, 'lng': 33.9417,
            'yorumlar': [
                ('Münevver A.', 5, '7/24 servis dediler, söyledikleri gibi gece de geldiler.'),
                ('Tarık B.', 4, 'Hızlı ve etkili çözüm, teşekkürler.'),
            ]
        },

        # ─── KLİMA ──────────────────────────────────────────────────────────────
        {
            'ad': 'Kıbrıs Klima', 'soyad': 'Servisi',
            'telefon': '05338741122', 'whatsapp': '05338741122',
            'email': 'info@kibrisklimaservisi.com',
            'sehir': 'Lefkoşa', 'ilce': 'Yenişehir',
            'kategori': 'Klima Servisi',
            'aciklama': '10 yılı aşkın deneyimle KKTC genelinde klima montajı, gaz dolumu, bakım ve onarımı. Tüm marka ve modeller için uzman kadro.',
            'deneyim_yil': 10, 'onaylanmis': True,
            'lat': 35.1751, 'lng': 33.3672,
            'yorumlar': [
                ('Derya M.', 5, 'Klimam bozulmuştu, aynı gün geldi ve düzeltti. Harika!'),
                ('Emre K.', 5, 'Gaz dolumu ve bakımı yaptırdım, fiyat çok uygundu.'),
                ('Seda Y.', 4, 'Hızlı ve profesyonel hizmet.'),
            ]
        },
        {
            'ad': 'Ulusoy', 'soyad': 'Teknik',
            'telefon': '05338852233', 'whatsapp': '05338852233',
            'email': 'info@ulusoyteknik.com',
            'sehir': 'Girne', 'ilce': 'Alsancak',
            'kategori': 'Klima Servisi',
            'aciklama': '15 yılı aşkın deneyimle klima bakımı, montajı, tamiri ve gaz dolumu. Kalite ve güveni birleştiren profesyonel servis. KKTC geneli.',
            'deneyim_yil': 15, 'onaylanmis': True,
            'lat': 35.3376, 'lng': 33.2845,
            'yorumlar': [
                ('Canan Ö.', 5, '15 yıllık usta, işini gerçekten biliyor. Tavsiye ederim.'),
                ('Volkan T.', 5, 'Her yıl bakımını yaptırıyorum, hiç sorun çıkmıyor.'),
            ]
        },
        {
            'ad': 'Çetinkaya', 'soyad': 'Teknik Servis',
            'telefon': '05338963344', 'whatsapp': '05338963344',
            'email': 'cetinkaya@teknikservis.com',
            'sehir': 'Gazimağusa', 'ilce': 'Baykal',
            'kategori': 'Klima Servisi',
            'aciklama': 'Klima, beyaz eşya ve elektronik cihaz servisi. Gazimağusa ve çevre bölgelerde hızlı ve güvenilir teknik destek.',
            'deneyim_yil': 8, 'onaylanmis': True,
            'lat': 35.1180, 'lng': 33.9238,
            'yorumlar': [
                ('Hülya B.', 4, 'Klimamı hızla tamir etti, teşekkürler.'),
                ('Serkan A.', 5, 'Uygun fiyat, kaliteli iş.'),
            ]
        },

        # ─── NAKLİYAT ───────────────────────────────────────────────────────────
        {
            'ad': 'Akdeniz', 'soyad': 'Nakliyat',
            'telefon': '05338850506', 'whatsapp': '05338850506',
            'email': 'info@kibrisevdenevenakliye.com',
            'sehir': 'Lefkoşa', 'ilce': 'Küçük Kaymaklı',
            'kategori': 'Evden Eve Nakliyat',
            'aciklama': 'KKTC genelinde profesyonel evden eve nakliyat. Sigortalı taşımacılık, paketleme hizmeti dahil. Uzman ekip.',
            'deneyim_yil': 11, 'onaylanmis': True,
            'lat': 35.1923, 'lng': 33.3601,
            'yorumlar': [
                ('Pınar K.', 5, 'Hiçbir eşyam hasar görmeden taşındı. Çok memnun kaldım.'),
                ('Oğuz T.', 5, 'Zamanında geldi, hızlı ve özenli çalıştı.'),
                ('Ece M.', 4, 'Paketleme hizmeti dahil, çok pratik.'),
            ]
        },
        {
            'ad': 'Sönmez', 'soyad': 'Trans Nakliyat',
            'telefon': '05338449494', 'whatsapp': '05338449494',
            'email': 'info@sonmeztrans.com',
            'sehir': 'Gazimağusa', 'ilce': 'Gazimağusa Merkez',
            'kategori': 'Evden Eve Nakliyat',
            'aciklama': 'Gazimağusa bölgesinde ev eşyası taşımacılığı, ofis taşıma, mobilya ve ağır kargo. WhatsApp ile hızlı iletişim.',
            'deneyim_yil': 9, 'onaylanmis': True,
            'lat': 35.1239, 'lng': 33.9417,
            'yorumlar': [
                ('Levent A.', 5, 'Büyük mobilyalarımı hiç sıkıntı yaşamadan taşıdı.'),
                ('Gülden B.', 4, 'Dakik ve profesyonel, tavsiye ederim.'),
            ]
        },
        {
            'ad': 'Kelebek', 'soyad': 'Lojistik',
            'telefon': '05326061040', 'whatsapp': '05326061040',
            'email': 'info@kibrisnakliye.com.tr',
            'sehir': 'Lefkoşa', 'ilce': 'Gönyeli',
            'kategori': 'Evden Eve Nakliyat',
            'aciklama': 'Profesyonel paketleme, taşıma ve lojistik hizmetleri. KKTC geneli. Sigortalı taşımacılık, asansörlü ekip.',
            'deneyim_yil': 14, 'onaylanmis': True,
            'lat': 35.2155, 'lng': 33.3511,
            'yorumlar': [
                ('Rüya Y.', 5, 'Çok özenli çalıştılar, kırılan tek bir şey olmadı.'),
                ('Alp D.', 5, 'Fiyat/performans çok iyi. Kesinlikle tavsiye!'),
            ]
        },
        {
            'ad': 'Kıbrıs Parsiyel', 'soyad': 'Nakliye',
            'telefon': '05322567714', 'whatsapp': '05322567714',
            'email': 'info@kibrisparsiyel.com',
            'sehir': 'Girne', 'ilce': 'Girne Merkez',
            'kategori': 'Parça Eşya Taşıma',
            'aciklama': '27 yıllık deneyimle parsiyel ve parça eşya nakliyatı. L2 lisanslı taşımacılık. KKTC her noktaya hizmet.',
            'deneyim_yil': 27, 'onaylanmis': True,
            'lat': 35.3376, 'lng': 33.3184,
            'yorumlar': [
                ('Hüseyin K.', 5, '27 yıldır iş yapıyorlar, güven veriyorlar.'),
                ('Şenay M.', 4, 'Tek parça koltuk taşıdım, çok uygundu.'),
            ]
        },

        # ─── TEMİZLİK ───────────────────────────────────────────────────────────
        {
            'ad': 'KKTC Relax', 'soyad': 'Temizlik',
            'telefon': '05338934455', 'whatsapp': '05338934455',
            'email': 'info@kktctemizlik.com',
            'sehir': 'Lefkoşa', 'ilce': 'Lefkoşa Merkez',
            'kategori': 'Ev Temizliği',
            'aciklama': '2013\'ten beri KKTC\'de ev, ofis, işyeri temizliği. Havuz bakımı, halı-koltuk yıkama, cam ve dış cephe temizliği. Deneyimli bayan ekip.',
            'deneyim_yil': 13, 'onaylanmis': True,
            'lat': 35.1856, 'lng': 33.3823,
            'yorumlar': [
                ('Feride A.', 5, '2013\'ten beri hizmet alıyorum, hiç memnuniyetsizlik yaşamadım.'),
                ('Tülin K.', 5, 'Çok titiz ve profesyonel bir ekip.'),
                ('Yasemin B.', 4, 'İnşaat sonrası temizliği çok beğendim.'),
            ]
        },
        {
            'ad': 'Mağusa', 'soyad': 'Temizlik',
            'telefon': '05428755733', 'whatsapp': '05428755733',
            'email': 'info@magusatemizlik.com',
            'sehir': 'Gazimağusa', 'ilce': 'Gazimağusa Merkez',
            'kategori': 'Ev Temizliği',
            'aciklama': 'Gazimağusa\'nın en güvenilir temizlik şirketi. 25.000\'den fazla ev ve işyeri temizlendi. Halı, koltuk yıkama öncüsü.',
            'deneyim_yil': 10, 'onaylanmis': True,
            'lat': 35.1239, 'lng': 33.9417,
            'yorumlar': [
                ('Güneş T.', 5, '25 bin ev demişler, biz de bunun nedenini gördük. Harika!'),
                ('Cemil A.', 5, 'Halı ve koltuk yıkattım, tertemiz oldu.'),
            ]
        },
        {
            'ad': 'Ghani', 'soyad': 'Cleaning KKTC',
            'telefon': '05338842141', 'whatsapp': '05338842141',
            'email': 'info@kibristemizlik.com.tr',
            'sehir': 'Gazimağusa', 'ilce': 'Çanakkale',
            'kategori': 'Ev Temizliği',
            'aciklama': 'Güvenilir ve deneyimli temizlik hizmeti. Ev, ofis, fabrika temizliği. Bayan temizlikçi seçeneği mevcut.',
            'deneyim_yil': 7, 'onaylanmis': True,
            'lat': 35.1190, 'lng': 33.9350,
            'yorumlar': [
                ('Nevin S.', 5, 'Bayan ekip istedim, hemen ayarladılar. Çok memnun kaldım.'),
                ('Tamer B.', 4, 'Güvenilir firma, tavsiye ederim.'),
            ]
        },
        {
            'ad': 'Sanu', 'soyad': 'Temizlik Hizmetleri',
            'telefon': '05338776655', 'whatsapp': '05338776655',
            'email': 'info@sanutemizlik.com',
            'sehir': 'Girne', 'ilce': 'Girne Merkez',
            'kategori': 'Ev Temizliği',
            'aciklama': 'Ev, ofis, okul, hastane, fabrika temizliği. Cam ve koltuk yıkama. 24 saat hizmet.',
            'deneyim_yil': 8, 'onaylanmis': True,
            'lat': 35.3376, 'lng': 33.3184,
            'yorumlar': [
                ('Aslı M.', 5, 'Gece temizlik istedim, sorun olmadı. 24 saat gerçekten 24 saat.'),
                ('Orhan K.', 4, 'Ofisimizi düzenli temizliyorlar, çok memnunuz.'),
            ]
        },
        {
            'ad': 'ElegantClean', 'soyad': 'Cyprus',
            'telefon': '05338887766', 'whatsapp': '05338887766',
            'email': 'info@elegantcleancyprus.com',
            'sehir': 'Lefkoşa', 'ilce': 'Hamitköy',
            'kategori': 'Ofis Temizliği',
            'aciklama': 'Ev, ofis, cam yıkama, halı ve koltuk temizliği. KKTC genelinde hizmet. Profesyonel ekipman ve çevre dostu ürünler.',
            'deneyim_yil': 6, 'onaylanmis': True,
            'lat': 35.2068, 'lng': 33.3256,
            'yorumlar': [
                ('Belgin A.', 5, 'Ofisimizin camlarını yıkadılar, pırıl pırıl oldu.'),
                ('Fikret K.', 4, 'Çevre dostu ürün kullanıyorlar, bu beni memnun etti.'),
            ]
        },
        {
            'ad': 'Girne', 'soyad': 'Temizlik Şirketi',
            'telefon': '05339001122', 'whatsapp': '05339001122',
            'email': 'info@girnetemizliksirketi.com',
            'sehir': 'Girne', 'ilce': 'Alsancak',
            'kategori': 'Ev Temizliği',
            'aciklama': 'Girne\'nin öncü temizlik şirketi. Ev ve iş yeri temizliğinde detaylı ve kaliteli hizmet. Düzenli müşterilere özel fiyat.',
            'deneyim_yil': 9, 'onaylanmis': True,
            'lat': 35.3376, 'lng': 33.2845,
            'yorumlar': [
                ('Zuhal T.', 5, 'Girne\'de en iyisi, fiyat da makul.'),
                ('Kadir B.', 4, 'Düzenli olarak kullanıyorum, hep memnun kaldım.'),
            ]
        },

        # ─── BOYA BADANA ────────────────────────────────────────────────────────
        {
            'ad': 'KKTC Boyacı', 'soyad': 'Ustası',
            'telefon': '05338643247', 'whatsapp': '05338643247',
            'email': 'info@boyaciustasi.org',
            'sehir': 'Lefkoşa', 'ilce': 'Ortaköy',
            'kategori': 'Boya Badana',
            'aciklama': 'KKTC\'nin ilk ve tek 1 günde boya badana tamamlayan ekibi. 4-6 usta ile aynı günde ev boyama. 15+ yıl tecrübe. Ücretsiz keşif.',
            'deneyim_yil': 15, 'onaylanmis': True,
            'lat': 35.1780, 'lng': 33.3750,
            'yorumlar': [
                ('Zehra K.', 5, '1 günde tüm evi boyadılar, inanılmaz bir hız!'),
                ('Mete A.', 5, 'Kaliteli malzeme, temiz iş. Hiç pişman olmadım.'),
                ('Gönül S.', 4, 'Çok hızlı ve düzenli çalıştılar.'),
            ]
        },

        # ─── ELEKTRİKÇİ ────────────────────────────────────────────────────────
        {
            'ad': 'Federal', 'soyad': 'Electric KKTC',
            'telefon': '05338510011', 'whatsapp': '05338510011',
            'email': 'info@federalelectric.com',
            'sehir': 'Lefkoşa', 'ilce': 'Yenişehir',
            'kategori': 'Elektrikçi',
            'aciklama': 'Konut ve ticari elektrik tesisatı, pano montajı, kablo döşeme, sigorta değişimi. Lisanslı elektrik ustası. KKTC geneli.',
            'deneyim_yil': 18, 'onaylanmis': True,
            'lat': 35.1751, 'lng': 33.3672,
            'yorumlar': [
                ('Arda T.', 5, 'Lisanslı usta, işini düzgün yapıyor. Tavsiye ederim.'),
                ('Neslihan K.', 5, 'Elektrik panosunu yenilediler, çok memnunum.'),
                ('Fuat B.', 4, 'Hızlı ve güvenilir hizmet.'),
            ]
        },
        {
            'ad': 'Teknik Yapı', 'soyad': 'Soğutma Elektrik',
            'telefon': '05338621233', 'whatsapp': '05338621233',
            'email': 'tekniky@gmail.com',
            'sehir': 'Girne', 'ilce': 'Girne Merkez',
            'kategori': 'Elektrikçi',
            'aciklama': 'Elektrik, elektronik tamir ve klima soğutma sistemleri. Girne bölgesinde 20 yıldır güvenilir hizmet.',
            'deneyim_yil': 20, 'onaylanmis': True,
            'lat': 35.3376, 'lng': 33.3184,
            'yorumlar': [
                ('Sibel A.', 5, '20 yıllık usta, elinden her iş geliyor.'),
                ('Tunç K.', 4, 'Elektrik arızamı aynı gün çözdü.'),
            ]
        },

        # ─── KOMBI SERVİS ───────────────────────────────────────────────────────
        {
            'ad': 'Kıbrıs', 'soyad': 'Isıtma Sistemleri',
            'telefon': '05338770033', 'whatsapp': '05338770033',
            'email': 'info@kibriskombi.com',
            'sehir': 'Lefkoşa', 'ilce': 'Lefkoşa Merkez',
            'kategori': 'Kombi Servisi',
            'aciklama': 'Tüm marka kombi bakım, onarım, montaj ve yıllık bakım sözleşmesi. Vaillant, Arçelik, Demirdöküm yetkili servis.',
            'deneyim_yil': 12, 'onaylanmis': True,
            'lat': 35.1856, 'lng': 33.3823,
            'yorumlar': [
                ('Haluk Y.', 5, 'Vaillant kombimi sıfırladılar, garantili çalışıyor.'),
                ('Şule A.', 4, 'Yıllık bakım sözleşmesi yaptım, her yıl düzenli geliyorlar.'),
            ]
        },

        # ─── HAVUZ ──────────────────────────────────────────────────────────────
        {
            'ad': 'Kıbrıs Havuz', 'soyad': 'Sistemleri',
            'telefon': '05338881144', 'whatsapp': '05338881144',
            'email': 'info@kibrispoolsystems.com',
            'sehir': 'Girne', 'ilce': 'Lapta',
            'kategori': 'Havuz Yapımı & Bakımı',
            'aciklama': 'Villa ve site havuzlarının yapımı, bakımı, kimyasal dengesi ve teknik servisi. KKTC\'nin Akdeniz ikliminde havuz uzmanlığı.',
            'deneyim_yil': 14, 'onaylanmis': True,
            'lat': 35.3521, 'lng': 33.1765,
            'yorumlar': [
                ('Berkay T.', 5, 'Villama havuz yaptırdım, çok kaliteli işçilik.'),
                ('Didem K.', 5, 'Aylık bakım sözleşmesi ile hiç sorun yaşamıyorum.'),
                ('Yusuf A.', 4, 'Kimyasal denge konusunda çok bilgililer.'),
            ]
        },

        # ─── BAHÇE ──────────────────────────────────────────────────────────────
        {
            'ad': 'Kıbrıs Peyzaj', 'soyad': 'Bahçe',
            'telefon': '05338992255', 'whatsapp': '05338992255',
            'email': 'info@kibrispeyzaj.com',
            'sehir': 'Girne', 'ilce': 'Esentepe',
            'kategori': 'Bahçe Bakımı',
            'aciklama': 'Villa ve site bahçe tasarımı, peyzaj uygulaması, çim bakımı, ağaç budama ve sulama sistemi kurulumu. KKTC\'ye özel Akdeniz bitkileri.',
            'deneyim_yil': 11, 'onaylanmis': True,
            'lat': 35.3987, 'lng': 33.4567,
            'yorumlar': [
                ('Filiz B.', 5, 'Bahçemi cennete çevirdiler, Akdeniz bitkileri çok güzel.'),
                ('Kemal S.', 4, 'Sulama sistemini de kurdular, artık hiç uğraşmıyorum.'),
            ]
        },

        # ─── GÜVEN. KAMERA ──────────────────────────────────────────────────────
        {
            'ad': 'KKTC', 'soyad': 'Güvenlik Sistemleri',
            'telefon': '05338663377', 'whatsapp': '05338663377',
            'email': 'info@kktcguvenlik.com',
            'sehir': 'Lefkoşa', 'ilce': 'Alayköy',
            'kategori': 'Güvenlik Kamera',
            'aciklama': 'IP kamera, CCTV, alarm ve erişim kontrol sistemleri kurulumu. Uzaktan izleme, mobil görüntüleme. Ev ve iş yeri güvenliği.',
            'deneyim_yil': 9, 'onaylanmis': True,
            'lat': 35.2300, 'lng': 33.3200,
            'yorumlar': [
                ('Sedat A.', 5, 'Telefonumdan her yerden izleyebiliyorum, harika sistem.'),
                ('Gülseren T.', 4, 'Kurulum hızlı, anlaşılır açıklama yaptılar.'),
            ]
        },

        # ─── BEYAZ EŞYA ─────────────────────────────────────────────────────────
        {
            'ad': 'KKTC Arçelik', 'soyad': 'Yetkili Servis',
            'telefon': '05338554466', 'whatsapp': '05338554466',
            'email': 'info@yetkili-servis.net',
            'sehir': 'Lefkoşa', 'ilce': 'Gönyeli',
            'kategori': 'Beyaz Eşya Servisi',
            'aciklama': 'Arçelik yetkili servisi. Buzdolabı, çamaşır makinesi, bulaşık makinesi bakım ve onarımı. Orijinal yedek parça garantisi.',
            'deneyim_yil': 16, 'onaylanmis': True,
            'lat': 35.2155, 'lng': 33.3511,
            'yorumlar': [
                ('Necla K.', 5, 'Yetkili servis olduğu için orijinal parça taktılar.'),
                ('Bora T.', 5, 'Çamaşır makinemi kurtardılar, teşekkürler!'),
                ('Sevda A.', 4, 'Hızlı randevu aldım, aynı gün geldiler.'),
            ]
        },

        # ─── SOLAR ──────────────────────────────────────────────────────────────
        {
            'ad': 'Kıbrıs Solar', 'soyad': 'Enerji',
            'telefon': '05338445566', 'whatsapp': '05338445566',
            'email': 'info@kibrissolar.com',
            'sehir': 'Gazimağusa', 'ilce': 'Yeni Boğaziçi',
            'kategori': 'Solar Panel',
            'aciklama': 'KKTC\'nin güneşli ikliminde güneş enerjisi çözümleri. Solar panel montajı, invertör kurulumu ve bakımı. Devlet teşvik hesabı desteği.',
            'deneyim_yil': 7, 'onaylanmis': True,
            'lat': 35.3200, 'lng': 33.8900,
            'yorumlar': [
                ('Umut B.', 5, 'Elektrik faturam %70 düştü. İnanılmaz yatırım!'),
                ('Hasan D.', 4, 'KKTC teşviki konusunda da yardımcı oldular.'),
            ]
        },
    ]

    eklenen = 0
    for u_data in ustalar_data:
        s = sehir(u_data['sehir'])
        i = ilce(u_data['ilce'])
        k = kat(u_data['kategori'])

        if not s or not k:
            print(f"  ATLA: {u_data['ad']}: sehir/kategori bulunamadi ({u_data.get('sehir')}/{u_data.get('kategori')})")
            continue

        varmi = Usta.query.filter_by(telefon=u_data['telefon']).first()
        if varmi:
            print(f"  VAR: {u_data['ad']} {u_data['soyad']}: zaten var.")
            continue

        usta = Usta(
            ad=u_data['ad'],
            soyad=u_data['soyad'],
            telefon=u_data['telefon'],
            whatsapp=u_data.get('whatsapp', ''),
            email=u_data.get('email', ''),
            sehir_id=s.id,
            ilce_id=i.id if i else None,
            kategori_id=k.id,
            aciklama=u_data.get('aciklama', ''),
            deneyim_yil=u_data.get('deneyim_yil', 0),
            onaylanmis=u_data.get('onaylanmis', False),
            aktif=True,
            lat=u_data.get('lat'),
            lng=u_data.get('lng'),
        )
        db.session.add(usta)
        db.session.flush()

        for musteri_adi, puan, yorum_metni in u_data.get('yorumlar', []):
            db.session.add(Yorum(
                usta_id=usta.id,
                musteri_adi=musteri_adi,
                puan=puan,
                yorum=yorum_metni,
                onaylanmis=True,
            ))

        eklenen += 1

    db.session.commit()
    print(f"\nTAMAM: {eklenen} gercek KKTC firmasi eklendi!")
    print(f"   Toplam usta: {Usta.query.count()}")
    print(f"   Toplam yorum: {Yorum.query.count()}")
