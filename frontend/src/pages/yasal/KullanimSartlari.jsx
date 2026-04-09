import SEO from '../../components/SEO'

export default function KullanimSartlari() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO baslik="Kullanım Şartları" url="/kullanim-sartlari" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Kullanım Şartları</h1>
      <p className="text-gray-500 text-sm mb-8">Son güncelleme: Nisan 2026 · Adissa Enterprises Ltd.</p>

      <div className="prose max-w-none text-gray-700 space-y-6 text-sm leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">1. Taraflar</h2>
          <p>Bu sözleşme, <strong>Adissa Enterprises Ltd.</strong> ("Platform") ile platforma kayıtlı veya platformu kullanan kişi veya kuruluş ("Kullanıcı") arasında akdedilmiştir.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">2. Hizmetin Tanımı</h2>
          <p>Ada Usta, Kuzey Kıbrıs genelinde usta ve hizmet arayanları bir araya getiren çevrimiçi bir pazar yeri platformudur. Platform; usta-müşteri arasındaki iş ilişkisine taraf değildir, yalnızca aracılık hizmeti sunar.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">3. Usta Kayıt Kuralları</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Platformda yer alan bilgilerin doğru ve güncel olması zorunludur.</li>
            <li>Sahte yorum, puan veya bilgi girişi hesap iptali ile sonuçlanır.</li>
            <li>Platformun onayı olmadan listeleme içerikleri kopyalanamaz.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">4. Ödeme ve Komisyon</h2>
          <p>Platform üyeliği ücretsizdir. Platformun ileride uygulayabileceği komisyon veya abonelik ücretleri önceden kullanıcılara bildirilir. Tüm ödemeler SSL ile şifrelenmiş güvenli altyapı üzerinden gerçekleştirilir.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">5. Sorumluluk Reddi</h2>
          <p>Platform, ustalar tarafından verilen hizmetin kalitesi, zamanında teslimi veya güvenliği konusunda garanti vermez. Kullanıcılar arasındaki anlaşmazlıklar tarafların kendi aralarında çözüme kavuşturulur.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">6. Fikri Mülkiyet</h2>
          <p>Ada Usta logosu, tasarımı ve içerikleri Adissa Enterprises Ltd.'ye aittir. İzinsiz kullanım yasaktır.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">7. Uygulanacak Hukuk</h2>
          <p>Bu sözleşme KKTC hukuku kapsamında yorumlanır. Uyuşmazlıklarda Lefkoşa Mahkemeleri yetkilidir.</p>
        </section>

      </div>
    </div>
  )
}
