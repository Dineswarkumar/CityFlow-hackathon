"""
CityFlow AI: Telemetry Cleaner & Robust Noise Filter.
Addresses manifest noise:
- Missing values
- Duplicates
- Spurious spikes
- Stuck sensors (constant values)
- Impossible negative readings
- Row shuffle (out-of-order timestamps)
"""

from typing import Dict, Any, Tuple
import numpy as np
import pandas as pd


class TelemetryCleaner:
    def __init__(self, stuck_sensor_window: int = 6, max_speed_spike: float = 65.0):
        """
        Args:
            stuck_sensor_window: Number of consecutive identical readings that triggers a stuck sensor flag.
            max_speed_spike: Max plausible speed change (km/h) in a single 5-minute interval.
        """
        self.stuck_window = stuck_sensor_window
        self.max_spike = max_speed_spike

    def clean_traffic_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Sanitizes raw traffic telemetry with defensive error recovery.
        Returns cleaned dataframe and a diagnostic cleaning report.
        """
        report = {
            "initial_rows": len(df),
            "duplicates_removed": 0,
            "negative_speeds_fixed": 0,
            "negative_flows_fixed": 0,
            "stuck_sensors_detected": 0,
            "spikes_smoothed": 0,
            "missing_values_imputed": 0,
            "sorted_rows": True,
        }

        cleaned = df.copy()

        # 1. Row Shuffle: Ensure timestamp is datetime and sort chronologically per segment
        if not pd.api.types.is_datetime64_any_dtype(cleaned["timestamp"]):
            cleaned["timestamp"] = pd.to_datetime(cleaned["timestamp"])

        cleaned = cleaned.sort_values(by=["segment_id", "timestamp"]).reset_index(drop=True)

        # 2. Duplicates: Remove identical (segment_id, timestamp) collisions
        dup_mask = cleaned.duplicated(subset=["segment_id", "timestamp"], keep="last")
        report["duplicates_removed"] = int(dup_mask.sum())
        if report["duplicates_removed"] > 0:
            cleaned = cleaned[~dup_mask].reset_index(drop=True)

        # 3. Impossible Negative Readings
        if "speed_kmh" in cleaned.columns:
            neg_speed_mask = cleaned["speed_kmh"] < 0
            report["negative_speeds_fixed"] = int(neg_speed_mask.sum())
            if report["negative_speeds_fixed"] > 0:
                cleaned.loc[neg_speed_mask, "speed_kmh"] = np.nan

        if "flow_vph" in cleaned.columns:
            neg_flow_mask = cleaned["flow_vph"] < 0
            report["negative_flows_fixed"] = int(neg_flow_mask.sum())
            if report["negative_flows_fixed"] > 0:
                cleaned.loc[neg_flow_mask, "flow_vph"] = np.nan

        # 4. Stuck Sensor Detection (Constant values over rolling window)
        if "sensor_quality" not in cleaned.columns:
            cleaned["sensor_quality"] = 1.0

        # Group by segment to evaluate temporal continuity
        if "speed_kmh" in cleaned.columns and len(cleaned) > self.stuck_window:
            # Shift check: identical readings across consecutive timesteps
            same_as_prev = cleaned.groupby("segment_id")["speed_kmh"].diff().abs() < 1e-4
            # If speed is identical for W steps and speed > 0 (stuck reading)
            consec_same = same_as_prev.astype(int).groupby(cleaned["segment_id"]).transform(
                lambda s: s.rolling(self.stuck_window, min_periods=self.stuck_window).sum()
            )
            stuck_mask = (consec_same >= self.stuck_window - 1) & (cleaned["speed_kmh"] > 5.0)
            report["stuck_sensors_detected"] = int(stuck_mask.sum())
            if report["stuck_sensors_detected"] > 0:
                cleaned.loc[stuck_mask, "sensor_quality"] = 0.2

        # 5. Outlier Spikes
        if "speed_kmh" in cleaned.columns:
            speed_delta = cleaned.groupby("segment_id")["speed_kmh"].diff().abs()
            spike_mask = speed_delta > self.max_spike
            report["spikes_smoothed"] = int(spike_mask.sum())
            if report["spikes_smoothed"] > 0:
                cleaned.loc[spike_mask, "speed_kmh"] = np.nan

        # 6. Missing Value Imputation
        numeric_cols = cleaned.select_dtypes(include=[np.number]).columns
        report["missing_values_imputed"] = int(cleaned[numeric_cols].isnull().sum().sum())

        # Forward fill per segment, then backward fill, then median fallback
        if report["missing_values_imputed"] > 0:
            cleaned = cleaned.groupby("segment_id", group_keys=False).apply(
                lambda g: g.ffill().bfill()
            )
            # Global fallback for any remaining NaNs
            cleaned = cleaned.fillna(cleaned.median(numeric_only=True))

        # Re-compute derived Congestion Index if speed and free flow speed exist
        if "congestion_index" in cleaned.columns and "free_flow_time_min" in cleaned.columns:
            # Clamped between 0 and 1
            cleaned["congestion_index"] = np.clip(cleaned["congestion_index"], 0.0, 1.0)

        report["final_rows"] = len(cleaned)
        return cleaned, report

    @staticmethod
    def inject_synthetic_noise(df: pd.DataFrame, noise_ratio: float = 0.05, seed: int = 42) -> pd.DataFrame:
        """
        Injects realistic synthetic corruptions matching the hackathon manifest.
        Useful for stress-testing and demonstration to judges.
        """
        rng = np.random.default_rng(seed)
        corrupted = df.copy()
        n = len(corrupted)
        k = max(1, int(n * noise_ratio))

        # 1. Negative speed
        idx_neg = rng.choice(n, size=k, replace=False)
        corrupted.loc[idx_neg, "speed_kmh"] = -1.0 * rng.uniform(5.0, 45.0, size=k)

        # 2. Spikes
        idx_spike = rng.choice(n, size=k, replace=False)
        corrupted.loc[idx_spike, "speed_kmh"] = 180.0

        # 3. Missing values
        idx_nan = rng.choice(n, size=k, replace=False)
        corrupted.loc[idx_nan, "flow_vph"] = np.nan

        # 4. Stuck sensor (repeated values in sequence)
        idx_stuck = rng.choice(max(1, n - 10), size=min(10, n), replace=False)
        for s in idx_stuck:
            corrupted.loc[s:s+6, "speed_kmh"] = 42.15

        # 5. Row shuffle
        corrupted = corrupted.sample(frac=1.0, random_state=seed).reset_index(drop=True)

        return corrupted
