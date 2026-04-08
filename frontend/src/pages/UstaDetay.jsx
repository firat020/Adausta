import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Phone, MessageCircle, Star, Clock, ArrowLeft, Image } from 'lucide-react'
import { ustaDetay, yorumEkle } from '../api'

export default function UstaDetay() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [usta, setUsta] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [yorumForm, setYorumForm] = useState({ musteri_adi: '', puan: 5, yorum: '' })
  const [yorumGonderildi, setYorumGonderildi] = useState(false)

  useEffect(() => {
    ustaDetay(id)
      .then(r => setUsta(r.data))
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [id])

  const yorumGonder = async (e) => {
    e.preventDefault()
    try {
      await yorumEkle(id, yorumForm)
      setYorumGonderildi(true)
    } catch {}
  }

  const Yildizlar = ({ puan, tikla = null, boyut = 16 }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={boyut}
          onClick={() => tikla?.(i + 1)}
          className={`${tikla ? 'cursor-pointer' : ''} transition-colors ${
            i < Math.round(puan) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
          }`} />
      ))}
    </div>
  )

  if (yukleniyor) return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="h-48 bg-gray-100 rounded-2xl animate-pulse mb-4" />
      <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  )

  if (!usta) return (
    <div className="text-center py-24 text-gray-400">Usta bulunamadı</div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Geri
      </button>

      {/* Profil kartı */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden mb-5">
        <div className="h-2 bg-gradient-to-r from-orange-500 to-amber-400" />
        <div className="p-7">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
              {usta.ad.charAt(0).toUpperCase()}
            </div>

            {/* Bilgiler */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{usta.ad_soyad}</h1>
              <span className="inline-block mt-1 text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                {usta.kategori}
              </span>
              <div className="flex items-center gap-2 mt-3">
                <Yildizlar puan={usta.puan} />
                <span className="text-sm text-gray-500">
                  {usta.puan > 0 ? usta.puan.toFixed(1) : 'Yorum yok'} · {usta.yorum_sayisi} yorum
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  {usta.ilce ? `${usta.ilce}, ` : ''}{usta.sehir}
                </span>
                {usta.deneyim_yil > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {usta.deneyim_yil} yıl deneyim
                  </span>
                )}
              </div>
            </div>

            {/* İletişim */}
            <div className="flex flex-col gap-2.5 w-full sm:w-auto">
              <a href={`tel:${usta.telefon}`}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                <Phone size={16} />
                {usta.telefon}
              </a>
              {usta.whatsapp && (
                <a href={`https://wa.me/${usta.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Açıklama */}
          {usta.aciklama && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Hakkında</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{usta.aciklama}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fotoğraflar */}
      {usta.fotograflar?.length > 0 && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 mb-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Image size={18} className="text-gray-400" />
            Is Fotograflari
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {usta.fotograflar.map(f => (
              <img key={f.id} src={`http://localhost:5000${f.url}`} alt="Is fotografi"
                className="w-full h-40 object-cover rounded-xl border border-gray-100" />
            ))}
          </div>
        </div>
      )}

      {/* Yorumlar */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 mb-5">
        <h2 className="font-bold text-gray-900 mb-5">
          Musteri Yorumlari
          {usta.yorumlar?.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({usta.yorumlar.length})</span>
          )}
        </h2>
        {!usta.yorumlar?.length ? (
          <p className="text-gray-400 text-sm py-4 text-center">Henuz yorum yapilmamis</p>
        ) : (
          <div className="space-y-5">
            {usta.yorumlar.map(y => (
              <div key={y.id} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 text-sm">{y.musteri_adi}</span>
                  <span className="text-gray-400 text-xs">{y.tarih}</span>
                </div>
                <Yildizlar puan={y.puan} boyut={13} />
                {y.yorum && <p className="text-gray-600 text-sm mt-2 leading-relaxed">{y.yorum}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Yorum formu */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
        <h2 className="font-bold text-gray-900 mb-5">Yorum Yap</h2>
        {yorumGonderildi ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={24} className="text-emerald-500" />
            </div>
            <p className="font-semibold text-emerald-700">Yorumunuz alindi, onay bekliyor</p>
          </div>
        ) : (
          <form onSubmit={yorumGonder} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Adiniz</label>
              <input type="text" required value={yorumForm.musteri_adi}
                onChange={e => setYorumForm(f => ({ ...f, musteri_adi: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Adiniz Soyadiniz" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Puaniniz</label>
              <Yildizlar puan={yorumForm.puan} tikla={(p) => setYorumForm(f => ({ ...f, puan: p }))} boyut={28} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Yorumunuz</label>
              <textarea value={yorumForm.yorum}
                onChange={e => setYorumForm(f => ({ ...f, yorum: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                rows={3} placeholder="Deneyiminizi paylasIn..." />
            </div>
            <button type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm">
              Yorum Gonder
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
