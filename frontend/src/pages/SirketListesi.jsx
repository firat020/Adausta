import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Building2, MapPin, Phone, Globe, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import { sirketListele, kategorileriGetir, sehirleriGetir } from '../api'

export default function SirketListesi() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sirketler, setSirketler] = useState([])
  const [kategoriler, setKategoriler] = useState([])
  const [sehirler, setSehirler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [toplam, setToplam] = useState(0)

  const [filtre, setFiltre] = useState({
    arama: searchParams.get('arama') || '',
    kategori_id: searchParams.get('kategori_id') || '',
    sehir_id: searchParams.get('sehir_id') || '',
  })

  useEffect(() => {
    kategorileriGetir().then(r => setKategoriler(r.data.kategoriler || []))
    sehirleriGetir().then(r => setSehirler(r.data.sehirler || []))
  }, [])

  useEffect(() => {
    setYukleniyor(true)
    const params = {}
    if (filtre.arama) params.arama = filtre.arama
    if (filtre.kategori_id) params.kategori_id = filtre.kategori_id
    if (filtre.sehir_id) params.sehir_id = filtre.sehir_id

    sirketListele(params)
      .then(r => {
        setSirketler(r.data.sirketler || [])
        setToplam(r.data.toplam || 0)
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [filtre])

  const filtreGuncelle = (key, val) => {
    setFiltre(f => ({ ...f, [key]: val }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kurumsal Şirketler</h1>
        <p className="text-gray-500">KKTC'de hizmet veren kurumsal firma ve şirketler</p>
      </div>

      {/* Filtreler */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-gray-500">
          <SlidersHorizontal size={16} />
          <span className="text-sm font-medium">Filtrele:</span>
        </div>

        {/* Arama */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filtre.arama}
            onChange={e => filtreGuncelle('arama', e.target.value)}
            placeholder="Şirket adı ara..."
            className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
          />
        </div>

        {/* Kategori */}
        <select
          value={filtre.kategori_id}
          onChange={e => filtreGuncelle('kategori_id', e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          <option value="">Tüm Kategoriler</option>
          {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ikon} {k.ad}</option>)}
        </select>

        {/* Şehir */}
        <select
          value={filtre.sehir_id}
          onChange={e => filtreGuncelle('sehir_id', e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          <option value="">Tüm Şehirler</option>
          {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
        </select>

        {(filtre.arama || filtre.kategori_id || filtre.sehir_id) && (
          <button
            onClick={() => setFiltre({ arama: '', kategori_id: '', sehir_id: '' })}
            className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Temizle
          </button>
        )}
      </div>

      {/* Sonuç sayısı */}
      <p className="text-sm text-gray-500 mb-4">
        {yukleniyor ? 'Yükleniyor...' : `${toplam} şirket bulundu`}
      </p>

      {/* Liste */}
      {yukleniyor ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-xl mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : sirketler.length === 0 ? (
        <div className="text-center py-20">
          <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Şirket bulunamadı</h3>
          <p className="text-gray-400 text-sm">Farklı filtreler deneyin veya aramanızı değiştirin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sirketler.map(sirket => (
            <SirketKart key={sirket.id} sirket={sirket} />
          ))}
        </div>
      )}

      {/* CTA: Şirket kayıt */}
      <div className="mt-12 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-8 text-center text-white">
        <Building2 size={36} className="mx-auto mb-4 opacity-80" />
        <h2 className="text-2xl font-bold mb-2">Şirketinizi Listeleyin</h2>
        <p className="text-indigo-200 text-sm mb-6">
          Ada Usta'da şirketinizi ücretsiz kaydedin, müşterilerinize ulaşın
        </p>
        <Link to="/sirket-kayit"
          className="inline-block bg-white text-indigo-600 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors">
          Şirketimi Kaydet
        </Link>
      </div>
    </div>
  )
}

function SirketKart({ sirket }) {
  return (
    <Link to={`/sirket/${sirket.id}`}
      className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-indigo-200 transition-all group block">

      {/* Logo / İkon */}
      <div className="flex items-start gap-4 mb-4">
        {sirket.logo_url ? (
          <img src={sirket.logo_url} alt={sirket.sirket_adi}
            className="w-14 h-14 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 size={24} className="text-indigo-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-indigo-600 transition-colors truncate">
            {sirket.sirket_adi}
          </h3>
          <span className="inline-block mt-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
            {sirket.kategori_ikon} {sirket.kategori}
          </span>
        </div>
      </div>

      {/* Detaylar */}
      <div className="space-y-1.5 mb-4">
        {sirket.sehir && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin size={12} className="text-gray-400 flex-shrink-0" />
            <span>{sirket.sehir}{sirket.ilce ? `, ${sirket.ilce}` : ''}</span>
          </div>
        )}
        {sirket.telefon && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone size={12} className="text-gray-400 flex-shrink-0" />
            <span>{sirket.telefon}</span>
          </div>
        )}
        {sirket.website && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Globe size={12} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{sirket.website.replace(/^https?:\/\//, '')}</span>
          </div>
        )}
      </div>

      {sirket.aciklama && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{sirket.aciklama}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{sirket.yetkili_ad}</span>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
      </div>
    </Link>
  )
}
