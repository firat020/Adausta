import { useState, useEffect } from 'react'
import axios from 'axios'
import { ChevronDown, ChevronUp } from 'lucide-react'
import API from '../../config.js'

const durumBadge = {
  yeni:           <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">Yeni</span>,
  hazirlaniyor:   <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">Hazırlanıyor</span>,
  kargoda:        <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">Kargoda</span>,
  teslim_edildi:  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Teslim Edildi</span>,
  iptal:          <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">İptal</span>,
}

const odemeRenk = {
  odendi:   'bg-green-100 text-green-700',
  bekliyor: 'bg-yellow-100 text-yellow-700',
  iade:     'bg-red-100 text-red-700',
}

export default function SaticiPanelSiparisler() {
  const [siparisler, setSiparisler] = useState([])
  const [filtre, setFiltre] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [acikId, setAcikId] = useState(null)
  const [detay, setDetay] = useState({})
  const [detayYukleniyor, setDetayYukleniyor] = useState(false)
  const [durum, setDurum] = useState({})
  const [not, setNot] = useState({})
  const [guncelleniyor, setGuncelleniyor] = useState({})

  const getir = () => {
    setYukleniyor(true)
    const params = {}
    if (filtre) params.durum = filtre
    axios.get(`${API}/api/satici-panel/siparisler`, { params, withCredentials: true })
      .then(r => setSiparisler(r.data.siparisler || []))
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }

  useEffect(() => { getir() }, [filtre])

  const satirTikla = (id) => {
    if (acikId === id) { setAcikId(null); return }
    setAcikId(id)
    if (!detay[id]) {
      setDetayYukleniyor(true)
      axios.get(`${API}/api/satici-panel/siparis/${id}`, { withCredentials: true })
        .then(r => {
          setDetay(d => ({ ...d, [id]: r.data }))
          setDurum(d => ({ ...d, [id]: r.data.durum }))
          setNot(n => ({ ...n, [id]: r.data.admin_notu || '' }))
        })
        .catch(() => {})
        .finally(() => setDetayYukleniyor(false))
    }
  }

  const durumGuncelle = async (id) => {
    setGuncelleniyor(g => ({ ...g, [id]: true }))
    try {
      await axios.put(`${API}/api/satici-panel/siparis/${id}/durum`, {
        durum: durum[id],
        admin_notu: not[id],
      }, { withCredentials: true })
      setSiparisler(s => s.map(x => x.id === id ? { ...x, durum: durum[id] } : x))
      setDetay(d => ({ ...d, [id]: { ...d[id], durum: durum[id] } }))
    } catch {}
    setGuncelleniyor(g => ({ ...g, [id]: false }))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Siparişler</h1>
        <select
          value={filtre}
          onChange={e => setFiltre(e.target.value)}
          className="border border-gray-200 rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:border-[#0052CC] bg-white transition-colors"
        >
          <option value="">Tüm Durumlar</option>
          <option value="yeni">Yeni</option>
          <option value="hazirlaniyor">Hazırlanıyor</option>
          <option value="kargoda">Kargoda</option>
          <option value="teslim_edildi">Teslim Edildi</option>
          <option value="iptal">İptal</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {yukleniyor ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : siparisler.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Sipariş bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Sipariş No</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Müşteri</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Tarih</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Tutar</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Durum</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Ödeme</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {siparisler.map(s => (
                  <>
                    <tr
                      key={s.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => satirTikla(s.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.siparis_no}</td>
                      <td className="px-4 py-3 text-gray-600">Müşteri</td>
                      <td className="px-4 py-3 text-gray-600">{s.tarih}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {(s.tutar ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </td>
                      <td className="px-4 py-3">{durumBadge[s.durum] ?? <span className="text-xs text-gray-400">{s.durum}</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${odemeRenk[s.odeme_durumu] ?? 'bg-gray-100 text-gray-500'}`}>
                          {s.odeme_durumu || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {acikId === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                    </tr>

                    {acikId === s.id && (
                      <tr key={`${s.id}-detay`} className="bg-blue-50/40 border-b border-gray-200">
                        <td colSpan={7} className="px-6 py-5">
                          {detayYukleniyor && !detay[s.id] ? (
                            <div className="flex items-center justify-center h-16">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0052CC]" />
                            </div>
                          ) : detay[s.id] ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 mb-2">Sipariş Kalemleri</p>
                                  <div className="space-y-1.5">
                                    {detay[s.id].kalemler?.map((k, i) => (
                                      <div key={i} className="flex items-center justify-between text-sm bg-white rounded-xl px-3 py-2 border border-gray-200">
                                        <span className="text-gray-700">{k.urun_adi}</span>
                                        <span className="text-gray-500 text-xs">{k.adet} x {k.fiyat} ₺</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 mb-2">Teslimat Adresi</p>
                                  <div className="bg-white rounded-xl px-3 py-2.5 border border-gray-200 text-sm text-gray-600">
                                    {detay[s.id].teslimat_adresi || 'Adres bilgisi yok'}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Durum Güncelle</label>
                                  <select
                                    value={durum[s.id] || s.durum}
                                    onChange={e => setDurum(d => ({ ...d, [s.id]: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] bg-white transition-colors"
                                  >
                                    <option value="yeni">Yeni</option>
                                    <option value="hazirlaniyor">Hazırlanıyor</option>
                                    <option value="kargoda">Kargoda</option>
                                    <option value="teslim_edildi">Teslim Edildi</option>
                                    <option value="iptal">İptal</option>
                                  </select>
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Admin Notu</label>
                                  <input
                                    type="text"
                                    value={not[s.id] ?? ''}
                                    onChange={e => setNot(n => ({ ...n, [s.id]: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
                                    placeholder="Not ekle..."
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <button
                                  onClick={() => durumGuncelle(s.id)}
                                  disabled={guncelleniyor[s.id]}
                                  className="bg-[#0052CC] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0047b3] transition-colors disabled:opacity-60"
                                >
                                  {guncelleniyor[s.id] ? 'Güncelleniyor...' : 'Durumu Güncelle'}
                                </button>
                              </div>
                            </div>
                          ) : null}
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
