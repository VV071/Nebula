"""
technical_signals.py

Momentum / trend / RSI signals computed directly from price history.
No trained model needed -- pure technical calculation.
"""

from __future__ import annotations
import numpy as np
import pandas as pd


def compute_rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    up = delta.clip(lower=0).rolling(period).mean()
    down = (-delta.clip(upper=0)).rolling(period).mean()
    rs = up / down.replace(0, np.nan)
    return 100 - 100 / (1 + rs)


def get_technical_signals(price_df: pd.DataFrame) -> dict | None:
    """price_df: OHLCV history, tz-naive DatetimeIndex, needs >= 60 rows."""
    if len(price_df) < 60:
        return None
    c = price_df["Close"]

    return {
        "last_price": round(float(c.iloc[-1]), 2),
        "mom_22": round(float(c.pct_change(22).iloc[-1]), 4),
        "mom_63": round(float(c.pct_change(63).iloc[-1]), 4),
        "above_ma50": bool(c.iloc[-1] > c.rolling(50).mean().iloc[-1]),
        "rsi_14": round(float(compute_rsi(c, 14).iloc[-1]), 1),
        "realized_vol_22": round(float(c.pct_change().rolling(22).std().iloc[-1]), 5),
        "ret_5d": round(float(c.pct_change(5).iloc[-1]), 4),
    }
