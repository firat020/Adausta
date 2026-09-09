import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Search, Ban, CheckCircle, Trash2, RefreshCw, User } from 'lucide-react'

import API from '../../config.js'

const FILTRELER = [
  { key: 'hepsi', label: 'Hepsi' },
  { key: 'aktif', label: 'Aktif' },
  { key: 'pasif', label: 'Pasif' },
]

function Rozet({ aktif }) {
  return aktif
    ? <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Aktif</span>
    : <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">Pasif</span>
}

export default function AdminUyeler() {
  const [uyeler, setUyeler] = useState([])
  const [filtre, setFiltre] = useState('hepsi')
  const [arama, setArama] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/uyeler`, { params: { filtre, arama }, withCredentials: true })
      setUyeler(r.data.uyeler)
    } catch (e) { console.error(e) }
    setYukleniyor(false)
  }, [filtre, arama])

  useEffect(() => { yukle() }, [yukle])

  const islem = async (id, tip) => {
    try {
      if (tip === 'sil') {
        if (!confirm('Bu üyeyi kalıcı olarak silmek istiyor musunuz?')) return
        await axios.delete(`${API}/api/admin/uyeler/${id}`, { withCredentials: true })
      } else {
        await axios.post(`${API}/api/admin/uyeler/${id}/${tip}`, {}, { withCredentials: true })
      }
      yukle()
    } catch (e) { alert(e.response?.data?.hata || 'İşlem başarısız') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Üye Yönetimi</h2>
          <p className="text-gray-500 text-sm">"Üye Ol" ile kaydolan müşteriler — {uyeler.length} kayıt</p>
        </div>
        <button onClick={yukle} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052CC] transition">
          <RefreshCw size={15} /> Yenile
        </button>
      </div>

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
            placeholder="Ad, e-posta veya telefon..."
            className="w-full pl-9 pr-4 py-2 border border-[#C8CDD4] rounded-lg text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20 bg-[#F8F9FA]"
          />
        </div>
      </div>

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : uyeler.length === 0 ? (
          <div className="text-center text-gray-400 py-16 text-sm">Kayıt bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                <tr>
                  {['Ad Soyad', 'E-posta', 'Telefon', 'Giriş Yöntemi', 'Durum', 'Kayıt Tarihi', 'İşlem'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F8]">
                {uyeler.map(u => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="px-4 py-3 font-semibold text-[#1e293b]">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                          <User size={13} />
                        </span>
                        {(u.ad || u.soyad) ? `${u.ad} ${u.soyad}`.trim() : <span className="text-gray-400 font-normal">İsimsiz</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{u.telefon || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.sifre_var === false ? 'Google' : 'E-posta / Şifre'}</td>
                    <td className="px-4 py-3"><Rozet aktif={u.aktif} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.olusturma || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {u.aktif ? (
                          <button onClick={() => islem(u.id, 'pasifet')} title="Pasifleştir" className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition"><Ban size={14} /></button>
                        ) : (
                          <button onClick={() => islem(u.id, 'aktifet')} title="Aktifleştir" className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition"><CheckCircle size={14} /></button>
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
    </div>
  )
}
