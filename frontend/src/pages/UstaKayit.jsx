import { useState, useEffect, useRef } from 'react'
import {
  CheckCircle, User, Phone, MapPin, Briefcase, FileText,
  CreditCard, Shield, Star, Zap, Check, RefreshCw, MessageSquare, Eye, EyeOff, Lock
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { kategorileriGetir, sehirleriGetir, ustaKayit } from '../api'

// ─── DEMO: Sahte SMS kodu ─────────────────────────────────────────────────────
function smsKoduGonder(telefon) {
  console.log(`SMS kodu gönderildi: ${telefon} → 1234`)
  return Promise.resolve('1234')
}

export default function UstaKayit() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const PLANLAR = [
    {
      id: 'aylik',
      ad: t('kayit.planAylik'),
      fiyat: '9.99',
      birim: t('kayit.planAylikBirim'),
      aciklama: t('kayit.planAylikAciklama'),
      ozellikler: [t('kayit.planF1A'), t('kayit.planF2A'), t('kayit.planF3A'), t('kayit.planF4A')],
      rozet: null,
    },
    {
      id: 'yillik',
      ad: t('kayit.planYillik'),
      fiyat: '79.99',
      birim: t('kayit.planYillikBirim'),
      aylikEsit: t('kayit.planYillikIndirim'),
      aciklama: t('kayit.planYillikAciklama'),
      ozellikler: [t('kayit.planF1Y'), t('kayit.planF2Y'), t('kayit.planF3Y'), t('kayit.planF4Y')],
      rozet: t('kayit.planEnPopuler'),
    },
  ]

  const [adim, setAdim] = useState(1)
  const [secilenPlan, setSecilenPlan] = useState('yillik')

  const [telefonGirdi, setTelefonGirdi] = useState('')
  const [smsDurum, setSmsDurum] = useState('idle')
  const [smsKod, setSmsKod] = useState('')
  const [gercekKod, setGercekKod] = useState('')
  const [kodHata, setKodHata] = useState('')
  const [geriSayim, setGeriSayim] = useState(0)
  const timerRef = useRef(null)
  const girdiRef = useRef([])

  const [kategoriler, setKategoriler] = useState([])
  const [sehirler, setSehirler] = useState([])
  const [ilceler, setIlceler] = useState([])
  const [basarili, setBasarili] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const [form, setForm] = useState({
    ad: '', soyad: '', telefon: '', whatsapp: '',
    email: '', sehir_id: '', ilce_id: '',
    kategori_id: '', aciklama: '', deneyim_yil: '',
    sifre: '', sifre_tekrar: '',
  })
  const [sifreGoster, setSifreGoster] = useState(false)
  const [sifreHata, setSifreHata] = useState('')

  const [odeme, setOdeme] = useState({
    kart_ad: '', kart_no: '', son_tarih: '', cvv: '',
  })

  useEffect(() => {
    kategorileriGetir().then(r => setKategoriler(r.data.kategoriler || []))
    sehirleriGetir().then(r => setSehirler(r.data.sehirler || []))
  }, [])

  useEffect(() => {
    if (geriSayim > 0) {
      timerRef.current = setTimeout(() => setGeriSayim(g => g - 1), 1000)
    }
    return () => clearTimeout(timerRef.current)
  }, [geriSayim])

  const sehirDegisti = (sehir_id) => {
    setForm(f => ({ ...f, sehir_id, ilce_id: '' }))
    const s = sehirler.find(s => s.id === parseInt(sehir_id))
    setIlceler(s?.ilceler || [])
  }

  const smsiGonder = async () => {
    if (!telefonGirdi.trim()) return
    setKodHata('')
    setSmsDurum('gonderildi')
    setGeriSayim(60)
    setSmsKod('')
    const kod = await smsKoduGonder(telefonGirdi)
    setGercekKod(kod)
  }

  const koduDogrula = () => {
    if (smsKod === gercekKod) {
      setSmsDurum('dogrulandi')
      setKodHata('')
      setForm(f => ({ ...f, telefon: telefonGirdi }))
      setTimeout(() => setAdim(3), 600)
    } else {
      setKodHata(t('errors.kodHatali'))
    }
  }

  const handleKodInput = (val, idx) => {
    const temiz = val.replace(/\D/g, '').slice(-1)
    const arr = (smsKod + '    ').split('').slice(0, 4)
    arr[idx] = temiz
    const yeni = arr.join('').replace(/ /g, '')
    setSmsKod(yeni)
    if (temiz && idx < 3) girdiRef.current[idx + 1]?.focus()
    if (!temiz && idx > 0) girdiRef.current[idx - 1]?.focus()
  }

  const formGonder = (e) => {
    e.preventDefault()
    if (form.sifre.length < 6) {
      setSifreHata('Şifre en az 6 karakter olmalıdır')
      return
    }
    if (form.sifre !== form.sifre_tekrar) {
      setSifreHata('Şifreler eşleşmiyor')
      return
    }
    setSifreHata('')
    setAdim(2)
  }

  const odemeGonder = async (e) => {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)
    try {
      await ustaKayit({
        ...form,
        telefon: telefonGirdi,
        sehir_id: parseInt(form.sehir_id),
        ilce_id: form.ilce_id ? parseInt(form.ilce_id) : null,
        kategori_id: parseInt(form.kategori_id),
        deneyim_yil: parseInt(form.deneyim_yil) || 0,
      })
      setBasarili(true)
      setTimeout(() => navigate('/usta/panel'), 2500)
    } catch (err) {
      setHata(err.response?.data?.hata || t('errors.birHataOlustu'))
    } finally {
      setYukleniyor(false)
    }
  }

  const kartNoFormat = (val) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

  const sonTarihFormat = (val) => {
    const t = val.replace(/\D/g, '').slice(0, 4)
    return t.length >= 3 ? t.slice(0, 2) + '/' + t.slice(2) : t
  }

  const seciliPlan = PLANLAR.find(p => p.id === secilenPlan)

  // ─── Başarılı ────────────────────────────────────────────────────────────────
  if (basarili) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
        <CheckCircle size={36} className="text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Kaydınız Tamamlandı!</h2>
      <p className="text-gray-500 leading-relaxed mb-6">
        Profiliniz oluşturuldu ve kategorinize eklendi. Usta panelinize yönlendiriliyorsunuz...
      </p>
      <button onClick={() => navigate('/usta/panel')}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-colors">
        Panele Git
      </button>
    </div>
  )

  const inputCls = "w-full border border-blue-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
  const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block"

  // ─── Adım göstergesi ─────────────────────────────────────────────────────────
  const ADIMLAR = [
    { no: 1, ad: t('kayit.bilgilerAdim') },
    { no: 2, ad: t('kayit.dogrulamaAdim') },
    { no: 3, ad: t('kayit.planAdim') },
    { no: 4, ad: t('kayit.odemeAdim') },
  ]

  const AdimGostergesi = () => (
    <div className="flex items-center justify-center gap-0 mb-8">
      {ADIMLAR.map((a, i) => (
        <div key={a.no} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            adim === a.no ? 'bg-blue-600 text-white' :
            adim > a.no  ? 'bg-blue-100 text-blue-700' :
                           'bg-gray-100 text-gray-400'
          }`}>
            {adim > a.no ? <Check size={12} /> : <span>{a.no}</span>}
            {a.ad}
          </div>
          {i < ADIMLAR.length - 1 && (
            <div className={`w-6 h-0.5 ${adim > a.no ? 'bg-blue-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )

  // ─── Adım 3: Plan Seçimi ──────────────────────────────────────────────────────
  if (adim === 3) return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">{t('kayit.baslik')}</h1>
        <p className="text-gray-500 text-sm mt-2">{t('kayit.alt')}</p>
      </div>
      <AdimGostergesi />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        {PLANLAR.map(plan => (
          <div key={plan.id}
            onClick={() => setSecilenPlan(plan.id)}
            className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all ${
              secilenPlan === plan.id
                ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}>
            {plan.rozet && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                <Star size={10} className="fill-white" /> {plan.rozet}
              </div>
            )}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">{plan.ad}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{plan.aciklama}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                secilenPlan === plan.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
              }`}>
                {secilenPlan === plan.id && <Check size={11} className="text-white" />}
              </div>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-gray-900">${plan.fiyat}</span>
              <span className="text-sm text-gray-500 ml-1">{plan.birim}</span>
              {plan.aylikEsit && (
                <div className="text-xs text-blue-600 font-semibold mt-0.5">{plan.aylikEsit}</div>
              )}
            </div>
            <ul className="space-y-2">
              {plan.ozellikler.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />{o}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 mb-6 text-xs text-gray-400">
        <Shield size={13} /><span>{t('kayit.sslBadge')}</span>
      </div>
      <div className="flex items-center justify-center gap-2 mb-3 text-xs text-gray-400">
        <Shield size={13} /><span>{t('kayit.sslBadge')}</span>
      </div>
      <div className="flex gap-3">
        <button onClick={() => setAdim(2)}
          className="flex-1 border border-blue-200 text-blue-600 font-semibold py-4 rounded-xl hover:bg-blue-50 transition-colors text-sm">
          {t('kayit.geriBtn')}
        </button>
        <button onClick={() => setAdim(4)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-base transition-colors">
          {t('kayit.devam')}{seciliPlan?.fiyat} {seciliPlan?.id === 'aylik' ? t('kayit.planAylikBirim') : t('kayit.planYillikBirim')}
        </button>
      </div>
    </div>
  )

  // ─── Adım 2: Telefon Doğrulama ────────────────────────────────────────────────
  if (adim === 2) return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">{t('kayit.telefonDogrulama')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('kayit.telefonAlt')}</p>
      </div>
      <AdimGostergesi />

      <div className="bg-white border border-blue-100 shadow-sm rounded-2xl p-6">
        <div className="mb-4">
          <label className={labelCls}>+90</label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={telefonGirdi}
              onChange={e => setTelefonGirdi(e.target.value)}
              placeholder="+90 548 000 00 00"
              disabled={smsDurum === 'dogrulandi'}
              className={`${inputCls} flex-1`}
            />
            <button
              onClick={smsiGonder}
              disabled={!telefonGirdi.trim() || geriSayim > 0 || smsDurum === 'dogrulandi'}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap">
              {smsDurum === 'idle' ? (
                <><MessageSquare size={14} /> {t('kayit.kodGonder')}</>
              ) : geriSayim > 0 ? (
                <><RefreshCw size={13} className="animate-spin" /> {geriSayim}s</>
              ) : (
                <><RefreshCw size={13} /> {t('kayit.tekrar')}</>
              )}
            </button>
          </div>
        </div>

        {smsDurum !== 'idle' && (
          <div className="mb-4">
            <label className={labelCls}>{t('kayit.smsKodu')}</label>
            <div className="flex gap-3 justify-center my-4">
              {[0, 1, 2, 3].map(i => (
                <input
                  key={i}
                  ref={el => girdiRef.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={smsKod[i] || ''}
                  onChange={e => handleKodInput(e.target.value, i)}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !smsKod[i] && i > 0)
                      girdiRef.current[i - 1]?.focus()
                  }}
                  className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all ${
                    smsDurum === 'dogrulandi'
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-blue-300 focus:border-blue-600 bg-white'
                  }`}
                />
              ))}
            </div>

            {kodHata && <p className="text-red-500 text-xs text-center mb-3">{kodHata}</p>}

            {smsDurum === 'dogrulandi' ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold text-sm">
                <CheckCircle size={16} /> {t('kayit.telefonDogrulandi')}
              </div>
            ) : (
              <button
                onClick={koduDogrula}
                disabled={smsKod.length < 4}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                {t('kayit.dogrula')}
              </button>
            )}
          </div>
        )}

        <button type="button" onClick={() => setAdim(1)}
          className="w-full mt-3 text-blue-500 hover:underline text-sm text-center">
          {t('kayit.geriDon')}
        </button>
      </div>
    </div>
  )

  // ─── Adım 1: Bilgi Formu ──────────────────────────────────────────────────────
  if (adim === 1) return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">{t('kayit.profilBilgileri')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('kayit.profilAlt')}</p>
      </div>
      <AdimGostergesi />

      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 mb-6 text-sm">
        <Phone size={13} className="text-emerald-600" />
        <span className="text-emerald-700 font-medium">{telefonGirdi}</span>
        <CheckCircle size={13} className="text-emerald-500" />
        <span className="text-emerald-600 text-xs">Telefon doğrulandı</span>
      </div>

      <form onSubmit={formGonder} className="bg-white border border-blue-100 shadow-sm rounded-2xl overflow-hidden">

        {/* Kişisel */}
        <div className="p-6 border-b border-blue-50">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">{t('kayit.kisiselBilgiler')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('nav.ustalar').slice(0, 2)} *</label>
              <input type="text" required value={form.ad}
                onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                className={inputCls} placeholder={t('kayit.adPlaceholder')} />
            </div>
            <div>
              <label className={labelCls}>{t('kayit.soyadLabel')}</label>
              <input type="text" value={form.soyad}
                onChange={e => setForm(f => ({ ...f, soyad: e.target.value }))}
                className={inputCls} placeholder={t('kayit.soyadPlaceholder')} />
            </div>
          </div>
        </div>

        {/* İletişim */}
        <div className="p-6 border-b border-blue-50">
          <div className="flex items-center gap-2 mb-5">
            <Phone size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">{t('kayit.iletisim')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('footer.iletisim')}</label>
              <input type="tel" value={telefonGirdi} readOnly
                className={`${inputCls} bg-emerald-50 border-emerald-300 text-emerald-700 cursor-not-allowed`} />
            </div>
            <div>
              <label className={labelCls}>WhatsApp</label>
              <input type="tel" value={form.whatsapp}
                onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                className={inputCls} placeholder="+90 548 000 0000" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>{t('kayit.epostaLabel')} *</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputCls} placeholder="ornek@email.com" />
            </div>
          </div>
        </div>

        {/* Konum */}
        <div className="p-6 border-b border-blue-50">
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">{t('kayit.konum')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('ustaListesi.sehir')} *</label>
              <select required value={form.sehir_id}
                onChange={e => sehirDegisti(e.target.value)}
                className={inputCls}>
                <option value="">{t('hero.sehirSec')}</option>
                {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('kayit.ilceLabel')}</label>
              <select value={form.ilce_id}
                onChange={e => setForm(f => ({ ...f, ilce_id: e.target.value }))}
                disabled={!form.sehir_id}
                className={`${inputCls} disabled:bg-gray-50 disabled:cursor-not-allowed`}>
                <option value="">{t('kayit.ilceSecin')}</option>
                {ilceler.map(i => <option key={i.id} value={i.id}>{i.ad}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Hizmet */}
        <div className="p-6 border-b border-blue-50">
          <div className="flex items-center gap-2 mb-5">
            <Briefcase size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">{t('kayit.hizmetKategorisi')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>{t('ustaListesi.hizmetTuru')} *</label>
              <select required value={form.kategori_id}
                onChange={e => setForm(f => ({ ...f, kategori_id: e.target.value }))}
                className={inputCls}>
                <option value="">{t('kayit.kategoriSecin')}</option>
                {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('kayit.deneyimLabel')}</label>
              <input type="number" min="0" max="50" value={form.deneyim_yil}
                onChange={e => setForm(f => ({ ...f, deneyim_yil: e.target.value }))}
                className={inputCls} placeholder="0" />
            </div>
          </div>
        </div>

        {/* Hakkında */}
        <div className="p-6 border-b border-blue-50">
          <div className="flex items-center gap-2 mb-5">
            <FileText size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">{t('kayit.hakkindaLabel')}</h3>
          </div>
          <textarea value={form.aciklama}
            onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
            rows={4} className={`${inputCls} resize-none`}
            placeholder={t('kayit.hakkindaPlaceholder')} />
        </div>

        {/* Şifre */}
        <div className="p-6 border-b border-blue-50">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Giriş Şifresi</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Şifre *</label>
              <div className="relative">
                <input
                  type={sifreGoster ? 'text' : 'password'}
                  required
                  value={form.sifre}
                  onChange={e => setForm(f => ({ ...f, sifre: e.target.value }))}
                  className={inputCls}
                  placeholder="En az 6 karakter"
                />
                <button type="button" onClick={() => setSifreGoster(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {sifreGoster ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Şifre Tekrar *</label>
              <input
                type={sifreGoster ? 'text' : 'password'}
                required
                value={form.sifre_tekrar}
                onChange={e => setForm(f => ({ ...f, sifre_tekrar: e.target.value }))}
                className={inputCls}
                placeholder="Şifrenizi tekrar girin"
              />
            </div>
          </div>
          {sifreHata && (
            <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
              <span>⚠</span> {sifreHata}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">Bu şifre ile usta panelinize giriş yapacaksınız.</p>
        </div>

        <div className="p-6">
          <button type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm">
            {t('kayit.dogrulamaAdim')} →
          </button>
        </div>
      </form>
    </div>
  )

  // ─── Adım 4: Ödeme ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900">{t('kayit.odemeBaslik')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('kayit.odemeAlt')}</p>
      </div>
      <AdimGostergesi />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <form onSubmit={odemeGonder} className="md:col-span-3 bg-white border border-blue-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-blue-50">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard size={16} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900 text-sm">{t('kayit.kartBilgileri')}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>{t('kayit.kartSahibiLabel')}</label>
                <input type="text" required value={odeme.kart_ad}
                  onChange={e => setOdeme(o => ({ ...o, kart_ad: e.target.value }))}
                  className={inputCls} placeholder="AD SOYAD" />
              </div>
              <div>
                <label className={labelCls}>{t('kayit.kartNoLabel')}</label>
                <input type="text" required value={odeme.kart_no}
                  onChange={e => setOdeme(o => ({ ...o, kart_no: kartNoFormat(e.target.value) }))}
                  className={inputCls} placeholder="0000 0000 0000 0000" maxLength={19} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t('kayit.sonTarihLabel')}</label>
                  <input type="text" required value={odeme.son_tarih}
                    onChange={e => setOdeme(o => ({ ...o, son_tarih: sonTarihFormat(e.target.value) }))}
                    className={inputCls} placeholder="MM/YY" maxLength={5} />
                </div>
                <div>
                  <label className={labelCls}>CVV</label>
                  <input type="text" required value={odeme.cvv}
                    onChange={e => setOdeme(o => ({ ...o, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                    className={inputCls} placeholder="000" maxLength={3} />
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {hata && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                {hata}
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setAdim(3)}
                className="flex-1 border border-blue-200 text-blue-600 font-semibold py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-sm">
                {t('kayit.geriBtn')}
              </button>
              <button type="submit" disabled={yukleniyor}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
                {yukleniyor ? t('kayit.isliyor') : `${t('kayit.odet')}${seciliPlan?.fiyat}`}
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
              <Shield size={12} /><span>{t('kayit.guvenliOdeme')}</span>
            </div>
          </div>
        </form>

        {/* Sipariş özeti */}
        <div className="md:col-span-2">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <h4 className="font-bold text-gray-900 text-sm mb-4">{t('kayit.odemeOzeti')}</h4>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{seciliPlan?.ad}</span>
                <span className="font-semibold text-gray-900">${seciliPlan?.fiyat}</span>
              </div>
              {seciliPlan?.id === 'yillik' && (
                <div className="flex justify-between text-blue-600 text-xs">
                  <span>{t('kayit.yillikIndirim')}</span>
                  <span>-$39.89</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500">
                <span>{t('kayit.dogrulanmisTelefon')}</span>
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle size={11} /> {telefonGirdi}
                </span>
              </div>
            </div>
            <div className="border-t border-blue-200 pt-3 flex justify-between font-bold text-gray-900">
              <span>{t('kayit.toplam')}</span>
              <span>${seciliPlan?.fiyat}</span>
            </div>
            <ul className="mt-5 space-y-1.5">
              {seciliPlan?.ozellikler.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <Check size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />{o}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
