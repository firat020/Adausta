import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../models/usta.dart';
import '../services/api_service.dart';
import '../widgets/usta_kart.dart';
import 'usta_detay_screen.dart';

class EnYakinScreen extends StatefulWidget {
  const EnYakinScreen({super.key});

  @override
  State<EnYakinScreen> createState() => _EnYakinScreenState();
}

class _EnYakinScreenState extends State<EnYakinScreen> {
  final _api = ApiService();
  List<Usta> _ustalar = [];
  bool _loading = false;
  String? _hata;
  double _km = 10;

  Future<void> _konumAl() async {
    setState(() {
      _loading = true;
      _hata = null;
    });
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _hata = 'Konum servisi kapalı. Lütfen konumu açın.';
          _loading = false;
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _hata = 'Konum izni verilmedi.';
            _loading = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _hata = 'Konum izni kalıcı olarak reddedildi. Ayarlardan izin verin.';
          _loading = false;
        });
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high);
      final list = await _api.getEnYakin(pos.latitude, pos.longitude, km: _km);
      setState(() {
        _ustalar = list;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _hata = 'Hata: $e';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        title: const Text('Yakınımdaki Ustalar'),
        backgroundColor: const Color(0xFF1e3a5f),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    const Text('Yarıçap: ', style: TextStyle(fontWeight: FontWeight.w600)),
                    Expanded(
                      child: Slider(
                        value: _km,
                        min: 1,
                        max: 50,
                        divisions: 49,
                        label: '${_km.round()} km',
                        activeColor: const Color(0xFF1e3a5f),
                        onChanged: (v) => setState(() => _km = v),
                      ),
                    ),
                    Text('${_km.round()} km'),
                  ],
                ),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _loading ? null : _konumAl,
                    icon: const Icon(Icons.near_me),
                    label: const Text('Konumumu Kullan'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1e3a5f),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_loading) const CircularProgressIndicator(),
          if (_hata != null)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red[200]!),
                ),
                child: Text(_hata!, style: const TextStyle(color: Colors.red)),
              ),
            ),
          if (_ustalar.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  '${_ustalar.length} usta bulundu',
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: _ustalar.length,
                itemBuilder: (_, i) => UstaKart(
                  usta: _ustalar[i],
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) =>
                            UstaDetayScreen(ustaId: _ustalar[i].id)),
                  ),
                ),
              ),
            ),
          ],
          if (!_loading && _hata == null && _ustalar.isEmpty)
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.location_searching,
                        size: 64, color: Colors.grey),
                    const SizedBox(height: 12),
                    Text(
                      'Yakınınızdaki ustaları bulmak için\n"Konumumu Kullan" butonuna tıklayın',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
