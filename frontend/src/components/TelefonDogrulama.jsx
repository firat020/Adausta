import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle, MessageCircle, Phone, ShieldCheck, Smartphone } from 'lucide-react'
import {
  telefonDogrulamaAyarlar, telefonDogrulamaDurum, telefonDogrulamaGonder, telefonDogrulamaDogrula,
} from '../api'

const KANAL_ETIKET = { sms: 'SMS', whatsapp: 'WhatsApp' }
const inputCls = 'w-full border-2 border-gray-400 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors'

/**
 * Twilio Verify ile telefon sahipliği doğrulaması (SMS / WhatsApp).
 * Numara, hesabın profilindeki kayıtlı numaradır; doğrulama durumu her zaman backend'den alınır.
 *
 * props:
 *  telefon          profilde kayıtlı telefon (salt okunur gösterilir)
 *  amac             'kayit' | 'profil'
 *  onDogrulandi     doğrulama tamamlanınca çağrılır
 *  onAtla           verilirse "Şimdilik atla" gösterilir (zorunlu olmayan akışlar)
 *  onNumaraDuzenle  "Numarayı düzenle" tıklanınca çağrılır
 */
export default function TelefonDogrulama({ telefon, amac = 'profil', onDogrulandi, onAtla, onNumaraDuzenle }) {
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

  const yukle = useCallback(async () => {
    try {
      const [a, d] = await Promise.all([telefonDogrulamaAyarlar(), telefonDogrulamaDurum()])
      setAyar(a.data)
      if (!a.data.yapilandirildi) { setFaz('kullanilamiyor'); return }
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
        <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
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
  const kanalButonu = (k) => (
    <button type="button" onClick={() => gonder(k)} disabled={isleniyor}
      className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 ${
        k === 'sms' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white border-2 border-green-600 text-green-700 hover:bg-green-50'}`}>
      {k === 'sms' ? <Smartphone size={16} /> : <MessageCircle size={16} />}
      {isleniyor ? 'Gönderiliyor...' : `${KANAL_ETIKET[k]} ile kod gönder`}
    </button>
  )

  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><ShieldCheck size={18} /></span>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Telefon numaranı doğrula</h3>
          <p className="text-xs text-gray-500 mt-0.5">Numaranın sana ait olduğunu doğrulamak için 6 haneli bir kod göndereceğiz.</p>
        </div>
      </div>

      {faz === 'gonder' && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="text-xs font-bold text-gray-700 mb-1 block">Ülke</label>
              <select value={ulke} onChange={e => setUlke(e.target.value)} className={inputCls}>
                {(ayar?.ulkeler || []).map(u => <option key={u.kod} value={u.kod}>{u.ad} (+{u.dial})</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-700 mb-1 block">Telefon</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={telefon || ''} readOnly className={`${inputCls} pl-9 bg-gray-50`} aria-label="Profildeki telefon" />
              </div>
            </div>
          </div>
          {onNumaraDuzenle && (
            <button type="button" onClick={onNumaraDuzenle} className="text-xs font-semibold text-blue-600 hover:underline">
              Numarayı düzenle
            </button>
          )}
          <div className="flex gap-2">
            {kanalButonu('sms')}
            {kanalButonu('whatsapp')}
          </div>
        </>
      )}

      {faz === 'kod' && (
        <form onSubmit={dogrula} className="space-y-3">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{maske}</span> numarasına {KANAL_ETIKET[kanal]} ile gönderilen kodu girin.
          </p>
          <input ref={kodRef} value={kod} onChange={e => kodDegisti(e.target.value)} onPaste={yapistir}
            type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6}
            placeholder="------" aria-label="6 haneli doğrulama kodu"
            className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`} />
          <button type="submit" disabled={isleniyor || kod.length !== 6}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition-colors">
            {isleniyor ? 'Doğrulanıyor...' : 'Kodu Onayla'}
          </button>
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <button type="button" onClick={() => gonder(kanal)} disabled={isleniyor || bekleme > 0}
              className="font-semibold text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline">
              {bekleme > 0 ? `Tekrar gönder (${bekleme} sn)` : 'Kodu tekrar gönder'}
            </button>
            <button type="button" onClick={() => gonder(digerKanalAdi)} disabled={isleniyor || bekleme > 0}
              className="font-semibold text-gray-600 hover:underline disabled:text-gray-400 disabled:no-underline">
              {KANAL_ETIKET[digerKanalAdi]} ile gönder
            </button>
            <button type="button" onClick={() => { setFaz('gonder'); setKod(''); setHata(''); setBilgi('') }}
              className="font-semibold text-gray-600 hover:underline">
              Yöntemi / numarayı değiştir
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
        <button type="button" onClick={onAtla} className="text-xs font-semibold text-gray-500 hover:underline">
          Şimdilik atla
        </button>
      )}
    </div>
  )
}
