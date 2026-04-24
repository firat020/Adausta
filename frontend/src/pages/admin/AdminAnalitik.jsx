import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, Users, Phone, MessageCircle, Eye, Bell,
  MapPin, Tag, Star, Mail, Trash2, RefreshCw, Download,
  ToggleLeft, ToggleRight, AlertCircle
} from 'lucide-react'

import API from '../../config.js'
// API

const ARALIK_SECENEKLER = [
  { deger: '7',  etiket: 'Son 7 Gün' },
  { deger: '30', etiket: 'Son 30 Gün' },
  { deger: '90', etiket: 'Son 90 Gün' },
]

const TUR_RENK = {
  ara:       { renk: '#f97316', bg: 'bg-orange-100', text: 'text-orange-700', label: 'Arama' },
  whatsapp:  { renk: '#22c55e', bg: 'bg-green-100',  text: 'text-green-700',  label: 'WhatsApp' },
  goruntule: { renk: '#3b82f6', bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Görüntüleme' },
  teklif:    { renk: '#a855f7', bg: 'bg-purple-100', text: 'text-purple-700', label: 'Teklif' },
}

const PIE_RENKLER = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#eab308', '#ec4899']

export default function AdminAnalitik() {
  const [aralik, setAralik] = useState('30')
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [sekme, setSekme] = useState('genel')        // genel / ustalar / kategoriler / aboneler
  const [aboneler, setAboneler] = useState([])
  const [aboneArama, setAboneArama] = useState('')
  const [aboneYukleniyor, setAboneYukleniyor] = useState(false)

  useEffect(() => { yukle() }, [aralik])
  useEffect(() => { if (sekme === 'aboneler') aboneleriYukle() }, [sekme])

  const yukle = async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/analitik?aralik=${aralik}`, { withCredentials: true })
      setVeri(r.data)
    } catch (e) {
      console.error(e)
    } finally {
      setYukleniyor(false)
    }
  }

  const aboneleriYukle = async () => {
    setAboneYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/aboneler?arama=${aboneArama}`, { withCredentials: true })
      setAboneler(r.data.aboneler || [])
    } catch {}
    setAboneYukleniyor(false)
  }

  const aboneSil = async (id) => {
    if (!window.confirm('Bu aboneyi silmek istediğinizden emin misiniz?')) return
    await axios.delete(`${API}/api/admin/aboneler/${id}`, { withCredentials: true })
    setAboneler(prev => prev.filter(a => a.id !== id))
  }

  const aboneDurumDegistir = async (id) => {
    const r = await axios.post(`${API}/api/admin/aboneler/${id}/durum`, {}, { withCredentials: true })
    setAboneler(prev => prev.map(a => a.id === id ? { ...a, aktif: r.data.aktif } : a))
  }

  const csvIndir = () => {
    const satirlar = aboneler.map(a => `${a.email},${a.ad},${a.tarih},${a.kaynak},${a.aktif ? 'Aktif' : 'Pasif'}`)
    const icerik = ['E-posta,Ad,Tarih,Kaynak,Durum', ...satirlar].join('\n')
    const url = URL.createObjectURL(new Blob([icerik], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'aboneler.csv'; a.click()
  }

  if (yukleniyor) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0052CC]" />
    </div>
  )

  const toplamIletisim = veri?.toplam_iletisim || 0
  const toplamAra = veri?.tur_dagilim?.find(t => t.tur === 'ara')?.sayi || 0
  const toplamWa = veri?.tur_dagilim?.find(t => t.tur === 'whatsapp')?.sayi || 0
  const toplamGor = veri?.tur_dagilim?.find(t => t.tur === 'goruntule')?.sayi || 0

  return (
    <div className="space-y-5">
      {/* Başlık + Filtreler */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Analitik & Raporlar</h1>
          <p className="text-[#6a7ea0] text-sm mt-0.5">Kullanıcı davranışları ve etkileşim raporları</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#0d1322] border border-[#1a2744] rounded-lg overflow-hidden">
            {ARALIK_SECENEKLER.map(s => (
              <button
                key={s.deger}
                onClick={() => setAralik(s.deger)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  aralik === s.deger
                    ? 'bg-[#003d99] text-white'
                    : 'text-[#6a7ea0] hover:text-white hover:bg-[#121929]'
                }`}
              >
                {s.etiket}
              </button>
            ))}
          </div>
          <button onClick={yukle}
            className="p-2 bg-[#0d1322] border border-[#1a2744] rounded-lg text-[#6a7ea0] hover:text-white transition-colors">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Toplam Etkileşim', deger: toplamIletisim, ikon: TrendingUp,    renk: 'from-blue-600 to-blue-800',   alt: `${aralik} günde` },
          { label: 'Telefon Araması',  deger: toplamAra,       ikon: Phone,         renk: 'from-orange-500 to-orange-700', alt: 'Ara tıklaması' },
          { label: 'WhatsApp',         deger: toplamWa,        ikon: MessageCircle, renk: 'from-green-500 to-green-700',  alt: 'Mesaj tıklaması' },
          { label: 'Toplam Abone',     deger: veri?.toplam_abone || 0, ikon: Bell,  renk: 'from-purple-600 to-purple-800', alt: `+${veri?.yeni_abone || 0} yeni` },
        ].map(({ label, deger, ikon: Icon, renk, alt }) => (
          <div key={label} className={`bg-gradient-to-br ${renk} rounded-xl p-4 text-white`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium opacity-80">{label}</span>
              <Icon size={16} className="opacity-70" />
            </div>
            <div className="text-3xl font-bold">{deger}</div>
            <div className="text-xs opacity-70 mt-1">{alt}</div>
          </div>
        ))}
      </div>

      {/* Sekme Menüsü */}
      <div className="flex gap-1 bg-[#0d1322] border border-[#1a2744] rounded-xl p-1 w-fit">
        {[
          { id: 'genel',      label: 'Genel',       ikon: TrendingUp },
          { id: 'ustalar',    label: 'Ustalar',     ikon: Users },
          { id: 'kategoriler',label: 'Kategoriler', ikon: Tag },
          { id: 'aboneler',   label: 'Aboneler',    ikon: Bell },
        ].map(({ id, label, ikon: Icon }) => (
          <button key={id} onClick={() => setSekme(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sekme === id
                ? 'bg-[#003d99] text-white'
                : 'text-[#6a7ea0] hover:text-white hover:bg-[#121929]'
            }`}>
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* ══ GENEL ══ */}
      {sekme === 'genel' && (
        <div className="space-y-4">
          {/* Günlük Trend Grafiği */}
          <div className="bg-[#0d1322] border border-[#1a2744] rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={15} className="text-blue-400" />
              Günlük Etkileşim Trendi
            </h3>
            {veri?.gunluk_trend?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={veri.gunluk_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                  <XAxis dataKey="tarih" tick={{ fill: '#6a7ea0', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6a7ea0', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121929', border: '1px solid #1a2744', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#ccc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="goruntule" name="Görüntüleme" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ara"       name="Arama"       stroke="#f97316" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="whatsapp"  name="WhatsApp"    stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <Bos mesaj="Henüz veri yok" />}
          </div>

          {/* İletişim Türü + Şehir */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pasta Grafik */}
            <div className="bg-[#0d1322] border border-[#1a2744] rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <Phone size={15} className="text-orange-400" />
                İletişim Türü Dağılımı
              </h3>
              {veri?.tur_dagilim?.length ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={veri.tur_dagilim.map(t => ({
                        name: TUR_RENK[t.tur]?.label || t.tur,
                        value: t.sayi,
                      }))}
                      cx="50%" cy="50%" outerRadius={65}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {veri.tur_dagilim.map((t, i) => (
                        <Cell key={i} fill={TUR_RENK[t.tur]?.renk || PIE_RENKLER[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#121929', border: '1px solid #1a2744', borderRadius: 8 }}
                      itemStyle={{ color: '#ccc' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Bos mesaj="Henüz veri yok" />}
            </div>

            {/* Şehir Dağılımı */}
            <div className="bg-[#0d1322] border border-[#1a2744] rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <MapPin size={15} className="text-blue-400" />
                Şehir Bazlı İlgi
              </h3>
              {veri?.sehir_dagilim?.length ? (
                <div className="space-y-2">
                  {veri.sehir_dagilim.map((s, i) => {
                    const max = veri.sehir_dagilim[0].sayi
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[#6a7ea0] text-xs w-20 truncate">{s.sehir}</span>
                        <div className="flex-1 bg-[#1a2744] rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                            style={{ width: `${(s.sayi / max) * 100}%` }}
                          />
                        </div>
                        <span className="text-white text-xs font-bold w-8 text-right">{s.sayi}</span>
                      </div>
                    )
                  })}
                </div>
              ) : <Bos mesaj="Henüz veri yok" />}
            </div>
          </div>
        </div>
      )}

      {/* ══ USTALAR ══ */}
      {sekme === 'ustalar' && (
        <div className="bg-[#0d1322] border border-[#1a2744] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1a2744]">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Users size={15} className="text-blue-400" />
              En Çok İletişim Kurulan Ustalar
              <span className="ml-auto text-[#6a7ea0] text-xs font-normal">Son {aralik} gün</span>
            </h3>
          </div>
          {veri?.top_ustalar?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#6a7ea0] text-xs border-b border-[#1a2744]">
                    <th className="text-left px-5 py-3">#</th>
                    <th className="text-left px-4 py-3">Usta</th>
                    <th className="text-left px-4 py-3">Kategori</th>
                    <th className="text-left px-4 py-3">Şehir</th>
                    <th className="text-center px-4 py-3">
                      <span className="flex items-center justify-center gap-1"><Eye size={11}/> Görüntüleme</span>
                    </th>
                    <th className="text-center px-4 py-3">
                      <span className="flex items-center justify-center gap-1"><Phone size={11}/> Arama</span>
                    </th>
                    <th className="text-center px-4 py-3">
                      <span className="flex items-center justify-center gap-1"><MessageCircle size={11}/> WA</span>
                    </th>
                    <th className="text-center px-4 py-3 text-white font-semibold">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {veri.top_ustalar.map((u, i) => (
                    <tr key={u.id} className="border-b border-[#1a2744]/50 hover:bg-[#121929] transition-colors">
                      <td className="px-5 py-3 text-[#6a7ea0] font-bold">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {u.ad_soyad[0]}
                          </div>
                          <span className="text-white font-medium text-xs">{u.ad_soyad}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#6a7ea0] text-xs">{u.kategori}</td>
                      <td className="px-4 py-3 text-[#6a7ea0] text-xs">{u.sehir || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-blue-400 font-semibold">{u.goruntule}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-orange-400 font-semibold">{u.ara}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-green-400 font-semibold">{u.whatsapp}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-[#003d99] text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                          {u.toplam}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8">
              <Bos mesaj="Henüz etkileşim kaydı yok" altMesaj="Kullanıcılar usta sayfalarını ziyaret ettiğinde burada görünecek" />
            </div>
          )}
        </div>
      )}

      {/* ══ KATEGORİLER ══ */}
      {sekme === 'kategoriler' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* İletişim Yönelimi */}
          <div className="bg-[#0d1322] border border-[#1a2744] rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <Phone size={15} className="text-orange-400" />
              İletişim Yönelimi (Kategori)
              <span className="ml-auto text-[#6a7ea0] text-xs font-normal">Hangi kategoride daha çok aranıyor</span>
            </h3>
            {veri?.kategori_yonelim?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={veri.kategori_yonelim} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                  <XAxis type="number" tick={{ fill: '#6a7ea0', fontSize: 11 }} />
                  <YAxis dataKey="kategori" type="category" width={110}
                    tick={{ fill: '#6a7ea0', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121929', border: '1px solid #1a2744', borderRadius: 8 }}
                    itemStyle={{ color: '#ccc' }}
                  />
                  <Bar dataKey="sayi" name="İletişim" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Bos mesaj="Henüz veri yok" />}
          </div>

          {/* Sayfa Görüntülemeleri */}
          <div className="bg-[#0d1322] border border-[#1a2744] rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <Eye size={15} className="text-blue-400" />
              Kategori Sayfa Görüntülemeleri
              <span className="ml-auto text-[#6a7ea0] text-xs font-normal">Kullanıcı ziyaretleri</span>
            </h3>
            {veri?.kategori_goruntuleme?.length ? (
              <div className="space-y-2.5">
                {veri.kategori_goruntuleme.map((k, i) => {
                  const max = veri.kategori_goruntuleme[0].sayi
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-lg w-7">{k.ikon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-[#6a7ea0] text-xs">{k.kategori}</span>
                          <span className="text-white text-xs font-bold">{k.sayi}</span>
                        </div>
                        <div className="bg-[#1a2744] rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                            style={{ width: `${(k.sayi / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : <Bos mesaj="Henüz veri yok" />}
          </div>

          {/* Kategori Yönelim Tablosu */}
          {veri?.kategori_yonelim?.length > 0 && (
            <div className="md:col-span-2 bg-[#0d1322] border border-[#1a2744] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1a2744]">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Tag size={15} className="text-purple-400" />
                  Kategori Detaylı Tablo
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#6a7ea0] text-xs border-b border-[#1a2744]">
                      <th className="text-left px-5 py-3">#</th>
                      <th className="text-left px-4 py-3">Kategori</th>
                      <th className="text-center px-4 py-3">İletişim</th>
                      <th className="text-center px-4 py-3">Görüntüleme</th>
                      <th className="text-left px-4 py-3">İlgi Oranı</th>
                    </tr>
                  </thead>
                  <tbody>
                    {veri.kategori_yonelim.map((k, i) => {
                      const goruntuleme = veri.kategori_goruntuleme?.find(g => g.kategori === k.kategori)?.sayi || 0
                      const maxIletisim = veri.kategori_yonelim[0].sayi
                      return (
                        <tr key={i} className="border-b border-[#1a2744]/50 hover:bg-[#121929] transition-colors">
                          <td className="px-5 py-3 text-[#6a7ea0] text-xs font-bold">{i + 1}</td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2">
                              <span className="text-base">{k.ikon}</span>
                              <span className="text-white text-xs">{k.kategori}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-orange-400 font-bold">{k.sayi}</td>
                          <td className="px-4 py-3 text-center text-blue-400 font-bold">{goruntuleme}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-[#1a2744] rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                                  style={{ width: `${(k.sayi / maxIletisim) * 100}%` }}
                                />
                              </div>
                              <span className="text-[#6a7ea0] text-xs w-8">
                                {Math.round((k.sayi / maxIletisim) * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ ABONELER ══ */}
      {sekme === 'aboneler' && (
        <div className="space-y-4">
          {/* Özet */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Toplam Abone',   deger: veri?.toplam_abone || 0,              renk: 'text-white',   bg: 'bg-[#003d99]' },
              { label: `Son ${aralik} Gün`, deger: veri?.yeni_abone || 0,             renk: 'text-green-400', bg: 'bg-[#0d1322]' },
              { label: 'Bu Sayfada',     deger: aboneler.length,                      renk: 'text-blue-400',  bg: 'bg-[#0d1322]' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border border-[#1a2744] rounded-xl p-4`}>
                <div className="text-[#6a7ea0] text-xs mb-1">{s.label}</div>
                <div className={`text-2xl font-bold ${s.renk}`}>{s.deger}</div>
              </div>
            ))}
          </div>

          {/* Son aboneler mini liste */}
          {veri?.son_aboneler?.length > 0 && (
            <div className="bg-[#0d1322] border border-[#1a2744] rounded-xl p-4">
              <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                <Bell size={13} className="text-purple-400" /> Son Aboneler
              </h4>
              <div className="flex flex-wrap gap-2">
                {veri.son_aboneler.map(a => (
                  <span key={a.id} className="flex items-center gap-1.5 bg-[#121929] border border-[#1a2744] px-2.5 py-1 rounded-lg text-xs">
                    <Mail size={10} className="text-purple-400" />
                    <span className="text-white">{a.email}</span>
                    <span className="text-[#6a7ea0]">· {a.tarih.split(' ')[0]}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Arama + CSV */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="E-posta veya ad ara..."
              value={aboneArama}
              onChange={e => setAboneArama(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && aboneleriYukle()}
              className="flex-1 bg-[#0d1322] border border-[#1a2744] rounded-lg px-3 py-2 text-white text-sm placeholder-[#6a7ea0] outline-none focus:border-[#0052CC]"
            />
            <button onClick={aboneleriYukle}
              className="px-3 py-2 bg-[#003d99] hover:bg-[#0052CC] text-white rounded-lg text-xs font-medium transition-colors">
              Ara
            </button>
            <button onClick={csvIndir}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0d1322] border border-[#1a2744] hover:border-[#243358] text-[#6a7ea0] hover:text-white rounded-lg text-xs font-medium transition-colors">
              <Download size={13} /> CSV
            </button>
          </div>

          {/* Abone Tablosu */}
          <div className="bg-[#0d1322] border border-[#1a2744] rounded-xl overflow-hidden">
            {aboneYukleniyor ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
              </div>
            ) : aboneler.length === 0 ? (
              <div className="p-8">
                <Bos
                  mesaj="Henüz abone yok"
                  altMesaj="Web sitenize abone olan kullanıcılar burada listelenecek"
                  ikon={<Bell size={32} className="opacity-30 mx-auto mb-3 text-purple-400" />}
                />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#6a7ea0] text-xs border-b border-[#1a2744]">
                    <th className="text-left px-5 py-3">E-posta</th>
                    <th className="text-left px-4 py-3">Ad</th>
                    <th className="text-left px-4 py-3">Kaynak</th>
                    <th className="text-left px-4 py-3">Tarih</th>
                    <th className="text-center px-4 py-3">Durum</th>
                    <th className="text-center px-4 py-3">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {aboneler.map(a => (
                    <tr key={a.id} className="border-b border-[#1a2744]/50 hover:bg-[#121929] transition-colors">
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                            <Mail size={11} className="text-purple-400" />
                          </div>
                          <span className="text-white text-xs">{a.email}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#6a7ea0] text-xs">{a.ad || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="bg-[#1a2744] text-[#6a7ea0] px-2 py-0.5 rounded text-xs">{a.kaynak}</span>
                      </td>
                      <td className="px-4 py-3 text-[#6a7ea0] text-xs">{a.tarih}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.aktif ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
                        }`}>
                          {a.aktif ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => aboneDurumDegistir(a.id)}
                            title={a.aktif ? 'Devre dışı bırak' : 'Aktifleştir'}
                            className="p-1.5 rounded-lg hover:bg-[#1a2744] text-[#6a7ea0] hover:text-white transition-colors">
                            {a.aktif ? <ToggleRight size={15} className="text-green-400" /> : <ToggleLeft size={15} />}
                          </button>
                          <button onClick={() => aboneSil(a.id)}
                            className="p-1.5 rounded-lg hover:bg-red-900/30 text-[#6a7ea0] hover:text-red-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Bos({ mesaj, altMesaj, ikon }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {ikon || <AlertCircle size={32} className="text-[#1a2744] mx-auto mb-3" />}
      <p className="text-[#6a7ea0] text-sm font-medium">{mesaj}</p>
      {altMesaj && <p className="text-[#6a7ea0] text-xs mt-1 opacity-70">{altMesaj}</p>}
    </div>
  )
}
