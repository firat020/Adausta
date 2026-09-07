import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Search, Check, X, Trash2, Eye, RefreshCw, Pencil, Save } from 'lucide-react'

import API from '../../config.js'

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

export default function AdminSirketler() {
  const [sirketler, setSirketler] = useState([])
  const [filtre, setFiltre] = useState('hepsi')
  const [arama, setArama] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [secili, setSecili] = useState([])
  const [detay, setDetay] = useState(null)
  const [duzenle, setDuzenle] = useState(false)
  const [form, setForm] = useState({})
  const [sehirler, setSehirler] = useState([])
  const [kaydetYukleniyor, setKaydetYukleniyor] = useState(false)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/sirketler`, { params: { filtre, arama }, withCredentials: true })
      setSirketler(r.data.sirketler)
      setSecili([])
    } catch (e) { console.error(e) }
    setYukleniyor(false)
  }, [filtre, arama])

  useEffect(() => { yukle() }, [yukle])

  const islem = async (id, tip) => {
    try {
      if (tip === 'sil') {
        if (!confirm('Bu şirketi kalıcı olarak silmek istiyor musunuz?')) return
        await axios.delete(`${API}/api/admin/sirketler/${id}`, { withCredentials: true })
      } else {
        await axios.post(`${API}/api/admin/sirketler/${id}/${tip}`, {}, { withCredentials: true })
      }
      yukle()
    } catch (e) { alert(e.response?.data?.hata || 'İşlem başarısız') }
  }

  const topluIslem = async (tip) => {
    if (!secili.length) return
    if (!confirm(`${secili.length} şirket için "${tip}" yapılsın mı?`)) return
    try {
      await axios.post(`${API}/api/admin/sirketler/toplu`, { islem: tip, idler: secili }, { withCredentials: true })
      yukle()
    } catch { alert('İşlem başarısız') }
  }

  const hepsiniSec = (e) => setSecili(e.target.checked ? sirketler.map(s => s.id) : [])
  const toggleSec = (id) => setSecili(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const detayAc = async (s) => {
    setDetay(s)
    setDuzenle(false)
    setForm({
      sirket_adi: s.sirket_adi || '', vergi_no: s.vergi_no || '', yetkili_ad: s.yetkili_ad || '',
      telefon: s.telefon || '', whatsapp: s.whatsapp || '', email: s.email || '', sehir_id: s.sehir_id || '',
    })
    if (!sehirler.length) {
      try { const r = await axios.get(`${API}/api/kategoriler/sehirler`); setSehirler(r.data.sehirler || []) } catch {}
    }
  }

  const kaydet = async () => {
    setKaydetYukleniyor(true)
    try {
      await axios.put(`${API}/api/admin/sirketler/${detay.id}`, form, { withCredentials: true })
      setDuzenle(false)
      setDetay(d => ({ ...d, ...form, sehir: sehirler.find(s => s.id === parseInt(form.sehir_id))?.ad || d.sehir }))
      yukle()
    } catch (e) { alert(e.response?.data?.hata || 'Kayıt başarısız') }
    setKaydetYukleniyor(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Şirket Yönetimi</h2>
          <p className="text-gray-500 text-sm">{sirketler.length} kayıt</p>
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
            placeholder="Şirket adı, yetkili veya telefon..."
            className="w-full pl-9 pr-4 py-2 border border-[#C8CDD4] rounded-lg text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20 bg-[#F8F9FA]"
          />
        </div>
      </div>

      {secili.length > 0 && (
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-[#1D4ED8]">{secili.length} şirket seçildi</span>
          <button onClick={() => topluIslem('onayla')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700">Toplu Onayla</button>
          <button onClick={() => topluIslem('reddet')} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600">Toplu Reddet</button>
          <button onClick={() => topluIslem('sil')} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">Toplu Sil</button>
          <button onClick={() => setSecili([])} className="ml-auto text-[#1D4ED8] text-xs hover:underline">Seçimi Kaldır</button>
        </div>
      )}

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : sirketler.length === 0 ? (
          <div className="text-center text-gray-400 py-16 text-sm">Kayıt bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" onChange={hepsiniSec} checked={secili.length === sirketler.length && sirketler.length > 0} className="rounded border-gray-300" />
                  </th>
                  {['Şirket', 'Yetkili', 'Kategori', 'Şehir', 'Telefon', 'Durum', 'Tarih', 'İşlem'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F8]">
                {sirketler.map(s => (
                  <tr key={s.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={secili.includes(s.id)} onChange={() => toggleSec(s.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#1e293b]">{s.sirket_adi}</td>
                    <td className="px-4 py-3 text-gray-600">{s.yetkili_ad}</td>
                    <td className="px-4 py-3 text-gray-600">{s.kategori}</td>
                    <td className="px-4 py-3 text-gray-500">{s.sehir || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{s.telefon}</td>
                    <td className="px-4 py-3"><Rozet onaylanmis={s.onaylanmis} aktif={s.aktif} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {s.olusturma ? new Date(s.olusturma).toLocaleDateString('tr-TR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => detayAc(s)} title="Detay" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"><Eye size={14} /></button>
                        {!s.onaylanmis && s.aktif && (
                          <button onClick={() => islem(s.id, 'onayla')} title="Onayla" className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition"><Check size={14} /></button>
                        )}
                        {s.aktif && (
                          <button onClick={() => islem(s.id, 'reddet')} title="Yasakla" className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition"><X size={14} /></button>
                        )}
                        <button onClick={() => islem(s.id, 'sil')} title="Sil" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detay && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDetay(null)}>
          <div className="bg-white border border-[#C8CDD4] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#C8CDD4] sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="font-bold text-[#1e293b]">{detay.sirket_adi}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDuzenle(p => !p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${duzenle ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-[#EFF6FF] text-[#0052CC] border-[#BFDBFE] hover:bg-[#DBEAFE]'}`}
                >
                  <Pencil size={12} /> {duzenle ? 'Vazgeç' : 'Düzenle'}
                </button>
                <button onClick={() => setDetay(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4 text-sm text-gray-700">
              {duzenle ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Şirket Adı</label>
                    <input value={form.sirket_adi} onChange={e => setForm(p => ({ ...p, sirket_adi: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[['Vergi No', 'vergi_no'], ['Yetkili', 'yetkili_ad']].map(([label, key]) => (
                      <div key={key}>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                        <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[['Telefon', 'telefon'], ['WhatsApp', 'whatsapp']].map(([label, key]) => (
                      <div key={key}>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                        <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">E-posta</label>
                    <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Şehir</label>
                    <select value={form.sehir_id} onChange={e => setForm(p => ({ ...p, sehir_id: parseInt(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC]">
                      <option value="">Seçin</option>
                      {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                    </select>
                  </div>
                  <button onClick={kaydet} disabled={kaydetYukleniyor}
                    className="w-full flex items-center justify-center gap-2 bg-[#0052CC] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#003d99] disabled:opacity-50 transition">
                    <Save size={14} /> {kaydetYukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              ) : (
                <>
                  {[
                    ['Vergi No', detay.vergi_no],
                    ['Yetkili', detay.yetkili_ad],
                    ['Telefon', detay.telefon],
                    ['WhatsApp', detay.whatsapp],
                    ['E-posta', detay.email],
                    ['Şehir', detay.sehir],
                    ['Kategori', detay.kategori],
                    ['Adres', detay.adres],
                    ['Website', detay.website],
                    ['Plan', detay.plan],
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
                </>
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
