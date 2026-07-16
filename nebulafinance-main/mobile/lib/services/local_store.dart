import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Savings goals + lend/borrow tracker — stored on-device, mirroring the web
/// app which keeps these in localStorage ('savingsGoals', 'nebula_lend_entries').

class SavingsGoal {
  final String id;
  String name;
  double target;
  double saved;
  SavingsGoal({required this.id, required this.name, required this.target, required this.saved});

  double get progress => target <= 0 ? 0 : (saved / target).clamp(0, 1);

  Map<String, dynamic> toJson() =>
      {'id': id, 'name': name, 'target': target, 'saved': saved};

  factory SavingsGoal.fromJson(Map<String, dynamic> j) => SavingsGoal(
        id: j['id'].toString(),
        name: j['name'] ?? 'Goal',
        target: (j['target'] as num?)?.toDouble() ?? 0,
        saved: (j['saved'] as num?)?.toDouble() ?? 0,
      );
}

class LendEntry {
  final String id;
  String person;
  double amount;
  String direction; // 'lent' (they owe me) | 'borrowed' (I owe them)
  String? note;
  bool settled;
  DateTime date;

  LendEntry({
    required this.id,
    required this.person,
    required this.amount,
    required this.direction,
    this.note,
    this.settled = false,
    required this.date,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'person': person,
        'amount': amount,
        'direction': direction,
        'note': note,
        'settled': settled,
        'date': date.toIso8601String(),
      };

  factory LendEntry.fromJson(Map<String, dynamic> j) => LendEntry(
        id: j['id'].toString(),
        person: j['person'] ?? '',
        amount: (j['amount'] as num?)?.toDouble() ?? 0,
        direction: j['direction'] ?? 'lent',
        note: j['note'],
        settled: j['settled'] == true,
        date: DateTime.tryParse(j['date']?.toString() ?? '') ?? DateTime.now(),
      );
}

class LocalStore {
  static const _kGoals = 'savingsGoals';
  static const _kLends = 'nebula_lend_entries';

  Future<List<SavingsGoal>> loadGoals() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kGoals);
    if (raw == null) return [];
    try {
      return (jsonDecode(raw) as List)
          .map((e) => SavingsGoal.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> saveGoals(List<SavingsGoal> goals) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kGoals, jsonEncode(goals.map((g) => g.toJson()).toList()));
  }

  Future<List<LendEntry>> loadLends() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kLends);
    if (raw == null) return [];
    try {
      return (jsonDecode(raw) as List)
          .map((e) => LendEntry.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> saveLends(List<LendEntry> lends) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kLends, jsonEncode(lends.map((l) => l.toJson()).toList()));
  }
}
