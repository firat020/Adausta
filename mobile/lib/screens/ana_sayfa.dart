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

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  Future<void> _yukle() async {
    setState(() { _loading = true; _hata = null; });
    try {
      final results = await Future.wait([_api.getKategoriler(), _api.getUstalar()]);
      if (mounted) {
        final ustalar = results[1] as List<Usta>;
        ustalar.sort((a, b) => (b.puan ?? 0).compareTo(a.puan ?? 0));
        setState(() {
          _kategoriler = results[0] as List<Kategori>;
          _oneCikanUstalar = ustalar.take(6).toList();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _hata = e.toString(); _loading = false; });
    }
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
            _buildHero(),
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
              _buildKategoriler(),
              _buildOneCikanBaslik(),
              _buildUstalar(),
              const SliverToBoxAdapter(child: SizedBox(height: 24)),
            ],
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const UstaKayitScreen())),
        backgroundColor: AppColors.accent,
        elevation: 4,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('Usta Ekle', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildHero() {
    return SliverAppBar(
      expandedHeight: 230,
      floating: false,
      pinned: true,
      backgroundColor: AppColors.primary,
      elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(gradient: AppColors.heroGradient),
          child: Stack(
            children: [
              // Decorative circles
              Positioned(
                top: -40,
                right: -40,
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.04),
                  ),
                ),
              ),
              Positioned(
                bottom: 20,
                right: 30,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.accent.withOpacity(0.1),
                  ),
                ),
              ),
              // Content
              SafeArea(
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
                              Text(
                                'Merhaba! 👋',
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.75),
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 2),
                              const Text(
                                'Ada Usta',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 30,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                          // Logo circle
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withOpacity(0.12),
                              border: Border.all(color: AppColors.accent.withOpacity(0.5), width: 1.5),
                            ),
                            padding: const EdgeInsets.all(7),
                            child: Image.asset('assets/images/ada-usta-logo.png', fit: BoxFit.contain),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      // Arama kutusu
                      GestureDetector(
                        onTap: () => Navigator.push(context,
                            MaterialPageRoute(builder: (_) => const UstaListesiScreen())),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.12),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.search_rounded, color: AppColors.primary.withOpacity(0.5), size: 20),
                              const SizedBox(width: 10),
                              Text(
                                'Usta ara... (elektrikçi, tesisatçı...)',
                                style: TextStyle(
                                  color: AppColors.textSecondary.withOpacity(0.8),
                                  fontSize: 14,
                                ),
                              ),
                              const Spacer(),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: AppColors.accent.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.tune_rounded, size: 16, color: AppColors.accent),
                              ),
                            ],
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
      title: const Text('Ada Usta', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
    );
  }

  Widget _buildKategoriler() {
    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 22, 20, 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Kategoriler',
                  style: TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                GestureDetector(
                  onTap: () {},
                  child: const Text(
                    'Tümü →',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 100,
            child: _kategoriler.isEmpty
                ? const SizedBox()
                : ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _kategoriler.length.clamp(0, 10),
                    itemBuilder: (_, i) => _KategoriChip(
                      kategori: _kategoriler[i],
                      renk: _renkler[i % _renkler.length],
                      ikon: _ikonBul(_kategoriler[i].ad),
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
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildOneCikanBaslik() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 10),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Öne Çıkan Ustalar',
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            GestureDetector(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const UstaListesiScreen()),
              ),
              child: const Text(
                'Tümünü Gör →',
                style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUstalar() {
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
            MaterialPageRoute(builder: (_) => UstaDetayScreen(ustaId: _oneCikanUstalar[i].id)),
          ),
        ),
        childCount: _oneCikanUstalar.length,
      ),
    );
  }

  static const List<Color> _renkler = [
    Color(0xFF3498db), Color(0xFFe74c3c), Color(0xFF2ecc71),
    Color(0xFFf39c12), Color(0xFF9b59b6), Color(0xFF1abc9c),
    Color(0xFFe67e22), Color(0xFF34495e), Color(0xFFc0392b), Color(0xFF16a085),
  ];

  IconData _ikonBul(String ad) {
    final a = ad.toLowerCase();
    if (a.contains('elektrik'))             return Icons.electrical_services_rounded;
    if (a.contains('su') || a.contains('tesisat')) return Icons.plumbing_rounded;
    if (a.contains('boya'))                 return Icons.format_paint_rounded;
    if (a.contains('mobilya') || a.contains('marangoz')) return Icons.chair_rounded;
    if (a.contains('temizlik'))             return Icons.cleaning_services_rounded;
    if (a.contains('klima'))                return Icons.ac_unit_rounded;
    if (a.contains('bahçe'))               return Icons.grass_rounded;
    if (a.contains('inşaat'))              return Icons.construction_rounded;
    if (a.contains('cam'))                  return Icons.window_rounded;
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
        width: 78,
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
                  BoxShadow(color: renk.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Icon(ikon, color: Colors.white, size: 27),
            ),
            const SizedBox(height: 7),
            Text(
              kategori.ad,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 10.5,
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
