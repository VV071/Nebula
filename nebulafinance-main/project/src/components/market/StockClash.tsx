/**
 * StockClash — live P&L race animation for a pending bid.
 *
 * Props:
 *   tickerA, tickerB  — the two stocks
 *   chosen            — which ticker the user backed
 *   stake             — amount staked (fake currency)
 *   bidId             — used to poll /api/bids/:id/pnl
 *   windowSeconds     — how long until the clash auto-settles (0 = manual only)
 *   onSettle          — called when the clash ends, passing { winner }
 *   potentialRange    — optional risk band from Phase 2 bet response
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, TrendingUp, TrendingDown, Loader2, Zap, Shield } from 'lucide-react';
import { biddingService } from '../../services/biddingService';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PnlSnapshot {
  pnlA: number;
  pnlB: number;
  priceA: number;
  priceB: number;
  edge: number;
}

interface PotentialRange {
  horizon_days: number;
  expected_move_pct: number;
  potential_up_value: number;
  potential_down_value: number;
  potential_swing: number;
  note: string;
}

interface StockClashProps {
  tickerA: string;
  tickerB: string;
  chosen: string;
  stake: number;
  bidId: number;
  windowSeconds?: number;
  onSettle: (result: { winner: string | null }) => void;
  potentialRange?: PotentialRange | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 15_000; // match server cache TTL

function fmtPnl(n: number) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}₮${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 50 : Math.min(Math.abs(value) / max, 1) * 100;
  const positive = value >= 0;
  return (
    <div className="h-2 w-full rounded-full bg-surfaceHover-light dark:bg-surfaceHover-dark overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${positive ? 'bg-emerald-500' : 'bg-rose-500'}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StockClash({
  tickerA, tickerB, chosen, bidId,
  windowSeconds = 0,
  onSettle,
  potentialRange,
}: StockClashProps) {
  const [pnl, setPnl]           = useState<PnlSnapshot | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [settled, setSettled]   = useState(false);
  const [settling, setSettling] = useState(false);
  const [timeLeft, setTimeLeft] = useState(windowSeconds);

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const settledRef = useRef(false);

  const fetchPnl = useCallback(async () => {
    try {
      const data = await biddingService.getPnl(bidId) as any;
      setPnl({
        pnlA:   data.pnlA,
        pnlB:   data.pnlB,
        priceA: data.priceA,
        priceB: data.priceB,
        edge:   data.edge,
      });
      setError('');
      // If the bid was already settled elsewhere, stop polling
      if (data.status !== 'pending') {
        stopPolling();
        setSettled(true);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [bidId]);

  function stopPolling() {
    if (pollRef.current)  clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  const handleSettle = useCallback(async () => {
    if (settledRef.current) return;
    settledRef.current = true;
    stopPolling();
    setSettling(true);
    try {
      await biddingService.settleBid(bidId);
      // Fetch final P&L snapshot
      const data = await biddingService.getPnl(bidId) as any;
      setPnl({ pnlA: data.pnlA, pnlB: data.pnlB, priceA: data.priceA, priceB: data.priceB, edge: data.edge });
      setSettled(true);
      const winner = data.edge > 0 ? chosen : data.edge < 0
        ? (chosen === tickerA ? tickerB : tickerA)
        : null;
      onSettle({ winner });
    } catch (e: any) {
      setError(e.message);
      settledRef.current = false;
    } finally {
      setSettling(false);
    }
  }, [bidId, chosen, tickerA, tickerB, onSettle]);

  useEffect(() => {
    fetchPnl();
    pollRef.current = setInterval(fetchPnl, POLL_INTERVAL_MS);

    if (windowSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            handleSettle();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return stopPolling;
  }, [fetchPnl, handleSettle, windowSeconds]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const chosenIsA   = chosen === tickerA;
  const chosenPnl   = chosenIsA ? pnl?.pnlA : pnl?.pnlB;
  const otherPnl    = chosenIsA ? pnl?.pnlB : pnl?.pnlA;
  const userWinning = (chosenPnl ?? 0) > (otherPnl ?? 0);
  const maxAbs      = Math.max(Math.abs(pnl?.pnlA ?? 0), Math.abs(pnl?.pnlB ?? 0), 1);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-card overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(124,58,237,0.08) 100%)' }}
      >
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-primary-500" />
          <span className="font-bold text-sm text-textPrimary-light dark:text-textPrimary-dark">
            Live Clash
          </span>
          <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
            {tickerA} vs {tickerB}
          </span>
        </div>
        {windowSeconds > 0 && !settled && (
          <span className="text-xs font-mono font-semibold text-amber-500">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        )}
        {!settled && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-textSecondary-light dark:text-textSecondary-dark">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Fetching live prices…</span>
          </div>
        ) : error ? (
          <p className="text-xs text-rose-500 text-center py-4">{error}</p>
        ) : pnl ? (
          <>
            {/* Stock A vs Stock B bars */}
            {[
              { ticker: tickerA, pnl: pnl.pnlA, price: pnl.priceA, isChosen: chosen === tickerA },
              { ticker: tickerB, pnl: pnl.pnlB, price: pnl.priceB, isChosen: chosen === tickerB },
            ].map(({ ticker, pnl: p, price, isChosen }) => (
              <div key={ticker} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-textPrimary-light dark:text-textPrimary-dark">
                      {ticker}
                    </span>
                    {isChosen && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                        Your pick
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark font-mono">
                      ₹{price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                    <motion.span
                      key={p}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className={`font-bold font-mono text-sm ${p >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                    >
                      {fmtPnl(p)}
                    </motion.span>
                    {p >= 0
                      ? <TrendingUp className="w-4 h-4 text-emerald-500" />
                      : <TrendingDown className="w-4 h-4 text-rose-500" />
                    }
                  </div>
                </div>
                <Bar value={p} max={maxAbs} />
              </div>
            ))}

            {/* Edge summary */}
            <AnimatePresence mode="wait">
              <motion.div
                key={userWinning ? 'winning' : 'losing'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={`rounded-button px-4 py-2.5 flex items-center justify-between text-sm font-semibold ${
                  userWinning
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {userWinning ? <Zap className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  {userWinning ? `${chosen} is ahead` : `${chosen} is behind`}
                </span>
                <span className="font-mono">
                  edge: {fmtPnl(pnl.edge)}
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Potential range */}
            {potentialRange && (
              <div className="rounded-button px-4 py-3 space-y-1 text-xs"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}
              >
                <p className="font-semibold text-textPrimary-light dark:text-textPrimary-dark flex items-center gap-1.5">
                  <span>Risk band estimate</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Not a prediction
                  </span>
                </p>
                <p className="text-textSecondary-light dark:text-textSecondary-dark">
                  Over {potentialRange.horizon_days}d the model estimates ±₮{potentialRange.potential_swing.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({potentialRange.expected_move_pct}%)
                </p>
                <p className="text-textSecondary-light dark:text-textSecondary-dark">
                  Range: ₮{potentialRange.potential_down_value.toLocaleString('en-IN', { maximumFractionDigits: 2 })} – ₮{potentialRange.potential_up_value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <p className="italic opacity-60">{potentialRange.note}</p>
              </div>
            )}
          </>
        ) : null}

        {/* Settle button */}
        {!settled && (
          <button
            onClick={handleSettle}
            disabled={settling || loading}
            className="w-full py-2.5 rounded-button text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)' }}
          >
            {settling
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Settling…</>
              : <><Swords className="w-4 h-4" /> Settle Clash Now</>
            }
          </button>
        )}

        {settled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-3 text-sm font-semibold text-textSecondary-light dark:text-textSecondary-dark"
          >
            Clash settled — wallet updated.
          </motion.div>
        )}
      </div>
    </div>
  );
}
