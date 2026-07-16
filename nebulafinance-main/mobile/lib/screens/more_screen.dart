import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme.dart';
import '../services/auth_service.dart';
import '../widgets/glass_card.dart';
import 'accounts_screen.dart';
import 'insights_screen.dart';
import 'budgets_screen.dart';
import 'goals_screen.dart';
import 'lends_screen.dart';
import 'profile_screen.dart';

/// Hub for everything that doesn't fit the bottom nav:
/// Accounts, Insights, Budgets, Goals, Lend Tracker, Profile.
class MoreScreen extends StatelessWidget {
  final NebulaUser user;
  final VoidCallback onLogout;
  const MoreScreen({super.key, required this.user, required this.onLogout});

  void _push(BuildContext context, Widget screen) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }

  @override
  Widget build(BuildContext context) {
    final tiles = [
      (Icons.account_balance_outlined, 'Accounts', 'Balances & net worth',
          NebulaColors.indigoLight, () => _push(context, const AccountsScreen())),
      (Icons.lightbulb_outline, 'Insights', 'AI spending analysis',
          NebulaColors.amber, () => _push(context, const InsightsScreen())),
      (Icons.pie_chart_outline, 'Budgets', 'Monthly category limits',
          NebulaColors.violetLight, () => _push(context, const BudgetsScreen())),
      (Icons.flag_outlined, 'Goals', 'Savings targets',
          NebulaColors.emeraldLight, () => _push(context, const GoalsScreen())),
      (Icons.handshake_outlined, 'Lend Tracker', 'Who owes whom',
          NebulaColors.rose, () => _push(context, const LendsScreen())),
    ];

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
        children: [
          const Text('More', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 16),

          // profile header → full profile screen
          GlassCard(
            onTap: () => _push(
              context,
              Scaffold(
                appBar: AppBar(
                    title: const Text('Profile',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700))),
                body: AuroraBackground(
                    child: ProfileScreen(user: user, onLogout: onLogout)),
              ),
            ),
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(
                  gradient: NebulaColors.primaryGradient,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Center(
                  child: Text((user.name ?? user.email)[0].toUpperCase(),
                      style: GoogleFonts.spaceGrotesk(
                          fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white)),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user.name ?? 'Nebula user',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                    Text(user.email,
                        style: const TextStyle(
                            fontSize: 12, color: NebulaColors.textSecondary)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: NebulaColors.textTertiary),
            ]),
          ),
          const SizedBox(height: 14),

          // feature tiles
          for (final (icon, title, subtitle, color, onTap) in tiles)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: GlassCard(
                onTap: onTap,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(children: [
                  Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, size: 20, color: color),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title,
                            style: const TextStyle(
                                fontSize: 14.5, fontWeight: FontWeight.w700)),
                        Text(subtitle,
                            style: const TextStyle(
                                fontSize: 11.5, color: NebulaColors.textTertiary)),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right,
                      size: 20, color: NebulaColors.textTertiary),
                ]),
              ),
            ),

          const SizedBox(height: 10),
          PressableScale(
            onTap: onLogout,
            child: Container(
              height: 48,
              decoration: BoxDecoration(
                color: NebulaColors.rose.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: NebulaColors.rose.withValues(alpha: 0.3)),
              ),
              child: const Center(
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.logout, size: 17, color: NebulaColors.rose),
                  SizedBox(width: 8),
                  Text('Sign Out',
                      style: TextStyle(
                          color: NebulaColors.rose,
                          fontWeight: FontWeight.w700,
                          fontSize: 14.5)),
                ]),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
