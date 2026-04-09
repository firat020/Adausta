import { useState, useEffect, useRef } from 'react'
import {
  CheckCircle, User, Phone, MapPin, Briefcase, FileText,
  CreditCard, Shield, Star, Zap, Check, RefreshCw, MessageSquare
} from 'lucide-react'
import { kategorileriGetir, sehirleriGetir, ustaKayit } from '../api'

const PLANLAR = [
  {
    id: 'aylik',
    ad: 'Monthly Plan',
    fiyat: '9.99',
    birim: '$ / month',
    aciklama: 'Renews monthly, cancel anytime.',
    ozellikler: [
      'Profile visible in search results',
      'Unlimited customer inquiries',
      'WhatsApp & phone button',
      'Reviews and rating system',
    ],
    rozet: null,
  },
  {
    id: 'yillik',
    ad: 'Annual Plan',
    fiyat: '79.99',
    birim: '$ / year',
    aylikEsit: '$6.67/mo — Save 33%',
    aciklama: 'Best value — one full year of uninterrupted visibility.',
    ozellikler: [
      'Everything in Monthly',
      'Priority ranking in search results',
      'Featured craftsman badge',
      '24/7 priority support',
    ],
    rozet: 'Most Popular',
  },
]

// ─── DEMO: Sahte SMS kodu (gerçek SMS entegrasyonu eklenecek) ─────────────────
function smsKoduGonder(telefon) {
  // Gerçek entegrasyonda: Twilio / Netgsm API çağrısı
  console.log(`SMS kodu gönderildi: ${telefon} → 1234`)
  return Promise.resolve('1234') // demo kod
}

export default function UstaKayit() {
  // adım: 1=plan, 2=telefon doğrulama, 3=bilgiler, 4=ödeme
  const [adim, setAdim] = useState(1)
  const [secilenPlan, setSecilenPlan] = useState('yillik')

  // Telefon doğrulama state
  const [telefonGirdi, setTelefonGirdi] = useState('')
  const [smsDurum, setSmsDurum] = useState('idle') // idle | gonderildi | dogrulandi
  const [smsKod, setSmsKod] = useState('')
  const [gercekKod, setGercekKod] = useState('')
  const [kodHata, setKodHata] = useState('')
  const [geriSayim, setGeriSayim] = useState(0)
  const timerRef = useRef(null)
  const girdiRef = useRef([])

  // Form
  const [kategoriler, setKategoriler] = useState([])
  const [sehirler, setSehirler] = useState([])
  const [ilceler, setIlceler] = useState([])
  const [basarili, setBasarili] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const [form, setForm] = useState({
    ad: '', soyad: '', telefon: '', whatsapp: '',
    email: '', sehir_id: '', ilce_id: '',
    kategori_id: '', aciklama: '', deneyim_yil: '',
  })

  const [odeme, setOdeme] = useState({
    kart_ad: '', kart_no: '', son_tarih: '', cvv: '',
  })

  useEffect(() => {
    kategorileriGetir().then(r => setKategoriler(r.data.kategoriler || []))
    sehirleriGetir().then(r => setSehirler(r.data.sehirler || []))
  }, [])

  // Geri sayım
  useEffect(() => {
    if (geriSayim > 0) {
      timerRef.current = setTimeout(() => setGeriSayim(g => g - 1), 1000)
    }
    return () => clearTimeout(timerRef.current)
  }, [geriSayim])

  const sehirDegisti = (sehir_id) => {
    setForm(f => ({ ...f, sehir_id, ilce_id: '' }))
    const s = sehirler.find(s => s.id === parseInt(sehir_id))
    setIlceler(s?.ilceler || [])
  }

  // SMS gönder
  const smsiGonder = async () => {
    if (!telefonGirdi.trim()) return
    setKodHata('')
    setSmsDurum('gonderildi')
    setGeriSayim(60)
    setSmsKod('')
    const kod = await smsKoduGonder(telefonGirdi)
    setGercekKod(kod)
  }

  // Kodu doğrula
  const koduDogrula = () => {
    if (smsKod === gercekKod) {
      setSmsDurum('dogrulandi')
      setKodHata('')
      setForm(f => ({ ...f, telefon: telefonGirdi }))
      setTimeout(() => setAdim(3), 600)
    } else {
      setKodHata('Kod hatalı, tekrar deneyin.')
    }
  }

  // Otomatik odaklanma — kod kutucukları
  const handleKodInput = (val, idx) => {
    const temiz = val.replace(/\D/g, '').slice(-1)
    const arr = (smsKod + '    ').split('').slice(0, 4)
    arr[idx] = temiz
    const yeni = arr.join('').replace(/ /g, '')
    setSmsKod(yeni)
    if (temiz && idx < 3) girdiRef.current[idx + 1]?.focus()
    if (!temiz && idx > 0) girdiRef.current[idx - 1]?.focus()
  }

  const formGonder = (e) => { e.preventDefault(); setAdim(4) }

  const odemeGonder = async (e) => {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)
    try {
      await ustaKayit({
        ...form,
        sehir_id: parseInt(form.sehir_id),
        ilce_id: form.ilce_id ? parseInt(form.ilce_id) : null,
        kategori_id: parseInt(form.kategori_id),
        deneyim_yil: parseInt(form.deneyim_yil) || 0,
      })
      setBasarili(true)
    } catch (err) {
      setHata(err.response?.data?.hata || 'Bir hata oluştu.')
    } finally {
      setYukleniyor(false)
    }
  }

  const kartNoFormat = (val) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

  const sonTarihFormat = (val) => {
    const t = val.replace(/\D/g, '').slice(0, 4)
    return t.length >= 3 ? t.slice(0, 2) + '/' + t.slice(2) : t
  }

  const seciliPlan = PLANLAR.find(p => p.id === secilenPlan)

  // ─── Başarılı ────────────────────────────────────────────────
  if (basarili) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={36} className="text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
      <p className="text-gray-500 leading-relaxed mb-4">
        After payment confirmation your profile will go live within 24 hours.
      </p>
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-6 py-4 text-sm text-blue-700">
        Questions? <strong>+90 533 426 58 90</strong>
      </div>
    </div>
  )

  const inputCls = "w-full border border-blue-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
  const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block"

  // ─── Adım göstergesi ──────────────────────────────────────────
  const ADIMLAR = [
    { no: 1, ad: 'Plan' },
    { no: 2, ad: 'Doğrulama' },
    { no: 3, ad: 'Bilgiler' },
    { no: 4, ad: 'Ödeme' },
  ]

  const AdimGostergesi = () => (
    <div className="flex items-center justify-center gap-0 mb-8">
      {ADIMLAR.map((a, i) => (
        <div key={a.no} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            adim === a.no ? 'bg-blue-600 text-white' :
            adim > a.no  ? 'bg-blue-100 text-blue-700' :
                           'bg-gray-100 text-gray-400'
          }`}>
            {adim > a.no ? <Check size={12} /> : <span>{a.no}</span>}
            {a.ad}
          </div>
          {i < ADIMLAR.length - 1 && (
            <div className={`w-6 h-0.5 ${adim > a.no ? 'bg-blue-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )

  // ─── Adım 1: Plan Seçimi ──────────────────────────────────────
  if (adim === 1) return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Register as a Craftsman</h1>
        <p className="text-gray-500 text-sm mt-2">Choose a plan to reach customers across KKTC</p>
      </div>
      <AdimGostergesi />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        {PLANLAR.map(plan => (
          <div key={plan.id}
            onClick={() => setSecilenPlan(plan.id)}
            className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all ${
              secilenPlan === plan.id
                ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}>
            {plan.rozet && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                <Star size={10} className="fill-white" /> {plan.rozet}
              </div>
            )}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">{plan.ad}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{plan.aciklama}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                secilenPlan === plan.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
              }`}>
                {secilenPlan === plan.id && <Check size={11} className="text-white" />}
              </div>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-gray-900">${plan.fiyat}</span>
              <span className="text-sm text-gray-500 ml-1">{plan.birim}</span>
              {plan.aylikEsit && (
                <div className="text-xs text-blue-600 font-semibold mt-0.5">{plan.aylikEsit}</div>
              )}
            </div>
            <ul className="space-y-2">
              {plan.ozellikler.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />{o}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 mb-6 text-xs text-gray-400">
        <Shield size={13} /><span>SSL encrypted · Secure payment · Cancel anytime</span>
      </div>
      <button onClick={() => setAdim(2)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-base transition-colors">
        Continue — ${seciliPlan?.fiyat} {seciliPlan?.id === 'aylik' ? '/mo' : '/yr'}
      </button>
    </div>
  )

  // ─── Adım 2: Telefon Doğrulama ────────────────────────────────
  if (adim === 2) return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Telefon Doğrulama</h1>
        <p className="text-gray-500 text-sm mt-1">
          Numaranıza SMS kodu göndereceğiz
        </p>
      </div>
      <AdimGostergesi />

      <div className="bg-white border border-blue-100 shadow-sm rounded-2xl p-6">
        {/* Plan özeti */}
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-blue-600" />
            <span className="font-semibold text-blue-800">{seciliPlan?.ad}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-blue-700">${seciliPlan?.fiyat}{seciliPlan?.id === 'aylik' ? '/mo' : '/yr'}</span>
            <button onClick={() => setAdim(1)} className="text-xs text-blue-500 hover:underline">Değiştir</button>
          </div>
        </div>

        {/* Telefon girişi */}
        <div className="mb-4">
          <label className={labelCls}>Telefon Numarası</label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={telefonGirdi}
              onChange={e => setTelefonGirdi(e.target.value)}
              placeholder="+90 548 000 00 00"
              disabled={smsDurum === 'dogrulandi'}
              className={`${inputCls} flex-1`}
            />
            <button
              onClick={smsiGonder}
              disabled={!telefonGirdi.trim() || geriSayim > 0 || smsDurum === 'dogrulandi'}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap">
              {smsDurum === 'idle' ? (
                <><MessageSquare size={14} /> Kod Gönder</>
              ) : geriSayim > 0 ? (
                <><RefreshCw size={13} className="animate-spin" /> {geriSayim}s</>
              ) : (
                <><RefreshCw size={13} /> Tekrar</>
              )}
            </button>
          </div>
        </div>

        {/* Kod giriş kutuları */}
        {smsDurum !== 'idle' && (
          <div className="mb-4">
            <label className={labelCls}>SMS Kodu</label>
            <div className="flex gap-3 justify-center my-4">
              {[0, 1, 2, 3].map(i => (
                <input
                  key={i}
                  ref={el => girdiRef.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={smsKod[i] || ''}
                  onChange={e => handleKodInput(e.target.value, i)}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !smsKod[i] && i > 0)
                      girdiRef.current[i - 1]?.focus()
                  }}
                  className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all ${
                    smsDurum === 'dogrulandi'
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-blue-300 focus:border-blue-600 bg-white'
                  }`}
                />
              ))}
            </div>

            {kodHata && (
              <p className="text-red-500 text-xs text-center mb-3">{kodHata}</p>
            )}

            {smsDurum === 'dogrulandi' ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold text-sm">
                <CheckCircle size={16} /> Telefon doğrulandı!
              </div>
            ) : (
              <button
                onClick={koduDogrula}
                disabled={smsKod.length < 4}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                Doğrula
              </button>
            )}
          </div>
        )}

        {smsDurum === 'idle' && (
          <p className="text-center text-xs text-gray-400 mt-2">
            Numaranıza 4 haneli doğrulama kodu gelecektir.
          </p>
        )}

        <button type="button" onClick={() => setAdim(1)}
          className="w-full mt-3 text-blue-500 hover:underline text-sm text-center">
          ← Geri Dön
        </button>
      </div>
    </div>
  )

  // ─── Adım 3: Bilgi Formu ──────────────────────────────────────
  if (adim === 3) return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Profil Bilgileri</h1>
        <p className="text-gray-500 text-sm mt-1">Profilinde görünecek bilgiler</p>
      </div>
      <AdimGostergesi />

      {/* Plan + telefon özeti */}
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 mb-6 text-sm">
        <div className="flex items-center gap-3">
          <Zap size={14} className="text-blue-600" />
          <span className="font-semibold text-blue-800">{seciliPlan?.ad}</span>
          <span className="text-blue-400">·</span>
          <span className="text-blue-700 font-medium flex items-center gap-1">
            <Phone size={12} /> {telefonGirdi}
            <CheckCircle size={13} className="text-emerald-500 ml-1" />
          </span>
        </div>
        <span className="font-bold text-blue-700">${seciliPlan?.fiyat}{seciliPlan?.id === 'aylik' ? '/mo' : '/yr'}</span>
      </div>

      <form onSubmit={formGonder} className="bg-white border border-blue-100 shadow-sm rounded-2xl overflow-hidden">

        {/* Kişisel */}
        <div className="p-6 border-b border-blue-50">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Kişisel Bilgiler</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ad *</label>
              <input type="text" required value={form.ad}
                onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                className={inputCls} placeholder="Adınız" />
            </div>
            <div>
              <label className={labelCls}>Soyad</label>
              <input type="text" value={form.soyad}
                onChange={e => setForm(f => ({ ...f, soyad: e.target.value }))}
                className={inputCls} placeholder="Soyadınız" />
            </div>
          </div>
        </div>

        {/* İletişim */}
        <div className="p-6 border-b border-blue-50">
          <div className="flex items-center gap-2 mb-5">
            <Phone size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">İletişim</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Telefon (doğrulandı)</label>
              <input type="tel" value={telefonGirdi} readOnly
                className={`${inputCls} bg-emerald-50 border-emerald-300 text-emerald-700 cursor-not-allowed`} />
            </div>
            <div>
              <label className={labelCls}>WhatsApp</label>
              <input type="tel" value={form.whatsapp}
                onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                className={inputCls} placeholder="+90 548 000 0000" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>E-posta *</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputCls} placeholder="ornek@email.com" />
            </div>
          </div>
        </div>

        {/* Konum */}
        <div className="p-6 border-b border-blue-50">
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Konum</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Şehir *</label>
              <select required value={form.sehir_id}
                onChange={e => sehirDegisti(e.target.value)}
                className={inputCls}>
                <option value="">Şehir seçin...</option>
                {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>İlçe</label>
              <select value={form.ilce_id}
                onChange={e => setForm(f => ({ ...f, ilce_id: e.target.value }))}
                disabled={!form.sehir_id}
                className={`${inputCls} disabled:bg-gray-50 disabled:cursor-not-allowed`}>
                <option value="">İlçe seçin...</option>
                {ilceler.map(i => <option key={i.id} value={i.id}>{i.ad}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Hizmet — Kategori */}
        <div className="p-6 border-b border-blue-50">
          <div className="flex items-center gap-2 mb-5">
            <Briefcase size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Hizmet Kategorisi</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Hizmet Türü *</label>
              <select required value={form.kategori_id}
                onChange={e => setForm(f => ({ ...f, kategori_id: e.target.value }))}
                className={inputCls}>
                <option value="">Kategori seçin...</option>
                {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Deneyim (yıl)</label>
              <input type="number" min="0" max="50" value={form.deneyim_yil}
                onChange={e => setForm(f => ({ ...f, deneyim_yil: e.target.value }))}
                className={inputCls} placeholder="0" />
            </div>
          </div>
        </div>

        {/* Hakkında */}
        <div className="p-6 border-b border-blue-50">
          <div className="flex items-center gap-2 mb-5">
            <FileText size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Hakkında</h3>
          </div>
          <textarea value={form.aciklama}
            onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
            rows={4} className={`${inputCls} resize-none`}
            placeholder="Kendinizi ve sunduğunuz hizmetleri kısaca anlatın..." />
        </div>

        <div className="p-6 flex gap-3">
          <button type="button" onClick={() => setAdim(2)}
            className="flex-1 border border-blue-200 text-blue-600 font-semibold py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-sm">
            Geri
          </button>
          <button type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm">
            Ödemeye Geç →
          </button>
        </div>
      </form>
    </div>
  )

  // ─── Adım 4: Ödeme ────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
        <p className="text-gray-500 text-sm mt-1">Secure checkout — SSL encrypted</p>
      </div>
      <AdimGostergesi />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {/* Ödeme formu */}
        <form onSubmit={odemeGonder} className="md:col-span-3 bg-white border border-blue-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-blue-50">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard size={16} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Card Details</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Cardholder Name</label>
                <input type="text" required value={odeme.kart_ad}
                  onChange={e => setOdeme(o => ({ ...o, kart_ad: e.target.value }))}
                  className={inputCls} placeholder="FULL NAME" />
              </div>
              <div>
                <label className={labelCls}>Card Number</label>
                <input type="text" required value={odeme.kart_no}
                  onChange={e => setOdeme(o => ({ ...o, kart_no: kartNoFormat(e.target.value) }))}
                  className={inputCls} placeholder="0000 0000 0000 0000" maxLength={19} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Expiry Date</label>
                  <input type="text" required value={odeme.son_tarih}
                    onChange={e => setOdeme(o => ({ ...o, son_tarih: sonTarihFormat(e.target.value) }))}
                    className={inputCls} placeholder="MM/YY" maxLength={5} />
                </div>
                <div>
                  <label className={labelCls}>CVV</label>
                  <input type="text" required value={odeme.cvv}
                    onChange={e => setOdeme(o => ({ ...o, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                    className={inputCls} placeholder="000" maxLength={3} />
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {hata && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                {hata}
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setAdim(3)}
                className="flex-1 border border-blue-200 text-blue-600 font-semibold py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-sm">
                Back
              </button>
              <button type="submit" disabled={yukleniyor}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
                {yukleniyor ? 'Processing...' : `Pay $${seciliPlan?.fiyat}`}
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
              <Shield size={12} /><span>256-bit SSL secure payment</span>
            </div>
          </div>
        </form>

        {/* Sipariş özeti */}
        <div className="md:col-span-2">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <h4 className="font-bold text-gray-900 text-sm mb-4">Order Summary</h4>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{seciliPlan?.ad}</span>
                <span className="font-semibold text-gray-900">${seciliPlan?.fiyat}</span>
              </div>
              {seciliPlan?.id === 'yillik' && (
                <div className="flex justify-between text-blue-600 text-xs">
                  <span>Annual discount (33%)</span>
                  <span>-$39.89</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500">
                <span>Verified phone</span>
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle size={11} /> {telefonGirdi}
                </span>
              </div>
            </div>
            <div className="border-t border-blue-200 pt-3 flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span>${seciliPlan?.fiyat}</span>
            </div>
            <ul className="mt-5 space-y-1.5">
              {seciliPlan?.ozellikler.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <Check size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />{o}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
