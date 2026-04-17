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
import AdminReklamlar from './pages/admin/AdminReklamlar'
// Usta Paneli
import UstaGiris from './pages/usta-panel/UstaGiris'
import UstaPanelLayout from './pages/usta-panel/UstaPanelLayout'
import UstaPanelDashboard from './pages/usta-panel/UstaPanelDashboard'
import UstaPanelIsTalepleri from './pages/usta-panel/UstaPanelIsTalepleri'
import UstaPanelMusteriler from './pages/usta-panel/UstaPanelMusteriler'
import UstaPanelIstatistik from './pages/usta-panel/UstaPanelIstatistik'
import UstaPanelYorumlar from './pages/usta-panel/UstaPanelYorumlar'
import UstaPanelProfil from './pages/usta-panel/UstaPanelProfil'

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

      {/* Public site */}
      <Route path="/*" element={<PublicSite />} />
    </Routes>
  )
}
