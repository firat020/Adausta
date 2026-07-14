import { useLocation, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, ShoppingBag, MessageCircle, ExternalLink } from 'lucide-react'
import SEO from '../components/SEO'

const fmt = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0)

const BANKA = {
  sahip: 'Adissa Enterprises Ltd.',
  banka: 'Garanti BBVA',
  sube: 'Girne (KKTC)',
  sube_kodu: '1288',
  hesap_no: '6295117',
  iban: 'TR05 0006 2001 2880 0006 2951 17',
}

export default function MagazaSiparisBasarili() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}
  const { siparis_no, genel_toplam_tl, odeme_yontemi, ad, email } = state

  if (!siparis_no) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Sipariş bilgisi bulunamadı.</p>
        <button onClick={() => navigate('/magaza')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">
          Mağazaya Git
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <SEO baslik="Siparişiniz Alındı" />

      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Siparişiniz Alındı!</h1>
        <p className="text-gray-500">
          {ad && <span className="font-semibold">{ad}</span>}
          {ad ? ', s' : 'S'}iparişiniz başarıyla oluşturuldu.
        </p>
      </div>

      {/* Sipariş No */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-5 text-center mb-6">
        <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider mb-1">Sipariş Numarası</p>
        <p className="text-3xl font-black text-blue-700 tracking-widest font-mono">{siparis_no}</p>
        {genel_toplam_tl > 0 && (
          <p className="text-sm text-blue-600 mt-2 font-semibold">{fmt(genel_toplam_tl)}</p>
        )}
      </div>

      {/* Havale bilgileri */}
      {odeme_yontemi === 'havale' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <p className="text-sm font-bold text-gray-900 mb-4">Havale / EFT Bilgileri</p>
          <div className="space-y-2 text-sm">
            {[
              { l: 'Hesap Sahibi', v: BANKA.sahip },
              { l: 'Banka', v: BANKA.banka },
              { l: 'Şube', v: `${BANKA.sube} (${BANKA.sube_kodu})` },
              { l: 'Hesap No', v: BANKA.hesap_no },
            ].map(r => (
              <div key={r.l} className="flex justify-between">
                <span className="text-gray-500">{r.l}</span>
                <span className="font-semibold text-gray-800">{r.v}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-3 mt-1">
              <p className="text-xs text-gray-500 mb-1">IBAN</p>
              <p className="font-black text-gray-900 tracking-wider text-base">{BANKA.iban}</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4">
            <p className="text-xs text-amber-800 font-semibold">
              Açıklama kısmına sipariş numaranızı yazınız: <span className="font-black font-mono">{siparis_no}</span>
            </p>
          </div>
        </div>
      )}

      {/* Kapıda ödeme */}
      {(odeme_yontemi === 'kapida_nakit' || odeme_yontemi === 'kapida_kredi') && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800 mb-6">
          <p className="font-semibold mb-1">Kapıda Ödeme Seçildi</p>
          <p>Ekibimiz en kısa sürede sizinle iletişime geçecektir.</p>
        </div>
      )}

      {/* E-posta notu */}
      {email && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 mb-6">
          Sipariş detayları <strong>{email}</strong> adresine gönderilecektir.
        </div>
      )}

      {/* Sonraki adımlar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <p className="text-sm font-bold text-gray-900 mb-3">Sonraki Adımlar</p>
        <div className="space-y-2.5 text-sm text-gray-600">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <span>Siparişiniz ekibimiz tarafından işleme alınacaktır.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <span>Hazırlık tamamlandığında kargo/teslimat bilgileri tarafınıza iletilecektir.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            <span>Sipariş durumunu takip etmek için sipariş numaranızı saklayın.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/magaza')}
          className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors"
        >
          <ShoppingBag size={16} />
          Mağazaya Dön
        </button>
        <Link
          to="/iletisim"
          className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-colors"
        >
          <MessageCircle size={16} />
          Destek
        </Link>
      </div>

      <p className="text-xs text-gray-400 text-center mt-5">
        Sipariş numaranızı not alın: <span className="font-mono font-bold">{siparis_no}</span>
      </p>
    </div>
  )
}
