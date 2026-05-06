import { useState, useEffect } from 'react'

const WA_TEL = '905488510700'
const WA_MESAJ = encodeURIComponent('Merhaba, Ada Usta hakkında bilgi almak istiyorum.')

export default function WhatsappButon() {
  const [balonGoster, setBalonGoster] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setBalonGoster(true), 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {balonGoster && (
        <div
          onClick={() => setBalonGoster(false)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg text-sm max-w-[210px] cursor-pointer"
        >
          <p className="font-bold text-gray-800 mb-0.5">WhatsApp ile İletişim</p>
          <p className="text-gray-500 text-xs leading-relaxed">Sorularınız için hemen yazın. 09:00 – 18:00</p>
        </div>
      )}
      <a
        href={`https://wa.me/${WA_TEL}?text=${WA_MESAJ}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#25d366] hover:bg-[#1ebe5d] text-white font-bold text-sm px-5 py-3.5 rounded-full shadow-lg transition-all hover:scale-105 whitespace-nowrap"
      >
        WhatsApp ile İletişime Geç
      </a>
    </div>
  )
}
