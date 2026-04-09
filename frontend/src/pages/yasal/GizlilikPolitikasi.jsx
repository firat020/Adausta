import SEO from '../../components/SEO'

export default function GizlilikPolitikasi() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO baslik="Gizlilik Politikası" url="/gizlilik" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Gizlilik Politikası</h1>
      <p className="text-gray-500 text-sm mb-8">Son güncelleme: Nisan 2026 · Adissa Enterprises Ltd.</p>

      <div className="prose prose-blue max-w-none text-gray-700 space-y-6 text-sm leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">1. Veri Sorumlusu</h2>
          <p>Bu platform, <strong>Adissa Enterprises Ltd.</strong> ("Şirket") tarafından işletilmektedir. Kişisel verileriniz 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve KKTC ilgili mevzuatı kapsamında korunmaktadır.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">2. Toplanan Veriler</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ad, soyad, telefon numarası, e-posta adresi</li>
            <li>Konum bilgisi (yalnızca "En Yakın Usta" özelliği için, izin verildiğinde)</li>
            <li>IP adresi ve tarayıcı bilgileri (analitik amaçlı)</li>
            <li>Platform üzerinde verilen yorumlar ve puanlar</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">3. Verilerin Kullanım Amacı</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Usta-müşteri eşleştirme hizmetinin sağlanması</li>
            <li>Kullanıcı hesabı yönetimi</li>
            <li>Ödeme işlemlerinin gerçekleştirilmesi</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>Hizmet kalitesinin iyileştirilmesi</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">4. Ödeme Bilgilerinin Güvenliği</h2>
          <p>Kredi kartı ve ödeme bilgileriniz hiçbir zaman sunucularımızda saklanmaz. Tüm ödeme işlemleri, PCI DSS uyumlu lisanslı ödeme kuruluşları aracılığıyla gerçekleştirilir. Kart bilgileriniz SSL/TLS şifrelemesiyle korunur.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">5. Üçüncü Taraflarla Paylaşım</h2>
          <p>Kişisel verileriniz; yasal zorunluluklar, ödeme hizmeti sağlayıcıları ve platform güvenliği dışında üçüncü taraflarla paylaşılmaz, satılmaz veya kiralanmaz.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">6. Çerezler</h2>
          <p>Platform, dil tercihi gibi kullanıcı deneyimini iyileştirmek için çerezler kullanır. Detaylar için <a href="/cerez-politikasi" className="text-blue-600 hover:underline">Çerez Politikamızı</a> inceleyebilirsiniz.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">7. Haklarınız</h2>
          <p>Verilerinize erişim, düzeltme, silme ve işlemeye itiraz hakkına sahipsiniz. Talepleriniz için: <strong>info@adausta.com</strong></p>
        </section>

      </div>
    </div>
  )
}
