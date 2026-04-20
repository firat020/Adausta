import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/api_service.dart';
import 'usta_panel_screen.dart';

class UstaGirisScreen extends StatefulWidget {
  const UstaGirisScreen({super.key});

  @override
  State<UstaGirisScreen> createState() => _UstaGirisScreenState();
}

class _UstaGirisScreenState extends State<UstaGirisScreen> {
  final _api = ApiService();
  final _emailCtrl = TextEditingController();
  final _sifreCtrl = TextEditingController();
  bool _sifreGoster = false;
  bool _yukleniyor = false;
  String? _hata;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _sifreCtrl.dispose();
    super.dispose();
  }

  Future<void> _giris() async {
    if (_emailCtrl.text.isEmpty || _sifreCtrl.text.isEmpty) {
      setState(() => _hata = 'Email ve şifre gerekli');
      return;
    }
    setState(() { _yukleniyor = true; _hata = null; });
    try {
      final kullanici = await _api.giris(_emailCtrl.text.trim(), _sifreCtrl.text);
      if (!mounted) return;
      if (kullanici == null || kullanici['rol'] != 'usta') {
        setState(() { _hata = 'Bu hesap usta hesabı değil'; _yukleniyor = false; });
        return;
      }
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const UstaPanelScreen()),
      );
    } catch (e) {
      if (mounted) setState(() { _hata = e.toString().replaceAll('Exception: ', ''); _yukleniyor = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.heroGradient),
        child: SafeArea(
          child: Column(
            children: [
              // Geri butonu
              Align(
                alignment: Alignment.topLeft,
                child: IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back_ios_rounded, color: Colors.white),
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 28),
                  child: Column(
                    children: [
                      const SizedBox(height: 20),
                      // Logo
                      Container(
                        width: 90,
                        height: 90,
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.12),
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.accent.withOpacity(0.5), width: 2),
                        ),
                        child: Image.asset('assets/images/ada-usta-logo.png', fit: BoxFit.contain),
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        'Usta Girişi',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Paneline erişmek için giriş yap',
                        style: TextStyle(color: Colors.white.withOpacity(0.65), fontSize: 14),
                      ),
                      const SizedBox(height: 36),
                      // Form kartı
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 24, offset: const Offset(0, 8)),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Email
                            const Text('E-posta', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textSecondary)),
                            const SizedBox(height: 8),
                            TextField(
                              controller: _emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              decoration: InputDecoration(
                                hintText: 'ornek@email.com',
                                prefixIcon: const Icon(Icons.email_outlined, color: AppColors.primary, size: 20),
                                filled: true,
                                fillColor: AppColors.background,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                              ),
                            ),
                            const SizedBox(height: 16),
                            // Şifre
                            const Text('Şifre', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textSecondary)),
                            const SizedBox(height: 8),
                            TextField(
                              controller: _sifreCtrl,
                              obscureText: !_sifreGoster,
                              decoration: InputDecoration(
                                hintText: '••••••',
                                prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.primary, size: 20),
                                suffixIcon: IconButton(
                                  icon: Icon(_sifreGoster ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 20, color: AppColors.textSecondary),
                                  onPressed: () => setState(() => _sifreGoster = !_sifreGoster),
                                ),
                                filled: true,
                                fillColor: AppColors.background,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                              ),
                              onSubmitted: (_) => _giris(),
                            ),
                            // Hata
                            if (_hata != null) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                decoration: BoxDecoration(
                                  color: AppColors.error.withOpacity(0.08),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: AppColors.error.withOpacity(0.2)),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.error_outline_rounded, size: 16, color: AppColors.error),
                                    const SizedBox(width: 8),
                                    Expanded(child: Text(_hata!, style: TextStyle(color: AppColors.error, fontSize: 13))),
                                  ],
                                ),
                              ),
                            ],
                            const SizedBox(height: 20),
                            // Giriş butonu
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _yukleniyor ? null : _giris,
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                ),
                                child: _yukleniyor
                                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                    : const Text('Giriş Yap', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
