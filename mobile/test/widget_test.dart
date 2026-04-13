import 'package:flutter_test/flutter_test.dart';
import 'package:adausta/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const AdaustaApp());
    expect(find.byType(AdaustaApp), findsOneWidget);
  });
}
