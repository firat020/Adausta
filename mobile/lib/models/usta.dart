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
  final int? kategoriId;
  final double? puan;
  final int yorumSayisi;
  final bool aktif;
  final List<String> fotograflar;
  double? mesafe;

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
    this.kategoriId,
    this.puan,
    this.yorumSayisi = 0,
    this.aktif = true,
    this.fotograflar = const [],
    this.mesafe,
  });

  String get tamAd => '$ad $soyad';

  String get konumText {
    if (ilce != null && sehir != null) return '$ilce, $sehir';
    if (sehir != null) return sehir!;
    return 'KKTC';
  }

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
      kategoriId: json['kategori_id'],
      puan: json['puan'] != null ? (json['puan'] as num).toDouble() : null,
      yorumSayisi: json['yorum_sayisi'] ?? 0,
      aktif: json['aktif'] ?? true,
      fotograflar: json['fotograflar'] != null
          ? List<String>.from(json['fotograflar'])
          : [],
      mesafe: json['mesafe'] != null ? (json['mesafe'] as num).toDouble() : null,
    );
  }
}
