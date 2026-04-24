import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/api_service.dart';

class UstaPanelTalepler extends StatefulWidget {
  final ApiService api;
  const UstaPanelTalepler({super.key, required this.api});

  @override
  State<UstaPanelTalepler> createState() => _UstaPanelTaleplerState();
}

class _UstaPanelTaleplerState extends State<UstaPanelTalepler> {
  List<Map<String, dynamic>> _talepler = [];
  bool _loading = true;
  String _filtre = 'hepsi';

  static const _durumlar = ['hepsi', 'bekliyor', 'kabul', 'tamamlandi', 'red'];
  static const _durumLabel = {
    'hepsi': 'Tümü', 'bekliyor': 'Bekleyen', 'kabul': 'Kabul',
    'tamamlandi': 'Tamamlanan', 'red': 'Reddedilen',
  };
  static const _durumRenk = {
    'bekliyor':   Color(0xFFf39c12),
    'kabul':      Color(0xFF3498db),
    'tamamlandi': Color(0xFF2ecc71),
    'red':        Color(0xFFe74c3c),
  };

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  Future<void> _yukle() async {
    setState(() => _loading = true);
    try {
      final list = await widget.api.ustaIsTalepleri(durum: _filtre);
      if (mounted) setState(() { _talepler = list; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _durumGuncelle(Map<String, dynamic> talep, String yeniDurum) async {
    await widget.api.talepGuncelle(talep['id'] as int, yeniDurum);
    _yukle();
  }

  void _detayGoster(Map<String, dynamic> talep) {
    final durum = talep['durum'] as String? ?? 'bekliyor';
    final renk = _durumRenk[durum] ?? AppColors.textSecondary;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(talep['baslik'] ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(color: renk.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                  child: Text(_durumLabel[durum] ?? durum, style: TextStyle(color: renk, fontWeight: FontWeight.w700, fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _InfoSatir('Müşteri', talep['musteri_ad'] ?? ''),
            _InfoSatir('Telefon', talep['musteri_telefon'] ?? ''),
            if ((talep['musteri_adres'] ?? '').toString().isNotEmpty) _InfoSatir('Adres', talep['musteri_adres']),
            if ((talep['tercih_tarih'] ?? '').toString().isNotEmpty) _InfoSatir('Tercih Tarih', talep['tercih_tarih']),
            _InfoSatir('Tarih', talep['olusturma'] ?? ''),
            if ((talep['aciklama'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(12)),
                child: Text(talep['aciklama'], style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.5)),
              ),
            ],
            if (durum == 'bekliyor') ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () { Navigator.pop(context); _durumGuncelle(talep, 'kabul'); },
                      icon: const Icon(Icons.check_rounded, size: 18),
                      label: const Text('Kabul Et'),
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2ecc71), padding: const EdgeInsets.symmetric(vertical: 14)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () { Navigator.pop(context); _durumGuncelle(talep, 'red'); },
                      icon: const Icon(Icons.close_rounded, size: 18),
                      label: const Text('Reddet'),
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, padding: const EdgeInsets.symmetric(vertical: 14)),
                    ),
                  ),
                ],
              ),
            ] else if (durum == 'kabul') ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () { Navigator.pop(context); _durumGuncelle(talep, 'tamamlandi'); },
                  icon: const Icon(Icons.task_alt_rounded, size: 18),
                  label: const Text('Tamamlandı Olarak İşaretle'),
                  style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                ),
              ),
            ],
            SizedBox(height: MediaQuery.of(context).viewInsets.bottom + 8),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Filtre tabları
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _durumlar.map((d) {
                final isActive = d == _filtre;
                final renk = _durumRenk[d] ?? AppColors.primary;
                return GestureDetector(
                  onTap: () { setState(() => _filtre = d); _yukle(); },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    decoration: BoxDecoration(
                      color: isActive ? (d == 'hepsi' ? AppColors.primary : renk) : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: isActive ? Colors.transparent : Colors.grey.shade300),
                    ),
                    child: Text(
                      _durumLabel[d]!,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isActive ? Colors.white : AppColors.textSecondary,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ),
        // Liste
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
              : _talepler.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.assignment_outlined, size: 52, color: AppColors.textSecondary),
                          SizedBox(height: 12),
                          Text('Bu kategoride talep yok', style: TextStyle(color: AppColors.textSecondary)),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      color: AppColors.accent,
                      onRefresh: _yukle,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(14),
                        itemCount: _talepler.length,
                        itemBuilder: (_, i) => _TalepKart(
                          talep: _talepler[i],
                          onTap: () => _detayGoster(_talepler[i]),
                          durumRenk: _durumRenk,
                          durumLabel: _durumLabel,
                        ),
                      ),
                    ),
        ),
      ],
    );
  }
}

class _InfoSatir extends StatelessWidget {
  final String label;
  final String deger;
  const _InfoSatir(this.label, this.deger);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 90, child: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600))),
          Expanded(child: Text(deger, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}

class _TalepKart extends StatelessWidget {
  final Map<String, dynamic> talep;
  final VoidCallback onTap;
  final Map<String, Color> durumRenk;
  final Map<String, String> durumLabel;

  const _TalepKart({required this.talep, required this.onTap, required this.durumRenk, required this.durumLabel});

  @override
  Widget build(BuildContext context) {
    final durum = talep['durum'] as String? ?? 'bekliyor';
    final renk = durumRenk[durum] ?? AppColors.textSecondary;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.06), blurRadius: 8, offset: const Offset(0, 3))],
        ),
        child: Row(
          children: [
            Container(
              width: 42, height: 42,
              decoration: BoxDecoration(color: renk.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.assignment_rounded, color: renk, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(talep['baslik'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 3),
                  Text('${talep['musteri_ad'] ?? ''} · ${talep['olusturma'] ?? ''}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: renk.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                  child: Text(durumLabel[durum] ?? durum, style: TextStyle(fontSize: 11, color: renk, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(height: 4),
                const Icon(Icons.arrow_forward_ios_rounded, size: 11, color: AppColors.textSecondary),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
