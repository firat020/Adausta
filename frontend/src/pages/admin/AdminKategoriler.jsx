import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'

const API = 'http://localhost:5000'

export default function AdminKategoriler() {
  const [kategoriler, setKategoriler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [modal, setModal] = useState(null) // null | 'yeni' | kategori objesi
  const [form, setForm] = useState({ ad: '', ikon: '🔧', aciklama: '' })

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/kategoriler`, { withCredentials: true })
      setKategoriler(r.data.kategoriler)
    } catch (e) { console.error(e) }
    setYukleniyor(false)
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const ac = (k) => {
    if (k === 'yeni') {
      setForm({ ad: '', ikon: '🔧', aciklama: '' })
      setModal('yeni')
    } else {
      setForm({ ad: k.ad, ikon: k.ikon || '🔧', aciklama: k.aciklama || '' })
      setModal(k)
    }
  }

  const kaydet = async () => {
    try {
      if (modal === 'yeni') {
        await axios.post(`${API}/api/admin/kategoriler`, form, { withCredentials: true })
      } else {
        await axios.put(`${API}/api/admin/kategoriler/${modal.id}`, form, { withCredentials: true })
      }
      setModal(null)
      yukle()
    } catch (e) {
      alert('İşlem başarısız')
    }
  }

  const sil = async (id, ad) => {
    if (!confirm(`"${ad}" kategorisini silmek istediğinize emin misiniz?\nBu kategorideki ustalar etkilenebilir.`)) return
    try {
      await axios.delete(`${API}/api/admin/kategoriler/${id}`, { withCredentials: true })
      yukle()
    } catch (e) {
      alert('Silinemedi')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kategori Yönetimi</h2>
          <p className="text-gray-500 text-sm">{kategoriler.length} kategori</p>
        </div>
        <button
          onClick={() => ac('yeni')}
          className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#16213e]"
        >
          <Plus size={16} /> Yeni Kategori
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">İkon</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Ad</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Usta Sayısı</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Durum</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {kategoriler.map(k => (
                <tr key={k.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-2xl">{k.ikon}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{k.ad}</td>
                  <td className="px-4 py-3 text-gray-600">{k.usta_sayisi}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${k.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {k.aktif ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => ac(k)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500"><Pencil size={14} /></button>
                      <button onClick={() => sil(k.id, k.ad)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{modal === 'yeni' ? 'Yeni Kategori' : 'Kategori Düzenle'}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İkon (emoji)</label>
                <input
                  value={form.ikon}
                  onChange={e => setForm(p => ({ ...p, ikon: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-2xl"
                  maxLength={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Adı *</label>
                <input
                  value={form.ad}
                  onChange={e => setForm(p => ({ ...p, ad: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1e3a5f]"
                  placeholder="örn: Elektrikçi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={form.aciklama}
                  onChange={e => setForm(p => ({ ...p, aciklama: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1e3a5f]"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">İptal</button>
              <button onClick={kaydet} className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-lg text-sm hover:bg-[#16213e]">
                <Check size={14} className="inline mr-1" />Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
