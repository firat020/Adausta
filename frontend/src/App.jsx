import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Anasayfa from './pages/Anasayfa'
import Kategoriler from './pages/Kategoriler'
import UstaListesi from './pages/UstaListesi'
import UstaDetay from './pages/UstaDetay'
import UstaKayit from './pages/UstaKayit'
import EnYakin from './pages/EnYakin'
import MusteriGiris from './pages/MusteriGiris'
import GizlilikPolitikasi from './pages/yasal/GizlilikPolitikasi'
import KullanimSartlari from './pages/yasal/KullanimSartlari'
import IadePolitikasi from './pages/yasal/IadePolitikasi'
import MesafeliSatis from './pages/yasal/MesafeliSatis'
import CerezPolitikasi from './pages/yasal/CerezPolitikasi'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUstalar from './pages/admin/AdminUstalar'
import AdminYorumlar from './pages/admin/AdminYorumlar'
import AdminKategoriler from './pages/admin/AdminKategoriler'
import AdminLoglar from './pages/admin/AdminLoglar'
import AdminKaraListe from './pages/admin/AdminKaraListe'
import AdminAnalitik from './pages/admin/AdminAnalitik'

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
          <Route path="/en-yakin" element={<EnYakin />} />
          <Route path="/giris" element={<MusteriGiris />} />
          <Route path="/gizlilik" element={<GizlilikPolitikasi />} />
          <Route path="/kullanim-sartlari" element={<KullanimSartlari />} />
          <Route path="/iade-politikasi" element={<IadePolitikasi />} />
          <Route path="/mesafeli-satis" element={<MesafeliSatis />} />
          <Route path="/cerez-politikasi" element={<CerezPolitikasi />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Admin — kendi layout'u var, Navbar/Footer yok */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="ustalar" element={<AdminUstalar />} />
        <Route path="yorumlar" element={<AdminYorumlar />} />
        <Route path="kategoriler" element={<AdminKategoriler />} />
        <Route path="loglar" element={<AdminLoglar />} />
        <Route path="kara-liste" element={<AdminKaraListe />} />
        <Route path="analitik" element={<AdminAnalitik />} />
      </Route>

      {/* Public site */}
      <Route path="/*" element={<PublicSite />} />
    </Routes>
  )
}
