import { useEffect, useState } from 'react'
import axios from 'axios'
import { RefreshCw, ShieldAlert } from 'lucide-react'

const API = 'http://localhost:5000'

const islemRenk = (islem) => {
  if (islem.includes('SİL') || islem.includes('REDDET')) return 'text-red-600 bg-red-50'
  if (islem.includes('ONAYLA')) return 'text-green-700 bg-green-50'
  if (islem.includes('GİRİŞ')) return 'text-blue-600 bg-blue-50'
  if (islem.includes('GÜNCELLE')) return 'text-orange-600 bg-orange-50'
  return 'text-gray-600 bg-gray-100'
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
          <h2 className="text-2xl font-bold text-gray-800">İşlem Logu</h2>
          <p className="text-gray-500 text-sm">Son 200 işlem</p>
        </div>
        <button onClick={yukle} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1e3a5f]">
          <RefreshCw size={16} /> Yenile
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
          </div>
        ) : loglar.length === 0 ? (
          <div className="text-center text-gray-400 py-16 flex flex-col items-center gap-2">
            <ShieldAlert size={40} className="text-gray-300" />
            Henüz işlem kaydı yok
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {loglar.map(l => (
              <div key={l.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50">
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium shrink-0 ${islemRenk(l.islem)}`}>
                  {l.islem}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{l.detay || '—'}</p>
                  <p className="text-xs text-gray-400">{l.kullanici_email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">{l.tarih}</p>
                  <p className="text-xs text-gray-300">{l.ip}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
