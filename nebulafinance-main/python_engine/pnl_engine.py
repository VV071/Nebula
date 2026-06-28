"""
pnl_engine.py

Profit/loss engine for the fake-money investment simulator.

Two distinct, honestly-separated numbers:

  1. REALIZED-SO-FAR P&L  (knowable, exact):
       current_value = stake * (live_price / entry_price)
       This is just real market % movement applied to fake currency.

  2. POTENTIAL RANGE  (an honest forecast, NOT a promise):
       Uses the trained volatility model's forecast of how much the stock is
       likely to move over the horizon, expressed as a +/- band on the stake.
       This answers "how much could I gain or lose" as a RANGE, never a point
       prediction of direction.

The head-to-head number the user asked for is simply the difference in current
P&L between the two stocks' real returns applied to the staked amount.
"""

from __future__ import annotations
import numpy as np
import pandas as pd
import yfinance as yf


def get_live_price(ticker: str) -> dict | None:
    """Latest available price. Intraday during market hours (delayed ~15min on
    Yahoo), last close otherwise. For simulation only -- not a trading feed."""
    try:
        intraday = yf.Ticker(ticker).history(period="1d", interval="1m", auto_adjust=True)
        if len(intraday) > 0:
            return {
                "ticker": ticker,
                "price": round(float(intraday["Close"].iloc[-1]), 2),
                "as_of": intraday.index[-1].isoformat(),
                "source": "intraday_1m",
            }
    except Exception:
        pass
    try:
        daily = yf.Ticker(ticker).history(period="5d", auto_adjust=True)
        if len(daily) > 0:
            return {
                "ticker": ticker,
                "price": round(float(daily["Close"].iloc[-1]), 2),
                "as_of": daily.index[-1].isoformat(),
                "source": "daily_close",
            }
    except Exception:
        pass
    return None


def position_pnl(stake: float, entry_price: float, live_price: float) -> dict:
    """Realized-so-far P&L for one position. Exact, knowable -- real % move
    applied to the fake stake."""
    pct_change = live_price / entry_price - 1
    current_value = stake * (1 + pct_change)
    return {
        "stake": round(stake, 2),
        "entry_price": round(entry_price, 2),
        "live_price": round(live_price, 2),
        "pct_change": round(pct_change * 100, 3),
        "current_value": round(current_value, 2),
        "pnl": round(current_value - stake, 2),
    }


def potential_range(stake: float, predicted_vol: float, horizon_days: int,
                    n_sigma: float = 1.0) -> dict:
    """Honest 'how much could this move' as a RANGE, from the volatility model.
    predicted_vol is the model's forecast of DAILY volatility (std of daily
    returns). Scale to the horizon by sqrt(time). This is a risk band, NOT a
    prediction of direction or a promise of profit."""
    horizon_vol = predicted_vol * np.sqrt(horizon_days)   # sqrt-time scaling
    move = stake * horizon_vol * n_sigma
    return {
        "horizon_days": horizon_days,
        "expected_move_pct": round(horizon_vol * n_sigma * 100, 2),
        "potential_up_value": round(stake + move, 2),
        "potential_down_value": round(stake - move, 2),
        "potential_swing": round(move, 2),   # +/- this much, roughly, over the horizon
        "note": ("Estimated range of movement from the volatility model -- "
                 "NOT a prediction of direction or a guarantee of profit/loss."),
    }


def compare_positions(
    stake: float,
    entry_a: float, live_a: float,
    entry_b: float, live_b: float,
    chosen: str, ticker_a: str, ticker_b: str,
) -> dict:
    """Head-to-head: how each stock's real return treats the same stake, and
    how much better/worse off the user's pick is vs the alternative."""
    pnl_a = position_pnl(stake, entry_a, live_a)
    pnl_b = position_pnl(stake, entry_b, live_b)

    chosen_pnl = pnl_a if chosen == ticker_a else pnl_b
    other_pnl = pnl_b if chosen == ticker_a else pnl_a
    edge = chosen_pnl["pnl"] - other_pnl["pnl"]   # how much better off the pick is

    if edge > 0:
        verdict = f"Your pick ({chosen}) is ahead by {round(edge,2)}"
    elif edge < 0:
        verdict = f"Your pick ({chosen}) is behind by {round(abs(edge),2)}"
    else:
        verdict = "Dead even"

    return {
        "ticker_a": ticker_a, "pnl_a": pnl_a,
        "ticker_b": ticker_b, "pnl_b": pnl_b,
        "chosen": chosen,
        "edge_vs_other": round(edge, 2),
        "verdict": verdict,
    }
