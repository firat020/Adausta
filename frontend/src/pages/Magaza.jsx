import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { ShoppingCart, Search, Package, Plus, Minus, X, Trash2, ChevronDown, Store, SlidersHorizontal, ArrowRight, Truck } from 'lucide-react'
import API from '../config.js'

const fmt = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0)
const CART_KEY = 'adausta_sepet'
function getSepet() { try { return JSON.parse(localStorage.getItem(CART_KEY) || '{}') } catch { return {} } }
function saveSepet(s) { localStorage.setItem(CART_KEY, JSON.stringify(s)) }

export default function Magaza() {
  const [urunler, setUrunler] = useState([])
  const [total, setTotal] = useState(0)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState(false)

  // Filtreler
  const [arama, setArama] = useState('')
  const [aramaInput, setAramaInput] = useState('')
  const [kategori, setKategori] = useState('')
  const [markaId, setMarkaId] = useState('')
  const [storeId, setStoreId] = useState('')
  const [fiyatMin, setFiyatMin] = useState('')
  const [fiyatMax, setFiyatMax] = useState('')
  const [siralama, setSiralama] = useState('yeni')
  const [sayfa, setSayfa] = useState(1)

  // Filtre seçenekleri (API'den)
  const [kategoriler, setKategoriler] = useState([])
  const [markalar, setMarkalar] = useState([])
  const [magazalar, setMagazalar] = useState([])

  // UI
  const [mobilFiltreAcik, setMobilFiltreAcik] = useState(false)
  const [sepet, setSepetState] = useState(getSepet)
  const [sepetAcik, setSepetAcik] = useState(false)

  const navigate = useNavigate()

  const setSepet = (fn) => {
    setSepetState(prev => {
      const yeni = typeof fn === 'function' ? fn(prev) : fn
      saveSepet(yeni); return yeni
    })
  }

  // Filtre seçeneklerini yükle
  useEffect(() => {
    axios.get(`${API}/api/magaza/public/filtreler`)
      .then(r => {
        setKategoriler(r.data.kategoriler || [])
        setMarkalar(r.data.markalar || [])
        setMagazalar(r.data.magazalar || [])
      })
      .catch(() => {})
  }, [])

  // Ürünleri yükle
  useEffect(() => {
    setYukleniyor(true)
    setHata(false)
    const params = {
      arama: arama || undefined,
      kategori: kategori || undefined,
      marka_id: markaId || undefined,
      store_id: storeId || undefined,
      fiyat_min: fiyatMin || undefined,
      fiyat_max: fiyatMax || undefined,
      siralama,
      sayfa,
    }
    axios.get(`${API}/api/magaza/public/urunler`, { params })
      .then(r => { setUrunler(r.data.urunler || []); setTotal(r.data.total || 0) })
      .catch(() => setHata(true))
      .finally(() => setYukleniyor(false))
  }, [arama, kategori, markaId, storeId, fiyatMin, fiyatMax, siralama, sayfa])

  const aramayiUygula = () => { setArama(aramaInput); setSayfa(1) }
  const filtreTemizle = () => {
    setKategori(''); setMarkaId(''); setStoreId('')
    setFiyatMin(''); setFiyatMax(''); setSiralama('yeni')
    setArama(''); setAramaInput(''); setSayfa(1)
  }
  const sayfaSayisi = Math.ceil(total / 20)
  const aktifFiltreSayisi = [kategori, markaId, storeId, fiyatMin, fiyatMax].filter(Boolean).length

  const sepeteEkle = (urun) => setSepet(s => ({ ...s, [urun.id]: (s[urun.id] || 0) + 1 }))
  const miktarDegistir = (id, delta) => setSepet(s => {
    const yeni = (s[id] || 0) + delta
    if (yeni <= 0) { const { [id]: _, ...rest } = s; return rest }
    return { ...s, [id]: yeni }
  })
  const sepettenCikar = (id) => setSepet(s => { const { [id]: _, ...rest } = s; return rest })
  const sepetUrunleri = urunler.filter(u => sepet[u.id])
  const sepetToplamAdet = Object.values(sepet).reduce((a, b) => a + b, 0)
  const sepetToplamUsd = sepetUrunleri.reduce((t, u) => t + u.usd_fiyat * sepet[u.id], 0)
  const sepetToplamTl = sepetUrunleri.reduce((t, u) => t + u.tl_fiyat * sepet[u.id], 0)

  const FiltrePaneli = () => (
    <div className="space-y-5">
      {/* Kategoriler */}
      {kategoriler.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kategori</p>
          <div className="space-y-0.5">
            <button
              onClick={() => { setKategori(''); setSayfa(1) }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!kategori ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Tümü
            </button>
            {kategoriler.map(k => (
              <button
                key={k}
                onClick={() => { setKategori(k); setSayfa(1) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${kategori === k ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Markalar */}
      {markalar.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Marka</p>
          <div className="space-y-0.5">
            <button
              onClick={() => { setMarkaId(''); setSayfa(1) }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!markaId ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Tümü
            </button>
            {markalar.map(m => (
              <button
                key={m.id}
                onClick={() => { setMarkaId(String(m.id)); setSayfa(1) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${markaId === String(m.id) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {m.ad}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mağaza */}
      {magazalar.length > 1 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Satıcı</p>
          <div className="space-y-0.5">
            <button
              onClick={() => { setStoreId(''); setSayfa(1) }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!storeId ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Tümü
            </button>
            {magazalar.map(m => (
              <button
                key={m.id}
                onClick={() => { setStoreId(String(m.id)); setSayfa(1) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${storeId === String(m.id) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {m.ad}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fiyat aralığı */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Fiyat ($)</p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={fiyatMin}
            onChange={e => setFiyatMin(e.target.value)}
            onBlur={() => setSayfa(1)}
            placeholder="Min"
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
          />
          <span className="text-gray-400 text-xs">–</span>
          <input
            type="number"
            value={fiyatMax}
            onChange={e => setFiyatMax(e.target.value)}
            onBlur={() => setSayfa(1)}
            placeholder="Max"
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {aktifFiltreSayisi > 0 && (
        <button onClick={filtreTemizle} className="w-full text-xs text-red-500 hover:text-red-700 font-semibold py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
          Filtreleri Temizle
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8 pb-24">

      {/* Başlık + Sepet */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Mağaza</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {total > 0 ? `${total} ürün listeleniyor` : 'Alet, ekipman ve malzeme siparişi'}
          </p>
        </div>
        <button
          onClick={() => setSepetAcik(true)}
          className="relative flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
        >
          <ShoppingCart size={16} />
          <span className="hidden sm:inline">Sepetim</span>
          {sepetToplamAdet > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
              {sepetToplamAdet}
            </span>
          )}
        </button>
      </div>

      {/* Arama + Sıralama + Mobil filtre */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={aramaInput}
            onChange={e => setAramaInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && aramayiUygula()}
            placeholder="Ürün ara..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 shadow-sm"
          />
        </div>
        <select
          value={siralama}
          onChange={e => { setSiralama(e.target.value); setSayfa(1) }}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:border-blue-400"
        >
          <option value="yeni">En Yeni</option>
          <option value="fiyat_asc">Fiyat: Düşük → Yüksek</option>
          <option value="fiyat_desc">Fiyat: Yüksek → Düşük</option>
        </select>
        <button
          onClick={() => setMobilFiltreAcik(true)}
          className="md:hidden flex items-center gap-1.5 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm"
        >
          <SlidersHorizontal size={14} />
          Filtreler
          {aktifFiltreSayisi > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">{aktifFiltreSayisi}</span>
          )}
        </button>
      </div>

      {/* Mağazalar bandı — sadece filtre yokken ve birden fazla mağaza varsa */}
      {magazalar.length > 0 && !storeId && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <Store size={14} className="text-blue-600" /> Satıcılar
            </h2>
            <Link to="/magaza/saticilar" className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
              Tümü <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {magazalar.map(m => (
              <button
                key={m.id}
                onClick={() => { setStoreId(String(m.id)); setSayfa(1) }}
                className="flex-shrink-0 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-2.5"
              >
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Store size={16} className="text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{m.ad}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-5 items-start">

        {/* Sol sidebar — tablet+ */}
        <aside className="hidden md:block w-52 flex-shrink-0 bg-white border border-gray-200 rounded-2xl p-4 sticky top-4">
          <FiltrePaneli />
        </aside>

        {/* Ürünler */}
        <div className="flex-1 min-w-0">
          {yukleniyor ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : hata ? (
            <div className="text-center py-24 text-red-400">
              <Package size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-semibold">Bağlantı hatası</p>
            </div>
          ) : urunler.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium text-lg">Ürün bulunamadı</p>
              {aktifFiltreSayisi > 0 && (
                <button onClick={filtreTemizle} className="mt-3 text-sm text-blue-600 hover:underline">Filtreleri temizle</button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {urunler.map(u => {
                  const stokYok = u.stok !== null && u.stok <= 0
                  const sepetteMi = !!sepet[u.id]
                  const kargoUcretsiz = u.usd_fiyat >= (u.magaza_ucretsiz_kargo_limiti || 199)
                  return (
                    <div key={u.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                      <div
                        className="h-36 sm:h-44 bg-gray-50 flex items-center justify-center border-b border-gray-100 cursor-pointer relative"
                        onClick={() => navigate(`/magaza/urun/${u.id}`)}
                      >
                        {u.kapak_gorsel
                          ? <img src={`${API}/uploads/${u.kapak_gorsel}`} className="h-full w-full object-contain p-2" alt={u.ad} />
                          : <Package size={36} className="text-gray-200" />
                        }
                        {u.magaza_slug && u.magaza_slug !== 'adausta-resmi-magaza' && (
                          <div className="absolute bottom-1.5 left-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-md px-1.5 py-0.5 flex items-center gap-1">
                            <Store size={9} className="text-blue-600" />
                            <span className="text-[10px] font-semibold text-gray-700 truncate max-w-[80px]">{u.magaza_adi}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 flex flex-col flex-1">
                        {u.marka_ad && <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-0.5 truncate">{u.marka_ad}</p>}
                        <h3
                          className="text-xs sm:text-sm font-bold text-gray-900 leading-snug mb-1.5 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors flex-1"
                          onClick={() => navigate(`/magaza/urun/${u.id}`)}
                        >{u.ad}</h3>

                        <div className="mb-1.5">
                          <span className="text-base sm:text-lg font-black text-gray-900">${u.usd_fiyat}</span>
                          <p className="text-xs text-gray-400 leading-none">{fmt(u.tl_fiyat)}</p>
                        </div>

                        <p className={`text-xs font-semibold mb-1 ${u.stok === null || u.stok > 5 ? 'text-green-600' : u.stok > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                          {u.stok === null ? 'Stokta' : u.stok > 5 ? 'Stokta' : u.stok > 0 ? `Son ${u.stok}!` : 'Stok yok'}
                        </p>

                        <p className={`text-[10px] font-semibold mb-2 flex items-center gap-1 ${kargoUcretsiz ? 'text-green-600' : 'text-gray-400'}`}>
                          <Truck size={10} />
                          {kargoUcretsiz ? 'Ücretsiz kargo' : `$${u.kargo_ucreti} kargo`}
                        </p>

                        {stokYok ? (
                          <button disabled className="w-full py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 cursor-not-allowed">Stok Yok</button>
                        ) : sepetteMi ? (
                          <button onClick={() => setSepetAcik(true)} className="w-full py-2.5 rounded-xl text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                            Sepette ({sepet[u.id]})
                          </button>
                        ) : (
                          <button onClick={() => sepeteEkle(u)} className="w-full flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white">
                            <Plus size={12} /> Ekle
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Sayfalama */}
              {sayfaSayisi > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: sayfaSayisi }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setSayfa(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === sayfa ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobil filtre drawer */}
      {mobilFiltreAcik && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobilFiltreAcik(false)} />
          <div className="relative w-full bg-white rounded-t-2xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Filtreler</h3>
              <button onClick={() => setMobilFiltreAcik(false)} className="p-1"><X size={20} className="text-gray-500" /></button>
            </div>
            <FiltrePaneli />
            <button onClick={() => setMobilFiltreAcik(false)} className="w-full mt-4 bg-blue-600 text-white font-bold py-3 rounded-xl text-sm">
              Uygula
            </button>
          </div>
        </div>
      )}

      {/* Sepet drawer */}
      {sepetAcik && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSepetAcik(false)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Sepetim</h2>
              <button onClick={() => setSepetAcik(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {sepetUrunleri.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <ShoppingCart size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Sepet boş</p>
                </div>
              ) : sepetUrunleri.map(u => (
                <div key={u.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="w-14 h-14 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {u.kapak_gorsel ? <img src={`${API}/uploads/${u.kapak_gorsel}`} className="w-full h-full object-contain p-1" alt={u.ad} /> : <Package size={20} className="text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{u.ad}</p>
                    <p className="text-xs text-gray-500">${u.usd_fiyat} / adet</p>
                    <p className="text-sm font-black text-blue-700">${(u.usd_fiyat * sepet[u.id]).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => miktarDegistir(u.id, -1)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center"><Minus size={13} /></button>
                    <span className="text-sm font-bold w-6 text-center">{sepet[u.id]}</span>
                    <button onClick={() => miktarDegistir(u.id, 1)} disabled={u.stok !== null && sepet[u.id] >= u.stok} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center disabled:opacity-40"><Plus size={13} /></button>
                    <button onClick={() => sepettenCikar(u.id)} className="w-8 h-8 ml-1 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            {sepetUrunleri.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{sepetToplamAdet} ürün</span>
                  <div className="text-right">
                    <p className="text-xl font-black text-gray-900">${sepetToplamUsd.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{fmt(sepetToplamTl)}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const items = sepetUrunleri.map(u => ({ urun_id: u.id, miktar: sepet[u.id], ad: u.ad, usd_fiyat: u.usd_fiyat, tl_fiyat: u.tl_fiyat, kapak_gorsel: u.kapak_gorsel }))
                    navigate('/magaza/odeme', { state: { items } })
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <ShoppingCart size={16} /> Siparişi Tamamla
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
