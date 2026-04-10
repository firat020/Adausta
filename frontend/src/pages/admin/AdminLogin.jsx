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
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#16213e] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1e3a5f]">Adausta</h1>
          <p className="text-gray-500 mt-1">Admin Paneli</p>
        </div>

        <form onSubmit={giris} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]"
              placeholder="admin@adausta.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <input
              type="password"
              value={sifre}
              onChange={e => setSifre(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]"
              placeholder="••••••••"
            />
          </div>

          {hata && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
              {hata}
            </div>
          )}

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 font-medium hover:bg-[#16213e] transition disabled:opacity-60"
          >
            {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  )
}
