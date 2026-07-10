import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:adausta/main.dart';

void main() {
  testWidgets('AdaustaApp widget oluşturulabilir', (WidgetTester tester) async {
    await tester.pumpWidget(const AdaustaApp());
    expect(find.byType(MaterialApp), findsOneWidget);
    // SplashScreen 3 saniyelik timer tamamlanıyor
    await tester.pump(const Duration(seconds: 4));
  });
}
