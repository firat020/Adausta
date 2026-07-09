import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import '../services/api_service.dart';

class TalepOlusturScreen extends StatefulWidget {
  final int ustaId;
  final String ustaAd;
  final String kategori;

  const TalepOlusturScreen({
    super.key,
    required this.ustaId,
    required this.ustaAd,
    required this.kategori,
  });

  @override
  State<TalepOlusturScreen> createState() => _TalepOlusturScreenState();
}

class _TalepOlusturScreenState extends State<TalepOlusturScreen> {
  final _api = ApiService();
  final _formKey = GlobalKey<FormState>();
  final _aciklamaCtrl = TextEditingController();
  final _adCtrl = TextEditingController();
  final _telefonCtrl = TextEditingController();

  DateTime? _tercihTarih;
  String _iletisimTercihi = 'telefon';
  bool _gonderiyor = false;

  @override
  void dispose() {
    _aciklamaCtrl.dispose();
    _adCtrl.dispose();
    _telefonCtrl.dispose();
    super.dispose();
  }

  Future<void> _tariSecim() async {
    final secilen = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      locale: const Locale('tr', 'TR'),
      builder: (_, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppColors.primary,
            onPrimary: Colors.white,
            secondary: AppColors.accent,
          ),
        ),
        child: child!,
      ),
    );
    if (secilen != null) setState(() => _tercihTarih = secilen);
  }

  Future<void> _gonder() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _gonderiyor = true);
    try {
      final ok = await _api.musteriTalepOlustur({
        'usta_id': widget.ustaId,
        'ad': _adCtrl.text.trim(),
        'telefon': _telefonCtrl.text.trim(),
        'aciklama': _aciklamaCtrl.text.trim(),
        'iletisim_tercihi': _iletisimTercihi,
        if (_tercihTarih != null)
          'tercih_tarih': _tercihTarih!.toIso8601String().split('T').first,
      });

      if (!mounted) return;
      if (ok) {
        await showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(colors: [Color(0xFF2ecc71), Color(0xFF27ae60)]),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_rounded, color: Colors.white, size: 36),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Talebiniz İletildi!',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),
                Text(
                  '${widget.ustaAd} en kısa sürede sizinle iletişime geçecek.',
                  style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Tamam', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        );
      } else {
        _hataMesaji('Talep gönderilemedi. Tekrar deneyin.');
      }
    } catch (_) {
      _hataMesaji('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
    } finally {
      if (mounted) setState(() => _gonderiyor = false);
    }
  }

  void _hataMesaji(String mesaj) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(mesaj),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: const Text('Talep Gönder', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Usta bilgi kartı
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.handyman_rounded, color: Colors.white, size: 26),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(widget.ustaAd, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
                          const SizedBox(height: 2),
                          Text(widget.kategori, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
              _Baslik('Kişisel Bilgiler'),
              const SizedBox(height: 12),

              // Ad
              TextFormField(
                controller: _adCtrl,
                textCapitalization: TextCapitalization.words,
                decoration: _inputDec('Adınız Soyadınız', Icons.person_outline_rounded),
                validator: (v) => v == null || v.trim().isEmpty ? 'Ad gerekli' : null,
              ),
              const SizedBox(height: 12),

              // Telefon
              TextFormField(
                controller: _telefonCtrl,
                keyboardType: TextInputType.phone,
                decoration: _inputDec('Telefon Numaranız', Icons.phone_outlined),
                validator: (v) => v == null || v.trim().length < 10 ? 'Geçerli telefon girin' : null,
              ),

              const SizedBox(height: 24),
              _Baslik('İş Detayları'),
              const SizedBox(height: 12),

              // Açıklama
              TextFormField(
                controller: _aciklamaCtrl,
                maxLines: 4,
                decoration: _inputDec('Ne yaptırmak istiyorsunuz?', Icons.description_outlined),
                validator: (v) => v == null || v.trim().length < 10 ? 'En az 10 karakter girin' : null,
              ),
              const SizedBox(height: 12),

              // Tarih seçimi
              GestureDetector(
                onTap: _tariSecim,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.calendar_today_outlined, color: AppColors.primary, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _tercihTarih == null
                              ? 'Tercih edilen tarih (isteğe bağlı)'
                              : '${_tercihTarih!.day}.${_tercihTarih!.month}.${_tercihTarih!.year}',
                          style: TextStyle(
                            fontSize: 14,
                            color: _tercihTarih == null ? Colors.grey : AppColors.textPrimary,
                          ),
                        ),
                      ),
                      if (_tercihTarih != null)
                        GestureDetector(
                          onTap: () => setState(() => _tercihTarih = null),
                          child: const Icon(Icons.close_rounded, size: 18, color: AppColors.textSecondary),
                        ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),
              _Baslik('İletişim Tercihi'),
              const SizedBox(height: 8),

              Row(
                children: [
                  _IletisimSecenegi(
                    ikon: Icons.phone_rounded,
                    label: 'Telefon',
                    secili: _iletisimTercihi == 'telefon',
                    onTap: () => setState(() => _iletisimTercihi = 'telefon'),
                  ),
                  const SizedBox(width: 12),
                  _IletisimSecenegi(
                    ikon: Icons.chat_rounded,
                    label: 'WhatsApp',
                    secili: _iletisimTercihi == 'whatsapp',
                    onTap: () => setState(() => _iletisimTercihi = 'whatsapp'),
                    yesilRenk: true,
                  ),
                ],
              ),

              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _gonderiyor ? null : _gonder,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accent,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: _gonderiyor
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        )
                      : const Text(
                          'Talep Gönder',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 17),
                        ),
                ),
              ),

              const SizedBox(height: 16),
              const Center(
                child: Text(
                  'Talebiniz usta ile paylaşılacak ve en kısa sürede dönüş yapacaklar.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.5),
                ),
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDec(String hint, IconData ikon) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(ikon, color: AppColors.primary, size: 20),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade200)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade200)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
      errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.error)),
      focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.error, width: 1.5)),
    );
  }
}

class _Baslik extends StatelessWidget {
  final String text;
  const _Baslik(this.text);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(width: 3, height: 16, decoration: BoxDecoration(color: AppColors.accent, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 8),
        Text(text, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.textPrimary)),
      ],
    );
  }
}

class _IletisimSecenegi extends StatelessWidget {
  final IconData ikon;
  final String label;
  final bool secili;
  final VoidCallback onTap;
  final bool yesilRenk;

  const _IletisimSecenegi({
    required this.ikon,
    required this.label,
    required this.secili,
    required this.onTap,
    this.yesilRenk = false,
  });

  @override
  Widget build(BuildContext context) {
    final renk = yesilRenk ? const Color(0xFF25D366) : AppColors.primary;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: secili ? renk.withOpacity(0.1) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: secili ? renk : Colors.grey.shade200, width: secili ? 2 : 1),
          ),
          child: Column(
            children: [
              Icon(ikon, color: secili ? renk : AppColors.textSecondary, size: 24),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  color: secili ? renk : AppColors.textSecondary,
                  fontWeight: secili ? FontWeight.w700 : FontWeight.w500,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
