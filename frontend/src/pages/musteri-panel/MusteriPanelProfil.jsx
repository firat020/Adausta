import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '../../api'

export default function MusteriPanelProfil() {
  const [form, setForm] = useState({ ad: '', soyad: '', telefon: '', adres: '' })
  const [sifreForm, setSifreForm] = useState({ mevcut_sifre: '', yeni_sifre: '', tekrar: '' })
  const [email, setEmail] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [mesaj, setMesaj] = useState({ tip: '', metin: '' })

  useEffect(() => {
    api.get('/musteri/profil').then(r => {
      const m = r.data.musteri
      setEmail(m.email)
      setForm({ ad: m.ad || '', soyad: m.soyad || '', telefon: m.telefon || '', adres: m.adres || '' })
    }).finally(() => setYukleniyor(false))
  }, [])

  const handleProfil = async (e) => {
    e.preventDefault()
    setKaydediliyor(true)
    setMesaj({ tip: '', metin: '' })
    try {
      await api.put('/musteri/profil', form)
      setMesaj({ tip: 'ok', metin: 'Profil güncellendi.' })
    } catch (err) {
      setMesaj({ tip: 'hata', metin: err.response?.data?.hata || 'Bir hata oluştu.' })
    } finally {
      setKaydediliyor(false)
    }
  }

  const handleSifre = async (e) => {
    e.preventDefault()
    if (sifreForm.yeni_sifre !== sifreForm.tekrar) {
      setMesaj({ tip: 'hata', metin: 'Yeni şifreler eşleşmiyor.' })
      return
    }
    setKaydediliyor(true)
    setMesaj({ tip: '', metin: '' })
    try {
      await api.put('/musteri/profil', {
        mevcut_sifre: sifreForm.mevcut_sifre,
        yeni_sifre: sifreForm.yeni_sifre,
      })
      setMesaj({ tip: 'ok', metin: 'Şifre güncellendi.' })
      setSifreForm({ mevcut_sifre: '', yeni_sifre: '', tekrar: '' })
    } catch (err) {
      setMesaj({ tip: 'hata', metin: err.response?.data?.hata || 'Bir hata oluştu.' })
    } finally {
      setKaydediliyor(false)
    }
  }

  if (yukleniyor) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-extrabold text-gray-900">Profilim</h1>

      {/* Bilgi formu */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <User size={16} className="text-blue-600" /> Kişisel Bilgiler
        </h2>

        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
          <Mail size={15} className="text-gray-400 shrink-0" />
          <span className="text-sm text-gray-500 flex-1">{email}</span>
          <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Değiştirilemez</span>
        </div>

        <form onSubmit={handleProfil} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'ad', label: 'Ad', icon: User },
              { key: 'soyad', label: 'Soyad', icon: User },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={label}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            ))}
          </div>

          {[
            { key: 'telefon', label: 'Telefon', icon: Phone, placeholder: '+90 5XX XXX XX XX' },
            { key: 'adres', label: 'Adres', icon: MapPin, placeholder: 'Şehir, ilçe, adres...' },
          ].map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
              <div className="relative">
                <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          ))}

          {mesaj.metin && mesaj.tip === 'ok' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={14} /> {mesaj.metin}
            </div>
          )}

          <button
            type="submit"
            disabled={kaydediliyor}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            {kaydediliyor ? '...' : 'Kaydet'}
          </button>
        </form>
      </div>

      {/* Şifre güncelleme */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Lock size={16} className="text-blue-600" /> Şifre Değiştir
        </h2>

        <form onSubmit={handleSifre} className="space-y-4">
          {[
            { key: 'mevcut_sifre', label: 'Mevcut Şifre' },
            { key: 'yeni_sifre',   label: 'Yeni Şifre' },
            { key: 'tekrar',       label: 'Yeni Şifre (Tekrar)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={sifreForm[key]}
                  onChange={e => setSifreForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder="••••••"
                  required
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          ))}

          {mesaj.metin && mesaj.tip === 'hata' && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              <AlertCircle size={14} /> {mesaj.metin}
            </div>
          )}

          <button
            type="submit"
            disabled={kaydediliyor}
            className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            {kaydediliyor ? '...' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </div>
    </div>
  )
}
