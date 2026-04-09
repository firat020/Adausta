import SEO from '../../components/SEO'

export default function MesafeliSatis() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO baslik="Mesafeli Satış Sözleşmesi" url="/mesafeli-satis" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Mesafeli Satış Sözleşmesi</h1>
      <p className="text-gray-500 text-sm mb-8">Son güncelleme: Nisan 2026 · Adissa Enterprises Ltd.</p>

      <div className="text-gray-700 space-y-6 text-sm leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">MADDE 1 — SATICI BİLGİLERİ</h2>
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className="border-b border-gray-100"><td className="py-1.5 font-medium w-36">Ticari Unvan</td><td>Adissa Enterprises Ltd.</td></tr>
              <tr className="border-b border-gray-100"><td className="py-1.5 font-medium">Platform</td><td>Ada Usta (adausta.com)</td></tr>
              <tr className="border-b border-gray-100"><td className="py-1.5 font-medium">Faaliyet Alanı</td><td>Kuzey Kıbrıs Türk Cumhuriyeti</td></tr>
              <tr className="border-b border-gray-100"><td className="py-1.5 font-medium">E-posta</td><td>info@adausta.com</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">MADDE 2 — KONU</h2>
          <p>Bu sözleşme, Alıcının Ada Usta platformu üzerinden satın aldığı hizmet veya abonelik paketlerine ilişkin tarafların hak ve yükümlülüklerini belirler.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">MADDE 3 — SİPARİŞ VE ÖDEME</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ödemeler SSL/TLS şifrelemesiyle güvenli altyapı üzerinden alınır.</li>
            <li>Kredi/banka kartı bilgileri platformumuzda saklanmaz; PCI DSS uyumlu ödeme kuruluşlarına aktarılır.</li>
            <li>Sipariş onayı e-posta ile iletilir.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">MADDE 4 — CAYMA HAKKI</h2>
          <p>Alıcı, hizmetin ifasına başlanmamış olması koşuluyla, sözleşme tarihinden itibaren <strong>14 (on dört) gün içinde</strong> herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.</p>
          <p className="mt-2">Cayma hakkı kullanımı için: <strong>info@adausta.com</strong> adresine yazılı bildirim yeterlidir.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">MADDE 5 — İADE</h2>
          <p>Cayma bildirimi alındıktan itibaren <strong>14 gün içinde</strong> ödeme iade edilir. İade, ödemenin yapıldığı kartına veya hesabına gerçekleştirilir.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">MADDE 6 — UYUŞMAZLIK ÇÖZÜMÜ</h2>
          <p>Bu sözleşmeden doğan uyuşmazlıklarda önce platform ile yazışma yolu denenir. Çözüme kavuşturulamazsa KKTC Tüketici Mahkemeleri veya Lefkoşa Mahkemeleri yetkilidir.</p>
        </section>

      </div>
    </div>
  )
}
