import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, MapPin, User, Phone, Calendar, FileText, CheckCircle2, X, Send } from 'lucide-react'
import { kategorileriGetir, sehirleriGetir, topluTalepGonder } from '../api'
import SEO from '../components/SEO'

// Backend'deki musteri_panel.py -> TOPLU_TALEP_MAX_USTA ile aynı değer (sadece metin için).
const TOPLU_TALEP_MAX_USTA = 12

export default function HizmetTalepEt() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [kategoriler, setKategoriler] = useState([])
  const [sehirler, setSehirler] = useState([])
  const [kategoriArama, setKategoriArama] = useState('')
  const [secilenKategori, setSecilenKategori] = useState(null)

  const [form, setForm] = useState({
    sehir_id: '', ilce_id: '', aciklama: '', tercih_tarih: '',
    musteri_ad: '', musteri_telefon: '', musteri_adres: '',
  })

  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [hata, setHata] = useState('')
  const [sonuc, setSonuc] = useState(null) // { eslesen_usta_sayisi }

  useEffect(() => {
    kategorileriGetir().then(r => setKategoriler(r.data.kategoriler || [])).catch(() => {})
    sehirleriGetir().then(r => setSehirler(r.data.sehirler || [])).catch(() => {})
  }, [])

  const kategoriAdaylari = useMemo(() => {
    const q = kategoriArama.trim().toLocaleLowerCase('tr')
    if (!q) return []
    return kategoriler.filter(k => k.ad.toLocaleLowerCase('tr').includes(q)).slice(0, 8)
  }, [kategoriler, kategoriArama])

  const secilenSehir = sehirler.find(s => String(s.id) === String(form.sehir_id))
  const ilceler = secilenSehir?.ilceler || []

  const alanGuncelle = (alan, deger) => setForm(f => ({ ...f, [alan]: deger }))

  const gonder = async (e) => {
    e.preventDefault()
    setHata('')
    if (!secilenKategori) { setHata(t('hizmetTalepEt.formKategori')); return }
    if (!form.sehir_id) { setHata(t('hizmetTalepEt.formSehir')); return }
    setGonderiliyor(true)
    try {
      const { data } = await topluTalepGonder({
        kategori_id: secilenKategori.id,
        sehir_id: form.sehir_id,
        ilce_id: form.ilce_id || undefined,
        aciklama: form.aciklama,
        tercih_tarih: form.tercih_tarih,
        musteri_ad: form.musteri_ad,
        musteri_telefon: form.musteri_telefon,
        musteri_adres: form.musteri_adres,
      })
      setSonuc(data)
    } catch (err) {
      setHata(err.response?.data?.hata || 'Bir hata oluştu, lütfen tekrar deneyin.')
    } finally {
      setGonderiliyor(false)
    }
  }

  if (sonuc) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <SEO url="/hizmet-talep-et" />
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-200">
            <CheckCircle2 size={30} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">{t('hizmetTalepEt.basariBaslik')}</h2>
          <p className="text-sm text-gray-500">
            {t('hizmetTalepEt.basariAciklama', { sayi: sonuc.eslesen_usta_sayisi })}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/talep-takip"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition">
              {t('hizmetTalepEt.takipLink')}
            </Link>
            <Link to="/"
              className="text-gray-500 hover:text-gray-700 text-sm font-medium py-2 transition">
              {t('hizmetTalepEt.geriDon')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO url="/hizmet-talep-et" />

      {/* Üst banner */}
      <section className="py-12 px-4" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #22d3ee 100%)' }}>
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-white text-2xl sm:text-3xl font-extrabold mb-2">{t('hizmetTalepEt.baslik')}</h1>
          <p className="text-blue-50 text-sm">{t('hizmetTalepEt.aciklama', { sayi: TOPLU_TALEP_MAX_USTA })}</p>
        </div>
      </section>

      <div className="max-w-xl mx-auto px-4 -mt-6 pb-16">
        <form onSubmit={gonder} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">

          {/* Kategori arama/seçim */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t('hizmetTalepEt.formKategori')}</label>
            {secilenKategori ? (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
                <span className="text-lg">{secilenKategori.ikon || '🔧'}</span>
                <span className="flex-1 text-sm font-semibold text-blue-900">{secilenKategori.ad}</span>
                <button type="button" onClick={() => { setSecilenKategori(null); setKategoriArama('') }}
                  className="text-blue-400 hover:text-blue-700">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={kategoriArama}
                  onChange={e => setKategoriArama(e.target.value)}
                  placeholder={t('hizmetTalepEt.formKategoriPlaceholder')}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                {kategoriAdaylari.length > 0 && (
                  <div className="mt-1.5 bg-white border border-gray-100 rounded-xl shadow-sm max-h-56 overflow-y-auto divide-y divide-gray-50">
                    {kategoriAdaylari.map(k => (
                      <button key={k.id} type="button"
                        onClick={() => { setSecilenKategori(k); setKategoriArama('') }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        <span>{k.ikon || '🔧'}</span> {k.ad}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Şehir + İlçe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t('hizmetTalepEt.formSehir')}</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select value={form.sehir_id}
                  onChange={e => { alanGuncelle('sehir_id', e.target.value); alanGuncelle('ilce_id', '') }}
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none">
                  <option value="">{t('hizmetTalepEt.formSehirSec')}</option>
                  {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t('hizmetTalepEt.formIlce')}</label>
              <select value={form.ilce_id}
                onChange={e => alanGuncelle('ilce_id', e.target.value)}
                disabled={!form.sehir_id}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400 appearance-none">
                <option value="">{t('hizmetTalepEt.formIlceSec')}</option>
                {ilceler.map(i => <option key={i.id} value={i.id}>{i.ad}</option>)}
              </select>
            </div>
          </div>

          {/* Açıklama */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t('hizmetTalepEt.formAciklama')}</label>
            <textarea value={form.aciklama} onChange={e => alanGuncelle('aciklama', e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {/* Tercih tarih */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
              <Calendar size={12} /> {t('hizmetTalepEt.formTarih')}
            </label>
            <input value={form.tercih_tarih} onChange={e => alanGuncelle('tercih_tarih', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <hr className="border-gray-100" />

          {/* Ad + Telefon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t('hizmetTalepEt.formAd')}</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input required value={form.musteri_ad} onChange={e => alanGuncelle('musteri_ad', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t('hizmetTalepEt.formTelefon')}</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input required type="tel" value={form.musteri_telefon} onChange={e => alanGuncelle('musteri_telefon', e.target.value)}
                  placeholder="+90 548 000 0000"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Adres */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t('hizmetTalepEt.formAdres')}</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
              <input value={form.musteri_adres} onChange={e => alanGuncelle('musteri_adres', e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <p className="text-[11px] text-gray-400">{t('hizmetTalepEt.zorunluAlanlar')}</p>

          {hata && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
              <FileText size={15} className="shrink-0 mt-0.5" /> {hata}
            </div>
          )}

          <button type="submit" disabled={gonderiliyor}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-extrabold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2">
            {gonderiliyor ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> {t('hizmetTalepEt.gonderiliyor')}</>
            ) : (
              <><Send size={16} /> {t('hizmetTalepEt.gonderButon')}</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
