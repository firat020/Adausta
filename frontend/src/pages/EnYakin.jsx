import { useState, useEffect } from 'react'
import { MapPin, Navigation, AlertCircle } from 'lucide-react'
import { enYakinUstalar, kategorileriGetir } from '../api'
import UstaKart from '../components/UstaKart'

export default function EnYakin() {
  const [konum, setKonum] = useState(null)
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [ustalar, setUstalar] = useState([])
  const [kategoriler, setKategoriler] = useState([])
  const [secilenKategori, setSecilenKategori] = useState('')
  const [konumAlindi, setKonumAlindi] = useState(false)

  useEffect(() => {
    kategorileriGetir().then(r => setKategoriler(r.data.kategoriler || []))
  }, [])

  const konumAl = () => {
    setYukleniyor(true)
    setHata('')
    if (!navigator.geolocation) {
      setHata('Tarayıcınız konum desteklemiyor.')
      setYukleniyor(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords
        setKonum({ lat, lng })
        setKonumAlindi(true)
        araUstalar(lat, lng, secilenKategori)
      },
      () => {
        const lat = 35.1856, lng = 33.3823  // Lefkoşa merkezi
        setKonum({ lat, lng })
        setKonumAlindi(true)
        araUstalar(lat, lng, secilenKategori)
        setHata('Konumunuz alınamadı, Lefkoşa merkezi kullanıldı.')
      },
      { timeout: 8000 }
    )
  }

  const araUstalar = (lat, lng, kategori_id) => {
    setYukleniyor(true)
    const params = { lat, lng, limit: 20 }
    if (kategori_id) params.kategori_id = kategori_id
    enYakinUstalar(params)
      .then(r => setUstalar(r.data.ustalar || []))
      .catch(() => setHata('Ustalar yüklenemedi.'))
      .finally(() => setYukleniyor(false))
  }

  const filtreUygula = () => {
    if (konum) araUstalar(konum.lat, konum.lng, secilenKategori)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">En Yakın Ustayı Bul</h1>
        <p className="text-gray-500">Konumunuza göre size en yakın onaylı ustaları listeleyelim</p>
      </div>

      {/* Konum alma */}
      {!konumAlindi ? (
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-12 text-center mb-8">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin size={32} className="text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Konumunuzu Paylaşın</h2>
          <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            Tarayıcı konum izni isteyecek. İzin verirseniz size en yakın ustaları göstereceğiz.
          </p>
          <button onClick={konumAl} disabled={yukleniyor}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white font-semibold px-10 py-3.5 rounded-xl transition-colors">
            <Navigation size={16} />
            {yukleniyor ? 'Konum alınıyor...' : 'Konumumu Kullan'}
          </button>
          {hata && (
            <div className="flex items-center justify-center gap-2 mt-4 text-amber-600 text-sm">
              <AlertCircle size={14} />
              {hata}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Konum alındı bildirimi */}
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-5">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Navigation size={14} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Konum alındı</p>
              {hata && <p className="text-xs text-amber-600">{hata}</p>}
            </div>
          </div>

          {/* Kategori filtresi */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 mb-6 flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Hizmet Türü</label>
              <select value={secilenKategori}
                onChange={e => setSecilenKategori(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                <option value="">Tüm Hizmetler</option>
                {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
              </select>
            </div>
            <button onClick={filtreUygula}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
              Filtrele
            </button>
          </div>
        </>
      )}

      {/* Sonuçlar */}
      {yukleniyor ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : konumAlindi && ustalar.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MapPin size={36} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium text-gray-500">Yakınında usta bulunamadı</p>
          <p className="text-sm mt-1">Farklı kategori seçin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ustalar.map(u => <UstaKart key={u.id} usta={u} />)}
        </div>
      )}
    </div>
  )
}
