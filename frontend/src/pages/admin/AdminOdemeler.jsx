import { useEffect, useState } from 'react'
import axios from 'axios'
import { Plus, X } from 'lucide-react'

import API from '../../config.js'
// API

const durumRenk = {
  basarili: 'bg-green-100 text-green-700',
  basarisiz: 'bg-red-100 text-red-600',
  bekliyor: 'bg-yellow-100 text-yellow-700',
}

export default function AdminOdemeler() {
  const [liste, setListe] = useState([])
  const [ustalar, setUstalar] = useState([])
  const [filtre, setFiltre] = useState('hepsi')
  const [arama, setArama] = useState('')
  const [yeniForm, setYeniForm] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(false)

  const yukle = () =>
    axios.get(`${API}/api/admin/odemeler?filtre=${filtre}`, { withCredentials: true })
      .then(r => setListe(r.data.odemeler))

  useEffect(() => {
    yukle()
    axios.get(`${API}/api/admin/ustalar`, { withCredentials: true }).then(r => setUstalar(r.data.ustalar))
  }, [filtre])

  const kaydet = async (e) => {
    e.preventDefault()
    setYukleniyor(true)
    try {
      await axios.post(`${API}/api/admin/odemeler`, {
        ...yeniForm, tutar: parseFloat(yeniForm.tutar)
      }, { withCredentials: true })
      setYeniForm(null)
      yukle()
    } catch {}
    setYukleniyor(false)
  }

  const filtreli = arama
    ? liste.filter(o => o.usta_ad.toLowerCase().includes(arama.toLowerCase()))
    : liste

  const toplamBasarili = liste.filter(o => o.durum === 'basarili').reduce((t, o) => t + o.tutar, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Ödeme Geçmişi</h2>
          <p className="text-gray-500 text-sm">Tüm ödeme işlemleri</p>
        </div>
        <button onClick={() => setYeniForm({ usta_id: '', tutar: '', durum: 'basarili', aciklama: '' })}
          className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-medium hover:bg-[#003d99] transition">
          <Plus size={16} /> Manuel Ödeme Ekle
        </button>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { etiket: 'Başarılı Ödemeler', deger: liste.filter(o => o.durum === 'basarili').length, renk: 'text-green-600' },
          { etiket: 'Bekleyen', deger: liste.filter(o => o.durum === 'bekliyor').length, renk: 'text-yellow-600' },
          { etiket: 'Toplam Tahsilat', deger: `${toplamBasarili.toLocaleString('tr-TR')} ₺`, renk: 'text-[#0052CC]' },
        ].map(({ etiket, deger, renk }) => (
          <div key={etiket} className="bg-white border border-[#C8CDD4] rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${renk}`}>{deger}</p>
            <p className="text-xs text-gray-500 mt-0.5">{etiket}</p>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <input
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] w-60"
          placeholder="Usta ara..."
          value={arama}
          onChange={e => setArama(e.target.value)}
        />
        {['hepsi', 'basarili', 'bekliyor', 'basarisiz'].map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition border ${filtre === f ? 'bg-[#0052CC] text-white border-[#0052CC]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0052CC]'}`}>
            {f === 'hepsi' ? 'Tümü' : f === 'basarili' ? 'Başarılı' : f === 'bekliyor' ? 'Bekleyen' : 'Başarısız'}
          </button>
        ))}
      </div>

      {/* Tablo */}
      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F9FA] border-b border-[#E0E0E0]">
              <tr>
                {['#', 'Usta', 'Tutar', 'Durum', 'Açıklama', 'Tarih'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtreli.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Ödeme kaydı bulunamadı</td></tr>
              ) : filtreli.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-400 text-xs">#{o.id}</td>
                  <td className="px-4 py-3 font-medium text-[#1e293b]">{o.usta_ad}</td>
                  <td className="px-4 py-3 font-bold text-[#0052CC]">{o.tutar.toLocaleString('tr-TR')} ₺</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${durumRenk[o.durum] || 'bg-gray-100 text-gray-600'}`}>
                      {o.durum === 'basarili' ? 'Başarılı' : o.durum === 'bekliyor' ? 'Bekleyen' : 'Başarısız'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{o.aciklama || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{o.tarih}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manuel Ödeme Modal */}
      {yeniForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-[#1e293b]">Manuel Ödeme Ekle</h3>
              <button onClick={() => setYeniForm(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={kaydet} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Usta</label>
                <select required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC]"
                  value={yeniForm.usta_id} onChange={e => setYeniForm({ ...yeniForm, usta_id: parseInt(e.target.value) })}>
                  <option value="">Usta seçin</option>
                  {ustalar.map(u => <option key={u.id} value={u.id}>{u.ad} {u.soyad}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Tutar (₺)</label>
                  <input type="number" min="0" step="0.01" required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC]"
                    value={yeniForm.tutar} onChange={e => setYeniForm({ ...yeniForm, tutar: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Durum</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC]"
                    value={yeniForm.durum} onChange={e => setYeniForm({ ...yeniForm, durum: e.target.value })}>
                    <option value="basarili">Başarılı</option>
                    <option value="bekliyor">Bekleyen</option>
                    <option value="basarisiz">Başarısız</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Açıklama</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC]"
                  value={yeniForm.aciklama} onChange={e => setYeniForm({ ...yeniForm, aciklama: e.target.value })} placeholder="Banka havalesi, nakit vb." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={yukleniyor}
                  className="flex-1 py-2.5 bg-[#0052CC] text-white rounded-lg text-sm font-medium hover:bg-[#003d99] transition disabled:opacity-50">
                  {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
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
