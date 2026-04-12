import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import tr from './locales/tr.json'
import en from './locales/en.json'
import ru from './locales/ru.json'
import de from './locales/de.json'
import ur from './locales/ur.json'
import fa from './locales/fa.json'

i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
    ru: { translation: ru },
    de: { translation: de },
    ur: { translation: ur },
    fa: { translation: fa },
  },
  lng: localStorage.getItem('adausta_lang') || 'tr',
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
})

export default i18n
