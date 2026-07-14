import SEO from '../../components/SEO'
import { Link } from 'react-router-dom'

export default function OnBilgilendirmeFormu() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO baslik="Ön Bilgilendirme Formu" url="/on-bilgilendirme-formu" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Ön Bilgilendirme Formu</h1>
      <p className="text-gray-500 text-sm mb-8">Mesafeli Sözleşmeler Yönetmeliği kapsamında hazırlanmıştır · Adissa Enterprises Ltd.</p>

      <div className="prose prose-blue max-w-none text-gray-700 space-y-6 text-sm leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">1. Satıcı Bilgileri</h2>
          <ul className="list-none pl-0 space-y-1">
            <li><strong>Ticaret Unvanı:</strong> Adissa Enterprises Ltd.</li>
            <li><strong>Ülke:</strong> Kuzey Kıbrıs Türk Cumhuriyeti (KKTC)</li>
            <li><strong>Telefon:</strong> <a href="tel:+905488510700" className="text-blue-600 hover:underline">+90 548 851 07 00</a></li>
            <li><strong>E-posta:</strong> <a href="mailto:info@adausta.com" className="text-blue-600 hover:underline">info@adausta.com</a></li>
            <li><strong>Web Sitesi:</strong> <a href="https://adausta.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">adausta.com</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">2. Ürün / Hizmet Bilgileri</h2>
          <p>Sipariş verilen ürün veya hizmetin detayları (ad, özellik, miktar, fiyat), sipariş tamamlama ekranında müşteriye açıkça gösterilir. İşbu form, genel bilgilendirme amacıyla sunulmaktadır; belirli ürün/hizmet özellikleri her sipariş özelinde belirlenir.</p>
          <p className="mt-2">Adausta platformu üzerinden hem fiziksel ürün siparişi hem de usta/teknik servis hizmeti satın alınabilmektedir.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">3. Ödeme Şekli ve Toplam Fiyat</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Toplam ödeme tutarı (KDV ve varsa kargo dahil) sipariş özet ekranında gösterilir.</li>
            <li>Ödeme, kredi kartı veya banka kartı ile güvenli ödeme altyapısı üzerinden gerçekleştirilir.</li>
            <li>Kart bilgileriniz hiçbir şekilde sistemimizde saklanmaz; tüm işlemler PCI DSS uyumlu ödeme kuruluşları aracılığıyla yürütülür.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">4. Teslimat / Hizmet Sunumu</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Fiziksel ürünler</strong> için teslimat süresi siparişin onaylanmasından itibaren 1–3 iş günüdür. Teslimat yalnızca KKTC genelinde yapılmaktadır.</li>
            <li><strong>Hizmetler</strong> için usta atama ve randevu süreci, talep oluşturulmasının ardından başlar. Hizmet tarihi müşteri ile usta arasında karşılıklı belirlenir.</li>
            <li>Daha fazla bilgi için <Link to="/teslimat-ve-hizmet-sureci" className="text-blue-600 hover:underline">Teslimat ve Hizmet Süreci</Link> sayfamızı inceleyebilirsiniz.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">5. Garanti Bilgileri</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fiziksel ürünlerde üretici garantisi geçerlidir; ürüne ait garanti süresi ve koşulları ürün sayfasında belirtilir.</li>
            <li>Hizmetlerde, yapılan işe ilişkin olası sorunlar için 7 gün içinde bildirim yapılması durumunda değerlendirme yapılır.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">6. Cayma Hakkı</h2>
          <p>Tüketici, herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmenin kurulduğu tarihten itibaren <strong>14 (on dört) gün</strong> içinde cayma hakkını kullanabilir.</p>
          <p className="mt-2">Cayma hakkının kullanılabilmesi için aşağıdaki şartlar aranır:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Fiziksel ürünlerin, teslim alındığı tarihten itibaren 14 gün içinde iade edilmesi.</li>
            <li>Ürünün açılmamış, kullanılmamış ve orijinal ambalajında olması.</li>
            <li>Hizmet başlamadan önce iptal bildiriminin yapılması.</li>
          </ul>
          <p className="mt-3">
            Cayma hakkının istisnaları ve ayrıntılı iptal/iade koşulları için{' '}
            <Link to="/iptal-iade-politikasi" className="text-blue-600 hover:underline">İptal ve İade Politikamızı</Link> inceleyiniz.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">7. Uyuşmazlık Çözümü</h2>
          <p>Tüketici şikâyetleri ve uyuşmazlıklarında KKTC Tüketici Hakları mevzuatı çerçevesinde yetkili tüketici hakem heyetleri ve mahkemeler yetkilidir.</p>
        </section>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
          <p className="text-blue-800 text-xs leading-relaxed">
            Bu form, sipariş tamamlamadan önce tüketicinin bilgilendirilmesi amacıyla yasal zorunluluk kapsamında sunulmaktadır. Siparişi onaylayarak bu formda yer alan bilgileri okuduğunuzu ve kabul ettiğinizi beyan edersiniz.
          </p>
        </div>

      </div>
    </div>
  )
}
