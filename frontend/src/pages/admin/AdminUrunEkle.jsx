import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Package, DollarSign, Image, BarChart2, ChevronLeft, Check, RefreshCw, Plus, X } from 'lucide-react'
import API from '../../config.js'

const fmt = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0)

function hesapla(usd, kur, marj, kargo, kdvDahil) {
  const base = usd * kur
  const ara = base + base * (marj / 100) + kargo
  return kdvDahil ? ara * 1.20 : ara
}

export default function AdminUrunEkle() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const duzenlemeId = params.get('id')

  const [form, setForm] = useState({
    ad: '', aciklama: '', usd: '', kur: '41.50', marj: '25',
    kargo: '0', kdvDahil: true, sku: '', barkod: '', stok: '0',
    aktif: true, markaId: '', modelId: '', kategori: '',
  })
  const [markalar, setMarkalar] = useState([])
  const [modeller, setModeller] = useState([])
  const [yeniMarka, setYeniMarka] = useState('')
  const [yeniModel, setYeniModel] = useState('')
  const [markaAc, setMarkaAc] = useState(false)
  const [modelAc, setModelAc] = useState(false)
  const [kategoriAc, setKategoriAc] = useState(false)
  const [yeniKategori, setYeniKategori] = useState('')
  const [kurYukleniyor, setKurYukleniyor] = useState(false)
  const [kurZaman, setKurZaman] = useState('—')
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [basari, setBasari] = useState(false)
  const [gorseller, setGorseller] = useState([])
  const [bekleyenGorseller, setBekleyenGorseller] = useState([])
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false)
  const gorselRef = useRef(null)

  const tl = hesapla(
    parseFloat(form.usd) || 0,
    parseFloat(form.kur) || 0,
    form.marj !== '' ? parseFloat(form.marj) : 0,
    parseFloat(form.kargo) || 0,
    form.kdvDahil
  )
  const base = (parseFloat(form.usd) || 0) * (parseFloat(form.kur) || 0)
  const marjTL = base * ((form.marj !== '' ? parseFloat(form.marj) : 0) / 100)
  const kargoTL = parseFloat(form.kargo) || 0
  const kdvTL = form.kdvDahil ? (base + marjTL + kargoTL) * 0.20 : 0

  useEffect(() => {
    axios.get(`${API}/api/magaza/markalar`).then(r => setMarkalar(r.data)).catch(() => {})
    if (duzenlemeId) {
      axios.get(`${API}/api/magaza/urunler/${duzenlemeId}`, { withCredentials: true }).then(r => {
        const u = r.data
        setForm({
          ad: u.ad, aciklama: u.aciklama, usd: u.usd_fiyat, kur: u.kur,
          marj: u.kar_marji !== null && u.kar_marji !== undefined ? String(u.kar_marji) : '25',
          kargo: u.kargo_ucreti, kdvDahil: u.kdv_dahil,
          sku: u.sku, barkod: u.barkod, stok: u.stok, aktif: u.aktif,
          markaId: u.marka_id || '', modelId: u.model_id || '', kategori: u.kategori,
        })
        if (u.gorseller) setGorseller(u.gorseller)
      }).catch(() => {})
    }
  }, [duzenlemeId])

  useEffect(() => {
    if (!form.markaId) { setModeller([]); return }
    axios.get(`${API}/api/magaza/modeller`, { params: { marka_id: form.markaId } })
      .then(r => setModeller(r.data)).catch(() => {})
  }, [form.markaId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const kurYenile = async () => {
    setKurYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/magaza/kur`)
      if (r.data.kur) {
        set('kur', r.data.kur.toString())
        const now = new Date()
        setKurZaman(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`)
      }
    } catch {}
    setKurYukleniyor(false)
  }

  const markaEkle = async () => {
    if (!yeniMarka.trim()) return
    const r = await axios.post(`${API}/api/magaza/markalar`, { ad: yeniMarka }, { withCredentials: true })
    setMarkalar(m => [...m, r.data])
    set('markaId', r.data.id)
    setYeniMarka('')
    setMarkaAc(false)
  }

  const modelEkle = async () => {
    if (!yeniModel.trim() || !form.markaId) return
    const r = await axios.post(`${API}/api/magaza/modeller`, { ad: yeniModel, marka_id: form.markaId }, { withCredentials: true })
    setModeller(m => [...m, r.data])
    set('modelId', r.data.id)
    setYeniModel('')
    setModelAc(false)
  }

  const kategoriEkle = () => {
    if (!yeniKategori.trim()) return
    set('kategori', yeniKategori.trim())
    setYeniKategori('')
    setKategoriAc(false)
  }

  const gorselYukle = async (files) => {
    if (!duzenlemeId) {
      for (const file of Array.from(files)) {
        const previewUrl = URL.createObjectURL(file)
        setBekleyenGorseller(g => [...g, { file, previewUrl, tempId: `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}` }])
      }
      return
    }
    setGorselYukleniyor(true)
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData()
        fd.append('gorsel', file)
        const r = await axios.post(
          `${API}/api/magaza/urunler/${duzenlemeId}/gorsel`,
          fd,
          { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
        )
        setGorseller(g => [...g, { id: r.data.id, yol: r.data.yol, sira: g.length }])
      } catch (e) {
        alert(e.response?.data?.hata || 'Resim yüklenemedi')
      }
    }
    setGorselYukleniyor(false)
  }

  const gorselSil = async (gorselId, isBekleyen) => {
    if (isBekleyen) {
      setBekleyenGorseller(g => {
        const item = g.find(x => x.tempId === gorselId)
        if (item) URL.revokeObjectURL(item.previewUrl)
        return g.filter(x => x.tempId !== gorselId)
      })
      return
    }
    try {
      await axios.delete(`${API}/api/magaza/gorseller/${gorselId}`, { withCredentials: true })
    } catch {}
    setGorseller(g => g.filter(x => x.id !== gorselId))
  }

  const kaydet = async () => {
    if (!form.ad.trim() || !form.usd || !form.kur) {
      alert('Ürün adı ve USD fiyatı zorunlu.')
      return
    }
    setKaydediliyor(true)
    const payload = {
      ad: form.ad, aciklama: form.aciklama,
      usd_fiyat: parseFloat(form.usd), kur: parseFloat(form.kur),
      kar_marji: form.marj !== '' ? parseFloat(form.marj) : 25,
      kargo_ucreti: parseFloat(form.kargo) || 0,
      kdv_dahil: form.kdvDahil, sku: form.sku, barkod: form.barkod,
      stok: parseInt(form.stok) || 0, aktif: form.aktif,
      marka_id: form.markaId || null, model_id: form.modelId || null,
      kategori: form.kategori,
    }
    try {
      let hedefId = duzenlemeId
      if (duzenlemeId) {
        await axios.put(`${API}/api/magaza/urunler/${duzenlemeId}`, payload, { withCredentials: true })
      } else {
        const r = await axios.post(`${API}/api/magaza/urunler`, payload, { withCredentials: true })
        hedefId = r.data.id
      }
      if (bekleyenGorseller.length > 0) {
        for (const g of bekleyenGorseller) {
          try {
            const fd = new FormData()
            fd.append('gorsel', g.file)
            await axios.post(
              `${API}/api/magaza/urunler/${hedefId}/gorsel`,
              fd,
              { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
            )
            URL.revokeObjectURL(g.previewUrl)
          } catch {}
        }
        setBekleyenGorseller([])
      }
      setBasari(true)
      setTimeout(() => navigate('/admin/urunler'), 1500)
    } catch (e) {
      alert(e.response?.data?.hata || 'Kayıt başarısız')
    }
    setKaydediliyor(false)
  }

  const Card = ({ icon: Icon, title, gold, badge, children }) => (
    <div className="bg-[#0d1322] border border-[#1a2744] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${gold ? 'bg-yellow-500/15' : 'bg-[#003d99]/30'}`}>
          <Icon size={16} className={gold ? 'text-yellow-400' : 'text-[#4d8aff]'} />
        </div>
        <span className="text-white font-bold text-base">{title}</span>
        {badge && <span className="ml-auto text-xs font-bold bg-green-500/15 text-green-400 px-2.5 py-1 rounded-full border border-green-500/25">{badge}</span>}
      </div>
      {children}
    </div>
  )

  const Label = ({ children, req }) => (
    <label className="block text-xs font-bold text-[#6a7ea0] mb-1.5 uppercase tracking-wide">
      {children}{req && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )

  const Input = ({ value, onChange, placeholder, type = 'text', prefix, suffix, small }) => (
    <div className={`flex items-stretch border border-[#1a2744] rounded-xl overflow-hidden focus-within:border-[#0052CC] bg-[#121929] ${small ? 'h-10' : 'h-12'}`}>
      {prefix && <span className="flex items-center px-3 bg-[#1a2744] text-[#6a7ea0] text-sm font-semibold border-r border-[#1a2744]">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onWheel={e => e.currentTarget.blur()}
        className="flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder-[#3a4a60]"
      />
      {suffix && <span className="flex items-center px-3 bg-[#1a2744] text-[#6a7ea0] text-sm font-semibold border-l border-[#1a2744]">{suffix}</span>}
    </div>
  )

  const Select = ({ value, onChange, children, disabled }) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full h-10 bg-[#121929] border border-[#1a2744] rounded-xl px-3 text-sm text-white outline-none focus:border-[#0052CC] disabled:opacity-40"
    >
      {children}
    </select>
  )

  return (
    <div className="max-w-6xl">
      {/* Topbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/admin/urunler')} className="text-[#6a7ea0] hover:text-white text-sm flex items-center gap-1 mb-1">
            <ChevronLeft size={14} /> Ürünler
          </button>
          <h1 className="text-2xl font-bold text-white">{duzenlemeId ? 'Ürün Düzenle' : 'Ürün Ekle'}</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/admin/urunler')} className="px-4 py-2 border border-[#1a2744] text-[#6a7ea0] hover:text-white rounded-xl text-sm font-semibold transition-colors">
            Vazgeç
          </button>
          <button
            onClick={kaydet}
            disabled={kaydediliyor || basari}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${
              basari ? 'bg-green-600 text-white' : 'bg-[#0052CC] hover:bg-[#003d99] text-white shadow-blue-900/50'
            } disabled:opacity-70`}
          >
            {basari ? <><Check size={15} /> Kaydedildi</> : kaydediliyor ? 'Kaydediliyor...' : <><Check size={15} /> Kaydet</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5 items-start">
        {/* Sol */}
        <div className="space-y-5">

          <Card icon={Package} title="Genel Bilgiler">
            <div className="space-y-4">
              <div>
                <Label req>Ürün Adı</Label>
                <Input value={form.ad} onChange={v => set('ad', v)} placeholder="ör. Bosch GSB 18V Akülü Matkap" />
              </div>
              <div>
                <Label>Açıklama</Label>
                <textarea
                  value={form.aciklama}
                  onChange={e => set('aciklama', e.target.value)}
                  rows={3}
                  placeholder="Ürün detayları..."
                  className="w-full bg-[#121929] border border-[#1a2744] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#0052CC] placeholder-[#3a4a60] resize-none"
                />
              </div>
            </div>
          </Card>

          <Card icon={Image} title="Ürün Görselleri">
            <input
              ref={gorselRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={e => gorselYukle(e.target.files)}
            />
            {(gorseller.length > 0 || bekleyenGorseller.length > 0) && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {gorseller.map(g => (
                  <div key={g.id} className="relative group rounded-lg overflow-hidden border border-[#1a2744] aspect-square bg-[#121929]">
                    <img src={`${API}/uploads/${g.yol}`} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => gorselSil(g.id, false)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full hidden group-hover:flex items-center justify-center"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
                {bekleyenGorseller.map(g => (
                  <div key={g.tempId} className="relative group rounded-lg overflow-hidden border border-[#0052CC]/60 aspect-square bg-[#121929]">
                    <img src={g.previewUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-[#0052CC]/80 text-white text-[8px] font-bold text-center py-0.5">bekliyor</div>
                    <button
                      onClick={() => gorselSil(g.tempId, true)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full hidden group-hover:flex items-center justify-center"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              onClick={() => gorselRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); gorselYukle(e.dataTransfer.files) }}
              className="border-2 border-dashed border-[#1a2744] hover:border-[#0052CC] rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              <div className="w-11 h-11 bg-[#003d99]/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Image size={20} className={`text-[#4d8aff] ${gorselYukleniyor ? 'animate-pulse' : ''}`} />
              </div>
              <p className="text-sm font-semibold text-white mb-1">
                {gorselYukleniyor ? 'Yükleniyor...' : 'Dosya seç ya da sürükle'}
              </p>
              <p className="text-xs text-[#6a7ea0]">
                {!duzenlemeId
                  ? bekleyenGorseller.length > 0
                    ? `${bekleyenGorseller.length} resim seçildi — kaydet ile yüklenecek`
                    : 'Resimleri seçin, kaydet butonuyla yüklenecek'
                  : 'PNG, JPG, WEBP · en fazla 5 MB'}
              </p>
            </div>
          </Card>

          <Card icon={DollarSign} title="Fiyatlandırma" gold badge="Otomatik TL çevrimi">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label req>Dolar Fiyatı (USD)</Label>
                  <Input value={form.usd} onChange={v => set('usd', v)} prefix="$" type="number" placeholder="0.00" />
                </div>
                <div>
                  <Label>Güncel Kur (USD/TRY)</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input value={form.kur} onChange={v => set('kur', v)} prefix="₺" type="number" placeholder="0.00" small />
                    </div>
                    <button
                      onClick={kurYenile}
                      className="w-10 h-10 flex items-center justify-center border border-[#1a2744] bg-[#121929] hover:border-[#0052CC] rounded-xl transition-colors flex-shrink-0"
                    >
                      <RefreshCw size={14} className={`text-[#6a7ea0] ${kurYukleniyor ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {kurZaman !== '—' && <p className="text-xs text-[#6a7ea0] mt-1">{kurZaman} güncellendi · ₺{form.kur}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Kâr Marjı</Label>
                  <Input value={form.marj} onChange={v => set('marj', v)} suffix="%" type="number" small />
                </div>
                <div>
                  <Label>Kargo Ücreti</Label>
                  <Input value={form.kargo} onChange={v => set('kargo', v)} prefix="₺" type="number" small />
                </div>
                <div>
                  <Label>KDV (%20)</Label>
                  <div className="flex border border-[#1a2744] rounded-xl overflow-hidden h-10">
                    {['Dahil', 'Hariç'].map(l => (
                      <button
                        key={l}
                        onClick={() => set('kdvDahil', l === 'Dahil')}
                        className={`flex-1 text-sm font-bold transition-colors ${
                          form.kdvDahil === (l === 'Dahil')
                            ? 'bg-[#0052CC] text-white'
                            : 'bg-[#121929] text-[#6a7ea0] hover:text-white'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Döküm */}
              <div className="border border-[#003d99]/40 bg-[#001533] rounded-xl overflow-hidden mt-2">
                <div className="px-4 py-3 space-y-2">
                  {[
                    [`Dolar karşılığı (${form.usd || 0} $ × ${form.kur})`, base],
                    [`Kâr marjı (%${form.marj})`, marjTL],
                    ['Kargo ücreti', kargoTL],
                    ['KDV (%20)', kdvTL],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-[#6a7ea0]">{label}</span>
                      <span className="font-semibold text-white">{fmt(val)}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gradient-to-r from-[#0052CC] to-[#1a66ff] px-4 py-4 flex justify-between items-center">
                  <div>
                    <p className="text-white/70 text-xs font-semibold">SATIŞ FİYATI</p>
                    <p className="text-white/50 text-xs">Müşteriye gösterilen TL fiyatı</p>
                  </div>
                  <span className="text-white text-2xl font-black">{fmt(tl)}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card icon={BarChart2} title="Stok Bilgileri">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Stok Kodu (SKU)</Label>
                <Input value={form.sku} onChange={v => set('sku', v)} placeholder="BSH-GSB18V" small />
              </div>
              <div>
                <Label>Barkod</Label>
                <Input value={form.barkod} onChange={v => set('barkod', v)} placeholder="8694407142017" small />
              </div>
              <div>
                <Label>Stok Adedi</Label>
                <Input value={form.stok} onChange={v => set('stok', v)} type="number" placeholder="0" small />
              </div>
            </div>
          </Card>
        </div>

        {/* Sağ */}
        <div className="space-y-4">

          {/* Özet */}
          <div className="bg-[#0d1322] border border-[#1a2744] rounded-2xl p-5">
            <p className="text-xs font-bold text-[#6a7ea0] uppercase tracking-wide mb-3">ÖZET</p>
            {[
              ['Alış (USD)', `$${parseFloat(form.usd || 0).toFixed(2)}`, 'text-[#4d8aff]'],
              ['Satış (TL)', fmt(tl), 'text-white'],
              ['Kullanılan kur', `₺${form.kur}`, 'text-white'],
              ['Birim kâr', fmt(Math.max(0, tl - base - kargoTL)), 'text-green-400'],
            ].map(([l, v, c]) => (
              <div key={l} className="flex justify-between items-center py-2 border-b border-[#1a2744] last:border-0">
                <span className="text-xs text-[#6a7ea0] font-medium">{l}</span>
                <span className={`text-sm font-bold ${c}`}>{v}</span>
              </div>
            ))}
          </div>

          {/* Durum */}
          <div className="bg-[#0d1322] border border-[#1a2744] rounded-2xl p-5">
            <p className="text-xs font-bold text-[#6a7ea0] uppercase tracking-wide mb-3">DURUMU</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{form.aktif ? 'Aktif' : 'Pasif'}</p>
                <p className="text-xs text-[#6a7ea0]">{form.aktif ? 'Ürün vitrinde yayında' : 'Ürün gizli'}</p>
              </div>
              <button
                onClick={() => set('aktif', !form.aktif)}
                className={`w-12 h-6 rounded-full relative transition-colors ${form.aktif ? 'bg-green-500' : 'bg-[#1a2744]'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${form.aktif ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Marka */}
          <div className="bg-[#0d1322] border border-[#1a2744] rounded-2xl p-5">
            <p className="text-xs font-bold text-[#6a7ea0] uppercase tracking-wide mb-3">MARKA</p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-[#6a7ea0]">Marka seçin</span>
              <button onClick={() => setMarkaAc(v => !v)} className="text-xs font-bold text-[#4d8aff] hover:underline flex items-center gap-1">
                <Plus size={11} /> Yeni
              </button>
            </div>
            <Select value={form.markaId} onChange={v => { set('markaId', v); set('modelId', '') }}>
              <option value="">— Marka seçin —</option>
              {markalar.map(m => <option key={m.id} value={m.id}>{m.ad}</option>)}
            </Select>
            {markaAc && (
              <div className="flex gap-2 mt-2">
                <input
                  value={yeniMarka}
                  onChange={e => setYeniMarka(e.target.value)}
                  placeholder="Yeni marka adı"
                  className="flex-1 h-8 bg-[#121929] border border-[#1a2744] rounded-lg px-2.5 text-xs text-white outline-none focus:border-[#0052CC]"
                />
                <button onClick={markaEkle} className="px-3 h-8 bg-[#0052CC] text-white text-xs font-bold rounded-lg">Ekle</button>
              </div>
            )}
          </div>

          {/* Model */}
          <div className="bg-[#0d1322] border border-[#1a2744] rounded-2xl p-5">
            <p className="text-xs font-bold text-[#6a7ea0] uppercase tracking-wide mb-3">MODEL</p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-[#6a7ea0]">Model seçin</span>
              <button
                onClick={() => form.markaId && setModelAc(v => !v)}
                disabled={!form.markaId}
                className="text-xs font-bold text-[#4d8aff] hover:underline flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={11} /> Yeni
              </button>
            </div>
            <Select value={form.modelId} onChange={v => set('modelId', v)} disabled={!form.markaId}>
              <option value="">{form.markaId ? '— Model seçin —' : 'Önce marka seçin'}</option>
              {modeller.map(m => <option key={m.id} value={m.id}>{m.ad}</option>)}
            </Select>
            {!form.markaId && <p className="text-xs text-red-400 mt-1.5">Önce bir marka seçin</p>}
            {modelAc && form.markaId && (
              <div className="flex gap-2 mt-2">
                <input
                  value={yeniModel}
                  onChange={e => setYeniModel(e.target.value)}
                  placeholder="Yeni model adı"
                  className="flex-1 h-8 bg-[#121929] border border-[#1a2744] rounded-lg px-2.5 text-xs text-white outline-none focus:border-[#0052CC]"
                />
                <button onClick={modelEkle} className="px-3 h-8 bg-[#0052CC] text-white text-xs font-bold rounded-lg">Ekle</button>
              </div>
            )}
          </div>

          {/* Kategori */}
          <div className="bg-[#0d1322] border border-[#1a2744] rounded-2xl p-5">
            <p className="text-xs font-bold text-[#6a7ea0] uppercase tracking-wide mb-3">KATEGORİ</p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-[#6a7ea0]">Kategori seçin</span>
              <button onClick={() => setKategoriAc(v => !v)} className="text-xs font-bold text-[#4d8aff] hover:underline flex items-center gap-1">
                <Plus size={11} /> Yeni
              </button>
            </div>
            <Select value={form.kategori} onChange={v => set('kategori', v)}>
              <option value="">— Kategori seçin —</option>
              {['Elektrikli El Aletleri', 'Akülü Aletler', 'Ölçüm Cihazları', 'Kesme Ekipmanları', 'Koruyucu Ekipmanlar', 'Tamir Malzemeleri'].map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
              {form.kategori && !['Elektrikli El Aletleri', 'Akülü Aletler', 'Ölçüm Cihazları', 'Kesme Ekipmanları', 'Koruyucu Ekipmanlar', 'Tamir Malzemeleri'].includes(form.kategori) && (
                <option value={form.kategori}>{form.kategori}</option>
              )}
            </Select>
            {kategoriAc && (
              <div className="flex gap-2 mt-2">
                <input
                  value={yeniKategori}
                  onChange={e => setYeniKategori(e.target.value)}
                  placeholder="Yeni kategori adı"
                  onKeyDown={e => e.key === 'Enter' && kategoriEkle()}
                  className="flex-1 h-8 bg-[#121929] border border-[#1a2744] rounded-lg px-2.5 text-xs text-white outline-none focus:border-[#0052CC]"
                />
                <button onClick={kategoriEkle} className="px-3 h-8 bg-[#0052CC] text-white text-xs font-bold rounded-lg">Ekle</button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
