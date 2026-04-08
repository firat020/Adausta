import { useState, useEffect } from 'react'
import { CheckCircle, User, Phone, MapPin, Briefcase, FileText } from 'lucide-react'
import { kategorileriGetir, sehirleriGetir, ustaKayit } from '../api'

export default function UstaKayit() {
  const [kategoriler, setKategoriler] = useState([])
  const [sehirler, setSehirler] = useState([])
  const [ilceler, setIlceler] = useState([])
  const [basarili, setBasarili] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const [form, setForm] = useState({
    ad: '', soyad: '', telefon: '', whatsapp: '',
    email: '', sehir_id: '', ilce_id: '',
    kategori_id: '', aciklama: '', deneyim_yil: '',
  })

  useEffect(() => {
    kategorileriGetir().then(r => setKategoriler(r.data.kategoriler || []))
    sehirleriGetir().then(r => setSehirler(r.data.sehirler || []))
  }, [])

  const sehirDegisti = (sehir_id) => {
    setForm(f => ({ ...f, sehir_id, ilce_id: '' }))
    const s = sehirler.find(s => s.id === parseInt(sehir_id))
    setIlceler(s?.ilceler || [])
  }

  const gonder = async (e) => {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)
    try {
      await ustaKayit({
        ...form,
        sehir_id: parseInt(form.sehir_id),
        ilce_id: form.ilce_id ? parseInt(form.ilce_id) : null,
        kategori_id: parseInt(form.kategori_id),
        deneyim_yil: parseInt(form.deneyim_yil) || 0,
      })
      setBasarili(true)
    } catch (err) {
      setHata(err.response?.data?.hata || 'Bir hata olustu.')
    } finally {
      setYukleniyor(false)
    }
  }

  if (basarili) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={36} className="text-emerald-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Kaydiniz Alindi</h2>
      <p className="text-gray-500 leading-relaxed">
        Bilgileriniz incelendikten sonra profiliniz yayinlanacak. Tesekkurler!
      </p>
    </div>
  )

  const inputCls = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
  const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block"

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Usta Olarak Kaydol</h1>
        <p className="text-gray-500 text-sm">Profilinizi olusturun, KKTC genelinde musterilere ulasin. Ucretsiz.</p>
      </div>

      <form onSubmit={gonder} className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">

        {/* Kisisel */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-orange-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Kisisel Bilgiler</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ad *</label>
              <input type="text" required value={form.ad}
                onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                className={inputCls} placeholder="Adiniz" />
            </div>
            <div>
              <label className={labelCls}>Soyad</label>
              <input type="text" value={form.soyad}
                onChange={e => setForm(f => ({ ...f, soyad: e.target.value }))}
                className={inputCls} placeholder="Soyadiniz" />
            </div>
          </div>
        </div>

        {/* Iletisim */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center gap-2 mb-5">
            <Phone size={16} className="text-orange-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Iletisim</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Telefon *</label>
              <input type="tel" required value={form.telefon}
                onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                className={inputCls} placeholder="+90 548 000 0000" />
            </div>
            <div>
              <label className={labelCls}>WhatsApp</label>
              <input type="tel" value={form.whatsapp}
                onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                className={inputCls} placeholder="+90 548 000 0000" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>E-posta</label>
              <input type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputCls} placeholder="ornek@email.com" />
            </div>
          </div>
        </div>

        {/* Konum */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={16} className="text-orange-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Konum</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Sehir *</label>
              <select required value={form.sehir_id}
                onChange={e => sehirDegisti(e.target.value)}
                className={inputCls}>
                <option value="">Sehir secin...</option>
                {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ilce</label>
              <select value={form.ilce_id}
                onChange={e => setForm(f => ({ ...f, ilce_id: e.target.value }))}
                disabled={!form.sehir_id}
                className={`${inputCls} disabled:bg-gray-50 disabled:cursor-not-allowed`}>
                <option value="">Ilce secin...</option>
                {ilceler.map(i => <option key={i.id} value={i.id}>{i.ad}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Hizmet */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center gap-2 mb-5">
            <Briefcase size={16} className="text-orange-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Hizmet Bilgileri</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Hizmet Turu *</label>
              <select required value={form.kategori_id}
                onChange={e => setForm(f => ({ ...f, kategori_id: e.target.value }))}
                className={inputCls}>
                <option value="">Hizmet secin...</option>
                {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Deneyim (yil)</label>
              <input type="number" min="0" max="50" value={form.deneyim_yil}
                onChange={e => setForm(f => ({ ...f, deneyim_yil: e.target.value }))}
                className={inputCls} placeholder="0" />
            </div>
          </div>
        </div>

        {/* Hakkinda */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center gap-2 mb-5">
            <FileText size={16} className="text-orange-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Hakkinda</h3>
          </div>
          <textarea value={form.aciklama}
            onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
            rows={4} className={`${inputCls} resize-none`}
            placeholder="Kendinizi ve sundugunuz hizmetleri kisaca anlatIn..." />
        </div>

        {/* Gonder */}
        <div className="p-6">
          {hata && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              {hata}
            </div>
          )}
          <button type="submit" disabled={yukleniyor}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white font-semibold py-3.5 rounded-xl transition-colors">
            {yukleniyor ? 'Gonderiliyor...' : 'Kaydi Tamamla'}
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            Bilgileriniz incelendikten sonra profiliniz yayinlanacaktir.
          </p>
        </div>
      </form>
    </div>
  )
}
