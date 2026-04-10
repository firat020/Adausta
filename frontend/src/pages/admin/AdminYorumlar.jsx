import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Check, Trash2, RefreshCw, Star } from 'lucide-react'

const API = 'http://localhost:5000'

const FILTRELER = [
  { key: 'hepsi', label: 'Hepsi' },
  { key: 'bekleyen', label: 'Onay Bekleyen' },
  { key: 'onaylandi', label: 'Onaylı' },
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
        if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return
        await axios.delete(`${API}/api/admin/yorumlar/${id}`, { withCredentials: true })
      } else {
        await axios.post(`${API}/api/admin/yorumlar/${id}/onayla`, {}, { withCredentials: true })
      }
      yukle()
    } catch (e) {
      alert('İşlem başarısız')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Yorum Yönetimi</h2>
          <p className="text-gray-500 text-sm">{yorumlar.length} kayıt</p>
        </div>
        <button onClick={yukle} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1e3a5f]">
          <RefreshCw size={16} /> Yenile
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex gap-2">
        {FILTRELER.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltre(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filtre === f.key ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
          </div>
        ) : yorumlar.length === 0 ? (
          <div className="text-center text-gray-400 py-16">Yorum bulunamadı</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {yorumlar.map(y => (
              <div key={y.id} className="px-5 py-4 hover:bg-gray-50 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">{y.musteri_adi}</span>
                    <div className="flex items-center gap-0.5 text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < y.puan ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${y.onaylanmis ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {y.onaylanmis ? 'Onaylı' : 'Bekliyor'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{y.yorum || <em className="text-gray-400">Yorum yazılmamış</em>}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Usta: <span className="font-medium">{y.usta_ad}</span> · {y.tarih}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!y.onaylanmis && (
                    <button onClick={() => islem(y.id, 'onayla')} title="Onayla"
                      className="p-1.5 rounded hover:bg-green-50 text-green-600">
                      <Check size={16} />
                    </button>
                  )}
                  <button onClick={() => islem(y.id, 'sil')} title="Sil"
                    className="p-1.5 rounded hover:bg-red-50 text-red-500">
                    <Trash2 size={16} />
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
