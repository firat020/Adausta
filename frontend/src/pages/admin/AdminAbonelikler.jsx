import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { AlertCircle, Plus, X, MessageCircle, RefreshCw, Wallet } from 'lucide-react'

import API from '../../config.js'

const durumRenk = {
  aktif: 'bg-green-100 text-green-700',
  askida: 'bg-orange-100 text-orange-700',
  iptal: 'bg-red-100 text-red-600',
}

export default function AdminAbonelikler() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [liste, setListe] = useState([])
  const [planlar, setPlanlar] = useState([])
  const [ustalar, setUstalar] = useState([])
  const [kategoriler, setKategoriler] = useState([])
  const [filtre, setFiltre] = useState('hepsi')
  const [planFiltre, setPlanFiltre] = useState(searchParams.get('plan_id') || '')
  const [arama, setArama] = useState('')
  const [yeniForm, setYeniForm] = useState(null)
  const [modalKategori, setModalKategori] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [waPanel, setWaPanel] = useState(false)
  const [waListe, setWaListe] = useState([])
  const [waYukleniyor, setWaYukleniyor] = useState(false)

  const yukle = () => {
    const params = { filtre, arama }
    if (planFiltre) params.plan_id = planFiltre
    return axios.get(`${API}/api/admin/abonelik-listesi`, { params, withCredentials: true })
      .then(r => setListe(r.data.abonelikler))
  }

  useEffect(() => {
    yukle()
    axios.get(`${API}/api/admin/planlar`, { withCredentials: true }).then(r => setPlanlar(r.data.planlar))
    axios.get(`${API}/api/admin/ustalar`, { withCredentials: true }).then(r => setUstalar(r.data.ustalar))
    axios.get(`${API}/api/kategoriler`).then(r => setKategoriler(r.data.kategoriler || []))
  }, [filtre, planFiltre])

  const planFiltreDegistir = (deger) => {
    setPlanFiltre(deger)
    const yeni = new URLSearchParams(searchParams)
    if (deger) yeni.set('plan_id', deger); else yeni.delete('plan_id')
    setSearchParams(yeni, { replace: true })
  }

  const seciliPlanAdi = planFiltre ? planlar.find(p => String(p.id) === String(planFiltre))?.ad : null

  const durumDegistir = async (id, durum) => {
    await axios.post(`${API}/api/admin/abonelik-listesi/${id}/durum`, { durum }, { withCredentials: true })
    yukle()
  }

  const waListeYukle = async () => {
    setWaYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/whatsapp/odemesizler`, { withCredentials: true })
      setWaListe(r.data.ustalar)
    } catch {}
    setWaYukleniyor(false)
  }

  const waPanelAc = () => {
    setWaPanel(true)
    waListeYukle()
  }

  const waGonder = (link) => { window.open(link, '_blank') }

  const waHepsineGonder = async () => {
    const linkler = waListe.filter(u => u.wa_link)
    if (!linkler.length) { alert('WhatsApp numarası olan usta yok'); return }
    const ids = linkler.map(u => u.id)
    await axios.post(`${API}/api/admin/whatsapp/bildirim-log`, { usta_idler: ids }, { withCredentials: true }).catch(() => {})
    linkler.forEach((u, i) => setTimeout(() => window.open(u.wa_link, '_blank'), i * 800))
  }

  const abonelikEkle = async (e) => {
    e.preventDefault()
    setYukleniyor(true)
    try {
      await axios.post(`${API}/api/admin/abonelik-listesi`, yeniForm, { withCredentials: true })
      setYeniForm(null)
      setModalKategori('')
      yukle()
    } catch {}
    setYukleniyor(false)
  }

  const bugun = new Date()
  const ucGunSonra = new Date(bugun.getTime() + 3 * 24 * 60 * 60 * 1000)

  const yaklasiyor = (tarihStr) => {
    if (!tarihStr) return false
    const [gun, ay, yil] = tarihStr.split(' ')[0].split('.')
    const t = new Date(`${yil}-${ay}-${gun}`)
    return t <= ucGunSonra && t >= bugun
  }

  const filtreli = arama
    ? liste.filter(a => a.usta_ad.toLowerCase().includes(arama.toLowerCase()))
    : liste

  // Modal'da kategori filtresine göre usta listesi
  const modalUstalar = modalKategori
    ? ustalar.filter(u =>
        u.kategori_id == modalKategori ||
        (u.ek_kategoriler && u.ek_kategoriler.some(k => k.id == modalKategori))
      )
    : ustalar

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Abonelik Takibi</h2>
          <p className="text-gray-500 text-sm">Usta aboneliklerini yönetin</p>
        </div>
        <div className="flex gap-2">
          <button onClick={waPanelAc}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
            <MessageCircle size={16} /> WhatsApp Bildirim
          </button>
          <button onClick={() => { setYeniForm({ usta_id: '', plan_id: '' }); setModalKategori('') }}
            className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-medium hover:bg-[#003d99] transition">
            <Plus size={16} /> Yeni Abonelik
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] w-60"
          placeholder="Usta ara..."
          value={arama}
          onChange={e => setArama(e.target.value)}
        />
        {['hepsi', 'aktif', 'askida', 'iptal'].map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition border ${filtre === f ? 'bg-[#0052CC] text-white border-[#0052CC]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0052CC]'}`}>
            {f === 'hepsi' ? 'Tümü' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <select value={planFiltre} onChange={e => planFiltreDegistir(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] bg-white">
          <option value="">Tüm planlar</option>
          {planlar.map(p => <option key={p.id} value={p.id}>{p.ad}</option>)}
        </select>
        {planFiltre && (
          <span className="inline-flex items-center gap-1.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-xs font-semibold px-3 py-1.5 rounded-lg">
            Plan: {seciliPlanAdi || '...'}
            <button onClick={() => planFiltreDegistir('')} className="hover:text-red-500"><X size={12} /></button>
          </span>
        )}
      </div>

      {/* Tablo */}
      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F9FA] border-b border-[#E0E0E0]">
              <tr>
                {['Usta', 'Plan', 'Plan Fiyatı', 'Ödenen Tutar', 'Başlangıç', 'Bitiş', 'Yenileme', 'Durum', 'İşlem'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtreli.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">Abonelik bulunamadı</td></tr>
              ) : filtreli.map(a => (
                <tr key={a.id} className={`hover:bg-gray-50 transition ${yaklasiyor(a.yenileme_tarihi) ? 'bg-yellow-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-[#1e293b]">
                    {a.usta_ad}
                    <div className="text-xs text-gray-400 font-normal">{a.usta_telefon}</div>
                    {yaklasiyor(a.yenileme_tarihi) && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-orange-600">
                        <AlertCircle size={11} /> Yenileme yaklaşıyor
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.plan_ad}</td>
                  <td className="px-4 py-3 text-gray-600">{a.plan_fiyat > 0 ? `${a.plan_fiyat} ₺` : 'Ücretsiz'}</td>
                  <td className="px-4 py-3">
                    {a.toplam_odenen > 0 ? (
                      <div>
                        <span className="font-semibold text-green-700">{a.toplam_odenen.toLocaleString('tr-TR')} ₺</span>
                        <div className="text-xs text-gray-400">
                          <Link to={`/admin/odemeler?arama=${encodeURIComponent(a.usta_ad)}`} className="hover:text-[#0052CC] hover:underline">
                            {a.odeme_sayisi} ödeme{a.son_odeme_tarihi ? ` · son ${a.son_odeme_tarihi}` : ''}
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Ödeme yok</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{a.baslangic}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{a.bitis || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{a.yenileme_tarihi || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${durumRenk[a.durum] || 'bg-gray-100 text-gray-600'}`}>
                      {a.durum}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={a.durum}
                      onChange={e => durumDegistir(a.id, e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#0052CC]"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="askida">Askıya Al</option>
                      <option value="iptal">İptal Et</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Bildirim Paneli */}
      {waPanel && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-[#1e293b]">WhatsApp Bildirim</h3>
                <p className="text-xs text-gray-500 mt-0.5">30+ gün geçmiş, ödeme yapmamış ustalar</p>
              </div>
              <div className="flex gap-2">
                <button onClick={waListeYukle} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <RefreshCw size={16} className={waYukleniyor ? 'animate-spin' : ''} />
                </button>
                <button onClick={() => setWaPanel(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-600 font-semibold">{waListe.length} usta bildirim bekliyor</span>
              <button onClick={waHepsineGonder} disabled={!waListe.filter(u => u.wa_link).length}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                <MessageCircle size={14} /> Hepsine Gönder
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {waYukleniyor ? (
                <div className="text-center py-8 text-gray-400">Yükleniyor...</div>
              ) : waListe.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Ödeme bekleyen usta yok</div>
              ) : waListe.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1e293b] text-sm">{u.ad}</p>
                    <p className="text-xs text-gray-500">{u.kategori} · {u.sehir} · {u.gun} gün önce kayıt</p>
                    <p className="text-xs text-gray-400">{u.telefon}{u.whatsapp && u.whatsapp !== u.telefon ? ` · WA: ${u.whatsapp}` : ''}</p>
                  </div>
                  {u.wa_link ? (
                    <button onClick={() => waGonder(u.wa_link)}
                      className="shrink-0 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 flex items-center gap-1">
                      <MessageCircle size={12} /> WhatsApp
                    </button>
                  ) : (
                    <span className="text-xs text-red-400 shrink-0">WA yok</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Yeni Abonelik Modal */}
      {yeniForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-[#1e293b]">Yeni Abonelik</h3>
              <button onClick={() => setYeniForm(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={abonelikEkle} className="p-6 space-y-4">
              {/* Kategori filtresi */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Kategoriye Göre Filtrele</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC]"
                  value={modalKategori}
                  onChange={e => { setModalKategori(e.target.value); setYeniForm({ ...yeniForm, usta_id: '' }) }}
                >
                  <option value="">Tüm kategoriler</option>
                  {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                  Usta {modalKategori && <span className="text-[#0052CC] normal-case">({modalUstalar.length} usta)</span>}
                </label>
                <select required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC]"
                  value={yeniForm.usta_id} onChange={e => setYeniForm({ ...yeniForm, usta_id: parseInt(e.target.value) })}>
                  <option value="">Usta seçin</option>
                  {modalUstalar.map(u => <option key={u.id} value={u.id}>{u.ad} {u.soyad} — {u.kategori}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Plan</label>
                <select required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC]"
                  value={yeniForm.plan_id} onChange={e => setYeniForm({ ...yeniForm, plan_id: parseInt(e.target.value) })}>
                  <option value="">Plan seçin</option>
                  {planlar.map(p => <option key={p.id} value={p.id}>{p.ad} — {p.fiyat > 0 ? `${p.fiyat} ₺/${p.sure_tip}` : 'Ücretsiz'}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={yukleniyor}
                  className="flex-1 py-2.5 bg-[#0052CC] text-white rounded-lg text-sm font-medium hover:bg-[#003d99] transition disabled:opacity-50">
                  {yukleniyor ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
                <button type="button" onClick={() => setYeniForm(null)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
