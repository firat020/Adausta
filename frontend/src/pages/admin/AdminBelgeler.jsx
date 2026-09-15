import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { FileCheck2, Check, X, RefreshCw, ExternalLink } from 'lucide-react'
import API from '../../config.js'

const TUR_ETIKET = {
  kimlik: 'Kimlik Belgesi',
  ustalik_belgesi: 'Ustalık Belgesi',
  diger: 'Diğer',
}

export default function AdminBelgeler() {
  const [belgeler, setBelgeler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [redNotu, setRedNotu] = useState({})

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/belgeler/bekleyen`, { withCredentials: true })
      setBelgeler(r.data.belgeler || [])
    } catch { setBelgeler([]) }
    setYukleniyor(false)
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const onayla = async (id) => {
    try {
      await axios.post(`${API}/api/admin/belgeler/${id}/onayla`, {}, { withCredentials: true })
      yukle()
    } catch { alert('İşlem başarısız') }
  }

  const reddet = async (id) => {
    try {
      await axios.post(`${API}/api/admin/belgeler/${id}/reddet`, { admin_notu: redNotu[id] || '' }, { withCredentials: true })
      yukle()
    } catch { alert('İşlem başarısız') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Belge Onayı</h2>
          <p className="text-gray-500 text-sm">{belgeler.length} bekleyen kimlik / ustalık belgesi</p>
        </div>
        <button onClick={yukle} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052CC] transition">
          <RefreshCw size={15} /> Yenile
        </button>
      </div>

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : belgeler.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-2 text-gray-400">
            <FileCheck2 size={36} className="text-gray-200" />
            <span className="text-sm">Bekleyen belge yok</span>
          </div>
        ) : (
          <div className="divide-y divide-[#F0F4F8]">
            {belgeler.map(b => (
              <div key={b.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#1e293b] text-sm">{b.usta_ad}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#F0F6FF] text-[#0052CC] font-medium">
                      {TUR_ETIKET[b.tur] || b.tur}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{b.olusturma}</p>
                  <a href={`${API}${b.url}`} target="_blank" rel="noreferrer"
                     className="inline-flex items-center gap-1 text-xs text-[#0052CC] hover:underline mt-1.5">
                    <ExternalLink size={12} /> Belgeyi görüntüle
                  </a>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Red nedeni (opsiyonel)"
                    value={redNotu[b.id] || ''}
                    onChange={e => setRedNotu(m => ({ ...m, [b.id]: e.target.value }))}
                    className="w-40 px-2.5 py-1.5 rounded-lg border border-[#E0E0E0] text-xs focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                  />
                  <button
                    onClick={() => onayla(b.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition"
                  >
                    <Check size={13} /> Onayla
                  </button>
                  <button
                    onClick={() => reddet(b.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 transition"
                  >
                    <X size={13} /> Reddet
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
