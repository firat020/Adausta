import API from '../config.js'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Phone, AtSign, Globe, Send, Bell, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'

export default function Footer() {
  const { t } = useTranslation()
  const [aboneEmail, setAboneEmail] = useState('')
  const [aboneDurum, setAboneDurum] = useState(null) // null / 'yukleniyor' / 'basarili' / 'hata'
  const [aboneMesaj, setAboneMesaj] = useState('')

  const aboneOl = async (e) => {
    e.preventDefault()
    if (!aboneEmail) return
    setAboneDurum('yukleniyor')
    try {
      const r = await axios.post(`${API}/api/analitik/abone`, {
        email: aboneEmail, kaynak: 'footer'
      })
      setAboneMesaj(r.data.mesaj || 'Başarıyla abone oldunuz!')
      setAboneDurum('basarili')
      setAboneEmail('')
    } catch (err) {
      setAboneMesaj(err.response?.data?.hata || 'Bir hata oluştu')
      setAboneDurum('hata')
    }
  }

  return (
    <footer className="bg-blue-950 text-blue-200">
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 mb-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex justify-center items-center mb-4">
              <img src="/footer-logo.webp" alt="Ada Usta" className="h-28 sm:h-36 md:h-44 w-auto object-contain" loading="lazy" />
            </div>
            <p className="text-sm leading-relaxed text-blue-300 mb-5">
              {t('footer.aciklama')}
            </p>
            {/* Sosyal medya */}
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 bg-blue-900 hover:bg-blue-500 rounded-lg flex items-center justify-center transition-colors">
                <AtSign size={15} className="text-blue-200" />
              </a>
              <a href="#" className="w-8 h-8 bg-blue-900 hover:bg-blue-500 rounded-lg flex items-center justify-center transition-colors">
                <Globe size={15} className="text-blue-200" />
              </a>
              <a href="#" className="w-8 h-8 bg-blue-900 hover:bg-blue-500 rounded-lg flex items-center justify-center transition-colors">
                <Send size={15} className="text-blue-200" />
              </a>
            </div>
          </div>

          {/* Hizmetler */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('footer.hizmetler')}</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { arama: 'Elektrikçi',     label: t('heroTaglar.elektrikci') },
                { arama: 'Su Tesisatı',    label: t('heroTaglar.suTesisati') },
                { arama: 'Boya Badana',    label: t('heroTaglar.boyaBadana') },
                { arama: 'Klima Servisi',  label: t('heroTaglar.klima') },
                { arama: 'Mobilya Montaj', label: t('pills.mobilya') },
                { arama: 'Demirci',        label: 'Demirci' },
              ].map(h => (
                <li key={h.arama}>
                  <Link to={`/ustalar?arama=${h.arama}`} className="hover:text-white transition-colors">{h.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Şehirler */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('footer.sehirler')}</h4>
            <ul className="space-y-2.5 text-sm">
              {['Lefkoşa', 'Girne', 'Gazimağusa', 'Güzelyurt', 'İskele'].map(s => (
                <li key={s}>
                  <Link to={`/ustalar?sehir=${s}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <MapPin size={12} /> {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* İletişim + Yasal */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-white font-semibold text-sm mb-4">{t('footer.iletisim')}</h4>
            <ul className="space-y-3 text-sm mb-5">
              <li>
                <a href="tel:+905334265890" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone size={14} className="text-blue-400" />
                  +90 533 426 58 90
                </a>
              </li>
              <li className="flex items-start gap-2 text-blue-300 text-xs leading-relaxed">
                <MapPin size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                {t('common.kktcGenelHizmet')}
              </li>
            </ul>

            <h4 className="text-white font-semibold text-sm mb-3">{t('footer.yasal')}</h4>
            <div className="space-y-2 text-sm">
              <Link to="/gizlilik" className="block hover:text-white transition-colors">{t('footer.gizlilik')}</Link>
              <Link to="/kullanim-sartlari" className="block hover:text-white transition-colors">{t('footer.kullanim')}</Link>
              <Link to="/iade-politikasi" className="block hover:text-white transition-colors">{t('footer.iade')}</Link>
              <Link to="/mesafeli-satis" className="block hover:text-white transition-colors">{t('footer.mesafeli')}</Link>
              <Link to="/cerez-politikasi" className="block hover:text-white transition-colors">{t('footer.cerez')}</Link>
            </div>
          </div>
        </div>

        {/* Abone Ol Bölümü */}
        <div className="border-t border-blue-900 pt-8 pb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-800 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell size={18} className="text-blue-300" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Bültenimize Abone Olun</p>
                <p className="text-blue-400 text-xs">Yeni ustalar ve kampanyalardan haberdar olun</p>
              </div>
            </div>
            {aboneDurum === 'basarili' ? (
              <div className="flex items-center gap-2 bg-green-900/30 border border-green-800 rounded-xl px-4 py-2.5">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-green-300 text-sm">{aboneMesaj}</span>
              </div>
            ) : (
              <form onSubmit={aboneOl} className="flex gap-2 w-full md:w-auto">
                <input
                  type="email"
                  value={aboneEmail}
                  onChange={e => { setAboneEmail(e.target.value); setAboneDurum(null) }}
                  placeholder="E-posta adresiniz..."
                  required
                  className="flex-1 md:w-64 bg-blue-900/50 border border-blue-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-blue-500 outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={aboneDurum === 'yukleniyor'}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
                >
                  {aboneDurum === 'yukleniyor' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Abone Ol
                </button>
              </form>
            )}
            {aboneDurum === 'hata' && (
              <p className="text-red-400 text-xs">{aboneMesaj}</p>
            )}
          </div>
        </div>

        {/* Alt şerit */}
        <div className="border-t border-blue-900 pt-5 space-y-2 text-xs text-blue-400 text-center md:text-left">
          <p className="font-semibold text-blue-300">{t('footer.firma')}</p>
          <div className="flex flex-col md:flex-row items-center justify-between gap-1">
            <span>© 2026 Ada Usta — {t('footer.telif')}</span>
            <span>{t('common.kuzeyKibris')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
