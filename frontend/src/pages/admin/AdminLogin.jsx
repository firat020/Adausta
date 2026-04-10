import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:5000'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const navigate = useNavigate()

  const giris = async (e) => {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)
    try {
      const res = await axios.post(`${API}/api/auth/giris`, { email, sifre }, { withCredentials: true })
      if (res.data.kullanici?.rol === 'admin') {
        navigate('/admin/dashboard')
      } else {
        setHata('Bu hesabın admin yetkisi yok.')
      }
    } catch (err) {
      setHata(err.response?.data?.hata || 'Giriş başarısız')
    }
    setYukleniyor(false)
  }

  return (
    <div className="min-h-screen bg-[#D6DEE8] flex items-center justify-center p-4">
      {/* Arka plan dekorasyon */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0052CC]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#003d99]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Kart */}
        <div className="bg-white border border-[#C8CDD4] rounded-2xl shadow-xl overflow-hidden">
          {/* Üst banner */}
          <div className="bg-[#0d1322] px-8 py-8 text-center border-b-2 border-[#1a2744]">
            <div className="w-16 h-16 bg-[#003d99] border-2 border-[#0052CC] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Adausta</h1>
            <p className="text-[#6a7ea0] text-sm mt-1">Yönetim Paneli</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <p className="text-gray-600 text-sm mb-6 text-center">Devam etmek için giriş yapın</p>

            <form onSubmit={giris} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  E-posta
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full border border-[#C8CDD4] rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition bg-[#F8F9FA]"
                  placeholder="admin@adausta.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Şifre
                </label>
                <input
                  type="password"
                  value={sifre}
                  onChange={e => setSifre(e.target.value)}
                  required
                  className="w-full border border-[#C8CDD4] rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition bg-[#F8F9FA]"
                  placeholder="••••••••"
                />
              </div>

              {hata && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {hata}
                </div>
              )}

              <button
                type="submit"
                disabled={yukleniyor}
                className="w-full bg-[#0052CC] hover:bg-[#0040A3] text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-60 shadow-sm mt-2"
              >
                {yukleniyor ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
                    Giriş yapılıyor...
                  </span>
                ) : 'Giriş Yap'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[#6a7ea0] text-xs mt-6">
          Adausta Admin Panel · KKTC
        </p>
      </div>
    </div>
  )
}
