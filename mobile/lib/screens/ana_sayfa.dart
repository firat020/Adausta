import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import '../models/usta.dart';
import '../models/kategori.dart';
import '../services/api_service.dart';
import '../widgets/usta_kart.dart';
import '../widgets/shimmer_loading.dart';
import 'usta_listesi_screen.dart';
import 'usta_detay_screen.dart';
import 'usta_kayit_screen.dart';

class AnaSayfa extends StatefulWidget {
  const AnaSayfa({super.key});

  @override
  State<AnaSayfa> createState() => _AnaSayfaState();
}

class _AnaSayfaState extends State<AnaSayfa> {
  final _api = ApiService();
  List<Kategori> _kategoriler = [];
  List<Usta> _oneCikanUstalar = [];
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
    setState(() {
      _loading = true;
      _hata = null;
    });
    try {
      final results = await Future.wait([
        _api.getKategoriler(),
        _api.getUstalar(),
      ]);
      if (mounted) {
        final ustalar = results[1] as List<Usta>;
        ustalar.sort((a, b) => (b.puan ?? 0).compareTo(a.puan ?? 0));
        setState(() {
          _kategoriler = results[0] as List<Kategori>;
          _oneCikanUstalar = ustalar.take(5).toList();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() {
        _hata = e.toString();
        _loading = false;
      });
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
            _buildSliverAppBar(),
            if (_loading)
              const SliverFillRemaining(child: ShimmerList(count: 4))
            else if (_hata != null)
              SliverFillRemaining(
                child: BosDurum(
                  mesaj: 'Bağlantı Hatası',
                  altMesaj: 'İnternet bağlantınızı kontrol edin',
                  ikon: Icons.wifi_off_rounded,
                  onRetry: _yukle,
                ),
              )
            else ...[
              _buildKategorilerSection(),
              _buildOneCikanBaslik(),
              _buildOneCikanUstalar(),
              const SliverToBoxAdapter(child: SizedBox(height: 20)),
            ],
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const UstaKayitScreen()),
        ),
        backgroundColor: AppColors.accent,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text(
          'Usta Ekle',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 220,
      floating: false,
      pinned: true,
      backgroundColor: AppColors.primary,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(gradient: AppColors.heroGradient),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Merhaba! 👋',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                          const Text(
                            'Ada Usta',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          shape: BoxShape.circle,
                          border: Border.all(
                              color: AppColors.accent.withOpacity(0.5)),
                        ),
                        padding: const EdgeInsets.all(6),
                        child: Image.asset(
                          'assets/images/ada-usta-logo.png',
                          fit: BoxFit.contain,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const UstaListesiScreen(),
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                            color: Colors.white.withOpacity(0.3)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.search_rounded,
                              color: Colors.white70, size: 20),
                          SizedBox(width: 10),
                          Text(
                            'Usta ara...',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 15,
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
        ),
      ),
      title: const Text(
        'Ada Usta',
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: 20,
        ),
      ),
    );
  }

  Widget _buildKategorilerSection() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Kategoriler',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                TextButton(
                  onPressed: () {},
                  child: const Text(
                    'Tümü',
                    style: TextStyle(color: AppColors.primary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 110,
              child: _kategoriler.isEmpty
                  ? const Center(
                      child: Text(
                        'Kategori bulunamadı',
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                    )
                  : ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _kategoriler.length.clamp(0, 8),
                      itemBuilder: (_, i) {
                        final kat = _kategoriler[i];
                        return _KategoriChip(
                          kategori: kat,
                          renk: _kategoriRengi(i),
                          ikon: _kategoriIkonu(kat.ad),
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => UstaListesiScreen(
                                kategoriId: kat.id,
                                baslik: kat.ad,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOneCikanBaslik() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Öne Çıkan Ustalar',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            TextButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const UstaListesiScreen()),
              ),
              child: const Text(
                'Tümünü Gör',
                style: TextStyle(color: AppColors.primary),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOneCikanUstalar() {
    if (_oneCikanUstalar.isEmpty) {
      return const SliverToBoxAdapter(
        child: BosDurum(
          mesaj: 'Henüz usta yok',
          altMesaj: 'İlk ustayı eklemek için "Usta Ekle" butonuna tıklayın',
          ikon: Icons.person_off_rounded,
        ),
      );
    }
    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (_, i) => UstaKart(
          usta: _oneCikanUstalar[i],
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => UstaDetayScreen(ustaId: _oneCikanUstalar[i].id),
            ),
          ),
        ),
        childCount: _oneCikanUstalar.length,
      ),
    );
  }

  Color _kategoriRengi(int i) {
    const renkler = [
      Color(0xFF3498db),
      Color(0xFFe74c3c),
      Color(0xFF2ecc71),
      Color(0xFFf39c12),
      Color(0xFF9b59b6),
      Color(0xFF1abc9c),
      Color(0xFFe67e22),
      Color(0xFF34495e),
    ];
    return renkler[i % renkler.length];
  }

  IconData _kategoriIkonu(String ad) {
    final a = ad.toLowerCase();
    if (a.contains('elektrik')) return Icons.electrical_services_rounded;
    if (a.contains('su') || a.contains('tesisat')) return Icons.plumbing_rounded;
    if (a.contains('boyama') || a.contains('boya')) return Icons.format_paint_rounded;
    if (a.contains('mobilya') || a.contains('marangoz')) return Icons.chair_rounded;
    if (a.contains('temizlik')) return Icons.cleaning_services_rounded;
    if (a.contains('klima')) return Icons.ac_unit_rounded;
    if (a.contains('bahçe')) return Icons.grass_rounded;
    if (a.contains('inşaat')) return Icons.construction_rounded;
    if (a.contains('cam')) return Icons.window_rounded;
    if (a.contains('kilit') || a.contains('çilingir')) return Icons.lock_rounded;
    return Icons.build_rounded;
  }
}

class _KategoriChip extends StatelessWidget {
  final Kategori kategori;
  final Color renk;
  final IconData ikon;
  final VoidCallback onTap;

  const _KategoriChip({
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
        width: 80,
        margin: const EdgeInsets.only(right: 10),
        child: Column(
          children: [
            Container(
              width: 62,
              height: 62,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [renk, renk.withOpacity(0.7)],
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
              child: Icon(ikon, color: Colors.white, size: 28),
            ),
            const SizedBox(height: 6),
            Text(
              kategori.ad,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
