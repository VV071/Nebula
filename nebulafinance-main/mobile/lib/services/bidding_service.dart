import '../core/api_client.dart';

class BidWallet {
  final double balance;
  BidWallet({required this.balance});
}

class BidItem {
  final int bidId;
  final String tickerA, tickerB, chosen, status;
  final double stake;
  final double? payout, retA, retB;
  final DateTime entryTime;

  BidItem({
    required this.bidId,
    required this.tickerA,
    required this.tickerB,
    required this.chosen,
    required this.status,
    required this.stake,
    this.payout,
    this.retA,
    this.retB,
    required this.entryTime,
  });

  factory BidItem.fromJson(Map<String, dynamic> j) => BidItem(
        bidId: j['bid_id'],
        tickerA: j['ticker_a'],
        tickerB: j['ticker_b'],
        chosen: j['chosen'],
        status: j['status'],
        stake: (j['stake'] as num).toDouble(),
        payout: (j['payout'] as num?)?.toDouble(),
        retA: (j['ret_a'] as num?)?.toDouble(),
        retB: (j['ret_b'] as num?)?.toDouble(),
        entryTime: DateTime.tryParse(j['entry_time']?.toString() ?? '') ?? DateTime.now(),
      );
}

class PlacedBid {
  final int bidId;
  final double balanceAfterStake;
  final Map<String, dynamic>? potentialRange;
  PlacedBid({required this.bidId, required this.balanceAfterStake, this.potentialRange});
}

class LivePnl {
  final String status;
  final double pnlA, pnlB, priceA, priceB, edge;
  LivePnl({
    required this.status,
    required this.pnlA,
    required this.pnlB,
    required this.priceA,
    required this.priceB,
    required this.edge,
  });

  factory LivePnl.fromJson(Map<String, dynamic> j) => LivePnl(
        status: j['status'],
        pnlA: (j['pnlA'] as num).toDouble(),
        pnlB: (j['pnlB'] as num).toDouble(),
        priceA: (j['priceA'] as num).toDouble(),
        priceB: (j['priceB'] as num).toDouble(),
        edge: (j['edge'] as num).toDouble(),
      );
}

class SettleResult {
  final String status;
  final double payout, netResult, newBalance, margin;
  SettleResult({
    required this.status,
    required this.payout,
    required this.netResult,
    required this.newBalance,
    required this.margin,
  });
}

class BiddingService {
  final _api = ApiClient.instance;

  Future<BidWallet> getWallet() async {
    final res = await _api.get('/api/bids/wallet');
    return BidWallet(balance: (res['balance'] as num).toDouble());
  }

  Future<List<BidItem>> getHistory() async {
    final res = await _api.get('/api/bids/history');
    return (res['bids'] as List).map((e) => BidItem.fromJson(e)).toList();
  }

  Future<PlacedBid> placeBid({
    required String tickerA,
    required String tickerB,
    required String chosen,
    required double stake,
  }) async {
    final res = await _api.post('/api/bids', {
      'ticker_a': tickerA,
      'ticker_b': tickerB,
      'chosen': chosen,
      'stake': stake,
    });
    return PlacedBid(
      bidId: res['bid_id'],
      balanceAfterStake: (res['balance_after_stake'] as num).toDouble(),
      potentialRange: res['potential_range'],
    );
  }

  Future<LivePnl> getPnl(int bidId) async {
    final res = await _api.get('/api/bids/$bidId/pnl');
    return LivePnl.fromJson(Map<String, dynamic>.from(res));
  }

  Future<SettleResult> settle(int bidId) async {
    final res = await _api.post('/api/bids/$bidId/settle');
    return SettleResult(
      status: res['status'],
      payout: (res['payout'] as num?)?.toDouble() ?? 0,
      netResult: (res['net_result'] as num?)?.toDouble() ?? 0,
      newBalance: (res['new_balance'] as num?)?.toDouble() ?? 0,
      margin: (res['margin'] as num?)?.toDouble() ?? 0,
    );
  }
}
