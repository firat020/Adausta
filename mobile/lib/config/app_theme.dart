import 'package:flutter/material.dart';

class AppColors {
  static const Color primary      = Color(0xFF1e3a5f);
  static const Color primaryDark  = Color(0xFF16213e);
  static const Color primaryMid   = Color(0xFF2d5986);
  static const Color accent       = Color(0xFFf5a623);
  static const Color accentDark   = Color(0xFFe8951f);
  static const Color background   = Color(0xFFf0f4f8);
  static const Color surface      = Color(0xFFFFFFFF);
  static const Color cardBg       = Color(0xFFFFFFFF);
  static const Color textPrimary  = Color(0xFF1a1a2e);
  static const Color textSecondary = Color(0xFF6c757d);
  static const Color success      = Color(0xFF25D366);
  static const Color error        = Color(0xFFe74c3c);
  static const Color starColor    = Color(0xFFf5a623);
  static const Color divider      = Color(0xFFE9ECEF);

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF1e3a5f), Color(0xFF16213e)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient heroGradient = LinearGradient(
    colors: [Color(0xFF1e3a5f), Color(0xFF2d5986)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFFf5a623), Color(0xFFe8951f)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

class AppTheme {
  static ThemeData get theme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: Brightness.light,
    ),
    scaffoldBackgroundColor: AppColors.background,
    appBarTheme: const AppBarTheme(
      elevation: 0,
      centerTitle: true,
      backgroundColor: Colors.transparent,
      foregroundColor: Colors.white,
      titleTextStyle: TextStyle(
        color: Colors.white,
        fontSize: 20,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.3,
      ),
    ),
    cardTheme: CardTheme(
      elevation: 0,
      shadowColor: AppColors.primary.withOpacity(0.12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      color: AppColors.cardBg,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.accent,
      foregroundColor: Colors.white,
      elevation: 6,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: Colors.grey.shade200),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: Colors.grey.shade200),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.primary, width: 2),
      ),
    ),
  );
}
