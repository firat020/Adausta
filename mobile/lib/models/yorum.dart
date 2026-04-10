class Yorum {
  final int id;
  final String mustadAd;
  final double puan;
  final String? yorum;
  final String? tarih;

  Yorum({
    required this.id,
    required this.mustadAd,
    required this.puan,
    this.yorum,
    this.tarih,
  });

  factory Yorum.fromJson(Map<String, dynamic> json) {
    return Yorum(
      id: json['id'],
      mustadAd: json['musteri_ad'] ?? json['ad'] ?? 'Anonim',
      puan: (json['puan'] as num).toDouble(),
      yorum: json['yorum'],
      tarih: json['tarih'],
    );
  }
}
