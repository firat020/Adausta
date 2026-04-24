import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const kategorileriGetir = () => api.get('/kategoriler/');
export const sehirleriGetir = () => api.get('/kategoriler/sehirler');
export const ustaListele = (params) => api.get('/ustalar/', { params });
export const ustaDetay = (id, params) => api.get(`/ustalar/${id}`, { params });
export const ustaKayit = (data) => api.post('/ustalar/kayit', data);
export const enYakinUstalar = (params) => api.get('/ustalar/en-yakin', { params });
export const yorumEkle = (id, data) => api.post(`/ustalar/${id}/yorum`, data);
export const giris = (data) => api.post('/auth/giris', data);
export const kayit = (data) => api.post('/auth/kayit', data);
export const cikis = () => api.post('/auth/cikis');
export const benimBilgilerim = () => api.get('/auth/ben');

export default api;
