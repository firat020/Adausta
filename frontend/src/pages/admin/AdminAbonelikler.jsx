import { useEffect, useState } from 'react'
import axios from 'axios'
import { AlertCircle, Plus, X } from 'lucide-react'

import API from '../../config.js'
// API

const durumRenk = {
  aktif: 'bg-green-100 text-green-700',
  askida: 'bg-orange-100 text-orange-700',
  iptal: 'bg-red-100 text-red-600',
}

export default function AdminAbonelikler() {
  const [liste, setListe] = useState([])
  const [planlar, setPlanlar] = useState([])
  const [ustalar, setUstalar] = useState([])
  const [filtre, setFiltre] = useState('hepsi')
  const [arama, setArama] = useState('')
  const [yeniForm, setYeniForm] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(false)

  const yukle = () =>
    axios.get(`${API}/api/admin/abonelik-listesi?filtre=${filtre}&arama=${arama}`, { withCredentials: true })
      .then(r => setListe(r.data.abonelikler))

  useEffect(() => {
    yukle()
    axios.get(`${API}/api/admin/planlar`, { withCredentials: true }).then(r => setPlanlar(r.data.planlar))
    axios.get(`${API}/api/admin/ustalar`, { withCredentials: true }).then(r => setUstalar(r.data.ustalar))
  }, [filtre])

  const durumDegistir = async (id, durum) => {
    await axios.post(`${API}/api/admin/abonelik-listesi/${id}/durum`, { durum }, { withCredentials: true })
    yukle()
  }

  const abonelikEkle = async (e) => {
    e.preventDefault()
    setYukleniyor(true)
    try {
      await axios.post(`${API}/api/admin/abonelik-listesi`, yeniForm, { withCredentials: true })
      setYeniForm(null)
      yukle()
    } catch {}
    setYukleniyor(false)
  }

  const bugun = new Date()
  const ucGunSonra = new Date(bugun.getTime() + 3 * 24 * 60 * 60 * 1000)

  const yaklasiyor = (tarihStr) => {
    if (!tarihStr) return false
    const [gun, ay, yil] = tarihStr.split(' ')[0].split('.')
    const t = new Date(`${yil}-${ay}-${gun}`)
    return t <= ucGunSonra && t >= bugun
  }

  const filtreli = arama
    ? liste.filter(a => a.usta_ad.toLowerCase().includes(arama.toLowerCase()))
    : liste

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Abonelik Takibi</h2>
          <p className="text-gray-500 text-sm">Usta aboneliklerini yönetin</p>
        </div>
        <button onClick={() => setYeniForm({ usta_id: '', plan_id: '' })}
          className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-medium hover:bg-[#003d99] transition">
          <Plus size={16} /> Yeni Abonelik
        </button>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <input
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] w-60"
          placeholder="Usta ara..."
          value={arama}
          onChange={e => setArama(e.target.value)}
        />
        {['hepsi', 'aktif', 'askida', 'iptal'].map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition border ${filtre === f ? 'bg-[#0052CC] text-white border-[#0052CC]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0052CC]'}`}>
            {f === 'hepsi' ? 'Tümü' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tablo */}
      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F9FA] border-b border-[#E0E0E0]">
              <tr>
                {['Usta', 'Plan', 'Fiyat', 'Başlangıç', 'Bitiş', 'Yenileme', 'Durum', 'İşlem'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtreli.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Abonelik bulunamadı</td></tr>
              ) : filtreli.map(a => (
                <tr key={a.id} className={`hover:bg-gray-50 transition ${yaklasiyor(a.yenileme_tarihi) ? 'bg-yellow-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-[#1e293b]">
                    {a.usta_ad}
                    {yaklasiyor(a.yenileme_tarihi) && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-orange-600">
                        <AlertCircle size={11} /> Yenileme yaklaşıyor
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.plan_ad}</td>
                  <td className="px-4 py-3 text-gray-600">{a.plan_fiyat > 0 ? `${a.plan_fiyat} ₺` : 'Ücretsiz'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{a.baslangic}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{a.bitis || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{a.yenileme_tarihi || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${durumRenk[a.durum] || 'bg-gray-100 text-gray-600'}`}>
                      {a.durum}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={a.durum}
                      onChange={e => durumDegistir(a.id, e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#0052CC]"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="askida">Askıya Al</option>
                      <option value="iptal">İptal Et</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yeni Abonelik Modal */}
      {yeniForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-[#1e293b]">Yeni Abonelik</h3>
              <button onClick={() => setYeniForm(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={abonelikEkle} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Usta</label>
                <select required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC]"
                  value={yeniForm.usta_id} onChange={e => setYeniForm({ ...yeniForm, usta_id: parseInt(e.target.value) })}>
                  <option value="">Usta seçin</option>
                  {ustalar.map(u => <option key={u.id} value={u.id}>{u.ad} {u.soyad}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Plan</label>
                <select required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC]"
                  value={yeniForm.plan_id} onChange={e => setYeniForm({ ...yeniForm, plan_id: parseInt(e.target.value) })}>
                  <option value="">Plan seçin</option>
                  {planlar.map(p => <option key={p.id} value={p.id}>{p.ad} — {p.fiyat > 0 ? `${p.fiyat} ₺/${p.sure_tip}` : 'Ücretsiz'}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={yukleniyor}
                  className="flex-1 py-2.5 bg-[#0052CC] text-white rounded-lg text-sm font-medium hover:bg-[#003d99] transition disabled:opacity-50">
                  {yukleniyor ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
                <button type="button" onClick={() => setYeniForm(null)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
