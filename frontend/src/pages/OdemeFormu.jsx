import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SEO from '../components/SEO'
import API from '../config.js'
import axios from 'axios'
import { Lock, CreditCard, Globe } from 'lucide-react'

const PARA_BIRIMLERI = [
  { kod: 'TRY', sembol: '₺', ad: 'Türk Lirası' },
  { kod: 'USD', sembol: '$', ad: 'ABD Doları' },
  { kod: 'EUR', sembol: '€', ad: 'Euro' },
]

function kartFormat(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

export default function OdemeFormu() {
  const [params] = useSearchParams()
  const ustaId  = params.get('usta_id') || ''
  const planId  = params.get('plan_id') || ''
  const tutarP  = params.get('tutar')   || ''

  const [para, setPara]       = useState('TRY')
  const [tutar, setTutar]     = useState(tutarP)
  const [kart, setKart]       = useState({ no: '', ay: '', yil: '', isim: '', cvv: '' })
  const [yukleniyor, setYuk]  = useState(false)
  const [hata, setHata]       = useState('')

  const secili = PARA_BIRIMLERI.find(p => p.kod === para)

  const submit = async (e) => {
    e.preventDefault()
    setHata('')
    setYuk(true)
    try {
      const { data } = await axios.post(`${API}/api/odeme/baslat`, {
        usta_id:     ustaId,
        plan_id:     planId,
        tutar:       tutar,
        para_birimi: para,
        kart_no:     kart.no.replace(/\s/g, ''),
        kart_ay:     kart.ay,
        kart_yil:    kart.yil,
        kart_isim:   kart.isim,
        cvv:         kart.cvv,
        email:       params.get('email') || '',
      })
      // 3D Secure sayfasına yönlendir
      const w = window.open('', '_self')
      w.document.open()
      w.document.write(data.form_html)
      w.document.close()
    } catch (err) {
      setHata(err.response?.data?.hata || 'Bir hata oluştu, lütfen tekrar deneyin.')
      setYuk(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <SEO baslik="Güvenli Ödeme" url="/odeme" />
      <div className="w-full max-w-md">

        <div className="flex items-center justify-center gap-2 mb-6">
          <Lock size={18} className="text-green-600" />
          <span className="text-sm font-semibold text-gray-700">256-bit SSL ile Güvenli Ödeme</span>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <CreditCard size={20} className="text-blue-600" /> Ödeme
          </h1>
          <p className="text-xs text-gray-500 mb-6">Kart bilgileriniz sunucularımızda saklanmaz.</p>

          <form onSubmit={submit} className="space-y-4">

            {/* Para birimi */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                <Globe size={12} className="inline mr-1" />Para Birimi
              </label>
              <div className="flex gap-2">
                {PARA_BIRIMLERI.map(p => (
                  <button
                    key={p.kod}
                    type="button"
                    onClick={() => setPara(p.kod)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors
                      ${para === p.kod
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                      }`}
                  >
                    {p.sembol} {p.kod}
                  </button>
                ))}
              </div>
            </div>

            {/* Tutar */}
            {!tutarP && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tutar ({secili?.sembol})</label>
                <input
                  type="number" min="1" step="0.01" required
                  value={tutar} onChange={e => setTutar(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {tutarP && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">Ödenecek Tutar</span>
                <span className="text-lg font-bold text-blue-700">{secili?.sembol}{tutarP}</span>
              </div>
            )}

            {/* Kart no */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kart Numarası</label>
              <input
                type="text" inputMode="numeric" required
                value={kart.no}
                onChange={e => setKart(k => ({ ...k, no: kartFormat(e.target.value) }))}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Kart sahibi */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kart Üzerindeki İsim</label>
              <input
                type="text" required
                value={kart.isim}
                onChange={e => setKart(k => ({ ...k, isim: e.target.value.toUpperCase() }))}
                placeholder="AD SOYAD"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Son kullanma + CVV */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ay</label>
                <input
                  type="text" inputMode="numeric" required maxLength={2}
                  value={kart.ay}
                  onChange={e => setKart(k => ({ ...k, ay: e.target.value.replace(/\D/g, '').slice(0,2) }))}
                  placeholder="AA"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Yıl</label>
                <input
                  type="text" inputMode="numeric" required maxLength={2}
                  value={kart.yil}
                  onChange={e => setKart(k => ({ ...k, yil: e.target.value.replace(/\D/g, '').slice(0,2) }))}
                  placeholder="YY"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">CVV</label>
                <input
                  type="password" inputMode="numeric" required maxLength={4}
                  value={kart.cvv}
                  onChange={e => setKart(k => ({ ...k, cvv: e.target.value.replace(/\D/g, '').slice(0,4) }))}
                  placeholder="•••"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {hata && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{hata}</p>
            )}

            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {yukleniyor ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Lock size={14} />
              )}
              {yukleniyor ? '3D Secure sayfasına yönlendiriliyorsunuz...' : `Güvenli Öde — ${secili?.sembol}${tutar || '0'}`}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-4">
            <img src="/images/garanti-bbva.svg" alt="Garanti BBVA" className="h-5 opacity-60" />
            <img src="/images/visa.svg" alt="Visa" className="h-4 opacity-60" />
            <img src="/images/mastercard.svg" alt="Mastercard" className="h-5 opacity-60" />
            <img src="/images/3dsecure.svg" alt="3D Secure" className="h-5 opacity-60" />
          </div>

          <p className="text-center text-xs text-gray-400 mt-3">
            Ödeme işleminiz Garanti BBVA Sanal POS altyapısı üzerinden güvenle gerçekleştirilir.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          <a href="/iade-politikasi" className="hover:text-blue-600 underline">İade Politikası</a>
          {' · '}
          <a href="/mesafeli-satis" className="hover:text-blue-600 underline">Mesafeli Satış Sözleşmesi</a>
          {' · '}
          <a href="/gizlilik" className="hover:text-blue-600 underline">Gizlilik</a>
        </p>
      </div>
    </div>
  )
}
