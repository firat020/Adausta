import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/api_service.dart';

class UstaPanelBelgeler extends StatefulWidget {
  final ApiService api;
  const UstaPanelBelgeler({super.key, required this.api});

  @override
  State<UstaPanelBelgeler> createState() => _UstaPanelBelgelerState();
}

class _UstaPanelBelgelerState extends State<UstaPanelBelgeler> {
  List<Map<String, dynamic>> _belgeler = [];
  bool _loading = true;
  bool _yukluyor = false;
  String _secilenTur = 'kimlik';
  String? _hata;

  static const _turler = {
    'kimlik': 'Kimlik Belgesi',
    'ustalik_belgesi': 'Ustalık Belgesi',
    'diger': 'Diğer',
  };

  static const _durumRenkArkaplan = {
    'bekliyor': Color(0xFFFEF3C7),
    'onaylandi': Color(0xFFDCFCE7),
    'reddedildi': Color(0xFFFEE2E2),
  };
  static const _durumRenkMetin = {
    'bekliyor': Color(0xFFB45309),
    'onaylandi': Color(0xFF15803D),
    'reddedildi': Color(0xFFB91C1C),
  };
  static const _durumIkon = {
    'bekliyor': Icons.access_time_rounded,
    'onaylandi': Icons.check_circle_rounded,
    'reddedildi': Icons.cancel_rounded,
  };
  static const _durumEtiket = {
    'bekliyor': 'Onay Bekliyor',
    'onaylandi': 'Onaylandı',
    'reddedildi': 'Reddedildi',
  };

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  Future<void> _yukle() async {
    setState(() => _loading = true);
    try {
      final list = await widget.api.ustaBelgeler();
      if (mounted) setState(() { _belgeler = list; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _dosyaSecVeYukle() async {
    setState(() => _hata = null);
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['png', 'jpg', 'jpeg', 'pdf'],
    );
    if (result == null || result.files.single.path == null) return;
    setState(() => _yukluyor = true);
    try {
      await widget.api.ustaBelgeYukle(result.files.single.path!, _secilenTur);
      await _yukle();
    } catch (e) {
      if (mounted) setState(() => _hata = e.toString().replaceAll('Exception: ', ''));
    }
    if (mounted) setState(() => _yukluyor = false);
  }

  Future<void> _sil(int id) async {
    final onay = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Belgeyi Sil'),
        content: const Text('Bu belgeyi silmek istiyor musunuz?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Vazgeç')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Sil', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (onay != true) return;
    try {
      await widget.api.ustaBelgeSil(id);
      _yukle();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: AppColors.primary, title: const Text('Belgelerim')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              color: AppColors.accent,
              onRefresh: _yukle,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.06), blurRadius: 10, offset: const Offset(0, 4))],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Belge Türü', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textSecondary)),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          value: _secilenTur,
                          items: _turler.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
                          onChanged: (v) { if (v != null) setState(() => _secilenTur = v); },
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: AppColors.background,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: _yukluyor ? null : _dosyaSecVeYukle,
                            icon: _yukluyor
                                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Icon(Icons.upload_rounded, size: 18),
                            label: Text(_yukluyor ? 'Yükleniyor...' : 'Dosya Seç ve Yükle'),
                          ),
                        ),
                        if (_hata != null) ...[
                          const SizedBox(height: 8),
                          Text(_hata!, style: const TextStyle(color: AppColors.error, fontSize: 12)),
                        ],
                        const SizedBox(height: 8),
                        const Text(
                          'PNG, JPG veya PDF · Onaylanan belgeler profilinizde "Doğrulanmış Usta" rozeti kazandırır',
                          style: TextStyle(fontSize: 11, color: AppColors.textSecondary, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (_belgeler.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 40),
                      child: Column(
                        children: const [
                          Icon(Icons.description_outlined, size: 48, color: AppColors.textSecondary),
                          SizedBox(height: 12),
                          Text('Henüz belge yüklemediniz', style: TextStyle(color: AppColors.textSecondary)),
                        ],
                      ),
                    )
                  else
                    ..._belgeler.map((b) {
                      final durum = (b['durum'] as String?) ?? 'bekliyor';
                      final bgRenk = _durumRenkArkaplan[durum] ?? _durumRenkArkaplan['bekliyor']!;
                      final metinRenk = _durumRenkMetin[durum] ?? _durumRenkMetin['bekliyor']!;
                      final ikon = _durumIkon[durum] ?? Icons.access_time_rounded;
                      final etiket = _durumEtiket[durum] ?? durum;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 3))],
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(12)),
                              child: const Icon(Icons.description_rounded, color: Color(0xFF2563eb), size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(_turler[b['tur']] ?? '${b['tur']}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                                  Text('${b['olusturma'] ?? ''}', style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                                  if (durum == 'reddedildi' && (b['admin_notu'] ?? '').toString().isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 3),
                                      child: Text('Not: ${b['admin_notu']}', style: const TextStyle(fontSize: 10, color: AppColors.error)),
                                    ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(color: bgRenk, borderRadius: BorderRadius.circular(10)),
                              child: Row(mainAxisSize: MainAxisSize.min, children: [
                                Icon(ikon, size: 12, color: metinRenk),
                                const SizedBox(width: 4),
                                Text(etiket, style: TextStyle(fontSize: 10, color: metinRenk, fontWeight: FontWeight.w700)),
                              ]),
                            ),
                            if (durum != 'onaylandi') ...[
                              const SizedBox(width: 4),
                              IconButton(
                                onPressed: () => _sil(b['id'] as int),
                                icon: const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.textSecondary),
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                              ),
                            ],
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
