import { ENV } from '../config/env';

const BASE = ENV.API_BASE_URL;

async function req(path: string, options: RequestInit = {}) {
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    return res.json();
}

export interface Bid {
    bid_id: number;
    ticker_a: string;
    ticker_b: string;
    chosen: string;
    stake: number;
    status: 'pending' | 'won' | 'lost' | 'void';
    entry_price_a: number;
    entry_price_b: number;
    exit_price_a?: number;
    exit_price_b?: number;
    payout?: number;
    ret_a?: number;
    ret_b?: number;
    entry_time: string;
    settle_time?: string;
}

export interface Wallet {
    balance: number;
    recent_bids: Bid[];
}

export const biddingService = {
    getWallet: (): Promise<Wallet> =>
        req('/api/bids/wallet'),

    getHistory: (): Promise<{ bids: Bid[] }> =>
        req('/api/bids/history'),

    placeBid: (body: {
        ticker_a: string;
        ticker_b: string;
        chosen: string;
        stake: number;
    }) =>
        req('/api/bids', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    settleBid: (bidId: number) =>
        req(`/api/bids/${bidId}/settle`, { method: 'POST' }),

    getPnl: (bidId: number) =>
        req(`/api/bids/${bidId}/pnl`),
};
