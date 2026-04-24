import { useState, useEffect } from 'react'
import { ClipboardList, Phone, MessageCircle, X } from 'lucide-react'
import api from '../../api'

const DURUM_RENK = {
  bekliyor:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  kabul:      'bg-blue-100 text-blue-700 border-blue-200',
  tamamlandi: 'bg-green-100 text-green-700 border-green-200',
  red:        'bg-red-100 text-red-700 border-red-200',
}
const DURUM_LABEL = {
  bekliyor: 'Bekliyor', kabul: 'Kabul Edildi',
  tamamlandi: 'Tamamlandı', red: 'Reddedildi / İptal',
}

const DURUMLAR = ['hepsi', 'bekliyor', 'kabul', 'tamamlandi', 'red']
const DURUM_TAB = { hepsi: 'Tümü', bekliyor: 'Bekleyen', kabul: 'Kabul', tamamlandi: 'Tamamlanan', red: 'Reddedilen' }

export default function MusteriPanelTalepler() {
  const [talepler, setTalepler] = useState([])
  const [filtre, setFiltre] = useState('hepsi')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [secili, setSecili] = useState(null)
  const [iptalId, setIptalId] = useState(null)

  const yukle = (durum) => {
    setYukleniyor(true)
    api.get('/musteri/taleplerim', { params: { durum } })
      .then(r => setTalepler(r.data.talepler))
      .finally(() => setYukleniyor(false))
  }

  useEffect(() => { yukle(filtre) }, [filtre])

  const iptalEt = async (id) => {
    await api.put(`/musteri/taleplerim/${id}/iptal`)
    setIptalId(null)
    setSecili(null)
    yukle(filtre)
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-gray-900">Taleplerim</h1>

      {/* Filtre tabları */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DURUMLAR.map(d => (
          <button
            key={d}
            onClick={() => setFiltre(d)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filtre === d
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {DURUM_TAB[d]}
          </button>
        ))}
      </div>

      {yukleniyor ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : talepler.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-gray-100">
          <ClipboardList size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Bu kategoride talep bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-3">
          {talepler.map(t => (
            <div
              key={t.id}
              onClick={() => setSecili(t)}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{t.baslik}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {t.usta_ad} · {t.usta_kategori}
                  </p>
                  {t.aciklama && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-1">{t.aciklama}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">{t.olusturma}</p>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg border ${DURUM_RENK[t.durum]}`}>
                  {DURUM_LABEL[t.durum]}
                </span>
              </div>
              {t.usta_notu && (
                <div className="mt-2 px-3 py-2 bg-blue-50 rounded-xl text-xs text-blue-700">
                  <span className="font-semibold">Usta notu:</span> {t.usta_notu}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detay modal */}
      {secili && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setSecili(null)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-extrabold text-gray-900 pr-8">{secili.baslik}</h2>
            <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-lg border ${DURUM_RENK[secili.durum]}`}>
              {DURUM_LABEL[secili.durum]}
            </span>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Usta</span>
                <span className="font-semibold text-gray-800">{secili.usta_ad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Kategori</span>
                <span className="font-semibold text-gray-800">{secili.usta_kategori}</span>
              </div>
              {secili.tercih_tarih && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tercih Tarih</span>
                  <span className="font-semibold text-gray-800">{secili.tercih_tarih}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Gönderilme</span>
                <span className="font-semibold text-gray-800">{secili.olusturma}</span>
              </div>
            </div>

            {secili.aciklama && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-700">
                {secili.aciklama}
              </div>
            )}
            {secili.usta_notu && (
              <div className="mt-2 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                <span className="font-semibold">Usta notu:</span> {secili.usta_notu}
              </div>
            )}

            {/* İletişim butonları */}
            {secili.durum === 'kabul' && (
              <div className="mt-4 flex gap-2">
                {secili.usta_telefon && (
                  <a href={`tel:${secili.usta_telefon}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700">
                    <Phone size={15} /> Ara
                  </a>
                )}
                {secili.usta_whatsapp && (
                  <a
                    href={`https://wa.me/${secili.usta_whatsapp.replace(/\D/g,'')}`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-600"
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                )}
              </div>
            )}

            {/* İptal butonu */}
            {secili.durum === 'bekliyor' && (
              <>
                {iptalId === secili.id ? (
                  <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200">
                    <p className="text-sm text-red-700 font-medium mb-2">Bu talebi iptal etmek istediğinize emin misiniz?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => iptalEt(secili.id)}
                        className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-semibold hover:bg-red-600"
                      >
                        Evet, İptal Et
                      </button>
                      <button
                        onClick={() => setIptalId(null)}
                        className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2 text-sm font-semibold hover:bg-gray-200"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIptalId(secili.id)}
                    className="mt-4 w-full border border-red-300 text-red-500 rounded-xl py-2.5 text-sm font-semibold hover:bg-red-50 transition-colors"
                  >
                    Talebi İptal Et
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
