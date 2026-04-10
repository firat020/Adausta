import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Plus, Pencil, Trash2, X, Check, Users, Star, Clock, ChevronRight } from 'lucide-react'

const API = 'http://localhost:5000'

function Rozet({ onaylanmis, aktif }) {
  if (!aktif) return <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 font-semibold">Yasaklı</span>
  if (onaylanmis) return <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-700 font-semibold">Onaylı</span>
  return <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-700 font-semibold">Bekliyor</span>
}

export default function AdminKategoriler() {
  const [kategoriler, setKategoriler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [secili, setSecili] = useState(null)
  const [ustalar, setUstalar] = useState([])
  const [ustaYukleniyor, setUstaYukleniyor] = useState(false)
  const [modal, setModal] = useState(null) // null | 'yeni' | kategori objesi
  const [form, setForm] = useState({ ad: '', ikon: '🔧', aciklama: '' })

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/kategoriler`, { withCredentials: true })
      setKategoriler(r.data.kategoriler)
    } catch (e) { console.error(e) }
    setYukleniyor(false)
  }, [])

  useEffect(() => { yukle() }, [yukle])

  // Kategori seçilince ustalarını getir
  const kategoriSec = async (k) => {
    setSecili(k)
    setUstalar([])
    setUstaYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/ustalar`, {
        params: { filtre: 'hepsi', kategori_id: k.id },
        withCredentials: true
      })
      setUstalar(r.data.ustalar)
    } catch (e) { console.error(e) }
    setUstaYukleniyor(false)
  }

  const acModal = (k) => {
    if (k === 'yeni') {
      setForm({ ad: '', ikon: '🔧', aciklama: '' })
    } else {
      setForm({ ad: k.ad, ikon: k.ikon || '🔧', aciklama: k.aciklama || '' })
    }
    setModal(k)
  }

  const kaydet = async () => {
    if (!form.ad.trim()) return
    try {
      if (modal === 'yeni') {
        await axios.post(`${API}/api/admin/kategoriler`, form, { withCredentials: true })
      } else {
        await axios.put(`${API}/api/admin/kategoriler/${modal.id}`, form, { withCredentials: true })
      }
      setModal(null)
      await yukle()
      // Güncellendiyse seçili kategoriyi de yenile
      if (modal !== 'yeni' && secili?.id === modal.id) {
        const r = await axios.get(`${API}/api/admin/kategoriler`, { withCredentials: true })
        const guncellenmis = r.data.kategoriler.find(k => k.id === modal.id)
        if (guncellenmis) setSecili(guncellenmis)
      }
    } catch { alert('İşlem başarısız') }
  }

  const sil = async (id, ad) => {
    if (!confirm(`"${ad}" kategorisini silmek istediğinize emin misiniz?`)) return
    try {
      await axios.delete(`${API}/api/admin/kategoriler/${id}`, { withCredentials: true })
      if (secili?.id === id) setSecili(null)
      yukle()
    } catch { alert('Silinemedi') }
  }

  const ustaIslem = async (id, tip) => {
    try {
      if (tip === 'sil') {
        if (!confirm('Bu ustayı silmek istiyor musunuz?')) return
        await axios.delete(`${API}/api/admin/ustalar/${id}`, { withCredentials: true })
      } else {
        await axios.post(`${API}/api/admin/ustalar/${id}/${tip}`, {}, { withCredentials: true })
      }
      if (secili) kategoriSec(secili)
      yukle()
    } catch { alert('İşlem başarısız') }
  }

  // Grupla
  const gruplar = kategoriler.reduce((acc, k) => {
    const g = k.grup || 'Diğer'
    if (!acc[g]) acc[g] = []
    acc[g].push(k)
    return acc
  }, {})

  // Seçili kategori istatistikleri
  const onayliSayisi = ustalar.filter(u => u.onaylanmis && u.aktif).length
  const bekleyenSayisi = ustalar.filter(u => !u.onaylanmis && u.aktif).length
  const ortPuan = ustalar.length > 0
    ? (ustalar.reduce((s, u) => s + (u.puan || 0), 0) / ustalar.length).toFixed(1)
    : '—'

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">

      {/* SOL PANEL — Kategori listesi */}
      <div className="w-72 flex-shrink-0 bg-white border border-[#C8CDD4] rounded-xl shadow-sm flex flex-col overflow-hidden">
        {/* Başlık */}
        <div className="px-4 py-3 border-b border-[#C8CDD4] flex items-center justify-between bg-[#F8F9FA]">
          <div>
            <p className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">Kategoriler</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{kategoriler.length} toplam</p>
          </div>
          <button
            onClick={() => acModal('yeni')}
            className="flex items-center gap-1.5 bg-[#0052CC] hover:bg-[#0040A3] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            <Plus size={13} /> Yeni
          </button>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {yukleniyor ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0052CC]" />
            </div>
          ) : (
            Object.entries(gruplar).map(([grup, items]) => (
              <div key={grup}>
                {/* Grup başlığı */}
                <div className="px-3 py-1.5 bg-[#F8F9FA] border-y border-[#E8ECF0] sticky top-0 z-10">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{grup}</span>
                </div>
                {/* Kategoriler */}
                {items.map(k => (
                  <button
                    key={k.id}
                    onClick={() => kategoriSec(k)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition border-b border-[#F0F4F8] group ${
                      secili?.id === k.id
                        ? 'bg-[#EFF6FF] border-l-2 border-l-[#0052CC]'
                        : 'hover:bg-[#F8FAFC] border-l-2 border-l-transparent'
                    }`}
                  >
                    <span className="text-lg w-7 text-center shrink-0">{k.ikon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${secili?.id === k.id ? 'text-[#0052CC]' : 'text-[#1e293b]'}`}>
                        {k.ad}
                      </p>
                      <p className="text-[10px] text-gray-400">{k.usta_sayisi} usta</p>
                    </div>
                    <ChevronRight size={13} className={`shrink-0 transition ${secili?.id === k.id ? 'text-[#0052CC]' : 'text-gray-300 group-hover:text-gray-400'}`} />
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* SAĞ PANEL — Detay */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-w-0">
        {!secili ? (
          <div className="flex-1 bg-white border border-[#C8CDD4] rounded-xl shadow-sm flex flex-col items-center justify-center text-gray-300">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-sm font-medium text-gray-400">Soldaki listeden bir kategori seçin</p>
            <p className="text-xs text-gray-300 mt-1">Kategori bilgileri ve ustalar burada görünecek</p>
          </div>
        ) : (
          <>
            {/* Kategori Başlık Kartı */}
            <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl flex items-center justify-center text-3xl">
                    {secili.ikon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1e293b]">{secili.ad}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{secili.grup}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${secili.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {secili.aktif ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    {secili.aciklama && (
                      <p className="text-xs text-gray-500 mt-1.5">{secili.aciklama}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acModal(secili)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#F8F9FA] border border-[#C8CDD4] text-gray-600 rounded-lg text-xs font-semibold hover:border-[#0052CC] hover:text-[#0052CC] transition"
                  >
                    <Pencil size={13} /> Düzenle
                  </button>
                  <button
                    onClick={() => sil(secili.id, secili.ad)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#F8F9FA] border border-[#C8CDD4] text-red-500 rounded-lg text-xs font-semibold hover:bg-red-50 hover:border-red-300 transition"
                  >
                    <Trash2 size={13} /> Sil
                  </button>
                </div>
              </div>

              {/* İstatistik satırı */}
              <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#F0F4F8]">
                {[
                  { label: 'Toplam Usta', value: ustalar.length, ikon: Users, renk: 'text-[#0052CC]' },
                  { label: 'Onaylı', value: onayliSayisi, ikon: Check, renk: 'text-green-600' },
                  { label: 'Bekleyen', value: bekleyenSayisi, ikon: Clock, renk: 'text-orange-500' },
                  { label: 'Ort. Puan', value: ortPuan, ikon: Star, renk: 'text-amber-500' },
                ].map(({ label, value, ikon: Icon, renk }) => (
                  <div key={label} className="bg-[#F8F9FA] border border-[#E8ECF0] rounded-lg p-3 text-center">
                    <Icon size={16} className={`${renk} mx-auto mb-1`} />
                    <p className="text-lg font-bold text-[#1e293b]">{ustaYukleniyor ? '…' : value}</p>
                    <p className="text-[10px] text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Usta Tablosu */}
            <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#C8CDD4] bg-[#F8F9FA] flex items-center justify-between">
                <p className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">
                  Bu Kategorideki Ustalar
                </p>
                <span className="text-xs text-gray-400">{ustalar.length} kayıt</span>
              </div>

              {ustaYukleniyor ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#0052CC]" />
                </div>
              ) : ustalar.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <Users size={36} className="mb-2" />
                  <p className="text-sm text-gray-400">Bu kategoride henüz usta yok</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                      <tr>
                        {['Ad Soyad', 'Telefon', 'Şehir', 'Puan', 'Yorum', 'Durum', 'Kayıt Tarihi', 'İşlem'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F4F8]">
                      {ustalar.map(u => (
                        <tr key={u.id} className="hover:bg-[#F8FAFC] transition">
                          <td className="px-4 py-3 font-semibold text-[#1e293b] whitespace-nowrap">
                            {u.ad_soyad || `${u.ad} ${u.soyad}`}
                          </td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">{u.telefon}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{u.sehir || '—'}</td>
                          <td className="px-4 py-3">
                            {u.puan > 0
                              ? <span className="flex items-center gap-1 text-amber-500 font-semibold text-xs"><Star size={11} fill="currentColor" />{u.puan}</span>
                              : <span className="text-gray-300 text-xs">—</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs text-center">{u.yorum_sayisi}</td>
                          <td className="px-4 py-3"><Rozet onaylanmis={u.onaylanmis} aktif={u.aktif} /></td>
                          <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                            {u.olusturma ? new Date(u.olusturma).toLocaleDateString('tr-TR') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {!u.onaylanmis && u.aktif && (
                                <button onClick={() => ustaIslem(u.id, 'onayla')} title="Onayla"
                                  className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition border border-transparent hover:border-green-200">
                                  <Check size={13} />
                                </button>
                              )}
                              {u.aktif && (
                                <button onClick={() => ustaIslem(u.id, 'reddet')} title="Yasakla"
                                  className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition border border-transparent hover:border-orange-200">
                                  <X size={13} />
                                </button>
                              )}
                              <button onClick={() => ustaIslem(u.id, 'sil')} title="Sil"
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition border border-transparent hover:border-red-200">
                                <Trash2 size={13} />
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
          </>
        )}
      </div>

      {/* Düzenleme Modalı */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white border border-[#C8CDD4] rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#C8CDD4]">
              <h3 className="font-bold text-[#1e293b]">{modal === 'yeni' ? 'Yeni Kategori Ekle' : 'Kategori Düzenle'}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">İkon (emoji)</label>
                <input
                  value={form.ikon}
                  onChange={e => setForm(p => ({ ...p, ikon: e.target.value }))}
                  className="w-full border border-[#C8CDD4] rounded-lg px-3 py-2.5 text-3xl focus:outline-none focus:border-[#0052CC] bg-[#F8F9FA] text-center"
                  maxLength={4}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kategori Adı *</label>
                <input
                  value={form.ad}
                  onChange={e => setForm(p => ({ ...p, ad: e.target.value }))}
                  className="w-full border border-[#C8CDD4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20 bg-[#F8F9FA]"
                  placeholder="örn: Klimacı"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Açıklama</label>
                <textarea
                  value={form.aciklama}
                  onChange={e => setForm(p => ({ ...p, aciklama: e.target.value }))}
                  rows={3}
                  className="w-full border border-[#C8CDD4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] bg-[#F8F9FA] resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 px-6 pb-5">
              <button onClick={() => setModal(null)} className="flex-1 border border-[#C8CDD4] text-gray-600 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">İptal</button>
              <button onClick={kaydet} className="flex-1 bg-[#0052CC] hover:bg-[#0040A3] text-white py-2.5 rounded-lg text-sm font-semibold transition shadow-sm">
                <Check size={14} className="inline mr-1.5" />Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
