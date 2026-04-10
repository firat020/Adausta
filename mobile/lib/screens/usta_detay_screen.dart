import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/usta.dart';
import '../models/yorum.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';

class UstaDetayScreen extends StatefulWidget {
  final int ustaId;

  const UstaDetayScreen({super.key, required this.ustaId});

  @override
  State<UstaDetayScreen> createState() => _UstaDetayScreenState();
}

class _UstaDetayScreenState extends State<UstaDetayScreen> {
  final _api = ApiService();
  Usta? _usta;
  List<Yorum> _yorumlar = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _api.getUstaDetay(widget.ustaId);
      final yorumlar = await _api.getYorumlar(widget.ustaId);
      setState(() {
        _usta = Usta.fromJson(data['usta'] ?? data);
        _yorumlar = yorumlar;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  void _ara(String tel) async {
    final uri = Uri(scheme: 'tel', path: tel);
    if (await canLaunchUrl(uri)) launchUrl(uri);
  }

  void _yorumEkleDialog() {
    final adCtrl = TextEditingController();
    final yorumCtrl = TextEditingController();
    double puan = 5;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Yorum Ekle'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: adCtrl, decoration: const InputDecoration(labelText: 'Adınız')),
            const SizedBox(height: 8),
            TextField(controller: yorumCtrl, decoration: const InputDecoration(labelText: 'Yorumunuz'), maxLines: 3),
            const SizedBox(height: 12),
            RatingBar.builder(
              initialRating: 5,
              minRating: 1,
              itemCount: 5,
              itemBuilder: (_, __) => const Icon(Icons.star, color: Colors.amber),
              onRatingUpdate: (r) => puan = r,
              itemSize: 30,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('İptal')),
          ElevatedButton(
            onPressed: () async {
              if (adCtrl.text.isNotEmpty) {
                final ok = await _api.yorumEkle(widget.ustaId, adCtrl.text, puan, yorumCtrl.text);
                if (ok && mounted) {
                  Navigator.pop(ctx);
                  _load();
                }
              }
            },
            child: const Text('Gönder'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_usta == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Usta Detay')),
        body: const Center(child: Text('Usta bulunamadı')),
      );
    }

    final u = _usta!;
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: const Color(0xFF1e3a5f),
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(u.tamAd, style: const TextStyle(fontSize: 14)),
              background: u.fotograflar.isNotEmpty
                  ? Image.network(
                      '${ApiConfig.uploads}/${u.fotograflar.first}',
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _defaultBg(),
                    )
                  : _defaultBg(),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _infoKart(u),
                  const SizedBox(height: 16),
                  if (u.aciklama != null) ...[
                    _bolum('Hakkında', u.aciklama!),
                    const SizedBox(height: 16),
                  ],
                  _yorumlarBolum(),
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            heroTag: 'yorum',
            mini: true,
            backgroundColor: Colors.orange,
            onPressed: _yorumEkleDialog,
            child: const Icon(Icons.rate_review, color: Colors.white),
          ),
          const SizedBox(height: 8),
          FloatingActionButton.extended(
            heroTag: 'ara',
            backgroundColor: const Color(0xFF1e3a5f),
            onPressed: () => _ara(u.telefon),
            icon: const Icon(Icons.phone, color: Colors.white),
            label: const Text('Ara', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _defaultBg() => Container(
        color: const Color(0xFF1e3a5f),
        child: const Center(child: Icon(Icons.person, size: 80, color: Colors.white38)),
      );

  Widget _infoKart(Usta u) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8)],
      ),
      child: Column(
        children: [
          _infoSatir(Icons.work, u.kategoriAd),
          if (u.sehir != null)
            _infoSatir(Icons.location_on, '${u.sehir}${u.ilce != null ? ", ${u.ilce}" : ""}'),
          _infoSatir(Icons.phone, u.telefon),
          if (u.email != null) _infoSatir(Icons.email, u.email!),
          if (u.puan != null)
            _infoSatir(Icons.star, '${u.puan!.toStringAsFixed(1)} / 5.0 (${u.yorumSayisi} yorum)'),
        ],
      ),
    );
  }

  Widget _infoSatir(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: const Color(0xFF1e3a5f)),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 14))),
        ],
      ),
    );
  }

  Widget _bolum(String baslik, String icerik) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(baslik, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Text(icerik, style: TextStyle(color: Colors.grey[700], height: 1.5)),
        ],
      ),
    );
  }

  Widget _yorumlarBolum() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              'Yorumlar (${_yorumlar.length})',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),
          if (_yorumlar.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Henüz yorum yok'),
            ),
          ..._yorumlar.map((y) => _yorumKart(y)),
        ],
      ),
    );
  }

  Widget _yorumKart(Yorum y) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(y.mustadAd, style: const TextStyle(fontWeight: FontWeight.w600)),
              Row(
                children: [
                  const Icon(Icons.star, color: Colors.amber, size: 14),
                  Text(' ${y.puan.toStringAsFixed(1)}',
                      style: const TextStyle(fontSize: 12)),
                ],
              ),
            ],
          ),
          if (y.yorum != null && y.yorum!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(y.yorum!, style: TextStyle(color: Colors.grey[700], fontSize: 13)),
          ],
        ],
      ),
    );
  }
}
