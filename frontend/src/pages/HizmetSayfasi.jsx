import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, ArrowRight, ChevronRight, Users, Star, Phone } from 'lucide-react'
import { ustaListele } from '../api'
import SEO from '../components/SEO'
import UstaKart from '../components/UstaKart'
import {
  KATEGORI_SLUG, SEHIR_SLUG, SEHIRLER, SCHEMA_TIPI, siloGrupBul, addenSlug
} from '../data/hizmetler'

const BASE = 'https://adausta.com'

function servisSchema(kategoriAd, schemaType, sehir) {
  const yer = sehir || 'Kuzey Kıbrıs'
  return {
    '@context': 'https://schema.org',
    '@type': schemaType || 'Service',
    'name': `${kategoriAd} — ${yer}`,
    'description': `${yer}'da güvenilir ${kategoriAd.toLowerCase()} hizmeti. KKTC genelinde onaylı, müşteri yorumlu ustalar.`,
    'areaServed': {
      '@type': 'Place',
      'name': yer,
      'addressCountry': 'CY'
    },
    'provider': {
      '@type': 'Organization',
      '@id': `${BASE}/#organization`,
      'name': 'Ada Usta',
      'url': BASE
    },
    'url': `${BASE}/hizmet/${addenSlug(kategoriAd)}${sehir ? '/' + Object.entries(SEHIR_SLUG).find(([,v]) => v === sehir)?.[0] : ''}`
  }
}

function breadcrumbSchema(kategoriAd, sehir, slugKat, slugSehir) {
  const items = [
    { '@type': 'ListItem', 'position': 1, 'name': 'Ana Sayfa', 'item': BASE },
    { '@type': 'ListItem', 'position': 2, 'name': 'Hizmetler', 'item': `${BASE}/kategoriler` },
    { '@type': 'ListItem', 'position': 3, 'name': kategoriAd, 'item': `${BASE}/hizmet/${slugKat}` },
  ]
  if (sehir) {
    items.push({ '@type': 'ListItem', 'position': 4, 'name': sehir, 'item': `${BASE}/hizmet/${slugKat}/${slugSehir}` })
  }
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': items }
}

export default function HizmetSayfasi() {
  const { slug, sehirSlug } = useParams()
  const navigate = useNavigate()

  const kategoriAd = KATEGORI_SLUG[slug]
  const sehir = sehirSlug ? SEHIR_SLUG[sehirSlug] : null
  const siloGrup = siloGrupBul(slug)
  const schemaType = SCHEMA_TIPI[slug] || 'Service'

  const [ustalar, setUstalar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [toplam, setToplam] = useState(0)

  useEffect(() => {
    if (!kategoriAd) return
    setYukleniyor(true)
    const params = { arama: kategoriAd, limit: 12 }
    if (sehir) params.sehir = sehir
    ustaListele(params)
      .then(r => {
        setUstalar(r.data.ustalar || [])
        setToplam(r.data.toplam || r.data.ustalar?.length || 0)
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [slug, sehirSlug, kategoriAd, sehir])

  if (!kategoriAd) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Hizmet bulunamadı.</p>
        <Link to="/kategoriler" className="text-blue-600 underline text-sm">Tüm hizmetlere bak →</Link>
      </div>
    )
  }

  const baslik = sehir
    ? `${sehir} ${kategoriAd} Ustası`
    : `Kıbrıs ${kategoriAd} Ustası`

  const aciklama = sehir
    ? `${sehir}'da güvenilir ${kategoriAd.toLowerCase()} ustası bul. Onaylı, müşteri yorumlu KKTC ustaları Ada Usta'da. Hemen teklif al.`
    : `Kıbrıs'ta güvenilir ${kategoriAd.toLowerCase()} ustası bul. KKTC genelinde onaylı ustalar — Lefkoşa, Girne, Gazimağusa ve tüm şehirlerde 7/24 hizmet.`

  const keywords = sehir
    ? `${sehir} ${kategoriAd.toLowerCase()}, ${sehir} ${kategoriAd.toLowerCase()} ustası, KKTC ${kategoriAd.toLowerCase()}, Kıbrıs ${kategoriAd.toLowerCase()}`
    : `Kıbrıs ${kategoriAd.toLowerCase()}, KKTC ${kategoriAd.toLowerCase()}, ${kategoriAd.toLowerCase()} ustası Kıbrıs, Lefkoşa ${kategoriAd.toLowerCase()}, Girne ${kategoriAd.toLowerCase()}`

  const canonicalUrl = `/hizmet/${slug}${sehirSlug ? '/' + sehirSlug : ''}`

  const combinedSchema = [
    servisSchema(kategoriAd, schemaType, sehir),
    breadcrumbSchema(kategoriAd, sehir, slug, sehirSlug),
  ]

  return (
    <div className="bg-white min-h-screen">
      <SEO
        baslik={baslik}
        aciklama={aciklama}
        anahtar={keywords}
        url={canonicalUrl}
        schema={combinedSchema}
      />

      {/* Hero şerit */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-blue-300 mb-5 flex-wrap">
            <Link to="/" className="hover:text-white">Ana Sayfa</Link>
            <ChevronRight size={12} />
            <Link to="/kategoriler" className="hover:text-white">Hizmetler</Link>
            <ChevronRight size={12} />
            <Link to={`/hizmet/${slug}`} className="hover:text-white">{kategoriAd}</Link>
            {sehir && (
              <>
                <ChevronRight size={12} />
                <span className="text-white font-medium">{sehir}</span>
              </>
            )}
          </nav>

          <h1 className="text-2xl md:text-4xl font-extrabold mb-3">
            {sehir
              ? <>{sehir}'da <span className="text-yellow-400">{kategoriAd}</span> Ustası</>
              : <>Kıbrıs'ta <span className="text-yellow-400">{kategoriAd}</span> Ustası</>
            }
          </h1>
          <p className="text-blue-200 text-sm md:text-base max-w-xl mb-6">{aciklama}</p>

          {/* Şehir seçici */}
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/hizmet/${slug}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                !sehirSlug
                  ? 'bg-white text-blue-800 border-white'
                  : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
              }`}
            >
              Tüm KKTC
            </Link>
            {Object.entries(SEHIR_SLUG).map(([sl, ad]) => (
              <Link
                key={sl}
                to={`/hizmet/${slug}/${sl}`}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  sehirSlug === sl
                    ? 'bg-white text-blue-800 border-white'
                    : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                }`}
              >
                <MapPin size={10} className="inline mr-1" />{ad}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Ana içerik */}
          <div className="flex-1 min-w-0">
            {/* Usta sayısı */}
            <div className="flex items-center gap-2 mb-5">
              <Users size={16} className="text-blue-500" />
              <span className="text-sm text-gray-600">
                {yukleniyor ? 'Yükleniyor...' : (
                  toplam > 0
                    ? <><strong className="text-gray-900">{toplam}</strong> {sehir ? `${sehir}'da` : 'KKTC genelinde'} {kategoriAd.toLowerCase()} ustası bulundu</>
                    : `${sehir ? `${sehir}'da` : 'KKTC genelinde'} henüz ${kategoriAd.toLowerCase()} ustası yok`
                )}
              </span>
            </div>

            {/* Ustalar */}
            {yukleniyor ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : ustalar.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ustalar.map(u => <UstaKart key={u.id} usta={u} />)}
                </div>
                {toplam > ustalar.length && (
                  <div className="text-center mt-6">
                    <Link
                      to={`/ustalar?arama=${encodeURIComponent(kategoriAd)}${sehir ? '&sehir=' + encodeURIComponent(sehir) : ''}`}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      Tümünü Gör <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl">
                <p className="text-gray-500 text-sm mb-4">
                  {sehir ? `${sehir}'da` : 'Bu bölgede'} henüz {kategoriAd.toLowerCase()} ustası yok.
                </p>
                <Link
                  to={`/ustalar?arama=${encodeURIComponent(kategoriAd)}`}
                  className="text-blue-600 text-sm underline"
                >
                  KKTC genelinde ara →
                </Link>
              </div>
            )}

            {/* SEO açıklama bloğu */}
            <div className="mt-10 bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <h2 className="text-base font-bold text-gray-900 mb-3">
                {sehir ? `${sehir}'da ${kategoriAd}` : `Kıbrıs'ta ${kategoriAd}`} Hakkında
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ada Usta, KKTC genelinde {kategoriAd.toLowerCase()} hizmeti arayan müşterileri
                onaylı ve deneyimli ustalarla buluşturan Kıbrıs'ın #1 usta platformudur.
                {sehir
                  ? ` ${sehir} başta olmak üzere tüm KKTC'de`
                  : ' Lefkoşa, Girne, Gazimağusa, Güzelyurt ve İskele\'de'
                } hizmet veren {kategoriAd.toLowerCase()} ustalarını müşteri yorumları ve puanlamalarıyla inceleyebilir,
                direkt iletişime geçebilirsiniz. Platform kullanımı müşteriler için tamamen ücretsizdir.
              </p>
            </div>

            {/* Şehir bazlı iç linkler (silo) */}
            {!sehirSlug && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3">
                  {kategoriAd} — Şehre Göre Bul
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(SEHIR_SLUG).map(([sl, ad]) => (
                    <Link
                      key={sl}
                      to={`/hizmet/${slug}/${sl}`}
                      className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition-colors"
                    >
                      <MapPin size={11} className="text-blue-400 flex-shrink-0" />
                      {ad} {kategoriAd}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Silo sidebar — ilgili hizmetler */}
          {siloGrup && (
            <aside className="lg:w-56 flex-shrink-0">
              <div className={`rounded-2xl border p-4 ${siloGrup.renkClass}`}>
                <h3 className="text-xs font-bold mb-3 uppercase tracking-wide opacity-70">
                  {siloGrup.ad}
                </h3>
                <ul className="space-y-1">
                  {siloGrup.kategoriler
                    .filter(k => k !== slug)
                    .map(k => (
                      <li key={k}>
                        <Link
                          to={sehirSlug ? `/hizmet/${k}/${sehirSlug}` : `/hizmet/${k}`}
                          className="flex items-center gap-1.5 text-xs py-1.5 hover:font-semibold transition-all"
                        >
                          <ArrowRight size={10} className="flex-shrink-0 opacity-60" />
                          {KATEGORI_SLUG[k]}
                        </Link>
                      </li>
                    ))
                  }
                </ul>
              </div>

              {/* Tüm ustalar CTA */}
              <Link
                to={`/ustalar?arama=${encodeURIComponent(kategoriAd)}${sehir ? '&sehir=' + encodeURIComponent(sehir) : ''}`}
                className="mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors w-full"
              >
                Tüm Ustaları Listele <ArrowRight size={12} />
              </Link>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
