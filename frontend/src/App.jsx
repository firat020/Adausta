import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { initGA, trackPage } from './analytics'
import ScrollToTop from './components/ScrollToTop'
import axios from 'axios'
import API from './config.js'
import CokYakinda from './pages/CokYakinda'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Anasayfa from './pages/Anasayfa'
import Kategoriler from './pages/Kategoriler'
import UstaListesi from './pages/UstaListesi'
import UstaDetay from './pages/UstaDetay'
import UstaKayit from './pages/UstaKayit'
import SirketKayit from './pages/SirketKayit'
import SirketListesi from './pages/SirketListesi'
import SirketDetay from './pages/SirketDetay'
import EnYakin from './pages/EnYakin'
import MusteriGiris from './pages/MusteriGiris'
import Blog from './pages/Blog'
import BlogDetay from './pages/BlogDetay'
import HizmetSayfasi from './pages/HizmetSayfasi'
import GizlilikPolitikasi from './pages/yasal/GizlilikPolitikasi'
import KullanimSartlari from './pages/yasal/KullanimSartlari'
import IadePolitikasi from './pages/yasal/IadePolitikasi'
import MesafeliSatis from './pages/yasal/MesafeliSatis'
import CerezPolitikasi from './pages/yasal/CerezPolitikasi'
import Hakkimizda from './pages/Hakkimizda'
import Iletisim from './pages/Iletisim'
import OdemeFormu from './pages/OdemeFormu'
import OdemeSonuc from './pages/OdemeSonuc'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUstalar from './pages/admin/AdminUstalar'
import AdminYorumlar from './pages/admin/AdminYorumlar'
import AdminKategoriler from './pages/admin/AdminKategoriler'
import AdminLoglar from './pages/admin/AdminLoglar'
import AdminKaraListe from './pages/admin/AdminKaraListe'
import AdminAnalitik from './pages/admin/AdminAnalitik'
import AdminReklamlar from './pages/admin/AdminReklamlar'
import AdminPlanlar from './pages/admin/AdminPlanlar'
import AdminAbonelikler from './pages/admin/AdminAbonelikler'
import AdminOdemeler from './pages/admin/AdminOdemeler'
// Usta Paneli
import UstaGiris from './pages/usta-panel/UstaGiris'
import UstaPanelLayout from './pages/usta-panel/UstaPanelLayout'
import UstaPanelDashboard from './pages/usta-panel/UstaPanelDashboard'
import UstaPanelIsTalepleri from './pages/usta-panel/UstaPanelIsTalepleri'
import UstaPanelMusteriler from './pages/usta-panel/UstaPanelMusteriler'
import UstaPanelIstatistik from './pages/usta-panel/UstaPanelIstatistik'
import UstaPanelYorumlar from './pages/usta-panel/UstaPanelYorumlar'
import UstaPanelProfil from './pages/usta-panel/UstaPanelProfil'
// Şirket Paneli
import SirketGiris from './pages/sirket-panel/SirketGiris'
import SirketPanelLayout from './pages/sirket-panel/SirketPanelLayout'
import SirketPanelDashboard from './pages/sirket-panel/SirketPanelDashboard'
import SirketPanelTalepler from './pages/sirket-panel/SirketPanelTalepler'
import SirketPanelProfil from './pages/sirket-panel/SirketPanelProfil'
// Müşteri Paneli
import MusteriPanelLayout from './pages/musteri-panel/MusteriPanelLayout'
import MusteriPanelDashboard from './pages/musteri-panel/MusteriPanelDashboard'
import MusteriPanelTalepler from './pages/musteri-panel/MusteriPanelTalepler'
import MusteriPanelProfil from './pages/musteri-panel/MusteriPanelProfil'

function PublicSite() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{width:'100%', textAlign:'left'}}>
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Anasayfa />} />
          <Route path="/kategoriler" element={<Kategoriler />} />
          <Route path="/ustalar" element={<UstaListesi />} />
          <Route path="/usta/:id" element={<UstaDetay />} />
          <Route path="/usta-kayit" element={<UstaKayit />} />
          <Route path="/sirket-kayit" element={<SirketKayit />} />
          <Route path="/sirketler" element={<SirketListesi />} />
          <Route path="/sirket/:id" element={<SirketDetay />} />
          <Route path="/en-yakin" element={<EnYakin />} />
          <Route path="/giris" element={<MusteriGiris />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetay />} />
          <Route path="/hizmet/:slug" element={<HizmetSayfasi />} />
          <Route path="/hizmet/:slug/:sehirSlug" element={<HizmetSayfasi />} />
          <Route path="/gizlilik" element={<GizlilikPolitikasi />} />
          <Route path="/kullanim-sartlari" element={<KullanimSartlari />} />
          <Route path="/iade-politikasi" element={<IadePolitikasi />} />
          <Route path="/mesafeli-satis" element={<MesafeliSatis />} />
          <Route path="/cerez-politikasi" element={<CerezPolitikasi />} />
          <Route path="/hakkimizda" element={<Hakkimizda />} />
          <Route path="/iletisim" element={<Iletisim />} />
          <Route path="/odeme" element={<OdemeFormu />} />
          <Route path="/odeme-sonuc" element={<OdemeSonuc />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  const [bakimModu, setBakimModu] = useState(false)
  const [kontrol, setKontrol] = useState(true)
  const location = useLocation()

  useEffect(() => { initGA() }, [])
  useEffect(() => { trackPage(location.pathname) }, [location])

  useEffect(() => {
    axios.get(`${API}/api/ayarlar/bakim`)
      .then(r => { setBakimModu(r.data.bakim_modu); setKontrol(false) })
      .catch(() => setKontrol(false))
  }, [])

  if (kontrol) return null
  if (bakimModu) return <CokYakinda />

  return (
    <>
    <ScrollToTop />
    <Routes>
      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="ustalar" element={<AdminUstalar />} />
        <Route path="yorumlar" element={<AdminYorumlar />} />
        <Route path="kategoriler" element={<AdminKategoriler />} />
        <Route path="loglar" element={<AdminLoglar />} />
        <Route path="kara-liste" element={<AdminKaraListe />} />
        <Route path="analitik" element={<AdminAnalitik />} />
        <Route path="reklamlar" element={<AdminReklamlar />} />
        <Route path="planlar" element={<AdminPlanlar />} />
        <Route path="abonelikler" element={<AdminAbonelikler />} />
        <Route path="odemeler" element={<AdminOdemeler />} />
      </Route>

      {/* Usta Paneli */}
      <Route path="/usta/giris" element={<UstaGiris />} />
      <Route path="/usta" element={<UstaPanelLayout />}>
        <Route path="panel" element={<UstaPanelDashboard />} />
        <Route path="panel/talepler" element={<UstaPanelIsTalepleri />} />
        <Route path="panel/musteriler" element={<UstaPanelMusteriler />} />
        <Route path="panel/istatistik" element={<UstaPanelIstatistik />} />
        <Route path="panel/yorumlar" element={<UstaPanelYorumlar />} />
        <Route path="panel/profil" element={<UstaPanelProfil />} />
      </Route>

      {/* Şirket Paneli */}
      <Route path="/sirket/giris" element={<SirketGiris />} />
      <Route path="/sirket" element={<SirketPanelLayout />}>
        <Route path="panel" element={<SirketPanelDashboard />} />
        <Route path="panel/talepler" element={<SirketPanelTalepler />} />
        <Route path="panel/profil" element={<SirketPanelProfil />} />
      </Route>

      {/* Müşteri Paneli */}
      <Route path="/musteri" element={<MusteriPanelLayout />}>
        <Route path="panel"          element={<MusteriPanelDashboard />} />
        <Route path="panel/talepler" element={<MusteriPanelTalepler />} />
        <Route path="panel/profil"   element={<MusteriPanelProfil />} />
      </Route>

      {/* Public site */}
      <Route path="/*" element={<PublicSite />} />
    </Routes>
    </>
  )
}
