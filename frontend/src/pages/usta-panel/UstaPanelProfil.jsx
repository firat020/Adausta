import { useState, useEffect, useRef } from 'react'
import { User, Phone, Mail, MapPin, Briefcase, Camera, Trash2, Save, CheckCircle, AlertCircle } from 'lucide-react'
import { ustaPanelProfil, ustaPanelProfilGuncelle, ustaPanelFotografYukle, ustaPanelFotografSil, sehirleriGetir } from '../../api'

const API_URL = 'http://localhost:5000'

export default function UstaPanelProfil() {
  const [usta, setUsta] = useState(null)
  const [sehirler, setSehirler] = useState([])
  const [form, setForm] = useState({})
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kayıtYukleniyor, setKayitYukleniyor] = useState(false)
  const [mesaj, setMesaj] = useState({ tip: '', metin: '' })
  const fileRef = useRef()

  useEffect(() => {
    Promise.all([ustaPanelProfil(), sehirleriGetir()])
      .then(([r, s]) => {
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
        })
        setSehirler(s.data.sehirler || [])
      })
      .finally(() => setYukleniyor(false))
  }, [])

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

      {/* Fotoğraflar */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Camera size={18} className="text-blue-600" /> Profil Fotoğrafları
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
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Ad *</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.ad} onChange={e => setForm(p => ({ ...p, ad: e.target.value }))}
                required placeholder="Adınız"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Soyad</label>
            <input value={form.soyad} onChange={e => setForm(p => ({ ...p, soyad: e.target.value }))}
              placeholder="Soyadınız"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Telefon *</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.telefon} onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))}
                required placeholder="+90 548 000 0000"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">WhatsApp</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))}
                placeholder="+90 548 000 0000"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">E-posta</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              type="email" placeholder="email@example.com"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Şehir</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select value={form.sehir_id} onChange={e => setForm(p => ({ ...p, sehir_id: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Seçin</option>
                {sehirler.map(s => (
                  <option key={s.id} value={s.id}>{s.ad}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Deneyim (Yıl)</label>
            <div className="relative">
              <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.deneyim_yil} onChange={e => setForm(p => ({ ...p, deneyim_yil: Number(e.target.value) }))}
                type="number" min={0} max={50}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Hakkında / Açıklama</label>
          <textarea value={form.aciklama} onChange={e => setForm(p => ({ ...p, aciklama: e.target.value }))}
            placeholder="Kendinizi ve sunduğunuz hizmetleri kısaca tanıtın..."
            rows={4}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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
    </div>
  )
}
