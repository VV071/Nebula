import '../core/api_client.dart';

class Account {
  final int id;
  final String name;
  final String type;
  final double balance;
  Account({required this.id, required this.name, required this.type, required this.balance});

  factory Account.fromJson(Map<String, dynamic> j) => Account(
        id: j['id'],
        name: j['name'] ?? 'Account',
        type: j['type'] ?? 'bank',
        balance: (j['balance'] as num?)?.toDouble() ?? 0,
      );
}

class Category {
  final int id;
  final String name;
  final String type;
  Category({required this.id, required this.name, required this.type});

  factory Category.fromJson(Map<String, dynamic> j) => Category(
        id: j['id'],
        name: j['name'] ?? '',
        type: j['type'] ?? 'expense',
      );
}

class Txn {
  final int id;
  final double amount;
  final String type; // income | expense
  final String? description;
  final String? categoryName;
  final DateTime date;
  Txn({
    required this.id,
    required this.amount,
    required this.type,
    this.description,
    this.categoryName,
    required this.date,
  });

  factory Txn.fromJson(Map<String, dynamic> j) => Txn(
        id: j['id'],
        amount: (j['amount'] as num?)?.toDouble() ?? 0,
        type: j['type'] ?? 'expense',
        description: j['description'],
        categoryName: j['category_name'] ?? j['category']?['name'],
        date: DateTime.tryParse(j['date']?.toString() ?? '') ?? DateTime.now(),
      );
}

class MonthlySummary {
  final double income;
  final double expense;
  MonthlySummary({required this.income, required this.expense});
  double get net => income - expense;
}

class Budget {
  final int categoryId;
  final String categoryName;
  final double limit;
  final double spent;
  final String period;
  Budget({
    required this.categoryId,
    required this.categoryName,
    required this.limit,
    required this.spent,
    required this.period,
  });

  double get remaining => limit - spent;
  double get percentUsed => limit <= 0 ? 0 : (spent / limit * 100);

  factory Budget.fromJson(Map<String, dynamic> j) => Budget(
        categoryId: j['category_id'],
        categoryName: j['category_name'] ?? 'Category',
        limit: (j['limit_amount'] as num?)?.toDouble() ?? 0,
        spent: (j['spent'] as num?)?.toDouble() ?? 0,
        period: j['period'] ?? 'monthly',
      );
}

class Insight {
  final int id;
  final String type; // warning | info | success …
  final String title;
  final String message;
  final String? suggestion;
  Insight({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.suggestion,
  });

  factory Insight.fromJson(Map<String, dynamic> j) => Insight(
        id: j['id'],
        type: j['type'] ?? 'info',
        title: j['title'] ?? '',
        message: j['message'] ?? '',
        suggestion: j['suggestion'],
      );
}

class FinanceService {
  final _api = ApiClient.instance;

  Future<List<Account>> getAccounts() async {
    final res = await _api.get('/api/accounts');
    final list = (res['data'] ?? res) as List;
    return list.map((e) => Account.fromJson(e)).toList();
  }

  Future<List<Category>> getCategories() async {
    final res = await _api.get('/api/categories');
    final list = (res['data'] ?? res) as List;
    return list.map((e) => Category.fromJson(e)).toList();
  }

  Future<List<Txn>> getTransactions() async {
    final res = await _api.get('/api/transactions');
    final list = (res['data'] ?? res) as List;
    return list.map((e) => Txn.fromJson(e)).toList();
  }

  Future<void> createTransaction({
    required int accountId,
    required int categoryId,
    required double amount,
    required String type,
    String? description,
    required DateTime date,
  }) async {
    await _api.post('/api/transactions', {
      'account_id': accountId,
      'category_id': categoryId,
      'amount': amount,
      'type': type,
      if (description != null) 'description': description,
      'date':
          '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}',
    });
  }

  Future<MonthlySummary> getCurrentSummary() async {
    final res = await _api.get('/api/summary/current');
    final d = res['data'] ?? res;
    return MonthlySummary(
      income: (d['total_income'] as num?)?.toDouble() ?? 0,
      expense: (d['total_expense'] as num?)?.toDouble() ?? 0,
    );
  }

  // ── Budgets ────────────────────────────────────────────────────────────────

  Future<List<Budget>> getBudgets() async {
    final res = await _api.get('/api/budgets');
    final list = (res['budgets'] ?? []) as List;
    return list.map((e) => Budget.fromJson(e)).toList();
  }

  Future<void> saveBudget({
    required int categoryId,
    required double limitAmount,
    String period = 'monthly',
  }) async {
    await _api.post('/api/budgets', {
      'category_id': categoryId,
      'limit_amount': limitAmount,
      'period': period,
    });
  }

  Future<void> deleteBudget(int categoryId) async {
    await _api.delete('/api/budgets/$categoryId');
  }

  // ── Insights ───────────────────────────────────────────────────────────────

  Future<List<Insight>> getInsights() async {
    final res = await _api.get('/api/insights');
    final list = (res['data'] ?? []) as List;
    return list.map((e) => Insight.fromJson(e)).toList();
  }

  Future<void> generateInsights() async {
    await _api.post('/api/insights/generate');
  }

  Future<void> dismissInsight(int id) async {
    await _api.patch('/api/insights/$id/dismiss');
  }
}
