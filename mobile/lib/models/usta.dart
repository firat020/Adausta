class Usta {
  final int id;
  final String ad;
  final String soyad;
  final String telefon;
  final String? email;
  final String? aciklama;
  final String? sehir;
  final String? ilce;
  final String kategoriAd;
  final double? puan;
  final int yorumSayisi;
  final bool aktif;
  final List<String> fotograflar;

  Usta({
    required this.id,
    required this.ad,
    required this.soyad,
    required this.telefon,
    this.email,
    this.aciklama,
    this.sehir,
    this.ilce,
    required this.kategoriAd,
    this.puan,
    this.yorumSayisi = 0,
    this.aktif = true,
    this.fotograflar = const [],
  });

  String get tamAd => '$ad $soyad';

  factory Usta.fromJson(Map<String, dynamic> json) {
    return Usta(
      id: json['id'],
      ad: json['ad'] ?? '',
      soyad: json['soyad'] ?? '',
      telefon: json['telefon'] ?? '',
      email: json['email'],
      aciklama: json['aciklama'],
      sehir: json['sehir'],
      ilce: json['ilce'],
      kategoriAd: json['kategori_ad'] ?? json['kategori'] ?? '',
      puan: json['puan'] != null ? (json['puan'] as num).toDouble() : null,
      yorumSayisi: json['yorum_sayisi'] ?? 0,
      aktif: json['aktif'] ?? true,
      fotograflar: json['fotograflar'] != null
          ? List<String>.from(json['fotograflar'])
          : [],
    );
  }
}
