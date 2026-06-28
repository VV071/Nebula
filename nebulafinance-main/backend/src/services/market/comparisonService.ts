import axios from 'axios';

const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8001';

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

async function isEngineAvailable(): Promise<boolean> {
    try {
        await axios.get(`${PYTHON_ENGINE_URL}/health`, { timeout: 2000 });
        return true;
    } catch {
        return false;
    }
}

export const comparisonService = {
    async compare(tickerA: string, tickerB: string): Promise<CompareResult> {
        const available = await isEngineAvailable();
        if (!available) {
            throw new Error('Comparison engine is not running. Start it with: cd python_engine && uvicorn main:app --port 8001');
        }
        const response = await axios.get(`${PYTHON_ENGINE_URL}/compare`, {
            params: { stock_a: tickerA, stock_b: tickerB },
            timeout: 60000,
        });
        return response.data;
    },

    async scorecard(ticker: string): Promise<Scorecard> {
        const available = await isEngineAvailable();
        if (!available) {
            throw new Error('Comparison engine is not running. Start it with: cd python_engine && uvicorn main:app --port 8001');
        }
        const response = await axios.get(`${PYTHON_ENGINE_URL}/scorecard`, {
            params: { ticker },
            timeout: 60000,
        });
        return response.data;
    },

    async engineHealth(): Promise<{ available: boolean; url: string }> {
        const available = await isEngineAvailable();
        return { available, url: PYTHON_ENGINE_URL };
    },
};
