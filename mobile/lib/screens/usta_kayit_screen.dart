import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import '../services/api_service.dart';
import '../models/kategori.dart';
import '../models/sehir.dart';

class UstaKayitScreen extends StatefulWidget {
  const UstaKayitScreen({super.key});

  @override
  State<UstaKayitScreen> createState() => _UstaKayitScreenState();
}

class _UstaKayitScreenState extends State<UstaKayitScreen> {
  final _formKey = GlobalKey<FormState>();
  final _api = ApiService();
  int _adim = 0;
  bool _yukleniyor = false;
  bool _kategorilerYukleniyor = true;
  bool _sehirlerYukleniyor = true;

  final _adCtrl = TextEditingController();
  final _soyadCtrl = TextEditingController();
  final _telefonCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _aciklamaCtrl = TextEditingController();

  Kategori? _secilenKategori;
  List<Kategori> _kategoriler = [];

  List<Sehir> _sehirler = [];
  Sehir? _secilenSehir;
  Ilce? _secilenIlce;

  @override
  void initState() {
    super.initState();
    _kategorileriYukle();
  }

  @override
  void dispose() {
    _adCtrl.dispose();
    _soyadCtrl.dispose();
    _telefonCtrl.dispose();
    _emailCtrl.dispose();
    _aciklamaCtrl.dispose();
    super.dispose();
  }

  Future<void> _kategorileriYukle() async {
    try {
      final results = await Future.wait([
        _api.getKategoriler(),
        _api.getSehirler(),
      ]);
      if (mounted) {
        setState(() {
          _kategoriler = results[0] as List<Kategori>;
          _sehirler = results[1] as List<Sehir>;
          _kategorilerYukleniyor = false;
          _sehirlerYukleniyor = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _kategorilerYukleniyor = false;
          _sehirlerYukleniyor = false;
        });
      }
    }
  }

  Future<void> _kaydet() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _yukleniyor = true);
    try {
      final ok = await _api.kayitOl({
        'ad': _adCtrl.text.trim(),
        'soyad': _soyadCtrl.text.trim(),
        'telefon': _telefonCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'aciklama': _aciklamaCtrl.text.trim(),
        'sehir': _secilenSehir?.ad ?? '',
        'sehir_id': _secilenSehir?.id,
        'ilce': _secilenIlce?.ad ?? '',
        'ilce_id': _secilenIlce?.id,
        'kategori': _secilenKategori?.ad ?? '',
        'kategori_id': _secilenKategori?.id,
      });
      if (ok && mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => AlertDialog(
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20)),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 70,
                  height: 70,
                  decoration: const BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_rounded,
                      color: Colors.white, size: 40),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Başvuru Alındı!',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Kaydınız alındı. En kısa sürede onaylanacaksınız.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                ),
              ],
            ),
            actions: [
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Tamam',
                      style: TextStyle(
                          color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Kayıt yapılamadı. Tekrar deneyin.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Hata: ${e.toString().split('\n').first}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
    if (mounted) setState(() => _yukleniyor = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          _buildHeader(),
          _buildStepper(),
          Expanded(
            child: Form(
              key: _formKey,
              child: _adim == 0
                  ? _buildAdim0()
                  : _adim == 1
                      ? _buildAdim1()
                      : _buildAdim2(),
            ),
          ),
          _buildButonlar(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      decoration: const BoxDecoration(gradient: AppColors.heroGradient),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 8, 16, 20),
          child: Row(
            children: [
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back_ios_rounded,
                    color: Colors.white),
              ),
              const Expanded(
                child: Text(
                  'Usta Ol',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.accent.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: AppColors.accent.withOpacity(0.4)),
                ),
                child: Text(
                  '${_adim + 1}/3',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepper() {
    const labels = ['Kişisel', 'Meslek', 'Hakkında'];
    return Container(
      color: AppColors.primary,
      child: Container(
        decoration: const BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
        ),
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
        child: Row(
          children: List.generate(3, (i) {
            final done = i < _adim;
            final active = i == _adim;
            return Expanded(
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: done ? () => setState(() => _adim = i) : null,
                      child: Column(
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: active || done
                                  ? AppColors.primaryGradient
                                  : null,
                              color: active || done
                                  ? null
                                  : Colors.grey.shade200,
                              boxShadow: active
                                  ? [
                                      BoxShadow(
                                        color: AppColors.primary
                                            .withOpacity(0.3),
                                        blurRadius: 8,
                                      )
                                    ]
                                  : null,
                            ),
                            child: Center(
                              child: done
                                  ? const Icon(Icons.check_rounded,
                                      color: Colors.white, size: 18)
                                  : Text(
                                      '${i + 1}',
                                      style: TextStyle(
                                        color: active
                                            ? Colors.white
                                            : Colors.grey.shade500,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            labels[i],
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: active
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                              color: active
                                  ? AppColors.primary
                                  : Colors.grey.shade500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (i < 2)
                    Expanded(
                      child: Container(
                        height: 2,
                        margin: const EdgeInsets.only(bottom: 20),
                        decoration: BoxDecoration(
                          color: i < _adim
                              ? AppColors.primary
                              : Colors.grey.shade200,
                          borderRadius: BorderRadius.circular(1),
                        ),
                      ),
                    ),
                ],
              ),
            );
          }),
        ),
      ),
    );
  }

  Widget _buildAdim0() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _kart(
            'Kişisel Bilgiler',
            Icons.person_rounded,
            [
              _alan(_adCtrl, 'Ad', Icons.person_outline, zorunlu: true),
              _alan(_soyadCtrl, 'Soyad', Icons.person_outline, zorunlu: true),
              _alan(_telefonCtrl, 'Telefon', Icons.phone_outlined,
                  zorunlu: true,
                  keyboard: TextInputType.phone),
              _alan(_emailCtrl, 'E-posta (isteğe bağlı)', Icons.email_outlined,
                  keyboard: TextInputType.emailAddress),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAdim1() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _kart(
            'Meslek & Konum',
            Icons.work_rounded,
            [
              _kategorilerYukleniyor
                  ? Container(
                      height: 56,
                      alignment: Alignment.center,
                      child: const CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.primary),
                    )
                  : DropdownButtonFormField<Kategori>(
                      value: _secilenKategori,
                      decoration: _inputDeco(
                          'Kategori *', Icons.category_outlined),
                      isExpanded: true,
                      menuMaxHeight: 350,
                      items: _kategoriler
                          .map((k) => DropdownMenuItem(
                                value: k,
                                child: Text(k.ad,
                                    overflow: TextOverflow.ellipsis),
                              ))
                          .toList(),
                      onChanged: (v) =>
                          setState(() => _secilenKategori = v),
                      validator: (v) =>
                          v == null ? 'Kategori seçin' : null,
                    ),
              const SizedBox(height: 12),
              _sehirlerYukleniyor
                  ? Container(
                      height: 56,
                      alignment: Alignment.center,
                      child: const CircularProgressIndicator(
                          strokeWidth: 2, color: AppColors.primary),
                    )
                  : DropdownButtonFormField<Sehir>(
                      value: _secilenSehir,
                      decoration: _inputDeco('Şehir *', Icons.location_city_outlined),
                      isExpanded: true,
                      menuMaxHeight: 300,
                      items: _sehirler
                          .map((s) => DropdownMenuItem(
                                value: s,
                                child: Text(s.ad),
                              ))
                          .toList(),
                      onChanged: (v) => setState(() {
                        _secilenSehir = v;
                        _secilenIlce = null;
                      }),
                      validator: (v) => v == null ? 'Şehir seçin' : null,
                    ),
              const SizedBox(height: 12),
              if (_secilenSehir != null && _secilenSehir!.ilceler.isNotEmpty)
                DropdownButtonFormField<Ilce>(
                  value: _secilenIlce,
                  decoration: _inputDeco('İlçe', Icons.map_outlined),
                  isExpanded: true,
                  menuMaxHeight: 300,
                  items: _secilenSehir!.ilceler
                      .map((i) => DropdownMenuItem(
                            value: i,
                            child: Text(i.ad),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _secilenIlce = v),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAdim2() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _kart(
            'Kendinizi Tanıtın',
            Icons.info_outline_rounded,
            [
              TextFormField(
                controller: _aciklamaCtrl,
                decoration: _inputDeco(
                    'Deneyimlerinizi, uzmanlık alanlarınızı anlatın...',
                    Icons.notes_rounded),
                maxLines: 6,
                textInputAction: TextInputAction.newline,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.accent.withOpacity(0.08),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                  color: AppColors.accent.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_rounded,
                    color: AppColors.accent, size: 22),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Başvurunuz incelendikten sonra onaylanacak ve platformda görünür hale geleceksiniz.',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                      height: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildButonlar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.08),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            if (_adim > 0)
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => _adim--),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Geri'),
                ),
              ),
            if (_adim > 0) const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: GestureDetector(
                onTap: _yukleniyor
                    ? null
                    : () {
                        if (_adim < 2) {
                          setState(() => _adim++);
                        } else {
                          _kaydet();
                        }
                      },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    gradient: _yukleniyor
                        ? const LinearGradient(
                            colors: [Colors.grey, Colors.grey])
                        : AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      if (!_yukleniyor)
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                    ],
                  ),
                  child: Center(
                    child: _yukleniyor
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2.5,
                            ),
                          )
                        : Text(
                            _adim < 2 ? 'Devam Et' : 'Kayıt Ol',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _kart(String baslik, IconData ikon, List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(ikon, color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 10),
              Text(
                baslik,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _alan(
    TextEditingController ctrl,
    String label,
    IconData ikon, {
    bool zorunlu = false,
    TextInputType? keyboard,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: ctrl,
        keyboardType: keyboard,
        decoration: _inputDeco(label, ikon),
        validator: zorunlu
            ? (v) => (v == null || v.trim().isEmpty) ? '$label zorunlu' : null
            : null,
      ),
    );
  }

  InputDecoration _inputDeco(String label, IconData ikon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(ikon, color: AppColors.primary.withOpacity(0.6)),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primary, width: 2),
      ),
    );
  }
}
