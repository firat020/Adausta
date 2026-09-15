import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/api_service.dart';

class UstaPanelIstatistik extends StatefulWidget {
  final ApiService api;
  const UstaPanelIstatistik({super.key, required this.api});

  @override
  State<UstaPanelIstatistik> createState() => _UstaPanelIstatistikState();
}

class _UstaPanelIstatistikState extends State<UstaPanelIstatistik> {
  Map<String, dynamic>? _veri;
  bool _loading = true;
  int _aralik = 30;

  static const _araliklar = [7, 30, 90];

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  Future<void> _yukle() async {
    setState(() => _loading = true);
    try {
      final d = await widget.api.ustaIstatistikler(aralik: _aralik);
      if (mounted) setState(() { _veri = d; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: AppColors.primary, title: const Text('İstatistiklerim')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _veri == null
              ? Center(
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
                )
              : RefreshIndicator(
                  color: AppColors.accent,
                  onRefresh: _yukle,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Row(
                        children: _araliklar.map((a) {
                          final aktif = a == _aralik;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: GestureDetector(
                              onTap: () { setState(() => _aralik = a); _yukle(); },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                                decoration: BoxDecoration(
                                  color: aktif ? AppColors.primary : Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: aktif ? Colors.transparent : Colors.grey.shade300),
                                ),
                                child: Text(
                                  '$a Gün',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: aktif ? Colors.white : AppColors.textSecondary),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(child: _BuyukKart(ikon: Icons.star_rounded, renk: AppColors.accent, deger: '${_veri!['ort_puan'] ?? '-'}', label: 'Ortalama Puan')),
                          const SizedBox(width: 12),
                          Expanded(child: _BuyukKart(ikon: Icons.trending_up_rounded, renk: const Color(0xFF3498db), deger: '${_veri!['toplam_yorum'] ?? 0}', label: 'Toplam Yorum')),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _IletisimOzeti(gunlukIletisim: (_veri!['gunluk_iletisim'] as List?) ?? const []),
                      const SizedBox(height: 16),
                      _DagilimKart(
                        baslik: 'Talep Durum Dağılımı',
                        veriler: {
                          'Bekleyen': [((_veri!['durum_dagilim']?['bekliyor'] as num?) ?? 0), const Color(0xFFf39c12)],
                          'Kabul': [((_veri!['durum_dagilim']?['kabul'] as num?) ?? 0), const Color(0xFF3498db)],
                          'Tamamlanan': [((_veri!['durum_dagilim']?['tamamlandi'] as num?) ?? 0), const Color(0xFF2ecc71)],
                          'Reddedilen': [((_veri!['durum_dagilim']?['red'] as num?) ?? 0), const Color(0xFFe74c3c)],
                        },
                      ),
                      const SizedBox(height: 16),
                      _DagilimKart(
                        baslik: 'Puan Dağılımı',
                        veriler: {
                          for (final p in [5, 4, 3, 2, 1])
                            '$p ★': [((_veri!['puan_dagilim']?['$p'] as num?) ?? 0), AppColors.accent],
                        },
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
    );
  }
}

class _BuyukKart extends StatelessWidget {
  final IconData ikon;
  final Color renk;
  final String deger;
  final String label;
  const _BuyukKart({required this.ikon, required this.renk, required this.deger, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [BoxShadow(color: renk.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(children: [
        Icon(ikon, color: renk, size: 26),
        const SizedBox(height: 8),
        Text(deger, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary), textAlign: TextAlign.center),
      ]),
    );
  }
}

class _IletisimOzeti extends StatelessWidget {
  final List gunlukIletisim;
  const _IletisimOzeti({required this.gunlukIletisim});

  @override
  Widget build(BuildContext context) {
    int ara = 0, wp = 0, gr = 0;
    for (final g in gunlukIletisim) {
      final gm = g as Map<String, dynamic>;
      ara += ((gm['ara'] as num?) ?? 0).toInt();
      wp += ((gm['whatsapp'] as num?) ?? 0).toInt();
      gr += ((gm['goruntule'] as num?) ?? 0).toInt();
    }
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.06), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('İletişim Özeti', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.textPrimary)),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _MiniIletisim(ikon: Icons.phone_rounded, renk: const Color(0xFF3498db), deger: ara, label: 'Arama'),
              _MiniIletisim(ikon: Icons.chat_rounded, renk: AppColors.success, deger: wp, label: 'WhatsApp'),
              _MiniIletisim(ikon: Icons.visibility_rounded, renk: const Color(0xFF9b59b6), deger: gr, label: 'Görüntüleme'),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniIletisim extends StatelessWidget {
  final IconData ikon;
  final Color renk;
  final int deger;
  final String label;
  const _MiniIletisim({required this.ikon, required this.renk, required this.deger, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(color: renk.withValues(alpha: 0.1), shape: BoxShape.circle),
        child: Icon(ikon, color: renk, size: 18),
      ),
      const SizedBox(height: 6),
      Text('$deger', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
      Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
    ]);
  }
}

class _DagilimKart extends StatelessWidget {
  final String baslik;
  final Map<String, List<dynamic>> veriler; // label -> [deger(num), renk(Color)]
  const _DagilimKart({required this.baslik, required this.veriler});

  @override
  Widget build(BuildContext context) {
    final maxDeger = veriler.values.map((v) => (v[0] as num).toDouble()).fold<double>(1, (a, b) => b > a ? b : a);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.06), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(baslik, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.textPrimary)),
          const SizedBox(height: 14),
          ...veriler.entries.map((e) {
            final deger = (e.value[0] as num).toDouble();
            final renk = e.value[1] as Color;
            final yuzde = maxDeger > 0 ? deger / maxDeger : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  SizedBox(width: 78, child: Text(e.key, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w600))),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: yuzde.clamp(0, 1).toDouble(),
                        minHeight: 8,
                        backgroundColor: AppColors.background,
                        valueColor: AlwaysStoppedAnimation(renk),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(width: 24, child: Text('${deger.toInt()}', textAlign: TextAlign.right, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary))),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
