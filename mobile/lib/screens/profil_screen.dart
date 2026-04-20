import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import 'usta_kayit_screen.dart';
import 'usta_panel/usta_giris_screen.dart';

class ProfilScreen extends StatelessWidget {
  const ProfilScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 210,
            backgroundColor: AppColors.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(gradient: AppColors.heroGradient),
                child: Stack(
                  children: [
                    Positioned(
                      right: -30,
                      top: -30,
                      child: Container(
                        width: 180,
                        height: 180,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.04),
                        ),
                      ),
                    ),
                    SafeArea(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(height: 12),
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withOpacity(0.12),
                              border: Border.all(color: AppColors.accent, width: 2.5),
                            ),
                            child: const Icon(Icons.person_rounded, color: Colors.white, size: 40),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Ada Usta',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.accent.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppColors.accent.withOpacity(0.4)),
                            ),
                            child: const Text(
                              "KKTC'nin Usta Platformu",
                              style: TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            title: const Text('Profil'),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const SizedBox(height: 4),

                  // Usta Ol kartı — öne çıkan
                  GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const UstaKayitScreen()),
                    ),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFf5a623), Color(0xFFe8951f)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.accent.withOpacity(0.35),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(Icons.add_business_rounded, color: Colors.white, size: 26),
                          ),
                          const SizedBox(width: 16),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Usta Olarak Kayıt Ol',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                SizedBox(height: 3),
                                Text(
                                  'Platformda usta olarak yer alın, müşteri bulun',
                                  style: TextStyle(color: Colors.white70, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white70, size: 16),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  const SizedBox(height: 12),

                  // Usta Girişi butonu
                  GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const UstaGirisScreen())),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 5))],
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.login_rounded, color: Colors.white, size: 24),
                          SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Usta Girişi', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w800)),
                                SizedBox(height: 2),
                                Text('Usta paneline giriş yap', style: TextStyle(color: Colors.white60, fontSize: 12)),
                              ],
                            ),
                          ),
                          Icon(Icons.arrow_forward_ios_rounded, color: Colors.white54, size: 14),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Bilgi kartı
                  _Kart(children: [
                    _MenuItem(
                      ikon: Icons.info_outline_rounded,
                      baslik: 'Hakkında',
                      altBaslik: 'Ada Usta v1.0.0',
                      renk: const Color(0xFF3498db),
                    ),
                    _Divider(),
                    _MenuItem(
                      ikon: Icons.location_city_rounded,
                      baslik: 'Hizmet Bölgesi',
                      altBaslik: 'Kuzey Kıbrıs Türk Cumhuriyeti',
                      renk: const Color(0xFF2ecc71),
                    ),
                    _Divider(),
                    _MenuItem(
                      ikon: Icons.phone_rounded,
                      baslik: 'Destek',
                      altBaslik: 'Sorunlarınız için bize ulaşın',
                      renk: const Color(0xFFe67e22),
                      onTap: () {},
                    ),
                    _Divider(),
                    _MenuItem(
                      ikon: Icons.share_rounded,
                      baslik: 'Uygulamayı Paylaş',
                      altBaslik: 'Arkadaşlarınıza tavsiye edin',
                      renk: AppColors.primary,
                      onTap: () {},
                    ),
                  ]),

                  const SizedBox(height: 16),

                  // Alt banner
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 50,
                          height: 50,
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Image.asset('assets/images/ada-usta-logo.png', fit: BoxFit.contain),
                        ),
                        const SizedBox(width: 16),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Ada Usta',
                                style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w800),
                              ),
                              SizedBox(height: 3),
                              Text(
                                "Kuzey Kıbrıs'ta güvenilir hizmet",
                                style: TextStyle(color: Colors.white60, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: AppColors.accent,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Text(
                            'v1.0',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 30),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Kart extends StatelessWidget {
  final List<Widget> children;
  const _Kart({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(children: children),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData ikon;
  final String baslik;
  final String altBaslik;
  final Color renk;
  final VoidCallback? onTap;

  const _MenuItem({
    required this.ikon,
    required this.baslik,
    required this.altBaslik,
    required this.renk,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: renk.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(ikon, color: renk, size: 22),
      ),
      title: Text(
        baslik,
        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary),
      ),
      subtitle: Text(
        altBaslik,
        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
      ),
      trailing: onTap != null
          ? const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textSecondary)
          : null,
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Divider(height: 1, indent: 72, endIndent: 16);
  }
}
