import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, CheckCircle, XCircle, ExternalLink, Megaphone } from 'lucide-react'
import { adminReklamListele, adminReklamEkle, adminReklamGuncelle, adminReklamSil, kategorileriGetir } from '../../api'

const BOŞ_FORM = {
  baslik: '', aciklama: '', resim_url: '', link_url: '',
  firma_adi: '', kategori_id: '', konum: 'sol', aktif: true,
  baslangic: '', bitis: ''
}

function ReklamModal({ reklam, kategoriler, onKapat, onKaydet }) {
  const [form, setForm] = useState(reklam || BOŞ_FORM)
  const [yukleniyor, setYukleniyor] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setYukleniyor(true)
    try {
      await onKaydet(form)
      onKapat()
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{reklam ? 'Reklam Düzenle' : 'Yeni Reklam Ekle'}</h3>
          <button onClick={onKapat} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <XCircle size={18} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Başlık *</label>
              <input value={form.baslik} onChange={e => setForm(f => ({ ...f, baslik: e.target.value }))}
                required placeholder="Reklam başlığı"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Firma Adı</label>
              <input value={form.firma_adi} onChange={e => setForm(f => ({ ...f, firma_adi: e.target.value }))}
                placeholder="Firma adı"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Konum</label>
              <select value={form.konum} onChange={e => setForm(f => ({ ...f, konum: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="sol">Sol</option>
                <option value="sag">Sağ</option>
                <option value="ust">Üst</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Kategori (boş = tüm kategoriler)</label>
              <select value={form.kategori_id} onChange={e => setForm(f => ({ ...f, kategori_id: e.target.value || null }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Tüm Kategoriler</option>
                {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Reklam Görseli URL</label>
              <input value={form.resim_url} onChange={e => setForm(f => ({ ...f, resim_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Tıklanınca Gidilecek URL</label>
              <input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Açıklama</label>
              <textarea value={form.aciklama} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
                rows={2} placeholder="Kısa açıklama"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Başlangıç Tarihi</label>
              <input type="date" value={form.baslangic || ''} onChange={e => setForm(f => ({ ...f, baslangic: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Bitiş Tarihi</label>
              <input type="date" value={form.bitis || ''} onChange={e => setForm(f => ({ ...f, bitis: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.aktif} onChange={e => setForm(f => ({ ...f, aktif: e.target.checked }))}
                  className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm font-medium text-gray-700">Aktif</span>
              </label>
            </div>
          </div>
          <button type="submit" disabled={yukleniyor}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-sm">
            {yukleniyor ? 'Kaydediliyor...' : reklam ? 'Güncelle' : 'Reklam Ekle'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminReklamlar() {
  const [reklamlar, setReklamlar] = useState([])
  const [kategoriler, setKategoriler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [modal, setModal] = useState(null) // null | 'yeni' | reklam objesi

  const yukle = () => {
    setYukleniyor(true)
    Promise.all([adminReklamListele(), kategorileriGetir()])
      .then(([r, k]) => {
        setReklamlar(r.data.reklamlar)
        setKategoriler(k.data.kategoriler || [])
      })
      .finally(() => setYukleniyor(false))
  }

  useEffect(() => { yukle() }, [])

  const handleKaydet = async (form) => {
    if (modal === 'yeni') {
      await adminReklamEkle(form)
    } else {
      await adminReklamGuncelle(modal.id, form)
    }
    yukle()
  }

  const handleSil = async (id) => {
    if (!window.confirm('Bu reklamı silmek istediğinize emin misiniz?')) return
    await adminReklamSil(id)
    yukle()
  }

  const toplamTiklanma = reklamlar.reduce((s, r) => s + (r.tiklanma || 0), 0)
  const toplamGoruntulenme = reklamlar.reduce((s, r) => s + (r.goruntuleme || 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">Reklam Yönetimi</h1>
          <p className="text-sm text-[#6a7ea0] mt-0.5">Kategori sayfası reklamlarını yönet</p>
        </div>
        <button onClick={() => setModal('yeni')}
          className="flex items-center gap-2 bg-[#003d99] hover:bg-[#0052CC] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition border border-[#0052CC]">
          <Plus size={16} /> Yeni Reklam
        </button>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Toplam Reklam', val: reklamlar.length, renk: 'text-blue-400' },
          { label: 'Toplam Tıklanma', val: toplamTiklanma, renk: 'text-green-400' },
          { label: 'Toplam Görüntülenme', val: toplamGoruntulenme, renk: 'text-purple-400' },
        ].map(({ label, val, renk }) => (
          <div key={label} className="bg-[#0d1322] border border-[#1a2744] rounded-2xl p-4 text-center">
            <p className={`text-2xl font-extrabold ${renk}`}>{val}</p>
            <p className="text-xs text-[#6a7ea0] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tablo */}
      {yukleniyor ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
        </div>
      ) : reklamlar.length === 0 ? (
        <div className="bg-[#0d1322] border border-[#1a2744] rounded-2xl p-12 text-center">
          <Megaphone size={36} className="text-[#1a2744] mx-auto mb-3" />
          <p className="text-[#6a7ea0]">Henüz reklam yok</p>
          <button onClick={() => setModal('yeni')} className="mt-4 text-sm text-blue-400 hover:underline">
            İlk reklamı ekle
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reklamlar.map(r => (
            <div key={r.id} className="bg-[#0d1322] border border-[#1a2744] rounded-2xl p-4 flex items-center gap-4">
              {/* Görsel */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#121929] shrink-0">
                {r.resim_url
                  ? <img src={r.resim_url} alt={r.baslik} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Megaphone size={20} className="text-[#6a7ea0]" /></div>
                }
              </div>

              {/* Bilgiler */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white truncate">{r.baslik}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                    r.aktif ? 'text-green-400 bg-green-400/10 border-green-400/30' : 'text-gray-500 bg-gray-500/10 border-gray-500/30'
                  }`}>
                    {r.aktif ? 'Aktif' : 'Pasif'}
                  </span>
                  <span className="text-xs text-[#6a7ea0] bg-[#121929] px-2 py-0.5 rounded-full border border-[#1a2744] capitalize">
                    {r.konum}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#6a7ea0]">
                  <span>{r.firma_adi || '—'}</span>
                  <span>·</span>
                  <span>{r.kategori_ad}</span>
                  <span>·</span>
                  <span>{r.tiklanma} tıklanma</span>
                  <span>·</span>
                  <span>{r.goruntuleme} görüntülenme</span>
                </div>
                {r.link_url && (
                  <a href={r.link_url} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-0.5 mt-1">
                    <ExternalLink size={10} /> {r.link_url.substring(0, 40)}...
                  </a>
                )}
              </div>

              {/* Aksiyon */}
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setModal(r)}
                  className="p-2 text-[#6a7ea0] hover:text-white hover:bg-[#121929] rounded-xl transition">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => handleSil(r.id)}
                  className="p-2 text-[#6a7ea0] hover:text-red-400 hover:bg-red-400/10 rounded-xl transition">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ReklamModal
          reklam={modal === 'yeni' ? null : modal}
          kategoriler={kategoriler}
          onKapat={() => setModal(null)}
          onKaydet={handleKaydet}
        />
      )}
    </div>
  )
}
