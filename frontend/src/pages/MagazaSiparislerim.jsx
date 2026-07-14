import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { Search, Package, ChevronRight, Clock, CheckCircle, Truck, XCircle, RefreshCw } from 'lucide-react'
import API from '../config.js'
import SEO from '../components/SEO'

const fmt = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0)

const DURUM_BILGI = {
  yeni:            { label: 'Sipariş Alındı', color: 'bg-blue-100 text-blue-700', icon: Clock },
  hazirlaniyor:    { label: 'Hazırlanıyor', color: 'bg-amber-100 text-amber-700', icon: RefreshCw },
  kargoda:         { label: 'Kargoda', color: 'bg-violet-100 text-violet-700', icon: Truck },
  teslim_edildi:   { label: 'Teslim Edildi', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  iptal:           { label: 'İptal Edildi', color: 'bg-red-100 text-red-700', icon: XCircle },
  iade:            { label: 'İade Süreci', color: 'bg-orange-100 text-orange-700', icon: RefreshCw },
}

const ODEME_DURUM = {
  bekliyor:   { label: 'Ödeme Bekleniyor', color: 'text-amber-600' },
  odendi:     { label: 'Ödendi', color: 'text-green-600' },
  basarisiz:  { label: 'Ödeme Başarısız', color: 'text-red-600' },
  iptal:      { label: 'İptal', color: 'text-gray-500' },
}

export default function MagazaSiparislerim() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ siparis_no: '', telefon: '' })
  const [siparis, setSiparis] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const ara = async (e) => {
    e.preventDefault()
    const no = form.siparis_no.trim().toUpperCase()
    const tel = form.telefon.trim()
    if (!no) { setHata('Sipariş numarası zorunlu'); return }
    if (!tel) { setHata('Telefon numarası zorunlu'); return }
    setHata('')
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/magaza/public/siparis/${no}`, {
        params: { telefon: tel }
      })
      setSiparis(r.data)
    } catch (err) {
      setHata(err.response?.data?.hata || 'Sipariş bulunamadı. Bilgileri kontrol edin.')
      setSiparis(null)
    }
    setYukleniyor(false)
  }

  const durum = siparis ? (DURUM_BILGI[siparis.durum] || { label: siparis.durum, color: 'bg-gray-100 text-gray-600', icon: Clock }) : null
  const odemeDurum = siparis ? (ODEME_DURUM[siparis.odeme_durumu] || { label: siparis.odeme_durumu, color: 'text-gray-600' }) : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <SEO baslik="Siparişlerim" url="/magaza/siparislerim" />

      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Sipariş Sorgula</h1>
        <p className="text-gray-500 text-sm">Sipariş numaranız ve telefon numaranızla siparişinizi takip edin.</p>
      </div>

      <form onSubmit={ara} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Sipariş Numarası <span className="text-red-500">*</span>
          </label>
          <input
            value={form.siparis_no}
            onChange={e => { setForm(f => ({ ...f, siparis_no: e.target.value })); setHata('') }}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-blue-500 uppercase"
            placeholder="Örn: AB3C9F2E"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Telefon Numarası <span className="text-red-500">*</span>
          </label>
          <input
            value={form.telefon}
            onChange={e => { setForm(f => ({ ...f, telefon: e.target.value })); setHata('') }}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
            placeholder="05XX XXX XX XX"
          />
        </div>
        {hata && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{hata}</p>
        )}
        <button
          type="submit"
          disabled={yukleniyor}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-60"
        >
          {yukleniyor
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Search size={16} />
          }
          Sipariş Sorgula
        </button>
      </form>

      {/* Sipariş Sonucu */}
      {siparis && durum && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Başlık */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Sipariş No</p>
              <p className="text-xl font-black text-blue-700 font-mono">{siparis.siparis_no}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${durum.color}`}>
              {durum.label}
            </span>
          </div>

          {/* Kalemler */}
          {siparis.kalemler && siparis.kalemler.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sipariş Kalemleri</p>
              <div className="space-y-3">
                {siparis.kalemler.map(k => (
                  <div key={k.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0">
                      {k.kapak_gorsel
                        ? <img src={`${API}/uploads/${k.kapak_gorsel}`} className="w-full h-full object-contain p-1" alt={k.urun_ad} />
                        : <Package size={14} className="text-gray-300" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{k.urun_ad}</p>
                      <p className="text-xs text-gray-500">{k.miktar} adet × {fmt(k.birim_fiyat_tl)}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{fmt(k.toplam_tl)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Özet */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Genel Toplam</p>
                <p className="font-bold text-gray-900">{fmt(siparis.genel_toplam_tl)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Ödeme Durumu</p>
                <p className={`font-bold ${odemeDurum?.color}`}>{odemeDurum?.label}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Ödeme Yöntemi</p>
                <p className="font-medium text-gray-700">{siparis.odeme_yontemi || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Sipariş Tarihi</p>
                <p className="font-medium text-gray-700">{siparis.olusturma}</p>
              </div>
            </div>
          </div>

          {/* Adres */}
          {siparis.teslimat_adres && (
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Teslimat Adresi</p>
              <p className="text-sm text-gray-700">{siparis.teslimat_adres}</p>
              {siparis.teslimat_ilce && <p className="text-xs text-gray-500 mt-0.5">{siparis.teslimat_ilce}</p>}
            </div>
          )}

          {/* Durum geçmişi */}
          {siparis.durum_gecmisi && siparis.durum_gecmisi.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sipariş Geçmişi</p>
              <div className="space-y-2">
                {siparis.durum_gecmisi.map(d => (
                  <div key={d.id} className="flex items-start gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-700">{DURUM_BILGI[d.yeni_durum]?.label || d.yeni_durum}</span>
                      {d.aciklama && <span className="text-gray-500 ml-1">— {d.aciklama}</span>}
                      <p className="text-gray-400">{d.tarih}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/magaza" className="text-sm text-blue-600 hover:underline">← Mağazaya Dön</Link>
        <span className="mx-3 text-gray-300">|</span>
        <Link to="/iletisim" className="text-sm text-blue-600 hover:underline">Destek</Link>
      </div>
    </div>
  )
}
