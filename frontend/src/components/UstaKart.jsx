import { useNavigate } from 'react-router-dom'
import { MapPin, Star, Phone, Clock, Navigation } from 'lucide-react'

export default function UstaKart({ usta }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/usta/${usta.id}`)}
      className="bg-white rounded-xl border border-blue-100 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group"
    >
      {/* Üst şerit */}
      <div className="h-1.5 bg-gradient-to-r from-blue-600 to-cyan-400" />

      <div className="p-5">
        {/* Başlık */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {usta.ad.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{usta.ad_soyad}</h3>
            <span className="inline-block mt-0.5 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              {usta.kategori}
            </span>
          </div>
          {usta.mesafe != null && (
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex-shrink-0">
              <Navigation size={11} />
              {usta.mesafe} km
            </div>
          )}
        </div>

        {/* Puan */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} size={13}
                className={i < Math.round(usta.puan) ? 'text-blue-400 fill-blue-400' : 'text-gray-200 fill-gray-200'} />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {usta.puan > 0 ? usta.puan.toFixed(1) : '—'} · {usta.yorum_sayisi} yorum
          </span>
        </div>

        {/* Konum */}
        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
          <MapPin size={12} className="flex-shrink-0" />
          <span>{usta.ilce ? `${usta.ilce}, ` : ''}{usta.sehir}</span>
        </div>

        {/* Açıklama */}
        {usta.aciklama && (
          <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-4">{usta.aciklama}</p>
        )}

        {/* Alt alan */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          {usta.deneyim_yil > 0 ? (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} />
              <span>{usta.deneyim_yil} yıl deneyim</span>
            </div>
          ) : <div />}

          <a
            href={`tel:${usta.telefon}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
          >
            <Phone size={12} />
            Ara
          </a>
        </div>
      </div>
    </div>
  )
}
