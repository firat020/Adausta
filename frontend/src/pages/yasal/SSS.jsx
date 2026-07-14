import SEO from '../../components/SEO'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const sorular = [
  {
    kategori: 'Mağaza',
    items: [
      {
        soru: 'Nasıl sipariş verebilirim?',
        cevap: 'Mağaza sayfasını ziyaret ederek ürünleri inceleyebilir, beğendiğiniz ürünü sepete ekleyebilir ve güvenli ödeme adımını tamamlayarak sipariş verebilirsiniz. Sipariş onayı e-posta ve SMS ile iletilir.',
      },
      {
        soru: 'Bir ürün stokta yoksa ne olur?',
        cevap: 'Stokta olmayan ürünler ürün sayfasında "Stokta Yok" olarak işaretlenir. Ürünün yeniden stoka girmesi için info@adausta.com adresine e-posta göndererek bildirim talebinde bulunabilirsiniz.',
      },
      {
        soru: 'Teslimat ne kadar sürer?',
        cevap: 'KKTC genelinde siparişler onaylandıktan sonra 1–3 iş günü içinde teslim edilir. Yoğun dönemlerde bu süre uzayabilir; sipariş durumunuzu e-posta bildirimlerinden takip edebilirsiniz.',
      },
    ],
  },
  {
    kategori: 'Ödeme',
    items: [
      {
        soru: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
        cevap: 'Kredi kartı ve banka kartı ile ödeme kabul edilmektedir. Tüm Visa, Mastercard ve diğer yaygın kart türleri desteklenmektedir.',
      },
      {
        soru: 'Ödeme güvenli mi?',
        cevap: 'Evet. Tüm ödemeler SSL/TLS şifrelemesiyle korunur ve PCI DSS uyumlu lisanslı ödeme kuruluşları üzerinden gerçekleştirilir. Kart bilgileriniz hiçbir zaman sunucularımızda saklanmaz.',
      },
      {
        soru: 'Ödeme yaparken hata alıyorum, ne yapmalıyım?',
        cevap: 'Önce kart bilgilerinizi kontrol edin ve 3D Secure doğrulamasını tamamladığınızdan emin olun. Sorun devam ederse +90 548 851 07 00 numaralı destek hattımızı arayabilirsiniz.',
      },
    ],
  },
  {
    kategori: 'İptal ve İade',
    items: [
      {
        soru: 'Siparişimi nasıl iptal edebilirim?',
        cevap: 'Fiziksel ürün siparişlerinizi, kargo çıkışı yapılmadan önce +90 548 851 07 00 numaralı hattı arayarak veya info@adausta.com adresine e-posta göndererek iptal edebilirsiniz. Kargo çıktıktan sonra iade süreci uygulanır.',
      },
      {
        soru: 'İade süresi ne kadardır?',
        cevap: 'Fiziksel ürünlerde teslim tarihinden itibaren 14 gün içinde iade talebinde bulunabilirsiniz. Ürünün açılmamış, kullanılmamış ve orijinal ambalajında olması gerekmektedir.',
      },
      {
        soru: 'Para iadesi ne zaman yapılır?',
        cevap: 'İade onaylandıktan sonra 3–5 iş günü içinde ödeme yaptığınız karta iade gerçekleştirilir. Bankanıza bağlı olarak hesabınıza yansıma süresi değişebilir.',
      },
    ],
  },
  {
    kategori: 'Hizmet ve Usta',
    items: [
      {
        soru: 'Usta nasıl bulabilirim?',
        cevap: 'Ana sayfada arama çubuğuna ihtiyaç duyduğunuz hizmet türünü (örn. "Elektrikçi", "Su Tesisatı") yazarak veya Kategoriler menüsünden seçim yaparak size en uygun ustayı bulabilirsiniz. Ustalar; bölge, puanlama ve uzmanlık alanına göre filtrelenebilir.',
      },
      {
        soru: 'Randevu nasıl alınır?',
        cevap: 'Usta profiline girerek "Talep Oluştur" butonuna tıklayın. Hizmet türünü, tercih ettiğiniz tarihi ve adresinizi girerek talebinizi gönderin. Usta talebi onayladığında SMS ve e-posta bildirimi alırsınız.',
      },
      {
        soru: 'Hizmetten memnun kalmazsam ne yapabilirim?',
        cevap: 'Hizmet sonrasında usta için yorum ve puan bırakabilirsiniz. Ciddi bir sorun yaşamanız durumunda, hizmet tamamlanmasından itibaren 7 gün içinde info@adausta.com adresine veya +90 548 851 07 00 numaralı hattımıza başvurabilirsiniz.',
      },
      {
        soru: 'Hizmet bölgem Adausta kapsamında mı?',
        cevap: 'Adausta şu an Lefkoşa, Girne, Gazimağusa, Güzelyurt ve İskele\'de aktif olarak hizmet vermektedir. Bölgeniz kapsam dışındaysa bize bildirin; kademeli genişlememizi takip edin.',
      },
    ],
  },
]

function SSSItem({ soru, cevap }) {
  const [acik, setAcik] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setAcik(!acik)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left bg-white hover:bg-gray-50 transition-colors gap-3"
      >
        <span className="font-medium text-gray-800 text-sm">{soru}</span>
        {acik ? (
          <ChevronUp size={16} className="text-blue-500 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
        )}
      </button>
      {acik && (
        <div className="px-4 pb-4 pt-1 bg-gray-50 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
          {cevap}
        </div>
      )}
    </div>
  )
}

export default function SSS() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO baslik="Sıkça Sorulan Sorular" url="/sss" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Sıkça Sorulan Sorular</h1>
      <p className="text-gray-500 text-sm mb-8">Merak ettiğiniz her şey — Adausta hakkında bilmeniz gerekenler.</p>

      <div className="space-y-8">
        {sorular.map(grup => (
          <div key={grup.kategori}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 pl-1">{grup.kategori}</h2>
            <div className="space-y-2">
              {grup.items.map(item => (
                <SSSItem key={item.soru} soru={item.soru} cevap={item.cevap} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-blue-50 border border-blue-200 rounded-xl p-5">
        <p className="text-gray-700 text-sm font-medium mb-1">Sorunuzu burada bulamadınız mı?</p>
        <p className="text-gray-500 text-sm">
          Bize ulaşın:{' '}
          <a href="tel:+905488510700" className="text-blue-600 hover:underline font-medium">+90 548 851 07 00</a>
          {' '}veya{' '}
          <a href="mailto:info@adausta.com" className="text-blue-600 hover:underline font-medium">info@adausta.com</a>
        </p>
      </div>
    </div>
  )
}
