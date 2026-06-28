export interface MarketIndex {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    history: number[]; // specific for mini-chart
}

export interface OHLCData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// Mock data generator for candles
const generateCandles = (basePrice: number, count: number): OHLCData[] => {
    const candles: OHLCData[] = [];
    let currentPrice = basePrice;
    const now = new Date();

    for (let i = count; i > 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        const volatility = basePrice * 0.02; // 2% volatility
        const open = currentPrice;
        const close = currentPrice + (Math.random() - 0.5) * volatility;
        const high = Math.max(open, close) + Math.random() * (volatility / 2);
        const low = Math.min(open, close) - Math.random() * (volatility / 2);
        const volume = Math.floor(Math.random() * 1000000) + 500000;

        candles.push({
            time: date.toISOString().split('T')[0],
            open,
            high,
            low,
            close,
            volume
        });

        currentPrice = close;
    }
    return candles;
};

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

export interface ComponentScores {
    momentum_1m: number;
    momentum_3m: number;
    trend: number;
    rsi_position: number;
    news_sentiment: number;
    movement_potential: number;
}

export interface Scorecard {
    ticker: string;
    composite_lean_score: number;
    component_scores: ComponentScores;
    weights: ComponentScores;
    raw_technicals: {
        last_price: number;
        mom_22: number;
        mom_63: number;
        above_ma50: boolean;
        rsi_14: number;
        realized_vol_22: number;
        ret_5d: number;
    };
    volatility_forecast: {
        predicted_vol: number;
        horizon_days: number;
        annualized_pct: number;
        recent_22d_vol: number | null;
        vol_relative_to_recent: number | null;
        har_baseline_vol?: number;
        model_vs_har_diff_pct?: number | null;
    } | null;
    news: {
        avg_sentiment: number;
        article_count: number;
        headlines: Array<{ title: string; sentiment: number }>;
    };
}

export interface CompareResult {
    stock_a: Scorecard;
    stock_b: Scorecard;
    lean_towards: string;
    lean_margin: number;
    confidence: string;
    disclaimer: string;
    error?: string;
}

export const marketService = {
    getIndicesOverview: async (): Promise<MarketIndex[]> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        return [
            {
                symbol: 'NIFTY 50',
                name: 'NIFTY 50',
                price: 22450.75,
                change: 125.40,
                changePercent: 0.56,
                trend: 'bullish',
                history: [22250, 22280, 22260, 22300, 22350, 22320, 22380, 22360, 22400, 22390, 22410, 22430, 22420, 22440, 22450]
            },
            {
                symbol: 'NIFTY BANK',
                name: 'NIFTY BANK',
                price: 47850.20,
                change: -210.15,
                changePercent: -0.44,
                trend: 'bearish',
                history: [48150, 48120, 48180, 48100, 48130, 48050, 48080, 47950, 47980, 47900, 47930, 47880, 47910, 47870, 47850]
            }
        ];
    },

    compareStocks: async (stockA: string, stockB: string): Promise<CompareResult> => {
        const res = await fetch(`${BACKEND}/market/compare?stock_a=${encodeURIComponent(stockA)}&stock_b=${encodeURIComponent(stockB)}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.error || 'Comparison failed');
        }
        return res.json();
    },

    getScorecard: async (ticker: string): Promise<Scorecard> => {
        const res = await fetch(`${BACKEND}/market/scorecard?ticker=${encodeURIComponent(ticker)}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.error || 'Scorecard fetch failed');
        }
        return res.json();
    },

    checkEngineHealth: async (): Promise<{ available: boolean; url: string }> => {
        const res = await fetch(`${BACKEND}/market/engine-health`).catch(() => null);
        if (!res || !res.ok) return { available: false, url: '' };
        return res.json();
    },

    getStockHistory: async (symbol: string, timeframe: '1D' | '1W' | '1M' | '6M' | '1Y'): Promise<OHLCData[]> => {
        await new Promise(resolve => setTimeout(resolve, 600));

        const basePrice = symbol.includes('BANK') ? 48000 : 22000;
        const count = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 100;

        return generateCandles(basePrice, count);
    }
};
