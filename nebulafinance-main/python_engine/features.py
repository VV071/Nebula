"""
features.py

Feature engineering for the Nebula Finance volatility model.
This MUST be identical to whatever was used during training in your Colab
notebook (Cells 3b / 4b) -- if this drifts from training, predictions will
be silently wrong. Treat this file as the single source of truth going
forward: update it here, then re-train, rather than editing notebook cells.
"""

import numpy as np
import pandas as pd

EPS = 1e-6

HAR_FEATURES_LOG = ["log_rv1", "log_rv5", "log_rv22"]
TECH_FEATURES = ["atr_pct", "range_pct", "vol_ratio", "dist_ma20", "ma_cross", "mom10"]
MARKET_FEATURES = ["log_vix", "log_vix_lag5", "log_vix_lag22", "vix_chg5", "beta_20"]
ALL_FEATURES_LOG = HAR_FEATURES_LOG + TECH_FEATURES + MARKET_FEATURES


def add_price_features(df: pd.DataFrame) -> pd.DataFrame:
    """Per-stock technical + HAR-style volatility features. Input: OHLCV DataFrame
    with a DatetimeIndex (tz-naive) and columns Open, High, Low, Close, Volume."""
    df = df.copy()
    c = df["Close"]
    ret = c.pct_change()
    df["ret"] = ret

    df["rv1"] = ret.abs()
    df["rv5"] = ret.rolling(5).std()
    df["rv22"] = ret.rolling(22).std()

    df["log_rv1"] = np.log(df["rv1"] + EPS)
    df["log_rv5"] = np.log(df["rv5"] + EPS)
    df["log_rv22"] = np.log(df["rv22"] + EPS)

    tr = pd.concat(
        [
            df["High"] - df["Low"],
            (df["High"] - c.shift()).abs(),
            (df["Low"] - c.shift()).abs(),
        ],
        axis=1,
    ).max(axis=1)
    df["atr_pct"] = tr.rolling(14).mean() / c
    df["range_pct"] = (df["High"] - df["Low"]) / c

    df["vol_ratio"] = df["Volume"] / df["Volume"].rolling(20).mean()

    ma10, ma20 = c.rolling(10).mean(), c.rolling(20).mean()
    df["dist_ma20"] = c / ma20 - 1
    df["ma_cross"] = (ma10 > ma20).astype(int)
    df["mom10"] = c.pct_change(10)

    return df


def add_target(df: pd.DataFrame, horizon: int = 5) -> pd.DataFrame:
    """Only used during training/backtesting, not at live inference time."""
    df = df.copy()
    ret = df["Close"].pct_change()
    raw_target = ret.rolling(horizon).std().shift(-horizon)
    df["target_vol"] = raw_target
    df["log_target_vol"] = np.log(raw_target + EPS)
    return df


def build_vix_context(vix_close: pd.Series) -> pd.DataFrame:
    """vix_close: a Series of India VIX closing prices, tz-naive DatetimeIndex."""
    vix_df = pd.DataFrame({"vix_level": vix_close})
    vix_df["log_vix"] = np.log(vix_df["vix_level"] + EPS)
    vix_df["log_vix_lag5"] = vix_df["log_vix"].rolling(5).mean()
    vix_df["log_vix_lag22"] = vix_df["log_vix"].rolling(22).mean()
    vix_df["vix_chg5"] = vix_df["vix_level"].pct_change(5)
    return vix_df


def add_market_context(
    df: pd.DataFrame, vix_df: pd.DataFrame, index_ret: pd.Series, window: int = 20
) -> pd.DataFrame:
    """index_ret: pct_change() Series of the benchmark index (NIFTY 50 / ^NSEI),
    named 'spy_ret' to match the original notebook's column name."""
    df = df.copy()
    df = df.merge(vix_df, left_index=True, right_index=True, how="left")
    df = df.merge(index_ret.rename("spy_ret"), left_index=True, right_index=True, how="left")
    for col in ["log_vix", "log_vix_lag5", "log_vix_lag22", "vix_chg5"]:
        df[col] = df[col].ffill()

    stock_ret = df["Close"].pct_change()
    cov = stock_ret.rolling(window).cov(df["spy_ret"])
    var = df["spy_ret"].rolling(window).var()
    df["beta_20"] = cov / var
    return df
