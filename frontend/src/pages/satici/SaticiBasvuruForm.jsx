import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Building2, CreditCard, FileText, Eye, ChevronRight, ChevronLeft, Plus, Trash2, Upload, AlertCircle, CheckCircle, Store } from 'lucide-react'
import API from '../../config.js'

const SIRKET_TURLERI = [
  { value: 'limited',  label: 'Limited Şirketi' },
  { value: 'anonim',   label: 'Anonim Şirketi' },
  { value: 'sahis',    label: 'Şahıs İşletmesi' },
  { value: 'diger',    label: 'Diğer' },
]

const BELGE_TURLERI = [
  { value: 'sirket_kayit',       label: 'Şirket Kayıt Belgesi' },
  { value: 'vergi_kayit',        label: 'Vergi Kayıt Belgesi' },
  { value: 'yetkili_kimlik',     label: 'Yetkili Kimlik Belgesi' },
  { value: 'banka_dogrulama',    label: 'Banka Hesap Doğrulama' },
  { value: 'diger',              label: 'Diğer' },
]

const ZORUNLU_BELGELER = [
  { tur: 'sirket_kayit',    label: 'Şirket Kayıt Belgesi' },
  { tur: 'vergi_kayit',     label: 'Vergi Kayıt Belgesi' },
  { tur: 'yetkili_kimlik',  label: 'Yetkili Kimlik Belgesi' },
  { tur: 'banka_dogrulama', label: 'Banka Hesap Doğrulama' },
]

const ADIM_BASLIKLAR = [
  { no: 1, label: 'Şirket Bilgileri',       ikon: Building2 },
  { no: 2, label: 'Banka & Mağaza',         ikon: CreditCard },
  { no: 3, label: 'Belge Yükleme',          ikon: FileText },
  { no: 4, label: 'Önizleme & Gönder',      ikon: Eye },
]

const BOS_EKSTRA_BELGE = () => ({ tur: 'diger', dosya: null, belge_no: '', verilis_tarihi: '', son_gecerlilik: '' })

const Hata = ({ mesaj }) => mesaj ? (
  <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{mesaj}</p>
) : null

const Alan = ({ label, zorunlu, hata, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label} {zorunlu && <span className="text-red-500">*</span>}
    </label>
    {children}
    <Hata mesaj={hata} />
  </div>
)

const Input = ({ hata, ...props }) => (
  <input
    {...props}
    className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-colors ${hata ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
  />
)

const Select = ({ hata, children, ...props }) => (
  <select
    {...props}
    className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-colors bg-white ${hata ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
  >
    {children}
  </select>
)

export default function SaticiBasvuruForm() {
  const navigate = useNavigate()

  const [adim, setAdim] = useState(1)
  const [basvuruId, setBasvuruId] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [hatalar, setHatalar] = useState({})

  const [adim1, setAdim1] = useState({
    ticari_unvan: '', magaza_adi: '', sirket_turu: '', vergi_no: '',
    vergi_dairesi: '', sirket_kayit_no: '', yetkili_ad: '',
    yetkili_telefon: '', yetkili_email: '', adres: '',
  })

  const [adim2, setAdim2] = useState({
    banka_hesap_sahibi: '', iban: '', magaza_aciklama: '',
    logo: null, logoOnizleme: null, kapak_gorsel: null,
  })

  const [belgeler, setBelgeler] = useState(
    ZORUNLU_BELGELER.map(b => ({ ...b, dosya: null, belge_no: '', verilis_tarihi: '', son_gecerlilik: '', yuklendi: false }))
  )
  const [ekstraBelgeler, setEkstraBelgeler] = useState([])

  const logoRef = useRef(null)
  const kapakRef = useRef(null)

  const degistir1 = (k, v) => {
    setAdim1(f => ({ ...f, [k]: v }))
    setHatalar(h => ({ ...h, [k]: '' }))
  }

  const degistir2 = (k, v) => {
    setAdim2(f => ({ ...f, [k]: v }))
    setHatalar(h => ({ ...h, [k]: '' }))
  }

  const logoSec = (e) => {
    const f = e.target.files[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    setAdim2(p => ({ ...p, logo: f, logoOnizleme: url }))
  }

  const kapakSec = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setAdim2(p => ({ ...p, kapak_gorsel: f }))
  }

  const belgeDegistir = (idx, alan, deger) => {
    setBelgeler(prev => {
      const kopy = [...prev]
      kopy[idx] = { ...kopy[idx], [alan]: deger }
      return kopy
    })
  }

  const belgeDosyaSec = (idx, dosya) => {
    setBelgeler(prev => {
      const kopy = [...prev]
      kopy[idx] = { ...kopy[idx], dosya }
      return kopy
    })
  }

  const ekstraEkle = () => setEkstraBelgeler(p => [...p, BOS_EKSTRA_BELGE()])

  const ekstraDegistir = (idx, alan, deger) => {
    setEkstraBelgeler(prev => {
      const kopy = [...prev]
      kopy[idx] = { ...kopy[idx], [alan]: deger }
      return kopy
    })
  }

  const ekstraSil = (idx) => setEkstraBelgeler(prev => prev.filter((_, i) => i !== idx))

  const dogrula1 = () => {
    const h = {}
    if (!adim1.ticari_unvan.trim()) h.ticari_unvan = 'Ticari ünvan zorunlu'
    if (!adim1.magaza_adi.trim()) h.magaza_adi = 'Mağaza adı zorunlu'
    if (!adim1.sirket_turu) h.sirket_turu = 'Şirket türü seçin'
    if (!adim1.vergi_no.trim()) h.vergi_no = 'Vergi numarası zorunlu'
    if (!adim1.yetkili_ad.trim()) h.yetkili_ad = 'Yetkili adı zorunlu'
    if (!adim1.yetkili_telefon.trim()) h.yetkili_telefon = 'Telefon zorunlu'
    if (!adim1.yetkili_email.trim()) h.yetkili_email = 'E-posta zorunlu'
    if (!adim1.adres.trim()) h.adres = 'Adres zorunlu'
    return h
  }

  const dogrula2 = () => {
    const h = {}
    if (!adim2.banka_hesap_sahibi.trim()) h.banka_hesap_sahibi = 'Hesap sahibi adı zorunlu'
    if (!adim2.iban.trim()) h.iban = 'IBAN zorunlu'
    return h
  }

  const dogrula3 = () => {
    const eksik = belgeler.filter(b => !b.dosya).map(b => b.label)
    if (eksik.length) return `Zorunlu belgeler eksik: ${eksik.join(', ')}`
    return ''
  }

  const ileriAdim1 = async () => {
    const h = dogrula1()
    if (Object.keys(h).length) { setHatalar(h); return }
    setYukleniyor(true)
    setHata('')
    try {
      const payload = { ...adim1 }
      if (basvuruId) {
        await axios.put(`${API}/api/satici/basvuru/${basvuruId}`, payload, { withCredentials: true })
      } else {
        const r = await axios.post(`${API}/api/satici/basvuru`, payload, { withCredentials: true })
        setBasvuruId(r.data.id || r.data.basvuru_id)
      }
      setAdim(2)
    } catch (err) {
      setHata(err.response?.data?.hata || 'Bir hata oluştu, tekrar deneyin.')
    }
    setYukleniyor(false)
  }

  const ileriAdim2 = async () => {
    const h = dogrula2()
    if (Object.keys(h).length) { setHatalar(h); return }
    setYukleniyor(true)
    setHata('')
    try {
      const fd = new FormData()
      fd.append('banka_hesap_sahibi', adim2.banka_hesap_sahibi)
      fd.append('iban', adim2.iban)
      fd.append('magaza_aciklama', adim2.magaza_aciklama)
      if (adim2.logo) fd.append('logo', adim2.logo)
      if (adim2.kapak_gorsel) fd.append('kapak_gorsel', adim2.kapak_gorsel)
      await axios.put(`${API}/api/satici/basvuru/${basvuruId}`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAdim(3)
    } catch (err) {
      setHata(err.response?.data?.hata || 'Bir hata oluştu, tekrar deneyin.')
    }
    setYukleniyor(false)
  }

  const ileriAdim3 = async () => {
    const eksikMesaj = dogrula3()
    if (eksikMesaj) { setHata(eksikMesaj); return }
    setYukleniyor(true)
    setHata('')
    try {
      const tumBelgeler = [
        ...belgeler,
        ...ekstraBelgeler.filter(b => b.dosya),
      ]
      for (const b of tumBelgeler) {
        if (!b.dosya) continue
        const fd = new FormData()
        fd.append('belge', b.dosya)
        fd.append('tur', b.tur)
        if (b.belge_no) fd.append('belge_no', b.belge_no)
        if (b.verilis_tarihi) fd.append('verilis_tarihi', b.verilis_tarihi)
        if (b.son_gecerlilik) fd.append('son_gecerlilik', b.son_gecerlilik)
        await axios.post(`${API}/api/satici/basvuru/${basvuruId}/belge`, fd, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      setBelgeler(prev => prev.map(b => ({ ...b, yuklendi: true })))
      setAdim(4)
    } catch (err) {
      setHata(err.response?.data?.hata || 'Belge yüklenirken hata oluştu.')
    }
    setYukleniyor(false)
  }

  const gonder = async () => {
    setYukleniyor(true)
    setHata('')
    try {
      await axios.post(`${API}/api/satici/basvuru/${basvuruId}/gonder`, {}, { withCredentials: true })
      navigate('/satici-basvuru/durum', { state: { basvuru_id: basvuruId } })
    } catch (err) {
      setHata(err.response?.data?.hata || 'Başvuru gönderilemedi, tekrar deneyin.')
    }
    setYukleniyor(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      <div className="flex items-center gap-2 mb-6">
        <Store size={20} className="text-blue-600" />
        <h1 className="text-lg font-black text-gray-900">Satıcı Başvurusu</h1>
      </div>

      <div className="flex items-center gap-1 mb-8">
        {ADIM_BASLIKLAR.map(({ no, label, ikon: Icon }) => (
          <div key={no} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center gap-1.5 flex-1 ${no < adim ? 'opacity-100' : no === adim ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black transition-colors ${
                no < adim ? 'bg-green-500 text-white' : no === adim ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {no < adim ? <CheckCircle size={14} /> : <Icon size={14} />}
              </div>
              <span className={`text-xs font-semibold hidden sm:block ${no === adim ? 'text-blue-700' : 'text-gray-500'}`}>{label}</span>
            </div>
            {no < 4 && <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />}
          </div>
        ))}
      </div>

      {hata && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
          <AlertCircle size={15} />
          {hata}
        </div>
      )}

      {adim === 1 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <Building2 size={18} className="text-blue-600" /> Şirket Bilgileri
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Alan label="Ticari Ünvan" zorunlu hata={hatalar.ticari_unvan}>
              <Input value={adim1.ticari_unvan} onChange={e => degistir1('ticari_unvan', e.target.value)} placeholder="Şirketin yasal adı" hata={hatalar.ticari_unvan} />
            </Alan>
            <Alan label="Mağaza Adı" zorunlu hata={hatalar.magaza_adi}>
              <Input value={adim1.magaza_adi} onChange={e => degistir1('magaza_adi', e.target.value)} placeholder="Pazar yerinde görünecek ad" hata={hatalar.magaza_adi} />
            </Alan>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Alan label="Şirket Türü" zorunlu hata={hatalar.sirket_turu}>
              <Select value={adim1.sirket_turu} onChange={e => degistir1('sirket_turu', e.target.value)} hata={hatalar.sirket_turu}>
                <option value="">Seçin...</option>
                {SIRKET_TURLERI.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Alan>
            <Alan label="Şirket Kayıt No" hata={hatalar.sirket_kayit_no}>
              <Input value={adim1.sirket_kayit_no} onChange={e => degistir1('sirket_kayit_no', e.target.value)} placeholder="Kayıt numarası" hata={hatalar.sirket_kayit_no} />
            </Alan>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Alan label="Vergi No" zorunlu hata={hatalar.vergi_no}>
              <Input value={adim1.vergi_no} onChange={e => degistir1('vergi_no', e.target.value)} placeholder="1234567890" hata={hatalar.vergi_no} />
            </Alan>
            <Alan label="Vergi Dairesi" hata={hatalar.vergi_dairesi}>
              <Input value={adim1.vergi_dairesi} onChange={e => degistir1('vergi_dairesi', e.target.value)} placeholder="Lefkoşa Vergi Dairesi" hata={hatalar.vergi_dairesi} />
            </Alan>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Yetkili Kişi</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Alan label="Ad Soyad" zorunlu hata={hatalar.yetkili_ad}>
                <Input value={adim1.yetkili_ad} onChange={e => degistir1('yetkili_ad', e.target.value)} placeholder="Yetkili adı soyadı" hata={hatalar.yetkili_ad} />
              </Alan>
              <Alan label="Telefon" zorunlu hata={hatalar.yetkili_telefon}>
                <Input value={adim1.yetkili_telefon} onChange={e => degistir1('yetkili_telefon', e.target.value)} placeholder="+90 5XX XXX XX XX" hata={hatalar.yetkili_telefon} />
              </Alan>
            </div>
            <div className="mt-4">
              <Alan label="E-posta" zorunlu hata={hatalar.yetkili_email}>
                <Input type="email" value={adim1.yetkili_email} onChange={e => degistir1('yetkili_email', e.target.value)} placeholder="yetkili@sirket.com" hata={hatalar.yetkili_email} />
              </Alan>
            </div>
          </div>
          <Alan label="Şirket Adresi" zorunlu hata={hatalar.adres}>
            <textarea
              value={adim1.adres}
              onChange={e => degistir1('adres', e.target.value)}
              rows={3}
              placeholder="Şirketin tam adresi..."
              className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-colors resize-none ${hatalar.adres ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
            />
          </Alan>
          <div className="flex justify-end pt-2">
            <button
              onClick={ileriAdim1}
              disabled={yukleniyor}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              {yukleniyor ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Kaydediliyor...</> : <>İleri <ChevronRight size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {adim === 2 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <CreditCard size={18} className="text-blue-600" /> Banka Bilgileri & Mağaza
          </h2>
          <Alan label="Banka Hesap Sahibi" zorunlu hata={hatalar.banka_hesap_sahibi}>
            <Input value={adim2.banka_hesap_sahibi} onChange={e => degistir2('banka_hesap_sahibi', e.target.value)} placeholder="Hesap sahibinin adı" hata={hatalar.banka_hesap_sahibi} />
          </Alan>
          <Alan label="IBAN" zorunlu hata={hatalar.iban}>
            <Input value={adim2.iban} onChange={e => degistir2('iban', e.target.value)} placeholder="TR00 0000 0000 0000 0000 0000 00" hata={hatalar.iban} />
          </Alan>
          <Alan label="Mağaza Açıklaması" hata={hatalar.magaza_aciklama}>
            <textarea
              value={adim2.magaza_aciklama}
              onChange={e => degistir2('magaza_aciklama', e.target.value)}
              rows={3}
              placeholder="Mağazanızı kısaca tanıtın..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 resize-none"
            />
          </Alan>

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mağaza Görselleri</p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Logo</label>
              <div
                onClick={() => logoRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-400 transition-colors flex items-center gap-4"
              >
                {adim2.logoOnizleme ? (
                  <img src={adim2.logoOnizleme} alt="Logo önizleme" className="w-16 h-16 object-contain rounded-lg border border-gray-200" />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Upload size={20} className="text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-700">{adim2.logo ? adim2.logo.name : 'Logo seç'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP — maks. 2MB</p>
                </div>
              </div>
              <input ref={logoRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={logoSec} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kapak Görseli</label>
              <div
                onClick={() => kapakRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-400 transition-colors flex items-center gap-3"
              >
                <Upload size={20} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">{adim2.kapak_gorsel ? adim2.kapak_gorsel.name : 'Kapak görseli seç'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP — önerilen: 1200×400</p>
                </div>
              </div>
              <input ref={kapakRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={kapakSec} />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setAdim(1)} className="flex items-center gap-1.5 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
              <ChevronLeft size={16} /> Geri
            </button>
            <button
              onClick={ileriAdim2}
              disabled={yukleniyor}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              {yukleniyor ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Kaydediliyor...</> : <>İleri <ChevronRight size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {adim === 3 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <FileText size={18} className="text-blue-600" /> Belge Yükleme
          </h2>
          <p className="text-xs text-gray-500">Tüm zorunlu belgeleri PDF, JPG veya PNG formatında yükleyin.</p>

          {belgeler.map((b, idx) => (
            <div key={b.tur} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">{b.label}</span>
                <span className="text-xs bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded-full">Zorunlu</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Dosya</label>
                <label className={`flex items-center gap-2 px-3 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-sm ${b.dosya ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 hover:border-blue-400 text-gray-500'}`}>
                  <Upload size={16} />
                  {b.dosya ? b.dosya.name : 'Dosya seç (PDF, JPG, PNG)'}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={e => belgeDosyaSec(idx, e.target.files[0] || null)}
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Belge No</label>
                  <input
                    value={b.belge_no}
                    onChange={e => belgeDegistir(idx, 'belge_no', e.target.value)}
                    placeholder="Opsiyonel"
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Veriliş Tarihi</label>
                  <input
                    type="date"
                    value={b.verilis_tarihi}
                    onChange={e => belgeDegistir(idx, 'verilis_tarihi', e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Son Geçerlilik</label>
                  <input
                    type="date"
                    value={b.son_gecerlilik}
                    onChange={e => belgeDegistir(idx, 'son_gecerlilik', e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}

          {ekstraBelgeler.map((b, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">İsteğe Bağlı Belge {idx + 1}</span>
                <button onClick={() => ekstraSil(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Belge Türü</label>
                <select
                  value={b.tur}
                  onChange={e => ekstraDegistir(idx, 'tur', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-white"
                >
                  {BELGE_TURLERI.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 px-3 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-sm border-gray-200 hover:border-blue-400 text-gray-500">
                  <Upload size={16} />
                  {b.dosya ? b.dosya.name : 'Dosya seç (PDF, JPG, PNG)'}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={e => ekstraDegistir(idx, 'dosya', e.target.files[0] || null)}
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Belge No</label>
                  <input value={b.belge_no} onChange={e => ekstraDegistir(idx, 'belge_no', e.target.value)} placeholder="Opsiyonel" className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Veriliş Tarihi</label>
                  <input type="date" value={b.verilis_tarihi} onChange={e => ekstraDegistir(idx, 'verilis_tarihi', e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Son Geçerlilik</label>
                  <input type="date" value={b.son_gecerlilik} onChange={e => ekstraDegistir(idx, 'son_gecerlilik', e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={ekstraEkle}
            className="flex items-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 font-semibold hover:border-blue-400 hover:text-blue-600 transition-colors justify-center"
          >
            <Plus size={16} /> İsteğe Bağlı Belge Ekle
          </button>

          <div className="flex justify-between pt-2">
            <button onClick={() => setAdim(2)} className="flex items-center gap-1.5 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
              <ChevronLeft size={16} /> Geri
            </button>
            <button
              onClick={ileriAdim3}
              disabled={yukleniyor}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              {yukleniyor ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Yükleniyor...</> : <>İleri <ChevronRight size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {adim === 4 && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
            <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Eye size={18} className="text-blue-600" /> Önizleme & Gönder
            </h2>
            <p className="text-sm text-gray-500">Bilgilerinizi kontrol edin. Onayladıktan sonra başvurunuzu gönderin.</p>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Şirket Bilgileri</p>
              {[
                ['Ticari Ünvan', adim1.ticari_unvan],
                ['Mağaza Adı', adim1.magaza_adi],
                ['Şirket Türü', SIRKET_TURLERI.find(t => t.value === adim1.sirket_turu)?.label || '-'],
                ['Vergi No', adim1.vergi_no],
                ['Vergi Dairesi', adim1.vergi_dairesi],
                ['Şirket Kayıt No', adim1.sirket_kayit_no],
                ['Yetkili', adim1.yetkili_ad],
                ['Telefon', adim1.yetkili_telefon],
                ['E-posta', adim1.yetkili_email],
                ['Adres', adim1.adres],
              ].map(([k, v]) => v ? (
                <div key={k} className="flex justify-between text-sm py-0.5">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-800 text-right max-w-xs truncate">{v}</span>
                </div>
              ) : null)}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Banka & Mağaza</p>
              {[
                ['Hesap Sahibi', adim2.banka_hesap_sahibi],
                ['IBAN', adim2.iban],
                ['Mağaza Açıklaması', adim2.magaza_aciklama],
                ['Logo', adim2.logo?.name],
                ['Kapak Görseli', adim2.kapak_gorsel?.name],
              ].map(([k, v]) => v ? (
                <div key={k} className="flex justify-between text-sm py-0.5">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-800 text-right max-w-xs truncate">{v}</span>
                </div>
              ) : null)}
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Yüklenen Belgeler</p>
              <div className="space-y-1.5">
                {belgeler.map(b => (
                  <div key={b.tur} className="flex items-center gap-2 text-sm">
                    {b.dosya
                      ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                      : <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                    }
                    <span className={b.dosya ? 'text-gray-700' : 'text-red-500'}>{b.label}</span>
                    {b.dosya && <span className="text-gray-400 text-xs truncate">— {b.dosya.name}</span>}
                  </div>
                ))}
                {ekstraBelgeler.filter(b => b.dosya).map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{BELGE_TURLERI.find(t => t.value === b.tur)?.label} — {b.dosya.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setAdim(3)} className="flex items-center gap-1.5 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
              <ChevronLeft size={16} /> Geri
            </button>
            <button
              onClick={gonder}
              disabled={yukleniyor}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              {yukleniyor
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gönderiliyor...</>
                : <><CheckCircle size={16} /> Başvuruyu Gönder</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
