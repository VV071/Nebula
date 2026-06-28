"""
bidding_engine.py

The fake-currency bidding game logic, layered on top of the comparison engine.

Game loop:
  1. place_bid()  -- user backs one of two stocks to be the "relative winner";
                     stake is deducted, entry prices recorded.
  2. settle_bid() -- at/after the next market close, compares each stock's
                     return since entry; if the user's pick had the higher
                     return, they win a payout SCALED by the margin of victory.

Payout model (scaled by outperformance):
  - Let margin = chosen_return - other_return  (only meaningful if positive == win)
  - Base: a win returns the stake plus a profit proportional to the margin,
    capped so a tiny margin doesn't pay nothing and a huge one doesn't break
    the bank. Tune MIN_MULT / MAX_MULT / MARGIN_SCALE to taste.
"""

from __future__ import annotations
from datetime import datetime, timezone
import yfinance as yf
import pandas as pd

import bidding_db as db

# --- payout tuning ---
MIN_MULT = 1.2          # a correct pick with ~0 margin returns 1.2x stake
MAX_MULT = 3.0          # cap on payout multiple for a blowout win
MARGIN_SCALE = 20.0     # how fast payout grows with margin (margin is a fraction, e.g. 0.03 = 3%)


def _latest_price(ticker: str) -> float | None:
    df = yf.Ticker(ticker).history(period="5d", auto_adjust=True)
    if len(df) == 0:
        return None
    return float(df["Close"].iloc[-1])


def place_bid(user_id: str, ticker_a: str, ticker_b: str, chosen: str, stake: float) -> dict:
    """Place a bid that `chosen` (must equal ticker_a or ticker_b) will be the
    relative winner. Returns the created bid record or an error."""
    if chosen not in (ticker_a, ticker_b):
        return {"error": "chosen must be one of the two tickers"}
    if stake <= 0:
        return {"error": "stake must be positive"}

    db.get_or_create_user(user_id)
    if db.get_balance(user_id) < stake:
        return {"error": "insufficient balance"}

    price_a = _latest_price(ticker_a)
    price_b = _latest_price(ticker_b)
    if price_a is None or price_b is None:
        return {"error": "could not fetch entry prices for one or both tickers"}

    bid_id = db.record_bid(user_id, ticker_a, ticker_b, chosen, stake, price_a, price_b)
    return {
        "bid_id": bid_id,
        "status": "pending",
        "chosen": chosen,
        "stake": stake,
        "entry_price_a": price_a,
        "entry_price_b": price_b,
        "balance_after_stake": db.get_balance(user_id),
    }


def _compute_payout(stake: float, won: bool, margin: float) -> float:
    """Scaled payout: 0 if lost; else stake * multiplier, where the multiplier
    grows with the margin of outperformance, clamped to [MIN_MULT, MAX_MULT]."""
    if not won:
        return 0.0
    mult = MIN_MULT + MARGIN_SCALE * max(margin, 0.0)
    mult = min(mult, MAX_MULT)
    return round(stake * mult, 2)


def settle_bid(bid_id: int) -> dict:
    """Settle a single pending bid against current prices. In production you'd
    call this from a scheduled job that runs after each market close and only
    settles bids whose entry_time is before that close."""
    pending = {b["bid_id"]: b for b in db.get_pending_bids()}
    bid = pending.get(bid_id)
    if bid is None:
        return {"error": "bid not found or already settled"}

    exit_a = _latest_price(bid["ticker_a"])
    exit_b = _latest_price(bid["ticker_b"])
    if exit_a is None or exit_b is None:
        return {"error": "could not fetch settle prices"}

    ret_a = exit_a / bid["entry_price_a"] - 1
    ret_b = exit_b / bid["entry_price_b"] - 1

    chosen_ret = ret_a if bid["chosen"] == bid["ticker_a"] else ret_b
    other_ret = ret_b if bid["chosen"] == bid["ticker_a"] else ret_a
    margin = chosen_ret - other_ret

    if margin > 0:
        status, won = "won", True
    elif margin < 0:
        status, won = "lost", False
    else:
        # exact tie — refund the stake, call it void
        status, won = "void", False

    payout = bid["stake"] if status == "void" else _compute_payout(bid["stake"], won, margin)
    settle_time = datetime.now(timezone.utc).isoformat()

    db.settle_bid(bid_id, status, payout, settle_time, exit_a, exit_b,
                  round(ret_a, 5), round(ret_b, 5))

    return {
        "bid_id": bid_id,
        "status": status,
        "chosen": bid["chosen"],
        "ret_a": round(ret_a, 5),
        "ret_b": round(ret_b, 5),
        "margin": round(margin, 5),
        "stake": bid["stake"],
        "payout": payout,
        "net_result": round(payout - bid["stake"], 2),
        "new_balance": db.get_balance(bid["user_id"]),
    }


def settle_all_due() -> list[dict]:
    """Settle every pending bid that is ready. (Window logic — only settling
    bids past their next-close — would go here; kept simple for the demo.)"""
    return [settle_bid(b["bid_id"]) for b in db.get_pending_bids()]
