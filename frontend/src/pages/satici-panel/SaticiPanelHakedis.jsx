import { useState, useEffect } from 'react'
import axios from 'axios'
import { AlertCircle } from 'lucide-react'
import API from '../../config.js'

export default function SaticiPanelHakedis() {
  const [bakiye, setBakiye] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [toast, setToast] = useState(null)

  const goster = (mesaj, renk = 'green') => {
    setToast({ mesaj, renk })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    axios.get(`${API}/api/satici-panel/bakiye`, { withCredentials: true })
      .then(r => setBakiye(r.data))
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [])

  const formatTL = (val) =>
    (val ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'

  const odemeIstek = () => {
    goster('Talep alındı, ekibimiz sizinle iletişime geçecek.')
  }

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
      </div>
    )
  }

  const bekleyen    = bakiye?.bekleyen    ?? 0
  const kullanilabilir = bakiye?.kullanilabilir ?? 0
  const odenmis    = bakiye?.odenmis     ?? 0

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg transition-all ${
          toast.renk === 'red' ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {toast.mesaj}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Hakedişler</h1>
        <button
          onClick={odemeIstek}
          className="bg-[#0052CC] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0047b3] transition-colors"
        >
          Ödeme Talep Et
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Bekleyen</p>
          <p className="text-2xl font-bold text-orange-600">{formatTL(bekleyen)}</p>
          <p className="text-xs text-gray-400 mt-1">Teslim edildi, bekleme süresi dolmadı</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Kullanılabilir</p>
          <p className="text-2xl font-bold text-green-600">{formatTL(kullanilabilir)}</p>
          <p className="text-xs text-gray-400 mt-1">Çekilebilir tutar</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Ödenmiş</p>
          <p className="text-2xl font-bold text-blue-600">{formatTL(odenmis)}</p>
          <p className="text-xs text-gray-400 mt-1">Toplam aktarılan</p>
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3">
        <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Hakedişler sipariş tamamlanmasından <strong>14 gün</strong> sonra kullanılabilir olur.
          CardPlus ödeme entegrasyonu tamamlandığında otomatik transfer aktif edilecektir.
        </p>
      </div>

      {/* Hakediş durumu açıklaması */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">Hakediş Durumu Hakkında</h2>
        <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
          <li><span className="font-medium text-orange-600">Bekleyen:</span> Sipariş teslim edildi ancak 14 günlük bekleme süresi henüz dolmadı.</li>
          <li><span className="font-medium text-green-600">Kullanılabilir:</span> Bekleme süresi dolan, çekim talebinde bulunulabilir tutar.</li>
        </ul>
      </div>

      {/* Son Hakedişler Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Son Hakedişler</h2>
        </div>
        <div className="text-center py-12 text-gray-400 text-sm">
          Henüz tamamlanmış ödeme yok.
        </div>
      </div>
    </div>
  )
}
