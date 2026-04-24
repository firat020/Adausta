class Ilce {
  final int id;
  final String ad;

  Ilce({required this.id, required this.ad});

  factory Ilce.fromJson(Map<String, dynamic> json) {
    return Ilce(id: json['id'], ad: json['ad'] ?? '');
  }
}

class Sehir {
  final int id;
  final String ad;
  final List<Ilce> ilceler;

  Sehir({required this.id, required this.ad, required this.ilceler});

  factory Sehir.fromJson(Map<String, dynamic> json) {
    return Sehir(
      id: json['id'],
      ad: json['ad'] ?? '',
      ilceler: (json['ilceler'] as List? ?? [])
          .map((i) => Ilce.fromJson(i))
          .toList(),
    );
  }
}
