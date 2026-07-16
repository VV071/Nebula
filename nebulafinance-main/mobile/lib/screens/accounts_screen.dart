import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../core/theme.dart';
import '../services/finance_service.dart';
import '../widgets/glass_card.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class AccountsScreen extends StatefulWidget {
  const AccountsScreen({super.key});

  @override
  State<AccountsScreen> createState() => _AccountsScreenState();
}

class _AccountsScreenState extends State<AccountsScreen> {
  final _finance = FinanceService();
  List<Account> _accounts = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final a = await _finance.getAccounts();
      setState(() => _accounts = a);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  IconData _iconFor(String type) => switch (type.toLowerCase()) {
        'bank' => Icons.account_balance_outlined,
        'cash' => Icons.payments_outlined,
        'credit' || 'credit_card' => Icons.credit_card_outlined,
        'investment' => Icons.trending_up,
        _ => Icons.account_balance_wallet_outlined,
      };

  @override
  Widget build(BuildContext context) {
    final total = _accounts.fold<double>(0, (s, a) => s + a.balance);
    return Scaffold(
      appBar: AppBar(
          title: const Text('Accounts',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700))),
      body: AuroraBackground(
        child: RefreshIndicator(
          color: NebulaColors.indigo,
          onRefresh: _load,
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: NebulaColors.indigo))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (_error != null)
                      GlassCard(
                        borderColor: NebulaColors.rose.withValues(alpha: 0.3),
                        child: Text(_error!, style: const TextStyle(color: NebulaColors.rose)),
                      )
                    else ...[
                      GlassCard(
                        gradient: LinearGradient(colors: [
                          NebulaColors.indigo.withValues(alpha: 0.16),
                          NebulaColors.violet.withValues(alpha: 0.08),
                        ]),
                        borderColor: NebulaColors.indigo.withValues(alpha: 0.3),
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('NET WORTH',
                                style: TextStyle(
                                    fontSize: 10,
                                    letterSpacing: 2,
                                    fontWeight: FontWeight.w700,
                                    color: NebulaColors.textSecondary)),
                            const SizedBox(height: 4),
                            Text(_inr.format(total),
                                style: GoogleFonts.spaceGrotesk(
                                    fontSize: 30, fontWeight: FontWeight.w900)),
                            Text('${_accounts.length} account${_accounts.length == 1 ? '' : 's'}',
                                style: const TextStyle(
                                    fontSize: 12, color: NebulaColors.textSecondary)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      ..._accounts.map((a) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: GlassCard(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 14),
                              child: Row(children: [
                                Container(
                                  width: 42, height: 42,
                                  decoration: BoxDecoration(
                                    color: NebulaColors.indigo.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(_iconFor(a.type),
                                      size: 20, color: NebulaColors.indigoLight),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(a.name,
                                          style: const TextStyle(
                                              fontSize: 14.5, fontWeight: FontWeight.w700)),
                                      Text(a.type.toUpperCase(),
                                          style: const TextStyle(
                                              fontSize: 9.5,
                                              letterSpacing: 1.5,
                                              color: NebulaColors.textTertiary)),
                                    ],
                                  ),
                                ),
                                Text(_inr.format(a.balance),
                                    style: GoogleFonts.spaceGrotesk(
                                        fontSize: 17, fontWeight: FontWeight.w800)),
                              ]),
                            ),
                          )),
                      if (_accounts.isEmpty)
                        const GlassCard(
                          padding: EdgeInsets.all(24),
                          child: Center(
                            child: Text('No accounts yet — create them from the web app.',
                                style: TextStyle(
                                    fontSize: 13, color: NebulaColors.textSecondary)),
                          ),
                        ),
                    ],
                  ],
                ),
        ),
      ),
    );
  }
}
