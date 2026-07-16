import 'dart:math' as math;
import 'dart:ui' show Tangent;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme.dart';

/// NEBULA — the 5-second cinematic opening, ported from the web app.
///
/// Timeline (controller t = 0..1 over 5 s):
///   0.00–0.08  fade into the 3D world (grid floor, stars, aurora)
///   0.06–0.62  stock line draws upward; runner sprints along it (PathMetrics)
///   0.62–0.68  the CATCH — flare ring + particle burst at the tip
///   0.65–0.76  white flash
///   0.70–0.92  NEBULA letter-by-letter reveal
///   0.92–1.00  zoom-through into the app
///
/// Tap anywhere or the Skip pill to skip. Honors "reduce animations".
class SplashScreen extends StatefulWidget {
  final VoidCallback onDone;
  const SplashScreen({super.key, required this.onDone});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c;
  bool _done = false;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: const Duration(seconds: 5))
      ..addStatusListener((s) {
        if (s == AnimationStatus.completed) _finish();
      })
      ..forward();
  }

  void _finish() {
    if (_done) return;
    _done = true;
    widget.onDone();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduced = MediaQuery.of(context).disableAnimations;
    if (reduced) {
      Future.delayed(const Duration(milliseconds: 1200), _finish);
      return _StaticLogo();
    }

    return GestureDetector(
      onTap: _finish,
      child: Scaffold(
        backgroundColor: const Color(0xFF04040C),
        body: Stack(
          fit: StackFit.expand,
          children: [
            AnimatedBuilder(
              animation: _c,
              builder: (_, __) => CustomPaint(
                painter: _CinematicPainter(_c.value),
              ),
            ),
            // NEBULA letters
            AnimatedBuilder(
              animation: _c,
              builder: (_, __) => _LogoReveal(t: _c.value),
            ),
            // white flash
            AnimatedBuilder(
              animation: _c,
              builder: (_, __) {
                final f = _flashOpacity(_c.value);
                return f <= 0
                    ? const SizedBox.shrink()
                    : Container(color: Colors.white.withValues(alpha: f));
              },
            ),
            // Skip pill
            Positioned(
              top: MediaQuery.of(context).padding.top + 12,
              right: 16,
              child: GestureDetector(
                onTap: _finish,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                  decoration: BoxDecoration(
                    color: NebulaColors.indigo.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: NebulaColors.indigoLight.withValues(alpha: 0.3)),
                  ),
                  child: const Text('Skip',
                      style: TextStyle(
                          color: Color(0xD9C7D2FE),
                          fontSize: 12,
                          fontWeight: FontWeight.w600)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  double _flashOpacity(double t) {
    // flash window 0.65–0.76, peak at 0.68
    if (t < 0.65 || t > 0.76) return 0;
    if (t < 0.68) return (t - 0.65) / 0.03;
    return 1 - (t - 0.68) / 0.08;
  }
}

// ═══════════════════ NEBULA letter reveal (widget layer) ═══════════════════

class _LogoReveal extends StatelessWidget {
  final double t;
  const _LogoReveal({required this.t});

  static const _letters = ['N', 'E', 'B', 'U', 'L', 'A'];

  @override
  Widget build(BuildContext context) {
    if (t < 0.70) return const SizedBox.shrink();
    // scene zoom-out at the end
    final zoom = t > 0.92 ? 1 + (t - 0.92) / 0.08 * 0.25 : 1.0;
    final fade = t > 0.92 ? 1 - (t - 0.92) / 0.08 : 1.0;

    return Opacity(
      opacity: fade.clamp(0, 1),
      child: Transform.scale(
        scale: zoom,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(_letters.length, (i) {
                  // stagger each letter over 0.70–0.86
                  final start = 0.70 + i * 0.018;
                  final p = ((t - start) / 0.10).clamp(0.0, 1.0);
                  final eased = Curves.easeOutBack.transform(p);
                  return Transform(
                    alignment: Alignment.center,
                    transform: Matrix4.identity()
                      ..setEntry(3, 2, 0.002)
                      ..rotateX((1 - eased) * -1.4)
                      ..translateByDouble(0.0, (1 - eased) * 26, 0.0, 1.0),
                    child: Opacity(
                      opacity: p,
                      child: ShaderMask(
                        shaderCallback: (r) => const LinearGradient(
                          colors: [Color(0xFFE0E7FF), Color(0xFFA5B4FC), Color(0xFF6EE7B7)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ).createShader(r),
                        child: Text(
                          _letters[i],
                          style: GoogleFonts.spaceGrotesk(
                            fontSize: 64,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: -1,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 6),
              Opacity(
                opacity: ((t - 0.82) / 0.06).clamp(0.0, 1.0),
                child: Text('F I N A N C E',
                    style: GoogleFonts.spaceGrotesk(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 8,
                      color: const Color(0xBFA5B4FC),
                    )),
              ),
              const SizedBox(height: 20),
              Opacity(
                opacity: ((t - 0.85) / 0.05).clamp(0.0, 1.0),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: NebulaColors.emerald.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: NebulaColors.emerald.withValues(alpha: 0.25)),
                  ),
                  child: Text('CATCH THE MARKET',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2.5,
                        color: NebulaColors.emeraldLight,
                      )),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════ the cinematic scene (canvas layer) ═══════════════════

class _CinematicPainter extends CustomPainter {
  final double t;
  _CinematicPainter(this.t);

  static final _rng = math.Random(7);
  static final List<List<double>> _stars = List.generate(
    70,
    (_) => [_rng.nextDouble(), _rng.nextDouble(), _rng.nextDouble() * 1.2 + 0.4, _rng.nextDouble() * math.pi * 2],
  );

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    final sceneAlpha = _sceneAlpha();
    if (sceneAlpha <= 0) return;

    // entrance fade
    final entry = (t / 0.08).clamp(0.0, 1.0);
    final alpha = sceneAlpha * entry;

    _paintAurora(canvas, size, alpha);
    _paintStars(canvas, size, alpha);
    _paintFloor(canvas, size, alpha);

    // the stock line the runner chases
    final path = _stockPath(w, h);
    final metric = path.computeMetrics().first;
    final drawP = Curves.easeInOut.transform(((t - 0.06) / 0.56).clamp(0.0, 1.0));
    final len = metric.length * drawP;

    if (drawP > 0) {
      final partial = metric.extractPath(0, len);

      // area fill under the line
      if (drawP > 0.15) {
        final fill = Path.from(partial)
          ..lineTo(metric.getTangentForOffset(len)!.position.dx, h)
          ..lineTo(w * 0.06, h)
          ..close();
        canvas.drawPath(
          fill,
          Paint()
            ..shader = LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                NebulaColors.indigo.withValues(alpha: 0.16 * alpha),
                NebulaColors.indigo.withValues(alpha: 0),
              ],
            ).createShader(Rect.fromLTWH(0, 0, w, h)),
        );
      }

      // glow pass + core line
      final linePaint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..shader = LinearGradient(
          colors: [
            NebulaColors.indigo.withValues(alpha: 0.25 * alpha),
            NebulaColors.indigoLight.withValues(alpha: alpha),
            NebulaColors.emeraldLight.withValues(alpha: alpha),
          ],
        ).createShader(Rect.fromLTWH(0, 0, w, h));
      canvas.drawPath(
          partial,
          Paint()
            ..style = PaintingStyle.stroke
            ..strokeCap = StrokeCap.round
            ..strokeWidth = 10
            ..color = NebulaColors.indigo.withValues(alpha: 0.25 * alpha)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8));
      canvas.drawPath(partial, linePaint..strokeWidth = 3.5);

      // tip + runner
      final tan = metric.getTangentForOffset(len);
      if (tan != null) {
        _paintTip(canvas, tan.position, alpha);
        if (t < 0.66) _paintRunner(canvas, tan, alpha);
      }
    }

    // the catch
    final endTan = metric.getTangentForOffset(metric.length);
    if (endTan != null && t >= 0.60) {
      _paintCatch(canvas, endTan.position, alpha);
    }
  }

  double _sceneAlpha() {
    if (t < 0.66) return 1;
    if (t < 0.72) return 1 - (t - 0.66) / 0.06; // hand over to the flash
    return 0;
  }

  Path _stockPath(double w, double h) => Path()
    ..moveTo(w * 0.06, h * 0.76)
    ..cubicTo(w * 0.22, h * 0.73, w * 0.28, h * 0.66, w * 0.40, h * 0.60)
    ..cubicTo(w * 0.52, h * 0.54, w * 0.58, h * 0.46, w * 0.68, h * 0.40)
    ..cubicTo(w * 0.78, h * 0.34, w * 0.82, h * 0.28, w * 0.86, h * 0.24);

  void _paintAurora(Canvas canvas, Size size, double a) {
    void orb(Offset c, double r, Color color) {
      canvas.drawCircle(
          c,
          r,
          Paint()
            ..shader = RadialGradient(colors: [color.withValues(alpha: color.a * a), color.withValues(alpha: 0)])
                .createShader(Rect.fromCircle(center: c, radius: r)));
    }

    orb(Offset(size.width * 0.25, size.height * 0.2), size.width * 0.5, const Color(0x336366F1));
    orb(Offset(size.width * 0.8, size.height * 0.7), size.width * 0.45, const Color(0x298B5CF6));
  }

  void _paintStars(Canvas canvas, Size size, double a) {
    final p = Paint();
    for (final s in _stars) {
      final tw = 0.5 + 0.5 * math.sin(t * 12 + s[3]);
      p.color = Colors.white.withValues(alpha: (0.15 + 0.4 * tw) * a);
      canvas.drawCircle(Offset(s[0] * size.width, s[1] * size.height), s[2], p);
    }
  }

  void _paintFloor(Canvas canvas, Size size, double a) {
    final w = size.width, h = size.height;
    final horizon = h * 0.55;
    final p = Paint()
      ..strokeWidth = 1
      ..color = NebulaColors.indigo.withValues(alpha: 0.10 * a);

    // horizontal lines with perspective spacing, scrolling toward the viewer
    final scroll = (t * 6) % 1.0;
    for (var i = 0; i < 14; i++) {
      final f = (i + scroll) / 14;
      final y = horizon + math.pow(f, 2.2) * (h - horizon);
      canvas.drawLine(Offset(0, y), Offset(w, y), p);
    }
    // converging verticals
    for (var i = -6; i <= 6; i++) {
      final xBottom = w / 2 + i * w * 0.16;
      canvas.drawLine(Offset(w / 2 + i * w * 0.02, horizon), Offset(xBottom, h), p);
    }
  }

  void _paintTip(Canvas canvas, Offset pos, double a) {
    canvas.drawCircle(
        pos, 12, Paint()..color = NebulaColors.emeraldLight.withValues(alpha: 0.25 * a)..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6));
    canvas.drawCircle(pos, 5, Paint()..color = NebulaColors.emeraldLight.withValues(alpha: a));
  }

  /// Stick-figure sprinter drawn feet-down at the tangent, leaning into the climb.
  void _paintRunner(Canvas canvas, Tangent tan, double a) {
    final pos = tan.position;
    final angle = tan.angle; // path angle (canvas y-down)

    canvas.save();
    canvas.translate(pos.dx, pos.dy);
    canvas.rotate(-angle * 0.7); // partial lean into the slope
    canvas.translate(-14, -6); // trail slightly behind the tip

    final white = Paint()
      ..color = const Color(0xFFEEF2FF).withValues(alpha: a)
      ..strokeWidth = 3.4
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    final dim = Paint()
      ..color = const Color(0xFFC7D2FE).withValues(alpha: 0.85 * a)
      ..strokeWidth = 3.2
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    // sprint cycle
    final ph = t * 62;
    final swing = math.sin(ph);
    final swingB = math.sin(ph + math.pi);

    // head + torso
    canvas.drawCircle(Offset(2, -30), 4.6, Paint()..color = const Color(0xFFEEF2FF).withValues(alpha: a));
    canvas.drawLine(const Offset(1, -25), const Offset(-1, -11), white..strokeWidth = 4);

    // arms (opposite phase)
    _limb(canvas, const Offset(0, -22), swing * 0.9, 8, 7, white..strokeWidth = 3.2);
    _limb(canvas, const Offset(0, -22), swingB * 0.9, 8, 7, dim);
    // legs
    _limb(canvas, const Offset(-1, -11), swingB * 0.8, 9, 8, white..strokeWidth = 3.4);
    _limb(canvas, const Offset(-1, -11), swing * 0.8, 9, 8, dim..strokeWidth = 3.4);

    canvas.restore();
  }

  void _limb(Canvas canvas, Offset joint, double swing, double upper, double lower, Paint p) {
    final a1 = math.pi / 2 + swing; // hang down + swing
    final mid = joint + Offset(math.cos(a1) * upper, math.sin(a1) * upper);
    final a2 = a1 + 0.6 * (swing.abs() + 0.3);
    final end = mid + Offset(math.cos(a2) * lower, math.sin(a2) * lower);
    canvas.drawLine(joint, mid, p);
    canvas.drawLine(mid, end, p);
  }

  void _paintCatch(Canvas canvas, Offset pos, double a) {
    final p = ((t - 0.60) / 0.08).clamp(0.0, 1.0);
    final eased = Curves.easeOutCubic.transform(p);

    // expanding shockwave ring
    canvas.drawCircle(
        pos,
        6 + eased * 60,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3 * (1 - eased) + 0.5
          ..color = NebulaColors.emeraldLight.withValues(alpha: (1 - eased) * a));

    // particle burst
    const colors = [NebulaColors.emeraldLight, NebulaColors.indigoLight, NebulaColors.violetLight, Color(0xFFF0ABFC)];
    for (var i = 0; i < 14; i++) {
      final ang = i / 14 * math.pi * 2;
      final dist = eased * (40 + (i % 3) * 22);
      canvas.drawCircle(
          pos + Offset(math.cos(ang) * dist, math.sin(ang) * dist),
          (i % 3 == 0 ? 3.0 : 2.0) * (1 - eased * 0.7),
          Paint()..color = colors[i % 4].withValues(alpha: (1 - eased) * a));
    }
  }

  @override
  bool shouldRepaint(covariant _CinematicPainter old) => old.t != t;
}

class _StaticLogo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF05050E),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 76, height: 76,
              decoration: BoxDecoration(
                gradient: NebulaColors.primaryGradient,
                borderRadius: BorderRadius.circular(22),
                boxShadow: [BoxShadow(color: NebulaColors.indigo.withValues(alpha: 0.4), blurRadius: 50)],
              ),
              child: const Icon(Icons.auto_awesome, color: Colors.white, size: 34),
            ),
            const SizedBox(height: 20),
            Text('NEBULA',
                style: GoogleFonts.spaceGrotesk(
                    fontSize: 34, fontWeight: FontWeight.w900, color: Colors.white)),
            Text('FINANCE',
                style: GoogleFonts.spaceGrotesk(
                    fontSize: 11, letterSpacing: 6, color: const Color(0xB3A5B4FC))),
          ],
        ),
      ),
    );
  }
}
