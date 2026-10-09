import API from '../config.js'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { MapPin, Phone, MessageCircle, Star, Clock, ArrowLeft, Image, FileText, CheckCircle2, X, Calendar, User, ShieldCheck, KeyRound, Heart, Share2, Globe, Wallet, Wrench, BadgeCheck, GraduationCap, ChevronLeft, ChevronRight, ExternalLink, Languages } from 'lucide-react'
import { DILLER, ODEME_YONTEMLERI, GUNLER } from '../data/profilSecenekleri.js'
import { useTranslation } from 'react-i18next'
import { KAT_EN, KAT_RU } from '../locales/katAdlari'
import { ustaDetay, yorumEkle, benimBilgilerim, isTalebiGonder, ustaSahiplenKodGonder, ustaSahiplenDogrula } from '../api'
import SEO from '../components/SEO'
import { ustaSlugUrl } from '../data/hizmetler.js'


const LABELS = {
  tr: {
    hakkinda: 'Hakkında', hizmetler: 'Hizmetler', vitrin: 'Vitrin', yorumlar: 'Yorumlar', bolge: 'Hizmet Bölgesi', bilgiler: 'İşletme Bilgileri',
    kimdir: 'kimdir?', aciklamaYok: 'Usta henüz bir tanıtım yazısı eklemedi.', anaUzmanlik: 'Ana uzmanlık', ekHizmet: 'Ek hizmet', uzmanlik: 'Uzmanlık', fiyatYok: 'Fiyat için teklif alın',
    fiyatNotu: 'Fiyat için “Hemen Teklif Al” ile iş detayını gönderin; usta size özel fiyat verir.',
    onayli: 'Onaylı', belgeli: 'Belgeli', yeni: 'Yeni', oneCikan: 'Öne Çıkan', uyeSince: 'yılından beri üye', simdiAcik: 'Şu an açık', simdiKapali: 'Şu an kapalı',
    webSitesi: 'Web Sitesi', paylas: 'Paylaş', kopyalandi: 'Kopyalandı!', favori: 'Favori', favoride: 'Favoride',
    haritadaAc: 'Haritada aç', saatler: 'Çalışma Saatleri', yediYirmiDort: '7/24 hizmet veriyor', kapali: 'Kapalı',
    belirtilmedi: 'Belirtilmedi', odeme: 'Ödeme Yöntemleri', diller: 'Konuşulan Diller', ara: 'Ara',
  },
  en: {
    hakkinda: 'About', hizmetler: 'Services', vitrin: 'Gallery', yorumlar: 'Reviews', bolge: 'Service Area', bilgiler: 'Business Info',
    kimdir: '— who we are', aciklamaYok: 'This professional has not added a description yet.', anaUzmanlik: 'Main expertise', ekHizmet: 'Additional service', uzmanlik: 'Specialty', fiyatYok: 'Get a quote for pricing',
    fiyatNotu: 'For a price, send your job details with “Get a Quote”; the professional will quote you.',
    onayli: 'Verified', belgeli: 'Certified', yeni: 'New', oneCikan: 'Featured', uyeSince: 'member since', simdiAcik: 'Open now', simdiKapali: 'Closed now',
    webSitesi: 'Website', paylas: 'Share', kopyalandi: 'Copied!', favori: 'Favourite', favoride: 'Saved',
    haritadaAc: 'Open in map', saatler: 'Opening Hours', yediYirmiDort: 'Available 24/7', kapali: 'Closed',
    belirtilmedi: 'Not specified', odeme: 'Payment Methods', diller: 'Languages Spoken', ara: 'Call',
  },
}

export default function UstaDetay() {
  const { id } = useParams()
  // URL /usta/123 ya da SEO'lu /usta/123-ahmet-elektrikci-lefkosa olabilir —
  // her iki durumda da baştaki sayı gerçek usta ID'si.
  const numericId = parseInt(id, 10)
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const [usta, setUsta] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kullanici, setKullanici] = useState(null)
  const [yorumForm, setYorumForm] = useState({ musteri_adi: '', puan: 5, yorum: '' })
  const [yorumGonderildi, setYorumGonderildi] = useState(false)
  const [teklifModal, setTeklifModal] = useState(false)
  const [teklifGonderildi, setTeklifGonderildi] = useState(false)
  const [teklifYukleniyor, setTeklifYukleniyor] = useState(false)
  const [teklifHata, setTeklifHata] = useState('')
  const [teklifForm, setTeklifForm] = useState({
    musteri_ad: '', musteri_telefon: '', musteri_adres: '',
    baslik: '', aciklama: '', tercih_tarih: ''
  })
  const [sahiplenModal, setSahiplenModal] = useState(false)
  const [sahiplenAdim, setSahiplenAdim] = useState(1)
  const [sahiplenTelefon, setSahiplenTelefon] = useState('')
  const [sahiplenKod, setSahiplenKod] = useState('')
  const [sahiplenEmail, setSahiplenEmail] = useState('')
  const [sahiplenSifre, setSahiplenSifre] = useState('')
  const [sahiplenYukleniyor, setSahiplenYukleniyor] = useState(false)
  const [sahiplenHata, setSahiplenHata] = useState('')
  const [sahiplenBasarili, setSahiplenBasarili] = useState(false)

  // Zengin profil: galeri, favori ve paylaş durumu
  const [lightbox, setLightbox] = useState(null)
  const [favori, setFavori] = useState(false)
  const [linkKopyalandi, setLinkKopyalandi] = useState(false)
  const FAVORI_ANAHTAR = 'adausta_favori_ustalar'
  const L = LABELS[i18n.language === 'en' ? 'en' : 'tr']

  useEffect(() => {
    try {
      const liste = JSON.parse(localStorage.getItem(FAVORI_ANAHTAR) || '[]')
      setFavori(liste.includes(numericId))
    } catch { setFavori(false) }
  }, [numericId])

  useEffect(() => {
    if (lightbox === null) return
    const tus = (e) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox(i => (usta?.fotograflar?.length ? (i + 1) % usta.fotograflar.length : null))
      if (e.key === 'ArrowLeft') setLightbox(i => (usta?.fotograflar?.length ? (i - 1 + usta.fotograflar.length) % usta.fotograflar.length : null))
    }
    window.addEventListener('keydown', tus)
    return () => window.removeEventListener('keydown', tus)
  }, [lightbox, usta])

  const favoriToggle = () => {
    try {
      const liste = JSON.parse(localStorage.getItem(FAVORI_ANAHTAR) || '[]')
      const yeni = liste.includes(numericId) ? liste.filter(x => x !== numericId) : [...liste, numericId]
      localStorage.setItem(FAVORI_ANAHTAR, JSON.stringify(yeni))
      setFavori(yeni.includes(numericId))
      if (!liste.includes(numericId)) logIletisim('favori')
    } catch { /* localStorage kapalıysa sessizce geç */ }
  }

  const paylas = async () => {
    const url = window.location.href
    logIletisim('paylas')
    try {
      if (navigator.share) {
        await navigator.share({ title: usta?.ad_soyad, text: `${usta?.ad_soyad} — ${usta?.kategori}`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setLinkKopyalandi(true)
        setTimeout(() => setLinkKopyalandi(false), 2000)
      }
    } catch { /* kullanıcı paylaşımı iptal etti */ }
  }

  const logIletisim = (tur) => {
    axios.post(`${API}/api/analitik/iletisim`, { usta_id: numericId, tur }, { withCredentials: false })
      .catch(() => {})
  }

  useEffect(() => {
    ustaDetay(numericId)
      .then(r => {
        setUsta(r.data)
        logIletisim('goruntule')
        // Eski /usta/123 (veya yanlış/eski slug) ile açılmışsa, adres çubuğunu
        // sessizce güncel SEO'lu URL'ye çevir (Google'a tek doğru URL sinyali).
        const dogruYol = ustaSlugUrl(r.data)
        if (location.pathname !== dogruYol) {
          navigate(dogruYol + location.search, { replace: true })
        }
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false))
    benimBilgilerim().then(r => setKullanici(r.data.kullanici)).catch(() => {})
  }, [numericId])

  // Ustanın paylaştığı yorum bağlantısı (?yorum=1): yorum formuna kaydır
  useEffect(() => {
    if (!usta || !new URLSearchParams(location.search).has('yorum')) return
    const t = setTimeout(() => document.getElementById('profil-yorum-formu')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400)
    return () => clearTimeout(t)
  }, [usta, location.search])

  const teklifAlTikla = () => {
    logIletisim('teklif')
    setTeklifModal(true)
  }

  const teklifGonder = async (e) => {
    e.preventDefault()
    setTeklifHata('')
    setTeklifYukleniyor(true)
    try {
      await isTalebiGonder(numericId, teklifForm)
      setTeklifGonderildi(true)
    } catch (err) {
      setTeklifHata(err.response?.data?.hata || 'Talep gönderilemedi. Tekrar deneyin.')
    } finally {
      setTeklifYukleniyor(false)
    }
  }

  const teklifKapat = () => {
    setTeklifModal(false)
    setTeklifGonderildi(false)
    setTeklifHata('')
    setTeklifForm({ musteri_ad: '', musteri_telefon: '', musteri_adres: '', baslik: '', aciklama: '', tercih_tarih: '' })
  }

  const yorumGonder = async (e) => {
    e.preventDefault()
    try {
      await yorumEkle(numericId, yorumForm)
      setYorumGonderildi(true)
    } catch {}
  }

  const sahiplenKapat = () => {
    setSahiplenModal(false)
    setSahiplenAdim(1)
    setSahiplenTelefon('')
    setSahiplenKod('')
    setSahiplenEmail('')
    setSahiplenSifre('')
    setSahiplenHata('')
    setSahiplenBasarili(false)
  }

  const sahiplenKodGonder = async (e) => {
    e.preventDefault()
    setSahiplenHata('')
    setSahiplenYukleniyor(true)
    try {
      await ustaSahiplenKodGonder(numericId, sahiplenTelefon)
      setSahiplenAdim(2)
    } catch (err) {
      setSahiplenHata(err.response?.data?.hata || 'Kod gönderilemedi. Tekrar deneyin.')
    } finally {
      setSahiplenYukleniyor(false)
    }
  }

  const sahiplenTamamla = async (e) => {
    e.preventDefault()
    setSahiplenHata('')
    setSahiplenYukleniyor(true)
    try {
      await ustaSahiplenDogrula(numericId, { kod: sahiplenKod, email: sahiplenEmail, sifre: sahiplenSifre })
      setSahiplenBasarili(true)
      setUsta(u => u ? { ...u, uye_mi: true } : u)
    } catch (err) {
      setSahiplenHata(err.response?.data?.hata || 'Doğrulama başarısız. Tekrar deneyin.')
    } finally {
      setSahiplenYukleniyor(false)
    }
  }

  const Yildizlar = ({ puan, tikla = null, boyut = 16 }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={boyut}
          onClick={() => tikla?.(i + 1)}
          className={`${tikla ? 'cursor-pointer' : ''} transition-colors ${
            i < Math.round(puan) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
          }`} />
      ))}
    </div>
  )

  if (yukleniyor) return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="h-48 bg-gray-100 rounded-2xl animate-pulse mb-4" />
      <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  )

  if (!usta) return (
    <div className="text-center py-24 text-gray-400">{t('ustaDetay.ustaBulunamadi')}</div>
  )

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: usta.ad_soyad,
    description: usta.aciklama || `${usta.kategori} ustası — KKTC`,
    telephone: usta.telefon,
    knowsAbout: usta.kategori,
    areaServed: usta.sehir || 'Kuzey Kıbrıs',
    address: {
      '@type': 'PostalAddress',
      addressLocality: usta.sehir || 'Kuzey Kıbrıs',
      addressRegion: usta.ilce || '',
      addressCountry: 'CY',
    },
    ...((usta.kapak_url || usta.logo_url) && { image: `${API}${usta.kapak_url || usta.logo_url}` }),
    ...(usta.web_sitesi && { url: usta.web_sitesi }),
    ...(usta.diller?.length > 0 && { knowsLanguage: usta.diller }),
    ...(usta.odeme_yontemleri?.length > 0 && { paymentAccepted: usta.odeme_yontemleri.join(', ') }),
    ...(usta.lat && usta.lng && { geo: { '@type': 'GeoCoordinates', latitude: usta.lat, longitude: usta.lng } }),
    ...(usta.yedi_yirmi_dort && { openingHours: 'Mo-Su 00:00-23:59' }),
    ...(usta.yorum_sayisi > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(usta.puan || usta.ortalama_puan || 5),
        reviewCount: String(usta.yorum_sayisi),
      },
    }),
  }

  // ── Zengin profil için türetilmiş değerler ─────────────────────────────
  const en = i18n.language === 'en'
  const katAd = (ad) => i18n.language === 'en' ? (KAT_EN[ad] || ad) : i18n.language === 'ru' ? (KAT_RU[ad] || ad) : ad
  const diller = (usta.diller || []).map(k => DILLER.find(d => d.kod === k)).filter(Boolean)
  const odemeler = (usta.odeme_yontemleri || []).map(k => ODEME_YONTEMLERI.find(o => o.kod === k)).filter(Boolean)
  const saatler = usta.calisma_saatleri || {}
  const saatVar = usta.yedi_yirmi_dort || Object.keys(saatler).length > 0
  const bugunKod = String((new Date().getDay() + 6) % 7) // JS: 0=Pazar → bizde 6
  const simdiAcik = (() => {
    if (usta.yedi_yirmi_dort) return true
    const g = saatler[bugunKod]
    if (!g || g.kapali || !g.bas || !g.bit) return false
    const d = new Date()
    const dk = d.getHours() * 60 + d.getMinutes()
    const [bh, bm] = g.bas.split(':').map(Number)
    const [eh, em] = g.bit.split(':').map(Number)
    return dk >= bh * 60 + bm && dk < eh * 60 + em
  })()
  const yeniUsta = usta.olusturma && (Date.now() - new Date(usta.olusturma).getTime()) < 30 * 24 * 3600 * 1000
  const uyelikYil = usta.olusturma ? new Date(usta.olusturma).getFullYear() : null
  const yorumlar = usta.yorumlar || []
  const dagilim = [5, 4, 3, 2, 1].map(p => ({ puan: p, adet: yorumlar.filter(y => y.puan === p).length }))
  const kategoriler = usta.tum_kategoriler?.length ? usta.tum_kategoriler : [{ id: usta.kategori_id, ad: usta.kategori, ikon: usta.kategori_ikon }]
  const haritaUrl = (usta.lat && usta.lng)
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${usta.lng - 0.03}%2C${usta.lat - 0.02}%2C${usta.lng + 0.03}%2C${usta.lat + 0.02}&layer=mapnik&marker=${usta.lat}%2C${usta.lng}`
    : null
  const git = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const sekmeler = [
    ['profil-hakkinda', L.hakkinda],
    ['profil-hizmetler', L.hizmetler],
    ...(usta.fotograflar?.length ? [['profil-vitrin', L.vitrin]] : []),
    ['profil-yorumlar', L.yorumlar],
    ['profil-bolge', L.bolge],
    ['profil-bilgiler', L.bilgiler],
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28 sm:pb-10">
      <SEO
        baslik={`${usta.ad_soyad} — ${usta.kategori} Ustası KKTC`}
        aciklama={`${usta.ad_soyad}, Kuzey Kıbrıs'ta ${usta.kategori} ustası. ${usta.sehir ? `${usta.sehir}'da` : 'KKTC\'de'} hizmet vermektedir. Puan: ${usta.ortalama_puan || 5}/5.`}
        anahtar={`${usta.kategori} KKTC, ${usta.kategori} ustası, ${usta.sehir || 'Kuzey Kıbrıs'} ${usta.kategori}`}
        url={ustaSlugUrl(usta)}
        schema={schema}
      />
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-4 transition-colors">
        <ArrowLeft size={16} /> {t('ustaDetay.geri')}
      </button>

      {/* Profil sahiplenme daveti */}
      {usta.uye_mi === false && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-5">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Bu profil {usta.ad_soyad} misiniz?</p>
              <p className="text-xs text-gray-500 mt-0.5">Telefon numaranızı doğrulayarak bu profili sahiplenin, kendi panelinizden yönetin.</p>
            </div>
          </div>
          <button onClick={() => setSahiplenModal(true)}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap">
            Profili Sahiplen
          </button>
        </div>
      )}

      {/* ── Kahraman kart: kapak + logo + kimlik + iletişim ── */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden mb-4">
        <div className="relative h-36 sm:h-52 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400">
          {usta.kapak_url && (
            <img src={`${API}${usta.kapak_url}`} alt={`${usta.ad_soyad} kapak`} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        </div>

        <div className="px-5 sm:px-8 pb-6">
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">
            {/* Logo + kimlik */}
            <div className="flex-1 min-w-0">
              <div className="relative z-10 -mt-12 sm:-mt-14 flex items-end gap-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-4xl flex-shrink-0 overflow-hidden ring-4 ring-white shadow-md">
                  {usta.logo_url ? (
                    <img src={`${API}${usta.logo_url}`} alt={usta.ad_soyad} className="w-full h-full object-cover" />
                  ) : (
                    usta.ad.charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{usta.ad_soyad}</h1>
                {usta.onaylanmis && (
                  <span title={L.onayli} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-full">
                    <BadgeCheck size={14} /> {L.onayli}
                  </span>
                )}
                {usta.onayli_belge && (
                  <span title={L.belgeli} className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded-full">
                    <GraduationCap size={14} /> {L.belgeli}
                  </span>
                )}
                {usta.one_cikan && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-1 rounded-full">
                    <Star size={12} className="fill-violet-500 text-violet-500" /> {L.oneCikan}
                  </span>
                )}
                {usta.yedi_yirmi_dort && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">7/24</span>
                )}
                {yeniUsta && (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">{L.yeni}</span>
                )}
              </div>

              <span className="inline-block mt-2 text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                {katAd(usta.kategori)}
              </span>

              <div className="flex items-center gap-2 mt-3">
                <Yildizlar puan={usta.puan} />
                <span className="text-sm text-gray-500">
                  {usta.puan > 0 ? usta.puan.toFixed(1) : t('ustaDetay.yorumYok')} · {usta.yorum_sayisi} {t('ustaDetay.yorum')}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-orange-500" />{usta.ilce ? `${usta.ilce}, ` : ''}{usta.sehir}</span>
                {usta.deneyim_yil > 0 && (
                  <span className="flex items-center gap-1.5"><Clock size={14} className="text-orange-500" />{usta.deneyim_yil} {t('ustaDetay.yilDeneyim')}</span>
                )}
                {uyelikYil && (
                  <span className="flex items-center gap-1.5"><Calendar size={14} className="text-orange-500" />{uyelikYil} {L.uyeSince}</span>
                )}
                {saatVar && (
                  <span className={`flex items-center gap-1.5 font-semibold ${simdiAcik ? 'text-emerald-600' : 'text-gray-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${simdiAcik ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {simdiAcik ? L.simdiAcik : L.simdiKapali}
                  </span>
                )}
              </div>

              {diller.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Languages size={14} className="text-gray-400" />
                  {diller.map(d => (
                    <span key={d.kod} className="text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                      {d.bayrak} {en ? d.ad_en : d.ad}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* İletişim */}
            <div className="flex flex-col gap-2.5 w-full lg:w-64 lg:pt-5 flex-shrink-0">
              <button
                onClick={teklifAlTikla}
                className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3 rounded-xl transition-colors shadow-sm">
                <FileText size={16} />
                {t('common.hemenTeklif')}
              </button>
              <a href={`tel:${usta.telefon}`}
                onClick={() => logIletisim('ara')}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                <Phone size={16} />
                {usta.telefon}
              </a>
              {usta.whatsapp && (
                <a href={`https://wa.me/${usta.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                  onClick={() => logIletisim('whatsapp')}
                  className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              )}
              {usta.web_sitesi && (
                <a href={usta.web_sitesi} target="_blank" rel="noopener noreferrer nofollow"
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
                  <Globe size={15} /> {L.webSitesi} <ExternalLink size={12} className="text-gray-400" />
                </a>
              )}
              <div className="flex gap-2">
                <button onClick={paylas}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold py-2 rounded-xl transition-colors">
                  <Share2 size={14} /> {linkKopyalandi ? L.kopyalandi : L.paylas}
                </button>
                <button onClick={favoriToggle} aria-pressed={favori}
                  className={`flex-1 flex items-center justify-center gap-1.5 border text-sm font-semibold py-2 rounded-xl transition-colors ${favori ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                  <Heart size={14} className={favori ? 'fill-rose-500' : ''} /> {favori ? L.favoride : L.favori}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bölüm sekmeleri */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-gray-50/90 backdrop-blur border-b border-gray-100 mb-5 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {sekmeler.map(([id, ad]) => (
            <button key={id} onClick={() => git(id)}
              className="px-3.5 py-1.5 text-sm font-semibold text-gray-600 hover:text-orange-600 hover:bg-white rounded-lg transition-colors whitespace-nowrap">
              {ad}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Sol / ana sütun */}
        <div className="lg:col-span-2 space-y-5">
          {/* Hakkında */}
          <section id="profil-hakkinda" className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 scroll-mt-16">
            <h2 className="font-bold text-gray-900 mb-3">{usta.ad_soyad} {L.kimdir}</h2>
            {usta.aciklama ? (
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{usta.aciklama}</p>
            ) : (
              <p className="text-gray-400 text-sm italic">{L.aciklamaYok}</p>
            )}
          </section>

          {/* Hizmetler */}
          <section id="profil-hizmetler" className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 scroll-mt-16">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench size={18} className="text-gray-400" /> {L.hizmetler}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {kategoriler.map((k, idx) => (
                <div key={k.id ?? idx} className="flex items-start gap-3 border border-gray-100 rounded-xl px-4 py-3 bg-gray-50/60">
                  <span className="text-xl mt-0.5">{k.ikon || '🔧'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <span className="truncate">{katAd(k.ad)}</span>
                      {k.uzmanlik && <Star size={13} className="text-amber-400 fill-amber-400 flex-shrink-0" title={L.uzmanlik} />}
                    </p>
                    <p className={`text-xs mt-0.5 ${k.fiyat ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>{k.fiyat || L.fiyatYok}</p>
                    {(k.uzmanlik || k.yedi_yirmi_dort) && (
                      <div className="flex gap-1.5 mt-1.5">
                        {k.uzmanlik && <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">{L.uzmanlik}</span>}
                        {k.yedi_yirmi_dort && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">7/24</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">{L.fiyatNotu}</p>
          </section>

          {/* Vitrin */}
          {usta.fotograflar?.length > 0 && (
            <section id="profil-vitrin" className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 scroll-mt-16">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Image size={18} className="text-gray-400" />
                {t('ustaDetay.isFotograflari')}
                <span className="text-sm font-normal text-gray-400">({usta.fotograflar.length})</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {usta.fotograflar.map((f, idx) => (
                  <button key={f.id} type="button" onClick={() => setLightbox(idx)} className="group block overflow-hidden rounded-xl border border-gray-100">
                    <img src={`${API}${f.url}`}
                      alt={`Adausta - ${usta.sehir || 'KKTC'} ${usta.kategori} ${usta.ad_soyad}`}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Yorumlar */}
          <section id="profil-yorumlar" className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 scroll-mt-16">
            <h2 className="font-bold text-gray-900 mb-5">
              {t('ustaDetay.musteriYorumlari')}
              {yorumlar.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">({yorumlar.length})</span>
              )}
            </h2>
            {yorumlar.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b border-gray-100">
                <div className="text-center sm:w-36 flex-shrink-0">
                  <div className="text-5xl font-extrabold text-gray-900">{usta.puan > 0 ? usta.puan.toFixed(1) : '–'}</div>
                  <div className="flex justify-center mt-1"><Yildizlar puan={usta.puan} boyut={14} /></div>
                  <div className="text-xs text-gray-400 mt-1">{yorumlar.length} {t('ustaDetay.yorum')}</div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {dagilim.map(d => (
                    <div key={d.puan} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-3">{d.puan}</span>
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${yorumlar.length ? (d.adet / yorumlar.length) * 100 : 0}%` }} />
                      </div>
                      <span className="w-6 text-right">{d.adet}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!yorumlar.length ? (
              <p className="text-gray-400 text-sm py-4 text-center">{t('ustaDetay.henuzYorum')}</p>
            ) : (
              <div className="space-y-5">
                {yorumlar.map(y => (
                  <div key={y.id} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 text-sm">{y.musteri_adi}</span>
                      <span className="text-gray-400 text-xs">{y.tarih}</span>
                    </div>
                    <Yildizlar puan={y.puan} boyut={13} />
                    {y.yorum && <p className="text-gray-600 text-sm mt-2 leading-relaxed">{y.yorum}</p>}
                    {y.cevap && (
                      <div className="mt-3 ml-4 pl-3 border-l-2 border-blue-200 bg-blue-50/60 rounded-r-lg py-2 pr-3">
                        <p className="text-xs font-semibold text-blue-700">{usta.ad_soyad} yanıtladı</p>
                        <p className="text-gray-600 text-sm mt-1 leading-relaxed">{y.cevap}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Yorum formu */}
          <div id="profil-yorum-formu" className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 scroll-mt-20">
            <h2 className="font-bold text-gray-900 mb-5">{t('ustaDetay.yorumYap')}</h2>
            {yorumGonderildi ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star size={24} className="text-emerald-500" />
                </div>
                <p className="font-semibold text-emerald-700">{t('ustaDetay.yorumAlindi')}</p>
              </div>
            ) : (
              <form onSubmit={yorumGonder} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('ustaDetay.adinizSoyadiniz')}</label>
                  <input type="text" required value={yorumForm.musteri_adi}
                    onChange={e => setYorumForm(f => ({ ...f, musteri_adi: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder={t('ustaDetay.adinizSoyadiniz')} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('ustaDetay.puaniniz')}</label>
                  <Yildizlar puan={yorumForm.puan} tikla={(p) => setYorumForm(f => ({ ...f, puan: p }))} boyut={28} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('ustaDetay.yorumunuz')}</label>
                  <textarea value={yorumForm.yorum}
                    onChange={e => setYorumForm(f => ({ ...f, yorum: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    rows={3} placeholder={t('ustaDetay.deneyimPaylas')} />
                </div>
                <button type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm">
                  {t('ustaDetay.yorumGonder')}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Sağ / yan sütun */}
        <aside className="space-y-5">
          {/* Hizmet bölgesi */}
          <section id="profil-bolge" className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 scroll-mt-16">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><MapPin size={18} className="text-gray-400" /> {L.bolge}</h2>
            {haritaUrl ? (
              <div className="rounded-xl overflow-hidden border border-gray-100 mb-3">
                <iframe title={`${usta.ad_soyad} harita`} src={haritaUrl} loading="lazy" className="w-full h-48 border-0" />
              </div>
            ) : null}
            <p className="text-sm text-gray-700 flex items-center gap-1.5">
              <MapPin size={13} className="text-orange-500" />{usta.ilce ? `${usta.ilce}, ` : ''}{usta.sehir || 'Kuzey Kıbrıs'}
            </p>
            {haritaUrl && (
              <a href={`https://www.openstreetmap.org/?mlat=${usta.lat}&mlon=${usta.lng}#map=14/${usta.lat}/${usta.lng}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-2">
                {L.haritadaAc} <ExternalLink size={11} />
              </a>
            )}
          </section>

          {/* İşletme bilgileri */}
          <section id="profil-bilgiler" className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 scroll-mt-16">
            <h2 className="font-bold text-gray-900 mb-4">{L.bilgiler}</h2>

            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Clock size={12} /> {L.saatler}</p>
              {usta.yedi_yirmi_dort ? (
                <p className="text-sm font-semibold text-emerald-600">{L.yediYirmiDort}</p>
              ) : Object.keys(saatler).length > 0 ? (
                <ul className="text-sm space-y-1">
                  {GUNLER.map(g => {
                    const s = saatler[g.kod]
                    const bugun = g.kod === bugunKod
                    return (
                      <li key={g.kod} className={`flex justify-between ${bugun ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                        <span>{en ? g.ad_en : g.ad}</span>
                        <span>{!s || s.kapali ? L.kapali : `${s.bas} – ${s.bit}`}</span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">{L.belirtilmedi}</p>
              )}
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Wallet size={12} /> {L.odeme}</p>
              {odemeler.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {odemeler.map(o => (
                    <span key={o.kod} className="text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">{en ? o.ad_en : o.ad}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">{L.belirtilmedi}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Languages size={12} /> {L.diller}</p>
              {diller.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {diller.map(d => (
                    <span key={d.kod} className="text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">{d.bayrak} {en ? d.ad_en : d.ad}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">{L.belirtilmedi}</p>
              )}
            </div>
          </section>
        </aside>
      </div>

      {/* Fotoğraf büyütme (lightbox) */}
      {lightbox !== null && usta.fotograflar?.[lightbox] && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white" aria-label="Kapat" onClick={() => setLightbox(null)}>
            <X size={22} />
          </button>
          {usta.fotograflar.length > 1 && (
            <>
              <button className="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white" aria-label="Önceki"
                onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + usta.fotograflar.length) % usta.fotograflar.length) }}>
                <ChevronLeft size={24} />
              </button>
              <button className="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white" aria-label="Sonraki"
                onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % usta.fotograflar.length) }}>
                <ChevronRight size={24} />
              </button>
            </>
          )}
          <img src={`${API}${usta.fotograflar[lightbox].url}`} alt={`${usta.ad_soyad} ${lightbox + 1}`}
            className="max-h-[85vh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          <span className="absolute bottom-4 text-white/80 text-sm">{lightbox + 1} / {usta.fotograflar.length}</span>
        </div>
      )}

      {/* Mobil sabit iletişim çubuğu */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-3 py-2.5 flex gap-2">
        <button onClick={teklifAlTikla} className="flex-1 flex items-center justify-center gap-1.5 bg-yellow-400 text-gray-900 font-bold py-2.5 rounded-xl text-sm">
          <FileText size={15} /> {t('common.hemenTeklif')}
        </button>
        <a href={`tel:${usta.telefon}`} onClick={() => logIletisim('ara')} aria-label={L.ara}
          className="w-12 flex items-center justify-center bg-orange-500 text-white rounded-xl"><Phone size={18} /></a>
        {usta.whatsapp && (
          <a href={`https://wa.me/${usta.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" onClick={() => logIletisim('whatsapp')} aria-label="WhatsApp"
            className="w-12 flex items-center justify-center bg-emerald-500 text-white rounded-xl"><MessageCircle size={18} /></a>
        )}
      </div>

      {/* İş Talebi / Teklif Modal */}
      {teklifModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-t-2xl">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">İş Talebi Gönder</h3>
                <p className="text-xs text-gray-700 mt-0.5 font-medium">{usta.ad_soyad} · {usta.kategori}</p>
              </div>
              <button onClick={teklifKapat}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/50 transition">
                <X size={18} className="text-gray-800" />
              </button>
            </div>

            <div className="p-6">
              {teklifGonderildi ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-200">
                    <CheckCircle2 size={30} className="text-emerald-500" />
                  </div>
                  <p className="font-extrabold text-gray-900 text-lg mb-2">Talebiniz İletildi!</p>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-700">{usta.ad_soyad}</span> en kısa sürede sizinle iletişime geçecektir.
                  </p>
                  <button onClick={teklifKapat}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-3 rounded-xl text-sm transition">
                    Tamam
                  </button>
                </div>
              ) : (
                <form onSubmit={teklifGonder} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Adınız Soyadınız *</label>
                      <div className="relative">
                        <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={teklifForm.musteri_ad}
                          onChange={e => setTeklifForm(f => ({ ...f, musteri_ad: e.target.value }))}
                          required placeholder="Adınız"
                          className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Telefon *</label>
                      <div className="relative">
                        <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={teklifForm.musteri_telefon}
                          onChange={e => setTeklifForm(f => ({ ...f, musteri_telefon: e.target.value }))}
                          required placeholder="+90 548 000 0000"
                          className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">İş Konusu / Başlık *</label>
                    <input value={teklifForm.baslik}
                      onChange={e => setTeklifForm(f => ({ ...f, baslik: e.target.value }))}
                      required placeholder={`Örn: Elektrik arızası, Su tesisatı tamiri...`}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Adres</label>
                    <div className="relative">
                      <MapPin size={13} className="absolute left-3 top-3 text-gray-400" />
                      <input value={teklifForm.musteri_adres}
                        onChange={e => setTeklifForm(f => ({ ...f, musteri_adres: e.target.value }))}
                        placeholder="Mahalle, Sokak, Ev No..."
                        className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-400" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Açıklama</label>
                    <textarea value={teklifForm.aciklama}
                      onChange={e => setTeklifForm(f => ({ ...f, aciklama: e.target.value }))}
                      placeholder="Sorunuzu veya ihtiyacınızı detaylıca anlatın..."
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                      <Calendar size={12} /> Tercih Ettiğiniz Tarih/Saat
                    </label>
                    <input value={teklifForm.tercih_tarih}
                      onChange={e => setTeklifForm(f => ({ ...f, tercih_tarih: e.target.value }))}
                      placeholder="Örn: Yarın öğleden sonra, 20 Nisan sabahı..."
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>

                  {teklifHata && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                      {teklifHata}
                    </div>
                  )}

                  <button type="submit" disabled={teklifYukleniyor}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-200 text-gray-900 font-extrabold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2">
                    {teklifYukleniyor ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700" /> Gönderiliyor...</>
                    ) : (
                      <><FileText size={16} /> Talebi Gönder</>
                    )}
                  </button>
                  <p className="text-xs text-center text-gray-400">Giriş yapmadan da talep gönderebilirsiniz</p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profil Sahiplenme Modal */}
      {sahiplenModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl">
              <div>
                <h3 className="font-extrabold text-white text-base">Profili Sahiplen</h3>
                <p className="text-xs text-blue-100 mt-0.5 font-medium">{usta.ad_soyad} · {usta.kategori}</p>
              </div>
              <button onClick={sahiplenKapat}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition">
                <X size={18} className="text-white" />
              </button>
            </div>

            <div className="p-6">
              {sahiplenBasarili ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-200">
                    <CheckCircle2 size={30} className="text-emerald-500" />
                  </div>
                  <p className="font-extrabold text-gray-900 text-lg mb-2">Profil Sahiplenildi!</p>
                  <p className="text-sm text-gray-500">Hesabınız oluşturuldu, artık giriş yapıp panelinizi yönetebilirsiniz.</p>
                  <button onClick={() => navigate('/usta/panel')}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-3 rounded-xl text-sm transition">
                    Panelime Git
                  </button>
                </div>
              ) : sahiplenAdim === 1 ? (
                <form onSubmit={sahiplenKodGonder} className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Doğrulama kodu profildeki kayıtlı telefon numarasına gönderilecektir.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Telefon Numaranız *</label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={sahiplenTelefon}
                        onChange={e => setSahiplenTelefon(e.target.value)}
                        required placeholder={usta.telefon}
                        className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                  {sahiplenHata && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                      {sahiplenHata}
                    </div>
                  )}
                  <button type="submit" disabled={sahiplenYukleniyor}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-extrabold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2">
                    {sahiplenYukleniyor ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Gönderiliyor...</>
                    ) : (
                      <><ShieldCheck size={16} /> Doğrulama Kodu Gönder</>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={sahiplenTamamla} className="space-y-4">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-700">{usta.telefon}</span> numarasına gönderilen kodu ve yeni hesap bilgilerinizi girin.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Doğrulama Kodu *</label>
                    <div className="relative">
                      <KeyRound size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={sahiplenKod}
                        onChange={e => setSahiplenKod(e.target.value)}
                        required placeholder="6 haneli kod"
                        className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">E-posta *</label>
                    <input type="email" value={sahiplenEmail}
                      onChange={e => setSahiplenEmail(e.target.value)}
                      required placeholder="ornek@email.com"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Şifre Belirle *</label>
                    <input type="password" value={sahiplenSifre}
                      onChange={e => setSahiplenSifre(e.target.value)}
                      required minLength={8} placeholder="En az 8 karakter"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  {sahiplenHata && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                      {sahiplenHata}
                    </div>
                  )}
                  <button type="submit" disabled={sahiplenYukleniyor}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-extrabold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2">
                    {sahiplenYukleniyor ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Doğrulanıyor...</>
                    ) : (
                      <><CheckCircle2 size={16} /> Hesabımı Oluştur</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
