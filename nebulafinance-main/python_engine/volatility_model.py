"""
volatility_model.py

Loads the trained Log-HAR + XGBoost volatility model bundle (vol_model_india.pkl,
produced by Cell 10b in the training notebook) and exposes a clean predict()
function for the backend to call.
"""

from __future__ import annotations
import numpy as np
import pandas as pd
import joblib

from features import add_price_features, add_market_context, ALL_FEATURES_LOG, HAR_FEATURES_LOG


class VolatilityModel:
    def __init__(self, bundle_path: str):
        bundle = joblib.load(bundle_path)
        self.model = bundle["model"]
        self.har_model = bundle.get("har_model")
        self.features = bundle["features"]
        self.har_features = bundle.get("har_features", HAR_FEATURES_LOG)
        self.horizon = bundle.get("horizon", 5)
        self.log_target = bundle.get("log_target", True)

    def predict_from_history(
        self,
        price_df: pd.DataFrame,
        vix_df: pd.DataFrame,
        index_ret: pd.Series,
    ) -> dict | None:
        """
        price_df: OHLCV history for ONE ticker, tz-naive DatetimeIndex,
                  columns Open/High/Low/Close/Volume. Needs at least ~60
                  trading days of history for the rolling features to warm up.
        vix_df:   output of features.build_vix_context(india_vix_close_series)
        index_ret: pct_change() Series of the NIFTY 50 (or other benchmark) close
        """
        if len(price_df) < 30:
            return None

        feat = add_price_features(price_df)
        feat = add_market_context(feat, vix_df, index_ret)
        feat = feat.dropna(subset=self.features)
        if len(feat) == 0:
            return None

        x = feat[self.features].iloc[[-1]]
        log_pred = self.model.predict(x)[0]
        pred_vol = float(np.exp(log_pred)) if self.log_target else float(log_pred)

        recent_vol = float(feat["rv22"].iloc[-1]) if "rv22" in feat.columns else None
        relative = round(pred_vol / recent_vol, 3) if recent_vol else None

        result = {
            "predicted_vol": round(pred_vol, 6),
            "horizon_days": self.horizon,
            "annualized_pct": round(pred_vol * np.sqrt(252) * 100, 2),
            "recent_22d_vol": round(recent_vol, 6) if recent_vol else None,
            "vol_relative_to_recent": relative,
        }

        if self.har_model is not None:
            har_log_pred = self.har_model.predict(x[self.har_features])[0]
            har_vol = float(np.exp(har_log_pred)) if self.log_target else float(har_log_pred)
            result["har_baseline_vol"] = round(har_vol, 6)
            result["model_vs_har_diff_pct"] = round((pred_vol / har_vol - 1) * 100, 1) if har_vol else None

        return result
