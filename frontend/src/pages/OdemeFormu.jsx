import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import API from '../config.js'
import axios from 'axios'

const BANKA = {
  hesapAdi:  'Adissa Enterprises Ltd.',
  banka:     'Garanti BBVA — Girne Şubesi',
  sube:      '1288',
  hesapNo:   '6295117',
  iban:      'TR05 0006 2001 2880 0006 2951 17',
}

function KopyalaButon({ metin }) {
  const [kopyalandi, setKopyalandi] = useState(false)
  const kopyala = () => {
    navigator.clipboard.writeText(metin)
    setKopyalandi(true)
    setTimeout(() => setKopyalandi(false), 2000)
  }
  return (
    <button
      onClick={kopyala}
      className="text-xs border px-2 py-0.5 rounded transition-colors ml-2 flex-shrink-0
        border-blue-300 text-blue-600 hover:border-blue-500 hover:text-blue-800"
    >
      {kopyalandi ? 'Kopyalandı' : 'Kopyala'}
    </button>
  )
}

function HavaleFormu({ ustaId }) {
  const [form, setForm]       = useState({ ad: '', email: '', tutar: '', referans: '' })
  const [yukleniyor, setYuk]  = useState(false)
  const [sonuc, setSonuc]     = useState(null) // null | 'basarili' | 'hata'
  const [mesaj, setMesaj]     = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setYuk(true)
    setSonuc(null)
    try {
      const { data } = await axios.post(`${API}/api/odeme/havale`, {
        usta_id:    ustaId,
        ad_soyad:   form.ad,
        email:      form.email,
        tutar:      form.tutar,
        referans_no: form.referans,
      })
      setSonuc('basarili')
      setMesaj(`Bildiriminiz alındı. Sipariş No: ${data.siparis_no}`)
    } catch (err) {
      setSonuc('hata')
      setMesaj(err.response?.data?.hata || 'Bir hata oluştu, tekrar deneyin.')
    } finally {
      setYuk(false)
    }
  }

  if (sonuc === 'basarili') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="font-bold text-green-800 text-base mb-1">Bildirim Alındı</p>
        <p className="text-green-700 text-sm">{mesaj}</p>
        <p className="text-gray-500 text-xs mt-3">Havale doğrulandıktan sonra hesabınız aktifleştirilir. İş saatleri içinde 1–4 saat.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Ad Soyad / Şirket Adı</label>
        <input
          type="text" required
          value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
          placeholder="Havaleyi yapan ad veya şirket"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">E-posta</label>
        <input
          type="email" required
          value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="ornek@mail.com"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Havale Tutarı (₺)</label>
        <input
          type="number" min="1" step="0.01" required
          value={form.tutar} onChange={e => setForm(f => ({ ...f, tutar: e.target.value }))}
          placeholder="0.00"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Dekont / İşlem Referans No <span className="text-gray-400 font-normal">(opsiyonel)</span>
        </label>
        <input
          type="text"
          value={form.referans} onChange={e => setForm(f => ({ ...f, referans: e.target.value }))}
          placeholder="Banka dekont numarası"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {sonuc === 'hata' && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{mesaj}</p>
      )}

      <button
        type="submit" disabled={yukleniyor}
        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
      >
        {yukleniyor ? 'Gönderiliyor...' : 'Havale Bildirimini Gönder'}
      </button>
    </form>
  )
}

export default function OdemeFormu() {
  const [params] = useSearchParams()
  const ustaId   = params.get('usta_id') || ''
  const [sekme, setSekme] = useState('havale')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <SEO baslik="Ödeme" url="/odeme" />
      <div className="w-full max-w-md">

        <div className="text-center mb-5">
          <span className="inline-block bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            256-bit SSL ile Güvenli Ödeme
          </span>
          <h1 className="text-xl font-bold text-gray-900 mt-3">Ödeme Yöntemi</h1>
        </div>

        {/* Sekme */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSekme('havale')}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors border
              ${sekme === 'havale'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}
          >
            Havale / EFT
          </button>
          <button
            onClick={() => setSekme('kart')}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors border relative
              ${sekme === 'kart'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}
          >
            Kredi Kartı
            <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Yakında
            </span>
          </button>
        </div>

        {/* Havale paneli */}
        {sekme === 'havale' && (
          <div className="space-y-4">

            {/* Banka bilgileri */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-900 px-5 py-3">
                <p className="text-white font-bold text-sm">Garanti BBVA — Havale Bilgileri</p>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { etiket: 'Hesap Adı',  deger: BANKA.hesapAdi,  kopyala: true  },
                  { etiket: 'Banka',      deger: BANKA.banka,     kopyala: false },
                  { etiket: 'Şube Kodu',  deger: BANKA.sube,      kopyala: false },
                  { etiket: 'Hesap No',   deger: BANKA.hesapNo,   kopyala: true  },
                ].map(row => (
                  <div key={row.etiket} className="flex items-center justify-between px-5 py-3">
                    <span className="text-xs text-gray-500 font-medium w-28">{row.etiket}</span>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-gray-900">{row.deger}</span>
                      {row.kopyala && <KopyalaButon metin={row.deger} />}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-5 py-3 bg-blue-50">
                  <span className="text-xs text-gray-500 font-medium w-28">IBAN</span>
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-blue-700 font-mono tracking-wide">{BANKA.iban}</span>
                    <KopyalaButon metin={BANKA.iban} />
                  </div>
                </div>
              </div>
            </div>

            {/* Uyarı */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
              <p className="font-semibold mb-1">Dikkat</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>Açıklama kısmına <strong>adınızı</strong> yazın.</li>
                <li>Havale sonrası aşağıdaki formu doldurun — hesabınız manuel aktifleştirilir.</li>
                <li>Aktivasyon: iş saatleri içinde <strong>1–4 saat</strong>.</li>
              </ul>
            </div>

            {/* Bildirim formu */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="font-bold text-gray-900 text-sm mb-4">Havale Yaptım — Bildir</p>
              <HavaleFormu ustaId={ustaId} />
            </div>

          </div>
        )}

        {/* Kredi kartı paneli */}
        {sekme === 'kart' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-lg font-bold text-gray-900 mb-2">Kredi Kartı ile Ödeme</p>
            <p className="text-gray-500 text-sm mb-4">Garanti BBVA 3D Secure entegrasyonu hazırlanıyor.</p>
            <span className="inline-block bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-4 py-2 rounded-full">
              Yapım Aşamasında
            </span>
            <p className="text-xs text-gray-400 mt-4">Şimdilik Havale / EFT yöntemini kullanabilirsiniz.</p>
            <button
              onClick={() => setSekme('havale')}
              className="mt-3 text-blue-600 text-sm font-semibold hover:underline block mx-auto"
            >
              Havale ile öde
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-5 space-x-2">
          <Link to="/iade-politikasi" className="hover:text-blue-600 underline">İade Politikası</Link>
          <span>·</span>
          <Link to="/mesafeli-satis" className="hover:text-blue-600 underline">Mesafeli Satış</Link>
          <span>·</span>
          <Link to="/iletisim" className="hover:text-blue-600 underline">İletişim</Link>
        </p>
      </div>
    </div>
  )
}
