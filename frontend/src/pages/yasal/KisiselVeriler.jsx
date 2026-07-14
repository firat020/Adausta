import SEO from '../../components/SEO'

export default function KisiselVeriler() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO baslik="Kişisel Veriler" url="/kisisel-veriler" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Kişisel Veriler</h1>
      <p className="text-gray-500 text-sm mb-8">KVKK kapsamında aydınlatma metni · Son güncelleme: Temmuz 2026 · Adissa Enterprises Ltd.</p>

      <div className="prose prose-blue max-w-none text-gray-700 space-y-6 text-sm leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">1. Veri Sorumlusu</h2>
          <p>
            Kişisel verileriniz, <strong>Adissa Enterprises Ltd.</strong> ("Şirket") tarafından 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve KKTC ilgili mevzuatı çerçevesinde işlenmektedir. Şirket, veri sorumlusu sıfatıyla hareket etmektedir.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">2. İşlenen Kişisel Veriler</h2>
          <p className="mb-2">Platform kullanımınız sırasında aşağıdaki kişisel veriler işlenebilmektedir:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Kimlik Bilgileri:</strong> Ad, soyad</li>
            <li><strong>İletişim Bilgileri:</strong> Telefon numarası, e-posta adresi</li>
            <li><strong>Adres Bilgileri:</strong> Hizmet veya teslimat adresi</li>
            <li><strong>Ödeme Bilgileri:</strong> Ödeme işlemi gerçekleştirilmesi için gerekli bilgiler (kredi/banka kartı verileri sunucularımızda <strong>saklanmaz</strong>; tüm işlemler PCI DSS uyumlu ödeme kuruluşları üzerinden yürütülür)</li>
            <li><strong>Kullanım Verileri:</strong> IP adresi, tarayıcı türü, platform üzerindeki etkileşimler (analitik amaçlı)</li>
            <li><strong>Konum Bilgisi:</strong> Yalnızca "En Yakın Usta" özelliği için ve kullanıcı izniyle</li>
            <li><strong>Yorum ve Puanlar:</strong> Platform üzerinde usta/hizmet için bırakılan değerlendirmeler</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">3. Kişisel Veri İşleme Amaçları</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Usta-müşteri eşleştirme hizmetinin sağlanması ve yönetilmesi</li>
            <li>Kullanıcı hesabının oluşturulması ve yönetimi</li>
            <li>Sipariş ve ödeme işlemlerinin gerçekleştirilmesi</li>
            <li>Fiziksel ürün teslimatının yapılması</li>
            <li>Müşteri desteği ve şikâyet yönetimi</li>
            <li>Hizmet kalitesinin ölçülmesi ve iyileştirilmesi</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>İzin verilen durumlarda e-bülten ve kampanya iletişimi</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">4. Hukuki Dayanak</h2>
          <p>Kişisel verileriniz aşağıdaki hukuki dayanaklar çerçevesinde işlenmektedir:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Sözleşmenin kurulması ve ifası (KVKK m. 5/2-c)</li>
            <li>Yasal yükümlülüğün yerine getirilmesi (KVKK m. 5/2-ç)</li>
            <li>Meşru menfaat (KVKK m. 5/2-f) — platform güvenliği, analitik</li>
            <li>Açık rıza (KVKK m. 5/1) — pazarlama iletişimi ve isteğe bağlı konum paylaşımı</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">5. Üçüncü Taraflarla Paylaşım</h2>
          <p>Kişisel verileriniz;</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Hizmet alacağınız usta veya şirket (yalnızca randevu/iletişim için gerekli veriler)</li>
            <li>Ödeme hizmeti sağlayıcıları</li>
            <li>Kargo ve kurye firmaları (fiziksel teslimat durumunda)</li>
            <li>Yasal yükümlülük kapsamında yetkili kamu kuruluşları</li>
          </ul>
          <p className="mt-2">dışında hiçbir üçüncü tarafla paylaşılmaz, satılmaz veya kiralanmaz.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">6. Veri Saklama Süresi</h2>
          <p>Kişisel verileriniz; işleme amacının ortadan kalkmasına, yasal saklama sürelerinin dolmasına veya talebiniz üzerine silinmesine kadar muhafaza edilir. Ödeme ve fatura kayıtları yasal zorunluluk kapsamında 10 yıl saklanır.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">7. Haklarınız</h2>
          <p className="mb-2">KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Erişim Hakkı:</strong> İşlenen verileriniz hakkında bilgi talep etme</li>
            <li><strong>Düzeltme Hakkı:</strong> Yanlış veya eksik verilerin düzeltilmesini isteme</li>
            <li><strong>Silme Hakkı:</strong> Belirli koşullar altında verilerinizin silinmesini talep etme</li>
            <li><strong>İşlemeyi Kısıtlama:</strong> Veri işlemenin sınırlandırılmasını talep etme</li>
            <li><strong>İtiraz Hakkı:</strong> Meşru menfaate dayalı veri işlemeye itiraz etme</li>
            <li><strong>Taşınabilirlik:</strong> Verilerinizin yapılandırılmış formatta teslimini isteme</li>
          </ul>
          <p className="mt-3">
            Taleplerinizi <a href="mailto:info@adausta.com" className="text-blue-600 hover:underline">info@adausta.com</a> adresine iletebilirsiniz. Başvurular en geç 30 gün içinde yanıtlanır.
          </p>
        </section>

      </div>
    </div>
  )
}
