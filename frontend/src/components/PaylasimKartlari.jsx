import { useEffect, useState } from 'react'
import { Share2, Link2, UserPlus, Copy, Check, MessageCircle, Mail } from 'lucide-react'
import { ustaAbonelikOzet } from '../api'

// Panoya kopyala (eski tarayıcılar için yedek yöntemle)
export async function panoyaKopyala(metin) {
  try {
    await navigator.clipboard.writeText(metin)
    return true
  } catch {
    try {
      const t = document.createElement('textarea')
      t.value = metin
      t.style.position = 'fixed'; t.style.opacity = '0'
      document.body.appendChild(t); t.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(t)
      return ok
    } catch { return false }
  }
}

function KopyalaButon({ metin, etiket, sinif }) {
  const [tamam, setTamam] = useState(false)
  const tikla = async () => {
    if (await panoyaKopyala(metin)) {
      setTamam(true)
      setTimeout(() => setTamam(false), 2000)
    }
  }
  return (
    <button type="button" onClick={tikla}
      className={`flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg transition-colors w-full ${sinif}`}>
      {tamam ? <><Check size={13} /> Kopyalandı</> : <><Copy size={13} /> {etiket}</>}
    </button>
  )
}

const wa = (metin) => `https://wa.me/?text=${encodeURIComponent(metin)}`

// Yorum bağlantısı kartı: "Bağlantıyı Kopyala" + "WhatsApp ile Paylaş" + "E-posta ile Paylaş".
// Hem Abonelik sayfasındaki PaylasimKartlari'nda hem Yorumlar sayfasında tek başına kullanılır.
export function YorumLinkKarti({ link }) {
  if (!link) return null
  const mailto = `mailto:?subject=${encodeURIComponent('Ada Usta - Yorum bırakır mısınız?')}&body=${encodeURIComponent(`Merhaba, Ada Usta'daki profilime bu bağlantıdan yorum bırakabilirsiniz: ${link}`)}`
  return (
    <div className="bg-white rounded-2xl border border-violet-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><Link2 size={16} /></span>
        <h3 className="font-bold text-gray-900 text-sm">Yorum Bağlantınızı Paylaşın</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">Bu bağlantıyı işini bitirdiğin müşteriye gönder; tek tıkla yorum yazsın.</p>
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[140px]"><KopyalaButon metin={link} etiket="Bağlantıyı Kopyala" sinif="bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200" /></div>
        <a href={wa(`Ada Usta'daki profilime bu bağlantıdan yorum bırakabilirsiniz: ${link}`)} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
          <MessageCircle size={13} /> WhatsApp ile Paylaş
        </a>
        <a href={mailto}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
          <Mail size={13} /> E-posta ile Paylaş
        </a>
      </div>
    </div>
  )
}

// Profil paylaş / yorum bağlantısı / usta davet et — panelin birkaç yerinde aynı kartlar kullanılır.
export function PaylasimKartlari({ ozet }) {
  if (!ozet) return null
  const { linkler, referans } = ozet
  const paylas = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Ada Usta profilim', url: linkler.profil }) } catch { /* iptal */ }
    } else {
      await panoyaKopyala(linkler.profil)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Share2 size={16} /></span>
          <h3 className="font-bold text-gray-900 text-sm">Profilini paylaş</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">Profil bağlantını müşterilerine gönder, işini büyüt.</p>
        <div className="flex gap-2">
          <button type="button" onClick={paylas}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
            <Share2 size={13} /> Paylaş
          </button>
          <a href={wa(`Ada Usta profilim: ${linkler.profil}`)} target="_blank" rel="noreferrer" aria-label="WhatsApp ile gönder"
            className="w-10 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
            <MessageCircle size={15} />
          </a>
        </div>
      </div>

      <YorumLinkKarti link={linkler.yorum} />

      <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><UserPlus size={16} /></span>
          <h3 className="font-bold text-gray-900 text-sm">Başka bir usta davet et</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Davet ettiğin usta da ücretli abone olunca ikiniz de <b>{referans.bonus_gun} gün bonus</b> kazanırsınız.
        </p>
        <div className="flex gap-2">
          <div className="flex-1"><KopyalaButon metin={referans.link} etiket="Davet bağlantısı" sinif="bg-emerald-600 hover:bg-emerald-700 text-white" /></div>
          <a href={wa(`Ada Usta'ya usta olarak katıl, müşterilere ulaş: ${referans.link}`)} target="_blank" rel="noreferrer" aria-label="WhatsApp ile davet et"
            className="w-10 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
            <MessageCircle size={15} />
          </a>
        </div>
      </div>
    </div>
  )
}

// Kendi verisini kendisi çeker (Genel Bakış gibi sayfalara doğrudan eklemek için)
export default function PaylasimKartlariYukleyici() {
  const [ozet, setOzet] = useState(null)
  useEffect(() => { ustaAbonelikOzet().then(r => setOzet(r.data)).catch(() => {}) }, [])
  return <PaylasimKartlari ozet={ozet} />
}

// Yorumlar sayfası gibi 'ozet' verisi olmayan yerlerde tek başına "Yorum bağlantını paylaş" kartı için.
export function YorumLinkKartiYukleyici() {
  const [link, setLink] = useState(null)
  useEffect(() => { ustaAbonelikOzet().then(r => setLink(r.data?.linkler?.yorum)).catch(() => {}) }, [])
  return <YorumLinkKarti link={link} />
}
