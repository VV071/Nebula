import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/api_client.dart';
import '../core/theme.dart';
import '../services/auth_service.dart';
import '../widgets/glass_card.dart';

class ProfileScreen extends StatelessWidget {
  final NebulaUser user;
  final VoidCallback onLogout;
  const ProfileScreen({super.key, required this.user, required this.onLogout});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
        children: [
          const Text('Profile', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 16),
          GlassCard(
            padding: const EdgeInsets.all(20),
            child: Row(children: [
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  gradient: NebulaColors.primaryGradient,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Center(
                  child: Text(
                    (user.name ?? user.email)[0].toUpperCase(),
                    style: GoogleFonts.spaceGrotesk(
                        fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user.name ?? 'Nebula user',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    Text(user.email,
                        style: const TextStyle(
                            fontSize: 12.5, color: NebulaColors.textSecondary)),
                  ],
                ),
              ),
            ]),
          ),
          const SizedBox(height: 14),
          GlassCard(
            padding: EdgeInsets.zero,
            child: Column(children: [
              _row(Icons.dns_outlined, 'Backend', ApiConfig.baseUrl),
              Divider(height: 1, color: NebulaColors.indigo.withValues(alpha: 0.08)),
              _row(Icons.sms_outlined, 'SMS import', 'Android only · on-device parsing'),
              Divider(height: 1, color: NebulaColors.indigo.withValues(alpha: 0.08)),
              _row(Icons.casino_outlined, 'Bidding currency', 'Fake ₮ only — never real money'),
            ]),
          ),
          const SizedBox(height: 20),
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
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.logout, size: 17, color: NebulaColors.rose),
                    SizedBox(width: 8),
                    Text('Sign Out',
                        style: TextStyle(
                            color: NebulaColors.rose,
                            fontWeight: FontWeight.w700,
                            fontSize: 14.5)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _row(IconData icon, String title, String subtitle) {
    return ListTile(
      leading: Icon(icon, size: 20, color: NebulaColors.indigoLight),
      title: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle,
          style: const TextStyle(fontSize: 11.5, color: NebulaColors.textTertiary)),
      dense: true,
    );
  }
}
