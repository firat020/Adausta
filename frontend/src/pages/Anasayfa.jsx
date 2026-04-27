import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Star, ArrowRight, Phone, MessageCircle, Zap, Droplets, Paintbrush, Sparkles, Hammer, Plus, ShieldCheck, CheckCircle2, ChevronRight, Wind, Truck, Armchair, Leaf, Wrench, Camera, Bug } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { kategorileriGetir, ustaListele, sehirleriGetir } from '../api'
import KategoriKart from '../components/KategoriKart'
import ReklamBanner from '../components/ReklamBanner'
import SEO from '../components/SEO'

const HIZLI_KATEGORILER = [
  { key: 'tadilat',   ikon: <Hammer size={15} />,      arama: 'Anahtar Teslim Tadilat' },
  { key: 'elektrik',  ikon: <Zap size={15} />,          arama: 'Elektrikçi' },
  { key: 'tesisat',   ikon: <Droplets size={15} />,     arama: 'Su Tesisatı' },
  { key: 'boya',      ikon: <Paintbrush size={15} />,   arama: 'Boya Badana' },
  { key: 'temizlik',  ikon: <Sparkles size={15} />,     arama: 'Ev Temizliği' },
  { key: 'klima',     ikon: <Wind size={15} />,          arama: 'Klima Servisi' },
  { key: 'nakliyat',  ikon: <Truck size={15} />,         arama: 'Evden Eve Nakliyat' },
  { key: 'mobilya',   ikon: <Armchair size={15} />,      arama: 'Mobilya Montaj' },
  { key: 'bahce',     ikon: <Leaf size={15} />,           arama: 'Bahçe Bakımı' },
  { key: 'tamir',     ikon: <Wrench size={15} />,         arama: 'Beyaz Eşya Servisi' },
  { key: 'fotograf',  ikon: <Camera size={15} />,         arama: 'Fotoğrafçı' },
  { key: 'ilaclama',  ikon: <Bug size={15} />,            arama: 'Böcek İlaçlama' },
]

const YORUMLAR = [
  { ad: 'Ayşe K.',    sehir: 'Girne',       puan: 5, yorum: 'Elektrikçiyi çok hızlı buldum, işini düzgün yaptı. Kesinlikle tavsiye ederim.', avatar: 'A' },
  { ad: 'Mehmet T.',  sehir: 'Lefkoşa',     puan: 5, yorum: 'Boyacı ustası harika iş çıkardı. Fiyat da uygundu, çok memnun kaldım.', avatar: 'M' },
  { ad: 'Zeynep S.',  sehir: 'Gazimağusa',  puan: 4, yorum: 'Tesisatçı aynı gün geldi, sorunu hemen çözdü. Teşekkürler AdaUsta!', avatar: 'Z' },
]

const AVATAR_RENK = ['bg-blue-600', 'bg-sky-500', 'bg-cyan-600', 'bg-indigo-600', 'bg-blue-800']

const OZELLIKLER_IKONLAR = [
  <ShieldCheck size={14} className="text-blue-400" />,
  <Zap size={14} className="text-yellow-400" />,
  <CheckCircle2 size={14} className="text-green-400" />,
]
const OZELLIKLER_KEYS = ['guvenilir', 'hizli', 'ucretsiz']

const HERO_CHIPLER = [
  { key: 'elektrik',  ikon: <Zap size={12} /> },
  { key: 'tesisat',   ikon: <Droplets size={12} /> },
  { key: 'tadilat',   ikon: <Hammer size={12} /> },
  { key: 'nakliyat',  ikon: <Truck size={12} /> },
  { key: 'temizlik',  ikon: <Sparkles size={12} /> },
  { key: 'klima',     ikon: <Wind size={12} /> },
]

export default function Anasayfa() {
  const { t } = useTranslation()
  const [kategoriler, setKategoriler] = useState([])
  const [sehirler, setSehirler]       = useState([])
  const [enIyiUstalar, setEnIyiUstalar] = useState([])
  const [arama, setArama]             = useState('')
  const [secilenSehirId, setSecilenSehirId] = useState('')
  const [oneriAcik, setOneriAcik]     = useState(false)
  const [yukleniyor, setYukleniyor]   = useState(true)
  const aramaRef = useRef(null)
  const navigate = useNavigate()

  const oneriListesi = arama.trim().length > 0
    ? kategoriler.filter(k => k.ad.toLowerCase().includes(arama.toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    Promise.all([
      kategorileriGetir(),
      sehirleriGetir(),
      ustaListele({ limit: 3 }),
    ]).then(([katRes, sehRes, ustaRes]) => {
      setKategoriler(katRes.data.kategoriler || [])
      setSehirler(sehRes.data.sehirler || [])
      setEnIyiUstalar(ustaRes.data.ustalar || [])
    }).catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [])

  const aramayaGit = (e) => {
    e.preventDefault()
    setOneriAcik(false)
    const params = new URLSearchParams()
    if (arama.trim()) params.set('arama', arama)
    if (secilenSehirId) params.set('sehir_id', secilenSehirId)
    navigate(`/ustalar?${params.toString()}`)
  }

  const oneriSec = (kategori) => {
    setOneriAcik(false)
    const params = new URLSearchParams()
    params.set('kategori_id', kategori.id)
    params.set('kategori_ad', kategori.ad)
    if (secilenSehirId) params.set('sehir_id', secilenSehirId)
    navigate(`/ustalar?${params.toString()}`)
  }

  const sirali  = [...kategoriler].sort((a, b) => (a.sira || 99) - (b.sira || 99))
  const populer = sirali.slice(0, 8)
  const diger   = sirali.slice(8)

  return (
    <div className="bg-white">
      <SEO
        url="/"
        anahtar="Kıbrıs usta bul, KKTC usta, Kuzey Kıbrıs usta, Kıbrıs su tesisatı, KKTC elektrikçi, Kıbrıs klima servisi, Kuzey Kıbrıs boyacı, KKTC nakliyat, Kıbrıs su kaçağı tespiti, sıhhi tesisat KKTC, Girne tesisat, Lefkoşa tesisat, Kıbrıs şofben servisi, tıkanıklık açma KKTC, Lefkoşa usta, Girne usta, Gazimağusa usta, Güzelyurt usta, KKTC tadilat, 7/24 usta Kıbrıs"
      />

      {/* ══════════════════════════════════════════
          HERO — Gerçek arka plan fotoğrafı
      ══════════════════════════════════════════ */}
      <section className="relative min-h-[420px] sm:min-h-[480px] flex items-center">
        {/* Arka plan fotoğrafı */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/hero-bg.webp')"
          }}
        />
        {/* Koyu overlay */}

        <div className="relative w-full max-w-3xl mx-auto text-center px-4 py-10 sm:py-16 md:py-20">
          {/* Üst rozet */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t('hero.rozet')}
          </div>

          {/* Başlık */}
          <h1 className="font-extrabold leading-tight mb-4">
            <span className="text-white text-3xl md:text-5xl block" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)' }}>{t('hero.baslik1')}</span>
            <span className="text-yellow-400 text-4xl md:text-6xl block my-1" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)' }}>{t('hero.baslik2')}</span>
            <span className="text-white text-3xl md:text-5xl block" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)' }}>{t('hero.baslik3')}</span>
          </h1>

          {/* Hizmet chip'leri */}
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {HERO_CHIPLER.map(h => (
              <span key={h.key} className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/20"
                style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                {h.ikon} {t(`heroChipler.${h.key}`)}
              </span>
            ))}
            <span className="flex items-center gap-1 bg-yellow-400/20 backdrop-blur-sm text-yellow-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-yellow-400/30">
              <Plus size={11} /> {t('heroChipler.artiBes')}
            </span>
          </div>
          <p className="text-white/80 text-xs sm:text-sm mb-8" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
            {t('hero.aciklama')}
          </p>

          {/* Arama kutusu */}
          <form onSubmit={aramayaGit} className="flex flex-col sm:flex-row gap-2 shadow-2xl">
            <div className="relative flex-1" ref={aramaRef}>
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
              <input
                type="text"
                value={arama}
                onChange={e => { setArama(e.target.value); setOneriAcik(true) }}
                onFocus={() => setOneriAcik(true)}
                onBlur={() => setTimeout(() => setOneriAcik(false), 150)}
                placeholder={t('hero.aramaPlaceholder')}
                className="w-full pl-11 pr-4 py-4 rounded-xl bg-white text-gray-900 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
              />
              {/* Autocomplete dropdown */}
              {oneriAcik && oneriListesi.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-64 overflow-y-auto">
                  {oneriListesi.map(k => (
                    <button
                      key={k.id}
                      type="button"
                      onMouseDown={() => oneriSec(k)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <Search size={13} className="text-gray-400 flex-shrink-0" />
                      <span>{k.ad}</span>
                      {k.usta_sayisi > 0 && (
                        <span className="ml-auto text-xs text-gray-400">{k.usta_sayisi} usta</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative sm:w-44">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={secilenSehirId}
                onChange={e => setSecilenSehirId(e.target.value)}
                className="w-full pl-9 pr-4 py-4 rounded-xl bg-white text-gray-600 text-sm outline-none focus:ring-2 focus:ring-yellow-400 appearance-none"
              >
                <option value="">{t('hero.sehirSec')}</option>
                {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
              </select>
            </div>
            <button type="submit"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-extrabold px-8 py-4 rounded-xl transition-colors text-sm whitespace-nowrap shadow-lg">
              {t('hero.hemenBul')}
            </button>
          </form>

          {/* Hızlı etiketler */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <span className="text-blue-200 text-xs font-medium">{t('hero.populer')}</span>
            {[
              { key: 'elektrikci',  arama: 'Elektrikçi' },
              { key: 'suTesisati',  arama: 'Su Tesisatı' },
              { key: 'boyaBadana',  arama: 'Boya Badana' },
              { key: 'klima',       arama: 'Klima' },
              { key: 'temizlik',    arama: 'Temizlik' },
            ].map(tag => (
              <button key={tag.key}
                onClick={() => navigate(`/ustalar?arama=${tag.arama}${secilenSehirId ? `&sehir_id=${secilenSehirId}` : ''}`)}
                className="text-xs text-white bg-white/10 hover:bg-white/20 border border-white/25 px-3 py-1 rounded-full transition-colors">
                {t(`heroTaglar.${tag.key}`)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ÖZELLİKLER ŞERİDİ
      ══════════════════════════════════════════ */}
      <section className="bg-blue-900 py-2 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10">
            {OZELLIKLER_KEYS.map((key, i) => (
              <div key={key} className="flex items-center gap-1.5">
                {OZELLIKLER_IKONLAR[i]}
                <div>
                  <p className="text-white font-bold text-xs">{t(`ozellikler.${key}`)}</p>
                  <p className="text-blue-300 text-[10px]">{t(`ozellikler.${key}Alt`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HIZLI KATEGORİ BUTONLARI
      ══════════════════════════════════════════ */}
      <section className="bg-white py-4 border-b border-gray-100">
        <div className="overflow-x-auto scrollbar-hide"  style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex gap-2 px-4 pb-0.5" style={{ width: 'max-content' }}>
            {HIZLI_KATEGORILER.map(k => (
              <button
                key={k.key}
                onClick={() => navigate(`/ustalar?arama=${k.arama}`)}
                className="group flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-700 transition-all whitespace-nowrap"
              >
                <span className="text-gray-400 group-hover:text-blue-500 transition-colors">{k.ikon}</span>
                {t(`pills.${k.key}`)}
              </button>
            ))}
            <button
              onClick={() => navigate('/kategoriler')}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors whitespace-nowrap"
            >
              <Plus size={13} />
              {t('common.tumuBtn')}
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          POPÜLER VE AKTİF HİZMETLER — RESİMLİ
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-yellow-400 rounded-full" />
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">{t('kategoriler.baslik')}</h2>
              <p className="text-gray-500 text-xs mt-0.5">{t('kategoriler.alt')}</p>
            </div>
          </div>
          <button onClick={() => navigate('/kategoriler')}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-semibold border border-blue-100 px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors">
            {t('kategoriler.tumunu')} <ChevronRight size={15} />
          </button>
        </div>

        {yukleniyor ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
                <div className="h-48 bg-gray-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : populer.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">{t('ustalar.henuzYok')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {populer.map(k => <KategoriKart key={k.id} kategori={k} />)}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          DİĞER KATEGORİLER
      ══════════════════════════════════════════ */}
      {!yukleniyor && diger.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-300 rounded-full" />
              <h2 className="text-lg font-bold text-gray-700">{t('kategoriler.diger')}</h2>
            </div>
            <button onClick={() => navigate('/kategoriler')}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-semibold">
              {t('kategoriler.tumunu')} <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {diger.map(k => <KategoriKart key={k.id} kategori={k} />)}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          REKLAM ALANI
      ══════════════════════════════════════════ */}
      <ReklamBanner />

      {/* ══════════════════════════════════════════
          MÜŞTERİ YORUMLARI
      ══════════════════════════════════════════ */}
      <section className="bg-blue-50 border-y border-blue-100 py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-1 h-6 bg-yellow-400 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-900">{t('yorumlar.baslik')}</h2>
              <div className="w-1 h-6 bg-yellow-400 rounded-full" />
            </div>
            <p className="text-gray-500 text-sm mt-1">{t('yorumlar.alt')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {YORUMLAR.map((y, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full ${AVATAR_RENK[i % AVATAR_RENK.length]} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                    {y.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{y.ad}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-400">{y.sehir}</span>
                    </div>
                  </div>
                  <div className="ml-auto flex">
                    {Array.from({ length: 5 }, (_, s) => (
                      <Star key={s} size={13}
                        className={s < y.puan ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">"{y.yorum}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          EN İYİ USTALARIMIZ
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-600 rounded-full" />
            <h2 className="text-2xl font-bold text-gray-900">{t('ustalar.enIyi')}</h2>
          </div>
          <button onClick={() => navigate('/ustalar')}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-semibold">
            {t('ustalar.tumunu')} <ArrowRight size={15} />
          </button>
        </div>

        {enIyiUstalar.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">Henüz usta kaydı yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {enIyiUstalar.map((u, i) => (
              <div key={u.id}
                onClick={() => navigate(`/usta/${u.id}`)}
                className="bg-white rounded-2xl border border-blue-100 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden hover:-translate-y-0.5">
                <div className="h-1.5 bg-gradient-to-r from-blue-600 to-yellow-400" />
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`w-16 h-16 rounded-2xl ${AVATAR_RENK[i % AVATAR_RENK.length]} flex items-center justify-center text-white font-bold text-2xl flex-shrink-0`}>
                      {u.ad.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base">{u.ad_soyad}</h3>
                      <p className="text-blue-600 text-sm font-medium mt-0.5">{u.kategori}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500 truncate">
                          {u.ilce ? `${u.ilce}, ` : ''}{u.sehir}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, s) => (
                        <Star key={s} size={14}
                          className={s < Math.round(u.puan) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{u.yorum_sayisi} {t('ustalar.yorum')}</span>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${u.telefon}`}
                      onClick={e => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">
                      <Phone size={13} />
                      {u.telefon}
                    </a>
                    {u.whatsapp && (
                      <a href={`https://wa.me/${u.whatsapp.replace(/\D/g, '')}`}
                        target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="w-10 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors">
                        <MessageCircle size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          USTA CTA
      ══════════════════════════════════════════ */}
      <section className="py-14 px-4" style={{ background: 'linear-gradient(135deg, #0f2554 0%, #1a4aad 100%)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-white text-2xl font-bold mb-2">{t('cta.baslik')}</h2>
          <p className="text-blue-300 text-sm mb-8">
            {t('cta.alt')}
          </p>
          <button onClick={() => navigate('/usta-kayit')}
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-10 py-3.5 rounded-xl transition-colors text-sm">
            {t('cta.buton')}
          </button>
        </div>
      </section>

    </div>
  )
}
