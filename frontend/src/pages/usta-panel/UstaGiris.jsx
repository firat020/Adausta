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
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>

      {/* Arka plan desen */}
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      <div className="fixed top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ─── SOL PANEL ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between px-12 py-10 relative z-10">

        {/* Üst: Logo büyük */}
        <div className="flex flex-col items-start gap-5">
          <div className="flex items-center gap-3">
            <img src="/ada-usta-logo.png" alt="Ada Usta"
              className="w-10 h-10 rounded-xl object-cover shadow-lg" />
            <div>
              <p className="text-white font-extrabold text-base leading-none">Ada Usta</p>
              <p className="text-blue-400 text-xs font-medium tracking-widest uppercase">Usta Paneli</p>
            </div>
          </div>

          {/* Logo büyük — gösterilen dikdörtgen alan */}
          <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)' }}>
            <div className="flex flex-col items-center justify-center py-10 px-8 gap-4">
              <img src="/ada-usta-logo.png" alt="Ada Usta Logo"
                className="w-24 h-24 rounded-3xl object-cover shadow-2xl ring-4 ring-white/10" />
              <div className="text-center">
                <p className="text-white font-black text-3xl tracking-tight">Ada Usta</p>
                <p className="text-blue-300 text-sm font-medium mt-1 tracking-wide">Usta Paneline Hoş Geldiniz</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orta: Slogan */}
        <div className="my-6">
          <h1 className="text-4xl font-black text-white leading-tight mb-3">
            Ustalığın<br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #60a5fa, #a78bfa)' }}>
              En Değerli Varlığın.
            </span>
          </h1>
          <p className="text-blue-200/70 text-sm leading-relaxed max-w-sm">
            Binlerce müşteriye ulaş, işlerini büyüt. Panelinle her şeyi tek ekrandan yönet.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {OZELLIKLER.map(({ ikon: Icon, baslik, aciklama }) => (
              <div key={baslik}
                className="flex items-start gap-3 rounded-xl p-3.5 border border-white/10"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={15} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold">{baslik}</p>
                  <p className="text-blue-300/60 text-xs mt-0.5 leading-snug">{aciklama}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alt: Sosyal kanıt */}
        <div className="flex items-center gap-3 pt-5 border-t border-white/10">
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

      {/* ─── SAĞ PANEL — Form (koyu, kart yok) ─────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative z-10">

        {/* Mobil logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <img src="/ada-usta-logo.png" alt="Ada Usta" className="w-11 h-11 rounded-xl object-cover" />
          <div>
            <p className="font-extrabold text-white text-lg">Ada Usta</p>
            <p className="text-blue-400 text-xs font-semibold tracking-wide uppercase">Usta Paneli</p>
          </div>
        </div>

        {/* Form kutusu — mavi tonlu kart */}
        <div className="w-full max-w-sm rounded-2xl border border-white/10 p-8"
          style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>

          <div className="mb-7">
            <h2 className="text-2xl font-black text-white">Hoş Geldiniz</h2>
            <p className="text-blue-300/70 text-sm mt-1">Usta hesabınızla giriş yapın</p>
          </div>

          <form onSubmit={handleGiris} className="space-y-4">

            <div>
              <label className="text-xs font-bold text-blue-300 uppercase tracking-wide mb-1.5 block">E-posta</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400/60" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="usta@email.com" required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition text-white placeholder-blue-400/40 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-blue-300 uppercase tracking-wide mb-1.5 block">Şifre</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400/60" />
                <input
                  type={sifreGoster ? 'text' : 'password'} value={sifre}
                  onChange={e => setSifre(e.target.value)}
                  placeholder="••••••••" required minLength={6}
                  className="w-full pl-10 pr-11 py-3.5 rounded-xl text-sm outline-none transition text-white placeholder-blue-400/40 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                />
                <button type="button" onClick={() => setSifreGoster(!sifreGoster)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-400/60 hover:text-blue-300 transition">
                  {sifreGoster ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {hata && (
              <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm text-red-300 border border-red-500/20"
                style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertCircle size={15} className="shrink-0 mt-0.5" /> {hata}
              </div>
            )}
            {basarili && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-emerald-300 border border-emerald-500/20"
                style={{ background: 'rgba(16,185,129,0.1)' }}>
                <CheckCircle2 size={15} className="shrink-0" /> {basarili}
              </div>
            )}

            <button type="submit" disabled={yukleniyor}
              className="w-full font-bold py-3.5 rounded-xl transition text-sm text-white shadow-lg shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: yukleniyor ? '#1d4ed8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              {yukleniyor ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Giriş yapılıyor...
                </span>
              ) : 'Giriş Yap'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-sm text-blue-300/70">
              Usta hesabınız yok mu?{' '}
              <Link to="/usta-kayit" className="text-blue-400 font-bold hover:text-blue-300 transition">
                Usta Olarak Kayıt Ol
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-blue-400/50 mt-3">
            Müşteri girişi için{' '}
            <Link to="/giris" className="text-blue-400/70 font-semibold hover:text-blue-300 transition">buraya tıklayın</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
