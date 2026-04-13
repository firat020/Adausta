import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import 'usta_kayit_screen.dart';

class ProfilScreen extends StatelessWidget {
  const ProfilScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 200,
            backgroundColor: AppColors.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                    gradient: AppColors.heroGradient),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 40),
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                            color: AppColors.accent, width: 3),
                        gradient: AppColors.primaryGradient,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.accent.withOpacity(0.3),
                            blurRadius: 20,
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.person_rounded,
                        color: Colors.white,
                        size: 42,
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Ada Usta',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Text(
                      'KKTC\'nin Usta Platformu',
                      style: TextStyle(
                        color: Colors.white60,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            title: const Text(
              'Profil',
              style: TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _buildKart([
                    _buildMenuItem(
                      Icons.add_business_rounded,
                      'Usta Olarak Kayıt Ol',
                      'Platformda usta olarak yer alın',
                      AppColors.primary,
                      () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const UstaKayitScreen(),
                        ),
                      ),
                    ),
                  ]),
                  const SizedBox(height: 12),
                  _buildKart([
                    _buildMenuItem(
                      Icons.info_outline_rounded,
                      'Hakkında',
                      'Ada Usta v1.0.0',
                      const Color(0xFF3498db),
                      null,
                    ),
                    _buildDivider(),
                    _buildMenuItem(
                      Icons.location_city_rounded,
                      'Hizmet Bölgesi',
                      'Kuzey Kıbrıs Türk Cumhuriyeti',
                      const Color(0xFF2ecc71),
                      null,
                    ),
                    _buildDivider(),
                    _buildMenuItem(
                      Icons.phone_rounded,
                      'Destek',
                      'Sorunlarınız için bize ulaşın',
                      const Color(0xFFe67e22),
                      null,
                    ),
                  ]),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.build_circle_rounded,
                            color: AppColors.accent, size: 40),
                        SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Ada Usta',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Kuzey Kıbrıs\'ta güvenilir hizmet',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                ),
                              ),
                            ],
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

  Widget _buildKart(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(children: children),
    );
  }

  Widget _buildMenuItem(
    IconData ikon,
    String baslik,
    String altBaslik,
    Color renk,
    VoidCallback? onTap,
  ) {
    return ListTile(
      onTap: onTap,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: renk.withOpacity(0.12),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(ikon, color: renk, size: 22),
      ),
      title: Text(
        baslik,
        style: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 14,
          color: AppColors.textPrimary,
        ),
      ),
      subtitle: Text(
        altBaslik,
        style: const TextStyle(
          fontSize: 12,
          color: AppColors.textSecondary,
        ),
      ),
      trailing: onTap != null
          ? const Icon(Icons.arrow_forward_ios_rounded,
              size: 14, color: AppColors.textSecondary)
          : null,
    );
  }

  Widget _buildDivider() {
    return const Divider(height: 1, indent: 72);
  }
}
