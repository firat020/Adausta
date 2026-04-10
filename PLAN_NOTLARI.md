# Adausta — Geliştirme Plan Notları
> Son güncelleme: 2026-04-10

---

## TAMAMLANANLAR

### Backend (Flask + SQLite)
- [x] Usta kayıt, listeleme, detay, fotoğraf yükleme
- [x] Yorum ekleme, listeleme
- [x] Kategori listesi
- [x] GPS ile en yakın usta
- [x] Auth sistemi (login/logout, session)
- [x] Admin backend route'ları (usta/yorum onay, istatistik temel)

### Frontend (React + Vite)
- [x] Anasayfa, Usta listesi, Usta detay, Kayıt, En yakın, Kategoriler
- [x] Çok dil desteği (i18n altyapısı)

### Mobil (Flutter APK)
- [x] 6 ekran (Anasayfa, Kategoriler, Liste, Detay, En Yakın, Kayıt)
- [x] ngrok URL backend bağlantısı
- [x] release APK derlendi

### Admin Panel — 2026-04-10
- [x] Backend: AdminLog modeli, giriş deneme limiti (5x kilit)
- [x] Backend: /api/admin/log, /api/admin/istatistik, /api/admin/toplu
- [x] Frontend: /admin/login, /admin/dashboard, /admin/ustalar
- [x] Dashboard: istatistik kartları + recharts grafikleri
- [x] Usta tablosu: onayla/reddet/sil + arama + filtre

---

## EKSİKLER & YAPILACAKLAR

---

### 1. GÜVENLİK
- [ ] Admin şifre değiştirme sayfası (`/admin/sifre-degistir`)
- [x] Başarısız giriş deneme limiti — 5 denemede kilitle (backend yapıldı)
- [x] Admin işlem logu — kim ne zaman ne yaptı (backend yapıldı)
- [ ] Admin log sayfası frontend'e eklenecek (`/admin/loglar`)
- [ ] 2FA (iki faktörlü doğrulama) — ilerleyen aşama
- [ ] Rate limiting tüm API endpoint'lerine

### 2. USTA YÖNETİMİ
- [x] Usta onayla / reddet / sil (yapıldı)
- [ ] Toplu işlem frontend'i (checkbox seç → toplu onayla/sil)
- [ ] Kara liste sayfası (yasaklı usta listesi, `aktif=False` olanlar)
- [ ] Ustaya e-posta bildirimi gönder (SMTP entegrasyonu)
- [ ] Usta düzenleme formu (modal veya ayrı sayfa)

### 3. MÜŞTERİ YÖNETİMİ
- [ ] Müşteri şikayetleri takibi (model + admin sayfası)
- [ ] İletişim formu mesajları yönetimi
- [ ] Kullanıcı listesi ve yönetimi

### 4. PARA / GELİR SİSTEMİ
- [ ] Premium usta planı (model: `plan`, `plan_bitis` alanı Usta tablosuna)
- [ ] Ödeme kaydı tablosu (`Odeme` modeli)
- [ ] Admin'de gelir takibi sayfası
- [ ] Fatura PDF oluşturma ve indirme (reportlab veya weasyprint)
- [ ] İndirim kodu / kupon sistemi
- [ ] Ücretsiz deneme süresi yönetimi
- [ ] Ödeme yöntemi: Manuel banka havalesi (ilk aşama)
- [ ] Ödeme yöntemi: Stripe (ikinci aşama)

### 5. ANALİTİK — TIKLANaMA TAKİBİ
- [ ] `TiklanmaLog` modeli (backend) — kategori ve usta tıklanmaları
- [ ] Her usta detay isteğinde +1 görüntülenme say
- [ ] Her kategori listelemesinde +1 tıklanma say
- [ ] Admin istatistik sayfasına tıklanma grafikleri ekle
- [ ] Tarih aralığı filtresi (bu hafta / bu ay / özel)

### 6. İÇERİK YÖNETİMİ
- [ ] Anasayfa banner/slider yönetimi (model + admin sayfası)
- [ ] Duyuru ve kampanya yayınlama
- [ ] SSS yönetimi (Sıkça Sorulan Sorular)
- [ ] Blog / haber sayfası (SEO için)

### 7. RAPORLAMA
- [ ] PDF rapor indirme (usta listesi, gelir özeti)
- [ ] Excel rapor indirme
- [ ] Otomatik haftalık rapor e-postası
- [ ] Bu ay vs geçen ay karşılaştırma

### 8. MOBİL UYGULAMA EKSİKLERİ
- [ ] Splash screen
- [ ] Uygulama ikonu (şu an varsayılan Flutter ikonu)
- [ ] Usta fotoğraf galerisi (çoklu foto kaydırma)
- [ ] WhatsApp butonu
- [ ] Favori ustalar (yerel kayıt)
- [ ] iOS sürümü
- [ ] Play Store yayını

### 9. GENEL
- [ ] E-posta doğrulaması (kayıt sonrası)
- [ ] Şifre sıfırlama
- [ ] Google Analytics entegrasyonu
- [ ] Canlı sunucuya deploy (adausta.com)
- [ ] Otomatik SQLite yedekleme

---

## ÖNCELİK SIRASI

| Sıra | Özellik | Durum |
|------|---------|-------|
| 1 | Admin panel (login + dashboard + usta tablosu) | ✅ Yapıldı |
| 2 | Usta düzenleme formu + kara liste | ⏳ Sıradaki |
| 3 | Tıklanma takibi (backend + admin grafik) | ⏳ Sıradaki |
| 4 | Premium usta + ödeme (manuel havale) | ⏳ Planlandı |
| 5 | E-posta bildirimleri | ⏳ Planlandı |
| 6 | Mobil: ikon + splash + WhatsApp | ⏳ Planlandı |
| 7 | Canlı sunucu deploy | ⏳ Planlandı |

---

## TEKNİK NOTLAR
- Admin frontend: `/admin/*` route'ları, Navbar/Footer olmadan ayrı layout
- Grafik kütüphanesi: `recharts`
- AdminLog: her admin işleminde otomatik kayıt (backend decorator ile)
- Giriş kilidi: 5 başarısız denemede 15 dakika kilit (Kullanici modeli)
