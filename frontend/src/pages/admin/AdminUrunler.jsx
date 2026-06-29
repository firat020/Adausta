import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Plus, Search, Edit2, Trash2, Package, TrendingUp, DollarSign } from 'lucide-react'
import API from '../../config.js'

const fmt = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0)
const fmtUSD = (n) => `$${(n || 0).toFixed(2)}`

export default function AdminUrunler() {
  const [urunler, setUrunler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [arama, setArama] = useState('')
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  const getir = async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/magaza/urunler`, {
        params: { arama, limit: 50 },
        withCredentials: true
      })
      setUrunler(r.data.urunler)
      setTotal(r.data.total)
    } catch {}
    setYukleniyor(false)
  }

  useEffect(() => { getir() }, [arama])

  const sil = async (id, ad) => {
    if (!confirm(`"${ad}" silinecek. Emin misin?`)) return
    await axios.delete(`${API}/api/magaza/urunler/${id}`, { withCredentials: true })
    getir()
  }

  const aktifToggle = async (u) => {
    await axios.put(`${API}/api/magaza/urunler/${u.id}`, { aktif: !u.aktif }, { withCredentials: true })
    getir()
  }

  const aktifSayisi = urunler.filter(u => u.aktif).length

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ürün Yönetimi</h1>
          <p className="text-[#6a7ea0] text-sm mt-1">{total} ürün</p>
        </div>
        <button
          onClick={() => navigate('/admin/urun-ekle')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0052CC] hover:bg-[#003d99] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={16} /> Ürün Ekle
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Package, label: 'Toplam Ürün', val: total, color: 'text-blue-400' },
          { icon: TrendingUp, label: 'Aktif', val: aktifSayisi, color: 'text-green-400' },
          { icon: DollarSign, label: 'Pasif', val: total - aktifSayisi, color: 'text-orange-400' },
        ].map(({ icon: Icon, label, val, color }) => (
          <div key={label} className="bg-[#0d1322] border border-[#1a2744] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={15} className={color} />
              <span className="text-[#6a7ea0] text-xs font-medium">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Arama */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a7ea0]" />
        <input
          value={arama}
          onChange={e => setArama(e.target.value)}
          placeholder="Ürün ara..."
          className="w-full pl-9 pr-4 py-2.5 bg-[#0d1322] border border-[#1a2744] rounded-xl text-sm text-white placeholder-[#6a7ea0] outline-none focus:border-[#0052CC]"
        />
      </div>

      {/* Tablo */}
      <div className="bg-[#0d1322] border border-[#1a2744] rounded-xl overflow-hidden">
        {yukleniyor ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : urunler.length === 0 ? (
          <div className="text-center py-16 text-[#6a7ea0]">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Henüz ürün yok</p>
            <button
              onClick={() => navigate('/admin/urun-ekle')}
              className="mt-3 text-[#0052CC] text-sm hover:underline"
            >
              İlk ürünü ekle
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a2744]">
                {['Ürün', 'Açıklama', 'Marka / Model', 'USD', 'TL Satış', 'Stok', 'Durum', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-[#6a7ea0] px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {urunler.map(u => (
                <tr key={u.id} className="border-b border-[#1a2744] hover:bg-[#121929] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1a2744] rounded-lg flex items-center justify-center flex-shrink-0">
                        {u.kapak_gorsel
                          ? <img src={`${API}/uploads/${u.kapak_gorsel}`} className="w-full h-full object-cover rounded-lg" />
                          : <Package size={16} className="text-[#6a7ea0]" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{u.ad}</p>
                        {u.sku && <p className="text-xs text-[#6a7ea0]">SKU: {u.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="text-xs text-[#6a7ea0] line-clamp-2 leading-relaxed">
                      {u.aciklama || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6a7ea0]">
                    {u.marka_ad || '—'}{u.model_ad ? ` / ${u.model_ad}` : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6a7ea0]">{fmtUSD(u.usd_fiyat)}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-white">{fmt(u.tl_fiyat)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${u.stok > 5 ? 'text-green-400' : u.stok > 0 ? 'text-orange-400' : 'text-red-400'}`}>
                      {u.stok}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => aktifToggle(u)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                        u.aktif
                          ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                          : 'bg-gray-500/15 text-gray-400 hover:bg-gray-500/25'
                      }`}
                    >
                      {u.aktif ? 'Aktif' : 'Pasif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/admin/urun-ekle?id=${u.id}`)}
                        className="p-1.5 text-[#6a7ea0] hover:text-white hover:bg-[#1a2744] rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => sil(u.id, u.ad)}
                        className="p-1.5 text-[#6a7ea0] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
