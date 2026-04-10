import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import axios from 'axios'
import {
  LayoutDashboard, Users, Star, Tag, LogOut, Menu, X, FileText
} from 'lucide-react'

const API = 'http://localhost:5000'

const menuItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/ustalar', icon: Users, label: 'Ustalar' },
  { to: '/admin/yorumlar', icon: Star, label: 'Yorumlar' },
  { to: '/admin/kategoriler', icon: Tag, label: 'Kategoriler' },
  { to: '/admin/loglar', icon: FileText, label: 'İşlem Logu' },
]

export default function AdminLayout() {
  const [acik, setAcik] = useState(false)
  const navigate = useNavigate()

  const cikis = async () => {
    await axios.post(`${API}/api/auth/cikis`, {}, { withCredentials: true })
    navigate('/admin/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#1e3a5f] text-white flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${acik ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Adausta</h1>
            <p className="text-xs text-white/60">Admin Paneli</p>
          </div>
          <button onClick={() => setAcik(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setAcik(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={cikis}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white w-full transition"
          >
            <LogOut size={18} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {acik && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setAcik(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setAcik(true)}>
            <Menu size={22} className="text-[#1e3a5f]" />
          </button>
          <h1 className="font-bold text-[#1e3a5f]">Adausta Admin</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
