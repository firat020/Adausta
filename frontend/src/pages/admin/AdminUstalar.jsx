import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Search, Check, X, Trash2, Eye, RefreshCw, Plus, Download, Tag } from 'lucide-react'

import API from '../../config.js'

const FILTRELER = [
  { key: 'hepsi', label: 'Hepsi' },
  { key: 'bekleyen', label: 'Bekleyen' },
  { key: 'onaylandi', label: 'Onaylı' },
  { key: 'pasif', label: 'Yasaklı' },
]

function Rozet({ onaylanmis, aktif }) {
  if (!aktif) return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">Yasaklı</span>
  if (onaylanmis) return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Onaylı</span>
  return <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 font-medium">Bekliyor</span>
}

function KategoriYonetim({ ustaId, onGuncelle }) {
  const [veriler, setVeriler] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [islem, setIslem] = useState(false)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/ustalar/${ustaId}/kategoriler`, { withCredentials: true })
      setVeriler(r.data)
    } catch (e) { console.error(e) }
    setYukleniyor(false)
  }, [ustaId])

  useEffect(() => { yukle() }, [yukle])

  const ekle = async (kategoriId) => {
    setIslem(true)
    try {
      await axios.post(`${API}/api/admin/ustalar/${ustaId}/kategoriler/ekle`, { kategori_id: kategoriId }, { withCredentials: true })
      await yukle()
      onGuncelle && onGuncelle()
    } catch (e) { alert(e.response?.data?.hata || 'Hata') }
    setIslem(false)
  }

  const cikar = async (kategoriId) => {
    setIslem(true)
    try {
      await axios.post(`${API}/api/admin/ustalar/${ustaId}/kategoriler/cikar`, { kategori_id: kategoriId }, { withCredentials: true })
      await yukle()
      onGuncelle && onGuncelle()
    } catch (e) { alert(e.response?.data?.hata || 'Hata') }
    setIslem(false)
  }

  const anaYap = async (kategoriId) => {
    setIslem(true)
    try {
      await axios.post(`${API}/api/admin/ustalar/${ustaId}/kategoriler/ana`, { kategori_id: kategoriId }, { withCredentials: true })
      await yukle()
      onGuncelle && onGuncelle()
    } catch (e) { alert(e.response?.data?.hata || 'Hata') }
    setIslem(false)
  }

  if (yukleniyor) return <div className="text-xs text-gray-400 py-2">Yükleniyor...</div>
  if (!veriler) return null

  const ekKatIds = new Set(veriler.ek_kategoriler.map(k => k.id))
  const secilmemisler = veriler.tum_kategoriler.filter(k => !ekKatIds.has(k.id) && k.id !== veriler.ana_kategori_id)

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1.5">Ana Kategori</p>
        <div className="flex items-center gap-2 flex-wrap">
          {veriler.tum_kategoriler.filter(k => k.id === veriler.ana_kategori_id).map(k => (
            <span key={k.id} className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
              {k.ad}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1.5">Ek Kategoriler</p>
        {veriler.ek_kategoriler.length === 0 ? (
          <p className="text-xs text-gray-400">Ek kategori yok</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {veriler.ek_kategoriler.map(k => (
              <span key={k.id} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                {k.ad}
                <button
                  onClick={() => anaYap(k.id)}
                  disabled={islem}
                  title="Ana kategori yap"
                  className="text-blue-500 hover:text-blue-700 ml-0.5 disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  onClick={() => cikar(k.id)}
                  disabled={islem}
                  title="Kaldır"
                  className="text-red-400 hover:text-red-600 disabled:opacity-40"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {secilmemisler.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Kategori Ekle</p>
          <div className="flex flex-wrap gap-1.5">
            {secilmemisler.map(k => (
              <button
                key={k.id}
                onClick={() => ekle(k.id)}
                disabled={islem}
                className="flex items-center gap-1 px-2.5 py-1 border border-dashed border-gray-300 text-gray-500 rounded-lg text-xs hover:border-blue-400 hover:text-blue-600 transition disabled:opacity-40"
              >
                <Plus size={10} /> {k.ad}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminUstalar() {
  const [ustalar, setUstalar] = useState([])
  const [filtre, setFiltre] = useState('hepsi')
  const [arama, setArama] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [secili, setSecili] = useState([])
  const [detay, setDetay] = useState(null)
  const [kategoriAc, setKategoriAc] = useState(false)
  const [topluKatModal, setTopluKatModal] = useState(false)
  const [tumKategoriler, setTumKategoriler] = useState([])
  const [seciliKategori, setSeciliKategori] = useState('')
  const [katTip, setKatTip] = useState('ek')

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/ustalar`, { params: { filtre, arama }, withCredentials: true })
      setUstalar(r.data.ustalar)
      setSecili([])
    } catch (e) { console.error(e) }
    setYukleniyor(false)
  }, [filtre, arama])

  useEffect(() => { yukle() }, [yukle])

  const islem = async (id, tip) => {
    try {
      if (tip === 'sil') {
        if (!confirm('Bu ustayı kalıcı olarak silmek istiyor musunuz?')) return
        await axios.delete(`${API}/api/admin/ustalar/${id}`, { withCredentials: true })
      } else {
        await axios.post(`${API}/api/admin/ustalar/${id}/${tip}`, {}, { withCredentials: true })
      }
      yukle()
    } catch (e) { alert(e.response?.data?.hata || 'İşlem başarısız') }
  }

  const topluIslem = async (tip) => {
    if (!secili.length) return
    if (!confirm(`${secili.length} usta için "${tip}" yapılsın mı?`)) return
    try {
      await axios.post(`${API}/api/admin/ustalar/toplu`, { islem: tip, idler: secili }, { withCredentials: true })
      yukle()
    } catch { alert('İşlem başarısız') }
  }

  const hepsiniSec = (e) => setSecili(e.target.checked ? ustalar.map(u => u.id) : [])
  const toggleSec = (id) => setSecili(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const detayAc = (u) => { setDetay(u); setKategoriAc(false) }

  const topluKatModalAc = async () => {
    if (!secili.length) return
    if (!tumKategoriler.length) {
      const r = await axios.get(`${API}/api/kategoriler`, { withCredentials: true })
      setTumKategoriler(r.data.kategoriler || [])
    }
    setTopluKatModal(true)
  }

  const topluKategoriAta = async () => {
    if (!seciliKategori) return
    try {
      await axios.post(`${API}/api/admin/ustalar/toplu-kategori`, {
        usta_idler: secili,
        kategori_id: parseInt(seciliKategori),
        tip: katTip
      }, { withCredentials: true })
      setTopluKatModal(false)
      setSecili([])
      yukle()
    } catch (e) { alert(e.response?.data?.hata || 'Hata') }
  }

  const excelIndir = () => {
    window.open(`${API}/api/admin/export/ustalar`, '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Usta Yönetimi</h2>
          <p className="text-gray-500 text-sm">{ustalar.length} kayıt</p>
        </div>
        <div className="flex gap-2">
          <button onClick={excelIndir} className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition border border-gray-200 px-3 py-1.5 rounded-lg hover:border-green-400">
            <Download size={15} /> Excel
          </button>
          <button onClick={yukle} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052CC] transition">
            <RefreshCw size={15} /> Yenile
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1.5 flex-wrap">
          {FILTRELER.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltre(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                filtre === f.key
                  ? 'bg-[#003d99] text-white border-[#0052CC] shadow-sm'
                  : 'bg-[#F8F9FA] text-gray-600 border-[#E0E0E0] hover:border-[#0052CC] hover:text-[#0052CC]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={arama}
            onChange={e => setArama(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && yukle()}
            placeholder="Ad, soyad veya telefon..."
            className="w-full pl-9 pr-4 py-2 border border-[#C8CDD4] rounded-lg text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20 bg-[#F8F9FA]"
          />
        </div>
      </div>

      {secili.length > 0 && (
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-[#1D4ED8]">{secili.length} usta seçildi</span>
          <button onClick={() => topluIslem('onayla')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700">Toplu Onayla</button>
          <button onClick={() => topluIslem('reddet')} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600">Toplu Reddet</button>
          <button onClick={() => topluIslem('sil')} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">Toplu Sil</button>
          <button onClick={topluKatModalAc} className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700">
            <Tag size={12} /> Kategori Ata
          </button>
          <button onClick={() => setSecili([])} className="ml-auto text-[#1D4ED8] text-xs hover:underline">Seçimi Kaldır</button>
        </div>
      )}

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : ustalar.length === 0 ? (
          <div className="text-center text-gray-400 py-16 text-sm">Kayıt bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" onChange={hepsiniSec} checked={secili.length === ustalar.length && ustalar.length > 0} className="rounded border-gray-300" />
                  </th>
                  {['Ad Soyad', 'Kategori', 'Şehir', 'Telefon', 'Puan', 'Durum', 'Tarih', 'İşlem'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F8]">
                {ustalar.map(u => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={secili.includes(u.id)} onChange={() => toggleSec(u.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#1e293b]">{u.ad_soyad || `${u.ad} ${u.soyad}`}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span>{u.kategori}</span>
                      {u.ek_kategoriler && u.ek_kategoriler.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{u.ek_kategoriler.length}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.sehir || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{u.telefon}</td>
                    <td className="px-4 py-3">
                      {u.puan > 0 ? <span className="flex items-center gap-1 text-amber-600 font-semibold"><span>★</span>{u.puan}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3"><Rozet onaylanmis={u.onaylanmis} aktif={u.aktif} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.olusturma ? new Date(u.olusturma).toLocaleDateString('tr-TR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => detayAc(u)} title="Detay" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"><Eye size={14} /></button>
                        {!u.onaylanmis && u.aktif && (
                          <button onClick={() => islem(u.id, 'onayla')} title="Onayla" className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition"><Check size={14} /></button>
                        )}
                        {u.aktif && (
                          <button onClick={() => islem(u.id, 'reddet')} title="Yasakla" className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition"><X size={14} /></button>
                        )}
                        <button onClick={() => islem(u.id, 'sil')} title="Sil" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detay && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDetay(null)}>
          <div className="bg-white border border-[#C8CDD4] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#C8CDD4] sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="font-bold text-[#1e293b]">{detay.ad_soyad || `${detay.ad} ${detay.soyad}`}</h3>
              <button onClick={() => setDetay(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm text-gray-700">
              {[
                ['Telefon', detay.telefon],
                ['E-posta', detay.email],
                ['Şehir', detay.sehir],
                ['Puan', detay.puan ? `${detay.puan} / 5.0 (${detay.yorum_sayisi} yorum)` : null],
                ['Deneyim', detay.deneyim_yil ? `${detay.deneyim_yil} yıl` : null],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="font-semibold text-gray-500 w-24 shrink-0">{k}:</span>
                  <span>{v}</span>
                </div>
              ))}
              {detay.aciklama && (
                <div className="bg-[#F8F9FA] border border-[#E0E0E0] rounded-lg p-3 text-gray-600 text-xs mt-2">
                  {detay.aciklama}
                </div>
              )}

              <div className="border-t border-[#E0E0E0] pt-3">
                <button
                  onClick={() => setKategoriAc(p => !p)}
                  className="flex items-center gap-2 text-sm font-semibold text-[#0052CC] hover:underline"
                >
                  Kategori Yönetimi {kategoriAc ? '▲' : '▼'}
                </button>
                {kategoriAc && (
                  <div className="mt-3">
                    <KategoriYonetim ustaId={detay.id} onGuncelle={yukle} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 px-6 pb-5">
              {!detay.onaylanmis && detay.aktif && (
                <button onClick={() => { islem(detay.id, 'onayla'); setDetay(null) }} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700">Onayla</button>
              )}
              <button onClick={() => { islem(detay.id, 'reddet'); setDetay(null) }} className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600">Yasakla</button>
              <button onClick={() => { islem(detay.id, 'sil'); setDetay(null) }} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700">Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Toplu Kategori Atama Modal */}
      {topluKatModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-[#1e293b] mb-4">Toplu Kategori Ata ({secili.length} usta)</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Kategori</label>
                <select
                  value={seciliKategori}
                  onChange={e => setSeciliKategori(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC]"
                >
                  <option value="">Seçin</option>
                  {tumKategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Atama Tipi</label>
                <div className="flex gap-2">
                  <button onClick={() => setKatTip('ek')} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${katTip === 'ek' ? 'bg-[#0052CC] text-white border-[#0052CC]' : 'bg-white text-gray-600 border-gray-200'}`}>Ek Kategori</button>
                  <button onClick={() => setKatTip('ana')} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${katTip === 'ana' ? 'bg-[#0052CC] text-white border-[#0052CC]' : 'bg-white text-gray-600 border-gray-200'}`}>Ana Kategori Yap</button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={topluKategoriAta} disabled={!seciliKategori} className="flex-1 py-2.5 bg-[#0052CC] text-white rounded-lg text-sm font-semibold hover:bg-[#003d99] disabled:opacity-50">Ata</button>
                <button onClick={() => setTopluKatModal(false)} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
