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
  static const String giris    = '$baseUrl/api/auth/giris';
  static const String cikis    = '$baseUrl/api/auth/cikis';
  static const String ben      = '$baseUrl/api/auth/ben';

  // Usta Paneli
  static const String ustaPanel           = '$baseUrl/api/usta/panel';
  static const String ustaProfil          = '$baseUrl/api/usta/profil';
  static const String ustaMusaitlik       = '$baseUrl/api/usta/musaitlik';
  static const String ustaIsTalepleri     = '$baseUrl/api/usta/is-talepleri';
  static String ustaTalepGuncelle(int id) => '$baseUrl/api/usta/is-talepleri/$id';
}
