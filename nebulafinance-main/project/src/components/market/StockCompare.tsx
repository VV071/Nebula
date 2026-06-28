import { useState } from 'react';
import { GitCompare, TrendingUp, TrendingDown, AlertCircle, Loader2 } from 'lucide-react';
import { marketService, CompareResult, Scorecard } from '../../services/marketService';

const SCORE_LABELS: Record<string, string> = {
    momentum_1m: '1-Month Momentum',
    momentum_3m: '3-Month Momentum',
    trend: 'Trend (MA50)',
    rsi_position: 'RSI Position',
    news_sentiment: 'News Sentiment',
    movement_potential: 'Movement Potential',
};

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: number }) {
    const color = value >= 60 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs text-textSecondary-light dark:text-textSecondary-dark mb-1">
                <span>{label}</span>
                <span className="font-mono">{value.toFixed(1)} <span className="opacity-60">(wt {(weight * 100).toFixed(0)}%)</span></span>
            </div>
            <div className="h-2 bg-surfaceHover-light dark:bg-surfaceHover-dark rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

function ScorecardPanel({ card, isWinner }: { card: Scorecard; isWinner: boolean }) {
    const score = card.composite_lean_score;
    const scoreColor = score >= 60 ? 'text-green-500' : score >= 40 ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className={`p-5 rounded-2xl border-2 transition-all ${isWinner ? 'border-primary-500 shadow-lg shadow-primary-500/10' : 'border-light dark:border-dark'} bg-surface-light dark:bg-surface-dark`}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark">{card.ticker}</h3>
                    <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                        ₹{card.raw_technicals.last_price.toLocaleString('en-IN')}
                    </p>
                </div>
                <div className="text-right">
                    <p className={`text-3xl font-mono font-bold ${scoreColor}`}>{score.toFixed(1)}</p>
                    <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">Lean Score / 100</p>
                </div>
            </div>

            {isWinner && (
                <div className="mb-4 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold rounded-full inline-flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Stronger Signals
                </div>
            )}

            <div className="space-y-1">
                {Object.entries(card.component_scores).map(([key, val]) => (
                    <ScoreBar
                        key={key}
                        label={SCORE_LABELS[key] || key}
                        value={val}
                        weight={card.weights[key as keyof typeof card.weights]}
                    />
                ))}
            </div>

            {card.volatility_forecast && (
                <div className="mt-4 pt-4 border-t border-light dark:border-dark text-xs text-textSecondary-light dark:text-textSecondary-dark space-y-1">
                    <p>Forecast volatility ({card.volatility_forecast.horizon_days}d): <span className="font-mono text-textPrimary-light dark:text-textPrimary-dark">{card.volatility_forecast.annualized_pct.toFixed(1)}% ann.</span></p>
                    {card.volatility_forecast.vol_relative_to_recent != null && (
                        <p>vs recent 22d: <span className={`font-mono ${card.volatility_forecast.vol_relative_to_recent > 1.1 ? 'text-yellow-500' : 'text-green-500'}`}>{card.volatility_forecast.vol_relative_to_recent.toFixed(2)}×</span></p>
                    )}
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-light dark:border-dark text-xs text-textSecondary-light dark:text-textSecondary-dark space-y-1">
                <p>RSI: <span className="font-mono text-textPrimary-light dark:text-textPrimary-dark">{card.raw_technicals.rsi_14}</span></p>
                <p>Above MA50: <span className={`font-bold ${card.raw_technicals.above_ma50 ? 'text-green-500' : 'text-red-500'}`}>{card.raw_technicals.above_ma50 ? 'Yes' : 'No'}</span></p>
                <p>5d Return: <span className={`font-mono ${card.raw_technicals.ret_5d >= 0 ? 'text-green-500' : 'text-red-500'}`}>{(card.raw_technicals.ret_5d * 100).toFixed(2)}%</span></p>
                <p>News ({card.news.article_count} articles): <span className={`font-mono ${card.news.avg_sentiment >= 0 ? 'text-green-500' : 'text-red-500'}`}>{card.news.avg_sentiment >= 0 ? '+' : ''}{card.news.avg_sentiment.toFixed(3)}</span></p>
            </div>
        </div>
    );
}

export function StockCompare() {
    const [tickerA, setTickerA] = useState('TCS.NS');
    const [tickerB, setTickerB] = useState('INFY.NS');
    const [result, setResult] = useState<CompareResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCompare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tickerA.trim() || !tickerB.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await marketService.compareStocks(tickerA.trim(), tickerB.trim());
            if (data.error) throw new Error(data.error);
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-light dark:border-dark p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                    <GitCompare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark">Stock Comparison Engine</h2>
                    <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">Volatility model + technicals + sentiment</p>
                </div>
            </div>

            <form onSubmit={handleCompare} className="flex flex-col sm:flex-row gap-3 mb-6">
                <input
                    type="text"
                    value={tickerA}
                    onChange={e => setTickerA(e.target.value)}
                    placeholder="Stock A (e.g. TCS.NS)"
                    className="flex-1 px-4 py-3 rounded-xl bg-surfaceHover-light dark:bg-surfaceHover-dark border border-light dark:border-dark focus:ring-2 focus:ring-primary-500 outline-none text-textPrimary-light dark:text-textPrimary-dark font-mono"
                />
                <span className="self-center text-textSecondary-light dark:text-textSecondary-dark font-bold hidden sm:block">vs</span>
                <input
                    type="text"
                    value={tickerB}
                    onChange={e => setTickerB(e.target.value)}
                    placeholder="Stock B (e.g. INFY.NS)"
                    className="flex-1 px-4 py-3 rounded-xl bg-surfaceHover-light dark:bg-surfaceHover-dark border border-light dark:border-dark focus:ring-2 focus:ring-primary-500 outline-none text-textPrimary-light dark:text-textPrimary-dark font-mono"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
                    {loading ? 'Analysing…' : 'Compare'}
                </button>
            </form>

            {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm mb-4">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {result && (
                <div className="space-y-6 animate-slide-up">
                    {/* Verdict banner */}
                    <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <span className="text-sm text-textSecondary-light dark:text-textSecondary-dark">Leans towards </span>
                                <span className="font-bold text-primary-600 dark:text-primary-400 text-lg">{result.lean_towards}</span>
                                <span className="ml-2 text-sm text-textSecondary-light dark:text-textSecondary-dark">— {result.confidence} (margin {result.lean_margin.toFixed(1)})</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-textSecondary-light dark:text-textSecondary-dark">
                                <TrendingUp className="w-3 h-3" /> Decision support only
                            </div>
                        </div>
                    </div>

                    {/* Side-by-side scorecards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ScorecardPanel
                            card={result.stock_a}
                            isWinner={result.lean_towards === result.stock_a.ticker}
                        />
                        <ScorecardPanel
                            card={result.stock_b}
                            isWinner={result.lean_towards === result.stock_b.ticker}
                        />
                    </div>

                    {/* Disclaimer */}
                    <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark p-3 bg-surfaceHover-light dark:bg-surfaceHover-dark rounded-xl">
                        <AlertCircle className="w-3 h-3 inline mr-1 mb-0.5" />
                        {result.disclaimer}
                    </p>
                </div>
            )}
        </div>
    );
}
