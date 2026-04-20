import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../config/app_theme.dart';
import '../config/api_config.dart';
import '../models/usta.dart';

class UstaKart extends StatelessWidget {
  final Usta usta;
  final VoidCallback? onTap;
  final bool showMesafe;

  const UstaKart({
    super.key,
    required this.usta,
    this.onTap,
    this.showMesafe = false,
  });

  @override
  Widget build(BuildContext context) {
    final foto = usta.fotograflar.isNotEmpty ? usta.fotograflar.first : null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.08),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          children: [
            // Üst kısım — fotoğraf + gradient overlay
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              child: Stack(
                children: [
                  // Fotoğraf veya gradient bg
                  SizedBox(
                    height: 110,
                    width: double.infinity,
                    child: foto != null
                        ? CachedNetworkImage(
                            imageUrl: '${ApiConfig.uploads}/$foto',
                            fit: BoxFit.cover,
                            errorWidget: (_, __, ___) => _defaultBg(),
                          )
                        : _defaultBg(),
                  ),
                  // Gradient karartma
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withOpacity(0.55),
                          ],
                        ),
                      ),
                    ),
                  ),
                  // Kategori rozeti (sol üst)
                  Positioned(
                    top: 10,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.accent,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        usta.kategoriAd,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  // Puan rozeti (sağ üst)
                  Positioned(
                    top: 10,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.45),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star_rounded, size: 13, color: AppColors.accent),
                          const SizedBox(width: 3),
                          Text(
                            usta.puan != null
                                ? usta.puan!.toStringAsFixed(1)
                                : 'Yeni',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // İsim (sol alt)
                  Positioned(
                    bottom: 10,
                    left: 12,
                    right: 12,
                    child: Text(
                      usta.tamAd,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        shadows: [Shadow(color: Colors.black54, blurRadius: 4)],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),

            // Alt kısım — bilgiler
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 11, 14, 13),
              child: Row(
                children: [
                  // Konum
                  const Icon(Icons.location_on_rounded, size: 14, color: AppColors.primaryMid),
                  const SizedBox(width: 3),
                  Expanded(
                    child: Text(
                      usta.konumText,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (showMesafe && usta.mesafe != null) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.near_me_rounded, size: 12, color: AppColors.accent),
                          const SizedBox(width: 3),
                          Text(
                            '${usta.mesafe!.toStringAsFixed(1)} km',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.accent,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    // Yorum sayısı
                    const Icon(Icons.chat_bubble_outline_rounded, size: 13, color: AppColors.textSecondary),
                    const SizedBox(width: 3),
                    Text(
                      '${usta.yorumSayisi} yorum',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: AppColors.textSecondary),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _defaultBg() {
    return Container(
      decoration: const BoxDecoration(gradient: AppColors.heroGradient),
      child: Center(
        child: Text(
          usta.ad.isNotEmpty ? usta.ad[0].toUpperCase() : '?',
          style: const TextStyle(
            color: Colors.white38,
            fontSize: 56,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
    );
  }
}
