import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import 'ana_sayfa.dart';
import 'kategoriler_screen.dart';
import 'en_yakin_screen.dart';
import 'favoriler_screen.dart';
import 'profil_screen.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    AnaSayfa(),
    KategorilerScreen(),
    EnYakinScreen(),
    FavorilerScreen(),
    ProfilScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.12),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _NavItem(
                  index: 0,
                  current: _currentIndex,
                  icon: Icons.home_rounded,
                  label: 'Anasayfa',
                  onTap: () => setState(() => _currentIndex = 0),
                ),
                _NavItem(
                  index: 1,
                  current: _currentIndex,
                  icon: Icons.grid_view_rounded,
                  label: 'Kategoriler',
                  onTap: () => setState(() => _currentIndex = 1),
                ),
                _NavItem(
                  index: 2,
                  current: _currentIndex,
                  icon: Icons.near_me_rounded,
                  label: 'En Yakın',
                  onTap: () => setState(() => _currentIndex = 2),
                ),
                _NavItem(
                  index: 3,
                  current: _currentIndex,
                  icon: Icons.favorite_rounded,
                  label: 'Favoriler',
                  onTap: () => setState(() => _currentIndex = 3),
                ),
                _NavItem(
                  index: 4,
                  current: _currentIndex,
                  icon: Icons.person_rounded,
                  label: 'Profil',
                  onTap: () => setState(() => _currentIndex = 4),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final int index;
  final int current;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _NavItem({
    required this.index,
    required this.current,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isActive = index == current;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          color: isActive
              ? AppColors.primary.withOpacity(0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 24,
              color: isActive ? AppColors.primary : Colors.grey.shade400,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight:
                    isActive ? FontWeight.bold : FontWeight.normal,
                color: isActive ? AppColors.primary : Colors.grey.shade400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
