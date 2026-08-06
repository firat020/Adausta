import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, Suspense, lazy } from 'react'
import { initGA, trackPage } from './analytics'
import ScrollToTop from './components/ScrollToTop'
import axios from 'axios'
import API from './config.js'
import { Capacitor } from '@capacitor/core'
import CokYakinda from './pages/CokYakinda'
import Hosgeldin from './pages/Hosgeldin'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsappButon from './components/WhatsappButon'
// Müşteriye açık (SEO kritik) sayfalar — ilk yüklemede eager kalır
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
import TeslimatHizmetSureci from './pages/yasal/TeslimatHizmetSureci'
import OnBilgilendirmeFormu from './pages/yasal/OnBilgilendirmeFormu'
import KisiselVeriler from './pages/yasal/KisiselVeriler'
import SSS from './pages/yasal/SSS'
import IptalIadePolitikasi from './pages/yasal/IptalIadePolitikasi'
import Hakkimizda from './pages/Hakkimizda'
import Iletisim from './pages/Iletisim'
import OdemeFormu from './pages/OdemeFormu'
import OdemeSonuc from './pages/OdemeSonuc'
import Magaza from './pages/Magaza'
import MagazaOdeme from './pages/MagazaOdeme'
import MagazaUrunDetay from './pages/MagazaUrunDetay'
import MagazaSiparisBasarili from './pages/MagazaSiparisBasarili'
import MagazaSiparisBasarisiz from './pages/MagazaSiparisBasarisiz'
import MagazaSiparislerim from './pages/MagazaSiparislerim'
import TalepTakip from './pages/TalepTakip'
import SifremiUnuttum from './pages/SifremiUnuttum'
import MagazaSatici from './pages/MagazaSatici'
import MagazaSaticilar from './pages/MagazaSaticilar'

// Rol bazlı paneller (admin/usta/şirket/satıcı/müşteri) — sadece o role
// girenler indirsin diye lazy-load. Bkz. Faz 2 SEO: ana bundle'ı küçültüp
// müşteri sayfalarının ilk yükleme hızını artırmak için.
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUstalar = lazy(() => import('./pages/admin/AdminUstalar'))
const AdminYorumlar = lazy(() => import('./pages/admin/AdminYorumlar'))
const AdminKategoriler = lazy(() => import('./pages/admin/AdminKategoriler'))
const AdminLoglar = lazy(() => import('./pages/admin/AdminLoglar'))
const AdminKaraListe = lazy(() => import('./pages/admin/AdminKaraListe'))
const AdminAnalitik = lazy(() => import('./pages/admin/AdminAnalitik'))
const AdminReklamlar = lazy(() => import('./pages/admin/AdminReklamlar'))
const AdminPlanlar = lazy(() => import('./pages/admin/AdminPlanlar'))
const AdminAbonelikler = lazy(() => import('./pages/admin/AdminAbonelikler'))
const AdminOdemeler = lazy(() => import('./pages/admin/AdminOdemeler'))
const AdminUrunler = lazy(() => import('./pages/admin/AdminUrunler'))
const AdminUrunEkle = lazy(() => import('./pages/admin/AdminUrunEkle'))
const AdminSiparisler = lazy(() => import('./pages/admin/AdminSiparisler'))
const AdminMagazaSiparisler = lazy(() => import('./pages/admin/AdminMagazaSiparisler'))
const AdminBildirimler = lazy(() => import('./pages/admin/AdminBildirimler'))
const AdminSaticilar = lazy(() => import('./pages/admin/AdminSaticilar'))
const AdminSaticilarFinans = lazy(() => import('./pages/admin/AdminSaticilarFinans'))
const AdminFinans = lazy(() => import('./pages/admin/AdminFinans'))
// Usta Paneli
const UstaGiris = lazy(() => import('./pages/usta-panel/UstaGiris'))
const UstaPanelLayout = lazy(() => import('./pages/usta-panel/UstaPanelLayout'))
const UstaPanelDashboard = lazy(() => import('./pages/usta-panel/UstaPanelDashboard'))
const UstaPanelIsTalepleri = lazy(() => import('./pages/usta-panel/UstaPanelIsTalepleri'))
const UstaPanelMusteriler = lazy(() => import('./pages/usta-panel/UstaPanelMusteriler'))
const UstaPanelIstatistik = lazy(() => import('./pages/usta-panel/UstaPanelIstatistik'))
const UstaPanelYorumlar = lazy(() => import('./pages/usta-panel/UstaPanelYorumlar'))
const UstaPanelProfil = lazy(() => import('./pages/usta-panel/UstaPanelProfil'))
const UstaPanelMagaza = lazy(() => import('./pages/usta-panel/UstaPanelMagaza'))
// Şirket Paneli
const SirketGiris = lazy(() => import('./pages/sirket-panel/SirketGiris'))
const SirketPanelLayout = lazy(() => import('./pages/sirket-panel/SirketPanelLayout'))
const SirketPanelDashboard = lazy(() => import('./pages/sirket-panel/SirketPanelDashboard'))
const SirketPanelTalepler = lazy(() => import('./pages/sirket-panel/SirketPanelTalepler'))
const SirketPanelProfil = lazy(() => import('./pages/sirket-panel/SirketPanelProfil'))
// Müşteri Paneli
const MusteriPanelLayout = lazy(() => import('./pages/musteri-panel/MusteriPanelLayout'))
const MusteriPanelDashboard = lazy(() => import('./pages/musteri-panel/MusteriPanelDashboard'))
const MusteriPanelTalepler = lazy(() => import('./pages/musteri-panel/MusteriPanelTalepler'))
const MusteriPanelProfil = lazy(() => import('./pages/musteri-panel/MusteriPanelProfil'))
// Satıcı Başvuru & Paneli
const SaticiBasvuruGiris = lazy(() => import('./pages/satici/SaticiBasvuruGiris'))
const SaticiBasvuruForm = lazy(() => import('./pages/satici/SaticiBasvuruForm'))
const SaticiBasvuruDurum = lazy(() => import('./pages/satici/SaticiBasvuruDurum'))
const SaticiGiris = lazy(() => import('./pages/satici/SaticiGiris'))
const SaticiPanelLayout = lazy(() => import('./pages/satici-panel/SaticiPanelLayout'))
const SaticiPanelDashboard = lazy(() => import('./pages/satici-panel/SaticiPanelDashboard'))
const SaticiPanelUrunler = lazy(() => import('./pages/satici-panel/SaticiPanelUrunler'))
const SaticiPanelSiparisler = lazy(() => import('./pages/satici-panel/SaticiPanelSiparisler'))
const SaticiPanelMagaza = lazy(() => import('./pages/satici-panel/SaticiPanelMagaza'))
const SaticiPanelPersonel = lazy(() => import('./pages/satici-panel/SaticiPanelPersonel'))
const SaticiPanelBakiye = lazy(() => import('./pages/satici-panel/SaticiPanelBakiye'))
const SaticiPanelIadeler = lazy(() => import('./pages/satici-panel/SaticiPanelIadeler'))
const SaticiPanelHakedis = lazy(() => import('./pages/satici-panel/SaticiPanelHakedis'))

function PanelYukleniyor() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
    </div>
  )
}

function PublicSite() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{width:'100%', textAlign:'left'}}>
      <Navbar />
      <WhatsappButon />
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
          <Route path="/teslimat-ve-hizmet-sureci" element={<TeslimatHizmetSureci />} />
          <Route path="/on-bilgilendirme-formu" element={<OnBilgilendirmeFormu />} />
          <Route path="/kisisel-veriler" element={<KisiselVeriler />} />
          <Route path="/sss" element={<SSS />} />
          <Route path="/iptal-iade-politikasi" element={<IptalIadePolitikasi />} />
          <Route path="/hakkimizda" element={<Hakkimizda />} />
          <Route path="/iletisim" element={<Iletisim />} />
          <Route path="/odeme" element={<OdemeFormu />} />
          <Route path="/odeme-sonuc" element={<OdemeSonuc />} />
          <Route path="/magaza" element={<Magaza />} />
          <Route path="/magaza/urun/:id" element={<MagazaUrunDetay />} />
          <Route path="/magaza/odeme" element={<MagazaOdeme />} />
          <Route path="/magaza/siparis-basarili" element={<MagazaSiparisBasarili />} />
          <Route path="/magaza/siparis-basarisiz" element={<MagazaSiparisBasarisiz />} />
          <Route path="/magaza/siparislerim" element={<MagazaSiparislerim />} />
          <Route path="/magaza/satici/:slug" element={<MagazaSatici />} />
          <Route path="/magaza/saticilar" element={<MagazaSaticilar />} />
          <Route path="/talep-takip" element={<TalepTakip />} />
          <Route path="/satici-basvuru" element={<SaticiBasvuruGiris />} />
          <Route path="/satici-basvuru/basvur" element={<SaticiBasvuruForm />} />
          <Route path="/satici-basvuru/durum" element={<SaticiBasvuruDurum />} />
          <Route path="/satici/giris" element={<SaticiGiris />} />
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
  const navigate = useNavigate()

  useEffect(() => { initGA() }, [])
  useEffect(() => { trackPage(location.pathname) }, [location])

  useEffect(() => {
    axios.get(`${API}/api/ayarlar/bakim`)
      .then(r => { setBakimModu(r.data.bakim_modu); setKontrol(false) })
      .catch(() => setKontrol(false))
  }, [])

  // APK'da ilk açılışta /hosgeldin'e yönlendir
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const girisYapildi = localStorage.getItem('adausta_giris')
    if (!girisYapildi && location.pathname === '/') {
      navigate('/hosgeldin', { replace: true })
    }
  }, [])

  if (kontrol) return null
  if (bakimModu) return <CokYakinda />

  return (
    <>
    <ScrollToTop />
    <Suspense fallback={<PanelYukleniyor />}>
    <Routes>
      {/* APK Karşılama */}
      <Route path="/hosgeldin" element={<Hosgeldin />} />

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
        <Route path="urunler" element={<AdminUrunler />} />
        <Route path="urun-ekle" element={<AdminUrunEkle />} />
        <Route path="siparisler" element={<AdminSiparisler />} />
        <Route path="magaza-siparisler" element={<AdminMagazaSiparisler />} />
        <Route path="bildirimler" element={<AdminBildirimler />} />
        <Route path="saticilar" element={<AdminSaticilar />} />
        <Route path="saticilar-finans" element={<AdminSaticilarFinans />} />
        <Route path="finans" element={<AdminFinans />} />
      </Route>

      <Route path="/sifremi-unuttum" element={<SifremiUnuttum />} />

      {/* Usta Paneli */}
      <Route path="/usta/giris" element={<UstaGiris />} />
      <Route path="/usta" element={<UstaPanelLayout />}>
        <Route path="panel" element={<UstaPanelDashboard />} />
        <Route path="panel/talepler" element={<UstaPanelIsTalepleri />} />
        <Route path="panel/musteriler" element={<UstaPanelMusteriler />} />
        <Route path="panel/istatistik" element={<UstaPanelIstatistik />} />
        <Route path="panel/yorumlar" element={<UstaPanelYorumlar />} />
        <Route path="panel/magaza" element={<UstaPanelMagaza />} />
        <Route path="panel/profil" element={<UstaPanelProfil />} />
      </Route>

      {/* Şirket Paneli */}
      <Route path="/sirket/giris" element={<SirketGiris />} />
      <Route path="/sirket" element={<SirketPanelLayout />}>
        <Route path="panel" element={<SirketPanelDashboard />} />
        <Route path="panel/talepler" element={<SirketPanelTalepler />} />
        <Route path="panel/profil" element={<SirketPanelProfil />} />
      </Route>

      {/* Satıcı Paneli */}
      <Route path="/satici" element={<SaticiPanelLayout />}>
        <Route path="panel" element={<SaticiPanelDashboard />} />
        <Route path="urunler" element={<SaticiPanelUrunler />} />
        <Route path="siparisler" element={<SaticiPanelSiparisler />} />
        <Route path="magazam" element={<SaticiPanelMagaza />} />
        <Route path="personel" element={<SaticiPanelPersonel />} />
        <Route path="bakiye" element={<SaticiPanelBakiye />} />
        <Route path="iadeler" element={<SaticiPanelIadeler />} />
        <Route path="hakedisler" element={<SaticiPanelHakedis />} />
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
    </Suspense>
    </>
  )
}
