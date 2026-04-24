import { useState, useEffect } from 'react'
import {
  CheckCircle, User, Phone, MapPin, Briefcase, FileText,
  CreditCard, Shield, Star, Check, Eye, EyeOff, Lock,
  Wrench, Building2, Gift
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { kategorileriGetir, sehirleriGetir, ustaKayit } from '../api'

const PLANLAR = [
  {
    id: 'aylik',
    ad: 'Aylık Plan',
    fiyat: '9.99',
    birim: '/ ay',
    aciklama: 'Esnek aylık üyelik, istediğin zaman iptal et',
    ozellikler: ['Profil sayfası', 'Müşteri talepleri al', 'Kategori listesi', 'E-posta desteği'],
    rozet: null,
  },
  {
    id: 'yillik',
    ad: 'Yıllık Plan',
    fiyat: '99',
    birim: '/ yıl',
    ayBirim: '7.61',
    tasarruf: '30.87',
    aciklama: '13 ay kapsar — 1 ay ücretsiz hediye',
    ozellikler: ['Profil sayfası', 'Müşteri talepleri al', 'Öne çıkan listeleme', '7/24 öncelikli destek'],
    rozet: 'En Popüler',
  },
]

const inputCls = "w-full border border-blue-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block"

export default function UstaKayit() {
  const navigate = useNavigate()

  const [adim, setAdim] = useState(1)
  const [secilenPlan, setSecilenPlan] = useState('yillik')
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
    sifre: '', sifre_tekrar: '',
  })
  const [sifreGoster, setSifreGoster] = useState(false)
  const [sifreHata, setSifreHata] = useState('')

  const [odeme, setOdeme] = useState({ kart_ad: '', kart_no: '', son_tarih: '', cvv: '' })

  useEffect(() => {
    kategorileriGetir().then(r => setKategoriler(r.data.kategoriler || []))
    sehirleriGetir().then(r => setSehirler(r.data.sehirler || []))
  }, [])

  const sehirDegisti = (sehir_id) => {
    setForm(f => ({ ...f, sehir_id, ilce_id: '' }))
    const s = sehirler.find(s => s.id === parseInt(sehir_id))
    setIlceler(s?.ilceler || [])
  }

  const formGonder = (e) => {
    e.preventDefault()
    if (form.sifre.length < 6) { setSifreHata('Şifre en az 6 karakter olmalıdır'); return }
    if (form.sifre !== form.sifre_tekrar) { setSifreHata('Şifreler eşleşmiyor'); return }
    setSifreHata('')
    setAdim(3)
  }

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
        plan: secilenPlan,
      })
      setBasarili(true)
      setTimeout(() => navigate('/usta/panel'), 2500)
    } catch (err) {
      setHata(err.response?.data?.hata || 'Bir hata oluştu, tekrar deneyin')
    } finally {
      setYukleniyor(false)
    }
  }

  const kartNoFormat = (val) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

  const sonTarihFormat = (val) => {
    const d = val.replace(/\D/g, '').slice(0, 4)
    return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d
  }

  const seciliPlan = PLANLAR.find(p => p.id === secilenPlan)

  if (basarili) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
        <CheckCircle size={36} className="text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Kaydınız Tamamlandı!</h2>
      <p className="text-gray-500 leading-relaxed mb-6">
        Profiliniz oluşturuldu ve kategorinize eklendi. Usta panelinize yönlendiriliyorsunuz...
      </p>
      <button onClick={() => navigate('/usta/panel')}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-colors">
        Panele Git
      </button>
    </div>
  )

  const ADIMLAR = [
    { no: 1, ad: 'Kayıt Türü' },
    { no: 2, ad: 'Bilgiler' },
    { no: 3, ad: 'Plan' },
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
            <div className={`w-5 h-0.5 ${adim > a.no ? 'bg-blue-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )

  // ─── Adım 1: Kayıt Türü ──────────────────────────────────────────────────────
  if (adim === 1) return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Usta Olarak Kaydol</h1>
        <p className="text-gray-500 text-sm mt-2">Kayıt türünüzü seçin</p>
      </div>
      <AdimGostergesi />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">

        {/* Bireysel Usta */}
        <div
          onClick={() => setAdim(2)}
          className="relative border-2 rounded-2xl p-8 cursor-pointer transition-all border-blue-200 bg-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-50 group"
        >
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
            <Wrench size={28} className="text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">Bireysel Usta</h3>
          <p className="text-sm text-gray-500 mb-5">Bireysel olarak hizmet veren ustalar için</p>
          <ul className="space-y-2 mb-5">
            {['Kişisel profil sayfası', 'Müşteri talepleri al', 'Kolay kayıt süreci'].map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <Check size={13} className="text-blue-500 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-4 border-t border-blue-100">
            <span className="text-sm font-bold text-blue-600">$9.99 / ay'dan</span>
            <span className="text-xs text-blue-400 font-medium">Seç →</span>
          </div>
        </div>

        {/* Kurumsal Şirket */}
        <div
          onClick={() => navigate('/sirket-kayit')}
          className="relative border-2 rounded-2xl p-8 cursor-pointer transition-all border-indigo-200 bg-white hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-50 group"
        >
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors">
            <Building2 size={28} className="text-indigo-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">Kurumsal Şirket</h3>
          <p className="text-sm text-gray-500 mb-5">Şirket olarak hizmet vermek isteyenler için</p>
          <ul className="space-y-2 mb-5">
            {['Şirket profil sayfası', 'Logo & fotoğraf ekle', 'Kurumsal hizmet yönetimi'].map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <Check size={13} className="text-indigo-500 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-4 border-t border-indigo-100">
            <span className="text-sm font-bold text-indigo-600">$19.99 / ay'dan</span>
            <span className="text-xs text-indigo-400 font-medium">Seç →</span>
          </div>
        </div>
      </div>

      <button onClick={() => navigate('/')}
        className="w-full border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
        ← Ana Sayfaya Dön
      </button>
    </div>
  )

  // ─── Adım 2: Bilgi Formu ──────────────────────────────────────────────────────
  if (adim === 2) return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Profil Bilgileri</h1>
        <p className="text-gray-500 text-sm mt-1">Bilgilerinizi eksiksiz doldurun</p>
      </div>
      <AdimGostergesi />

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
              <label className={labelCls}>Telefon *</label>
              <input type="tel" required value={form.telefon}
                onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                className={inputCls} placeholder="+90 548 000 0000" />
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
                <option value="">Şehir seçin</option>
                {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>İlçe</label>
              <select value={form.ilce_id}
                onChange={e => setForm(f => ({ ...f, ilce_id: e.target.value }))}
                disabled={!form.sehir_id}
                className={`${inputCls} disabled:bg-gray-50 disabled:cursor-not-allowed`}>
                <option value="">İlçe seçin</option>
                {ilceler.map(i => <option key={i.id} value={i.id}>{i.ad}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Hizmet */}
        <div className="p-6 border-b border-blue-50">
          <div className="flex items-center gap-2 mb-5">
            <Briefcase size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Hizmet Kategorisi</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Kategori *</label>
              <select required value={form.kategori_id}
                onChange={e => setForm(f => ({ ...f, kategori_id: e.target.value }))}
                className={inputCls}>
                <option value="">Kategori seçin</option>
                {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Deneyim (Yıl)</label>
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
            placeholder="Kendiniz ve sunduğunuz hizmetler hakkında kısa bir açıklama yazın..." />
        </div>

        {/* Şifre */}
        <div className="p-6 border-b border-blue-50">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Giriş Şifresi</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Şifre *</label>
              <div className="relative">
                <input type={sifreGoster ? 'text' : 'password'} required value={form.sifre}
                  onChange={e => setForm(f => ({ ...f, sifre: e.target.value }))}
                  className={inputCls} placeholder="En az 6 karakter" />
                <button type="button" onClick={() => setSifreGoster(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {sifreGoster ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Şifre Tekrar *</label>
              <input type={sifreGoster ? 'text' : 'password'} required value={form.sifre_tekrar}
                onChange={e => setForm(f => ({ ...f, sifre_tekrar: e.target.value }))}
                className={inputCls} placeholder="Şifrenizi tekrar girin" />
            </div>
          </div>
          {sifreHata && (
            <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><span>⚠</span> {sifreHata}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">Bu şifre ile usta panelinize giriş yapacaksınız.</p>
        </div>

        <div className="p-6 flex gap-3">
          <button type="button" onClick={() => setAdim(1)}
            className="flex-1 border border-blue-200 text-blue-600 font-semibold py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-sm">
            ← Geri
          </button>
          <button type="submit"
            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm">
            Plan Seçimine Geç →
          </button>
        </div>
      </form>
    </div>
  )

  // ─── Adım 3: Plan Seçimi ──────────────────────────────────────────────────────
  if (adim === 3) return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Plan Seçin</h1>
        <p className="text-gray-500 text-sm mt-2">Size en uygun planı seçin</p>
      </div>
      <AdimGostergesi />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
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
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900">{plan.ad}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{plan.aciklama}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-2 ${
                secilenPlan === plan.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
              }`}>
                {secilenPlan === plan.id && <Check size={11} className="text-white" />}
              </div>
            </div>

            <div className="mb-1">
              <span className="text-3xl font-extrabold text-gray-900">${plan.fiyat}</span>
              <span className="text-sm text-gray-500 ml-1">{plan.birim}</span>
            </div>

            {plan.id === 'yillik' && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs text-blue-600 font-semibold">Aylık ${plan.ayBirim}</span>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Gift size={9} /> 1 ay bedava
                </span>
              </div>
            )}
            {plan.id === 'aylik' && <div className="mb-4" />}

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

      <div className="flex items-center justify-center gap-2 mb-5 text-xs text-gray-400">
        <Shield size={13} /><span>256-bit SSL şifreli güvenli ödeme</span>
      </div>
      <div className="flex gap-3">
        <button onClick={() => setAdim(2)}
          className="flex-1 border border-blue-200 text-blue-600 font-semibold py-4 rounded-xl hover:bg-blue-50 transition-colors text-sm">
          ← Geri
        </button>
        <button onClick={() => setAdim(4)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-base transition-colors">
          Devam Et — ${seciliPlan?.fiyat} {seciliPlan?.birim}
        </button>
      </div>
    </div>
  )

  // ─── Adım 4: Ödeme ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Ödeme</h1>
        <p className="text-gray-500 text-sm mt-1">Güvenli ödeme ile kaydınızı tamamlayın</p>
      </div>
      <AdimGostergesi />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <form onSubmit={odemeGonder} className="md:col-span-3 bg-white border border-blue-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-blue-50">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard size={16} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Kart Bilgileri</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Kart Sahibi</label>
                <input type="text" required value={odeme.kart_ad}
                  onChange={e => setOdeme(o => ({ ...o, kart_ad: e.target.value }))}
                  className={inputCls} placeholder="AD SOYAD" />
              </div>
              <div>
                <label className={labelCls}>Kart Numarası</label>
                <input type="text" required value={odeme.kart_no}
                  onChange={e => setOdeme(o => ({ ...o, kart_no: kartNoFormat(e.target.value) }))}
                  className={inputCls} placeholder="0000 0000 0000 0000" maxLength={19} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Son Tarih</label>
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
                ← Geri
              </button>
              <button type="submit" disabled={yukleniyor}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
                {yukleniyor ? 'İşleniyor...' : `Öde $${seciliPlan?.fiyat}`}
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
              <Shield size={12} /><span>256-bit SSL şifreli güvenli ödeme</span>
            </div>
          </div>
        </form>

        {/* Sipariş Özeti */}
        <div className="md:col-span-2">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <h4 className="font-bold text-gray-900 text-sm mb-4">Sipariş Özeti</h4>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{seciliPlan?.ad}</span>
                <span className="font-semibold text-gray-900">${seciliPlan?.fiyat}</span>
              </div>
              {seciliPlan?.id === 'yillik' && (
                <>
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <Gift size={11} /><span>13 ay kapsar — 1 ay bedava</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 text-xs">
                    <span>Tasarruf</span>
                    <span>-${seciliPlan.tasarruf}</span>
                  </div>
                </>
              )}
              {form.telefon && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Telefon</span>
                  <span className="text-gray-700">{form.telefon}</span>
                </div>
              )}
            </div>
            <div className="border-t border-blue-200 pt-3 flex justify-between font-bold text-gray-900">
              <span>Toplam</span>
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
