import { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { MapPin, Phone, MessageCircle, Star, Clock, ArrowLeft, Image, FileText, CheckCircle2, X, Calendar, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { KAT_EN, KAT_RU } from '../locales/katAdlari'
import { ustaDetay, yorumEkle, benimBilgilerim, isTalebiGonder } from '../api'

export default function UstaDetay() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const [usta, setUsta] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kullanici, setKullanici] = useState(null)
  const [yorumForm, setYorumForm] = useState({ musteri_adi: '', puan: 5, yorum: '' })
  const [yorumGonderildi, setYorumGonderildi] = useState(false)
  const [teklifModal, setTeklifModal] = useState(false)
  const [teklifGonderildi, setTeklifGonderildi] = useState(false)
  const [teklifYukleniyor, setTeklifYukleniyor] = useState(false)
  const [teklifHata, setTeklifHata] = useState('')
  const [teklifForm, setTeklifForm] = useState({
    musteri_ad: '', musteri_telefon: '', musteri_adres: '',
    baslik: '', aciklama: '', tercih_tarih: ''
  })

  const logIletisim = (tur) => {
    axios.post('http://localhost:5000/api/analitik/iletisim', { usta_id: parseInt(id), tur }, { withCredentials: false })
      .catch(() => {})
  }

  useEffect(() => {
    ustaDetay(id)
      .then(r => { setUsta(r.data); logIletisim('goruntule') })
      .catch(() => {})
      .finally(() => setYukleniyor(false))
    benimBilgilerim().then(r => setKullanici(r.data.kullanici)).catch(() => {})
  }, [id])

  const teklifAlTikla = () => {
    logIletisim('teklif')
    setTeklifModal(true)
  }

  const teklifGonder = async (e) => {
    e.preventDefault()
    setTeklifHata('')
    setTeklifYukleniyor(true)
    try {
      await isTalebiGonder(id, teklifForm)
      setTeklifGonderildi(true)
    } catch (err) {
      setTeklifHata(err.response?.data?.hata || 'Talep gönderilemedi. Tekrar deneyin.')
    } finally {
      setTeklifYukleniyor(false)
    }
  }

  const teklifKapat = () => {
    setTeklifModal(false)
    setTeklifGonderildi(false)
    setTeklifHata('')
    setTeklifForm({ musteri_ad: '', musteri_telefon: '', musteri_adres: '', baslik: '', aciklama: '', tercih_tarih: '' })
  }

  const yorumGonder = async (e) => {
    e.preventDefault()
    try {
      await yorumEkle(id, yorumForm)
      setYorumGonderildi(true)
    } catch {}
  }

  const Yildizlar = ({ puan, tikla = null, boyut = 16 }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={boyut}
          onClick={() => tikla?.(i + 1)}
          className={`${tikla ? 'cursor-pointer' : ''} transition-colors ${
            i < Math.round(puan) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
          }`} />
      ))}
    </div>
  )

  if (yukleniyor) return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="h-48 bg-gray-100 rounded-2xl animate-pulse mb-4" />
      <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  )

  if (!usta) return (
    <div className="text-center py-24 text-gray-400">{t('ustaDetay.ustaBulunamadi')}</div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> {t('ustaDetay.geri')}
      </button>

      {/* Profil kartı */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden mb-5">
        <div className="h-2 bg-gradient-to-r from-orange-500 to-amber-400" />
        <div className="p-7">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
              {usta.ad.charAt(0).toUpperCase()}
            </div>

            {/* Bilgiler */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{usta.ad_soyad}</h1>
              <span className="inline-block mt-1 text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                {i18n.language === 'en' ? (KAT_EN[usta.kategori] || usta.kategori)
                : i18n.language === 'ru' ? (KAT_RU[usta.kategori] || usta.kategori)
                : usta.kategori}
              </span>
              <div className="flex items-center gap-2 mt-3">
                <Yildizlar puan={usta.puan} />
                <span className="text-sm text-gray-500">
                  {usta.puan > 0 ? usta.puan.toFixed(1) : t('ustaDetay.yorumYok')} · {usta.yorum_sayisi} {t('ustaDetay.yorum')}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  {usta.ilce ? `${usta.ilce}, ` : ''}{usta.sehir}
                </span>
                {usta.deneyim_yil > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {usta.deneyim_yil} {t('ustaDetay.yilDeneyim')}
                  </span>
                )}
              </div>
            </div>

            {/* İletişim */}
            <div className="flex flex-col gap-2.5 w-full sm:w-auto">
              <button
                onClick={teklifAlTikla}
                className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3 rounded-xl transition-colors shadow-sm">
                <FileText size={16} />
                {t('common.hemenTeklif')}
              </button>
              <a href={`tel:${usta.telefon}`}
                onClick={() => logIletisim('ara')}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                <Phone size={16} />
                {usta.telefon}
              </a>
              {usta.whatsapp && (
                <a href={`https://wa.me/${usta.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                  onClick={() => logIletisim('whatsapp')}
                  className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Açıklama */}
          {usta.aciklama && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">{t('ustaDetay.hakkinda')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{usta.aciklama}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fotoğraflar */}
      {usta.fotograflar?.length > 0 && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 mb-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Image size={18} className="text-gray-400" />
            {t('ustaDetay.isFotograflari')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {usta.fotograflar.map(f => (
              <img key={f.id} src={`http://localhost:5000${f.url}`} alt={t('ustaDetay.isFotograflari')}
                className="w-full h-40 object-cover rounded-xl border border-gray-100" />
            ))}
          </div>
        </div>
      )}

      {/* Yorumlar */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 mb-5">
        <h2 className="font-bold text-gray-900 mb-5">
          {t('ustaDetay.musteriYorumlari')}
          {usta.yorumlar?.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({usta.yorumlar.length})</span>
          )}
        </h2>
        {!usta.yorumlar?.length ? (
          <p className="text-gray-400 text-sm py-4 text-center">{t('ustaDetay.henuzYorum')}</p>
        ) : (
          <div className="space-y-5">
            {usta.yorumlar.map(y => (
              <div key={y.id} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 text-sm">{y.musteri_adi}</span>
                  <span className="text-gray-400 text-xs">{y.tarih}</span>
                </div>
                <Yildizlar puan={y.puan} boyut={13} />
                {y.yorum && <p className="text-gray-600 text-sm mt-2 leading-relaxed">{y.yorum}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Yorum formu */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
        <h2 className="font-bold text-gray-900 mb-5">{t('ustaDetay.yorumYap')}</h2>
        {yorumGonderildi ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={24} className="text-emerald-500" />
            </div>
            <p className="font-semibold text-emerald-700">{t('ustaDetay.yorumAlindi')}</p>
          </div>
        ) : (
          <form onSubmit={yorumGonder} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('ustaDetay.adinizSoyadiniz')}</label>
              <input type="text" required value={yorumForm.musteri_adi}
                onChange={e => setYorumForm(f => ({ ...f, musteri_adi: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                placeholder={t('ustaDetay.adinizSoyadiniz')} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('ustaDetay.puaniniz')}</label>
              <Yildizlar puan={yorumForm.puan} tikla={(p) => setYorumForm(f => ({ ...f, puan: p }))} boyut={28} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('ustaDetay.yorumunuz')}</label>
              <textarea value={yorumForm.yorum}
                onChange={e => setYorumForm(f => ({ ...f, yorum: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                rows={3} placeholder={t('ustaDetay.deneyimPaylas')} />
            </div>
            <button type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm">
              {t('ustaDetay.yorumGonder')}
            </button>
          </form>
        )}
      </div>
      {/* İş Talebi / Teklif Modal */}
      {teklifModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-t-2xl">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">İş Talebi Gönder</h3>
                <p className="text-xs text-gray-700 mt-0.5 font-medium">{usta.ad_soyad} · {usta.kategori}</p>
              </div>
              <button onClick={teklifKapat}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/50 transition">
                <X size={16} className="text-gray-800" />
              </button>
            </div>

            <div className="p-6">
              {teklifGonderildi ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-200">
                    <CheckCircle2 size={30} className="text-emerald-500" />
                  </div>
                  <p className="font-extrabold text-gray-900 text-lg mb-2">Talebiniz İletildi!</p>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-700">{usta.ad_soyad}</span> en kısa sürede sizinle iletişime geçecektir.
                  </p>
                  <button onClick={teklifKapat}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-3 rounded-xl text-sm transition">
                    Tamam
                  </button>
                </div>
              ) : (
                <form onSubmit={teklifGonder} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Adınız Soyadınız *</label>
                      <div className="relative">
                        <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={teklifForm.musteri_ad}
                          onChange={e => setTeklifForm(f => ({ ...f, musteri_ad: e.target.value }))}
                          required placeholder="Adınız"
                          className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Telefon *</label>
                      <div className="relative">
                        <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={teklifForm.musteri_telefon}
                          onChange={e => setTeklifForm(f => ({ ...f, musteri_telefon: e.target.value }))}
                          required placeholder="+90 548 000 0000"
                          className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">İş Konusu / Başlık *</label>
                    <input value={teklifForm.baslik}
                      onChange={e => setTeklifForm(f => ({ ...f, baslik: e.target.value }))}
                      required placeholder={`Örn: Elektrik arızası, Su tesisatı tamiri...`}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Adres</label>
                    <div className="relative">
                      <MapPin size={13} className="absolute left-3 top-3 text-gray-400" />
                      <input value={teklifForm.musteri_adres}
                        onChange={e => setTeklifForm(f => ({ ...f, musteri_adres: e.target.value }))}
                        placeholder="Mahalle, Sokak, Ev No..."
                        className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-400" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Açıklama</label>
                    <textarea value={teklifForm.aciklama}
                      onChange={e => setTeklifForm(f => ({ ...f, aciklama: e.target.value }))}
                      placeholder="Sorunuzu veya ihtiyacınızı detaylıca anlatın..."
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                      <Calendar size={12} /> Tercih Ettiğiniz Tarih/Saat
                    </label>
                    <input value={teklifForm.tercih_tarih}
                      onChange={e => setTeklifForm(f => ({ ...f, tercih_tarih: e.target.value }))}
                      placeholder="Örn: Yarın öğleden sonra, 20 Nisan sabahı..."
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>

                  {teklifHata && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                      {teklifHata}
                    </div>
                  )}

                  <button type="submit" disabled={teklifYukleniyor}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-200 text-gray-900 font-extrabold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2">
                    {teklifYukleniyor ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700" /> Gönderiliyor...</>
                    ) : (
                      <><FileText size={16} /> Talebi Gönder</>
                    )}
                  </button>
                  <p className="text-xs text-center text-gray-400">Giriş yapmadan da talep gönderebilirsiniz</p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
