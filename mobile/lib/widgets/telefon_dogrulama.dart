import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../config/app_theme.dart';
import '../services/api_service.dart';

/// Twilio Verify ile telefon sahipliği doğrulaması (SMS / WhatsApp).
/// Numara, hesabın profilindeki kayıtlı numaradır (salt okunur). Doğrulama durumu her zaman backend'den alınır.
class TelefonDogrulama extends StatefulWidget {
  final String telefon;
  final String amac; // 'kayit' | 'profil'
  final VoidCallback? onDogrulandi;
  final VoidCallback? onAtla; // verilirse "Şimdilik atla" gösterilir
  final VoidCallback? onNumaraDuzenle;

  const TelefonDogrulama({
    super.key,
    required this.telefon,
    this.amac = 'profil',
    this.onDogrulandi,
    this.onAtla,
    this.onNumaraDuzenle,
  });

  @override
  State<TelefonDogrulama> createState() => _TelefonDogrulamaState();
}

enum _Faz { yukleniyor, dogrulandi, gonder, kod, kullanilamiyor }

class _TelefonDogrulamaState extends State<TelefonDogrulama> {
  final _api = ApiService();
  final _kodCtrl = TextEditingController();

  _Faz _faz = _Faz.yukleniyor;
  List<Map<String, dynamic>> _ulkeler = const [];
  String _ulke = 'KKTC';
  String _kanal = 'sms';
  String _maske = '';
  int _bekleme = 0;
  bool _isleniyor = false;
  String? _hata;
  String? _bilgi;
  String? _digerKanal;
  Timer? _zamanlayici;

  static const _kanalEtiket = {'sms': 'SMS', 'whatsapp': 'WhatsApp'};

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  @override
  void didUpdateWidget(covariant TelefonDogrulama eski) {
    super.didUpdateWidget(eski);
    // Profildeki numara değiştiyse durumu yeniden al (eski doğrulama geçersiz olabilir)
    if (eski.telefon != widget.telefon) _yukle();
  }

  @override
  void dispose() {
    _zamanlayici?.cancel();
    _kodCtrl.dispose();
    super.dispose();
  }

  Future<void> _yukle() async {
    setState(() => _faz = _Faz.yukleniyor);
    try {
      final ayar = await _api.telefonDogrulamaAyarlar();
      final durum = await _api.telefonDogrulamaDurum();
      if (!mounted) return;
      _ulkeler = (ayar['ulkeler'] as List? ?? const [])
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      if (ayar['yapilandirildi'] != true) {
        setState(() => _faz = _Faz.kullanilamiyor);
        return;
      }
      if (durum['dogrulandi'] == true) {
        setState(() => _faz = _Faz.dogrulandi);
        return;
      }
      final bekleyen = durum['bekleyen'];
      if (bekleyen is Map) {
        _kanal = bekleyen['kanal']?.toString() ?? 'sms';
        _maske = bekleyen['telefon_maske']?.toString() ?? '';
        _beklemeBaslat((bekleyen['bekleme_sn'] as num?)?.toInt() ?? 0);
        setState(() => _faz = _Faz.kod);
        return;
      }
      setState(() => _faz = _Faz.gonder);
    } catch (_) {
      if (mounted) setState(() => _faz = _Faz.kullanilamiyor);
    }
  }

  void _beklemeBaslat(int sn) {
    _zamanlayici?.cancel();
    setState(() => _bekleme = sn);
    if (sn <= 0) return;
    _zamanlayici = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return t.cancel();
      setState(() => _bekleme = _bekleme > 0 ? _bekleme - 1 : 0);
      if (_bekleme <= 0) t.cancel();
    });
  }

  Future<void> _gonder(String kanal) async {
    setState(() {
      _hata = null;
      _bilgi = null;
      _digerKanal = null;
      _isleniyor = true;
    });
    try {
      final d = await _api.telefonDogrulamaGonder(
        telefon: widget.telefon,
        ulke: _ulke,
        kanal: kanal,
        amac: widget.amac,
      );
      if (!mounted) return;
      if (d['zaten_dogrulandi'] == true) {
        setState(() => _faz = _Faz.dogrulandi);
        widget.onDogrulandi?.call();
        return;
      }
      _kodCtrl.clear();
      _beklemeBaslat((d['bekleme_sn'] as num?)?.toInt() ?? 60);
      setState(() {
        _kanal = kanal;
        _maske = d['telefon_maske']?.toString() ?? '';
        _faz = _Faz.kod;
        _bilgi = '${_kanalEtiket[kanal]} ile 6 haneli kod gönderildi.';
      });
    } on TelefonDogrulamaHatasi catch (e) {
      if (!mounted) return;
      if (e.beklemeSn != null) _beklemeBaslat(e.beklemeSn!);
      setState(() {
        _hata = e.mesaj;
        _digerKanal = e.digerKanal;
      });
    } catch (_) {
      if (mounted) setState(() => _hata = 'Kod gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      if (mounted) setState(() => _isleniyor = false);
    }
  }

  Future<void> _dogrula() async {
    final kod = _kodCtrl.text.trim();
    if (kod.length != 6) return;
    setState(() {
      _hata = null;
      _bilgi = null;
      _isleniyor = true;
    });
    try {
      await _api.telefonDogrulamaDogrula(kod);
      if (!mounted) return;
      setState(() => _faz = _Faz.dogrulandi);
      widget.onDogrulandi?.call();
    } on TelefonDogrulamaHatasi catch (e) {
      if (!mounted) return;
      setState(() {
        _hata = e.mesaj;
        if (const ['suresi_doldu', 'deneme_asildi', 'istek_yok', 'numara_degisti'].contains(e.kod)) {
          _faz = _Faz.gonder;
          _kodCtrl.clear();
        }
      });
    } catch (_) {
      if (mounted) setState(() => _hata = 'Kod doğrulanamadı. Lütfen tekrar deneyin.');
    } finally {
      if (mounted) setState(() => _isleniyor = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    switch (_faz) {
      case _Faz.yukleniyor:
        return const Padding(
          padding: EdgeInsets.all(16),
          child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
        );
      case _Faz.dogrulandi:
        return _kutu(
          renk: const Color(0xFFE8F8EE),
          kenar: const Color(0xFFA7E3BD),
          child: const Row(children: [
            Icon(Icons.check_circle, color: Color(0xFF1E9E4F)),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Telefon numaranız doğrulandı. Numaranızı değiştirirseniz yeniden doğrulamanız gerekir.',
                style: TextStyle(color: Color(0xFF14753A), fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ),
          ]),
        );
      case _Faz.kullanilamiyor:
        return _kutu(
          renk: const Color(0xFFFFF6E5),
          kenar: const Color(0xFFF3D493),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text(
              'Telefon doğrulama şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
              style: TextStyle(color: Color(0xFF8A5A00), fontSize: 13),
            ),
            if (widget.onAtla != null)
              TextButton(onPressed: widget.onAtla, child: const Text('Şimdilik devam et')),
          ]),
        );
      case _Faz.gonder:
      case _Faz.kod:
        return _kutu(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Row(children: [
              Icon(Icons.verified_user_outlined, color: AppColors.primary),
              SizedBox(width: 10),
              Expanded(
                child: Text('Telefon numaranı doğrula',
                    style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              ),
            ]),
            const SizedBox(height: 6),
            const Text(
              'Numaranın sana ait olduğunu doğrulamak için 6 haneli bir kod göndereceğiz.',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 14),
            if (_faz == _Faz.gonder) ..._gonderAlani() else ..._kodAlani(),
            if (_bilgi != null)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Text(_bilgi!, style: const TextStyle(color: Color(0xFF14753A), fontSize: 12)),
              ),
            if (_hata != null) _hataKutusu(),
            if (widget.onAtla != null)
              TextButton(onPressed: widget.onAtla, child: const Text('Şimdilik atla')),
          ]),
        );
    }
  }

  List<Widget> _gonderAlani() => [
        DropdownButtonFormField<String>(
          value: _ulke,
          isExpanded: true,
          decoration: const InputDecoration(labelText: 'Ülke', border: OutlineInputBorder()),
          items: [
            for (final u in _ulkeler)
              DropdownMenuItem(value: u['kod'].toString(), child: Text('${u['ad']} (+${u['dial']})')),
          ],
          onChanged: (v) => setState(() => _ulke = v ?? 'KKTC'),
        ),
        const SizedBox(height: 10),
        TextFormField(
          initialValue: widget.telefon,
          readOnly: true,
          decoration: const InputDecoration(
            labelText: 'Telefon',
            prefixIcon: Icon(Icons.phone_outlined),
            border: OutlineInputBorder(),
          ),
        ),
        if (widget.onNumaraDuzenle != null)
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(onPressed: widget.onNumaraDuzenle, child: const Text('Numarayı düzenle')),
          ),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(child: _kanalButonu('sms')),
          const SizedBox(width: 8),
          Expanded(child: _kanalButonu('whatsapp')),
        ]),
      ];

  Widget _kanalButonu(String kanal) {
    final sms = kanal == 'sms';
    return ElevatedButton.icon(
      onPressed: _isleniyor ? null : () => _gonder(kanal),
      icon: Icon(sms ? Icons.sms_outlined : Icons.chat_outlined, size: 18),
      label: Text(_isleniyor ? 'Gönderiliyor...' : '${_kanalEtiket[kanal]} ile kod gönder',
          textAlign: TextAlign.center, style: const TextStyle(fontSize: 12)),
      style: ElevatedButton.styleFrom(
        backgroundColor: sms ? AppColors.primary : Colors.white,
        foregroundColor: sms ? Colors.white : const Color(0xFF1E9E4F),
        side: sms ? null : const BorderSide(color: Color(0xFF1E9E4F), width: 1.5),
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  List<Widget> _kodAlani() {
    final diger = _kanal == 'sms' ? 'whatsapp' : 'sms';
    return [
      Text('$_maske numarasına ${_kanalEtiket[_kanal]} ile gönderilen kodu girin.',
          style: const TextStyle(fontSize: 13, color: AppColors.textPrimary)),
      const SizedBox(height: 10),
      TextField(
        controller: _kodCtrl,
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        autofillHints: const [AutofillHints.oneTimeCode], // SMS otomatik doldurma
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly, // yapıştırılan "123 456" → "123456"
          LengthLimitingTextInputFormatter(6),
        ],
        style: const TextStyle(fontSize: 24, letterSpacing: 8, fontWeight: FontWeight.bold),
        decoration: const InputDecoration(hintText: '------', border: OutlineInputBorder()),
        onChanged: (_) => setState(() {}),
        onSubmitted: (_) => _dogrula(),
      ),
      const SizedBox(height: 10),
      SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: (_isleniyor || _kodCtrl.text.length != 6) ? null : _dogrula,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF1E9E4F),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: Text(_isleniyor ? 'Doğrulanıyor...' : 'Kodu Onayla'),
        ),
      ),
      Wrap(spacing: 8, children: [
        TextButton(
          onPressed: (_isleniyor || _bekleme > 0) ? null : () => _gonder(_kanal),
          child: Text(_bekleme > 0 ? 'Tekrar gönder ($_bekleme sn)' : 'Kodu tekrar gönder'),
        ),
        TextButton(
          onPressed: (_isleniyor || _bekleme > 0) ? null : () => _gonder(diger),
          child: Text('${_kanalEtiket[diger]} ile gönder'),
        ),
        TextButton(
          onPressed: () => setState(() {
            _faz = _Faz.gonder;
            _kodCtrl.clear();
            _hata = null;
            _bilgi = null;
          }),
          child: const Text('Yöntemi / numarayı değiştir'),
        ),
      ]),
    ];
  }

  Widget _hataKutusu() => Container(
        width: double.infinity,
        margin: const EdgeInsets.only(top: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFFDECEA),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFF5C6C0)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(_hata!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
          // Gönderim başarısızsa diğer kanalı kullanıcı kendisi seçer (otomatik ikinci gönderim yok)
          if (_digerKanal != null && !_isleniyor)
            TextButton(
              onPressed: _bekleme > 0 ? null : () => _gonder(_digerKanal!),
              child: Text('${_kanalEtiket[_digerKanal]} ile göndermeyi dene'),
            ),
        ]),
      );

  Widget _kutu({required Widget child, Color renk = Colors.white, Color kenar = const Color(0xFFD6E4F0)}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: renk,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kenar),
      ),
      child: child,
    );
  }
}
