import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Building2, MapPin, Phone, Globe, ChevronLeft,
  MessageCircle, Send, CheckCircle, ExternalLink
} from 'lucide-react'
import { sirketDetay, sirketIsTalebiGonder } from '../api'
import SEO from '../components/SEO'

export default function SirketDetay() {
  const { id } = useParams()
  const [sirket, setSirket] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [talepAcik, setTalepAcik] = useState(false)
  const [talepBasarili, setTalepBasarili] = useState(false)
  const [talepGonderiliyor, setTalepGonderiliyor] = useState(false)
  const [talepHata, setTalepHata] = useState('')
  const [talep, setTalep] = useState({
    musteri_ad: '', musteri_telefon: '', musteri_adres: '',
    baslik: '', aciklama: '', tercih_tarih: '',
  })

  useEffect(() => {
    sirketDetay(id)
      .then(r => setSirket(r.data))
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [id])

  const talepGonder = async (e) => {
    e.preventDefault()
    if (!talep.musteri_ad || !talep.musteri_telefon || !talep.baslik) {
      setTalepHata('Ad, telefon ve konu zorunludur')
      return
    }
    setTalepHata('')
    setTalepGonderiliyor(true)
    try {
      await sirketIsTalebiGonder(id, talep)
      setTalepBasarili(true)
      setTalepAcik(false)
      setTalep({ musteri_ad: '', musteri_telefon: '', musteri_adres: '', baslik: '', aciklama: '', tercih_tarih: '' })
    } catch (err) {
      setTalepHata(err.response?.data?.hata || 'Bir hata oluştu')
    } finally {
      setTalepGonderiliyor(false)
    }
  }

  if (yukleniyor) return (
    <div className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  )

  if (!sirket) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-bold text-gray-700 mb-2">Şirket bulunamadı</h2>
      <Link to="/sirketler" className="text-indigo-600 hover:underline text-sm">← Şirketlere dön</Link>
    </div>
  )

  const inputCls = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
  const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block"

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SEO
        baslik={sirket ? `${sirket.sirket_adi} — KKTC Kurumsal Hizmet` : 'Şirket Detayı — Ada Usta KKTC'}
        aciklama={sirket ? `${sirket.sirket_adi} — Kuzey Kıbrıs'ta ${sirket.kategori || 'profesyonel'} hizmeti. KKTC'de güvenilir kurumsal firma.` : 'KKTC kurumsal hizmet şirketi'}
        url={`/sirketler/${id}`}
      />
      {/* Geri */}
      <Link to="/sirketler" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
        <ChevronLeft size={16} /> Şirketlere Dön
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Şirket bilgileri */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header kartı */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-5">
              {sirket.logo_url ? (
                <img src={sirket.logo_url} alt={sirket.sirket_adi}
                  className="w-20 h-20 rounded-2xl object-cover border border-gray-100 flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Building2 size={32} className="text-indigo-400" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{sirket.sirket_adi}</h1>
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  {sirket.kategori_ikon} {sirket.kategori}
                </span>
                {sirket.sehir && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin size={14} className="text-gray-400" />
                    {sirket.sehir}{sirket.ilce ? `, ${sirket.ilce}` : ''}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hakkında */}
          {sirket.aciklama && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-3">Hakkında</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{sirket.aciklama}</p>
            </div>
          )}

          {/* İletişim bilgileri */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">İletişim Bilgileri</h2>
            <div className="space-y-3">
              {sirket.telefon && (
                <a href={`tel:${sirket.telefon}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Telefon</p>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{sirket.telefon}</p>
                  </div>
                </a>
              )}
              {sirket.whatsapp && (
                <a href={`https://wa.me/${sirket.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">WhatsApp</p>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">{sirket.whatsapp}</p>
                  </div>
                </a>
              )}
              {sirket.email && (
                <div className="flex items-center gap-3 p-3 rounded-xl">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Send size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">E-posta</p>
                    <p className="text-sm font-semibold text-gray-900">{sirket.email}</p>
                  </div>
                </div>
              )}
              {sirket.website && (
                <a href={sirket.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Website</p>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                      {sirket.website.replace(/^https?:\/\//, '')}
                      <ExternalLink size={12} />
                    </p>
                  </div>
                </a>
              )}
              {sirket.adres && (
                <div className="flex items-start gap-3 p-3 rounded-xl">
                  <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Adres</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{sirket.adres}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sağ: Talep formu */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden lg:sticky top-6">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-5 text-white">
              <h3 className="font-bold text-lg mb-1">Teklif İste</h3>
              <p className="text-indigo-200 text-xs">Şirkete ücretsiz talep gönderin</p>
            </div>

            {talepBasarili && (
              <div className="p-5">
                <div className="flex flex-col items-center text-center py-6">
                  <CheckCircle size={40} className="text-emerald-500 mb-3" />
                  <h4 className="font-bold text-gray-900 mb-1">Talebiniz İletildi!</h4>
                  <p className="text-gray-500 text-sm">Şirket en kısa sürede sizinle iletişime geçecek.</p>
                </div>
              </div>
            )}

            {!talepBasarili && (
              <form onSubmit={talepGonder} className="p-5 space-y-3">
                <div>
                  <label className={labelCls}>Adınız Soyadınız *</label>
                  <input type="text" required value={talep.musteri_ad}
                    onChange={e => setTalep(t => ({ ...t, musteri_ad: e.target.value }))}
                    className={inputCls} placeholder="Ad Soyad" />
                </div>
                <div>
                  <label className={labelCls}>Telefon *</label>
                  <input type="tel" required value={talep.musteri_telefon}
                    onChange={e => setTalep(t => ({ ...t, musteri_telefon: e.target.value }))}
                    className={inputCls} placeholder="+90 548 000 0000" />
                </div>
                <div>
                  <label className={labelCls}>Konu *</label>
                  <input type="text" required value={talep.baslik}
                    onChange={e => setTalep(t => ({ ...t, baslik: e.target.value }))}
                    className={inputCls} placeholder="Ne için yardım lazım?" />
                </div>
                <div>
                  <label className={labelCls}>Açıklama</label>
                  <textarea rows={3} value={talep.aciklama}
                    onChange={e => setTalep(t => ({ ...t, aciklama: e.target.value }))}
                    className={`${inputCls} resize-none`}
                    placeholder="Detayları yazın..." />
                </div>
                <div>
                  <label className={labelCls}>Tercih Edilen Tarih</label>
                  <input type="text" value={talep.tercih_tarih}
                    onChange={e => setTalep(t => ({ ...t, tercih_tarih: e.target.value }))}
                    className={inputCls} placeholder="Örn: Hafta içi sabah" />
                </div>

                {talepHata && (
                  <p className="text-red-500 text-xs">{talepHata}</p>
                )}

                <button type="submit" disabled={talepGonderiliyor}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                  {talepGonderiliyor ? 'Gönderiliyor...' : 'Teklif İste'}
                </button>
              </form>
            )}
          </div>

          {/* Yetkili */}
          {sirket.yetkili_ad && (
            <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-600">
              <span className="font-medium">Yetkili:</span> {sirket.yetkili_ad}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
