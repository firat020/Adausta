import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { ustaListele, kategorileriGetir, sehirleriGetir } from '../api'
import UstaKart from '../components/UstaKart'

export default function UstaListesi() {
  const [searchParams] = useSearchParams()
  const [ustalar, setUstalar] = useState([])
  const [kategoriler, setKategoriler] = useState([])
  const [sehirler, setSehirler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [toplam, setToplam] = useState(0)
  const [filtrePaneli, setFiltrePaneli] = useState(false)

  const [filtreler, setFiltreler] = useState({
    kategori_id: searchParams.get('kategori_id') || '',
    sehir_id: searchParams.get('sehir_id') || '',
    arama: searchParams.get('arama') || '',
  })

  const kategoriAd = decodeURIComponent(searchParams.get('kategori_ad') || '')

  useEffect(() => {
    kategorileriGetir().then(r => setKategoriler(r.data.kategoriler || []))
    sehirleriGetir().then(r => setSehirler(r.data.sehirler || []))
  }, [])

  useEffect(() => {
    setYukleniyor(true)
    const params = {}
    if (filtreler.kategori_id) params.kategori_id = filtreler.kategori_id
    if (filtreler.sehir_id) params.sehir_id = filtreler.sehir_id
    if (filtreler.arama) params.arama = filtreler.arama
    ustaListele(params)
      .then(r => { setUstalar(r.data.ustalar || []); setToplam(r.data.toplam || 0) })
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [filtreler])

  const temizle = () => setFiltreler({ kategori_id: '', sehir_id: '', arama: '' })
  const aktifFiltre = filtreler.kategori_id || filtreler.sehir_id || filtreler.arama

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Başlık */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {kategoriAd || 'Tüm Ustalar'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {yukleniyor ? 'Yükleniyor...' : `${toplam} usta bulundu`}
          </p>
        </div>
        <button onClick={() => setFiltrePaneli(!filtrePaneli)}
          className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 hover:border-orange-400 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <SlidersHorizontal size={16} />
          Filtrele
          {aktifFiltre && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
        </button>
      </div>

      {/* Filtre paneli */}
      {filtrePaneli && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Arama</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={filtreler.arama}
                onChange={e => setFiltreler(f => ({ ...f, arama: e.target.value }))}
                placeholder="Usta adı veya hizmet..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Hizmet Türü</label>
            <select value={filtreler.kategori_id}
              onChange={e => setFiltreler(f => ({ ...f, kategori_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white">
              <option value="">Tüm Hizmetler</option>
              {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Şehir</label>
            <select value={filtreler.sehir_id}
              onChange={e => setFiltreler(f => ({ ...f, sehir_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white">
              <option value="">Tüm Şehirler</option>
              {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
            </select>
          </div>
          {aktifFiltre && (
            <div className="md:col-span-3 flex justify-end">
              <button onClick={temizle}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
                <X size={14} /> Filtreleri temizle
              </button>
            </div>
          )}
        </div>
      )}

      {/* Liste */}
      {yukleniyor ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : ustalar.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <Search size={40} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium text-gray-500">Usta bulunamadı</p>
          <p className="text-sm mt-1">Farklı filtreler deneyin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ustalar.map(u => <UstaKart key={u.id} usta={u} />)}
        </div>
      )}
    </div>
  )
}
