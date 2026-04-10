import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Search, Check, X, Trash2, Eye, RefreshCw } from 'lucide-react'

const API = 'http://localhost:5000'

const FILTRELER = [
  { key: 'hepsi', label: 'Hepsi' },
  { key: 'bekleyen', label: 'Bekleyen' },
  { key: 'onaylandi', label: 'Onaylı' },
  { key: 'pasif', label: 'Yasaklı' },
]

function Rozet({ onaylanmis, aktif }) {
  if (!aktif) return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">Yasaklı</span>
  if (onaylanmis) return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Onaylı</span>
  return <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 font-medium">Bekliyor</span>
}

export default function AdminUstalar() {
  const [ustalar, setUstalar] = useState([])
  const [filtre, setFiltre] = useState('hepsi')
  const [arama, setArama] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [secili, setSecili] = useState([])
  const [detay, setDetay] = useState(null)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/ustalar`, { params: { filtre, arama }, withCredentials: true })
      setUstalar(r.data.ustalar)
      setSecili([])
    } catch (e) { console.error(e) }
    setYukleniyor(false)
  }, [filtre, arama])

  useEffect(() => { yukle() }, [yukle])

  const islem = async (id, tip) => {
    try {
      if (tip === 'sil') {
        if (!confirm('Bu ustayı kalıcı olarak silmek istiyor musunuz?')) return
        await axios.delete(`${API}/api/admin/ustalar/${id}`, { withCredentials: true })
      } else {
        await axios.post(`${API}/api/admin/ustalar/${id}/${tip}`, {}, { withCredentials: true })
      }
      yukle()
    } catch (e) { alert(e.response?.data?.hata || 'İşlem başarısız') }
  }

  const topluIslem = async (tip) => {
    if (!secili.length) return
    if (!confirm(`${secili.length} usta için "${tip}" yapılsın mı?`)) return
    try {
      await axios.post(`${API}/api/admin/ustalar/toplu`, { islem: tip, idler: secili }, { withCredentials: true })
      yukle()
    } catch { alert('İşlem başarısız') }
  }

  const hepsiniSec = (e) => setSecili(e.target.checked ? ustalar.map(u => u.id) : [])
  const toggleSec = (id) => setSecili(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Usta Yönetimi</h2>
          <p className="text-gray-500 text-sm">{ustalar.length} kayıt</p>
        </div>
        <button onClick={yukle} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052CC] transition">
          <RefreshCw size={15} /> Yenile
        </button>
      </div>

      {/* Filtreler + Arama */}
      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1.5 flex-wrap">
          {FILTRELER.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltre(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                filtre === f.key
                  ? 'bg-[#003d99] text-white border-[#0052CC] shadow-sm'
                  : 'bg-[#F8F9FA] text-gray-600 border-[#E0E0E0] hover:border-[#0052CC] hover:text-[#0052CC]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] relative">
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

      {/* Toplu işlem */}
      {secili.length > 0 && (
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-[#1D4ED8]">{secili.length} usta seçildi</span>
          <button onClick={() => topluIslem('onayla')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700">Toplu Onayla</button>
          <button onClick={() => topluIslem('reddet')} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600">Toplu Reddet</button>
          <button onClick={() => topluIslem('sil')} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">Toplu Sil</button>
          <button onClick={() => setSecili([])} className="ml-auto text-[#1D4ED8] text-xs hover:underline">Seçimi Kaldır</button>
        </div>
      )}

      {/* Tablo */}
      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : ustalar.length === 0 ? (
          <div className="text-center text-gray-400 py-16 text-sm">Kayıt bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" onChange={hepsiniSec} checked={secili.length === ustalar.length && ustalar.length > 0} className="rounded border-gray-300" />
                  </th>
                  {['Ad Soyad', 'Kategori', 'Şehir', 'Telefon', 'Puan', 'Durum', 'Tarih', 'İşlem'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F8]">
                {ustalar.map(u => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={secili.includes(u.id)} onChange={() => toggleSec(u.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#1e293b]">{u.ad_soyad || `${u.ad} ${u.soyad}`}</td>
                    <td className="px-4 py-3 text-gray-600">{u.kategori}</td>
                    <td className="px-4 py-3 text-gray-500">{u.sehir || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{u.telefon}</td>
                    <td className="px-4 py-3">
                      {u.puan > 0 ? <span className="flex items-center gap-1 text-amber-600 font-semibold"><span>★</span>{u.puan}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3"><Rozet onaylanmis={u.onaylanmis} aktif={u.aktif} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.olusturma ? new Date(u.olusturma).toLocaleDateString('tr-TR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDetay(u)} title="Detay" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"><Eye size={14} /></button>
                        {!u.onaylanmis && u.aktif && (
                          <button onClick={() => islem(u.id, 'onayla')} title="Onayla" className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition"><Check size={14} /></button>
                        )}
                        {u.aktif && (
                          <button onClick={() => islem(u.id, 'reddet')} title="Yasakla" className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition"><X size={14} /></button>
                        )}
                        <button onClick={() => islem(u.id, 'sil')} title="Sil" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"><Trash2 size={14} /></button>
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
              <h3 className="font-bold text-[#1e293b]">{detay.ad_soyad || `${detay.ad} ${detay.soyad}`}</h3>
              <button onClick={() => setDetay(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm text-gray-700">
              {[
                ['Kategori', detay.kategori],
                ['Telefon', detay.telefon],
                ['E-posta', detay.email],
                ['Şehir', detay.sehir],
                ['Puan', detay.puan ? `${detay.puan} / 5.0 (${detay.yorum_sayisi} yorum)` : null],
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
              {!detay.onaylanmis && detay.aktif && (
                <button onClick={() => { islem(detay.id, 'onayla'); setDetay(null) }} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700">Onayla</button>
              )}
              <button onClick={() => { islem(detay.id, 'reddet'); setDetay(null) }} className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600">Yasakla</button>
              <button onClick={() => { islem(detay.id, 'sil'); setDetay(null) }} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
