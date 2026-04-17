import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ustaListele, kategorileriGetir, sehirleriGetir, reklamlariGetir, reklamTikla } from '../api'
import UstaKart from '../components/UstaKart'
import SEO from '../components/SEO'

function ReklamKutusu({ reklam }) {
  if (!reklam) return (
    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center bg-gray-50">
      <p className="text-xs text-gray-400 font-medium">Reklam Alanı</p>
      <p className="text-xs text-gray-300 mt-1">Bu alana reklam verebilirsiniz</p>
    </div>
  )
  const handleTikla = () => {
    reklamTikla(reklam.id).catch(() => {})
    if (reklam.link_url) window.open(reklam.link_url, '_blank', 'noopener')
  }
  return (
    <button onClick={handleTikla}
      className="w-full border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow text-left">
      {reklam.resim_url ? (
        <img src={reklam.resim_url} alt={reklam.baslik} className="w-full h-32 object-cover" />
      ) : (
        <div className="w-full h-20 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">{reklam.firma_adi || reklam.baslik}</span>
        </div>
      )}
      <div className="p-3">
        <p className="text-xs font-bold text-gray-800 truncate">{reklam.baslik}</p>
        {reklam.aciklama && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{reklam.aciklama}</p>}
        {reklam.link_url && (
          <span className="text-xs text-blue-500 flex items-center gap-0.5 mt-1.5 font-medium">
            <ExternalLink size={10} /> Ziyaret Et
          </span>
        )}
      </div>
      <div className="px-3 pb-2">
        <span className="text-[10px] text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded font-medium">Reklam</span>
      </div>
    </button>
  )
}

export default function UstaListesi() {
  const { t } = useTranslation()
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
  const [reklamlar, setReklamlar] = useState({ sol: [], sag: [] })

  const kategoriAd = decodeURIComponent(searchParams.get('kategori_ad') || '')

  useEffect(() => {
    kategorileriGetir().then(r => setKategoriler(r.data.kategoriler || []))
    sehirleriGetir().then(r => setSehirler(r.data.sehirler || []))
  }, [])

  useEffect(() => {
    if (filtreler.kategori_id) {
      reklamlariGetir({ kategori_id: filtreler.kategori_id })
        .then(r => setReklamlar({ sol: r.data.sol || [], sag: r.data.sag || [] }))
        .catch(() => {})
    }
  }, [filtreler.kategori_id])

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

  const aramaTerimi = searchParams.get('arama') || ''
  const sehirTerimi = searchParams.get('sehir') || ''
  const seoBaslik = aramaTerimi
    ? `Kuzey Kıbrıs'ta ${aramaTerimi} Ustası Bul`
    : sehirTerimi
      ? `${sehirTerimi}'da Usta Bul — KKTC`
      : 'Kuzey Kıbrıs\'ta Usta Bul — Tüm Ustalar'
  const seoAciklama = aramaTerimi
    ? `KKTC'de ${aramaTerimi} için onaylı, güvenilir usta bul.`
    : 'Kuzey Kıbrıs\'ta 80+ hizmet kategorisinde onaylı usta bul.'

  const solReklam = reklamlar.sol[0] || null
  const sagReklam = reklamlar.sag[0] || null
  const gosterReklam = !!filtreler.kategori_id

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-10">
      <SEO
        baslik={seoBaslik}
        aciklama={seoAciklama}
        url={`/ustalar${aramaTerimi ? `?arama=${aramaTerimi}` : ''}`}
        anahtar={`${aramaTerimi} KKTC, ${aramaTerimi} Kuzey Kıbrıs, KKTC usta`}
      />
      {/* Başlık */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {kategoriAd || t('ustaListesi.baslik')}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {yukleniyor ? t('common.yukleniyor') : `${toplam} ${t('ustaListesi.ustaFound')}`}
          </p>
        </div>
        <button onClick={() => setFiltrePaneli(!filtrePaneli)}
          className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 hover:border-orange-400 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <SlidersHorizontal size={16} />
          {t('ustaListesi.filtrele')}
          {aktifFiltre && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
        </button>
      </div>

      {/* Filtre paneli */}
      {filtrePaneli && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('ustaListesi.arama')}</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={filtreler.arama}
                onChange={e => setFiltreler(f => ({ ...f, arama: e.target.value }))}
                placeholder={t('ustaListesi.aramaPlaceholder')}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('ustaListesi.hizmetTuru')}</label>
            <select value={filtreler.kategori_id}
              onChange={e => setFiltreler(f => ({ ...f, kategori_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white">
              <option value="">{t('ustaListesi.tumHizmetler')}</option>
              {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('ustaListesi.sehir')}</label>
            <select value={filtreler.sehir_id}
              onChange={e => setFiltreler(f => ({ ...f, sehir_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white">
              <option value="">{t('ustaListesi.tumSehirler')}</option>
              {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
            </select>
          </div>
          {aktifFiltre && (
            <div className="md:col-span-3 flex justify-end">
              <button onClick={temizle}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
                <X size={14} /> {t('ustaListesi.filtreleriTemizle')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ana içerik: sol reklam + usta grid + sağ reklam */}
      <div className={`flex gap-5 ${gosterReklam ? 'items-start' : ''}`}>

        {/* Sol reklam alanı */}
        {gosterReklam && (
          <div className="hidden xl:flex flex-col gap-3 w-44 flex-shrink-0 pt-1">
            <ReklamKutusu reklam={solReklam} />
            <ReklamKutusu reklam={reklamlar.sol[1] || null} />
          </div>
        )}

        {/* Usta listesi */}
        <div className="flex-1 min-w-0">
          {yukleniyor ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-52 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : ustalar.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <Search size={40} className="mx-auto mb-4 opacity-30" />
              <p className="font-medium text-gray-500">{t('ustaListesi.ustaBulunamadi')}</p>
              <p className="text-sm mt-1">{t('ustaListesi.farkliFiltre')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ustalar.map(u => <UstaKart key={u.id} usta={u} />)}
            </div>
          )}
        </div>

        {/* Sağ reklam alanı */}
        {gosterReklam && (
          <div className="hidden xl:flex flex-col gap-3 w-44 flex-shrink-0 pt-1">
            <ReklamKutusu reklam={sagReklam} />
            <ReklamKutusu reklam={reklamlar.sag[1] || null} />
          </div>
        )}
      </div>
    </div>
  )
}
