// Zengin usta profili — ortak seçenekler (halka açık profil + usta paneli)
export const DILLER = [
  { kod: 'tr', ad: 'Türkçe', ad_en: 'Turkish', bayrak: '🇹🇷' },
  { kod: 'en', ad: 'İngilizce', ad_en: 'English', bayrak: '🇬🇧' },
  { kod: 'ru', ad: 'Rusça', ad_en: 'Russian', bayrak: '🇷🇺' },
  { kod: 'el', ad: 'Rumca (Yunanca)', ad_en: 'Greek', bayrak: '🇬🇷' },
  { kod: 'de', ad: 'Almanca', ad_en: 'German', bayrak: '🇩🇪' },
  { kod: 'fa', ad: 'Farsça', ad_en: 'Persian', bayrak: '🇮🇷' },
  { kod: 'ar', ad: 'Arapça', ad_en: 'Arabic', bayrak: '🇸🇦' },
  { kod: 'ur', ad: 'Urduca', ad_en: 'Urdu', bayrak: '🇵🇰' },
]

export const ODEME_YONTEMLERI = [
  { kod: 'nakit', ad: 'Nakit', ad_en: 'Cash' },
  { kod: 'kart', ad: 'Kredi / Banka Kartı', ad_en: 'Credit / Debit Card' },
  { kod: 'havale', ad: 'Havale / EFT', ad_en: 'Bank Transfer' },
  { kod: 'cek', ad: 'Çek', ad_en: 'Cheque' },
]

// Gün anahtarı: '0' = Pazartesi … '6' = Pazar (backend ile aynı)
export const GUNLER = [
  { kod: '0', ad: 'Pazartesi', ad_en: 'Monday' },
  { kod: '1', ad: 'Salı', ad_en: 'Tuesday' },
  { kod: '2', ad: 'Çarşamba', ad_en: 'Wednesday' },
  { kod: '3', ad: 'Perşembe', ad_en: 'Thursday' },
  { kod: '4', ad: 'Cuma', ad_en: 'Friday' },
  { kod: '5', ad: 'Cumartesi', ad_en: 'Saturday' },
  { kod: '6', ad: 'Pazar', ad_en: 'Sunday' },
]

export const VARSAYILAN_SAATLER = Object.fromEntries(
  GUNLER.map(g => [g.kod, g.kod === '6' ? { kapali: true } : { kapali: false, bas: '08:00', bit: '18:00' }])
)
