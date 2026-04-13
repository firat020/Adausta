import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_theme.dart';
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
  bool _favori = false;

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  Future<void> _yukle() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.getUstaDetay(widget.ustaId),
        _api.getYorumlar(widget.ustaId),
      ]);
      final prefs = await SharedPreferences.getInstance();
      final favoriler = prefs.getStringList('favoriler') ?? [];
      if (mounted) {
        setState(() {
          _usta = results[0] as Usta;
          _yorumlar = results[1] as List<Yorum>;
          _favori = favoriler.contains(widget.ustaId.toString());
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _favoriToggle() async {
    final prefs = await SharedPreferences.getInstance();
    final favoriler = prefs.getStringList('favoriler') ?? [];
    final idStr = widget.ustaId.toString();
    if (_favori) {
      favoriler.remove(idStr);
    } else {
      favoriler.add(idStr);
    }
    await prefs.setStringList('favoriler', favoriler);
    setState(() => _favori = !_favori);
  }

  void _ara() async {
    if (_usta == null) return;
    final uri = Uri(scheme: 'tel', path: _usta!.telefon);
    if (await canLaunchUrl(uri)) launchUrl(uri);
  }

  void _whatsapp() async {
    if (_usta == null) return;
    final tel = _usta!.telefon.replaceAll(RegExp(r'[^0-9+]'), '');
    final uri = Uri.parse('https://wa.me/$tel');
    if (await canLaunchUrl(uri)) launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  void _yorumEkleDialog() {
    final adCtrl = TextEditingController();
    final yorumCtrl = TextEditingController();
    double puan = 5;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Yorum Yaz',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: adCtrl,
                decoration: InputDecoration(
                  labelText: 'Adınız',
                  prefixIcon: const Icon(Icons.person_outline),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: yorumCtrl,
                decoration: InputDecoration(
                  labelText: 'Yorumunuz',
                  prefixIcon: const Icon(Icons.comment_outlined),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              const Text('Puanınız',
                  style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              StatefulBuilder(
                builder: (_, setLocal) => RatingBar.builder(
                  initialRating: 5,
                  minRating: 1,
                  itemCount: 5,
                  itemBuilder: (_, __) => const Icon(
                    Icons.star_rounded,
                    color: AppColors.accent,
                  ),
                  onRatingUpdate: (r) {
                    puan = r;
                    setLocal(() {});
                  },
                  itemSize: 36,
                  unratedColor: Colors.grey.shade300,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (adCtrl.text.trim().isNotEmpty) {
                final ok = await _api.yorumEkle(
                    widget.ustaId, adCtrl.text, puan, yorumCtrl.text);
                if (ok && mounted) {
                  Navigator.pop(ctx);
                  _yukle();
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Gönder',
                style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        body: Container(
          decoration: const BoxDecoration(gradient: AppColors.heroGradient),
          child: const Center(
            child: CircularProgressIndicator(color: Colors.white),
          ),
        ),
      );
    }

    if (_usta == null) {
      return Scaffold(
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          title: const Text('Usta Detay'),
        ),
        body: const Center(child: Text('Usta bulunamadı')),
      );
    }

    final u = _usta!;
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          _buildAppBar(u),
          SliverToBoxAdapter(
            child: Column(
              children: [
                _buildProfil(u),
                _buildBilgiler(u),
                if (u.aciklama != null && u.aciklama!.isNotEmpty)
                  _buildHakkinda(u),
                _buildAramaButonlari(u),
                _buildYorumlar(),
                const SizedBox(height: 30),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppBar(Usta u) {
    final foto = u.fotograflar.isNotEmpty ? u.fotograflar.first : null;
    return SliverAppBar(
      expandedHeight: 260,
      pinned: true,
      backgroundColor: AppColors.primary,
      leading: Container(
        margin: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.3),
          shape: BoxShape.circle,
        ),
        child: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      actions: [
        Container(
          margin: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.3),
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: Icon(
              _favori ? Icons.favorite_rounded : Icons.favorite_border_rounded,
              color: _favori ? Colors.red : Colors.white,
            ),
            onPressed: _favoriToggle,
          ),
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            foto != null
                ? CachedNetworkImage(
                    imageUrl: '${ApiConfig.uploads}/$foto',
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => _defaultBg(),
                  )
                : _defaultBg(),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.7),
                  ],
                ),
              ),
            ),
            Positioned(
              bottom: 16,
              left: 16,
              right: 16,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    u.tamAd,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.accent.withOpacity(0.85),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          u.kategoriAd,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      if (u.puan != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.4),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.star_rounded,
                                  color: AppColors.accent, size: 14),
                              const SizedBox(width: 3),
                              Text(
                                u.puan!.toStringAsFixed(1),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _defaultBg() => Container(
        decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
        child: const Icon(Icons.person_rounded, size: 100, color: Colors.white24),
      );

  Widget _buildProfil(Usta u) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _statItem(
            Icons.star_rounded,
            u.puan != null ? u.puan!.toStringAsFixed(1) : '-',
            'Puan',
            AppColors.accent,
          ),
          Container(width: 1, height: 40, color: Colors.grey.shade200),
          _statItem(
            Icons.comment_rounded,
            '${u.yorumSayisi}',
            'Yorum',
            const Color(0xFF3498db),
          ),
          Container(width: 1, height: 40, color: Colors.grey.shade200),
          _statItem(
            Icons.location_on_rounded,
            u.sehir ?? 'KKTC',
            'Şehir',
            const Color(0xFF2ecc71),
          ),
        ],
      ),
    );
  }

  Widget _statItem(IconData ikon, String deger, String label, Color renk) {
    return Column(
      children: [
        Icon(ikon, color: renk, size: 22),
        const SizedBox(height: 4),
        Text(
          deger,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: AppColors.textPrimary,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildBilgiler(Usta u) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'İletişim Bilgileri',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          _infoRow(Icons.work_outline_rounded, 'Meslek', u.kategoriAd,
              AppColors.primary),
          if (u.sehir != null)
            _infoRow(Icons.location_on_outlined, 'Konum', u.konumText,
                const Color(0xFF2ecc71)),
          _infoRow(Icons.phone_outlined, 'Telefon', u.telefon,
              const Color(0xFF3498db)),
          if (u.email != null)
            _infoRow(Icons.email_outlined, 'E-posta', u.email!,
                const Color(0xFFe74c3c)),
        ],
      ),
    );
  }

  Widget _infoRow(IconData ikon, String label, String deger, Color renk) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: renk.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(ikon, size: 18, color: renk),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  deger,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHakkinda(Usta u) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Hakkında',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            u.aciklama!,
            style: const TextStyle(
              color: AppColors.textSecondary,
              height: 1.6,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAramaButonlari(Usta u) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: _ara,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.phone_rounded, color: Colors.white, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Ara',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              onTap: _whatsapp,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF25D366), Color(0xFF128C7E)],
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF25D366).withOpacity(0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.chat_rounded, color: Colors.white, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'WhatsApp',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: _yorumEkleDialog,
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.accent.withOpacity(0.15),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.accent.withOpacity(0.4)),
              ),
              child: const Icon(Icons.rate_review_rounded,
                  color: AppColors.accent, size: 22),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildYorumlar() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                const Text(
                  'Yorumlar',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${_yorumlar.length}',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_yorumlar.isEmpty)
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Text(
                'Henüz yorum yok. İlk yorumu sen yaz!',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            )
          else
            ..._yorumlar.map((y) => _yorumKart(y)),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _yorumKart(Yorum y) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Colors.grey.shade100),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                y.mustadAd.isNotEmpty ? y.mustadAd[0].toUpperCase() : '?',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      y.mustadAd,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Row(
                      children: List.generate(
                        5,
                        (i) => Icon(
                          Icons.star_rounded,
                          size: 14,
                          color: i < y.puan
                              ? AppColors.accent
                              : Colors.grey.shade300,
                        ),
                      ),
                    ),
                  ],
                ),
                if (y.yorum != null && y.yorum!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    y.yorum!,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
