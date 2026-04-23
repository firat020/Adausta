import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Clock, CheckCircle, Building2, ExternalLink } from 'lucide-react'
import { sirketPanelDashboard } from '../../api'

export default function SirketPanelDashboard() {
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    sirketPanelDashboard()
      .then(r => setVeri(r.data))
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [])

  if (yukleniyor) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )

  if (!veri) return null

  const { sirket, istatistik } = veri

  const statKartlar = [
    {
      label: 'Toplam Talep',
      deger: istatistik.toplam_talep,
      ikon: ClipboardList,
      renk: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Bekleyen',
      deger: istatistik.bekleyen_talep,
      ikon: Clock,
      renk: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Tamamlanan',
      deger: istatistik.toplam_talep - istatistik.bekleyen_talep,
      ikon: CheckCircle,
      renk: 'text-green-600',
      bg: 'bg-green-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Karşılama */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold mb-1">Hoş geldiniz 👋</h1>
            <p className="text-indigo-200 text-sm">{sirket.sirket_adi}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <Building2 size={24} />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Link to={`/sirket/${sirket.id}`} target="_blank"
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
            <ExternalLink size={12} /> Profili Görüntüle
          </Link>
          <Link to="/sirket/panel/profil"
            className="flex items-center gap-1.5 bg-white text-indigo-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
            Profili Düzenle
          </Link>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statKartlar.map(({ label, deger, ikon: Ikon, renk, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                <Ikon size={18} className={renk} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{deger}</p>
          </div>
        ))}
      </div>

      {/* Hızlı erişim */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">Hızlı Erişim</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/sirket/panel/talepler"
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <ClipboardList size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700">İş Talepleri</p>
              {istatistik.bekleyen_talep > 0 && (
                <p className="text-xs text-orange-600">{istatistik.bekleyen_talep} bekliyor</p>
              )}
            </div>
          </Link>
          <Link to="/sirket/panel/profil"
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700">Şirket Profilim</p>
              <p className="text-xs text-gray-400">Bilgilerini güncelle</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
