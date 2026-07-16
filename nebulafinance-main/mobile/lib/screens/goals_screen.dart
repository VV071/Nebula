import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../core/theme.dart';
import '../services/local_store.dart';
import '../widgets/glass_card.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class GoalsScreen extends StatefulWidget {
  const GoalsScreen({super.key});

  @override
  State<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends State<GoalsScreen> {
  final _store = LocalStore();
  List<SavingsGoal> _goals = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final goals = await _store.loadGoals();
    setState(() {
      _goals = goals;
      _loading = false;
    });
  }

  Future<void> _persist() => _store.saveGoals(_goals);

  Future<void> _openEditor({SavingsGoal? existing}) async {
    final name = TextEditingController(text: existing?.name ?? '');
    final target =
        TextEditingController(text: existing?.target.toStringAsFixed(0) ?? '');

    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: NebulaColors.bgLight,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
            20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(existing == null ? 'New Savings Goal' : 'Edit Goal',
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            TextField(
                controller: name,
                decoration: const InputDecoration(
                    labelText: 'Goal name', hintText: 'e.g. New Laptop')),
            const SizedBox(height: 12),
            TextField(
                controller: target,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Target amount (₹)')),
            const SizedBox(height: 18),
            NebulaButton(
              label: 'Save Goal',
              icon: Icons.flag_outlined,
              onPressed: () => Navigator.of(ctx).pop(true),
            ),
          ],
        ),
      ),
    );

    if (ok == true) {
      final t = double.tryParse(target.text);
      if (name.text.trim().isEmpty || t == null || t <= 0) return;
      setState(() {
        if (existing != null) {
          existing.name = name.text.trim();
          existing.target = t;
        } else {
          _goals.add(SavingsGoal(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            name: name.text.trim(),
            target: t,
            saved: 0,
          ));
        }
      });
      _persist();
    }
  }

  Future<void> _addMoney(SavingsGoal g) async {
    final amount = TextEditingController();
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: NebulaColors.bgLight,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
            20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Add to "${g.name}"',
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            TextField(
                controller: amount,
                autofocus: true,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Amount (₹)')),
            const SizedBox(height: 18),
            NebulaButton(
                label: 'Add Money',
                icon: Icons.savings_outlined,
                onPressed: () => Navigator.of(ctx).pop(true)),
          ],
        ),
      ),
    );
    if (ok == true) {
      final amt = double.tryParse(amount.text);
      if (amt == null || amt <= 0) return;
      setState(() => g.saved += amt);
      _persist();
    }
  }

  void _delete(SavingsGoal g) {
    setState(() => _goals.removeWhere((x) => x.id == g.id));
    _persist();
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('Deleted "${g.name}"'),
      action: SnackBarAction(
        label: 'Undo',
        onPressed: () {
          setState(() => _goals.add(g));
          _persist();
        },
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final totalSaved = _goals.fold<double>(0, (s, g) => s + g.saved);
    return Scaffold(
      appBar: AppBar(
          title: const Text('Savings Goals',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700))),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openEditor(),
        backgroundColor: NebulaColors.indigo,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: AuroraBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: NebulaColors.indigo))
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  GlassCard(
                    gradient: LinearGradient(colors: [
                      NebulaColors.emerald.withValues(alpha: 0.12),
                      NebulaColors.indigo.withValues(alpha: 0.08),
                    ]),
                    borderColor: NebulaColors.emerald.withValues(alpha: 0.25),
                    padding: const EdgeInsets.all(18),
                    child: Row(children: [
                      const Icon(Icons.savings_outlined,
                          size: 28, color: NebulaColors.emeraldLight),
                      const SizedBox(width: 14),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('TOTAL SAVED',
                              style: TextStyle(
                                  fontSize: 10,
                                  letterSpacing: 2,
                                  fontWeight: FontWeight.w700,
                                  color: NebulaColors.textSecondary)),
                          Text(_inr.format(totalSaved),
                              style: GoogleFonts.spaceGrotesk(
                                  fontSize: 26, fontWeight: FontWeight.w900)),
                        ],
                      ),
                    ]),
                  ),
                  const SizedBox(height: 14),
                  if (_goals.isEmpty)
                    const GlassCard(
                      padding: EdgeInsets.all(28),
                      child: Column(children: [
                        Icon(Icons.flag_outlined,
                            size: 40, color: NebulaColors.textTertiary),
                        SizedBox(height: 12),
                        Text('No goals yet',
                            style: TextStyle(fontWeight: FontWeight.w700)),
                        SizedBox(height: 4),
                        Text('Tap + to set your first savings goal.',
                            style: TextStyle(
                                fontSize: 12.5, color: NebulaColors.textSecondary)),
                      ]),
                    )
                  else
                    ..._goals.map(_goalCard),
                  const SizedBox(height: 80),
                ],
              ),
      ),
    );
  }

  Widget _goalCard(SavingsGoal g) {
    final done = g.progress >= 1;
    final color = done ? NebulaColors.emeraldLight : NebulaColors.indigoLight;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        onTap: () => _openEditor(existing: g),
        borderColor: done ? NebulaColors.emerald.withValues(alpha: 0.35) : null,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              if (done) ...[
                const Icon(Icons.emoji_events,
                    size: 18, color: NebulaColors.emeraldLight),
                const SizedBox(width: 6),
              ],
              Expanded(
                  child: Text(g.name,
                      style: const TextStyle(
                          fontSize: 14.5, fontWeight: FontWeight.w700))),
              IconButton(
                icon: const Icon(Icons.delete_outline,
                    size: 18, color: NebulaColors.textTertiary),
                onPressed: () => _delete(g),
                visualDensity: VisualDensity.compact,
              ),
            ]),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(_inr.format(g.saved),
                    style: GoogleFonts.spaceGrotesk(
                        fontSize: 20, fontWeight: FontWeight.w800, color: color)),
                Text(' / ${_inr.format(g.target)}',
                    style: const TextStyle(
                        fontSize: 12.5, color: NebulaColors.textSecondary)),
                const Spacer(),
                Text('${(g.progress * 100).toStringAsFixed(0)}%',
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
                  widthFactor: g.progress <= 0 ? 0.01 : g.progress,
                  child: Container(
                    height: 8,
                    decoration: BoxDecoration(
                        gradient: LinearGradient(
                            colors: [color.withValues(alpha: 0.7), color])),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 10),
            if (!done)
              Align(
                alignment: Alignment.centerLeft,
                child: PressableScale(
                  onTap: () => _addMoney(g),
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                    decoration: BoxDecoration(
                      color: NebulaColors.indigo.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.add, size: 14, color: NebulaColors.indigoLight),
                      SizedBox(width: 4),
                      Text('Add money',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: NebulaColors.indigoLight)),
                    ]),
                  ),
                ),
              )
            else
              const Text('Goal reached! 🎉',
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: NebulaColors.emeraldLight)),
          ],
        ),
      ),
    );
  }
}
