import 'dart:async';
import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/api_service.dart';
import '../../services/fcm_service.dart';
import 'usta_panel_dashboard.dart';
import 'usta_panel_talepler.dart';
import 'usta_panel_mesajlar.dart';
import 'usta_panel_yorumlar.dart';
import 'usta_panel_profil.dart';
import 'usta_panel_abonelik.dart';
import 'usta_giris_screen.dart';

class UstaPanelScreen extends StatefulWidget {
  const UstaPanelScreen({super.key});

  @override
  State<UstaPanelScreen> createState() => _UstaPanelScreenState();
}

class _UstaPanelScreenState extends State<UstaPanelScreen> {
  final _api = ApiService();
  int _tab = 0;
  Map<String, dynamic>? _kullanici;
  bool _musaitlik = true;
  int _talepBadge = 0;
  int _mesajBadge = 0;
  Timer? _rozetTimer;

  static const _tabs = [
    _TabData(icon: Icons.dashboard_rounded,      label: 'Panel'),
    _TabData(icon: Icons.assignment_rounded,     label: 'Talepler'),
    _TabData(icon: Icons.chat_bubble_rounded,    label: 'Mesajlar'),
    _TabData(icon: Icons.star_rounded,           label: 'Yorumlar'),
    _TabData(icon: Icons.person_rounded,         label: 'Profilim'),
  ];

  @override
  void initState() {
    super.initState();
    _kontrolEt();
    _rozetTimer = Timer.periodic(const Duration(seconds: 60), (_) => _rozetleriYukle());
  }

  @override
  void dispose() {
    _rozetTimer?.cancel();
    super.dispose();
  }

  Future<void> _kontrolEt() async {
    final k = await _api.benimBilgilerim();
    if (!mounted) return;
    if (k == null || k['rol'] != 'usta') {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const UstaGirisScreen()));
      return;
    }
    setState(() => _kullanici = k);
    // Dashboard'dan müsaitliği çek
    try {
      final panel = await _api.ustaPanelDashboard();
      if (mounted) setState(() => _musaitlik = panel['usta']?['musaitlik'] ?? true);
    } catch (_) {}
    _rozetleriYukle();
    _pendingRotayiUygula();
  }

  Future<void> _rozetleriYukle() async {
    try {
      final t = await _api.ustaOkunmamisSayisi();
      final m = await _api.ustaMesajOkunmamisSayisi();
      if (mounted) setState(() { _talepBadge = t; _mesajBadge = m; });
    } catch (_) {}
  }

  void _pendingRotayiUygula() {
    final route = FCMService.instance.consumePendingRoute();
    if (route == null) return;
    final ekran = route['ekran'] as String?;
    switch (ekran) {
      case 'talepler':
        setState(() => _tab = 1);
        break;
      case 'mesajlar':
        setState(() { _tab = 2; _mesajBadge = 0; });
        break;
      case 'abonelik':
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            Navigator.push(context, MaterialPageRoute(builder: (_) => UstaPanelAbonelik(api: _api)));
          }
        });
        break;
      case 'profil':
        setState(() => _tab = 4);
        break;
      case 'anasayfa':
      default:
        setState(() => _tab = 0);
    }
  }

  void _tabSecildi(int i) {
    setState(() => _tab = i);
    if (i == 1) {
      _rozetleriYukle();
    } else if (i == 2) {
      setState(() => _mesajBadge = 0);
    }
  }

  Future<void> _cikis() async {
    await _api.cikisYap();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const UstaGirisScreen()),
        (_) => false,
      );
    }
  }

  Future<void> _toggleMusaitlik() async {
    final yeni = !_musaitlik;
    setState(() => _musaitlik = yeni);
    await _api.musaitlikToggle(yeni);
  }

  @override
  Widget build(BuildContext context) {
    if (_kullanici == null) {
      return const Scaffold(
        backgroundColor: AppColors.primary,
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            SizedBox(
              height: 34,
              child: Image.asset('assets/images/ada-usta-logo.png', fit: BoxFit.contain),
            ),
            const SizedBox(width: 10),
            const Text('Usta Paneli', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18)),
          ],
        ),
        actions: [
          // Müsaitlik toggle
          GestureDetector(
            onTap: _toggleMusaitlik,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: _musaitlik ? AppColors.success.withValues(alpha: 0.2) : Colors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _musaitlik ? AppColors.success.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.2),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 7, height: 7,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _musaitlik ? AppColors.success : Colors.grey,
                    ),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    _musaitlik ? 'Müsait' : 'Müsait Değil',
                    style: TextStyle(
                      color: _musaitlik ? AppColors.success : Colors.white60,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Çıkış
          IconButton(
            onPressed: _cikis,
            icon: const Icon(Icons.logout_rounded, color: Colors.white70, size: 20),
          ),
        ],
      ),
      body: IndexedStack(
        index: _tab,
        children: [
          UstaPanelDashboard(api: _api),
          UstaPanelTalepler(api: _api),
          UstaPanelMesajlar(api: _api),
          UstaPanelYorumlar(api: _api),
          UstaPanelProfil(api: _api),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, -3))],
        ),
        child: SafeArea(
          child: SizedBox(
            height: 58,
            child: Row(
              children: List.generate(_tabs.length, (i) {
                final item = _tabs[i];
                final isActive = i == _tab;
                final rozet = i == 1 ? _talepBadge : (i == 2 ? _mesajBadge : 0);
                return Expanded(
                  child: GestureDetector(
                    onTap: () => _tabSecildi(i),
                    behavior: HitTestBehavior.opaque,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Stack(
                          clipBehavior: Clip.none,
                          children: [
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 180),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                              decoration: BoxDecoration(
                                color: isActive ? AppColors.primary.withValues(alpha: 0.1) : Colors.transparent,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(item.icon, size: 22, color: isActive ? AppColors.primary : Colors.grey.shade400),
                            ),
                            if (rozet > 0)
                              Positioned(
                                right: 6,
                                top: 0,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                  constraints: const BoxConstraints(minWidth: 16),
                                  decoration: BoxDecoration(color: AppColors.error, borderRadius: BorderRadius.circular(10)),
                                  child: Text(
                                    rozet > 9 ? '9+' : '$rozet',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 1),
                        Text(
                          item.label,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: isActive ? FontWeight.w700 : FontWeight.w400,
                            color: isActive ? AppColors.primary : Colors.grey.shade400,
                          ),
                        ),
                      ],
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

class _TabData {
  final IconData icon;
  final String label;
  const _TabData({required this.icon, required this.label});
}
