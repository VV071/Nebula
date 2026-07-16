import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme.dart';
import '../services/market_service.dart';
import '../widgets/glass_card.dart';

/// Market intelligence — single-stock scorecard, head-to-head compare, news.
/// Scorecard/compare come from the Python analysis engine via the backend and
/// can take up to a minute on a cold ticker.
class MarketScreen extends StatefulWidget {
  const MarketScreen({super.key});

  @override
  State<MarketScreen> createState() => _MarketScreenState();
}

class _MarketScreenState extends State<MarketScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 3, vsync: this);

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  gradient: NebulaColors.primaryGradient,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.query_stats, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              const Text('Market',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            ]),
          ),
          TabBar(
            controller: _tabs,
            indicatorColor: NebulaColors.indigo,
            labelColor: NebulaColors.indigoLight,
            unselectedLabelColor: NebulaColors.textSecondary,
            labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            tabs: const [
              Tab(text: 'Scorecard'),
              Tab(text: 'Compare'),
              Tab(text: 'News'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabs,
              children: const [
                _ScorecardTab(),
                _CompareTab(),
                _NewsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── shared: defensive renderer for engine payloads ───────────────────────────

class EngineDataView extends StatelessWidget {
  final Map<String, dynamic> data;
  const EngineDataView({super.key, required this.data});

  static const _skip = {'error'};

  String _label(String key) => key
      .replaceAll('_', ' ')
      .split(' ')
      .map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}')
      .join(' ');

  String _fmt(dynamic v) {
    if (v is double) return v.toStringAsFixed(v.abs() >= 100 ? 1 : 3);
    return v.toString();
  }

  @override
  Widget build(BuildContext context) {
    final scalars = <MapEntry<String, dynamic>>[];
    final sections = <MapEntry<String, Map<String, dynamic>>>[];

    for (final e in data.entries) {
      if (_skip.contains(e.key) || e.value == null) continue;
      if (e.value is Map) {
        sections.add(MapEntry(e.key, Map<String, dynamic>.from(e.value)));
      } else if (e.value is! List) {
        scalars.add(e);
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (scalars.isNotEmpty)
          GlassCard(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(children: [
              for (final e in scalars)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(children: [
                    Expanded(
                        child: Text(_label(e.key),
                            style: const TextStyle(
                                fontSize: 12.5, color: NebulaColors.textSecondary))),
                    Flexible(
                      child: Text(_fmt(e.value),
                          textAlign: TextAlign.right,
                          style: GoogleFonts.jetBrainsMono(
                              fontSize: 12.5, fontWeight: FontWeight.w600)),
                    ),
                  ]),
                ),
            ]),
          ),
        for (final s in sections) ...[
          const SizedBox(height: 10),
          GlassCard(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_label(s.key),
                    style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                        color: NebulaColors.indigoLight)),
                const SizedBox(height: 6),
                for (final e in s.value.entries)
                  if (e.value != null && e.value is! Map && e.value is! List)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(children: [
                        Expanded(
                            child: Text(_label(e.key),
                                style: const TextStyle(
                                    fontSize: 12,
                                    color: NebulaColors.textSecondary))),
                        Flexible(
                          child: Text(_fmt(e.value),
                              textAlign: TextAlign.right,
                              style: GoogleFonts.jetBrainsMono(
                                  fontSize: 12, fontWeight: FontWeight.w600)),
                        ),
                      ]),
                    ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

// ── Scorecard tab ─────────────────────────────────────────────────────────────

class _ScorecardTab extends StatefulWidget {
  const _ScorecardTab();

  @override
  State<_ScorecardTab> createState() => _ScorecardTabState();
}

class _ScorecardTabState extends State<_ScorecardTab>
    with AutomaticKeepAliveClientMixin {
  final _svc = MarketService();
  final _ticker = TextEditingController();
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _data;

  @override
  bool get wantKeepAlive => true;

  Future<void> _run() async {
    final t = _ticker.text.trim().toUpperCase();
    if (t.isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
      _data = null;
    });
    try {
      final res = await _svc.scorecard(t);
      if (res['error'] != null) throw Exception(res['error']);
      setState(() => _data = res);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 96),
      children: [
        Row(children: [
          Expanded(
            child: TextField(
              controller: _ticker,
              textCapitalization: TextCapitalization.characters,
              onSubmitted: (_) => _run(),
              decoration: const InputDecoration(
                  labelText: 'Ticker', hintText: 'e.g. RELIANCE.NS'),
            ),
          ),
          const SizedBox(width: 10),
          SizedBox(
            width: 110,
            child: NebulaButton(
                label: 'Analyse',
                icon: Icons.query_stats,
                loading: _loading,
                onPressed: _run),
          ),
        ]),
        const SizedBox(height: 14),
        if (_loading)
          const GlassCard(
            padding: EdgeInsets.all(24),
            child: Column(children: [
              CircularProgressIndicator(color: NebulaColors.indigo),
              SizedBox(height: 14),
              Text('Running the analysis engine — first run on a ticker can take a minute…',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: NebulaColors.textSecondary)),
            ]),
          )
        else if (_error != null)
          GlassCard(
            borderColor: NebulaColors.rose.withValues(alpha: 0.3),
            child: Text(_error!, style: const TextStyle(color: NebulaColors.rose)),
          )
        else if (_data != null)
          EngineDataView(data: _data!)
        else
          const GlassCard(
            padding: EdgeInsets.all(24),
            child: Text(
                'Enter an NSE ticker to get a full model scorecard: technicals, volatility forecast and more.',
                style: TextStyle(fontSize: 13, color: NebulaColors.textSecondary, height: 1.5)),
          ),
      ],
    );
  }
}

// ── Compare tab ───────────────────────────────────────────────────────────────

class _CompareTab extends StatefulWidget {
  const _CompareTab();

  @override
  State<_CompareTab> createState() => _CompareTabState();
}

class _CompareTabState extends State<_CompareTab>
    with AutomaticKeepAliveClientMixin {
  final _svc = MarketService();
  final _a = TextEditingController();
  final _b = TextEditingController();
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _data;

  @override
  bool get wantKeepAlive => true;

  Future<void> _run() async {
    final a = _a.text.trim().toUpperCase();
    final b = _b.text.trim().toUpperCase();
    if (a.isEmpty || b.isEmpty || a == b) return;
    setState(() {
      _loading = true;
      _error = null;
      _data = null;
    });
    try {
      final res = await _svc.compare(a, b);
      if (res['error'] != null) throw Exception(res['error']);
      setState(() => _data = res);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 96),
      children: [
        Row(children: [
          Expanded(
              child: TextField(
                  controller: _a,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(
                      labelText: 'Stock A', hintText: 'RELIANCE.NS'))),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 8),
            child: Text('VS',
                style: TextStyle(
                    fontWeight: FontWeight.w900, color: NebulaColors.indigoLight)),
          ),
          Expanded(
              child: TextField(
                  controller: _b,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(
                      labelText: 'Stock B', hintText: 'TCS.NS'))),
        ]),
        const SizedBox(height: 12),
        NebulaButton(
            label: 'Compare', icon: Icons.compare_arrows, loading: _loading, onPressed: _run),
        const SizedBox(height: 14),
        if (_loading)
          const GlassCard(
            padding: EdgeInsets.all(24),
            child: Column(children: [
              CircularProgressIndicator(color: NebulaColors.indigo),
              SizedBox(height: 14),
              Text('Comparing both stocks with the analysis engine…',
                  style: TextStyle(fontSize: 12, color: NebulaColors.textSecondary)),
            ]),
          )
        else if (_error != null)
          GlassCard(
            borderColor: NebulaColors.rose.withValues(alpha: 0.3),
            child: Text(_error!, style: const TextStyle(color: NebulaColors.rose)),
          )
        else if (_data != null)
          EngineDataView(data: _data!)
        else
          const GlassCard(
            padding: EdgeInsets.all(24),
            child: Text(
                'Pit two NSE stocks against each other — the model scores momentum, volatility and technicals for both.',
                style: TextStyle(fontSize: 13, color: NebulaColors.textSecondary, height: 1.5)),
          ),
      ],
    );
  }
}

// ── News tab ──────────────────────────────────────────────────────────────────

class _NewsTab extends StatefulWidget {
  const _NewsTab();

  @override
  State<_NewsTab> createState() => _NewsTabState();
}

class _NewsTabState extends State<_NewsTab> with AutomaticKeepAliveClientMixin {
  final _svc = MarketService();
  List<NewsItem> _news = [];
  bool _loading = true;
  String? _error;

  @override
  bool get wantKeepAlive => true;

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
      final n = await _svc.news();
      setState(() => _news = n);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return RefreshIndicator(
      color: NebulaColors.indigo,
      onRefresh: _load,
      child: _loading
          ? const Center(child: CircularProgressIndicator(color: NebulaColors.indigo))
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 96),
              children: [
                if (_error != null)
                  GlassCard(
                    borderColor: NebulaColors.rose.withValues(alpha: 0.3),
                    child: Text(_error!, style: const TextStyle(color: NebulaColors.rose)),
                  )
                else
                  ..._news.map((n) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: GlassCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(n.source.toUpperCase(),
                                  style: const TextStyle(
                                      fontSize: 9.5,
                                      letterSpacing: 1.5,
                                      fontWeight: FontWeight.w800,
                                      color: NebulaColors.indigoLight)),
                              const SizedBox(height: 5),
                              Text(n.title,
                                  style: const TextStyle(
                                      fontSize: 14.5,
                                      fontWeight: FontWeight.w700,
                                      height: 1.35)),
                              const SizedBox(height: 5),
                              Text(n.summary,
                                  maxLines: 3,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      fontSize: 12.5,
                                      height: 1.45,
                                      color: NebulaColors.textSecondary)),
                            ],
                          ),
                        ),
                      )),
              ],
            ),
    );
  }
}
