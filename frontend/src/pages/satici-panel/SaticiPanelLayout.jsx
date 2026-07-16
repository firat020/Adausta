import { useState, useEffect } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import axios from 'axios'
import {
  LayoutDashboard, ShoppingBag, Package, Store, Users,
  FileText, Wallet, LogOut, Menu, X, RotateCcw, BadgeDollarSign
} from 'lucide-react'
import API from '../../config.js'

const menuItems = [
  { to: '/satici/panel',     icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/satici/urunler',   icon: ShoppingBag,     label: 'Ürünlerim' },
  { to: '/satici/siparisler',icon: Package,         label: 'Siparişler',  siparisBadge: true },
  { to: '/satici/magazam',   icon: Store,           label: 'Mağazam' },
  { to: '/satici/personel',  icon: Users,           label: 'Personel' },
  { to: '/satici/bakiye',    icon: Wallet,          label: 'Bakiyem' },
  { to: '/satici/iadeler',   icon: RotateCcw,       label: 'İadeler' },
  { to: '/satici/hakedisler',icon: BadgeDollarSign, label: 'Hakedişler' },
]

export default function SaticiPanelLayout() {
  const [acik, setAcik] = useState(false)
  const [kontrol, setKontrol] = useState(true)
  const [magaza, setMagaza] = useState(null)
  const [bekleyenSiparis, setBekleyenSiparis] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get(`${API}/api/satici-panel/ben`, { withCredentials: true })
      .then(r => {
        setMagaza(r.data.magaza)
        setBekleyenSiparis(r.data.bekleyen_siparis || 0)
        setKontrol(false)
      })
      .catch(() => {
        navigate('/satici/giris', { replace: true })
      })
  }, [navigate])

  const handleCikis = async () => {
    await axios.post(`${API}/api/auth/cikis`, {}, { withCredentials: true })
    navigate('/satici/giris')
  }

  if (kontrol) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0052CC]" />
      </div>
    )
  }

  return (
    <div className="flex h-screen h-dvh bg-gray-100 overflow-hidden">
      {acik && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setAcik(false)} />
      )}

      <aside className={`
        w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0
        fixed inset-y-0 left-0 z-50 transition-transform duration-300
        md:static md:z-auto md:translate-x-0 shadow-lg
        ${acik ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <img src="/ada-usta-logo-transparent.webp" alt="Ada Usta" className="h-9 w-auto object-contain" loading="lazy" />
            <button className="md:hidden text-gray-400 hover:text-gray-600" onClick={() => setAcik(false)}>
              <X size={20} />
            </button>
          </div>
          {magaza && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-sm font-semibold text-blue-800 truncate">{magaza.magaza_adi}</p>
              <p className="text-xs text-blue-500 mt-0.5">Satıcı Paneli</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {menuItems.map(({ to, icon: Icon, label, end, siparisBadge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setAcik(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#0052CC] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className="flex-1">{label}</span>
                  {siparisBadge && bekleyenSiparis > 0 && (
                    <span className="bg-amber-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {bekleyenSiparis}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={handleCikis}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm transition-colors"
          >
            <LogOut size={16} /> Çıkış Yap
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <button onClick={() => setAcik(true)} className="text-gray-600 hover:text-gray-900 p-2.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu size={22} />
          </button>
          <span className="font-bold text-gray-900">Satıcı Paneli</span>
          <div className="w-9" />
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
