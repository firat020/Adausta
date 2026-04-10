import 'package:flutter/material.dart';
import '../models/usta.dart';
import '../config/api_config.dart';

class UstaKart extends StatelessWidget {
  final Usta usta;
  final VoidCallback onTap;

  const UstaKart({super.key, required this.usta, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              _avatar(),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      usta.tamAd,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      usta.kategoriAd,
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                    if (usta.sehir != null) ...[
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(Icons.location_on, size: 12, color: Colors.grey[500]),
                          Text(
                            '${usta.sehir}${usta.ilce != null ? ", ${usta.ilce}" : ""}',
                            style: TextStyle(color: Colors.grey[500], fontSize: 12),
                          ),
                        ],
                      ),
                    ],
                    if (usta.puan != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 14),
                          Text(
                            ' ${usta.puan!.toStringAsFixed(1)}',
                            style: const TextStyle(fontSize: 12),
                          ),
                          Text(
                            ' (${usta.yorumSayisi} yorum)',
                            style: TextStyle(color: Colors.grey[500], fontSize: 11),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }

  Widget _avatar() {
    if (usta.fotograflar.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(
          '${ApiConfig.uploads}/${usta.fotograflar.first}',
          width: 60,
          height: 60,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _defaultAvatar(),
        ),
      );
    }
    return _defaultAvatar();
  }

  Widget _defaultAvatar() {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        color: const Color(0xFF1e3a5f),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Center(
        child: Text(
          usta.ad.isNotEmpty ? usta.ad[0].toUpperCase() : '?',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
