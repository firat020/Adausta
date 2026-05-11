import SEO from '../../components/SEO'

export default function IadePolitikasi() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO baslik="İade ve İptal Politikası" url="/iade-politikasi" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">İade ve İptal Politikası</h1>
      <p className="text-gray-500 text-sm mb-8">Son güncelleme: Nisan 2026 · Adissa Enterprises Ltd.</p>

      <div className="text-gray-700 space-y-6 text-sm leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">1. Platform Üyelik Ücretleri</h2>
          <p>Platform üyeliği şu an ücretsizdir. Ücretli abonelik başlatılması durumunda, abonelik başlangıç tarihinden itibaren <strong>14 gün içinde</strong> herhangi bir gerekçe gösterilmeksizin iptal talep edilebilir ve ücretin tamamı iade edilir.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">2. Hizmet Bedeli İadeleri</h2>
          <p>Usta ile müşteri arasındaki hizmet bedeli ödemeleri, taraflar arasında doğrudan gerçekleşir. Platform bu ödemelere aracılık etmiyorsa iade sorumluluğu platformda değildir.</p>
          <p className="mt-2">Platform üzerinden gerçekleştirilen ödemelerde:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Hizmet başlamadan önce iptal edilirse: <strong>tam iade</strong></li>
            <li>Hizmet başladıktan sonra iptal edilirse: tamamlanan kısım düşülerek kısmi iade</li>
            <li>Hizmet tamamlandıktan sonra: iade yapılmaz, şikayet süreci başlatılır</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">3. İade Süreci</h2>
          <p>İade talepleri <strong>adausta@gmail.com</strong> adresine yazılı olarak iletilir. Onaylanan iadeler, ödemenin yapıldığı kartına <strong>5–10 iş günü</strong> içinde yansır.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">4. Kart ile Yapılan Ödemelerde İade</h2>
          <p>Kredi/banka kartı ile yapılan ödemelerin iadeleri, ödeme kuruluşunun süreçlerine bağlı olarak banka ekstrenizdeki yansıma süresi değişkenlik gösterebilir. Bu süreç bankadan bağımsız olarak platform tarafından kontrol edilemez.</p>
        </section>

      </div>
    </div>
  )
}
