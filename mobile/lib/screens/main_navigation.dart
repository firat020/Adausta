import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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

  static const _navItems = [
    _NavData(icon: Icons.home_rounded,      activeIcon: Icons.home_rounded,        label: 'Anasayfa'),
    _NavData(icon: Icons.grid_view_rounded, activeIcon: Icons.grid_view_rounded,   label: 'Kategoriler'),
    _NavData(icon: Icons.near_me_rounded,   activeIcon: Icons.near_me_rounded,     label: 'En Yakın'),
    _NavData(icon: Icons.favorite_border_rounded, activeIcon: Icons.favorite_rounded, label: 'Favoriler'),
    _NavData(icon: Icons.person_outline_rounded,  activeIcon: Icons.person_rounded,   label: 'Profil'),
  ];

  void _onTap(int i) {
    HapticFeedback.selectionClick();
    setState(() => _currentIndex = i);
  }

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
              color: Colors.black.withOpacity(0.08),
              blurRadius: 24,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: SizedBox(
            height: 62,
            child: Row(
              children: List.generate(_navItems.length, (i) {
                final item = _navItems[i];
                final isActive = i == _currentIndex;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => _onTap(i),
                    behavior: HitTestBehavior.opaque,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      curve: Curves.easeOut,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? AppColors.primary.withOpacity(0.1)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Icon(
                              isActive ? item.activeIcon : item.icon,
                              size: 22,
                              color: isActive ? AppColors.primary : Colors.grey.shade400,
                            ),
                          ),
                          const SizedBox(height: 2),
                          AnimatedDefaultTextStyle(
                            duration: const Duration(milliseconds: 200),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: isActive ? FontWeight.w700 : FontWeight.w400,
                              color: isActive ? AppColors.primary : Colors.grey.shade400,
                            ),
                            child: Text(item.label),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavData {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavData({required this.icon, required this.activeIcon, required this.label});
}
