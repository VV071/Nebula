import { useState } from 'react';
import {
  BarChart2, Search, TrendingUp, AlertCircle,
  Loader2, Activity, Newspaper, Zap, ShieldAlert,
} from 'lucide-react';
import { marketService, Scorecard } from '../services/marketService';

const SCORE_LABELS: Record<string, string> = {
  momentum_1m: '1-Month Momentum',
  momentum_3m: '3-Month Momentum',
  trend: 'Trend (MA-50)',
  rsi_position: 'RSI Position',
  news_sentiment: 'News Sentiment',
  movement_potential: 'Movement Potential',
};

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: number }) {
  const color =
    value >= 65 ? '#10B981'
    : value >= 45 ? '#F59E0B'
    : '#EF4444';
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-textSecondary-light dark:text-textSecondary-dark">{label}</span>
        <span className="font-mono font-semibold text-textPrimary-light dark:text-textPrimary-dark">
          {value.toFixed(1)}
          <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark ml-1 font-normal">
            wt {(weight * 100).toFixed(0)}%
          </span>
        </span>
      </div>
      <div className="h-2.5 bg-surfaceHover-light dark:bg-surfaceHover-dark rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(value, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

function CompositeRing({ score }: { score: number }) {
  const color =
    score >= 65 ? '#10B981'
    : score >= 45 ? '#F59E0B'
    : '#EF4444';
  const label =
    score >= 65 ? 'Bullish Signal'
    : score >= 45 ? 'Neutral Signal'
    : 'Bearish Signal';

  const r = 44;
  const circ = 2 * Math.PI * r;
  const filled = circ * (score / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="10" />
        <circle
          cx="55" cy="55" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
        <text x="55" y="50" textAnchor="middle" fontSize="22" fontWeight="800" fontFamily="JetBrains Mono,monospace" fill={color}>
          {score.toFixed(0)}
        </text>
        <text x="55" y="68" textAnchor="middle" fontSize="9" fontWeight="600" fill="rgba(161,161,187,0.8)" letterSpacing="0.05em">
          / 100
        </text>
      </svg>
      <span className="text-sm font-bold" style={{ color }}>{label}</span>
    </div>
  );
}

export default function StockPrediction() {
  const [ticker, setTicker] = useState('');
  const [card, setCard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setLoading(true);
    setError(null);
    setCard(null);
    try {
      const data = await marketService.getScorecard(t);
      if ((data as any).error) throw new Error((data as any).error);
      setCard(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch scorecard. Make sure the Python engine is running on port 8001.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="max-w-[900px] mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #6366F1, #7C3AED)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-textPrimary-light dark:text-textPrimary-dark tracking-tight">
                Stock Prediction Engine
              </h1>
              <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                ML volatility model · technicals · news sentiment
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Research tool only — not financial advice
            </p>
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleFetch}
          className="flex gap-3 mb-8 p-5 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.55)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}>
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary-light dark:text-textSecondary-dark pointer-events-none" />
            <input
              type="text"
              value={ticker}
              onChange={e => setTicker(e.target.value)}
              placeholder="Enter ticker e.g. RELIANCE.NS, TCS.NS, INFY.NS"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surfaceHover-light dark:bg-surfaceHover-dark border border-light dark:border-dark focus:ring-2 focus:ring-primary-500 outline-none text-textPrimary-light dark:text-textPrimary-dark font-mono text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !ticker.trim()}
            className="px-6 py-3 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #6366F1, #7C3AED)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Analysing…</>
              : <><Zap className="w-4 h-4" />Run Prediction</>}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl mb-6"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">Prediction failed</p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {card && (
          <div className="space-y-6 animate-fade-in">

            {/* Ticker header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.55)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              }}>
              <div>
                <h2 className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark font-mono">
                  {card.ticker}
                </h2>
                <p className="text-3xl font-black font-mono mt-1"
                  style={{ color: card.raw_technicals.ret_5d >= 0 ? '#10B981' : '#EF4444' }}>
                  ₹{card.raw_technicals.last_price.toLocaleString('en-IN')}
                  <span className="text-base font-semibold ml-2">
                    {card.raw_technicals.ret_5d >= 0 ? '+' : ''}
                    {(card.raw_technicals.ret_5d * 100).toFixed(2)}% <span className="text-xs font-normal text-textSecondary-light dark:text-textSecondary-dark">5d</span>
                  </span>
                </p>
              </div>
              <CompositeRing score={card.composite_lean_score} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Signal Scores */}
              <div className="p-5 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.55)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}>
                <h3 className="text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary-500" />
                  Signal Breakdown
                </h3>
                {Object.entries(card.component_scores).map(([key, val]) => (
                  <ScoreBar
                    key={key}
                    label={SCORE_LABELS[key] || key}
                    value={val}
                    weight={card.weights[key as keyof typeof card.weights]}
                  />
                ))}
              </div>

              {/* Technicals + Volatility */}
              <div className="flex flex-col gap-6">

                {/* Technicals */}
                <div className="flex-1 p-5 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.72)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.55)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  }}>
                  <h3 className="text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-secondary-500" />
                    Technical Signals
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'RSI (14)', value: String(card.raw_technicals.rsi_14), highlight: card.raw_technicals.rsi_14 > 70 || card.raw_technicals.rsi_14 < 30 },
                      { label: 'Above MA-50', value: card.raw_technicals.above_ma50 ? 'Yes ✓' : 'No ✗', up: card.raw_technicals.above_ma50 },
                      { label: '1-Month Return', value: `${(card.raw_technicals.mom_22 * 100).toFixed(2)}%`, up: card.raw_technicals.mom_22 >= 0 },
                      { label: '3-Month Return', value: `${(card.raw_technicals.mom_63 * 100).toFixed(2)}%`, up: card.raw_technicals.mom_63 >= 0 },
                      { label: 'Realized Vol (22d)', value: `${(card.raw_technicals.realized_vol_22 * 100).toFixed(2)}%` },
                    ].map(({ label, value, up, highlight }) => (
                      <div key={label} className="flex justify-between items-center py-1.5 border-b border-light dark:border-dark last:border-0">
                        <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark">{label}</span>
                        <span className={`text-xs font-mono font-bold ${
                          up === true ? 'text-green-500'
                          : up === false ? 'text-red-500'
                          : highlight ? 'text-amber-500'
                          : 'text-textPrimary-light dark:text-textPrimary-dark'
                        }`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Volatility Forecast */}
                {card.volatility_forecast && (
                  <div className="p-5 rounded-2xl"
                    style={{
                      background: 'rgba(99,102,241,0.04)',
                      border: '1px solid rgba(99,102,241,0.15)',
                    }}>
                    <h3 className="text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark mb-3 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-primary-500" />
                      Volatility Forecast
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-textSecondary-light dark:text-textSecondary-dark">
                          {card.volatility_forecast.horizon_days}d Annualised
                        </span>
                        <span className="font-mono font-bold text-primary-500">
                          {card.volatility_forecast.annualized_pct.toFixed(1)}%
                        </span>
                      </div>
                      {card.volatility_forecast.vol_relative_to_recent != null && (
                        <div className="flex justify-between text-xs">
                          <span className="text-textSecondary-light dark:text-textSecondary-dark">vs Recent 22d</span>
                          <span className={`font-mono font-bold ${card.volatility_forecast.vol_relative_to_recent > 1.1 ? 'text-amber-500' : 'text-green-500'}`}>
                            {card.volatility_forecast.vol_relative_to_recent.toFixed(2)}×
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* News sentiment */}
            {card.news.article_count > 0 && (
              <div className="p-5 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.55)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}>
                <h3 className="text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark mb-4 flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-accent-500" />
                  News Sentiment
                  <span className="ml-auto text-xs font-normal text-textSecondary-light dark:text-textSecondary-dark">
                    {card.news.article_count} articles · avg{' '}
                    <span className={`font-mono font-bold ${card.news.avg_sentiment >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {card.news.avg_sentiment >= 0 ? '+' : ''}{card.news.avg_sentiment.toFixed(3)}
                    </span>
                  </span>
                </h3>
                <div className="space-y-2">
                  {card.news.headlines.slice(0, 5).map((h, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-light dark:border-dark last:border-0">
                      <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${h.sentiment >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                      <p className="text-xs text-textPrimary-light dark:text-textPrimary-dark flex-1 leading-relaxed">{h.title}</p>
                      <span className={`text-xs font-mono font-bold flex-shrink-0 ${h.sentiment >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {h.sentiment >= 0 ? '+' : ''}{h.sentiment.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                This scorecard is generated by a quantitative model for research purposes only. It does not constitute investment advice. Past performance does not guarantee future results. Consult a licensed financial advisor before making any investment decision.
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!card && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <BarChart2 className="w-7 h-7 text-primary-500" />
            </div>
            <h3 className="text-lg font-bold text-textPrimary-light dark:text-textPrimary-dark mb-2">
              Enter a stock ticker to begin
            </h3>
            <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark max-w-xs">
              Use NSE suffix — e.g. <span className="font-mono">RELIANCE.NS</span>, <span className="font-mono">TCS.NS</span>, <span className="font-mono">INFY.NS</span>
            </p>
            <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-3 opacity-70">
              Requires Python engine running on port 8001
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
