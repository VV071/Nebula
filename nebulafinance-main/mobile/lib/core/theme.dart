import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Nebula design tokens — mirrors the web app's tailwind config:
/// indigo/violet primaries, emerald accents, deep-space dark glass.
class NebulaColors {
  static const bg = Color(0xFF060609);
  static const bgLight = Color(0xFF0A0A14);
  static const indigo = Color(0xFF6366F1);
  static const indigoLight = Color(0xFF818CF8);
  static const violet = Color(0xFF7C3AED);
  static const violetLight = Color(0xFFA78BFA);
  static const emerald = Color(0xFF10B981);
  static const emeraldLight = Color(0xFF34D399);
  static const rose = Color(0xFFF43F5E);
  static const amber = Color(0xFFF59E0B);
  static const textPrimary = Color(0xFFF4F4FF);
  static const textSecondary = Color(0xFFA1A1BB);
  static const textTertiary = Color(0xFF52525B);
  static const surface = Color(0x0AFFFFFF); // rgba(255,255,255,0.04)
  static const surfaceBorder = Color(0x26818CF8); // indigo @ 15%

  static const primaryGradient = LinearGradient(
    colors: [indigo, violet],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

ThemeData nebulaTheme() {
  final base = ThemeData.dark(useMaterial3: true);
  final textTheme = GoogleFonts.spaceGroteskTextTheme(base.textTheme).apply(
    bodyColor: NebulaColors.textPrimary,
    displayColor: NebulaColors.textPrimary,
  );

  return base.copyWith(
    scaffoldBackgroundColor: NebulaColors.bg,
    colorScheme: base.colorScheme.copyWith(
      primary: NebulaColors.indigo,
      secondary: NebulaColors.emerald,
      surface: NebulaColors.bgLight,
      error: NebulaColors.rose,
    ),
    textTheme: textTheme,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: NebulaColors.surface,
      hintStyle: const TextStyle(color: NebulaColors.textTertiary),
      labelStyle: const TextStyle(color: NebulaColors.textSecondary),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: NebulaColors.surfaceBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: NebulaColors.surfaceBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: NebulaColors.indigo, width: 1.5),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: NebulaColors.bgLight,
      contentTextStyle: const TextStyle(color: NebulaColors.textPrimary),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  );
}

/// Aurora backdrop used behind every screen — matches the web body gradients.
class AuroraBackground extends StatelessWidget {
  final Widget child;
  const AuroraBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(color: NebulaColors.bg),
      child: Stack(
        children: [
          Positioned(
            top: -120, left: -80,
            child: _orb(const Color(0x2E6366F1), 300),
          ),
          Positioned(
            top: 60, right: -100,
            child: _orb(const Color(0x248B5CF6), 260),
          ),
          Positioned(
            bottom: -80, left: 40,
            child: _orb(const Color(0x1410B981), 240),
          ),
          child,
        ],
      ),
    );
  }

  Widget _orb(Color color, double size) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(colors: [color, color.withAlpha(0)]),
        ),
      );
}
