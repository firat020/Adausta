import { useState, useEffect } from 'react'
import axios from 'axios'
import { ChevronDown, ChevronUp } from 'lucide-react'
import API from '../../config.js'

const durumBadge = {
  opened:                   <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">Açık</span>,
  seller_review:            <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">İncelemede</span>,
  customer_action_required: <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">Müşteri Bekliyor</span>,
  platform_review:          <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">Platform İncelemesinde</span>,
  approved:                 <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Onaylandı</span>,
  rejected:                 <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">Reddedildi</span>,
  refunded:                 <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">İade Edildi</span>,
  closed:                   <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-1 rounded-full">Kapatıldı</span>,
}

const KARAR_SECENEKLER = [
  { value: 'approved',  label: 'Onaylıyorum' },
  { value: 'rejected',  label: 'Reddediyorum' },
  { value: 'exchange',  label: 'Ürün Değişimi Teklif Ediyorum' },
]

export default function SaticiPanelIadeler() {
  const [iadeler, setIadeler] = useState([])
  const [filtre, setFiltre] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [acikId, setAcikId] = useState(null)
  const [cevap, setCevap] = useState({})
  const [karar, setKarar] = useState({})
  const [gonderiyor, setGonderiyor] = useState({})
  const [toast, setToast] = useState(null)

  const goster = (mesaj, renk = 'green') => {
    setToast({ mesaj, renk })
    setTimeout(() => setToast(null), 3000)
  }

  const getir = () => {
    setYukleniyor(true)
    const params = {}
    if (filtre) params.durum = filtre
    axios.get(`${API}/api/iade/satici/listele`, { params, withCredentials: true })
      .then(r => setIadeler(r.data.iadeler || r.data || []))
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }

  useEffect(() => { getir() }, [filtre])

  const satirTikla = (id) => {
    setAcikId(prev => prev === id ? null : id)
  }

  const cevapGonder = async (iade) => {
    const id = iade.id
    if (!karar[id]) { goster('Lütfen bir karar seçin.', 'red'); return }
    setGonderiyor(g => ({ ...g, [id]: true }))
    try {
      await axios.put(`${API}/api/iade/${id}/satici-cevap`, {
        satici_cevabi: cevap[id] || '',
        karar: karar[id],
      }, { withCredentials: true })
      goster('Yanıtınız gönderildi.')
      setAcikId(null)
      getir()
    } catch {
      goster('Yanıt gönderilemedi.', 'red')
    }
    setGonderiyor(g => ({ ...g, [id]: false }))
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg transition-all ${
          toast.renk === 'red' ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {toast.mesaj}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">İadeler</h1>
        <select
          value={filtre}
          onChange={e => setFiltre(e.target.value)}
          className="border border-gray-200 rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:border-[#0052CC] bg-white transition-colors"
        >
          <option value="">Tümü</option>
          <option value="opened">Açık</option>
          <option value="seller_review">İncelemede</option>
          <option value="approved">Onaylananlar</option>
          <option value="rejected">Reddedilenler</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {yukleniyor ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : iadeler.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">İade talebi bulunmuyor.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Sipariş No</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Tarih</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Müşteri</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Neden</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Durum</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">İşlem</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {iadeler.map(iade => (
                  <>
                    <tr
                      key={iade.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => satirTikla(iade.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        {iade.siparis_no || `#${iade.siparis_id}`}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {iade.tarih || iade.olusturma_tarihi || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        Müşteri #{iade.musteri_id || iade.kullanici_id}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                        {iade.neden || iade.iade_nedeni || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {durumBadge[iade.durum] ?? (
                          <span className="text-xs text-gray-400">{iade.durum}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={e => { e.stopPropagation(); satirTikla(iade.id) }}
                          className="text-xs font-semibold text-[#0052CC] hover:underline"
                        >
                          Yanıtla
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {acikId === iade.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                    </tr>

                    {acikId === iade.id && (
                      <tr key={`${iade.id}-detay`} className="bg-blue-50/40 border-b border-gray-200">
                        <td colSpan={7} className="px-6 py-5">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">İade Nedeni</p>
                                <p className="text-sm text-gray-700 bg-white rounded-xl px-3 py-2.5 border border-gray-200">
                                  {iade.neden || iade.iade_nedeni || '—'}
                                </p>
                              </div>
                              {(iade.aciklama || iade.musteri_aciklamasi) && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 mb-1">Müşteri Açıklaması</p>
                                  <p className="text-sm text-gray-700 bg-white rounded-xl px-3 py-2.5 border border-gray-200">
                                    {iade.aciklama || iade.musteri_aciklamasi}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                                Satıcı Cevabı
                              </label>
                              <textarea
                                rows={3}
                                value={cevap[iade.id] || ''}
                                onChange={e => setCevap(c => ({ ...c, [iade.id]: e.target.value }))}
                                placeholder="Müşteriye yanıtınızı yazın..."
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] transition-colors resize-none"
                              />
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-2">Karar</p>
                              <div className="flex flex-wrap gap-3">
                                {KARAR_SECENEKLER.map(opt => (
                                  <label
                                    key={opt.value}
                                    className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
                                  >
                                    <input
                                      type="radio"
                                      name={`karar-${iade.id}`}
                                      value={opt.value}
                                      checked={karar[iade.id] === opt.value}
                                      onChange={() => setKarar(k => ({ ...k, [iade.id]: opt.value }))}
                                      className="accent-[#0052CC]"
                                    />
                                    {opt.label}
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <button
                                onClick={() => cevapGonder(iade)}
                                disabled={gonderiyor[iade.id]}
                                className="bg-[#0052CC] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0047b3] transition-colors disabled:opacity-60"
                              >
                                {gonderiyor[iade.id] ? 'Gönderiliyor...' : 'Yanıt Gönder'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
