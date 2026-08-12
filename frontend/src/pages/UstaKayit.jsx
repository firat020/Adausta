import { useState, useEffect } from 'react'
import {
  CheckCircle, User, Phone, MapPin, Briefcase, FileText,
  CreditCard, Shield, Star, Check, Eye, EyeOff, Lock,
  Wrench, Building2, Gift, Store
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { kategorileriGetir, sehirleriGetir, ustaKayit, planlariGetir, cardplusBaslat } from '../api'
import API from '../config.js'

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

const inputCls = "w-full border-2 border-gray-400 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
const labelCls = "text-sm font-bold text-gray-800 mb-1.5 block"

function CokluKategoriSecici({ kategoriler, secilenler, onChange }) {
  const [arama, setArama] = useState('')
  const [acik, setAcik] = useState(false)
  const secilenSet = new Set(secilenler)
  const filtreli = kategoriler.filter(k =>
    k.ad.toLowerCase().includes(arama.toLowerCase()) && !secilenSet.has(String(k.id))
  )
  const secilenObjeler = secilenler
    .map(id => kategoriler.find(k => String(k.id) === id))
    .filter(Boolean)

  const ekle = (id) => { onChange([...secilenler, String(id)]); setArama('') }
  const kaldir = (id) => onChange(secilenler.filter(s => s !== String(id)))

  return (
    <div className="relative">
      <div
        onClick={() => setAcik(true)}
        className={`${inputCls} min-h-[44px] flex flex-wrap gap-1.5 items-center cursor-pointer`}
        style={{ userSelect: 'none' }}
      >
        {secilenObjeler.length === 0 && (
          <span className="text-gray-400 text-sm">Kategori seçin (birden fazla seçebilirsiniz)</span>
        )}
        {secilenObjeler.map((k, idx) => (
          <span key={k.id} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${
            idx === 0 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
          }`}>
            {idx === 0 && <span className="opacity-70 text-[10px]">Ana·</span>}
            {k.ad}
            <button type="button"
              onClick={e => { e.stopPropagation(); kaldir(String(k.id)) }}
              className="ml-0.5 hover:opacity-70 text-sm leading-none">×</button>
          </span>
        ))}
        {secilenler.length > 0 && (
          <span className="ml-auto text-gray-400 text-xs">▼</span>
        )}
      </div>
      {acik && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg overflow-hidden">
          <input autoFocus type="text" value={arama}
            onChange={e => setArama(e.target.value)}
            placeholder="Kategori ara..."
            className="w-full px-3 py-2 text-sm border-b border-gray-100 outline-none focus:bg-blue-50"
          />
          <div className="max-h-48 overflow-y-auto">
            {filtreli.length === 0 && (
              <p className="text-xs text-gray-400 px-3 py-2">Sonuç bulunamadı</p>
            )}
            {filtreli.map(k => (
              <div key={k.id} onClick={() => ekle(String(k.id))}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors text-gray-800">
                {k.ad}
              </div>
            ))}
          </div>
          {secilenler.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-400">
              İlk seçilen = Ana kategori · Diğerleri ek kategori
            </div>
          )}
        </div>
      )}
      {acik && (
        <div className="fixed inset-0 z-40" onClick={() => { setAcik(false); setArama('') }} />
      )}
    </div>
  )
}

function HavaleKopyala({ metin }) {
  const [kopyalandi, setKopyalandi] = useState(false)
  return (
    <button type="button" onClick={() => {
      navigator.clipboard.writeText(metin)
      setKopyalandi(true)
      setTimeout(() => setKopyalandi(false), 2000)
    }} className="text-xs border px-2 py-0.5 rounded ml-1 border-blue-300 text-blue-600 hover:border-blue-500 flex-shrink-0">
      {kopyalandi ? 'Kopyalandı' : 'Kopyala'}
    </button>
  )
}

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

  const [secilenKategoriler, setSecilenKategoriler] = useState([])
  const [form, setForm] = useState({
    ad: '', soyad: '', telefon: '', whatsapp: '',
    email: '', sehir_id: '', ilce_id: '',
    aciklama: '', deneyim_yil: '',
    sifre: '', sifre_tekrar: '',
  })
  const [sifreGoster, setSifreGoster] = useState(false)
  const [sifreHata, setSifreHata] = useState('')

  const [odemeYontemi, setOdemeYontemi] = useState('havale')
  const [havale, setHavale] = useState({ ad: '', email: '', referans: '' })
  const [havaleGonderildi, setHavaleGonderildi] = useState(false)
  const [kur, setKur] = useState(null) // USD→TRY
  const [planlarDB, setPlanlarDB] = useState([]) // gerçek plan id'leri (backend)
  const [otomatikYenileme, setOtomatikYenileme] = useState(false) // "kartımı kaydet, otomatik yenilensin" — açık rıza gerektiği için varsayılan kapalı

  useEffect(() => {
    kategorileriGetir().then(r => setKategoriler(r.data.kategoriler || []))
    sehirleriGetir().then(r => setSehirler(r.data.sehirler || []))
    fetch(`${API}/api/odeme/kur`).then(r => r.json()).then(d => setKur(d.USD_TRY)).catch(() => {})
    planlariGetir().then(r => setPlanlarDB(r.data.planlar || [])).catch(() => {})
  }, [])

  const tlGoster = (usd) => {
    if (!kur) return ''
    const tl = (parseFloat(usd) * kur).toLocaleString('tr-TR', { maximumFractionDigits: 0 })
    return `≈ ₺${tl}`
  }

  const sehirDegisti = (sehir_id) => {
    setForm(f => ({ ...f, sehir_id, ilce_id: '' }))
    const s = sehirler.find(s => s.id === parseInt(sehir_id))
    setIlceler(s?.ilceler || [])
  }

  const formGonder = (e) => {
    e.preventDefault()
    if (secilenKategoriler.length === 0) { setSifreHata('En az bir kategori seçmelisiniz'); return }
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
      const kayitResp = await ustaKayit({
        ...form,
        sehir_id: parseInt(form.sehir_id),
        ilce_id: form.ilce_id ? parseInt(form.ilce_id) : null,
        kategori_id: parseInt(secilenKategoriler[0]),
        ek_kategori_ids: secilenKategoriler.slice(1).map(Number),
        deneyim_yil: parseInt(form.deneyim_yil) || 0,
        plan: secilenPlan,
      })
      const ustaId = kayitResp?.data?.usta_id
      await fetch('/api/odeme/havale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usta_id: ustaId,
          ad_soyad: havale.ad || form.ad + ' ' + form.soyad,
          email: havale.email || form.email,
          tutar: seciliPlan?.fiyat,
          referans_no: havale.referans,
        }),
      })
      setHavaleGonderildi(true)
      _gtagKayitDonusumu()
      setBasarili(true)
      setTimeout(() => navigate('/usta/panel'), 3000)
    } catch (err) {
      setHata(err.response?.data?.hata || 'Bir hata oluştu, tekrar deneyin')
    } finally {
      setYukleniyor(false)
    }
  }

  const _gtagKayitDonusumu = () => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        send_to: 'AW-18139050345/3g4tCJaFu6gcEOnir8lD',
        value: 1.0,
        currency: 'USD',
      })
    }
  }

  // Kredi kartı ile öde — CardPlus 3D_PAY_HOSTING: kart bilgisi bizde toplanmaz,
  // kullanıcı doğrudan bankanın kart giriş sayfasına yönlendirilir.
  const kartOdemeBaslat = async () => {
    setHata('')
    setYukleniyor(true)
    try {
      const kayitResp = await ustaKayit({
        ...form,
        sehir_id: parseInt(form.sehir_id),
        ilce_id: form.ilce_id ? parseInt(form.ilce_id) : null,
        kategori_id: parseInt(secilenKategoriler[0]),
        ek_kategori_ids: secilenKategoriler.slice(1).map(Number),
        deneyim_yil: parseInt(form.deneyim_yil) || 0,
        plan: secilenPlan,
      })
      const ustaId = kayitResp?.data?.usta_id
      const planDb = planlarDB.find(p => p.sure_tip === secilenPlan)
      if (!planDb) {
        setHata('Plan bilgisi yüklenemedi, lütfen sayfayı yenileyip tekrar deneyin.')
        setYukleniyor(false)
        return
      }

      const { data } = await cardplusBaslat({ usta_id: ustaId, plan_id: planDb.id, otomatik_yenileme: otomatikYenileme })

      _gtagKayitDonusumu()

      // Kullanıcıyı bankanın 3D Secure sayfasına yönlendiren otomatik-submit
      // form HTML'i, sayfanın tamamının yerine geçecek şekilde yazdırılır.
      document.open()
      document.write(data.form_html)
      document.close()
    } catch (err) {
      setHata(err.response?.data?.hata || 'Bir hata oluştu, tekrar deneyin')
      setYukleniyor(false)
    }
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
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Kayıt Olun</h1>
        <p className="text-gray-500 text-sm mt-2">Hesap türünüzü seçin ve başlayın</p>
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

        {/* Üye Ol */}
        <div
          onClick={() => navigate('/giris')}
          className="relative border-2 rounded-2xl p-8 cursor-pointer transition-all border-green-200 bg-white hover:border-green-500 hover:shadow-lg hover:shadow-green-50 group"
        >
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-green-100 transition-colors">
            <User size={28} className="text-green-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">Üye Ol</h3>
          <p className="text-sm text-gray-500 mb-5">Usta bulmak için ücretsiz hesap oluşturun</p>
          <ul className="space-y-2 mb-4">
            {['Usta ara ve bul', 'Hizmet talebi oluştur', 'Ücretsiz kullanım'].map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <Check size={13} className="text-green-500 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-gray-50">
              <svg width="12" height="12" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-gray-50">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </span>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-green-100">
            <span className="text-sm font-bold text-green-600">Ücretsiz</span>
            <span className="text-xs text-green-400 font-medium">Seç →</span>
          </div>
        </div>

        {/* Mağaza Kayıt */}
        <div
          onClick={() => navigate('/satici-basvuru')}
          className="relative border-2 rounded-2xl p-8 cursor-pointer transition-all border-purple-200 bg-white hover:border-purple-500 hover:shadow-lg hover:shadow-purple-50 group"
        >
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-purple-100 transition-colors">
            <Store size={28} className="text-purple-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">Mağaza Kayıt</h3>
          <p className="text-sm text-gray-500 mb-5">Mağazanızı Ada Usta'ya açın ve ürünlerinizi listeleyin</p>
          <ul className="space-y-2 mb-5">
            {['Ürün listesi oluştur', 'Sipariş yönetimi', 'Mağaza profili'].map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <Check size={13} className="text-purple-500 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-4 border-t border-purple-100">
            <span className="text-sm font-bold text-purple-600">Mağaza Kur</span>
            <span className="text-xs text-purple-400 font-medium">Seç →</span>
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
              <label className={labelCls}>Kategori * <span className="font-normal text-gray-400">(birden fazla seçebilirsiniz)</span></label>
              <CokluKategoriSecici
                kategoriler={kategoriler}
                secilenler={secilenKategoriler}
                onChange={setSecilenKategoriler}
              />
              {secilenKategoriler.length === 0 && (
                <input type="text" required className="sr-only" tabIndex={-1} readOnly value="" aria-hidden />
              )}
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
            {kur && (
              <p className="text-sm font-semibold text-orange-600 mb-1">{tlGoster(plan.fiyat)}</p>
            )}

            {plan.id === 'yillik' && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs text-blue-600 font-semibold">Aylık ${plan.ayBirim} {kur ? `(${tlGoster(plan.ayBirim)})` : ''}</span>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  1 ay bedava
                </span>
              </div>
            )}
            {plan.id === 'aylik' && <div className="mb-3" />}

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
          Devam Et — ${seciliPlan?.fiyat} {seciliPlan?.birim} {kur ? tlGoster(seciliPlan?.fiyat) : ''}
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
        <div className="md:col-span-3 space-y-4">

          {/* Sekme seçici */}
          <div className="flex gap-2">
            <button type="button" onClick={() => setOdemeYontemi('havale')}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm border transition-colors
                ${odemeYontemi === 'havale' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}>
              Havale / EFT
            </button>
            <button type="button" onClick={() => setOdemeYontemi('kart')}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm border transition-colors relative
                ${odemeYontemi === 'kart' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}>
              Kredi Kartı
            </button>
          </div>

          {/* Havale paneli */}
          {odemeYontemi === 'havale' && (
            <form onSubmit={odemeGonder} className="bg-white border border-blue-100 shadow-sm rounded-2xl overflow-hidden">
              {/* Banka bilgileri */}
              <div className="bg-gray-900 px-5 py-3">
                <p className="text-white font-bold text-sm">Garanti BBVA — Havale Bilgileri</p>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { etiket: 'Hesap Adı', deger: 'Adissa Enterprises Ltd.' },
                  { etiket: 'Banka',     deger: 'Garanti BBVA — Girne Şubesi' },
                  { etiket: 'Şube',      deger: '1288' },
                  { etiket: 'Hesap No',  deger: '6295117' },
                ].map(r => (
                  <div key={r.etiket} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-xs text-gray-500 w-24">{r.etiket}</span>
                    <span className="text-sm font-semibold text-gray-900">{r.deger}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-5 py-2.5 bg-blue-50">
                  <span className="text-xs text-gray-500 w-24">IBAN</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-blue-700 font-mono">TR05 0006 2001 2880 0006 2951 17</span>
                    <HavaleKopyala metin="TR05 0006 2001 2880 0006 2951 17" />
                  </div>
                </div>
              </div>

              {/* Uyarı */}
              <div className="mx-5 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                <p className="font-semibold mb-1">Dikkat</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Açıklama kısmına adınızı yazın.</li>
                  <li>Havale sonrası bildirim gönderin — hesabınız 1–4 saat içinde aktifleştirilir.</li>
                </ul>
              </div>

              {/* Bildirim alanları */}
              <div className="p-5 space-y-3">
                <p className="text-sm font-semibold text-gray-800">Havale Bilgilerini Girin</p>
                <div>
                  <label className={labelCls}>Dekont / Referans No <span className="text-gray-400 normal-case font-normal">(opsiyonel)</span></label>
                  <input type="text" value={havale.referans}
                    onChange={e => setHavale(h => ({ ...h, referans: e.target.value }))}
                    className={inputCls} placeholder="Banka dekont numarası" />
                </div>

                {hata && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">{hata}</div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setAdim(3)}
                    className="flex-1 border border-blue-200 text-blue-600 font-semibold py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-sm">
                    ← Geri
                  </button>
                  <button type="submit" disabled={yukleniyor}
                    className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
                    {yukleniyor ? 'Kaydediliyor...' : 'Kaydı Tamamla — Havale Yapacağım'}
                  </button>
                </div>
                <p className="text-center text-xs text-gray-400">256-bit SSL şifreli güvenli bağlantı</p>
              </div>
            </form>
          )}

          {/* Kredi kartı — CardPlus 3D Secure */}
          {odemeYontemi === 'kart' && (
            <div className="bg-white border border-blue-100 shadow-sm rounded-2xl p-8 text-center">
              <p className="text-lg font-bold text-gray-900 mb-2">Kredi Kartı ile Ödeme</p>
              <p className="text-gray-500 text-sm mb-5">
                Kart bilgileriniz bizim sunucularımıza değil, doğrudan bankanın güvenli
                3D Secure sayfasına girilir.
              </p>

              {hata && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 text-left">{hata}</div>
              )}

              <label className="flex items-start gap-2.5 text-left bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3 mb-5 cursor-pointer">
                <input type="checkbox" checked={otomatikYenileme}
                  onChange={(e) => setOtomatikYenileme(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-600 flex-shrink-0" />
                <span className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-semibold text-gray-800">Kartımı kaydet, {secilenPlan === 'yillik' ? 'her yıl' : 'her ay'} otomatik yenilensin.</span>
                  {' '}Dönem sonunda kartınızdan otomatik tahsilat yapılır, 3D Secure'a tekrar girmenize gerek kalmaz.
                  İstediğiniz zaman panelinizden kapatabilirsiniz.
                </span>
              </label>

              <div className="flex gap-3">
                <button type="button" onClick={() => setAdim(3)} disabled={yukleniyor}
                  className="flex-1 border border-blue-200 text-blue-600 font-semibold py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-sm disabled:opacity-60">
                  ← Geri
                </button>
                <button type="button" onClick={kartOdemeBaslat} disabled={yukleniyor}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
                  {yukleniyor ? 'Yönlendiriliyor...' : `Kredi Kartı ile Öde — $${seciliPlan?.fiyat}`}
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">256-bit SSL şifreli güvenli bağlantı</p>
            </div>
          )}

        </div>

        {/* Sipariş Özeti */}
        <div className="md:col-span-2">
          <div className="bg-white border-2 border-blue-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Başlık */}
            <div className="bg-blue-600 px-5 py-3">
              <p className="text-white font-bold text-sm">Sipariş Özeti</p>
            </div>

            {/* Plan detayı */}
            <div className="px-5 pt-4 pb-3 space-y-2.5 text-sm border-b border-gray-100">
              <div className="flex justify-between items-start">
                <span className="text-gray-700 font-semibold">{seciliPlan?.ad}</span>
                <div className="text-right">
                  <span className="font-bold text-gray-900">${seciliPlan?.fiyat}</span>
                  {kur && <p className="text-orange-600 text-xs font-semibold">{tlGoster(seciliPlan?.fiyat)}</p>}
                </div>
              </div>
              {seciliPlan?.id === 'yillik' && (
                <>
                  <div className="text-xs text-orange-600 font-medium">
                    13 ay kapsar — 1 ay bedava
                  </div>
                  <div className="flex justify-between text-emerald-600 text-xs font-semibold">
                    <span>Tasarruf</span>
                    <span>-${seciliPlan.tasarruf} {kur ? `(${tlGoster(seciliPlan.tasarruf)})` : ''}</span>
                  </div>
                </>
              )}
              {form.telefon && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Telefon</span>
                  <span className="font-medium text-gray-700">{form.telefon}</span>
                </div>
              )}
            </div>

            {/* Toplam */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm">Toplam</span>
                <div className="text-right">
                  <span className="font-extrabold text-blue-700 text-lg">${seciliPlan?.fiyat}</span>
                  {kur && (
                    <p className="text-orange-600 text-sm font-bold">
                      {tlGoster(seciliPlan?.fiyat)}
                    </p>
                  )}
                </div>
              </div>
              {kur && (
                <p className="text-xs text-gray-400 mt-1 text-right">
                  1 USD = ₺{kur?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (günlük kur)
                </p>
              )}
            </div>

            {/* Özellikler */}
            <div className="px-5 py-4">
              <p className="text-xs font-bold text-gray-500 mb-2">PLAN KAPSAMI</p>
              <ul className="space-y-2">
                {seciliPlan?.ozellikler.map((o, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">✓</span>
                    {o}
                  </li>
                ))}
              </ul>
            </div>

            {/* SSL güvence */}
            <div className="px-5 pb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 font-semibold text-center">
                256-bit SSL ile güvenli ödeme
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
