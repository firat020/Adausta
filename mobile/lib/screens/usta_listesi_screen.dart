import 'package:flutter/material.dart';
import '../models/usta.dart';
import '../services/api_service.dart';
import '../widgets/usta_kart.dart';
import 'usta_detay_screen.dart';

class UstaListesiScreen extends StatefulWidget {
  final String? kategori;

  const UstaListesiScreen({super.key, this.kategori});

  @override
  State<UstaListesiScreen> createState() => _UstaListesiScreenState();
}

class _UstaListesiScreenState extends State<UstaListesiScreen> {
  final _api = ApiService();
  final _aramaCtrl = TextEditingController();
  List<Usta> _ustalar = [];
  bool _loading = true;
  String _aramaMetni = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final list = await _api.getUstalar(
        kategori: widget.kategori,
        arama: _aramaMetni.isNotEmpty ? _aramaMetni : null,
      );
      setState(() {
        _ustalar = list;
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
      appBar: AppBar(
        title: Text(widget.kategori ?? 'Ustalar'),
        backgroundColor: const Color(0xFF1e3a5f),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _aramaCtrl,
              decoration: InputDecoration(
                hintText: 'Ad, soyad veya meslek ara...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _aramaMetni.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _aramaCtrl.clear();
                          setState(() => _aramaMetni = '');
                          _load();
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFF1e3a5f), width: 2),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFF1e3a5f), width: 2),
                ),
                filled: true,
                fillColor: Colors.white,
              ),
              onChanged: (v) => setState(() => _aramaMetni = v),
              onSubmitted: (_) => _load(),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _ustalar.isEmpty
                    ? const Center(child: Text('Usta bulunamadı'))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          itemCount: _ustalar.length,
                          itemBuilder: (_, i) => UstaKart(
                            usta: _ustalar[i],
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      UstaDetayScreen(ustaId: _ustalar[i].id)),
                            ),
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
