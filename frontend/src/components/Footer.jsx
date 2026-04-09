import { Link } from 'react-router-dom'
import { MapPin, Phone, AtSign, Globe, Send } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-blue-950 text-blue-200">
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/ada-usta-logo.png" alt="Ada Usta" className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <div className="text-white font-bold text-lg leading-none">Ada Usta</div>
                <div className="text-blue-400 text-[10px] font-semibold tracking-widest uppercase">HIZLI · GÜVENLİ · USTA</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-blue-300 mb-5">
              Kuzey Kıbrıs Türk Cumhuriyeti'nin en güvenilir usta ve hizmet platformu.
            </p>
            {/* Sosyal medya */}
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 bg-blue-900 hover:bg-blue-500 rounded-lg flex items-center justify-center transition-colors">
                <AtSign size={15} className="text-blue-200" />
              </a>
              <a href="#" className="w-8 h-8 bg-blue-900 hover:bg-blue-500 rounded-lg flex items-center justify-center transition-colors">
                <Globe size={15} className="text-blue-200" />
              </a>
              <a href="#" className="w-8 h-8 bg-blue-900 hover:bg-blue-500 rounded-lg flex items-center justify-center transition-colors">
                <Send size={15} className="text-blue-200" />
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
                  <Phone size={14} className="text-blue-400" />
                  +90 533 426 58 90
                </a>
              </li>
              <li className="flex items-start gap-2 text-blue-300 text-xs leading-relaxed">
                <MapPin size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
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

        <div className="border-t border-blue-900 pt-5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-blue-400">
          <span>© 2026 AdaUsta.com — Tüm hakları saklıdır.</span>
          <span>Kuzey Kıbrıs Türk Cumhuriyeti</span>
        </div>
      </div>
    </footer>
  )
}
