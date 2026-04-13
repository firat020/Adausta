import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import '../models/usta.dart';
import '../services/api_service.dart';
import '../widgets/usta_kart.dart';
import '../widgets/shimmer_loading.dart';
import 'usta_detay_screen.dart';

class UstaListesiScreen extends StatefulWidget {
  final int? kategoriId;
  final String? baslik;
  final String? aramaBaslangic;

  const UstaListesiScreen({
    super.key,
    this.kategoriId,
    this.baslik,
    this.aramaBaslangic,
  });

  @override
  State<UstaListesiScreen> createState() => _UstaListesiScreenState();
}

class _UstaListesiScreenState extends State<UstaListesiScreen> {
  final _api = ApiService();
  final _aramaCtrl = TextEditingController();
  List<Usta> _ustalar = [];
  bool _loading = true;
  String? _hata;
  String _aramaMetni = '';

  @override
  void initState() {
    super.initState();
    if (widget.aramaBaslangic != null) {
      _aramaCtrl.text = widget.aramaBaslangic!;
      _aramaMetni = widget.aramaBaslangic!;
    }
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
      final list = await _api.getUstalar(
        kategoriId: widget.kategoriId,
        arama: _aramaMetni.isNotEmpty ? _aramaMetni : null,
      );
      if (mounted) {
        setState(() {
          _ustalar = list;
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
      body: Column(
        children: [
          _buildHeader(),
          _buildAramaKutusu(),
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      decoration: const BoxDecoration(gradient: AppColors.heroGradient),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 8, 16, 16),
          child: Row(
            children: [
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back_ios_rounded,
                    color: Colors.white),
              ),
              Expanded(
                child: Text(
                  widget.baslik ?? 'Tüm Ustalar',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.accent.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: AppColors.accent.withOpacity(0.4)),
                ),
                child: Text(
                  '${_ustalar.length} usta',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAramaKutusu() {
    return Container(
      color: AppColors.primary,
      child: Container(
        decoration: const BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
        ),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        child: TextField(
          controller: _aramaCtrl,
          decoration: InputDecoration(
            hintText: 'Usta ara...',
            hintStyle: const TextStyle(color: AppColors.textSecondary),
            prefixIcon: const Icon(Icons.search_rounded,
                color: AppColors.primary),
            suffixIcon: _aramaMetni.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear_rounded,
                        color: AppColors.textSecondary),
                    onPressed: () {
                      _aramaCtrl.clear();
                      setState(() => _aramaMetni = '');
                      _yukle();
                    },
                  )
                : null,
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(
                  color: AppColors.primary, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(
                horizontal: 16, vertical: 14),
          ),
          onChanged: (v) => setState(() => _aramaMetni = v),
          onSubmitted: (_) => _yukle(),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_loading) {
      return const ShimmerList(count: 6);
    }
    if (_hata != null) {
      return BosDurum(
        mesaj: 'Yükleme hatası',
        altMesaj: 'Tekrar denemek için dokunun',
        ikon: Icons.wifi_off_rounded,
        onRetry: _yukle,
      );
    }
    if (_ustalar.isEmpty) {
      return BosDurum(
        mesaj: 'Usta bulunamadı',
        altMesaj: _aramaMetni.isNotEmpty
            ? '"$_aramaMetni" için sonuç yok'
            : 'Bu kategoride henüz usta bulunmuyor',
        ikon: Icons.person_search_rounded,
      );
    }
    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: _yukle,
      child: ListView.builder(
        padding: const EdgeInsets.only(top: 8, bottom: 20),
        itemCount: _ustalar.length,
        itemBuilder: (_, i) => UstaKart(
          usta: _ustalar[i],
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => UstaDetayScreen(ustaId: _ustalar[i].id),
            ),
          ),
        ),
      ),
    );
  }
}
