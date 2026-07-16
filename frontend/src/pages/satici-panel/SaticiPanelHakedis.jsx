import { useState, useEffect } from 'react'
import axios from 'axios'
import { AlertCircle, Clock, CheckCircle, BadgeDollarSign } from 'lucide-react'
import API from '../../config.js'

const DURUM_MAP = {
  bekliyor:        { label: 'Bekliyor',        bg: 'bg-orange-100', text: 'text-orange-700' },
  kullanilabilir:  { label: 'Kullanılabilir',  bg: 'bg-green-100',  text: 'text-green-700' },
  odendi:          { label: 'Ödendi',          bg: 'bg-blue-100',   text: 'text-blue-700' },
}

function DurumRozet({ durum }) {
  const d = DURUM_MAP[durum] || DURUM_MAP.bekliyor
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${d.bg} ${d.text}`}>
      {d.label}
    </span>
  )
}

export default function SaticiPanelHakedis() {
  const [bakiye, setBakiye] = useState(null)
  const [hakedisler, setHakedisler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [toast, setToast] = useState(null)

  const goster = (mesaj, renk = 'green') => {
    setToast({ mesaj, renk })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/satici-panel/bakiye`, { withCredentials: true }),
      axios.get(`${API}/api/satici-panel/hakedisler`, { withCredentials: true }),
    ]).then(([r1, r2]) => {
      setBakiye(r1.data)
      setHakedisler(r2.data.hakedisler || [])
    }).catch(() => {}).finally(() => setYukleniyor(false))
  }, [])

  const formatTL = (val) =>
    (val ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'

  const fmtTarih = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

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

  const bekleyen       = bakiye?.bekleyen_tl       ?? 0
  const kullanilabilir = bakiye?.kullanilabilir_tl ?? 0
  const odenmis        = bakiye?.odenmis_tl        ?? 0

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
          disabled={kullanilabilir <= 0}
          title={kullanilabilir <= 0 ? 'Çekilebilir bakiye bulunmuyor' : ''}
          className="bg-[#0052CC] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0047b3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <BadgeDollarSign size={16} className="text-[#0052CC]" />
          <h2 className="text-sm font-semibold text-gray-700">Hakediş Geçmişi</h2>
          {hakedisler.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">{hakedisler.length} kayıt</span>
          )}
        </div>
        {hakedisler.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Henüz tamamlanmış sipariş yok.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Sipariş', 'Brüt', 'Komisyon', 'Net', 'Durum', 'Kullanılabilir', 'Ödeme'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {hakedisler.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-[#0052CC] text-xs">
                      #{h.siparis_no || h.siparis_id}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatTL(h.brut_tl)}</td>
                    <td className="px-4 py-3 text-red-500">-{formatTL(h.komisyon_tl)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatTL(h.net_tl)}</td>
                    <td className="px-4 py-3"><DurumRozet durum={h.durum} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtTarih(h.kullanilabilir_tarih)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtTarih(h.odeme_tarihi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
