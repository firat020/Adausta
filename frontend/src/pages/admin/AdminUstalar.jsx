import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Search, Check, X, Trash2, Eye, RefreshCw } from 'lucide-react'

const API = 'http://localhost:5000'

const FILTRELER = [
  { key: 'hepsi', label: 'Hepsi' },
  { key: 'bekleyen', label: 'Onay Bekleyen' },
  { key: 'onaylandi', label: 'Onaylı' },
  { key: 'pasif', label: 'Pasif / Yasaklı' },
]

function Rozet({ onaylanmis, aktif }) {
  if (!aktif) return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Yasaklı</span>
  if (onaylanmis) return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Onaylı</span>
  return <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">Bekliyor</span>
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
      const r = await axios.get(`${API}/api/admin/ustalar`, {
        params: { filtre, arama },
        withCredentials: true
      })
      setUstalar(r.data.ustalar)
      setSecili([])
    } catch (e) {
      console.error(e)
    }
    setYukleniyor(false)
  }, [filtre, arama])

  useEffect(() => { yukle() }, [yukle])

  const islem = async (id, tip) => {
    try {
      if (tip === 'sil') {
        if (!confirm('Bu ustayı silmek istediğinize emin misiniz?')) return
        await axios.delete(`${API}/api/admin/ustalar/${id}`, { withCredentials: true })
      } else {
        await axios.post(`${API}/api/admin/ustalar/${id}/${tip}`, {}, { withCredentials: true })
      }
      yukle()
    } catch (e) {
      alert(e.response?.data?.hata || 'İşlem başarısız')
    }
  }

  const topluIslem = async (tip) => {
    if (!secili.length) return
    if (!confirm(`${secili.length} usta için "${tip}" yapılsın mı?`)) return
    try {
      await axios.post(`${API}/api/admin/ustalar/toplu`, { islem: tip, idler: secili }, { withCredentials: true })
      yukle()
    } catch (e) {
      alert('İşlem başarısız')
    }
  }

  const hepsiniSec = (e) => {
    setSecili(e.target.checked ? ustalar.map(u => u.id) : [])
  }

  const toggleSec = (id) => {
    setSecili(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Usta Yönetimi</h2>
          <p className="text-gray-500 text-sm">{ustalar.length} kayıt</p>
        </div>
        <button onClick={yukle} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1e3a5f]">
          <RefreshCw size={16} /> Yenile
        </button>
      </div>

      {/* Filtreler + Arama */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {FILTRELER.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltre(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filtre === f.key
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={arama}
            onChange={e => setArama(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && yukle()}
            placeholder="Ad, soyad veya telefon..."
            className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1e3a5f]"
          />
        </div>
      </div>

      {/* Toplu işlem */}
      {secili.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-blue-700">{secili.length} usta seçildi</span>
          <button onClick={() => topluIslem('onayla')} className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Toplu Onayla</button>
          <button onClick={() => topluIslem('reddet')} className="px-3 py-1 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">Toplu Reddet</button>
          <button onClick={() => topluIslem('sil')} className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Toplu Sil</button>
          <button onClick={() => setSecili([])} className="ml-auto text-blue-500 text-sm">Seçimi Kaldır</button>
        </div>
      )}

      {/* Tablo */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
          </div>
        ) : ustalar.length === 0 ? (
          <div className="text-center text-gray-400 py-16">Kayıt bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" onChange={hepsiniSec} checked={secili.length === ustalar.length && ustalar.length > 0} className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Ad Soyad</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Kategori</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Şehir</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Telefon</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Puan</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Durum</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tarih</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ustalar.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={secili.includes(u.id)} onChange={() => toggleSec(u.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{u.ad_soyad || `${u.ad} ${u.soyad}`}</td>
                    <td className="px-4 py-3 text-gray-600">{u.kategori}</td>
                    <td className="px-4 py-3 text-gray-600">{u.sehir || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{u.telefon}</td>
                    <td className="px-4 py-3">
                      {u.puan > 0 ? (
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          {u.puan}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Rozet onaylanmis={u.onaylanmis} aktif={u.aktif} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.olusturma ? new Date(u.olusturma).toLocaleDateString('tr-TR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetay(u)}
                          title="Detay"
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-500"
                        >
                          <Eye size={15} />
                        </button>
                        {!u.onaylanmis && u.aktif && (
                          <button
                            onClick={() => islem(u.id, 'onayla')}
                            title="Onayla"
                            className="p-1.5 rounded hover:bg-green-50 text-green-600"
                          >
                            <Check size={15} />
                          </button>
                        )}
                        {u.aktif && (
                          <button
                            onClick={() => islem(u.id, 'reddet')}
                            title="Reddet / Yasakla"
                            className="p-1.5 rounded hover:bg-orange-50 text-orange-500"
                          >
                            <X size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => islem(u.id, 'sil')}
                          title="Sil"
                          className="p-1.5 rounded hover:bg-red-50 text-red-500"
                        >
                          <Trash2 size={15} />
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{detay.ad_soyad || `${detay.ad} ${detay.soyad}`}</h3>
              <button onClick={() => setDetay(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex gap-2"><span className="font-medium w-28">Kategori:</span><span>{detay.kategori}</span></div>
              <div className="flex gap-2"><span className="font-medium w-28">Telefon:</span><span>{detay.telefon}</span></div>
              {detay.email && <div className="flex gap-2"><span className="font-medium w-28">E-posta:</span><span>{detay.email}</span></div>}
              <div className="flex gap-2"><span className="font-medium w-28">Şehir:</span><span>{detay.sehir || '—'}</span></div>
              <div className="flex gap-2"><span className="font-medium w-28">Puan:</span><span>{detay.puan || '—'} ({detay.yorum_sayisi} yorum)</span></div>
              {detay.aciklama && <div className="flex gap-2"><span className="font-medium w-28">Açıklama:</span><span>{detay.aciklama}</span></div>}
            </div>
            <div className="flex gap-2 mt-5">
              {!detay.onaylanmis && detay.aktif && (
                <button
                  onClick={() => { islem(detay.id, 'onayla'); setDetay(null) }}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700"
                >
                  Onayla
                </button>
              )}
              <button
                onClick={() => { islem(detay.id, 'reddet'); setDetay(null) }}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm hover:bg-orange-600"
              >
                Reddet
              </button>
              <button
                onClick={() => { islem(detay.id, 'sil'); setDetay(null) }}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
