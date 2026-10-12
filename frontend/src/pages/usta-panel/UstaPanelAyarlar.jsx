import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Smartphone, MessageSquare, MessageCircle, KeyRound, ShieldAlert, CheckCircle, AlertCircle, Mail, Phone, Star, Crown, Rocket, Megaphone, Globe } from 'lucide-react'
import { ustaAyarlarGetir, ustaAyarlarKaydet, ustaSifreDegistir, ustaHesapKapat } from '../../api'
import { DILLER } from '../../data/profilSecenekleri.js'

function Anahtar({ acik, onDegis, devreDisi = false, etiket }) {
  return (
    <button type="button" role="switch" aria-checked={acik} aria-label={etiket} disabled={devreDisi} onClick={() => onDegis(!acik)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${acik ? 'bg-blue-600' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${acik ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function Bildirim({ tip, metin }) {
  if (!metin) return null
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${tip === 'basari' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
      {tip === 'basari' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {metin}
    </div>
  )
}

export default function UstaPanelAyarlar() {
  const navigate = useNavigate()
  const [ayar, setAyar] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [bildirimMesaj, setBildirimMesaj] = useState({ tip: '', metin: '' })
  const [sifre, setSifre] = useState({ eski: '', yeni: '', tekrar: '' })
  const [sifreMesaj, setSifreMesaj] = useState({ tip: '', metin: '' })
  const [sifreYukleniyor, setSifreYukleniyor] = useState(false)
  const [kapatAcik, setKapatAcik] = useState(false)
  const [kapatSifre, setKapatSifre] = useState('')
  const [kapatHata, setKapatHata] = useState('')
  const [kapatYukleniyor, setKapatYukleniyor] = useState(false)

  useEffect(() => {
    ustaAyarlarGetir().then(r => setAyar(r.data)).catch(() => setBildirimMesaj({ tip: 'hata', metin: 'Ayarlar yüklenemedi.' })).finally(() => setYukleniyor(false))
  }, [])

  // Anahtar değişince hemen kaydedilir (başarısız olursa eski değere döner)
  const tercihDegistir = async (anahtar, deger) => {
    const onceki = ayar.bildirim
    const yeni = { ...onceki, [anahtar]: deger }
    setAyar(a => ({ ...a, bildirim: yeni }))
    setBildirimMesaj({ tip: '', metin: '' })
    try {
      await ustaAyarlarKaydet(yeni, ayar.tercih_dil)
      setBildirimMesaj({ tip: 'basari', metin: 'Tercihin kaydedildi.' })
    } catch {
      setAyar(a => ({ ...a, bildirim: onceki }))
      setBildirimMesaj({ tip: 'hata', metin: 'Kaydedilemedi, tekrar dene.' })
    }
  }

  const dilDegistir = async (dil) => {
    const onceki = ayar.tercih_dil
    setAyar(a => ({ ...a, tercih_dil: dil }))
    setBildirimMesaj({ tip: '', metin: '' })
    try {
      await ustaAyarlarKaydet(ayar.bildirim, dil)
      setBildirimMesaj({ tip: 'basari', metin: 'Tercihin kaydedildi.' })
    } catch {
      setAyar(a => ({ ...a, tercih_dil: onceki }))
      setBildirimMesaj({ tip: 'hata', metin: 'Kaydedilemedi, tekrar dene.' })
    }
  }

  const sifreGonder = async (e) => {
    e.preventDefault()
    setSifreMesaj({ tip: '', metin: '' })
    if (sifre.yeni.length < 8) return setSifreMesaj({ tip: 'hata', metin: 'Yeni şifre en az 8 karakter olmalı.' })
    if (sifre.yeni !== sifre.tekrar) return setSifreMesaj({ tip: 'hata', metin: 'Yeni şifreler eşleşmiyor.' })
    setSifreYukleniyor(true)
    try {
      await ustaSifreDegistir({ eski_sifre: sifre.eski, yeni_sifre: sifre.yeni })
      setSifre({ eski: '', yeni: '', tekrar: '' })
      setSifreMesaj({ tip: 'basari', metin: 'Şifren güncellendi.' })
    } catch (err) {
      setSifreMesaj({ tip: 'hata', metin: err.response?.data?.hata || 'Şifre değiştirilemedi.' })
    } finally { setSifreYukleniyor(false) }
  }

  const hesapKapat = async (e) => {
    e.preventDefault()
    setKapatHata(''); setKapatYukleniyor(true)
    try {
      await ustaHesapKapat(kapatSifre)
      navigate('/')
      window.location.reload()
    } catch (err) {
      setKapatHata(err.response?.data?.hata || 'İşlem başarısız.')
      setKapatYukleniyor(false)
    }
  }

  if (yukleniyor) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  if (!ayar) return <Bildirim tip="hata" metin={bildirimMesaj.metin || 'Ayarlar yüklenemedi.'} />

  const b = ayar.bildirim
  const girdi = 'w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Ayarlar</h1>
        <p className="text-sm text-gray-500 mt-1">Bildirim tercihlerini ve hesap güvenliğini yönet.</p>
      </div>

      {/* Bildirimler */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><Bell size={18} className="text-blue-600" /> Bildirimler</h2>
        <p className="text-xs text-gray-500 mb-4">Yeni iş talebi geldiğinde nasıl haberdar olmak istediğini seç.</p>
        <div className="divide-y divide-gray-100">
          <div className="flex items-center gap-3 py-3">
            <Smartphone size={18} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Mobil uygulama bildirimi (yeni iş talebi)</p>
              <p className="text-xs text-gray-500">
                {ayar.push_cihaz_sayisi > 0 ? `${ayar.push_cihaz_sayisi} cihazın bağlı.` : 'Henüz bağlı cihaz yok — Ada Usta uygulamasına giriş yaptığında etkinleşir.'}
              </p>
            </div>
            <Anahtar acik={b.talep_push} onDegis={v => tercihDegistir('talep_push', v)} etiket="Yeni iş talebi mobil bildirimi" />
          </div>
          <div className="flex items-center gap-3 py-3">
            <MessageSquare size={18} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">SMS (yeni iş talebi)</p>
              <p className="text-xs text-gray-500">{ayar.telefon} numarasına kısa mesaj gönderilir.</p>
            </div>
            <Anahtar acik={b.talep_sms} onDegis={v => tercihDegistir('talep_sms', v)} etiket="Yeni iş talebi SMS" />
          </div>
          <div className="flex items-center gap-3 py-3">
            <Bell size={18} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Ada Usta ekibinden gelen mesajlar (mobil bildirim)</p>
              <p className="text-xs text-gray-500">Panelindeki Mesajlar bölümüne yeni mesaj düştüğünde.</p>
            </div>
            <Anahtar acik={b.mesaj_push} onDegis={v => tercihDegistir('mesaj_push', v)} etiket="Ekip mesajı mobil bildirimi" />
          </div>
          <div className="flex items-center gap-3 py-3 opacity-60">
            <MessageCircle size={18} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">WhatsApp bildirimi</p>
              <p className="text-xs text-gray-500">Yakında.</p>
            </div>
            <Anahtar acik={false} onDegis={() => {}} devreDisi etiket="WhatsApp bildirimi (yakında)" />
          </div>
          <div className="flex items-center gap-3 py-3">
            <Star size={18} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Yeni değerlendirmeler</p>
              <p className="text-xs text-gray-500">Profiline yeni bir müşteri yorumu geldiğinde haberdar ol.</p>
            </div>
            <Anahtar acik={b.yorum_bildirim} onDegis={v => tercihDegistir('yorum_bildirim', v)} etiket="Yeni değerlendirme bildirimi" />
          </div>
          <div className="flex items-center gap-3 py-3">
            <Crown size={18} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Abonelik ve deneme hatırlatmaları</p>
              <p className="text-xs text-gray-500">Üyeliğin bitmeye yaklaştığında hatırlatma al.</p>
            </div>
            <Anahtar acik={b.abonelik_bildirim} onDegis={v => tercihDegistir('abonelik_bildirim', v)} etiket="Abonelik hatırlatma bildirimi" />
          </div>
          <div className="flex items-center gap-3 py-3">
            <Rocket size={18} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Öne çıkarma güncellemeleri</p>
              <p className="text-xs text-gray-500">Satın aldığın öne çıkarmaların durumu ve bitişi hakkında bilgi al.</p>
            </div>
            <Anahtar acik={b.promosyon_bildirim} onDegis={v => tercihDegistir('promosyon_bildirim', v)} etiket="Öne çıkarma bildirimi" />
          </div>
          <div className="flex items-center gap-3 py-3">
            <Megaphone size={18} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Platform duyuruları</p>
              <p className="text-xs text-gray-500">Ada Usta'dan yeni özellikler ve önemli duyurular.</p>
            </div>
            <Anahtar acik={b.duyuru_bildirim} onDegis={v => tercihDegistir('duyuru_bildirim', v)} etiket="Platform duyuru bildirimi" />
          </div>
        </div>
        <div className="mt-3"><Bildirim tip={bildirimMesaj.tip} metin={bildirimMesaj.metin} /></div>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <label className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-2"><Globe size={16} className="text-blue-600" /> Tercih edilen iletişim dili</label>
          <p className="text-xs text-gray-500 mb-2">Ada Usta ekibi seninle mümkünse bu dilde iletişime geçer.</p>
          <select value={ayar.tercih_dil || 'tr'} onChange={e => dilDegistir(e.target.value)}
            className="w-full sm:w-64 px-3 py-2.5 border-2 border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {DILLER.map(d => <option key={d.kod} value={d.kod}>{d.bayrak} {d.ad}</option>)}
          </select>
        </div>
      </div>

      {/* Hesap ve güvenlik */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><KeyRound size={18} className="text-blue-600" /> Hesap ve güvenlik</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-5 text-sm">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5"><Mail size={15} className="text-gray-400" /><div><p className="text-[11px] text-gray-400">Giriş e-postası</p><p className="font-semibold text-gray-800 break-all">{ayar.email}</p></div></div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5"><Phone size={15} className="text-gray-400" /><div><p className="text-[11px] text-gray-400">Telefon</p><p className="font-semibold text-gray-800">{ayar.telefon}</p></div></div>
        </div>

        <form onSubmit={sifreGonder} className="space-y-3">
          <h3 className="text-sm font-bold text-gray-800">Şifreyi değiştir</h3>
          <input type="password" autoComplete="current-password" required value={sifre.eski} onChange={e => setSifre(s => ({ ...s, eski: e.target.value }))} placeholder="Mevcut şifre" className={girdi} />
          <div className="grid sm:grid-cols-2 gap-3">
            <input type="password" autoComplete="new-password" required minLength={8} value={sifre.yeni} onChange={e => setSifre(s => ({ ...s, yeni: e.target.value }))} placeholder="Yeni şifre (en az 8 karakter)" className={girdi} />
            <input type="password" autoComplete="new-password" required minLength={8} value={sifre.tekrar} onChange={e => setSifre(s => ({ ...s, tekrar: e.target.value }))} placeholder="Yeni şifre (tekrar)" className={girdi} />
          </div>
          <Bildirim tip={sifreMesaj.tip} metin={sifreMesaj.metin} />
          <button type="submit" disabled={sifreYukleniyor}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition">
            {sifreYukleniyor ? 'Kaydediliyor...' : 'Şifreyi güncelle'}
          </button>
        </form>
      </div>

      {/* Hesabı kapat */}
      <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm">
        <h2 className="font-bold text-red-700 mb-1 flex items-center gap-2"><ShieldAlert size={18} /> Hesabı kapat</h2>
        <p className="text-xs text-gray-600 mb-3">
          Hesabını kapatırsan profilin yayından kalkar ve giriş yapamazsın. Yorumların, taleplerin ve ödeme kayıtların silinmez.
          Kalan abonelik süresi için iade yapılmaz. Hesabı yeniden açmak veya verilerinin kalıcı silinmesi için bizimle iletişime geç (0548 851 07 00).
        </p>
        {!kapatAcik ? (
          <button type="button" onClick={() => setKapatAcik(true)} className="text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition">
            Hesabımı kapat
          </button>
        ) : (
          <form onSubmit={hesapKapat} className="space-y-3">
            <input type="password" autoComplete="current-password" required value={kapatSifre} onChange={e => setKapatSifre(e.target.value)} placeholder="Onaylamak için şifreni gir" className={girdi} />
            <Bildirim tip="hata" metin={kapatHata} />
            <div className="flex gap-2">
              <button type="submit" disabled={kapatYukleniyor} className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition">
                {kapatYukleniyor ? 'Kapatılıyor...' : 'Evet, hesabımı kapat'}
              </button>
              <button type="button" onClick={() => { setKapatAcik(false); setKapatSifre(''); setKapatHata('') }} className="text-sm font-semibold text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-100">Vazgeç</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
