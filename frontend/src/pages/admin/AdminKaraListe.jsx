import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Search, Trash2, ShieldOff, ShieldCheck, RefreshCw, Eye, X } from 'lucide-react'

import API from '../../config.js'
// API

export default function AdminKaraListe() {
  const [ustalar, setUstalar] = useState([])
  const [arama, setArama] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [detay, setDetay] = useState(null)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/ustalar`, {
        params: { filtre: 'pasif', arama },
        withCredentials: true,
      })
      setUstalar(r.data.ustalar)
    } catch (e) { console.error(e) }
    setYukleniyor(false)
  }, [arama])

  useEffect(() => { yukle() }, [yukle])

  const yasagıKaldir = async (id) => {
    if (!confirm('Bu ustanın yasağını kaldırmak istiyor musunuz? Bekleme listesine alınacak.')) return
    try {
      await axios.post(`${API}/api/admin/ustalar/${id}/aktifet`, {}, { withCredentials: true })
      yukle()
    } catch (e) { alert(e.response?.data?.hata || 'İşlem başarısız') }
  }

  const sil = async (id) => {
    if (!confirm('Bu ustayı kalıcı olarak silmek istiyor musunuz?')) return
    try {
      await axios.delete(`${API}/api/admin/ustalar/${id}`, { withCredentials: true })
      yukle()
    } catch (e) { alert(e.response?.data?.hata || 'Silinemedi') }
  }

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b] flex items-center gap-2">
            <ShieldOff size={20} className="text-red-500" />
            Kara Liste
          </h2>
          <p className="text-gray-500 text-sm">{ustalar.length} yasaklı usta</p>
        </div>
        <button onClick={yukle} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052CC] transition">
          <RefreshCw size={15} /> Yenile
        </button>
      </div>

      {/* Arama */}
      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm p-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={arama}
            onChange={e => setArama(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && yukle()}
            placeholder="Ad, soyad veya telefon..."
            className="w-full pl-9 pr-4 py-2 border border-[#C8CDD4] rounded-lg text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20 bg-[#F8F9FA]"
          />
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : ustalar.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <ShieldOff size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm">Kara listede usta yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                <tr>
                  {['Ad Soyad', 'Kategori', 'Şehir', 'Telefon', 'Kayıt Tarihi', 'İşlem'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F8]">
                {ustalar.map(u => (
                  <tr key={u.id} className="hover:bg-red-50/30 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#1e293b]">{u.ad_soyad || `${u.ad} ${u.soyad}`}</div>
                      <div className="text-xs text-red-500 font-medium flex items-center gap-1 mt-0.5">
                        <ShieldOff size={11} /> Yasaklı
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.kategori || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{u.sehir || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{u.telefon}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.olusturma ? new Date(u.olusturma).toLocaleDateString('tr-TR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetay(u)}
                          title="Detay"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => yasagıKaldir(u.id)}
                          title="Yasağı Kaldır"
                          className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition"
                        >
                          <ShieldCheck size={14} />
                        </button>
                        <button
                          onClick={() => sil(u.id)}
                          title="Kalıcı Sil"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detay Modal */}
      {detay && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDetay(null)}>
          <div className="bg-white border border-[#C8CDD4] rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#C8CDD4]">
              <div>
                <h3 className="font-bold text-[#1e293b]">{detay.ad_soyad || `${detay.ad} ${detay.soyad}`}</h3>
                <span className="text-xs text-red-500 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldOff size={11} /> Yasaklı
                </span>
              </div>
              <button onClick={() => setDetay(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm text-gray-700">
              {[
                ['Kategori', detay.kategori],
                ['Telefon', detay.telefon],
                ['E-posta', detay.email],
                ['Şehir', detay.sehir],
                ['Deneyim', detay.deneyim_yil ? `${detay.deneyim_yil} yıl` : null],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="font-semibold text-gray-500 w-24 shrink-0">{k}:</span>
                  <span>{v}</span>
                </div>
              ))}
              {detay.aciklama && (
                <div className="bg-[#F8F9FA] border border-[#E0E0E0] rounded-lg p-3 text-gray-600 text-xs mt-2">
                  {detay.aciklama}
                </div>
              )}
            </div>
            <div className="flex gap-2 px-6 pb-5">
              <button
                onClick={() => { yasagıKaldir(detay.id); setDetay(null) }}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={15} /> Yasağı Kaldır
              </button>
              <button
                onClick={() => { sil(detay.id); setDetay(null) }}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <Trash2 size={15} /> Kalıcı Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
