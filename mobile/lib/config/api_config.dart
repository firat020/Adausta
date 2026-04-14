class ApiConfig {
  static const String baseUrl =
      'https://monogrammatical-preoriginally-maxim.ngrok-free.dev';

  static const String ustalar = '$baseUrl/api/ustalar/';
  static const String kategoriler = '$baseUrl/api/kategoriler/';
  static const String sehirler = '$baseUrl/api/kategoriler/sehirler';
  static const String enYakin = '$baseUrl/api/ustalar/en-yakin';
  static const String uploads = '$baseUrl/uploads';

  static String ustaDetay(int id) => '$baseUrl/api/ustalar/$id';
  static String ustaYorumlar(int id) => '$baseUrl/api/ustalar/$id/yorumlar';
}
