import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import 'musteri_giris_screen.dart';
import 'usta_panel/usta_giris_screen.dart';

class KarsilamaScreen extends StatefulWidget {
  const KarsilamaScreen({super.key});

  @override
  State<KarsilamaScreen> createState() => _KarsilamaScreenState();
}

class _KarsilamaScreenState extends State<KarsilamaScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOut),
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.12),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.heroGradient),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnim,
            child: SlideTransition(
              position: _slideAnim,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  children: [
                    const Spacer(flex: 2),

                    // Logo
                    Container(
                      width: 120,
                      height: 120,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.12),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.accent.withOpacity(0.5),
                          width: 2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.accent.withOpacity(0.25),
                            blurRadius: 36,
                            spreadRadius: 8,
                          ),
                        ],
                      ),
                      child: Image.asset(
                        'assets/images/ada-usta-logo.png',
                        fit: BoxFit.contain,
                      ),
                    ),

                    const SizedBox(height: 30),

                    const Text(
                      'Ada Usta',
                      style: TextStyle(
                        fontSize: 40,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "KKTC'nin Güvenilir Usta Platformu",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white.withOpacity(0.65),
                        letterSpacing: 0.4,
                      ),
                    ),

                    const Spacer(flex: 3),

                    // Seçim kartı
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(28),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 36,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'Nasıl devam etmek istersiniz?',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Usta Bul
                          _SecimiButon(
                            label: 'Usta Bul',
                            subtitle: 'Giriş yap veya ücretsiz kayıt ol',
                            gradient: AppColors.heroGradient,
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const MusteriGirisScreen()),
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Usta Girişi
                          _SecimiButon(
                            label: 'Usta Girişi',
                            subtitle: 'Usta panelinize giriş yapın',
                            gradient: const LinearGradient(
                              colors: [Color(0xFFf5a623), Color(0xFFe8951f)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const UstaGirisScreen()),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const Spacer(flex: 1),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SecimiButon extends StatelessWidget {
  final String label;
  final String subtitle;
  final LinearGradient gradient;
  final VoidCallback onTap;

  const _SecimiButon({
    required this.label,
    required this.subtitle,
    required this.gradient,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: gradient.colors.first.withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.78),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios_rounded,
              color: Colors.white70,
              size: 18,
            ),
          ],
        ),
      ),
    );
  }
}
