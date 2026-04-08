import { Link } from 'react-router-dom'
import { MapPin, Phone, Instagram, Facebook, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AU</span>
              </div>
              <div>
                <div className="text-white font-bold text-lg leading-none">AdaUsta</div>
                <div className="text-orange-400 text-[10px] font-semibold tracking-widest uppercase">KKTC</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-500 mb-5">
              Kuzey Kıbrıs Türk Cumhuriyeti'nin en güvenilir usta ve hizmet platformu.
            </p>
            {/* Sosyal medya */}
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-orange-500 rounded-lg flex items-center justify-center transition-colors">
                <Instagram size={15} className="text-gray-300" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-orange-500 rounded-lg flex items-center justify-center transition-colors">
                <Facebook size={15} className="text-gray-300" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-orange-500 rounded-lg flex items-center justify-center transition-colors">
                <Twitter size={15} className="text-gray-300" />
              </a>
            </div>
          </div>

          {/* Hizmetler */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Hizmetler</h4>
            <ul className="space-y-2.5 text-sm">
              {['Elektrikçi', 'Su Tesisatı', 'Boya Badana', 'Klima Servisi', 'Mobilya Montaj', 'Demirci'].map(h => (
                <li key={h}>
                  <Link to={`/ustalar?arama=${h}`} className="hover:text-white transition-colors">{h}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Şehirler */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Şehirler</h4>
            <ul className="space-y-2.5 text-sm">
              {['Lefkoşa', 'Girne', 'Gazimağusa', 'Güzelyurt', 'İskele'].map(s => (
                <li key={s}>
                  <Link to={`/ustalar?sehir=${s}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <MapPin size={12} /> {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">İletişim</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="tel:+905334265890" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone size={14} className="text-orange-400" />
                  +90 533 426 58 90
                </a>
              </li>
              <li className="flex items-start gap-2 text-gray-500 text-xs leading-relaxed">
                <MapPin size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
                KKTC genelinde hizmet
              </li>
            </ul>
            <div className="mt-6 space-y-2">
              <Link to="/kategoriler" className="block hover:text-white text-sm transition-colors">Tüm Hizmetler</Link>
              <Link to="/usta-kayit" className="block hover:text-white text-sm transition-colors">Usta Olarak Kaydol</Link>
              <Link to="/en-yakin" className="block hover:text-white text-sm transition-colors">En Yakın Usta</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <span>© 2026 AdaUsta.com — Tüm hakları saklıdır.</span>
          <span>Kuzey Kıbrıs Türk Cumhuriyeti</span>
        </div>
      </div>
    </footer>
  )
}
