import { useState, useEffect, useCallback } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import axios from 'axios'
import {
  LayoutDashboard, Users, Star, Tag, LogOut, Menu, FileText, ShieldOff, BarChart2, Megaphone,
  CreditCard, PackageCheck, Wallet, Power, PowerOff, ShoppingBag, ShoppingCart, Bell, Smartphone, Store, TrendingUp
} from 'lucide-react'

import API from '../../config.js'

const menuItems = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/analitik',     icon: BarChart2,       label: 'Analitik & Rapor' },
  { to: '/admin/ustalar',      icon: Users,           label: 'Usta Yönetimi', kayitBadge: true },
  { to: '/admin/kara-liste',   icon: ShieldOff,       label: 'Kara Liste' },
  { to: '/admin/planlar',      icon: PackageCheck,    label: 'Plan Yönetimi' },
  { to: '/admin/abonelikler',  icon: CreditCard,      label: 'Abonelik Takibi' },
  { to: '/admin/odemeler',     icon: Wallet,          label: 'Ödeme Geçmişi' },
  { to: '/admin/yorumlar',     icon: Star,            label: 'Yorumlar' },
  { to: '/admin/kategoriler',  icon: Tag,             label: 'Kategoriler' },
  { to: '/admin/reklamlar',    icon: Megaphone,       label: 'Reklam Yönetimi' },
  { to: '/admin/urunler',           icon: ShoppingBag,  label: 'Ürün Yönetimi' },
  { to: '/admin/magaza-siparisler', icon: ShoppingCart, label: 'Mağaza Siparişleri', siparisBadge: true },
  { to: '/admin/siparisler',        icon: ShoppingCart, label: 'Eski Siparişler' },
  { to: '/admin/saticilar',         icon: Store,        label: 'Satıcı Yönetimi', saticiBasvuruBadge: true },
  { to: '/admin/saticilar-finans',  icon: Wallet,       label: 'Satıcı Finans' },
  { to: '/admin/finans',            icon: TrendingUp,   label: 'Finans Yönetimi' },
  { to: '/admin/bildirimler',  icon: Smartphone,      label: 'Mobil Bildirim' },
  { to: '/admin/loglar',       icon: FileText,        label: 'İşlem Logu' },
]

export default function AdminLayout() {
  const [acik, setAcik] = useState(false)
  const [kontrol, setKontrol] = useState(true)
  const [bakimModu, setBakimModu] = useState(false)
  const [bakimYukleniyor, setBakimYukleniyor] = useState(false)
  const [bekleyenSiparis, setBekleyenSiparis] = useState(0)
  const [yeniKayit, setYeniKayit] = useState(0)
  const [bekleyenBasvuru, setBekleyenBasvuru] = useState(0)
  const navigate = useNavigate()

  const bildirimSayisiniGetir = useCallback(() => {
    axios.get(`${API}/api/admin/bildirimsayisi`, { withCredentials: true })
      .then(r => setYeniKayit(r.data.sayi || 0)).catch(() => {})
  }, [])

  useEffect(() => {
    axios.get(`${API}/api/auth/ben`, { withCredentials: true })
      .then(r => {
        if (r.data.kullanici?.rol !== 'admin') {
          navigate('/admin/login', { replace: true })
        } else {
          setKontrol(false)
          axios.get(`${API}/api/magaza/admin/magaza-dashboard`, { withCredentials: true })
            .then(r => setBekleyenSiparis(r.data.bekleyen || 0)).catch(() => {})
          axios.get(`${API}/api/admin/saticilar/ozet`, { withCredentials: true })
            .then(r => setBekleyenBasvuru(r.data.bekleyen_basvuru || 0)).catch(() => {})
          bildirimSayisiniGetir()
        }
      })
      .catch(() => navigate('/admin/login', { replace: true }))
    axios.get(`${API}/api/ayarlar/bakim`)
      .then(r => setBakimModu(r.data.bakim_modu))
      .catch(() => {})

    // Her 60 saniyede bir yeni kayıt sayısını güncelle
    const interval = setInterval(bildirimSayisiniGetir, 60000)
    return () => clearInterval(interval)
  }, [navigate, bildirimSayisiniGetir])

  const bildirimleriTemizle = () => {
    axios.post(`${API}/api/admin/bildirimler/goruldu`, {}, { withCredentials: true })
      .then(() => setYeniKayit(0)).catch(() => {})
  }

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
        <div className="border-b-2 border-[#1a2744] px-4 py-5 bg-gradient-to-b from-[#111827] to-[#0d1322]">
          <img src="/ada-usta-logo-transparent.webp" alt="Ada Usta" className="h-10 w-auto object-contain" loading="lazy" />
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[#3d5280] select-none">Admin Paneli</span>
            <span className="flex-1 h-px bg-[#1a2744]" />
          </div>
        </div>

        {/* Navigasyon */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {menuItems.map(({ to, icon: Icon, label, siparisBadge, kayitBadge, saticiBasvuruBadge }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => { setAcik(false); if (kayitBadge && yeniKayit > 0) bildirimleriTemizle() }}
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
                  <span className="flex-1">{label}</span>
                  {siparisBadge && bekleyenSiparis > 0 && (
                    <span className="bg-amber-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {bekleyenSiparis}
                    </span>
                  )}
                  {kayitBadge && yeniKayit > 0 && (
                    <span className="bg-green-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center animate-pulse">
                      {yeniKayit}
                    </span>
                  )}
                  {saticiBasvuruBadge && bekleyenBasvuru > 0 && (
                    <span className="bg-blue-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center animate-pulse">
                      {bekleyenBasvuru}
                    </span>
                  )}
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
