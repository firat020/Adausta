import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList, Users, Star, Eye, Phone, MessageCircle,
  TrendingUp, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import { ustaPanelDashboard } from '../../api'

const DURUM_RENK = {
  bekliyor: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  kabul:    'bg-blue-100 text-blue-700 border-blue-200',
  tamamlandi: 'bg-green-100 text-green-700 border-green-200',
  red:      'bg-red-100 text-red-700 border-red-200',
}
const DURUM_LABEL = {
  bekliyor: 'Bekliyor', kabul: 'Kabul Edildi',
  tamamlandi: 'Tamamlandı', red: 'Reddedildi'
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

export default function UstaPanelDashboard() {
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    ustaPanelDashboard()
      .then(r => setVeri(r.data))
      .finally(() => setYukleniyor(false))
  }, [])

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!veri) return null
  const s = veri.istatistik

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Genel Bakış</h1>
        <p className="text-sm text-gray-500 mt-1">
          Merhaba, <span className="font-semibold text-blue-600">{veri.usta.ad} {veri.usta.soyad}</span>
          {!veri.usta.onaylanmis && (
            <span className="ml-2 inline-flex items-center gap-1 text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full text-xs font-medium">
              <AlertCircle size={12} /> Hesabınız onay bekliyor
            </span>
          )}
        </p>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatKart ikon={ClipboardList} renk="bg-blue-500"  baslik="Toplam Talep"    deger={s.toplam_talep}   alt={`Bu ay: ${s.bu_ay_talep}`} />
        <StatKart ikon={Clock}         renk="bg-yellow-500" baslik="Bekleyen"        deger={s.bekleyen}       alt="Yanıt bekliyor" />
        <StatKart ikon={CheckCircle}   renk="bg-green-500"  baslik="Tamamlanan"      deger={s.tamamlandi}     alt="Başarıyla yapıldı" />
        <StatKart ikon={Star}          renk="bg-orange-400" baslik="Ortalama Puan"   deger={s.puan || '-'}    alt={`${s.toplam_yorum} yorum`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatKart ikon={Eye}           renk="bg-purple-500" baslik="Profil Görüntüleme (30g)" deger={s.goruntuleme_30gun} />
        <StatKart ikon={Phone}         renk="bg-blue-600"   baslik="Arama (30g)"    deger={s.arama_30gun} />
        <StatKart ikon={MessageCircle} renk="bg-green-600"  baslik="WhatsApp (30g)" deger={s.whatsapp_30gun} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Günlük talep grafiği */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-blue-600" />
            <h2 className="font-bold text-gray-800">Son 7 Gün — Talep</h2>
          </div>
          <div className="flex items-end gap-2 h-32">
            {veri.gunluk_talep.map((g, i) => {
              const max = Math.max(...veri.gunluk_talep.map(x => x.sayi), 1)
              const yuzde = (g.sayi / max) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-gray-600">{g.sayi > 0 ? g.sayi : ''}</span>
                  <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: 80 }}>
                    <div
                      className="w-full bg-blue-500 rounded-t-lg transition-all"
                      style={{ height: `${yuzde}%`, minHeight: g.sayi > 0 ? 8 : 0 }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{g.gun}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Son talepler */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-blue-600" />
              <h2 className="font-bold text-gray-800">Son Talepler</h2>
            </div>
            <button
              onClick={() => navigate('/usta/panel/talepler')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Tümünü Gör
            </button>
          </div>

          {veri.son_talepler.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Henüz iş talebi yok
            </div>
          ) : (
            <div className="space-y-3">
              {veri.son_talepler.map(t => (
                <div key={t.id} className="flex items-start justify-between gap-2 p-3 bg-gray-50 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{t.baslik}</p>
                    <p className="text-xs text-gray-500">{t.musteri_ad} · {t.olusturma}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-lg border ${DURUM_RENK[t.durum]}`}>
                    {DURUM_LABEL[t.durum]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
