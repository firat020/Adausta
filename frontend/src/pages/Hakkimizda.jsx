import SEO from '../components/SEO'
import { MapPin, Phone, AtSign, Globe } from 'lucide-react'

export default function Hakkimizda() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO baslik="Hakkımızda" url="/hakkimizda" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Hakkımızda</h1>
      <p className="text-gray-500 text-sm mb-8">Adissa Enterprises Ltd. · Ada Usta Platformu</p>

      <div className="prose prose-blue max-w-none text-gray-700 space-y-8 text-sm leading-relaxed">

        <section className="bg-blue-50 border border-blue-100 rounded-xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">Ada Usta Nedir?</h2>
          <p>
            Ada Usta, Kuzey Kıbrıs Türk Cumhuriyeti'nde faaliyet gösteren bir usta bulma ve randevu platformudur.
            Elektrikçi, tesisatçı, marangoz, klima teknisyeni ve daha pek çok hizmet sektöründe çalışan
            ustalara ulaşmayı kolaylaştırır. Platform; usta ve müşteri arasında güvenli bir köprü kurarak
            her iki tarafın da süreçten memnun ayrılmasını hedefler.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">Şirket Bilgileri</h2>
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 font-semibold text-gray-600 w-40">Ticari Unvan</td>
                <td className="py-2">Adissa Enterprises Ltd.</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 font-semibold text-gray-600">Platform Adı</td>
                <td className="py-2">Ada Usta</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 font-semibold text-gray-600">Web Sitesi</td>
                <td className="py-2">
                  <a href="https://adausta.com" className="text-blue-600 hover:underline">adausta.com</a>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 font-semibold text-gray-600">E-posta</td>
                <td className="py-2">
                  <a href="mailto:info@adausta.com" className="text-blue-600 hover:underline">info@adausta.com</a>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 font-semibold text-gray-600">Telefon</td>
                <td className="py-2">
                  <a href="tel:+905334265890" className="text-blue-600 hover:underline">+90 533 426 58 90</a>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 font-semibold text-gray-600">Faaliyet Alanı</td>
                <td className="py-2">Kuzey Kıbrıs Türk Cumhuriyeti (KKTC)</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">Misyonumuz</h2>
          <p>
            Kıbrıs'ta kaliteli usta bulmak zaman alıcı ve belirsiz bir süreç olmaktan çıksın istiyoruz.
            Ada Usta ile müşteriler ihtiyaç duydukları ustayı dakikalar içinde bulabilir,
            ustalar ise yeni müşterilere kolayca ulaşabilir.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">Ödeme Güvenliği</h2>
          <p>
            Platform üzerindeki tüm ödeme işlemleri, <strong>Garanti BBVA Sanal POS</strong> altyapısı
            üzerinden SSL/TLS şifrelemesiyle güvenle gerçekleştirilir. Kart bilgileriniz
            hiçbir şekilde sistemlerimizde saklanmaz. 3D Secure (3DS) doğrulaması zorunlu tutulmaktadır.
          </p>
        </section>

      </div>
    </div>
  )
}
