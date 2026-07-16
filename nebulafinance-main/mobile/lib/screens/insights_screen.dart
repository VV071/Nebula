import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../services/finance_service.dart';
import '../widgets/glass_card.dart';

class InsightsScreen extends StatefulWidget {
  const InsightsScreen({super.key});

  @override
  State<InsightsScreen> createState() => _InsightsScreenState();
}

class _InsightsScreenState extends State<InsightsScreen> {
  final _finance = FinanceService();
  List<Insight> _insights = [];
  bool _loading = true;
  bool _generating = false;
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
      final list = await _finance.getInsights();
      setState(() => _insights = list);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _generate() async {
    setState(() => _generating = true);
    try {
      await _finance.generateInsights();
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  Future<void> _dismiss(Insight i) async {
    setState(() => _insights.removeWhere((x) => x.id == i.id));
    try {
      await _finance.dismissInsight(i.id);
    } catch (_) {
      _load(); // restore on failure
    }
  }

  (IconData, Color) _styleFor(String type) => switch (type) {
        'warning' => (Icons.warning_amber_rounded, NebulaColors.amber),
        'success' => (Icons.check_circle_outline, NebulaColors.emeraldLight),
        'danger' || 'error' => (Icons.error_outline, NebulaColors.rose),
        _ => (Icons.lightbulb_outline, NebulaColors.indigoLight),
      };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Insights',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
        actions: [
          TextButton.icon(
            onPressed: _generating ? null : _generate,
            icon: _generating
                ? const SizedBox(
                    width: 14, height: 14,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: NebulaColors.indigoLight))
                : const Icon(Icons.auto_awesome, size: 16, color: NebulaColors.indigoLight),
            label: const Text('Generate',
                style: TextStyle(color: NebulaColors.indigoLight, fontSize: 13)),
          ),
        ],
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
                        child: Text(_error!, style: const TextStyle(color: NebulaColors.rose)),
                      )
                    else if (_insights.isEmpty)
                      const GlassCard(
                        padding: EdgeInsets.all(28),
                        child: Column(children: [
                          Icon(Icons.lightbulb_outline,
                              size: 40, color: NebulaColors.textTertiary),
                          SizedBox(height: 12),
                          Text('No insights yet',
                              style: TextStyle(fontWeight: FontWeight.w700)),
                          SizedBox(height: 4),
                          Text('Tap "Generate" to analyse your spending.',
                              style: TextStyle(
                                  fontSize: 12.5, color: NebulaColors.textSecondary)),
                        ]),
                      )
                    else
                      ..._insights.map((i) {
                        final (icon, color) = _styleFor(i.type);
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Dismissible(
                            key: ValueKey(i.id),
                            direction: DismissDirection.endToStart,
                            onDismissed: (_) => _dismiss(i),
                            background: Container(
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 20),
                              decoration: BoxDecoration(
                                color: NebulaColors.rose.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Icon(Icons.close, color: NebulaColors.rose),
                            ),
                            child: GlassCard(
                              borderColor: color.withValues(alpha: 0.25),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(children: [
                                    Icon(icon, size: 18, color: color),
                                    const SizedBox(width: 8),
                                    Expanded(
                                        child: Text(i.title,
                                            style: const TextStyle(
                                                fontSize: 14.5,
                                                fontWeight: FontWeight.w700))),
                                  ]),
                                  const SizedBox(height: 6),
                                  Text(i.message,
                                      style: const TextStyle(
                                          fontSize: 13,
                                          height: 1.45,
                                          color: NebulaColors.textSecondary)),
                                  if (i.suggestion != null &&
                                      i.suggestion!.isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: color.withValues(alpha: 0.07),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Icon(Icons.tips_and_updates_outlined,
                                              size: 14, color: color),
                                          const SizedBox(width: 8),
                                          Expanded(
                                              child: Text(i.suggestion!,
                                                  style: TextStyle(
                                                      fontSize: 12,
                                                      height: 1.4,
                                                      color: color))),
                                        ],
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        );
                      }),
                    const SizedBox(height: 8),
                    const Center(
                      child: Text('Swipe an insight left to dismiss it',
                          style:
                              TextStyle(fontSize: 11, color: NebulaColors.textTertiary)),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
