import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import tr from './locales/tr.json'
import en from './locales/en.json'
import ru from './locales/ru.json'

i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: localStorage.getItem('adausta_lang') || 'tr',
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
})

export default i18n
