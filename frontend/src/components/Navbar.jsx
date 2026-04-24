import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Menu, X, MapPin, User, LogOut, ChevronDown, Wrench, LayoutDashboard, Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AdaUstaLogo from './AdaUstaLogo'
import DilSecici from './DilSecici'
import { benimBilgilerim, cikis } from '../api'

export default function Navbar() {
  const [menuAcik, setMenuAcik] = useState(false)
  const [kullanici, setKullanici] = useState(null)
  const [profilAcik, setProfilAcik] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const aktif = (path) => location.pathname === path

  useEffect(() => {
    benimBilgilerim().then(r => setKullanici(r.data.kullanici)).catch(() => {})
  }, [location.pathname])

  const handleCikis = async () => {
    await cikis()
    setKullanici(null)
    setProfilAcik(false)
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/ada-usta-logo.webp" alt="Ada Usta" className="h-11 w-auto sm:h-14 object-contain" style={{imageRendering:'crisp-edges'}} />
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
            <Link to="/sirketler"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aktif('/sirketler') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              <Building2 size={14} />
              Şirketler
            </Link>
          </div>

          {/* CTA + Dil */}
          <div className="hidden md:flex items-center gap-2">
            <DilSecici />
            {kullanici && kullanici.rol === 'usta' ? (
              // Usta giriş yapmış
              <div className="relative">
                <button onClick={() => setProfilAcik(!profilAcik)}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors">
                  <Wrench size={14} />
                  <span className="max-w-[120px] truncate">Usta Paneli</span>
                  <ChevronDown size={14} />
                </button>
                {profilAcik && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 w-48 z-50">
                    <Link to="/usta/panel" onClick={() => setProfilAcik(false)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Wrench size={14} /> Panelim
                    </Link>
                    <button onClick={handleCikis}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut size={14} /> Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            ) : kullanici && kullanici.rol === 'sirket' ? (
              // Şirket giriş yapmış
              <div className="relative">
                <button onClick={() => setProfilAcik(!profilAcik)}
                  className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-indigo-700 transition-colors">
                  <Building2 size={14} />
                  <span className="max-w-[120px] truncate">Şirket Paneli</span>
                  <ChevronDown size={14} />
                </button>
                {profilAcik && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 w-48 z-50">
                    <Link to="/sirket/panel" onClick={() => setProfilAcik(false)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Building2 size={14} /> Panelim
                    </Link>
                    <button onClick={handleCikis}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut size={14} /> Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            ) : kullanici && kullanici.rol === 'musteri' ? (
              // Müşteri giriş yapmış
              <div className="relative">
                <button onClick={() => setProfilAcik(!profilAcik)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {kullanici.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{kullanici.email}</span>
                  <ChevronDown size={14} />
                </button>
                {profilAcik && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 w-48 z-50">
                    <Link to="/musteri/panel" onClick={() => setProfilAcik(false)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <LayoutDashboard size={14} /> Panelim
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button onClick={handleCikis}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut size={14} />
                      {t('musteriGiris.cikisYap')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Giriş yapılmamış
              <>
                <Link to="/giris"
                  className="text-gray-600 hover:text-gray-900 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  {t('nav.girisYap')}
                </Link>
                <Link to="/usta/giris"
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 border border-blue-200 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-50 transition-colors">
                  <Wrench size={14} /> Usta Girişi
                </Link>
                <Link to="/usta-kayit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                  Kayıt Ol
                </Link>
              </>
            )}
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
            <Link to="/sirketler" onClick={() => setMenuAcik(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Building2 size={14} /> Şirketler
            </Link>
            <Link to="/en-yakin" onClick={() => setMenuAcik(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <MapPin size={14} /> {t('nav.enYakin')}
            </Link>
            {kullanici?.rol === 'sirket' ? (
              <>
                <Link to="/sirket/panel" onClick={() => setMenuAcik(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50">
                  <Building2 size={14} /> Şirket Paneli
                </Link>
                <button onClick={() => { handleCikis(); setMenuAcik(false) }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50">
                  <LogOut size={14} /> Çıkış Yap
                </button>
              </>
            ) : kullanici?.rol === 'usta' ? (
              <>
                <Link to="/usta/panel" onClick={() => setMenuAcik(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50">
                  <Wrench size={14} /> Usta Paneli
                </Link>
                <button onClick={() => { handleCikis(); setMenuAcik(false) }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50">
                  <LogOut size={14} /> Çıkış Yap
                </button>
              </>
            ) : kullanici?.rol === 'musteri' ? (
              <button onClick={() => { handleCikis(); setMenuAcik(false) }}
                className="mt-1 flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50">
                <LogOut size={14} /> {t('musteriGiris.cikisYap')}
              </button>
            ) : (
              <>
                <Link to="/giris" onClick={() => setMenuAcik(false)} className="px-3 py-2.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50">{t('nav.girisYap')}</Link>
                <Link to="/usta/giris" onClick={() => setMenuAcik(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50">
                  <Wrench size={14} /> Usta Girişi
                </Link>
                <Link to="/usta-kayit" onClick={() => setMenuAcik(false)} className="mt-1 bg-blue-600 text-white text-sm font-semibold px-3 py-2.5 rounded-lg text-center">Kayıt Ol</Link>
                <Link to="/sirket-kayit" onClick={() => setMenuAcik(false)} className="mt-1 bg-indigo-600 text-white text-sm font-semibold px-3 py-2.5 rounded-lg text-center flex items-center gap-2 justify-center">
                  <Building2 size={14} /> Şirket Kaydı
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
