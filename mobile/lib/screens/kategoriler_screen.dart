import 'package:flutter/material.dart';
import '../models/kategori.dart';
import '../services/api_service.dart';
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

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final list = await _api.getKategoriler();
      setState(() {
        _kategoriler = list;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kategoriler'),
        backgroundColor: const Color(0xFF1e3a5f),
        foregroundColor: Colors.white,
      ),
      backgroundColor: const Color(0xFFF5F7FA),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 1.4,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: _kategoriler.length,
              itemBuilder: (_, i) {
                final k = _kategoriler[i];
                return GestureDetector(
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => UstaListesiScreen(kategori: k.ad)),
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                            color: Colors.black.withOpacity(0.07),
                            blurRadius: 8)
                      ],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.build,
                            color: Color(0xFF1e3a5f), size: 32),
                        const SizedBox(height: 8),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: Text(
                            k.ad,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 13),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (k.ustaSayisi != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            '${k.ustaSayisi} usta',
                            style: TextStyle(
                                color: Colors.grey[500], fontSize: 11),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
