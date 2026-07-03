import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { ShoppingCart, Search, X } from 'lucide-react'
import API from '../../config.js'

const DURUMLAR = [
  { key: '', label: 'Tümü' },
  { key: 'bekliyor', label: 'Bekliyor' },
  { key: 'hazırlanıyor', label: 'Hazırlanıyor' },
  { key: 'kargoda', label: 'Kargoda' },
  { key: 'teslim_edildi', label: 'Teslim Edildi' },
  { key: 'iptal', label: 'İptal' },
]

const TUM_DURUMLAR = [
  { key: 'bekliyor',      label: 'Bekliyor' },
  { key: 'hazırlanıyor', label: 'Hazırlanıyor' },
  { key: 'kargoda',      label: 'Kargoda' },
  { key: 'teslim_edildi', label: 'Teslim Edildi' },
  { key: 'iptal',        label: 'İptal' },
]

const DURUM_RENK = {
  bekliyor:       'bg-amber-100 text-amber-700 border-amber-200',
  'hazırlanıyor': 'bg-blue-100 text-blue-700 border-blue-200',
  kargoda:        'bg-violet-100 text-violet-700 border-violet-200',
  teslim_edildi:  'bg-green-100 text-green-700 border-green-200',
  iptal:          'bg-gray-100 text-gray-500 border-gray-200',
}

const DURUM_LABEL = {
  bekliyor:       'Bekliyor',
  'hazırlanıyor': 'Hazırlanıyor',
  kargoda:        'Kargoda',
  teslim_edildi:  'Teslim Edildi',
  iptal:          'İptal',
}

export default function AdminSiparisler() {
  const [siparisler, setSiparisler] = useState([])
  const [ozet, setOzet] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [aktifDurum, setAktifDurum] = useState('')
  const [arama, setArama] = useState('')
  const [aramaInput, setAramaInput] = useState('')
  const [secili, setSecili] = useState(null)
  const [guncelleniyor, setGuncelleniyor] = useState(null)

  const yukleOzet = () => {
    axios.get(`${API}/api/magaza/admin/siparisler/ozet`, { withCredentials: true })
      .then(r => setOzet(r.data)).catch(() => {})
  }

  const yukle = useCallback(() => {
    setYukleniyor(true)
    const params = {}
    if (aktifDurum) params.durum = aktifDurum
    if (arama) params.arama = arama
    axios.get(`${API}/api/magaza/admin/siparisler`, { params, withCredentials: true })
      .then(r => setSiparisler(r.data.siparisler || []))
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [aktifDurum, arama])

  useEffect(() => { yukle(); yukleOzet() }, [yukle])

  const durumGuncelle = async (sipId, yeniDurum) => {
    setGuncelleniyor(sipId)
    try {
      const r = await axios.put(
        `${API}/api/magaza/admin/siparisler/${sipId}`,
        { durum: yeniDurum },
        { withCredentials: true }
      )
      setSiparisler(prev => prev.map(s => s.id === sipId ? r.data : s))
      if (secili?.id === sipId) setSecili(r.data)
      yukleOzet()
    } catch {}
    setGuncelleniyor(null)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#1e293b]">Sipariş Yönetimi</h2>
        <p className="text-gray-500 text-sm">Mağaza siparişlerini takip et ve yönet</p>
      </div>

      {/* Özet kartlar */}
      {ozet && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          <div className="bg-white border border-[#C8CDD4] rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#1e293b]">{ozet.toplam}</p>
            <p className="text-xs text-gray-500 mt-0.5">Toplam</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center shadow-sm cursor-pointer" onClick={() => setAktifDurum('bekliyor')}>
            <p className="text-2xl font-bold text-amber-700">{ozet.bekliyor}</p>
            <p className="text-xs text-amber-600 mt-0.5">Bekliyor</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center shadow-sm cursor-pointer" onClick={() => setAktifDurum('hazırlanıyor')}>
            <p className="text-2xl font-bold text-blue-700">{ozet.hazirlaniyor}</p>
            <p className="text-xs text-blue-600 mt-0.5">Hazırlanıyor</p>
          </div>
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center shadow-sm cursor-pointer" onClick={() => setAktifDurum('kargoda')}>
            <p className="text-2xl font-bold text-violet-700">{ozet.kargoda}</p>
            <p className="text-xs text-violet-600 mt-0.5">Kargoda</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center shadow-sm cursor-pointer" onClick={() => setAktifDurum('teslim_edildi')}>
            <p className="text-2xl font-bold text-green-700">{ozet.teslim_edildi}</p>
            <p className="text-xs text-green-600 mt-0.5">Teslim / {ozet.teslim_ciro?.toLocaleString('tr-TR')} ₺</p>
          </div>
        </div>
      )}

      {/* Tablo kartı */}
      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm">
        {/* Durum Tabs */}
        <div className="flex border-b border-[#C8CDD4] overflow-x-auto">
          {DURUMLAR.map(d => (
            <button
              key={d.key}
              onClick={() => setAktifDurum(d.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                aktifDurum === d.key
                  ? 'border-[#0052CC] text-[#0052CC]'
                  : 'border-transparent text-gray-500 hover:text-[#1e293b]'
              }`}
            >
              {d.label}
              {ozet && d.key === 'bekliyor' && ozet.bekliyor > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{ozet.bekliyor}</span>
              )}
            </button>
          ))}
        </div>

        {/* Arama */}
        <div className="p-3 border-b border-[#C8CDD4] flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#C8CDD4] rounded-lg focus:outline-none focus:border-[#0052CC]"
              placeholder="Sipariş kodu, müşteri adı veya telefon..."
              value={aramaInput}
              onChange={e => setAramaInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setArama(aramaInput)}
            />
          </div>
          <button
            onClick={() => setArama(aramaInput)}
            className="px-4 py-2 bg-[#0052CC] text-white text-sm rounded-lg hover:bg-[#003d99] transition-colors"
          >Ara</button>
          {arama && (
            <button onClick={() => { setArama(''); setAramaInput('') }} className="px-3 py-2 text-gray-500 hover:text-red-500 border border-[#C8CDD4] rounded-lg transition-colors">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Tablo */}
        <div className="overflow-x-auto">
          {yukleniyor ? (
            <div className="flex justify-center py-14">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
            </div>
          ) : siparisler.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sipariş bulunamadı</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#C8CDD4] bg-[#F8F9FA]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sipariş</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Müşteri</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ürün</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tutar</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ödeme</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Durum</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {siparisler.map(s => (
                  <tr key={s.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[#0052CC] font-bold">#{s.siparis_kodu || s.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1e293b]">{s.misafir_ad || '-'}</p>
                      <p className="text-xs text-gray-500">{s.misafir_telefon || ''}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="truncate text-[#1e293b]">{s.urun_ad || `Ürün #${s.urun_id}`}</p>
                      <p className="text-xs text-gray-500">x{s.miktar}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#1e293b] whitespace-nowrap">
                      {s.toplam_tl?.toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {s.odeme_yontemi || 'Belirtilmedi'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{s.olusturma}</td>
                    <td className="px-4 py-3">
                      {/* Inline durum dropdown */}
                      <select
                        value={s.durum}
                        disabled={guncelleniyor === s.id}
                        onChange={e => durumGuncelle(s.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1.5 rounded-lg border cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 ${DURUM_RENK[s.durum] || 'bg-gray-100 text-gray-500 border-gray-200'}`}
                      >
                        {TUM_DURUMLAR.map(d => (
                          <option key={d.key} value={d.key}>{d.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSecili(s)} className="text-xs text-[#0052CC] hover:underline font-medium whitespace-nowrap">
                        Detay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detay Modal */}
      {secili && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#C8CDD4]">
              <div>
                <h3 className="font-bold text-[#1e293b]">Sipariş Detayı</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">#{secili.siparis_kodu || secili.id}</p>
              </div>
              <button onClick={() => setSecili(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Durum değiştirme — tüm seçenekler */}
              <div className="p-4 bg-[#F8F9FA] rounded-xl border border-[#C8CDD4]">
                <p className="text-xs text-gray-500 mb-3 font-medium">Durum Güncelle</p>
                <div className="flex flex-wrap gap-2">
                  {TUM_DURUMLAR.map(d => (
                    <button
                      key={d.key}
                      disabled={guncelleniyor === secili.id || secili.durum === d.key}
                      onClick={() => durumGuncelle(secili.id, d.key)}
                      className={`text-xs px-3 py-2 rounded-lg font-medium transition-all border disabled:cursor-default ${
                        secili.durum === d.key
                          ? `${DURUM_RENK[d.key]} font-bold ring-2 ring-offset-1 ring-current`
                          : d.key === 'iptal'
                            ? 'bg-white text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-40'
                            : 'bg-white text-[#0052CC] border-[#C8CDD4] hover:bg-blue-50 hover:border-[#0052CC] disabled:opacity-40'
                      }`}
                    >
                      {d.label}
                      {secili.durum === d.key && ' (Mevcut)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Müşteri */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Müşteri Bilgileri</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#F8F9FA] rounded-lg p-3 border border-[#C8CDD4]">
                    <p className="text-xs text-gray-500">Ad Soyad</p>
                    <p className="font-medium text-[#1e293b] text-sm mt-0.5">{secili.misafir_ad || '-'}</p>
                  </div>
                  <div className="bg-[#F8F9FA] rounded-lg p-3 border border-[#C8CDD4]">
                    <p className="text-xs text-gray-500">Telefon</p>
                    <p className="font-medium text-[#1e293b] text-sm mt-0.5">{secili.misafir_telefon || '-'}</p>
                  </div>
                  <div className="col-span-2 bg-[#F8F9FA] rounded-lg p-3 border border-[#C8CDD4]">
                    <p className="text-xs text-gray-500">E-posta</p>
                    <p className="font-medium text-[#1e293b] text-sm mt-0.5">{secili.misafir_email || '-'}</p>
                  </div>
                  <div className="col-span-2 bg-[#F8F9FA] rounded-lg p-3 border border-[#C8CDD4]">
                    <p className="text-xs text-gray-500">Teslimat Adresi</p>
                    <p className="font-medium text-[#1e293b] text-sm mt-0.5">{secili.misafir_adres || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Ürün + Ödeme */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sipariş</p>
                <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[#C8CDD4]">
                  <p className="font-semibold text-[#1e293b]">{secili.urun_ad || `Ürün #${secili.urun_id}`}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#C8CDD4]">
                    <span className="text-sm text-gray-500">Adet: <strong className="text-[#1e293b]">{secili.miktar}</strong></span>
                    <span className="text-sm text-gray-500">Birim: <strong className="text-[#1e293b]">{secili.birim_fiyat_tl?.toLocaleString('tr-TR')} ₺</strong></span>
                    <span className="font-bold text-lg text-[#0052CC]">{secili.toplam_tl?.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#C8CDD4] flex items-center justify-between">
                    <span className="text-xs text-gray-500">Ödeme Yöntemi</span>
                    <span className="text-sm font-medium text-[#1e293b]">{secili.odeme_yontemi || 'Belirtilmedi'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <span>Sipariş Tarihi: {secili.olusturma}</span>
                <span>ID: #{secili.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
