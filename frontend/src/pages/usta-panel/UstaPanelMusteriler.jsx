import { useState, useEffect } from 'react'
import { Users, Phone, MapPin, ClipboardList, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import { ustaPanelMusteriler } from '../../api'

const DURUM_RENK = {
  bekliyor:   'bg-yellow-100 text-yellow-700',
  kabul:      'bg-blue-100 text-blue-700',
  tamamlandi: 'bg-green-100 text-green-700',
  red:        'bg-red-100 text-red-700',
}
const DURUM_LABEL = {
  bekliyor: 'Bekliyor', kabul: 'Kabul',
  tamamlandi: 'Tamamlandı', red: 'Reddedildi'
}

function MusteriKart({ musteri }) {
  const [acik, setAcik] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setAcik(!acik)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">
              {musteri.ad.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900">{musteri.ad}</p>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Phone size={11} />{musteri.telefon}</span>
              {musteri.adres && (
                <span className="flex items-center gap-1 truncate max-w-[150px]">
                  <MapPin size={11} />{musteri.adres}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-2">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800">{musteri.toplam_talep} talep</p>
            <p className="text-xs text-green-600 font-medium">{musteri.tamamlandi} tamamlandı</p>
          </div>
          {acik ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {acik && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">İlk Talep</p>
              <p className="font-semibold text-gray-700">
                {new Date(musteri.ilk_talep).toLocaleDateString('tr-TR')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Son Talep</p>
              <p className="font-semibold text-gray-700">
                {new Date(musteri.son_talep).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <ClipboardList size={12} /> İş Geçmişi
            </h4>
            <div className="space-y-2">
              {musteri.talepler.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.baslik}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.olusturma}</p>
                    {t.musteri_adres && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {t.musteri_adres}
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 ml-2 text-xs font-semibold px-2.5 py-1 rounded-lg ${DURUM_RENK[t.durum]}`}>
                    {DURUM_LABEL[t.durum]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UstaPanelMusteriler() {
  const [musteriler, setMusteriler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [arama, setArama] = useState('')

  useEffect(() => {
    ustaPanelMusteriler()
      .then(r => setMusteriler(r.data.musteriler))
      .finally(() => setYukleniyor(false))
  }, [])

  const filtreliMusteriler = musteriler.filter(m =>
    m.ad.toLowerCase().includes(arama.toLowerCase()) ||
    m.telefon.includes(arama)
  )

  const toplamTamamlandi = musteriler.reduce((s, m) => s + m.tamamlandi, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Müşterilerim</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sizinle iletişime geçmiş tüm müşteriler
        </p>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-extrabold text-blue-600">{musteriler.length}</p>
          <p className="text-sm text-gray-500 mt-1">Toplam Müşteri</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-extrabold text-green-600">{toplamTamamlandi}</p>
          <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
            <CheckCircle size={14} /> Tamamlanan İş
          </p>
        </div>
      </div>

      {/* Arama */}
      <div className="relative">
        <input
          value={arama}
          onChange={e => setArama(e.target.value)}
          placeholder="İsim veya telefon ara..."
          className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
        />
      </div>

      {yukleniyor ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filtreliMusteriler.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <Users size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {arama ? 'Arama sonucu bulunamadı' : 'Henüz müşteri yok'}
          </p>
          {!arama && (
            <p className="text-gray-400 text-sm mt-1">
              Müşteriler iş talebi gönderdikçe burada görünecek
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtreliMusteriler.map((m, i) => (
            <MusteriKart key={i} musteri={m} />
          ))}
        </div>
      )}
    </div>
  )
}
