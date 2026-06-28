import cron from 'node-cron';
import { getPendingBids, settleBid } from './services/biddingService';

// NSE closes at 15:30 IST = 10:00 UTC, Monday-Friday.
// A bid is eligible to settle once the first market close AFTER its entry_time
// has passed.

function lastNseClose(now: Date): Date {
    // Start from today's 10:00:00 UTC
    const close = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        10, 0, 0, 0
    ));

    // If today's close hasn't happened yet, roll back one calendar day
    if (close >= now) {
        close.setUTCDate(close.getUTCDate() - 1);
    }

    // Skip weekends (0 = Sunday, 6 = Saturday)
    while (close.getUTCDay() === 0 || close.getUTCDay() === 6) {
        close.setUTCDate(close.getUTCDate() - 1);
    }

    return close;
}

async function settleAllDue(): Promise<void> {
    const cutoff = lastNseClose(new Date());
    console.log(`[Scheduler] Settlement run — cutoff: ${cutoff.toISOString()}`);

    let pending: { bid_id: number }[];
    try {
        pending = await getPendingBids();
    } catch (err) {
        console.error('[Scheduler] Failed to fetch pending bids:', err);
        return;
    }

    if (pending.length === 0) {
        console.log('[Scheduler] No pending bids.');
        return;
    }

    // Settle each bid sequentially so DB load stays manageable
    for (const { bid_id } of pending) {
        try {
            const result = await settleBid(bid_id);
            console.log(`[Scheduler] Settled bid ${bid_id}:`, result);
        } catch (err: any) {
            // Log and continue — one failure must not abort the rest
            console.error(`[Scheduler] Failed to settle bid ${bid_id}:`, err.message);
        }
    }
}

export function startScheduler(): void {
    // Run once immediately on startup to settle any bids that were missed
    // while the server was down (e.g. weekend restart, deploy downtime).
    settleAllDue().catch(err => console.error('[Scheduler] Startup run failed:', err));

    // Daily at 10:01 UTC, weekdays only (just after NSE close).
    // The double-settle guard in settleBid means it is safe to run this more
    // frequently without risk; once-daily is sufficient for correctness.
    cron.schedule('1 10 * * 1-5', () => {
        settleAllDue().catch(err => console.error('[Scheduler] Cron run failed:', err));
    }, { timezone: 'UTC' });

    console.log('[Scheduler] Settlement scheduler started (daily 10:01 UTC, weekdays).');
}
