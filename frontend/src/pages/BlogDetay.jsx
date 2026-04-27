import { useParams, Link } from 'react-router-dom'
import { BLOG_YAZILARI } from './Blog'
import SEO from '../components/SEO'
import { Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react'

function metniDonustur(metin) {
  const satirlar = metin.trim().split('\n')
  const elemanlar = []
  let key = 0

  for (const satir of satirlar) {
    const s = satir.trim()
    if (!s) continue

    if (s.startsWith('## ')) {
      elemanlar.push(
        <h2 key={key++} className="text-lg font-bold text-gray-900 mt-8 mb-3">
          {s.replace('## ', '')}
        </h2>
      )
    } else if (s.startsWith('- ')) {
      elemanlar.push(
        <li key={key++} className="ml-4 list-disc text-gray-700 text-sm leading-relaxed">
          {s.replace('- ', '')}
        </li>
      )
    } else if (/^\d+\./.test(s)) {
      elemanlar.push(
        <li key={key++} className="ml-4 list-decimal text-gray-700 text-sm leading-relaxed">
          {s.replace(/^\d+\.\s/, '')}
        </li>
      )
    } else {
      const parcalar = s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/)
      const inline = parcalar.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**'))
          return <strong key={i}>{p.slice(2, -2)}</strong>
        const linkEsles = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (linkEsles)
          return <a key={i} href={linkEsles[2]} className="text-blue-600 underline">{linkEsles[1]}</a>
        return p
      })
      elemanlar.push(
        <p key={key++} className="text-gray-700 text-sm leading-relaxed mb-3">
          {inline}
        </p>
      )
    }
  }
  return elemanlar
}

export default function BlogDetay() {
  const { slug } = useParams()
  const yazi = BLOG_YAZILARI.find(y => y.slug === slug)

  if (!yazi) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Yazı bulunamadı.</p>
        <Link to="/blog" className="text-blue-600 underline text-sm mt-4 block">← Bloga dön</Link>
      </div>
    )
  }

  const mevcutIndex = BLOG_YAZILARI.findIndex(y => y.slug === slug)
  const onceki = BLOG_YAZILARI[mevcutIndex + 1]
  const sonraki = BLOG_YAZILARI[mevcutIndex - 1]

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO
        baslik={yazi.baslik}
        aciklama={yazi.ozet}
        anahtar={yazi.anahtar}
        url={`/blog/${yazi.slug}`}
      />

      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 mb-8">
        <ArrowLeft size={14} /> Tüm Yazılar
      </Link>

      <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
        {yazi.kategori}
      </span>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-4 leading-snug">
        {yazi.baslik}
      </h1>

      <div className="flex items-center gap-4 text-xs text-gray-400 mb-8">
        <span className="flex items-center gap-1"><Calendar size={12} /> {yazi.tarih}</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {yazi.okumaSuresi} okuma</span>
      </div>

      <p className="text-gray-600 text-sm leading-relaxed mb-8 font-medium border-l-4 border-blue-200 pl-4">
        {yazi.ozet}
      </p>

      <div className="prose prose-sm max-w-none">
        {metniDonustur(yazi.icerik)}
      </div>

      <div className="mt-12 pt-8 border-t border-gray-100">
        <div className="bg-blue-50 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-gray-900 mb-2">KKTC'de usta aramak için</p>
          <Link
            to={`/ustalar?arama=${encodeURIComponent(yazi.kategori)}`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {yazi.kategori} Ustası Bul <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {(onceki || sonraki) && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {onceki && (
            <Link to={`/blog/${onceki.slug}`} className="block bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <p className="text-xs text-gray-400 mb-1">← Önceki Yazı</p>
              <p className="text-sm font-semibold text-gray-800 line-clamp-2">{onceki.baslik}</p>
            </Link>
          )}
          {sonraki && (
            <Link to={`/blog/${sonraki.slug}`} className="block bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow text-right">
              <p className="text-xs text-gray-400 mb-1">Sonraki Yazı →</p>
              <p className="text-sm font-semibold text-gray-800 line-clamp-2">{sonraki.baslik}</p>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
