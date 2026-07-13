import { useState, useEffect } from 'react'
import axios from 'axios'
import { Send, Bell, Users, User, CheckCircle, XCircle, Clock, Smartphone } from 'lucide-react'
import API from '../../config.js'

export default function AdminBildirimler() {
  const [form, setForm] = useState({ baslik: '', icerik: '', ekran: '', hedef: 'hepsi' })
  const [gonderiyor, setGonderiyor] = useState(false)
  const [sonuc, setSonuc] = useState(null)
  const [gecmis, setGecmis] = useState([])
  const [gecmisYukleniyor, setGecmisYukleniyor] = useState(true)
  const [tokenSayisi, setTokenSayisi] = useState(null)

  useEffect(() => {
    gecmisGetir()
    tokenSayisiGetir()
  }, [])

  const tokenSayisiGetir = () => {
    axios.get(`${API}/api/fcm/token-sayisi`, { withCredentials: true })
      .then(r => setTokenSayisi(r.data.sayi ?? 0))
      .catch(() => {})
  }

  const gecmisGetir = () => {
    setGecmisYukleniyor(true)
    axios.get(`${API}/api/fcm/bildirim-gecmisi`, { withCredentials: true })
      .then(r => setGecmis(r.data.bildirimler || []))
      .catch(() => setGecmis([]))
      .finally(() => setGecmisYukleniyor(false))
  }

  const gonder = async (e) => {
    e.preventDefault()
    if (!form.baslik.trim() || !form.icerik.trim()) return
    setGonderiyor(true)
    setSonuc(null)
    try {
      const payload = {
        baslik: form.baslik.trim(),
        icerik: form.icerik.trim(),
        ekran: form.ekran.trim(),
      }
      const r = await axios.post(`${API}/api/fcm/bildirim-gonder`, payload, { withCredentials: true })
      setSonuc({ ok: true, ...r.data })
      setForm(f => ({ ...f, baslik: '', icerik: '', ekran: '' }))
      gecmisGetir()
    } catch (err) {
      setSonuc({ ok: false, hata: err.response?.data?.hata || 'Gönderim başarısız' })
    }
    setGonderiyor(false)
  }

  const ekranSecenekleri = [
    { value: '', label: 'Yönlendirme yok' },
    { value: 'abonelik', label: 'Abonelik sayfası' },
    { value: 'profil', label: 'Profil sayfası' },
    { value: 'talepler', label: 'Talepler sayfası' },
    { value: 'anasayfa', label: 'Ana sayfa' },
  ]

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mobil Bildirimler</h1>
          <p className="text-[#6a7ea0] text-sm mt-1">FCM push notification gönder</p>
        </div>
        {tokenSayisi !== null && (
          <div className="flex items-center gap-2 bg-[#121929] border border-[#1a2744] rounded-xl px-4 py-2.5">
            <Smartphone size={16} className="text-[#4a90d9]" />
            <span className="text-white font-bold text-lg">{tokenSayisi}</span>
            <span className="text-[#6a7ea0] text-sm">kayıtlı cihaz</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bildirim Gönder */}
        <div className="bg-[#0d1322] border border-[#1a2744] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Bell size={18} className="text-[#4a90d9]" />
            <h2 className="text-white font-semibold">Bildirim Gönder</h2>
          </div>

          <form onSubmit={gonder} className="space-y-4">
            {/* Başlık */}
            <div>
              <label className="text-[#6a7ea0] text-xs font-medium uppercase tracking-wider block mb-1.5">
                Bildirim Başlığı *
              </label>
              <input
                type="text"
                value={form.baslik}
                onChange={e => setForm(f => ({ ...f, baslik: e.target.value }))}
                placeholder="Örn: Üyeliğiniz yenilendi!"
                maxLength={100}
                className="w-full bg-[#121929] border border-[#1a2744] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4a90d9] placeholder-[#3d5280]"
              />
              <div className="text-right text-[#3d5280] text-xs mt-1">{form.baslik.length}/100</div>
            </div>

            {/* İçerik */}
            <div>
              <label className="text-[#6a7ea0] text-xs font-medium uppercase tracking-wider block mb-1.5">
                İçerik *
              </label>
              <textarea
                value={form.icerik}
                onChange={e => setForm(f => ({ ...f, icerik: e.target.value }))}
                placeholder="Bildirim mesajını buraya yazın..."
                maxLength={250}
                rows={3}
                className="w-full bg-[#121929] border border-[#1a2744] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4a90d9] placeholder-[#3d5280] resize-none"
              />
              <div className="text-right text-[#3d5280] text-xs mt-1">{form.icerik.length}/250</div>
            </div>

            {/* Yönlendirme */}
            <div>
              <label className="text-[#6a7ea0] text-xs font-medium uppercase tracking-wider block mb-1.5">
                Uygulama Yönlendirmesi
              </label>
              <select
                value={form.ekran}
                onChange={e => setForm(f => ({ ...f, ekran: e.target.value }))}
                className="w-full bg-[#121929] border border-[#1a2744] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4a90d9]"
              >
                {ekranSecenekleri.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Önizleme */}
            {(form.baslik || form.icerik) && (
              <div className="bg-[#121929] border border-[#243358] rounded-xl p-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-semibold truncate">
                      {form.baslik || 'Başlık'}
                    </div>
                    <div className="text-[#6a7ea0] text-xs mt-0.5 line-clamp-2">
                      {form.icerik || 'İçerik'}
                    </div>
                  </div>
                </div>
                <div className="text-[#3d5280] text-xs mt-2 text-right">Önizleme</div>
              </div>
            )}

            {/* Sonuç */}
            {sonuc && (
              <div className={`rounded-xl px-4 py-3 flex items-center gap-2 text-sm ${
                sonuc.ok
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {sonuc.ok
                  ? <><CheckCircle size={15} /> {sonuc.basarili} cihaza gönderildi, {sonuc.basarisiz || 0} başarısız</>
                  : <><XCircle size={15} /> {sonuc.hata}</>
                }
              </div>
            )}

            <button
              type="submit"
              disabled={gonderiyor || !form.baslik.trim() || !form.icerik.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[#0052CC] hover:bg-[#003d99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              {gonderiyor
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gönderiliyor...</>
                : <><Send size={15} /> Tüm Cihazlara Gönder</>
              }
            </button>
          </form>
        </div>

        {/* Geçmiş */}
        <div className="bg-[#0d1322] border border-[#1a2744] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={18} className="text-[#6a7ea0]" />
            <h2 className="text-white font-semibold">Gönderim Geçmişi</h2>
          </div>

          {gecmisYukleniyor ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-[#121929] rounded-xl h-16" />
              ))}
            </div>
          ) : gecmis.length === 0 ? (
            <div className="text-center py-12 text-[#3d5280]">
              <Bell size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Henüz bildirim gönderilmedi</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {gecmis.map(b => (
                <div key={b.id} className="bg-[#121929] border border-[#1a2744] rounded-xl px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{b.baslik}</div>
                      <div className="text-[#6a7ea0] text-xs mt-0.5 line-clamp-1">{b.icerik}</div>
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                      b.gonderildi
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}>
                      {b.gonderildi ? 'Gönderildi' : 'Başarısız'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[#3d5280] text-xs">{b.tur}</span>
                    <span className="text-[#3d5280] text-xs">•</span>
                    <span className="text-[#3d5280] text-xs">{b.olusturma}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
