import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { MessageCircle, Send, ArrowLeft, RefreshCw } from 'lucide-react'
import API from '../../config.js'

export default function AdminMesajlar() {
  const [threadler, setThreadler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [secili, setSecili] = useState(null)
  const [mesajlar, setMesajlar] = useState([])
  const [metin, setMetin] = useState('')
  const [gonderiyor, setGonderiyor] = useState(false)
  const altRef = useRef(null)

  const ozetYukle = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/admin/mesajlar/ozet`, { withCredentials: true })
      setThreadler(r.data.threadler || [])
    } catch { setThreadler([]) }
    setYukleniyor(false)
  }, [])

  useEffect(() => { ozetYukle() }, [ozetYukle])

  const threadAc = async (t) => {
    setSecili(t)
    try {
      const r = await axios.get(`${API}/api/admin/ustalar/${t.usta_id}/mesajlar`, { withCredentials: true })
      setMesajlar(r.data.mesajlar || [])
      ozetYukle()
    } catch { setMesajlar([]) }
  }

  useEffect(() => {
    altRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mesajlar])

  const gonder = async (e) => {
    e.preventDefault()
    const icerik = metin.trim()
    if (!icerik || !secili || gonderiyor) return
    setGonderiyor(true)
    try {
      await axios.post(`${API}/api/admin/ustalar/${secili.usta_id}/mesajlar`, { icerik }, { withCredentials: true })
      setMetin('')
      const r = await axios.get(`${API}/api/admin/ustalar/${secili.usta_id}/mesajlar`, { withCredentials: true })
      setMesajlar(r.data.mesajlar || [])
      ozetYukle()
    } catch {
      alert('Mesaj gönderilemedi')
    }
    setGonderiyor(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">Mesajlar</h2>
          <p className="text-gray-500 text-sm">Ustalarla doğrudan yazışın — mesaj gönderdiğinizde ustaya push bildirimi gider</p>
        </div>
        <button onClick={ozetYukle} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052CC] transition">
          <RefreshCw size={15} /> Yenile
        </button>
      </div>

      <div className="bg-white border border-[#C8CDD4] rounded-xl shadow-sm overflow-hidden flex h-[70vh]">
        {/* Thread listesi */}
        <div className={`w-full sm:w-80 border-r border-[#F0F4F8] flex-shrink-0 overflow-y-auto ${secili ? 'hidden sm:block' : ''}`}>
          {yukleniyor ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0052CC]" />
            </div>
          ) : threadler.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <MessageCircle size={28} className="mx-auto mb-2 text-gray-200" />
              Henüz mesajlaşma yok
            </div>
          ) : (
            <div className="divide-y divide-[#F0F4F8]">
              {threadler.map(t => (
                <button
                  key={t.usta_id}
                  onClick={() => threadAc(t)}
                  className={`w-full text-left px-4 py-3 hover:bg-[#F8FAFC] transition-colors ${
                    secili?.usta_id === t.usta_id ? 'bg-[#F0F6FF]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#1e293b] text-sm font-semibold truncate">{t.usta_ad}</span>
                    {t.okunmamis > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center shrink-0">
                        {t.okunmamis}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {t.son_gonderen === 'admin' ? 'Siz: ' : ''}{t.son_mesaj}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sohbet */}
        <div className={`flex-1 flex flex-col ${!secili ? 'hidden sm:flex' : ''}`}>
          {!secili ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Soldan bir usta seçin
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-[#F0F4F8] flex items-center gap-2">
                <button onClick={() => setSecili(null)} className="sm:hidden text-gray-400">
                  <ArrowLeft size={18} />
                </button>
                <span className="text-[#1e293b] font-semibold text-sm">{secili.usta_ad}</span>
                <span className="text-xs text-gray-400">· {secili.usta_telefon}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
                {mesajlar.map(m => (
                  <div key={m.id} className={`flex ${m.gonderen === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.gonderen === 'admin'
                        ? 'bg-[#0052CC] text-white rounded-br-sm'
                        : 'bg-white border border-[#E0E0E0] text-[#1e293b] rounded-bl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap">{m.icerik}</p>
                      <p className={`text-[10px] mt-1 ${m.gonderen === 'admin' ? 'opacity-70' : 'text-gray-400'}`}>{m.olusturma}</p>
                    </div>
                  </div>
                ))}
                <div ref={altRef} />
              </div>

              <form onSubmit={gonder} className="border-t border-[#F0F4F8] p-3 flex items-center gap-2">
                <input
                  type="text"
                  value={metin}
                  onChange={e => setMetin(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E0E0E0] text-[#1e293b] text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                />
                <button
                  type="submit"
                  disabled={!metin.trim() || gonderiyor}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#0052CC] text-white disabled:opacity-40 hover:bg-[#003d99] transition-colors shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
