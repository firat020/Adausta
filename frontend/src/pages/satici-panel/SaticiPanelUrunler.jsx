import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Plus, Search, X, Trash2, Upload, Edit2 } from 'lucide-react'
import API from '../../config.js'

const durumBadge = {
  pending_review: <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">İncelemede</span>,
  active:         <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Aktif</span>,
  passive:        <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-1 rounded-full">Pasif</span>,
  draft:          <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-1 rounded-full">Taslak</span>,
  suspended:      <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">Askıda</span>,
}

const bos = {
  ad: '', aciklama: '', usd_fiyat: '', kur: '', stok: '',
  sku: '', kategori: '', aktif: true,
}

export default function SaticiPanelUrunler() {
  const [urunler, setUrunler] = useState([])
  const [ara, setAra] = useState('')
  const [filtre, setFiltre] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(bos)
  const [kayit, setKayit] = useState(false)
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false)
  const dosyaRef = useRef(null)

  const getir = () => {
    setYukleniyor(true)
    const params = {}
    if (ara) params.ara = ara
    if (filtre) params.durum = filtre
    axios.get(`${API}/api/satici-panel/urunler`, { params, withCredentials: true })
      .then(r => setUrunler(r.data.urunler || []))
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }

  useEffect(() => { getir() }, [ara, filtre])

  const kurGetir = () => {
    axios.get(`${API}/api/magaza/kur`, { withCredentials: true })
      .then(r => setForm(f => ({ ...f, kur: r.data.kur ?? '' })))
      .catch(() => {})
  }

  const yeniAc = () => {
    setForm(bos)
    setModal({ mod: 'ekle' })
    kurGetir()
  }

  const duzenleAc = (u) => {
    setForm({
      ad: u.ad ?? '',
      aciklama: u.aciklama ?? '',
      usd_fiyat: u.usd_fiyat ?? '',
      kur: u.kur ?? '',
      stok: u.stok ?? '',
      sku: u.sku ?? '',
      kategori: u.kategori ?? '',
      aktif: u.aktif ?? true,
    })
    setModal({ mod: 'duzenle', urun: u })
  }

  const kapat = () => { setModal(null); setForm(bos) }

  const kaydet = async () => {
    setKayit(true)
    try {
      if (modal.mod === 'ekle') {
        await axios.post(`${API}/api/satici-panel/urun`, form, { withCredentials: true })
      } else {
        await axios.put(`${API}/api/satici-panel/urun/${modal.urun.id}`, form, { withCredentials: true })
      }
      kapat()
      getir()
    } catch {}
    setKayit(false)
  }

  const sil = async (id) => {
    if (!window.confirm('Ürünü pasife almak istediğinize emin misiniz?')) return
    await axios.delete(`${API}/api/satici-panel/urun/${id}`, { withCredentials: true })
    getir()
  }

  const gorselYukle = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !modal?.urun) return
    setGorselYukleniyor(true)
    const fd = new FormData()
    fd.append('gorsel', file)
    try {
      const r = await axios.post(`${API}/api/satici-panel/urun/${modal.urun.id}/gorsel`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setModal(m => ({ ...m, urun: { ...m.urun, gorseller: r.data.gorseller } }))
    } catch {}
    setGorselYukleniyor(false)
    e.target.value = ''
  }

  const gorselSil = async (gorselId) => {
    if (!modal?.urun) return
    await axios.delete(`${API}/api/satici-panel/urun/${modal.urun.id}/gorsel/${gorselId}`, { withCredentials: true })
    setModal(m => ({
      ...m,
      urun: { ...m.urun, gorseller: m.urun.gorseller?.filter(g => g.id !== gorselId) }
    }))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Ürünlerim</h1>
        <button
          onClick={yeniAc}
          className="flex items-center gap-2 bg-[#0052CC] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0047b3] transition-colors"
        >
          <Plus size={16} /> Yeni Ürün Ekle
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Ürün ara..."
            value={ara}
            onChange={e => setAra(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
          />
        </div>
        <select
          value={filtre}
          onChange={e => setFiltre(e.target.value)}
          className="border border-gray-200 rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:border-[#0052CC] bg-white transition-colors"
        >
          <option value="">Tüm Durumlar</option>
          <option value="pending_review">İncelemede</option>
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
          <option value="draft">Taslak</option>
          <option value="suspended">Askıda</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {yukleniyor ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : urunler.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Ürün bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Görsel</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Ürün Adı</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">SKU</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Fiyat</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Stok</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Durum</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {urunler.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {u.gorsel ? (
                        <img src={u.gorsel} alt={u.ad} className="h-10 w-10 object-cover rounded-lg border border-gray-200" />
                      ) : (
                        <div className="h-10 w-10 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-300 text-xs">—</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[180px] truncate">{u.ad}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.sku || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>${u.usd_fiyat}</div>
                      {u.kur && u.usd_fiyat && (
                        <div className="text-xs text-gray-400">
                          ₺{(parseFloat(u.usd_fiyat) * parseFloat(u.kur)).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.stok}</td>
                    <td className="px-4 py-3">{durumBadge[u.durum] ?? <span className="text-xs text-gray-400">{u.durum}</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => duzenleAc(u)}
                          className="text-[#0052CC] hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => sil(u.id)}
                          className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                          title="Pasife Al"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-base font-semibold text-gray-900">
                {modal.mod === 'ekle' ? 'Yeni Ürün Ekle' : 'Ürünü Düzenle'}
              </h2>
              <button onClick={kapat} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ürün Adı</label>
                <input
                  type="text"
                  value={form.ad}
                  onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Açıklama</label>
                <textarea
                  value={form.aciklama}
                  onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">USD Fiyat ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.usd_fiyat}
                    onChange={e => setForm(f => ({ ...f, usd_fiyat: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kur (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.kur}
                    onChange={e => setForm(f => ({ ...f, kur: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Stok</label>
                  <input
                    type="number"
                    value={form.stok}
                    onChange={e => setForm(f => ({ ...f, stok: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">SKU</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kategori</label>
                <input
                  type="text"
                  value={form.kategori}
                  onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-600">Aktif</label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, aktif: !f.aktif }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.aktif ? 'bg-[#0052CC]' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${form.aktif ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {modal.mod === 'duzenle' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Görseller</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {modal.urun?.gorseller?.map(g => (
                      <div key={g.id} className="relative group">
                        <img src={g.url} alt="" className="h-16 w-16 object-cover rounded-xl border border-gray-200" />
                        <button
                          onClick={() => gorselSil(g.id)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input ref={dosyaRef} type="file" accept="image/*" className="hidden" onChange={gorselYukle} />
                  <button
                    type="button"
                    onClick={() => dosyaRef.current?.click()}
                    disabled={gorselYukleniyor}
                    className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-500 hover:border-[#0052CC] hover:text-[#0052CC] transition-colors disabled:opacity-50"
                  >
                    <Upload size={14} />
                    {gorselYukleniyor ? 'Yükleniyor...' : 'Görsel Ekle'}
                  </button>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 flex justify-end gap-3">
              <button
                onClick={kapat}
                className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={kaydet}
                disabled={kayit}
                className="px-5 py-2.5 bg-[#0052CC] text-white text-sm font-semibold rounded-xl hover:bg-[#0047b3] transition-colors disabled:opacity-60"
              >
                {kayit ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
