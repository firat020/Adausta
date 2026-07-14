import { useState, useEffect } from 'react'
import axios from 'axios'
import { Info } from 'lucide-react'
import API from '../../config.js'

export default function SaticiPanelMagaza() {
  const [magaza, setMagaza] = useState(null)
  const [form, setForm] = useState({ magaza_adi: '', aciklama: '' })
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [basari, setBasari] = useState(false)
  const [hata, setHata] = useState(null)

  useEffect(() => {
    axios.get(`${API}/api/satici-panel/magaza`, { withCredentials: true })
      .then(r => {
        setMagaza(r.data)
        setForm({ magaza_adi: r.data.magaza_adi || '', aciklama: r.data.aciklama || '' })
        setYukleniyor(false)
      })
      .catch(() => {
        setHata('Mağaza bilgileri yüklenemedi.')
        setYukleniyor(false)
      })
  }, [])

  const kaydet = async () => {
    setKaydediliyor(true)
    setBasari(false)
    setHata(null)
    try {
      await axios.put(`${API}/api/satici-panel/magaza`, form, { withCredentials: true })
      setBasari(true)
      setTimeout(() => setBasari(false), 3000)
    } catch {
      setHata('Kayıt sırasında bir hata oluştu.')
    }
    setKaydediliyor(false)
  }

  const vergiNoMaskele = (vn) => {
    if (!vn) return '***'
    return vn.slice(0, 3) + '***' + vn.slice(-2)
  }

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0052CC]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Mağazam</h1>

      {hata && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{hata}</div>
      )}
      {basari && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm">Değişiklikler kaydedildi.</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">Mağaza Bilgileri</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mağaza Adı</label>
            <input
              type="text"
              value={form.magaza_adi}
              onChange={e => setForm(f => ({ ...f, magaza_adi: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Slug</label>
            <input
              type="text"
              value={magaza?.slug || ''}
              readOnly
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Açıklama</label>
          <textarea
            value={form.aciklama}
            onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] transition-colors resize-none"
            placeholder="Mağazanız hakkında kısa bir açıklama..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Vergi No</label>
            <input
              type="text"
              value={vergiNoMaskele(magaza?.vergi_no)}
              readOnly
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Komisyon Oranı</label>
            <input
              type="text"
              value={magaza?.komisyon_orani != null ? `%${magaza.komisyon_orani}` : '—'}
              readOnly
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={kaydet}
            disabled={kaydediliyor}
            className="bg-[#0052CC] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0047b3] transition-colors disabled:opacity-60"
          >
            {kaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">Logo ve Kapak Görseli</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Logo</p>
            {magaza?.logo ? (
              <img src={magaza.logo} alt="Logo" className="h-20 w-20 object-contain rounded-xl border border-gray-200 bg-gray-50" />
            ) : (
              <div className="h-20 w-20 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                Yok
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Kapak Görseli</p>
            {magaza?.kapak_gorsel ? (
              <img src={magaza.kapak_gorsel} alt="Kapak" className="h-20 w-36 object-cover rounded-xl border border-gray-200" />
            ) : (
              <div className="h-20 w-36 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                Yok
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-3.5">
          <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">Logo değişikliği için destek ekibine başvurun.</p>
        </div>
      </div>
    </div>
  )
}
