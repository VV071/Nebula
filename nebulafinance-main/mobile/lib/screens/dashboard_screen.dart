import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../core/theme.dart';
import '../services/auth_service.dart';
import '../services/finance_service.dart';
import '../widgets/glass_card.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class DashboardScreen extends StatefulWidget {
  final NebulaUser user;
  const DashboardScreen({super.key, required this.user});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _finance = FinanceService();
  List<Account> _accounts = [];
  MonthlySummary? _summary;
  List<Txn> _recent = [];
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
      final results = await Future.wait([
        _finance.getAccounts(),
        _finance.getCurrentSummary(),
        _finance.getTransactions(),
      ]);
      setState(() {
        _accounts = results[0] as List<Account>;
        _summary = results[1] as MonthlySummary;
        _recent = (results[2] as List<Txn>).take(5).toList();
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  double get _totalBalance => _accounts.fold(0, (s, a) => s + a.balance);

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        color: NebulaColors.indigo,
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
          children: [
            Row(
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    gradient: NebulaColors.primaryGradient,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.auto_awesome, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Hey, ${widget.user.name ?? widget.user.email.split('@').first} 👋',
                          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                      const Text('Your money at a glance',
                          style: TextStyle(fontSize: 12, color: NebulaColors.textSecondary)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            if (_error != null)
              GlassCard(
                borderColor: NebulaColors.rose.withValues(alpha: 0.3),
                child: Text(_error!, style: const TextStyle(color: NebulaColors.rose)),
              )
            else if (_loading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 60),
                child: Center(child: CircularProgressIndicator(color: NebulaColors.indigo)),
              )
            else ...[
              // Net worth hero card
              GlassCard(
                gradient: LinearGradient(
                  colors: [
                    NebulaColors.indigo.withValues(alpha: 0.16),
                    NebulaColors.violet.withValues(alpha: 0.08),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderColor: NebulaColors.indigo.withValues(alpha: 0.3),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('TOTAL BALANCE',
                        style: TextStyle(
                            fontSize: 10,
                            letterSpacing: 2,
                            fontWeight: FontWeight.w700,
                            color: NebulaColors.textSecondary)),
                    const SizedBox(height: 6),
                    Text(_inr.format(_totalBalance),
                        style: GoogleFonts.spaceGrotesk(
                            fontSize: 34, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        _pill(Icons.south_west_rounded, 'Income',
                            _inr.format(_summary?.income ?? 0), NebulaColors.emeraldLight),
                        const SizedBox(width: 10),
                        _pill(Icons.north_east_rounded, 'Spent',
                            _inr.format(_summary?.expense ?? 0), NebulaColors.rose),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Accounts strip
              if (_accounts.isNotEmpty) ...[
                const Text('Accounts',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                SizedBox(
                  height: 92,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _accounts.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 10),
                    itemBuilder: (_, i) {
                      final a = _accounts[i];
                      return GlassCard(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(a.name,
                                style: const TextStyle(
                                    fontSize: 12, color: NebulaColors.textSecondary)),
                            const SizedBox(height: 4),
                            Text(_inr.format(a.balance),
                                style: GoogleFonts.spaceGrotesk(
                                    fontSize: 18, fontWeight: FontWeight.w800)),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 18),
              ],

              // Recent transactions
              const Text('Recent Activity',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              const SizedBox(height: 10),
              if (_recent.isEmpty)
                const GlassCard(
                  child: Text('No transactions yet — import from SMS on the Transactions tab.',
                      style: TextStyle(color: NebulaColors.textSecondary, fontSize: 13)),
                )
              else
                GlassCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      for (var i = 0; i < _recent.length; i++) ...[
                        if (i > 0)
                          Divider(height: 1, color: NebulaColors.indigo.withValues(alpha: 0.08)),
                        _txnRow(_recent[i]),
                      ],
                    ],
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _pill(IconData icon, String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w700)),
                Text(value,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _txnRow(Txn t) {
    final isIncome = t.type == 'income';
    final color = isIncome ? NebulaColors.emeraldLight : NebulaColors.rose;
    return ListTile(
      dense: true,
      leading: CircleAvatar(
        radius: 16,
        backgroundColor: color.withValues(alpha: 0.12),
        child: Icon(isIncome ? Icons.south_west_rounded : Icons.north_east_rounded,
            size: 15, color: color),
      ),
      title: Text(t.description ?? t.categoryName ?? 'Transaction',
          maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14)),
      subtitle: Text(DateFormat('d MMM').format(t.date),
          style: const TextStyle(fontSize: 11, color: NebulaColors.textTertiary)),
      trailing: Text(
        '${isIncome ? '+' : '−'}${_inr.format(t.amount)}',
        style: GoogleFonts.jetBrainsMono(fontSize: 13, fontWeight: FontWeight.w700, color: color),
      ),
    );
  }
}
