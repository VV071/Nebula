/**
 * Bidding service unit tests — no real DB or Python engine required.
 *
 * Scenario (mirrors spec):
 *   1. New user starts with 100 000 balance.
 *   2. Place bid (stake deducted).
 *   3. Settle win → balance rises by scaled payout.
 *   4. Place + settle loss → balance falls by full stake (payout = 0).
 *   5. Double-settle is a no-op (second call returns "Already settled").
 */

import axios from 'axios';

// ── In-memory DB state shared by all mock implementations ────────────────────

interface BidRow {
    bid_id: number;
    user_id: number;
    ticker_a: string;
    ticker_b: string;
    chosen: string;
    stake: number;
    entry_price_a: number;
    entry_price_b: number;
    status: string;
    exit_price_a?: number;
    exit_price_b?: number;
    payout?: number;
    ret_a?: number;
    ret_b?: number;
    entry_time: Date;
}

const state: { balance: number; bids: BidRow[]; nextBidId: number } = {
    balance: 100_000,
    bids: [],
    nextBidId: 1,
};

function resetState() {
    state.balance = 100_000;
    state.bids = [];
    state.nextBidId = 1;
}

// ── Mock: database module ─────────────────────────────────────────────────────

function handleClientQuery(sql: string, params?: any[]): any {
    const s = sql.trim();

    if (s === 'BEGIN' || s === 'COMMIT' || s === 'ROLLBACK') {
        return { rows: [], rowCount: 0 };
    }

    // Deduct stake (returns 0 rows if insufficient)
    if (s.startsWith('UPDATE wallets SET balance = balance -')) {
        const [stake, userId] = params!;
        if (state.balance < stake) return { rows: [], rowCount: 0 };
        state.balance -= Number(stake);
        return { rows: [{ balance: state.balance }], rowCount: 1 };
    }

    // Credit payout
    if (s.startsWith('UPDATE wallets SET balance = balance +')) {
        const [payout] = params!;
        state.balance += Number(payout);
        return { rows: [], rowCount: 1 };
    }

    // Insert bid
    if (s.startsWith('INSERT INTO bids')) {
        const [userId, tickerA, tickerB, chosen, stake, priceA, priceB] = params!;
        const bid: BidRow = {
            bid_id: state.nextBidId++,
            user_id: userId,
            ticker_a: tickerA,
            ticker_b: tickerB,
            chosen,
            stake: Number(stake),
            entry_price_a: Number(priceA),
            entry_price_b: Number(priceB),
            status: 'pending',
            entry_time: new Date(),
        };
        state.bids.push(bid);
        return { rows: [bid], rowCount: 1 };
    }

    // FOR UPDATE lock — re-read status
    if (s.includes('FOR UPDATE')) {
        const bidId = params![0];
        const bid = state.bids.find(b => b.bid_id === bidId);
        if (!bid) return { rows: [], rowCount: 0 };
        return { rows: [{ status: bid.status }], rowCount: 1 };
    }

    // Update bid after settlement (SQL has newline between "bids" and "SET")
    if (s.startsWith('UPDATE bids') && s.includes('SET status')) {
        const [status, exitA, exitB, payout, retA, retB, bidId] = params!;
        const bid = state.bids.find(b => b.bid_id === bidId);
        if (bid) {
            bid.status = status;
            bid.exit_price_a = exitA;
            bid.exit_price_b = exitB;
            bid.payout = payout;
            bid.ret_a = retA;
            bid.ret_b = retB;
        }
        return { rows: [], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
}

function handleDbQuery(sql: string, params?: any[]): any {
    const s = sql.trim();

    // ensureWallet upsert
    if (s.startsWith('INSERT INTO wallets')) {
        return { rows: [], rowCount: 0 };
    }

    // Pre-check: select status only
    if (s.startsWith('SELECT status FROM bids')) {
        const bidId = params![0];
        const bid = state.bids.find(b => b.bid_id === bidId);
        if (!bid) return { rows: [], rowCount: 0 };
        return { rows: [{ status: bid.status }], rowCount: 1 };
    }

    // Full bid read
    if (s.startsWith('SELECT * FROM bids')) {
        const bidId = params![0];
        const bid = state.bids.find(b => b.bid_id === bidId);
        if (!bid) return { rows: [], rowCount: 0 };
        return { rows: [bid], rowCount: 1 };
    }

    // Final balance read after settlement
    if (s.startsWith('SELECT balance FROM wallets')) {
        return { rows: [{ balance: state.balance }], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
}

const mockClient = {
    query: jest.fn(async (sql: string, params?: any[]) => handleClientQuery(sql, params)),
    release: jest.fn(),
};

jest.mock('../config/database', () => ({
    __esModule: true,
    default: {
        query: jest.fn(async (sql: string, params?: any[]) => handleDbQuery(sql, params)),
        connect: jest.fn(async () => mockClient),
    },
}));

// ── Mock: axios (price fetching via Python scorecard endpoint) ────────────────

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function mockPrices(priceA: number, priceB: number, ticker_a: string, ticker_b: string) {
    mockedAxios.get.mockImplementation(async (_url: string, opts?: any) => {
        const ticker: string = opts?.params?.ticker ?? '';
        const price = ticker === ticker_a ? priceA : priceB;
        return { data: { raw_technicals: { last_price: price } } };
    });
}

// ── Import service AFTER mocks are registered ─────────────────────────────────

import { placeBid, settleBid, getWallet } from '../services/biddingService';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Reload mock implementations after jest.clearAllMocks() clears them
function restoreMockImpls() {
    const db = require('../config/database').default;
    db.query.mockImplementation(async (sql: string, params?: any[]) => handleDbQuery(sql, params));
    db.connect.mockImplementation(async () => mockClient);
    mockClient.query.mockImplementation(async (sql: string, params?: any[]) => handleClientQuery(sql, params));
    mockClient.release.mockImplementation(() => {});
}

// ── Constants (must match biddingService.ts) ──────────────────────────────────

const MIN_MULT     = 1.2;
const MAX_MULT     = 3.0;
const MARGIN_SCALE = 20.0;

function expectedPayout(stake: number, margin: number): number {
    let mult = MIN_MULT + MARGIN_SCALE * Math.max(margin, 0);
    mult = Math.min(mult, MAX_MULT);
    return Math.round(stake * mult * 100) / 100;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

const TICKER_A = 'RELIANCE.NS';
const TICKER_B = 'TCS.NS';
const USER_ID  = 1;

beforeEach(() => {
    jest.clearAllMocks();
    resetState();
    restoreMockImpls();
});

// ── 1. Starting balance ───────────────────────────────────────────────────────

test('new user starts with 100 000 balance', async () => {
    const wallet = await getWallet(USER_ID) as any;
    expect(wallet.balance).toBe(100_000);
});

// ── 2. Place bid deducts stake ────────────────────────────────────────────────

test('place bid deducts stake from balance', async () => {
    const STAKE = 5_000;
    mockPrices(2980, 4100, TICKER_A, TICKER_B);

    const result = await placeBid(USER_ID, TICKER_A, TICKER_B, TICKER_A, STAKE) as any;

    expect(result.bid_id).toBe(1);
    expect(result.status).toBe('pending');
    expect(result.stake).toBe(STAKE);
    expect(result.balance_after_stake).toBe(100_000 - STAKE);
    expect(state.balance).toBe(100_000 - STAKE);
});

// ── 3. Settle win — payout scaled by margin ───────────────────────────────────

test('settle win credits scaled payout to balance', async () => {
    const STAKE = 5_000;

    // Entry prices
    const ENTRY_A = 2980;
    const ENTRY_B = 4100;
    // Exit prices: A rises 8%, B rises 3% → margin = 0.05 for chosen=A
    const EXIT_A  = ENTRY_A * 1.08;
    const EXIT_B  = ENTRY_B * 1.03;
    const MARGIN  = (EXIT_A / ENTRY_A - 1) - (EXIT_B / ENTRY_B - 1); // 0.05

    // Place bid using entry prices
    mockPrices(ENTRY_A, ENTRY_B, TICKER_A, TICKER_B);
    await placeBid(USER_ID, TICKER_A, TICKER_B, TICKER_A, STAKE);

    const balanceAfterBid = state.balance;

    // Settle using exit prices
    mockPrices(EXIT_A, EXIT_B, TICKER_A, TICKER_B);
    const result = await settleBid(1) as any;

    const payout = expectedPayout(STAKE, MARGIN);

    expect(result.status).toBe('won');
    expect(result.payout).toBe(payout);
    expect(result.net_result).toBeCloseTo(payout - STAKE, 2);
    expect(result.new_balance).toBeCloseTo(balanceAfterBid + payout, 2);
    expect(state.balance).toBeCloseTo(balanceAfterBid + payout, 2);
});

// ── 4. Place then settle loss — balance falls by full stake ───────────────────

test('settle loss returns zero payout (balance net -stake)', async () => {
    const STAKE = 3_000;

    const ENTRY_A = 2980;
    const ENTRY_B = 4100;
    // Exit: A up 1%, B up 4% → chosen=A loses
    const EXIT_A  = ENTRY_A * 1.01;
    const EXIT_B  = ENTRY_B * 1.04;

    mockPrices(ENTRY_A, ENTRY_B, TICKER_A, TICKER_B);
    await placeBid(USER_ID, TICKER_A, TICKER_B, TICKER_A, STAKE);

    const balanceAfterBid = state.balance;

    mockPrices(EXIT_A, EXIT_B, TICKER_A, TICKER_B);
    const result = await settleBid(1) as any;

    expect(result.status).toBe('lost');
    expect(result.payout).toBe(0);
    expect(result.net_result).toBe(-STAKE);
    // Balance does not change after a loss (payout credited = 0)
    expect(state.balance).toBe(balanceAfterBid);
});

// ── 5. Double-settle is a no-op ───────────────────────────────────────────────

test('second call to settleBid is a no-op (double-settle guard)', async () => {
    const STAKE = 2_000;

    const ENTRY_A = 2980;
    const ENTRY_B = 4100;
    const EXIT_A  = ENTRY_A * 1.08;
    const EXIT_B  = ENTRY_B * 1.03;

    mockPrices(ENTRY_A, ENTRY_B, TICKER_A, TICKER_B);
    await placeBid(USER_ID, TICKER_A, TICKER_B, TICKER_A, STAKE);

    mockPrices(EXIT_A, EXIT_B, TICKER_A, TICKER_B);
    const first = await settleBid(1) as any;
    expect(first.status).toBe('won');

    const balanceAfterFirstSettle = state.balance;

    // Second settle — must be a no-op
    const second = await settleBid(1) as any;
    expect(second.message).toMatch(/already settled/i);
    expect(state.balance).toBe(balanceAfterFirstSettle); // unchanged
});

// ── 6. Validation: bad inputs ─────────────────────────────────────────────────

test('placeBid rejects when chosen is not one of the two tickers', async () => {
    mockPrices(2980, 4100, TICKER_A, TICKER_B);
    await expect(
        placeBid(USER_ID, TICKER_A, TICKER_B, 'INFY.NS', 1000)
    ).rejects.toThrow(/chosen must/i);
});

test('placeBid rejects when stake is zero or negative', async () => {
    mockPrices(2980, 4100, TICKER_A, TICKER_B);
    await expect(
        placeBid(USER_ID, TICKER_A, TICKER_B, TICKER_A, 0)
    ).rejects.toThrow(/stake must be positive/i);
});

test('placeBid rejects when balance is insufficient', async () => {
    state.balance = 500; // below stake
    mockPrices(2980, 4100, TICKER_A, TICKER_B);
    await expect(
        placeBid(USER_ID, TICKER_A, TICKER_B, TICKER_A, 1000)
    ).rejects.toThrow(/insufficient balance/i);
});

// ── 7. Payout formula spot-check ──────────────────────────────────────────────

test('payout formula: MAX_MULT caps a blowout win', async () => {
    const STAKE   = 1_000;
    const ENTRY_A = 100;
    const ENTRY_B = 100;
    // A up 50%, B flat → margin = 0.50, uncapped mult = 1.2 + 20*0.5 = 11.2 → capped at 3.0
    const EXIT_A  = 150;
    const EXIT_B  = 100;

    mockPrices(ENTRY_A, ENTRY_B, TICKER_A, TICKER_B);
    await placeBid(USER_ID, TICKER_A, TICKER_B, TICKER_A, STAKE);

    mockPrices(EXIT_A, EXIT_B, TICKER_A, TICKER_B);
    const result = await settleBid(1) as any;

    expect(result.status).toBe('won');
    expect(result.payout).toBe(Math.round(STAKE * MAX_MULT * 100) / 100); // 3000.00
});

test('payout formula: MIN_MULT applies for a near-zero margin win', async () => {
    const STAKE   = 1_000;
    const ENTRY_A = 100;
    const ENTRY_B = 100;
    // A up 0.001%, B flat → margin ≈ 0.00001
    const EXIT_A  = 100.001;
    const EXIT_B  = 100;

    mockPrices(ENTRY_A, ENTRY_B, TICKER_A, TICKER_B);
    await placeBid(USER_ID, TICKER_A, TICKER_B, TICKER_A, STAKE);

    mockPrices(EXIT_A, EXIT_B, TICKER_A, TICKER_B);
    const result = await settleBid(1) as any;

    expect(result.status).toBe('won');
    // mult ≈ 1.2 + 20*0.00001 = ~1.2002, rounds to 1200.20
    expect(result.payout).toBeGreaterThanOrEqual(Math.round(STAKE * MIN_MULT * 100) / 100);
    expect(result.payout).toBeLessThan(STAKE * (MIN_MULT + 0.01));
});
