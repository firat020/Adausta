import { useEffect, useState } from 'react'
import { ExternalLink, Megaphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { reklamlariGetir, reklamTikla } from '../api'

// Ana sayfa sponsor alanı — yalnızca admin panelinden girilen, tarih aralığı geçerli GERÇEK reklamlar gösterilir.
// Aktif reklam yoksa "reklam ver" çağrısı gösterilir (uydurma firma/telefon gösterilmez).
export default function ReklamBanner() {
  const { t } = useTranslation()
  const [reklamlar, setReklamlar] = useState(null)

  useEffect(() => {
    reklamlariGetir({ konum: 'ust' })
      .then(r => setReklamlar((r.data.ust || []).slice(0, 3)))
      .catch(() => setReklamlar([]))
  }, [])

  if (reklamlar === null) return null

  const tikla = (r) => {
    reklamTikla(r.id).catch(() => {})
    if (r.link_url) window.open(r.link_url, '_blank', 'noopener,noreferrer')
  }

  if (reklamlar.length === 0) {
    return (
      <section className="bg-gray-50 border-y border-gray-100 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
          <Megaphone size={18} className="text-gray-400" />
          <p className="text-sm text-gray-500">
            {t('ads.firmanitTanit')}{' '}
            <a href="mailto:reklam@adausta.com" className="text-blue-600 hover:underline font-medium">reklam@adausta.com</a>
            {' '}· {t('ads.fiyat')}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-gray-50 border-y border-gray-100 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-300 px-2 py-0.5 rounded">
              {t('ads.sponsorlu')}
            </span>
            <span className="text-base font-bold text-gray-800">{t('ads.oneCikanFirmalar')}</span>
          </div>
          <a href="mailto:reklam@adausta.com" className="text-xs text-blue-600 hover:underline font-medium">
            {t('ads.reklamVer')}
          </a>
        </div>

        <div className={`grid grid-cols-1 gap-5 ${reklamlar.length === 1 ? 'max-w-md mx-auto' : reklamlar.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {reklamlar.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
              <div className="relative h-32 bg-gradient-to-br from-blue-700 to-blue-500 overflow-hidden">
                {r.resim_url && (
                  <img src={r.resim_url} alt={r.firma_adi || r.baslik} loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="text-white font-bold text-sm leading-none">{r.firma_adi || r.baslik}</p>
                  {r.firma_adi && r.baslik && <p className="text-white/80 text-xs mt-0.5">{r.baslik}</p>}
                </div>
              </div>
              <div className="p-4">
                {r.aciklama && <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-3">{r.aciklama}</p>}
                {r.link_url && (
                  <button type="button" onClick={() => tikla(r)}
                    className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                    İncele <ExternalLink size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
