import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ShoppingCart, Search, Package, Plus, Minus, X, Trash2 } from 'lucide-react'
import API from '../config.js'

const fmt = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0)
const CART_KEY = 'adausta_sepet'

function getSepet() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '{}') } catch { return {} }
}
function saveSepet(s) {
  localStorage.setItem(CART_KEY, JSON.stringify(s))
}

export default function Magaza() {
  const [urunler, setUrunler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [arama, setArama] = useState('')
  const [sepet, setSepetState] = useState(getSepet)
  const [sepetAcik, setSepetAcik] = useState(false)
  const navigate = useNavigate()

  const setSepet = (fn) => {
    setSepetState(prev => {
      const yeni = typeof fn === 'function' ? fn(prev) : fn
      saveSepet(yeni)
      return yeni
    })
  }

  useEffect(() => {
    setYukleniyor(true)
    axios.get(`${API}/api/magaza/public/urunler`, { params: { arama } })
      .then(r => setUrunler(r.data.urunler))
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [arama])

  const sepeteEkle = (urun) => {
    setSepet(s => ({ ...s, [urun.id]: (s[urun.id] || 0) + 1 }))
  }

  const miktarDegistir = (id, delta) => {
    setSepet(s => {
      const yeni = (s[id] || 0) + delta
      if (yeni <= 0) { const { [id]: _, ...rest } = s; return rest }
      return { ...s, [id]: yeni }
    })
  }

  const sepettenCikar = (id) => {
    setSepet(s => { const { [id]: _, ...rest } = s; return rest })
  }

  const sepetUrunleri = urunler.filter(u => sepet[u.id])
  const sepetToplamAdet = Object.values(sepet).reduce((a, b) => a + b, 0)
  const sepetToplamUsd = sepetUrunleri.reduce((t, u) => t + u.usd_fiyat * sepet[u.id], 0)
  const sepetToplamTl = sepetUrunleri.reduce((t, u) => t + u.tl_fiyat * sepet[u.id], 0)

  const devamEt = () => {
    if (sepetUrunleri.length === 0) return
    const items = sepetUrunleri.map(u => ({
      urun_id: u.id, miktar: sepet[u.id],
      ad: u.ad, usd_fiyat: u.usd_fiyat, tl_fiyat: u.tl_fiyat,
      kapak_gorsel: u.kapak_gorsel
    }))
    navigate('/magaza/odeme', { state: { items } })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Mağaza</h1>
          <p className="text-gray-500 mt-1">Alet, ekipman ve malzeme siparişi</p>
        </div>
        <button
          onClick={() => setSepetAcik(true)}
          className="relative flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
        >
          <ShoppingCart size={16} />
          Sepetim
          {sepetToplamAdet > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
              {sepetToplamAdet}
            </span>
          )}
        </button>
      </div>

      {/* Arama */}
      <div className="relative max-w-lg">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={arama}
          onChange={e => setArama(e.target.value)}
          placeholder="Ürün ara..."
          className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 shadow-sm"
        />
      </div>

      {/* Ürünler */}
      {yukleniyor ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : urunler.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <Package size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg">Ürün bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {urunler.map(u => {
            const stokYok = u.stok !== null && u.stok <= 0
            const sepetteMi = !!sepet[u.id]
            return (
              <div key={u.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="h-40 bg-gray-50 flex items-center justify-center border-b border-gray-100">
                  {u.kapak_gorsel
                    ? <img src={`${API}/uploads/${u.kapak_gorsel}`} className="h-full w-full object-contain p-3" alt={u.ad} />
                    : <Package size={36} className="text-gray-200" />
                  }
                </div>
                <div className="p-3">
                  {u.marka_ad && <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-0.5">{u.marka_ad}</p>}
                  <h3 className="text-sm font-bold text-gray-900 leading-snug mb-2 line-clamp-2">{u.ad}</h3>

                  <div className="mb-2">
                    <span className="text-xl font-black text-gray-900">${u.usd_fiyat}</span>
                    <p className="text-xs text-gray-400">{fmt(u.tl_fiyat)}</p>
                  </div>

                  <p className={`text-xs font-semibold mb-3 ${
                    u.stok === null || u.stok > 5 ? 'text-green-600'
                    : u.stok > 0 ? 'text-orange-500'
                    : 'text-red-500'
                  }`}>
                    {u.stok === null ? 'Stokta' : u.stok > 5 ? `Stokta (${u.stok})` : u.stok > 0 ? `Son ${u.stok} adet!` : 'Stok yok'}
                  </p>

                  {stokYok ? (
                    <button disabled className="w-full py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 cursor-not-allowed">Stok Yok</button>
                  ) : sepetteMi ? (
                    <button
                      onClick={() => setSepetAcik(true)}
                      className="w-full py-2 rounded-xl text-xs font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      Sepette ({sepet[u.id]})
                    </button>
                  ) : (
                    <button
                      onClick={() => sepeteEkle(u)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      <Plus size={12} />
                      Sepete Ekle
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Sepet drawer */}
      {sepetAcik && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSepetAcik(false)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Sepetim</h2>
              <button onClick={() => setSepetAcik(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
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
                    {u.kapak_gorsel
                      ? <img src={`${API}/uploads/${u.kapak_gorsel}`} className="w-full h-full object-contain p-1" alt={u.ad} />
                      : <Package size={20} className="text-gray-300" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{u.ad}</p>
                    <p className="text-xs text-gray-500">${u.usd_fiyat} / adet</p>
                    <p className="text-sm font-black text-blue-700">
                      ${(u.usd_fiyat * sepet[u.id]).toFixed(2)}
                      <span className="text-xs font-normal text-gray-400 ml-1">({fmt(u.tl_fiyat * sepet[u.id])})</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => miktarDegistir(u.id, -1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center">
                      <Minus size={11} />
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{sepet[u.id]}</span>
                    <button
                      onClick={() => miktarDegistir(u.id, 1)}
                      disabled={u.stok !== null && sepet[u.id] >= u.stok}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center disabled:opacity-40"
                    >
                      <Plus size={11} />
                    </button>
                    <button onClick={() => sepettenCikar(u.id)} className="w-7 h-7 ml-1 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500">
                      <Trash2 size={12} />
                    </button>
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
                  onClick={devamEt}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <ShoppingCart size={16} />
                  Siparisi Tamamla
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
