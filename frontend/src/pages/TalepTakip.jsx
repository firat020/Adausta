import { useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { MessageCircle, ChevronDown, ChevronUp, Users } from 'lucide-react'
import API from '../config.js'
import { musteriTalepMesajlari, musteriTalepMesajGonder } from '../api'
import TalepMesajThread from '../components/TalepMesajThread'

const DURUM_RENK = {
  bekliyor:   'bg-yellow-100 text-yellow-700',
  kabul:      'bg-blue-100 text-blue-700',
  tamamlandi: 'bg-green-100 text-green-700',
  red:        'bg-red-100 text-red-600',
}
const DURUM_LABEL = {
  bekliyor: 'Bekliyor', kabul: 'Kabul Edildi',
  tamamlandi: 'Tamamlandı', red: 'Reddedildi'
}

/** Faz 3 Görev 12 — bir talebin mesajlaşma aç/kapa bölümü (misafir, telefon ile yetkili). */
function MesajBolumu({ talepId, telefon }) {
  const { t } = useTranslation()
  const [acik, setAcik] = useState(false)
  const [mesajlar, setMesajlar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(false)
  const [gonderiliyor, setGonderiliyor] = useState(false)

  const acKapa = () => {
    const yeni = !acik
    setAcik(yeni)
    if (yeni) {
      setYukleniyor(true)
      musteriTalepMesajlari(talepId, telefon)
        .then(r => setMesajlar(r.data.mesajlar))
        .finally(() => setYukleniyor(false))
    }
  }

  const gonder = async (icerik) => {
    setGonderiliyor(true)
    try {
      const r = await musteriTalepMesajGonder(talepId, icerik, telefon)
      setMesajlar(l => [...l, r.data.kayit])
    } finally {
      setGonderiliyor(false)
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={acKapa}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold border transition"
        style={acik
          ? { background: '#F1F5F9', color: '#64748b', borderColor: '#E2E8F0' }
          : { background: '#EFF6FF', color: '#0052CC', borderColor: '#DBEAFE' }}
      >
        <MessageCircle size={15} /> {acik ? t('talepTakip.mesajlasKapat') : t('talepTakip.mesajlasAc')}
      </button>
      {acik && (
        <div className="mt-2">
          <TalepMesajThread
            mesajlar={mesajlar}
            yukleniyor={yukleniyor}
            gonderiliyor={gonderiliyor}
            onGonder={gonder}
            kendiTaraf="musteri"
            bosMetin={t('talepTakip.mesajYok')}
            placeholder={t('talepTakip.mesajYaz')}
          />
        </div>
      )}
    </div>
  )
}

/** Tekil (grup_id boş) talep kartı — geriye dönük uyumlu eski görünüm. */
function TekilTalepKart({ t: talep, telefon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-bold text-[#1e293b]">{talep.baslik}</p>
          <p className="text-xs text-gray-400 mt-0.5">{talep.olusturma}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${DURUM_RENK[talep.durum] || 'bg-gray-100 text-gray-600'}`}>
          {DURUM_LABEL[talep.durum] || talep.durum}
        </span>
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <p><span className="font-semibold text-gray-500">Usta:</span> {talep.usta_ad}</p>
        {talep.aciklama && <p className="text-gray-500 text-xs">{talep.aciklama}</p>}
        {talep.usta_notu && (
          <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
            Usta notu: {talep.usta_notu}
          </div>
        )}
      </div>
      <MesajBolumu talepId={talep.id} telefon={telefon} />
    </div>
  )
}

/** Faz 3 Görev 13 — toplu talep (grup_id dolu): N ustaya giden talebi tek kart altında grupla. */
function GrupluTalepKart({ grupId, talepler, telefon }) {
  const { t } = useTranslation()
  const [acik, setAcik] = useState(true)
  const ilk = talepler[0]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-5 cursor-pointer" onClick={() => setAcik(p => !p)}>
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#EFF6FF' }}>
            <Users size={16} style={{ color: '#0052CC' }} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[#1e293b]">{ilk.baslik}</p>
            <p className="text-xs text-blue-600 font-semibold mt-0.5">{t('talepTakip.grupBaslik', { sayi: talepler.length })}</p>
            <p className="text-xs text-gray-400 mt-0.5">{ilk.olusturma}</p>
          </div>
        </div>
        {acik ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
      </div>

      {acik && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {talepler.map(talep => (
            <div key={talep.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{talep.usta_ad}</p>
                  {talep.usta_notu && <p className="text-xs text-blue-600 mt-0.5">{talep.usta_notu}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {talep.mesaj_okunmamis > 0 && (
                    <span className="flex items-center gap-1 text-[11px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                      <MessageCircle size={9} /> {talep.mesaj_okunmamis}
                    </span>
                  )}
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${DURUM_RENK[talep.durum] || 'bg-gray-100 text-gray-600'}`}>
                    {DURUM_LABEL[talep.durum] || talep.durum}
                  </span>
                </div>
              </div>
              <MesajBolumu talepId={talep.id} telefon={telefon} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TalepTakip() {
  const { t } = useTranslation()
  const [telefon, setTelefon] = useState('')
  const [sorgulananTelefon, setSorgulananTelefon] = useState('')
  const [talepler, setTalepler] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const ara = async (e) => {
    e.preventDefault()
    if (!telefon.trim()) return
    setYukleniyor(true)
    setHata('')
    setTalepler(null)
    try {
      const r = await axios.get(`${API}/api/musteri/talep-takip`, { params: { telefon: telefon.trim() } })
      setTalepler(r.data.talepler)
      setSorgulananTelefon(telefon.trim())
      if (!r.data.talepler.length) setHata('Bu numara ile kayıtlı talep bulunamadı.')
    } catch (e) {
      setHata(e.response?.data?.hata || 'Bir hata oluştu.')
    }
    setYukleniyor(false)
  }

  // grup_id dolu olanları grupla, boş olanları tekil göster (geriye dönük uyumlu)
  const tekilTalepler = (talepler || []).filter(x => !x.grup_id)
  const gruplar = {}
  for (const x of (talepler || [])) {
    if (x.grup_id) {
      if (!gruplar[x.grup_id]) gruplar[x.grup_id] = []
      gruplar[x.grup_id].push(x)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-extrabold text-[#1e293b] mb-1">İş Talebi Takip</h1>
        <p className="text-gray-500 text-sm mb-8">Telefon numaranızla gönderdiğiniz talepleri takip edin.</p>

        <form onSubmit={ara} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon Numaranız</label>
          <div className="flex gap-3">
            <input
              type="tel"
              value={telefon}
              onChange={e => setTelefon(e.target.value)}
              placeholder="+90 548 000 00 00"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0052CC]"
            />
            <button
              type="submit"
              disabled={yukleniyor || !telefon.trim()}
              className="px-6 py-3 bg-[#0052CC] text-white rounded-xl text-sm font-semibold hover:bg-[#003d99] disabled:opacity-50 transition"
            >
              {yukleniyor ? 'Aranıyor...' : 'Sorgula'}
            </button>
          </div>
        </form>

        {hata && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {hata}
          </div>
        )}

        {talepler && talepler.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">{talepler.length} talep bulundu</p>

            {Object.entries(gruplar).map(([grupId, grupTalepler]) => (
              <GrupluTalepKart key={grupId} grupId={grupId} talepler={grupTalepler} telefon={sorgulananTelefon} />
            ))}

            {tekilTalepler.map(talep => (
              <TekilTalepKart key={talep.id} t={talep} telefon={sorgulananTelefon} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
