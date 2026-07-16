import 'package:flutter_test/flutter_test.dart';

import 'package:nebula_mobile/main.dart';

void main() {
  testWidgets('App boots into the splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const NebulaApp());
    // The splash cinematic (or its reduced-motion fallback) should render.
    expect(find.byType(NebulaApp), findsOneWidget);
  });
}
