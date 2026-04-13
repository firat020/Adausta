import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_theme.dart';
import '../models/usta.dart';
import '../services/api_service.dart';
import '../widgets/usta_kart.dart';
import '../widgets/shimmer_loading.dart';
import 'usta_detay_screen.dart';

class FavorilerScreen extends StatefulWidget {
  const FavorilerScreen({super.key});

  @override
  State<FavorilerScreen> createState() => _FavorilerScreenState();
}

class _FavorilerScreenState extends State<FavorilerScreen> with WidgetsBindingObserver {
  final _api = ApiService();
  List<Usta> _favoriler = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _yukle();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _yukle();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _yukle();
  }

  Future<void> _yukle() async {
    setState(() => _loading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final ids = prefs.getStringList('favoriler') ?? [];
      if (ids.isEmpty) {
        if (mounted) setState(() {
          _favoriler = [];
          _loading = false;
        });
        return;
      }
      final ustalar = await Future.wait(
        ids.map((id) => _api.getUstaDetay(int.parse(id))),
      );
      if (mounted) {
        setState(() {
          _favoriler = ustalar;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _favoridanCikar(int ustaId) async {
    final prefs = await SharedPreferences.getInstance();
    final ids = prefs.getStringList('favoriler') ?? [];
    ids.remove(ustaId.toString());
    await prefs.setStringList('favoriler', ids);
    setState(() {
      _favoriler.removeWhere((u) => u.id == ustaId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 130,
            backgroundColor: AppColors.primary,
            flexibleSpace: FlexibleSpaceBar(
              title: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Favorilerim',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (_favoriler.isNotEmpty) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.accent,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${_favoriler.length}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              background: Container(
                decoration: const BoxDecoration(
                    gradient: AppColors.heroGradient),
                child: Stack(
                  children: [
                    Positioned(
                      right: -10,
                      bottom: -10,
                      child: Icon(
                        Icons.favorite_rounded,
                        color: Colors.white.withOpacity(0.06),
                        size: 140,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (_loading)
            const SliverFillRemaining(child: ShimmerList(count: 4))
          else if (_favoriler.isEmpty)
            const SliverFillRemaining(
              child: BosDurum(
                mesaj: 'Favori usta yok',
                altMesaj:
                    'Usta detayından ♥ butonuna basarak favori ekleyebilirsiniz',
                ikon: Icons.favorite_border_rounded,
              ),
            )
          else
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (_, i) => Dismissible(
                  key: Key('fav-${_favoriler[i].id}'),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 24),
                    margin: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.error,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.delete_rounded,
                            color: Colors.white, size: 28),
                        SizedBox(height: 4),
                        Text(
                          'Kaldır',
                          style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  onDismissed: (_) => _favoridanCikar(_favoriler[i].id),
                  child: UstaKart(
                    usta: _favoriler[i],
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            UstaDetayScreen(ustaId: _favoriler[i].id),
                      ),
                    ).then((_) => _yukle()),
                  ),
                ),
                childCount: _favoriler.length,
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 20)),
        ],
      ),
    );
  }
}
