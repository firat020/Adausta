import { useState, useEffect } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, ClipboardList, User, BarChart2,
  LogOut, Menu, Wrench, ToggleLeft, ToggleRight, Star
} from 'lucide-react'
import { benimBilgilerim, cikis as apiCikis, ustaPanelMusaitlik } from '../../api'

const menuItems = [
  { to: '/usta/panel',          icon: LayoutDashboard, label: 'Genel Bakış',    end: true },
  { to: '/usta/panel/talepler', icon: ClipboardList,   label: 'İş Talepleri' },
  { to: '/usta/panel/musteriler', icon: Users,         label: 'Müşterilerim' },
  { to: '/usta/panel/istatistik', icon: BarChart2,     label: 'İstatistikler' },
  { to: '/usta/panel/yorumlar',  icon: Star,           label: 'Yorumlar' },
  { to: '/usta/panel/profil',    icon: User,           label: 'Profilim' },
]

export default function UstaPanelLayout() {
  const [acik, setAcik] = useState(false)
  const [kontrol, setKontrol] = useState(true)
  const [kullanici, setKullanici] = useState(null)
  const [musaitlik, setMusaitlik] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    benimBilgilerim()
      .then(r => {
        const k = r.data.kullanici
        if (!k || k.rol !== 'usta') {
          navigate('/usta/giris', { replace: true })
        } else {
          setKullanici(k)
          setKontrol(false)
        }
      })
      .catch(() => navigate('/usta/giris', { replace: true }))
  }, [navigate])

  const handleCikis = async () => {
    await apiCikis()
    navigate('/usta/giris')
  }

  const toggleMusaitlik = async () => {
    try {
      const yeni = !musaitlik
      await ustaPanelMusaitlik(yeni)
      setMusaitlik(yeni)
    } catch {}
  }

  if (kontrol) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {acik && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setAcik(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0
        fixed inset-y-0 left-0 z-50 transition-transform duration-300
        md:static md:z-auto md:translate-x-0 shadow-lg
        ${acik ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/header-logo.png" alt="Ada Usta" className="h-16 w-auto object-contain" />
          </div>
          {kullanici && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-sm font-semibold text-blue-800 truncate">{kullanici.email}</p>
              <p className="text-xs text-blue-500 mt-0.5">Usta Hesabı</p>
            </div>
          )}
        </div>

        {/* Müsaitlik toggle */}
        <div className="px-4 py-3 border-b border-gray-100">
          <button
            onClick={toggleMusaitlik}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              musaitlik
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-gray-50 text-gray-500 border border-gray-200'
            }`}
          >
            <span>{musaitlik ? 'Müsaitim ✓' : 'Müsait Değilim'}</span>
            {musaitlik
              ? <ToggleRight size={22} className="text-green-600" />
              : <ToggleLeft size={22} className="text-gray-400" />
            }
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {menuItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setAcik(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Çıkış */}
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={handleCikis}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm transition-colors"
          >
            <LogOut size={16} /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* İçerik */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <button onClick={() => setAcik(true)} className="text-gray-600 hover:text-gray-900 p-1.5">
            <Menu size={22} />
          </button>
          <span className="font-bold text-gray-900">Usta Paneli</span>
          <div className="w-9" />
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
