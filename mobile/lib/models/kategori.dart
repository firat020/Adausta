class Kategori {
  final int id;
  final String ad;
  final String? ikon;
  final int? ustaSayisi;

  Kategori({
    required this.id,
    required this.ad,
    this.ikon,
    this.ustaSayisi,
  });

  factory Kategori.fromJson(Map<String, dynamic> json) {
    return Kategori(
      id: json['id'],
      ad: json['ad'] ?? '',
      ikon: json['ikon'],
      ustaSayisi: json['usta_sayisi'],
    );
  }
}
