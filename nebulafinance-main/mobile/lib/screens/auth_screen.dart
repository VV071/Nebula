import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme.dart';
import '../services/auth_service.dart';
import '../widgets/glass_card.dart';

class AuthScreen extends StatefulWidget {
  final void Function(NebulaUser user) onLoggedIn;
  const AuthScreen({super.key, required this.onLoggedIn});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _auth = AuthService();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _isRegister = false;
  bool _loading = false;
  bool _obscure = true;
  String? _error;

  Future<void> _submit() async {
    final email = _email.text.trim();
    final password = _password.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Enter your email and password.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final user = _isRegister
          ? await _auth.register(_name.text.trim(), email, password)
          : await _auth.login(email, password);
      if (mounted) widget.onLoggedIn(user);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AuroraBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 64, height: 64,
                    decoration: BoxDecoration(
                      gradient: NebulaColors.primaryGradient,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(color: NebulaColors.indigo.withValues(alpha: 0.45), blurRadius: 40),
                      ],
                    ),
                    child: const Icon(Icons.auto_awesome, color: Colors.white, size: 30),
                  ),
                  const SizedBox(height: 16),
                  Text('Nebula Finance',
                      style: GoogleFonts.spaceGrotesk(
                          fontSize: 26, fontWeight: FontWeight.w800)),
                  Text('SMART MONEY · REAL INSIGHTS',
                      style: GoogleFonts.spaceGrotesk(
                          fontSize: 10, letterSpacing: 3, color: NebulaColors.textSecondary)),
                  const SizedBox(height: 28),
                  GlassCard(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(_isRegister ? 'Create account' : 'Welcome back',
                            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 16),
                        if (_isRegister) ...[
                          TextField(
                            controller: _name,
                            textInputAction: TextInputAction.next,
                            decoration: const InputDecoration(labelText: 'Name'),
                          ),
                          const SizedBox(height: 12),
                        ],
                        TextField(
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          autofillHints: const [AutofillHints.email],
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(labelText: 'Email'),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _password,
                          obscureText: _obscure,
                          autofillHints: const [AutofillHints.password],
                          onSubmitted: (_) => _submit(),
                          decoration: InputDecoration(
                            labelText: 'Password',
                            suffixIcon: IconButton(
                              icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility,
                                  size: 20, color: NebulaColors.textSecondary),
                              onPressed: () => setState(() => _obscure = !_obscure),
                            ),
                          ),
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(_error!,
                              style: const TextStyle(color: NebulaColors.rose, fontSize: 13)),
                        ],
                        const SizedBox(height: 18),
                        NebulaButton(
                          label: _isRegister ? 'Create Account' : 'Sign In',
                          icon: Icons.arrow_forward_rounded,
                          loading: _loading,
                          onPressed: _submit,
                        ),
                        const SizedBox(height: 12),
                        TextButton(
                          onPressed: () => setState(() {
                            _isRegister = !_isRegister;
                            _error = null;
                          }),
                          child: Text(
                            _isRegister
                                ? 'Already have an account? Sign in'
                                : 'New to Nebula? Create account',
                            style: const TextStyle(color: NebulaColors.indigoLight, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
