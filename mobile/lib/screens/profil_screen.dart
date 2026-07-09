import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../config/app_theme.dart';
import '../services/api_service.dart';
import 'usta_kayit_screen.dart';
import 'usta_panel/usta_giris_screen.dart';
import 'musteri_giris_screen.dart';

class ProfilScreen extends StatefulWidget {
  const ProfilScreen({super.key});

  @override
  State<ProfilScreen> createState() => _ProfilScreenState();
}

class _ProfilScreenState extends State<ProfilScreen> {
  final _api = ApiService();
  Map<String, dynamic>? _kullanici;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _kontrol();
  }

  Future<void> _kontrol() async {
    setState(() => _loading = true);
    final k = await _api.benimBilgilerim();
    if (mounted) setState(() { _kullanici = k; _loading = false; });
  }

  Future<void> _cikis() async {
    await _api.cikisYap();
    if (mounted) setState(() => _kullanici = null);
  }

  void _paylas() {
    Share.share(
      "Ada Usta - KKTC'nin en iyi usta bulma uygulaması! "
      'Elektrikçi, tesisatçı, boyacı ve daha fazlası için hemen indir: https://adausta.com',
      subject: 'Ada Usta',
    );
  }

  String _initials(String ad) {
    final parts = ad.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return ad.isNotEmpty ? ad[0].toUpperCase() : 'A';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.accent,
        onRefresh: _kontrol,
        child: CustomScrollView(
          slivers: [
            _buildAppBar(),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const SizedBox(height: 4),
                    if (_kullanici != null) _buildGirisliView() else _buildMisafirView(),
                    const SizedBox(height: 16),
                    _buildBilgiKarti(),
                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    final ad = _kullanici?['ad'] as String? ?? 'Ada Usta';
    final subtitle = _kullanici?['email'] as String? ?? "KKTC'nin Usta Platformu";

    return SliverAppBar(
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
                    if (_kullanici != null)
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: AppColors.accentGradient,
                          border: Border.all(color: Colors.white, width: 3),
                          boxShadow: [
                            BoxShadow(color: AppColors.accent.withOpacity(0.4), blurRadius: 16, offset: const Offset(0, 4)),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            _initials(ad),
                            style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900),
                          ),
                        ),
                      )
                    else
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
                    Text(
                      ad,
                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.accent.withOpacity(0.4)),
                      ),
                      child: Text(
                        subtitle,
                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                        overflow: TextOverflow.ellipsis,
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
    );
  }

  Widget _buildGirisliView() {
    return Column(
      children: [
        // Çıkış kartı
        _AksiyonKart(
          ikon: Icons.logout_rounded,
          ikonRenk: AppColors.error,
          baslik: 'Çıkış Yap',
          altBaslik: 'Hesabınızdan güvenli çıkış yapın',
          onTap: () async {
            final onay = await showDialog<bool>(
              context: context,
              builder: (_) => AlertDialog(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                title: const Text('Çıkış Yap', style: TextStyle(fontWeight: FontWeight.bold)),
                content: const Text('Hesabınızdan çıkmak istediğinize emin misiniz?'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: const Text('İptal'),
                  ),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.error,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Çıkış Yap', style: TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            );
            if (onay == true) _cikis();
          },
        ),
        const SizedBox(height: 12),
        _buildUstaOlKarti(),
      ],
    );
  }

  Widget _buildMisafirView() {
    return Column(
      children: [
        // Giriş yap
        GestureDetector(
          onTap: () async {
            final girisOldu = await Navigator.push<bool>(
              context,
              MaterialPageRoute(builder: (_) => const MusteriGirisScreen(pushReplace: false)),
            );
            if (girisOldu == true) _kontrol();
          },
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
                      Text('Giriş Yap', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w800)),
                      SizedBox(height: 2),
                      Text('Hesabınıza giriş yapın', style: TextStyle(color: Colors.white60, fontSize: 12)),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward_ios_rounded, color: Colors.white54, size: 14),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        _buildUstaOlKarti(),
        const SizedBox(height: 12),
        // Usta Girişi
        GestureDetector(
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const UstaGirisScreen())),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.primary.withOpacity(0.2)),
              boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.06), blurRadius: 12, offset: const Offset(0, 4))],
            ),
            child: const Row(
              children: [
                Icon(Icons.handyman_rounded, color: AppColors.primary, size: 20),
                SizedBox(width: 12),
                Expanded(
                  child: Text('Usta Girişi', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 14)),
                ),
                Icon(Icons.arrow_forward_ios_rounded, size: 13, color: AppColors.textSecondary),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildUstaOlKarti() {
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const UstaKayitScreen())),
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
          boxShadow: [BoxShadow(color: AppColors.accent.withOpacity(0.35), blurRadius: 16, offset: const Offset(0, 6))],
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(14)),
              child: const Icon(Icons.add_business_rounded, color: Colors.white, size: 26),
            ),
            const SizedBox(width: 16),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Usta Olarak Kayıt Ol', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800)),
                  SizedBox(height: 3),
                  Text('Platformda usta olarak yer alın, müşteri bulun', style: TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white70, size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildBilgiKarti() {
    return _Kart(children: [
      _MenuItem(
        ikon: Icons.info_outline_rounded,
        baslik: 'Hakkında',
        altBaslik: 'Ada Usta v1.0.2 — KKTC Usta Platformu',
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
        ikon: Icons.support_agent_rounded,
        baslik: 'Destek',
        altBaslik: 'destek@adausta.com',
        renk: const Color(0xFFe67e22),
        onTap: () => showDialog(
          context: context,
          builder: (_) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('Destek', style: TextStyle(fontWeight: FontWeight.bold)),
            content: const Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('E-posta: destek@adausta.com'),
                SizedBox(height: 8),
                Text('Web: adausta.com'),
              ],
            ),
            actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Tamam'))],
          ),
        ),
      ),
      _Divider(),
      _MenuItem(
        ikon: Icons.share_rounded,
        baslik: 'Uygulamayı Paylaş',
        altBaslik: 'Arkadaşlarınıza tavsiye edin',
        renk: AppColors.primary,
        onTap: _paylas,
      ),
    ]);
  }
}

class _AksiyonKart extends StatelessWidget {
  final IconData ikon;
  final Color ikonRenk;
  final String baslik;
  final String altBaslik;
  final VoidCallback onTap;

  const _AksiyonKart({
    required this.ikon,
    required this.ikonRenk,
    required this.baslik,
    required this.altBaslik,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.06), blurRadius: 16, offset: const Offset(0, 4))],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: ikonRenk.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Icon(ikon, color: ikonRenk, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(baslik, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.textPrimary)),
                  const SizedBox(height: 2),
                  Text(altBaslik, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textSecondary),
          ],
        ),
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
        boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.06), blurRadius: 16, offset: const Offset(0, 4))],
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
        decoration: BoxDecoration(color: renk.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
        child: Icon(ikon, color: renk, size: 22),
      ),
      title: Text(baslik, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary)),
      subtitle: Text(altBaslik, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
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
