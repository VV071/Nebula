import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Where the Nebula backend lives.
///
/// - Android emulator:  http://10.0.2.2:5005   (10.0.2.2 = host machine)
/// - iOS simulator:     http://localhost:5005
/// - Physical device:   http://YOUR-PC-LAN-IP:5005  (e.g. http://192.168.1.4:5005)
///   Find your IP with `ipconfig` and make sure phone + PC share the Wi-Fi.
class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'NEBULA_API',
    defaultValue: 'http://10.0.2.2:5005',
  );
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);
  @override
  String toString() => message;
}

/// Thin JWT-aware HTTP client for the Nebula REST API.
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  static const _storage = FlutterSecureStorage();
  static const _kAccess = 'nebula_access_token';
  static const _kRefresh = 'nebula_refresh_token';

  String? _accessToken;

  Future<void> loadTokens() async {
    _accessToken = await _storage.read(key: _kAccess);
  }

  bool get isLoggedIn => _accessToken != null;

  Future<void> saveTokens(String access, String refresh) async {
    _accessToken = access;
    await _storage.write(key: _kAccess, value: access);
    await _storage.write(key: _kRefresh, value: refresh);
  }

  Future<String?> get refreshToken => _storage.read(key: _kRefresh);

  Future<void> clearTokens() async {
    _accessToken = null;
    await _storage.delete(key: _kAccess);
    await _storage.delete(key: _kRefresh);
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_accessToken != null) 'Authorization': 'Bearer $_accessToken',
      };

  Future<dynamic> get(String path) async {
    final res = await http
        .get(Uri.parse('${ApiConfig.baseUrl}$path'), headers: _headers)
        .timeout(const Duration(seconds: 90));
    return _handle(res, () => get(path));
  }

  Future<dynamic> post(String path, [Map<String, dynamic>? body]) async {
    final res = await http
        .post(Uri.parse('${ApiConfig.baseUrl}$path'),
            headers: _headers, body: jsonEncode(body ?? {}))
        .timeout(const Duration(seconds: 90));
    return _handle(res, () => post(path, body));
  }

  Future<dynamic> patch(String path, [Map<String, dynamic>? body]) async {
    final res = await http
        .patch(Uri.parse('${ApiConfig.baseUrl}$path'),
            headers: _headers, body: jsonEncode(body ?? {}))
        .timeout(const Duration(seconds: 90));
    return _handle(res, () => patch(path, body));
  }

  Future<dynamic> delete(String path) async {
    final res = await http
        .delete(Uri.parse('${ApiConfig.baseUrl}$path'), headers: _headers)
        .timeout(const Duration(seconds: 90));
    return _handle(res, () => delete(path));
  }

  Future<dynamic> _handle(http.Response res, Future<dynamic> Function() retry) async {
    if (res.statusCode == 401 && _accessToken != null) {
      // Try one silent refresh, then retry the original call.
      if (await _tryRefresh()) return retry();
      await clearTokens();
    }
    final body = res.body.isEmpty ? {} : jsonDecode(res.body);
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    final msg = body is Map
        ? (body['error']?.toString() ?? body['message']?.toString() ?? 'HTTP ${res.statusCode}')
        : 'HTTP ${res.statusCode}';
    throw ApiException(res.statusCode, msg);
  }

  bool _refreshing = false;
  Future<bool> _tryRefresh() async {
    if (_refreshing) return false;
    _refreshing = true;
    try {
      final rt = await refreshToken;
      if (rt == null) return false;
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': rt}),
      );
      if (res.statusCode != 200) return false;
      final data = jsonDecode(res.body)['data'];
      await saveTokens(data['accessToken'], data['refreshToken']);
      return true;
    } catch (_) {
      return false;
    } finally {
      _refreshing = false;
    }
  }
}
