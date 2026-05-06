import { useState, useEffect } from 'react'

const WA_TEL = '905488510700'
const WA_MESAJ = encodeURIComponent('Merhaba, Ada Usta hakkında bilgi almak istiyorum.')

export default function WhatsappButon() {
  const [balonAcik, setBalonAcik] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setBalonAcik(true), 3500)
    return () => clearTimeout(t)
  }, [])

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
      <a
        href={`https://wa.me/${WA_TEL}?text=${WA_MESAJ}`}
        target="_blank"
        rel="noopener noreferrer"
        title="WhatsApp ile İletişime Geç"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '58px', height: '58px', borderRadius: '50%',
          background: '#25d366',
          boxShadow: '0 4px 16px rgba(37,211,102,0.5)',
          transition: 'transform .2s, box-shadow .2s',
          textDecoration: 'none',
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
      </a>

      <style>{`
        @keyframes waFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
