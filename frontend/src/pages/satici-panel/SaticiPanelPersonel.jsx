import { useState, useEffect } from 'react'
import axios from 'axios'
import { UserPlus, Trash2 } from 'lucide-react'
import API from '../../config.js'

const rolEtiket = {
  sahip:             'Sahip',
  urun_yetkilisi:    'Ürün Yetkilisi',
  siparis_yetkilisi: 'Sipariş Yetkilisi',
  finans_yetkilisi:  'Finans Yetkilisi',
  destek_yetkilisi:  'Destek Yetkilisi',
  yonetici:          'Yönetici',
}

const rolRenk = {
  sahip:             'bg-blue-100 text-blue-700',
  urun_yetkilisi:    'bg-purple-100 text-purple-700',
  siparis_yetkilisi: 'bg-amber-100 text-amber-700',
  finans_yetkilisi:  'bg-green-100 text-green-700',
  destek_yetkilisi:  'bg-teal-100 text-teal-700',
  yonetici:          'bg-indigo-100 text-indigo-700',
}

export default function SaticiPanelPersonel() {
  const [personel, setPersonel] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [benRol, setBenRol] = useState(null)
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('urun_yetkilisi')
  const [ekleniyor, setEkleniyor] = useState(false)
  const [hata, setHata] = useState(null)
  const [basari, setBasari] = useState(null)

  const getir = () => {
    setYukleniyor(true)
    axios.get(`${API}/api/satici-panel/personel`, { withCredentials: true })
      .then(r => {
        setPersonel(r.data.personel || [])
        setBenRol(r.data.benim_rolum || null)
        setYukleniyor(false)
      })
      .catch(() => setYukleniyor(false))
  }

  useEffect(() => { getir() }, [])

  const ekle = async (e) => {
    e.preventDefault()
    setHata(null)
    setBasari(null)
    if (!email.trim()) return
    setEkleniyor(true)
    try {
      await axios.post(`${API}/api/satici-panel/personel`, { email: email.trim(), rol }, { withCredentials: true })
      setEmail('')
      setRol('urun_yetkilisi')
      setBasari('Personel eklendi.')
      getir()
    } catch (err) {
      setHata(err.response?.data?.mesaj || 'Personel eklenemedi.')
    }
    setEkleniyor(false)
  }

  const kaldir = async (id) => {
    if (!window.confirm('Bu personeli kaldırmak istediğinize emin misiniz?')) return
    try {
      await axios.delete(`${API}/api/satici-panel/personel/${id}`, { withCredentials: true })
      getir()
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Personel</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">Personel Ekle</h2>

        {hata && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">{hata}</div>
        )}
        {basari && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm mb-4">{basari}</div>
        )}

        <form onSubmit={ekle} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="E-posta adresi"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
            required
          />
          <select
            value={rol}
            onChange={e => setRol(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] bg-white transition-colors"
          >
            <option value="urun_yetkilisi">Ürün Yetkilisi</option>
            <option value="siparis_yetkilisi">Sipariş Yetkilisi</option>
            <option value="finans_yetkilisi">Finans Yetkilisi</option>
            <option value="destek_yetkilisi">Destek Yetkilisi</option>
            <option value="yonetici">Yönetici</option>
          </select>
          <button
            type="submit"
            disabled={ekleniyor}
            className="flex items-center gap-2 bg-[#0052CC] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0047b3] transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            <UserPlus size={15} />
            {ekleniyor ? 'Ekleniyor...' : 'Ekle'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Ekip Üyeleri</h2>
        </div>

        {yukleniyor ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#0052CC]" />
          </div>
        ) : personel.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Henüz personel eklenmemiş.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {personel.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-[#0052CC] font-bold text-sm flex-shrink-0">
                    {p.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rolRenk[p.rol] ?? 'bg-gray-100 text-gray-500'}`}>
                        {rolEtiket[p.rol] ?? p.rol}
                      </span>
                      {!p.aktif && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Pasif</span>
                      )}
                    </div>
                  </div>
                </div>
                {benRol === 'sahip' && p.rol !== 'sahip' && (
                  <button
                    onClick={() => kaldir(p.id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors flex-shrink-0"
                    title="Kaldır"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
