import 'package:flutter/material.dart';
import 'config/app_theme.dart';
import 'screens/splash_screen.dart';

void main() {
  runApp(const AdaustaApp());
}

class AdaustaApp extends StatelessWidget {
  const AdaustaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Adausta',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.theme,
      home: const SplashScreen(),
    );
  }
}
