import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../core/theme.dart';
import '../services/local_store.dart';
import '../widgets/glass_card.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class LendsScreen extends StatefulWidget {
  const LendsScreen({super.key});

  @override
  State<LendsScreen> createState() => _LendsScreenState();
}

class _LendsScreenState extends State<LendsScreen> {
  final _store = LocalStore();
  List<LendEntry> _entries = [];
  bool _loading = true;
  String _filter = 'all'; // all | lent | borrowed

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final entries = await _store.loadLends();
    entries.sort((a, b) => b.date.compareTo(a.date));
    setState(() {
      _entries = entries;
      _loading = false;
    });
  }

  Future<void> _persist() => _store.saveLends(_entries);

  Future<void> _openEditor() async {
    final person = TextEditingController();
    final amount = TextEditingController();
    final note = TextEditingController();
    var direction = 'lent';

    final ok = await showModalBottomSheet<bool>(
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
              const Text('New Entry',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
              const SizedBox(height: 16),
              Row(children: [
                for (final d in ['lent', 'borrowed']) ...[
                  Expanded(
                    child: PressableScale(
                      onTap: () => setSheet(() => direction = d),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 160),
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        decoration: BoxDecoration(
                          gradient:
                              direction == d ? NebulaColors.primaryGradient : null,
                          color: direction == d ? null : NebulaColors.surface,
                          borderRadius: BorderRadius.circular(11),
                          border: Border.all(
                              color: direction == d
                                  ? NebulaColors.indigo
                                  : NebulaColors.surfaceBorder),
                        ),
                        child: Center(
                          child: Text(d == 'lent' ? 'I lent money' : 'I borrowed',
                              style: TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w700,
                                  color: direction == d
                                      ? Colors.white
                                      : NebulaColors.textSecondary)),
                        ),
                      ),
                    ),
                  ),
                  if (d == 'lent') const SizedBox(width: 8),
                ],
              ]),
              const SizedBox(height: 12),
              TextField(
                  controller: person,
                  decoration: const InputDecoration(labelText: 'Person')),
              const SizedBox(height: 12),
              TextField(
                  controller: amount,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Amount (₹)')),
              const SizedBox(height: 12),
              TextField(
                  controller: note,
                  decoration:
                      const InputDecoration(labelText: 'Note (optional)')),
              const SizedBox(height: 18),
              NebulaButton(
                  label: 'Add Entry',
                  icon: Icons.handshake_outlined,
                  onPressed: () => Navigator.of(ctx).pop(true)),
            ],
          ),
        ),
      ),
    );

    if (ok == true) {
      final amt = double.tryParse(amount.text);
      if (person.text.trim().isEmpty || amt == null || amt <= 0) return;
      setState(() {
        _entries.insert(
            0,
            LendEntry(
              id: DateTime.now().millisecondsSinceEpoch.toString(),
              person: person.text.trim(),
              amount: amt,
              direction: direction,
              note: note.text.trim().isEmpty ? null : note.text.trim(),
              date: DateTime.now(),
            ));
      });
      _persist();
    }
  }

  void _toggleSettled(LendEntry e) {
    setState(() => e.settled = !e.settled);
    _persist();
  }

  void _delete(LendEntry e) {
    final idx = _entries.indexOf(e);
    setState(() => _entries.remove(e));
    _persist();
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('Deleted entry for ${e.person}'),
      action: SnackBarAction(
        label: 'Undo',
        onPressed: () {
          setState(() => _entries.insert(idx.clamp(0, _entries.length), e));
          _persist();
        },
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final open = _entries.where((e) => !e.settled);
    final owedToMe = open
        .where((e) => e.direction == 'lent')
        .fold<double>(0, (s, e) => s + e.amount);
    final iOwe = open
        .where((e) => e.direction == 'borrowed')
        .fold<double>(0, (s, e) => s + e.amount);
    final visible = _filter == 'all'
        ? _entries
        : _entries.where((e) => e.direction == _filter).toList();

    return Scaffold(
      appBar: AppBar(
          title: const Text('Lend Tracker',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700))),
      floatingActionButton: FloatingActionButton(
        onPressed: _openEditor,
        backgroundColor: NebulaColors.indigo,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: AuroraBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: NebulaColors.indigo))
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(children: [
                    Expanded(
                        child: _totalCard('OWED TO ME', owedToMe,
                            NebulaColors.emeraldLight, Icons.south_west_rounded)),
                    const SizedBox(width: 10),
                    Expanded(
                        child: _totalCard(
                            'I OWE', iOwe, NebulaColors.rose, Icons.north_east_rounded)),
                  ]),
                  const SizedBox(height: 14),
                  Row(children: [
                    for (final f in ['all', 'lent', 'borrowed']) ...[
                      PressableScale(
                        onTap: () => setState(() => _filter = f),
                        child: Container(
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                            gradient:
                                _filter == f ? NebulaColors.primaryGradient : null,
                            color: _filter == f ? null : NebulaColors.surface,
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(
                                color: _filter == f
                                    ? NebulaColors.indigo
                                    : NebulaColors.surfaceBorder),
                          ),
                          child: Text(
                            f == 'all' ? 'All' : f == 'lent' ? 'Lent' : 'Borrowed',
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: _filter == f
                                    ? Colors.white
                                    : NebulaColors.textSecondary),
                          ),
                        ),
                      ),
                    ],
                  ]),
                  const SizedBox(height: 12),
                  if (visible.isEmpty)
                    const GlassCard(
                      padding: EdgeInsets.all(28),
                      child: Column(children: [
                        Icon(Icons.handshake_outlined,
                            size: 40, color: NebulaColors.textTertiary),
                        SizedBox(height: 12),
                        Text('Nothing here',
                            style: TextStyle(fontWeight: FontWeight.w700)),
                        SizedBox(height: 4),
                        Text('Tap + to track money you lent or borrowed.',
                            style: TextStyle(
                                fontSize: 12.5, color: NebulaColors.textSecondary)),
                      ]),
                    )
                  else
                    ...visible.map(_entryCard),
                  const SizedBox(height: 80),
                ],
              ),
      ),
    );
  }

  Widget _totalCard(String label, double value, Color color, IconData icon) {
    return GlassCard(
      borderColor: color.withValues(alpha: 0.25),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 6),
            Text(label,
                style: TextStyle(
                    fontSize: 9.5,
                    letterSpacing: 1.5,
                    fontWeight: FontWeight.w700,
                    color: color)),
          ]),
          const SizedBox(height: 6),
          Text(_inr.format(value),
              style:
                  GoogleFonts.spaceGrotesk(fontSize: 20, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }

  Widget _entryCard(LendEntry e) {
    final lent = e.direction == 'lent';
    final color = lent ? NebulaColors.emeraldLight : NebulaColors.rose;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Opacity(
        opacity: e.settled ? 0.55 : 1,
        child: GlassCard(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: color.withValues(alpha: 0.12),
              child: Text(e.person[0].toUpperCase(),
                  style: TextStyle(
                      fontSize: 15, fontWeight: FontWeight.w800, color: color)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(e.person,
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          decoration:
                              e.settled ? TextDecoration.lineThrough : null)),
                  Text(
                    '${lent ? 'They owe you' : 'You owe them'}'
                    '${e.note != null ? ' · ${e.note}' : ''}'
                    ' · ${DateFormat('d MMM').format(e.date)}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 11, color: NebulaColors.textTertiary),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(_inr.format(e.amount),
                    style: GoogleFonts.jetBrainsMono(
                        fontSize: 14, fontWeight: FontWeight.w700, color: color)),
                Row(mainAxisSize: MainAxisSize.min, children: [
                  PressableScale(
                    onTap: () => _toggleSettled(e),
                    child: Icon(
                        e.settled
                            ? Icons.check_circle
                            : Icons.radio_button_unchecked,
                        size: 18,
                        color: e.settled
                            ? NebulaColors.emeraldLight
                            : NebulaColors.textTertiary),
                  ),
                  const SizedBox(width: 10),
                  PressableScale(
                    onTap: () => _delete(e),
                    child: const Icon(Icons.delete_outline,
                        size: 18, color: NebulaColors.textTertiary),
                  ),
                ]),
              ],
            ),
          ]),
        ),
      ),
    );
  }
}
