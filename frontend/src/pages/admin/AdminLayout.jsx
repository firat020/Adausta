import { useState, useEffect } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import axios from 'axios'
import {
  LayoutDashboard, Users, Star, Tag, LogOut, Menu, FileText, ShieldOff, BarChart2, Megaphone,
  CreditCard, PackageCheck, Wallet, Power, PowerOff
} from 'lucide-react'

import API from '../../config.js'
// API

const menuItems = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/analitik',     icon: BarChart2,       label: 'Analitik & Rapor' },
  { to: '/admin/ustalar',      icon: Users,           label: 'Usta Yönetimi' },
  { to: '/admin/kara-liste',   icon: ShieldOff,       label: 'Kara Liste' },
  { to: '/admin/planlar',      icon: PackageCheck,    label: 'Plan Yönetimi' },
  { to: '/admin/abonelikler',  icon: CreditCard,      label: 'Abonelik Takibi' },
  { to: '/admin/odemeler',     icon: Wallet,          label: 'Ödeme Geçmişi' },
  { to: '/admin/yorumlar',     icon: Star,            label: 'Yorumlar' },
  { to: '/admin/kategoriler',  icon: Tag,             label: 'Kategoriler' },
  { to: '/admin/reklamlar',    icon: Megaphone,       label: 'Reklam Yönetimi' },
  { to: '/admin/loglar',       icon: FileText,        label: 'İşlem Logu' },
]

export default function AdminLayout() {
  const [acik, setAcik] = useState(false)
  const [kontrol, setKontrol] = useState(true)
  const [bakimModu, setBakimModu] = useState(false)
  const [bakimYukleniyor, setBakimYukleniyor] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get(`${API}/api/auth/ben`, { withCredentials: true })
      .then(r => {
        if (r.data.kullanici?.rol !== 'admin') {
          navigate('/admin/login', { replace: true })
        } else {
          setKontrol(false)
        }
      })
      .catch(() => navigate('/admin/login', { replace: true }))
    axios.get(`${API}/api/ayarlar/bakim`)
      .then(r => setBakimModu(r.data.bakim_modu))
      .catch(() => {})
  }, [navigate])

  const bakimToggle = async () => {
    setBakimYukleniyor(true)
    try {
      const r = await axios.post(`${API}/api/ayarlar/admin/bakim`, {}, { withCredentials: true })
      setBakimModu(r.data.bakim_modu)
    } catch {}
    setBakimYukleniyor(false)
  }

  const cikis = async () => {
    await axios.post(`${API}/api/auth/cikis`, {}, { withCredentials: true })
    navigate('/admin/login')
  }

  if (kontrol) {
    return (
      <div className="min-h-screen bg-[#D6DEE8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0052CC]" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#D6DEE8] overflow-hidden">

      {/* Mobil overlay */}
      {acik && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setAcik(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        w-60 bg-[#0d1322] border-r-2 border-[#1a2744] flex flex-col flex-shrink-0
        fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out
        md:static md:z-auto md:translate-x-0
        ${acik ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="border-b-2 border-[#1a2744] flex items-center px-4 py-4">
          <img src="/ada-usta-logo-transparent.webp" alt="Ada Usta" className="h-9 w-auto object-contain" loading="lazy" />
        </div>

        {/* Navigasyon */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {menuItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setAcik(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                  isActive
                    ? 'bg-[#003d99] text-white shadow-sm border-[#0052CC]'
                    : 'text-[#6a7ea0] border-[#1a2744] hover:bg-[#121929] hover:text-white hover:border-[#243358]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className="flex-shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bakım Modu Butonu */}
        <div className="px-3 pb-2">
          <button
            onClick={bakimToggle}
            disabled={bakimYukleniyor}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
              bakimModu
                ? 'bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600/30'
                : 'bg-orange-500/15 text-orange-400 border-orange-500/25 hover:bg-orange-500/25'
            } disabled:opacity-50`}
          >
            {bakimModu
              ? <><Power size={13} /> Siteyi Aç (Şu an: Yakında)</>
              : <><PowerOff size={13} /> Siteyi Kapat (Yakında Sayfası)</>
            }
          </button>
        </div>

        {/* Çıkış */}
        <div className="px-3 py-3 border-t-2 border-[#1a2744]">
          <button
            onClick={cikis}
            className="w-full flex items-center gap-2 px-3 py-2 text-[#6a7ea0] hover:text-red-400 hover:bg-[#121929] rounded-lg text-xs transition-colors border border-[#1a2744] hover:border-[#243358]"
          >
            <LogOut size={14} /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Ana içerik */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center justify-between px-4 py-3.5 bg-[#0d1322] border-b-2 border-[#1a2744]">
          <button onClick={() => setAcik(true)} className="text-[#6a7ea0] hover:text-white transition p-1.5 rounded-lg hover:bg-[#121929]">
            <Menu size={22} />
          </button>
          <span className="text-white font-bold">Adausta Admin</span>
          <div className="w-9" />
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
