import 'package:flutter_sms_inbox/flutter_sms_inbox.dart';
import 'package:permission_handler/permission_handler.dart';

/// A bank transaction parsed out of an SMS.
class ParsedBankSms {
  final String bank;
  final double amount;
  final String type; // 'income' | 'expense'
  final String? merchant;
  final String? account; // masked, e.g. "XX1234"
  final DateTime date;
  final String raw;

  /// Set true by the UI when the user selects it for import.
  bool selected;

  ParsedBankSms({
    required this.bank,
    required this.amount,
    required this.type,
    this.merchant,
    this.account,
    required this.date,
    required this.raw,
    this.selected = true,
  });
}

/// Reads the Android SMS inbox and extracts bank debit/credit messages.
///
/// Detection is regex-based over common Indian bank + UPI formats:
///   "Rs.500.00 debited from A/c XX1234 on 04-07-26 to VPA merchant@upi"
///   "INR 1,250.00 credited to your A/c XXXX5678 ..."
///   "Sent Rs.120.00 From HDFC Bank A/C x0821 To Swiggy ..."
/// Nothing leaves the device except transactions the user explicitly imports.
class SmsService {
  final SmsQuery _query = SmsQuery();

  // Senders that look like banks/payment services (DLT headers like VM-HDFCBK).
  static final _bankSenderRe = RegExp(
    r'(HDFC|SBI|ICICI|AXIS|KOTAK|PNB|BOB|IDFC|YES|INDUS|FEDERAL|CANARA|UNION|RBL|CITI|HSBC|SC|PAYTM|PHONEPE|GPAY|BHIM|UPI|SBIINB|CBSSBI|ATMSBI)',
    caseSensitive: false,
  );

  static final _amountRe = RegExp(
    r'(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)',
    caseSensitive: false,
  );

  static final _debitRe = RegExp(
    r'\b(debited|debit|spent|sent|paid|purchase|withdrawn|txn of .* at)\b',
    caseSensitive: false,
  );

  static final _creditRe = RegExp(
    r'\b(credited|credit|received|deposited|refund(?:ed)?)\b',
    caseSensitive: false,
  );

  static final _accountRe = RegExp(
    r'(?:a\/?c(?:count)?|card)\s*(?:no\.?\s*)?[x\*]*(\d{3,6})',
    caseSensitive: false,
  );

  static final _merchantRe = RegExp(
    r'(?:\bto|\bat|towards|VPA)\s+([A-Za-z0-9@ ._\-&]{3,40}?)(?:\s+on|\s+ref|\s+upi|\s*\.|,|$)',
    caseSensitive: false,
  );

  /// Ask for READ_SMS. Returns true if granted.
  Future<bool> requestPermission() async {
    final status = await Permission.sms.request();
    return status.isGranted;
  }

  Future<bool> hasPermission() => Permission.sms.isGranted;

  /// Scan the inbox (newest [limit] messages, within [days] days)
  /// and return parsed bank transactions, newest first.
  Future<List<ParsedBankSms>> scanInbox({int limit = 500, int days = 60}) async {
    final messages = await _query.querySms(
      kinds: [SmsQueryKind.inbox],
      count: limit,
    );

    final cutoff = DateTime.now().subtract(Duration(days: days));
    final results = <ParsedBankSms>[];

    for (final SmsMessage m in messages) {
      final body = m.body ?? '';
      final sender = m.address ?? '';
      final date = m.date ?? DateTime.now();
      if (date.isBefore(cutoff)) continue;

      // Must look like a bank sender OR contain strong banking keywords.
      final looksBanky = _bankSenderRe.hasMatch(sender) ||
          (body.toLowerCase().contains('a/c') && _amountRe.hasMatch(body));
      if (!looksBanky) continue;

      final parsed = parseBody(body, sender: sender, date: date);
      if (parsed != null) results.add(parsed);
    }

    results.sort((a, b) => b.date.compareTo(a.date));
    return results;
  }

  /// Parse a single SMS body. Exposed for unit testing.
  ParsedBankSms? parseBody(String body, {String sender = '', DateTime? date}) {
    final amountMatch = _amountRe.firstMatch(body);
    if (amountMatch == null) return null;

    final amount = double.tryParse(amountMatch.group(1)!.replaceAll(',', ''));
    if (amount == null || amount <= 0) return null;

    final isDebit = _debitRe.hasMatch(body);
    final isCredit = _creditRe.hasMatch(body);
    if (!isDebit && !isCredit) return null; // OTPs, promos, balances → skip
    // If both appear ("credited to beneficiary ... debited from your a/c"),
    // treat as expense: the user's account lost money.
    final type = isDebit ? 'expense' : 'income';

    final bankMatch = _bankSenderRe.firstMatch(sender) ?? _bankSenderRe.firstMatch(body);
    final account = _accountRe.firstMatch(body)?.group(1);
    var merchant = _merchantRe.firstMatch(body)?.group(1)?.trim();
    if (merchant != null && merchant.length > 32) {
      merchant = merchant.substring(0, 32);
    }

    return ParsedBankSms(
      bank: bankMatch?.group(1)?.toUpperCase() ?? 'BANK',
      amount: amount,
      type: type,
      merchant: merchant,
      account: account != null ? 'XX$account' : null,
      date: date ?? DateTime.now(),
      raw: body,
    );
  }
}
