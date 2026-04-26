import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X, ExternalLink, MapPin, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ustaListele, kategorileriGetir, sehirleriGetir, reklamlariGetir, reklamTikla } from '../api'
import UstaKart from '../components/UstaKart'
import SEO from '../components/SEO'

const KATEGORI_ACIKLAMALARI = {
  'elektrikçi': {
    baslik: "KKTC'de Elektrikçi Ustası",
    aciklama: `Kuzey Kıbrıs'ta güvenilir, lisanslı elektrikçi arıyorsanız doğru yerdesiniz. Ada Usta üzerinden Lefkoşa, Girne, Gazimağusa, Güzelyurt ve İskele'de hizmet veren onaylı elektrikçi ustalarına ulaşabilirsiniz. Elektrik tesisatı, priz montajı, sigorta paneli, aydınlatma ve tüm elektrik işleri için KKTC'nin en güvenilir elektrikçilerini bulun.`,
    sorular: ['Elektrik tesisatı', 'Priz & anahtar montajı', 'Sigorta & pano', 'Aydınlatma', 'Topraklama']
  },
  'su tesisatı': {
    baslik: "KKTC'de Tesisatçı & Sıhhi Tesisat Ustası",
    aciklama: `Kuzey Kıbrıs'ta sıhhi tesisat, tıkanıklık açma, musluk tamiri, su deposu temizleme ve pis su hattı için onaylı tesisatçı bulun. Ada Usta'daki Kıbrıs tesisat ustaları Lefkoşa, Girne ve Gazimağusa'da 7/24 acil servis de dahil olmak üzere tüm su tesisatı işlerini yapar. Şofben bakım, kombi servis ve hidrofor montajı da bu kategorideki ustalar tarafından yapılmaktadır.`,
    sorular: ['Tıkanıklık açma', 'Su deposu temizleme', 'Şofben tamir', 'Kombi servis', 'Musluk tamiri', 'Su kaçağı tespiti', 'Hidrofor servisi', 'Acil tesisat']
  },
  'boya badana': {
    baslik: "KKTC'de Boyacı Ustası",
    aciklama: `Evinizi veya işyerinizi yenilemek mi istiyorsunuz? Ada Usta'da Kuzey Kıbrıs'ın deneyimli boyacı ve badanacı ustaları sizi bekliyor. İç cephe boya, dış cephe boya, dekoratif boya ve alçı işleri için KKTC'nin en iyi boyacılarına ulaşın.`,
    sorular: ['İç cephe boya', 'Dış cephe boya', 'Dekoratif boyama', 'Alçı & sıva', 'Ahşap boyama']
  },
  'klima servisi': {
    baslik: "KKTC'de Klima Servisi & Montaj",
    aciklama: `KKTC'de klima montajı, bakımı ve tamiri için Ada Usta'daki onaylı klima teknisyenlerine başvurun. Lefkoşa, Girne ve Gazimağusa'da tüm marka klimalar için kurulum, yıllık bakım ve arıza servisi yapan ustalar platformumuzda.`,
    sorular: ['Klima montajı', 'Klima bakımı', 'Klima tamiri', 'Gaz dolumu', 'Split klima kurulumu']
  },
  'evden eve nakliyat': {
    baslik: "KKTC'de Evden Eve Nakliyat",
    aciklama: `Kuzey Kıbrıs'ta taşınma mı planlıyorsunuz? Ada Usta'daki nakliyat firmaları eşyalarınızı güvenle taşır. KKTC genelinde Lefkoşa, Girne, Gazimağusa ve tüm şehirlere profesyonel evden eve nakliyat hizmeti.`,
    sorular: ['Ev taşıma', 'Ofis taşıma', 'Eşya ambalajlama', 'Ağır eşya taşıma', 'Depolama']
  },
  'ev temizliği': {
    baslik: "KKTC'de Ev Temizlik Hizmeti",
    aciklama: `Kuzey Kıbrıs'ta profesyonel ev temizliği için Ada Usta'yı kullanın. KKTC'de haftalık, aylık veya tek seferlik derin temizlik hizmeti veren güvenilir temizlik firmalarına ve ustalara ulaşın.`,
    sorular: ['Derin temizlik', 'Haftalık temizlik', 'Cam silme', 'Halı yıkama', 'İnşaat sonrası temizlik']
  },
  'anahtar teslim tadilat': {
    baslik: "KKTC'de Tadilat & Renovasyon",
    aciklama: `Kuzey Kıbrıs'ta ev veya işyeri tadilatı için Ada Usta'daki deneyimli tadilat firmalarına ulaşın. KKTC'de mutfak yenileme, banyo tadilatı, zemin döşeme ve anahtar teslim renovasyon hizmetleri.`,
    sorular: ['Mutfak tadilatı', 'Banyo yenileme', 'Zemin döşeme', 'Alçıpan', 'Komple renovasyon']
  },
  'bahçe bakımı': {
    baslik: "KKTC'de Bahçe Bakım Hizmeti",
    aciklama: `Kuzey Kıbrıs'ta bahçe düzenleme, çim biçme ve peyzaj için Ada Usta'daki bahçıvan ustalarına başvurun. KKTC genelinde bahçe bakımı, ağaç budama ve sulama sistemi kurulumu yapan ustalar.`,
    sorular: ['Çim biçme', 'Ağaç budama', 'Peyzaj tasarımı', 'Sulama sistemi', 'Bahçe düzenleme']
  },
  'kombi servisi': {
    baslik: "KKTC'de Kombi & Şofben Servisi",
    aciklama: `KKTC'de kombi arızası veya şofben tamiri mi lazım? Ada Usta'daki yetkili kombi ve şofben teknisyenleri Lefkoşa, Girne ve Gazimağusa'da tüm marka kombiler ile gazlı şofbenler için servis, bakım ve tamir hizmeti verir. Kıbrıs'ta şofben bakım, ECA şofben servis ve kombi montajı için hemen usta bul.`,
    sorular: ['Kombi tamiri', 'Kombi bakımı', 'Şofben bakım tamir', 'Gazlı şofben servis', 'Radyatör servisi', 'Kombi montajı', 'Acil kombi servisi']
  },
  'şofben': {
    baslik: "KKTC'de Şofben Servisi & Tamiri",
    aciklama: `Kuzey Kıbrıs'ta şofben bakım, tamir ve montajı için Ada Usta'daki uzman teknisyenlere ulaşın. Girne, Lefkoşa ve Gazimağusa'da gazlı şofben, elektrikli şofben ve termosifon tamiri yapan onaylı ustalar. KKTC şofben servisi için hemen teklif alın.`,
    sorular: ['Gazlı şofben tamir', 'Şofben montajı', 'Termosifon servisi', 'Şofben bakımı', 'Acil şofben tamiri']
  },
}

function KategoriSeoBlok({ arama, sehir }) {
  const key = arama?.toLowerCase()
  const bilgi = key ? Object.entries(KATEGORI_ACIKLAMALARI).find(([k]) => key.includes(k))?.[1] : null
  if (!bilgi) return null
  return (
    <div className="mt-12 bg-blue-50 rounded-2xl p-6 border border-blue-100">
      <h2 className="text-lg font-bold text-gray-900 mb-2">
        {sehir ? `${sehir}'da ${bilgi.baslik.replace("KKTC'de ", '')}` : bilgi.baslik}
      </h2>
      <p className="text-sm text-gray-600 leading-relaxed mb-4">{bilgi.aciklama}</p>
      <div className="flex flex-wrap gap-2">
        {bilgi.sorular.map(s => (
          <span key={s} className="bg-white border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">{s}</span>
        ))}
      </div>
    </div>
  )
}

function ReklamKutusu({ reklam }) {
  if (!reklam) return (
    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center bg-gray-50">
      <p className="text-xs text-gray-400 font-medium">Reklam Alanı</p>
      <p className="text-xs text-gray-300 mt-1">Bu alana reklam verebilirsiniz</p>
    </div>
  )
  const handleTikla = () => {
    reklamTikla(reklam.id).catch(() => {})
    if (reklam.link_url) window.open(reklam.link_url, '_blank', 'noopener')
  }
  return (
    <button onClick={handleTikla}
      className="w-full border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow text-left">
      {reklam.resim_url ? (
        <img src={reklam.resim_url} alt={reklam.baslik} className="w-full h-32 object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-20 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">{reklam.firma_adi || reklam.baslik}</span>
        </div>
      )}
      <div className="p-3">
        <p className="text-xs font-bold text-gray-800 truncate">{reklam.baslik}</p>
        {reklam.aciklama && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{reklam.aciklama}</p>}
        {reklam.link_url && (
          <span className="text-xs text-blue-500 flex items-center gap-0.5 mt-1.5 font-medium">
            <ExternalLink size={10} /> Ziyaret Et
          </span>
        )}
      </div>
      <div className="px-3 pb-2">
        <span className="text-[10px] text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded font-medium">Reklam</span>
      </div>
    </button>
  )
}

export default function UstaListesi() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [ustalar, setUstalar] = useState([])
  const [kategoriler, setKategoriler] = useState([])
  const [sehirler, setSehirler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [toplam, setToplam] = useState(0)
  const [filtrePaneli, setFiltrePaneli] = useState(false)

  const [filtreler, setFiltreler] = useState({
    kategori_id: searchParams.get('kategori_id') || '',
    sehir_id: searchParams.get('sehir_id') || '',
    arama: searchParams.get('arama') || '',
  })
  const [reklamlar, setReklamlar] = useState({ sol: [], sag: [] })
  const [konum, setKonum] = useState(null) // { lat, lng }
  const [konumYukleniyor, setKonumYukleniyor] = useState(false)
  const konumAlindi = useRef(false)

  const kategoriAd = decodeURIComponent(searchParams.get('kategori_ad') || '')

  useEffect(() => {
    kategorileriGetir().then(r => setKategoriler(r.data.kategoriler || []))
    sehirleriGetir().then(r => setSehirler(r.data.sehirler || []))

    // Konum al (sadece bir kez) — önce GPS (HTTPS), olmazsa IP geo
    if (!konumAlindi.current) {
      konumAlindi.current = true
      setKonumYukleniyor(true)

      const ipGeo = () =>
        fetch('https://ipwho.is/')
          .then(r => r.json())
          .then(d => { if (d.success && d.latitude) setKonum({ lat: d.latitude, lng: d.longitude }) })
          .catch(() => {})
          .finally(() => setKonumYukleniyor(false))

      if (window.location.protocol === 'https:' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          pos => { setKonum({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setKonumYukleniyor(false) },
          ipGeo,
          { timeout: 6000, maximumAge: 60000 }
        )
      } else {
        ipGeo()
      }
    }
  }, [])

  useEffect(() => {
    if (filtreler.kategori_id) {
      reklamlariGetir({ kategori_id: filtreler.kategori_id })
        .then(r => setReklamlar({ sol: r.data.sol || [], sag: r.data.sag || [] }))
        .catch(() => {})
    }
  }, [filtreler.kategori_id])

  useEffect(() => {
    setYukleniyor(true)
    const params = {}
    if (filtreler.kategori_id) params.kategori_id = filtreler.kategori_id
    if (filtreler.sehir_id) params.sehir_id = filtreler.sehir_id
    if (filtreler.arama) params.arama = filtreler.arama
    if (konum) { params.lat = konum.lat; params.lng = konum.lng }
    ustaListele(params)
      .then(r => { setUstalar(r.data.ustalar || []); setToplam(r.data.toplam || 0) })
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [filtreler, konum])

  const temizle = () => setFiltreler({ kategori_id: '', sehir_id: '', arama: '' })
  const aktifFiltre = filtreler.kategori_id || filtreler.sehir_id || filtreler.arama

  const aramaTerimi = searchParams.get('arama') || ''
  const sehirTerimi = searchParams.get('sehir') || ''
  const seoBaslik = aramaTerimi && sehirTerimi
    ? `${sehirTerimi}'da ${aramaTerimi} Ustası Bul — KKTC`
    : aramaTerimi
      ? `KKTC'de ${aramaTerimi} Ustası Bul — Kuzey Kıbrıs`
      : sehirTerimi
        ? `${sehirTerimi}'da Usta Bul — KKTC`
        : "Kuzey Kıbrıs'ta Usta Bul — Tüm Ustalar"
  const seoAciklama = aramaTerimi && sehirTerimi
    ? `${sehirTerimi}'da ${aramaTerimi} için onaylı, güvenilir usta bul. Ada Usta ile KKTC'nin en iyi ustalarına ulaş.`
    : aramaTerimi
      ? `KKTC'de ${aramaTerimi} için onaylı, güvenilir usta bul. Lefkoşa, Girne, Gazimağusa ve tüm Kuzey Kıbrıs'ta hizmet.`
      : "Kuzey Kıbrıs'ta 80+ hizmet kategorisinde onaylı usta bul. Elektrikçi, tesisatçı, boyacı ve daha fazlası."
  const seoAnahtar = aramaTerimi
    ? `${aramaTerimi} KKTC, ${aramaTerimi} Kuzey Kıbrıs, ${sehirTerimi ? `${sehirTerimi} ${aramaTerimi}, ` : ''}KKTC usta bul, Kuzey Kıbrıs ${aramaTerimi}`
    : 'KKTC usta bul, Kuzey Kıbrıs usta, KKTC hizmet, usta ara'

  const seoSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        'name': seoBaslik,
        'description': seoAciklama,
        'url': `https://adausta.com/ustalar${aramaTerimi ? `?arama=${encodeURIComponent(aramaTerimi)}` : ''}`,
        'numberOfItems': toplam,
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Ana Sayfa', 'item': 'https://adausta.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Ustalar', 'item': 'https://adausta.com/ustalar' },
          ...(aramaTerimi ? [{ '@type': 'ListItem', 'position': 3, 'name': aramaTerimi, 'item': `https://adausta.com/ustalar?arama=${encodeURIComponent(aramaTerimi)}` }] : []),
          ...(sehirTerimi ? [{ '@type': 'ListItem', 'position': aramaTerimi ? 4 : 3, 'name': sehirTerimi }] : []),
        ]
      }
    ]
  }

  const solReklam = reklamlar.sol[0] || null
  const sagReklam = reklamlar.sag[0] || null
  const gosterReklam = !!filtreler.kategori_id

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-10">
      <SEO
        baslik={seoBaslik}
        aciklama={seoAciklama}
        url={`/ustalar${aramaTerimi ? `?arama=${encodeURIComponent(aramaTerimi)}` : ''}${sehirTerimi ? `${aramaTerimi ? '&' : '?'}sehir=${encodeURIComponent(sehirTerimi)}` : ''}`}
        anahtar={seoAnahtar}
        schema={seoSchema}
      />
      {/* Başlık */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {kategoriAd || t('ustaListesi.baslik')}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-2">
            {yukleniyor ? t('common.yukleniyor') : `${toplam} ${t('ustaListesi.ustaFound')}`}
            {konumYukleniyor && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-500">
                <Loader2 size={11} className="animate-spin" /> Konum alınıyor...
              </span>
            )}
            {!konumYukleniyor && konum && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                <MapPin size={11} /> Yakınlığa göre sıralı
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setFiltrePaneli(!filtrePaneli)}
          className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 hover:border-orange-400 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <SlidersHorizontal size={16} />
          {t('ustaListesi.filtrele')}
          {aktifFiltre && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
        </button>
      </div>

      {/* Filtre paneli */}
      {filtrePaneli && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('ustaListesi.arama')}</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={filtreler.arama}
                onChange={e => setFiltreler(f => ({ ...f, arama: e.target.value }))}
                placeholder={t('ustaListesi.aramaPlaceholder')}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('ustaListesi.hizmetTuru')}</label>
            <select value={filtreler.kategori_id}
              onChange={e => setFiltreler(f => ({ ...f, kategori_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white">
              <option value="">{t('ustaListesi.tumHizmetler')}</option>
              {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('ustaListesi.sehir')}</label>
            <select value={filtreler.sehir_id}
              onChange={e => setFiltreler(f => ({ ...f, sehir_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white">
              <option value="">{t('ustaListesi.tumSehirler')}</option>
              {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
            </select>
          </div>
          {aktifFiltre && (
            <div className="md:col-span-3 flex justify-end">
              <button onClick={temizle}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
                <X size={14} /> {t('ustaListesi.filtreleriTemizle')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ana içerik: sol reklam + usta grid + sağ reklam */}
      <div className={`flex gap-5 ${gosterReklam ? 'items-start' : ''}`}>

        {/* Sol reklam alanı */}
        {gosterReklam && (
          <div className="hidden xl:flex flex-col gap-3 w-44 flex-shrink-0 pt-1">
            <ReklamKutusu reklam={solReklam} />
            <ReklamKutusu reklam={reklamlar.sol[1] || null} />
          </div>
        )}

        {/* Usta listesi */}
        <div className="flex-1 min-w-0">
          {yukleniyor ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-52 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : ustalar.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <Search size={40} className="mx-auto mb-4 opacity-30" />
              <p className="font-medium text-gray-500">{t('ustaListesi.ustaBulunamadi')}</p>
              <p className="text-sm mt-1">{t('ustaListesi.farkliFiltre')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ustalar.map(u => <UstaKart key={u.id} usta={u} />)}
            </div>
          )}
        </div>

        {/* Sağ reklam alanı */}
        {gosterReklam && (
          <div className="hidden xl:flex flex-col gap-3 w-44 flex-shrink-0 pt-1">
            <ReklamKutusu reklam={sagReklam} />
            <ReklamKutusu reklam={reklamlar.sag[1] || null} />
          </div>
        )}
      </div>

      {/* SEO içerik bloğu */}
      <KategoriSeoBlok arama={aramaTerimi} sehir={sehirTerimi} />
    </div>
  )
}
