import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import { Users, Clock, Star, Tag, TrendingUp, TrendingDown } from 'lucide-react'

const API = 'http://localhost:5000'

function StatKart({ baslik, deger, alt, ikon: Icon, renk, trend }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{baslik}</p>
        <p className="text-3xl font-bold text-gray-800">{deger}</p>
        {alt && <p className="text-xs text-gray-400 mt-1">{alt}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend >= 0 ? '+' : ''}{trend} geçen aya göre
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${renk}`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/admin/istatistik`, { withCredentials: true })
      .then(r => { setVeri(r.data); setYukleniyor(false) })
      .catch(() => setYukleniyor(false))
  }, [])

  if (yukleniyor) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f]" /></div>
  if (!veri) return <div className="text-center text-red-500">Veriler yüklenemedi</div>

  const trend = veri.bu_ay_kayit - veri.gecen_ay_kayit

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 text-sm">Genel istatistikler</p>
      </div>

      {/* Kartlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatKart
          baslik="Toplam Usta"
          deger={veri.toplam_usta}
          alt={`${veri.onaylanan_usta} onaylı`}
          ikon={Users}
          renk="bg-[#1e3a5f]"
        />
        <StatKart
          baslik="Onay Bekleyen"
          deger={veri.bekleyen_usta}
          alt="İnceleme gerekiyor"
          ikon={Clock}
          renk="bg-orange-500"
        />
        <StatKart
          baslik="Bu Ay Kayıt"
          deger={veri.bu_ay_kayit}
          trend={trend}
          ikon={TrendingUp}
          renk="bg-green-500"
        />
        <StatKart
          baslik="Bekleyen Yorum"
          deger={veri.bekleyen_yorum}
          alt={`${veri.toplam_yorum} toplam yorum`}
          ikon={Star}
          renk="bg-yellow-500"
        />
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Son 7 gün */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Son 7 Gün — Yeni Kayıtlar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={veri.son_7_gun}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="tarih" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="sayi" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 4 }} name="Kayıt" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Kategori dağılımı */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Kategoriye Göre Usta Dağılımı</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={veri.kategori_dagilim} layout="vertical">
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis dataKey="kategori" type="category" width={90} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="sayi" fill="#1e3a5f" radius={[0, 4, 4, 0]} name="Usta Sayısı" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Özet tablo */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Hızlı Özet</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { etiket: 'Toplam Kategori', deger: veri.toplam_kategori },
            { etiket: 'Toplam Yorum', deger: veri.toplam_yorum },
            { etiket: 'Onaylı Usta', deger: veri.onaylanan_usta },
            { etiket: 'Geçen Ay Kayıt', deger: veri.gecen_ay_kayit },
          ].map(({ etiket, deger }) => (
            <div key={etiket} className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-[#1e3a5f]">{deger}</p>
              <p className="text-xs text-gray-500 mt-1">{etiket}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
