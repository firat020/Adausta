import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/api_service.dart';

class UstaPanelMesajlar extends StatefulWidget {
  final ApiService api;
  const UstaPanelMesajlar({super.key, required this.api});

  @override
  State<UstaPanelMesajlar> createState() => _UstaPanelMesajlarState();
}

class _UstaPanelMesajlarState extends State<UstaPanelMesajlar> {
  List<Map<String, dynamic>> _mesajlar = [];
  bool _loading = true;
  bool _gonderiliyor = false;
  final _metinCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _yukle();
  }

  @override
  void dispose() {
    _metinCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _yukle() async {
    try {
      final list = await widget.api.ustaMesajlar();
      if (mounted) {
        setState(() {
          _mesajlar = list;
          _loading = false;
        });
        WidgetsBinding.instance.addPostFrameCallback((_) => _enAlaKaydir());
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _enAlaKaydir() {
    if (!_scrollCtrl.hasClients) return;
    _scrollCtrl.animateTo(
      _scrollCtrl.position.maxScrollExtent,
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
    );
  }

  Future<void> _gonder() async {
    final metin = _metinCtrl.text.trim();
    if (metin.isEmpty || _gonderiliyor) return;
    setState(() => _gonderiliyor = true);
    try {
      await widget.api.ustaMesajGonder(metin);
      _metinCtrl.clear();
      await _yukle();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Mesaj gönderilemedi, tekrar deneyin')),
        );
      }
    }
    if (mounted) setState(() => _gonderiliyor = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    return Column(
      children: [
        Expanded(
          child: _mesajlar.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.chat_bubble_outline_rounded, size: 52, color: AppColors.textSecondary),
                      SizedBox(height: 12),
                      Text('Henüz mesaj yok', style: TextStyle(color: AppColors.textSecondary)),
                      SizedBox(height: 4),
                      Text(
                        "Bir sorunuz mu var? Aşağıdan Ada Usta yönetimine yazabilirsiniz.",
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.accent,
                  onRefresh: _yukle,
                  child: ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.all(14),
                    itemCount: _mesajlar.length,
                    itemBuilder: (_, i) {
                      final m = _mesajlar[i];
                      final ustaGonderdi = m['gonderen'] == 'usta';
                      return Align(
                        alignment: ustaGonderdi ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: ustaGonderdi ? AppColors.primary : Colors.grey.shade200,
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(16),
                              topRight: const Radius.circular(16),
                              bottomLeft: Radius.circular(ustaGonderdi ? 16 : 4),
                              bottomRight: Radius.circular(ustaGonderdi ? 4 : 16),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                m['icerik'] ?? '',
                                style: TextStyle(
                                  color: ustaGonderdi ? Colors.white : AppColors.textPrimary,
                                  fontSize: 13,
                                  height: 1.4,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${ustaGonderdi ? 'Siz' : 'Ada Usta'} · ${m['olusturma'] ?? ''}',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: ustaGonderdi ? Colors.white70 : AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
        ),
        Container(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 8, offset: const Offset(0, -2))],
          ),
          child: SafeArea(
            top: false,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _metinCtrl,
                    maxLength: 2000,
                    minLines: 1,
                    maxLines: 4,
                    buildCounter: (_, {required currentLength, required isFocused, maxLength}) => null,
                    decoration: InputDecoration(
                      hintText: 'Mesajınızı yazın...',
                      filled: true,
                      fillColor: AppColors.background,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _gonder,
                  child: Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: _gonderiliyor ? AppColors.primary.withValues(alpha: 0.5) : AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: _gonderiliyor
                        ? const Padding(
                            padding: EdgeInsets.all(11),
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
