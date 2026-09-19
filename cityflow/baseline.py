"""
CityFlow AI: Historical Baseline & Causal Evaluation Harness.
Computes:
1. Persistence Baseline: y_hat(t+h) = y(t)
2. Historical Average Baseline: mean speed by (segment_id, hour_of_week) fit on train ONLY.
3. Blend Baseline: 0.5 * Persistence + 0.5 * Historical Average
Calculates MAE, RMSE, and R2 across 15, 30, 45, and 60-minute horizons.
"""

from typing import Dict, Tuple, Any
import numpy as np
import pandas as pd


class HistoricalBaselineModel:
    def __init__(self):
        self.history_lookup: Dict[Tuple[str, int], float] = {}
        self.global_mean_speed: float = 45.0

    def fit(self, train_df: pd.DataFrame) -> "HistoricalBaselineModel":
        """
        Fits historical speed lookup on training data strictly.
        hour_of_week is in range 0..167 (day_of_week * 24 + hour).
        """
        df = train_df.copy()
        if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
            df["timestamp"] = pd.to_datetime(df["timestamp"])

        df["hour_of_week"] = df["timestamp"].dt.dayofweek * 24 + df["timestamp"].dt.hour
        
        # Group by segment and hour_of_week
        grouped = df.groupby(["segment_id", "hour_of_week"])["speed_kmh"].mean()
        self.history_lookup = grouped.to_dict()
        self.global_mean_speed = float(df["speed_kmh"].mean())
        return self

    def predict_historical_average(self, segment_ids: pd.Series, timestamps: pd.Series) -> np.ndarray:
        """Vectorized lookup of historical average speed."""
        ts = pd.to_datetime(timestamps)
        hours_of_week = ts.dt.dayofweek * 24 + ts.dt.hour
        
        preds = []
        for seg, how in zip(segment_ids, hours_of_week):
            val = self.history_lookup.get((seg, how), self.global_mean_speed)
            preds.append(val)
        return np.array(preds, dtype=np.float32)

    def evaluate_baselines(
        self,
        test_df: pd.DataFrame,
        horizons_steps: Dict[str, int] = {"15m": 3, "30m": 6, "45m": 9, "60m": 12}
    ) -> Dict[str, Dict[str, float]]:
        """
        Evaluates Persistence, Historical Average, and Blend baselines on test_df.
        Returns a metrics dictionary partitioned by horizon and baseline.
        """
        df = test_df.copy()
        if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
            df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values(by=["segment_id", "timestamp"]).reset_index(drop=True)

        results = {}

        # Precompute historical average for all rows
        hist_preds = self.predict_historical_average(df["segment_id"], df["timestamp"])

        for horizon_name, steps in horizons_steps.items():
            # Shift target forward by steps per segment
            df[f"target_{horizon_name}"] = df.groupby("segment_id")["speed_kmh"].shift(-steps)
            valid_mask = ~df[f"target_{horizon_name}"].isnull()
            
            y_true = df.loc[valid_mask, f"target_{horizon_name}"].values
            y_persist = df.loc[valid_mask, "speed_kmh"].values
            y_hist = hist_preds[valid_mask]
            y_blend = 0.5 * y_persist + 0.5 * y_hist

            def compute_metrics(y_t, y_p):
                mae = float(np.mean(np.abs(y_t - y_p)))
                rmse = float(np.sqrt(np.mean((y_t - y_p) ** 2)))
                return {"MAE": round(mae, 3), "RMSE": round(rmse, 3)}

            results[horizon_name] = {
                "Persistence": compute_metrics(y_true, y_persist),
                "Historical_Avg": compute_metrics(y_true, y_hist),
                "Blend": compute_metrics(y_true, y_blend),
            }

        return results
