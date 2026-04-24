import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList, Users, Star, Eye, Phone, MessageCircle,
  TrendingUp, Clock, CheckCircle, AlertCircle, X,
  Info
} from 'lucide-react'
import { ustaPanelDashboard } from '../../api'

const DURUM_RENK = {
  bekliyor:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  kabul:       'bg-blue-100 text-blue-700 border-blue-200',
  tamamlandi:  'bg-green-100 text-green-700 border-green-200',
  red:         'bg-red-100 text-red-700 border-red-200',
}
const DURUM_LABEL = {
  bekliyor: 'Bekliyor', kabul: 'Kabul Edildi',
  tamamlandi: 'Tamamlandı', red: 'Reddedildi'
}

/* ── Popup bileşeni ─────────────────────────────────────────── */
function StatPopup({ popup, onKapat }) {
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onKapat() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onKapat])

  if (!popup) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.25)' }}>
      <div ref={ref} className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-xs p-5 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Kapat */}
        <button onClick={onKapat}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
          <X size={15} />
        </button>

        {/* Başlık */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 ${popup.renk} rounded-xl flex items-center justify-center`}>
            <popup.ikon size={18} className="text-white" />
          </div>
          <div>
            <p className="font-extrabold text-gray-900 text-sm">{popup.baslik}</p>
            <p className="text-xs text-gray-400">{popup.altBaslik}</p>
          </div>
        </div>

        {/* Ana değer */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-center">
          <p className="text-4xl font-black text-gray-900">{popup.deger}</p>
          {popup.degerAlt && <p className="text-xs text-gray-500 mt-1">{popup.degerAlt}</p>}
        </div>

        {/* Detay satırları */}
        {popup.detaylar && (
          <div className="space-y-2">
            {popup.detaylar.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${d.renk || 'bg-gray-300'}`} />
                  {d.label}
                </span>
                <span className="font-bold text-gray-800">{d.deger}</span>
              </div>
            ))}
          </div>
        )}

        {popup.aciklama && (
          <p className="text-xs text-gray-400 mt-4 flex items-start gap-1.5 bg-blue-50 rounded-xl px-3 py-2.5">
            <Info size={12} className="text-blue-400 shrink-0 mt-0.5" />
            {popup.aciklama}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Stat kart bileşeni ─────────────────────────────────────── */
function StatKart({ ikon: Icon, renk, baslik, deger, alt, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95 select-none"
    >
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

/* ── Ana bileşen ────────────────────────────────────────────── */
export default function UstaPanelDashboard() {
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [popup, setPopup] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    ustaPanelDashboard()
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
    {
      ikon: ClipboardList, renk: 'bg-blue-500',
      baslik: 'Toplam Talep', deger: s.toplam_talep, alt: `Bu ay: ${s.bu_ay_talep}`,
      popup: {
        baslik: 'Toplam Talep', altBaslik: 'Tüm zamanlar',
        deger: s.toplam_talep, degerAlt: `Bu ay ${s.bu_ay_talep} yeni talep`,
        detaylar: [
          { label: 'Bekleyen',    deger: s.bekleyen,    renk: 'bg-yellow-400' },
          { label: 'Tamamlanan',  deger: s.tamamlandi,  renk: 'bg-green-400' },
          { label: 'Bu ay',       deger: s.bu_ay_talep, renk: 'bg-blue-400' },
        ],
        aciklama: 'Müşterilerden gelen tüm iş taleplerinin toplamı.'
      }
    },
    {
      ikon: Clock, renk: 'bg-yellow-500',
      baslik: 'Bekleyen', deger: s.bekleyen, alt: 'Yanıt bekliyor',
      popup: {
        baslik: 'Bekleyen Talepler', altBaslik: 'Yanıt bekleniyor',
        deger: s.bekleyen, degerAlt: 'Henüz yanıtlanmamış',
        detaylar: [
          { label: 'Kabul edildi',   deger: s.toplam_talep - s.bekleyen - s.tamamlandi, renk: 'bg-blue-400' },
          { label: 'Tamamlandı',     deger: s.tamamlandi,  renk: 'bg-green-400' },
        ],
        aciklama: 'Bu taleplere hızlı yanıt vermek müşteri memnuniyetini artırır.'
      }
    },
    {
      ikon: CheckCircle, renk: 'bg-green-500',
      baslik: 'Tamamlanan', deger: s.tamamlandi, alt: 'Başarıyla yapıldı',
      popup: {
        baslik: 'Tamamlanan İşler', altBaslik: 'Başarıyla teslim edildi',
        deger: s.tamamlandi,
        degerAlt: s.toplam_talep > 0 ? `%${Math.round((s.tamamlandi / s.toplam_talep) * 100)} başarı oranı` : 'Henüz tamamlanan iş yok',
        aciklama: 'Tamamladığınız işler profilinizde olumlu etki bırakır.'
      }
    },
    {
      ikon: Star, renk: 'bg-orange-400',
      baslik: 'Ortalama Puan', deger: s.puan || '-', alt: `${s.toplam_yorum} yorum`,
      popup: {
        baslik: 'Ortalama Puan', altBaslik: 'Müşteri değerlendirmesi',
        deger: s.puan ? `${s.puan} / 5` : '-',
        degerAlt: `Toplam ${s.toplam_yorum} değerlendirme`,
        detaylar: [
          { label: 'Toplam yorum', deger: s.toplam_yorum, renk: 'bg-orange-400' },
        ],
        aciklama: '5 üzerinden puan ortalamanız. Yüksek puan daha fazla müşteri getirir.'
      }
    },
    {
      ikon: Eye, renk: 'bg-purple-500',
      baslik: 'Profil Görüntüleme (30g)', deger: s.goruntuleme_30gun,
      popup: {
        baslik: 'Profil Görüntüleme', altBaslik: 'Son 30 gün',
        deger: s.goruntuleme_30gun,
        degerAlt: 'kişi profilinizi inceledi',
        aciklama: 'Müşteriler profilinizi inceledi. Bu sayı ne kadar yüksek olursa o kadar çok fırsat demektir.'
      }
    },
    {
      ikon: Phone, renk: 'bg-blue-600',
      baslik: 'Arama (30g)', deger: s.arama_30gun,
      popup: {
        baslik: 'Telefon Aramaları', altBaslik: 'Son 30 gün',
        deger: s.arama_30gun,
        degerAlt: 'müşteri sizi aradı',
        aciklama: 'Profilinizdeki telefon butonuna tıklayan müşteri sayısı.'
      }
    },
    {
      ikon: MessageCircle, renk: 'bg-green-600',
      baslik: 'WhatsApp (30g)', deger: s.whatsapp_30gun,
      popup: {
        baslik: 'WhatsApp Mesajları', altBaslik: 'Son 30 gün',
        deger: s.whatsapp_30gun,
        degerAlt: 'müşteri WhatsApp\'tan ulaştı',
        aciklama: 'WhatsApp butonuna tıklayan müşteri sayısı. Hızlı iletişim için WhatsApp numaranızı güncel tutun.'
      }
    },
  ]

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

      {/* İstatistik kartları — üst 4 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kartlar.slice(0, 4).map((k, i) => (
          <StatKart key={i} {...k} onClick={() => setPopup({ ...k.popup, ikon: k.ikon, renk: k.renk })} />
        ))}
      </div>

      {/* İstatistik kartları — alt 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {kartlar.slice(4).map((k, i) => (
          <StatKart key={i} {...k} onClick={() => setPopup({ ...k.popup, ikon: k.ikon, renk: k.renk })} />
        ))}
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
                    <div className="w-full bg-blue-500 rounded-t-lg transition-all"
                      style={{ height: `${yuzde}%`, minHeight: g.sayi > 0 ? 8 : 0 }} />
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
            <button onClick={() => navigate('/usta/panel/talepler')}
              className="text-xs text-blue-600 hover:underline font-medium">
              Tümünü Gör
            </button>
          </div>

          {veri.son_talepler.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Henüz iş talebi yok</div>
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

      {/* Popup */}
      <StatPopup popup={popup} onKapat={() => setPopup(null)} />
    </div>
  )
}
