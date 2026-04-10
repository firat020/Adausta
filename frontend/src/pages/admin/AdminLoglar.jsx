import { useEffect, useState } from 'react'
import axios from 'axios'
import { RefreshCw, ShieldAlert } from 'lucide-react'

const API = 'http://localhost:5000'

const islemStyle = (islem) => {
  if (islem.includes('SİL') || islem.includes('REDDET')) return 'text-red-600 bg-red-50 border-red-200'
  if (islem.includes('ONAYLA')) return 'text-green-700 bg-green-50 border-green-200'
  if (islem.includes('GİRİŞ')) return 'text-blue-700 bg-blue-50 border-blue-200'
  if (islem.includes('GUNCELLE') || islem.includes('GÜNCELLE')) return 'text-orange-600 bg-orange-50 border-orange-200'
  return 'text-gray-600 bg-gray-100 border-gray-200'
}

export default function AdminLoglar() {
  const [loglar, setLoglar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/log`, { withCredentials: true })
      setLoglar(r.data.loglar)
    } catch (e) { console.error(e) }
    setYukleniyor(false)
  }

  useEffect(() => { yukle() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">İşlem Logu</h2>
          <p className="text-gray-500 text-sm">Son 200 işlem</p>
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
        ) : loglar.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-3 text-gray-400">
            <ShieldAlert size={40} className="text-gray-200" />
            <span className="text-sm">Henüz işlem kaydı yok</span>
          </div>
        ) : (
          <div className="divide-y divide-[#F0F4F8]">
            {loglar.map(l => (
              <div key={l.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-[#F8FAFC] transition">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono border shrink-0 ${islemStyle(l.islem)}`}>
                  {l.islem}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1e293b] truncate">{l.detay || '—'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{l.kullanici_email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-gray-500">{l.tarih}</p>
                  <p className="text-[10px] text-gray-300 font-mono">{l.ip}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
