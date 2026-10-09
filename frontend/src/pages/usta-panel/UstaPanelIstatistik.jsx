import { useState, useEffect } from 'react'
import { BarChart2, Phone, MessageCircle, Eye, Star, TrendingUp, TrendingDown, Minus, MousePointerClick, FileText, Heart, Share2, Info } from 'lucide-react'
import { ustaPanelIstatistikler } from '../../api'

const ARALIKLAR = [
  { val: 7,   label: '7 Gün' },
  { val: 30,  label: '30 Gün' },
  { val: 90,  label: '90 Gün' },
  { val: 365, label: '12 Ay' },
]

function MiniBar({ deger, max, renk }) {
  const yuzde = max > 0 ? (deger / max) * 100 : 0
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${renk} rounded-full transition-all`} style={{ width: `${yuzde}%` }} />
    </div>
  )
}

// Önceki dönemle yüzde değişim rozeti
function Degisim({ simdi, onceki }) {
  if (!onceki && !simdi) return <span className="text-[11px] text-gray-400">—</span>
  if (!onceki) return <span className="text-[11px] font-semibold text-green-600">yeni</span>
  const yuzde = Math.round(((simdi - onceki) / onceki) * 100)
  if (yuzde === 0) return <span className="text-[11px] text-gray-400 flex items-center gap-0.5"><Minus size={11} /> değişmedi</span>
  const artis = yuzde > 0
  return (
    <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${artis ? 'text-green-600' : 'text-red-500'}`}>
      {artis ? <TrendingUp size={11} /> : <TrendingDown size={11} />} %{Math.abs(yuzde)} {artis ? 'artış' : 'düşüş'}
    </span>
  )
}

function Kpi({ ikon: Ikon, renk, baslik, deger, onceki }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${renk}`}><Ikon size={16} /></span>
        <p className="text-xs font-semibold text-gray-500">{baslik}</p>
      </div>
      <p className="text-2xl font-extrabold text-gray-900 leading-none">{deger.toLocaleString('tr-TR')}</p>
      <div className="mt-1.5"><Degisim simdi={deger} onceki={onceki} /></div>
    </div>
  )
}

export default function UstaPanelIstatistik() {
  const [veri, setVeri] = useState(null)
  const [aralik, setAralik] = useState(30)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState(false)

  useEffect(() => {
    setYukleniyor(true); setHata(false)
    ustaPanelIstatistikler(aralik)
      .then(r => setVeri(r.data))
      .catch(() => setHata(true))
      .finally(() => setYukleniyor(false))
  }, [aralik])

  if (yukleniyor && !veri) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }
  if (hata || !veri) return <p className="text-sm text-red-600">İstatistikler yüklenemedi. Sayfayı yenileyip tekrar dene.</p>

  const { ozet, onceki, huni, seri } = veri
  const dd = veri.durum_dagilim
  const maxSeri = Math.max(...seri.map(g => Math.max(g.goruntule, g.iletisim)), 1)
  const haftalik = aralik === 365
  const huniAdim = [
    { ad: 'Gösterim', alt: 'Kartın listelerde görünmesi', deger: huni.gosterim, renk: 'bg-sky-500' },
    { ad: 'Profil görüntüleme', alt: `Gösterimin %${huni.goruntule_orani}'i profilini açtı`, deger: huni.goruntule, renk: 'bg-blue-600' },
    { ad: 'İletişim', alt: `Görüntülemenin %${huni.iletisim_orani}'i seni aradı / yazdı / teklif istedi`, deger: huni.iletisim, renk: 'bg-green-600' },
  ]
  const maxHuni = Math.max(huni.gosterim, huni.goruntule, huni.iletisim, 1)

  return (
    <div className={`space-y-6 transition-opacity ${yukleniyor ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">İstatistikler</h1>
          <p className="text-sm text-gray-500 mt-1">Müşterilerin seni nasıl bulup iletişime geçtiğini gör</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {ARALIKLAR.map(a => (
            <button key={a.val} onClick={() => setAralik(a.val)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${aralik === a.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Özet kartlar (önceki dönemle karşılaştırmalı) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Kpi ikon={Eye} renk="bg-sky-50 text-sky-600" baslik="Gösterim" deger={ozet.gosterim} onceki={onceki.gosterim} />
        <Kpi ikon={MousePointerClick} renk="bg-blue-50 text-blue-600" baslik="Profil görüntüleme" deger={ozet.goruntule} onceki={onceki.goruntule} />
        <Kpi ikon={Phone} renk="bg-green-50 text-green-600" baslik="İletişim (arama + WhatsApp + teklif)" deger={ozet.iletisim} onceki={onceki.iletisim} />
        <Kpi ikon={Heart} renk="bg-rose-50 text-rose-500" baslik="Favoriye eklenme" deger={ozet.favori} onceki={onceki.favori} />
        <Kpi ikon={Share2} renk="bg-violet-50 text-violet-600" baslik="Profil paylaşımı" deger={ozet.paylas} onceki={onceki.paylas} />
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-500"><Star size={16} /></span>
            <p className="text-xs font-semibold text-gray-500">Ortalama puan</p>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 leading-none">{veri.ort_puan || '—'}</p>
          <p className="text-[11px] text-gray-400 mt-1.5">{veri.toplam_yorum} yorum</p>
        </div>
      </div>

      {/* Müşteri yolculuğu */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">Müşteri yolculuğu</h2>
        <div className="space-y-4">
          {huniAdim.map((a, i) => (
            <div key={a.ad}>
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-sm font-semibold text-gray-800"><span className="text-gray-400 mr-1.5">{i + 1}.</span>{a.ad}</p>
                <p className="text-sm font-extrabold text-gray-900">{a.deger.toLocaleString('tr-TR')}</p>
              </div>
              <MiniBar deger={a.deger} max={maxHuni} renk={a.renk} />
              <p className="text-[11px] text-gray-400 mt-1">{a.alt}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-100 text-center">
          <div><Phone size={15} className="mx-auto text-blue-500 mb-1" /><p className="text-lg font-extrabold text-gray-900">{ozet.ara}</p><p className="text-[11px] text-gray-500">Arama</p></div>
          <div><MessageCircle size={15} className="mx-auto text-green-500 mb-1" /><p className="text-lg font-extrabold text-gray-900">{ozet.whatsapp}</p><p className="text-[11px] text-gray-500">WhatsApp</p></div>
          <div><FileText size={15} className="mx-auto text-amber-500 mb-1" /><p className="text-lg font-extrabold text-gray-900">{ozet.teklif}</p><p className="text-[11px] text-gray-500">Teklif talebi</p></div>
        </div>
        {huni.gosterim === 0 && (
          <p className="flex items-start gap-1.5 text-[11px] text-gray-400 mt-4"><Info size={12} className="mt-0.5 flex-shrink-0" />Gösterim sayısı, kartının listelerde görünmesiyle birikmeye başlar; geçmiş dönemler için veri yoktur.</p>
        )}
      </div>

      {/* Zaman içinde görünürlük */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart2 size={18} className="text-blue-600" /> Zaman içinde görünürlük {haftalik && <span className="text-xs font-normal text-gray-400">(haftalık)</span>}
        </h2>
        <div className="overflow-x-auto">
          <div className="flex items-end gap-1" style={{ minWidth: seri.length > 30 ? 640 : 'auto', height: 110 }}>
            {seri.map((g, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group" title={`${g.gun} — görüntüleme: ${g.goruntule}, iletişim: ${g.iletisim}`}>
                <div className="w-full flex items-end gap-px bg-gray-50 rounded-t overflow-hidden" style={{ height: 90 }}>
                  <div className="flex-1 bg-blue-500 group-hover:bg-blue-600 rounded-t transition-all" style={{ height: `${(g.goruntule / maxSeri) * 100}%`, minHeight: g.goruntule > 0 ? 3 : 0 }} />
                  <div className="flex-1 bg-green-500 group-hover:bg-green-600 rounded-t transition-all" style={{ height: `${(g.iletisim / maxSeri) * 100}%`, minHeight: g.iletisim > 0 ? 3 : 0 }} />
                </div>
                {seri.length <= 14 && <span className="text-[9px] text-gray-400">{g.gun}</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1.5 text-blue-600"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Profil görüntüleme</span>
          <span className="flex items-center gap-1.5 text-green-600"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> İletişim</span>
        </div>
      </div>

      {/* Talep durum dağılımı */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">Talep durum dağılımı</h2>
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
                <div className="flex-1"><MiniBar deger={dd[key]} max={toplam} renk={renk} /></div>
                <span className="text-sm font-bold text-gray-700 w-8 text-right">{dd[key]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Puan dağılımı */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Star size={18} className="text-orange-400" /> Puan dağılımı</h2>
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
                <div className="flex-1"><MiniBar deger={sayi} max={max} renk="bg-orange-400" /></div>
                <span className="text-sm font-bold text-gray-600 w-6 text-right">{sayi}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
