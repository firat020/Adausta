import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { ustaPanelMesajlar, ustaPanelMesajGonder } from '../../api'

export default function UstaPanelMesajlar() {
  const [mesajlar, setMesajlar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [metin, setMetin] = useState('')
  const [gonderiyor, setGonderiyor] = useState(false)
  const altRef = useRef(null)

  const yukle = () => {
    ustaPanelMesajlar()
      .then(r => setMesajlar(r.data.mesajlar))
      .finally(() => setYukleniyor(false))
  }

  useEffect(() => { yukle() }, [])
  useEffect(() => {
    altRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mesajlar])

  const gonder = async (e) => {
    e.preventDefault()
    const icerik = metin.trim()
    if (!icerik || gonderiyor) return
    setGonderiyor(true)
    try {
      await ustaPanelMesajGonder(icerik)
      setMetin('')
      yukle()
    } catch {
      alert('Mesaj gönderilemedi, tekrar deneyin')
    }
    setGonderiyor(false)
  }

  if (yukleniyor) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Mesajlar</h1>
        <p className="text-sm text-gray-500 mt-1">Ada Usta yönetimiyle doğrudan yazışın</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[65vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {mesajlar.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
              <MessageCircle size={36} className="mb-2 text-gray-300" />
              <p className="text-sm font-medium">Henüz mesaj yok</p>
              <p className="text-xs mt-1">Bir sorunuz mu var? Aşağıdan admin'e yazabilirsiniz.</p>
            </div>
          ) : (
            mesajlar.map(m => (
              <div key={m.id} className={`flex ${m.gonderen === 'usta' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.gonderen === 'usta'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{m.icerik}</p>
                  <p className={`text-[10px] mt-1 ${m.gonderen === 'usta' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {m.gonderen === 'usta' ? 'Siz' : 'Ada Usta'} · {m.olusturma}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={altRef} />
        </div>

        <form onSubmit={gonder} className="border-t border-gray-100 p-3 flex items-center gap-2">
          <input
            type="text"
            value={metin}
            onChange={e => setMetin(e.target.value)}
            placeholder="Mesajınızı yazın..."
            maxLength={2000}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!metin.trim() || gonderiyor}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
