import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/api_config.dart';
import '../config/app_theme.dart';
import '../services/api_service.dart';

/// Mağaza (satıcı) girişi ve kaydı. Hesap uygulamada açılır/doğrulanır;
/// mağaza başvurusu (belgeler dahil) ve mağaza paneli web sitesinde yürütülür.
class MagazaGirisScreen extends StatefulWidget {
  const MagazaGirisScreen({super.key});

  @override
  State<MagazaGirisScreen> createState() => _MagazaGirisScreenState();
}

class _MagazaGirisScreenState extends State<MagazaGirisScreen> {
  final _api = ApiService();
  final _emailCtrl = TextEditingController();
  final _sifreCtrl = TextEditingController();
  bool _kayitModu = false;
  bool _sifreGoster = false;
  bool _yukleniyor = false;
  bool _tamam = false;
  String? _hata;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _sifreCtrl.dispose();
    super.dispose();
  }

  Future<void> _gonder() async {
    final email = _emailCtrl.text.trim();
    final sifre = _sifreCtrl.text;
    if (email.isEmpty || sifre.isEmpty) {
      setState(() => _hata = 'E-posta ve şifre gerekli');
      return;
    }
    if (_kayitModu && sifre.length < 8) {
      setState(() => _hata = 'Şifre en az 8 karakter olmalı');
      return;
    }
    setState(() { _yukleniyor = true; _hata = null; });
    try {
      final k = _kayitModu
          ? await _api.magazaKayit(email, sifre)
          : await _api.giris(email, sifre);
      if (!mounted) return;
      if (k == null) {
        setState(() { _hata = _kayitModu ? 'Kayıt başarısız' : 'Giriş başarısız'; _yukleniyor = false; });
        return;
      }
      setState(() { _tamam = true; _yukleniyor = false; });
    } catch (e) {
      if (mounted) setState(() { _hata = e.toString().replaceAll('Exception: ', ''); _yukleniyor = false; });
    }
  }

  Future<void> _webdeAc() async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/satici/giris');
    if (await canLaunchUrl(uri)) launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  InputDecoration _dekor(String hint, IconData ikon, {Widget? sonEk}) => InputDecoration(
        hintText: hint,
        prefixIcon: Icon(ikon, color: AppColors.primary, size: 20),
        suffixIcon: sonEk,
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.heroGradient),
        child: SafeArea(
          child: Column(
            children: [
              Align(
                alignment: Alignment.topLeft,
                child: IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back_ios_rounded, color: Colors.white),
                ),
              ),
              const SizedBox(height: 8),
              const Text('Mağaza', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)),
              const SizedBox(height: 4),
              Text(
                _kayitModu ? 'Mağaza hesabı oluşturun' : 'Mağaza hesabınızla giriş yapın',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.65), fontSize: 13),
              ),
              const SizedBox(height: 24),
              Expanded(
                child: Container(
                  width: double.infinity,
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                  ),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: _tamam ? _basariKarti() : _form(),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _basariKarti() => Column(
        children: [
          const SizedBox(height: 12),
          const Icon(Icons.check_circle_rounded, color: Colors.green, size: 56),
          const SizedBox(height: 12),
          Text(
            _kayitModu ? 'Hesabınız oluşturuldu' : 'Giriş başarılı',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          const Text(
            'Mağaza başvurusunu (belge yükleme dahil) ve mağaza panelini web sitesinden yönetebilirsiniz.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _webdeAc,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              icon: const Icon(Icons.open_in_new_rounded, size: 18),
              label: const Text('Mağaza Paneli / Başvuru', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      );

  Widget _form() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(14)),
            child: Row(
              children: [
                _sekme('Giriş Yap', !_kayitModu, () => setState(() { _kayitModu = false; _hata = null; })),
                _sekme('Kayıt Ol', _kayitModu, () => setState(() { _kayitModu = true; _hata = null; })),
              ],
            ),
          ),
          if (_hata != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.error.withValues(alpha: 0.2)),
              ),
              child: Row(children: [
                Icon(Icons.error_outline_rounded, size: 16, color: AppColors.error),
                const SizedBox(width: 8),
                Expanded(child: Text(_hata!, style: TextStyle(color: AppColors.error, fontSize: 13))),
              ]),
            ),
          ],
          const SizedBox(height: 20),
          const Text('E-posta', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          TextField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            decoration: _dekor('ornek@email.com', Icons.email_outlined),
          ),
          const SizedBox(height: 16),
          const Text('Şifre', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          TextField(
            controller: _sifreCtrl,
            obscureText: !_sifreGoster,
            onSubmitted: (_) => _gonder(),
            decoration: _dekor(
              _kayitModu ? 'En az 8 karakter' : '••••••••',
              Icons.lock_outline_rounded,
              sonEk: IconButton(
                icon: Icon(_sifreGoster ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 20, color: AppColors.textSecondary),
                onPressed: () => setState(() => _sifreGoster = !_sifreGoster),
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _yukleniyor ? null : _gonder,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              child: _yukleniyor
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(_kayitModu ? 'Kayıt Ol' : 'Giriş Yap', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      );

  Widget _sekme(String metin, bool secili, VoidCallback onTap) => Expanded(
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: secili ? AppColors.primary : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: Text(
              metin,
              style: TextStyle(
                fontWeight: secili ? FontWeight.w800 : FontWeight.w500,
                color: secili ? Colors.white : AppColors.textSecondary,
              ),
            ),
          ),
        ),
      );
}
