import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts'
import { Users, Clock, Star, TrendingUp, TrendingDown, Tag } from 'lucide-react'

const API = 'http://localhost:5000'

function StatKart({ baslik, deger, alt, ikon: Icon, renk, trend }) {
  return (
    <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{baslik}</p>
        <p className="text-3xl font-bold text-[#1e293b]">{deger}</p>
        {alt && <p className="text-xs text-gray-400 mt-1">{alt}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend >= 0 ? '+' : ''}{trend} geçen ay
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${renk}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0d1322] border border-[#1a2744] rounded-lg px-3 py-2 text-white text-xs shadow-xl">
        <p className="font-semibold">{label}</p>
        <p className="text-blue-300">{payload[0].value} kayıt</p>
      </div>
    )
  }
  return null
}

export default function AdminDashboard() {
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/admin/istatistik`, { withCredentials: true })
      .then(r => { setVeri(r.data); setYukleniyor(false) })
      .catch(() => setYukleniyor(false))
  }, [])

  if (yukleniyor) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0052CC]" />
    </div>
  )
  if (!veri) return <div className="text-center text-red-500">Veriler yüklenemedi</div>

  const trend = veri.bu_ay_kayit - veri.gecen_ay_kayit

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1e293b]">Dashboard</h2>
        <p className="text-gray-500 text-sm">Genel bakış</p>
      </div>

      {/* Stat kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatKart baslik="Toplam Usta" deger={veri.toplam_usta} alt={`${veri.onaylanan_usta} onaylı`} ikon={Users} renk="bg-[#0052CC]" />
        <StatKart baslik="Onay Bekleyen" deger={veri.bekleyen_usta} alt="İnceleme gerekiyor" ikon={Clock} renk="bg-orange-500" />
        <StatKart baslik="Bu Ay Kayıt" deger={veri.bu_ay_kayit} trend={trend} ikon={TrendingUp} renk="bg-green-500" />
        <StatKart baslik="Bekleyen Yorum" deger={veri.bekleyen_yorum} alt={`${veri.toplam_yorum} toplam`} ikon={Star} renk="bg-yellow-500" />
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Son 7 gün çizgi grafik */}
        <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-[#1e293b] text-sm mb-4">Son 7 Gün — Yeni Kayıtlar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={veri.son_7_gun}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis dataKey="tarih" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="sayi" stroke="#0052CC" strokeWidth={2.5} dot={{ r: 4, fill: '#0052CC', strokeWidth: 0 }} name="Kayıt" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Kategori bar grafik */}
        <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-[#1e293b] text-sm mb-4">Kategoriye Göre Usta Dağılımı</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={veri.kategori_dagilim} layout="vertical">
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="kategori" type="category" width={100} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sayi" fill="#003d99" radius={[0, 4, 4, 0]} name="Usta Sayısı" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hızlı özet */}
      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-[#1e293b] text-sm mb-4">Genel Özet</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { etiket: 'Toplam Kategori', deger: veri.toplam_kategori, ikon: Tag },
            { etiket: 'Toplam Yorum', deger: veri.toplam_yorum, ikon: Star },
            { etiket: 'Onaylı Usta', deger: veri.onaylanan_usta, ikon: Users },
            { etiket: 'Geçen Ay Kayıt', deger: veri.gecen_ay_kayit, ikon: TrendingUp },
          ].map(({ etiket, deger, ikon: Icon }) => (
            <div key={etiket} className="bg-[#F8F9FA] border border-[#E0E0E0] rounded-xl p-4 text-center">
              <Icon size={20} className="text-[#0052CC] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#1e293b]">{deger}</p>
              <p className="text-xs text-gray-500 mt-0.5">{etiket}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
