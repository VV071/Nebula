import '../core/api_client.dart';

class NewsItem {
  final String title;
  final String summary;
  final String source;
  NewsItem({required this.title, required this.summary, required this.source});

  factory NewsItem.fromJson(Map<String, dynamic> j) => NewsItem(
        title: j['title'] ?? '',
        summary: j['summary'] ?? '',
        source: j['source'] ?? '',
      );
}

/// Wraps /api/market — scorecard, compare, news. The scorecard/compare calls
/// hit the Python analysis engine through the Node backend, so they can take
/// up to a minute on a cold ticker.
class MarketService {
  final _api = ApiClient.instance;

  Future<Map<String, dynamic>> scorecard(String ticker) async {
    final res = await _api.get('/api/market/scorecard?ticker=${Uri.encodeComponent(ticker)}');
    return Map<String, dynamic>.from(res);
  }

  Future<Map<String, dynamic>> compare(String a, String b) async {
    final res = await _api.get(
        '/api/market/compare?stock_a=${Uri.encodeComponent(a)}&stock_b=${Uri.encodeComponent(b)}');
    return Map<String, dynamic>.from(res);
  }

  Future<List<NewsItem>> news() async {
    final res = await _api.get('/api/market/news');
    final list = res is List ? res : (res['data'] ?? []) as List;
    return list.map((e) => NewsItem.fromJson(Map<String, dynamic>.from(e))).toList();
  }
}
