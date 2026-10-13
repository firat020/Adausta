import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import '../widgets/telefon_dogrulama.dart';

/// Kayıt sonrası (veya panelden) telefon doğrulama ekranı. Doğrulanınca ya da atlanınca kapanır.
class TelefonDogrulamaScreen extends StatelessWidget {
  final String telefon;
  final String amac;
  final bool atlanabilir;

  const TelefonDogrulamaScreen({
    super.key,
    required this.telefon,
    this.amac = 'kayit',
    this.atlanabilir = true,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Telefon Doğrulama'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        automaticallyImplyLeading: atlanabilir,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: TelefonDogrulama(
            telefon: telefon,
            amac: amac,
            onDogrulandi: () => Future.delayed(
              const Duration(milliseconds: 900),
              () {
                if (context.mounted) Navigator.of(context).pop(true);
              },
            ),
            onAtla: atlanabilir ? () => Navigator.of(context).pop(false) : null,
            onNumaraDuzenle: () => Navigator.of(context).pop(false),
          ),
        ),
      ),
    );
  }
}
