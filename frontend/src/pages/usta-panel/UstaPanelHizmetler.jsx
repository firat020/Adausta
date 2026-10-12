import { useEffect, useMemo, useState } from 'react'
import { Wrench, Star, Clock, Trash2, Plus, Search, Save, CheckCircle, AlertCircle, Lock, Rocket, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ustaHizmetlerGetir, ustaHizmetlerKaydet, kategorileriGetir, ustaHizmetBolgesiGetir, ustaHizmetBolgesiKaydet } from '../../api'

export default function UstaPanelHizmetler() {
  const [hizmetler, setHizmetler] = useState([])   // [{id, ad, ikon, ana, fiyat, uzmanlik, yedi_yirmi_dort, promosyon_aktif}]
  const [limit, setLimit] = useState(6)
  const [maxUzmanlik, setMaxUzmanlik] = useState(3)
  const [tumKategoriler, setTumKategoriler] = useState([])
  const [arama, setArama] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [mesaj, setMesaj] = useState({ tip: '', metin: '' })
  const [degisti, setDegisti] = useState(false)

  // Hizmet Bölgesi: kendi ilçesi dışında hizmet verdiği ilçeleri kendi işaretler
  const [bolgeYukleniyor, setBolgeYukleniyor] = useState(true)
  const [bolgeKendiIlceId, setBolgeKendiIlceId] = useState(null)
  const [bolgeSecenekler, setBolgeSecenekler] = useState([])
  const [bolgeSecili, setBolgeSecili] = useState([])
  const [bolgeLimit, setBolgeLimit] = useState(8)
  const [bolgeDegisti, setBolgeDegisti] = useState(false)
  const [bolgeKaydediliyor, setBolgeKaydediliyor] = useState(false)
  const [bolgeMesaj, setBolgeMesaj] = useState({ tip: '', metin: '' })

  useEffect(() => {
    Promise.all([ustaHizmetlerGetir(), kategorileriGetir()])
      .then(([h, k]) => {
        setHizmetler(h.data.hizmetler); setLimit(h.data.limit); setMaxUzmanlik(h.data.max_uzmanlik)
        setTumKategoriler(k.data.kategoriler || [])
      })
      .catch(() => setMesaj({ tip: 'hata', metin: 'Hizmetler yüklenemedi. Sayfayı yenileyip tekrar dene.' }))
      .finally(() => setYukleniyor(false))

    ustaHizmetBolgesiGetir()
      .then(({ data }) => {
        setBolgeKendiIlceId(data.kendi_ilce_id)
        setBolgeSecenekler(data.secenekler || [])
        setBolgeSecili((data.secili_ilce_ids || []).filter(id => id !== data.kendi_ilce_id))
        setBolgeLimit(data.limit)
      })
      .catch(() => {})
      .finally(() => setBolgeYukleniyor(false))
  }, [])

  const bolgeToggle = (ilceId) => {
    setBolgeDegisti(true); setBolgeMesaj({ tip: '', metin: '' })
    setBolgeSecili(l => l.includes(ilceId) ? l.filter(x => x !== ilceId) : [...l, ilceId])
  }

  const bolgeKaydet = async () => {
    setBolgeKaydediliyor(true); setBolgeMesaj({ tip: '', metin: '' })
    try {
      const { data } = await ustaHizmetBolgesiKaydet(bolgeSecili)
      setBolgeSecili((data.hizmet_bolgesi_ilceler || []).map(i => i.id).filter(id => id !== bolgeKendiIlceId))
      setBolgeDegisti(false)
      setBolgeMesaj({ tip: 'basari', metin: 'Hizmet bölgen kaydedildi. Profilinde güncel haliyle görünüyor.' })
    } catch (e) {
      setBolgeMesaj({ tip: 'hata', metin: e.response?.data?.hata || 'Kaydedilemedi, tekrar dene.' })
    } finally { setBolgeKaydediliyor(false) }
  }

  const secili = useMemo(() => new Set(hizmetler.map(h => h.id)), [hizmetler])
  const uzmanlikSayisi = hizmetler.filter(h => h.uzmanlik).length
  const doldu = hizmetler.length >= limit

  const adaylar = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase('tr')
    return tumKategoriler.filter(k => !secili.has(k.id) && (!q || k.ad.toLocaleLowerCase('tr').includes(q))).slice(0, 12)
  }, [tumKategoriler, secili, arama])

  const guncelle = (id, alan, deger) => {
    setDegisti(true); setMesaj({ tip: '', metin: '' })
    setHizmetler(l => l.map(h => (h.id === id ? { ...h, [alan]: deger } : h)))
  }
  const ekle = (k) => {
    setDegisti(true); setMesaj({ tip: '', metin: '' })
    setHizmetler(l => [...l, { id: k.id, ad: k.ad, ikon: k.ikon, ana: false, fiyat: '', uzmanlik: false, yedi_yirmi_dort: false }])
    setArama('')
  }
  const cikar = (id) => { setDegisti(true); setMesaj({ tip: '', metin: '' }); setHizmetler(l => l.filter(h => h.id !== id)) }

  const kaydet = async () => {
    setKaydediliyor(true); setMesaj({ tip: '', metin: '' })
    try {
      const detaylar = Object.fromEntries(hizmetler.map(h => [h.id, { fiyat: h.fiyat, uzmanlik: h.uzmanlik, yedi_yirmi_dort: h.yedi_yirmi_dort }]))
      const { data } = await ustaHizmetlerKaydet({ ek_kategori_ids: hizmetler.filter(h => !h.ana).map(h => h.id), detaylar })
      setHizmetler(data.hizmetler); setDegisti(false)
      setMesaj({ tip: 'basari', metin: 'Hizmetlerin kaydedildi. Profilinde güncel haliyle görünüyor.' })
    } catch (e) {
      setMesaj({ tip: 'hata', metin: e.response?.data?.hata || 'Kaydedilemedi, tekrar dene.' })
    } finally { setKaydediliyor(false) }
  }

  if (yukleniyor) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Hizmetlerim</h1>
        <p className="text-sm text-gray-500 mt-1">Sunduğun hizmetleri seç; fiyat bilgisi, uzmanlık ve 7/24 işaretiyle müşteriye güven ver.</p>
      </div>

      {mesaj.metin && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${mesaj.tip === 'basari' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
          {mesaj.tip === 'basari' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {mesaj.metin}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {hizmetler.map(h => (
          <div key={h.id} className="p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{h.ikon || '🔧'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{h.ad}</p>
                <p className="text-xs text-gray-400">
                  {h.ana ? 'Ana hizmet (değişiklik için bizimle iletişime geç)' : 'Ek hizmet'}
                  {h.promosyon_aktif && <span className="ml-2 inline-flex items-center gap-1 text-violet-600 font-semibold"><Rocket size={11} /> öne çıkarılıyor</span>}
                </p>
              </div>
              {!h.ana && (
                h.promosyon_aktif ? (
                  <span title="Aktif öne çıkarma süresi bitmeden kaldırılamaz" className="p-2 text-gray-300"><Lock size={16} /></span>
                ) : (
                  <button type="button" onClick={() => cikar(h.id)} aria-label={`${h.ad} hizmetini kaldır`} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                    <Trash2 size={16} />
                  </button>
                )
              )}
            </div>
            <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-center">
              <input value={h.fiyat} maxLength={60} onChange={e => guncelle(h.id, 'fiyat', e.target.value)}
                placeholder="Fiyat bilgisi (örn. 300 TL'den başlar)"
                className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => guncelle(h.id, 'uzmanlik', !h.uzmanlik)} disabled={!h.uzmanlik && uzmanlikSayisi >= maxUzmanlik}
                title={!h.uzmanlik && uzmanlikSayisi >= maxUzmanlik ? `En fazla ${maxUzmanlik} uzmanlık seçebilirsin` : 'Uzmanlık olarak işaretle'}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition disabled:opacity-40 ${h.uzmanlik ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-300 text-gray-600 hover:border-amber-300'}`}>
                <Star size={14} className={h.uzmanlik ? 'fill-amber-400 text-amber-500' : ''} /> Uzmanlık
              </button>
              <button type="button" onClick={() => guncelle(h.id, 'yedi_yirmi_dort', !h.yedi_yirmi_dort)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition ${h.yedi_yirmi_dort ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-300 text-gray-600 hover:border-emerald-300'}`}>
                <Clock size={14} /> 7/24
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 -mt-3">
        {hizmetler.length}/{limit} hizmet · {uzmanlikSayisi}/{maxUzmanlik} uzmanlık. "Uzmanlık" ve "7/24" yalnızca gerçekten geçerliyse işaretle. Öne çıkarma için{' '}
        <Link to="/usta/panel/abonelik" className="text-blue-600 hover:underline">Abonelik ve Öne Çıkarma</Link> sayfasına bak.
      </p>

      {/* Hizmet ekle */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Plus size={18} className="text-blue-600" /> Hizmet ekle</h2>
        {doldu ? (
          <p className="text-sm text-gray-500">En fazla {limit} hizmet ekleyebilirsin. Yeni hizmet için önce birini kaldır.</p>
        ) : (
          <>
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={arama} onChange={e => setArama(e.target.value)} placeholder="Hizmet ara (örn. klima, boya, nakliyat)"
                className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-wrap gap-2">
              {adaylar.map(k => (
                <button key={k.id} type="button" onClick={() => ekle(k)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition">
                  <span>{k.ikon || '🔧'}</span> {k.ad} <Plus size={12} className="text-blue-600" />
                </button>
              ))}
              {adaylar.length === 0 && <p className="text-sm text-gray-400">Eşleşen hizmet yok.</p>}
            </div>
          </>
        )}
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <button type="button" onClick={kaydet} disabled={!degisti || kaydediliyor}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold px-7 py-3 rounded-xl shadow-lg transition">
          {kaydediliyor ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save size={16} />}
          {degisti ? 'Değişiklikleri kaydet' : 'Kaydedildi'}
        </button>
      </div>

      {/* Hizmet Bölgesi */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><MapPin size={18} className="text-blue-600" /> Hizmet Bölgesi</h2>
        <p className="text-sm text-gray-500 mb-4">Hizmet verdiğin ilçeleri işaretle, profilinde ve aramalarda gösterilsin.</p>

        {bolgeMesaj.metin && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border mb-4 ${bolgeMesaj.tip === 'basari' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
            {bolgeMesaj.tip === 'basari' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {bolgeMesaj.metin}
          </div>
        )}

        {bolgeYukleniyor ? (
          <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
        ) : bolgeSecenekler.length === 0 ? (
          <p className="text-sm text-gray-400">Şehrin için ilçe listesi bulunamadı.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              {bolgeSecenekler.filter(i => i.id === bolgeKendiIlceId).map(i => (
                <span key={i.id} title="Kendi ilçen, her zaman dahil" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-blue-300 bg-blue-50 text-blue-700">
                  <MapPin size={12} /> {i.ad}
                </span>
              ))}
              {bolgeSecenekler.filter(i => i.id !== bolgeKendiIlceId).map(i => {
                const secili = bolgeSecili.includes(i.id)
                const kapali = !secili && (bolgeSecili.length + 1) >= bolgeLimit
                return (
                  <button key={i.id} type="button" onClick={() => bolgeToggle(i.id)} disabled={kapali}
                    title={kapali ? `En fazla ${bolgeLimit} ilçe seçebilirsin` : ''}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition disabled:opacity-40 ${secili ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-white border-gray-300 text-gray-600 hover:border-orange-300'}`}>
                    {i.ad}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mb-4">{bolgeSecili.length + 1}/{bolgeLimit} ilçe (kendi ilçen dahil)</p>
            <div className="flex justify-end">
              <button type="button" onClick={bolgeKaydet} disabled={!bolgeDegisti || bolgeKaydediliyor}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm">
                {bolgeKaydediliyor ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save size={14} />}
                {bolgeDegisti ? 'Hizmet bölgesini kaydet' : 'Kaydedildi'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
