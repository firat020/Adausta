import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, KeyRound, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { sifreSifirlaKodGonder, sifreSifirlaDogrula } from '../api'

export default function SifremiUnuttum() {
  const [adim, setAdim] = useState(1)
  const [email, setEmail] = useState('')
  const [kod, setKod] = useState('')
  const [yeniSifre, setYeniSifre] = useState('')
  const [sifreGoster, setSifreGoster] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [mesaj, setMesaj] = useState('')
  const [tamamlandi, setTamamlandi] = useState(false)

  const kodGonder = async (e) => {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)
    try {
      const r = await sifreSifirlaKodGonder(email)
      setMesaj(r.data.mesaj)
      setAdim(2)
    } catch (err) {
      setHata(err.response?.data?.hata || 'Bir hata oluştu. Tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  const sifreGuncelle = async (e) => {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)
    try {
      await sifreSifirlaDogrula({ email, kod, yeni_sifre: yeniSifre })
      setTamamlandi(true)
    } catch (err) {
      setHata(err.response?.data?.hata || 'Doğrulama başarısız. Tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>

      <div className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="w-full max-w-sm rounded-2xl border border-white/10 p-8 relative z-10"
        style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>

        <div className="flex items-center gap-3 mb-7">
          <img src="/ada-usta-logo-transparent.webp" alt="Ada Usta" className="h-10 w-auto object-contain" />
          <div>
            <p className="font-extrabold text-white text-lg">Ada Usta</p>
            <p className="text-blue-400 text-xs font-semibold tracking-wide uppercase">Şifre Sıfırlama</p>
          </div>
        </div>

        {tamamlandi ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={26} className="text-emerald-400" />
            </div>
            <p className="font-bold text-white text-lg mb-2">Şifreniz Güncellendi</p>
            <p className="text-sm text-blue-300/70 mb-6">Yeni şifrenizle giriş yapabilirsiniz.</p>
            <div className="space-y-2">
              <Link to="/usta/giris" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition">
                Usta Girişi
              </Link>
              <Link to="/sirket/giris" className="block w-full border border-white/10 text-blue-200 font-semibold py-3 rounded-xl text-sm transition hover:bg-white/5">
                Şirket Girişi
              </Link>
              <Link to="/giris" className="block w-full border border-white/10 text-blue-200 font-semibold py-3 rounded-xl text-sm transition hover:bg-white/5">
                Müşteri Girişi
              </Link>
            </div>
          </div>
        ) : adim === 1 ? (
          <form onSubmit={kodGonder} className="space-y-4">
            <p className="text-sm text-blue-300/70">Kayıtlı e-posta adresinizi girin, telefon numaranıza doğrulama kodu gönderelim.</p>
            <div>
              <label className="text-xs font-bold text-blue-300 uppercase tracking-wide mb-1.5 block">E-posta</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400/60" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ornek@email.com" required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition text-white placeholder-blue-400/40 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  style={{ background: 'rgba(255,255,255,0.07)' }} />
              </div>
            </div>

            {hata && (
              <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm text-red-300 border border-red-500/20"
                style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertCircle size={15} className="shrink-0 mt-0.5" /> {hata}
              </div>
            )}

            <button type="submit" disabled={yukleniyor}
              className="w-full font-bold py-3.5 rounded-xl transition text-sm text-white shadow-lg shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: yukleniyor ? '#1d4ed8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              {yukleniyor ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
            </button>
          </form>
        ) : (
          <form onSubmit={sifreGuncelle} className="space-y-4">
            {mesaj && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-emerald-300 border border-emerald-500/20"
                style={{ background: 'rgba(16,185,129,0.1)' }}>
                <CheckCircle2 size={15} className="shrink-0" /> {mesaj}
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-blue-300 uppercase tracking-wide mb-1.5 block">Doğrulama Kodu</label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400/60" />
                <input value={kod} onChange={e => setKod(e.target.value)}
                  placeholder="6 haneli kod" required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition text-white placeholder-blue-400/40 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  style={{ background: 'rgba(255,255,255,0.07)' }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-blue-300 uppercase tracking-wide mb-1.5 block">Yeni Şifre</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400/60" />
                <input type={sifreGoster ? 'text' : 'password'} value={yeniSifre}
                  onChange={e => setYeniSifre(e.target.value)}
                  placeholder="En az 8 karakter" required minLength={8}
                  className="w-full pl-10 pr-11 py-3.5 rounded-xl text-sm outline-none transition text-white placeholder-blue-400/40 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  style={{ background: 'rgba(255,255,255,0.07)' }} />
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

            <button type="submit" disabled={yukleniyor}
              className="w-full font-bold py-3.5 rounded-xl transition text-sm text-white shadow-lg shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: yukleniyor ? '#1d4ed8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              {yukleniyor ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
            <button type="button" onClick={() => { setAdim(1); setHata('') }}
              className="w-full text-blue-300/60 text-xs font-semibold hover:text-blue-300 transition">
              Farklı bir e-posta dene
            </button>
          </form>
        )}

        {!tamamlandi && (
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <Link to="/usta/giris" className="inline-flex items-center gap-1.5 text-sm text-blue-400 font-semibold hover:text-blue-300 transition">
              <ArrowLeft size={14} /> Girişe dön
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
