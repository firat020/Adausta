import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { ShieldCheck, Search, Star, Package, Store, ChevronRight } from 'lucide-react'
import API from '../config.js'

const fmt = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0)

export default function MagazaSatici() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [magaza, setMagaza] = useState(null)
  const [urunler, setUrunler] = useState([])
  const [total, setTotal] = useState(0)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState(false)
  const [sayfa, setSayfa] = useState(1)
  const [arama, setArama] = useState('')
  const [kategori, setKategori] = useState('')
  const [kategoriler, setKategoriler] = useState([])

  useEffect(() => {
    setHata(false)
    axios.get(`${API}/api/magaza/public/magaza/${slug}`)
      .then(r => setMagaza(r.data))
      .catch(() => setHata(true))
  }, [slug])

  useEffect(() => {
    setYukleniyor(true)
    axios.get(`${API}/api/magaza/public/magaza/${slug}/urunler`, {
      params: { sayfa, arama: arama || undefined, kategori: kategori || undefined }
    })
      .then(r => {
        setUrunler(r.data.urunler || [])
        setTotal(r.data.total || 0)
        const kats = [...new Set((r.data.urunler || []).map(u => u.kategori).filter(Boolean))]
        if (kats.length > 0) setKategoriler(kats)
      })
      .catch(() => setHata(true))
      .finally(() => setYukleniyor(false))
  }, [slug, sayfa, arama, kategori])

  const toplamSayfa = Math.ceil(total / 20)

  if (hata && !magaza) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Store size={56} className="mx-auto mb-4 text-gray-200" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Mağaza bulunamadı</h2>
        <p className="text-gray-400 mb-6">Bu mağaza mevcut değil veya kaldırılmış olabilir.</p>
        <Link to="/magaza" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
          Mağazaya Dön
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8 pb-24">

      {magaza && (
        <div className="mb-6">
          <div className="relative rounded-2xl overflow-hidden mb-0" style={{ height: 200 }}>
            {magaza.kapak_gorsel
              ? <img src={`${API}/uploads/${magaza.kapak_gorsel}`} className="w-full h-full object-cover" alt="kapak" />
              : <div className="w-full h-full bg-gradient-to-br from-blue-100 to-gray-200" />
            }
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl px-5 pt-0 pb-5 -mt-1 shadow-sm">
            <div className="flex items-end gap-4 -translate-y-8 mb-0">
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {magaza.logo
                  ? <img src={`${API}/uploads/${magaza.logo}`} className="w-full h-full object-cover" alt="logo" />
                  : <Store size={32} className="text-gray-300" />
                }
              </div>
              <div className="pb-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-gray-900 truncate">{magaza.magaza_adi}</h1>
                  {magaza.dogrulanmis && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
                      <ShieldCheck size={13} />
                      Doğrulanmış Satıcı
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="-mt-6">
              {magaza.aciklama && (
                <p className="text-gray-500 text-sm mb-4 leading-relaxed">{magaza.aciklama}</p>
              )}
              <div className="flex items-center gap-5 flex-wrap">
                {magaza.puan !== undefined && magaza.puan !== null && (
                  <div className="flex items-center gap-1.5">
                    <Star size={15} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold text-gray-900">{Number(magaza.puan).toFixed(1)}</span>
                    <span className="text-xs text-gray-400">puan</span>
                  </div>
                )}
                {magaza.yorum_sayisi !== undefined && magaza.yorum_sayisi !== null && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-gray-900">{magaza.yorum_sayisi}</span>
                    <span className="text-xs text-gray-400">yorum</span>
                  </div>
                )}
                {magaza.toplam_satis !== undefined && magaza.toplam_satis !== null && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-gray-900">{magaza.toplam_satis}</span>
                    <span className="text-xs text-gray-400">satış</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <Link to="/magaza" className="hover:text-blue-600 transition-colors font-medium">Mağaza</Link>
        <ChevronRight size={14} />
        <span className="text-gray-700 font-semibold truncate max-w-xs">{magaza?.magaza_adi || slug}</span>
      </nav>

      <div className="relative flex-1 mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={arama}
          onChange={e => { setArama(e.target.value); setSayfa(1) }}
          placeholder="Bu mağazada ürün ara..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 shadow-sm"
        />
      </div>

      <div className="flex gap-5 items-start">

        <aside className="hidden md:block w-52 flex-shrink-0 bg-white border border-gray-200 rounded-2xl p-4 sticky top-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kategoriler</span>
            {kategori && (
              <button onClick={() => { setKategori(''); setSayfa(1) }} className="text-xs text-blue-600 hover:underline">Temizle</button>
            )}
          </div>
          <button
            onClick={() => { setKategori(''); setSayfa(1) }}
            className={`w-full text-left py-1.5 px-3 rounded-lg text-sm transition-colors mb-1 ${
              !kategori ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tümü
          </button>
          {kategoriler.map(k => (
            <button
              key={k}
              onClick={() => { setKategori(k); setSayfa(1) }}
              className={`w-full text-left py-1.5 px-3 rounded-lg text-sm transition-colors ${
                kategori === k ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {k}
            </button>
          ))}
        </aside>

        <div className="flex-1 min-w-0">
          {yukleniyor ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : hata ? (
            <div className="text-center py-24 text-red-400">
              <Package size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-semibold">Bağlantı hatası</p>
              <p className="text-sm mt-1 text-gray-400">İnternet bağlantınızı kontrol edin</p>
            </div>
          ) : urunler.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium text-lg">Ürün bulunamadı</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {urunler.map(u => (
                  <div
                    key={u.id}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer"
                    onClick={() => navigate(`/magaza/urun/${u.id}`)}
                  >
                    <div className="h-36 sm:h-44 bg-gray-50 flex items-center justify-center border-b border-gray-100">
                      {u.kapak_gorsel
                        ? <img src={`${API}/uploads/${u.kapak_gorsel}`} className="h-full w-full object-contain p-2" alt={u.ad} />
                        : <Package size={36} className="text-gray-200" />
                      }
                    </div>
                    <div className="p-2.5 flex flex-col flex-1">
                      {u.marka_ad && (
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-0.5 truncate">{u.marka_ad}</p>
                      )}
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug mb-1.5 line-clamp-2 flex-1 hover:text-blue-600 transition-colors">
                        {u.ad}
                      </h3>
                      <div className="mb-1.5">
                        {u.usd_fiyat !== undefined && u.usd_fiyat !== null && (
                          <span className="text-base sm:text-lg font-black text-gray-900">${u.usd_fiyat}</span>
                        )}
                        {u.tl_fiyat !== undefined && u.tl_fiyat !== null && (
                          <p className="text-xs text-gray-400 leading-none">{fmt(u.tl_fiyat)}</p>
                        )}
                      </div>
                      {u.stok !== undefined && (
                        <p className={`text-xs font-semibold ${
                          u.stok === null || u.stok > 5 ? 'text-green-600'
                          : u.stok > 0 ? 'text-orange-500'
                          : 'text-red-500'
                        }`}>
                          {u.stok === null ? 'Stokta' : u.stok > 5 ? 'Stokta' : u.stok > 0 ? `Son ${u.stok}!` : 'Stok yok'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {toplamSayfa > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setSayfa(p => Math.max(1, p - 1))}
                    disabled={sayfa === 1}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Önceki
                  </button>
                  {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setSayfa(p)}
                      className={`w-9 h-9 rounded-xl border text-sm font-bold transition-colors ${
                        sayfa === p
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setSayfa(p => Math.min(toplamSayfa, p + 1))}
                    disabled={sayfa === toplamSayfa}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Sonraki
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
