import { useState, useEffect } from 'react'
import {
  CheckCircle, Building2, Phone, MapPin, Briefcase, FileText,
  CreditCard, Shield, Star, Check, Eye, EyeOff, Lock, Globe,
  UploadCloud, Image as ImageIcon, X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { kategorileriGetir, sehirleriGetir, sirketKayit } from '../api'

const PLANLAR = [
  {
    id: 'aylik',
    ad: 'Aylık Plan',
    fiyat: '19.99',
    birim: '/ ay',
    aciklama: 'Esnek aylık üyelik, istediğin zaman iptal et',
    ozellikler: ['Şirket profil sayfası', 'Müşteri talepleri al', 'Kategori listesi', 'E-posta desteği'],
    rozet: null,
  },
  {
    id: 'yillik',
    ad: 'Yıllık Plan',
    fiyat: '159.99',
    birim: '/ yıl',
    ayBirim: '12.30',
    aciklama: 'En çok tercih edilen — %33 tasarruf',
    ozellikler: ['Şirket profil sayfası', 'Müşteri talepleri al', 'Öne çıkan listeleme', '7/24 öncelikli destek'],
    rozet: 'En Popüler',
  },
]

const inputCls = "w-full border-2 border-gray-400 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
const labelCls = "text-sm font-bold text-gray-800 mb-1.5 block"

export default function SirketKayit() {
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
    sirket_adi: '', vergi_no: '', yetkili_ad: '',
    telefon: '', email: '', whatsapp: '',
    sehir_id: '', ilce_id: '',
    kategori_id: '', adres: '', aciklama: '', website: '',
    sifre: '', sifre_tekrar: '',
  })
  const [sifreGoster, setSifreGoster] = useState(false)
  const [sifreHata, setSifreHata] = useState('')

  const [logoFile, setLogoFile] = useState(null)
  const [logoOnizleme, setLogoOnizleme] = useState(null)

  const [fotoFiles, setFotoFiles] = useState([])
  const [fotoOnizlemeler, setFotoOnizlemeler] = useState([])

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

  const logoSec = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoOnizleme(URL.createObjectURL(file))
  }

  const fotolarSec = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setFotoFiles(prev => [...prev, ...files])
    setFotoOnizlemeler(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  const fotoKaldir = (idx) => {
    setFotoFiles(prev => prev.filter((_, i) => i !== idx))
    setFotoOnizlemeler(prev => prev.filter((_, i) => i !== idx))
  }

  const formGonder = (e) => {
    e.preventDefault()
    if (form.sifre.length < 6) { setSifreHata('Şifre en az 6 karakter olmalıdır'); return }
    if (form.sifre !== form.sifre_tekrar) { setSifreHata('Şifreler eşleşmiyor'); return }
    setSifreHata('')
    setAdim(2)
  }

  const odemeGonder = async (e) => {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)
    try {
      await sirketKayit({
        ...form,
        sehir_id: parseInt(form.sehir_id),
        ilce_id: form.ilce_id ? parseInt(form.ilce_id) : null,
        kategori_id: parseInt(form.kategori_id),
        plan: secilenPlan,
      })
      setBasarili(true)
      setTimeout(() => navigate('/sirket/panel'), 2500)
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
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
        <CheckCircle size={36} className="text-indigo-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Şirket Kaydınız Tamamlandı!</h2>
      <p className="text-gray-500 leading-relaxed mb-6">
        Şirket profiliniz oluşturuldu. Şirket panelinize yönlendiriliyorsunuz...
      </p>
      <button onClick={() => navigate('/sirket/panel')}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition-colors">
        Panele Git
      </button>
    </div>
  )

  const ADIMLAR = [
    { no: 1, ad: 'Şirket Bilgileri' },
    { no: 2, ad: 'Plan' },
    { no: 3, ad: 'Ödeme' },
  ]

  const AdimGostergesi = () => (
    <div className="flex items-center justify-center gap-0 mb-8">
      {ADIMLAR.map((a, i) => (
        <div key={a.no} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            adim === a.no ? 'bg-indigo-600 text-white' :
            adim > a.no  ? 'bg-indigo-100 text-indigo-700' :
                           'bg-gray-100 text-gray-400'
          }`}>
            {adim > a.no ? <Check size={12} /> : <span>{a.no}</span>}
            {a.ad}
          </div>
          {i < ADIMLAR.length - 1 && (
            <div className={`w-6 h-0.5 ${adim > a.no ? 'bg-indigo-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )

  // ─── Adım 2: Plan ────────────────────────────────────────────────────────────
  if (adim === 2) return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Plan Seçin</h1>
        <p className="text-gray-500 text-sm mt-2">Şirketinize en uygun planı seçin</p>
      </div>
      <AdimGostergesi />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        {PLANLAR.map(plan => (
          <div key={plan.id}
            onClick={() => setSecilenPlan(plan.id)}
            className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all ${
              secilenPlan === plan.id
                ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100'
                : 'border-gray-200 bg-white hover:border-indigo-300'
            }`}>
            {plan.rozet && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                <Star size={10} className="fill-white" /> {plan.rozet}
              </div>
            )}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900">{plan.ad}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{plan.aciklama}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-2 ${
                secilenPlan === plan.id ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
              }`}>
                {secilenPlan === plan.id && <Check size={11} className="text-white" />}
              </div>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-gray-900">${plan.fiyat}</span>
              <span className="text-sm text-gray-500 ml-1">{plan.birim}</span>
              {plan.ayBirim && (
                <div className="text-xs text-indigo-600 font-semibold mt-0.5">Aylık ${plan.ayBirim}</div>
              )}
            </div>
            <ul className="space-y-2">
              {plan.ozellikler.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />{o}
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
        <button onClick={() => setAdim(1)}
          className="flex-1 border border-indigo-200 text-indigo-600 font-semibold py-4 rounded-xl hover:bg-indigo-50 transition-colors text-sm">
          ← Geri
        </button>
        <button onClick={() => setAdim(3)}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl text-base transition-colors">
          Devam Et — ${seciliPlan?.fiyat} {seciliPlan?.birim}
        </button>
      </div>
    </div>
  )

  // ─── Adım 1: Şirket Bilgileri ─────────────────────────────────────────────────
  if (adim === 1) return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Şirket Kaydı</h1>
        <p className="text-gray-500 text-sm mt-1">Ada Usta'da şirketinizi listeleyin</p>
      </div>
      <AdimGostergesi />

      <form onSubmit={formGonder} className="bg-white border border-indigo-100 shadow-sm rounded-2xl overflow-hidden">

        {/* Şirket Bilgileri */}
        <div className="p-6 border-b border-indigo-50">
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={16} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Şirket Bilgileri</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Şirket Adı *</label>
              <input type="text" required value={form.sirket_adi}
                onChange={e => setForm(f => ({ ...f, sirket_adi: e.target.value }))}
                className={inputCls} placeholder="ABC Teknik Hizmetler Ltd." />
            </div>
            <div>
              <label className={labelCls}>Vergi No</label>
              <input type="text" value={form.vergi_no}
                onChange={e => setForm(f => ({ ...f, vergi_no: e.target.value }))}
                className={inputCls} placeholder="1234567890" />
            </div>
            <div>
              <label className={labelCls}>Yetkili Adı Soyadı *</label>
              <input type="text" required value={form.yetkili_ad}
                onChange={e => setForm(f => ({ ...f, yetkili_ad: e.target.value }))}
                className={inputCls} placeholder="Ad Soyad" />
            </div>

            {/* Logo Upload */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Şirket Logosu</label>
              <div className="flex items-center gap-4">
                {logoOnizleme ? (
                  <div className="relative">
                    <img src={logoOnizleme} alt="Logo önizleme"
                      className="w-20 h-20 object-contain border border-indigo-200 rounded-xl bg-white p-2" />
                    <button type="button"
                      onClick={() => { setLogoFile(null); setLogoOnizleme(null) }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed border-indigo-200 rounded-xl flex items-center justify-center bg-indigo-50">
                    <ImageIcon size={22} className="text-indigo-300" />
                  </div>
                )}
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                    <UploadCloud size={14} />
                    {logoOnizleme ? 'Logoyu Değiştir' : 'Logo Yükle'}
                    <input type="file" accept="image/*" className="hidden" onChange={logoSec} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1.5">PNG, JPG veya SVG — maks. 2MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* İletişim */}
        <div className="p-6 border-b border-indigo-50">
          <div className="flex items-center gap-2 mb-5">
            <Phone size={16} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900 text-sm">İletişim</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Telefon *</label>
              <input type="tel" required value={form.telefon}
                onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                className={inputCls} placeholder="+90 548 000 00 00" />
            </div>
            <div>
              <label className={labelCls}>WhatsApp</label>
              <input type="tel" value={form.whatsapp}
                onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                className={inputCls} placeholder="+90 548 000 0000" />
            </div>
            <div>
              <label className={labelCls}>E-posta *</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputCls} placeholder="info@sirketiniz.com" />
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="url" value={form.website}
                  onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  className={`${inputCls} pl-8`} placeholder="https://www.sirketiniz.com" />
              </div>
            </div>
          </div>
        </div>

        {/* Konum */}
        <div className="p-6 border-b border-indigo-50">
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={16} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Konum</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Şehir *</label>
              <select required value={form.sehir_id} onChange={e => sehirDegisti(e.target.value)} className={inputCls}>
                <option value="">Şehir seçin</option>
                {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>İlçe</label>
              <select value={form.ilce_id} onChange={e => setForm(f => ({ ...f, ilce_id: e.target.value }))}
                disabled={!form.sehir_id}
                className={`${inputCls} disabled:bg-gray-50 disabled:cursor-not-allowed`}>
                <option value="">İlçe seçin</option>
                {ilceler.map(i => <option key={i.id} value={i.id}>{i.ad}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Adres</label>
              <input type="text" value={form.adres}
                onChange={e => setForm(f => ({ ...f, adres: e.target.value }))}
                className={inputCls} placeholder="Sokak, mahalle, bina no..." />
            </div>
          </div>
        </div>

        {/* Hizmet Kategorisi */}
        <div className="p-6 border-b border-indigo-50">
          <div className="flex items-center gap-2 mb-5">
            <Briefcase size={16} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Hizmet Kategorisi</h3>
          </div>
          <div>
            <label className={labelCls}>Kategori *</label>
            <select required value={form.kategori_id}
              onChange={e => setForm(f => ({ ...f, kategori_id: e.target.value }))}
              className={inputCls}>
              <option value="">Kategori seçin</option>
              {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ikon} {k.ad}</option>)}
            </select>
          </div>
        </div>

        {/* Hakkında */}
        <div className="p-6 border-b border-indigo-50">
          <div className="flex items-center gap-2 mb-5">
            <FileText size={16} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Şirket Hakkında</h3>
          </div>
          <textarea value={form.aciklama}
            onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
            rows={4} className={`${inputCls} resize-none`}
            placeholder="Şirketiniz, sunduğunuz hizmetler ve uzmanlık alanlarınız hakkında kısa bir açıklama yazın..." />
        </div>

        {/* Hizmet Fotoğrafları */}
        <div className="p-6 border-b border-indigo-50">
          <div className="flex items-center gap-2 mb-5">
            <ImageIcon size={16} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Hizmet Fotoğrafları</h3>
          </div>
          <label className="cursor-pointer flex items-center justify-center gap-3 border-2 border-dashed border-indigo-200 rounded-xl p-5 hover:border-indigo-400 hover:bg-indigo-50 transition-all">
            <UploadCloud size={20} className="text-indigo-400" />
            <div className="text-center">
              <p className="text-sm font-semibold text-indigo-600">Fotoğraf Ekle</p>
              <p className="text-xs text-gray-400 mt-0.5">Birden fazla fotoğraf seçebilirsiniz</p>
            </div>
            <input type="file" accept="image/*" multiple className="hidden" onChange={fotolarSec} />
          </label>
          {fotoOnizlemeler.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
              {fotoOnizlemeler.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt={`Fotoğraf ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-xl border border-indigo-100" />
                  <button type="button"
                    onClick={() => fotoKaldir(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">{fotoOnizlemeler.length} fotoğraf seçildi</p>
        </div>

        {/* Şifre */}
        <div className="p-6 border-b border-indigo-50">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={16} className="text-indigo-600" />
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
                  {sifreGoster ? <Eye size={16} /> : <EyeOff size={16} />}
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
          <p className="text-xs text-gray-400 mt-2">Bu şifre ile şirket panelinize giriş yapacaksınız.</p>
        </div>

        <div className="p-6 flex gap-3">
          <button type="button" onClick={() => navigate('/usta-kayit')}
            className="flex-1 border border-indigo-200 text-indigo-600 font-semibold py-3.5 rounded-xl hover:bg-indigo-50 transition-colors text-sm">
            ← Geri
          </button>
          <button type="submit"
            className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm">
            Plan Seçimine Geç →
          </button>
        </div>
      </form>
    </div>
  )

  // ─── Adım 3: Ödeme ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Ödeme</h1>
        <p className="text-gray-500 text-sm mt-1">Güvenli ödeme ile kaydınızı tamamlayın</p>
      </div>
      <AdimGostergesi />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <form onSubmit={odemeGonder} className="md:col-span-3 bg-white border border-indigo-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-indigo-50">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard size={16} className="text-indigo-600" />
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
              <button type="button" onClick={() => setAdim(2)}
                className="flex-1 border border-indigo-200 text-indigo-600 font-semibold py-3.5 rounded-xl hover:bg-indigo-50 transition-colors text-sm">
                ← Geri
              </button>
              <button type="submit" disabled={yukleniyor}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
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
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
            <h4 className="font-bold text-gray-900 text-sm mb-4">Sipariş Özeti</h4>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{seciliPlan?.ad}</span>
                <span className="font-semibold text-gray-900">${seciliPlan?.fiyat}</span>
              </div>
              {logoOnizleme && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ImageIcon size={11} /><span>Logo yüklendi</span>
                </div>
              )}
              {fotoFiles.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ImageIcon size={11} /><span>{fotoFiles.length} hizmet fotoğrafı</span>
                </div>
              )}
              {form.telefon && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Telefon</span>
                  <span className="text-gray-700">{form.telefon}</span>
                </div>
              )}
            </div>
            <div className="border-t border-indigo-200 pt-3 flex justify-between font-bold text-gray-900">
              <span>Toplam</span>
              <span>${seciliPlan?.fiyat}</span>
            </div>
            <ul className="mt-5 space-y-1.5">
              {seciliPlan?.ozellikler.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <Check size={12} className="text-indigo-500 mt-0.5 flex-shrink-0" />{o}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
