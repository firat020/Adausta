import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/api_service.dart';

class UstaPanelDashboard extends StatefulWidget {
  final ApiService api;
  const UstaPanelDashboard({super.key, required this.api});

  @override
  State<UstaPanelDashboard> createState() => _UstaPanelDashboardState();
}

class _UstaPanelDashboardState extends State<UstaPanelDashboard> {
  Map<String, dynamic>? _veri;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  Future<void> _yukle() async {
    setState(() => _loading = true);
    try {
      final d = await widget.api.ustaPanelDashboard();
      if (mounted) setState(() { _veri = d; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }
    if (_veri == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.textSecondary),
            const SizedBox(height: 12),
            const Text('Yüklenemedi', style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _yukle, child: const Text('Tekrar Dene')),
          ],
        ),
      );
    }

    final s = _veri!['istatistik'] as Map<String, dynamic>;
    final usta = _veri!['usta'] as Map<String, dynamic>;
    final sonTalepler = (_veri!['son_talepler'] as List?) ?? [];

    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: _yukle,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Merhaba satırı
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Merhaba, ${usta['ad'] ?? ''}! 👋',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        usta['onaylanmis'] == true ? 'Hesabınız onaylı ✓' : 'Hesabınız onay bekliyor',
                        style: TextStyle(
                          fontSize: 12,
                          color: usta['onaylanmis'] == true ? AppColors.success : AppColors.accent,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Stat kartları — 2x2 grid
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: [
                _StatKart(ikon: Icons.assignment_rounded,   renk: const Color(0xFF3498db), baslik: 'Toplam Talep',  deger: '${s['toplam_talep'] ?? 0}', alt: 'Bu ay: ${s['bu_ay_talep'] ?? 0}'),
                _StatKart(ikon: Icons.hourglass_top_rounded, renk: const Color(0xFFf39c12), baslik: 'Bekleyen',      deger: '${s['bekleyen'] ?? 0}',      alt: 'Yanıt bekliyor'),
                _StatKart(ikon: Icons.check_circle_rounded, renk: const Color(0xFF2ecc71), baslik: 'Tamamlanan',    deger: '${s['tamamlandi'] ?? 0}',    alt: 'Başarıyla yapıldı'),
                _StatKart(ikon: Icons.star_rounded,         renk: AppColors.accent,        baslik: 'Ortalama Puan', deger: s['puan'] != null && s['puan'] != 0 ? '${s['puan']}' : '-', alt: '${s['toplam_yorum'] ?? 0} yorum'),
              ],
            ),
            const SizedBox(height: 20),

            // Görüntüleme / Arama / WhatsApp
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.07), blurRadius: 12, offset: const Offset(0, 4))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Son 30 Gün', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.textPrimary)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _MiniStat(ikon: Icons.visibility_rounded,     renk: const Color(0xFF9b59b6), deger: '${s['goruntuleme_30gun'] ?? 0}', label: 'Görüntüleme'),
                      _MiniStat(ikon: Icons.phone_rounded,           renk: const Color(0xFF3498db), deger: '${s['arama_30gun'] ?? 0}',       label: 'Arama'),
                      _MiniStat(ikon: Icons.chat_rounded,            renk: AppColors.success,       deger: '${s['whatsapp_30gun'] ?? 0}',    label: 'WhatsApp'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Son talepler
            if (sonTalepler.isNotEmpty) ...[
              const Text('Son Talepler', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.textPrimary)),
              const SizedBox(height: 10),
              ...sonTalepler.map((t) => _TalepSatir(talep: t as Map<String, dynamic>)),
            ],

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

class _StatKart extends StatelessWidget {
  final IconData ikon;
  final Color renk;
  final String baslik;
  final String deger;
  final String alt;

  const _StatKart({required this.ikon, required this.renk, required this.baslik, required this.deger, required this.alt});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: renk.withOpacity(0.12), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(baslik, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(color: renk.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
                child: Icon(ikon, size: 16, color: renk),
              ),
            ],
          ),
          Text(deger, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
          Text(alt, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final IconData ikon;
  final Color renk;
  final String deger;
  final String label;

  const _MiniStat({required this.ikon, required this.renk, required this.deger, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(color: renk.withOpacity(0.1), shape: BoxShape.circle),
          child: Icon(ikon, color: renk, size: 20),
        ),
        const SizedBox(height: 6),
        Text(deger, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
      ],
    );
  }
}

class _TalepSatir extends StatelessWidget {
  final Map<String, dynamic> talep;
  const _TalepSatir({required this.talep});

  static const _durumRenk = {
    'bekliyor':   Color(0xFFf39c12),
    'kabul':      Color(0xFF3498db),
    'tamamlandi': Color(0xFF2ecc71),
    'red':        Color(0xFFe74c3c),
  };
  static const _durumLabel = {
    'bekliyor': 'Bekliyor', 'kabul': 'Kabul',
    'tamamlandi': 'Tamamlandı', 'red': 'Reddedildi',
  };

  @override
  Widget build(BuildContext context) {
    final durum = talep['durum'] as String? ?? 'bekliyor';
    final renk = _durumRenk[durum] ?? AppColors.textSecondary;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(talep['baslik'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text('${talep['musteri_ad'] ?? ''} · ${talep['olusturma'] ?? ''}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: renk.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
            child: Text(_durumLabel[durum] ?? durum, style: TextStyle(fontSize: 11, color: renk, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}
