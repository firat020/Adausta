import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import api from '../../api'

const DURUM_RENK = {
  bekliyor:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  kabul:      'bg-blue-100 text-blue-700 border-blue-200',
  tamamlandi: 'bg-green-100 text-green-700 border-green-200',
  red:        'bg-red-100 text-red-700 border-red-200',
}
const DURUM_LABEL = {
  bekliyor: 'Bekliyor', kabul: 'Kabul Edildi',
  tamamlandi: 'Tamamlandı', red: 'Reddedildi',
}

function StatKart({ ikon: Icon, renk, baslik, deger, alt }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{baslik}</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{deger}</p>
          {alt && <p className="text-xs text-gray-400 mt-1">{alt}</p>}
        </div>
        <div className={`w-11 h-11 ${renk} rounded-xl flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export default function MusteriPanelDashboard() {
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/musteri/panel')
      .then(r => setVeri(r.data))
      .finally(() => setYukleniyor(false))
  }, [])

  if (yukleniyor) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )

  if (!veri) return null
  const s = veri.istatistik

  const kartlar = [
    { ikon: ClipboardList, renk: 'bg-blue-500',   baslik: 'Toplam Talep',   deger: s.toplam,     alt: 'Tüm zamanlar' },
    { ikon: Clock,         renk: 'bg-yellow-500', baslik: 'Bekleyen',       deger: s.bekleyen,   alt: 'Yanıt bekleniyor' },
    { ikon: CheckCircle,   renk: 'bg-green-500',  baslik: 'Tamamlanan',     deger: s.tamamlandi, alt: 'Başarıyla yapıldı' },
    { ikon: XCircle,       renk: 'bg-red-400',    baslik: 'Reddedilen',     deger: s.reddedildi, alt: 'İptal / Red' },
  ]

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Genel Bakış</h1>
        <p className="text-sm text-gray-500 mt-1">
          Merhaba,{' '}
          <span className="font-semibold text-blue-600">
            {veri.musteri.ad
              ? `${veri.musteri.ad} ${veri.musteri.soyad}`.trim()
              : veri.musteri.email}
          </span>
        </p>
      </div>

      {/* Stat kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kartlar.map((k, i) => <StatKart key={i} {...k} />)}
      </div>

      {/* Son talepler */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" />
            <h2 className="font-bold text-gray-800">Son Talepler</h2>
          </div>
          <button
            onClick={() => navigate('/musteri/panel/talepler')}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Tümünü Gör
          </button>
        </div>

        {veri.son_talepler.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <ClipboardList size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Henüz iş talebiniz yok</p>
            <button
              onClick={() => navigate('/ustalar')}
              className="mt-3 text-blue-600 text-sm font-semibold hover:underline"
            >
              Usta Bul →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {veri.son_talepler.map(t => (
              <div key={t.id} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{t.baslik}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.usta_ad} · {t.usta_kategori} · {t.olusturma}
                  </p>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg border ${DURUM_RENK[t.durum]}`}>
                  {DURUM_LABEL[t.durum]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
