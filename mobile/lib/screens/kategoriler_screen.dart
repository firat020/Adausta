import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import '../models/kategori.dart';
import '../services/api_service.dart';
import '../widgets/shimmer_loading.dart';
import 'usta_listesi_screen.dart';

class KategorilerScreen extends StatefulWidget {
  const KategorilerScreen({super.key});

  @override
  State<KategorilerScreen> createState() => _KategorilerScreenState();
}

class _KategorilerScreenState extends State<KategorilerScreen> {
  final _api = ApiService();
  List<Kategori> _kategoriler = [];
  bool _loading = true;
  String? _hata;

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  Future<void> _yukle() async {
    setState(() {
      _loading = true;
      _hata = null;
    });
    try {
      final list = await _api.getKategoriler();
      if (mounted) {
        setState(() {
          _kategoriler = list;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _hata = e.toString();
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        color: AppColors.accent,
        onRefresh: _yukle,
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              pinned: true,
              expandedHeight: 130,
              backgroundColor: AppColors.primary,
              flexibleSpace: FlexibleSpaceBar(
                title: const Text(
                  'Kategoriler',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: AppColors.heroGradient,
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        right: -20,
                        bottom: -20,
                        child: Icon(
                          Icons.grid_view_rounded,
                          color: Colors.white.withOpacity(0.08),
                          size: 140,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (_loading)
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverGrid(
                  delegate: SliverChildBuilderDelegate(
                    (_, __) => const ShimmerKategoriKart(),
                    childCount: 8,
                  ),
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.15,
                  ),
                ),
              )
            else if (_hata != null)
              SliverFillRemaining(
                child: BosDurum(
                  mesaj: 'Kategoriler yüklenemedi',
                  ikon: Icons.error_outline_rounded,
                  onRetry: _yukle,
                ),
              )
            else if (_kategoriler.isEmpty)
              const SliverFillRemaining(
                child: BosDurum(
                  mesaj: 'Kategori bulunamadı',
                  ikon: Icons.category_rounded,
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverGrid(
                  delegate: SliverChildBuilderDelegate(
                    (_, i) => _KategoriKart(
                      kategori: _kategoriler[i],
                      renk: _renkler[i % _renkler.length],
                      ikon: _ikonBul(_kategoriler[i].ad, i),
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => UstaListesiScreen(
                            kategoriId: _kategoriler[i].id,
                            baslik: _kategoriler[i].ad,
                          ),
                        ),
                      ),
                    ),
                    childCount: _kategoriler.length,
                  ),
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.15,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  static const List<Color> _renkler = [
    Color(0xFF3498db),
    Color(0xFFe74c3c),
    Color(0xFF2ecc71),
    Color(0xFFf39c12),
    Color(0xFF9b59b6),
    Color(0xFF1abc9c),
    Color(0xFFe67e22),
    Color(0xFF34495e),
    Color(0xFFc0392b),
    Color(0xFF16a085),
    Color(0xFF8e44ad),
    Color(0xFF2980b9),
  ];

  IconData _ikonBul(String ad, int i) {
    final a = ad.toLowerCase();
    if (a.contains('elektrik')) return Icons.electrical_services_rounded;
    if (a.contains('su') || a.contains('tesisat')) return Icons.plumbing_rounded;
    if (a.contains('boya')) return Icons.format_paint_rounded;
    if (a.contains('mobilya') || a.contains('marangoz')) return Icons.chair_rounded;
    if (a.contains('temizlik')) return Icons.cleaning_services_rounded;
    if (a.contains('klima')) return Icons.ac_unit_rounded;
    if (a.contains('bahçe')) return Icons.grass_rounded;
    if (a.contains('inşaat')) return Icons.construction_rounded;
    if (a.contains('cam')) return Icons.window_rounded;
    if (a.contains('kilit') || a.contains('çilingir')) return Icons.lock_rounded;
    const ikonlar = [
      Icons.build_rounded,
      Icons.handyman_rounded,
      Icons.home_repair_service_rounded,
      Icons.engineering_rounded,
      Icons.carpenter_rounded,
      Icons.electrical_services_rounded,
    ];
    return ikonlar[i % ikonlar.length];
  }
}

class _KategoriKart extends StatelessWidget {
  final Kategori kategori;
  final Color renk;
  final IconData ikon;
  final VoidCallback onTap;

  const _KategoriKart({
    required this.kategori,
    required this.renk,
    required this.ikon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: renk.withOpacity(0.2),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [renk, renk.withOpacity(0.75)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: renk.withOpacity(0.35),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Icon(ikon, color: Colors.white, size: 30),
            ),
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text(
                kategori.ad,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            if (kategori.ustaSayisi != null && kategori.ustaSayisi! > 0) ...[
              const SizedBox(height: 4),
              Text(
                '${kategori.ustaSayisi} usta',
                style: TextStyle(
                  fontSize: 11,
                  color: renk,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
