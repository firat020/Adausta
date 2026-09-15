import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/api_service.dart';

class UstaPanelMusteriler extends StatefulWidget {
  final ApiService api;
  const UstaPanelMusteriler({super.key, required this.api});

  @override
  State<UstaPanelMusteriler> createState() => _UstaPanelMusterilerState();
}

class _UstaPanelMusterilerState extends State<UstaPanelMusteriler> {
  List<Map<String, dynamic>> _musteriler = [];
  bool _loading = true;
  String _arama = '';
  final _aramaCtrl = TextEditingController();

  static const _durumRenk = {
    'bekliyor': Color(0xFFf39c12),
    'kabul': Color(0xFF3498db),
    'tamamlandi': Color(0xFF2ecc71),
    'red': Color(0xFFe74c3c),
  };
  static const _durumLabel = {
    'bekliyor': 'Bekliyor', 'kabul': 'Kabul', 'tamamlandi': 'Tamamlandı', 'red': 'Reddedildi',
  };

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  @override
  void dispose() {
    _aramaCtrl.dispose();
    super.dispose();
  }

  Future<void> _yukle() async {
    setState(() => _loading = true);
    try {
      final list = await widget.api.ustaMusteriler();
      if (mounted) setState(() { _musteriler = list; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtreli = _musteriler.where((m) {
      final ad = (m['ad'] ?? '').toString().toLowerCase();
      final tel = (m['telefon'] ?? '').toString();
      return ad.contains(_arama.toLowerCase()) || tel.contains(_arama);
    }).toList();
    final toplamTamamlandi = _musteriler.fold<int>(0, (s, m) => s + (((m['tamamlandi'] as num?) ?? 0).toInt()));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        title: const Text('Müşterilerim'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              color: AppColors.accent,
              onRefresh: _yukle,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(
                    children: [
                      Expanded(child: _OzetKart(deger: '${_musteriler.length}', label: 'Toplam Müşteri', renk: const Color(0xFF3498db))),
                      const SizedBox(width: 12),
                      Expanded(child: _OzetKart(deger: '$toplamTamamlandi', label: 'Tamamlanan İş', renk: AppColors.success)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _aramaCtrl,
                    onChanged: (v) => setState(() => _arama = v),
                    decoration: InputDecoration(
                      hintText: 'İsim veya telefon ara...',
                      prefixIcon: const Icon(Icons.search_rounded, size: 20),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (filtreli.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 40),
                      child: Column(
                        children: [
                          const Icon(Icons.people_outline_rounded, size: 48, color: AppColors.textSecondary),
                          const SizedBox(height: 12),
                          Text(
                            _arama.isNotEmpty ? 'Arama sonucu bulunamadı' : 'Henüz müşteri yok',
                            style: const TextStyle(color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    )
                  else
                    ...filtreli.map((m) => _MusteriKart(musteri: m, durumRenk: _durumRenk, durumLabel: _durumLabel)),
                ],
              ),
            ),
    );
  }
}

class _OzetKart extends StatelessWidget {
  final String deger;
  final String label;
  final Color renk;
  const _OzetKart({required this.deger, required this.label, required this.renk});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: renk.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(children: [
        Text(deger, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: renk)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary), textAlign: TextAlign.center),
      ]),
    );
  }
}

class _MusteriKart extends StatefulWidget {
  final Map<String, dynamic> musteri;
  final Map<String, Color> durumRenk;
  final Map<String, String> durumLabel;
  const _MusteriKart({required this.musteri, required this.durumRenk, required this.durumLabel});

  @override
  State<_MusteriKart> createState() => _MusteriKartState();
}

class _MusteriKartState extends State<_MusteriKart> {
  bool _acik = false;

  @override
  Widget build(BuildContext context) {
    final m = widget.musteri;
    final talepler = (m['talepler'] as List?) ?? [];
    final ad = (m['ad'] ?? '?').toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.06), blurRadius: 8, offset: const Offset(0, 3))],
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() => _acik = !_acik),
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(12)),
                    child: Center(
                      child: Text(
                        ad.isNotEmpty ? ad[0].toUpperCase() : '?',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(ad, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary)),
                        const SizedBox(height: 3),
                        Text('${m['telefon'] ?? ''}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('${m['toplam_talep'] ?? 0} talep', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                      Text('${m['tamamlandi'] ?? 0} tamamlandı', style: const TextStyle(fontSize: 11, color: AppColors.success, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  Icon(_acik ? Icons.expand_less_rounded : Icons.expand_more_rounded, color: AppColors.textSecondary),
                ],
              ),
            ),
          ),
          if (_acik)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(height: 1),
                  const SizedBox(height: 10),
                  Row(children: [
                    Expanded(child: _MiniBilgi('İlk Talep', m['ilk_talep'])),
                    const SizedBox(width: 10),
                    Expanded(child: _MiniBilgi('Son Talep', m['son_talep'])),
                  ]),
                  const SizedBox(height: 10),
                  const Text('İş Geçmişi', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textSecondary)),
                  const SizedBox(height: 6),
                  ...talepler.map((t) {
                    final tm = t as Map<String, dynamic>;
                    final durum = tm['durum'] as String? ?? 'bekliyor';
                    final renk = widget.durumRenk[durum] ?? AppColors.textSecondary;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(10)),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  tm['baslik'] ?? '',
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text('${tm['olusturma'] ?? ''}', style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: renk.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                            child: Text(widget.durumLabel[durum] ?? durum, style: TextStyle(fontSize: 10, color: renk, fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _MiniBilgi extends StatelessWidget {
  final String label;
  final dynamic deger;
  const _MiniBilgi(this.label, this.deger);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(10)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
          const SizedBox(height: 2),
          Text('${deger ?? '-'}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}
