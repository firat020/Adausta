import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import {
  Search, CheckCircle, XCircle, FileText, Download,
  AlertTriangle, Store, RefreshCw, X, Package, Edit2, Plus
} from 'lucide-react'
import API from '../../config.js'

function DurumRozet({ durum }) {
  const MAP = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Taslak' },
    submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Gönderildi' },
    under_review: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'İncelemede' },
    additional_document_required: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Ek Belge İstendi' },
    approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Onaylandı' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Reddedildi' },
  }
  const c = MAP[durum] || MAP.draft
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

function BelgeDurumRozet({ durum }) {
  const MAP = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Bekliyor' },
    approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Onaylandı' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Reddedildi' },
  }
  const c = MAP[durum] || MAP.pending
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

function Toast({ mesaj, tip, onKapat }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold transition-all ${tip === 'hata' ? 'bg-red-600' : 'bg-green-600'}`}>
      {tip === 'hata' ? <XCircle size={16} /> : <CheckCircle size={16} />}
      {mesaj}
      <button onClick={onKapat} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  )
}

function InfoRow({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="font-semibold text-gray-400 w-44 shrink-0 text-xs pt-0.5">{label}</span>
      <span className="text-gray-700 break-all">{value}</span>
    </div>
  )
}

function SekHat({ baslik }) {
  return (
    <div className="border-t border-[#E8ECF0] pt-4 mt-4 mb-2">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{baslik}</p>
    </div>
  )
}

const BELGE_TUR_ADI = {
  vergi_levhasi: 'Vergi Levhası',
  imza_sirküleri: 'İmza Sirküleri',
  imza_sirkuleri: 'İmza Sirküleri',
  ticaret_sicil: 'Ticaret Sicil Gazetesi',
  kimlik: 'Kimlik / Pasaport',
  faaliyet_belgesi: 'Faaliyet Belgesi',
  banka_dekontu: 'Banka Dekontu',
}

function BasvuruDetayModal({ basvuruId, onKapat, onYenile, showToast }) {
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [islem, setIslem] = useState({})
  const [ekBelgeAc, setEkBelgeAc] = useState(false)
  const [ekBelgeNot, setEkBelgeNot] = useState('')
  const [redAc, setRedAc] = useState(false)
  const [redNedeni, setRedNedeni] = useState('')
  const [onayDialog, setOnayDialog] = useState(false)
  const [belgeRedAc, setBelgeRedAc] = useState({})
  const [belgeRedNeden, setBelgeRedNeden] = useState({})

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/saticilar/basvuru/${basvuruId}`, { withCredentials: true })
      setVeri(r.data)
    } catch {
      showToast('Detay yüklenemedi', 'hata')
    }
    setYukleniyor(false)
  }, [basvuruId, showToast])

  useEffect(() => { yukle() }, [yukle])

  const setI = (key, val) => setIslem(p => ({ ...p, [key]: val }))

  const belgeOnayla = async (did) => {
    setI(`bo_${did}`, true)
    try {
      await axios.post(`${API}/api/admin/saticilar/basvuru/${basvuruId}/belge-onayla/${did}`, {}, { withCredentials: true })
      showToast('Belge onaylandı')
      yukle()
    } catch (e) { showToast(e.response?.data?.hata || 'Hata', 'hata') }
    setI(`bo_${did}`, false)
  }

  const belgeReddet = async (did) => {
    setI(`br_${did}`, true)
    try {
      await axios.post(`${API}/api/admin/saticilar/basvuru/${basvuruId}/belge-reddet/${did}`, { red_nedeni: belgeRedNeden[did] || '' }, { withCredentials: true })
      showToast('Belge reddedildi')
      setBelgeRedAc(p => ({ ...p, [did]: false }))
      yukle()
    } catch (e) { showToast(e.response?.data?.hata || 'Hata', 'hata') }
    setI(`br_${did}`, false)
  }

  const ekBelgeGonder = async () => {
    setI('ekBelge', true)
    try {
      await axios.post(`${API}/api/admin/saticilar/basvuru/${basvuruId}/ek-belge-iste`, { not: ekBelgeNot }, { withCredentials: true })
      showToast('Ek belge talebi gönderildi')
      setEkBelgeAc(false)
      setEkBelgeNot('')
      yukle()
      onYenile()
    } catch (e) { showToast(e.response?.data?.hata || 'Hata', 'hata') }
    setI('ekBelge', false)
  }

  const basvuruReddet = async () => {
    setI('red', true)
    try {
      await axios.post(`${API}/api/admin/saticilar/basvuru/${basvuruId}/reddet`, { red_nedeni: redNedeni }, { withCredentials: true })
      showToast('Başvuru reddedildi')
      onKapat()
      onYenile()
    } catch (e) { showToast(e.response?.data?.hata || 'Hata', 'hata') }
    setI('red', false)
  }

  const basvuruOnayla = async () => {
    setI('onayla', true)
    try {
      await axios.post(`${API}/api/admin/saticilar/basvuru/${basvuruId}/onayla`, {}, { withCredentials: true })
      showToast('Başvuru onaylandı — mağaza açıldı!')
      setOnayDialog(false)
      onKapat()
      onYenile()
    } catch (e) { showToast(e.response?.data?.hata || 'Hata', 'hata') }
    setI('onayla', false)
  }

  const canAction = veri && ['submitted', 'under_review', 'additional_document_required'].includes(veri.durum)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto" onClick={onKapat}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-[#C8CDD4] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-[#1e293b] text-base">{veri?.magaza_adi || 'Başvuru Detayı'}</h3>
            {veri && <DurumRozet durum={veri.durum} />}
          </div>
          <button onClick={onKapat} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {yukleniyor ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        ) : !veri ? (
          <div className="text-center text-gray-400 py-16 text-sm">Veri yüklenemedi</div>
        ) : (
          <div className="px-6 py-5">
            <SekHat baslik="Şirket Bilgileri" />
            <div className="space-y-2">
              <InfoRow label="Ticari Ünvan" value={veri.ticari_unvan} />
              <InfoRow label="Mağaza Adı" value={veri.magaza_adi} />
              <InfoRow label="Slug" value={veri.slug} />
              <InfoRow label="Şirket Türü" value={veri.sirket_turu} />
              <InfoRow label="Vergi No" value={veri.vergi_no} />
              <InfoRow label="Yetkili Ad Soyad" value={veri.yetkili_ad} />
              <InfoRow label="Yetkili Telefon" value={veri.yetkili_telefon} />
              <InfoRow label="Yetkili E-posta" value={veri.yetkili_email} />
              <InfoRow label="Adres" value={veri.adres} />
            </div>

            <SekHat baslik="Banka Bilgileri" />
            <div className="space-y-2">
              <InfoRow label="Hesap Sahibi" value={veri.banka_hesap_sahibi} />
              <InfoRow label="IBAN" value={veri.iban} />
            </div>

            <SekHat baslik="Mağaza" />
            {veri.aciklama && (
              <div className="bg-[#F8F9FA] border border-[#E0E0E0] rounded-lg p-3 text-sm text-gray-600 mb-3">
                {veri.aciklama}
              </div>
            )}
            {(veri.logo_url || veri.kapak_url) && (
              <div className="flex gap-4 mt-1">
                {veri.logo_url && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Logo</p>
                    <img src={veri.logo_url} alt="Logo" className="h-16 w-16 rounded-lg object-cover border border-[#E0E0E0]" />
                  </div>
                )}
                {veri.kapak_url && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Kapak</p>
                    <img src={veri.kapak_url} alt="Kapak" className="h-16 w-36 rounded-lg object-cover border border-[#E0E0E0]" />
                  </div>
                )}
              </div>
            )}

            {veri.belgeler && veri.belgeler.length > 0 && (
              <>
                <SekHat baslik="Belgeler" />
                <div className="space-y-3">
                  {veri.belgeler.map(b => (
                    <div key={b.id} className="border border-[#E0E0E0] rounded-xl p-4">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm text-[#1e293b]">{BELGE_TUR_ADI[b.tur] || b.tur}</p>
                          {b.belge_no && <p className="text-xs text-gray-400">Belge No: {b.belge_no}</p>}
                          {b.verilis_tarihi && <p className="text-xs text-gray-400">Veriliş: {new Date(b.verilis_tarihi).toLocaleDateString('tr-TR')}</p>}
                          {b.gecerlilik_tarihi && <p className="text-xs text-gray-400">Son Geçerlilik: {new Date(b.gecerlilik_tarihi).toLocaleDateString('tr-TR')}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <BelgeDurumRozet durum={b.durum} />
                          <a
                            href={`${API}/api/admin/saticilar/belge/${b.id}/indir`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition"
                          >
                            <Download size={12} /> İndir
                          </a>
                          {b.durum !== 'approved' && (
                            <button
                              onClick={() => belgeOnayla(b.id)}
                              disabled={islem[`bo_${b.id}`]}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                            >
                              <CheckCircle size={12} /> Onayla
                            </button>
                          )}
                          {b.durum !== 'rejected' && (
                            <button
                              onClick={() => setBelgeRedAc(p => ({ ...p, [b.id]: !p[b.id] }))}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition"
                            >
                              <XCircle size={12} /> Reddet
                            </button>
                          )}
                        </div>
                      </div>
                      {belgeRedAc[b.id] && (
                        <div className="flex gap-2 mt-3">
                          <input
                            value={belgeRedNeden[b.id] || ''}
                            onChange={e => setBelgeRedNeden(p => ({ ...p, [b.id]: e.target.value }))}
                            placeholder="Red nedeni (opsiyonel)"
                            className="flex-1 border border-red-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-red-400"
                          />
                          <button
                            onClick={() => belgeReddet(b.id)}
                            disabled={islem[`br_${b.id}`]}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                          >
                            {islem[`br_${b.id}`] ? '...' : 'Reddet'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {veri.durum === 'rejected' && veri.red_nedeni && (
              <>
                <SekHat baslik="Red Nedeni" />
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {veri.red_nedeni}
                </div>
              </>
            )}

            {veri.durum === 'approved' && (
              <div className="mt-5 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-4">
                <CheckCircle size={18} className="text-green-600 shrink-0" />
                <span className="text-sm font-semibold text-green-700">Mağaza Açıldı ✓</span>
              </div>
            )}

            {canAction && (
              <div className="border-t border-[#E8ECF0] pt-5 mt-5 space-y-4">
                <div>
                  <button
                    onClick={() => setEkBelgeAc(p => !p)}
                    className="flex items-center gap-2 text-sm font-semibold text-orange-600 border border-orange-200 px-4 py-2 rounded-lg hover:bg-orange-50 transition"
                  >
                    <AlertTriangle size={14} /> Ek Belge İste
                  </button>
                  {ekBelgeAc && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={ekBelgeNot}
                        onChange={e => setEkBelgeNot(e.target.value)}
                        rows={3}
                        placeholder="Hangi belgelerin isteneceğini açıklayın..."
                        className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
                      />
                      <button
                        onClick={ekBelgeGonder}
                        disabled={islem.ekBelge}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition"
                      >
                        {islem.ekBelge ? 'Gönderiliyor...' : 'Gönder'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px] space-y-2">
                    <button
                      onClick={() => setRedAc(p => !p)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition"
                    >
                      <XCircle size={15} /> Başvuruyu Reddet
                    </button>
                    {redAc && (
                      <div className="space-y-2">
                        <textarea
                          value={redNedeni}
                          onChange={e => setRedNedeni(e.target.value)}
                          rows={3}
                          placeholder="Red nedeni..."
                          className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none"
                        />
                        <button
                          onClick={basvuruReddet}
                          disabled={islem.red}
                          className="w-full py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
                        >
                          {islem.red ? 'Reddediliyor...' : 'Reddet'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-[160px] space-y-2">
                    {onayDialog ? (
                      <>
                        <p className="text-xs text-center text-gray-500 px-2">Başvuru onaylanacak ve mağaza açılacak. Emin misiniz?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={basvuruOnayla}
                            disabled={islem.onayla}
                            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition"
                          >
                            {islem.onayla ? 'Onaylanıyor...' : 'Evet, Onayla'}
                          </button>
                          <button onClick={() => setOnayDialog(false)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                            İptal
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => setOnayDialog(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition"
                      >
                        <CheckCircle size={15} /> Onayla
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MagazaDuzenleModal({ magaza, onKapat, onYenile, showToast }) {
  const [form, setForm] = useState({
    magaza_adi: magaza?.magaza_adi || '',
    ticari_unvan: magaza?.ticari_unvan || '',
    slug: magaza?.slug || '',
    aciklama: magaza?.aciklama || '',
    vergi_no: magaza?.vergi_no || '',
    iban: magaza?.iban || '',
    banka_hesap_sahibi: magaza?.banka_hesap_sahibi || '',
    komisyon_orani: magaza?.komisyon_orani ?? 15,
    aktif: magaza?.aktif ?? true,
    askida: magaza?.askida ?? false,
  })
  const [yukleniyor, setYukleniyor] = useState(false)

  const kaydet = async () => {
    if (!form.magaza_adi.trim() || !form.slug.trim()) {
      showToast('Mağaza adı ve slug zorunludur', 'hata'); return
    }
    setYukleniyor(true)
    try {
      await axios.put(`${API}/api/admin/saticilar/magaza/${magaza.id}`, form, { withCredentials: true })
      showToast('Mağaza güncellendi')
      onYenile()
      onKapat()
    } catch (e) { showToast(e.response?.data?.hata || 'Hata', 'hata') }
    setYukleniyor(false)
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const inp = 'w-full border border-[#C8CDD4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] bg-white'
  const lbl = 'text-xs font-semibold text-gray-500 block mb-1'

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={onKapat}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C8CDD4]">
          <h3 className="font-bold text-[#1e293b]">Mağaza Düzenle — {magaza.magaza_adi}</h3>
          <button onClick={onKapat} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Mağaza Adı *</label>
              <input className={inp} value={form.magaza_adi} onChange={e => f('magaza_adi', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Slug * (URL)</label>
              <input className={inp} value={form.slug} onChange={e => f('slug', e.target.value.toLowerCase().replace(/\s/g, '-'))} />
            </div>
          </div>
          <div>
            <label className={lbl}>Ticari Ünvan</label>
            <input className={inp} value={form.ticari_unvan} onChange={e => f('ticari_unvan', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Açıklama</label>
            <textarea className={`${inp} resize-none`} rows={3} value={form.aciklama} onChange={e => f('aciklama', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Vergi No</label>
              <input className={inp} value={form.vergi_no} onChange={e => f('vergi_no', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Komisyon % </label>
              <input className={inp} type="number" min="0" max="100" step="0.1" value={form.komisyon_orani} onChange={e => f('komisyon_orani', parseFloat(e.target.value))} />
            </div>
          </div>
          <div>
            <label className={lbl}>IBAN</label>
            <input className={inp} value={form.iban} onChange={e => f('iban', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Banka Hesap Sahibi</label>
            <input className={inp} value={form.banka_hesap_sahibi} onChange={e => f('banka_hesap_sahibi', e.target.value)} />
          </div>
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.aktif} onChange={e => f('aktif', e.target.checked)} className="w-4 h-4 accent-[#0052CC]" />
              <span className="text-sm font-semibold text-gray-700">Aktif</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.askida} onChange={e => f('askida', e.target.checked)} className="w-4 h-4 accent-orange-500" />
              <span className="text-sm font-semibold text-gray-700">Askıda</span>
            </label>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#C8CDD4] flex justify-end gap-2">
          <button onClick={onKapat} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">İptal</button>
          <button onClick={kaydet} disabled={yukleniyor}
            className="px-5 py-2 bg-[#0052CC] text-white text-sm font-semibold rounded-lg hover:bg-[#003d99] disabled:opacity-50 transition">
            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

function YeniMagazaModal({ onKapat, onYenile, showToast }) {
  const [form, setForm] = useState({ magaza_adi: '', slug: '', ticari_unvan: '', aciklama: '', komisyon_orani: 15 })
  const [yukleniyor, setYukleniyor] = useState(false)

  const olustur = async () => {
    if (!form.magaza_adi.trim() || !form.slug.trim()) {
      showToast('Mağaza adı ve slug zorunludur', 'hata'); return
    }
    setYukleniyor(true)
    try {
      await axios.post(`${API}/api/admin/saticilar/magaza`, form, { withCredentials: true })
      showToast('Mağaza oluşturuldu')
      onYenile()
      onKapat()
    } catch (e) { showToast(e.response?.data?.hata || 'Hata', 'hata') }
    setYukleniyor(false)
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const inp = 'w-full border border-[#C8CDD4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] bg-white'
  const lbl = 'text-xs font-semibold text-gray-500 block mb-1'

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onKapat}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C8CDD4]">
          <h3 className="font-bold text-[#1e293b]">Yeni Mağaza Oluştur</h3>
          <button onClick={onKapat} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={lbl}>Mağaza Adı *</label>
            <input className={inp} value={form.magaza_adi} onChange={e => { f('magaza_adi', e.target.value); f('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')) }} placeholder="MİR İLETİŞİM" />
          </div>
          <div>
            <label className={lbl}>Slug * (adausta.com/magaza/satici/slug)</label>
            <input className={inp} value={form.slug} onChange={e => f('slug', e.target.value.toLowerCase().replace(/\s/g, '-'))} placeholder="mir-iletisim" />
          </div>
          <div>
            <label className={lbl}>Ticari Ünvan</label>
            <input className={inp} value={form.ticari_unvan} onChange={e => f('ticari_unvan', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Açıklama</label>
            <textarea className={`${inp} resize-none`} rows={2} value={form.aciklama} onChange={e => f('aciklama', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Komisyon %</label>
            <input className={inp} type="number" min="0" max="100" step="0.1" value={form.komisyon_orani} onChange={e => f('komisyon_orani', parseFloat(e.target.value))} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#C8CDD4] flex justify-end gap-2">
          <button onClick={onKapat} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">İptal</button>
          <button onClick={olustur} disabled={yukleniyor}
            className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
            {yukleniyor ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  )
}

const DURUM_OPTS = [
  { value: '', label: 'Tümü' },
  { value: 'submitted', label: 'Gönderildi' },
  { value: 'under_review', label: 'İncelemede' },
  { value: 'additional_document_required', label: 'Ek Belge İstendi' },
  { value: 'approved', label: 'Onaylandı' },
  { value: 'rejected', label: 'Reddedildi' },
]

const TABS = [
  { key: 'basvurular', label: 'Başvurular', Icon: FileText },
  { key: 'aktif', label: 'Aktif Mağazalar', Icon: Store },
  { key: 'askida', label: 'Askıya Alınanlar', Icon: AlertTriangle },
  { key: 'urunler', label: 'Bekleyen Ürünler', Icon: Package },
]

export default function AdminSaticilar() {
  const [tab, setTab] = useState('basvurular')
  const [toastData, setToastData] = useState(null)

  const [basvurular, setBasvurular] = useState([])
  const [basvuruYuk, setBasvuruYuk] = useState(true)
  const [durumFiltre, setDurumFiltre] = useState('')
  const [arama, setArama] = useState('')
  const [detayId, setDetayId] = useState(null)

  const [magazalar, setMagazalar] = useState([])
  const [magazaYuk, setMagazaYuk] = useState(false)
  const [askiyaModal, setAskiyaModal] = useState(null)
  const [askiyaNeden, setAskiyaNeden] = useState('')
  const [islem, setIslem] = useState({})
  const [duzenleModal, setDuzenleModal] = useState(null)
  const [yeniMagazaModal, setYeniMagazaModal] = useState(false)

  const [bekleyenUrunler, setBekleyenUrunler] = useState([])
  const [urunYukleniyor, setUrunYukleniyor] = useState(false)
  const [urunRedAc, setUrunRedAc] = useState({})
  const [urunRedNeden, setUrunRedNeden] = useState({})
  const [urunIslem, setUrunIslem] = useState({})

  const showToast = useCallback((mesaj, tip = 'basari') => {
    setToastData({ mesaj, tip })
    setTimeout(() => setToastData(null), 4000)
  }, [])

  const basvurulariYukle = useCallback(async () => {
    setBasvuruYuk(true)
    try {
      const params = {}
      if (durumFiltre) params.durum = durumFiltre
      if (arama) params.arama = arama
      const r = await axios.get(`${API}/api/admin/saticilar/basvurular`, { params, withCredentials: true })
      setBasvurular(r.data.basvurular || r.data || [])
    } catch {
      showToast('Başvurular yüklenemedi', 'hata')
    }
    setBasvuruYuk(false)
  }, [durumFiltre, arama, showToast])

  const urunleriYukle = useCallback(async () => {
    setUrunYukleniyor(true)
    try {
      const r = await axios.get(`${API}/api/admin/saticilar/urunler/bekleyenler`, { withCredentials: true })
      setBekleyenUrunler(r.data.urunler || r.data || [])
    } catch {
      showToast('Bekleyen ürünler yüklenemedi', 'hata')
    }
    setUrunYukleniyor(false)
  }, [showToast])

  const magazalariYukle = useCallback(async (askida) => {
    setMagazaYuk(true)
    try {
      const r = await axios.get(`${API}/api/admin/saticilar/magazalar`, { params: { askida }, withCredentials: true })
      setMagazalar(r.data.magazalar || r.data || [])
    } catch {
      showToast('Mağazalar yüklenemedi', 'hata')
    }
    setMagazaYuk(false)
  }, [showToast])

  useEffect(() => {
    if (tab === 'basvurular') basvurulariYukle()
    else if (tab === 'aktif') magazalariYukle(false)
    else if (tab === 'askida') magazalariYukle(true)
    else if (tab === 'urunler') urunleriYukle()
  }, [tab])

  const yenile = () => {
    if (tab === 'basvurular') basvurulariYukle()
    else if (tab === 'aktif') magazalariYukle(false)
    else if (tab === 'askida') magazalariYukle(true)
    else if (tab === 'urunler') urunleriYukle()
  }

  const askiyaAl = async () => {
    if (!askiyaModal) return
    setIslem(p => ({ ...p, askiyaAl: true }))
    try {
      await axios.post(`${API}/api/admin/saticilar/magaza/${askiyaModal.id}/askiya-al`, { neden: askiyaNeden }, { withCredentials: true })
      showToast('Mağaza askıya alındı')
      setAskiyaModal(null)
      setAskiyaNeden('')
      magazalariYukle(false)
    } catch (e) { showToast(e.response?.data?.hata || 'Hata', 'hata') }
    setIslem(p => ({ ...p, askiyaAl: false }))
  }

  const aktifEt = async (id) => {
    setIslem(p => ({ ...p, [`ae_${id}`]: true }))
    try {
      await axios.post(`${API}/api/admin/saticilar/magaza/${id}/aktif-et`, {}, { withCredentials: true })
      showToast('Mağaza aktif edildi')
      magazalariYukle(true)
    } catch (e) { showToast(e.response?.data?.hata || 'Hata', 'hata') }
    setIslem(p => ({ ...p, [`ae_${id}`]: false }))
  }

  const urunOnayla = async (id) => {
    setUrunIslem(p => ({ ...p, [`o_${id}`]: true }))
    try {
      await axios.post(`${API}/api/admin/saticilar/urun/${id}/onayla`, {}, { withCredentials: true })
      showToast('Ürün onaylandı')
      setBekleyenUrunler(prev => prev.filter(u => u.id !== id))
    } catch (e) { showToast(e.response?.data?.hata || 'Hata', 'hata') }
    setUrunIslem(p => ({ ...p, [`o_${id}`]: false }))
  }

  const urunReddet = async (id) => {
    setUrunIslem(p => ({ ...p, [`r_${id}`]: true }))
    try {
      await axios.post(`${API}/api/admin/saticilar/urun/${id}/reddet`, { neden: urunRedNeden[id] || '' }, { withCredentials: true })
      showToast('Ürün reddedildi')
      setBekleyenUrunler(prev => prev.filter(u => u.id !== id))
    } catch (e) { showToast(e.response?.data?.hata || 'Hata', 'hata') }
    setUrunIslem(p => ({ ...p, [`r_${id}`]: false }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Satıcı Yönetimi</h2>
          <p className="text-gray-500 text-sm">Başvurular, aktif mağazalar ve satıcı işlemleri</p>
        </div>
        <button onClick={yenile} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052CC] transition">
          <RefreshCw size={15} /> Yenile
        </button>
      </div>

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-[#C8CDD4]">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition border-b-2 -mb-px ${
                tab === key
                  ? 'text-[#0052CC] border-[#0052CC] bg-[#EFF6FF]'
                  : 'text-gray-500 border-transparent hover:text-[#0052CC] hover:bg-[#F8F9FA]'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {tab === 'basvurular' && (
          <div>
            <div className="px-4 py-3 border-b border-[#C8CDD4] flex flex-wrap gap-3 items-center bg-[#FAFBFC]">
              <select
                value={durumFiltre}
                onChange={e => setDurumFiltre(e.target.value)}
                className="border border-[#C8CDD4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] bg-white min-w-[190px]"
              >
                {DURUM_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex-1 min-w-[200px] relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={arama}
                  onChange={e => setArama(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && basvurulariYukle()}
                  placeholder="Ticari unvan, mağaza adı veya e-posta..."
                  className="w-full pl-9 pr-4 py-2 border border-[#C8CDD4] rounded-lg text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20 bg-white"
                />
              </div>
              <button
                onClick={basvurulariYukle}
                className="px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-semibold hover:bg-[#003d99] transition"
              >
                Ara
              </button>
            </div>

            {basvuruYuk ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
              </div>
            ) : basvurular.length === 0 ? (
              <div className="text-center text-gray-400 py-16 text-sm">Başvuru bulunamadı</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                    <tr>
                      {['Tarih', 'Ticari Unvan', 'Mağaza Adı', 'Yetkili', 'E-posta', 'Durum', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F8]">
                    {basvurular.map(b => (
                      <tr key={b.id} className="hover:bg-[#F8FAFC] transition">
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {b.olusturma ? new Date(b.olusturma).toLocaleDateString('tr-TR') : '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#1e293b] whitespace-nowrap">{b.ticari_unvan || '—'}</td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{b.magaza_adi || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.yetkili_ad || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{b.yetkili_email || '—'}</td>
                        <td className="px-4 py-3"><DurumRozet durum={b.durum} /></td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDetayId(b.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EFF6FF] text-[#0052CC] border border-[#BFDBFE] rounded-lg text-xs font-semibold hover:bg-[#DBEAFE] transition whitespace-nowrap"
                          >
                            <FileText size={12} /> İncele
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'aktif' && (
          <div>
            <div className="px-4 py-3 border-b border-[#C8CDD4] bg-[#FAFBFC] flex justify-end">
              <button
                onClick={() => setYeniMagazaModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition"
              >
                <Plus size={14} /> Yeni Mağaza Oluştur
              </button>
            </div>
            {magazaYuk ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
              </div>
            ) : magazalar.length === 0 ? (
              <div className="text-center text-gray-400 py-16 text-sm">Aktif mağaza bulunamadı</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                    <tr>
                      {['Mağaza Adı', 'Slug', 'Ticari Unvan', 'Komisyon %', 'Ürün Sayısı', 'Durum', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F8]">
                    {magazalar.map(m => (
                      <tr key={m.id} className="hover:bg-[#F8FAFC] transition">
                        <td className="px-4 py-3 font-semibold text-[#1e293b]">{m.magaza_adi || m.ad}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{m.slug || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{m.ticari_unvan || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{m.komisyon_orani != null ? `%${m.komisyon_orani}` : '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{m.urun_sayisi ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Aktif</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setDuzenleModal(m)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EFF6FF] text-[#0052CC] border border-[#BFDBFE] rounded-lg text-xs font-semibold hover:bg-[#DBEAFE] transition whitespace-nowrap"
                            >
                              <Edit2 size={12} /> Düzenle
                            </button>
                            <button
                              onClick={() => setAskiyaModal({ id: m.id, ad: m.magaza_adi || m.ad })}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-xs font-semibold hover:bg-orange-100 transition whitespace-nowrap"
                            >
                              <AlertTriangle size={12} /> Askıya Al
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
        )}

        {tab === 'askida' && (
          <div>
            {magazaYuk ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
              </div>
            ) : magazalar.length === 0 ? (
              <div className="text-center text-gray-400 py-16 text-sm">Askıya alınmış mağaza yok</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                    <tr>
                      {['Mağaza Adı', 'Slug', 'Ticari Unvan', 'Komisyon %', 'Ürün Sayısı', 'Durum', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F8]">
                    {magazalar.map(m => (
                      <tr key={m.id} className="hover:bg-[#F8FAFC] transition">
                        <td className="px-4 py-3 font-semibold text-[#1e293b]">{m.magaza_adi || m.ad}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{m.slug || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{m.ticari_unvan || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{m.komisyon_orani != null ? `%${m.komisyon_orani}` : '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{m.urun_sayisi ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">Askıda</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setDuzenleModal(m)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EFF6FF] text-[#0052CC] border border-[#BFDBFE] rounded-lg text-xs font-semibold hover:bg-[#DBEAFE] transition whitespace-nowrap"
                            >
                              <Edit2 size={12} /> Düzenle
                            </button>
                            <button
                              onClick={() => aktifEt(m.id)}
                              disabled={islem[`ae_${m.id}`]}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 transition disabled:opacity-50 whitespace-nowrap"
                            >
                              <CheckCircle size={12} /> {islem[`ae_${m.id}`] ? '...' : 'Aktif Et'}
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
        )}

        {tab === 'urunler' && (
          <div>
            {urunYukleniyor ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
              </div>
            ) : bekleyenUrunler.length === 0 ? (
              <div className="text-center text-gray-400 py-16 text-sm">Bekleyen ürün bulunmuyor</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F8F9FA] border-b border-[#C8CDD4]">
                    <tr>
                      {['Görsel', 'Ürün Adı', 'Mağaza', 'Fiyat', 'Stok', 'Kategori', 'Eklenme Tarihi', 'Aksiyonlar'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F8]">
                    {bekleyenUrunler.map(u => (
                      <tr key={u.id} className="hover:bg-[#F8FAFC] transition align-top">
                        <td className="px-4 py-3">
                          {u.gorsel_url ? (
                            <img src={u.gorsel_url} alt={u.ad} className="w-10 h-10 rounded-lg object-cover border border-[#E0E0E0]" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package size={16} className="text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#1e293b] whitespace-nowrap max-w-[200px] truncate">{u.ad || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{u.magaza_adi || '—'}</td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{u.tl_fiyat != null ? `${u.tl_fiyat} TL` : '—'}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.stok ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.kategori || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {u.olusturma ? new Date(u.olusturma).toLocaleDateString('tr-TR') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => urunOnayla(u.id)}
                                disabled={urunIslem[`o_${u.id}`] || urunIslem[`r_${u.id}`]}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition whitespace-nowrap"
                              >
                                <CheckCircle size={12} /> {urunIslem[`o_${u.id}`] ? '...' : 'Onayla'}
                              </button>
                              <button
                                onClick={() => setUrunRedAc(p => ({ ...p, [u.id]: !p[u.id] }))}
                                disabled={urunIslem[`o_${u.id}`] || urunIslem[`r_${u.id}`]}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition whitespace-nowrap"
                              >
                                <XCircle size={12} /> Reddet
                              </button>
                            </div>
                            {urunRedAc[u.id] && (
                              <div className="flex gap-2">
                                <textarea
                                  value={urunRedNeden[u.id] || ''}
                                  onChange={e => setUrunRedNeden(p => ({ ...p, [u.id]: e.target.value }))}
                                  rows={2}
                                  placeholder="Red nedeni (opsiyonel)..."
                                  className="flex-1 border border-red-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-red-400 resize-none min-w-[140px]"
                                />
                                <button
                                  onClick={() => urunReddet(u.id)}
                                  disabled={urunIslem[`r_${u.id}`]}
                                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition self-end"
                                >
                                  {urunIslem[`r_${u.id}`] ? '...' : 'Gönder'}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {detayId && (
        <BasvuruDetayModal
          basvuruId={detayId}
          onKapat={() => setDetayId(null)}
          onYenile={basvurulariYukle}
          showToast={showToast}
        />
      )}

      {askiyaModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-[#1e293b] mb-1">Mağazayı Askıya Al</h3>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-semibold text-gray-700">"{askiyaModal.ad}"</span> mağazası askıya alınacak.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Neden (opsiyonel)</label>
                <textarea
                  value={askiyaNeden}
                  onChange={e => setAskiyaNeden(e.target.value)}
                  rows={3}
                  placeholder="Askıya alma nedeni..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC] resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={askiyaAl}
                  disabled={islem.askiyaAl}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition"
                >
                  {islem.askiyaAl ? 'İşleniyor...' : 'Askıya Al'}
                </button>
                <button
                  onClick={() => { setAskiyaModal(null); setAskiyaNeden('') }}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {duzenleModal && (
        <MagazaDuzenleModal
          magaza={duzenleModal}
          onKapat={() => setDuzenleModal(null)}
          onYenile={() => magazalariYukle(duzenleModal?.askida)}
          showToast={showToast}
        />
      )}

      {yeniMagazaModal && (
        <YeniMagazaModal
          onKapat={() => setYeniMagazaModal(false)}
          onYenile={() => magazalariYukle(false)}
          showToast={showToast}
        />
      )}

      {toastData && (
        <Toast mesaj={toastData.mesaj} tip={toastData.tip} onKapat={() => setToastData(null)} />
      )}
    </div>
  )
}
