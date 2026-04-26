import { useState, useEffect } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, User, LogOut, Menu, Building2 } from 'lucide-react'
import { benimBilgilerim, cikis as apiCikis } from '../../api'

const menuItems = [
  { to: '/sirket/panel',            icon: LayoutDashboard, label: 'Genel Bakış', end: true },
  { to: '/sirket/panel/talepler',   icon: ClipboardList,   label: 'İş Talepleri' },
  { to: '/sirket/panel/profil',     icon: User,            label: 'Profilim' },
]

export default function SirketPanelLayout() {
  const [acik, setAcik] = useState(false)
  const [kontrol, setKontrol] = useState(true)
  const [kullanici, setKullanici] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    benimBilgilerim()
      .then(r => {
        const k = r.data.kullanici
        if (!k || k.rol !== 'sirket') {
          navigate('/sirket/giris', { replace: true })
        } else {
          setKullanici(k)
          setKontrol(false)
        }
      })
      .catch(() => navigate('/sirket/giris', { replace: true }))
  }, [navigate])

  const handleCikis = async () => {
    await apiCikis()
    navigate('/sirket/giris')
  }

  if (kontrol) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  )

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
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/ada-usta-logo-transparent.webp" alt="Ada Usta" className="h-9 w-auto object-contain" loading="lazy" />
          </div>
          {kullanici && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-xl">
              <p className="text-sm font-semibold text-indigo-800 truncate">{kullanici.email}</p>
              <p className="text-xs text-indigo-500 mt-0.5 flex items-center gap-1">
                <Building2 size={11} /> Şirket Hesabı
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {menuItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setAcik(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }>
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-200">
          <button onClick={handleCikis}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm transition-colors">
            <LogOut size={16} /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* İçerik */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <button onClick={() => setAcik(true)} className="text-gray-600 hover:text-gray-900 p-1.5">
            <Menu size={22} />
          </button>
          <span className="font-bold text-gray-900">Şirket Paneli</span>
          <div className="w-9" />
        </div>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
