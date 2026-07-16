import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../core/theme.dart';
import '../services/finance_service.dart';
import '../widgets/glass_card.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class BudgetsScreen extends StatefulWidget {
  const BudgetsScreen({super.key});

  @override
  State<BudgetsScreen> createState() => _BudgetsScreenState();
}

class _BudgetsScreenState extends State<BudgetsScreen> {
  final _finance = FinanceService();
  List<Budget> _budgets = [];
  List<Category> _categories = [];
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
      final results =
          await Future.wait([_finance.getBudgets(), _finance.getCategories()]);
      setState(() {
        _budgets = results[0] as List<Budget>;
        _categories = (results[1] as List<Category>)
            .where((c) => c.type == 'expense')
            .toList();
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openEditor({Budget? existing}) async {
    final amount = TextEditingController(
        text: existing != null ? existing.limit.toStringAsFixed(0) : '');
    Category? selected = existing != null
        ? _categories.where((c) => c.id == existing.categoryId).firstOrNull
        : (_categories.isNotEmpty ? _categories.first : null);

    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: NebulaColors.bgLight,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding: EdgeInsets.fromLTRB(
              20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(existing == null ? 'New Budget' : 'Edit Budget',
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
              const SizedBox(height: 16),
              DropdownButtonFormField<Category>(
                initialValue: selected,
                dropdownColor: NebulaColors.bgLight,
                decoration: const InputDecoration(labelText: 'Category'),
                items: _categories
                    .map((c) => DropdownMenuItem(value: c, child: Text(c.name)))
                    .toList(),
                onChanged: existing == null
                    ? (c) => setSheet(() => selected = c)
                    : null, // category fixed when editing
              ),
              const SizedBox(height: 12),
              TextField(
                controller: amount,
                keyboardType: TextInputType.number,
                decoration:
                    const InputDecoration(labelText: 'Monthly limit (₹)'),
              ),
              const SizedBox(height: 18),
              NebulaButton(
                label: 'Save Budget',
                icon: Icons.check_rounded,
                onPressed: () {
                  final amt = double.tryParse(amount.text);
                  if (amt == null || amt <= 0 || selected == null) return;
                  Navigator.of(ctx).pop(true);
                },
              ),
            ],
          ),
        ),
      ),
    );

    if (saved == true && selected != null) {
      final amt = double.tryParse(amount.text);
      if (amt == null) return;
      try {
        await _finance.saveBudget(categoryId: selected!.id, limitAmount: amt);
        _load();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text(e.toString())));
        }
      }
    }
  }

  Future<void> _delete(Budget b) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: NebulaColors.bgLight,
        title: const Text('Delete budget?'),
        content: Text('Remove the ${b.categoryName} budget?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Delete', style: TextStyle(color: NebulaColors.rose))),
        ],
      ),
    );
    if (confirm == true) {
      try {
        await _finance.deleteBudget(b.categoryId);
        _load();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text(e.toString())));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Budgets',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _categories.isEmpty ? null : () => _openEditor(),
        backgroundColor: NebulaColors.indigo,
        child: const Icon(Icons.add, color: Colors.white),
      ),
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
                        child: Text(_error!,
                            style: const TextStyle(color: NebulaColors.rose)),
                      )
                    else if (_budgets.isEmpty)
                      const GlassCard(
                        padding: EdgeInsets.all(28),
                        child: Column(children: [
                          Icon(Icons.pie_chart_outline,
                              size: 40, color: NebulaColors.textTertiary),
                          SizedBox(height: 12),
                          Text('No budgets yet',
                              style: TextStyle(fontWeight: FontWeight.w700)),
                          SizedBox(height: 4),
                          Text('Tap + to set a monthly limit for a category.',
                              style: TextStyle(
                                  fontSize: 12.5, color: NebulaColors.textSecondary)),
                        ]),
                      )
                    else
                      ..._budgets.map(_budgetCard),
                    const SizedBox(height: 80),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _budgetCard(Budget b) {
    final pct = (b.percentUsed / 100).clamp(0.0, 1.0);
    final over = b.percentUsed >= 100;
    final warn = b.percentUsed >= 80 && !over;
    final color = over
        ? NebulaColors.rose
        : warn
            ? NebulaColors.amber
            : NebulaColors.emeraldLight;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        onTap: () => _openEditor(existing: b),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                  child: Text(b.categoryName,
                      style: const TextStyle(
                          fontSize: 14.5, fontWeight: FontWeight.w700))),
              if (over)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: NebulaColors.rose.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Text('OVER BUDGET',
                      style: TextStyle(
                          fontSize: 8.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1,
                          color: NebulaColors.rose)),
                ),
              IconButton(
                icon: const Icon(Icons.delete_outline,
                    size: 18, color: NebulaColors.textTertiary),
                onPressed: () => _delete(b),
                visualDensity: VisualDensity.compact,
              ),
            ]),
            const SizedBox(height: 4),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(_inr.format(b.spent),
                    style: GoogleFonts.spaceGrotesk(
                        fontSize: 20, fontWeight: FontWeight.w800, color: color)),
                Text(' / ${_inr.format(b.limit)}',
                    style: const TextStyle(
                        fontSize: 12.5, color: NebulaColors.textSecondary)),
                const Spacer(),
                Text('${b.percentUsed.toStringAsFixed(0)}%',
                    style: GoogleFonts.jetBrainsMono(
                        fontSize: 12, fontWeight: FontWeight.w700, color: color)),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: Stack(children: [
                Container(height: 8, color: Colors.white.withValues(alpha: 0.06)),
                AnimatedFractionallySizedBox(
                  duration: const Duration(milliseconds: 600),
                  curve: Curves.easeOutCubic,
                  widthFactor: pct <= 0 ? 0.01 : pct,
                  child: Container(
                    height: 8,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                          colors: [color.withValues(alpha: 0.7), color]),
                    ),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 6),
            Text(
              over
                  ? '${_inr.format(-b.remaining)} over the limit'
                  : '${_inr.format(b.remaining)} left this ${b.period == 'monthly' ? 'month' : b.period}',
              style: const TextStyle(fontSize: 11.5, color: NebulaColors.textTertiary),
            ),
          ],
        ),
      ),
    );
  }
}
