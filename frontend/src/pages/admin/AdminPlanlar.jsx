import { useEffect, useState } from 'react'
import axios from 'axios'
import { Plus, Pencil, Trash2, Check, X, Star, RefreshCw } from 'lucide-react'

const API = 'http://localhost:5000'

const bos = { ad: '', fiyat: '', sure_tip: 'aylik', ilan_siniri: 5, one_cikma: false }

// Aylık: $99.99 | Yıllık: $89/ay → $1,068/yıl
const VARSAYILAN_PLANLAR = [
  { ad: 'Ücretsiz', fiyat: 0, sure_tip: 'aylik', ilan_siniri: 1, one_cikma: false },
  { ad: 'Standart', fiyat: 99.99, sure_tip: 'aylik', ilan_siniri: 10, one_cikma: false },
  { ad: 'Premium', fiyat: 89, sure_tip: 'yillik', ilan_siniri: 999, one_cikma: true },
]

export default function AdminPlanlar() {
  const [planlar, setPlanlar] = useState([])
  const [kur, setKur] = useState(null)    // USD → TRY
  const [kurYukleniyor, setKurYukleniyor] = useState(false)
  const [form, setForm] = useState(null)
  const [silOnay, setSilOnay] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(false)

  const yukle = () =>
    axios.get(`${API}/api/admin/planlar`, { withCredentials: true })
      .then(r => setPlanlar(r.data.planlar))

  const kurCek = () => {
    setKurYukleniyor(true)
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(d => { setKur(d.rates?.TRY || null); setKurYukleniyor(false) })
      .catch(() => setKurYukleniyor(false))
  }

  useEffect(() => { yukle(); kurCek() }, [])

  const tlKarsıligi = (usd, sureTip) => {
    if (!kur || usd <= 0) return null
    const tutar = sureTip === 'yillik' ? usd * 12 : usd
    return (tutar * kur).toLocaleString('tr-TR', { maximumFractionDigits: 0 })
  }

  const kaydet = async (e) => {
    e.preventDefault()
    setYukleniyor(true)
    try {
      const payload = { ...form, fiyat: parseFloat(form.fiyat) || 0, ilan_siniri: parseInt(form.ilan_siniri) || 1 }
      if (form.id) {
        await axios.put(`${API}/api/admin/planlar/${form.id}`, payload, { withCredentials: true })
      } else {
        await axios.post(`${API}/api/admin/planlar`, payload, { withCredentials: true })
      }
      setForm(null)
      yukle()
    } catch {}
    setYukleniyor(false)
  }

  const sil = async (id) => {
    await axios.delete(`${API}/api/admin/planlar/${id}`, { withCredentials: true })
    setSilOnay(null)
    yukle()
  }

  const varsayilanOlustur = async () => {
    for (const p of VARSAYILAN_PLANLAR) {
      await axios.post(`${API}/api/admin/planlar`, p, { withCredentials: true }).catch(() => {})
    }
    yukle()
  }

  const renk = (ad) => {
    const a = ad?.toLowerCase()
    if (a?.includes('premium')) return 'from-purple-600 to-purple-700'
    if (a?.includes('standart')) return 'from-[#0052CC] to-[#003d99]'
    return 'from-gray-500 to-gray-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Plan Yönetimi</h2>
          <p className="text-gray-500 text-sm">Abonelik paketlerini yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Kur göstergesi */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#C8CDD4] rounded-lg text-xs text-gray-600">
            {kurYukleniyor ? (
              <RefreshCw size={12} className="animate-spin text-gray-400" />
            ) : kur ? (
              <>
                <span className="font-semibold text-green-600">1 USD = {kur.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺</span>
                <button onClick={kurCek} className="text-gray-400 hover:text-gray-600 transition">
                  <RefreshCw size={11} />
                </button>
              </>
            ) : (
              <button onClick={kurCek} className="text-[#0052CC] hover:underline">Kur yükle</button>
            )}
          </div>
          {planlar.length === 0 && (
            <button onClick={varsayilanOlustur}
              className="px-3 py-2 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-sm hover:bg-gray-200 transition">
              Varsayılan Planları Oluştur
            </button>
          )}
          <button onClick={() => setForm({ ...bos })}
            className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-medium hover:bg-[#003d99] transition">
            <Plus size={16} /> Yeni Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {planlar.map(p => {
          const tl = tlKarsıligi(p.fiyat, p.sure_tip)
          const yillikUsd = p.sure_tip === 'yillik' ? p.fiyat * 12 : null
          return (
            <div key={p.id} className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
              <div className={`bg-gradient-to-br ${renk(p.ad)} p-5 text-white`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest opacity-75 mb-1">
                      {p.sure_tip === 'yillik' ? 'Yıllık Plan' : 'Aylık Plan'}
                    </p>
                    <h3 className="text-xl font-bold">{p.ad}</h3>
                  </div>
                  {p.one_cikma && <Star size={16} className="opacity-80 mt-1" fill="currentColor" />}
                </div>

                {p.fiyat > 0 ? (
                  <div className="mt-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${p.fiyat.toLocaleString('en-US')}</span>
                      <span className="text-sm opacity-75">/ {p.sure_tip === 'yillik' ? 'ay' : 'ay'}</span>
                    </div>
                    {p.sure_tip === 'yillik' && (
                      <p className="text-xs opacity-70 mt-0.5">Yıllık ${(p.fiyat * 12).toLocaleString('en-US')} faturalandırılır</p>
                    )}
                    {tl && (
                      <p className="text-xs mt-1 bg-white/15 rounded-md px-2 py-1 inline-block">
                        ≈ {tl} ₺{p.sure_tip === 'yillik' ? '/yıl' : '/ay'}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-3xl font-bold mt-3">Ücretsiz</p>
                )}
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">İlan Sınırı</span>
                  <span className="font-semibold text-[#1e293b]">{p.ilan_siniri >= 999 ? 'Sınırsız' : `${p.ilan_siniri} ilan`}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Öne Çıkarma</span>
                  <span className={`font-semibold ${p.one_cikma ? 'text-green-600' : 'text-gray-400'}`}>
                    {p.one_cikma ? 'Var' : 'Yok'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Aktif Abone</span>
                  <span className="font-semibold text-[#0052CC]">{p.abone_sayisi}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setForm({ ...p })}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-[#F0F4FF] text-[#0052CC] rounded-lg text-xs font-medium hover:bg-[#E0ECFF] transition">
                    <Pencil size={12} /> Düzenle
                  </button>
                  <button onClick={() => setSilOnay(p.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-100 transition">
                    <Trash2 size={12} />
                  </button>
                </div>
                {silOnay === p.id && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs">
                    <p className="text-red-600 font-medium mb-2">Bu planı silmek istediğinizden emin misiniz?</p>
                    <div className="flex gap-2">
                      <button onClick={() => sil(p.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"><Check size={11} /> Evet</button>
                      <button onClick={() => setSilOnay(null)} className="flex items-center gap-1 px-3 py-1.5 bg-white border text-gray-600 rounded-lg hover:bg-gray-50 transition"><X size={11} /> Hayır</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Form Modal */}
      {form && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-[#1e293b]">{form.id ? 'Plan Düzenle' : 'Yeni Plan'}</h3>
              <button onClick={() => setForm(null)} className="text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>
            </div>
            <form onSubmit={kaydet} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Plan Adı</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]"
                  value={form.ad} onChange={e => setForm({ ...form, ad: e.target.value })} required placeholder="Ücretsiz / Standart / Premium" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Fiyat (USD $)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                    <input type="number" min="0" step="0.01"
                      className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]"
                      value={form.fiyat} onChange={e => setForm({ ...form, fiyat: e.target.value })} placeholder="0.00" />
                  </div>
                  {kur && parseFloat(form.fiyat) > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      ≈ {(parseFloat(form.fiyat) * (form.sure_tip === 'yillik' ? 12 : 1) * kur).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                      {form.sure_tip === 'yillik' ? '/yıl' : '/ay'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Süre</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC]"
                    value={form.sure_tip} onChange={e => setForm({ ...form, sure_tip: e.target.value })}>
                    <option value="aylik">Aylık</option>
                    <option value="yillik">Yıllık ($X/ay olarak gösterilir)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">İlan Sınırı</label>
                <input type="number" min="1"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]"
                  value={form.ilan_siniri} onChange={e => setForm({ ...form, ilan_siniri: e.target.value })} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.one_cikma} onChange={e => setForm({ ...form, one_cikma: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[#0052CC]" />
                <span className="text-sm text-gray-700">Öne Çıkarma Özelliği</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={yukleniyor}
                  className="flex-1 py-2.5 bg-[#0052CC] text-white rounded-lg text-sm font-medium hover:bg-[#003d99] transition disabled:opacity-50">
                  {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button type="button" onClick={() => setForm(null)}
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
