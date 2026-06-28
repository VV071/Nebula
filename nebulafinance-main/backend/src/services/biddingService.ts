import axios from 'axios';
import db from '../config/database';

const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8001';

// Game-balance constants — do not change
const MIN_MULT = 1.2;
const MAX_MULT = 3.0;
const MARGIN_SCALE = 20.0;

const STARTING_BALANCE = 100000;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchLatestPrice(ticker: string): Promise<number> {
    // /price is fast (intraday 1-min, 15 s server-side cache) — prefer it for
    // entry/exit. Fall back to the scorecard's last_price if unavailable.
    try {
        const response = await axios.get(`${PYTHON_ENGINE_URL}/price`, {
            params: { ticker },
            timeout: 10000,
        });
        const price: unknown = response.data?.price;
        if (typeof price === 'number' && price > 0) return price;
    } catch {
        // fall through to scorecard
    }
    const response = await axios.get(`${PYTHON_ENGINE_URL}/scorecard`, {
        params: { ticker },
        timeout: 60000,
    });
    const price: unknown = response.data?.raw_technicals?.last_price;
    if (typeof price !== 'number' || price <= 0) {
        throw new Error(`Could not fetch a valid price for ${ticker}`);
    }
    return price;
}

function computePayout(stake: number, won: boolean, margin: number): number {
    if (!won) return 0;
    let mult = MIN_MULT + MARGIN_SCALE * Math.max(margin, 0);
    mult = Math.min(mult, MAX_MULT);
    return Math.round(stake * mult * 100) / 100;
}

function statusError(message: string, status: number): Error {
    return Object.assign(new Error(message), { status });
}

// Ensure the user has a wallet row; safe to call multiple times.
async function ensureWallet(userId: number): Promise<void> {
    await db.query(
        `INSERT INTO wallets (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING`,
        [userId, STARTING_BALANCE]
    );
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function placeBid(
    userId: number,
    tickerA: string,
    tickerB: string,
    chosen: string,
    stake: number
): Promise<object> {
    if (chosen !== tickerA && chosen !== tickerB) {
        throw statusError('chosen must equal ticker_a or ticker_b', 400);
    }
    if (stake <= 0) {
        throw statusError('stake must be positive', 400);
    }

    // Fetch prices before opening the transaction (avoids holding a DB
    // connection while waiting on a slow network call).
    const [priceA, priceB] = await Promise.all([
        fetchLatestPrice(tickerA),
        fetchLatestPrice(tickerB),
    ]);

    await ensureWallet(userId);

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Check balance inside the transaction
        const balCheck = await client.query(
            `SELECT balance FROM wallets WHERE user_id = $1`,
            [userId]
        );
        const currentBalance = Number(balCheck.rows[0]?.balance ?? -1);
        if (currentBalance < stake) {
            throw statusError('Insufficient balance', 402);
        }

        // Deduct stake (no RETURNING — sqlite3 doesn't support it reliably)
        await client.query(
            `UPDATE wallets SET balance = balance - $1 WHERE user_id = $2`,
            [stake, userId]
        );

        // Read new balance
        const newBalRow = await client.query(
            `SELECT balance FROM wallets WHERE user_id = $1`,
            [userId]
        );
        const balanceAfterStake = Number(newBalRow.rows[0]?.balance);

        await client.query(
            `INSERT INTO bids (user_id, ticker_a, ticker_b, chosen, stake, entry_price_a, entry_price_b)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, tickerA, tickerB, chosen, stake, priceA, priceB]
        );

        // Get the inserted bid id (last_insert_rowid works for both pg and sqlite)
        const bidRow = await client.query(
            `SELECT bid_id, status, chosen, stake, entry_price_a, entry_price_b, entry_time
             FROM bids WHERE user_id = $1 ORDER BY bid_id DESC LIMIT 1`,
            [userId]
        );

        await client.query('COMMIT');

        const bid = bidRow.rows[0];

        // Fetch the potential range AFTER committing — a timeout here must
        // never roll back a valid bid. Failure is non-fatal; returns null.
        let potential: object | null = null;
        try {
            potential = await getPotential(chosen, stake, 1);
        } catch {
            // Python service may be slow or down; bid is already placed
        }

        return {
            bid_id: bid.bid_id,
            status: bid.status,
            chosen: bid.chosen,
            stake: Number(bid.stake),
            entry_price_a: Number(bid.entry_price_a),
            entry_price_b: Number(bid.entry_price_b),
            entry_time: bid.entry_time,
            balance_after_stake: balanceAfterStake,
            // Risk band from the volatility model — a range estimate, NOT a
            // profit prediction. The `note` field from Python is preserved.
            potential_range: potential,
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

export async function settleBid(bidId: number): Promise<object> {
    // Quick pre-check outside the transaction to avoid fetching prices for
    // already-settled bids.  The authoritative guard is the FOR UPDATE below.
    const preCheck = await db.query(`SELECT status FROM bids WHERE bid_id = $1`, [bidId]);
    if (preCheck.rowCount === 0) {
        throw statusError('Bid not found', 404);
    }
    if (preCheck.rows[0].status !== 'pending') {
        return { bid_id: bidId, status: preCheck.rows[0].status, message: 'Already settled — no-op' };
    }

    // Load full bid row (still outside transaction; status may change between
    // here and the lock, which is fine — the FOR UPDATE will catch it).
    const bidRow = await db.query(`SELECT * FROM bids WHERE bid_id = $1`, [bidId]);
    const bid = bidRow.rows[0];

    const [exitA, exitB] = await Promise.all([
        fetchLatestPrice(bid.ticker_a),
        fetchLatestPrice(bid.ticker_b),
    ]);

    const entryA = Number(bid.entry_price_a);
    const entryB = Number(bid.entry_price_b);
    const retA = exitA / entryA - 1;
    const retB = exitB / entryB - 1;
    const chosenRet = bid.chosen === bid.ticker_a ? retA : retB;
    const otherRet  = bid.chosen === bid.ticker_a ? retB : retA;
    const margin    = chosenRet - otherRet;

    let status: string;
    let won: boolean;
    if (margin > 0)      { status = 'won';  won = true;  }
    else if (margin < 0) { status = 'lost'; won = false; }
    else                 { status = 'void'; won = false; }

    const stake  = Number(bid.stake);
    const payout = status === 'void' ? stake : computePayout(stake, won, margin);

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Double-settle guard — re-verify status inside the transaction.
        // FOR UPDATE omitted for SQLite compatibility; the pre-check above
        // and the status change being part of this same transaction are
        // sufficient for single-process deployments.
        const lockResult = await client.query(
            `SELECT status FROM bids WHERE bid_id = $1`,
            [bidId]
        );
        if (lockResult.rows[0].status !== 'pending') {
            await client.query('ROLLBACK');
            return { bid_id: bidId, status: lockResult.rows[0].status, message: 'Already settled — no-op' };
        }

        await client.query(
            `UPDATE bids
             SET status = $1, settle_time = now(),
                 exit_price_a = $2, exit_price_b = $3,
                 payout = $4,
                 ret_a  = $5, ret_b = $6
             WHERE bid_id = $7`,
            [
                status, exitA, exitB, payout,
                Math.round(retA * 1e5) / 1e5,
                Math.round(retB * 1e5) / 1e5,
                bidId,
            ]
        );

        if (payout > 0) {
            await client.query(
                `UPDATE wallets SET balance = balance + $1 WHERE user_id = $2`,
                [payout, bid.user_id]
            );
        }

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }

    const balanceRow = await db.query(`SELECT balance FROM wallets WHERE user_id = $1`, [bid.user_id]);
    return {
        bid_id: bidId,
        status,
        chosen: bid.chosen,
        ret_a:  Math.round(retA  * 1e5) / 1e5,
        ret_b:  Math.round(retB  * 1e5) / 1e5,
        margin: Math.round(margin * 1e5) / 1e5,
        stake,
        payout,
        net_result:  Math.round((payout - stake) * 100) / 100,
        new_balance: Number(balanceRow.rows[0]?.balance),
    };
}

export async function getWallet(userId: number): Promise<object> {
    await ensureWallet(userId);
    const [walletResult, bidsResult] = await Promise.all([
        db.query(`SELECT balance FROM wallets WHERE user_id = $1`, [userId]),
        db.query(
            `SELECT bid_id, ticker_a, ticker_b, chosen, stake, status, payout, entry_time, settle_time
             FROM bids WHERE user_id = $1 ORDER BY entry_time DESC LIMIT 10`,
            [userId]
        ),
    ]);
    return {
        balance:     Number(walletResult.rows[0]?.balance),
        recent_bids: bidsResult.rows,
    };
}

export async function getBidHistory(userId: number): Promise<object[]> {
    const result = await db.query(
        `SELECT bid_id, ticker_a, ticker_b, chosen, stake, status,
                entry_price_a, entry_price_b, exit_price_a, exit_price_b,
                payout, ret_a, ret_b, entry_time, settle_time
         FROM bids WHERE user_id = $1 ORDER BY entry_time DESC`,
        [userId]
    );
    return result.rows;
}

export async function getPendingBids(): Promise<{ bid_id: number }[]> {
    const result = await db.query(`SELECT bid_id FROM bids WHERE status = 'pending'`);
    return result.rows;
}

export async function getPnl(bidId: number, userId: number): Promise<object> {
    const bidResult = await db.query(
        `SELECT bid_id, user_id, ticker_a, ticker_b, chosen, stake,
                entry_price_a, entry_price_b, status
         FROM bids WHERE bid_id = $1`,
        [bidId]
    );
    if (bidResult.rowCount === 0) {
        throw statusError('Bid not found', 404);
    }
    const bid = bidResult.rows[0];
    if (Number(bid.user_id) !== userId) {
        throw statusError('Forbidden', 403);
    }

    // Fetch live prices in parallel via the fast /price endpoint
    const [priceA, priceB] = await Promise.all([
        fetchLatestPrice(bid.ticker_a),
        fetchLatestPrice(bid.ticker_b),
    ]);

    const entryA = Number(bid.entry_price_a);
    const entryB = Number(bid.entry_price_b);
    const stake  = Number(bid.stake);

    // position_pnl formula from pnl_engine.py:
    //   current_value = stake * (live_price / entry_price)
    //   pnl           = current_value - stake
    const pnlA = Math.round((stake * (priceA / entryA) - stake) * 100) / 100;
    const pnlB = Math.round((stake * (priceB / entryB) - stake) * 100) / 100;

    return {
        bid_id: bidId,
        status: bid.status,
        ticker_a: bid.ticker_a,
        ticker_b: bid.ticker_b,
        chosen:   bid.chosen,
        stake,
        priceA, priceB,
        entryA,  entryB,
        pnlA,    pnlB,
        edge: Math.round((pnlA - pnlB) * 100) / 100,
    };
}

export async function getPotential(
    ticker: string,
    stake: number,
    horizonDays: number = 1,
): Promise<object> {
    const response = await axios.get(`${PYTHON_ENGINE_URL}/potential`, {
        params: { ticker, stake, horizon_days: horizonDays },
        timeout: 90000,
    });
    return response.data;
}
