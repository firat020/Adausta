import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { Calendar, Clock, ArrowRight } from 'lucide-react'

export const BLOG_YAZILARI = [
  {
    slug: 'kibris-su-kacagi-tespiti',
    baslik: "Kıbrıs'ta Su Kaçağı Tespiti Nasıl Yapılır?",
    ozet: "KKTC'de su faturanız aniden artıyorsa ya da duvarlarınızda nem görüyorsanız, cihazla su kaçağı tespiti yaptırmanız gerekebilir. Belirtiler, yöntemler ve usta bulma rehberi.",
    tarih: "2026-04-15",
    okumaSuresi: "5 dk",
    kategori: "Su Tesisatı",
    anahtar: "Kıbrıs su kaçağı tespiti, KKTC tesisat, su kaçağı Lefkoşa, Kuzey Kıbrıs tesisatçı",
    icerik: `
## Su Kaçağı Belirtileri

Su faturanızın geçen aylara göre %30'dan fazla artması, zeminde veya duvarlarda nem ve ıslaklık, su sayacının kimse kullanmadığı hâlde dönmesi — bunlar kaçak işaretleridir.

## Cihazla Tespit Yöntemi

KKTC'deki profesyonel tesisatçılar, **akustik dinleme cihazı** ve **termal kamera** kullanarak duvarı açmadan kaçak noktasını belirleyebilir. Bu yöntem hem zamandan hem de tamir maliyetinden tasarruf sağlar.

## Lefkoşa ve Girne'de Tespit Süreci

Ortalama bir tespit işlemi 1-2 saat sürer. Uzman usta önce dış hattı, ardından iç tesisatı kontrol eder. Kaçak noktası belirlendikten sonra tamir için ayrı fiyat verilir.

## Ada Usta ile Tesisatçı Bulun

Ada Usta platformunda **"Su Tesisatı"** veya **"Su Kaçağı Tespiti"** aratarak Lefkoşa, Girne ve Gazimağusa'da hizmet veren onaylı ustaları bulabilirsiniz. Profil yorumlarını inceleyerek en uygun ustayı seçin.
    `
  },
  {
    slug: 'kktc-elektrikci-bulma-rehberi',
    baslik: "KKTC Elektrikçi Bulma Rehberi 2026",
    ozet: "Kuzey Kıbrıs'ta güvenilir elektrikçi bulmak için dikkat etmeniz gerekenler, ortalama ücretler ve Ada Usta platformu üzerinden nasıl usta bulacağınız.",
    tarih: "2026-04-10",
    okumaSuresi: "4 dk",
    kategori: "Elektrik",
    anahtar: "KKTC elektrikçi, Kıbrıs elektrikçi, Lefkoşa elektrik tamiri, Girne elektrikçi fiyatları",
    icerik: `
## KKTC'de Elektrik Arızaları

Sigorta atması, priz veya anahtar arızası, elektrik panosu sorunları ve dış aydınlatma kurulumu — bunlar KKTC'de en sık karşılaşılan elektrik işleridir.

## Güvenilir Elektrikçi Kriterleri

- Kıbrıs Elektrik Kurumu (KIB-TEK) standartlarına uygun çalışma
- Sigortalı ve belgeli usta
- Önceki müşteri yorumları

## Ortalama Fiyatlar (2026)

Priz veya anahtar değişimi: 30-60 TL / iş başına. Sigorta panosu revizyonu: 150-400 TL. Aydınlatma montajı: 50-120 TL / adet. (Fiyatlar değişebilir, usta ile önceden netleştirilmelidir.)

## Ada Usta ile Elektrikçi Bulun

[Ada Usta](https://adausta.com/ustalar?arama=Elektrik%C3%A7i) üzerinden şehrinizi ve "Elektrikçi" kategorisini seçerek dakikalar içinde onaylı usta bulabilirsiniz.
    `
  },
  {
    slug: 'lefkosa-klima-servisi',
    baslik: "Lefkoşa'da Klima Servisi ve Bakımı — Ne Zaman Yaptırmalı?",
    ozet: "Kıbrıs'ın sıcak ikliminde klimanızın düzenli bakımı şart. Lefkoşa ve Girne'de klima servisi, bakım periyotları ve tamir maliyetleri hakkında bilmeniz gerekenler.",
    tarih: "2026-04-05",
    okumaSuresi: "5 dk",
    kategori: "Klima Servisi",
    anahtar: "Lefkoşa klima servisi, Kıbrıs klima bakımı, KKTC klima tamir, Girne klima montaj",
    icerik: `
## Kıbrıs'ta Klima Neden Önemli?

Kuzey Kıbrıs yazları 40°C'yi aşan sıcaklıklarla geçer. Bu nedenle klima bakımı yılda en az bir kez — tercihen Nisan-Mayıs döneminde — yaptırılmalıdır.

## Bakım Neleri Kapsar?

- Filtre temizliği ve değişimi
- Gaz (frekant) kontrolü ve dolumu
- Drenaj hattı temizliği
- Kondenser ve evaporatör temizliği

## Ortalama Bakım Süresi ve Maliyeti

Standart split klima bakımı 45-90 dakika sürer. KKTC'de bakım ücreti cihaz tipine göre 80-250 TL arasında değişmektedir.

## Ada Usta ile Klima Ustası Bulun

Lefkoşa, Girne ve Gazimağusa'da klima servisi veren onaylı ustalar için [Ada Usta Klima Servisi](https://adausta.com/ustalar?arama=Klima+Servisi) sayfasını ziyaret edin.
    `
  },
  {
    slug: 'kibris-boya-badana-fiyatlari',
    baslik: "Kıbrıs'ta Boya Badana Fiyatları 2026 — Oda Başına Maliyet",
    ozet: "KKTC'de ev veya iş yeri boyatmak istiyorsanız fiyatları önceden öğrenin. Oda başına ortalama maliyetler, boya kalitesi seçimi ve güvenilir boyacı bulma rehberi.",
    tarih: "2026-03-28",
    okumaSuresi: "4 dk",
    kategori: "Boya Badana",
    anahtar: "Kıbrıs boya badana fiyatları, KKTC boyacı, Lefkoşa boya badana, Girne boyacı ustası",
    icerik: `
## Kıbrıs'ta Boya Maliyetini Etkileyen Faktörler

- Alan (m²)
- Boya markası ve kalitesi (ithal vs yerli)
- Kat sayısı (astar + iki kat finish)
- Mevcut duvar durumu (alçı, macun ihtiyacı)

## Ortalama Fiyatlar (Nisan 2026)

Standart oda (25 m² tavan dahil): 350-700 TL. Geniş salon (50 m²): 600-1.200 TL. Dış cephe: m² başına 40-80 TL. (Malzeme dahil fiyatlar için ustanızla görüşün.)

## Boyacı Seçerken Dikkat

Mutlaka örnek iş fotoğrafları isteyin. Kullanılacak boya markası ve kat sayısını önceden yazılı olarak netleştirin. Ada Usta'daki ustalar profil sayfalarında geçmiş işlerini paylaşmaktadır.

## Ada Usta ile Boyacı Bulun

[Kıbrıs Boyacı Ustası](https://adausta.com/ustalar?arama=Boya+Badana) için Ada Usta'ya göz atın.
    `
  },
  {
    slug: 'kktc-ev-temizligi-hizmetleri',
    baslik: "KKTC'de Ev Temizliği Hizmetleri — Güvenilir Temizlikçi Nasıl Bulunur?",
    ozet: "Kuzey Kıbrıs'ta günlük, haftalık ve genel temizlik hizmeti sunan profesyonel firmalar ve bireysel temizlikçiler. Fiyatlar, saatlik ücretler ve dikkat edilmesi gerekenler.",
    tarih: "2026-03-20",
    okumaSuresi: "4 dk",
    kategori: "Ev Temizliği",
    anahtar: "KKTC ev temizliği, Kıbrıs temizlik şirketi, Lefkoşa temizlikçi, Girne ev temizliği hizmeti",
    icerik: `
## KKTC'de Ev Temizliği Hizmet Türleri

- **Haftalık / Günlük Temizlik:** Düzenli ziyaret, genel temizlik
- **Genel Temizlik (Kirli Devir):** Evin tamamen yenilenmesi
- **Ofis ve İş Yeri Temizliği:** Sabah ya da akşam vardiyalı seçenekler

## Ortalama Ücretler (2026)

Saatlik bireysel temizlikçi: 80-130 TL. 3 odalı ev genel temizlik: 400-800 TL. Ofis temizliği (100 m²): 300-600 TL / ay.

## Güvenlik ve Referans

Ev temizliği için Ada Usta'da profilini inceleyin, müşteri yorumlarını okuyun. Birden fazla usta ile fiyat karşılaştırması yapın.

## Ada Usta ile Temizlikçi Bulun

KKTC genelinde hizmet veren [ev temizliği ustaları](https://adausta.com/ustalar?arama=Ev+Temizli%C4%9Fi) için Ada Usta'ya bakın.
    `
  },
  {
    slug: 'girne-nakliyat-rehberi',
    baslik: "Girne Nakliyat Rehberi — KKTC'de Evden Eve Taşıma 2026",
    ozet: "Kuzey Kıbrıs'ta taşınmak mı istiyorsunuz? Girne, Lefkoşa ve Gazimağusa'da hizmet veren nakliyat firmaları, fiyatlar ve taşıma sürecinde dikkat edilmesi gerekenler.",
    tarih: "2026-03-15",
    okumaSuresi: "5 dk",
    kategori: "Nakliyat",
    anahtar: "Girne nakliyat, KKTC evden eve nakliyat, Lefkoşa taşıma firması, Kıbrıs nakliyat fiyatları",
    icerik: `
## KKTC'de Nakliyat Süreci

Evden eve taşıma KKTC'de genellikle 2-6 saatte tamamlanır. Mesafe, mobilya miktarı ve kat durumu fiyatı belirleyen ana etkenlerdir.

## Taşımadan Önce Yapılması Gerekenler

1. En az 3 firmadan fiyat teklifi alın
2. Nakliyat esnasında eşya sigortası olup olmadığını sorun
3. Taşınma günü kat asansörü rezervasyonu yapın (apartmanda)
4. Kırılacak eşyaları ayrıca işaretleyin

## Ortalama Nakliyat Fiyatları (2026)

Girne → Lefkoşa (2 oda): 800-1.500 TL. Şehir içi küçük taşıma: 400-700 TL. Beyaz eşya + mobilya: fiyat teklifi alınması önerilir.

## Ada Usta ile Nakliyat Firması Bulun

[KKTC Nakliyat Firmaları](https://adausta.com/ustalar?arama=Evden+Eve+Nakliyat) sayfasında Girne, Lefkoşa ve Gazimağusa'da çalışan onaylı nakliyatçıları bulabilirsiniz.
    `
  }
]

function BlogKarti({ yazi }) {
  return (
    <Link
      to={`/blog/${yazi.slug}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
    >
      <div className="p-6">
        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          {yazi.kategori}
        </span>
        <h2 className="text-base font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors leading-snug">
          {yazi.baslik}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">
          {yazi.ozet}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Calendar size={12} /> {yazi.tarih}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {yazi.okumaSuresi}</span>
          </div>
          <span className="flex items-center gap-1 text-blue-500 font-medium">
            Oku <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function Blog() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SEO
        baslik="Blog — Kıbrıs Usta ve Hizmet Rehberi"
        aciklama="KKTC'de su tesisatı, elektrik, klima, boya badana ve nakliyat hizmetleri hakkında rehber yazılar. Kıbrıs'ta güvenilir usta bulmak için ipuçları."
        anahtar="Kıbrıs usta rehberi, KKTC su tesisatı blog, Kıbrıs elektrikçi ipuçları, KKTC hizmet fiyatları"
        url="/blog"
      />

      <div className="mb-10">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          Kıbrıs Usta ve Hizmet Rehberi
        </h1>
        <p className="text-gray-500 text-sm">
          KKTC'de su tesisatı, elektrik, klima, boya ve nakliyat hizmetleri hakkında pratik rehberler
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {BLOG_YAZILARI.map(y => (
          <BlogKarti key={y.slug} yazi={y} />
        ))}
      </div>
    </div>
  )
}
