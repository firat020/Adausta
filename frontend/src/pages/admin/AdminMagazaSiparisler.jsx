import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { ShoppingCart, Search, X, Package, ChevronDown } from 'lucide-react'
import API from '../../config.js'

const fmt = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0)

const DURUMLAR = [
  { key: '', label: 'Tümü' },
  { key: 'yeni', label: 'Yeni' },
  { key: 'hazirlaniyor', label: 'Hazırlanıyor' },
  { key: 'kargoda', label: 'Kargoda' },
  { key: 'teslim_edildi', label: 'Teslim Edildi' },
  { key: 'iptal', label: 'İptal' },
  { key: 'iade', label: 'İade' },
]

const TUM_DURUMLAR = DURUMLAR.filter(d => d.key)

const DURUM_RENK = {
  yeni:           'bg-blue-100 text-blue-700 border-blue-200',
  hazirlaniyor:   'bg-amber-100 text-amber-700 border-amber-200',
  kargoda:        'bg-violet-100 text-violet-700 border-violet-200',
  teslim_edildi:  'bg-green-100 text-green-700 border-green-200',
  iptal:          'bg-red-100 text-red-500 border-red-200',
  iade:           'bg-orange-100 text-orange-700 border-orange-200',
}

const ODEME_RENK = {
  bekliyor:  'text-amber-600',
  odendi:    'text-green-600',
  basarisiz: 'text-red-600',
  iptal:     'text-gray-400',
}

const ODEME_LABEL = {
  bekliyor:  'Ödeme Bekleniyor',
  odendi:    'Ödendi',
  basarisiz: 'Başarısız',
  iptal:     'İptal',
}

export default function AdminMagazaSiparisler() {
  const [siparisler, setSiparisler] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [aktifDurum, setAktifDurum] = useState('')
  const [aramaInput, setAramaInput] = useState('')
  const [arama, setArama] = useState('')
  const [secili, setSecili] = useState(null)
  const [guncelleniyor, setGuncelleniyor] = useState(false)
  const [yeniDurum, setYeniDurum] = useState('')
  const [adminNotu, setAdminNotu] = useState('')

  const yukleDashboard = () => {
    axios.get(`${API}/api/magaza/admin/magaza-dashboard`, { withCredentials: true })
      .then(r => setDashboard(r.data)).catch(() => {})
  }

  const yukle = useCallback(() => {
    setYukleniyor(true)
    const params = {}
    if (aktifDurum) params.durum = aktifDurum
    if (arama) params.arama = arama
    axios.get(`${API}/api/magaza/admin/magaza-siparisler`, { params, withCredentials: true })
      .then(r => setSiparisler(r.data.siparisler || []))
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [aktifDurum, arama])

  useEffect(() => { yukle(); yukleDashboard() }, [yukle])

  const durumGuncelle = async () => {
    if (!secili || !yeniDurum) return
    setGuncelleniyor(true)
    try {
      const r = await axios.put(
        `${API}/api/magaza/admin/magaza-siparisler/${secili.id}/durum`,
        { durum: yeniDurum, aciklama: adminNotu },
        { withCredentials: true }
      )
      setSiparisler(prev => prev.map(s => s.id === secili.id ? r.data : s))
      setSecili(r.data)
      setYeniDurum(r.data.durum)
      yukle(); yukleDashboard()
    } catch {}
    setGuncelleniyor(false)
  }

  const acDetay = async (s) => {
    try {
      const r = await axios.get(`${API}/api/magaza/admin/magaza-siparisler/${s.id}`, { withCredentials: true })
      setSecili(r.data)
      setYeniDurum(r.data.durum)
      setAdminNotu(r.data.admin_notu || '')
    } catch {
      setSecili(s)
      setYeniDurum(s.durum)
      setAdminNotu(s.admin_notu || '')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#1e293b]">Mağaza Siparişleri</h2>
        <p className="text-gray-500 text-sm">Yeni sipariş modeli — tam müşteri bilgileri</p>
      </div>

      {/* Dashboard kartlar */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-[#C8CDD4] rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-[#1e293b]">{dashboard.bugun_siparis}</p>
            <p className="text-xs text-gray-500 mt-0.5">Bugün Sipariş</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm cursor-pointer" onClick={() => setAktifDurum('yeni')}>
            <p className="text-2xl font-bold text-amber-700">{dashboard.bekleyen}</p>
            <p className="text-xs text-amber-600 mt-0.5">Bekleyen</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-green-700">{dashboard.odendi}</p>
            <p className="text-xs text-green-600 mt-0.5">Ödendi</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
            <p className="text-lg font-bold text-blue-700">{fmt(dashboard.toplam_ciro)}</p>
            <p className="text-xs text-blue-600 mt-0.5">Toplam Ciro</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm">
        {/* Durum Tabs */}
        <div className="flex border-b border-[#C8CDD4] overflow-x-auto">
          {DURUMLAR.map(d => (
            <button key={d.key} onClick={() => setAktifDurum(d.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                aktifDurum === d.key ? 'border-[#0052CC] text-[#0052CC]' : 'border-transparent text-gray-500 hover:text-[#1e293b]'
              }`}
            >{d.label}</button>
          ))}
        </div>

        {/* Arama */}
        <div className="p-3 border-b border-[#C8CDD4] flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="w-full pl-9 pr-4 py-2 text-sm border border-[#C8CDD4] rounded-lg focus:outline-none focus:border-[#0052CC]"
              placeholder="Sipariş no, müşteri adı, telefon..."
              value={aramaInput} onChange={e => setAramaInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setArama(aramaInput)} />
          </div>
          <button onClick={() => setArama(aramaInput)}
            className="px-4 py-2 bg-[#0052CC] text-white text-sm rounded-lg hover:bg-[#003d99]">Ara</button>
          {arama && (
            <button onClick={() => { setArama(''); setAramaInput('') }}
              className="px-3 py-2 text-gray-500 hover:text-red-500 border border-[#C8CDD4] rounded-lg">
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sipariş No</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Müşteri</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Toplam</th>
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
                      <span className="font-mono text-xs text-[#0052CC] font-bold">#{s.siparis_no}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1e293b]">{s.misafir_ad} {s.misafir_soyad}</p>
                      <p className="text-xs text-gray-500">{s.misafir_telefon}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#1e293b] whitespace-nowrap">
                      {fmt(s.genel_toplam_tl)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${ODEME_RENK[s.odeme_durumu] || 'text-gray-500'}`}>
                        {ODEME_LABEL[s.odeme_durumu] || s.odeme_durumu}
                      </span>
                      <p className="text-xs text-gray-400">{s.odeme_yontemi}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{s.olusturma}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${DURUM_RENK[s.durum] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {TUM_DURUMLAR.find(d => d.key === s.durum)?.label || s.durum}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => acDetay(s)} className="text-xs text-[#0052CC] hover:underline font-medium">Detay</button>
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
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#C8CDD4]">
              <div>
                <h3 className="font-bold text-[#1e293b]">Sipariş Detayı</h3>
                <p className="text-xs text-[#0052CC] font-mono mt-0.5">#{secili.siparis_no}</p>
              </div>
              <button onClick={() => setSecili(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Müşteri Bilgileri */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Müşteri</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: 'Ad Soyad', v: `${secili.misafir_ad || ''} ${secili.misafir_soyad || ''}`.trim() },
                    { l: 'Telefon', v: secili.misafir_telefon },
                    { l: 'E-posta', v: secili.misafir_email || '-' },
                    { l: 'Fatura Tipi', v: secili.fatura_tipi === 'kurumsal' ? `Kurumsal — ${secili.fatura_ad}` : 'Bireysel' },
                  ].map(r => (
                    <div key={r.l} className="bg-[#F8F9FA] rounded-lg p-2.5 border border-[#C8CDD4]">
                      <p className="text-xs text-gray-400">{r.l}</p>
                      <p className="font-medium text-[#1e293b] text-sm mt-0.5 break-all">{r.v || '-'}</p>
                    </div>
                  ))}
                  <div className="col-span-2 bg-[#F8F9FA] rounded-lg p-2.5 border border-[#C8CDD4]">
                    <p className="text-xs text-gray-400">Teslimat Adresi</p>
                    <p className="font-medium text-[#1e293b] text-sm mt-0.5">{secili.teslimat_adres || '-'}</p>
                    {secili.teslimat_ilce && <p className="text-xs text-gray-500">{secili.teslimat_ilce}</p>}
                  </div>
                  {secili.musteri_notu && (
                    <div className="col-span-2 bg-amber-50 rounded-lg p-2.5 border border-amber-200">
                      <p className="text-xs text-amber-600">Müşteri Notu</p>
                      <p className="text-sm text-gray-700 mt-0.5">{secili.musteri_notu}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sipariş Kalemleri */}
              {secili.kalemler && secili.kalemler.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Kalemler</p>
                  <div className="bg-[#F8F9FA] rounded-xl border border-[#C8CDD4] overflow-hidden">
                    {secili.kalemler.map((k, idx) => (
                      <div key={k.id} className={`flex items-center gap-3 p-3 ${idx > 0 ? 'border-t border-[#F0F2F5]' : ''}`}>
                        <div className="w-10 h-10 bg-white rounded-lg border border-[#C8CDD4] flex items-center justify-center flex-shrink-0">
                          {k.kapak_gorsel
                            ? <img src={`${API}/uploads/${k.kapak_gorsel}`} className="w-full h-full object-contain p-1" alt={k.urun_ad} />
                            : <Package size={14} className="text-gray-300" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1e293b] truncate">{k.urun_ad}</p>
                          <p className="text-xs text-gray-500">{k.miktar} adet × {fmt(k.birim_fiyat_tl)}</p>
                        </div>
                        <p className="font-bold text-[#1e293b]">{fmt(k.toplam_tl)}</p>
                      </div>
                    ))}
                    <div className="border-t border-[#C8CDD4] px-3 py-2.5 bg-white flex justify-between items-center">
                      <span className="text-sm font-bold text-[#1e293b]">Genel Toplam</span>
                      <span className="text-lg font-black text-[#0052CC]">{fmt(secili.genel_toplam_tl)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ödeme */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ödeme</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#F8F9FA] rounded-lg p-2.5 border border-[#C8CDD4]">
                    <p className="text-xs text-gray-400">Yöntem</p>
                    <p className="font-medium text-[#1e293b] text-sm">{secili.odeme_yontemi || '-'}</p>
                  </div>
                  <div className="bg-[#F8F9FA] rounded-lg p-2.5 border border-[#C8CDD4]">
                    <p className="text-xs text-gray-400">Ödeme Durumu</p>
                    <p className={`font-bold text-sm ${ODEME_RENK[secili.odeme_durumu] || ''}`}>
                      {ODEME_LABEL[secili.odeme_durumu] || secili.odeme_durumu}
                    </p>
                  </div>
                </div>
              </div>

              {/* Durum Güncelle */}
              <div className="bg-[#F8F9FA] rounded-xl border border-[#C8CDD4] p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Durum Güncelle</p>
                <div className="flex items-center gap-2">
                  <select value={yeniDurum} onChange={e => setYeniDurum(e.target.value)}
                    className="flex-1 text-sm border border-[#C8CDD4] rounded-lg px-3 py-2 focus:outline-none focus:border-[#0052CC] bg-white">
                    {TUM_DURUMLAR.map(d => (
                      <option key={d.key} value={d.key}>{d.label}</option>
                    ))}
                  </select>
                  <button onClick={durumGuncelle}
                    disabled={guncelleniyor || yeniDurum === secili.durum}
                    className="px-4 py-2 bg-[#0052CC] text-white text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-[#003d99] transition-colors">
                    {guncelleniyor ? '...' : 'Kaydet'}
                  </button>
                </div>
                <textarea value={adminNotu} onChange={e => setAdminNotu(e.target.value)} rows={2}
                  className="w-full text-sm border border-[#C8CDD4] rounded-lg px-3 py-2 focus:outline-none focus:border-[#0052CC] resize-none"
                  placeholder="Admin notu (opsiyonel)..." />
              </div>

              {/* Durum Geçmişi */}
              {secili.durum_gecmisi && secili.durum_gecmisi.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Durum Geçmişi</p>
                  <div className="space-y-1.5">
                    {secili.durum_gecmisi.map(d => (
                      <div key={d.id} className="flex items-start gap-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC] mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-[#1e293b]">
                            {TUM_DURUMLAR.find(x => x.key === d.yeni_durum)?.label || d.yeni_durum}
                          </span>
                          {d.aciklama && <span className="text-gray-500 ml-1">— {d.aciklama}</span>}
                          <p className="text-gray-400">{d.tarih}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 pt-1 flex justify-between">
                <span>Oluşturulma: {secili.olusturma}</span>
                <span>ID: #{secili.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
