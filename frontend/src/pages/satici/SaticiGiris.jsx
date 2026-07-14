import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Store, LogIn, ArrowRight, ShoppingBag } from 'lucide-react'
import { benimBilgilerim } from '../../api'

export default function SaticiGiris() {
  const navigate = useNavigate()

  useEffect(() => {
    benimBilgilerim()
      .then(r => {
        const kullanici = r.data.kullanici
        if (!kullanici) return
        const magazaUyesi = kullanici.magaza_uye || kullanici.rol === 'satici' || kullanici.store_member
        if (magazaUyesi) {
          navigate('/satici/panel', { replace: true })
        } else {
          navigate('/satici-basvuru', { replace: true })
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-blue-700 to-blue-500 px-8 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store size={30} className="text-white" />
            </div>
            <h1 className="text-xl font-black text-white">Satıcı Paneli</h1>
            <p className="text-blue-100 text-sm mt-1">AdaUsta Pazar Yeri</p>
          </div>

          <div className="px-8 py-8 text-center">
            <p className="text-gray-700 font-semibold mb-2">Satıcı panelinize erişmek için giriş yapın</p>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Hesabınıza giriş yaptıktan sonra otomatik olarak satıcı panelinize yönlendirileceksiniz.
            </p>

            <Link
              to="/giris"
              state={{ from: '/satici/giris' }}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors mb-3"
            >
              <LogIn size={16} /> Giriş Yap
            </Link>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">veya</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <Link
              to="/satici-basvuru/basvur"
              className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-blue-200 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors"
            >
              <ShoppingBag size={16} /> Satıcı Başvurusu Yap <ArrowRight size={14} />
            </Link>
          </div>

          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-gray-400">
              Başvuru durumunu sorgulamak için{' '}
              <Link to="/satici-basvuru/durum" className="text-blue-600 font-semibold hover:underline">
                buraya tıklayın
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Müşteri girişi için{' '}
          <Link to="/giris" className="text-blue-600 font-semibold hover:underline">
            ana giriş sayfasını
          </Link>{' '}
          kullanabilirsiniz.
        </p>
      </div>
    </div>
  )
}
