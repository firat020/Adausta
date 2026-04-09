"""
Test ustalarını veritabanına ekler.
Çalıştır: python seed_ustalar.py
"""
from app import app, db
from models import Kullanici, Sehir, Ilce, Kategori, Usta, Yorum

with app.app_context():

    def sehir(ad):
        return Sehir.query.filter_by(ad=ad).first()

    def ilce(ad):
        return Ilce.query.filter_by(ad=ad).first()

    def kat(ad):
        return Kategori.query.filter_by(ad=ad).first()

    # ─── TEST USTALAR ───────────────────────────────────────────────────────────
    ustalar_data = [
        {
            'ad': 'Ahmet', 'soyad': 'Yılmaz',
            'telefon': '05338001111', 'whatsapp': '05338001111',
            'email': 'ahmet@mail.com',
            'sehir': 'Lefkoşa', 'ilce': 'Gönyeli',
            'kategori': 'Elektrikçi',
            'aciklama': '20 yıllık tecrübeyle konut ve ticari elektrik tesisatı, sigorta panosu, kablo çekimi işleri.',
            'deneyim_yil': 20, 'onaylanmis': True,
            'lat': 35.2155, 'lng': 33.3511,
            'yorumlar': [
                ('Kemal B.', 5, 'Çok hızlı geldi, fiyatı da makuldü. Kesinlikle tavsiye ederim.'),
                ('Fatma A.', 5, 'Sigortam attı, 1 saatte gelip düzeltti. Çok teşekkürler!'),
                ('Serhan D.', 4, 'İşini iyi yapıyor, dakik bir usta.'),
            ]
        },
        {
            'ad': 'Mustafa', 'soyad': 'Kaya',
            'telefon': '05338002222', 'whatsapp': '05338002222',
            'email': 'mustafa@mail.com',
            'sehir': 'Girne', 'ilce': 'Alsancak',
            'kategori': 'Su Tesisatı',
            'aciklama': 'Tıkanıklık açma, su kaçağı tespiti, boru değişimi. 7/24 acil servis.',
            'deneyim_yil': 15, 'onaylanmis': True,
            'lat': 35.3376, 'lng': 33.2845,
            'yorumlar': [
                ('Ayşe M.', 5, 'Gece yarısı su borumuz patladı, hemen geldi. Çok memnun kaldık.'),
                ('Tuncay K.', 4, 'Hızlı ve işinin ehli. Fiyatı da uygundu.'),
            ]
        },
        {
            'ad': 'Hüseyin', 'soyad': 'Demir',
            'telefon': '05338003333', 'whatsapp': '05338003333',
            'email': 'huseyin@mail.com',
            'sehir': 'Gazimağusa', 'ilce': 'Gazimağusa Merkez',
            'kategori': 'Boya Badana',
            'aciklama': 'İç ve dış cephe boya, dekoratif boya, alçı boyası. Kaliteli malzeme garantisi.',
            'deneyim_yil': 12, 'onaylanmis': True,
            'lat': 35.1239, 'lng': 33.9417,
            'yorumlar': [
                ('Nilüfer T.', 5, 'Evi harika boyadı, çok temiz çalıştı. Tavsiye ederim.'),
                ('Mehmet C.', 5, 'Salonumuzu muhteşem yaptı. Elleri dert görmesin.'),
                ('Zeynep A.', 4, 'Zamanında başladı, söz verdiği günde bitirdi.'),
            ]
        },
        {
            'ad': 'İbrahim', 'soyad': 'Şahin',
            'telefon': '05338004444', 'whatsapp': '05338004444',
            'email': 'ibrahim@mail.com',
            'sehir': 'Lefkoşa', 'ilce': 'Lefkoşa Merkez',
            'kategori': 'Klima Servisi',
            'aciklama': 'Tüm marka klima montajı, bakımı ve gaz dolumu. Garantili servis.',
            'deneyim_yil': 10, 'onaylanmis': True,
            'lat': 35.1856, 'lng': 33.3823,
            'yorumlar': [
                ('Selin K.', 5, 'Klimam çalışmıyordu, aynı gün gelip düzeltti. Harika!'),
                ('Burak Y.', 4, 'Profesyonel ve hızlı hizmet. Memnun kaldım.'),
            ]
        },
        {
            'ad': 'Osman', 'soyad': 'Çelik',
            'telefon': '05338005555', 'whatsapp': '05338005555',
            'email': 'osman@mail.com',
            'sehir': 'Girne', 'ilce': 'Lapta',
            'kategori': 'Anahtar Teslim Tadilat',
            'aciklama': 'Komple daire ve villa tadilat. Proje yönetimi, malzeme temini, uygulama bir arada.',
            'deneyim_yil': 18, 'onaylanmis': True,
            'lat': 35.3521, 'lng': 33.1765,
            'yorumlar': [
                ('Hande B.', 5, 'Dairemizi komple yeniledi. Sonuç muhteşem, çok teşekkürler.'),
                ('Caner Ö.', 5, 'Zamanında teslim etti, bütçemizi aşmadı. Kesinlikle tavsiye!'),
            ]
        },
        {
            'ad': 'Recep', 'soyad': 'Arslan',
            'telefon': '05338006666', 'whatsapp': '05338006666',
            'email': 'recep@mail.com',
            'sehir': 'Güzelyurt', 'ilce': 'Güzelyurt Merkez',
            'kategori': 'Fayans & Seramik',
            'aciklama': 'Banyo, mutfak, zemin seramik ve fayans döşeme. İtalyan tekniği aplikasyon.',
            'deneyim_yil': 14, 'onaylanmis': True,
            'lat': 35.1997, 'lng': 32.9871,
            'yorumlar': [
                ('Dilek S.', 5, 'Banyomuzu çok güzel seramik döşedi. Pişman olmadık.'),
            ]
        },
        {
            'ad': 'Ercan', 'soyad': 'Kurt',
            'telefon': '05338007777', 'whatsapp': '05338007777',
            'email': 'ercan@mail.com',
            'sehir': 'Lefkoşa', 'ilce': 'Yenişehir',
            'kategori': 'Evden Eve Nakliyat',
            'aciklama': 'Sigortalı, asansörlü profesyonel taşımacılık. KKTC geneli. Paketleme dahil.',
            'deneyim_yil': 8, 'onaylanmis': True,
            'lat': 35.1751, 'lng': 33.3672,
            'yorumlar': [
                ('Leyla D.', 5, 'Hiçbir eşyamız hasar görmeden taşındı. Çok profesyonel.'),
                ('Uğur M.', 4, 'Dakik, hızlı ve özzenli. Kesinlikle tavsiye ederim.'),
                ('Pınar A.', 5, 'Harika hizmet, fiyat da çok uygundu!'),
            ]
        },
        {
            'ad': 'Salih', 'soyad': 'Özdemir',
            'telefon': '05338008888', 'whatsapp': '05338008888',
            'email': 'salih@mail.com',
            'sehir': 'Gazimağusa', 'ilce': 'Baykal',
            'kategori': 'Güvenlik Kamera',
            'aciklama': 'Ev ve iş yeri için IP kamera, CCTV sistemleri. Uzaktan izleme kurulumu.',
            'deneyim_yil': 7, 'onaylanmis': True,
            'lat': 35.1180, 'lng': 33.9238,
            'yorumlar': [
                ('Ali T.', 5, 'Dükkânıma 8 kamera kurdu, sistemi mükemmel çalışıyor.'),
                ('Berna K.', 4, 'Hızlı kurulum, açıklayıcı anlatım. Teşekkürler.'),
            ]
        },
        {
            'ad': 'Tolga', 'soyad': 'Aydın',
            'telefon': '05338009999', 'whatsapp': '05338009999',
            'email': 'tolga@mail.com',
            'sehir': 'Girne', 'ilce': 'Karaoğlanoğlu',
            'kategori': 'Marangoz',
            'aciklama': 'Özel tasarım mobilya, mutfak dolabı, kitaplık. El işçiliği kalitesi.',
            'deneyim_yil': 22, 'onaylanmis': True,
            'lat': 35.3298, 'lng': 33.2667,
            'yorumlar': [
                ('Filiz Y.', 5, 'Hayalimdeki mutfak dolabını yaptı. Çok teşekkürler!'),
                ('Koray B.', 5, 'Eşsiz işçilik, zamanında teslim. Kesinlikle tavsiye!'),
                ('Sema A.', 4, 'Kaliteli malzeme kullandı, çok memnun kaldık.'),
            ]
        },
        {
            'ad': 'Barış', 'soyad': 'Güven',
            'telefon': '05338010000', 'whatsapp': '05338010000',
            'email': 'baris@mail.com',
            'sehir': 'İskele', 'ilce': 'İskele Merkez',
            'kategori': 'Bahçe Bakımı',
            'aciklama': 'Peyzaj tasarımı, çim biçme, ağaç budama, sulama sistemi kurulumu.',
            'deneyim_yil': 9, 'onaylanmis': True,
            'lat': 35.2891, 'lng': 33.8942,
            'yorumlar': [
                ('Gülsüm A.', 5, 'Bahçemizi tamamen değiştirdi, rüya gibi oldu!'),
            ]
        },
        {
            'ad': 'Murat', 'soyad': 'Polat',
            'telefon': '05338011111', 'whatsapp': '05338011111',
            'email': 'murat@mail.com',
            'sehir': 'Lefkoşa', 'ilce': 'Hamitköy',
            'kategori': 'Kombi Servisi',
            'aciklama': 'Tüm marka kombi bakım, onarım ve montaj. Yedek parça garantisi. Yıllık bakım sözleşmesi.',
            'deneyim_yil': 11, 'onaylanmis': True,
            'lat': 35.2068, 'lng': 33.3256,
            'yorumlar': [
                ('Cem K.', 5, 'Kombim çalışmıyordu, 2 saatte gelip düzeltti. Süper!'),
                ('Yıldız T.', 4, 'Yıllık bakım yaptı, her şeyi anlattı. Memnunum.'),
            ]
        },
        {
            'ad': 'Volkan', 'soyad': 'Erdoğan',
            'telefon': '05338012222', 'whatsapp': '05338012222',
            'email': 'volkan@mail.com',
            'sehir': 'Girne', 'ilce': 'Çatalköy',
            'kategori': 'Beyaz Eşya Servisi',
            'aciklama': 'Buzdolabı, çamaşır makinesi, bulaşık makinesi tamir ve bakımı. Tüm markalar.',
            'deneyim_yil': 13, 'onaylanmis': True,
            'lat': 35.3687, 'lng': 33.3124,
            'yorumlar': [
                ('Nihal B.', 5, 'Çamaşır makinemi kurtardı! Çok tecrübeli bir usta.'),
                ('Tarkan Y.', 4, 'Hızlı teşhis koydu, uygun fiyatla çözdü.'),
                ('Gönül A.', 5, 'Buzdolabım çalışmıyordu, aynı gün gelip düzeltti.'),
            ]
        },
    ]

    eklenen = 0
    for u_data in ustalar_data:
        s = sehir(u_data['sehir'])
        i = ilce(u_data['ilce'])
        k = kat(u_data['kategori'])
        if not s or not k:
            print(f"  ⚠️  {u_data['ad']}: şehir/kategori bulunamadı, atlandı.")
            continue

        varmi = Usta.query.filter_by(telefon=u_data['telefon']).first()
        if varmi:
            print(f"  ⏭  {u_data['ad']} {u_data['soyad']}: zaten var.")
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
    print(f"\n✅ {eklenen} usta eklendi!")
    print(f"   Toplam usta: {Usta.query.count()}")
    print(f"   Toplam yorum: {Yorum.query.count()}")
