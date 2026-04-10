import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Check, Trash2, RefreshCw, Star, MessageSquare } from 'lucide-react'

const API = 'http://localhost:5000'

const FILTRELER = [
  { key: 'bekleyen', label: 'Bekleyen' },
  { key: 'onaylandi', label: 'Onaylı' },
  { key: 'hepsi', label: 'Hepsi' },
]

export default function AdminYorumlar() {
  const [yorumlar, setYorumlar] = useState([])
  const [filtre, setFiltre] = useState('bekleyen')
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/yorumlar`, { params: { filtre }, withCredentials: true })
      setYorumlar(r.data.yorumlar)
    } catch (e) { console.error(e) }
    setYukleniyor(false)
  }, [filtre])

  useEffect(() => { yukle() }, [yukle])

  const islem = async (id, tip) => {
    try {
      if (tip === 'sil') {
        if (!confirm('Bu yorumu silmek istiyor musunuz?')) return
        await axios.delete(`${API}/api/admin/yorumlar/${id}`, { withCredentials: true })
      } else {
        await axios.post(`${API}/api/admin/yorumlar/${id}/onayla`, {}, { withCredentials: true })
      }
      yukle()
    } catch { alert('İşlem başarısız') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Yorum Yönetimi</h2>
          <p className="text-gray-500 text-sm">{yorumlar.length} kayıt</p>
        </div>
        <button onClick={yukle} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052CC] transition">
          <RefreshCw size={15} /> Yenile
        </button>
      </div>

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm p-4 flex gap-2">
        {FILTRELER.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltre(f.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
              filtre === f.key
                ? 'bg-[#003d99] text-white border-[#0052CC]'
                : 'bg-[#F8F9FA] text-gray-600 border-[#E0E0E0] hover:border-[#0052CC] hover:text-[#0052CC]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : yorumlar.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-2 text-gray-400">
            <MessageSquare size={36} className="text-gray-200" />
            <span className="text-sm">Yorum bulunamadı</span>
          </div>
        ) : (
          <div className="divide-y divide-[#F0F4F8]">
            {yorumlar.map(y => (
              <div key={y.id} className="px-5 py-4 flex items-start gap-4 hover:bg-[#F8FAFC] transition">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-[#1e293b] text-sm">{y.musteri_adi}</span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={11} fill={i < y.puan ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${y.onaylanmis ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {y.onaylanmis ? 'Onaylı' : 'Bekliyor'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {y.yorum || <em className="text-gray-300">Yorum metni yok</em>}
                  </p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Usta: <span className="font-semibold text-gray-500">{y.usta_ad}</span> · {y.tarih}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!y.onaylanmis && (
                    <button onClick={() => islem(y.id, 'onayla')} title="Onayla"
                      className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition border border-transparent hover:border-green-200">
                      <Check size={15} />
                    </button>
                  )}
                  <button onClick={() => islem(y.id, 'sil')} title="Sil"
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition border border-transparent hover:border-red-200">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
