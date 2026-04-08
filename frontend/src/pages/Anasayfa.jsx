import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Star, ArrowRight, Phone, MessageCircle, Zap, Droplets, Paintbrush, Sparkles, Hammer, Plus } from 'lucide-react'
import { kategorileriGetir, ustaListele, sehirleriGetir } from '../api'
import KategoriKart from '../components/KategoriKart'

const HIZLI_KATEGORILER = [
  { ad: 'Tadilat',   ikon: <Hammer size={28} />,     renk: 'bg-orange-100 text-orange-600',  arama: 'Anahtar Teslim Tadilat' },
  { ad: 'Elektrik',  ikon: <Zap size={28} />,         renk: 'bg-blue-100 text-blue-600',      arama: 'Elektrikçi' },
  { ad: 'Tesisat',   ikon: <Droplets size={28} />,    renk: 'bg-cyan-100 text-cyan-600',      arama: 'Su Tesisatı' },
  { ad: 'Boya',      ikon: <Paintbrush size={28} />,  renk: 'bg-red-100 text-red-500',        arama: 'Boya Badana' },
  { ad: 'Temizlik',  ikon: <Sparkles size={28} />,    renk: 'bg-green-100 text-green-600',    arama: 'Ev Temizliği' },
]

const YORUMLAR = [
  { ad: 'Ayşe K.',    sehir: 'Girne',       puan: 5, yorum: 'Elektrikçiyi çok hızlı buldum, işini düzgün yaptı. Kesinlikle tavsiye ederim.', avatar: 'A' },
  { ad: 'Mehmet T.',  sehir: 'Lefkoşa',     puan: 5, yorum: 'Boyacı ustası harika iş çıkardı. Fiyat da uygundu, çok memnun kaldım.', avatar: 'M' },
  { ad: 'Zeynep S.',  sehir: 'Gazimağusa',  puan: 4, yorum: 'Tesisatçı aynı gün geldi, sorunu hemen çözdü. Teşekkürler AdaUsta!', avatar: 'Z' },
]

const AVATAR_RENK = ['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500']

export default function Anasayfa() {
  const [kategoriler, setKategoriler] = useState([])
  const [sehirler, setSehirler]       = useState([])
  const [enIyiUstalar, setEnIyiUstalar] = useState([])
  const [arama, setArama]             = useState('')
  const [secilenSehir, setSecilenSehir] = useState('')
  const [yukleniyor, setYukleniyor]   = useState(true)
  const navigate = useNavigate()

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
    const params = new URLSearchParams()
    if (arama.trim()) params.set('arama', arama)
    if (secilenSehir) params.set('sehir', secilenSehir)
    navigate(`/ustalar?${params.toString()}`)
  }

  const populer = [...kategoriler].sort((a, b) => b.usta_sayisi - a.usta_sayisi).filter(k => k.usta_sayisi > 0)
  const diger   = [...kategoriler].sort((a, b) => b.usta_sayisi - a.usta_sayisi).filter(k => k.usta_sayisi === 0)

  return (
    <div className="bg-white">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="bg-gray-900 px-4 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-white font-extrabold text-3xl md:text-4xl leading-tight mb-2">
            ADA USTA: GÜVENLİ VE HIZLI
          </h1>
          <h2 className="text-orange-400 font-extrabold text-3xl md:text-4xl leading-tight mb-8">
            ÇÖZÜMLERİNİZİN MERKEZİ
          </h2>

          {/* Arama */}
          <form onSubmit={aramayaGit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={arama}
                onChange={e => setArama(e.target.value)}
                placeholder="Hizmet ara... (Örn: Boya, Su Tesisatı, Elektrik...)"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white text-gray-900 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={secilenSehir}
              onChange={e => setSecilenSehir(e.target.value)}
              className="sm:w-44 px-4 py-3.5 rounded-xl bg-white text-gray-600 text-sm outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Şehir Seçin</option>
              {sehirler.map(s => <option key={s.id} value={s.ad}>{s.ad}</option>)}
            </select>
            <button type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm">
              ARA
            </button>
          </form>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HIZLI - GÜVENLİ - USTA
      ══════════════════════════════════════════ */}
      <section className="bg-white py-10 px-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center font-extrabold text-gray-900 text-lg mb-8 tracking-wide">
            HIZLI — GÜVENLİ — USTA
          </h2>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {HIZLI_KATEGORILER.map(k => (
              <button key={k.ad}
                onClick={() => navigate(`/ustalar?arama=${k.arama}`)}
                className="flex flex-col items-center gap-2 group">
                <div className={`w-16 h-16 rounded-2xl ${k.renk} flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
                  {k.ikon}
                </div>
                <span className="text-xs font-semibold text-gray-700">{k.ad}</span>
              </button>
            ))}
            <button onClick={() => navigate('/kategoriler')}
              className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm">
                <Plus size={28} />
              </div>
              <span className="text-xs font-semibold text-gray-700">Tümü</span>
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          KATEGORİ GRİDİ
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-5">
          <Star size={18} className="text-yellow-500 fill-yellow-500" />
          <h2 className="text-lg font-bold text-gray-900">Popüler ve Aktif Hizmetler</h2>
        </div>

        {yukleniyor ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-gray-100">
                <div className="h-44 bg-gray-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
              {populer.map(k => <KategoriKart key={k.id} kategori={k} />)}
            </div>

            {diger.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900">Diğer Kategoriler</h2>
                  <button onClick={() => navigate('/kategoriler')}
                    className="flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-semibold">
                    Tümünü Gör <ArrowRight size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {diger.map(k => <KategoriKart key={k.id} kategori={k} />)}
                </div>
              </>
            )}
          </>
        )}
      </section>

      {/* ══════════════════════════════════════════
          MÜŞTERİ YORUMLARI
      ══════════════════════════════════════════ */}
      <section className="bg-gray-50 border-y border-gray-100 py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Müşteri Yorumları</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {YORUMLAR.map((y, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
                        className={s < y.puan ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
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
          <h2 className="text-2xl font-bold text-gray-900">En İyi Ustalarımız</h2>
          <button onClick={() => navigate('/ustalar')}
            className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 text-sm font-semibold">
            Tümünü Gör <ArrowRight size={15} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {enIyiUstalar.map((u, i) => (
            <div key={u.id}
              onClick={() => navigate(`/usta/${u.id}`)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
              {/* Renkli üst şerit */}
              <div className="h-1.5 bg-gradient-to-r from-orange-500 to-amber-400" />
              <div className="p-6">
                {/* Avatar + bilgi */}
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-16 h-16 rounded-2xl ${AVATAR_RENK[i % AVATAR_RENK.length]} flex items-center justify-center text-white font-bold text-2xl flex-shrink-0`}>
                    {u.ad.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base">{u.ad_soyad}</h3>
                    <p className="text-orange-500 text-sm font-medium mt-0.5">{u.kategori}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-500 truncate">
                        {u.ilce ? `${u.ilce}, ` : ''}{u.sehir}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Puan */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, s) => (
                      <Star key={s} size={14}
                        className={s < Math.round(u.puan) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">{u.yorum_sayisi} yorum</span>
                </div>

                {/* Butonlar */}
                <div className="flex gap-2">
                  <a href={`tel:${u.telefon}`}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">
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
      </section>

      {/* ══════════════════════════════════════════
          USTA CTA
      ══════════════════════════════════════════ */}
      <section className="bg-gray-900 text-white py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Usta mısınız veya Firmanız mı var?</h2>
          <p className="text-gray-400 text-sm mb-6">
            Profilinizi oluşturun, KKTC genelinde müşterilere ücretsiz ulaşın.
          </p>
          <button onClick={() => navigate('/usta-kayit')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-3.5 rounded-xl transition-colors">
            Usta Olarak Kaydol
          </button>
        </div>
      </section>

    </div>
  )
}
