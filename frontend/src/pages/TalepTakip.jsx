import { useState } from 'react'
import axios from 'axios'
import API from '../config.js'

const DURUM_RENK = {
  bekliyor:   'bg-yellow-100 text-yellow-700',
  kabul:      'bg-blue-100 text-blue-700',
  tamamlandi: 'bg-green-100 text-green-700',
  red:        'bg-red-100 text-red-600',
}
const DURUM_LABEL = {
  bekliyor: 'Bekliyor', kabul: 'Kabul Edildi',
  tamamlandi: 'Tamamlandı', red: 'Reddedildi'
}

export default function TalepTakip() {
  const [telefon, setTelefon] = useState('')
  const [talepler, setTalepler] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const ara = async (e) => {
    e.preventDefault()
    if (!telefon.trim()) return
    setYukleniyor(true)
    setHata('')
    setTalepler(null)
    try {
      const r = await axios.get(`${API}/api/musteri/talep-takip`, { params: { telefon: telefon.trim() } })
      setTalepler(r.data.talepler)
      if (!r.data.talepler.length) setHata('Bu numara ile kayıtlı talep bulunamadı.')
    } catch (e) {
      setHata(e.response?.data?.hata || 'Bir hata oluştu.')
    }
    setYukleniyor(false)
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-extrabold text-[#1e293b] mb-1">İş Talebi Takip</h1>
        <p className="text-gray-500 text-sm mb-8">Telefon numaranızla gönderdiğiniz talepleri takip edin.</p>

        <form onSubmit={ara} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon Numaranız</label>
          <div className="flex gap-3">
            <input
              type="tel"
              value={telefon}
              onChange={e => setTelefon(e.target.value)}
              placeholder="+90 548 000 00 00"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0052CC]"
            />
            <button
              type="submit"
              disabled={yukleniyor || !telefon.trim()}
              className="px-6 py-3 bg-[#0052CC] text-white rounded-xl text-sm font-semibold hover:bg-[#003d99] disabled:opacity-50 transition"
            >
              {yukleniyor ? 'Aranıyor...' : 'Sorgula'}
            </button>
          </div>
        </form>

        {hata && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {hata}
          </div>
        )}

        {talepler && talepler.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">{talepler.length} talep bulundu</p>
            {talepler.map(t => (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-[#1e293b]">{t.baslik}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.olusturma}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${DURUM_RENK[t.durum] || 'bg-gray-100 text-gray-600'}`}>
                    {DURUM_LABEL[t.durum] || t.durum}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-semibold text-gray-500">Usta:</span> {t.usta_ad}</p>
                  {t.aciklama && <p className="text-gray-500 text-xs">{t.aciklama}</p>}
                  {t.usta_notu && (
                    <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                      Usta notu: {t.usta_notu}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
