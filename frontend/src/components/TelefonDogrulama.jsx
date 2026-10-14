import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle, Info, MessageCircle, Phone, ShieldCheck, Smartphone } from 'lucide-react'
import {
  telefonDogrulamaAyarlar, telefonDogrulamaDurum, telefonDogrulamaGonder, telefonDogrulamaDogrula,
} from '../api'

const KANAL_ETIKET = { sms: 'SMS', whatsapp: 'WhatsApp' }
const inputCls = 'w-full border border-slate-300 rounded-xl px-4 py-3 text-[#0f1e46] outline-none bg-white transition-all duration-150 ease-out focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500'

// Kayıtlı numarayı kullanıcıya okunaklı göster: 0533 123 45 67 → +90 533 123 45 67
function numaraGoster(telefon, dial) {
  const ham = String(telefon || '').trim()
  if (!ham) return ''
  if (ham.startsWith('+') || ham.startsWith('00')) return ham
  let d = ham.replace(/\D/g, '')
  if (dial === '90') {
    if (d.startsWith('90') && d.length === 12) d = d.slice(2)
    d = d.replace(/^0/, '')
    if (d.length === 10) return `+90 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
  }
  return ham
}

/**
 * Twilio Verify ile telefon sahipliği doğrulaması (SMS / WhatsApp).
 * Numara, hesabın profilindeki kayıtlı numaradır (baştan dolu gösterilir, yeniden yazdırılmaz);
 * doğrulama durumu her zaman backend'den alınır.
 *
 * props:
 *  telefon          kayıtta/profilde girilen telefon (salt okunur, dolu gösterilir)
 *  amac             'kayit' | 'profil'
 *  oturumAcik       false ise hesap henüz yoktur: durum sorgulanmaz, ilk gönderimde onOnce ile hesap açılır
 *  onOnce           kod gönderilmeden önce çağrılır (ör. kaydı oluştur); hata fırlatırsa gönderim yapılmaz
 *  onDogrulandi     doğrulama tamamlanınca çağrılır
 *  onAtla           verilirse "Şimdilik atla" gösterilir (zorunlu olmayan akışlar)
 *  onNumaraDuzenle  "Numarayı düzenle" tıklanınca çağrılır
 *  cerceve          false ise kendi kutusunu çizmez (üst kapsayıcı çizer)
 */
export default function TelefonDogrulama({
  telefon, amac = 'profil', oturumAcik = true, onOnce, onDogrulandi, onAtla, onNumaraDuzenle, cerceve = true,
}) {
  const [ayar, setAyar] = useState(null)
  const [faz, setFaz] = useState('yukleniyor') // yukleniyor | dogrulandi | gonder | kod | kullanilamiyor
  const [ulke, setUlke] = useState('KKTC')
  const [kanal, setKanal] = useState('sms')
  const [kod, setKod] = useState('')
  const [maske, setMaske] = useState('')
  const [bekleme, setBekleme] = useState(0)
  const [isleniyor, setIsleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [bilgi, setBilgi] = useState('')
  const [digerKanal, setDigerKanal] = useState('')
  const kodRef = useRef(null)
  const oturumRef = useRef(oturumAcik) // yalnız ilk yüklemede okunur; sonradan açılan oturum akışı sıfırlamasın

  const yukle = useCallback(async () => {
    try {
      const a = await telefonDogrulamaAyarlar()
      setAyar(a.data)
      if (!a.data.yapilandirildi) { setFaz('kullanilamiyor'); return }
      if (oturumRef.current === false) { setFaz('gonder'); return }
      const d = await telefonDogrulamaDurum()
      if (d.data.dogrulandi) { setFaz('dogrulandi'); return }
      if (d.data.bekleyen) {
        setKanal(d.data.bekleyen.kanal)
        setMaske(d.data.bekleyen.telefon_maske)
        setBekleme(d.data.bekleyen.bekleme_sn || 0)
        setFaz('kod')
        return
      }
      setFaz('gonder')
    } catch {
      setFaz('kullanilamiyor')
    }
  }, [])

  useEffect(() => { yukle() }, [yukle, telefon])

  // Yeniden gönderim geri sayımı (süreyi backend belirler)
  useEffect(() => {
    if (bekleme <= 0) return undefined
    const t = setTimeout(() => setBekleme(b => Math.max(0, b - 1)), 1000)
    return () => clearTimeout(t)
  }, [bekleme])

  useEffect(() => { if (faz === 'kod') kodRef.current?.focus() }, [faz])

  const gonder = async (secilenKanal) => {
    setHata(''); setBilgi(''); setDigerKanal(''); setIsleniyor(true)
    try {
      if (onOnce) await onOnce() // örn. hesabı oluştur (oturum gerekli)
      const { data } = await telefonDogrulamaGonder({ telefon, ulke, kanal: secilenKanal, amac })
      if (data.zaten_dogrulandi) { setFaz('dogrulandi'); onDogrulandi?.(); return }
      setKanal(secilenKanal)
      setMaske(data.telefon_maske)
      setBekleme(data.bekleme_sn || 60)
      setKod('')
      setFaz('kod')
      setBilgi(`${KANAL_ETIKET[secilenKanal]} ile 6 haneli kod gönderildi.`)
    } catch (err) {
      const d = err.response?.data || {}
      setHata(d.hata || 'Kod gönderilemedi. Lütfen tekrar deneyin.')
      if (d.bekleme_sn) setBekleme(d.bekleme_sn)
      if (d.diger_kanal) setDigerKanal(d.diger_kanal)
    } finally {
      setIsleniyor(false)
    }
  }

  const dogrula = async (e) => {
    e?.preventDefault()
    if (kod.length !== 6) return
    setHata(''); setBilgi(''); setIsleniyor(true)
    try {
      await telefonDogrulamaDogrula({ kod })
      setFaz('dogrulandi')
      onDogrulandi?.()
    } catch (err) {
      const d = err.response?.data || {}
      setHata(d.hata || 'Kod doğrulanamadı. Lütfen tekrar deneyin.')
      if (['suresi_doldu', 'deneme_asildi', 'istek_yok', 'numara_degisti'].includes(d.kod)) {
        setFaz('gonder'); setKod('')
      }
    } finally {
      setIsleniyor(false)
    }
  }

  const kodDegisti = (v) => setKod(v.replace(/\D/g, '').slice(0, 6))
  const yapistir = (e) => {
    const t = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
    if (t) { e.preventDefault(); setKod(t) }
  }

  if (faz === 'yukleniyor') {
    return <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
  }

  if (faz === 'dogrulandi') {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <CheckCircle size={22} className="text-emerald-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-emerald-800">Telefon numaranız doğrulandı</p>
          <p className="text-xs text-emerald-700">Numaranızı değiştirirseniz yeniden doğrulamanız gerekir.</p>
        </div>
      </div>
    )
  }

  if (faz === 'kullanilamiyor') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        Telefon doğrulama şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.
        {onAtla && (
          <button type="button" onClick={onAtla} className="block mt-2 text-xs font-bold text-amber-900 underline">Şimdilik devam et</button>
        )}
      </div>
    )
  }

  const digerKanalAdi = kanal === 'sms' ? 'whatsapp' : 'sms'
  const dial = (ayar?.ulkeler || []).find(u => u.kod === ulke)?.dial
  const gosterilen = numaraGoster(telefon, dial)

  const kanalButonu = (k) => (
    <button type="button" onClick={() => gonder(k)} disabled={isleniyor}
      className={`flex-1 flex items-center justify-center gap-2.5 font-bold py-3.5 rounded-xl text-[15px] transition-all duration-150 ease-out disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        k === 'sms'
          ? 'bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-400'
          : 'bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 focus-visible:ring-green-400'}`}>
      {k === 'sms' ? <MessageCircle size={18} /> : <Smartphone size={18} />}
      {isleniyor ? 'Gönderiliyor...' : `${KANAL_ETIKET[k]} ile kod gönder`}
    </button>
  )

  return (
    <div className={cerceve ? 'bg-white border border-blue-100 rounded-2xl p-5 space-y-4' : 'space-y-4'}>
      <div className="flex items-start gap-3.5">
        <span className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={22} className="sm:hidden" />
          <Smartphone size={26} className="hidden sm:block" />
        </span>
        <div>
          <h3 className="font-bold text-[#0f1e46] text-base sm:text-xl leading-snug">Telefon numaranızı doğrulayın</h3>
          <p className="text-[13px] sm:text-[15px] text-slate-500 mt-0.5 leading-snug">SMS veya WhatsApp ile 6 haneli kod alın.</p>
        </div>
      </div>

      {faz === 'gonder' && (
        <>
          <div className="grid grid-cols-[124px_minmax(0,1fr)] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
            <div>
              <label className="text-sm font-semibold text-[#0f1e46] mb-1.5 block">Ülke</label>
              <select value={ulke} onChange={e => setUlke(e.target.value)} className={`${inputCls} pl-3 pr-1 sm:px-4 text-sm sm:text-[15px]`}>
                {(ayar?.ulkeler || []).map(u => <option key={u.kod} value={u.kod}>{u.ad} (+{u.dial})</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#0f1e46] mb-1.5 block">Telefon</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={gosterilen} readOnly placeholder="+90 5XX XXX XX XX"
                  className={`${inputCls} pl-9 sm:pl-10 pr-1.5 sm:pr-4 text-[13px] sm:text-[15px] bg-slate-50`} aria-label="Kayıt sırasında girdiğiniz telefon numarası" />
              </div>
            </div>
          </div>
          {onNumaraDuzenle && (
            <button type="button" onClick={onNumaraDuzenle}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline rounded transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
              Numarayı düzenle
            </button>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            {kanalButonu('sms')}
            {kanalButonu('whatsapp')}
          </div>
          <p className="flex items-center gap-2 text-[13px] text-slate-500">
            <Info size={15} className="flex-shrink-0" /> Kod gönderildikten sonra doğrulama alanı açılır.
          </p>
        </>
      )}

      {faz === 'kod' && (
        <form onSubmit={dogrula} className="space-y-3">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">{maske}</span> numarasına {KANAL_ETIKET[kanal]} ile gönderilen kodu girin.
          </p>
          <input ref={kodRef} value={kod} onChange={e => kodDegisti(e.target.value)} onPaste={yapistir}
            type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6}
            placeholder="------" aria-label="6 haneli doğrulama kodu"
            className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`} />
          <button type="submit" disabled={isleniyor || kod.length !== 6}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl text-[15px] transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2">
            {isleniyor ? 'Doğrulanıyor...' : 'Kodu Onayla'}
          </button>
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <button type="button" onClick={() => gonder(kanal)} disabled={isleniyor || bekleme > 0}
              className="font-semibold text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline">
              {bekleme > 0 ? `Tekrar gönder (${bekleme} sn)` : 'Kodu tekrar gönder'}
            </button>
            <button type="button" onClick={() => gonder(digerKanalAdi)} disabled={isleniyor || bekleme > 0}
              className="font-semibold text-slate-600 hover:underline disabled:text-slate-400 disabled:no-underline">
              {KANAL_ETIKET[digerKanalAdi]} ile gönder
            </button>
            <button type="button" onClick={() => { setFaz('gonder'); setKod(''); setHata(''); setBilgi('') }}
              className="font-semibold text-slate-600 hover:underline">
              Yöntemi değiştir
            </button>
          </div>
        </form>
      )}

      {bilgi && <p className="text-xs text-emerald-700 font-medium" role="status">{bilgi}</p>}
      {hata && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg" role="alert">
          {hata}
          {digerKanal && !isleniyor && (
            <button type="button" onClick={() => gonder(digerKanal)} disabled={bekleme > 0}
              className="block mt-2 font-bold underline disabled:opacity-60">
              {KANAL_ETIKET[digerKanal]} ile göndermeyi dene
            </button>
          )}
        </div>
      )}

      {onAtla && (
        <button type="button" onClick={onAtla} className="text-xs font-semibold text-slate-500 hover:underline">
          Şimdilik atla
        </button>
      )}
    </div>
  )
}
