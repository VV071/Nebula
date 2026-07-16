import '../core/api_client.dart';

class NebulaUser {
  final int id;
  final String email;
  final String? name;
  NebulaUser({required this.id, required this.email, this.name});

  factory NebulaUser.fromJson(Map<String, dynamic> j) => NebulaUser(
        id: j['id'] is int ? j['id'] : int.parse(j['id'].toString()),
        email: j['email'] ?? '',
        name: j['name'] ?? j['full_name'],
      );
}

class AuthService {
  final _api = ApiClient.instance;

  Future<NebulaUser> login(String email, String password) async {
    final res = await _api.post('/api/auth/login', {
      'email': email,
      'password': password,
    });
    final data = res['data'];
    await _api.saveTokens(data['accessToken'], data['refreshToken']);
    return NebulaUser.fromJson(data['user']);
  }

  Future<NebulaUser> register(String name, String email, String password) async {
    final res = await _api.post('/api/auth/register', {
      'name': name,
      'email': email,
      'password': password,
    });
    final data = res['data'];
    await _api.saveTokens(data['accessToken'], data['refreshToken']);
    return NebulaUser.fromJson(data['user']);
  }

  /// Returns the current user if a stored token is still valid.
  Future<NebulaUser?> restoreSession() async {
    await _api.loadTokens();
    if (!_api.isLoggedIn) return null;
    try {
      final res = await _api.get('/api/auth/me');
      final data = res['data'];
      return NebulaUser.fromJson(data is Map<String, dynamic> ? data : {});
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    try {
      final rt = await _api.refreshToken;
      if (rt != null) await _api.post('/api/auth/logout', {'refreshToken': rt});
    } catch (_) {/* best-effort */}
    await _api.clearTokens();
  }
}
