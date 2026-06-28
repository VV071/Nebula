"""
comparison_engine.py

The main entry point for the bidding app's backend. Wraps:
  - technical_signals.py   (momentum / trend / RSI, no model)
  - volatility_model.py    (trained Log-HAR + XGBoost forecast)
  - news_sentiment.py      (live VADER sentiment on fresh headlines)
into one transparent scorecard, and a head-to-head comparison.
"""

from __future__ import annotations
import numpy as np
import pandas as pd
import yfinance as yf

from volatility_model import VolatilityModel
from technical_signals import get_technical_signals
from news_sentiment import get_news_sentiment
from features import build_vix_context

DISCLAIMER = (
    "This is a data-driven comparison for simulation/educational purposes. "
    "It indicates which stock currently shows more positive signals -- it is "
    "NOT a prediction that the stock will rise, and not financial advice. "
    "Markets are unpredictable; use this as one input among many."
)

DEFAULT_WEIGHTS = {
    "momentum_1m": 0.20,
    "momentum_3m": 0.15,
    "trend": 0.20,
    "rsi_position": 0.10,
    "news_sentiment": 0.25,
    "movement_potential": 0.10,
}


def _normalize(value, low, high):
    if value is None or high == low:
        return 50.0
    return float(np.clip((value - low) / (high - low) * 100, 0, 100))


class ComparisonEngine:
    def __init__(self, vol_model_path: str, vix_close: pd.Series, index_close: pd.Series):
        self.vol_model = VolatilityModel(vol_model_path)
        self.vix_df = build_vix_context(vix_close)
        self.index_ret = index_close.pct_change()

    def _fetch_history(self, ticker: str, period: str = "1y") -> pd.DataFrame:
        df = yf.Ticker(ticker).history(period=period, auto_adjust=True)
        if len(df) == 0:
            return df
        df.index = pd.to_datetime(df.index).tz_localize(None)
        return df[["Open", "High", "Low", "Close", "Volume"]]

    def build_scorecard(self, ticker: str, weights: dict | None = None) -> dict | None:
        weights = weights or DEFAULT_WEIGHTS
        price_df = self._fetch_history(ticker)
        tech = get_technical_signals(price_df)
        if tech is None:
            return None
        news = get_news_sentiment(ticker)
        vol_result = self.vol_model.predict_from_history(price_df, self.vix_df, self.index_ret)

        rel_vol = vol_result.get("vol_relative_to_recent") if vol_result else None
        movement_score = _normalize(rel_vol, 0.8, 1.3) if rel_vol else 50.0

        component_scores = {
            "momentum_1m": _normalize(tech["mom_22"], -0.15, 0.15),
            "momentum_3m": _normalize(tech["mom_63"], -0.25, 0.25),
            "trend": 80.0 if tech["above_ma50"] else 30.0,
            "rsi_position": _normalize(tech["rsi_14"], 30, 70),
            "news_sentiment": _normalize(news["avg_sentiment"], -0.4, 0.4),
            "movement_potential": movement_score,
        }
        composite = round(sum(component_scores[k] * weights[k] for k in component_scores), 1)

        return {
            "ticker": ticker,
            "composite_lean_score": composite,
            "component_scores": {k: round(v, 1) for k, v in component_scores.items()},
            "weights": weights,
            "raw_technicals": tech,
            "volatility_forecast": vol_result,
            "news": news,
        }

    def compare(self, ticker_a: str, ticker_b: str, weights: dict | None = None) -> dict:
        card_a = self.build_scorecard(ticker_a, weights)
        card_b = self.build_scorecard(ticker_b, weights)

        if card_a is None or card_b is None:
            return {"error": "Could not fetch enough data for one or both stocks"}

        a, b = card_a["composite_lean_score"], card_b["composite_lean_score"]
        lean = ticker_a if a > b else ticker_b
        margin = abs(a - b)
        confidence = "Slight lean" if margin < 10 else "Moderate lean" if margin < 25 else "Stronger lean"

        return {
            "stock_a": card_a,
            "stock_b": card_b,
            "lean_towards": lean,
            "lean_margin": round(margin, 1),
            "confidence": confidence,
            "disclaimer": DISCLAIMER,
        }
