# Adausta — Claude Code Protokolü

## Proje Özeti
- **Site:** adausta.com — KKTC'nin #1 usta bulma platformu
- **Stack:** Python + Flask (backend) · React + Vite + Tailwind (frontend)
- **DB:** SQLite (`backend/instance/adausta.db`)
- **GitHub:** https://github.com/firat020/Adausta.git (branch: master)
- **Sunucu:** 31.210.53.135 · root · `/var/www/adausta`

## Klasör Yapısı
```
C:\Adausta\
├── backend/          Flask API
│   ├── app.py
│   ├── models.py
│   ├── routes/
│   └── instance/adausta.db
└── frontend/         React + Vite
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── data/hizmetler.js   ← 83 kategori slug/schema/silo haritası
    │   └── locales/tr.json
    ├── public/
    │   ├── sitemap.xml
    │   └── robots.txt
    └── dist/                   ← build çıktısı (deploy edilen)
```

## Deploy Yöntemi
```bash
# 1. Build
cd frontend && npm run build

# 2. Push (src dosyaları — dist gitignore'da)
git add -A && git commit -m "..." && git push origin master

# 3. dist/ SCP ile upload (KRİTİK — git checkout dist'i kopyalamaz!)
'/c/Program Files/PuTTY/pscp.exe' -pw 'iU7FTMHC' "C:/Adausta/frontend/dist/assets/index-XXXX.js"  "root@31.210.53.135:/var/www/adausta/frontend/dist/assets/"
'/c/Program Files/PuTTY/pscp.exe' -pw 'iU7FTMHC' "C:/Adausta/frontend/dist/assets/index-XXXX.css" "root@31.210.53.135:/var/www/adausta/frontend/dist/assets/"
'/c/Program Files/PuTTY/pscp.exe' -pw 'iU7FTMHC' "C:/Adausta/frontend/dist/index.html"            "root@31.210.53.135:/var/www/adausta/frontend/dist/"

# 4. Nginx reload
'/c/Program Files/PuTTY/plink.exe' -ssh root@31.210.53.135 -pw 'iU7FTMHC' "nginx -s reload && echo TAMAM"
```

> **NOT:** Sunucuda backend dosyaları (app.py, models.py, routes/) uncommitted değişiklikler içeriyor.
> `git pull` YAPMA. `dist/` gitignore'da — her deploy'da SCP ile upload zorunlu.

## Geliştirme (Local)
- Frontend: `cd frontend && npm run dev` → localhost:5175
- Backend: `cd backend && python app.py` → localhost:5000

## SEO Mimarisi
### Temiz URL Sayfaları
- `/hizmet/:slug` → kategori landing page (örn: `/hizmet/elektrikci`)
- `/hizmet/:slug/:sehirSlug` → şehir+kategori (örn: `/hizmet/su-tesisati/lefkosa`)
- `/blog/:slug` → SEO makaleleri (6 makale)

### Silo Grupları (12 grup)
Her grup kendi içinde birbirine link verir, dışarıya vermez.
1. Elektrik & Güvenlik
2. Su & Isıtma Tesisatı
3. Klima & Havalandırma
4. Yapı & Tadilat
5. Metal & Doğrama
6. Mobilya & Dekorasyon
7. Temizlik & Hijyen
8. Nakliyat & Taşıma
9. Elektronik & Teknik Servis
10. Bahçe & Dış Mekan
11. Otomotiv
12. Profesyonel Hizmetler

### Schema Tipleri
`src/data/hizmetler.js` → `SCHEMA_TIPI` map'i (PlumbingService, Electrician, HVACBusiness vb.)

## 83 Kategori (DB sırası)
| ID | Kategori | Silo |
|----|----------|------|
| 1 | Elektrikçi | Elektrik |
| 2 | Güvenlik Kamera | Elektrik |
| 3 | Alarm Sistemi | Elektrik |
| 4 | Uydu & Anten | Elektrik |
| 5 | Solar Panel | Elektrik |
| 6 | Akıllı Ev | Elektrik |
| 7 | Jeneratör Servisi | Elektrik |
| 8 | Su Tesisatı | Tesisat |
| 9 | Kombi Servisi | Tesisat |
| 10 | Su Deposu & Pompa | Tesisat |
| 11 | Şofben & Termosifon | Tesisat |
| 12 | Doğalgaz Tesisatı | Tesisat |
| 13 | Gider Açma | Tesisat |
| 14 | Su Kaçağı Tespiti | Tesisat |
| 15 | Havuz Yapımı & Bakımı | Tesisat |
| 16 | Sulama Sistemi | Tesisat |
| 17 | Klima Servisi | Klima |
| 18 | Havalandırma | Klima |
| 19 | Isı Pompası | Klima |
| 20 | Boya Badana | Yapı |
| 21 | Fayans & Seramik | Yapı |
| 22 | Parke Döşeme | Yapı |
| 23 | Alçıpan & Asma Tavan | Yapı |
| 24 | Sıva Ustası | Yapı |
| 25 | Mantolama | Yapı |
| 26 | Çatı Tamiri & Yapımı | Yapı |
| 27 | Beton & Temel | Yapı |
| 28 | Mermer & Granit | Yapı |
| 29 | Mozaik Ustası | Yapı |
| 30 | Anahtar Teslim Tadilat | Yapı |
| 31 | Prefabrik Ev | Yapı |
| 32 | Demirci | Metal |
| 33 | Demir Doğrama | Metal |
| 34 | Çelik Kapı | Metal |
| 35 | Korkuluk & Balkon Demiri | Metal |
| 36 | Kaynakçı | Metal |
| 37 | Ferforje | Metal |
| 38 | Sac & Çatı Sacı | Metal |
| 39 | Alüminyum Doğrama | Metal |
| 40 | PVC & Pimapen | Metal |
| 41 | Cam Balkon | Metal |
| 42 | Camcı | Metal |
| 43 | Çilingir | Metal |
| 44 | Kepenk & Panjur | Metal |
| 45 | Garaj Kapısı | Metal |
| 46 | Mobilya Montaj | Mobilya |
| 47 | Mobilya Tamiri | Mobilya |
| 48 | Mutfak Dolabı | Mobilya |
| 49 | Duvar Kağıdı | Mobilya |
| 50 | Halı Yıkama | Mobilya/Temizlik |
| 51 | Perde Montajı | Mobilya |
| 52 | Marangoz | Mobilya |
| 53 | Ev Temizliği | Temizlik |
| 54 | Ofis Temizliği | Temizlik |
| 55 | Böcek İlaçlama | Temizlik |
| 56 | Duşakabin Montajı | Mobilya |
| 57 | Mutfak Tadilat | Yapı |
| 58 | Evden Eve Nakliyat | Nakliyat |
| 59 | Ofis Taşıma | Nakliyat |
| 60 | Parça Eşya Taşıma | Nakliyat |
| 61 | Oto Çekici | Nakliyat/Otomotiv |
| 62 | Motokurye | Nakliyat |
| 63 | Beyaz Eşya Servisi | Elektronik |
| 64 | TV & Elektronik Tamir | Elektronik |
| 65 | Bilgisayar Tamiri | Elektronik |
| 66 | Telefon Tamiri | Elektronik |
| 67 | Bahçe Bakımı | Bahçe |
| 68 | Ağaç Budama | Bahçe |
| 69 | Dış Cephe Temizliği | Temizlik |
| 70 | Oto Tamiri | Otomotiv |
| 71 | Kaporta & Boya | Otomotiv |
| 72 | Oto Elektrik | Otomotiv |
| 73 | Lastik & Balans | Otomotiv |
| 74 | Araç Seramik Kaplama | Otomotiv |
| 75 | Araç Yıkama | Otomotiv |
| 76 | Fotoğrafçı | Profesyonel |
| 77 | Düğün Organizasyonu | Profesyonel |
| 78 | İç Mimar | Profesyonel |
| 79 | Mimar | Profesyonel |
| 80 | Catering & Yemek | Profesyonel |
| 81 | Terzi & Dikiş | Profesyonel |
| 82 | Veteriner (Evde) | Profesyonel |
| 83 | Evcil Hayvan Bakımı | Profesyonel |

## 5 Şehir
| Slug | Ad |
|------|----|
| lefkosa | Lefkoşa |
| girne | Girne |
| gazimagusa | Gazimağusa |
| guzelyurt | Güzelyurt |
| iskele | İskele |

## Önemli Kurallar
- **Backend deploy etme** — sadece frontend checkout kullan (yukarıdaki deploy komutu)
- **`git pull` yapma** — sunucuda backend değişiklikleri var, çakışır
- **Build zorunlu** — her frontend değişikliğinden önce `npm run build`
- **SEO bileşeni:** `src/components/SEO.jsx` — tüm sayfalarda kullan
- **i18n:** Türkçe değişiklikler `src/locales/tr.json`'a da yansıtılmalı
- **Caveman mode aktif** — kısa yanıt, tam kod

## Coding Rules
- NEVER omit code. No "// ... rest of code" placeholders.
- Always provide full file content for new files or major changes.
- Ensure all imports are present and correct.
