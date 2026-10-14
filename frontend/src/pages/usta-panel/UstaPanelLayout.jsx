import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, ClipboardList, User, BarChart2,
  LogOut, Menu, Wrench, ToggleLeft, ToggleRight, Star, ShoppingBag,
  MessageCircle, FileCheck2, Crown, Settings
} from 'lucide-react'
import { benimBilgilerim, cikis as apiCikis, ustaPanelMusaitlik, ustaPanelMesajOkunmamis, ustaPanelTalepMesajOkunmamis, ustaAbonelikGetir } from '../../api'

const menuItems = [
  { to: '/usta/panel',          icon: LayoutDashboard, label: 'Genel Bakış',    end: true },
  { to: '/usta/panel/talepler', icon: ClipboardList,   label: 'İş Talepleri', talepMesajBadge: true },
  { to: '/usta/panel/musteriler', icon: Users,         label: 'Müşterilerim' },
  { to: '/usta/panel/istatistik', icon: BarChart2,     label: 'İstatistikler' },
  { to: '/usta/panel/yorumlar',  icon: Star,           label: 'Yorumlar' },
  { to: '/usta/panel/mesajlar',  icon: MessageCircle,  label: 'Mesajlar', mesajBadge: true },
  { to: '/usta/panel/abonelik',  icon: Crown,          label: 'Abonelik ve Öne Çıkarma' },
  { to: '/usta/panel/belgeler',  icon: FileCheck2,     label: 'Belgelerim' },
  { to: '/usta/panel/magaza',    icon: ShoppingBag,    label: 'Mağaza' },
  { to: '/usta/panel/profil',    icon: User,           label: 'Profilim' },
  { to: '/usta/panel/hizmetler', icon: Wrench,         label: 'Hizmetlerim' },
  { to: '/usta/panel/ayarlar',   icon: Settings,       label: 'Ayarlar' },
]

export default function UstaPanelLayout() {
  const [acik, setAcik] = useState(false)
  const [kontrol, setKontrol] = useState(true)
  const [kullanici, setKullanici] = useState(null)
  const [musaitlik, setMusaitlik] = useState(true)
  const [okunmamisMesaj, setOkunmamisMesaj] = useState(0)
  const [okunmamisTalepMesaj, setOkunmamisTalepMesaj] = useState(0)
  const [deneme, setDeneme] = useState(null) // { kalan, bitis } — kartsız 90 gün deneme sürüyorsa
  const [suresiBitti, setSuresiBitti] = useState(false) // deneme/abonelik bitmiş (askıda) — yalnız ödeme sayfası açık
  const navigate = useNavigate()
  const location = useLocation()

  // Süre bittiyse ödeme sayfası dışındaki panel sayfalarından ödemeye yönlendir
  useEffect(() => {
    if (suresiBitti && !location.pathname.startsWith('/usta/panel/abonelik')) {
      navigate('/usta/panel/abonelik', { replace: true })
    }
  }, [suresiBitti, location.pathname, navigate])

  useEffect(() => {
    benimBilgilerim()
      .then(r => {
        const k = r.data.kullanici
        if (!k || k.rol !== 'usta') {
          navigate('/usta/giris', { replace: true })
        } else {
          setKullanici(k)
          setKontrol(false)
          ustaPanelMesajOkunmamis().then(r => setOkunmamisMesaj(r.data.sayi || 0)).catch(() => {})
          ustaPanelTalepMesajOkunmamis().then(r => setOkunmamisTalepMesaj(r.data.sayi || 0)).catch(() => {})
          ustaAbonelikGetir().then(r => {
            const ab = r.data?.abonelik
            if (ab?.deneme_mi && ab.durum === 'aktif' && r.data.plan_bitis) {
              const kalan = Math.max(0, Math.ceil((new Date(r.data.plan_bitis).getTime() - Date.now()) / 86400000))
              setDeneme({ kalan, bitis: new Date(r.data.plan_bitis).toLocaleDateString('tr-TR') })
            }
            if (ab?.durum === 'askida' && r.data.plan_bitis && new Date(r.data.plan_bitis).getTime() < Date.now()) {
              setSuresiBitti(true)
            }
          }).catch(() => {})
        }
      })
      .catch(() => navigate('/usta/giris', { replace: true }))
  }, [navigate])

  useEffect(() => {
    const interval = setInterval(() => {
      ustaPanelMesajOkunmamis().then(r => setOkunmamisMesaj(r.data.sayi || 0)).catch(() => {})
      ustaPanelTalepMesajOkunmamis().then(r => setOkunmamisTalepMesaj(r.data.sayi || 0)).catch(() => {})
    }, 60000)
    return () => clearInterval(interval)
  }, [])

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
    <div className="flex h-screen h-dvh bg-gray-100 overflow-hidden">
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
            <img src="/ada-usta-logo-transparent.webp" alt="Ada Usta" className="h-9 w-auto object-contain" loading="lazy" />
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
          {menuItems.map(({ to, icon: Icon, label, end, mesajBadge, talepMesajBadge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => { setAcik(false); if (mesajBadge) setOkunmamisMesaj(0); if (talepMesajBadge) setOkunmamisTalepMesaj(0) }}
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
                  <span className="flex-1">{label}</span>
                  {mesajBadge && okunmamisMesaj > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {okunmamisMesaj}
                    </span>
                  )}
                  {talepMesajBadge && okunmamisTalepMesaj > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {okunmamisTalepMesaj}
                    </span>
                  )}
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
          <button onClick={() => setAcik(true)} className="text-gray-600 hover:text-gray-900 p-2.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu size={22} />
          </button>
          <span className="font-bold text-gray-900">Usta Paneli</span>
          <div className="w-9" />
        </div>

        {suresiBitti && (
          <div className="px-4 py-2.5 text-sm flex items-center justify-between gap-3 flex-wrap border-b bg-red-50 border-red-200 text-red-800">
            <span>
              <span className="font-bold">Üyelik süren doldu.</span>
              {' '}Panele devam etmek ve profilinin yayında kalması için kredi kartıyla ödeme yap.
            </span>
          </div>
        )}

        {deneme && deneme.kalan <= 30 && (
          <div className={`px-4 py-2.5 text-sm flex items-center justify-between gap-3 flex-wrap border-b ${
            deneme.kalan <= 3 ? 'bg-red-50 border-red-200 text-red-800'
            : deneme.kalan <= 14 ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
            <span>
              <span className="font-bold">Ücretsiz deneme: {deneme.kalan} gün kaldı</span>
              {' '}({deneme.bitis}). {deneme.kalan <= 14 ? 'Müşteri taleplerini kaçırmamak için şimdi ödeme yap — kalan günlerin kaybolmaz, üstüne eklenir.' : 'İstediğin zaman kredi kartıyla devam edebilirsin.'}
            </span>
            <NavLink to="/usta/panel/abonelik"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg whitespace-nowrap transition-colors">
              Kredi kartıyla öde
            </NavLink>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
