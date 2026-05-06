import { useSearchParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { CheckCircle, XCircle } from 'lucide-react'

export default function OdemeSonuc() {
  const [params] = useSearchParams()
  const durum    = params.get('durum')
  const siparis  = params.get('siparis')
  const sebep    = params.get('sebep')

  const basarili = durum === 'basarili'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <SEO baslik={basarili ? 'Ödeme Başarılı' : 'Ödeme Başarısız'} url="/odeme-sonuc" />
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        {basarili ? (
          <>
            <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ödeme Başarılı!</h1>
            <p className="text-gray-600 text-sm mb-2">İşleminiz tamamlandı.</p>
            {siparis && (
              <p className="text-xs text-gray-400 mb-6">Sipariş No: <span className="font-mono font-semibold">{siparis}</span></p>
            )}
            <Link to="/" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
              Ana Sayfaya Dön
            </Link>
          </>
        ) : (
          <>
            <XCircle size={56} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ödeme Başarısız</h1>
            <p className="text-gray-600 text-sm mb-2">İşlem tamamlanamadı.</p>
            {sebep && (
              <p className="text-xs text-red-400 mb-6">{decodeURIComponent(sebep)}</p>
            )}
            <div className="flex flex-col gap-2">
              <button onClick={() => window.history.back()} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
                Tekrar Dene
              </button>
              <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
                Ana Sayfaya Dön
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
