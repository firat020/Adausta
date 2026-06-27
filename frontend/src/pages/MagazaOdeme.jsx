import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Package, Check, CreditCard, Truck, Building2, ChevronRight } from 'lucide-react'
import API from '../config.js'

const fmt = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0)
const CART_KEY = 'adausta_sepet'

const BANKA = {
  sahip: 'Adissa Enterprises Ltd.',
  banka: 'Garanti BBVA',
  sube: 'Girne (KKTC)',
  sube_kodu: '1288',
  hesap_no: '6295117',
  iban: 'TR05 0006 2001 2880 0006 2951 17',
  para_birimi: 'TL',
}

export default function MagazaOdeme() {
  const location = useLocation()
  const navigate = useNavigate()
  const items = location.state?.items || []

  const [form, setForm] = useState({ ad: '', soyad: '', telefon: '', email: '', adres: '' })
  const [hatalar, setHatalar] = useState({})
  const [odemeYontemi, setOdemeYontemi] = useState('')
  const [kapidaAlt, setKapidaAlt] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [siparisTamam, setSiparisTamam] = useState(null)

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

  const odemeYontemLabel = () => {
    if (odemeYontemi === 'kapida_nakit') return 'Kapıda Ödeme - Nakit'
    if (odemeYontemi === 'kapida_kredi') return 'Kapıda Ödeme - Kredi Kartı'
    if (odemeYontemi === 'havale') return 'Havale / EFT'
    return odemeYontemi
  }

  const siparisVer = async (e) => {
    e.preventDefault()
    const h = dogrula()
    if (Object.keys(h).length) { setHatalar(h); return }
    if (!items.length) { navigate('/magaza'); return }
    if (!odemeYontemi) { alert('Lütfen bir ödeme yöntemi seçin.'); return }
    if (odemeYontemi === 'kapida' && !kapidaAlt) { alert('Kapıda ödeme türünü seçin.'); return }

    setYukleniyor(true)
    try {
      const r = await axios.post(`${API}/api/magaza/public/siparis`, {
        items: items.map(i => ({ urun_id: i.urun_id, miktar: i.miktar })),
        ad: `${form.ad.trim()} ${form.soyad.trim()}`,
        telefon: form.telefon.trim(),
        email: form.email.trim(),
        adres: form.adres.trim(),
        odeme_yontemi: odemeYontemLabel(),
      })
      localStorage.removeItem(CART_KEY)
      setSiparisTamam({ kod: r.data.siparis_kodu, yontem: odemeYontemi })
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
        <h2 className="text-2xl font-black text-gray-900 mb-2">Siparişiniz Alındı!</h2>
        <p className="text-gray-500 mb-3">Siparişiniz başarıyla oluşturuldu.</p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 inline-block mb-6">
          <p className="text-xs text-gray-400 mb-1">Sipariş Kodu</p>
          <p className="text-2xl font-black text-blue-600 tracking-widest">{siparisTamam.kod}</p>
        </div>

        {siparisTamam.yontem === 'havale' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-left mb-6">
            <p className="text-sm font-bold text-blue-800 mb-3">Havale / EFT Bilgileri</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Hesap Sahibi</span>
                <span className="font-semibold text-gray-800">{BANKA.sahip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Banka</span>
                <span className="font-semibold text-gray-800">{BANKA.banka}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Şube</span>
                <span className="font-semibold text-gray-800">{BANKA.sube} ({BANKA.sube_kodu})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Hesap No</span>
                <span className="font-semibold text-gray-800">{BANKA.hesap_no}</span>
              </div>
              <div className="border-t border-blue-200 pt-2 mt-2">
                <p className="text-xs text-gray-500 mb-1">IBAN</p>
                <p className="font-black text-gray-900 tracking-wider text-base">{BANKA.iban}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-3">
                <p className="text-xs text-yellow-800 font-semibold">
                  Açıklama kısmına sipariş kodunuzu yazınız: <span className="font-black">{siparisTamam.kod}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {(siparisTamam.yontem === 'kapida_nakit' || siparisTamam.yontem === 'kapida_kredi') && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800 mb-6">
            Kapıda ödeme seçildi. Ekibimiz en kısa sürede sizi arayacaktır.
          </div>
        )}

        <p className="text-sm text-gray-400 mb-8">Bu kodu not alın. Ekibimiz en kısa sürede sizinle iletişime geçecektir.</p>
        <button onClick={() => navigate('/magaza')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">
          Mağazaya Dön
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-8">Siparişi Tamamla</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Sol — Form */}
        <form onSubmit={siparisVer} className="lg:col-span-3 space-y-5">

          {/* İletişim Bilgileri */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
            <h2 className="font-bold text-gray-900 text-lg">İletişim Bilgileri</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ad <span className="text-red-500">*</span></label>
                <input value={form.ad} onChange={e => degistir('ad', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${hatalar.ad ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                  placeholder="Adınız" />
                {hatalar.ad && <p className="text-xs text-red-500 mt-1">{hatalar.ad}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Soyad <span className="text-red-500">*</span></label>
                <input value={form.soyad} onChange={e => degistir('soyad', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${hatalar.soyad ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                  placeholder="Soyadınız" />
                {hatalar.soyad && <p className="text-xs text-red-500 mt-1">{hatalar.soyad}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telefon <span className="text-red-500">*</span></label>
              <input value={form.telefon} onChange={e => degistir('telefon', e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${hatalar.telefon ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                placeholder="05XX XXX XX XX" />
              {hatalar.telefon && <p className="text-xs text-red-500 mt-1">{hatalar.telefon}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-posta <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
              <input type="email" value={form.email} onChange={e => degistir('email', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                placeholder="email@ornek.com" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teslimat Adresi <span className="text-red-500">*</span></label>
              <textarea value={form.adres} onChange={e => degistir('adres', e.target.value)} rows={3}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors resize-none ${hatalar.adres ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                placeholder="Tam adresinizi yazın..." />
              {hatalar.adres && <p className="text-xs text-red-500 mt-1">{hatalar.adres}</p>}
            </div>
          </div>

          {/* Ödeme Yöntemi */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Ödeme Yöntemi</h2>
            <div className="space-y-3">

              {/* Kapıda Ödeme */}
              <div className={`border-2 rounded-2xl overflow-hidden transition-colors ${odemeYontemi === 'kapida_nakit' || odemeYontemi === 'kapida_kredi' ? 'border-blue-500' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => { setOdemeYontemi('kapida'); setKapidaAlt('') }}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${odemeYontemi === 'kapida_nakit' || odemeYontemi === 'kapida_kredi' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Truck size={18} className={odemeYontemi === 'kapida_nakit' || odemeYontemi === 'kapida_kredi' ? 'text-blue-600' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">Kapıda Ödeme</p>
                    <p className="text-xs text-gray-500">Teslimat sırasında ödeme yapın</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>

                {/* Alt seçenekler */}
                {(odemeYontemi === 'kapida' || odemeYontemi === 'kapida_nakit' || odemeYontemi === 'kapida_kredi') && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50">
                    <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Ödeme Türü Seçin</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOdemeYontemi('kapida_nakit')}
                        className={`py-2.5 px-4 rounded-xl text-sm font-bold border-2 transition-colors ${odemeYontemi === 'kapida_nakit' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'}`}
                      >
                        Nakit
                      </button>
                      <button
                        type="button"
                        onClick={() => setOdemeYontemi('kapida_kredi')}
                        className={`py-2.5 px-4 rounded-xl text-sm font-bold border-2 transition-colors ${odemeYontemi === 'kapida_kredi' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'}`}
                      >
                        Kredi Kartı
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Online Kredi Kartı — Yakında */}
              <div className="border-2 border-gray-100 rounded-2xl overflow-hidden opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CreditCard size={18} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-500 text-sm">Online Kredi Kartı</p>
                    <p className="text-xs text-gray-400">Güvenli online ödeme</p>
                  </div>
                  <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Yakında</span>
                </div>
              </div>

              {/* Havale / EFT */}
              <div className={`border-2 rounded-2xl overflow-hidden transition-colors ${odemeYontemi === 'havale' ? 'border-blue-500' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setOdemeYontemi('havale')}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${odemeYontemi === 'havale' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Building2 size={18} className={odemeYontemi === 'havale' ? 'text-blue-600' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">Havale / EFT</p>
                    <p className="text-xs text-gray-500">Banka havalesi ile ödeme</p>
                  </div>
                  {odemeYontemi === 'havale' ? <Check size={16} className="text-blue-600" /> : <ChevronRight size={16} className="text-gray-400" />}
                </button>

                {odemeYontemi === 'havale' && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-blue-50 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hesap Sahibi</span>
                      <span className="font-semibold text-gray-800">{BANKA.sahip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Banka</span>
                      <span className="font-semibold text-gray-800">{BANKA.banka}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Şube</span>
                      <span className="font-semibold text-gray-800">{BANKA.sube} ({BANKA.sube_kodu})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hesap No</span>
                      <span className="font-semibold text-gray-800">{BANKA.hesap_no}</span>
                    </div>
                    <div className="border-t border-blue-200 pt-2 mt-1">
                      <p className="text-xs text-gray-500 mb-0.5">IBAN</p>
                      <p className="font-black text-gray-900 tracking-wider">{BANKA.iban}</p>
                    </div>
                    <p className="text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2 mt-2">
                      Sipariş kodunuzu havale açıklamasına yazınız.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>

          <button
            type="submit"
            disabled={yukleniyor || !odemeYontemi || odemeYontemi === 'kapida'}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {yukleniyor ? 'Gönderiliyor...' : 'Sipariş Ver'}
          </button>
          <p className="text-xs text-gray-400 text-center">Kayıt olmadan sipariş verebilirsiniz. Ekibimiz sizi arayacaktır.</p>
        </form>

        {/* Sağ — Sipariş Özeti */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-24">
            <h2 className="font-bold text-gray-900 mb-4">Sipariş Özeti</h2>
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
