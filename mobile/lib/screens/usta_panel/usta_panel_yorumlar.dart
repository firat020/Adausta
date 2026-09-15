import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/api_service.dart';

class UstaPanelYorumlar extends StatefulWidget {
  final ApiService api;
  const UstaPanelYorumlar({super.key, required this.api});

  @override
  State<UstaPanelYorumlar> createState() => _UstaPanelYorumlarState();
}

class _UstaPanelYorumlarState extends State<UstaPanelYorumlar> {
  List<Map<String, dynamic>> _yorumlar = [];
  bool _loading = true;
  int? _cevapAcikId;
  final _cevapCtrl = TextEditingController();
  bool _gonderiliyor = false;

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  @override
  void dispose() {
    _cevapCtrl.dispose();
    super.dispose();
  }

  Future<void> _yukle() async {
    setState(() => _loading = true);
    try {
      final list = await widget.api.ustaPanelYorumlar();
      if (mounted) setState(() { _yorumlar = list; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _cevapGonder(int id) async {
    final metin = _cevapCtrl.text.trim();
    if (metin.isEmpty || _gonderiliyor) return;
    setState(() => _gonderiliyor = true);
    try {
      await widget.api.ustaYorumCevapla(id, metin);
      _cevapCtrl.clear();
      setState(() => _cevapAcikId = null);
      await _yukle();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
        );
      }
    }
    if (mounted) setState(() => _gonderiliyor = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppColors.primary));

    final onaylananlar = _yorumlar.where((y) => y['onaylanmis'] != false).toList();
    final bekleyenler = _yorumlar.where((y) => y['onaylanmis'] == false).toList();
    final ort = onaylananlar.isNotEmpty
        ? (onaylananlar.fold<double>(0, (s, y) => s + ((y['puan'] as num?)?.toDouble() ?? 0)) / onaylananlar.length).toStringAsFixed(1)
        : '-';

    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: _yukle,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(child: _OzetMini(deger: ort, label: 'Ort. Puan', renk: AppColors.accent)),
              const SizedBox(width: 10),
              Expanded(child: _OzetMini(deger: '${onaylananlar.length}', label: 'Onaylanan', renk: const Color(0xFF3498db))),
              const SizedBox(width: 10),
              Expanded(child: _OzetMini(deger: '${bekleyenler.length}', label: 'Bekleyen', renk: const Color(0xFFf39c12))),
            ],
          ),
          const SizedBox(height: 16),
          if (_yorumlar.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Column(
                children: const [
                  Icon(Icons.star_border_rounded, size: 48, color: AppColors.textSecondary),
                  SizedBox(height: 12),
                  Text('Henüz yorum yok', style: TextStyle(color: AppColors.textSecondary)),
                ],
              ),
            )
          else
            ..._yorumlar.map((y) => _YorumKart(
                  yorum: y,
                  cevapAcik: _cevapAcikId == y['id'],
                  cevapCtrl: _cevapCtrl,
                  gonderiliyor: _gonderiliyor,
                  onYanitla: () => setState(() { _cevapAcikId = y['id'] as int; _cevapCtrl.clear(); }),
                  onVazgec: () => setState(() { _cevapAcikId = null; _cevapCtrl.clear(); }),
                  onGonder: () => _cevapGonder(y['id'] as int),
                )),
        ],
      ),
    );
  }
}

class _OzetMini extends StatelessWidget {
  final String deger;
  final String label;
  final Color renk;
  const _OzetMini({required this.deger, required this.label, required this.renk});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: renk.withValues(alpha: 0.1), blurRadius: 8, offset: const Offset(0, 3))],
      ),
      child: Column(children: [
        Text(deger, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: renk)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary), textAlign: TextAlign.center),
      ]),
    );
  }
}

class _YorumKart extends StatelessWidget {
  final Map<String, dynamic> yorum;
  final bool cevapAcik;
  final TextEditingController cevapCtrl;
  final bool gonderiliyor;
  final VoidCallback onYanitla;
  final VoidCallback onVazgec;
  final VoidCallback onGonder;

  const _YorumKart({
    required this.yorum,
    required this.cevapAcik,
    required this.cevapCtrl,
    required this.gonderiliyor,
    required this.onYanitla,
    required this.onVazgec,
    required this.onGonder,
  });

  @override
  Widget build(BuildContext context) {
    final onayBekliyor = yorum['onaylanmis'] == false;
    final puan = (yorum['puan'] as num?)?.toInt() ?? 0;
    final ad = (yorum['musteri_adi'] ?? yorum['musteri_ad'] ?? 'Anonim').toString();
    final cevap = yorum['cevap'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: onayBekliyor ? const Color(0xFFFFFBEB) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: onayBekliyor ? Border.all(color: const Color(0xFFFDE68A)) : null,
        boxShadow: onayBekliyor
            ? null
            : [BoxShadow(color: AppColors.primary.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 3))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(color: const Color(0xFFDCEAFE), borderRadius: BorderRadius.circular(12)),
                child: Center(
                  child: Text(
                    ad.isNotEmpty ? ad[0].toUpperCase() : '?',
                    style: const TextStyle(color: Color(0xFF1d4ed8), fontWeight: FontWeight.w800),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(ad, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                    const SizedBox(height: 2),
                    Row(
                      children: List.generate(
                        5,
                        (i) => Icon(
                          i < puan ? Icons.star_rounded : Icons.star_border_rounded,
                          size: 14,
                          color: AppColors.accent,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('${yorum['tarih'] ?? ''}', style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                  if (onayBekliyor) ...[
                    const SizedBox(height: 3),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(8)),
                      child: const Text('Onay Bekliyor', style: TextStyle(fontSize: 9, color: Color(0xFFB45309), fontWeight: FontWeight.w700)),
                    ),
                  ],
                ],
              ),
            ],
          ),
          if ((yorum['yorum'] ?? '').toString().isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(yorum['yorum'], style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4)),
          ],
          if (cevap != null && cevap.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Yanıtınız · ${yorum['cevap_tarih'] ?? ''}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF1d4ed8))),
                  const SizedBox(height: 3),
                  Text(cevap, style: const TextStyle(fontSize: 12, color: Color(0xFF1e3a8a))),
                ],
              ),
            ),
          ] else if (!onayBekliyor) ...[
            const SizedBox(height: 10),
            if (cevapAcik) ...[
              TextField(
                controller: cevapCtrl,
                maxLines: 2,
                maxLength: 1000,
                buildCounter: (_, {required currentLength, required isFocused, maxLength}) => null,
                decoration: InputDecoration(
                  hintText: 'Müşteriye yanıtınızı yazın...',
                  filled: true,
                  fillColor: AppColors.background,
                  contentPadding: const EdgeInsets.all(10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 8),
              Row(children: [
                ElevatedButton(
                  onPressed: gonderiliyor ? null : onGonder,
                  style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10)),
                  child: gonderiliyor
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Yanıtla', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(width: 8),
                TextButton(onPressed: onVazgec, child: const Text('Vazgeç', style: TextStyle(fontSize: 12))),
              ]),
            ] else
              TextButton.icon(
                onPressed: onYanitla,
                icon: const Icon(Icons.reply_rounded, size: 15),
                label: const Text('Yanıtla', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
              ),
          ],
        ],
      ),
    );
  }
}
