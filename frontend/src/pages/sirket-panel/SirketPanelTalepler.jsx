import { useState, useEffect } from 'react'
import { Phone, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { sirketPanelIsTalepleri, sirketPanelTalepGuncelle } from '../../api'

const DURUM_RENK = {
  bekliyor: 'bg-orange-100 text-orange-700',
  kabul: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  tamamlandi: 'bg-blue-100 text-blue-700',
}

const DURUM_LABEL = {
  bekliyor: 'Bekliyor',
  kabul: 'Kabul Edildi',
  red: 'Reddedildi',
  tamamlandi: 'Tamamlandı',
}

export default function SirketPanelTalepler() {
  const [talepler, setTalepler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [filtreDurum, setFiltreDurum] = useState('')
  const [acikId, setAcikId] = useState(null)

  const yukle = () => {
    setYukleniyor(true)
    const params = filtreDurum ? { durum: filtreDurum } : {}
    sirketPanelIsTalepleri(params)
      .then(r => setTalepler(r.data.talepler || []))
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }

  useEffect(() => { yukle() }, [filtreDurum])

  const talepGuncelle = async (id, durum) => {
    try {
      await sirketPanelTalepGuncelle(id, { durum })
      setTalepler(ts => ts.map(t => t.id === id ? { ...t, durum } : t))
    } catch {}
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">İş Talepleri</h1>
        <select value={filtreDurum} onChange={e => setFiltreDurum(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          <option value="">Tüm Talepler</option>
          <option value="bekliyor">Bekleyen</option>
          <option value="kabul">Kabul Edilen</option>
          <option value="tamamlandi">Tamamlanan</option>
          <option value="red">Reddedilen</option>
        </select>
      </div>

      {yukleniyor ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : talepler.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Clock size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">Talep yok</h3>
          <p className="text-gray-400 text-sm">Henüz iş talebi alınmadı</p>
        </div>
      ) : (
        <div className="space-y-3">
          {talepler.map(talep => (
            <div key={talep.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 flex items-start justify-between gap-3 cursor-pointer"
                onClick={() => setAcikId(acikId === talep.id ? null : talep.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DURUM_RENK[talep.durum]}`}>
                      {DURUM_LABEL[talep.durum]}
                    </span>
                    <span className="text-xs text-gray-400">{talep.olusturma}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{talep.baslik}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{talep.musteri_ad} • {talep.musteri_telefon}</p>
                </div>
                {acikId === talep.id ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 mt-1" />}
              </div>

              {acikId === talep.id && (
                <div className="border-t border-gray-100 p-4 space-y-3">
                  {talep.aciklama && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{talep.aciklama}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    {talep.musteri_telefon && (
                      <a href={`tel:${talep.musteri_telefon}`}
                        className="flex items-center gap-1.5 bg-green-50 text-green-700 font-semibold px-3 py-2 rounded-lg hover:bg-green-100 transition-colors">
                        <Phone size={13} /> Ara
                      </a>
                    )}
                    {talep.musteri_adres && (
                      <span className="text-gray-500 text-xs self-center">{talep.musteri_adres}</span>
                    )}
                  </div>
                  {talep.tercih_tarih && (
                    <p className="text-xs text-gray-500"><span className="font-medium">Tercih:</span> {talep.tercih_tarih}</p>
                  )}

                  {talep.durum === 'bekliyor' && (
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => talepGuncelle(talep.id, 'kabul')}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors">
                        <CheckCircle size={13} /> Kabul Et
                      </button>
                      <button onClick={() => talepGuncelle(talep.id, 'red')}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors">
                        <XCircle size={13} /> Reddet
                      </button>
                    </div>
                  )}
                  {talep.durum === 'kabul' && (
                    <button onClick={() => talepGuncelle(talep.id, 'tamamlandi')}
                      className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors">
                      <CheckCircle size={13} /> Tamamlandı İşaretle
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
