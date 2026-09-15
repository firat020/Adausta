import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ClipboardList, Users, Star, ShieldCheck, ChevronRight, UserPlus, Users2, BarChart3 } from 'lucide-react'
import { giris, benimBilgilerim } from '../../api'

const OZELLIKLER = [
  { ikon: ClipboardList, renk: 'mavi',    baslik: 'İş Talebi Takibi',    aciklama: 'Gelen iş tekliflerini anlık takip et, fırsatları kaçırma.' },
  { ikon: Users,         renk: 'turuncu', baslik: 'Müşteri Yönetimi',    aciklama: 'Tüm müşterilerini tek yerde gör, iletişimini kolaylaştır.' },
  { ikon: Star,          renk: 'turuncu', baslik: 'Yorum & Puanlama',    aciklama: 'Müşteri yorumlarıyla itibarını büyüt, fark yarat.' },
  { ikon: ShieldCheck,   renk: 'mavi',    baslik: 'Onaylı Profil Rozeti', aciklama: 'Güvenilir usta olarak öne çık, daha çok iş al.' },
]

const GUVEN = [
  { ikon: Users2,    satir1: 'Binlerce',       satir2: 'memnun müşteri' },
  { ikon: ShieldCheck, satir1: 'Güvenilir',    satir2: 'platform' },
  { ikon: BarChart3, satir1: 'Daha fazla iş,', satir2: 'daha büyük fırsatlar' },
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
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>

      {/* Arka plan desen */}
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      <div className="fixed top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Dev logo — sayfanın en arkasında, çok şeffaf filigran */}
      <img src="/ada-usta-logo-new.png" alt=""
        className="fixed -left-24 -top-24 w-[700px] h-[700px] object-contain opacity-[0.06] pointer-events-none select-none z-0" />

      {/* ─── ANA İÇERİK ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-stretch gap-10 lg:gap-8 px-6 lg:px-12 py-10 lg:py-14">

        {/* Sol: Pazarlama içeriği */}
        <div className="w-full lg:w-[56%] order-2 lg:order-1 relative flex flex-col justify-center">
          <p className="text-orange-400 font-extrabold text-xs tracking-[0.2em] uppercase mb-3">Usta Paneli</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.05] mb-4">
            Ustalığın<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #fb923c, #facc15)' }}>
              Değer Kazansın.
            </span>
          </h1>
          <p className="text-blue-200/70 text-sm sm:text-base leading-relaxed max-w-md mb-8">
            Daha fazla müşteriye ulaş, iş taleplerini kolayca yönet ve işini büyüt.
            Ada Usta ile emeğin her zaman değer görsün.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mb-8">
            {OZELLIKLER.map(({ ikon: Icon, renk, baslik, aciklama }) => (
              <div key={baslik} className="rounded-2xl border border-white/10 p-4"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: renk === 'mavi' ? 'rgba(37,99,235,0.25)' : 'rgba(234,88,12,0.25)' }}>
                  <Icon size={18} className={renk === 'mavi' ? 'text-blue-300' : 'text-orange-300'} />
                </div>
                <p className="text-white text-sm font-bold mb-0.5">{baslik}</p>
                <p className="text-blue-300/60 text-xs leading-snug">{aciklama}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-6 border-t border-white/10 max-w-md">
            {GUVEN.map(({ ikon: Icon, satir1, satir2 }) => (
              <div key={satir1} className="flex items-center gap-2.5">
                <Icon size={20} className="text-blue-300/70 shrink-0" />
                <p className="text-blue-200/70 text-xs leading-tight">{satir1}<br />{satir2}</p>
              </div>
            ))}
          </div>

          {/* Dekoratif usta fotoğrafı — sadece geniş ekranda */}
          <img src="/usta-giris-hero-worker.jpg" alt=""
            className="hidden xl:block absolute -right-6 top-0 h-full w-[230px] object-cover rounded-3xl"
            style={{
              maskImage: 'linear-gradient(to left, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, black 50%, transparent 100%)',
              opacity: 0.85
            }} />
        </div>

        {/* Sağ: Giriş kartı */}
        <div className="w-full max-w-sm lg:max-w-none lg:w-[42%] order-1 lg:order-2 relative z-20 flex flex-col">

          {/* Mobil logo (üst bar zaten var, kartın üstüne küçük başlık) */}
          <p className="lg:hidden text-center text-blue-300/60 text-xs font-semibold tracking-widest uppercase mb-3">
            Usta Paneli
          </p>

          <div className="w-full flex-1 flex flex-col justify-center rounded-3xl border border-white/10 p-7 sm:p-8 shadow-2xl shadow-black/40"
            style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(20px)' }}>

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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-blue-300 uppercase tracking-wide block">Şifre</label>
                  <Link to="/sifremi-unuttum" className="text-xs text-blue-400/70 font-semibold hover:text-blue-300 transition">Şifremi unuttum?</Link>
                </div>
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
                className="w-full font-bold py-3.5 rounded-xl transition text-sm text-white shadow-lg shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-1.5"
                style={{ background: yukleniyor ? '#1d4ed8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                {yukleniyor ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Giriş yapılıyor...
                  </span>
                ) : (
                  <>Giriş Yap <ChevronRight size={16} /></>
                )}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-blue-400/50 text-xs">ya da</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <p className="text-center text-sm text-blue-300/70 mb-3">Usta hesabınız yok mu?</p>
            <Link to="/usta-kayit"
              className="w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition text-sm text-blue-200 border border-blue-400/30 hover:bg-blue-500/10">
              <UserPlus size={16} /> Usta Olarak Kayıt Ol
            </Link>

            <p className="text-center text-xs text-blue-400/50 mt-5">
              Müşteri girişi için{' '}
              <Link to="/giris" className="text-blue-400/70 font-semibold hover:text-blue-300 transition">buraya tıklayın</Link>
            </p>
          </div>
        </div>
      </div>

      {/* ─── ALT BİLGİ ÇUBUĞU ───────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/10 px-6 lg:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-blue-300/40">
        <p>© {new Date().getFullYear()} Ada Usta. Tüm hakları saklıdır.</p>
        <div className="flex items-center gap-4">
          <Link to="/gizlilik" className="hover:text-blue-300/70 transition">Gizlilik Politikası</Link>
          <Link to="/kullanim-sartlari" className="hover:text-blue-300/70 transition">Kullanım Koşulları</Link>
          <Link to="/iletisim" className="hover:text-blue-300/70 transition">İletişim</Link>
        </div>
      </footer>
    </div>
  )
}
