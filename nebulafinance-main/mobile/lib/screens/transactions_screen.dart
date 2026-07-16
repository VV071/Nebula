import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../core/theme.dart';
import '../services/finance_service.dart';
import '../widgets/glass_card.dart';
import 'sms_import_screen.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  final _finance = FinanceService();
  List<Txn> _txns = [];
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
      final txns = await _finance.getTransactions();
      setState(() => _txns = txns);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openSmsImport() async {
    final imported = await Navigator.of(context).push<int>(
      MaterialPageRoute(builder: (_) => const SmsImportScreen()),
    );
    if (imported != null && imported > 0) {
      _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Imported $imported transaction${imported == 1 ? '' : 's'} from SMS')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(
              children: [
                const Expanded(
                  child: Text('Transactions',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                ),
                PressableScale(
                  onTap: _openSmsImport,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                    decoration: BoxDecoration(
                      gradient: NebulaColors.primaryGradient,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                            color: NebulaColors.indigo.withValues(alpha: 0.4), blurRadius: 16),
                      ],
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.sms_outlined, size: 16, color: Colors.white),
                        SizedBox(width: 6),
                        Text('Import SMS',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: RefreshIndicator(
              color: NebulaColors.indigo,
              onRefresh: _load,
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: NebulaColors.indigo))
                  : _error != null
                      ? ListView(padding: const EdgeInsets.all(16), children: [
                          GlassCard(
                            borderColor: NebulaColors.rose.withValues(alpha: 0.3),
                            child:
                                Text(_error!, style: const TextStyle(color: NebulaColors.rose)),
                          ),
                        ])
                      : _txns.isEmpty
                          ? ListView(padding: const EdgeInsets.all(16), children: const [
                              GlassCard(
                                padding: EdgeInsets.all(28),
                                child: Column(children: [
                                  Icon(Icons.receipt_long_outlined,
                                      size: 40, color: NebulaColors.textTertiary),
                                  SizedBox(height: 12),
                                  Text('No transactions yet',
                                      style: TextStyle(fontWeight: FontWeight.w700)),
                                  SizedBox(height: 4),
                                  Text('Tap "Import SMS" to pull them from your bank messages.',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                          fontSize: 12.5, color: NebulaColors.textSecondary)),
                                ]),
                              ),
                            ])
                          : ListView.separated(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
                              itemCount: _txns.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 8),
                              itemBuilder: (_, i) => _row(_txns[i]),
                            ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _row(Txn t) {
    final isIncome = t.type == 'income';
    final color = isIncome ? NebulaColors.emeraldLight : NebulaColors.rose;
    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          CircleAvatar(
            radius: 17,
            backgroundColor: color.withValues(alpha: 0.12),
            child: Icon(isIncome ? Icons.south_west_rounded : Icons.north_east_rounded,
                size: 16, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t.description ?? t.categoryName ?? 'Transaction',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                Text(
                  '${t.categoryName ?? t.type} · ${DateFormat('d MMM yyyy').format(t.date)}',
                  style: const TextStyle(fontSize: 11.5, color: NebulaColors.textTertiary),
                ),
              ],
            ),
          ),
          Text(
            '${isIncome ? '+' : '−'}${_inr.format(t.amount)}',
            style:
                GoogleFonts.jetBrainsMono(fontSize: 14, fontWeight: FontWeight.w700, color: color),
          ),
        ],
      ),
    );
  }
}
