import 'dart:math';
import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import 'main_navigation.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _mainCtrl;
  late AnimationController _pulseCtrl;
  late AnimationController _dotsCtrl;

  late Animation<double> _scaleAnim;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;
  late Animation<double> _glowAnim;

  @override
  void initState() {
    super.initState();

    _mainCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );

    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    _dotsCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat();

    _scaleAnim = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainCtrl,
        curve: const Interval(0.0, 0.55, curve: Curves.elasticOut),
      ),
    );

    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainCtrl,
        curve: const Interval(0.3, 0.75, curve: Curves.easeIn),
      ),
    );

    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.4),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _mainCtrl,
        curve: const Interval(0.4, 0.85, curve: Curves.easeOut),
      ),
    );

    _glowAnim = Tween<double>(begin: 0.25, end: 0.65).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );

    _mainCtrl.forward();

    Future.delayed(const Duration(milliseconds: 3000), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (_, anim, __) => const MainNavigation(),
            transitionsBuilder: (_, anim, __, child) =>
                FadeTransition(opacity: anim, child: child),
            transitionDuration: const Duration(milliseconds: 500),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _mainCtrl.dispose();
    _pulseCtrl.dispose();
    _dotsCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.heroGradient),
        child: Stack(
          children: [
            // Arka plan dekoratif daireler
            Positioned(
              top: -70,
              right: -70,
              child: AnimatedBuilder(
                animation: _glowAnim,
                builder: (_, __) => Container(
                  width: 260,
                  height: 260,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(_glowAnim.value * 0.05),
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: -90,
              left: -90,
              child: AnimatedBuilder(
                animation: _glowAnim,
                builder: (_, __) => Container(
                  width: 320,
                  height: 320,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.accent.withOpacity(_glowAnim.value * 0.07),
                  ),
                ),
              ),
            ),
            Positioned(
              top: 120,
              left: -40,
              child: AnimatedBuilder(
                animation: _glowAnim,
                builder: (_, __) => Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(_glowAnim.value * 0.03),
                  ),
                ),
              ),
            ),

            // Ana içerik
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo + glow ring
                  AnimatedBuilder(
                    animation: Listenable.merge([_scaleAnim, _glowAnim]),
                    builder: (_, __) => Transform.scale(
                      scale: _scaleAnim.value,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Dış parlama
                          Container(
                            width: 190,
                            height: 190,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.accent
                                      .withOpacity(_glowAnim.value * 0.55),
                                  blurRadius: 50,
                                  spreadRadius: 12,
                                ),
                                BoxShadow(
                                  color: Colors.white
                                      .withOpacity(_glowAnim.value * 0.12),
                                  blurRadius: 30,
                                  spreadRadius: 4,
                                ),
                              ],
                            ),
                          ),
                          // Logo çemberi
                          Container(
                            width: 155,
                            height: 155,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.1),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Colors.white.withOpacity(0.18),
                                width: 1.5,
                              ),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(22),
                              child: Image.asset(
                                'assets/images/ada-usta-logo.png',
                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 38),

                  // Başlık + alt yazı
                  FadeTransition(
                    opacity: _fadeAnim,
                    child: SlideTransition(
                      position: _slideAnim,
                      child: Column(
                        children: [
                          const Text(
                            'Ada Usta',
                            style: TextStyle(
                              fontSize: 44,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: 2.5,
                            ),
                          ),
                          const SizedBox(height: 10),
                          const Text(
                            "KKTC'nin Güvenilir Usta Platformu",
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white60,
                              letterSpacing: 0.6,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                          const SizedBox(height: 10),
                          // Turuncu çizgi aksanı
                          Container(
                            width: 48,
                            height: 3,
                            decoration: BoxDecoration(
                              color: AppColors.accent,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 80),

                  // Zıplayan nokta animasyonu
                  FadeTransition(
                    opacity: _fadeAnim,
                    child: _BouncingDots(controller: _dotsCtrl),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BouncingDots extends AnimatedWidget {
  const _BouncingDots({required AnimationController controller})
      : super(listenable: controller);

  @override
  Widget build(BuildContext context) {
    final t = (listenable as AnimationController).value;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(3, (i) {
        final delay = i / 3.0;
        final phase = ((t - delay) % 1.0 + 1.0) % 1.0;
        final offsetY = -sin(phase * pi) * 9.0;
        final opacity = 0.45 + sin(phase * pi) * 0.55;
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 5),
          child: Transform.translate(
            offset: Offset(0, offsetY),
            child: Container(
              width: 9,
              height: 9,
              decoration: BoxDecoration(
                color: AppColors.accent.withOpacity(opacity.clamp(0.45, 1.0)),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.accent.withOpacity(opacity * 0.4),
                    blurRadius: 6,
                    spreadRadius: 1,
                  ),
                ],
              ),
            ),
          ),
        );
      }),
    );
  }
}
