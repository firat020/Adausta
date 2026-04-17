import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Star, TrendingUp, Users, BadgeCheck } from 'lucide-react'
import { giris, benimBilgilerim } from '../../api'

const OZELLIKLER = [
  { ikon: TrendingUp,  baslik: 'İş Talebi Takibi',   aciklama: 'Gelen teklifleri anlık takip et' },
  { ikon: Users,       baslik: 'Müşteri Yönetimi',    aciklama: 'Tüm müşterilerini bir yerde gör' },
  { ikon: Star,        baslik: 'Yorum & Puanlama',     aciklama: 'İtibarını büyüt, fark yarat' },
  { ikon: BadgeCheck,  baslik: 'Onaylı Profil Rozeti', aciklama: 'Güvenilir usta olarak öne çık' },
]

export default function UstaGiris() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [sifreGoster, setSifreGoster] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [basarili, setBasarili] = useState('')

  useEffect(() => {
    benimBilgilerim().then(r => {
      if (r.data.kullanici?.rol === 'usta') navigate('/usta/panel', { replace: true })
    }).catch(() => {})
  }, [])

  const handleGiris = async (e) => {
    e.preventDefault()
    setHata('')
    setBasarili('')
    setYukleniyor(true)
    try {
      const r = await giris({ email, sifre })
      const rol = r.data.kullanici?.rol
      if (rol !== 'usta') {
        setHata('Bu hesap usta hesabı değil. Usta e-postanızla giriş yapın.')
        return
      }
      setBasarili('Giriş başarılı! Yönlendiriliyorsunuz...')
      setTimeout(() => navigate('/usta/panel', { replace: true }), 800)
    } catch (err) {
      setHata(err.response?.data?.hata || 'E-posta veya şifre hatalı.')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ─── SOL PANEL — Marka & Slogan ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>

        {/* Arka plan desen */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        {/* Parlama efektleri */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-32 right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/ada-usta-logo.png" alt="Ada Usta" className="w-11 h-11 rounded-xl object-cover shadow-lg" />
            <div>
              <p className="text-white font-extrabold text-lg leading-none">Ada Usta</p>
              <p className="text-blue-400 text-xs font-medium tracking-widest uppercase">Usta Paneli</p>
            </div>
          </div>

          {/* Slogan */}
          <div className="mt-auto mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-blue-300 text-xs font-semibold tracking-wide">KKTC'nin En Büyük Usta Platformu</span>
            </div>

            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Ustalığın<br />
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(90deg, #60a5fa, #a78bfa)' }}>
                En Değerli Varlığın.
              </span>
            </h1>

            <p className="text-blue-200/80 text-base leading-relaxed max-w-sm">
              Binlerce müşteriye ulaş, işlerini büyüt. Panelinle her şeyi tek ekrandan yönet.
            </p>

            {/* Özellik listesi */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {OZELLIKLER.map(({ ikon: Icon, baslik, aciklama }) => (
                <div key={baslik} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3.5">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={15} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">{baslik}</p>
                    <p className="text-blue-300/70 text-xs mt-0.5 leading-snug">{aciklama}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alt bilgi */}
          <div className="flex items-center gap-3 pt-6 border-t border-white/10">
            <div className="flex -space-x-2">
              {['A','M','K','S'].map((l, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#1e3a5f] flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: ['#2563eb','#7c3aed','#0891b2','#059669'][i] }}>
                  {l}
                </div>
              ))}
            </div>
            <p className="text-blue-300/80 text-xs">
              <span className="text-white font-bold">391+</span> usta zaten bu platformda
            </p>
          </div>
        </div>
      </div>

      {/* ─── SAĞ PANEL — Giriş Formu ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-gray-50">

        {/* Mobil logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <img src="/ada-usta-logo.png" alt="Ada Usta" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <p className="font-extrabold text-gray-900">Ada Usta</p>
            <p className="text-blue-500 text-xs font-semibold">Usta Paneli</p>
          </div>
        </div>

        <div className="w-full max-w-sm">

          {/* Başlık */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900">Hoş Geldiniz</h2>
            <p className="text-gray-400 text-sm mt-1">Usta hesabınızla giriş yapın</p>
          </div>

          {/* Form */}
          <form onSubmit={handleGiris} className="space-y-4">

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">E-posta</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="usta@email.com" required
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Şifre</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={sifreGoster ? 'text' : 'password'} value={sifre}
                  onChange={e => setSifre(e.target.value)}
                  placeholder="••••••••" required minLength={6}
                  className="w-full pl-10 pr-11 py-3.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition"
                />
                <button type="button" onClick={() => setSifreGoster(!sifreGoster)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {sifreGoster ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {hata && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                <AlertCircle size={15} className="shrink-0 mt-0.5" /> {hata}
              </div>
            )}
            {basarili && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 size={15} className="shrink-0" /> {basarili}
              </div>
            )}

            <button type="submit" disabled={yukleniyor}
              className="w-full text-white font-bold py-3.5 rounded-xl transition text-sm shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: yukleniyor ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              {yukleniyor ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Giriş yapılıyor...
                </span>
              ) : 'Giriş Yap'}
            </button>
          </form>

          {/* Kayıt ol linki */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Usta hesabınız yok mu?{' '}
              <Link to="/usta-kayit" className="text-blue-600 font-bold hover:underline">
                Usta Olarak Kayıt Ol
              </Link>
            </p>
          </div>

          {/* Müşteri girişi */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Müşteri girişi için{' '}
            <Link to="/giris" className="text-gray-600 font-semibold hover:underline">buraya tıklayın</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
