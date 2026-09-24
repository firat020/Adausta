import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/usta.dart';
import '../models/kategori.dart';
import '../models/yorum.dart';
import '../models/sehir.dart';
import 'fcm_service.dart';

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

  // Backend'de ayrı bir yorum listeleme ucu yok; onaylı yorumlar
  // GET /api/ustalar/{id} yanıtında 'yorumlar' alanı olarak gelir.
  Future<List<Yorum>> getYorumlar(int ustaId) async {
    final res = await http.get(Uri.parse(ApiConfig.ustaDetay(ustaId)), headers: _headers);
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      final list = data is Map ? (data['yorumlar'] ?? []) : [];
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

  /// POST /api/ustalar/kayit — backend zorunlu alanlar:
  /// ad, telefon, kategori_id, sehir_id, email, sifre (>= 8 karakter).
  /// Başarısız olursa backend'in 'hata' mesajıyla Exception fırlatır.
  Future<bool> kayitOl(Map<String, dynamic> formData) async {
    final res = await http.post(
      Uri.parse(ApiConfig.ustaKayit),
      headers: _headers,
      body: jsonEncode(formData),
    );
    if (res.statusCode == 201 || res.statusCode == 200) {
      _saveCookie(res); // backend kayıt sonrası otomatik oturum açar
      if (_sessionCookie != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('session_cookie', _sessionCookie!);
      }
      return true;
    }
    throw Exception(_hataAl(res) ?? 'Kayıt yapılamadı');
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

  // POST /api/ustalar/{id}/yorum — backend 'musteri_adi' ve 1-5 arası tamsayı 'puan' bekler.
  Future<bool> yorumEkle(int ustaId, String ad, double puan, String yorum) async {
    final res = await http.post(
      Uri.parse(ApiConfig.ustaYorumEkle(ustaId)),
      headers: _headers,
      body: jsonEncode({
        'musteri_adi': ad.trim(),
        'puan': puan.round().clamp(1, 5),
        'yorum': yorum.trim(),
      }),
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
      final prefs = await SharedPreferences.getInstance();
      if (_sessionCookie != null) {
        await prefs.setString('session_cookie', _sessionCookie!);
        // Non-blocking FCM token registration
        FCMService.instance.tokenKaydet(_sessionCookie!);
      }
      return data['kullanici'] as Map<String, dynamic>?;
    }
    final hata = jsonDecode(res.body)['hata'] ?? 'Giriş başarısız';
    throw Exception(hata);
  }

  Future<void> cikisYap() async {
    if (_sessionCookie != null) {
      await FCMService.instance.tokenSil(_sessionCookie!);
    }
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

  // POST /api/ustalar/{usta_id}/is-talebi — backend alanları:
  // musteri_ad, musteri_telefon, baslik (zorunlu), aciklama, tercih_tarih.
  // Oturum çerezi gönderilirse talep müşteri hesabına bağlanır ("Taleplerim"de görünür).
  Future<bool> musteriTalepOlustur(Map<String, dynamic> data) async {
    final ustaId = data['usta_id'] as int;
    final aciklama = (data['aciklama'] ?? '').toString().trim();
    final iletisim = (data['iletisim_tercihi'] ?? '').toString();

    // Backend 'baslik' ister; mobil form başlık almıyor → açıklamanın ilk satırı
    final ilkSatir = aciklama.split('\n').first.trim();
    final baslik = (data['baslik'] ?? (ilkSatir.isNotEmpty
            ? (ilkSatir.length > 80 ? '${ilkSatir.substring(0, 77)}...' : ilkSatir)
            : 'Mobil uygulamadan iş talebi'))
        .toString();

    final body = <String, dynamic>{
      'musteri_ad': (data['ad'] ?? '').toString().trim(),
      'musteri_telefon': (data['telefon'] ?? '').toString().trim(),
      'baslik': baslik,
      'aciklama': iletisim.isNotEmpty
          ? '$aciklama\n\nİletişim tercihi: ${iletisim == 'whatsapp' ? 'WhatsApp' : 'Telefon'}'
          : aciklama,
      if (data['tercih_tarih'] != null) 'tercih_tarih': data['tercih_tarih'],
    };

    final res = await http.post(
      Uri.parse(ApiConfig.ustaIsTalebi(ustaId)),
      headers: _authHeaders,
      body: jsonEncode(body),
    );
    if (res.statusCode == 201 || res.statusCode == 200) return true;
    throw Exception(_hataAl(res) ?? 'Talep gönderilemedi');
  }

  /// GET /api/musteri/taleplerim → {'talepler': [...]} (müşteri oturumu gerekli)
  Future<List<Map<String, dynamic>>> musteriTalepListesi() async {
    final res = await http.get(Uri.parse(ApiConfig.musteriTaleplerim), headers: _authHeaders);
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      final list = data is List ? data : (data['talepler'] ?? []);
      return (list as List).cast<Map<String, dynamic>>();
    }
    throw Exception(_hataAl(res) ?? 'Talepler yüklenemedi');
  }

  // PUT /api/musteri/taleplerim/{id}/iptal — yalnızca 'bekliyor' durumundaki talepler
  Future<bool> musteriTalepIptal(int id) async {
    final res = await http.put(
      Uri.parse(ApiConfig.musteriTalepIptal(id)),
      headers: _authHeaders,
    );
    return res.statusCode == 200 || res.statusCode == 204;
  }

  // ── Usta Paneli — ek uçlar ─────────────────────────────────

  String? _hataAl(http.Response res) {
    try {
      final data = jsonDecode(res.body);
      if (data is Map && data['hata'] != null) return data['hata'].toString();
    } catch (_) {}
    return null;
  }

  // Profil fotoğrafı
  Future<Map<String, dynamic>> ustaProfilFotoYukle(String dosyaYolu) async {
    final req = http.MultipartRequest('POST', Uri.parse(ApiConfig.ustaProfilFoto));
    final h = Map<String, String>.from(_authHeaders)..remove('Content-Type');
    req.headers.addAll(h);
    req.files.add(await http.MultipartFile.fromPath('dosya', dosyaYolu));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    if (res.statusCode == 200 || res.statusCode == 201) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception(_hataAl(res) ?? 'Fotoğraf yüklenemedi');
  }

  Future<void> ustaProfilFotoSil(int id) async {
    final res = await http.delete(Uri.parse(ApiConfig.ustaProfilFotoSil(id)), headers: _authHeaders);
    if (res.statusCode != 200 && res.statusCode != 204) {
      throw Exception(_hataAl(res) ?? 'Fotoğraf silinemedi');
    }
  }

  // Talep okundu / rozet
  Future<void> ustaTalepOkundu(int id) async {
    await http.post(Uri.parse(ApiConfig.ustaTalepOkundu(id)), headers: _authHeaders);
  }

  Future<int> ustaOkunmamisSayisi() async {
    final res = await http.get(Uri.parse(ApiConfig.ustaOkunmamisSayisi), headers: _authHeaders);
    if (res.statusCode == 200) return ((jsonDecode(res.body)['sayi']) as num?)?.toInt() ?? 0;
    return 0;
  }

  // Müşteriler
  Future<List<Map<String, dynamic>>> ustaMusteriler() async {
    final res = await http.get(Uri.parse(ApiConfig.ustaMusteriler), headers: _authHeaders);
    if (res.statusCode == 200) {
      final list = jsonDecode(res.body)['musteriler'] as List;
      return list.cast<Map<String, dynamic>>();
    }
    throw Exception('Müşteriler yüklenemedi');
  }

  // İstatistikler
  Future<Map<String, dynamic>> ustaIstatistikler({int aralik = 30}) async {
    final uri = Uri.parse(ApiConfig.ustaIstatistikler).replace(queryParameters: {'aralik': aralik.toString()});
    final res = await http.get(uri, headers: _authHeaders);
    if (res.statusCode == 200) return jsonDecode(res.body) as Map<String, dynamic>;
    throw Exception('İstatistikler yüklenemedi');
  }

  // Yorumlar (usta paneli)
  Future<List<Map<String, dynamic>>> ustaPanelYorumlar() async {
    final res = await http.get(Uri.parse(ApiConfig.ustaYorumlarPanel), headers: _authHeaders);
    if (res.statusCode == 200) {
      final list = jsonDecode(res.body)['yorumlar'] as List;
      return list.cast<Map<String, dynamic>>();
    }
    throw Exception('Yorumlar yüklenemedi');
  }

  Future<void> ustaYorumCevapla(int id, String cevap) async {
    final res = await http.post(
      Uri.parse(ApiConfig.ustaYorumCevapla(id)),
      headers: _authHeaders,
      body: jsonEncode({'cevap': cevap}),
    );
    if (res.statusCode != 200) throw Exception(_hataAl(res) ?? 'Yanıt gönderilemedi');
  }

  // Abonelik
  Future<Map<String, dynamic>> ustaAbonelik() async {
    final res = await http.get(Uri.parse(ApiConfig.ustaAbonelik), headers: _authHeaders);
    if (res.statusCode == 200) return jsonDecode(res.body) as Map<String, dynamic>;
    throw Exception('Abonelik bilgisi yüklenemedi');
  }

  Future<void> ustaAbonelikOtomatikYenileme(bool acik) async {
    final res = await http.post(
      Uri.parse(ApiConfig.ustaAbonelikOtomatikYenileme),
      headers: _authHeaders,
      body: jsonEncode({'acik': acik}),
    );
    if (res.statusCode != 200) throw Exception(_hataAl(res) ?? 'Güncellenemedi');
  }

  // Mesajlar (admin ↔ usta)
  Future<List<Map<String, dynamic>>> ustaMesajlar() async {
    final res = await http.get(Uri.parse(ApiConfig.ustaMesajlar), headers: _authHeaders);
    if (res.statusCode == 200) {
      final list = jsonDecode(res.body)['mesajlar'] as List;
      return list.cast<Map<String, dynamic>>();
    }
    throw Exception('Mesajlar yüklenemedi');
  }

  Future<void> ustaMesajGonder(String icerik) async {
    final res = await http.post(
      Uri.parse(ApiConfig.ustaMesajlar),
      headers: _authHeaders,
      body: jsonEncode({'icerik': icerik}),
    );
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw Exception(_hataAl(res) ?? 'Mesaj gönderilemedi');
    }
  }

  Future<int> ustaMesajOkunmamisSayisi() async {
    final res = await http.get(Uri.parse(ApiConfig.ustaMesajlarOkunmamisSayisi), headers: _authHeaders);
    if (res.statusCode == 200) return ((jsonDecode(res.body)['sayi']) as num?)?.toInt() ?? 0;
    return 0;
  }

  // Belgeler (kimlik / ustalık belgesi doğrulama)
  Future<List<Map<String, dynamic>>> ustaBelgeler() async {
    final res = await http.get(Uri.parse(ApiConfig.ustaBelgeler), headers: _authHeaders);
    if (res.statusCode == 200) {
      final list = jsonDecode(res.body)['belgeler'] as List;
      return list.cast<Map<String, dynamic>>();
    }
    throw Exception('Belgeler yüklenemedi');
  }

  Future<Map<String, dynamic>> ustaBelgeYukle(String dosyaYolu, String tur) async {
    final req = http.MultipartRequest('POST', Uri.parse(ApiConfig.ustaBelgeler));
    final h = Map<String, String>.from(_authHeaders)..remove('Content-Type');
    req.headers.addAll(h);
    req.fields['tur'] = tur;
    req.files.add(await http.MultipartFile.fromPath('dosya', dosyaYolu));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    if (res.statusCode == 200 || res.statusCode == 201) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception(_hataAl(res) ?? 'Belge yüklenemedi');
  }

  Future<void> ustaBelgeSil(int id) async {
    final res = await http.delete(Uri.parse(ApiConfig.ustaBelgeSil(id)), headers: _authHeaders);
    if (res.statusCode != 200 && res.statusCode != 204) {
      throw Exception(_hataAl(res) ?? 'Belge silinemedi');
    }
  }
}
