import { useState, useMemo } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { Package, Check, CreditCard, Truck, Building2, ChevronRight, AlertCircle, Shield, ExternalLink, Store } from 'lucide-react'
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
}

const ONAY_KUTULARI = [
  {
    key: 'on_bilgilendirme',
    link: '/on-bilgilendirme-formu',
    label: 'Ön Bilgilendirme Formu\'nu okudum ve kabul ediyorum.',
  },
  {
    key: 'mesafeli_satis',
    link: '/mesafeli-satis',
    label: 'Mesafeli Satış / Hizmet Sözleşmesi\'ni okudum ve kabul ediyorum.',
  },
  {
    key: 'iptal_iade',
    link: '/iptal-iade-politikasi',
    label: 'İptal ve İade Koşulları\'nı okudum ve kabul ediyorum.',
  },
  {
    key: 'gizlilik',
    link: '/kisisel-veriler',
    label: 'Gizlilik ve Kişisel Veriler metnini okudum.',
  },
]

export default function MagazaOdeme() {
  const location = useLocation()
  const navigate = useNavigate()
  const items = location.state?.items || []

  const [form, setForm] = useState({
    ad: '', soyad: '', telefon: '', email: '',
    fatura_tipi: 'bireysel',
    fatura_ad: '', vergi_no: '', vergi_dairesi: '',
    adres: '', ilce: '', musteri_notu: '',
  })
  const [onaylar, setOnaylar] = useState({
    on_bilgilendirme: false,
    mesafeli_satis: false,
    iptal_iade: false,
    gizlilik: false,
  })
  const [hatalar, setHatalar] = useState({})
  const [onayHata, setOnayHata] = useState(false)
  const [odemeYontemi, setOdemeYontemi] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [siparisTamam, setSiparisTamam] = useState(null)

  const toplamUsd = items.reduce((t, i) => t + i.usd_fiyat * i.miktar, 0)
  const toplamTl = items.reduce((t, i) => t + i.tl_fiyat * i.miktar, 0)

  const saticiGruplari = useMemo(() => {
    const gruplar = {}
    items.forEach(item => {
      const key = item.store_id || 'adausta'
      const magaza = item.magaza_adi || 'AdaUsta Resmî Mağaza'
      if (!gruplar[key]) gruplar[key] = { magaza_adi: magaza, store_id: item.store_id, items: [] }
      gruplar[key].items.push(item)
    })
    return Object.values(gruplar)
  }, [items])

  const degistir = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setHatalar(h => ({ ...h, [k]: '' }))
  }

  const onayDegistir = (k) => {
    setOnaylar(o => ({ ...o, [k]: !o[k] }))
    setOnayHata(false)
  }

  const dogrula = () => {
    const h = {}
    if (!form.ad.trim()) h.ad = 'Ad zorunlu'
    if (!form.soyad.trim()) h.soyad = 'Soyad zorunlu'
    if (!form.telefon.trim()) h.telefon = 'Telefon zorunlu'
    else if (!/^\+?[\d\s\-()]{7,20}$/.test(form.telefon.trim())) h.telefon = 'Geçerli telefon girin'
    if (!form.adres.trim()) h.adres = 'Teslimat adresi zorunlu'
    if (form.fatura_tipi === 'kurumsal') {
      if (!form.fatura_ad.trim()) h.fatura_ad = 'Şirket/kurum adı zorunlu'
    }
    return h
  }

  const tumOnaylarSecili = Object.values(onaylar).every(Boolean)

  const siparisVer = async (e) => {
    e.preventDefault()
    const h = dogrula()
    if (Object.keys(h).length) { setHatalar(h); return }
    if (!items.length) { navigate('/magaza'); return }
    if (!odemeYontemi || odemeYontemi === 'kapida') {
      alert('Lütfen bir ödeme yöntemi seçin.')
      return
    }
    if (!tumOnaylarSecili) {
      setOnayHata(true)
      document.getElementById('onay-kutulari')?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    setYukleniyor(true)
    try {
      const payload = {
        items: items.map(i => ({ urun_id: i.urun_id, miktar: i.miktar })),
        ad: form.ad.trim(),
        soyad: form.soyad.trim(),
        telefon: form.telefon.trim(),
        email: form.email.trim(),
        fatura_tipi: form.fatura_tipi,
        fatura_ad: form.fatura_ad.trim(),
        vergi_no: form.vergi_no.trim(),
        vergi_dairesi: form.vergi_dairesi.trim(),
        adres: form.adres.trim(),
        ilce: form.ilce.trim(),
        not_: form.musteri_notu.trim(),
        odeme_yontemi: odemeYontemi,
        on_bilgilendirme_onaylandi: true,
        mesafeli_satis_onaylandi: true,
        iptal_iade_onaylandi: true,
        gizlilik_onaylandi: true,
      }
      const r = await axios.post(`${API}/api/magaza/public/siparis`, payload)

      if (odemeYontemi === 'online_kredi') {
        const { data } = await axios.post(`${API}/api/odeme/cardplus/magaza/baslat`, {
          siparis_no: r.data.siparis_no,
        })
        localStorage.removeItem(CART_KEY)
        // Kullanıcıyı bankanın 3D Secure sayfasına yönlendiren otomatik-submit
        // form HTML'i, sayfanın tamamının yerine geçecek şekilde yazdırılır.
        document.open()
        document.write(data.form_html)
        document.close()
        return
      }

      localStorage.removeItem(CART_KEY)
      navigate('/magaza/siparis-basarili', {
        state: {
          siparis_no: r.data.siparis_no,
          genel_toplam_tl: r.data.genel_toplam_tl,
          odeme_yontemi: odemeYontemi,
          ad: form.ad,
          email: form.email,
        },
        replace: true,
      })
    } catch (err) {
      alert(err.response?.data?.hata || 'Sipariş gönderilemedi, tekrar deneyin.')
      setYukleniyor(false)
      return
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate('/magaza')} className="text-sm text-blue-600 hover:underline">Mağaza</button>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-sm font-semibold text-gray-900">Siparişi Tamamla</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Sol — Form */}
        <form onSubmit={siparisVer} className="lg:col-span-3 space-y-5">

          {/* İletişim */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-base">Müşteri Bilgileri</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'ad', label: 'Ad', ph: 'Adınız', req: true },
                { key: 'soyad', label: 'Soyad', ph: 'Soyadınız', req: true },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {f.label} {f.req && <span className="text-red-500">*</span>}
                  </label>
                  <input value={form[f.key]} onChange={e => degistir(f.key, e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-colors ${hatalar[f.key] ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                    placeholder={f.ph} />
                  {hatalar[f.key] && <p className="text-xs text-red-500 mt-1">{hatalar[f.key]}</p>}
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telefon <span className="text-red-500">*</span></label>
              <input value={form.telefon} onChange={e => degistir('telefon', e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-colors ${hatalar.telefon ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                placeholder="05XX XXX XX XX" />
              {hatalar.telefon && <p className="text-xs text-red-500 mt-1">{hatalar.telefon}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-posta <span className="text-gray-400 font-normal">(sipariş takibi için önerilir)</span></label>
              <input type="email" value={form.email} onChange={e => degistir('email', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                placeholder="email@ornek.com" />
            </div>
          </div>

          {/* Fatura Bilgileri */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-base">Fatura Bilgileri</h2>
            <div className="flex gap-3">
              {[
                { key: 'bireysel', label: 'Bireysel' },
                { key: 'kurumsal', label: 'Kurumsal' },
              ].map(t => (
                <button type="button" key={t.key}
                  onClick={() => degistir('fatura_tipi', t.key)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                    form.fatura_tipi === t.key
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                  }`}
                >{t.label}</button>
              ))}
            </div>
            {form.fatura_tipi === 'kurumsal' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Şirket / Kurum Adı <span className="text-red-500">*</span></label>
                  <input value={form.fatura_ad} onChange={e => degistir('fatura_ad', e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-colors ${hatalar.fatura_ad ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                    placeholder="Şirket adı" />
                  {hatalar.fatura_ad && <p className="text-xs text-red-500 mt-1">{hatalar.fatura_ad}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vergi No</label>
                    <input value={form.vergi_no} onChange={e => degistir('vergi_no', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                      placeholder="1234567890" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vergi Dairesi</label>
                    <input value={form.vergi_dairesi} onChange={e => degistir('vergi_dairesi', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                      placeholder="Vergi dairesi" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Teslimat */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-blue-600" />
              <h2 className="font-bold text-gray-900 text-base">Teslimat Bilgileri</h2>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teslimat Adresi <span className="text-red-500">*</span></label>
              <textarea value={form.adres} onChange={e => degistir('adres', e.target.value)} rows={3}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-colors resize-none ${hatalar.adres ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                placeholder="Mahalle, cadde, sokak, kapı no..." />
              {hatalar.adres && <p className="text-xs text-red-500 mt-1">{hatalar.adres}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">İlçe / Bölge</label>
              <input value={form.ilce} onChange={e => degistir('ilce', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                placeholder="Lefkoşa, Girne, Gazimağusa..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sipariş Notu <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
              <textarea value={form.musteri_notu} onChange={e => degistir('musteri_notu', e.target.value)} rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 resize-none"
                placeholder="Ek bilgi, teslimat saati tercihi..." />
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <span>Teslimat süresi ve koşulları için:</span>
              <Link to="/teslimat-ve-hizmet-sureci" target="_blank" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                Teslimat Bilgileri <ExternalLink size={10} />
              </Link>
            </div>
          </div>

          {/* Ödeme Yöntemi */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={16} className="text-blue-600" />
              <h2 className="font-bold text-gray-900 text-base">Ödeme Yöntemi</h2>
            </div>
            <div className="space-y-3">

              {/* Kapıda Ödeme */}
              <div className={`border-2 rounded-2xl overflow-hidden transition-colors ${
                odemeYontemi === 'kapida_nakit' || odemeYontemi === 'kapida_kredi' ? 'border-blue-500' : 'border-gray-200'
              }`}>
                <button type="button"
                  onClick={() => setOdemeYontemi(odemeYontemi === 'kapida_nakit' || odemeYontemi === 'kapida_kredi' ? '' : 'kapida')}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    odemeYontemi === 'kapida_nakit' || odemeYontemi === 'kapida_kredi' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Truck size={18} className={odemeYontemi === 'kapida_nakit' || odemeYontemi === 'kapida_kredi' ? 'text-blue-600' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">Kapıda Ödeme</p>
                    <p className="text-xs text-gray-500">Teslimat sırasında ödeme yapın</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
                {(odemeYontemi === 'kapida' || odemeYontemi === 'kapida_nakit' || odemeYontemi === 'kapida_kredi') && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50">
                    <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Ödeme Türünü Seçin</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'kapida_nakit', label: 'Nakit' },
                        { key: 'kapida_kredi', label: 'Kredi Kartı' },
                      ].map(t => (
                        <button type="button" key={t.key}
                          onClick={() => setOdemeYontemi(t.key)}
                          className={`py-2.5 px-4 rounded-xl text-sm font-bold border-2 transition-colors ${
                            odemeYontemi === t.key
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                          }`}
                        >{t.label}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Havale / EFT */}
              <div className={`border-2 rounded-2xl overflow-hidden transition-colors ${odemeYontemi === 'havale' ? 'border-blue-500' : 'border-gray-200'}`}>
                <button type="button"
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
                    {[
                      { l: 'Hesap Sahibi', v: BANKA.sahip },
                      { l: 'Banka', v: BANKA.banka },
                      { l: 'Şube', v: `${BANKA.sube} (${BANKA.sube_kodu})` },
                      { l: 'Hesap No', v: BANKA.hesap_no },
                    ].map(r => (
                      <div key={r.l} className="flex justify-between">
                        <span className="text-gray-500">{r.l}</span>
                        <span className="font-semibold text-gray-800">{r.v}</span>
                      </div>
                    ))}
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

              {/* Online Kredi Kartı — CardPlus 3D Secure */}
              <div className={`border-2 rounded-2xl overflow-hidden transition-colors ${odemeYontemi === 'online_kredi' ? 'border-blue-500' : 'border-gray-200'}`}>
                <button type="button"
                  onClick={() => setOdemeYontemi('online_kredi')}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${odemeYontemi === 'online_kredi' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <CreditCard size={18} className={odemeYontemi === 'online_kredi' ? 'text-blue-600' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">Online Kredi Kartı</p>
                    <p className="text-xs text-gray-500">CardPlus güvenli 3D Secure ödeme</p>
                  </div>
                  {odemeYontemi === 'online_kredi' ? <Check size={16} className="text-blue-600" /> : <ChevronRight size={16} className="text-gray-400" />}
                </button>
                {odemeYontemi === 'online_kredi' && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-blue-50 text-xs text-blue-700">
                    Kart bilgileriniz bizim sunucularımıza değil, doğrudan bankanın güvenli 3D Secure sayfasına girilir.
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Yasal Onay Kutuları */}
          <div id="onay-kutulari" className={`bg-white border-2 rounded-2xl p-6 space-y-3 ${onayHata ? 'border-red-400' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-blue-600" />
              <h2 className="font-bold text-gray-900 text-base">Sözleşme Onayları</h2>
            </div>
            {onayHata && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
                <AlertCircle size={15} />
                Ödemeye geçmek için tüm sözleşmeleri onaylamanız gerekiyor.
              </div>
            )}
            {ONAY_KUTULARI.map(k => (
              <label key={k.key} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                onaylar[k.key] ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}>
                <input
                  type="checkbox"
                  checked={onaylar[k.key]}
                  onChange={() => onayDegistir(k.key)}
                  className="mt-0.5 w-4 h-4 accent-blue-600 flex-shrink-0"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  <Link to={k.link} target="_blank" className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-0.5">
                    {k.label.split('\'')[0]}&apos;
                    <ExternalLink size={11} className="ml-0.5" />
                  </Link>
                  {k.label.includes("'") ? k.label.substring(k.label.indexOf("'") + 1) : ' ' + k.label.split(' ').slice(1).join(' ')}
                </span>
              </label>
            ))}
            <p className="text-xs text-gray-400 pt-1">
              Bu kutular seçilmeden ödeme başlatılamaz. Sözleşmeleri yeni sekmede okumak için başlıklara tıklayın.
            </p>
          </div>

          {odemeYontemi === 'kapida' && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-800">
              <AlertCircle size={15} className="flex-shrink-0" />
              Kapıda ödeme türünü seçin: <strong>Nakit</strong> veya <strong>Kredi Kartı</strong>
            </div>
          )}

          <button
            type="submit"
            disabled={yukleniyor || !odemeYontemi || odemeYontemi === 'kapida'}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {yukleniyor
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gönderiliyor...</>
              : <><Shield size={16} /> Sipariş Ver</>
            }
          </button>
        </form>

        {/* Sağ — Sipariş Özeti */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-24">
            <h2 className="font-bold text-gray-900 mb-4">Sipariş Özeti</h2>
            <div className="space-y-3 mb-4">
              {saticiGruplari.map(grup => (
                <div key={grup.store_id || 'adausta'} className="mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-2 pb-1 border-b border-gray-100">
                    <Store size={11} />
                    {grup.magaza_adi}
                  </div>
                  {grup.items.map(i => (
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
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Ara Toplam</span>
                <span>${toplamUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Kargo</span>
                <span className="text-green-600">Ücretsiz</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-900">Toplam</span>
                <div className="text-right">
                  <p className="text-xl font-black text-gray-900">${toplamUsd.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{fmt(toplamTl)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Güven rozetleri */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
            {[
              { icon: '🔒', text: 'Güvenli sipariş altyapısı' },
              { icon: '📋', text: 'Şeffaf iptal ve iade koşulları' },
              { icon: '📞', text: 'Müşteri desteği: +90 548 851 07 00' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <span>{r.icon}</span>
                <span>{r.text}</span>
              </div>
            ))}
            <Link to="/teslimat-ve-hizmet-sureci" target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1 pt-1">
              Teslimat ve Hizmet Süreci <ExternalLink size={10} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
