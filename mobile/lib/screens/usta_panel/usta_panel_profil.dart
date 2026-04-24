import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/api_service.dart';

class UstaPanelProfil extends StatefulWidget {
  final ApiService api;
  const UstaPanelProfil({super.key, required this.api});

  @override
  State<UstaPanelProfil> createState() => _UstaPanelProfilState();
}

class _UstaPanelProfilState extends State<UstaPanelProfil> {
  Map<String, dynamic>? _usta;
  bool _loading = true;
  bool _kaydediliyor = false;
  String? _mesaj;
  bool _mesajOk = false;

  late TextEditingController _adCtrl;
  late TextEditingController _soyadCtrl;
  late TextEditingController _telCtrl;
  late TextEditingController _wpCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _aciklamaCtrl;

  @override
  void initState() {
    super.initState();
    _adCtrl = TextEditingController();
    _soyadCtrl = TextEditingController();
    _telCtrl = TextEditingController();
    _wpCtrl = TextEditingController();
    _emailCtrl = TextEditingController();
    _aciklamaCtrl = TextEditingController();
    _yukle();
  }

  @override
  void dispose() {
    for (final c in [_adCtrl, _soyadCtrl, _telCtrl, _wpCtrl, _emailCtrl, _aciklamaCtrl]) c.dispose();
    super.dispose();
  }

  Future<void> _yukle() async {
    setState(() => _loading = true);
    try {
      final data = await widget.api.ustaPanelProfil();
      final u = data['usta'] as Map<String, dynamic>;
      if (mounted) {
        setState(() {
          _usta = u;
          _adCtrl.text = u['ad'] ?? '';
          _soyadCtrl.text = u['soyad'] ?? '';
          _telCtrl.text = u['telefon'] ?? '';
          _wpCtrl.text = u['whatsapp'] ?? '';
          _emailCtrl.text = u['email'] ?? '';
          _aciklamaCtrl.text = u['aciklama'] ?? '';
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _kaydet() async {
    setState(() { _kaydediliyor = true; _mesaj = null; });
    try {
      await widget.api.ustaPanelProfilGuncelle({
        'ad': _adCtrl.text,
        'soyad': _soyadCtrl.text,
        'telefon': _telCtrl.text,
        'whatsapp': _wpCtrl.text,
        'email': _emailCtrl.text,
        'aciklama': _aciklamaCtrl.text,
      });
      if (mounted) setState(() { _mesaj = 'Profil güncellendi!'; _mesajOk = true; _kaydediliyor = false; });
    } catch (e) {
      if (mounted) setState(() { _mesaj = e.toString().replaceAll('Exception: ', ''); _mesajOk = false; _kaydediliyor = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppColors.primary));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Profil başlık
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.heroGradient,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Container(
                  width: 56, height: 56,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.accent.withOpacity(0.5), width: 2),
                  ),
                  child: Center(
                    child: Text(
                      (_usta?['ad'] ?? 'U').toString().isNotEmpty ? (_usta!['ad'] as String)[0].toUpperCase() : 'U',
                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${_usta?['ad'] ?? ''} ${_usta?['soyad'] ?? ''}'.trim(),
                        style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w800),
                      ),
                      Text(_usta?['email'] ?? '', style: TextStyle(color: Colors.white.withOpacity(0.65), fontSize: 12)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: (_usta?['musaitlik'] == true ? AppColors.success : Colors.grey).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _usta?['musaitlik'] == true ? '✓ Müsait' : 'Müsait Değil',
                          style: TextStyle(
                            color: _usta?['musaitlik'] == true ? AppColors.success : Colors.white60,
                            fontSize: 11, fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Form
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.06), blurRadius: 12, offset: const Offset(0, 4))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Bilgileri Güncelle', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.textPrimary)),
                const SizedBox(height: 16),
                Row(children: [
                  Expanded(child: _Alan('Ad', _adCtrl, Icons.person_outline_rounded)),
                  const SizedBox(width: 10),
                  Expanded(child: _Alan('Soyad', _soyadCtrl, Icons.person_outline_rounded)),
                ]),
                const SizedBox(height: 12),
                _Alan('Telefon', _telCtrl, Icons.phone_outlined),
                const SizedBox(height: 12),
                _Alan('WhatsApp', _wpCtrl, Icons.chat_outlined),
                const SizedBox(height: 12),
                _Alan('E-posta', _emailCtrl, Icons.email_outlined, keyboard: TextInputType.emailAddress),
                const SizedBox(height: 12),
                TextField(
                  controller: _aciklamaCtrl,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: 'Hakkında',
                    prefixIcon: const Icon(Icons.info_outline_rounded, color: AppColors.primary, size: 20),
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                    alignLabelWithHint: true,
                  ),
                ),

                if (_mesaj != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: (_mesajOk ? AppColors.success : AppColors.error).withOpacity(0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Icon(_mesajOk ? Icons.check_circle_rounded : Icons.error_outline_rounded,
                            size: 16, color: _mesajOk ? AppColors.success : AppColors.error),
                        const SizedBox(width: 8),
                        Text(_mesaj!, style: TextStyle(color: _mesajOk ? AppColors.success : AppColors.error, fontSize: 13)),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _kaydediliyor ? null : _kaydet,
                    style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 15)),
                    child: _kaydediliyor
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Kaydet', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _Alan extends StatelessWidget {
  final String label;
  final TextEditingController ctrl;
  final IconData ikon;
  final TextInputType keyboard;

  const _Alan(this.label, this.ctrl, this.ikon, {this.keyboard = TextInputType.text});

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: ctrl,
      keyboardType: keyboard,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(ikon, color: AppColors.primary, size: 20),
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
      ),
    );
  }
}
