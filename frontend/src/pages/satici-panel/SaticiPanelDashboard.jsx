import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { ShoppingBag, Package, Wallet, Store } from 'lucide-react'
import API from '../../config.js'

const durumRenk = {
  yeni: 'bg-blue-100 text-blue-700',
  hazirlaniyor: 'bg-yellow-100 text-yellow-700',
  kargoda: 'bg-purple-100 text-purple-700',
  teslim_edildi: 'bg-green-100 text-green-700',
  iptal: 'bg-red-100 text-red-700',
}

export default function SaticiPanelDashboard() {
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState(null)

  useEffect(() => {
    axios.get(`${API}/api/satici-panel/dashboard`, { withCredentials: true })
      .then(r => {
        setVeri(r.data)
        setYukleniyor(false)
      })
      .catch(() => {
        setHata('Veriler yüklenemedi.')
        setYukleniyor(false)
      })
  }, [])

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0052CC]" />
      </div>
    )
  }

  if (hata) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
        {hata}
      </div>
    )
  }

  const magazaDurumBadge = veri?.magaza_durum === 'aktif'
    ? <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Aktif</span>
    : <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">Askıda</span>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hoş geldiniz, {veri?.magaza_adi}!
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Satıcı panelinize genel bakış</p>
        </div>
        <div className="flex items-center gap-2">
          <Store size={15} className="text-gray-400" />
          <span className="text-sm text-gray-500 mr-1">Mağaza durumu:</span>
          {magazaDurumBadge}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-xl">
            <ShoppingBag size={22} className="text-[#0052CC]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Ürün Sayısı</p>
            <p className="text-2xl font-bold text-gray-900">{veri?.urun_sayisi ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-xl">
            <Package size={22} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Bekleyen Sipariş</p>
            <p className="text-2xl font-bold text-gray-900">{veri?.bekleyen_siparis ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-xl">
            <Wallet size={22} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Kullanılabilir Bakiye</p>
            <p className="text-2xl font-bold text-gray-900">
              {(veri?.kullanilabilir_bakiye ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Son Siparişler</h2>
          <Link to="/satici/siparisler" className="text-sm text-[#0052CC] hover:underline font-medium">
            Tüm Siparişleri Gör
          </Link>
        </div>

        {veri?.son_siparisler?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">Sipariş No</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">Tarih</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">Tutar</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-2">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {veri.son_siparisler.map(s => (
                  <tr key={s.siparis_no} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-xs text-gray-700">{s.siparis_no}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{s.tarih}</td>
                    <td className="py-2.5 pr-4 text-gray-800 font-medium">
                      {(s.tutar ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-2.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${durumRenk[s.durum] ?? 'bg-gray-100 text-gray-600'}`}>
                        {s.durum}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">Henüz sipariş bulunmuyor.</p>
        )}
      </div>

      {(veri?.urun_sayisi ?? 0) === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <ShoppingBag size={32} className="text-[#0052CC] opacity-60" />
          <p className="text-sm text-gray-600">Henüz ürün eklemediniz.</p>
          <Link
            to="/satici/urunler"
            className="bg-[#0052CC] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0047b3] transition-colors"
          >
            Ürün Ekle
          </Link>
        </div>
      )}
    </div>
  )
}
