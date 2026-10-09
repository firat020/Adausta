// Sitemap üretici: public/sitemap.xml dosyasını canlı API verisiyle yeniden oluşturur.
//
// Kullanım:  node scripts/generate-sitemap.mjs            (varsayılan: https://adausta.com)
//            SITEMAP_API=http://localhost:5000 node scripts/generate-sitemap.mjs
//
// İçerik:
//   • Mevcut sitemap'teki sabit sayfalar korunur (ana sayfalar, yasal sayfalar, blog, ?arama= SEO sayfaları)
//   • /hizmet/:kategori          → tüm kategoriler
//   • /hizmet/:kategori/:şehir   → yalnızca o şehirde gerçekten usta bulunan kombinasyonlar (boş sayfa listelenmez)
//   • /usta/:id-slug             → her onaylı, aktif usta profili
// API'ye ulaşılamazsa mevcut dosyaya DOKUNULMAZ (build'i bozmaz).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { KATEGORI_SLUG, SEHIR_SLUG, ustaSlugUrl } from '../src/data/hizmetler.js'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')
const DOSYA = join(KOK, 'public', 'sitemap.xml')
const SITE = 'https://adausta.com'
const API = (process.env.SITEMAP_API || SITE).replace(/\/$/, '')
const BUGUN = new Date().toISOString().slice(0, 10)

const xmlKacis = (s) => s.replace(/&amp;/g, '&').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const girdi = (yol, changefreq, priority, lastmod = BUGUN) =>
  `  <url>\n    <loc>${xmlKacis(SITE + yol)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n    <lastmod>${lastmod}</lastmod>\n  </url>`

async function tumUstalar() {
  const liste = []
  for (let sayfa = 1; sayfa <= 50; sayfa++) {
    const r = await fetch(`${API}/api/ustalar/?limit=100&sayfa=${sayfa}`, { signal: AbortSignal.timeout(20000) })
    if (!r.ok) throw new Error(`API ${r.status}`)
    const d = await r.json()
    liste.push(...(d.ustalar || []))
    if (sayfa >= (d.toplam_sayfa || 1)) break
  }
  return liste
}

let ustalar
try {
  ustalar = await tumUstalar()
} catch (e) {
  console.warn(`[sitemap] API'ye ulaşılamadı (${e.message}); mevcut sitemap.xml korunuyor.`)
  process.exit(0)
}
if (ustalar.length === 0) {
  console.warn('[sitemap] API boş liste döndü; mevcut sitemap.xml korunuyor.')
  process.exit(0)
}

// 1) Sabit sayfalar: mevcut dosyadan, hizmet/usta dışındakiler (blog, ?arama= vb.) aynen taşınır
const mevcut = readFileSync(DOSYA, 'utf8')
const eskiBloklar = [...mevcut.matchAll(/<url>[\s\S]*?<\/url>/g)].map(m => m[0])
const sabit = []
const gorulen = new Set()   // aynı adres iki kez yazılmasın
for (const blok of eskiBloklar) {
  const loc = (blok.match(/<loc>(.*?)<\/loc>/) || [])[1]
  if (!loc) continue
  const yol = loc.replace(SITE, '').replace(/&amp;/g, '&')
  if (yol.startsWith('/hizmet/') || yol.startsWith('/usta/')) continue   // bunlar aşağıda yeniden üretiliyor
  if (gorulen.has(yol)) continue
  gorulen.add(yol)
  const cf = (blok.match(/<changefreq>(.*?)<\/changefreq>/) || [])[1] || 'weekly'
  const pr = (blok.match(/<priority>(.*?)<\/priority>/) || [])[1] || '0.5'
  const lm = (blok.match(/<lastmod>(.*?)<\/lastmod>/) || [])[1] || BUGUN
  sabit.push(girdi(yol, cf, pr, lm))
}

// Sitemap'te eksik olabilen genel sayfalar (yoksa eklenir)
for (const [yol, cf, pr] of [['/hakkimizda', 'monthly', '0.5'], ['/iletisim', 'monthly', '0.5'], ['/sss', 'monthly', '0.5'], ['/magaza', 'daily', '0.7']]) {
  if (!gorulen.has(yol)) { gorulen.add(yol); sabit.push(girdi(yol, cf, pr)) }
}

// 2) Hizmet sayfaları
const adSlug = Object.fromEntries(Object.entries(KATEGORI_SLUG).map(([slug, ad]) => [ad.toLowerCase(), slug]))
const sehirSlug = Object.fromEntries(Object.entries(SEHIR_SLUG).map(([slug, ad]) => [ad, slug]))
const hizmetKat = Object.keys(KATEGORI_SLUG).map(slug => girdi(`/hizmet/${slug}`, 'weekly', '0.8'))

const cift = new Set()
for (const u of ustalar) {
  const sSlug = sehirSlug[u.sehir]
  if (!sSlug) continue
  for (const k of (u.tum_kategoriler?.length ? u.tum_kategoriler : [{ ad: u.kategori }])) {
    const kSlug = adSlug[(k.ad || '').toLowerCase()]
    if (kSlug) cift.add(`${kSlug}/${sSlug}`)
  }
}
const hizmetSehir = [...cift].sort().map(c => girdi(`/hizmet/${c}`, 'weekly', '0.7'))

// 3) Usta profilleri
const ustaGirdi = ustalar.map(u => girdi(ustaSlugUrl(u), 'weekly', '0.6', (u.olusturma || BUGUN).slice(0, 10)))

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- ══ SABİT SAYFALAR (blog, yasal, SEO arama sayfaları) ═════════════════ -->
${sabit.join('\n')}

  <!-- ══ HİZMET SAYFALARI ═══════════════════════════════════════════════════ -->
${hizmetKat.join('\n')}

  <!-- ══ HİZMET × ŞEHİR (yalnızca usta bulunanlar) ═════════════════════════ -->
${hizmetSehir.join('\n')}

  <!-- ══ USTA PROFİLLERİ ════════════════════════════════════════════════════ -->
${ustaGirdi.join('\n')}

</urlset>
`
writeFileSync(DOSYA, xml, 'utf8')
console.log(`[sitemap] ${sabit.length + hizmetKat.length + hizmetSehir.length + ustaGirdi.length} URL yazıldı ` +
  `(sabit ${sabit.length}, hizmet ${hizmetKat.length}, hizmet×şehir ${hizmetSehir.length}, usta ${ustaGirdi.length})`)
