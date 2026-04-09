import { useState, useEffect } from 'react'
import { Search, TrendingUp } from 'lucide-react'
import { kategorileriGetir } from '../api'
import KategoriKart from '../components/KategoriKart'

export default function Kategoriler() {
  const [gruplar, setGruplar] = useState({})
  const [tumKategoriler, setTumKategoriler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [aktifGrup, setAktifGrup] = useState('Tümü')
  const [arama, setArama] = useState('')

  useEffect(() => {
    kategorileriGetir()
      .then(r => {
        setGruplar(r.data.gruplar || {})
        setTumKategoriler(r.data.kategoriler || [])
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [])

  const grupAdlari = ['Tümü', ...Object.keys(gruplar)]

  const tabandanFiltrele = () => {
    let liste = aktifGrup === 'Tümü'
      ? tumKategoriler
      : (gruplar[aktifGrup] || [])
    if (arama.trim())
      liste = liste.filter(k => k.ad.toLowerCase().includes(arama.toLowerCase()))
    return liste
  }

  const filtrelenmis = tabandanFiltrele()
  const populer = filtrelenmis.filter(k => k.usta_sayisi > 0).sort((a, b) => b.usta_sayisi - a.usta_sayisi)
  const diger = filtrelenmis.filter(k => k.usta_sayisi === 0)

  return (
    <div>
      {/* Hero arama */}
      <div className="relative px-4 py-10 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f2554 0%, #1a4aad 100%)' }}>
        <div className="absolute inset-0 bg-cover bg-center opacity-[0.08]"
          style={{ backgroundImage: "url('/hero-bg.webp')" }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-white text-2xl font-bold mb-1">Tüm Hizmetlerimiz</h1>
          <p className="text-blue-300 text-sm mb-5">83 kategori · KKTC genelinde hizmet</p>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={arama}
              onChange={e => setArama(e.target.value)}
              placeholder="Hizmet ara... (Örn: Boya, Tesisat, Temizlik)"
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-900 text-base outline-none focus:ring-2 focus:ring-blue-400 shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Grup filtre şeridi */}
      <div className="bg-white border-b border-blue-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          {grupAdlari.map(g => (
            <button key={g} onClick={() => { setAktifGrup(g); setArama('') }}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                aktifGrup === g
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {yukleniyor ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-72 bg-blue-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : arama.trim() ? (
          <>
            <p className="text-sm text-gray-500 mb-5">{filtrelenmis.length} kategori bulundu</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtrelenmis.map(k => <KategoriKart key={k.id} kategori={k} />)}
            </div>
          </>
        ) : (
          <>
            {populer.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-blue-600 rounded-full" />
                  <TrendingUp size={18} className="text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Popüler ve Aktif Hizmetler</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {populer.map(k => <KategoriKart key={k.id} kategori={k} />)}
                </div>
              </div>
            )}

            {diger.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-blue-200 rounded-full" />
                  <h2 className="text-xl font-bold text-gray-900">Diğer Kategoriler</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {diger.map(k => <KategoriKart key={k.id} kategori={k} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
