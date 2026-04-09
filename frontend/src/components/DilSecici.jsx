import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'

const DILLER = [
  { kod: 'tr', ad: 'Türkçe', bayrak: '🇹🇷' },
  { kod: 'en', ad: 'English', bayrak: '🇬🇧' },
  { kod: 'ru', ad: 'Русский', bayrak: '🇷🇺' },
]

export default function DilSecici() {
  const { i18n } = useTranslation()
  const [acik, setAcik] = useState(false)
  const ref = useRef(null)

  const mevcutDil = DILLER.find(d => d.kod === i18n.language) || DILLER[0]

  const dilDegistir = (kod) => {
    i18n.changeLanguage(kod)
    localStorage.setItem('adausta_lang', kod)
    setAcik(false)
  }

  useEffect(() => {
    const kapat = (e) => { if (ref.current && !ref.current.contains(e.target)) setAcik(false) }
    document.addEventListener('mousedown', kapat)
    return () => document.removeEventListener('mousedown', kapat)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAcik(!acik)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-sm font-medium text-gray-700 transition-all"
      >
        <span className="text-base">{mevcutDil.bayrak}</span>
        <span className="hidden sm:inline">{mevcutDil.ad}</span>
        <ChevronDown size={13} className={`transition-transform ${acik ? 'rotate-180' : ''}`} />
      </button>

      {acik && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 min-w-[130px]">
          {DILLER.map(d => (
            <button
              key={d.kod}
              onClick={() => dilDegistir(d.kod)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors text-left
                ${d.kod === i18n.language ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
            >
              <span className="text-base">{d.bayrak}</span>
              {d.ad}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
