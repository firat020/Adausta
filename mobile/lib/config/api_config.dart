class ApiConfig {
  // Emülatörde: 10.0.2.2 (Android emülatör localhost'u)
  // Gerçek cihazda: bilgisayarın yerel IP'si
  static const String baseUrl = 'https://monogrammatical-preoriginally-maxim.ngrok-free.dev';

  static const String ustalar = '$baseUrl/api/ustalar';
  static const String kategoriler = '$baseUrl/api/kategoriler';
  static const String enYakin = '$baseUrl/api/ustalar/en-yakin';
  static const String ustaKayit = '$baseUrl/api/ustalar';
  static const String uploads = '$baseUrl/uploads';
}
