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
  List<Kategori> _filtrelenmis = [];
  bool _loading = true;
  String? _hata;
  final _aramaCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  @override
  void dispose() {
    _aramaCtrl.dispose();
    super.dispose();
  }

  Future<void> _yukle() async {
    setState(() { _loading = true; _hata = null; });
    try {
      final list = await _api.getKategoriler();
      if (mounted) {
        setState(() {
          _kategoriler = list;
          _filtrelenmis = list;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _hata = e.toString(); _loading = false; });
    }
  }

  void _filtrele(String arama) {
    setState(() {
      _filtrelenmis = arama.isEmpty
          ? _kategoriler
          : _kategoriler
              .where((k) => k.ad.toLowerCase().contains(arama.toLowerCase()))
              .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.accent,
        onRefresh: _yukle,
        child: CustomScrollView(
          slivers: [
            // Header
            SliverAppBar(
              pinned: true,
              expandedHeight: 160,
              backgroundColor: AppColors.primary,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(gradient: AppColors.heroGradient),
                  child: Stack(
                    children: [
                      Positioned(
                        right: -20,
                        top: -20,
                        child: Container(
                          width: 160,
                          height: 160,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withOpacity(0.05),
                          ),
                        ),
                      ),
                      Positioned(
                        left: -30,
                        bottom: 0,
                        child: Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.accent.withOpacity(0.08),
                          ),
                        ),
                      ),
                      SafeArea(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Kategoriler',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 28,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${_kategoriler.length} hizmet kategorisi',
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.7),
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 14),
                              // Arama kutusu
                              Container(
                                height: 42,
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.white.withOpacity(0.25)),
                                ),
                                child: TextField(
                                  controller: _aramaCtrl,
                                  onChanged: _filtrele,
                                  style: const TextStyle(color: Colors.white, fontSize: 14),
                                  decoration: InputDecoration(
                                    hintText: 'Kategori ara...',
                                    hintStyle: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 14),
                                    prefixIcon: Icon(Icons.search_rounded, color: Colors.white.withOpacity(0.6), size: 18),
                                    border: InputBorder.none,
                                    enabledBorder: InputBorder.none,
                                    focusedBorder: InputBorder.none,
                                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              title: const Text('Kategoriler'),
            ),

            // Grid
            if (_loading)
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverGrid(
                  delegate: SliverChildBuilderDelegate(
                    (_, __) => const ShimmerKategoriKart(),
                    childCount: 8,
                  ),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.1,
                  ),
                ),
              )
            else if (_hata != null)
              SliverFillRemaining(
                child: BosDurum(
                  mesaj: 'Yüklenemedi',
                  ikon: Icons.error_outline_rounded,
                  onRetry: _yukle,
                ),
              )
            else if (_filtrelenmis.isEmpty)
              const SliverFillRemaining(
                child: BosDurum(
                  mesaj: 'Kategori bulunamadı',
                  ikon: Icons.search_off_rounded,
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                sliver: SliverGrid(
                  delegate: SliverChildBuilderDelegate(
                    (_, i) => _KategoriKart(
                      kategori: _filtrelenmis[i],
                      renk: _renkler[_kategoriler.indexOf(_filtrelenmis[i]) % _renkler.length],
                      ikon: _ikonBul(_filtrelenmis[i].ad),
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => UstaListesiScreen(
                            kategoriId: _filtrelenmis[i].id,
                            baslik: _filtrelenmis[i].ad,
                          ),
                        ),
                      ),
                    ),
                    childCount: _filtrelenmis.length,
                  ),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.05,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  static const List<Color> _renkler = [
    Color(0xFF3498db), Color(0xFFe74c3c), Color(0xFF2ecc71),
    Color(0xFFf39c12), Color(0xFF9b59b6), Color(0xFF1abc9c),
    Color(0xFFe67e22), Color(0xFF34495e), Color(0xFFc0392b),
    Color(0xFF16a085), Color(0xFF8e44ad), Color(0xFF2980b9),
    Color(0xFFd35400), Color(0xFF27ae60), Color(0xFF2c3e50),
  ];

  IconData _ikonBul(String ad) {
    final a = ad.toLowerCase();
    if (a.contains('elektrik'))                       return Icons.electrical_services_rounded;
    if (a.contains('su') || a.contains('tesisat'))    return Icons.plumbing_rounded;
    if (a.contains('boya'))                           return Icons.format_paint_rounded;
    if (a.contains('mobilya') || a.contains('marangoz')) return Icons.chair_rounded;
    if (a.contains('temizlik'))                       return Icons.cleaning_services_rounded;
    if (a.contains('klima'))                          return Icons.ac_unit_rounded;
    if (a.contains('bahçe'))                         return Icons.grass_rounded;
    if (a.contains('inşaat'))                        return Icons.construction_rounded;
    if (a.contains('cam'))                            return Icons.window_rounded;
    if (a.contains('kilit') || a.contains('çilingir')) return Icons.lock_rounded;
    if (a.contains('nakliye') || a.contains('taşım')) return Icons.local_shipping_rounded;
    if (a.contains('kombi') || a.contains('ısıtma')) return Icons.local_fire_department_rounded;
    if (a.contains('çatı'))                          return Icons.roofing_rounded;
    if (a.contains('zemin') || a.contains('döşeme')) return Icons.texture_rounded;
    if (a.contains('güvenlik') || a.contains('alarm')) return Icons.security_rounded;
    if (a.contains('anten') || a.contains('tv'))     return Icons.tv_rounded;
    if (a.contains('havuz'))                          return Icons.pool_rounded;
    if (a.contains('asansör'))                       return Icons.elevator_rounded;
    return Icons.build_rounded;
  }
}

// ── Kategori Kart ─────────────────────────────────────────────
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
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: renk.withOpacity(0.15),
              blurRadius: 14,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          children: [
            // Üst renkli alan — ikon
            Expanded(
              flex: 3,
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [renk, renk.withOpacity(0.75)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: Center(
                  child: Icon(ikon, color: Colors.white, size: 38),
                ),
              ),
            ),
            // Alt beyaz alan — başlık + usta sayısı
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      kategori.ad,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                        height: 1.2,
                      ),
                    ),
                    if (kategori.ustaSayisi != null && kategori.ustaSayisi! > 0) ...[
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.person_rounded, size: 11, color: renk),
                          const SizedBox(width: 3),
                          Text(
                            '${kategori.ustaSayisi} usta',
                            style: TextStyle(
                              fontSize: 11,
                              color: renk,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
