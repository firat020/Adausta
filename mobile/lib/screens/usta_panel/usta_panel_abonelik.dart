import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/api_service.dart';

class UstaPanelAbonelik extends StatefulWidget {
  final ApiService api;
  const UstaPanelAbonelik({super.key, required this.api});

  @override
  State<UstaPanelAbonelik> createState() => _UstaPanelAbonelikState();
}

class _UstaPanelAbonelikState extends State<UstaPanelAbonelik> {
  Map<String, dynamic>? _veri;
  bool _loading = true;
  bool _guncelleniyor = false;
  String? _hata;

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  Future<void> _yukle() async {
    setState(() { _loading = true; _hata = null; });
    try {
      final d = await widget.api.ustaAbonelik();
      if (mounted) setState(() { _veri = d; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _hata = e.toString().replaceAll('Exception: ', ''); _loading = false; });
    }
  }

  Future<void> _otomatikYenilemeDegistir(bool acik) async {
    setState(() => _guncelleniyor = true);
    try {
      await widget.api.ustaAbonelikOtomatikYenileme(acik);
      await _yukle();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
        );
      }
    }
    if (mounted) setState(() => _guncelleniyor = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: AppColors.primary, title: const Text('Abonelik Durumum')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _veri == null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.textSecondary),
                      const SizedBox(height: 12),
                      Text(_hata ?? 'Yüklenemedi', style: const TextStyle(color: AppColors.textSecondary)),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _yukle, child: const Text('Tekrar Dene')),
                    ],
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.accent,
                  onRefresh: _yukle,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(gradient: AppColors.heroGradient, borderRadius: BorderRadius.circular(20)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              const Icon(Icons.workspace_premium_rounded, color: Colors.white, size: 22),
                              const SizedBox(width: 8),
                              Text(
                                '${_veri!['plan'] ?? 'ücretsiz'}'.toUpperCase(),
                                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                              ),
                            ]),
                            if (_veri!['plan_bitis'] != null) ...[
                              const SizedBox(height: 8),
                              Text(
                                'Bitiş: ${_veri!['plan_bitis']}',
                                style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 12),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
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
                            const Text('Ödeme Kartı', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.textPrimary)),
                            const SizedBox(height: 12),
                            if (_veri!['kayitli_kart_var'] == true) ...[
                              Row(
                                children: [
                                  Icon(
                                    Icons.refresh_rounded,
                                    size: 18,
                                    color: (_veri!['abonelik']?['otomatik_yenileme'] == true) ? AppColors.success : Colors.grey,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Otomatik yenileme ${(_veri!['abonelik']?['otomatik_yenileme'] == true) ? 'açık' : 'kapalı'}',
                                      style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                                    ),
                                  ),
                                  Switch(
                                    value: _veri!['abonelik']?['otomatik_yenileme'] == true,
                                    onChanged: _guncelleniyor ? null : _otomatikYenilemeDegistir,
                                    activeColor: AppColors.success,
                                  ),
                                ],
                              ),
                            ] else
                              const Text(
                                'Kayıtlı kartınız yok. Bir sonraki ödemenizde "kartımı kaydet" seçeneğini işaretlerseniz otomatik yenileme açılabilir.',
                                style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.5),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}
