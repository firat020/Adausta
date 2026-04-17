import { useState, useEffect } from 'react'
import { ClipboardList, Phone, MapPin, Calendar, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { ustaPanelIsTalepleri, ustaPanelTalepGuncelle } from '../../api'

const DURUM_RENK = {
  bekliyor:   'bg-yellow-100 text-yellow-700 border-yellow-300',
  kabul:      'bg-blue-100 text-blue-700 border-blue-300',
  tamamlandi: 'bg-green-100 text-green-700 border-green-300',
  red:        'bg-red-100 text-red-700 border-red-300',
}
const DURUM_LABEL = {
  bekliyor: 'Bekliyor', kabul: 'Kabul Edildi',
  tamamlandi: 'Tamamlandı', red: 'Reddedildi'
}

const FILTRELER = [
  { val: 'hepsi',      label: 'Tümü' },
  { val: 'bekliyor',   label: 'Bekleyen' },
  { val: 'kabul',      label: 'Kabul' },
  { val: 'tamamlandi', label: 'Tamamlanan' },
  { val: 'red',        label: 'Reddedilen' },
]

function TalepKart({ talep, onGuncelle }) {
  const [acik, setAcik] = useState(false)
  const [not, setNot] = useState(talep.usta_notu || '')
  const [yukleniyor, setYukleniyor] = useState(false)

  const durumGuncelle = async (yeniDurum) => {
    setYukleniyor(true)
    try {
      await ustaPanelTalepGuncelle(talep.id, { durum: yeniDurum, usta_notu: not })
      onGuncelle()
    } finally {
      setYukleniyor(false)
    }
  }

  const notKaydet = async () => {
    setYukleniyor(true)
    try {
      await ustaPanelTalepGuncelle(talep.id, { usta_notu: not })
      onGuncelle()
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Kart başlığı */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setAcik(!acik)}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <ClipboardList size={18} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">{talep.baslik}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Phone size={11} /> {talep.musteri_telefon}</span>
              <span>{talep.olusturma}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${DURUM_RENK[talep.durum]}`}>
            {DURUM_LABEL[talep.durum]}
          </span>
          {acik ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {/* Detay (açılır) */}
      {acik && (
        <div className="px-5 pb-5 border-t border-gray-100 space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Müşteri bilgileri */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Müşteri</h4>
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <p className="text-sm font-semibold text-gray-800">{talep.musteri_ad}</p>
                <a href={`tel:${talep.musteri_telefon}`}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium">
                  <Phone size={13} /> {talep.musteri_telefon}
                </a>
                {talep.musteri_adres && (
                  <p className="flex items-start gap-1.5 text-sm text-gray-500">
                    <MapPin size={13} className="mt-0.5 shrink-0" /> {talep.musteri_adres}
                  </p>
                )}
              </div>
            </div>

            {/* Talep detayı */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Talep Detayı</h4>
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                {talep.aciklama && (
                  <p className="text-sm text-gray-700 leading-relaxed">{talep.aciklama}</p>
                )}
                {talep.tercih_tarih && (
                  <p className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Calendar size={13} /> Tercih: {talep.tercih_tarih}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Usta notu */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-2">
              <MessageSquare size={12} /> Notunuz
            </label>
            <textarea
              value={not}
              onChange={e => setNot(e.target.value)}
              placeholder="Müşteriye özel notunuzu buraya yazın..."
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Aksiyon butonları */}
          <div className="flex flex-wrap gap-2">
            {talep.durum === 'bekliyor' && (
              <>
                <button
                  disabled={yukleniyor}
                  onClick={() => durumGuncelle('kabul')}
                  className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition"
                >
                  Kabul Et
                </button>
                <button
                  disabled={yukleniyor}
                  onClick={() => durumGuncelle('red')}
                  className="flex-1 min-w-[120px] bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-bold px-4 py-2.5 rounded-xl transition"
                >
                  Reddet
                </button>
              </>
            )}
            {talep.durum === 'kabul' && (
              <button
                disabled={yukleniyor}
                onClick={() => durumGuncelle('tamamlandi')}
                className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition"
              >
                Tamamlandı Olarak İşaretle
              </button>
            )}
            <button
              disabled={yukleniyor}
              onClick={notKaydet}
              className="px-4 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 text-sm font-medium rounded-xl transition"
            >
              Notu Kaydet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UstaPanelIsTalepleri() {
  const [talepler, setTalepler] = useState([])
  const [filtre, setFiltre] = useState('hepsi')
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = () => {
    setYukleniyor(true)
    ustaPanelIsTalepleri({ durum: filtre })
      .then(r => setTalepler(r.data.talepler))
      .finally(() => setYukleniyor(false))
  }

  useEffect(() => { yukle() }, [filtre])

  const bekleyenSayi = talepler.filter(t => t.durum === 'bekliyor').length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">İş Talepleri</h1>
        <p className="text-sm text-gray-500 mt-1">
          Müşterilerden gelen tüm talepler
          {bekleyenSayi > 0 && (
            <span className="ml-2 inline-flex items-center bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-300">
              {bekleyenSayi} bekliyor
            </span>
          )}
        </p>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-2">
        {FILTRELER.map(f => (
          <button
            key={f.val}
            onClick={() => setFiltre(f.val)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              filtre === f.val
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {yukleniyor ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : talepler.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Bu filtrede talep bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-3">
          {talepler.map(t => (
            <TalepKart key={t.id} talep={t} onGuncelle={yukle} />
          ))}
        </div>
      )}
    </div>
  )
}
