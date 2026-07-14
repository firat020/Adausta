import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Search, ShieldCheck, Star, Store, ArrowRight } from 'lucide-react'
import API from '../config.js'

export default function MagazaSaticilar() {
  const [magazalar, setMagazalar] = useState([])
  const [total, setTotal] = useState(0)
  const [sayfa, setSayfa] = useState(1)
  const [arama, setArama] = useState('')
  const [aramaInput, setAramaInput] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    setYukleniyor(true)
    axios.get(`${API}/api/magaza/public/saticilar`, { params: { arama, sayfa } })
      .then(r => {
        setMagazalar(r.data.magazalar || [])
        setTotal(r.data.total || 0)
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [arama, sayfa])

  const aramayiUygula = () => {
    setArama(aramaInput)
    setSayfa(1)
  }

  const sayfaSayisi = Math.ceil(total / 20)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tüm Satıcılar</h1>
          <p className="text-sm text-gray-500 mt-1">{total} onaylı satıcı</p>
        </div>
        <div className="flex gap-2">
          <input
            value={aramaInput}
            onChange={e => setAramaInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && aramayiUygula()}
            placeholder="Satıcı ara..."
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 w-56"
          />
          <button
            onClick={aramayiUygula}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Search size={16} />
          </button>
        </div>
      </div>

      {yukleniyor ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : magazalar.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Store size={40} className="mx-auto mb-3 opacity-30" />
          <p>Henüz kayıtlı satıcı bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {magazalar.map(m => (
            <Link
              key={m.id}
              to={`/magaza/satici/${m.slug}`}
              className="bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all overflow-hidden group"
            >
              <div
                className="h-28 bg-gradient-to-r from-blue-50 to-indigo-50 relative"
                style={m.kapak_gorsel ? { backgroundImage: `url(/uploads/${m.kapak_gorsel})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
              >
                {m.slug === 'adausta-resmi-magaza' && (
                  <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Resmî Mağaza
                  </span>
                )}
                <div className="absolute -bottom-5 left-4">
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-white shadow-sm overflow-hidden flex items-center justify-center">
                    {m.logo
                      ? <img src={`/uploads/${m.logo}`} alt={m.magaza_adi} className="w-full h-full object-cover" />
                      : <Store size={18} className="text-blue-400" />
                    }
                  </div>
                </div>
              </div>

              <div className="pt-7 px-4 pb-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-700 transition-colors leading-tight">{m.magaza_adi}</h3>
                  <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-medium flex-shrink-0">
                    <ShieldCheck size={11} /> Doğrulanmış
                  </span>
                </div>

                {m.aciklama && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{m.aciklama}</p>
                )}

                {m.puan > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-500 mb-3">
                    <Star size={11} fill="#f59e0b" />
                    <span className="font-medium">{m.puan.toFixed(1)}</span>
                    <span className="text-gray-400">({m.yorum_sayisi} değerlendirme)</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-2">
                  Mağazayı Gez <ArrowRight size={11} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {sayfaSayisi > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: sayfaSayisi }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setSayfa(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === sayfa ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
