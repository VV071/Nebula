import 'dart:ui';
import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../services/auth_service.dart';
import 'dashboard_screen.dart';
import 'transactions_screen.dart';
import 'bidding_screen.dart';
import 'market_screen.dart';
import 'more_screen.dart';

/// Bottom-nav shell — Home / Transactions / Bidding / Market / More.
class Shell extends StatefulWidget {
  final NebulaUser user;
  final VoidCallback onLogout;
  const Shell({super.key, required this.user, required this.onLogout});

  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      DashboardScreen(user: widget.user),
      const TransactionsScreen(),
      const BiddingScreen(),
      const MarketScreen(),
      MoreScreen(user: widget.user, onLogout: widget.onLogout),
    ];

    return Scaffold(
      extendBody: true,
      body: AuroraBackground(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 320),
          switchInCurve: Curves.easeOutCubic,
          switchOutCurve: Curves.easeInCubic,
          transitionBuilder: (child, anim) => FadeTransition(
            opacity: anim,
            child: SlideTransition(
              position: Tween(begin: const Offset(0, 0.03), end: Offset.zero).animate(anim),
              child: child,
            ),
          ),
          child: KeyedSubtree(key: ValueKey(_index), child: pages[_index]),
        ),
      ),
      bottomNavigationBar: ClipRRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xE6060609),
              border: Border(
                  top: BorderSide(color: NebulaColors.indigoLight.withValues(alpha: 0.12))),
            ),
            child: NavigationBarTheme(
              data: NavigationBarThemeData(
                backgroundColor: Colors.transparent,
                indicatorColor: NebulaColors.indigo.withValues(alpha: 0.18),
                labelTextStyle: WidgetStatePropertyAll(
                  TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: NebulaColors.textSecondary),
                ),
              ),
              child: NavigationBar(
                height: 64,
                selectedIndex: _index,
                onDestinationSelected: (i) => setState(() => _index = i),
                destinations: const [
                  NavigationDestination(
                      icon: Icon(Icons.dashboard_outlined),
                      selectedIcon: Icon(Icons.dashboard, color: NebulaColors.indigoLight),
                      label: 'Home'),
                  NavigationDestination(
                      icon: Icon(Icons.receipt_long_outlined),
                      selectedIcon: Icon(Icons.receipt_long, color: NebulaColors.indigoLight),
                      label: 'Txns'),
                  NavigationDestination(
                      icon: Icon(Icons.sports_kabaddi_outlined),
                      selectedIcon: Icon(Icons.sports_kabaddi, color: NebulaColors.indigoLight),
                      label: 'Bidding'),
                  NavigationDestination(
                      icon: Icon(Icons.query_stats_outlined),
                      selectedIcon: Icon(Icons.query_stats, color: NebulaColors.indigoLight),
                      label: 'Market'),
                  NavigationDestination(
                      icon: Icon(Icons.grid_view_outlined),
                      selectedIcon: Icon(Icons.grid_view_rounded, color: NebulaColors.indigoLight),
                      label: 'More'),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
