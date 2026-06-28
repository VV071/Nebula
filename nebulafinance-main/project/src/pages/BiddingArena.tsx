import { useState, useEffect, useCallback } from 'react';
import {
  Swords, Wallet, Trophy, TrendingUp, TrendingDown,
  Loader2, RefreshCw, CheckCircle2, XCircle, Minus, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { biddingService, Bid, Wallet as WalletData } from '../services/biddingService';
import StockClash from '../components/market/StockClash';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n?: number) {
  if (n == null) return '—';
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function pct(n?: number) {
  if (n == null) return '—';
  return `${(n * 100).toFixed(2)}%`;
}

function StatusBadge({ status }: { status: Bid['status'] }) {
  const map = {
    pending: { icon: Clock,        color: 'text-amber-500',   bg: 'bg-amber-500/10',   label: 'Pending' },
    won:     { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Won' },
    lost:    { icon: XCircle,      color: 'text-rose-500',    bg: 'bg-rose-500/10',    label: 'Lost' },
    void:    { icon: Minus,        color: 'text-slate-400',   bg: 'bg-slate-400/10',   label: 'Void' },
  };
  const { icon: Icon, color, bg, label } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color} ${bg}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ── Active clash state ────────────────────────────────────────────────────────

interface ActiveClash {
  bidId: number;
  tickerA: string;
  tickerB: string;
  chosen: string;
  stake: number;
  potentialRange: any | null;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BiddingArena() {
  const [wallet, setWallet]   = useState<WalletData | null>(null);
  const [history, setHistory] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Form state
  const [tickerA, setTickerA] = useState('');
  const [tickerB, setTickerB] = useState('');
  const [chosen, setChosen]   = useState<'a' | 'b' | ''>('');
  const [stake, setStake]     = useState('');
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');

  // Active clash (shown after placing a bid)
  const [activeClash, setActiveClash] = useState<ActiveClash | null>(null);

  // Fallback settle in history list
  const [settling, setSettling] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError('');
      const [w, h] = await Promise.all([
        biddingService.getWallet(),
        biddingService.getHistory(),
      ]);
      setWallet(w);
      setHistory(h.bids);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlaceError('');

    const ta = tickerA.trim().toUpperCase();
    const tb = tickerB.trim().toUpperCase();
    const chosenTicker = chosen === 'a' ? ta : tb;
    const stakeNum = parseFloat(stake);

    if (!ta || !tb)              return setPlaceError('Enter both tickers.');
    if (ta === tb)               return setPlaceError('Tickers must be different.');
    if (!chosen)                 return setPlaceError('Pick a winner.');
    if (!stakeNum || stakeNum <= 0) return setPlaceError('Enter a valid stake.');

    setPlacing(true);
    try {
      const res = await biddingService.placeBid({
        ticker_a: ta, ticker_b: tb, chosen: chosenTicker, stake: stakeNum,
      }) as any;

      setActiveClash({
        bidId: res.bid_id,
        tickerA: ta,
        tickerB: tb,
        chosen: chosenTicker,
        stake: stakeNum,
        potentialRange: res.potential_range ?? null,
      });

      setTickerA(''); setTickerB(''); setChosen(''); setStake('');
      await refresh();
    } catch (e: any) {
      setPlaceError(e.message);
    } finally {
      setPlacing(false);
    }
  };

  const handleClashSettle = async () => {
    setActiveClash(null);
    await refresh();
  };

  const handleSettle = async (bidId: number) => {
    setSettling(bidId);
    try {
      await biddingService.settleBid(bidId);
      await refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSettling(null);
    }
  };

  const tickerAUp = tickerA.trim().toUpperCase();
  const tickerBUp = tickerB.trim().toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pt-20 lg:pt-8 pb-24 lg:pb-8 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)' }}
          >
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
              Bidding Arena
            </h1>
            <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
              Fake currency · Pick the relative winner
            </p>
          </div>
        </div>
        <button onClick={refresh}
          className="p-2 rounded-button text-textSecondary-light dark:text-textSecondary-dark hover:bg-primary-500/8 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-card text-rose-600 text-sm bg-rose-500/10 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Wallet balance */}
      <div className="rounded-card p-5 flex items-center gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(124,58,237,0.08) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}
      >
        <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center flex-shrink-0">
          <Wallet className="w-5 h-5 text-primary-500" />
        </div>
        <div>
          <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark font-medium uppercase tracking-wide">
            Nebula Balance
          </p>
          <p className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
            ₮{fmt(wallet?.balance)}
          </p>
        </div>
      </div>

      {/* Active clash — shown after placing a bid */}
      <AnimatePresence>
        {activeClash && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.34, 1.2, 0.64, 1] }}
          >
            <StockClash
              tickerA={activeClash.tickerA}
              tickerB={activeClash.tickerB}
              chosen={activeClash.chosen}
              stake={activeClash.stake}
              bidId={activeClash.bidId}
              potentialRange={activeClash.potentialRange}
              onSettle={handleClashSettle}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Place bid form */}
      <div className="rounded-card p-5 space-y-4"
        style={{ border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <h2 className="font-semibold text-textPrimary-light dark:text-textPrimary-dark flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          {activeClash ? 'Place Another Bid' : 'Place a Bid'}
        </h2>

        <form onSubmit={handlePlaceBid} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark mb-1">
                Stock A
              </label>
              <input
                value={tickerA}
                onChange={e => { setTickerA(e.target.value); setChosen(''); }}
                placeholder="e.g. RELIANCE.NS"
                className="w-full px-3 py-2 rounded-button text-sm bg-surfaceHover-light dark:bg-surfaceHover-dark border border-transparent focus:border-primary-500/50 focus:outline-none text-textPrimary-light dark:text-textPrimary-dark placeholder-textSecondary-light dark:placeholder-textSecondary-dark transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark mb-1">
                Stock B
              </label>
              <input
                value={tickerB}
                onChange={e => { setTickerB(e.target.value); setChosen(''); }}
                placeholder="e.g. TCS.NS"
                className="w-full px-3 py-2 rounded-button text-sm bg-surfaceHover-light dark:bg-surfaceHover-dark border border-transparent focus:border-primary-500/50 focus:outline-none text-textPrimary-light dark:text-textPrimary-dark placeholder-textSecondary-light dark:placeholder-textSecondary-dark transition-colors"
              />
            </div>
          </div>

          {tickerAUp && tickerBUp && tickerAUp !== tickerBUp && (
            <div>
              <label className="block text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark mb-2">
                Which will outperform by next market close?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['a', 'b'] as const).map(side => {
                  const ticker = side === 'a' ? tickerAUp : tickerBUp;
                  return (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setChosen(side)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-button text-sm font-semibold transition-all border ${
                        chosen === side
                          ? 'text-white border-primary-500'
                          : 'text-textSecondary-light dark:text-textSecondary-dark border-transparent bg-surfaceHover-light dark:bg-surfaceHover-dark hover:border-primary-500/40'
                      }`}
                      style={chosen === side ? { background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)' } : {}}
                    >
                      <TrendingUp className="w-4 h-4" />
                      {ticker}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark mb-1">
              Stake (₮)
            </label>
            <input
              type="number"
              min="1"
              value={stake}
              onChange={e => setStake(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full px-3 py-2 rounded-button text-sm bg-surfaceHover-light dark:bg-surfaceHover-dark border border-transparent focus:border-primary-500/50 focus:outline-none text-textPrimary-light dark:text-textPrimary-dark placeholder-textSecondary-light dark:placeholder-textSecondary-dark transition-colors"
            />
            {wallet && parseFloat(stake) > wallet.balance && (
              <p className="text-xs text-rose-500 mt-1">Exceeds your balance of ₮{fmt(wallet.balance)}</p>
            )}
          </div>

          {placeError && <p className="text-xs text-rose-500">{placeError}</p>}

          <button
            type="submit"
            disabled={placing}
            className="w-full py-2.5 rounded-button text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)' }}
          >
            {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
            {placing ? 'Placing…' : 'Place Bid'}
          </button>
        </form>
      </div>

      {/* Bid history */}
      <div className="rounded-card overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="px-5 py-4 border-b border-primary-500/10">
          <h2 className="font-semibold text-textPrimary-light dark:text-textPrimary-dark">
            Bid History
          </h2>
        </div>

        {history.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-textSecondary-light dark:text-textSecondary-dark">
            No bids yet. Place your first bid above!
          </div>
        ) : (
          <div className="divide-y divide-primary-500/8">
            {history.map(bid => {
              const net = bid.payout != null ? bid.payout - bid.stake : null;
              return (
                <div key={bid.bid_id} className="px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-textPrimary-light dark:text-textPrimary-dark">
                        {bid.ticker_a} <span className="text-textSecondary-light dark:text-textSecondary-dark font-normal">vs</span> {bid.ticker_b}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium">
                        → {bid.chosen}
                      </span>
                    </div>
                    <StatusBadge status={bid.status} />
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-textSecondary-light dark:text-textSecondary-dark">
                    <span>Stake <span className="font-semibold text-textPrimary-light dark:text-textPrimary-dark">₮{fmt(bid.stake)}</span></span>
                    {bid.payout != null && (
                      <span>Payout <span className="font-semibold text-textPrimary-light dark:text-textPrimary-dark">₮{fmt(bid.payout)}</span></span>
                    )}
                    {net != null && (
                      <span className={net >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {net >= 0 ? '+' : ''}₮{fmt(net)}
                      </span>
                    )}
                    {bid.ret_a != null && (
                      <span>{bid.ticker_a} <span className={bid.ret_a >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{pct(bid.ret_a)}</span></span>
                    )}
                    {bid.ret_b != null && (
                      <span>{bid.ticker_b} <span className={bid.ret_b >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{pct(bid.ret_b)}</span></span>
                    )}
                    <span>{new Date(bid.entry_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>

                  {bid.status === 'pending' && bid.bid_id !== activeClash?.bidId && (
                    <button
                      onClick={() => handleSettle(bid.bid_id)}
                      disabled={settling === bid.bid_id}
                      className="mt-1 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-button text-primary-600 dark:text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 transition-all disabled:opacity-60"
                    >
                      {settling === bid.bid_id
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Settling…</>
                        : <><TrendingDown className="w-3 h-3" /> Settle Now</>
                      }
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
