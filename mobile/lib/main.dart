import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

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
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1e3a5f),
          primary: const Color(0xFF1e3a5f),
        ),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}
