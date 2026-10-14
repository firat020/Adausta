import { useState, useEffect } from 'react'
import {
  CheckCircle, User, Phone, MapPin, Briefcase, FileText,
  CreditCard, Shield, Star, Check, Eye, EyeOff, Lock,
  Wrench, Building2, Gift, Store, LocateFixed, ArrowRight, ArrowLeft, Info, ClipboardList
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import TelefonDogrulama from '../components/TelefonDogrulama'
import { kategorileriGetir, sehirleriGetir, ustaKayit, planlariGetir, cardplusBaslat, cardplusDenemeBaslat, telefonDogrulamaAyarlar, telefonDogrulamaDurum } from '../api'
import API from '../config.js'

const PLANLAR = [
  {
    id: 'aylik',
    ad: 'Aylık Plan',
    fiyat: '9.99',
    birim: '/ ay',
    donemMetin: 'her ay',
    aciklama: 'Esnek aylık üyelik, istediğin zaman iptal et',
    ozellikler: ['Profil sayfası', 'Müşteri talepleri al', 'Kategori listesi', 'E-posta desteği'],
    rozet: 'İlk 90 gün ücretsiz',
    deneme: true,
  },
  {
    id: '3ay',
    ad: '3 Aylık Plan',
    fiyat: '26.99',
    birim: '/ 3 ay',
    ayBirim: '9.00',
    tasarruf: '2.98',
    donemMetin: 'her 3 ayda bir',
    ayRozet: 'Tasarruf $2.98',
    ozetMetin: 'Tek seferde 3 aylık ödeme — aylığa göre tasarruf',
    aciklama: '3 aylık üyelik, aylığa göre biraz daha avantajlı',
    ozellikler: ['Profil sayfası', 'Müşteri talepleri al', 'Kategori listesi', 'E-posta desteği'],
    rozet: null,
  },
  {
    id: '6ay',
    ad: '6 Aylık Plan',
    fiyat: '47.99',
    birim: '/ 6 ay',
    ayBirim: '8.00',
    tasarruf: '11.95',
    donemMetin: 'her 6 ayda bir',
    ayRozet: 'Tasarruf $11.95',
    ozetMetin: 'Tek seferde 6 aylık ödeme — daha fazla tasarruf',
    aciklama: '6 aylık üyelik, daha uzun süre daha fazla tasarruf',
    ozellikler: ['Profil sayfası', 'Müşteri talepleri al', 'Öne çıkan listeleme', '7/24 öncelikli destek'],
    rozet: 'Tasarruflu',
  },
  {
    id: 'yillik',
    ad: 'Yıllık Plan',
    fiyat: '99',
    birim: '/ yıl',
    ayBirim: '7.61',
    tasarruf: '30.87',
    donemMetin: 'her yıl',
    ayRozet: '1 ay bedava',
    ozetMetin: '13 ay kapsar — 1 ay bedava',
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
  // Davet bağlantısıyla (?ref=KOD) gelindiyse kod oturum boyunca hatırlanır ve kayıtla birlikte gönderilir
  const [refKodu] = useState(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('ref')
      if (q) sessionStorage.setItem('adausta_ref', q.slice(0, 20))
      return (q || sessionStorage.getItem('adausta_ref') || '').slice(0, 20)
    } catch { return '' }
  })

  const [adim, setAdim] = useState(1)
  const [secilenPlan, setSecilenPlan] = useState('yillik')
  const [kategoriler, setKategoriler] = useState([])
  const [sehirler, setSehirler] = useState([])
  const [ilceler, setIlceler] = useState([])
  const [basarili, setBasarili] = useState(false)
  const [denemeAcildi, setDenemeAcildi] = useState(false) // kartsız 90 gün deneme başladı mı
  const [telefonDogrulandi, setTelefonDogrulandi] = useState(false) // yeni 4. adımda doğrulama tamamlandı mı
  const [kayitliUstaId, setKayitliUstaId] = useState(null)  // kayıt oluştuysa tekrar kayıt denenmesin (OTP adımı için)
  const [dogrulamaAdimi, setDogrulamaAdimi] = useState(false) // telefon doğrulama (Twilio Verify) adımı açık mı
  const [dogrulamaZorunlu, setDogrulamaZorunlu] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const [secilenKategoriler, setSecilenKategoriler] = useState([])
  const [form, setForm] = useState({
    ad: '', soyad: '', telefon: '', whatsapp: '',
    email: '', sehir_id: '', ilce_id: '',
    aciklama: '', deneyim_yil: '',
    sifre: '', sifre_tekrar: '',
    lat: null, lng: null,
  })
  const [konumDurumu, setKonumDurumu] = useState('') // '' | 'yukleniyor' | 'basarili' | 'hata' | 'desteklenmiyor'

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

  const konumAl = () => {
    if (!navigator.geolocation) { setKonumDurumu('desteklenmiyor'); return }
    setKonumDurumu('yukleniyor')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }))
        setKonumDurumu('basarili')
      },
      () => setKonumDurumu('hata'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
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
        referans_kodu: refKodu,
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
        referans_kodu: refKodu,
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

  // 90 gün ücretsiz deneme: kart/ödeme bilgisi alınmaz. Süre bitmeden panelden ve bildirimle
  // "kredi kartıyla ödeme yap" uyarısı gönderilir (sunucu tarafı abonelik_uyari_bildirim).
  const denemeHataIsle = (err) => {
    setHata(err.response?.data?.hata || 'Bir hata oluştu, tekrar deneyin')
    // Bu telefonla deneme daha önce alınmış: hesap oluştu ama deneme yok → ödeme sayfasına götür
    if (err.response?.data?.kod === 'deneme_kullanilmis') {
      _gtagKayitDonusumu()
      setTimeout(() => navigate('/usta/panel/abonelik'), 4000)
    }
  }

  // Hesap yoksa oluşturur (idempotent). Telefon doğrulaması oturum gerektirdiği için kod gönderilirken
  // arka planda çağrılır — kullanıcı numarayı yeniden girmez.
  const kayitOlustur = async () => {
    if (kayitliUstaId) return kayitliUstaId
    const kayitResp = await ustaKayit({
      ...form,
      sehir_id: parseInt(form.sehir_id),
      ilce_id: form.ilce_id ? parseInt(form.ilce_id) : null,
      kategori_id: parseInt(secilenKategoriler[0]),
      ek_kategori_ids: secilenKategoriler.slice(1).map(Number),
      deneyim_yil: parseInt(form.deneyim_yil) || 0,
      plan: secilenPlan,
      referans_kodu: refKodu,
    })
    const id = kayitResp?.data?.usta_id
    setKayitliUstaId(id)
    return id
  }

  const kaydiTamamla = async () => {
    setHata('')
    setYukleniyor(true)
    try {
      const id = await kayitOlustur()
      await denemeTamamla(id)
    } catch (err) {
      denemeHataIsle(err)
    } finally {
      setYukleniyor(false)
    }
  }

  const denemeTamamla = async (ustaId) => {
    await cardplusDenemeBaslat({ usta_id: ustaId })
    _gtagKayitDonusumu()
    setDenemeAcildi(true)
    setBasarili(true)
    setTimeout(() => navigate('/usta/panel'), 3000)
  }

  // 1) Kayıt oluşturulur 2) telefon doğrulama (SMS/WhatsApp) sunulur 3) doğrulanınca deneme açılır
  const denemeBaslat = async () => {
    setHata('')
    setYukleniyor(true)
    try {
      const ustaId = await kayitOlustur()
      // Doğrulama durumu her zaman backend'den alınır
      const [{ data: ayar }, { data: durum }] = await Promise.all([telefonDogrulamaAyarlar(), telefonDogrulamaDurum()])
      setDogrulamaZorunlu(!!ayar.zorunlu)
      if (ayar.yapilandirildi && !durum.dogrulandi) {
        setDogrulamaAdimi(true)
        return
      }
      await denemeTamamla(ustaId)
    } catch (err) {
      denemeHataIsle(err)
    } finally {
      setYukleniyor(false)
    }
  }

  const dogrulamaSonrasiDenemeyiBaslat = async () => {
    setHata('')
    setYukleniyor(true)
    try {
      await denemeTamamla(kayitliUstaId)
    } catch (err) {
      denemeHataIsle(err)
    } finally {
      setYukleniyor(false)
    }
  }

  const seciliPlan = PLANLAR.find(p => p.id === secilenPlan)
  const denemeUygun = !!seciliPlan?.deneme

  useEffect(() => {
    if (adim === 4 && denemeUygun) {
      telefonDogrulamaAyarlar().then(r => setDogrulamaZorunlu(!!r.data?.zorunlu)).catch(() => {})
    }
  }, [adim, denemeUygun])

  if (basarili) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
        <CheckCircle size={36} className="text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Kaydınız Tamamlandı!</h2>
      <p className="text-gray-500 leading-relaxed mb-6">
        {denemeAcildi
          ? 'Profiliniz oluşturuldu ve 90 günlük ücretsiz denemeniz başladı. Süre bitmeden size hatırlatma göndereceğiz. Ekibimiz başvurunuzu inceledikten sonra profiliniz yayına alınacak. Usta panelinize yönlendiriliyorsunuz...'
          : 'Profiliniz oluşturuldu, havale bildiriminiz alındı. Ödemeniz onaylandıktan ve ekibimiz başvurunuzu inceledikten sonra profiliniz yayına alınacak. Usta panelinize yönlendiriliyorsunuz...'}
      </p>
      <button onClick={() => navigate('/usta/panel')}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-colors">
        Panele Git
      </button>
    </div>
  )

  const ADIMLAR = [
    { no: 1, ad: 'Hesap Türü' },
    { no: 2, ad: 'Bilgiler' },
    { no: 3, ad: 'Plan' },
    { no: 4, ad: 'Tamamla' },
  ]

  const AdimGostergesi = ({ altBosluk = 'mb-10' }) => (
    <div className={`flex items-center justify-center flex-wrap gap-y-2 ${altBosluk}`}>
      {ADIMLAR.map((a, i) => (
        <div key={a.no} className="flex items-center">
          <div className="flex items-center gap-2.5">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-150 ease-out ${
              adim === a.no ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' :
              adim > a.no  ? 'bg-blue-100 text-blue-700' :
                             'bg-slate-200/70 text-slate-500'
            }`}>
              {adim > a.no ? <Check size={16} /> : a.no}
            </span>
            <span className={`text-sm hidden sm:inline ${adim === a.no ? 'font-bold text-blue-600' : adim > a.no ? 'font-semibold text-blue-700' : 'font-medium text-slate-500'}`}>
              {a.ad}
            </span>
          </div>
          {i < ADIMLAR.length - 1 && (
            <div className={`w-5 sm:w-6 h-px mx-3 sm:mx-4 ${adim > a.no ? 'bg-blue-400' : 'bg-slate-300'}`} />
          )}
        </div>
      ))}
      <p className="sm:hidden basis-full text-center text-xs font-semibold text-slate-600 mt-1">
        {adim} / {ADIMLAR.length} • {ADIMLAR[adim - 1]?.ad}
      </p>
    </div>
  )

  // ─── Adım 1: Hesap Türü ──────────────────────────────────────────────────────
  const HESAP_KARTLARI = [
    {
      key: 'usta', ad: 'Bireysel Usta', Ikon: Wrench,
      aciklama: 'Bireysel olarak hizmet veren ustalar için',
      ozellikler: ['Kişisel profil sayfası', 'Müşteri taleplerine ulaşın', 'Hizmetlerinizi tanıtın'],
      rozet: 'İlk 3 ay ücretsiz',
      kart: 'border-2 border-orange-500 shadow-[0_8px_30px_rgba(249,115,22,0.12)]',
      ikonKutu: 'bg-orange-50 text-orange-500', tik: 'text-orange-500',
      buton: 'bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-400',
      butonMetin: 'Usta Olarak Kaydol', git: () => setAdim(2),
    },
    {
      key: 'sirket', ad: 'Kurumsal Şirket', Ikon: Building2,
      aciklama: 'Şirketinizin hizmetlerini AdaUsta’da tanıtın.',
      ozellikler: ['Kurumsal profil sayfası', 'Logo ve fotoğraf ekleme', 'Kurumsal hizmet yönetimi'],
      kart: 'border border-slate-200/80 shadow-[0_4px_24px_rgba(15,30,70,0.06)]',
      ikonKutu: 'bg-blue-50 text-blue-600', tik: 'text-blue-600',
      buton: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-400',
      butonMetin: 'Şirket Olarak Kaydol', git: () => navigate('/sirket-kayit'),
    },
    {
      key: 'magaza', ad: 'Mağaza Kaydı', Ikon: Store,
      aciklama: 'Mağazanızı açın, ürünlerinizi listeleyin.',
      ozellikler: ['Ürün listesi oluşturma', 'Sipariş yönetimi', 'Mağaza profili'],
      kart: 'border border-slate-200/80 shadow-[0_4px_24px_rgba(15,30,70,0.06)]',
      ikonKutu: 'bg-indigo-50 text-indigo-600', tik: 'text-blue-600',
      buton: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-400',
      butonMetin: 'Mağaza Aç', git: () => navigate('/satici-basvuru'),
    },
  ]

  const kartFiyat = (k) => {
    if (k.key === 'usta') return (
      <div>
        <div className="flex items-baseline gap-2 text-[#0f1e46]">
          <span className="text-xl font-bold">İlk 3 ay</span>
          <span className="text-4xl font-extrabold text-orange-500 leading-none">0 USD</span>
        </div>
        <p className="text-sm text-slate-500 mt-1.5 leading-snug">Sonrasında aylık 9,99 USD’den<br />başlayan planlar.</p>
      </div>
    )
    if (k.key === 'sirket') return (
      <div className="flex items-baseline gap-1.5 text-[#0f1e46]">
        <span className="text-lg font-semibold">Aylık</span>
        <span className="text-3xl font-extrabold text-blue-700 leading-none">19,99 USD</span>
        <span className="text-lg font-semibold">’den</span>
      </div>
    )
    return <p className="text-lg font-bold text-[#0f1e46]">Mağazanızı AdaUsta’ya taşıyın</p>
  }

  if (adim === 1) return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-[calc(100vh-4rem)]">
      <div className="max-w-[1260px] mx-auto px-4 sm:px-6 pt-12 pb-14">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0f1e46]">AdaUsta’ya katılın</h1>
          <p className="text-slate-500 text-base sm:text-xl mt-3">Size uygun hesap türünü seçin, kaydınızı kolayca tamamlayın.</p>
        </div>
        <AdimGostergesi />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-7 items-stretch">
          {HESAP_KARTLARI.map(k => (
            <div key={k.key} className={`relative bg-white rounded-2xl p-7 flex flex-col ${k.kart}`}>
              {k.rozet && (
                <span className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm">
                  {k.rozet}
                </span>
              )}
              <div className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-5 ${k.ikonKutu}`}>
                <k.Ikon size={34} strokeWidth={1.8} />
              </div>
              <h2 className="text-2xl font-bold text-[#0f1e46] mb-2">{k.ad}</h2>
              <p className="text-base text-slate-500 leading-snug mb-5">{k.aciklama}</p>
              <ul className="space-y-3 mb-6">
                {k.ozellikler.map(f => (
                  <li key={f} className="flex items-center gap-3 text-[15px] text-slate-600">
                    <Check size={18} strokeWidth={2.5} className={`flex-shrink-0 ${k.tik}`} /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <div className="border-t border-slate-200 pt-5 mb-5 min-h-[88px] flex items-center">
                  {kartFiyat(k)}
                </div>
                <button type="button" onClick={k.git}
                  className={`w-full flex items-center justify-center gap-2 text-white font-bold text-base py-3.5 rounded-xl transition-all duration-150 ease-out active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${k.buton}`}>
                  {k.butonMetin} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-8 text-center">
          <Info size={16} className="flex-shrink-0" />
          İlk 3 ay ücretsiz kullanım yalnızca Bireysel Usta kaydı için geçerlidir.
        </p>

        <div className="border-t border-slate-200 pt-7 text-center">
          <button type="button" onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-all duration-150 ease-out rounded-lg px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
            <ArrowLeft size={16} /> Ana Sayfaya Dön
          </button>
        </div>
      </div>
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

          <div className="mt-4">
            <button type="button" onClick={konumAl} disabled={konumDurumu === 'yukleniyor'}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-60">
              <LocateFixed size={15} />
              {konumDurumu === 'yukleniyor' ? 'Konum alınıyor...' : form.lat ? 'Konumu Güncelle' : 'Konumumu Kullan'}
            </button>
            <p className="text-xs text-gray-400 mt-1.5">Konumunuz "En Yakın Usta" aramasında çıkmanız için kullanılır, isteğe bağlıdır.</p>
            {konumDurumu === 'basarili' && (
              <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1"><Check size={12} /> Konumunuz alındı.</p>
            )}
            {konumDurumu === 'hata' && (
              <p className="text-xs text-red-500 mt-1.5">Konum alınamadı — tarayıcı izni gerekiyor. Bu adımı atlayıp daha sonra profilinizden de ekleyebilirsiniz.</p>
            )}
            {konumDurumu === 'desteklenmiyor' && (
              <p className="text-xs text-gray-400 mt-1.5">Tarayıcınız konum özelliğini desteklemiyor.</p>
            )}
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
            <div className="sm:col-span-2">
              <label className={labelCls}>Giriş E-postası *</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputCls} placeholder="ornek@email.com" />
              <p className="text-xs text-gray-400 mt-1">Usta paneline bu e-posta ve aşağıdaki şifre ile giriş yapacaksınız.</p>
            </div>
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
          <p className="text-xs text-gray-400 mt-2">Bu e-posta ve şifre ile usta panelinize giriş yapacaksınız.</p>
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

            {plan.ayBirim ? (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs text-blue-600 font-semibold">Aylık ${plan.ayBirim} {kur ? `(${tlGoster(plan.ayBirim)})` : ''}</span>
                {plan.ayRozet && (
                  <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {plan.ayRozet}
                  </span>
                )}
              </div>
            ) : (
              <div className="mb-3" />
            )}

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
          {seciliPlan?.deneme
            ? 'Devam Et — İlk 90 Gün Ücretsiz'
            : `Devam Et — $${seciliPlan?.fiyat} ${seciliPlan?.birim} ${kur ? tlGoster(seciliPlan?.fiyat) : ''}`}
        </button>
      </div>
    </div>
  )

  // ─── Adım 4 (kartsız 90 gün deneme): Kaydı tamamla + telefon doğrulama ───────────
  if (adim === 4 && denemeUygun) {
    const fiyatTR = String(seciliPlan?.fiyat || '9.99').replace('.', ',')
    const hediyeBaslik = (
      <div>
        <h2 className="text-2xl font-extrabold text-[#0f1e46] leading-tight">İlk 90 gün ücretsiz</h2>
        <span className="inline-flex items-center gap-1.5 mt-2 bg-emerald-50 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-full">
          <CheckCircle size={16} /> Bugün ödeme yok
        </span>
      </div>
    )
    return (
      <div className="bg-gradient-to-b from-slate-50 to-white min-h-[calc(100vh-4rem)]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-14">
          <AdimGostergesi altBosluk="mb-6 sm:mb-8" />

          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0f1e46]">Kaydınızı tamamlayın</h1>
            <p className="text-slate-500 text-sm sm:text-xl mt-2 sm:mt-3">Telefonunuzu doğrulayın, ücretsiz kullanıma başlayın.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 lg:gap-6 items-start">
            {/* Sol: ücretsiz bilgi + telefon doğrulama + butonlar */}
            <div className="space-y-4 lg:space-y-0 lg:bg-white lg:border lg:border-slate-200/80 lg:rounded-2xl lg:shadow-[0_4px_24px_rgba(15,30,70,0.06)] lg:p-8">
              {/* Mobil: kompakt yeşil kart */}
              <div className="lg:hidden flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <span className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0"><Gift size={26} /></span>
                <div>
                  <p className="text-xl font-extrabold text-[#0f1e46] leading-tight">İlk 90 gün ücretsiz</p>
                  <p className="text-sm font-semibold text-emerald-700 mt-0.5">Bugün ödenecek: 0 USD</p>
                </div>
              </div>

              {/* Masaüstü: ücretsiz bölümü */}
              <div className="hidden lg:flex items-start gap-5 pb-6 border-b border-slate-200">
                <span className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0"><Gift size={30} /></span>
                <div>
                  {hediyeBaslik}
                  <p className="text-slate-500 text-[15px] leading-relaxed mt-3">
                    Kart veya ödeme bilgisi gerekmez. Süre sonunda devam etmek sizin seçiminizdir. Otomatik tahsilat yapılmaz.
                  </p>
                </div>
              </div>

              {/* Telefon doğrulama */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 lg:border-0 lg:rounded-none lg:p-0 lg:pt-6">
                <TelefonDogrulama
                  telefon={form.telefon} amac="kayit" cerceve={false}
                  oturumAcik={!!kayitliUstaId}
                  onOnce={kayitOlustur}
                  onDogrulandi={() => { setTelefonDogrulandi(true); setHata('') }}
                  onAtla={dogrulamaZorunlu ? undefined : kaydiTamamla}
                  onNumaraDuzenle={() => (kayitliUstaId ? navigate('/usta/panel/profil') : setAdim(2))} />
              </div>

              {hata && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl lg:mt-5" role="alert">{hata}</div>
              )}

              {/* Butonlar */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:border-t lg:border-slate-200 lg:mt-6 lg:pt-6">
                <button type="button" onClick={() => setAdim(3)} disabled={yukleniyor || !!kayitliUstaId}
                  className="order-2 lg:order-1 flex items-center justify-center gap-2 lg:w-[150px] text-blue-600 lg:bg-white lg:border lg:border-blue-200 hover:bg-blue-50 font-semibold text-[15px] py-3 rounded-xl transition-all duration-150 ease-out disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                  <ArrowLeft size={18} /> Geri
                </button>
                <div className="order-1 lg:order-2 lg:w-[260px]">
                  <button type="button" onClick={kaydiTamamla} disabled={!telefonDogrulandi || yukleniyor}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-base py-3.5 rounded-xl transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2">
                    {yukleniyor ? 'Kaydediliyor...' : 'Kaydı tamamla'}
                  </button>
                  {!telefonDogrulandi && (
                    <p className="hidden lg:flex items-center gap-2 text-[13px] text-slate-500 mt-3">
                      <Info size={15} className="flex-shrink-0" /> Devam etmek için telefonunuzu doğrulayın.
                    </p>
                  )}
                </div>
              </div>
              <p className="lg:hidden flex items-center justify-center gap-2 text-[13px] text-slate-500 text-center pt-1">
                <Info size={15} className="flex-shrink-0" /> 90 gün sonrası: {fiyatTR} USD / ay. Otomatik tahsilat yok.
              </p>
            </div>

            {/* Sağ: kayıt özeti (yalnız masaüstü) */}
            <aside className="hidden lg:block bg-white border border-slate-200/80 rounded-2xl shadow-[0_4px_24px_rgba(15,30,70,0.06)] overflow-hidden">
              <div className="bg-blue-600 text-white flex items-center gap-3 px-6 py-4">
                <ClipboardList size={22} /> <span className="text-xl font-bold">Kayıt Özeti</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center text-[15px]">
                  <span className="text-slate-500">Seçilen plan</span>
                  <span className="font-bold text-[#0f1e46]">{seciliPlan?.ad}</span>
                </div>
                <div className="flex justify-between items-center text-[15px]">
                  <span className="text-slate-500">İlk 90 gün</span>
                  <span className="font-bold text-emerald-600">Ücretsiz</span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 rounded-xl px-4 py-3.5">
                  <span className="font-semibold text-[#0f1e46]">Bugün ödenecek</span>
                  <span className="text-xl font-extrabold text-blue-600">0 USD</span>
                </div>
                <div className="flex justify-between items-center text-[15px]">
                  <span className="text-slate-500">Sonrasında</span>
                  <span className="font-bold text-[#0f1e46]">{fiyatTR} USD / ay</span>
                </div>
                <p className="flex items-start gap-2 text-[13px] text-slate-500 leading-snug">
                  <Info size={15} className="flex-shrink-0 mt-0.5" />
                  90 gün sonunda ödeme yapılmazsa hesabınız kapatılır; kredi kartıyla ödeme yaparak yeniden açabilirsiniz.
                </p>
                <div className="border-t border-slate-200 pt-4">
                  <p className="font-bold text-[#0f1e46] mb-3">Plan kapsamı</p>
                  <ul className="space-y-2.5">
                    {(seciliPlan?.ozellikler || []).map(f => (
                      <li key={f} className="flex items-center gap-3 text-[15px] text-slate-600">
                        <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><Check size={14} strokeWidth={3} /></span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    )
  }

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

          {/* Sekme seçici (deneme planında ödeme yöntemi yok) */}
          {!denemeUygun && <div className="flex gap-2">
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
          </div>}

          {/* Kartsız 90 gün ücretsiz deneme */}
          {denemeUygun && (
            <div className="bg-white border border-blue-100 shadow-sm rounded-2xl p-8 text-center">
              <p className="text-lg font-bold text-gray-900 mb-2">İlk 90 Gün Ücretsiz Başla</p>
              <p className="text-gray-500 text-sm mb-5">Kart veya ödeme bilgisi gerekmez.</p>

              {hata && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 text-left">{hata}</div>
              )}

              <div className="flex items-start gap-2.5 text-left bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-5">
                <Gift size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-emerald-800 leading-relaxed">
                  <span className="font-semibold">Bugün hiçbir ödeme yapmazsın.</span> 90 gün boyunca ücretsiz kullanırsın.
                  Süre bitmeden önce sana hatırlatma göndeririz; devam etmek istersen kredi kartıyla
                  aylık ${seciliPlan?.fiyat} {kur ? `(${tlGoster(seciliPlan?.fiyat)})` : ''} ödeyebilirsin.
                  Ödeme yapmazsan hesabın kendiliğinden ücretsiz plana geçer, otomatik tahsilat olmaz.
                </span>
              </div>

              {dogrulamaAdimi && (
                <div className="text-left mb-5">
                  <TelefonDogrulama telefon={form.telefon} amac="kayit"
                    onDogrulandi={dogrulamaSonrasiDenemeyiBaslat}
                    onAtla={dogrulamaZorunlu ? undefined : dogrulamaSonrasiDenemeyiBaslat}
                    onNumaraDuzenle={() => navigate('/usta/panel/profil')} />
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setAdim(3)} disabled={yukleniyor || !!kayitliUstaId}
                  className="flex-1 border border-blue-200 text-blue-600 font-semibold py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-sm disabled:opacity-60">
                  ← Geri
                </button>
                <button type="button" onClick={denemeBaslat}
                  disabled={yukleniyor || dogrulamaAdimi}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
                  {yukleniyor ? 'Kaydediliyor...' : dogrulamaAdimi ? 'Önce telefonunu doğrula' : 'Kaydı Tamamla — Ücretsiz Başla'}
                </button>
              </div>
            </div>
          )}

          {/* Havale paneli */}
          {!denemeUygun && odemeYontemi === 'havale' && (
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
          {!denemeUygun && odemeYontemi === 'kart' && (
            <div className="bg-white border border-blue-100 shadow-sm rounded-2xl p-8 text-center">
              <p className="text-lg font-bold text-gray-900 mb-2">
                {denemeUygun ? 'Kartını Doğrula, Ücretsiz Başla' : 'Kredi Kartı ile Ödeme'}
              </p>
              <p className="text-gray-500 text-sm mb-5">
                Kart bilgileriniz bizim sunucularımıza değil, doğrudan bankanın güvenli
                3D Secure sayfasına girilir.
              </p>

              {hata && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 text-left">{hata}</div>
              )}

              {denemeUygun ? (
                <div className="flex items-start gap-2.5 text-left bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-5">
                  <Gift size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-emerald-800 leading-relaxed">
                    <span className="font-semibold">Bugün kartından 0 TL çekilir.</span> Kartın sadece geçerliliğini
                    doğrulamak için kullanılır (provizyon + anında iptal). 90 gün sonra kayıtlı kartından
                    aylık ${seciliPlan?.fiyat} {kur ? `(${tlGoster(seciliPlan?.fiyat)})` : ''} otomatik tahsil edilmeye
                    başlar — istediğin an panelinden iptal edebilirsin.
                  </span>
                </div>
              ) : (
                <label className="flex items-start gap-2.5 text-left bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3 mb-5 cursor-pointer">
                  <input type="checkbox" checked={otomatikYenileme}
                    onChange={(e) => setOtomatikYenileme(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-blue-600 flex-shrink-0" />
                  <span className="text-xs text-gray-600 leading-relaxed">
                    <span className="font-semibold text-gray-800">Kartımı kaydet, {seciliPlan?.donemMetin || 'her ay'} otomatik yenilensin.</span>
                    {' '}Dönem sonunda kartınızdan otomatik tahsilat yapılır, 3D Secure'a tekrar girmenize gerek kalmaz.
                    İstediğiniz zaman panelinizden kapatabilirsiniz.
                  </span>
                </label>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setAdim(3)} disabled={yukleniyor}
                  className="flex-1 border border-blue-200 text-blue-600 font-semibold py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-sm disabled:opacity-60">
                  ← Geri
                </button>
                <button type="button" onClick={denemeUygun ? denemeBaslat : kartOdemeBaslat} disabled={yukleniyor}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
                  {yukleniyor
                    ? 'Yönlendiriliyor...'
                    : denemeUygun ? 'Kartı Doğrula ve Ücretsiz Başla' : `Kredi Kartı ile Öde — $${seciliPlan?.fiyat}`}
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
              {seciliPlan?.ozetMetin && (
                <>
                  <div className="text-xs text-orange-600 font-medium">
                    {seciliPlan.ozetMetin}
                  </div>
                  {seciliPlan.tasarruf && (
                    <div className="flex justify-between text-emerald-600 text-xs font-semibold">
                      <span>Tasarruf</span>
                      <span>-${seciliPlan.tasarruf} {kur ? `(${tlGoster(seciliPlan.tasarruf)})` : ''}</span>
                    </div>
                  )}
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
                <span className="font-bold text-gray-900 text-sm">{denemeUygun ? 'Bugün Ödenecek' : 'Toplam'}</span>
                <div className="text-right">
                  <span className="font-extrabold text-blue-700 text-lg">{denemeUygun ? '$0' : `$${seciliPlan?.fiyat}`}</span>
                  {kur && !denemeUygun && (
                    <p className="text-orange-600 text-sm font-bold">
                      {tlGoster(seciliPlan?.fiyat)}
                    </p>
                  )}
                </div>
              </div>
              {denemeUygun ? (
                <p className="text-xs text-emerald-600 font-semibold mt-1 text-right">
                  90 gün sonra istersen ${seciliPlan?.fiyat}/ay ile devam edersin
                </p>
              ) : kur && (
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
