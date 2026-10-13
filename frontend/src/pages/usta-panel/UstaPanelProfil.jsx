import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { User, Phone, Mail, MapPin, Briefcase, Camera, Trash2, Save, CheckCircle, AlertCircle, Tag, CreditCard, RefreshCw, LocateFixed, Check, Upload, Globe, Clock, Wallet, Image as ImageIcon, Users, Award, Plus } from 'lucide-react'
import { DILLER, ODEME_YONTEMLERI, GUNLER, VARSAYILAN_SAATLER } from '../../data/profilSecenekleri.js'
import { ustaPanelProfil, ustaPanelProfilGuncelle, ustaPanelFotografYukle, ustaPanelFotografSil, ustaPanelLogoYukle, ustaPanelLogoSil, ustaPanelKapakYukle, ustaPanelKapakSil, sehirleriGetir, ustaAbonelikGetir, ustaOtomatikYenilemeAyarla, ustaPanelEkipGetir, ustaPanelEkipEkle, ustaPanelEkipSil, ustaPanelOdullerGetir, ustaPanelOdulEkle, ustaPanelOdulSil } from '../../api'
import axios from 'axios'
import TelefonDogrulama from '../../components/TelefonDogrulama'

import API from '../../config.js'
const API_URL = API

export default function UstaPanelProfil() {
  const [usta, setUsta] = useState(null)
  const [sehirler, setSehirler] = useState([])
  const [kategoriler, setKategoriler] = useState({ ana_kategori: null, ek_kategoriler: [] })
  const [form, setForm] = useState({})
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kayıtYukleniyor, setKayitYukleniyor] = useState(false)
  const [mesaj, setMesaj] = useState({ tip: '', metin: '' })
  const [abonelik, setAbonelik] = useState(null)
  const [abonelikYukleniyor, setAbonelikYukleniyor] = useState(false)
  const [ilceler, setIlceler] = useState([])
  const [konumDurumu, setKonumDurumu] = useState('') // '' | 'yukleniyor' | 'basarili' | 'hata' | 'desteklenmiyor'
  const [logoYukleniyor, setLogoYukleniyor] = useState(false)
  const [kapakYukleniyor, setKapakYukleniyor] = useState(false)
  const kapakRef = useRef()
  const fileRef = useRef()
  const logoRef = useRef()

  // Ekibimiz (Faz 2 Görev 7 — sadece görünüm amaçlı, yetkilendirme sistemi değil)
  const [ekip, setEkip] = useState([])
  const [ekipForm, setEkipForm] = useState({ ad: '', rol: '' })
  const [ekipFoto, setEkipFoto] = useState(null)
  const [ekipGonderiliyor, setEkipGonderiliyor] = useState(false)
  const ekipFotoRef = useRef()

  // Ödüller (Faz 2 Görev 9 — public vitrin, admin onayı gerekmez)
  const [oduller, setOduller] = useState([])
  const [odulForm, setOdulForm] = useState({ baslik: '', veren_kurum: '', yil: '', aciklama: '' })
  const [odulGonderiliyor, setOdulGonderiliyor] = useState(false)

  const ekipYukle = () => ustaPanelEkipGetir().then(r => setEkip(r.data.ekip || [])).catch(() => {})
  const odulYukle = () => ustaPanelOdullerGetir().then(r => setOduller(r.data.oduller || [])).catch(() => {})

  useEffect(() => { ekipYukle(); odulYukle() }, [])

  const ekipEkle = async (e) => {
    e.preventDefault()
    if (!ekipForm.ad.trim()) return
    setEkipGonderiliyor(true)
    try {
      const fd = new FormData()
      fd.append('ad', ekipForm.ad.trim())
      fd.append('rol', ekipForm.rol.trim())
      if (ekipFoto) fd.append('dosya', ekipFoto)
      await ustaPanelEkipEkle(fd)
      setEkipForm({ ad: '', rol: '' })
      setEkipFoto(null)
      if (ekipFotoRef.current) ekipFotoRef.current.value = ''
      ekipYukle()
    } catch (err) {
      setMesaj({ tip: 'hata', metin: err.response?.data?.hata || 'Ekip üyesi eklenemedi.' })
    } finally {
      setEkipGonderiliyor(false)
    }
  }

  const ekipSilTikla = async (id) => {
    if (!window.confirm('Bu ekip üyesini silmek istediğinize emin misiniz?')) return
    try {
      await ustaPanelEkipSil(id)
      setEkip(prev => prev.filter(e => e.id !== id))
    } catch {
      setMesaj({ tip: 'hata', metin: 'Ekip üyesi silinemedi.' })
    }
  }

  const odulEkle = async (e) => {
    e.preventDefault()
    if (!odulForm.baslik.trim()) return
    setOdulGonderiliyor(true)
    try {
      await ustaPanelOdulEkle({
        baslik: odulForm.baslik.trim(),
        veren_kurum: odulForm.veren_kurum.trim(),
        yil: odulForm.yil ? Number(odulForm.yil) : null,
        aciklama: odulForm.aciklama.trim(),
      })
      setOdulForm({ baslik: '', veren_kurum: '', yil: '', aciklama: '' })
      odulYukle()
    } catch (err) {
      setMesaj({ tip: 'hata', metin: err.response?.data?.hata || 'Ödül eklenemedi.' })
    } finally {
      setOdulGonderiliyor(false)
    }
  }

  const odulSilTikla = async (id) => {
    if (!window.confirm('Bu ödülü silmek istediğinize emin misiniz?')) return
    try {
      await ustaPanelOdulSil(id)
      setOduller(prev => prev.filter(o => o.id !== id))
    } catch {
      setMesaj({ tip: 'hata', metin: 'Ödül silinemedi.' })
    }
  }

  const abonelikiYenile = () => {
    ustaAbonelikGetir().then(r => setAbonelik(r.data)).catch(() => {})
  }

  useEffect(() => {
    Promise.all([
      ustaPanelProfil(),
      sehirleriGetir(),
      axios.get(`${API_URL}/api/usta/kategorilerim`, { withCredentials: true }).catch(() => ({ data: {} }))
    ]).then(([r, s, k]) => {
        setUsta(r.data.usta)
        setForm({
          ad: r.data.usta.ad || '',
          soyad: r.data.usta.soyad || '',
          telefon: r.data.usta.telefon || '',
          whatsapp: r.data.usta.whatsapp || '',
          email: r.data.usta.email || '',
          aciklama: r.data.usta.aciklama || '',
          deneyim_yil: r.data.usta.deneyim_yil || 0,
          sehir_id: r.data.usta.sehir_id || '',
          ilce_id: r.data.usta.ilce_id || '',
          lat: r.data.usta.lat ?? null,
          lng: r.data.usta.lng ?? null,
          diller: r.data.usta.diller || [],
          odeme_yontemleri: r.data.usta.odeme_yontemleri || [],
          yedi_yirmi_dort: !!r.data.usta.yedi_yirmi_dort,
          web_sitesi: r.data.usta.web_sitesi || '',
          calisma_saatleri: Object.keys(r.data.usta.calisma_saatleri || {}).length
            ? r.data.usta.calisma_saatleri : VARSAYILAN_SAATLER,
        })
        const sehirListesi = s.data.sehirler || []
        setSehirler(sehirListesi)
        const mevcutSehir = sehirListesi.find(sh => sh.id === r.data.usta.sehir_id)
        setIlceler(mevcutSehir?.ilceler || [])
        if (k.data.ana_kategori) setKategoriler(k.data)
      })
      .finally(() => setYukleniyor(false))
    abonelikiYenile()
  }, [])

  const sehirDegisti = (sehir_id) => {
    setForm(p => ({ ...p, sehir_id, ilce_id: '' }))
    const s = sehirler.find(sh => sh.id === parseInt(sehir_id))
    setIlceler(s?.ilceler || [])
  }

  const konumAl = () => {
    if (!navigator.geolocation) { setKonumDurumu('desteklenmiyor'); return }
    setKonumDurumu('yukleniyor')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(p => ({ ...p, lat: pos.coords.latitude, lng: pos.coords.longitude }))
        setKonumDurumu('basarili')
      },
      () => setKonumDurumu('hata'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleOtomatikYenileme = async (acik) => {
    setAbonelikYukleniyor(true)
    try {
      await ustaOtomatikYenilemeAyarla(acik)
      abonelikiYenile()
    } catch (err) {
      setMesaj({ tip: 'hata', metin: err.response?.data?.hata || 'İşlem başarısız, tekrar deneyin' })
    } finally {
      setAbonelikYukleniyor(false)
    }
  }

  const handleKaydet = async (e) => {
    e.preventDefault()
    setKayitYukleniyor(true)
    setMesaj({ tip: '', metin: '' })
    try {
      const r = await ustaPanelProfilGuncelle(form)
      setUsta(r.data.usta)
      setMesaj({ tip: 'basari', metin: 'Profil başarıyla güncellendi!' })
    } catch {
      setMesaj({ tip: 'hata', metin: 'Güncelleme başarısız. Tekrar deneyin.' })
    } finally {
      setKayitYukleniyor(false)
    }
  }

  const handleFotografYukle = async (e) => {
    const dosya = e.target.files[0]
    if (!dosya) return
    const fd = new FormData()
    fd.append('dosya', dosya)
    try {
      const r = await ustaPanelFotografYukle(fd)
      setUsta(prev => ({
        ...prev,
        fotograflar: [...(prev.fotograflar || []), r.data.fotograf]
      }))
    } catch {
      setMesaj({ tip: 'hata', metin: 'Fotoğraf yüklenemedi.' })
    }
  }

  const handleFotografSil = async (fid) => {
    if (!window.confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return
    try {
      await ustaPanelFotografSil(fid)
      setUsta(prev => ({
        ...prev,
        fotograflar: prev.fotograflar.filter(f => f.id !== fid)
      }))
    } catch {
      setMesaj({ tip: 'hata', metin: 'Fotoğraf silinemedi.' })
    }
  }

  const handleLogoYukle = async (e) => {
    const dosya = e.target.files[0]
    if (!dosya) return
    const fd = new FormData()
    fd.append('dosya', dosya)
    setLogoYukleniyor(true)
    try {
      const r = await ustaPanelLogoYukle(fd)
      setUsta(prev => ({ ...prev, logo: r.data.logo, logo_url: r.data.logo_url }))
    } catch {
      setMesaj({ tip: 'hata', metin: 'Logo yüklenemedi.' })
    }
    setLogoYukleniyor(false)
    if (logoRef.current) logoRef.current.value = ''
  }

  const handleLogoSil = async () => {
    if (!window.confirm('Logoyu kaldırmak istediğinize emin misiniz?')) return
    try {
      await ustaPanelLogoSil()
      setUsta(prev => ({ ...prev, logo: '', logo_url: null }))
    } catch {
      setMesaj({ tip: 'hata', metin: 'Logo kaldırılamadı.' })
    }
  }

  const handleKapakYukle = async (e) => {
    const dosya = e.target.files[0]
    if (!dosya) return
    const fd = new FormData()
    fd.append('dosya', dosya)
    setKapakYukleniyor(true)
    try {
      const r = await ustaPanelKapakYukle(fd)
      setUsta(prev => ({ ...prev, kapak_url: r.data.kapak_url }))
    } catch {
      setMesaj({ tip: 'hata', metin: 'Kapak görseli yüklenemedi.' })
    }
    setKapakYukleniyor(false)
    if (kapakRef.current) kapakRef.current.value = ''
  }

  const handleKapakSil = async () => {
    if (!window.confirm('Kapak görselini kaldırmak istediğinize emin misiniz?')) return
    try {
      await ustaPanelKapakSil()
      setUsta(prev => ({ ...prev, kapak_url: null }))
    } catch {
      setMesaj({ tip: 'hata', metin: 'Kapak görseli kaldırılamadı.' })
    }
  }

  const listeToggle = (alan, kod) => setForm(p => ({
    ...p, [alan]: (p[alan] || []).includes(kod) ? p[alan].filter(x => x !== kod) : [...(p[alan] || []), kod]
  }))

  const saatDegis = (gun, alan, deger) => setForm(p => ({
    ...p, calisma_saatleri: { ...p.calisma_saatleri, [gun]: { ...(p.calisma_saatleri?.[gun] || {}), [alan]: deger } }
  }))

  const tamamlama = usta?.profil_tamamlama

  if (yukleniyor) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Profilim</h1>
        <p className="text-sm text-gray-500 mt-1">Profil bilgilerini ve fotoğraflarını yönet</p>
      </div>

      {/* Bildirim */}
      {mesaj.metin && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
          mesaj.tip === 'basari'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-600 border-red-200'
        }`}>
          {mesaj.tip === 'basari' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {mesaj.metin}
        </div>
      )}

      {/* Telefon doğrulama (SMS / WhatsApp) — kayıtlı numara değişirse doğrulama otomatik geçersiz olur */}
      {usta?.telefon && (
        <TelefonDogrulama key={usta.telefon} telefon={usta.telefon} amac="profil"
          onNumaraDuzenle={() => document.getElementById('profil-telefon')?.focus()} />
      )}

      {/* Abonelik */}
      {abonelik && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-blue-600" /> Abonelik
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="text-sm text-gray-600">
              Plan: <span className="font-semibold text-gray-900 capitalize">{abonelik.plan || 'ücretsiz'}</span>
              {abonelik.plan_bitis && (
                <span className="text-gray-400"> — {new Date(abonelik.plan_bitis).toLocaleDateString('tr-TR')} tarihine kadar</span>
              )}
            </div>
          </div>

          {abonelik.kayitli_kart_var ? (
            <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <RefreshCw size={15} className={abonelik.abonelik?.otomatik_yenileme ? 'text-green-600' : 'text-gray-400'} />
                Otomatik yenileme {abonelik.abonelik?.otomatik_yenileme ? 'açık' : 'kapalı'}
              </div>
              <button
                type="button"
                disabled={abonelikYukleniyor}
                onClick={() => handleOtomatikYenileme(!abonelik.abonelik?.otomatik_yenileme)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 ${
                  abonelik.abonelik?.otomatik_yenileme
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
              >
                {abonelik.abonelik?.otomatik_yenileme ? 'Kapat' : 'Aç'}
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              Kayıtlı kartınız yok. Bir sonraki ödemenizde "kartımı kaydet" seçeneğini işaretlerseniz otomatik yenileme açılır.
            </p>
          )}
        </div>
      )}

      {/* Profil tamamlanma */}
      {tamamlama && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-800">Profil Tamamlanma</h2>
            <span className="text-lg font-extrabold text-orange-600">%{tamamlama.yuzde}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all" style={{ width: `${tamamlama.yuzde}%` }} />
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {tamamlama.maddeler.map(m => (
              <li key={m.anahtar} className={`text-xs flex items-center gap-1.5 ${m.tamam ? 'text-green-600' : 'text-gray-500'}`}>
                {m.tamam ? <CheckCircle size={13} /> : <span className="w-[13px] h-[13px] rounded-full border border-gray-300 inline-block shrink-0" />}
                {m.tamam || !m.link || m.link === '/usta/panel/profil' ? (
                  <span className={m.tamam ? 'line-through opacity-70' : ''}>{m.baslik}</span>
                ) : (
                  <Link to={m.link} className="hover:text-blue-600 hover:underline">{m.baslik}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Kapak görseli */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
          <ImageIcon size={18} className="text-blue-600" /> Kapak Görseli
        </h2>
        <p className="text-xs text-gray-400 mb-4">Profilinizin üstünde geniş görünür. Yatay (örn. 1600×500) bir iş veya işyeri fotoğrafı önerilir.</p>
        <div className="h-28 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 overflow-hidden mb-3">
          {usta?.kapak_url && <img src={`${API_URL}${usta.kapak_url}`} alt="Kapak" className="w-full h-full object-cover" />}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => kapakRef.current.click()} disabled={kapakYukleniyor}
            className="px-3.5 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 disabled:opacity-50">
            {kapakYukleniyor ? 'Yükleniyor...' : usta?.kapak_url ? 'Kapağı Değiştir' : 'Kapak Ekle'}
          </button>
          {usta?.kapak_url && (
            <button type="button" onClick={handleKapakSil} className="px-3.5 py-2 border border-red-200 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-50">Kaldır</button>
          )}
        </div>
        <input ref={kapakRef} type="file" accept="image/*" className="hidden" onChange={handleKapakYukle} />
      </div>

      {/* Logo */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Upload size={18} className="text-blue-600" /> Logo
        </h2>
        <p className="text-xs text-gray-400 mb-4">Profilinizde ve kartınızda görünecek işletme/kişisel logonuz</p>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {usta?.logo_url ? (
              <img src={`${API_URL}${usta.logo_url}`} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-gray-300">{(usta?.ad || '?').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => logoRef.current.click()}
              disabled={logoYukleniyor}
              className="px-3.5 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 disabled:opacity-50"
            >
              {logoYukleniyor ? 'Yükleniyor...' : usta?.logo_url ? 'Logoyu Değiştir' : 'Logo Ekle'}
            </button>
            {usta?.logo_url && (
              <button onClick={handleLogoSil} className="px-3.5 py-2 border border-red-200 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-50">
                Kaldır
              </button>
            )}
          </div>
        </div>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoYukle} />
      </div>

      {/* Fotoğraflar */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Camera size={18} className="text-blue-600" /> İş Fotoğrafları
        </h2>
        <div className="flex flex-wrap gap-3">
          {(usta?.fotograflar || []).map(f => (
            <div key={f.id} className="relative group w-24 h-24">
              <img
                src={`${API_URL}/uploads/${f.dosya}`}
                alt="Fotoğraf"
                className="w-24 h-24 object-cover rounded-xl border border-gray-200"
              />
              <button
                onClick={() => handleFotografSil(f.id)}
                className="absolute inset-0 bg-black/50 rounded-xl hidden group-hover:flex items-center justify-center text-white"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}

          {(usta?.fotograflar || []).length < 6 && (
            <button
              onClick={() => fileRef.current.click()}
              className="w-24 h-24 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-blue-500 transition"
            >
              <Camera size={20} />
              <span className="text-xs">Ekle</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotografYukle} />
        <p className="text-xs text-gray-400 mt-3">Maksimum 6 fotoğraf · PNG, JPG, WEBP</p>
      </div>

      {/* Bilgi formu */}
      <form onSubmit={handleKaydet} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <User size={18} className="text-blue-600" /> Kişisel Bilgiler
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-gray-800 mb-1.5 block">Ad *</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.ad} onChange={e => setForm(p => ({ ...p, ad: e.target.value }))}
                required placeholder="Adınız"
                className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-400 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-800 mb-1.5 block">Soyad</label>
            <input value={form.soyad} onChange={e => setForm(p => ({ ...p, soyad: e.target.value }))}
              placeholder="Soyadınız"
              className="w-full px-3 py-2.5 border-2 border-gray-400 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-gray-800 mb-1.5 block">Telefon *</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input id="profil-telefon" value={form.telefon} onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))}
                required placeholder="+90 548 000 0000"
                className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-400 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-800 mb-1.5 block">WhatsApp</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))}
                placeholder="+90 548 000 0000"
                className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-400 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-800 mb-1.5 block">E-posta</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              type="email" placeholder="email@example.com"
              className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-400 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-gray-800 mb-1.5 block">Şehir</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select value={form.sehir_id} onChange={e => sehirDegisti(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-400 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Seçin</option>
                {sehirler.map(s => (
                  <option key={s.id} value={s.id}>{s.ad}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-800 mb-1.5 block">İlçe</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select value={form.ilce_id} onChange={e => setForm(p => ({ ...p, ilce_id: e.target.value }))}
                disabled={!form.sehir_id}
                className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-400 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed">
                <option value="">Seçin</option>
                {ilceler.map(i => (
                  <option key={i.id} value={i.id}>{i.ad}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-800 mb-1.5 block">Deneyim (Yıl)</label>
          <div className="relative">
            <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={form.deneyim_yil} onChange={e => setForm(p => ({ ...p, deneyim_yil: Number(e.target.value) }))}
              type="number" min={0} max={50}
              className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-400 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-800 mb-1.5 block">Harita Konumu</label>
          <button type="button" onClick={konumAl} disabled={konumDurumu === 'yukleniyor'}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-60">
            <LocateFixed size={15} />
            {konumDurumu === 'yukleniyor' ? 'Konum alınıyor...' : (form.lat ? 'Konumu Güncelle' : 'Konumumu Kullan')}
          </button>
          <p className="text-xs text-gray-400 mt-1.5">"En Yakın Usta" aramasında çıkmanız için gereklidir.</p>
          {form.lat && konumDurumu !== 'hata' && (
            <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1"><Check size={12} /> Konumunuz kayıtlı.</p>
          )}
          {konumDurumu === 'hata' && (
            <p className="text-xs text-red-500 mt-1.5">Konum alınamadı — tarayıcı izni gerekiyor.</p>
          )}
          {konumDurumu === 'desteklenmiyor' && (
            <p className="text-xs text-gray-400 mt-1.5">Tarayıcınız konum özelliğini desteklemiyor.</p>
          )}
        </div>

        <div>
          <label className="text-sm font-bold text-gray-800 mb-1.5 block">Hakkında / Açıklama</label>
          <textarea value={form.aciklama} onChange={e => setForm(p => ({ ...p, aciklama: e.target.value }))}
            placeholder="Kendinizi ve sunduğunuz hizmetleri kısaca tanıtın..."
            rows={4}
            className="w-full px-3 py-2.5 border-2 border-gray-400 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {/* Diller */}
        <div>
          <label className="text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5"><Globe size={14} className="text-gray-500" /> Konuştuğum Diller</label>
          <div className="flex flex-wrap gap-2">
            {DILLER.map(d => {
              const secili = (form.diller || []).includes(d.kod)
              return (
                <button type="button" key={d.kod} onClick={() => listeToggle('diller', d.kod)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${secili ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                  {d.bayrak} {d.ad}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Yabancı müşteriler dile göre usta arar; seçtiğiniz diller profilinizde görünür.</p>
        </div>

        {/* Çalışma saatleri */}
        <div>
          <label className="text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5"><Clock size={14} className="text-gray-500" /> Çalışma Saatleri</label>
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-3 cursor-pointer">
            <input type="checkbox" checked={!!form.yedi_yirmi_dort} onChange={e => setForm(p => ({ ...p, yedi_yirmi_dort: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
            7/24 hizmet veriyorum
          </label>
          {!form.yedi_yirmi_dort && (
            <div className="space-y-2">
              {GUNLER.map(g => {
                const gun = form.calisma_saatleri?.[g.kod] || {}
                return (
                  <div key={g.kod} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="w-24 text-gray-700 font-medium">{g.ad}</span>
                    <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                      <input type="checkbox" checked={!!gun.kapali} onChange={e => saatDegis(g.kod, 'kapali', e.target.checked)} className="accent-blue-600" /> Kapalı
                    </label>
                    {!gun.kapali && (
                      <>
                        <input type="time" value={gun.bas || '08:00'} onChange={e => saatDegis(g.kod, 'bas', e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs" />
                        <span className="text-gray-400">–</span>
                        <input type="time" value={gun.bit || '18:00'} onChange={e => saatDegis(g.kod, 'bit', e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs" />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Ödeme yöntemleri */}
        <div>
          <label className="text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5"><Wallet size={14} className="text-gray-500" /> Kabul Ettiğim Ödeme Yöntemleri</label>
          <div className="flex flex-wrap gap-2">
            {ODEME_YONTEMLERI.map(o => {
              const secili = (form.odeme_yontemleri || []).includes(o.kod)
              return (
                <button type="button" key={o.kod} onClick={() => listeToggle('odeme_yontemleri', o.kod)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${secili ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                  {o.ad}
                </button>
              )
            })}
          </div>
        </div>

        {/* Web sitesi */}
        <div>
          <label className="text-sm font-bold text-gray-800 mb-1.5 block">Web Sitesi</label>
          <input value={form.web_sitesi || ''} onChange={e => setForm(p => ({ ...p, web_sitesi: e.target.value }))}
            placeholder="www.siteniz.com"
            className="w-full px-3 py-2.5 border-2 border-gray-400 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit" disabled={kayıtYukleniyor}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition">
          {kayıtYukleniyor ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <><Save size={16} /> Kaydet</>
          )}
        </button>
      </form>

      {/* Kategorilerim */}
      {(kategoriler.ana_kategori || kategoriler.ek_kategoriler?.length > 0) && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Tag size={18} className="text-blue-600" /> Kategorilerim
          </h2>
          <div className="space-y-3">
            {kategoriler.ana_kategori && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Ana Kategori</p>
                <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                  {kategoriler.ana_kategori.ad}
                </span>
              </div>
            )}
            {kategoriler.ek_kategoriler?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Ek Kategoriler</p>
                <div className="flex flex-wrap gap-2">
                  {kategoriler.ek_kategoriler.map(k => (
                    <span key={k.id} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                      {k.ad}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400">Ek hizmet ekleyip fiyat ve uzmanlık bilgisi girmek için <Link to="/usta/panel/hizmetler" className="text-blue-600 hover:underline font-semibold">Hizmetlerim</Link> sayfasını kullan. Ana hizmet değişikliği için bizimle iletişime geç.</p>
          </div>
        </div>
      )}

      {/* Ekibimiz — Faz 2 Görev 7 (SoliHoli kıyaslaması: sadece görünüm amaçlı liste, yetkilendirme sistemi değil) */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Users size={18} className="text-blue-600" /> Ekibimiz
        </h2>
        <p className="text-xs text-gray-400 mb-4">Profilinizde görünen çalışan listesi (isim + rol, örn. "Çırak"). Panel yetkisi vermez, sadece görünüm amaçlıdır.</p>

        {ekip.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {ekip.map(e => (
              <div key={e.id} className="relative group w-24 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                  {e.foto_url ? (
                    <img src={`${API_URL}${e.foto_url}`} alt={e.ad} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-gray-300">{e.ad.charAt(0).toUpperCase()}</span>
                  )}
                  <button
                    onClick={() => ekipSilTikla(e.id)}
                    className="absolute inset-0 bg-black/50 rounded-full hidden group-hover:flex items-center justify-center text-white"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-xs font-semibold text-gray-800 mt-1.5 truncate">{e.ad}</p>
                {e.rol && <p className="text-[11px] text-gray-400 truncate">{e.rol}</p>}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={ekipEkle} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Ad</label>
            <input value={ekipForm.ad} onChange={e => setEkipForm(p => ({ ...p, ad: e.target.value }))}
              placeholder="Örn: Ahmet Yılmaz" maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Rol</label>
            <input value={ekipForm.rol} onChange={e => setEkipForm(p => ({ ...p, rol: e.target.value }))}
              placeholder="Örn: Çırak, Usta Yardımcısı" maxLength={60}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <label className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer text-center whitespace-nowrap">
            {ekipFoto ? ekipFoto.name.slice(0, 14) : 'Foto Ekle (ops.)'}
            <input ref={ekipFotoRef} type="file" accept="image/*" className="hidden"
              onChange={e => setEkipFoto(e.target.files[0] || null)} />
          </label>
          <button type="submit" disabled={ekipGonderiliyor || !ekipForm.ad.trim()}
            className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold px-4 py-2 rounded-lg text-sm whitespace-nowrap">
            <Plus size={15} /> Ekle
          </button>
        </form>
      </div>

      {/* Ödüller — Faz 2 Görev 9 (public vitrin, admin onayı gerekmez) */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Award size={18} className="text-blue-600" /> Ödüller
        </h2>
        <p className="text-xs text-gray-400 mb-4">Profilinizde gösterilecek ödül / başarı listesi.</p>

        {oduller.length > 0 && (
          <div className="space-y-2 mb-4">
            {oduller.map(o => (
              <div key={o.id} className="flex items-start justify-between gap-3 bg-gray-50 rounded-xl px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{o.baslik}</p>
                  <p className="text-xs text-gray-400">
                    {[o.veren_kurum, o.yil].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button onClick={() => odulSilTikla(o.id)} className="text-gray-400 hover:text-red-600 p-1 shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={odulEkle} className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={odulForm.baslik} onChange={e => setOdulForm(p => ({ ...p, baslik: e.target.value }))}
              placeholder="Ödül başlığı *" maxLength={150}
              className="sm:col-span-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={odulForm.veren_kurum} onChange={e => setOdulForm(p => ({ ...p, veren_kurum: e.target.value }))}
              placeholder="Veren kurum (ops.)" maxLength={150}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={odulForm.yil} onChange={e => setOdulForm(p => ({ ...p, yil: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              placeholder="Yıl (ops.)" inputMode="numeric"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <input value={odulForm.aciklama} onChange={e => setOdulForm(p => ({ ...p, aciklama: e.target.value }))}
              placeholder="Açıklama (ops.)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={odulGonderiliyor || !odulForm.baslik.trim()}
              className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold px-4 py-2 rounded-lg text-sm whitespace-nowrap">
              <Plus size={15} /> Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
