import { useEffect, useState } from 'react'
import { Crown, Rocket, Sparkles, Star, CheckCircle, AlertCircle, Clock, Gift, Receipt, CreditCard, Eye } from 'lucide-react'
import { ustaAbonelikOzet, cardplusBaslat, promosyonBaslat } from '../../api'
import { PaylasimKartlari, panoyaKopyala } from '../../components/PaylasimKartlari'

const PROMO_BILGI = {
  profil: { baslik: 'Profilimi Öne Çıkar', aciklama: 'Arama sonuçlarında diğer ustaların önünde yer al.', ikon: Rocket, renk: 'violet' },
  hizmet: { baslik: 'Hizmetimi Öne Çıkar', aciklama: 'Seçtiğin hizmet kategorisinde öncelikli göster (hizmet başına).', ikon: Sparkles, renk: 'amber' },
  vitrin: { baslik: 'Ana Sayfa Vitrini', aciklama: 'Ana sayfadaki "En İyi Ustalarımız" bölümünde en üstte yer al.', ikon: Star, renk: 'sky' },
}
const RENK = {
  violet: { kart: 'border-violet-200 bg-violet-50/40', ikon: 'bg-violet-100 text-violet-600', chip: 'bg-violet-600 text-white border-violet-600', buton: 'bg-violet-600 hover:bg-violet-700' },
  amber:  { kart: 'border-amber-200 bg-amber-50/40',   ikon: 'bg-amber-100 text-amber-600',   chip: 'bg-amber-500 text-white border-amber-500',   buton: 'bg-amber-500 hover:bg-amber-600' },
  sky:    { kart: 'border-sky-200 bg-sky-50/40',       ikon: 'bg-sky-100 text-sky-600',       chip: 'bg-sky-600 text-white border-sky-600',       buton: 'bg-sky-600 hover:bg-sky-700' },
}
const PROFIL_DURUM = {
  yayinda: { metin: 'Yayında', sinif: 'bg-green-50 text-green-700 border-green-200', alt: 'Profilin aramalarda görünüyor.' },
  onay_bekliyor: { metin: 'Onay bekliyor', sinif: 'bg-amber-50 text-amber-700 border-amber-200', alt: 'Ekibimiz başvurunu inceledikten sonra yayına alınacak.' },
  pasif: { metin: 'Pasif', sinif: 'bg-gray-100 text-gray-600 border-gray-200', alt: 'Profilin aramalarda gizli.' },
}
const ODEME_DURUM = {
  basarili: ['Başarılı', 'bg-green-50 text-green-700'],
  bekliyor: ['Bekliyor', 'bg-amber-50 text-amber-700'],
  basarisiz: ['Başarısız', 'bg-red-50 text-red-600'],
}

const kalanGun = (iso) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))
const tarihTR = (iso) => new Date(iso).toLocaleDateString('tr-TR')

export default function UstaPanelAbonelik() {
  const [ozet, setOzet] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [islem, setIslem] = useState('')           // 'plan-3' / 'promo-profil' ...
  const [sureler, setSureler] = useState({ profil: 7, hizmet: 7, vitrin: 7 })
  const [hizmetId, setHizmetId] = useState('')
  const [otomatik, setOtomatik] = useState(false)

  useEffect(() => {
    ustaAbonelikOzet()
      .then(r => {
        setOzet(r.data)
        setHizmetId(String(r.data.promosyon.hizmetler?.[0]?.id || ''))
      })
      .catch(() => setHata('Bilgiler yüklenemedi. Sayfayı yenileyip tekrar deneyin.'))
      .finally(() => setYukleniyor(false))
  }, [])

  // Bankanın 3D Secure sayfasına yönlendiren otomatik-submit formu (kayıt sayfasıyla aynı yöntem)
  const odemeSayfasinaGit = (formHtml) => {
    document.open()
    document.write(formHtml)
    document.close()
  }

  const planAl = async (plan) => {
    setHata(''); setIslem(`plan-${plan.id}`)
    try {
      const { data } = await cardplusBaslat({ usta_id: ozet.usta_id, plan_id: plan.id, otomatik_yenileme: otomatik })
      odemeSayfasinaGit(data.form_html)
    } catch (e) {
      setHata(e.response?.data?.hata || 'Ödeme başlatılamadı, tekrar deneyin.')
      setIslem('')
    }
  }

  const promoAl = async (tur) => {
    setHata(''); setIslem(`promo-${tur}`)
    try {
      const { data } = await promosyonBaslat({
        tur, sure_gun: sureler[tur], ...(tur === 'hizmet' ? { kategori_id: parseInt(hizmetId) } : {}),
      })
      odemeSayfasinaGit(data.form_html)
    } catch (e) {
      setHata(e.response?.data?.hata || 'Ödeme başlatılamadı, tekrar deneyin.')
      setIslem('')
    }
  }

  if (yukleniyor) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  if (!ozet) return <div className="text-sm text-red-600">{hata || 'Bilgiler yüklenemedi.'}</div>

  const { profil, abonelik, planlar, promosyon, odemeler, referans } = ozet
  const durum = PROFIL_DURUM[profil.durum] || PROFIL_DURUM.pasif
  const enIyiPlan = planlar.reduce((a, b) => (b.tasarruf_yuzde > (a?.tasarruf_yuzde || 0) ? b : a), null)
  const aktifPromo = (tur, kategoriId = null) =>
    promosyon.aktif.find(p => p.tur === tur && (tur !== 'hizmet' || p.kategori_id === kategoriId))

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Abonelik ve Öne Çıkarma</h1>
        <p className="text-sm text-gray-500 mt-1">Aboneliğini, öne çıkarmalarını ve davet bonusunu buradan yönet.</p>
      </div>

      {hata && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border bg-red-50 text-red-600 border-red-200">
          <AlertCircle size={16} /> {hata}
        </div>
      )}

      {/* Durum özeti */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><Eye size={17} className="text-blue-600" /> Profil durumu</h2>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${durum.sinif}`}>{durum.metin}</span>
          </div>
          <p className="text-sm text-gray-500">{durum.alt}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><Crown size={17} className="text-blue-600" /> Mevcut abonelik</h2>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${abonelik.ucretli ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {abonelik.ucretli ? 'Aktif' : 'Aktif abonelik yok'}
            </span>
          </div>
          {abonelik.ucretli ? (
            <>
              <p className="text-sm text-gray-700"><span className="font-semibold">{abonelik.plan}</span> · {tarihTR(abonelik.plan_bitis)} tarihine kadar</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock size={12} /> {abonelik.kalan_gun} gün kaldı{abonelik.otomatik_yenileme ? ' · otomatik yenileme açık' : ''}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Ücretli üyeler arama listelerinde daha üst sırada yer alır. Aşağıdan bir plan seçebilirsin.</p>
          )}
        </div>
      </div>

      {/* 1. Plan seçimi */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">1. Aboneliğini seç</h2>
        <p className="text-sm text-gray-500 mb-4">Tüm planlar aynı özellikleri içerir. Süre uzadıkça aylık maliyet düşer. Fiyatlar USD'dir, ödeme güncel kurla TL olarak çekilir.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {planlar.map(p => {
            const populer = enIyiPlan && enIyiPlan.id === p.id && p.tasarruf_yuzde > 0
            return (
              <div key={p.id} className={`relative bg-white rounded-2xl border-2 p-5 flex flex-col ${populer ? 'border-blue-500 shadow-md' : 'border-gray-100 shadow-sm'}`}>
                {populer && <span className="absolute -top-3 left-4 text-[11px] font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-full">En avantajlı</span>}
                <h3 className="font-bold text-gray-900">{p.ad}</h3>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">${p.fiyat}</p>
                <p className="text-xs text-gray-500">${p.aylik_fiyat} / ay</p>
                {p.tasarruf_yuzde > 0 && <span className="self-start mt-2 text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">%{p.tasarruf_yuzde} tasarruf</span>}
                <div className="mt-auto pt-4">
                  <button type="button" disabled={!!islem} onClick={() => planAl(p)}
                    className={`w-full text-sm font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60 ${populer ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}>
                    {islem === `plan-${p.id}` ? 'Yönlendiriliyor...' : abonelik.ucretli ? 'Süreyi uzat' : 'Satın al'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <label className="flex items-start gap-2 mt-4 text-xs text-gray-600 cursor-pointer max-w-xl">
          <input type="checkbox" checked={otomatik} onChange={e => setOtomatik(e.target.checked)} className="mt-0.5 accent-blue-600" />
          <span><CreditCard size={12} className="inline mr-1" />Kartımı güvenle kaydet, aboneliğim süre bitince otomatik yenilensin (istediğin zaman kapatabilirsin). Süresi dolmamış aboneliğe eklenen süre mevcut bitiş tarihinin üstüne yazılır.</span>
        </label>
      </section>

      {/* 2. Öne çıkarma */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">2. İşletmeni öne çıkar</h2>
        <p className="text-sm text-gray-500 mb-4">
          Öne çıkarmalar abonelikten ayrıdır ve isteğe bağlıdır. Süreyi sen seçersin; ardışık alımlarda süre mevcut bitişin üstüne eklenir.
          {profil.durum !== 'yayinda' && <span className="text-amber-700 font-medium"> Profilin yayına alındıktan sonra satın alınabilir.</span>}
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {['profil', 'hizmet', 'vitrin'].map(tur => {
            const b = PROMO_BILGI[tur]; const r = RENK[b.renk]; const Ikon = b.ikon
            const fiyatlar = promosyon.fiyatlar[tur]
            const secili = fiyatlar.find(f => f.sure_gun === sureler[tur]) || fiyatlar[0]
            const aktif = aktifPromo(tur, tur === 'hizmet' ? parseInt(hizmetId) : null)
            return (
              <div key={tur} className={`rounded-2xl border p-5 flex flex-col ${r.kart}`}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${r.ikon}`}><Ikon size={18} /></span>
                  <h3 className="font-bold text-gray-900 text-sm">{b.baslik}</h3>
                </div>
                <p className="text-xs text-gray-600 mb-3">{b.aciklama}</p>

                {tur === 'hizmet' && (
                  <select value={hizmetId} onChange={e => setHizmetId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs mb-3 bg-white">
                    {promosyon.hizmetler.map(h => <option key={h.id} value={h.id}>{h.ad}</option>)}
                  </select>
                )}

                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Süre seç</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {fiyatlar.map(f => (
                    <button key={f.sure_gun} type="button" onClick={() => setSureler(s => ({ ...s, [tur]: f.sure_gun }))}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${sureler[tur] === f.sure_gun ? r.chip : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}>
                      {f.sure_gun} gün · ${f.fiyat_usd}
                    </button>
                  ))}
                </div>

                {aktif && (
                  <p className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-2">
                    <CheckCircle size={13} /> Aktif — {kalanGun(aktif.bitis)} gün kaldı ({tarihTR(aktif.bitis)})
                  </p>
                )}
                <button type="button" onClick={() => promoAl(tur)}
                  disabled={!!islem || profil.durum !== 'yayinda' || (tur === 'hizmet' && !hizmetId)}
                  className={`mt-auto w-full text-white text-sm font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 ${r.buton}`}>
                  {islem === `promo-${tur}` ? 'Yönlendiriliyor...' : `${aktif ? 'Süreyi uzat' : 'Satın al'} · $${secili.fiyat_usd}`}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. Paylaşım ve davet */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">3. Büyü ve bonus kazan</h2>
        <PaylasimKartlari ozet={ozet} />
        <div className="mt-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Gift size={17} className="text-emerald-600" /> Davet bonusu</h3>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-emerald-700 leading-none">{referans.kazanilan_gun}</p>
              <p className="text-xs text-emerald-700">kazanılan toplam bonus gün</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Davet bağlantınla kayıt olan usta ve sen, ikiniz de ücretli abonelik satın aldığınızda ikinize <b>{referans.bonus_gun} gün</b> eklenir.
            Kimin önce abone olduğu fark etmez. Kodun: <button type="button" onClick={() => panoyaKopyala(referans.kod)} className="font-mono font-bold text-emerald-800 hover:underline">{referans.kod}</button>
          </p>
          {referans.davetler.length === 0 ? (
            <p className="text-sm text-gray-500">Henüz davet ettiğin usta yok.</p>
          ) : (
            <ul className="divide-y divide-emerald-100 bg-white rounded-xl border border-emerald-100">
              {referans.davetler.map((d, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-800">{d.ad} <span className="text-xs text-gray-400">· {d.tarih}</span></span>
                  {d.durum === 'hak_kazandi'
                    ? <span className="text-xs font-bold text-green-700">+{d.bonus_gun} gün kazanıldı</span>
                    : <span className="text-xs font-medium text-gray-500">Abonelik bekleniyor</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 4. Ödeme geçmişi */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2"><Receipt size={18} className="text-gray-400" /> 4. Ödeme geçmişi</h2>
        {odemeler.length === 0 ? (
          <p className="text-sm text-gray-500 bg-white rounded-2xl border border-gray-100 p-5">Henüz ödeme yok.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3">Tarih</th><th className="px-4 py-3">Ürün</th><th className="px-4 py-3">Tutar</th><th className="px-4 py-3">Durum</th>
                </tr>
              </thead>
              <tbody>
                {odemeler.map(o => {
                  const [etiket, sinif] = ODEME_DURUM[o.durum] || [o.durum, 'bg-gray-100 text-gray-600']
                  return (
                    <tr key={o.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{o.tarih}</td>
                      <td className="px-4 py-3 text-gray-800">{o.tur === 'promosyon' ? 'Öne çıkarma' : 'Abonelik'}<span className="block text-xs text-gray-400">{o.siparis_no}</span></td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{Number(o.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {o.para_birimi === 'TRY' ? '₺' : o.para_birimi}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sinif}`}>{etiket}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
