import 'package:flutter/material.dart';
import '../services/api_service.dart';

class UstaKayitScreen extends StatefulWidget {
  const UstaKayitScreen({super.key});

  @override
  State<UstaKayitScreen> createState() => _UstaKayitScreenState();
}

class _UstaKayitScreenState extends State<UstaKayitScreen> {
  final _formKey = GlobalKey<FormState>();
  final _api = ApiService();
  bool _yukleniyor = false;
  bool _kategorilerYukleniyor = true;

  final _adCtrl = TextEditingController();
  final _soyadCtrl = TextEditingController();
  final _telefonCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _aciklamaCtrl = TextEditingController();
  final _sehirCtrl = TextEditingController();
  final _ilceCtrl = TextEditingController();
  String? _kategori;
  List<String> _kategoriler = [];

  @override
  void initState() {
    super.initState();
    _kategorileriYukle();
  }

  Future<void> _kategorileriYukle() async {
    try {
      final list = await _api.getKategoriler();
      setState(() {
        _kategoriler = list.map((k) => k.ad).toList();
        _kategorilerYukleniyor = false;
      });
    } catch (_) {
      setState(() => _kategorilerYukleniyor = false);
    }
  }

  Future<void> _kaydet() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _yukleniyor = true);
    try {
      final ok = await _api.kayitOl({
        'ad': _adCtrl.text,
        'soyad': _soyadCtrl.text,
        'telefon': _telefonCtrl.text,
        'email': _emailCtrl.text,
        'aciklama': _aciklamaCtrl.text,
        'sehir': _sehirCtrl.text,
        'ilce': _ilceCtrl.text,
        'kategori': _kategori ?? '',
      });
      if (ok && mounted) {
        showDialog(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Başarılı!'),
            content: const Text('Kayıt işleminiz alındı. En kısa sürede onaylanacaksınız.'),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.pop(context);
                },
                child: const Text('Tamam'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: $e'), backgroundColor: Colors.red),
        );
      }
    }
    setState(() => _yukleniyor = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        title: const Text('Usta Ol'),
        backgroundColor: const Color(0xFF1e3a5f),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              _kart([
                const Text('Kişisel Bilgiler',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                _alan(_adCtrl, 'Ad', zorunlu: true),
                _alan(_soyadCtrl, 'Soyad', zorunlu: true),
                _alan(_telefonCtrl, 'Telefon', zorunlu: true,
                    keyboard: TextInputType.phone),
                _alan(_emailCtrl, 'E-posta',
                    keyboard: TextInputType.emailAddress),
              ]),
              const SizedBox(height: 12),
              _kart([
                const Text('Meslek & Konum',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                _kategorilerYukleniyor
                    ? const SizedBox(
                        height: 56,
                        child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                      )
                    : DropdownButtonFormField<String>(
                        value: _kategori,
                        decoration: _inputDeco('Kategori *'),
                        isExpanded: true,
                        menuMaxHeight: 350,
                        items: _kategoriler
                            .map((k) => DropdownMenuItem(value: k, child: Text(k, overflow: TextOverflow.ellipsis)))
                            .toList(),
                        onChanged: (v) => setState(() => _kategori = v),
                        validator: (v) => v == null ? 'Kategori seçin' : null,
                      ),
                const SizedBox(height: 12),
                _alan(_sehirCtrl, 'Şehir'),
                _alan(_ilceCtrl, 'İlçe'),
              ]),
              const SizedBox(height: 12),
              _kart([
                const Text('Hakkında',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _aciklamaCtrl,
                  decoration: _inputDeco('Kendinizi tanıtın...'),
                  maxLines: 4,
                ),
              ]),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _yukleniyor ? null : _kaydet,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1e3a5f),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                  child: _yukleniyor
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Kayıt Ol', style: TextStyle(fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _kart(List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8)
        ],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
    );
  }

  Widget _alan(TextEditingController ctrl, String label,
      {bool zorunlu = false, TextInputType? keyboard}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: ctrl,
        keyboardType: keyboard,
        decoration: _inputDeco(zorunlu ? '$label *' : label),
        validator: zorunlu ? (v) => (v == null || v.isEmpty) ? '$label zorunlu' : null : null,
      ),
    );
  }

  InputDecoration _inputDeco(String label) {
    return InputDecoration(
      labelText: label,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFF1e3a5f), width: 2),
      ),
    );
  }
}
