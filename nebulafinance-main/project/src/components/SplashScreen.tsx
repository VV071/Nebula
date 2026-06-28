import { useEffect, useState, useRef } from 'react';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface SplashScreenProps {
  onDone: () => void;
}

/* ---------- static data ---------- */
const TICKERS = [
  { sym: 'RELIANCE', val: '₹2,845', chg: '+1.2%', up: true },
  { sym: 'TCS', val: '₹3,912', chg: '+0.8%', up: true },
  { sym: 'HDFC BANK', val: '₹1,680', chg: '-0.3%', up: false },
  { sym: 'INFY', val: '₹1,543', chg: '+2.1%', up: true },
  { sym: 'ICICIBANK', val: '₹1,102', chg: '+0.5%', up: true },
  { sym: 'WIPRO', val: '₹479', chg: '-0.7%', up: false },
  { sym: 'NIFTY 50', val: '22,450', chg: '+0.56%', up: true },
  { sym: 'SENSEX', val: '73,852', chg: '+0.43%', up: true },
  { sym: 'BAJFINANCE', val: '₹7,230', chg: '+1.8%', up: true },
  { sym: 'TITAN', val: '₹3,456', chg: '-0.2%', up: false },
  { sym: 'HCLTECH', val: '₹1,328', chg: '+1.1%', up: true },
  { sym: 'MARUTI', val: '₹10,240', chg: '+0.3%', up: true },
];

/* 3D floating panels shown at the corners */
const PANELS = [
  { sym: 'NIFTY 50', price: '22,450', chg: '+125.40', pct: '+0.56%', up: true,  style: { top: '8%',  left: '2%',  transform: 'perspective(700px) rotateX(18deg) rotateY(28deg) rotateZ(-6deg)' } },
  { sym: 'TCS.NS',   price: '₹3,912', chg: '+31.50',  pct: '+0.81%', up: true,  style: { top: '12%', right: '2%', transform: 'perspective(700px) rotateX(16deg) rotateY(-26deg) rotateZ(5deg)' } },
  { sym: 'HDFC BANK',price: '₹1,680', chg: '-5.20',   pct: '-0.31%', up: false, style: { bottom: '14%', left: '2%', transform: 'perspective(700px) rotateX(-14deg) rotateY(22deg) rotateZ(4deg)' } },
  { sym: 'RELIANCE', price: '₹2,845', chg: '+33.60',  pct: '+1.20%', up: true,  style: { bottom: '14%', right: '2%', transform: 'perspective(700px) rotateX(-16deg) rotateY(-24deg) rotateZ(-5deg)' } },
];

/* SVG rising chart path */
const CHART_POINTS = '0,80 50,68 110,72 170,52 230,58 290,38 350,44 420,22 490,30 560,12 630,18 680,5';

/* Generate random stars */
function makeStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    r: Math.random() * 1.4 + 0.3,
    opacity: Math.random() * 0.6 + 0.2,
    dur: Math.random() * 3 + 2,
  }));
}
const STARS = makeStars(120);

/* ---------- sub-components ---------- */
function FloatingPanel({ sym, price, chg, pct, up, style, delay }: any) {
  return (
    <div
      className="absolute hidden lg:block select-none pointer-events-none"
      style={{
        ...style,
        animation: `floatPanel ${4 + delay}s ease-in-out ${delay}s infinite`,
        transition: 'transform 0.3s',
        zIndex: 2,
      }}
    >
      <div
        className="rounded-2xl px-4 py-3 min-w-[150px]"
        style={{
          background: 'rgba(15,15,25,0.78)',
          border: '1px solid rgba(99,102,241,0.25)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <p className="text-[10px] font-bold text-slate-400 mb-1 tracking-widest">{sym}</p>
        <p className="text-lg font-black font-mono text-white leading-none">{price}</p>
        <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {chg} <span className="opacity-70">({pct})</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- main component ---------- */
export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'visible' | 'fading'>('visible');
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fading'), 3200);
    const t2 = setTimeout(() => doneRef.current(), 3900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden select-none"
      style={{
        background: '#06060F',
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 0.72s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: phase === 'fading' ? 'none' : 'all',
      }}
    >
      {/* ── Aurora background ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse at 20% 15%, rgba(99,102,241,0.22) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 75%, rgba(139,92,246,0.18) 0%, transparent 50%),
          radial-gradient(ellipse at 60% 30%, rgba(16,185,129,0.08) 0%, transparent 40%)
        `,
      }} />

      {/* ── Star field ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        {STARS.map(s => (
          <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.opacity}>
            <animate attributeName="opacity" values={`${s.opacity};${s.opacity * 0.3};${s.opacity}`} dur={`${s.dur}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>

      {/* ── Grid overlay ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />

      {/* ── 3D floating stock panels ── */}
      {PANELS.map((p, i) => (
        <FloatingPanel key={p.sym} {...p} delay={i * 0.8} />
      ))}

      {/* ── Rising 3D chart line ── */}
      <div
        className="absolute inset-x-0 bottom-28 pointer-events-none"
        style={{
          height: 160,
          perspective: '600px',
          perspectiveOrigin: '50% 80%',
        }}
      >
        <svg
          viewBox="0 0 680 90"
          preserveAspectRatio="none"
          className="w-full h-full"
          style={{
            transform: 'rotateX(20deg) rotateY(-4deg)',
            transformStyle: 'preserve-3d',
            opacity: 0.28,
          }}
        >
          <defs>
            <linearGradient id="sg-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0" />
              <stop offset="35%" stopColor="#6366F1" stopOpacity="1" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="sg-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>
            <style>{`
              @keyframes drawChart { from { stroke-dashoffset: 1400 } to { stroke-dashoffset: 0 } }
              @keyframes fillChart { from { opacity:0 } 60% { opacity:1 } to { opacity:1 } }
              .sc-line { stroke-dasharray:1400; stroke-dashoffset:1400; animation: drawChart 2s cubic-bezier(0.4,0,0.2,1) 0.2s forwards }
              .sc-fill { opacity:0; animation: fillChart 2.2s ease 0.5s forwards }
            `}</style>
          </defs>
          <polygon className="sc-fill" points={`0,90 ${CHART_POINTS} 680,90`} fill="url(#sg-fill)" />
          <polyline className="sc-line" points={CHART_POINTS} fill="none" stroke="url(#sg-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* ── Center content ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
        style={{ zIndex: 10, animation: 'splashCenterIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' }}
      >
        {/* Logo orb with layered 3D depth */}
        <div className="relative mb-8" style={{ perspective: '400px' }}>
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-3xl animate-ping" style={{
            background: 'rgba(99,102,241,0.25)',
            animationDuration: '2.4s',
            borderRadius: '24px',
          }} />
          {/* Shadow depth layer */}
          <div className="absolute inset-0 rounded-3xl" style={{
            background: 'linear-gradient(135deg, #4338CA, #5B21B6)',
            transform: 'translate(6px, 8px) rotateX(10deg)',
            borderRadius: '22px',
            filter: 'blur(8px)',
            opacity: 0.5,
          }} />
          {/* Main orb */}
          <div
            className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 60%, #8B5CF6 100%)',
              boxShadow: '0 0 60px rgba(99,102,241,0.55), 0 0 120px rgba(99,102,241,0.22), inset 0 1px 0 rgba(255,255,255,0.25)',
              transform: 'rotateX(-4deg) rotateY(4deg)',
            }}
          >
            <Sparkles className="w-10 h-10 text-white drop-shadow-lg" />
          </div>
        </div>

        {/* App name */}
        <h1 className="text-5xl font-black tracking-tighter mb-2" style={{
          background: 'linear-gradient(135deg, #A5B4FC 0%, #C4B5FD 40%, #6EE7B7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.04em',
          textShadow: 'none',
        }}>
          Nebula Finance
        </h1>
        <p className="text-xs font-semibold mb-8" style={{ color: 'rgba(161,161,200,0.7)', letterSpacing: '0.22em' }}>
          SMART MONEY · REAL INSIGHTS
        </p>

        {/* Market status badge */}
        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-8" style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          boxShadow: '0 0 20px rgba(16,185,129,0.12)',
        }}>
          <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px #34D399', animation: 'pulse 2s infinite' }} />
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400" style={{ letterSpacing: '0.08em' }}>NSE &amp; BSE MARKETS LIVE</span>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#6366F1', animation: `dotBounce 1.4s ease-in-out ${i * 0.18}s infinite` }} />
          ))}
        </div>
      </div>

      {/* ── Ticker tape ── */}
      <div
        className="absolute bottom-0 left-0 right-0 overflow-hidden"
        style={{
          background: 'rgba(4,4,14,0.9)',
          borderTop: '1px solid rgba(99,102,241,0.18)',
          height: '44px',
          zIndex: 20,
        }}
      >
        <div
          className="flex items-center h-full"
          style={{ animation: 'tickerRoll 28s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}
        >
          {[...TICKERS, ...TICKERS].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-5 text-xs font-mono"
              style={{ borderRight: '1px solid rgba(99,102,241,0.12)', height: '100%', display: 'inline-flex', alignItems: 'center' }}>
              <span className="font-bold" style={{ color: 'rgba(240,240,255,0.9)' }}>{t.sym}</span>
              <span style={{ color: 'rgba(140,140,180,0.7)' }}>{t.val}</span>
              <span style={{ color: t.up ? '#34D399' : '#F87171', fontWeight: 700 }}>{t.chg}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes splashCenterIn {
          from { opacity: 0; transform: translateY(30px) scale(0.93); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    filter: blur(0); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.55); opacity: 0.4; }
          40%            { transform: scale(1.2);  opacity: 1; }
        }
        @keyframes tickerRoll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes floatPanel {
          0%, 100% { transform-origin: center; margin-top: 0px; }
          50%       { margin-top: -14px; }
        }
      `}</style>
    </div>
  );
}
