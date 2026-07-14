import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { Search, CheckCircle, Clock, XCircle, AlertCircle, FileText, Store, RefreshCw, ChevronRight } from 'lucide-react'
import API from '../../config.js'

const DURUM_KONFIG = {
  draft:                        { label: 'Taslak',                   renk: 'gray',   bg: 'bg-gray-100',   text: 'text-gray-600',   ikon: Clock },
  submitted:                    { label: 'Gönderildi',               renk: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700',   ikon: Clock },
  under_review:                 { label: 'İnceleniyor',              renk: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700', ikon: RefreshCw },
  additional_document_required: { label: 'Ek Belge Gerekli',         renk: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', ikon: AlertCircle },
  approved:                     { label: 'Onaylandı',                renk: 'green',  bg: 'bg-green-100',  text: 'text-green-700',  ikon: CheckCircle },
  rejected:                     { label: 'Reddedildi',               renk: 'red',    bg: 'bg-red-100',    text: 'text-red-700',    ikon: XCircle },
  suspended:                    { label: 'Askıya Alındı',            renk: 'red',    bg: 'bg-red-100',    text: 'text-red-700',    ikon: XCircle },
}

const BELGE_DURUM_KONFIG = {
  pending:  { label: 'Beklemede', bg: 'bg-gray-100',   text: 'text-gray-600' },
  approved: { label: 'Onaylandı', bg: 'bg-green-100',  text: 'text-green-700' },
  rejected: { label: 'Reddedildi',bg: 'bg-red-100',    text: 'text-red-600' },
}

const ZAMAN_CIZGISI = [
  { durum: 'submitted',    label: 'Başvuru Gönderildi' },
  { durum: 'under_review', label: 'İnceleme Başladı' },
  { durum: 'approved',     label: 'Onaylandı' },
]

function DurumRozeti({ durum }) {
  const k = DURUM_KONFIG[durum] || DURUM_KONFIG.draft
  const Ikon = k.ikon
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${k.bg} ${k.text}`}>
      <Ikon size={14} /> {k.label}
    </span>
  )
}

function BelgeDurumu({ durum }) {
  const k = BELGE_DURUM_KONFIG[durum] || BELGE_DURUM_KONFIG.pending
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${k.bg} ${k.text}`}>{k.label}</span>
  )
}

function ZamanCizgisi({ mevcutDurum }) {
  const simdikiIdx = ZAMAN_CIZGISI.findIndex(a => a.durum === mevcutDurum)
  const reddedildi = mevcutDurum === 'rejected' || mevcutDurum === 'suspended'

  return (
    <div className="flex items-start gap-0 mt-2">
      {ZAMAN_CIZGISI.map((a, i) => {
        const gecti = i <= simdikiIdx && !reddedildi
        const aktif = i === simdikiIdx && !reddedildi
        return (
          <div key={a.durum} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                gecti ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
              }`}>
                {gecti ? <CheckCircle size={14} className="text-white" /> : <div className={`w-2.5 h-2.5 rounded-full ${aktif ? 'bg-blue-400' : 'bg-gray-300'}`} />}
              </div>
              <p className={`text-xs mt-1.5 text-center font-semibold ${gecti ? 'text-blue-700' : 'text-gray-400'} w-20`}>{a.label}</p>
            </div>
            {i < ZAMAN_CIZGISI.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 mx-1 ${i < simdikiIdx && !reddedildi ? 'bg-blue-500' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function SaticiBasvuruDurum() {
  const location = useLocation()
  const navigate = useNavigate()

  const [basvuruId, setBasvuruId] = useState(location.state?.basvuru_id || '')
  const [aramaEmail, setAramaEmail] = useState('')
  const [aramaNo, setAramaNo] = useState('')
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  useEffect(() => {
    if (location.state?.basvuru_id) {
      yukle()
    }
  }, [])

  const yukle = async () => {
    setYukleniyor(true)
    setHata('')
    try {
      const r = await axios.get(`${API}/api/satici/basvurum`, { withCredentials: true })
      setVeri(r.data)
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setHata('Başvuru durumunu görmek için giriş yapmanız gerekiyor.')
      } else {
        setHata(err.response?.data?.hata || 'Başvuru bulunamadı.')
      }
      setVeri(null)
    }
    setYukleniyor(false)
  }

  const sorgu = async (e) => {
    e.preventDefault()
    yukle()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Store size={20} className="text-blue-600" />
        <h1 className="text-lg font-black text-gray-900">Başvuru Durumu</h1>
      </div>

      {!veri && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-1">Başvurunuzu Sorgulayın</h2>
          <p className="text-sm text-gray-500 mb-5">Giriş yaparak başvurunuzun güncel durumunu görüntüleyin.</p>
          <form onSubmit={sorgu} className="space-y-3">
            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              {yukleniyor
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Yükleniyor...</>
                : <><Search size={16} /> Başvurumu Göster</>
              }
            </button>
          </form>
          {hata && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-4 text-sm text-red-700">
              <AlertCircle size={15} />
              {hata}
              {(hata.includes('giriş') || hata.includes('401')) && (
                <Link to="/giris" className="ml-auto text-blue-600 font-bold underline text-xs">Giriş Yap</Link>
              )}
            </div>
          )}
        </div>
      )}

      {veri && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Başvuru No</p>
                <p className="font-black text-gray-900 text-lg">#{veri.id || veri.basvuru_id}</p>
                <p className="text-sm text-gray-500 mt-0.5">{veri.ticari_unvan || veri.magaza_adi}</p>
              </div>
              <DurumRozeti durum={veri.durum} />
            </div>

            <ZamanCizgisi mevcutDurum={veri.durum} />

            {veri.red_nedeni && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-4">
                <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700">Red Nedeni</p>
                  <p className="text-sm text-red-600 mt-0.5">{veri.red_nedeni}</p>
                </div>
              </div>
            )}

            {veri.inceleme_notu && (
              <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mt-4">
                <AlertCircle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-orange-700">İnceleme Notu</p>
                  <p className="text-sm text-orange-600 mt-0.5">{veri.inceleme_notu}</p>
                </div>
              </div>
            )}
          </div>

          {veri.belgeler?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" /> Belgeler
              </h2>
              <div className="space-y-2.5">
                {veri.belgeler.map((b, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{b.tur_label || b.tur}</span>
                      {b.belge_no && <span className="text-xs text-gray-400">#{b.belge_no}</span>}
                    </div>
                    <BelgeDurumu durum={b.durum || 'pending'} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {veri.durum === 'additional_document_required' && (
              <button
                onClick={() => navigate('/satici-basvuru/basvur')}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors"
              >
                <FileText size={16} /> Belge Ekle
              </button>
            )}
            {veri.durum === 'approved' && (
              <button
                onClick={() => navigate('/satici/panel')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors"
              >
                <Store size={16} /> Satıcı Panelinize Git <ChevronRight size={16} />
              </button>
            )}
            <button
              onClick={yukle}
              disabled={yukleniyor}
              className="flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={15} className={yukleniyor ? 'animate-spin' : ''} /> Yenile
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
