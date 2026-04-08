import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, MapPin, ChevronDown } from 'lucide-react'

export default function Navbar() {
  const [menuAcik, setMenuAcik] = useState(false)
  const location = useLocation()

  const aktif = (path) => location.pathname === path

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base tracking-tight">AU</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-gray-900 text-lg tracking-tight">AdaUsta</span>
              <span className="text-orange-500 text-[10px] font-semibold tracking-widest uppercase">KKTC</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/kategoriler"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aktif('/kategoriler') ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              Hizmetler
            </Link>
            <Link to="/ustalar"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aktif('/ustalar') ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              Ustalar
            </Link>
            <Link to="/en-yakin"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aktif('/en-yakin') ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              <MapPin size={14} />
              En Yakın Usta
            </Link>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/usta-kayit"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
              Usta Kaydı
            </Link>
          </div>

          {/* Mobil */}
          <button onClick={() => setMenuAcik(!menuAcik)} className="md:hidden text-gray-500 hover:text-gray-900">
            {menuAcik ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobil menü */}
        {menuAcik && (
          <div className="md:hidden py-3 border-t border-gray-100 flex flex-col gap-1">
            <Link to="/kategoriler" onClick={() => setMenuAcik(false)} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Hizmetler</Link>
            <Link to="/ustalar" onClick={() => setMenuAcik(false)} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Ustalar</Link>
            <Link to="/en-yakin" onClick={() => setMenuAcik(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <MapPin size={14} /> En Yakın Usta
            </Link>
            <Link to="/usta-kayit" onClick={() => setMenuAcik(false)} className="mt-1 bg-orange-500 text-white text-sm font-semibold px-3 py-2.5 rounded-lg text-center">Usta Kaydı</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
