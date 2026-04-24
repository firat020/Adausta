import { useState, useEffect } from 'react'
import { BarChart2, Phone, MessageCircle, Eye, Star, TrendingUp } from 'lucide-react'
import { ustaPanelIstatistikler } from '../../api'

const ARALIKLAR = [
  { val: 7,  label: '7 Gün' },
  { val: 30, label: '30 Gün' },
  { val: 90, label: '90 Gün' },
]

function MiniBar({ deger, max, renk }) {
  const yuzde = max > 0 ? (deger / max) * 100 : 0
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${renk} rounded-full transition-all`} style={{ width: `${yuzde}%` }} />
    </div>
  )
}

export default function UstaPanelIstatistik() {
  const [veri, setVeri] = useState(null)
  const [aralik, setAralik] = useState(30)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    setYukleniyor(true)
    ustaPanelIstatistikler(aralik)
      .then(r => setVeri(r.data))
      .finally(() => setYukleniyor(false))
  }, [aralik])

  if (yukleniyor) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }
  if (!veri) return null

  const maxIletisim = Math.max(...veri.gunluk_iletisim.map(g => g.ara + g.whatsapp + g.goruntule), 1)
  const dd = veri.durum_dagilim

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">İstatistikler</h1>
          <p className="text-sm text-gray-500 mt-1">Profil ve talep analitiği</p>
        </div>
        <div className="flex gap-2">
          {ARALIKLAR.map(a => (
            <button
              key={a.val}
              onClick={() => setAralik(a.val)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                aralik === a.val
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Puan & Yorumlar */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Star size={28} className="text-orange-400 mx-auto mb-2" />
          <p className="text-4xl font-extrabold text-gray-900">{veri.ort_puan || '-'}</p>
          <p className="text-sm text-gray-400 mt-1">Ortalama Puan</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <TrendingUp size={28} className="text-blue-500 mx-auto mb-2" />
          <p className="text-4xl font-extrabold text-gray-900">{veri.toplam_yorum}</p>
          <p className="text-sm text-gray-400 mt-1">Toplam Yorum</p>
        </div>
      </div>

      {/* İletişim trendi */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart2 size={18} className="text-blue-600" /> Günlük İletişim Trendi
        </h2>
        <div className="overflow-x-auto">
          <div className="flex items-end gap-1" style={{ minWidth: aralik > 30 ? 600 : 'auto', height: 100 }}>
            {veri.gunluk_iletisim.map((g, i) => {
              const toplam = g.ara + g.whatsapp + g.goruntule
              const yuzde = (toplam / maxIletisim) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative" title={`${g.gun}: ${toplam}`}>
                  <div className="w-full bg-gray-100 rounded-t overflow-hidden" style={{ height: 80 }}>
                    <div
                      className="w-full bg-blue-500 group-hover:bg-blue-600 rounded-t transition-all"
                      style={{ height: `${yuzde}%`, minHeight: toplam > 0 ? 4 : 0 }}
                    />
                  </div>
                  {aralik <= 30 && (
                    <span className="text-[9px] text-gray-400 rotate-45 origin-left">{g.gun}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1.5 text-blue-600"><Phone size={12} /> Arama</span>
          <span className="flex items-center gap-1.5 text-green-600"><MessageCircle size={12} /> WhatsApp</span>
          <span className="flex items-center gap-1.5 text-purple-500"><Eye size={12} /> Görüntüleme</span>
        </div>
      </div>

      {/* Talep durum dağılımı */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">Talep Durum Dağılımı</h2>
        <div className="space-y-3">
          {[
            { key: 'bekliyor',   label: 'Bekleyen',    renk: 'bg-yellow-400' },
            { key: 'kabul',      label: 'Kabul',       renk: 'bg-blue-500' },
            { key: 'tamamlandi', label: 'Tamamlanan',  renk: 'bg-green-500' },
            { key: 'red',        label: 'Reddedilen',  renk: 'bg-red-400' },
          ].map(({ key, label, renk }) => {
            const toplam = Object.values(dd).reduce((a, b) => a + b, 0)
            return (
              <div key={key} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${renk} shrink-0`} />
                <span className="text-sm text-gray-600 w-24">{label}</span>
                <div className="flex-1">
                  <MiniBar deger={dd[key]} max={toplam} renk={renk} />
                </div>
                <span className="text-sm font-bold text-gray-700 w-8 text-right">{dd[key]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Puan dağılımı */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Star size={18} className="text-orange-400" /> Puan Dağılımı
        </h2>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(p => {
            const sayi = veri.puan_dagilim[p] || 0
            const max = Math.max(...Object.values(veri.puan_dagilim), 1)
            return (
              <div key={p} className="flex items-center gap-3">
                <div className="flex items-center gap-0.5 w-16">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className={i < p ? 'text-orange-400 fill-orange-400' : 'text-gray-200 fill-gray-200'} />
                  ))}
                </div>
                <div className="flex-1">
                  <MiniBar deger={sayi} max={max} renk="bg-orange-400" />
                </div>
                <span className="text-sm font-bold text-gray-600 w-6 text-right">{sayi}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
