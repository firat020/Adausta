import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? 'http://localhost:5000' : 'https://adausta.com')

const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname
      if (path.startsWith('/usta/panel'))    window.location.href = '/usta/giris'
      else if (path.startsWith('/sirket/panel')) window.location.href = '/sirket/giris'
      else if (path.startsWith('/admin'))    window.location.href = '/admin/login'
      else if (path.startsWith('/musteri/panel')) window.location.href = '/giris'
    }
    return Promise.reject(error)
  }
);

// Kategoriler & şehirler
export const kategorileriGetir = () => api.get('/kategoriler/');
export const sehirleriGetir = () => api.get('/kategoriler/sehirler');

// Ödeme
export const planlariGetir = () => api.get('/odeme/planlar');
export const cardplusBaslat = (data) => api.post('/odeme/cardplus/baslat', data);
export const promosyonBaslat = (data) => api.post('/odeme/cardplus/promosyon/baslat', data);
export const ustaAbonelikOzet = () => api.get('/usta/abonelik/ozet');

// Ustalar
export const ustaListele = (params) => api.get('/ustalar/', { params });
export const sonYorumlariGetir = (limit = 3) => api.get('/ustalar/son-yorumlar', { params: { limit } });
export const ustaDetay = (id, params) => api.get(`/ustalar/${id}`, { params });
export const ustaKayit = (data) => api.post('/ustalar/kayit', data);
export const enYakinUstalar = (params) => api.get('/ustalar/en-yakin', { params });
export const yorumEkle = (id, data) => api.post(`/ustalar/${id}/yorum`, data);
export const isTalebiGonder = (ustaId, data) => api.post(`/ustalar/${ustaId}/is-talebi`, data);
// Faz 3 Görev 13 — "Hizmet Talep Et": toplu talep dağıtımı (tek seferde eşleşen tüm ustalara)
export const topluTalepGonder = (data) => api.post('/musteri/toplu-talep', data);
// Faz 3 Görev 15 — ana sayfa güven istatistik barı
export const istatistikleriGetir = () => api.get('/istatistikler');
export const ustaSahiplenKodGonder = (id, telefon) => api.post(`/ustalar/${id}/sahiplen/kod-gonder`, { telefon });
export const ustaSahiplenDogrula = (id, data) => api.post(`/ustalar/${id}/sahiplen/dogrula`, data);
export const ustaSikayetGonder = (id, data) => api.post(`/ustalar/${id}/sikayet`, data);

// Auth
export const giris = (data) => api.post('/auth/giris', data);
export const kayit = (data) => api.post('/auth/kayit', data);
export const cikis = () => api.post('/auth/cikis');
export const benimBilgilerim = () => api.get('/auth/ben');
export const sifreSifirlaKodGonder = (email) => api.post('/auth/sifre-sifirla/kod-gonder', { email });
export const sifreSifirlaDogrula = (data) => api.post('/auth/sifre-sifirla/dogrula', data);

// Reklamlar
export const reklamlariGetir = (params) => api.get('/reklamlar/', { params });
export const reklamTikla = (id) => api.post(`/reklamlar/${id}/tikla`);

// ── Usta Paneli ──────────────────────────────────────────
export const ustaPanelDashboard = () => api.get('/usta/panel');
export const ustaPanelProfil = () => api.get('/usta/profil');
export const ustaPanelProfilGuncelle = (data) => api.put('/usta/profil', data);
export const ustaAbonelikGetir = () => api.get('/usta/abonelik');
export const ustaOtomatikYenilemeAyarla = (acik) => api.post('/usta/abonelik/otomatik-yenileme', { acik });
export const ustaAbonelikDuraklat = () => api.post('/usta/abonelik/duraklat');
export const ustaAbonelikDevamEttir = () => api.post('/usta/abonelik/devam-ettir');
export const ustaPanelFotografYukle = (formData) =>
  api.post('/usta/profil/fotograf', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const ustaPanelFotografSil = (fid) => api.delete(`/usta/profil/fotograf/${fid}`);
export const ustaPanelLogoYukle = (formData) =>
  api.post('/usta/profil/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const ustaPanelLogoSil = () => api.delete('/usta/profil/logo');
export const ustaPanelKapakYukle = (formData) =>
  api.post('/usta/profil/kapak', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const ustaPanelKapakSil = () => api.delete('/usta/profil/kapak');
export const ustaPanelMusaitlik = (musaitlik) => api.put('/usta/musaitlik', { musaitlik });
export const ustaPanelIsTalepleri = (params) => api.get('/usta/is-talepleri', { params });
export const ustaPanelTalepGuncelle = (id, data) => api.put(`/usta/is-talepleri/${id}`, data);
export const ustaPanelMusteriler = () => api.get('/usta/musteriler');
export const ustaPanelIstatistikler = (aralik) => api.get('/usta/istatistikler', { params: { aralik } });
export const ustaPromosyonPerformans = () => api.get('/usta/promosyon-performans');
export const ustaHizmetlerGetir = () => api.get('/usta/hizmetlerim');
export const ustaHizmetlerKaydet = (data) => api.put('/usta/hizmetlerim', data);
export const ustaAyarlarGetir = () => api.get('/usta/ayarlar');
export const ustaAyarlarKaydet = (bildirim, tercih_dil) => api.put('/usta/ayarlar', { bildirim, ...(tercih_dil !== undefined ? { tercih_dil } : {}) });
export const ustaSifreDegistir = (data) => api.post('/usta/sifre-degistir', data);
export const ustaHesapKapat = (sifre) => api.post('/usta/hesap-kapat', { sifre });
export const ustaPanelYorumlar = () => api.get('/usta/yorumlar');
export const ustaPanelYorumCevapla = (id, cevap) => api.post(`/usta/yorumlar/${id}/cevap`, { cevap });
export const ustaPanelMesajlar = () => api.get('/usta/mesajlar');
export const ustaPanelMesajGonder = (icerik) => api.post('/usta/mesajlar', { icerik });
export const ustaPanelMesajOkunmamis = () => api.get('/usta/mesajlar/okunmamis-sayisi');
export const ustaPanelBelgeler = () => api.get('/usta/belgeler');
export const ustaPanelBelgeYukle = (formData) =>
  api.post('/usta/belgeler', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const ustaPanelBelgeSil = (id) => api.delete(`/usta/belgeler/${id}`);

// ── Usta Paneli: İş Talebi Mesajlaşması (Faz 3 Görev 12 — thread = bir IsTalebi) ──
export const ustaPanelTalepMesajlari = (tid) => api.get(`/usta/is-talepleri/${tid}/mesajlar`);
export const ustaPanelTalepMesajGonder = (tid, icerik) => api.post(`/usta/is-talepleri/${tid}/mesajlar`, { icerik });
export const ustaPanelTalepMesajOkunmamis = () => api.get('/usta/is-talepleri/mesaj-okunmamis-sayisi');

// ── Usta Paneli: Yeni hizmet öner (Faz 3 Görev 14) ──
export const ustaHizmetOneriGonder = (data) => api.post('/usta/hizmet-oneri', data);

// ── Usta Paneli: Ekibimiz (Faz 2 Görev 7 — görünüm amaçlı, yetkilendirme değil) ──
export const ustaPanelEkipGetir = () => api.get('/usta/ekip');
export const ustaPanelEkipEkle = (formData) =>
  api.post('/usta/ekip', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const ustaPanelEkipSil = (id) => api.delete(`/usta/ekip/${id}`);

// ── Usta Paneli: Public Sertifikalarım (Faz 2 Görev 8 — UstaBelge/KYC'den TAMAMEN AYRI) ──
export const ustaPanelSertifikalarGetir = () => api.get('/usta/sertifikalar');
export const ustaPanelSertifikaEkle = (formData) =>
  api.post('/usta/sertifikalar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const ustaPanelSertifikaSil = (id) => api.delete(`/usta/sertifikalar/${id}`);

// ── Usta Paneli: Ödüller (Faz 2 Görev 9) ──
export const ustaPanelOdullerGetir = () => api.get('/usta/oduller');
export const ustaPanelOdulEkle = (data) => api.post('/usta/oduller', data);
export const ustaPanelOdulSil = (id) => api.delete(`/usta/oduller/${id}`);

// ── Müşteri Paneli ───────────────────────────────────────
export const musteriPanelDashboard = () => api.get('/musteri/panel');
export const musteriPanelTalepler = (params) => api.get('/musteri/taleplerim', { params });
export const musteriPanelTalepIptal = (id) => api.put(`/musteri/taleplerim/${id}/iptal`);
export const musteriPanelProfil = () => api.get('/musteri/profil');
export const musteriPanelProfilGuncelle = (data) => api.put('/musteri/profil', data);

// Faz 3 Görev 12 — İş talebi mesajlaşması (giriş yapmış müşteri VEYA misafir; telefon ile).
// Giriş yapmış müşteri session çerezi üzerinden otomatik yetkilenir, telefon göndermesine gerek yok.
export const musteriTalepMesajlari = (tid, telefon) => api.get(`/musteri/talep-takip/${tid}/mesajlar`, { params: telefon ? { telefon } : {} });
export const musteriTalepMesajGonder = (tid, icerik, telefon) => api.post(`/musteri/talep-takip/${tid}/mesajlar`, { icerik, ...(telefon ? { telefon } : {}) });

// ── Şirketler ────────────────────────────────────────────
export const sirketListele = (params) => api.get('/sirketler/', { params });
export const sirketDetay = (id) => api.get(`/sirketler/${id}`);
export const sirketKayit = (data) => api.post('/sirketler/kayit', data);
export const sirketIsTalebiGonder = (id, data) => api.post(`/sirketler/${id}/is-talebi`, data);

// ── Şirket Paneli ─────────────────────────────────────────
export const sirketPanelDashboard = () => api.get('/sirket/panel');
export const sirketPanelProfil = () => api.get('/sirket/profil');
export const sirketPanelProfilGuncelle = (data) => api.put('/sirket/profil', data);
export const sirketPanelLogoYukle = (formData) =>
  api.post('/sirket/profil/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const sirketPanelIsTalepleri = (params) => api.get('/sirket/is-talepleri', { params });
export const sirketPanelTalepGuncelle = (id, data) => api.put(`/sirket/is-talepleri/${id}`, data);

// ── Admin Reklamlar ──────────────────────────────────────
export const adminReklamListele = () => api.get('/reklamlar/admin');
export const adminReklamEkle = (data) => api.post('/reklamlar/admin', data);
export const adminReklamGuncelle = (id, data) => api.put(`/reklamlar/admin/${id}`, data);
export const adminReklamSil = (id) => api.delete(`/reklamlar/admin/${id}`);

export default api;
