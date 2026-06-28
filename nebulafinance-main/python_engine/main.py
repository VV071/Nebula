"""
main.py  --  Nebula Finance Python comparison engine microservice

Run with:
    cd nebulafinance-main/python_engine
    pip install -r requirements.txt
    uvicorn main:app --port 8001 --reload

The Node.js backend (port 5005) proxies /api/market/compare and
/api/market/scorecard to this service.

VOL_MODEL_PATH env var overrides the default pkl location.
"""

from __future__ import annotations
import os
import time
import pandas as pd
import yfinance as yf
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from comparison_engine import ComparisonEngine
from pnl_engine import get_live_price, potential_range

app = FastAPI(title="Nebula Finance — Stock Comparison Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

engine: ComparisonEngine | None = None


def load_context():
    """Fetch India VIX + NIFTY history for market-context features.
    Refresh daily in production to keep data current."""
    vix = yf.Ticker("^INDIAVIX").history(period="6mo", auto_adjust=True)["Close"]
    nifty = yf.Ticker("^NSEI").history(period="6mo", auto_adjust=True)["Close"]
    vix.index = pd.to_datetime(vix.index).tz_localize(None)
    nifty.index = pd.to_datetime(nifty.index).tz_localize(None)
    return vix, nifty


@app.on_event("startup")
def startup():
    global engine
    # Default: ../backend/vol_model_india.pkl (relative to this file's directory)
    default_path = os.path.join(os.path.dirname(__file__), "..", "backend", "vol_model_india.pkl")
    model_path = os.environ.get("VOL_MODEL_PATH", default_path)
    print(f"[Engine] Loading model from: {os.path.abspath(model_path)}")
    vix, nifty = load_context()
    engine = ComparisonEngine(
        vol_model_path=model_path,
        vix_close=vix,
        index_close=nifty,
    )
    print("[Engine] Ready.")


@app.get("/health")
def health():
    return {"status": "ok", "engine_loaded": engine is not None}


@app.get("/compare")
def compare(
    stock_a: str = Query(..., example="TCS.NS"),
    stock_b: str = Query(..., example="INFY.NS"),
):
    """Head-to-head comparison of two stocks."""
    if engine is None:
        return {"error": "Engine not initialised"}
    return engine.compare(stock_a, stock_b)


@app.get("/scorecard")
def scorecard(ticker: str = Query(..., example="RELIANCE.NS")):
    """Single-stock scorecard (all signals)."""
    if engine is None:
        return {"error": "Engine not initialised"}
    card = engine.build_scorecard(ticker)
    if card is None:
        return {"error": f"Could not fetch enough data for {ticker}"}
    return card


# ── Caches ────────────────────────────────────────────────────────────────────
# Simple dict-based TTL caches — no extra dependencies.

_price_cache:     dict[str, tuple[float, dict]] = {}  # ticker -> (ts, result)
_scorecard_cache: dict[str, tuple[float, dict]] = {}  # ticker -> (ts, result)

PRICE_CACHE_TTL     = 15   # seconds — matches poll interval on the frontend
SCORECARD_CACHE_TTL = 300  # 5 min — vol forecast doesn't change that fast


def _cached_price(ticker: str) -> dict | None:
    now = time.time()
    if ticker in _price_cache:
        ts, result = _price_cache[ticker]
        if now - ts < PRICE_CACHE_TTL:
            return result
    result = get_live_price(ticker)
    if result is not None:
        _price_cache[ticker] = (now, result)
    return result


def _cached_scorecard(ticker: str) -> dict | None:
    now = time.time()
    if ticker in _scorecard_cache and engine is not None:
        ts, result = _scorecard_cache[ticker]
        if now - ts < SCORECARD_CACHE_TTL:
            return result
    if engine is None:
        return None
    result = engine.build_scorecard(ticker)
    if result is not None:
        _scorecard_cache[ticker] = (now, result)
    return result


# ── P&L endpoints ─────────────────────────────────────────────────────────────

@app.get("/price")
def price(ticker: str = Query(..., example="RELIANCE.NS")):
    """Latest available price for one ticker, cached for 15 s.
    Uses intraday 1-min data during market hours, daily close otherwise."""
    result = _cached_price(ticker)
    if result is None:
        return {"error": f"Could not fetch price for {ticker}"}
    return result


@app.get("/potential")
def potential(
    ticker: str = Query(..., example="RELIANCE.NS"),
    stake: float = Query(..., gt=0, example=1000),
    horizon_days: int = Query(1, ge=1, le=30),
):
    """Volatility-model risk band for a staked position.
    Returns a RANGE estimate — NOT a direction prediction or profit guarantee."""
    card = _cached_scorecard(ticker)
    if card is None:
        return {"error": f"Could not build scorecard for {ticker}"}
    vol = card.get("volatility_forecast") or {}
    predicted_vol = vol.get("predicted_vol")
    if predicted_vol is None:
        return {"error": "Volatility forecast unavailable for this ticker"}
    return potential_range(stake, predicted_vol, horizon_days)
