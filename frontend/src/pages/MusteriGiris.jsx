import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { giris, kayit, benimBilgilerim } from '../api'
import api from '../api'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function MusteriGiris() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'
  const googleBtnRef = useRef(null)

  const [tab, setTab] = useState('giris')
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [sifreGoster, setSifreGoster] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [basarili, setBasarili] = useState('')

  // Zaten giriş yapılmışsa yönlendir
  useEffect(() => {
    benimBilgilerim().then(r => {
      if (r.data.kullanici) navigate(from, { replace: true })
    }).catch(() => {})
  }, [])

  // Google Identity Services scriptini yükle
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        })
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: googleBtnRef.current.offsetWidth || 380,
          text: 'continue_with',
          logo_alignment: 'center',
        })
      }
    }
    document.head.appendChild(script)
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [])

  const handleGoogleCallback = async (credentialResponse) => {
    setHata('')
    setYukleniyor(true)
    try {
      await api.post('/auth/google', { credential: credentialResponse.credential })
      setBasarili(t('musteriGiris.basariliGiris'))
      setTimeout(() => navigate(from, { replace: true }), 900)
    } catch (err) {
      setHata(err.response?.data?.hata || t('errors.birHataOlustu'))
    } finally {
      setYukleniyor(false)
    }
  }

  const temizle = () => { setHata(''); setBasarili('') }

  const handleGiris = async (e) => {
    e.preventDefault()
    temizle()
    setYukleniyor(true)
    try {
      await giris({ email, sifre })
      setBasarili(t('musteriGiris.basariliGiris'))
      setTimeout(() => navigate(from, { replace: true }), 900)
    } catch (err) {
      setHata(err.response?.data?.hata || t('errors.birHataOlustu'))
    } finally {
      setYukleniyor(false)
    }
  }

  const handleKayit = async (e) => {
    e.preventDefault()
    temizle()
    setYukleniyor(true)
    try {
      await kayit({ email, sifre })
      setBasarili(t('musteriGiris.basariliKayit'))
      setTimeout(() => navigate(from, { replace: true }), 900)
    } catch (err) {
      setHata(err.response?.data?.hata || t('errors.birHataOlustu'))
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">

        {/* Kart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Üst başlık */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User size={26} className="text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900">{t('musteriGiris.baslik')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('musteriGiris.altBaslik')}</p>
          </div>

          {/* Tab */}
          <div className="flex border-b border-gray-100">
            {['giris', 'kayit'].map(k => (
              <button key={k}
                onClick={() => { setTab(k); temizle() }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${tab === k ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}>
                {k === 'giris' ? t('musteriGiris.tabGiris') : t('musteriGiris.tabKayit')}
              </button>
            ))}
          </div>

          <div className="p-8">

            {/* Google ile giriş */}
            {GOOGLE_CLIENT_ID ? (
              <div className="mb-6">
                <div ref={googleBtnRef} className="w-full" />
              </div>
            ) : (
              <button
                disabled
                className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-400 mb-6 cursor-not-allowed bg-gray-50"
                title="VITE_GOOGLE_CLIENT_ID tanımlanmamış">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#9ca3af" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#9ca3af" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#9ca3af" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#9ca3af" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('musteriGiris.googleIle')}
              </button>
            )}

            {/* Facebook butonu */}
            <button
              onClick={() => setHata('Facebook girişi yakında aktif olacak.')}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl py-3 text-sm font-semibold text-gray-700 transition-colors mb-6">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              {t('musteriGiris.facebookIle')}
            </button>

            {/* Ayraç */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">{t('musteriGiris.veya')}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Form */}
            <form onSubmit={tab === 'giris' ? handleGiris : handleKayit} className="space-y-4">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  {t('musteriGiris.emailLabel')}
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('musteriGiris.emailPlaceholder')}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Şifre */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  {t('musteriGiris.sifreLabel')}
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={sifreGoster ? 'text' : 'password'}
                    value={sifre}
                    onChange={e => setSifre(e.target.value)}
                    placeholder={t('musteriGiris.sifrePlaceholder')}
                    required
                    minLength={6}
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
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {hata}
                </div>
              )}
              {basarili && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 size={15} className="flex-shrink-0" />
                  {basarili}
                </div>
              )}

              {/* Gönder */}
              <button
                type="submit"
                disabled={yukleniyor}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
                {yukleniyor ? '...' : tab === 'giris' ? t('musteriGiris.girisBtn') : t('musteriGiris.kayitBtn')}
              </button>
            </form>

            {/* Tab geçiş */}
            <p className="text-center text-sm text-gray-500 mt-5">
              {tab === 'giris' ? t('musteriGiris.hesapYok') : t('musteriGiris.hesapVar')}{' '}
              <button onClick={() => { setTab(tab === 'giris' ? 'kayit' : 'giris'); temizle() }}
                className="text-blue-600 font-semibold hover:underline">
                {tab === 'giris' ? t('musteriGiris.kayitOl') : t('musteriGiris.girisYap')}
              </button>
            </p>
          </div>
        </div>

        {GOOGLE_CLIENT_ID && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Google ile giriş yapmak için butona tıklayın.
          </p>
        )}
      </div>
    </div>
  )
}
