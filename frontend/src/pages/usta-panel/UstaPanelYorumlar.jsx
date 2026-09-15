import { useState, useEffect } from 'react'
import { Star, MessageSquare, Reply } from 'lucide-react'
import { ustaPanelYorumlar, ustaPanelYorumCevapla } from '../../api'

export default function UstaPanelYorumlar() {
  const [yorumlar, setYorumlar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [cevapAcik, setCevapAcik] = useState(null)
  const [cevapMetin, setCevapMetin] = useState('')
  const [gonderiliyor, setGonderiliyor] = useState(false)

  const yukle = () => {
    ustaPanelYorumlar()
      .then(r => setYorumlar(r.data.yorumlar))
      .finally(() => setYukleniyor(false))
  }

  useEffect(() => { yukle() }, [])

  const cevapGonder = async (id) => {
    const metin = cevapMetin.trim()
    if (!metin || gonderiliyor) return
    setGonderiliyor(true)
    try {
      await ustaPanelYorumCevapla(id, metin)
      setCevapAcik(null)
      setCevapMetin('')
      yukle()
    } catch (err) {
      alert(err.response?.data?.hata || 'Yanıt gönderilemedi')
    }
    setGonderiliyor(false)
  }

  const onaylananlar = yorumlar.filter(y => y.onaylanmis !== false)
  const bekleyenler = yorumlar.filter(y => y.onaylanmis === false)
  const ort = onaylananlar.length > 0
    ? (onaylananlar.reduce((s, y) => s + y.puan, 0) / onaylananlar.length).toFixed(1)
    : '-'

  if (yukleniyor) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Yorumlar</h1>
        <p className="text-sm text-gray-500 mt-1">Müşterilerinizin değerlendirmeleri</p>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-extrabold text-orange-500">{ort}</p>
          <p className="text-xs text-gray-400 mt-1">Ort. Puan</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-extrabold text-blue-600">{onaylananlar.length}</p>
          <p className="text-xs text-gray-400 mt-1">Onaylanan</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-extrabold text-yellow-500">{bekleyenler.length}</p>
          <p className="text-xs text-gray-400 mt-1">Bekleyen</p>
        </div>
      </div>

      {yorumlar.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <MessageSquare size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Henüz yorum yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {yorumlar.map(y => (
            <div key={y.id} className={`bg-white rounded-2xl p-4 border shadow-sm ${
              y.onaylanmis === false ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-blue-700 font-bold text-base">
                      {y.musteri_adi?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{y.musteri_adi}</p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={13}
                          className={i < y.puan ? 'text-orange-400 fill-orange-400' : 'text-gray-200 fill-gray-200'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">{y.tarih}</p>
                  {y.onaylanmis === false && (
                    <span className="text-xs text-yellow-600 font-medium bg-yellow-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                      Onay Bekliyor
                    </span>
                  )}
                </div>
              </div>
              {y.yorum && (
                <p className="text-sm text-gray-600 mt-3 leading-relaxed pl-13 ml-13">
                  {y.yorum}
                </p>
              )}

              {y.cevap ? (
                <div className="mt-3 ml-13 pl-13 bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-700">Yanıtınız · {y.cevap_tarih}</p>
                  <p className="text-sm text-blue-900 mt-1">{y.cevap}</p>
                </div>
              ) : y.onaylanmis !== false && (
                cevapAcik === y.id ? (
                  <div className="mt-3 ml-13 pl-13 space-y-2">
                    <textarea
                      value={cevapMetin}
                      onChange={e => setCevapMetin(e.target.value)}
                      maxLength={1000}
                      rows={2}
                      placeholder="Müşteriye yanıtınızı yazın..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => cevapGonder(y.id)}
                        disabled={!cevapMetin.trim() || gonderiliyor}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
                      >
                        Yanıtla
                      </button>
                      <button
                        onClick={() => { setCevapAcik(null); setCevapMetin('') }}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setCevapAcik(y.id); setCevapMetin('') }}
                    className="mt-3 ml-13 pl-13 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <Reply size={13} /> Yanıtla
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
