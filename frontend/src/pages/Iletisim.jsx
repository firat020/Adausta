import SEO from '../components/SEO'
import { Phone, AtSign, MapPin, Clock } from 'lucide-react'

export default function Iletisim() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO baslik="İletişim" url="/iletisim" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">İletişim</h1>
      <p className="text-gray-500 text-sm mb-8">Adissa Enterprises Ltd. · Ada Usta</p>

      <div className="grid md:grid-cols-2 gap-6">

        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AtSign size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-0.5">E-posta</p>
              <a href="mailto:adausta@gmail.com" className="text-sm text-blue-600 hover:underline font-medium">
                adausta@gmail.com
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Phone size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-0.5">Telefon / WhatsApp</p>
              <a href="tel:+905488510700" className="text-sm text-green-700 hover:underline font-medium">
                +90 548 851 07 00
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-0.5">Adres / Faaliyet Alanı</p>
              <p className="text-sm text-gray-700">
                Kuzey Kıbrıs Türk Cumhuriyeti<br />
                <span className="text-xs text-gray-500">(Lefkoşa, Girne, Gazimağusa, Güzelyurt, İskele)</span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-0.5">Çalışma Saatleri</p>
              <p className="text-sm text-gray-700">Pazartesi – Cuma: 09:00 – 18:00</p>
              <p className="text-xs text-gray-500">Hafta sonu e-posta yanıtı gecikmeli olabilir.</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Mesaj Gönderin</h2>
          <form
            onSubmit={e => { e.preventDefault(); window.location.href = `mailto:adausta@gmail.com?subject=${encodeURIComponent(e.target.konu.value)}&body=${encodeURIComponent(e.target.mesaj.value)}` }}
            className="space-y-3"
          >
            <input
              name="konu" type="text" required placeholder="Konu"
              className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              name="mesaj" required placeholder="Mesajınız..." rows={4}
              className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              Gönder
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2 text-center">E-posta uygulamanız açılacaktır.</p>
        </div>

      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-gray-700">
        <p className="font-semibold text-blue-800 mb-1">Ödeme & İade Sorunları</p>
        <p>
          Ödeme veya iade talepleriniz için <strong>adausta@gmail.com</strong> adresine sipariş numaranızı
          belirterek yazabilirsiniz. İadeler ödemenin yapıldığı karta 5–10 iş günü içinde yansır.
        </p>
      </div>
    </div>
  )
}
