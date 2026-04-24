import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/usta.dart';
import '../models/kategori.dart';
import '../models/yorum.dart';
import '../models/sehir.dart';

class ApiService {
  static final Map<String, String> _headers = {
    'Content-Type': 'application/json',
  };

  // Cookie oturumu için session cookie'yi sakla
  static String? _sessionCookie;

  Map<String, String> get _authHeaders {
    final h = Map<String, String>.from(_headers);
    if (_sessionCookie != null) h['Cookie'] = _sessionCookie!;
    return h;
  }

  void _saveCookie(http.Response res) {
    final cookie = res.headers['set-cookie'];
    if (cookie != null) {
      _sessionCookie = cookie.split(';').first;
    }
  }

  // ── Ustalar ──────────────────────────────────────────────

  Future<List<Usta>> getUstalar({String? arama, int? kategoriId}) async {
    final params = <String, String>{};
    if (arama != null && arama.isNotEmpty) params['arama'] = arama;
    if (kategoriId != null) params['kategori_id'] = kategoriId.toString();

    final uri = Uri.parse(ApiConfig.ustalar).replace(queryParameters: params);
    final res = await http.get(uri, headers: _headers);
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      final list = data is List ? data : (data['ustalar'] ?? []);
      return List<Usta>.from((list as List).map((e) => Usta.fromJson(e)));
    }
    throw Exception('Ustalar yüklenemedi');
  }

  Future<Usta> getUstaDetay(int id) async {
    final res = await http.get(Uri.parse(ApiConfig.ustaDetay(id)), headers: _headers);
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      return Usta.fromJson(data is Map && data.containsKey('usta') ? data['usta'] : data);
    }
    throw Exception('Usta bulunamadı');
  }

  Future<List<Yorum>> getYorumlar(int ustaId) async {
    final res = await http.get(Uri.parse(ApiConfig.ustaYorumlar(ustaId)), headers: _headers);
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      final list = data is List ? data : (data['yorumlar'] ?? []);
      return (list as List).map((e) => Yorum.fromJson(e)).toList();
    }
    return [];
  }

  Future<List<Kategori>> getKategoriler() async {
    final res = await http.get(Uri.parse(ApiConfig.kategoriler), headers: _headers);
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      final list = data is List ? data : (data['kategoriler'] ?? []);
      return (list as List).map((e) => Kategori.fromJson(e)).toList();
    }
    throw Exception('Kategoriler yüklenemedi');
  }

  Future<List<Usta>> getEnYakin(double lat, double lng, {double km = 10}) async {
    final uri = Uri.parse(ApiConfig.enYakin).replace(queryParameters: {
      'lat': lat.toString(), 'lng': lng.toString(), 'km': km.toString(),
    });
    final res = await http.get(uri, headers: _headers);
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      final list = data is List ? data : (data['ustalar'] ?? []);
      return (list as List).map((e) => Usta.fromJson(e)).toList();
    }
    throw Exception('Yakın ustalar bulunamadı');
  }

  Future<bool> kayitOl(Map<String, dynamic> formData) async {
    final res = await http.post(
      Uri.parse(ApiConfig.ustalar),
      headers: _headers,
      body: jsonEncode(formData),
    );
    return res.statusCode == 201 || res.statusCode == 200;
  }

  Future<List<Sehir>> getSehirler() async {
    final res = await http.get(Uri.parse(ApiConfig.sehirler), headers: _headers);
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      final list = data is List ? data : (data['sehirler'] ?? []);
      return (list as List).map((e) => Sehir.fromJson(e)).toList();
    }
    return [];
  }

  Future<bool> yorumEkle(int ustaId, String ad, double puan, String yorum) async {
    final res = await http.post(
      Uri.parse(ApiConfig.ustaYorumlar(ustaId)),
      headers: _headers,
      body: jsonEncode({'ad': ad, 'puan': puan, 'yorum': yorum}),
    );
    return res.statusCode == 201 || res.statusCode == 200;
  }

  // ── Auth ─────────────────────────────────────────────────

  Future<Map<String, dynamic>?> giris(String email, String sifre) async {
    final res = await http.post(
      Uri.parse(ApiConfig.giris),
      headers: _headers,
      body: jsonEncode({'email': email, 'sifre': sifre}),
    );
    if (res.statusCode == 200) {
      _saveCookie(res);
      final data = jsonDecode(res.body);
      // Persist session
      final prefs = await SharedPreferences.getInstance();
      if (_sessionCookie != null) await prefs.setString('session_cookie', _sessionCookie!);
      return data['kullanici'] as Map<String, dynamic>?;
    }
    final hata = jsonDecode(res.body)['hata'] ?? 'Giriş başarısız';
    throw Exception(hata);
  }

  Future<void> cikisYap() async {
    await http.post(Uri.parse(ApiConfig.cikis), headers: _authHeaders);
    _sessionCookie = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('session_cookie');
  }

  Future<Map<String, dynamic>?> benimBilgilerim() async {
    if (_sessionCookie == null) {
      final prefs = await SharedPreferences.getInstance();
      _sessionCookie = prefs.getString('session_cookie');
    }
    if (_sessionCookie == null) return null;
    final res = await http.get(Uri.parse(ApiConfig.ben), headers: _authHeaders);
    if (res.statusCode == 200) {
      return jsonDecode(res.body)['kullanici'] as Map<String, dynamic>?;
    }
    return null;
  }

  // ── Usta Paneli ──────────────────────────────────────────

  Future<Map<String, dynamic>> ustaPanelDashboard() async {
    final res = await http.get(Uri.parse(ApiConfig.ustaPanel), headers: _authHeaders);
    if (res.statusCode == 200) return jsonDecode(res.body) as Map<String, dynamic>;
    throw Exception('Panel yüklenemedi');
  }

  Future<Map<String, dynamic>> ustaPanelProfil() async {
    final res = await http.get(Uri.parse(ApiConfig.ustaProfil), headers: _authHeaders);
    if (res.statusCode == 200) return jsonDecode(res.body) as Map<String, dynamic>;
    throw Exception('Profil yüklenemedi');
  }

  Future<void> ustaPanelProfilGuncelle(Map<String, dynamic> data) async {
    final res = await http.put(
      Uri.parse(ApiConfig.ustaProfil),
      headers: _authHeaders,
      body: jsonEncode(data),
    );
    if (res.statusCode != 200) throw Exception('Güncelleme başarısız');
  }

  Future<void> musaitlikToggle(bool musaitlik) async {
    await http.put(
      Uri.parse(ApiConfig.ustaMusaitlik),
      headers: _authHeaders,
      body: jsonEncode({'musaitlik': musaitlik}),
    );
  }

  Future<List<Map<String, dynamic>>> ustaIsTalepleri({String durum = 'hepsi'}) async {
    final uri = Uri.parse(ApiConfig.ustaIsTalepleri)
        .replace(queryParameters: durum != 'hepsi' ? {'durum': durum} : null);
    final res = await http.get(uri, headers: _authHeaders);
    if (res.statusCode == 200) {
      final list = jsonDecode(res.body)['talepler'] as List;
      return list.cast<Map<String, dynamic>>();
    }
    throw Exception('Talepler yüklenemedi');
  }

  Future<void> talepGuncelle(int id, String durum, {String? not}) async {
    final body = <String, dynamic>{'durum': durum};
    if (not != null) body['usta_notu'] = not;
    await http.put(
      Uri.parse(ApiConfig.ustaTalepGuncelle(id)),
      headers: _authHeaders,
      body: jsonEncode(body),
    );
  }
}
