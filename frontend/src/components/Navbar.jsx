import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AdaUstaLogo from './AdaUstaLogo'
import DilSecici from './DilSecici'

export default function Navbar() {
  const [menuAcik, setMenuAcik] = useState(false)
  const location = useLocation()
  const { t } = useTranslation()

  const aktif = (path) => location.pathname === path

  return (
    <nav className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/ada-usta-logo.png"
              alt="Ada Usta"
              className="w-10 h-10 rounded-xl object-cover"
            />
            <div className="flex flex-col leading-none">
              <span className="font-bold text-gray-900 text-lg tracking-tight">Ada Usta</span>
              <span className="text-blue-500 text-[10px] font-semibold tracking-widest uppercase">HIZLI · GÜVENLİ · USTA</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/kategoriler"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aktif('/kategoriler') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              {t('nav.hizmetler')}
            </Link>
            <Link to="/ustalar"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aktif('/ustalar') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              {t('nav.ustalar')}
            </Link>
            <Link to="/en-yakin"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aktif('/en-yakin') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              <MapPin size={14} />
              {t('nav.enYakin')}
            </Link>
          </div>

          {/* CTA + Dil */}
          <div className="hidden md:flex items-center gap-2">
            <DilSecici />
            <Link to="/usta-kayit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
              {t('nav.ustaKayit')}
            </Link>
          </div>

          {/* Mobil */}
          <div className="md:hidden flex items-center gap-2">
            <DilSecici />
            <button onClick={() => setMenuAcik(!menuAcik)} className="text-gray-500 hover:text-gray-900">
              {menuAcik ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobil menü */}
        {menuAcik && (
          <div className="md:hidden py-3 border-t border-gray-100 flex flex-col gap-1">
            <Link to="/kategoriler" onClick={() => setMenuAcik(false)} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t('nav.hizmetler')}</Link>
            <Link to="/ustalar" onClick={() => setMenuAcik(false)} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t('nav.ustalar')}</Link>
            <Link to="/en-yakin" onClick={() => setMenuAcik(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <MapPin size={14} /> {t('nav.enYakin')}
            </Link>
            <Link to="/usta-kayit" onClick={() => setMenuAcik(false)} className="mt-1 bg-blue-600 text-white text-sm font-semibold px-3 py-2.5 rounded-lg text-center">{t('nav.ustaKayit')}</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
