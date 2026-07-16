import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../core/theme.dart';
import '../services/finance_service.dart';
import '../services/sms_service.dart';
import '../widgets/glass_card.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);

/// Scans the SMS inbox for bank debit/credit messages, lets the user review
/// and select which ones to import, then POSTs them to /api/transactions.
class SmsImportScreen extends StatefulWidget {
  const SmsImportScreen({super.key});

  @override
  State<SmsImportScreen> createState() => _SmsImportScreenState();
}

class _SmsImportScreenState extends State<SmsImportScreen> {
  final _sms = SmsService();
  final _finance = FinanceService();

  bool _scanning = true;
  bool _importing = false;
  bool _permissionDenied = false;
  String? _error;
  List<ParsedBankSms> _parsed = [];

  // import targets
  List<Account> _accounts = [];
  List<Category> _categories = [];
  Account? _targetAccount;

  @override
  void initState() {
    super.initState();
    _scan();
  }

  Future<void> _scan() async {
    setState(() {
      _scanning = true;
      _permissionDenied = false;
      _error = null;
    });

    if (!Platform.isAndroid) {
      setState(() {
        _scanning = false;
        _error = 'SMS reading is only available on Android — iOS does not allow apps to read SMS.';
      });
      return;
    }

    try {
      final granted = await _sms.requestPermission();
      if (!granted) {
        setState(() {
          _scanning = false;
          _permissionDenied = true;
        });
        return;
      }

      final results = await Future.wait([
        _sms.scanInbox(),
        _finance.getAccounts(),
        _finance.getCategories(),
      ]);

      setState(() {
        _parsed = results[0] as List<ParsedBankSms>;
        _accounts = results[1] as List<Account>;
        _categories = results[2] as List<Category>;
        _targetAccount = _accounts.isNotEmpty ? _accounts.first : null;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _scanning = false);
    }
  }

  int? _categoryFor(String type) {
    // Prefer an "Other"-style category of the matching type, else first match.
    final matching = _categories.where((c) => c.type == type).toList();
    if (matching.isEmpty) return null;
    final other = matching.where((c) => c.name.toLowerCase().contains('other'));
    return (other.isNotEmpty ? other.first : matching.first).id;
  }

  Future<void> _import() async {
    final selected = _parsed.where((p) => p.selected).toList();
    if (selected.isEmpty || _targetAccount == null) return;

    setState(() => _importing = true);
    var ok = 0;
    String? firstError;

    for (final p in selected) {
      try {
        final catId = _categoryFor(p.type);
        if (catId == null) throw Exception('No ${p.type} category found');
        await _finance.createTransaction(
          accountId: _targetAccount!.id,
          categoryId: catId,
          amount: p.amount,
          type: p.type,
          description: '${p.merchant ?? p.bank}${p.account != null ? ' (${p.account})' : ''} · via SMS',
          date: p.date,
        );
        ok++;
      } catch (e) {
        firstError ??= e.toString();
      }
    }

    if (!mounted) return;
    setState(() => _importing = false);
    if (firstError != null && ok == 0) {
      setState(() => _error = firstError);
    } else {
      Navigator.of(context).pop(ok);
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedCount = _parsed.where((p) => p.selected).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Import from SMS',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
      ),
      body: AuroraBackground(
        child: SafeArea(
          child: _scanning
              ? const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(color: NebulaColors.indigo),
                      SizedBox(height: 16),
                      Text('Scanning your inbox for bank messages…',
                          style: TextStyle(color: NebulaColors.textSecondary, fontSize: 13)),
                    ],
                  ),
                )
              : _permissionDenied
                  ? _permissionView()
                  : _error != null
                      ? Padding(
                          padding: const EdgeInsets.all(16),
                          child: GlassCard(
                            borderColor: NebulaColors.rose.withValues(alpha: 0.3),
                            child:
                                Text(_error!, style: const TextStyle(color: NebulaColors.rose)),
                          ),
                        )
                      : Column(
                          children: [
                            // account picker + summary bar
                            Padding(
                              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                              child: GlassCard(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                child: Row(
                                  children: [
                                    const Icon(Icons.account_balance_wallet_outlined,
                                        size: 18, color: NebulaColors.indigoLight),
                                    const SizedBox(width: 10),
                                    const Text('Into:',
                                        style: TextStyle(
                                            fontSize: 13, color: NebulaColors.textSecondary)),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<Account>(
                                          value: _targetAccount,
                                          isExpanded: true,
                                          dropdownColor: NebulaColors.bgLight,
                                          style: const TextStyle(
                                              fontSize: 13.5,
                                              fontWeight: FontWeight.w600,
                                              color: NebulaColors.textPrimary),
                                          items: _accounts
                                              .map((a) => DropdownMenuItem(
                                                  value: a, child: Text(a.name)))
                                              .toList(),
                                          onChanged: (a) =>
                                              setState(() => _targetAccount = a),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                              child: Row(
                                children: [
                                  Text('${_parsed.length} bank messages found',
                                      style: const TextStyle(
                                          fontSize: 12, color: NebulaColors.textSecondary)),
                                  const Spacer(),
                                  TextButton(
                                    onPressed: () => setState(() {
                                      final all = selectedCount < _parsed.length;
                                      for (final p in _parsed) {
                                        p.selected = all;
                                      }
                                    }),
                                    child: Text(
                                        selectedCount < _parsed.length
                                            ? 'Select all'
                                            : 'Clear all',
                                        style: const TextStyle(
                                            fontSize: 12, color: NebulaColors.indigoLight)),
                                  ),
                                ],
                              ),
                            ),
                            Expanded(
                              child: _parsed.isEmpty
                                  ? const Center(
                                      child: Text('No bank transactions found in recent SMS.',
                                          style: TextStyle(
                                              color: NebulaColors.textSecondary, fontSize: 13)))
                                  : ListView.separated(
                                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                                      itemCount: _parsed.length,
                                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                                      itemBuilder: (_, i) => _smsRow(_parsed[i]),
                                    ),
                            ),
                            // import CTA
                            Padding(
                              padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                              child: NebulaButton(
                                label: _importing
                                    ? 'Importing…'
                                    : 'Import $selectedCount transaction${selectedCount == 1 ? '' : 's'}',
                                icon: Icons.download_done_rounded,
                                loading: _importing,
                                onPressed:
                                    selectedCount == 0 || _targetAccount == null ? null : _import,
                              ),
                            ),
                          ],
                        ),
        ),
      ),
    );
  }

  Widget _permissionView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: GlassCard(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.sms_failed_outlined, size: 40, color: NebulaColors.amber),
              const SizedBox(height: 14),
              const Text('SMS permission needed',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              const SizedBox(height: 8),
              const Text(
                'Nebula reads bank messages on your device to find debits and credits. '
                'Messages never leave your phone — only the transactions you choose to import are uploaded.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12.5, color: NebulaColors.textSecondary, height: 1.5),
              ),
              const SizedBox(height: 18),
              NebulaButton(label: 'Grant Permission', icon: Icons.lock_open_rounded, onPressed: _scan),
            ],
          ),
        ),
      ),
    );
  }

  Widget _smsRow(ParsedBankSms p) {
    final isIncome = p.type == 'income';
    final color = isIncome ? NebulaColors.emeraldLight : NebulaColors.rose;
    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      onTap: () => setState(() => p.selected = !p.selected),
      child: Row(
        children: [
          Checkbox(
            value: p.selected,
            activeColor: NebulaColors.indigo,
            onChanged: (v) => setState(() => p.selected = v ?? false),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(p.bank,
                        style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                            color: NebulaColors.indigoLight)),
                    if (p.account != null) ...[
                      const SizedBox(width: 6),
                      Text(p.account!,
                          style: const TextStyle(
                              fontSize: 11, color: NebulaColors.textTertiary)),
                    ],
                    const Spacer(),
                    Text(DateFormat('d MMM').format(p.date),
                        style: const TextStyle(
                            fontSize: 11, color: NebulaColors.textTertiary)),
                  ],
                ),
                const SizedBox(height: 3),
                Text(p.merchant ?? (isIncome ? 'Credit' : 'Debit'),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text('${isIncome ? '+' : '−'}${_inr.format(p.amount)}',
              style: GoogleFonts.jetBrainsMono(
                  fontSize: 13.5, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}
