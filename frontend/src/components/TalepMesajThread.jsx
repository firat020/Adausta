import { useState } from 'react'
import { Send } from 'lucide-react'

/**
 * Faz 3 Görev 12 — İş talebi mesajlaşması için paylaşılan thread UI'ı.
 * Thread her zaman BELLİ bir IsTalebi'ne bağlıdır (genel bir sohbet/inbox DEĞİL).
 * Veri çekme/gönderme mantığı parent'ta (usta paneli / müşteri paneli / misafir talep takip
 * sayfası farklı endpoint'leri kullanır) — bu bileşen sadece görünümü taşır.
 */
export default function TalepMesajThread({
  mesajlar, yukleniyor, gonderiliyor, onGonder, kendiTaraf,
  bosMetin = 'Henüz mesaj yok.', placeholder = 'Mesajınızı yazın...',
}) {
  const [icerik, setIcerik] = useState('')
  const [hata, setHata] = useState('')

  const gonder = async (e) => {
    e.preventDefault()
    const metin = icerik.trim()
    if (!metin) return
    setHata('')
    try {
      await onGonder(metin)
      setIcerik('')
    } catch (err) {
      setHata(err.response?.data?.hata || 'Mesaj gönderilemedi, tekrar deneyin.')
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-3">
      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {yukleniyor ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
          </div>
        ) : mesajlar.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">{bosMetin}</p>
        ) : (
          mesajlar.map(m => (
            <div key={m.id} className={`flex ${m.gonderen === kendiTaraf ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                m.gonderen === kendiTaraf ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
              }`}>
                <p className="whitespace-pre-wrap break-words">{m.icerik}</p>
                <p className={`text-[10px] mt-1 ${m.gonderen === kendiTaraf ? 'text-blue-100' : 'text-gray-400'}`}>{m.olusturma}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {hata && <p className="text-xs text-red-500 px-1">{hata}</p>}

      <form onSubmit={gonder} className="flex gap-2">
        <input
          value={icerik}
          onChange={e => setIcerik(e.target.value)}
          placeholder={placeholder}
          maxLength={2000}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <button
          type="submit"
          disabled={gonderiliyor || !icerik.trim()}
          className="shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
