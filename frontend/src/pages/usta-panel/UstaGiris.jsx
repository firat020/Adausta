import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { giris, benimBilgilerim } from '../../api'

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
      if (r.data.kullanici?.rol === 'usta') {
        navigate('/usta/panel', { replace: true })
      }
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
        setHata('Bu hesap usta hesabı değil. Lütfen usta e-postanızla giriş yapın.')
        return
      }
      setBasarili('Giriş başarılı! Yönlendiriliyorsunuz...')
      setTimeout(() => navigate('/usta/panel', { replace: true }), 800)
    } catch (err) {
      setHata(err.response?.data?.hata || 'Bir hata oluştu. Tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
            <Wrench size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Ada Usta</h1>
          <p className="text-blue-200 text-sm mt-1">Usta Paneline Giriş</p>
        </div>

        {/* Kart */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-extrabold text-gray-900 mb-1">Hoş Geldiniz</h2>
          <p className="text-sm text-gray-400 mb-6">Usta hesabınızla giriş yapın</p>

          <form onSubmit={handleGiris} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">E-posta</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="usta@email.com" required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Şifre</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={sifreGoster ? 'text' : 'password'} value={sifre}
                  onChange={e => setSifre(e.target.value)}
                  placeholder="••••••••" required minLength={6}
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button type="button" onClick={() => setSifreGoster(!sifreGoster)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {sifreGoster ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Hata / Başarı */}
            {hata && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                <AlertCircle size={15} className="shrink-0" /> {hata}
              </div>
            )}
            {basarili && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 size={15} className="shrink-0" /> {basarili}
              </div>
            )}

            <button type="submit" disabled={yukleniyor}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition text-sm">
              {yukleniyor ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Giriş yapılıyor...
                </div>
              ) : 'Giriş Yap'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Usta hesabınız yok mu?{' '}
              <a href="/usta-kayit" className="text-blue-600 font-semibold hover:underline">
                Usta Olarak Kayıt Ol
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-blue-300 mt-6">
          Müşteri girişi için{' '}
          <a href="/giris" className="text-white font-semibold hover:underline">buraya tıklayın</a>
        </p>
      </div>
    </div>
  )
}
