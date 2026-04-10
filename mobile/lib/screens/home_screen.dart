import 'package:flutter/material.dart';
import '../models/kategori.dart';
import '../models/usta.dart';
import '../services/api_service.dart';
import '../widgets/usta_kart.dart';
import 'usta_detay_screen.dart';
import 'usta_listesi_screen.dart';
import 'kategoriler_screen.dart';
import 'en_yakin_screen.dart';
import 'usta_kayit_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _api = ApiService();
  List<Kategori> _kategoriler = [];
  List<Usta> _iyiUstalar = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final k = await _api.getKategoriler();
      final u = await _api.getUstalar();
      setState(() {
        _kategoriler = k.take(6).toList();
        _iyiUstalar = u
            .where((e) => e.puan != null)
            .toList()
          ..sort((a, b) => (b.puan ?? 0).compareTo(a.puan ?? 0));
        _iyiUstalar = _iyiUstalar.take(5).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: CustomScrollView(
                slivers: [
                  _buildHero(),
                  _buildKategoriler(),
                  _buildIyiUstalar(),
                ],
              ),
            ),
      bottomNavigationBar: _buildBottomNav(context),
    );
  }

  Widget _buildHero() {
    return SliverToBoxAdapter(
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF1e3a5f), Color(0xFF16213e)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: const EdgeInsets.fromLTRB(20, 60, 20, 30),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Adausta',
              style: TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              "KKTC'nin Usta Platformu",
              style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14),
            ),
            const SizedBox(height: 20),
            GestureDetector(
              onTap: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => const UstaListesiScreen())),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.search, color: Color(0xFF1e3a5f)),
                    const SizedBox(width: 8),
                    Text('Usta ara...', style: TextStyle(color: Colors.grey[500])),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildKategoriler() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Kategoriler',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                TextButton(
                  onPressed: () => Navigator.push(context,
                      MaterialPageRoute(builder: (_) => const KategorilerScreen())),
                  child: const Text('Tümü'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                childAspectRatio: 1.1,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
              ),
              itemCount: _kategoriler.length,
              itemBuilder: (_, i) => _kategoriKart(_kategoriler[i]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _kategoriKart(Kategori k) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => UstaListesiScreen(kategori: k.ad),
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 6)
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.build, color: Color(0xFF1e3a5f), size: 28),
            const SizedBox(height: 6),
            Text(
              k.ad,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (k.ustaSayisi != null)
              Text(
                '${k.ustaSayisi} usta',
                style: TextStyle(color: Colors.grey[500], fontSize: 10),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildIyiUstalar() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.only(top: 20, bottom: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Text('En İyi Ustalar',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 12),
            ..._iyiUstalar.map((u) => UstaKart(
                  usta: u,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => UstaDetayScreen(ustaId: u.id)),
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNav(BuildContext context) {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      selectedItemColor: const Color(0xFF1e3a5f),
      unselectedItemColor: Colors.grey,
      currentIndex: 0,
      onTap: (i) {
        if (i == 1) {
          Navigator.push(context,
              MaterialPageRoute(builder: (_) => const KategorilerScreen()));
        } else if (i == 2) {
          Navigator.push(context,
              MaterialPageRoute(builder: (_) => const EnYakinScreen()));
        } else if (i == 3) {
          Navigator.push(context,
              MaterialPageRoute(builder: (_) => const UstaKayitScreen()));
        }
      },
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Ana Sayfa'),
        BottomNavigationBarItem(icon: Icon(Icons.category), label: 'Kategoriler'),
        BottomNavigationBarItem(icon: Icon(Icons.near_me), label: 'Yakınımda'),
        BottomNavigationBarItem(icon: Icon(Icons.person_add), label: 'Usta Ol'),
      ],
    );
  }
}
