import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ShoppingCart, Package, ChevronLeft, Plus, Minus, Check } from 'lucide-react'
import API from '../config.js'

const fmt = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0)
const CART_KEY = 'adausta_sepet'
function getSepet() { try { return JSON.parse(localStorage.getItem(CART_KEY) || '{}') } catch { return {} } }
function saveSepet(s) { localStorage.setItem(CART_KEY, JSON.stringify(s)) }

export default function MagazaUrunDetay() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [urun, setUrun] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [aktifGorsel, setAktifGorsel] = useState(0)
  const [sepet, setSepetState] = useState(getSepet)
  const [eklendi, setEklendi] = useState(false)

  const setSepet = (fn) => {
    setSepetState(prev => {
      const yeni = typeof fn === 'function' ? fn(prev) : fn
      saveSepet(yeni); return yeni
    })
  }

  useEffect(() => {
    setYukleniyor(true)
    axios.get(`${API}/api/magaza/public/urunler/${id}`)
      .then(r => { setUrun(r.data); setAktifGorsel(0) })
      .catch(() => navigate('/magaza'))
      .finally(() => setYukleniyor(false))
  }, [id])

  const sepeteEkle = () => {
    if (!urun) return
    setSepet(s => ({ ...s, [urun.id]: (s[urun.id] || 0) + 1 }))
    setEklendi(true)
    setTimeout(() => setEklendi(false), 1800)
  }

  const miktar = sepet[urun?.id] || 0

  const miktarDegistir = (delta) => {
    if (!urun) return
    setSepet(s => {
      const yeni = (s[urun.id] || 0) + delta
      if (yeni <= 0) { const { [urun.id]: _, ...rest } = s; return rest }
      return { ...s, [urun.id]: yeni }
    })
  }

  if (yukleniyor) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )

  if (!urun) return null

  const gorseller = urun.gorseller?.length ? urun.gorseller : []
  const stokYok = urun.stok !== null && urun.stok <= 0
  const sepetAdet = Object.values(getSepet()).reduce((a, b) => a + b, 0)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Geri + Sepet */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/magaza')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
          <ChevronLeft size={16} /> Mağazaya Dön
        </button>
        <button
          onClick={() => navigate('/magaza')}
          className="relative flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"
        >
          <ShoppingCart size={15} />
          Sepetim
          {sepetAdet > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
              {sepetAdet}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* Görseller */}
        <div>
          <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden aspect-square flex items-center justify-center mb-3">
            {gorseller.length > 0
              ? <img
                  src={`${API}/uploads/${gorseller[aktifGorsel].yol}`}
                  alt={urun.ad}
                  className="w-full h-full object-contain p-6"
                />
              : <Package size={80} className="text-gray-200" />
            }
          </div>
          {gorseller.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {gorseller.map((g, i) => (
                <button
                  key={g.id}
                  onClick={() => setAktifGorsel(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition-colors ${
                    aktifGorsel === i ? 'border-blue-500' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img src={`${API}/uploads/${g.yol}`} alt="" className="w-full h-full object-contain p-1 bg-gray-50" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bilgiler */}
        <div className="space-y-5">
          {urun.marka_ad && (
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{urun.marka_ad}</p>
          )}
          <h1 className="text-2xl font-black text-gray-900 leading-tight">{urun.ad}</h1>

          {urun.model_ad && (
            <p className="text-sm text-gray-500">Model: <span className="font-semibold text-gray-700">{urun.model_ad}</span></p>
          )}

          {urun.kategori && (
            <span className="inline-block text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {urun.kategori}
            </span>
          )}

          {/* Fiyat */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <p className="text-4xl font-black text-gray-900">${urun.usd_fiyat}</p>
            <p className="text-lg text-gray-500 mt-1">{fmt(urun.tl_fiyat)}</p>
          </div>

          {/* Stok */}
          <p className={`text-sm font-bold ${
            urun.stok === null || urun.stok > 5 ? 'text-green-600'
            : urun.stok > 0 ? 'text-orange-500'
            : 'text-red-500'
          }`}>
            {urun.stok === null ? 'Stokta mevcut'
              : urun.stok > 5 ? `Stokta (${urun.stok} adet)`
              : urun.stok > 0 ? `Son ${urun.stok} adet!`
              : 'Stok tükendi'}
          </p>

          {/* Sepete Ekle */}
          {stokYok ? (
            <button disabled className="w-full py-4 rounded-2xl text-sm font-bold bg-gray-100 text-gray-400 cursor-not-allowed">
              Stok Tükendi
            </button>
          ) : miktar === 0 ? (
            <button
              onClick={sepeteEkle}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all ${
                eklendi ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {eklendi ? <><Check size={16} /> Sepete Eklendi</> : <><Plus size={16} /> Sepete Ekle</>}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-3">
                <button onClick={() => miktarDegistir(-1)} className="w-10 h-10 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-colors">
                  <Minus size={14} />
                </button>
                <span className="text-lg font-black text-gray-900">{miktar} adet</span>
                <button
                  onClick={() => miktarDegistir(1)}
                  disabled={urun.stok !== null && miktar >= urun.stok}
                  className="w-10 h-10 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => navigate('/magaza/odeme', { state: { items: [{
                  urun_id: urun.id, miktar,
                  ad: urun.ad, usd_fiyat: urun.usd_fiyat, tl_fiyat: urun.tl_fiyat,
                  kapak_gorsel: urun.kapak_gorsel
                }] } })}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <ShoppingCart size={16} /> Siparişi Tamamla
              </button>
            </div>
          )}

          {/* Açıklama */}
          {urun.aciklama && (
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Ürün Açıklaması</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{urun.aciklama}</p>
            </div>
          )}

          {/* Teknik bilgi */}
          {(urun.sku || urun.barkod) && (
            <div className="border-t border-gray-100 pt-4 space-y-1">
              {urun.sku && <p className="text-xs text-gray-400">SKU: {urun.sku}</p>}
              {urun.barkod && <p className="text-xs text-gray-400">Barkod: {urun.barkod}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
