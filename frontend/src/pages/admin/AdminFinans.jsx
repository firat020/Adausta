import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import {
  TrendingUp, Wallet, Users, AlertCircle, RotateCcw,
  CheckCircle, Package, X, XCircle, RefreshCw, Store, Plus, Edit2
} from 'lucide-react'
import API from '../../config.js'

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ mesaj, tip, onKapat }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold transition-all ${tip === 'hata' ? 'bg-red-600' : 'bg-green-600'}`}>
      {tip === 'hata' ? <XCircle size={16} /> : <CheckCircle size={16} />}
      {mesaj}
      <button onClick={onKapat} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Para Formatla ─────────────────────────────────────────────────────────────
const fmt = (val) =>
  val != null ? `₺${Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '—'

const fmtTarih = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Durum Rozeti ─────────────────────────────────────────────────────────────
function DurumRozet({ durum }) {
  const MAP = {
    on_hold:   { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Beklemede' },
    available: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Kullanılabilir' },
    paid:      { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Ödendi' },
    pending:   { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Onay Bekliyor' },
    confirmed: { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Onaylandı' },
    aktif:     { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Aktif' },
    pasif:     { bg: 'bg-gray-100',   text: 'text-gray-700',   label: 'Pasif' },
  }
  const c = MAP[durum] || { bg: 'bg-gray-100', text: 'text-gray-500', label: durum }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

// ─── TAB 1: Özet ─────────────────────────────────────────────────────────────
function OzetTab() {
  const [ozet, setOzet] = useState(null)
  const [bakiyeler, setBakiyeler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const [ozetRes, bakiyeRes] = await Promise.all([
        axios.get(`${API}/api/admin/finans/ozet`, { withCredentials: true }),
        axios.get(`${API}/api/admin/finans/satici-bakiyeleri`, { withCredentials: true }),
      ])
      setOzet(ozetRes.data)
      setBakiyeler(bakiyeRes.data.bakiyeler || bakiyeRes.data || [])
    } catch {
      setOzet(null)
      setBakiyeler([])
    }
    setYukleniyor(false)
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const kartlar = [
    {
      label: 'Toplam Komisyon',
      deger: fmt(ozet?.toplam_komisyon),
      icon: TrendingUp,
      renk: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    {
      label: 'Bekleyen Hakediş',
      deger: fmt(ozet?.bekleyen_hakedis),
      icon: RotateCcw,
      renk: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
    },
    {
      label: 'Kullanılabilir Hakediş',
      deger: fmt(ozet?.kullanilabilir_hakedis),
      icon: Wallet,
      renk: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      label: 'Toplam Aktif Satıcı',
      deger: ozet?.aktif_satici ?? '—',
      icon: Users,
      renk: 'text-gray-700',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
    },
    {
      label: 'Bekleyen İade',
      deger: ozet?.bekleyen_iade ?? '—',
      icon: AlertCircle,
      renk: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
  ]

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Stat Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kartlar.map((k) => (
          <div key={k.label} className={`${k.bg} border ${k.border} rounded-xl p-4 flex flex-col gap-2`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider leading-tight">{k.label}</p>
              <div className="p-1.5 rounded-lg bg-white shadow-sm">
                <k.icon size={16} className={k.renk} />
              </div>
            </div>
            <p className={`text-xl font-bold ${k.renk}`}>{k.deger}</p>
          </div>
        ))}
      </div>

      {/* Satıcı Bakiyeleri Tablosu */}
      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#C8CDD4] flex items-center gap-2">
          <Store size={16} className="text-[#0052CC]" />
          <h3 className="font-semibold text-[#1e293b] text-sm">Satıcı Bakiyeleri</h3>
          {bakiyeler.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">{bakiyeler.length} satıcı</span>
          )}
        </div>

        {bakiyeler.length === 0 ? (
          <div className="text-center py-16">
            <Store size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-semibold">Bakiye verisi bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                <tr>
                  {['Mağaza', 'Bekleyen TL', 'Kullanılabilir TL', 'Ödenmiş TL'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F8]">
                {bakiyeler.map((b, i) => (
                  <tr key={b.id ?? i} className="hover:bg-[#F8FAFC] transition">
                    <td className="px-4 py-3 font-semibold text-[#1e293b]">{b.magaza_adi || b.ad || '—'}</td>
                    <td className="px-4 py-3 font-mono text-orange-600">{fmt(b.bekleyen)}</td>
                    <td className="px-4 py-3 font-mono text-blue-600">{fmt(b.kullanilabilir)}</td>
                    <td className="px-4 py-3 font-mono text-green-600">{fmt(b.odenmis)}</td>
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

// ─── TAB 2: Hakedişler ────────────────────────────────────────────────────────
function HakedislerTab({ showToast }) {
  const [hakedisler, setHakedisler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [filtre, setFiltre] = useState('on_hold')
  const [islemId, setIslemId] = useState(null)

  const yukle = useCallback(async (durum) => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/finans/hakedisler`, {
        params: { hakediş_durumu: durum },
        withCredentials: true,
      })
      setHakedisler(r.data.hakedisler || r.data || [])
    } catch {
      setHakedisler([])
    }
    setYukleniyor(false)
  }, [])

  useEffect(() => { yukle(filtre) }, [yukle, filtre])

  const serbest = async (id) => {
    setIslemId(id)
    try {
      await axios.post(`${API}/api/admin/finans/hakedis/${id}/serbest-birak`, {}, { withCredentials: true })
      showToast('Hakediş serbest bırakıldı.', 'basari')
      yukle(filtre)
    } catch {
      showToast('İşlem başarısız oldu.', 'hata')
    }
    setIslemId(null)
  }

  const odendi = async (id) => {
    setIslemId(id)
    try {
      await axios.post(`${API}/api/admin/finans/hakedis/${id}/odendi-isle`, {}, { withCredentials: true })
      showToast('Ödeme işlendi.', 'basari')
      yukle(filtre)
    } catch {
      showToast('İşlem başarısız oldu.', 'hata')
    }
    setIslemId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <select
          value={filtre}
          onChange={e => setFiltre(e.target.value)}
          className="border border-[#C8CDD4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] bg-white"
        >
          <option value="on_hold">Beklemede (on_hold)</option>
          <option value="available">Kullanılabilir (available)</option>
          <option value="paid">Ödendi (paid)</option>
          <option value="pending">Onay Bekliyor (pending)</option>
        </select>
        <button
          onClick={() => yukle(filtre)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052CC] transition"
        >
          <RefreshCw size={14} /> Yenile
        </button>
      </div>

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#C8CDD4] flex items-center gap-2">
          <Wallet size={16} className="text-[#0052CC]" />
          <h3 className="font-semibold text-[#1e293b] text-sm">Hakedişler</h3>
          {!yukleniyor && hakedisler.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">{hakedisler.length} kayıt</span>
          )}
        </div>

        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : hakedisler.length === 0 ? (
          <div className="text-center py-16">
            <Wallet size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-semibold">Bu filtrede hakediş bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                <tr>
                  {['Sipariş No', 'Mağaza', 'Tutar TL', 'Komisyon', 'Net TL', 'Durum', 'Aksiyonlar'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F8]">
                {hakedisler.map(h => (
                  <tr key={h.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="px-4 py-3 font-mono font-bold text-[#1e293b]">#{h.siparis_id || h.id}</td>
                    <td className="px-4 py-3 text-gray-700">{h.magaza_adi || '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{fmt(h.tutar)}</td>
                    <td className="px-4 py-3 font-mono text-orange-600">{fmt(h.komisyon)}</td>
                    <td className="px-4 py-3 font-mono text-green-600 font-semibold">{fmt(h.net)}</td>
                    <td className="px-4 py-3"><DurumRozet durum={h.durum} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {h.durum === 'on_hold' && (
                          <button
                            onClick={() => serbest(h.id)}
                            disabled={islemId === h.id}
                            className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition whitespace-nowrap"
                          >
                            {islemId === h.id ? '...' : 'Serbest Bırak'}
                          </button>
                        )}
                        {h.durum === 'available' && (
                          <button
                            onClick={() => odendi(h.id)}
                            disabled={islemId === h.id}
                            className="text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-lg hover:bg-green-100 disabled:opacity-50 transition whitespace-nowrap"
                          >
                            {islemId === h.id ? '...' : 'Ödendi İşle'}
                          </button>
                        )}
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

// ─── TAB 3: Komisyonlar ───────────────────────────────────────────────────────
function KomisyonlarTab() {
  const [komisyonlar, setKomisyonlar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [filtre, setFiltre] = useState('')

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/finans/komisyonlar`, { withCredentials: true })
      setKomisyonlar(r.data.komisyonlar || r.data || [])
    } catch {
      setKomisyonlar([])
    }
    setYukleniyor(false)
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const filtreli = filtre
    ? komisyonlar.filter(k => k.durum === filtre)
    : komisyonlar

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <select
          value={filtre}
          onChange={e => setFiltre(e.target.value)}
          className="border border-[#C8CDD4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] bg-white"
        >
          <option value="">Tüm Durumlar</option>
          <option value="pending">Bekliyor (pending)</option>
          <option value="confirmed">Onaylandı (confirmed)</option>
        </select>
        <button
          onClick={yukle}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052CC] transition"
        >
          <RefreshCw size={14} /> Yenile
        </button>
      </div>

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#C8CDD4] flex items-center gap-2">
          <TrendingUp size={16} className="text-[#0052CC]" />
          <h3 className="font-semibold text-[#1e293b] text-sm">Komisyon Kayıtları</h3>
          {!yukleniyor && filtreli.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">{filtreli.length} kayıt</span>
          )}
        </div>

        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : filtreli.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-semibold">Komisyon kaydı bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                <tr>
                  {['Sipariş ID', 'Mağaza', 'Brüt TL', 'Komisyon %', 'Komisyon TL', 'Net TL', 'Durum', 'Tarih'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F8]">
                {filtreli.map((k, i) => (
                  <tr key={k.id ?? i} className="hover:bg-[#F8FAFC] transition">
                    <td className="px-4 py-3 font-mono font-bold text-[#1e293b]">#{k.siparis_id || k.id}</td>
                    <td className="px-4 py-3 text-gray-700">{k.magaza_adi || '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{fmt(k.brut)}</td>
                    <td className="px-4 py-3 font-mono text-orange-600">%{k.komisyon_orani ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-orange-700 font-semibold">{fmt(k.komisyon_tl)}</td>
                    <td className="px-4 py-3 font-mono text-green-600 font-semibold">{fmt(k.net)}</td>
                    <td className="px-4 py-3"><DurumRozet durum={k.durum} /></td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtTarih(k.tarih || k.olusturma_tarihi)}</td>
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

// ─── Abonelik Plan Modalı ─────────────────────────────────────────────────────
function PlanModal({ plan, onKapat, onKaydet }) {
  const [form, setForm] = useState(
    plan
      ? {
          ad: plan.ad || '',
          slug: plan.slug || '',
          fiyat_tl: plan.fiyat_tl ?? '',
          urun_limiti: plan.urun_limiti ?? '',
          personel_limiti: plan.personel_limiti ?? '',
          komisyon_orani: plan.komisyon_orani ?? '',
          aciklama: plan.aciklama || '',
        }
      : { ad: '', slug: '', fiyat_tl: '', urun_limiti: '', personel_limiti: '', komisyon_orani: '', aciklama: '' }
  )
  const [yukleniyor, setYukleniyor] = useState(false)

  const slugify = (str) =>
    str
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  const degistir = (e) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'ad' ? { slug: slugify(value) } : {}),
    }))
  }

  const kaydet = async () => {
    setYukleniyor(true)
    await onKaydet(form)
    setYukleniyor(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#C8CDD4]">
          <h3 className="font-bold text-[#1e293b]">{plan ? 'Planı Düzenle' : 'Yeni Plan Ekle'}</h3>
          <button onClick={onKapat} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Plan Adı</label>
              <input
                name="ad"
                value={form.ad}
                onChange={degistir}
                placeholder="Örn: Başlangıç"
                className="w-full border border-[#C8CDD4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC]"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Slug (otomatik)</label>
              <input
                name="slug"
                value={form.slug}
                onChange={degistir}
                placeholder="baslangic"
                className="w-full border border-[#C8CDD4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Fiyat (TL)</label>
              <input
                name="fiyat_tl"
                value={form.fiyat_tl}
                onChange={degistir}
                type="number"
                placeholder="0"
                className="w-full border border-[#C8CDD4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Komisyon Oranı (%)</label>
              <input
                name="komisyon_orani"
                value={form.komisyon_orani}
                onChange={degistir}
                type="number"
                placeholder="0"
                className="w-full border border-[#C8CDD4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Ürün Limiti</label>
              <input
                name="urun_limiti"
                value={form.urun_limiti}
                onChange={degistir}
                type="number"
                placeholder="50"
                className="w-full border border-[#C8CDD4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Personel Limiti</label>
              <input
                name="personel_limiti"
                value={form.personel_limiti}
                onChange={degistir}
                type="number"
                placeholder="3"
                className="w-full border border-[#C8CDD4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC]"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Açıklama</label>
              <textarea
                name="aciklama"
                value={form.aciklama}
                onChange={degistir}
                rows={2}
                placeholder="Plan açıklaması..."
                className="w-full border border-[#C8CDD4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onKapat}
              className="flex-1 border border-[#C8CDD4] text-gray-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
            >
              İptal
            </button>
            <button
              onClick={kaydet}
              disabled={yukleniyor || !form.ad}
              className="flex-1 bg-[#0052CC] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#003EA6] disabled:opacity-50 transition"
            >
              {yukleniyor ? '...' : plan ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TAB 4: Abonelik Planları ─────────────────────────────────────────────────
function AbonelikPlanlariTab({ showToast }) {
  const [planlar, setPlanlar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [modal, setModal] = useState(null) // null | 'yeni' | plan objesi

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/finans/abonelik-planlari`, { withCredentials: true })
      setPlanlar(r.data.planlar || r.data || [])
    } catch {
      setPlanlar([])
    }
    setYukleniyor(false)
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const kaydet = async (form) => {
    try {
      if (modal && modal !== 'yeni') {
        await axios.put(`${API}/api/admin/finans/abonelik-planlari/${modal.id}`, form, { withCredentials: true })
        showToast('Plan güncellendi.', 'basari')
      } else {
        await axios.post(`${API}/api/admin/finans/abonelik-planlari`, form, { withCredentials: true })
        showToast('Plan eklendi.', 'basari')
      }
      setModal(null)
      yukle()
    } catch {
      showToast('İşlem başarısız oldu.', 'hata')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Sistemdeki abonelik planlarını yönetin</p>
        <button
          onClick={() => setModal('yeni')}
          className="flex items-center gap-2 bg-[#0052CC] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#003EA6] transition"
        >
          <Plus size={13} /> Plan Ekle
        </button>
      </div>

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#C8CDD4] flex items-center gap-2">
          <Package size={16} className="text-[#0052CC]" />
          <h3 className="font-semibold text-[#1e293b] text-sm">Abonelik Planları</h3>
          {!yukleniyor && planlar.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">{planlar.length} plan</span>
          )}
        </div>

        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : planlar.length === 0 ? (
          <div className="text-center py-16">
            <Package size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-semibold">Henüz plan tanımlanmamış</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                <tr>
                  {['Plan Adı', 'Fiyat', 'Ürün Limiti', 'Personel', 'Komisyon %', 'Durum', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F8]">
                {planlar.map(p => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="px-4 py-3 font-semibold text-[#1e293b]">{p.ad}</td>
                    <td className="px-4 py-3 font-mono text-[#0052CC] font-semibold">{fmt(p.fiyat_tl)}</td>
                    <td className="px-4 py-3 text-gray-700">{p.urun_limiti ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{p.personel_limiti ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-orange-600">%{p.komisyon_orani ?? '—'}</td>
                    <td className="px-4 py-3"><DurumRozet durum={p.durum || 'aktif'} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setModal(p)}
                        className="flex items-center gap-1 text-xs font-semibold text-[#0052CC] hover:text-[#003EA6] transition"
                      >
                        <Edit2 size={13} /> Düzenle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <PlanModal
          plan={modal === 'yeni' ? null : modal}
          onKapat={() => setModal(null)}
          onKaydet={kaydet}
        />
      )}
    </div>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'ozet',           label: 'Özet',             icon: TrendingUp },
  { id: 'hakedisler',     label: 'Hakedişler',        icon: Wallet },
  { id: 'komisyonlar',    label: 'Komisyonlar',       icon: RotateCcw },
  { id: 'abonelik-planlari', label: 'Abonelik Planları', icon: Package },
]

export default function AdminFinans() {
  const [aktifTab, setAktifTab] = useState('ozet')
  const [toast, setToast] = useState(null)

  const showToast = (mesaj, tip = 'basari') => {
    setToast({ mesaj, tip })
    setTimeout(() => setToast(null), 3500)
  }

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Finans Yönetimi</h2>
          <p className="text-gray-500 text-sm">Hakedişler, komisyonlar ve abonelik planları</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1">
        {TABS.map(tab => {
          const aktif = aktifTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setAktifTab(tab.id)}
              className={`flex items-center gap-2 flex-1 justify-center py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                aktif
                  ? 'bg-white text-[#0052CC] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab İçerikleri */}
      {aktifTab === 'ozet'              && <OzetTab />}
      {aktifTab === 'hakedisler'        && <HakedislerTab showToast={showToast} />}
      {aktifTab === 'komisyonlar'       && <KomisyonlarTab />}
      {aktifTab === 'abonelik-planlari' && <AbonelikPlanlariTab showToast={showToast} />}

      {/* Toast */}
      {toast && (
        <Toast mesaj={toast.mesaj} tip={toast.tip} onKapat={() => setToast(null)} />
      )}
    </div>
  )
}
