import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUstalar from './pages/admin/AdminUstalar'
import AdminYorumlar from './pages/admin/AdminYorumlar'
import AdminKategoriler from './pages/admin/AdminKategoriler'
import AdminLoglar from './pages/admin/AdminLoglar'
import AdminKaraListe from './pages/admin/AdminKaraListe'

const Anasayfa          = lazy(() => import('./pages/Anasayfa'))
const Kategoriler       = lazy(() => import('./pages/Kategoriler'))
const UstaListesi       = lazy(() => import('./pages/UstaListesi'))
const UstaDetay         = lazy(() => import('./pages/UstaDetay'))
const UstaKayit         = lazy(() => import('./pages/UstaKayit'))
const EnYakin           = lazy(() => import('./pages/EnYakin'))
const MusteriGiris      = lazy(() => import('./pages/MusteriGiris'))
const GizlilikPolitikasi = lazy(() => import('./pages/yasal/GizlilikPolitikasi'))
const KullanimSartlari  = lazy(() => import('./pages/yasal/KullanimSartlari'))
const IadePolitikasi    = lazy(() => import('./pages/yasal/IadePolitikasi'))
const MesafeliSatis     = lazy(() => import('./pages/yasal/MesafeliSatis'))
const CerezPolitikasi   = lazy(() => import('./pages/yasal/CerezPolitikasi'))

const PageLoader = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
)

function PublicSite() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{width:'100%', textAlign:'left'}}>
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="ustalar" element={<AdminUstalar />} />
          <Route path="yorumlar" element={<AdminYorumlar />} />
          <Route path="kategoriler" element={<AdminKategoriler />} />
          <Route path="loglar" element={<AdminLoglar />} />
          <Route path="kara-liste" element={<AdminKaraListe />} />
        </Route>
        <Route path="/*" element={<PublicSite />} />
      </Routes>
    </>
  )
}
