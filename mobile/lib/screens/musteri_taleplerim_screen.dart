import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import '../services/api_service.dart';

class MusteriTaleplerimScreen extends StatefulWidget {
  const MusteriTaleplerimScreen({super.key});

  @override
  State<MusteriTaleplerimScreen> createState() => _MusteriTaleplerimScreenState();
}

class _MusteriTaleplerimScreenState extends State<MusteriTaleplerimScreen> {
  final _api = ApiService();
  List<Map<String, dynamic>> _talepler = [];
  bool _loading = true;
  String _filtre = 'hepsi';

  static const _durumlar = ['hepsi', 'bekliyor', 'kabul', 'tamamlandi', 'red', 'iptal'];
  static const _durumLabel = {
    'hepsi':      'Tümü',
    'bekliyor':   'Bekliyor',
    'kabul':      'Kabul Edildi',
    'tamamlandi': 'Tamamlandı',
    'red':        'Reddedildi',
    'iptal':      'İptal Edildi',
  };
  static const _durumRenk = {
    'bekliyor':   Color(0xFFf39c12),
    'kabul':      Color(0xFF3498db),
    'tamamlandi': Color(0xFF2ecc71),
    'red':        Color(0xFFe74c3c),
    'iptal':      Color(0xFF95a5a6),
  };

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  Future<void> _yukle() async {
    setState(() => _loading = true);
    try {
      final list = await _api.musteriTalepListesi();
      if (mounted) setState(() { _talepler = list; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _filtrelenmis {
    if (_filtre == 'hepsi') return _talepler;
    return _talepler.where((t) => (t['durum'] ?? 'bekliyor') == _filtre).toList();
  }

  Future<void> _iptalEt(Map<String, dynamic> talep) async {
    final onay = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Talebi İptal Et', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Bu talebi iptal etmek istediğinize emin misiniz?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Hayır')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('İptal Et', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (onay != true || !mounted) return;

    try {
      await _api.musteriTalepIptal(talep['id'] as int);
      _yukle();
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('İptal işlemi başarısız'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
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
                Expanded(
                  child: Text(
                    talep['usta_ad'] ?? talep['baslik'] ?? 'Talep',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(color: renk.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                  child: Text(_durumLabel[durum] ?? durum, style: TextStyle(color: renk, fontWeight: FontWeight.w700, fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if ((talep['usta_kategori'] ?? talep['kategori'] ?? '').toString().isNotEmpty)
              _InfoSatir('Kategori', talep['usta_kategori'] ?? talep['kategori']),
            if ((talep['tercih_tarih'] ?? '').toString().isNotEmpty)
              _InfoSatir('Tercih Tarih', talep['tercih_tarih']),
            if ((talep['iletisim_tercihi'] ?? '').toString().isNotEmpty)
              _InfoSatir('İletişim', talep['iletisim_tercihi'] == 'whatsapp' ? 'WhatsApp' : 'Telefon'),
            _InfoSatir('Gönderildi', talep['olusturma'] ?? ''),
            if ((talep['aciklama'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 12),
              const Text('Açıklama', style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(12)),
                child: Text(talep['aciklama'], style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, height: 1.5)),
              ),
            ],
            if (durum == 'kabul' && (talep['usta_notu'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 12),
              const Text('Usta Notu', style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF3498db).withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF3498db).withValues(alpha: 0.2)),
                ),
                child: Text(talep['usta_notu'], style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, height: 1.5)),
              ),
            ],
            if (durum == 'bekliyor') ...[
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () { Navigator.pop(context); _iptalEt(talep); },
                  icon: const Icon(Icons.cancel_outlined, size: 18, color: AppColors.error),
                  label: const Text('Talebi İptal Et', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w700)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: AppColors.error),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
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
    final liste = _filtrelenmis;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: const Text('Taleplerim', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Filtre chip'leri
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
                    onTap: () => setState(() => _filtre = d),
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
                : liste.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.08),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.assignment_outlined, size: 38, color: AppColors.primary),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Henüz talep göndermediniz',
                              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.textPrimary),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Usta detay sayfasından talep oluşturabilirsiniz',
                              style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        color: AppColors.accent,
                        onRefresh: _yukle,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(14),
                          itemCount: liste.length,
                          itemBuilder: (_, i) => _TalepKart(
                            talep: liste[i],
                            onTap: () => _detayGoster(liste[i]),
                            durumRenk: _durumRenk,
                            durumLabel: _durumLabel,
                          ),
                        ),
                      ),
          ),
        ],
      ),
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
          SizedBox(width: 100, child: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600))),
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
    final ustaAd = talep['usta_ad'] as String? ?? talep['baslik'] as String? ?? 'Talep';
    final kategori = talep['usta_kategori'] as String? ?? talep['kategori'] as String? ?? '';
    final tarih = talep['olusturma'] as String? ?? '';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.06), blurRadius: 8, offset: const Offset(0, 3))],
        ),
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(color: renk.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(13)),
              child: Icon(Icons.handyman_rounded, color: renk, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(ustaAd, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 3),
                  Text(
                    kategori.isNotEmpty ? '$kategori · $tarih' : tarih,
                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: renk.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
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
