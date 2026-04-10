import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Plus, Pencil, Trash2, X, Check, Tag } from 'lucide-react'

const API = 'http://localhost:5000'

export default function AdminKategoriler() {
  const [kategoriler, setKategoriler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [modal, setModal] = useState(null)
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
    } else {
      setForm({ ad: k.ad, ikon: k.ikon || '🔧', aciklama: k.aciklama || '' })
    }
    setModal(k)
  }

  const kaydet = async () => {
    if (!form.ad.trim()) return
    try {
      if (modal === 'yeni') {
        await axios.post(`${API}/api/admin/kategoriler`, form, { withCredentials: true })
      } else {
        await axios.put(`${API}/api/admin/kategoriler/${modal.id}`, form, { withCredentials: true })
      }
      setModal(null)
      yukle()
    } catch { alert('İşlem başarısız') }
  }

  const sil = async (id, ad) => {
    if (!confirm(`"${ad}" kategorisini silmek istediğinize emin misiniz?`)) return
    try {
      await axios.delete(`${API}/api/admin/kategoriler/${id}`, { withCredentials: true })
      yukle()
    } catch { alert('Silinemedi') }
  }

  // Gruplara göre organize et
  const gruplar = kategoriler.reduce((acc, k) => {
    const grup = k.grup || 'Diğer'
    if (!acc[grup]) acc[grup] = []
    acc[grup].push(k)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Kategori Yönetimi</h2>
          <p className="text-gray-500 text-sm">{kategoriler.length} kategori</p>
        </div>
        <button
          onClick={() => ac('yeni')}
          className="flex items-center gap-2 bg-[#0052CC] hover:bg-[#0040A3] text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
        >
          <Plus size={16} /> Yeni Kategori
        </button>
      </div>

      {yukleniyor ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
        </div>
      ) : (
        Object.entries(gruplar).map(([grup, items]) => (
          <div key={grup} className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
            <div className="bg-[#F8F9FA] border-b border-[#C8CDD4] px-4 py-2.5 flex items-center gap-2">
              <Tag size={14} className="text-[#0052CC]" />
              <span className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">{grup}</span>
              <span className="ml-auto text-xs text-gray-400">{items.length} kategori</span>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-[#F0F4F8]">
                {items.map(k => (
                  <tr key={k.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="px-4 py-3 text-xl w-12">{k.ikon}</td>
                    <td className="px-4 py-3 font-semibold text-[#1e293b]">{k.ad}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{k.aciklama}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{k.usta_sayisi} usta</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${k.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {k.aktif ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => ac(k)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"><Pencil size={13} /></button>
                        <button onClick={() => sil(k.id, k.ad)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white border border-[#C8CDD4] rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#C8CDD4]">
              <h3 className="font-bold text-[#1e293b]">{modal === 'yeni' ? 'Yeni Kategori Ekle' : 'Kategori Düzenle'}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">İkon (emoji)</label>
                <input
                  value={form.ikon}
                  onChange={e => setForm(p => ({ ...p, ikon: e.target.value }))}
                  className="w-full border border-[#C8CDD4] rounded-lg px-3 py-2.5 text-2xl focus:outline-none focus:border-[#0052CC] bg-[#F8F9FA]"
                  maxLength={4}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kategori Adı *</label>
                <input
                  value={form.ad}
                  onChange={e => setForm(p => ({ ...p, ad: e.target.value }))}
                  className="w-full border border-[#C8CDD4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20 bg-[#F8F9FA]"
                  placeholder="örn: Elektrikçi"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Açıklama</label>
                <textarea
                  value={form.aciklama}
                  onChange={e => setForm(p => ({ ...p, aciklama: e.target.value }))}
                  rows={3}
                  className="w-full border border-[#C8CDD4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] bg-[#F8F9FA] resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 px-6 pb-5">
              <button onClick={() => setModal(null)} className="flex-1 border border-[#C8CDD4] text-gray-600 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">İptal</button>
              <button onClick={kaydet} className="flex-1 bg-[#0052CC] hover:bg-[#0040A3] text-white py-2.5 rounded-lg text-sm font-semibold transition">
                <Check size={14} className="inline mr-1.5" />Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
