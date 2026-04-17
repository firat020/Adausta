import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

// Kategoriler & şehirler
export const kategorileriGetir = () => api.get('/kategoriler/');
export const sehirleriGetir = () => api.get('/kategoriler/sehirler');

// Ustalar
export const ustaListele = (params) => api.get('/ustalar/', { params });
export const ustaDetay = (id, params) => api.get(`/ustalar/${id}`, { params });
export const ustaKayit = (data) => api.post('/ustalar/kayit', data);
export const enYakinUstalar = (params) => api.get('/ustalar/en-yakin', { params });
export const yorumEkle = (id, data) => api.post(`/ustalar/${id}/yorum`, data);
export const isTalebiGonder = (ustaId, data) => api.post(`/ustalar/${ustaId}/is-talebi`, data);

// Auth
export const giris = (data) => api.post('/auth/giris', data);
export const kayit = (data) => api.post('/auth/kayit', data);
export const cikis = () => api.post('/auth/cikis');
export const benimBilgilerim = () => api.get('/auth/ben');

// Reklamlar
export const reklamlariGetir = (params) => api.get('/reklamlar/', { params });
export const reklamTikla = (id) => api.post(`/reklamlar/${id}/tikla`);

// ── Usta Paneli ──────────────────────────────────────────
export const ustaPanelDashboard = () => api.get('/usta/panel');
export const ustaPanelProfil = () => api.get('/usta/profil');
export const ustaPanelProfilGuncelle = (data) => api.put('/usta/profil', data);
export const ustaPanelFotografYukle = (formData) =>
  api.post('/usta/profil/fotograf', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const ustaPanelFotografSil = (fid) => api.delete(`/usta/profil/fotograf/${fid}`);
export const ustaPanelMusaitlik = (musaitlik) => api.put('/usta/musaitlik', { musaitlik });
export const ustaPanelIsTalepleri = (params) => api.get('/usta/is-talepleri', { params });
export const ustaPanelTalepGuncelle = (id, data) => api.put(`/usta/is-talepleri/${id}`, data);
export const ustaPanelMusteriler = () => api.get('/usta/musteriler');
export const ustaPanelIstatistikler = (aralik) => api.get('/usta/istatistikler', { params: { aralik } });
export const ustaPanelYorumlar = () => api.get('/usta/yorumlar');

// ── Admin Reklamlar ──────────────────────────────────────
export const adminReklamListele = () => api.get('/reklamlar/admin');
export const adminReklamEkle = (data) => api.post('/reklamlar/admin', data);
export const adminReklamGuncelle = (id, data) => api.put(`/reklamlar/admin/${id}`, data);
export const adminReklamSil = (id) => api.delete(`/reklamlar/admin/${id}`);

export default api;
