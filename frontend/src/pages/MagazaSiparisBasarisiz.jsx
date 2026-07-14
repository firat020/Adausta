import { useLocation, useNavigate, Link } from 'react-router-dom'
import { XCircle, ShoppingCart, RefreshCw, MessageCircle } from 'lucide-react'
import SEO from '../components/SEO'

export default function MagazaSiparisBasarisiz() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}
  const { hata_mesaji, siparis_no } = state

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <SEO baslik="Ödeme Tamamlanamadı" />

      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <XCircle size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Ödeme Tamamlanamadı</h1>
        <p className="text-gray-500">Ödemeniz işlenemedi. Sipariş oluşturulmadı.</p>
      </div>

      {/* Hata bilgisi */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
        <p className="text-sm font-bold text-red-800 mb-1">Neden Oluşabilir?</p>
        <ul className="text-sm text-red-700 space-y-1 list-disc pl-4">
          <li>Kart limitiniz yetersiz olabilir</li>
          <li>Kart bilgileriniz hatalı girilmiş olabilir</li>
          <li>Bankanız işlemi onaylamamış olabilir</li>
          <li>Ağ bağlantısında geçici bir sorun oluşmuş olabilir</li>
        </ul>
        {hata_mesaji && (
          <div className="mt-3 pt-3 border-t border-red-200">
            <p className="text-xs text-red-600 font-mono">{hata_mesaji}</p>
          </div>
        )}
        {siparis_no && (
          <p className="mt-2 text-xs text-red-600">Sipariş No: <span className="font-mono font-bold">{siparis_no}</span></p>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={() => navigate('/magaza/odeme')}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors"
        >
          <RefreshCw size={16} />
          Tekrar Dene
        </button>
        <button
          onClick={() => navigate('/magaza')}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-colors"
        >
          <ShoppingCart size={16} />
          Sepete Dön
        </button>
        <Link
          to="/iletisim"
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-blue-600 hover:underline"
        >
          <MessageCircle size={15} />
          Destek ekibiyle iletişime geç
        </Link>
      </div>
    </div>
  )
}
