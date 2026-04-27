import { Helmet } from 'react-helmet-async'

const BASE = 'https://adausta.com'
const DEFAULT_IMG = `${BASE}/ada-usta-logo.png`

export default function SEO({
  baslik,
  aciklama,
  anahtar,
  url = '',
  gorsel = DEFAULT_IMG,
  tip = 'website',
  schema = null,
}) {
  const tamBaslik = baslik
    ? `${baslik} | Ada Usta KKTC`
    : "Ada Usta | Kıbrıs Tesisat, Boya, Elektrik ve Tadilat Hizmetleri — KKTC Usta Platformu"

  const tamAciklama = aciklama ||
    "Kıbrıs'ta elektrikçi, su tesisatı, boyacı, klima servisi, nakliyat ve 80+ hizmet için güvenilir usta bul. KKTC genelinde 7/24 onaylı usta platformu."

  const tamUrl = `${BASE}${url}`

  return (
    <Helmet>
      <title>{tamBaslik}</title>
      <meta name="description" content={tamAciklama} />
      {anahtar && <meta name="keywords" content={anahtar} />}
      <link rel="canonical" href={tamUrl} />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="geo.region" content="CY-01" />
      <meta name="geo.placename" content="Kuzey Kıbrıs" />
      <meta name="language" content="Turkish" />

      {/* Open Graph */}
      <meta property="og:title" content={tamBaslik} />
      <meta property="og:description" content={tamAciklama} />
      <meta property="og:url" content={tamUrl} />
      <meta property="og:image" content={gorsel} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:type" content={tip} />
      <meta property="og:site_name" content="Ada Usta KKTC" />
      <meta property="og:locale" content="tr_CY" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={tamBaslik} />
      <meta name="twitter:description" content={tamAciklama} />
      <meta name="twitter:image" content={gorsel} />

      {/* Sayfa özel JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  )
}
