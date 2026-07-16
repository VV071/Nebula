import 'package:flutter/material.dart';
import 'core/theme.dart';
import 'services/auth_service.dart';
import 'screens/splash_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const NebulaApp());
}

class NebulaApp extends StatelessWidget {
  const NebulaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Nebula Finance',
      debugShowCheckedModeBanner: false,
      theme: nebulaTheme(),
      home: const _Root(),
    );
  }
}

/// Splash → (restore session) → Auth or Shell.
class _Root extends StatefulWidget {
  const _Root();

  @override
  State<_Root> createState() => _RootState();
}

class _RootState extends State<_Root> {
  final _auth = AuthService();
  bool _splashDone = false;
  bool _sessionChecked = false;
  NebulaUser? _user;

  @override
  void initState() {
    super.initState();
    // Restore the session while the splash cinematic plays.
    _auth.restoreSession().then((u) {
      if (mounted) {
        setState(() {
          _user = u;
          _sessionChecked = true;
        });
      }
    });
  }

  void _logout() async {
    await _auth.logout();
    if (mounted) setState(() => _user = null);
  }

  @override
  Widget build(BuildContext context) {
    if (!_splashDone) {
      return SplashScreen(onDone: () => setState(() => _splashDone = true));
    }
    if (!_sessionChecked) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: NebulaColors.indigo)),
      );
    }
    if (_user == null) {
      return AuthScreen(onLoggedIn: (u) => setState(() => _user = u));
    }
    return Shell(user: _user!, onLogout: _logout);
  }
}
