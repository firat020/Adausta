import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import '../services/api_service.dart';
import 'main_navigation.dart';

class MusteriGirisScreen extends StatefulWidget {
  /// [pushReplace] true → replace entire stack with MainNavigation on success.
  /// false → pop with `true` result so caller can refresh state.
  final bool pushReplace;

  const MusteriGirisScreen({super.key, this.pushReplace = true});

  @override
  State<MusteriGirisScreen> createState() => _MusteriGirisScreenState();
}

class _MusteriGirisScreenState extends State<MusteriGirisScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  final _api = ApiService();

  // Giriş
  final _girisEmailCtrl = TextEditingController();
  final _girisSifreCtrl = TextEditingController();

  // Kayıt
  final _kayitAdCtrl = TextEditingController();
  final _kayitEmailCtrl = TextEditingController();
  final _kayitSifreCtrl = TextEditingController();

  bool _sifreGoster1 = false;
  bool _sifreGoster2 = false;
  bool _yukleniyor = false;
  String? _hata;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _tabCtrl.addListener(() => setState(() => _hata = null));
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _girisEmailCtrl.dispose();
    _girisSifreCtrl.dispose();
    _kayitAdCtrl.dispose();
    _kayitEmailCtrl.dispose();
    _kayitSifreCtrl.dispose();
    super.dispose();
  }

  void _devamEt() {
    if (widget.pushReplace) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const MainNavigation()),
        (_) => false,
      );
    } else {
      Navigator.of(context).pop(true);
    }
  }

  Future<void> _giris() async {
    if (_girisEmailCtrl.text.isEmpty || _girisSifreCtrl.text.isEmpty) {
      setState(() => _hata = 'Email ve şifre gerekli');
      return;
    }
    setState(() { _yukleniyor = true; _hata = null; });
    try {
      final k = await _api.giris(_girisEmailCtrl.text.trim(), _girisSifreCtrl.text);
      if (!mounted) return;
      if (k == null) {
        setState(() { _hata = 'Giriş başarısız'; _yukleniyor = false; });
        return;
      }
      _devamEt();
    } catch (e) {
      if (mounted) setState(() { _hata = e.toString().replaceAll('Exception: ', ''); _yukleniyor = false; });
    }
  }

  Future<void> _kayit() async {
    if (_kayitAdCtrl.text.isEmpty || _kayitEmailCtrl.text.isEmpty || _kayitSifreCtrl.text.isEmpty) {
      setState(() => _hata = 'Tüm alanlar zorunlu');
      return;
    }
    if (_kayitSifreCtrl.text.length < 8) {
      setState(() => _hata = 'Şifre en az 8 karakter olmalı');
      return;
    }
    setState(() { _yukleniyor = true; _hata = null; });
    try {
      final k = await _api.musteriKayit(
        _kayitEmailCtrl.text.trim(),
        _kayitSifreCtrl.text,
        _kayitAdCtrl.text.trim(),
      );
      if (!mounted) return;
      if (k == null) {
        setState(() { _hata = 'Kayıt başarısız'; _yukleniyor = false; });
        return;
      }
      _devamEt();
    } catch (e) {
      if (mounted) setState(() { _hata = e.toString().replaceAll('Exception: ', ''); _yukleniyor = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.heroGradient),
        child: SafeArea(
          child: Column(
            children: [
              // Geri
              Align(
                alignment: Alignment.topLeft,
                child: IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back_ios_rounded, color: Colors.white),
                ),
              ),

              // Başlık
              const SizedBox(height: 8),
              const Text(
                'Hoş Geldiniz',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Usta bulmak için giriş yapın veya kayıt olun',
                style: TextStyle(color: Colors.white.withOpacity(0.65), fontSize: 13),
              ),
              const SizedBox(height: 24),

              // Kart
              Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 24,
                        offset: const Offset(0, -4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Tab bar
                      Container(
                        margin: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: TabBar(
                          controller: _tabCtrl,
                          labelColor: Colors.white,
                          unselectedLabelColor: AppColors.textSecondary,
                          labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
                          indicator: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          indicatorSize: TabBarIndicatorSize.tab,
                          dividerColor: Colors.transparent,
                          tabs: const [
                            Tab(text: 'Giriş Yap'),
                            Tab(text: 'Kayıt Ol'),
                          ],
                        ),
                      ),

                      // Hata
                      if (_hata != null)
                        Container(
                          margin: const EdgeInsets.fromLTRB(20, 12, 20, 0),
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

                      // Tab içerikleri
                      Expanded(
                        child: TabBarView(
                          controller: _tabCtrl,
                          children: [
                            _GirisTab(
                              emailCtrl: _girisEmailCtrl,
                              sifreCtrl: _girisSifreCtrl,
                              sifreGoster: _sifreGoster1,
                              onSifreToggle: () => setState(() => _sifreGoster1 = !_sifreGoster1),
                              yukleniyor: _yukleniyor,
                              onGiris: _giris,
                            ),
                            _KayitTab(
                              adCtrl: _kayitAdCtrl,
                              emailCtrl: _kayitEmailCtrl,
                              sifreCtrl: _kayitSifreCtrl,
                              sifreGoster: _sifreGoster2,
                              onSifreToggle: () => setState(() => _sifreGoster2 = !_sifreGoster2),
                              yukleniyor: _yukleniyor,
                              onKayit: _kayit,
                            ),
                          ],
                        ),
                      ),

                      // Misafir
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                        child: GestureDetector(
                          onTap: _devamEt,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Kayıt olmadan devam et  ', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                              const Icon(Icons.arrow_forward_rounded, size: 14, color: AppColors.primary),
                            ],
                          ),
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

class _GirisTab extends StatelessWidget {
  final TextEditingController emailCtrl;
  final TextEditingController sifreCtrl;
  final bool sifreGoster;
  final VoidCallback onSifreToggle;
  final bool yukleniyor;
  final VoidCallback onGiris;

  const _GirisTab({
    required this.emailCtrl,
    required this.sifreCtrl,
    required this.sifreGoster,
    required this.onSifreToggle,
    required this.yukleniyor,
    required this.onGiris,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Label('E-posta'),
          const SizedBox(height: 8),
          TextField(
            controller: emailCtrl,
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
          _Label('Şifre'),
          const SizedBox(height: 8),
          TextField(
            controller: sifreCtrl,
            obscureText: !sifreGoster,
            onSubmitted: (_) => onGiris(),
            decoration: InputDecoration(
              hintText: '••••••••',
              prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.primary, size: 20),
              suffixIcon: IconButton(
                icon: Icon(sifreGoster ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 20, color: AppColors.textSecondary),
                onPressed: onSifreToggle,
              ),
              filled: true,
              fillColor: AppColors.background,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: yukleniyor ? null : onGiris,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              child: yukleniyor
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Giriş Yap', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      ),
    );
  }
}

class _KayitTab extends StatelessWidget {
  final TextEditingController adCtrl;
  final TextEditingController emailCtrl;
  final TextEditingController sifreCtrl;
  final bool sifreGoster;
  final VoidCallback onSifreToggle;
  final bool yukleniyor;
  final VoidCallback onKayit;

  const _KayitTab({
    required this.adCtrl,
    required this.emailCtrl,
    required this.sifreCtrl,
    required this.sifreGoster,
    required this.onSifreToggle,
    required this.yukleniyor,
    required this.onKayit,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Label('Ad Soyad'),
          const SizedBox(height: 8),
          TextField(
            controller: adCtrl,
            textCapitalization: TextCapitalization.words,
            decoration: InputDecoration(
              hintText: 'Adınız Soyadınız',
              prefixIcon: const Icon(Icons.person_outline_rounded, color: AppColors.primary, size: 20),
              filled: true,
              fillColor: AppColors.background,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 16),
          _Label('E-posta'),
          const SizedBox(height: 8),
          TextField(
            controller: emailCtrl,
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
          _Label('Şifre'),
          const SizedBox(height: 8),
          TextField(
            controller: sifreCtrl,
            obscureText: !sifreGoster,
            decoration: InputDecoration(
              hintText: 'En az 8 karakter',
              prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.primary, size: 20),
              suffixIcon: IconButton(
                icon: Icon(sifreGoster ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 20, color: AppColors.textSecondary),
                onPressed: onSifreToggle,
              ),
              filled: true,
              fillColor: AppColors.background,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: yukleniyor ? null : onKayit,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              child: yukleniyor
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Kayıt Ol', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textSecondary),
    );
  }
}
