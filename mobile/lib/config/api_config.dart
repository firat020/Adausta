class ApiConfig {
  static const String baseUrl = 'https://adausta.com';

  static const String ustalar = '$baseUrl/api/ustalar/';
  static const String kategoriler = '$baseUrl/api/kategoriler/';
  static const String sehirler = '$baseUrl/api/kategoriler/sehirler';
  static const String enYakin = '$baseUrl/api/ustalar/en-yakin';
  static const String uploads = '$baseUrl/uploads';

  static String ustaDetay(int id) => '$baseUrl/api/ustalar/$id';
  static String ustaYorumlar(int id) => '$baseUrl/api/ustalar/$id/yorumlar';

  // Auth
  static const String giris        = '$baseUrl/api/auth/giris';
  static const String kayit        = '$baseUrl/api/auth/kayit';
  static const String cikis        = '$baseUrl/api/auth/cikis';
  static const String ben          = '$baseUrl/api/auth/ben';

  // Usta Paneli
  static const String ustaPanel           = '$baseUrl/api/usta/panel';
  static const String ustaProfil          = '$baseUrl/api/usta/profil';
  static const String ustaProfilFoto      = '$baseUrl/api/usta/profil/fotograf';
  static String ustaProfilFotoSil(int id) => '$baseUrl/api/usta/profil/fotograf/$id';
  static const String ustaMusaitlik       = '$baseUrl/api/usta/musaitlik';
  static const String ustaIsTalepleri     = '$baseUrl/api/usta/is-talepleri';
  static String ustaTalepGuncelle(int id) => '$baseUrl/api/usta/is-talepleri/$id';
  static String ustaTalepOkundu(int id)   => '$baseUrl/api/usta/is-talepleri/$id/okundu';
  static const String ustaOkunmamisSayisi = '$baseUrl/api/usta/okunmamis-sayisi';
  static const String ustaMusteriler      = '$baseUrl/api/usta/musteriler';
  static const String ustaIstatistikler   = '$baseUrl/api/usta/istatistikler';
  static const String ustaYorumlarPanel   = '$baseUrl/api/usta/yorumlar';
  static String ustaYorumCevapla(int id)  => '$baseUrl/api/usta/yorumlar/$id/cevap';
  static const String ustaAbonelik        = '$baseUrl/api/usta/abonelik';
  static const String ustaAbonelikOtomatikYenileme = '$baseUrl/api/usta/abonelik/otomatik-yenileme';
  static const String ustaMesajlar        = '$baseUrl/api/usta/mesajlar';
  static const String ustaMesajlarOkunmamisSayisi = '$baseUrl/api/usta/mesajlar/okunmamis-sayisi';
  static const String ustaBelgeler        = '$baseUrl/api/usta/belgeler';
  static String ustaBelgeSil(int id)      => '$baseUrl/api/usta/belgeler/$id';

  // Müşteri Talep
  static const String musteriTalepler = '$baseUrl/api/musteri/talepler';
  static String musteriTalepDetay(int id) => '$baseUrl/api/musteri/talepler/$id';

  // FCM
  static const String fcmToken = '$baseUrl/api/fcm/token';
}
