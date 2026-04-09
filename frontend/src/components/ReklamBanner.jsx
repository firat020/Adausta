import { ExternalLink, Phone } from 'lucide-react'

// Reklam slotları — gerçek firma logosu/bilgisi buraya gelecek
const REKLAMLAR = [
  {
    id: 1,
    firma: 'Kıbrıs Yapı Market',
    slogan: 'İnşaat & Tadilat Malzemeleri',
    aciklama: 'Lefkoşa\'nın en büyük yapı market zinciri. Boya, fayans, beton, demir ve daha fazlası.',
    renk: 'from-blue-700 to-blue-500',
    harf: 'K',
    telefon: '+90 392 000 00 01',
    gorsel: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&h=200&fit=crop&auto=format',
  },
  {
    id: 2,
    firma: 'Ada Elektrik',
    slogan: 'Elektrik Malzeme & Ekipman',
    aciklama: 'KKTC\'nin lider elektrik malzeme tedarikçisi. Kablo, pano, aydınlatma ürünleri.',
    renk: 'from-cyan-700 to-cyan-500',
    harf: 'A',
    telefon: '+90 392 000 00 02',
    gorsel: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop&auto=format',
  },
  {
    id: 3,
    firma: 'Girne Klima Merkezi',
    slogan: 'Klima Satış & Servis',
    aciklama: 'Tüm marka klima, ısı pompası satış, montaj ve bakım hizmetleri. Garantili servis.',
    renk: 'from-indigo-700 to-indigo-500',
    harf: 'G',
    telefon: '+90 392 000 00 03',
    gorsel: 'https://images.unsplash.com/photo-1631634601969-6e4a66c1e7fa?w=300&h=200&fit=crop&auto=format',
  },
]

export default function ReklamBanner() {
  return (
    <section className="bg-gray-50 border-y border-gray-100 py-10 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Başlık */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-300 px-2 py-0.5 rounded">
              SPONSORLU
            </span>
            <span className="text-base font-bold text-gray-800">KKTC'de Öne Çıkan Firmalar</span>
          </div>
          <a href="mailto:reklam@adausta.com"
            className="text-xs text-blue-600 hover:underline font-medium">
            Reklam vermek istiyorum →
          </a>
        </div>

        {/* Reklam kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {REKLAMLAR.map(r => (
            <div key={r.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">

              {/* Üst fotoğraf */}
              <div className="relative h-32 overflow-hidden">
                <img src={r.gorsel} alt={r.firma}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                {/* Logo alanı */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.renk} flex items-center justify-center text-white font-extrabold text-lg shadow-lg`}>
                    {r.harf}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-none">{r.firma}</p>
                    <p className="text-white/80 text-xs mt-0.5">{r.slogan}</p>
                  </div>
                </div>
              </div>

              {/* İçerik */}
              <div className="p-4">
                <p className="text-gray-500 text-xs leading-relaxed mb-4">{r.aciklama}</p>
                <div className="flex gap-2">
                  <a href={`tel:${r.telefon.replace(/\s/g, '')}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                    <Phone size={12} />
                    {r.telefon}
                  </a>
                  <button className="w-9 flex items-center justify-center border border-gray-200 hover:border-blue-300 rounded-lg transition-colors">
                    <ExternalLink size={13} className="text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Alt bilgi */}
        <p className="text-center text-xs text-gray-400 mt-5">
          Firmanızı burada tanıtmak için{' '}
          <a href="mailto:reklam@adausta.com" className="text-blue-500 hover:underline">
            reklam@adausta.com
          </a>{' '}
          adresine yazın · Fiyat: $49/ay
        </p>
      </div>
    </section>
  )
}
