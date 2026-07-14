import SEO from '../../components/SEO'
import { Truck, Wrench, Clock, MapPin, Phone, Mail } from 'lucide-react'

export default function TeslimatHizmetSureci() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO baslik="Teslimat ve Hizmet Süreci" url="/teslimat-ve-hizmet-sureci" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Teslimat ve Hizmet Süreci</h1>
      <p className="text-gray-500 text-sm mb-8">Son güncelleme: Temmuz 2026 · Adissa Enterprises Ltd.</p>

      <div className="prose prose-blue max-w-none text-gray-700 space-y-6 text-sm leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Wrench size={16} className="text-blue-600" />
            1. Hizmet Süreci
          </h2>
          <p className="mb-3">Adausta üzerinden usta/teknik servis hizmeti talep ettiğinizde aşağıdaki adımlar izlenir:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li><strong>Talep Oluşturma:</strong> Müşteri, ihtiyaç duyduğu hizmeti platform üzerinden tarif ederek talep oluşturur.</li>
            <li><strong>Usta Atama:</strong> Sisteme kayıtlı, uygun bölgedeki usta talebe atanır veya müşteri usta listesinden seçim yapar.</li>
            <li><strong>Randevu Belirleme:</strong> Usta ile müşteri, uygun tarih ve saati karşılıklı olarak belirler.</li>
            <li><strong>Hizmet Gerçekleştirilmesi:</strong> Usta belirlenen tarih ve saatte müşterinin adresine giderek hizmeti sunar.</li>
            <li><strong>Müşteri Onayı:</strong> Hizmet tamamlandığında müşteri, hizmetin eksiksiz yapıldığını onaylar.</li>
            <li><strong>Tamamlama ve Değerlendirme:</strong> Sipariş tamamlanır; müşteri isteğe bağlı olarak usta için yorum ve puan bırakabilir.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Truck size={16} className="text-blue-600" />
            2. Fiziksel Ürün Teslimatı
          </h2>
          <p className="mb-3">Mağaza bölümünden satın aldığınız fiziksel ürünler için teslimat süreci:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Teslimat Bölgesi:</strong> Yalnızca Kuzey Kıbrıs Türk Cumhuriyeti (KKTC) genelinde teslimat yapılmaktadır.</li>
            <li><strong>Tahmini Teslimat Süresi:</strong> Siparişiniz onaylandıktan sonra 1–3 iş günü içinde teslim edilir.</li>
            <li><strong>Teslimat Yöntemi:</strong> Ürünler kargo veya kurye aracılığıyla gönderilir. Teslimat detayları sipariş onayı e-postasında bildirilir.</li>
            <li><strong>Hasarlı Ürün Bildirimi:</strong> Teslim aldığınızda ürün hasarlı veya eksik ise, teslimattan itibaren 24 saat içinde <strong>+90 548 851 07 00</strong> numaralı hattı veya <strong>info@adausta.com</strong> adresini aracılığıyla bildirim yapmanız gerekmektedir.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-blue-600" />
            3. Hizmet Bölgeleri
          </h2>
          <p className="mb-3">Adausta şu an aşağıdaki KKTC şehir ve ilçelerinde aktif olarak hizmet vermektedir:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Lefkoşa</li>
            <li>Girne</li>
            <li>Gazimağusa</li>
            <li>Güzelyurt</li>
            <li>İskele</li>
          </ul>
          <p className="mt-3 text-gray-500">Hizmet bölgeleri kademeli olarak genişletilmektedir. Bölgenizde henüz hizmet sunulmuyorsa lütfen bize ulaşın.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            4. Çalışma Saatleri
          </h2>
          <p>Platform üzerinden 7/24 talep oluşturabilirsiniz; ancak ustalarımızın aktif hizmet saatleri şu şekildedir:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Pazartesi – Cumartesi:</strong> 08:00 – 18:00</li>
            <li><strong>Pazar ve Resmi Tatiller:</strong> Acil servis talepleri için iletişime geçiniz.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">5. Destek ve İletişim</h2>
          <p className="mb-3">Teslimat veya hizmet süreciyle ilgili sorularınız için:</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-blue-500 flex-shrink-0" />
              <a href="tel:+905488510700" className="text-blue-600 hover:underline">+90 548 851 07 00</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-blue-500 flex-shrink-0" />
              <a href="mailto:info@adausta.com" className="text-blue-600 hover:underline">info@adausta.com</a>
            </li>
          </ul>
        </section>

      </div>
    </div>
  )
}
