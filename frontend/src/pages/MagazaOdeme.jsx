import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Package, Check } from 'lucide-react'
import API from '../config.js'

const fmt = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0)
const CART_KEY = 'adausta_sepet'

export default function MagazaOdeme() {
  const location = useLocation()
  const navigate = useNavigate()
  const items = location.state?.items || []

  const [form, setForm] = useState({ ad: '', soyad: '', telefon: '', email: '', adres: '' })
  const [hatalar, setHatalar] = useState({})
  const [yukleniyor, setYukleniyor] = useState(false)
  const [siparisTamam, setSiparisTamam] = useState(null) // siparis_kodu

  const toplamUsd = items.reduce((t, i) => t + i.usd_fiyat * i.miktar, 0)
  const toplamTl = items.reduce((t, i) => t + i.tl_fiyat * i.miktar, 0)

  const degistir = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setHatalar(h => ({ ...h, [k]: '' }))
  }

  const dogrula = () => {
    const h = {}
    if (!form.ad.trim()) h.ad = 'Ad zorunlu'
    if (!form.soyad.trim()) h.soyad = 'Soyad zorunlu'
    if (!form.telefon.trim()) h.telefon = 'Telefon zorunlu'
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(form.telefon.trim())) h.telefon = 'Geçerli telefon girin'
    if (!form.adres.trim()) h.adres = 'Adres zorunlu'
    return h
  }

  const siparisVer = async (e) => {
    e.preventDefault()
    const h = dogrula()
    if (Object.keys(h).length) { setHatalar(h); return }
    if (!items.length) { navigate('/magaza'); return }

    setYukleniyor(true)
    try {
      const r = await axios.post(`${API}/api/magaza/public/siparis`, {
        items: items.map(i => ({ urun_id: i.urun_id, miktar: i.miktar })),
        ad: `${form.ad.trim()} ${form.soyad.trim()}`,
        telefon: form.telefon.trim(),
        email: form.email.trim(),
        adres: form.adres.trim(),
      })
      localStorage.removeItem(CART_KEY)
      setSiparisTamam(r.data.siparis_kodu)
    } catch (err) {
      alert(err.response?.data?.hata || 'Sipariş gönderilemedi, tekrar deneyin.')
    }
    setYukleniyor(false)
  }

  if (!items.length && !siparisTamam) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Package size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 mb-6">Sepetiniz boş.</p>
        <button onClick={() => navigate('/magaza')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">
          Mağazaya Git
        </button>
      </div>
    )
  }

  if (siparisTamam) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Siparisiz Alindi!</h2>
        <p className="text-gray-500 mb-3">Siparisiniz basariyla olusturuldu.</p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 inline-block mb-8">
          <p className="text-xs text-gray-400 mb-1">Siparis Kodu</p>
          <p className="text-2xl font-black text-blue-600 tracking-widest">{siparisTamam}</p>
        </div>
        <p className="text-sm text-gray-500 mb-8">Bu kodu not alabilirsiniz. Ekibimiz en kisa surede sizinle iletisime gececektir.</p>
        <button onClick={() => navigate('/magaza')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">
          Mağazaya Dön
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-8">Siparisi Tamamla</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <form onSubmit={siparisVer} className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
            <h2 className="font-bold text-gray-900 text-lg">İletisim Bilgileri</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ad <span className="text-red-500">*</span></label>
                <input
                  value={form.ad}
                  onChange={e => degistir('ad', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${hatalar.ad ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                  placeholder="Adiniz"
                />
                {hatalar.ad && <p className="text-xs text-red-500 mt-1">{hatalar.ad}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Soyad <span className="text-red-500">*</span></label>
                <input
                  value={form.soyad}
                  onChange={e => degistir('soyad', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${hatalar.soyad ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                  placeholder="Soyadiniz"
                />
                {hatalar.soyad && <p className="text-xs text-red-500 mt-1">{hatalar.soyad}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telefon <span className="text-red-500">*</span></label>
              <input
                value={form.telefon}
                onChange={e => degistir('telefon', e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${hatalar.telefon ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                placeholder="05XX XXX XX XX"
              />
              {hatalar.telefon && <p className="text-xs text-red-500 mt-1">{hatalar.telefon}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                E-posta <span className="text-gray-400 font-normal">(opsiyonel)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => degistir('email', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                placeholder="email@ornek.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teslimat Adresi <span className="text-red-500">*</span></label>
              <textarea
                value={form.adres}
                onChange={e => degistir('adres', e.target.value)}
                rows={3}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors resize-none ${hatalar.adres ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                placeholder="Tam adresinizi yazin..."
              />
              {hatalar.adres && <p className="text-xs text-red-500 mt-1">{hatalar.adres}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-70"
          >
            {yukleniyor ? 'Gönderiliyor...' : 'Siparis Ver'}
          </button>
          <p className="text-xs text-gray-400 text-center">Kayit olmadan siparis verebilirsiniz. Ekibimiz sizi arayacaktir.</p>
        </form>

        {/* Sipariş özeti */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-24">
            <h2 className="font-bold text-gray-900 mb-4">Siparis Özeti</h2>
            <div className="space-y-3 mb-4">
              {items.map(i => (
                <div key={i.urun_id} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0">
                    {i.kapak_gorsel
                      ? <img src={`${API}/uploads/${i.kapak_gorsel}`} className="w-full h-full object-contain p-1" alt={i.ad} />
                      : <Package size={16} className="text-gray-300" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{i.ad}</p>
                    <p className="text-xs text-gray-400">{i.miktar} adet</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${(i.usd_fiyat * i.miktar).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{fmt(i.tl_fiyat * i.miktar)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Toplam</span>
                <div className="text-right">
                  <p className="text-2xl font-black text-gray-900">${toplamUsd.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{fmt(toplamTl)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
