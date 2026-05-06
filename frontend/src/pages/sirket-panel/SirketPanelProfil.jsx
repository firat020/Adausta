import { useState, useEffect, useRef } from 'react'
import { Building2, Save, Upload } from 'lucide-react'
import { sirketPanelProfil, sirketPanelProfilGuncelle, sirketPanelLogoYukle, kategorileriGetir, sehirleriGetir } from '../../api'

const inputCls = "w-full border-2 border-gray-400 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
const labelCls = "text-sm font-bold text-gray-800 mb-1.5 block"

export default function SirketPanelProfil() {
  const [sirket, setSirket] = useState(null)
  const [kategoriler, setKategoriler] = useState([])
  const [sehirler, setSehirler] = useState([])
  const [ilceler, setIlceler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [basarili, setBasarili] = useState(false)
  const [hata, setHata] = useState('')
  const [logoYukleniyor, setLogoYukleniyor] = useState(false)
  const logoRef = useRef()

  const [form, setForm] = useState({
    sirket_adi: '', vergi_no: '', yetkili_ad: '',
    telefon: '', whatsapp: '', adres: '', aciklama: '', website: '',
    sehir_id: '', ilce_id: '', kategori_id: '',
  })

  useEffect(() => {
    Promise.all([
      sirketPanelProfil(),
      kategorileriGetir(),
      sehirleriGetir(),
    ]).then(([profil, katRes, sehRes]) => {
      const s = profil.data.sirket
      setSirket(s)
      setKategoriler(katRes.data.kategoriler || [])
      const tum = sehRes.data.sehirler || []
      setSehirler(tum)
      if (s.sehir_id) {
        const bulunan = tum.find(x => x.id === s.sehir_id)
        if (bulunan) setIlceler(bulunan.ilceler || [])
      }
      setForm({
        sirket_adi: s.sirket_adi || '',
        vergi_no: s.vergi_no || '',
        yetkili_ad: s.yetkili_ad || '',
        telefon: s.telefon || '',
        whatsapp: s.whatsapp || '',
        adres: s.adres || '',
        aciklama: s.aciklama || '',
        website: s.website || '',
        sehir_id: s.sehir_id || '',
        ilce_id: s.ilce_id || '',
        kategori_id: s.kategori_id || '',
      })
    }).catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [])

  const sehirDegisti = (sehir_id) => {
    setForm(f => ({ ...f, sehir_id, ilce_id: '' }))
    const s = sehirler.find(x => x.id === parseInt(sehir_id))
    setIlceler(s?.ilceler || [])
  }

  const kaydet = async (e) => {
    e.preventDefault()
    setHata('')
    setBasarili(false)
    setKaydediliyor(true)
    try {
      const r = await sirketPanelProfilGuncelle(form)
      setSirket(r.data.sirket)
      setBasarili(true)
      setTimeout(() => setBasarili(false), 3000)
    } catch (err) {
      setHata(err.response?.data?.hata || 'Bir hata oluştu')
    } finally {
      setKaydediliyor(false)
    }
  }

  const logoyukle = async (e) => {
    const dosya = e.target.files[0]
    if (!dosya) return
    const formData = new FormData()
    formData.append('dosya', dosya)
    setLogoYukleniyor(true)
    try {
      const r = await sirketPanelLogoYukle(formData)
      setSirket(s => ({ ...s, logo_url: r.data.url, logo: r.data.logo }))
    } catch {}
    finally { setLogoYukleniyor(false) }
  }

  if (yukleniyor) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Şirket Profili</h1>

      {/* Logo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 text-sm mb-4">Şirket Logosu</h2>
        <div className="flex items-center gap-5">
          {sirket?.logo_url ? (
            <img src={sirket.logo_url} alt="Logo"
              className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
          ) : (
            <div className="w-20 h-20 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Building2 size={28} className="text-indigo-300" />
            </div>
          )}
          <div>
            <button onClick={() => logoRef.current?.click()}
              disabled={logoYukleniyor}
              className="flex items-center gap-2 border border-indigo-200 text-indigo-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50">
              <Upload size={14} />
              {logoYukleniyor ? 'Yükleniyor...' : 'Logo Yükle'}
            </button>
            <p className="text-xs text-gray-400 mt-2">JPG, PNG, WEBP — maks 10MB</p>
            <input ref={logoRef} type="file" accept="image/*" onChange={logoyukle} className="hidden" />
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={kaydet} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Şirket Bilgileri */}
        <div className="p-5 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Building2 size={15} className="text-indigo-600" /> Şirket Bilgileri
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Şirket Adı</label>
              <input type="text" value={form.sirket_adi}
                onChange={e => setForm(f => ({ ...f, sirket_adi: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Vergi No</label>
              <input type="text" value={form.vergi_no}
                onChange={e => setForm(f => ({ ...f, vergi_no: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Yetkili Adı</label>
              <input type="text" value={form.yetkili_ad}
                onChange={e => setForm(f => ({ ...f, yetkili_ad: e.target.value }))}
                className={inputCls} />
            </div>
          </div>
        </div>

        {/* İletişim */}
        <div className="p-5 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">İletişim</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Telefon</label>
              <input type="tel" value={form.telefon}
                onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>WhatsApp</label>
              <input type="tel" value={form.whatsapp}
                onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Website</label>
              <input type="url" value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                className={inputCls} placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Konum */}
        <div className="p-5 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Konum</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Şehir</label>
              <select value={form.sehir_id} onChange={e => sehirDegisti(e.target.value)} className={inputCls}>
                <option value="">Şehir seçin</option>
                {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>İlçe</label>
              <select value={form.ilce_id} onChange={e => setForm(f => ({ ...f, ilce_id: e.target.value }))}
                disabled={!form.sehir_id} className={`${inputCls} disabled:bg-gray-50`}>
                <option value="">İlçe seçin</option>
                {ilceler.map(i => <option key={i.id} value={i.id}>{i.ad}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Adres</label>
              <input type="text" value={form.adres}
                onChange={e => setForm(f => ({ ...f, adres: e.target.value }))}
                className={inputCls} placeholder="Sokak, mahalle, bina no..." />
            </div>
          </div>
        </div>

        {/* Kategori & Hakkında */}
        <div className="p-5 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Hizmet & Açıklama</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Kategori</label>
              <select value={form.kategori_id} onChange={e => setForm(f => ({ ...f, kategori_id: e.target.value }))}
                className={inputCls}>
                <option value="">Kategori seçin</option>
                {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ikon} {k.ad}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Şirket Hakkında</label>
              <textarea rows={4} value={form.aciklama}
                onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
                className={`${inputCls} resize-none`} />
            </div>
          </div>
        </div>

        <div className="p-5">
          {hata && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{hata}</div>
          )}
          {basarili && (
            <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
              Profil başarıyla güncellendi!
            </div>
          )}
          <button type="submit" disabled={kaydediliyor}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
            <Save size={15} />
            {kaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}
