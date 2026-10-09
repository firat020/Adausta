import { useState, useEffect, useRef } from 'react'
import { FileCheck2, Upload, Trash2, Clock, CheckCircle2, XCircle, GraduationCap, Info, FileText } from 'lucide-react'
import { ustaPanelBelgeler, ustaPanelBelgeYukle, ustaPanelBelgeSil, ustaPanelSertifikalarGetir, ustaPanelSertifikaEkle, ustaPanelSertifikaSil } from '../../api'
import API from '../../config.js'

const TUR_ETIKET = {
  kimlik: 'Kimlik Belgesi',
  ustalik_belgesi: 'Ustalık Belgesi',
  diger: 'Diğer',
}

const DURUM_STIL = {
  bekliyor: { icon: Clock, renk: 'text-yellow-600 bg-yellow-50 border-yellow-200', etiket: 'Onay Bekliyor' },
  onaylandi: { icon: CheckCircle2, renk: 'text-green-600 bg-green-50 border-green-200', etiket: 'Onaylandı' },
  reddedildi: { icon: XCircle, renk: 'text-red-600 bg-red-50 border-red-200', etiket: 'Reddedildi' },
}

export default function UstaPanelBelgeler() {
  const [belgeler, setBelgeler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [tur, setTur] = useState('kimlik')
  const [yukluyor, setYukluyor] = useState(false)
  const [hata, setHata] = useState('')
  const dosyaRef = useRef(null)

  // Public Sertifikalarım — Faz 2 Görev 8. UstaBelge (yukarıdaki, GİZLİ/admin onaylı kimlik
  // doğrulama) ile KARIŞTIRILMAMALI: bu alan ustanın kendi isteğiyle public profilde göstermek
  // istediği sertifika/diploma görselleridir, admin onayı gerekmez, her zaman görünür.
  const [sertifikalar, setSertifikalar] = useState([])
  const [sertifikaYukleniyor, setSertifikaYukleniyor] = useState(true)
  const [sertifikaForm, setSertifikaForm] = useState({ baslik: '', aciklama: '' })
  const [sertifikaDosya, setSertifikaDosya] = useState(null)
  const [sertifikaYukluyor, setSertifikaYukluyor] = useState(false)
  const [sertifikaHata, setSertifikaHata] = useState('')
  const sertifikaDosyaRef = useRef(null)

  const yukle = () => {
    ustaPanelBelgeler()
      .then(r => setBelgeler(r.data.belgeler))
      .finally(() => setYukleniyor(false))
  }

  const sertifikalariYukle = () => {
    ustaPanelSertifikalarGetir()
      .then(r => setSertifikalar(r.data.sertifikalar || []))
      .finally(() => setSertifikaYukleniyor(false))
  }

  useEffect(() => { yukle(); sertifikalariYukle() }, [])

  const sertifikaEkle = async (e) => {
    e.preventDefault()
    if (!sertifikaForm.baslik.trim() || !sertifikaDosya) return
    setSertifikaHata('')
    setSertifikaYukluyor(true)
    try {
      const fd = new FormData()
      fd.append('baslik', sertifikaForm.baslik.trim())
      fd.append('aciklama', sertifikaForm.aciklama.trim())
      fd.append('dosya', sertifikaDosya)
      await ustaPanelSertifikaEkle(fd)
      setSertifikaForm({ baslik: '', aciklama: '' })
      setSertifikaDosya(null)
      if (sertifikaDosyaRef.current) sertifikaDosyaRef.current.value = ''
      sertifikalariYukle()
    } catch (err) {
      setSertifikaHata(err.response?.data?.hata || 'Sertifika eklenemedi')
    }
    setSertifikaYukluyor(false)
  }

  const sertifikaSilTikla = async (id) => {
    if (!confirm('Bu sertifikayı silmek istiyor musunuz?')) return
    try {
      await ustaPanelSertifikaSil(id)
      setSertifikalar(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      alert(err.response?.data?.hata || 'Silinemedi')
    }
  }

  const dosyaSecildi = async (e) => {
    const dosya = e.target.files?.[0]
    if (!dosya) return
    setHata('')
    setYukluyor(true)
    const form = new FormData()
    form.append('dosya', dosya)
    form.append('tur', tur)
    try {
      await ustaPanelBelgeYukle(form)
      yukle()
    } catch (err) {
      setHata(err.response?.data?.hata || 'Belge yüklenemedi')
    }
    setYukluyor(false)
    if (dosyaRef.current) dosyaRef.current.value = ''
  }

  const sil = async (id) => {
    if (!confirm('Bu belgeyi silmek istiyor musunuz?')) return
    try {
      await ustaPanelBelgeSil(id)
      yukle()
    } catch (err) {
      alert(err.response?.data?.hata || 'Silinemedi')
    }
  }

  if (yukleniyor) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Belgelerim</h1>
        <p className="text-sm text-gray-500 mt-1">Kimlik ve ustalık belgenizi yükleyerek profilinizi doğrulatın</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Belge Türü</label>
            <select
              value={tur}
              onChange={e => setTur(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="kimlik">Kimlik Belgesi</option>
              <option value="ustalik_belgesi">Ustalık Belgesi</option>
              <option value="diger">Diğer</option>
            </select>
          </div>
          <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors">
            <Upload size={16} />
            {yukluyor ? 'Yükleniyor...' : 'Dosya Seç'}
            <input ref={dosyaRef} type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden" onChange={dosyaSecildi} disabled={yukluyor} />
          </label>
        </div>
        {hata && <p className="text-xs text-red-600 mt-2">{hata}</p>}
        <p className="text-xs text-gray-400 mt-2">PNG, JPG veya PDF · Onaylanan belgeler profilinizde "Doğrulanmış Usta" rozeti kazandırır</p>
      </div>

      {belgeler.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <FileCheck2 size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Henüz belge yüklemediniz</p>
        </div>
      ) : (
        <div className="space-y-3">
          {belgeler.map(b => {
            const stil = DURUM_STIL[b.durum] || DURUM_STIL.bekliyor
            const Icon = stil.icon
            return (
              <div key={b.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileCheck2 size={18} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{TUR_ETIKET[b.tur] || b.tur}</p>
                    <p className="text-xs text-gray-400">{b.olusturma}</p>
                    {b.durum === 'reddedildi' && b.admin_notu && (
                      <p className="text-xs text-red-500 mt-1">Not: {b.admin_notu}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${stil.renk}`}>
                    <Icon size={12} /> {stil.etiket}
                  </span>
                  {b.durum !== 'onaylandi' && (
                    <button onClick={() => sil(b.id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Public Sertifikalarım — Faz 2 Görev 8. KYC belgelerinden görsel olarak ve kavramsal
          olarak tamamen ayrı: admin onayı gerekmez, her zaman public profilde görünür. */}
      <div className="pt-4 border-t border-dashed border-gray-200">
        <div className="mb-1">
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <GraduationCap size={22} className="text-purple-600" /> Public Sertifikalarım
          </h1>
          <p className="text-sm text-gray-500 mt-1">Profilinizde herkese açık gösterilecek sertifika, diploma veya yeterlilik belgeleri</p>
        </div>

        <div className="bg-purple-50 border border-purple-100 text-purple-700 text-xs px-4 py-3 rounded-xl flex items-start gap-2 mb-4 mt-3">
          <Info size={14} className="shrink-0 mt-0.5" />
          Bu alan platform tarafından doğrulanmamıştır; yukarıdaki kimlik/ustalık belgelerinden farklı olarak admin onayı gerektirmez ve eklediğiniz anda herkese görünür olur.
        </div>

        <form onSubmit={sertifikaEkle} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Başlık *</label>
              <input value={sertifikaForm.baslik} onChange={e => setSertifikaForm(p => ({ ...p, baslik: e.target.value }))}
                placeholder="Örn: Elektrik Tesisatçılığı Yeterlilik Belgesi" maxLength={150}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Açıklama (opsiyonel)</label>
              <input value={sertifikaForm.aciklama} onChange={e => setSertifikaForm(p => ({ ...p, aciklama: e.target.value }))}
                placeholder="Kısa açıklama"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 text-sm font-semibold cursor-pointer hover:border-purple-400 hover:text-purple-600 transition-colors">
              <Upload size={16} />
              {sertifikaDosya ? sertifikaDosya.name : 'Dosya Seç (png, jpg, pdf) *'}
              <input ref={sertifikaDosyaRef} type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden"
                onChange={e => setSertifikaDosya(e.target.files?.[0] || null)} />
            </label>
            <button type="submit" disabled={sertifikaYukluyor || !sertifikaForm.baslik.trim() || !sertifikaDosya}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors whitespace-nowrap">
              {sertifikaYukluyor ? 'Yükleniyor...' : 'Sertifika Ekle'}
            </button>
          </div>
          {sertifikaHata && <p className="text-xs text-red-600">{sertifikaHata}</p>}
        </form>

        {sertifikaYukleniyor ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
          </div>
        ) : sertifikalar.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 mt-4">
            <GraduationCap size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">Henüz public sertifika eklemediniz</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {sertifikalar.map(s => (
              <div key={s.id} className="relative group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-28 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {s.pdf_mi ? (
                    <FileText size={32} className="text-gray-300" />
                  ) : (
                    <img src={`${API}${s.url}`} alt={s.baslik} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-800 truncate">{s.baslik}</p>
                  {s.aciklama && <p className="text-[11px] text-gray-400 truncate">{s.aciklama}</p>}
                </div>
                <button
                  onClick={() => sertifikaSilTikla(s.id)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 hidden group-hover:flex items-center justify-center text-white"
                  title="Sil"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
