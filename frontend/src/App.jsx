import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Anasayfa from './pages/Anasayfa'
import Kategoriler from './pages/Kategoriler'
import UstaListesi from './pages/UstaListesi'
import UstaDetay from './pages/UstaDetay'
import UstaKayit from './pages/UstaKayit'
import EnYakin from './pages/EnYakin'

export default function App() {
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
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
