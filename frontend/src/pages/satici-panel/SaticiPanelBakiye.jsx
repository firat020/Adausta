import { useState, useEffect } from 'react'
import axios from 'axios'
import { Wallet, Clock, CheckCircle, Info } from 'lucide-react'
import API from '../../config.js'

export default function SaticiPanelBakiye() {
  const [bakiye, setBakiye] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState(null)

  useEffect(() => {
    axios.get(`${API}/api/satici-panel/bakiye`, { withCredentials: true })
      .then(r => {
        setBakiye(r.data)
        setYukleniyor(false)
      })
      .catch(() => {
        setHata('Bakiye bilgileri yüklenemedi.')
        setYukleniyor(false)
      })
  }, [])

  const formatTL = (val) =>
    (val ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0052CC]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Bakiyem</h1>

      {hata && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{hata}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
          <div className="bg-yellow-100 w-10 h-10 rounded-xl flex items-center justify-center">
            <Clock size={20} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Bekleyen</p>
            <p className="text-xl font-bold text-gray-900">{formatTL(bakiye?.bekleyen)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
          <div className="bg-blue-100 w-10 h-10 rounded-xl flex items-center justify-center">
            <Wallet size={20} className="text-[#0052CC]" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Kullanılabilir</p>
            <p className="text-xl font-bold text-gray-900">{formatTL(bakiye?.kullanilabilir)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
          <div className="bg-green-100 w-10 h-10 rounded-xl flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Ödenmiş</p>
            <p className="text-xl font-bold text-gray-900">{formatTL(bakiye?.odenmis)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Hakedişler sipariş tamamlandıktan sonra hesabınıza aktarılır.
          </p>
        </div>
        <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <Info size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">
            Ödeme transfer süreci AdminUsta operasyon ekibi tarafından yönetilmektedir.
          </p>
        </div>
      </div>
    </div>
  )
}
