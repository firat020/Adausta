import { Link } from 'react-router-dom'
import { MapPin, Phone, AtSign, Globe, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="bg-blue-950 text-blue-200">
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/ada-usta-logo.png" alt="Ada Usta" className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <div className="text-white font-bold text-lg leading-none">Ada Usta</div>
                <div className="text-blue-400 text-[10px] font-semibold tracking-widest uppercase">{t('common.logoTagline')}</div>
              </div>
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
          <div>
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
