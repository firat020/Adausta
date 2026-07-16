import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import {
  Store, RefreshCw, Info, CheckCircle, XCircle, X,
  Wallet, Clock, BarChart2, Eye, AlertCircle, BadgeDollarSign
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

// ─── İade Durum Rozet ─────────────────────────────────────────────────────────
function IadeDurumRozet({ durum }) {
  const MAP = {
    beklemede:  { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Beklemede' },
    onaylandi:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Onaylandı' },
    reddedildi: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Reddedildi' },
    tamamlandi: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Tamamlandı' },
  }
  const c = MAP[durum] || MAP.beklemede
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

// ─── İade İncele Modal ────────────────────────────────────────────────────────
function IadeModal({ iade, onKapat, onKarar }) {
  const [yukleniyor, setYukleniyor] = useState(false)
  const [not, setNot] = useState('')

  const karar = async (tip) => {
    setYukleniyor(true)
    await onKarar(iade.id, tip, not)
    setYukleniyor(false)
  }

  const fmt = (val) =>
    val != null ? `₺${Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '—'

  const fmtTarih = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#C8CDD4]">
          <h3 className="font-bold text-[#1e293b]">İade Talebi Detayı</h3>
          <button onClick={onKapat} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Sipariş No</p>
              <p className="font-mono font-bold text-[#1e293b]">#{iade.siparis_id || iade.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Durum</p>
              <IadeDurumRozet durum={iade.durum} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Müşteri</p>
              <p className="text-[#1e293b]">{iade.musteri_ad || iade.kullanici_ad || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Tutar</p>
              <p className="font-mono font-bold text-orange-600">{fmt(iade.tutar)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Neden</p>
              <p className="text-[#1e293b]">{iade.neden || iade.sebep || '—'}</p>
            </div>
            {iade.aciklama && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Açıklama</p>
                <p className="text-gray-600 text-sm">{iade.aciklama}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Tarih</p>
              <p className="text-gray-600">{fmtTarih(iade.olusturma_tarihi || iade.tarih)}</p>
            </div>
          </div>

          {(iade.durum === 'beklemede' || !iade.durum) && (
            <>
              <div className="border-t border-[#E8ECF0] pt-3">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">
                  Karar Notu (opsiyonel)
                </label>
                <textarea
                  value={not}
                  onChange={e => setNot(e.target.value)}
                  placeholder="Müşteriye iletilecek not..."
                  rows={2}
                  className="w-full border border-[#C8CDD4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => karar('onayla')}
                  disabled={yukleniyor}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {yukleniyor ? '...' : 'Onayla'}
                </button>
                <button
                  onClick={() => karar('reddet')}
                  disabled={yukleniyor}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {yukleniyor ? '...' : 'Reddet'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab 1: Satıcı Bakiyeleri ─────────────────────────────────────────────────
function SaticiBakiyeleri({ showToast }) {
  const [magazalar, setMagazalar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/saticilar/magazalar`, { withCredentials: true })
      setMagazalar(r.data.magazalar || r.data || [])
    } catch {
      setMagazalar([])
    }
    setYukleniyor(false)
  }, [])

  useEffect(() => { yukle() }, [yukle])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Kayıtlı mağazaların bakiye durumu</p>
        <button
          onClick={() => showToast('Bakiye senkronizasyonu yakında aktif olacak.', 'bilgi')}
          className="flex items-center gap-2 bg-[#0052CC] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#003EA6] transition"
        >
          <RefreshCw size={13} /> Bakiyeleri Senkronize Et
        </button>
      </div>

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#C8CDD4] flex items-center gap-2">
          <Store size={16} className="text-[#0052CC]" />
          <h3 className="font-semibold text-[#1e293b] text-sm">Mağaza Bakiyeleri</h3>
          {!yukleniyor && magazalar.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">{magazalar.length} mağaza</span>
          )}
        </div>

        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : magazalar.length === 0 ? (
          <div className="text-center py-16">
            <Store size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-semibold">Henüz mağaza yok</p>
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
                {magazalar.map(m => (
                  <tr key={m.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="px-4 py-3 font-semibold text-[#1e293b]">{m.magaza_adi || m.ad}</td>
                    <td className="px-4 py-3 font-mono text-orange-400">₺0,00</td>
                    <td className="px-4 py-3 font-mono text-green-400">₺0,00</td>
                    <td className="px-4 py-3 font-mono text-gray-400">₺0,00</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 flex items-start gap-3">
        <Info size={18} className="text-[#0052CC] shrink-0 mt-0.5" />
        <p className="text-sm text-[#3B82F6]">
          Bakiye verileri CardPlus split payment entegrasyonu tamamlandığında otomatik dolacaktır.
          Şu an manuel takip modundadır.
        </p>
      </div>
    </div>
  )
}

// ─── Tab 2: Bekleyen İadeler ──────────────────────────────────────────────────
function BekleyenIadeler({ showToast }) {
  const [iadeler, setIadeler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [seciliIade, setSeciliIade] = useState(null)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/iade/admin/listele`, { withCredentials: true })
      setIadeler(r.data.iadeler || r.data || [])
    } catch {
      setIadeler([])
    }
    setYukleniyor(false)
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const karar = async (id, tip, not) => {
    try {
      await axios.post(`${API}/api/iade/admin/${id}/karar`, { karar: tip, not }, { withCredentials: true })
      showToast(tip === 'onayla' ? 'İade onaylandı.' : 'İade reddedildi.', tip === 'onayla' ? 'basari' : 'hata')
      setSeciliIade(null)
      yukle()
    } catch {
      showToast('İşlem başarısız oldu.', 'hata')
    }
  }

  const fmtTarih = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const fmt = (val) =>
    val != null ? `₺${Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '—'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Müşteri iade talepleri</p>
        <button onClick={yukle} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052CC] transition">
          <RefreshCw size={14} /> Yenile
        </button>
      </div>

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#C8CDD4] flex items-center gap-2">
          <Clock size={16} className="text-[#0052CC]" />
          <h3 className="font-semibold text-[#1e293b] text-sm">İade Talepleri</h3>
          {!yukleniyor && iadeler.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">{iadeler.length} talep</span>
          )}
        </div>

        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : iadeler.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-semibold">Bekleyen iade talebi yok</p>
            <p className="text-gray-300 text-xs mt-1">Tüm iade talepleri burada görünecek</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                <tr>
                  {['Sipariş No', 'Müşteri', 'Neden', 'Durum', 'Tutar', 'Tarih', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F8]">
                {iadeler.map(iade => (
                  <tr key={iade.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="px-4 py-3 font-mono font-bold text-[#1e293b]">#{iade.siparis_id || iade.id}</td>
                    <td className="px-4 py-3 text-gray-700">{iade.musteri_ad || iade.kullanici_ad || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{iade.neden || iade.sebep || '—'}</td>
                    <td className="px-4 py-3"><IadeDurumRozet durum={iade.durum} /></td>
                    <td className="px-4 py-3 font-mono text-orange-600 font-semibold">{fmt(iade.tutar)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtTarih(iade.olusturma_tarihi || iade.tarih)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSeciliIade(iade)}
                        className="flex items-center gap-1 text-xs font-semibold text-[#0052CC] hover:text-[#003EA6] transition"
                      >
                        <Eye size={13} /> İncele
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {seciliIade && (
        <IadeModal
          iade={seciliIade}
          onKapat={() => setSeciliIade(null)}
          onKarar={karar}
        />
      )}
    </div>
  )
}

// ─── Tab 3: Komisyon Özeti ────────────────────────────────────────────────────
function KomisyonOzeti() {
  const kartlar = [
    { label: 'Toplam Komisyon', deger: 'Hesaplanıyor', icon: BarChart2, renk: 'text-[#0052CC]', bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]' },
    { label: 'Bu Ay', deger: 'Hesaplanıyor', icon: Wallet, renk: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Komisyon özeti ve dağılımı</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {kartlar.map((k) => (
          <div key={k.label} className={`${k.bg} border ${k.border} rounded-xl p-5 flex items-center gap-4`}>
            <div className={`p-2.5 rounded-xl bg-white shadow-sm`}>
              <k.icon size={22} className={k.renk} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{k.label}</p>
              <p className={`text-lg font-bold ${k.renk} mt-0.5`}>{k.deger}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-4 flex items-start gap-3">
        <Info size={18} className="text-orange-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-orange-700">Gerçek Zamanlı Rapor Yakında</p>
          <p className="text-sm text-orange-600 mt-0.5">
            Gerçek zamanlı komisyon raporu yakında aktif olacak. CardPlus entegrasyonu sonrası
            satıcı bazlı komisyon oranları ve otomatik dağıtım burada takip edilecektir.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#C8CDD4] rounded-xl p-5">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Planlanan Özellikler</p>
        <ul className="space-y-2">
          {[
            'CardPlus split payment otomatik komisyon dağıtımı',
            'Satıcı bazlı komisyon oranı ayarlama',
            'Toplu ödeme ve hakediş işlemleri',
            'Finansal raporlama ve Excel ihracat',
            'Otomatik fatura ve dekont oluşturma',
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC] opacity-30 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Tab 4: Hakedişler ───────────────────────────────────────────────────────
const HAKEDIS_DURUM_MAP = {
  bekliyor:       { label: 'Bekliyor',       bg: 'bg-orange-100', text: 'text-orange-700' },
  kullanilabilir: { label: 'Kullanılabilir', bg: 'bg-green-100',  text: 'text-green-700' },
  odendi:         { label: 'Ödendi',         bg: 'bg-blue-100',   text: 'text-blue-700' },
}

function HakedisRozet({ durum }) {
  const d = HAKEDIS_DURUM_MAP[durum] || HAKEDIS_DURUM_MAP.bekliyor
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${d.bg} ${d.text}`}>
      {d.label}
    </span>
  )
}

function Hakedisler({ showToast }) {
  const [hakedisler, setHakedisler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [durumFiltre, setDurumFiltre] = useState('')
  const [odeniyor, setOdeniyor] = useState(null)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const params = {}
      if (durumFiltre) params.durum = durumFiltre
      const r = await axios.get(`${API}/api/admin/saticilar/hakedisler`, { params, withCredentials: true })
      setHakedisler(r.data.hakedisler || [])
    } catch { setHakedisler([]) }
    setYukleniyor(false)
  }, [durumFiltre])

  useEffect(() => { yukle() }, [yukle])

  const ode = async (hid) => {
    setOdeniyor(hid)
    try {
      await axios.post(`${API}/api/admin/saticilar/hakedis/${hid}/ode`, {}, { withCredentials: true })
      showToast('Ödeme işlendi.', 'basari')
      yukle()
    } catch (err) {
      showToast(err.response?.data?.hata || 'İşlem başarısız.', 'hata')
    }
    setOdeniyor(null)
  }

  const fmt = (v) => (v ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'
  const fmtT = (d) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-gray-500">Satıcı hakediş geçmişi ve ödeme işlemleri</p>
        <div className="flex items-center gap-2">
          <select
            value={durumFiltre}
            onChange={e => setDurumFiltre(e.target.value)}
            className="border border-[#C8CDD4] rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">Tüm Durumlar</option>
            <option value="bekliyor">Bekliyor</option>
            <option value="kullanilabilir">Kullanılabilir</option>
            <option value="odendi">Ödendi</option>
          </select>
          <button onClick={yukle} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0052CC] transition">
            <RefreshCw size={14} /> Yenile
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#C8CDD4] flex items-center gap-2">
          <BadgeDollarSign size={16} className="text-[#0052CC]" />
          <h3 className="font-semibold text-[#1e293b] text-sm">Hakedişler</h3>
          {!yukleniyor && (
            <span className="ml-auto text-xs text-gray-400">{hakedisler.length} kayıt</span>
          )}
        </div>

        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : hakedisler.length === 0 ? (
          <div className="text-center py-16">
            <BadgeDollarSign size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-semibold">Hakediş kaydı yok</p>
            <p className="text-gray-300 text-xs mt-1">Satıcılar sipariş teslim edince burada görünecek</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                <tr>
                  {['Mağaza', 'Sipariş', 'Brüt', 'Komisyon', 'Net', 'Durum', 'Kullanılabilir', 'İşlem'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F8]">
                {hakedisler.map(h => (
                  <tr key={h.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="px-4 py-3 font-semibold text-[#1e293b] text-xs">{h.magaza_adi}</td>
                    <td className="px-4 py-3 font-mono text-[#0052CC] font-bold text-xs">#{h.siparis_no || h.siparis_id}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{fmt(h.brut_tl)}</td>
                    <td className="px-4 py-3 font-mono text-red-500">-{fmt(h.komisyon_tl)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{fmt(h.net_tl)}</td>
                    <td className="px-4 py-3"><HakedisRozet durum={h.durum} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtT(h.kullanilabilir_tarih)}</td>
                    <td className="px-4 py-3">
                      {h.durum === 'kullanilabilir' ? (
                        <button
                          onClick={() => ode(h.id)}
                          disabled={odeniyor === h.id}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                        >
                          {odeniyor === h.id ? '...' : <><CheckCircle size={12} /> Öde</>}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">{fmtT(h.odeme_tarihi)}</span>
                      )}
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

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'bakiyeler',  label: 'Satıcı Bakiyeleri', icon: Store },
  { id: 'iadeler',    label: 'Bekleyen İadeler',  icon: Clock },
  { id: 'hakedisler', label: 'Hakedişler',        icon: BadgeDollarSign },
  { id: 'komisyon',   label: 'Komisyon Özeti',    icon: BarChart2 },
]

export default function AdminSaticilarFinans() {
  const [aktifTab, setAktifTab] = useState('bakiyeler')
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
          <h2 className="text-xl font-bold text-[#1e293b]">Satıcı Finans Yönetimi</h2>
          <p className="text-gray-500 text-sm">Bakiyeler, iadeler ve komisyon özeti</p>
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
      {aktifTab === 'bakiyeler'  && <SaticiBakiyeleri showToast={showToast} />}
      {aktifTab === 'iadeler'    && <BekleyenIadeler showToast={showToast} />}
      {aktifTab === 'hakedisler' && <Hakedisler showToast={showToast} />}
      {aktifTab === 'komisyon'   && <KomisyonOzeti />}

      {/* Toast */}
      {toast && (
        <Toast mesaj={toast.mesaj} tip={toast.tip} onKapat={() => setToast(null)} />
      )}
    </div>
  )
}
