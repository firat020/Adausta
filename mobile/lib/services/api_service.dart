import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/usta.dart';
import '../models/kategori.dart';
import '../models/yorum.dart';

class ApiService {
  Future<List<Usta>> getUstalar({String? kategori, String? arama, String? sehir}) async {
    final params = <String, String>{};
    if (kategori != null) params['kategori'] = kategori;
    if (arama != null && arama.isNotEmpty) params['arama'] = arama;
    if (sehir != null) params['sehir'] = sehir;

    final uri = Uri.parse(ApiConfig.ustalar).replace(queryParameters: params);
    final res = await http.get(uri);
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      final list = data is List ? data : data['ustalar'] ?? [];
      return List<Usta>.from(list.map((e) => Usta.fromJson(e)));
    }
    throw Exception('Ustalar yüklenemedi');
  }

  Future<Map<String, dynamic>> getUstaDetay(int id) async {
    final res = await http.get(Uri.parse('${ApiConfig.ustalar}/$id'));
    if (res.statusCode == 200) return jsonDecode(res.body);
    throw Exception('Usta bulunamadı');
  }

  Future<List<Yorum>> getYorumlar(int ustaId) async {
    final res = await http.get(Uri.parse('${ApiConfig.ustalar}/$ustaId/yorumlar'));
    if (res.statusCode == 200) {
      final list = jsonDecode(res.body) as List;
      return list.map((e) => Yorum.fromJson(e)).toList();
    }
    return [];
  }

  Future<List<Kategori>> getKategoriler() async {
    final res = await http.get(Uri.parse(ApiConfig.kategoriler));
    if (res.statusCode == 200) {
      final list = jsonDecode(res.body) as List;
      return list.map((e) => Kategori.fromJson(e)).toList();
    }
    throw Exception('Kategoriler yüklenemedi');
  }

  Future<List<Usta>> getEnYakin(double lat, double lng, {double km = 10}) async {
    final uri = Uri.parse(ApiConfig.enYakin).replace(queryParameters: {
      'lat': lat.toString(),
      'lng': lng.toString(),
      'km': km.toString(),
    });
    final res = await http.get(uri);
    if (res.statusCode == 200) {
      final list = jsonDecode(res.body) as List;
      return list.map((e) => Usta.fromJson(e)).toList();
    }
    throw Exception('Yakın ustalar bulunamadı');
  }

  Future<bool> kayitOl(Map<String, String> formData) async {
    final res = await http.post(
      Uri.parse(ApiConfig.ustaKayit),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(formData),
    );
    return res.statusCode == 201 || res.statusCode == 200;
  }

  Future<bool> yorumEkle(int ustaId, String ad, double puan, String yorum) async {
    final res = await http.post(
      Uri.parse('${ApiConfig.ustalar}/$ustaId/yorumlar'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'ad': ad, 'puan': puan, 'yorum': yorum}),
    );
    return res.statusCode == 201 || res.statusCode == 200;
  }
}
