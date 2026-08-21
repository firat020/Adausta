import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const WA_TEL = '905488510700'
const WA_MESAJ = encodeURIComponent('Merhaba, Ada Usta hakkında bilgi almak istiyorum.')
const WA_LINK = `https://wa.me/${WA_TEL}?text=${WA_MESAJ}`

export default function WhatsappButon() {
  const [balonAcik, setBalonAcik] = useState(false)
  const [uyariAcik, setUyariAcik] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => setBalonAcik(true), 3500)
    return () => clearTimeout(t)
  }, [])

  const ustaAra = () => {
    setUyariAcik(false)
    navigate('/ustalar')
  }

  const whatsappaDevamEt = () => {
    setUyariAcik(false)
    window.open(WA_LINK, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999 }}>

      {/* Bilgi balonu */}
      {balonAcik && (
        <div
          onClick={() => setBalonAcik(false)}
          style={{
            position: 'absolute', bottom: '70px', right: '0',
            background: 'white', border: '1px solid #e5e7eb',
            borderRadius: '12px', padding: '10px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            whiteSpace: 'nowrap', cursor: 'pointer',
            animation: 'waFadeUp .3s ease',
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#111827' }}>WhatsApp ile İletişim</p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>Sorularınız için yazın · 09:00–18:00</p>
          {/* Üçgen ok */}
          <div style={{
            position: 'absolute', bottom: '-7px', right: '22px',
            width: 0, height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '7px solid white',
            filter: 'drop-shadow(0 2px 1px rgba(0,0,0,0.08))',
          }} />
        </div>
      )}

      {/* WhatsApp butonu */}
      <button
        type="button"
        onClick={() => { setBalonAcik(false); setUyariAcik(true) }}
        title="WhatsApp ile İletişime Geç"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '58px', height: '58px', borderRadius: '50%',
          background: '#25d366', border: 'none', cursor: 'pointer', padding: 0,
          boxShadow: '0 4px 16px rgba(37,211,102,0.5)',
          transition: 'transform .2s, box-shadow .2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(37,211,102,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,211,102,0.5)' }}
      >
        {/* WhatsApp SVG Logo */}
        <svg viewBox="0 0 48 48" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd"
            d="M24 4C12.954 4 4 12.954 4 24c0 3.737 1.02 7.234 2.797 10.224L4 44l10.066-2.64A19.916 19.916 0 0024 44c11.046 0 20-8.954 20-20S35.046 4 24 4z"
            fill="white"/>
          <path fillRule="evenodd" clipRule="evenodd"
            d="M17.5 14c-.5-1-1 .5-1 .5C15 17 15 19 17 22s5 6.5 9 8.5c2 1 4 .5 5-1 .5-1 .5-2 0-2.5l-3-2c-.5-.5-1-.5-1.5 0l-1 1c-.5.5-1 .5-1.5.2C22.5 25.7 21 24 20 22c-.3-.5-.3-1 .2-1.5l1-1c.5-.5.5-1 0-1.5l-2-3c-.3-.5-.2-1-.7-1z"
            fill="#25d366"/>
        </svg>
      </button>

      {/* Uyarı modalı: WhatsApp hattının amacını netleştir */}
      {uyariAcik && (
        <div
          onClick={() => setUyariAcik(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: '16px', maxWidth: '380px', width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
              animation: 'waFadeUp .25s ease',
            }}
          >
            <div style={{
              background: 'linear-gradient(90deg,#25d366,#1ea952)',
              padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '15px', color: 'white' }}>Bir usta mı arıyorsunuz?</p>
              <button
                onClick={() => setUyariAcik(false)}
                aria-label="Kapat"
                style={{
                  background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '50%',
                  width: '26px', height: '26px', color: 'white', fontSize: '16px', lineHeight: 1,
                  cursor: 'pointer', flexShrink: 0,
                }}
              >×</button>
            </div>
            <div style={{ padding: '18px 20px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '13.5px', lineHeight: 1.6, color: '#374151' }}>
                Bu WhatsApp hattı, Ada Usta'ya kayıtlı <b>ustalarımız ve işletme sahiplerinin</b> bizden bilgi
                alması içindir. Bir usta bulmak veya iş talebi oluşturmak için bu numaradan yazmanıza gerek yok —
                sitemiz üzerinden doğrudan ilerleyebilirsiniz.
              </p>
              <button
                onClick={ustaAra}
                style={{
                  width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
                  background: '#0052CC', color: 'white', fontWeight: 700, fontSize: '13.5px',
                  cursor: 'pointer', marginBottom: '8px',
                }}
              >Usta Arıyorum → Ustaları Göster</button>
              <button
                onClick={whatsappaDevamEt}
                style={{
                  width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #d1d5db',
                  background: 'white', color: '#374151', fontWeight: 700, fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >Usta / İşletme Sahibiyim, WhatsApp'a Devam Et</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes waFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
