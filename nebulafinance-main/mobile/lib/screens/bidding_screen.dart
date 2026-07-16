import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../core/theme.dart';
import '../services/bidding_service.dart';
import '../widgets/glass_card.dart';

final _fake = NumberFormat.currency(locale: 'en_IN', symbol: '₮', decimalDigits: 0);
final _fake2 = NumberFormat.currency(locale: 'en_IN', symbol: '₮', decimalDigits: 2);

class BiddingScreen extends StatefulWidget {
  const BiddingScreen({super.key});

  @override
  State<BiddingScreen> createState() => _BiddingScreenState();
}

class _BiddingScreenState extends State<BiddingScreen> {
  final _svc = BiddingService();

  BidWallet? _wallet;
  List<BidItem> _history = [];
  bool _loading = true;
  String? _error;

  // form
  final _tickerA = TextEditingController();
  final _tickerB = TextEditingController();
  final _stake = TextEditingController();
  String _chosen = '';
  bool _placing = false;
  String? _placeError;

  // active clash
  int? _activeBidId;
  String? _activeChosen;
  double? _activeStake;
  Map<String, dynamic>? _potential;
  LivePnl? _pnl;
  Timer? _pnlTimer;
  bool _settling = false;
  SettleResult? _result;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _pnlTimer?.cancel();
    _tickerA.dispose();
    _tickerB.dispose();
    _stake.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([_svc.getWallet(), _svc.getHistory()]);
      setState(() {
        _wallet = results[0] as BidWallet;
        _history = results[1] as List<BidItem>;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _placeBid() async {
    final ta = _tickerA.text.trim().toUpperCase();
    final tb = _tickerB.text.trim().toUpperCase();
    final stake = double.tryParse(_stake.text);
    if (ta.isEmpty || tb.isEmpty) return setState(() => _placeError = 'Enter both tickers.');
    if (ta == tb) return setState(() => _placeError = 'Tickers must be different.');
    if (_chosen.isEmpty) return setState(() => _placeError = 'Pick your winner.');
    if (stake == null || stake <= 0) return setState(() => _placeError = 'Enter a valid stake.');

    setState(() {
      _placing = true;
      _placeError = null;
    });
    try {
      final chosenTicker = _chosen == 'a' ? ta : tb;
      final placed = await _svc.placeBid(
          tickerA: ta, tickerB: tb, chosen: chosenTicker, stake: stake);
      setState(() {
        _activeBidId = placed.bidId;
        _activeChosen = chosenTicker;
        _activeStake = stake;
        _potential = placed.potentialRange;
        _result = null;
        _pnl = null;
        _tickerA.clear();
        _tickerB.clear();
        _stake.clear();
        _chosen = '';
      });
      _startPnlPolling();
      _load();
    } catch (e) {
      setState(() => _placeError = e.toString());
    } finally {
      if (mounted) setState(() => _placing = false);
    }
  }

  void _startPnlPolling() {
    _pnlTimer?.cancel();
    _fetchPnl();
    _pnlTimer = Timer.periodic(const Duration(seconds: 15), (_) => _fetchPnl());
  }

  Future<void> _fetchPnl() async {
    final id = _activeBidId;
    if (id == null) return;
    try {
      final pnl = await _svc.getPnl(id);
      if (mounted) setState(() => _pnl = pnl);
      if (pnl.status != 'pending') _pnlTimer?.cancel();
    } catch (_) {/* keep last snapshot */}
  }

  Future<void> _settleActive() async {
    final id = _activeBidId;
    if (id == null || _settling) return;
    setState(() => _settling = true);
    _pnlTimer?.cancel();
    try {
      final r = await _svc.settle(id);
      setState(() => _result = r);
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _settling = false);
    }
  }

  void _dismissClash() {
    _pnlTimer?.cancel();
    setState(() {
      _activeBidId = null;
      _pnl = null;
      _result = null;
      _potential = null;
    });
  }

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
                    boxShadow: [
                      BoxShadow(
                          color: NebulaColors.indigo.withValues(alpha: 0.4), blurRadius: 18),
                    ],
                  ),
                  child: const Icon(Icons.sports_kabaddi, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 12),
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Bidding Arena',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                    Text('Fake currency · Pick the relative winner',
                        style: TextStyle(fontSize: 11.5, color: NebulaColors.textSecondary)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),

            if (_error != null)
              GlassCard(
                borderColor: NebulaColors.rose.withValues(alpha: 0.3),
                child: Text(_error!, style: const TextStyle(color: NebulaColors.rose)),
              ),

            // wallet
            GlassCard(
              gradient: LinearGradient(colors: [
                NebulaColors.indigo.withValues(alpha: 0.16),
                NebulaColors.violet.withValues(alpha: 0.08),
              ]),
              borderColor: NebulaColors.indigo.withValues(alpha: 0.3),
              padding: const EdgeInsets.all(18),
              child: Row(
                children: [
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                      color: NebulaColors.indigo.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.account_balance_wallet_outlined,
                        color: NebulaColors.indigoLight, size: 20),
                  ),
                  const SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('NEBULA BALANCE',
                          style: TextStyle(
                              fontSize: 9.5,
                              letterSpacing: 2,
                              fontWeight: FontWeight.w700,
                              color: NebulaColors.textSecondary)),
                      Text(
                        _loading ? '···' : _fake.format(_wallet?.balance ?? 0),
                        style: GoogleFonts.spaceGrotesk(
                            fontSize: 26, fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // active clash
            if (_activeBidId != null) ...[
              _result != null ? _resultCard() : _clashCard(),
              const SizedBox(height: 14),
            ],

            // place bid
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Row(children: [
                    Icon(Icons.emoji_events_outlined, size: 17, color: NebulaColors.amber),
                    SizedBox(width: 8),
                    Text('Place a Bid',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                  ]),
                  const SizedBox(height: 14),
                  Row(children: [
                    Expanded(
                        child: TextField(
                      controller: _tickerA,
                      textCapitalization: TextCapitalization.characters,
                      onChanged: (_) => setState(() => _chosen = ''),
                      decoration:
                          const InputDecoration(labelText: 'Stock A', hintText: 'RELIANCE.NS'),
                    )),
                    const SizedBox(width: 10),
                    Expanded(
                        child: TextField(
                      controller: _tickerB,
                      textCapitalization: TextCapitalization.characters,
                      onChanged: (_) => setState(() => _chosen = ''),
                      decoration: const InputDecoration(labelText: 'Stock B', hintText: 'TCS.NS'),
                    )),
                  ]),
                  const SizedBox(height: 12),
                  if (_tickerA.text.trim().isNotEmpty &&
                      _tickerB.text.trim().isNotEmpty &&
                      _tickerA.text.trim().toUpperCase() !=
                          _tickerB.text.trim().toUpperCase()) ...[
                    const Text('Which will outperform by next market close?',
                        style: TextStyle(fontSize: 12, color: NebulaColors.textSecondary)),
                    const SizedBox(height: 8),
                    Row(children: [
                      _pickBtn('a', _tickerA.text.trim().toUpperCase()),
                      const SizedBox(width: 8),
                      _pickBtn('b', _tickerB.text.trim().toUpperCase()),
                    ]),
                    const SizedBox(height: 12),
                  ],
                  TextField(
                    controller: _stake,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Stake (₮)', hintText: '1000'),
                  ),
                  if (_placeError != null) ...[
                    const SizedBox(height: 10),
                    Text(_placeError!,
                        style: const TextStyle(color: NebulaColors.rose, fontSize: 12.5)),
                  ],
                  const SizedBox(height: 14),
                  NebulaButton(
                    label: _placing ? 'Placing…' : 'Place Bid',
                    icon: Icons.sports_kabaddi,
                    loading: _placing,
                    onPressed: _placeBid,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // history
            const Text('Bid History',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            if (_history.isEmpty && !_loading)
              const GlassCard(
                child: Text('No bids yet. Place your first bid above!',
                    style: TextStyle(color: NebulaColors.textSecondary, fontSize: 13)),
              )
            else
              ..._history.map(_historyRow),
          ],
        ),
      ),
    );
  }

  Widget _pickBtn(String side, String ticker) {
    final selected = _chosen == side;
    return Expanded(
      child: PressableScale(
        onTap: () => setState(() => _chosen = side),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            gradient: selected ? NebulaColors.primaryGradient : null,
            color: selected ? null : NebulaColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
                color: selected ? NebulaColors.indigo : NebulaColors.surfaceBorder),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.trending_up,
                  size: 15, color: selected ? Colors.white : NebulaColors.textSecondary),
              const SizedBox(width: 6),
              Flexible(
                child: Text(ticker,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                        color: selected ? Colors.white : NebulaColors.textSecondary)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── live clash card ─────────────────────────────────────────────────────────

  Widget _clashCard() {
    final pnl = _pnl;
    final chosen = _activeChosen ?? '';
    return GlassCard(
      borderColor: NebulaColors.indigo.withValues(alpha: 0.35),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(children: [
            const Icon(Icons.bolt, size: 16, color: NebulaColors.indigoLight),
            const SizedBox(width: 6),
            const Text('Live Clash', style: TextStyle(fontWeight: FontWeight.w800)),
            const Spacer(),
            Container(
              width: 7, height: 7,
              decoration: const BoxDecoration(
                  shape: BoxShape.circle, color: NebulaColors.emeraldLight),
            ),
            const SizedBox(width: 5),
            const Text('LIVE',
                style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: NebulaColors.emeraldLight)),
          ]),
          const SizedBox(height: 14),
          if (pnl == null)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 18),
              child: Center(
                  child: Text('Syncing live prices…',
                      style: TextStyle(color: NebulaColors.textSecondary, fontSize: 13))),
            )
          else ...[
            _pnlBar(_tickerName(true), pnl.pnlA, pnl.priceA, _tickerName(true) == chosen),
            const SizedBox(height: 10),
            _pnlBar(_tickerName(false), pnl.pnlB, pnl.priceB, _tickerName(false) == chosen),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                color: (pnl.edge >= 0 ? NebulaColors.emerald : NebulaColors.rose)
                    .withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(children: [
                Icon(pnl.edge >= 0 ? Icons.flash_on : Icons.shield_outlined,
                    size: 15,
                    color:
                        pnl.edge >= 0 ? NebulaColors.emeraldLight : NebulaColors.rose),
                const SizedBox(width: 6),
                Expanded(
                    child: Text(
                        pnl.edge >= 0 ? '$chosen is ahead' : '$chosen is behind',
                        style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: pnl.edge >= 0
                                ? NebulaColors.emeraldLight
                                : NebulaColors.rose))),
                Text('edge ${pnl.edge >= 0 ? '+' : ''}${_fake2.format(pnl.edge)}',
                    style: GoogleFonts.jetBrainsMono(
                        fontSize: 11.5, fontWeight: FontWeight.w700)),
              ]),
            ),
          ],
          if (_potential != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: NebulaColors.indigo.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: NebulaColors.indigo.withValues(alpha: 0.14)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(children: [
                    Text('Risk band estimate ',
                        style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700)),
                    Text('NOT A PREDICTION',
                        style: TextStyle(
                            fontSize: 8.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1,
                            color: NebulaColors.amber)),
                  ]),
                  const SizedBox(height: 3),
                  Text(
                    _potential!['note']?.toString() ?? '',
                    style: const TextStyle(
                        fontSize: 10.5,
                        fontStyle: FontStyle.italic,
                        color: NebulaColors.textTertiary),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          NebulaButton(
            label: _settling ? 'Settling…' : 'Settle Clash Now',
            icon: Icons.sports_score,
            loading: _settling,
            onPressed: _settleActive,
          ),
        ],
      ),
    );
  }

  String _tickerName(bool first) {
    // From latest history entry for the active bid (source of truth for A/B order)
    final bid = _history.where((b) => b.bidId == _activeBidId).toList();
    if (bid.isEmpty) return first ? 'Stock A' : 'Stock B';
    return first ? bid.first.tickerA : bid.first.tickerB;
  }

  Widget _pnlBar(String ticker, double pnl, double price, bool isChosen) {
    final positive = pnl >= 0;
    final color = positive ? NebulaColors.emeraldLight : NebulaColors.rose;
    final maxAbs = [_pnl?.pnlA.abs() ?? 1, _pnl?.pnlB.abs() ?? 1, 1.0]
        .reduce((a, b) => a > b ? a : b);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          Text(ticker, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          if (isChosen) ...[
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: NebulaColors.indigo.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Text('YOU',
                  style: TextStyle(
                      fontSize: 8,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1,
                      color: NebulaColors.indigoLight)),
            ),
          ],
          const Spacer(),
          Text('₹${price.toStringAsFixed(2)}',
              style: GoogleFonts.jetBrainsMono(
                  fontSize: 11, color: NebulaColors.textSecondary)),
          const SizedBox(width: 8),
          Text('${positive ? '+' : '−'}${_fake2.format(pnl.abs())}',
              style: GoogleFonts.jetBrainsMono(
                  fontSize: 12.5, fontWeight: FontWeight.w700, color: color)),
        ]),
        const SizedBox(height: 5),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: Stack(children: [
            Container(height: 6, color: Colors.white.withValues(alpha: 0.06)),
            AnimatedFractionallySizedBox(
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeOutCubic,
              widthFactor: (pnl.abs() / maxAbs).clamp(0.02, 1.0),
              child: Container(height: 6, color: color),
            ),
          ]),
        ),
      ],
    );
  }

  Widget _resultCard() {
    final r = _result!;
    final won = r.status == 'won';
    final voided = r.status == 'void';
    final color = won
        ? NebulaColors.emeraldLight
        : voided
            ? NebulaColors.textSecondary
            : NebulaColors.rose;
    return GlassCard(
      borderColor: color.withValues(alpha: 0.35),
      padding: const EdgeInsets.all(20),
      child: Column(children: [
        Icon(won ? Icons.emoji_events : voided ? Icons.remove_circle_outline : Icons.close,
            size: 40, color: color),
        const SizedBox(height: 10),
        Text(won ? 'YOU WON!' : voided ? 'DEAD HEAT' : 'YOU LOST',
            style: GoogleFonts.spaceGrotesk(
                fontSize: 22, fontWeight: FontWeight.w900, color: color)),
        const SizedBox(height: 12),
        Row(children: [
          _resultStat('Stake', _fake.format(_activeStake ?? 0)),
          _resultStat('Payout', _fake.format(r.payout)),
          _resultStat('Net', '${r.netResult >= 0 ? '+' : '−'}${_fake.format(r.netResult.abs())}'),
        ]),
        const SizedBox(height: 10),
        Text('New balance: ${_fake.format(r.newBalance)}',
            style: const TextStyle(fontSize: 12.5, color: NebulaColors.textSecondary)),
        const SizedBox(height: 14),
        NebulaButton(label: 'Close', icon: Icons.close, onPressed: _dismissClash),
      ]),
    );
  }

  Widget _resultStat(String label, String value) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 9, letterSpacing: 1.5, color: NebulaColors.textTertiary)),
          const SizedBox(height: 3),
          Text(value,
              style: GoogleFonts.jetBrainsMono(fontSize: 13, fontWeight: FontWeight.w700)),
        ]),
      ),
    );
  }

  Widget _historyRow(BidItem b) {
    final statusColor = switch (b.status) {
      'won' => NebulaColors.emeraldLight,
      'lost' => NebulaColors.rose,
      'void' => NebulaColors.textSecondary,
      _ => NebulaColors.amber,
    };
    final net = b.payout != null ? b.payout! - b.stake : null;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                child: Text('${b.tickerA}  vs  ${b.tickerB}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(b.status.toUpperCase(),
                    style: TextStyle(
                        fontSize: 9, fontWeight: FontWeight.w800, color: statusColor)),
              ),
            ]),
            const SizedBox(height: 6),
            Row(children: [
              Text('→ ${b.chosen}',
                  style: const TextStyle(
                      fontSize: 11.5, color: NebulaColors.indigoLight)),
              const SizedBox(width: 12),
              Text('Stake ${_fake.format(b.stake)}',
                  style:
                      const TextStyle(fontSize: 11.5, color: NebulaColors.textSecondary)),
              const Spacer(),
              if (net != null)
                Text('${net >= 0 ? '+' : '−'}${_fake.format(net.abs())}',
                    style: GoogleFonts.jetBrainsMono(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: net >= 0 ? NebulaColors.emeraldLight : NebulaColors.rose)),
            ]),
          ],
        ),
      ),
    );
  }
}
