import { useNavigate } from 'react-router-dom'
import { Store, CheckCircle, FileText, ShieldCheck, TrendingUp, ArrowRight, Search } from 'lucide-react'

const FAYDALAR = [
  'Milyonlarca potansiyel müşteriye ulaşın',
  'Güvenli ödeme altyapısı ile kolay tahsilat',
  'Özel satıcı paneli ile kolay yönetim',
  'Hızlı onay süreci — ortalama 3 iş günü',
  'Düşük komisyon oranları, yüksek kazanç',
]

const ADIMLAR = [
  { no: '01', ikon: FileText,    baslik: 'Başvur',     aciklama: 'Şirket ve banka bilgilerinizi girin' },
  { no: '02', ikon: ShieldCheck, baslik: 'Belgeler',   aciklama: 'Gerekli belgeleri yükleyin' },
  { no: '03', ikon: CheckCircle, baslik: 'Onay',       aciklama: 'Ekibimiz başvurunuzu inceler' },
  { no: '04', ikon: Store,       baslik: 'Mağaza Aç',  aciklama: 'Ürünlerinizi satışa sunun' },
]

const GEREKSINIMLER = [
  { ikon: '🏢', baslik: 'Vergi Numarası',       aciklama: 'Geçerli vergi kimlik numarası ve vergi dairesi bilgisi' },
  { ikon: '🏦', baslik: 'Banka Hesabı',         aciklama: 'Şirkete ait IBAN numarası ve banka hesap bilgileri' },
  { ikon: '📄', baslik: 'Şirket Belgeleri',     aciklama: 'Şirket kayıt belgesi ve vergi kayıt belgesi' },
  { ikon: '🪪', baslik: 'Yetkili Kimliği',      aciklama: 'Şirketi temsile yetkili kişinin kimlik belgesi' },
]

export default function SaticiBasvuruGiris() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Store size={28} className="text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium">AdaUsta Pazar Yeri</p>
              <h1 className="text-2xl sm:text-3xl font-black">AdaUsta'da Satıcı Ol</h1>
            </div>
          </div>
          <p className="text-blue-100 text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
            KKTC'nin büyüyen e-ticaret platformunda mağazanızı açın. Binlerce müşteriye ulaşın, güvenli altyapımızla satış yapın.
          </p>
          <ul className="space-y-2.5 mb-10">
            {FAYDALAR.map((f, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-white">
                <CheckCircle size={16} className="text-green-300 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/satici-basvuru/basvur')}
              className="flex items-center gap-2 px-7 py-3.5 bg-white text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg"
            >
              Başvuruya Başla <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/satici-basvuru/durum')}
              className="flex items-center gap-2 px-7 py-3.5 bg-white/10 border border-white/30 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              <Search size={16} /> Başvuru Durumunu Sorgula
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-14">

        <div className="mb-14">
          <h2 className="text-xl font-black text-gray-900 mb-2 text-center">Başvuru Süreci</h2>
          <p className="text-gray-500 text-sm text-center mb-8">4 kolay adımda satıcı olun</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ADIMLAR.map(({ no, ikon: Icon, baslik, aciklama }, i) => (
              <div key={i} className="relative bg-white border border-gray-200 rounded-2xl p-5 text-center">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon size={20} className="text-blue-600" />
                </div>
                <span className="text-xs font-black text-blue-400 tracking-widest">{no}</span>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{baslik}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{aciklama}</p>
                {i < ADIMLAR.length - 1 && (
                  <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight size={16} className="text-blue-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-14">
          <h2 className="text-xl font-black text-gray-900 mb-2 text-center">Gereksinimler</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Başvuru için aşağıdaki belge ve bilgileri hazırlayın</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GEREKSINIMLER.map((g, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4">
                <span className="text-2xl flex-shrink-0">{g.ikon}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{g.baslik}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{g.aciklama}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-600 rounded-2xl p-8 text-center text-white">
          <TrendingUp size={32} className="mx-auto mb-3 text-blue-200" />
          <h2 className="text-xl font-black mb-2">Hemen Başlayın</h2>
          <p className="text-blue-100 text-sm mb-6 max-w-md mx-auto">
            Başvurunuz ortalama 3 iş günü içinde sonuçlanır. Onaylandıktan sonra hemen satışa başlayabilirsiniz.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => navigate('/satici-basvuru/basvur')}
              className="flex items-center gap-2 px-8 py-3.5 bg-white text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors"
            >
              Başvuruya Başla <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/satici-basvuru/durum')}
              className="flex items-center gap-2 px-8 py-3.5 bg-white/10 border border-white/30 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              <Search size={16} /> Durumu Sorgula
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
