import unittest
import pandas as pd
import numpy as np
from cityflow.forecaster import MultiHorizonForecaster


class TestMultiHorizonForecaster(unittest.TestCase):
    def setUp(self):
        # Build synthetic 4-day time series for 5 segments
        np.random.seed(42)
        n_periods = 288 * 3
        dates = pd.date_range("2026-01-01 00:00:00", periods=n_periods, freq="5min")
        
        records = []
        for s in ["R0001", "R0002", "R0003"]:
            for d in dates:
                records.append({
                    "timestamp": d,
                    "segment_id": s,
                    "speed_kmh": 45.0 + 10.0 * np.sin(d.hour * np.pi / 12) + np.random.normal(0, 2),
                    "flow_vph": 1200.0 + 500.0 * np.sin(d.hour * np.pi / 12) + np.random.normal(0, 50),
                    "occupancy_pct": 25.0,
                    "delay_min": 1.0,
                    "queue_length_veh": 3.0,
                    "sensor_quality": 1.0,
                })
        self.traffic_df = pd.DataFrame(records)
        
        self.network_df = pd.DataFrame({
            "segment_id": ["R0001", "R0002", "R0003"],
            "lanes": [3, 2, 4],
            "free_flow_speed_kmh": [60.0, 50.0, 70.0],
            "capacity_vph": [3000.0, 2000.0, 4000.0],
            "length_km": [1.5, 2.0, 1.2],
            "structural_bottleneck": [0, 1, 0],
        })

        # Synthetic target labels
        targets = []
        for s in ["R0001", "R0002", "R0003"]:
            for d in dates:
                targets.append({
                    "timestamp": d,
                    "segment_id": s,
                    "target_speed_15m": 46.0 + 10.0 * np.sin(d.hour * np.pi / 12),
                    "target_speed_30m": 47.0 + 10.0 * np.sin(d.hour * np.pi / 12),
                    "target_speed_45m": 48.0 + 10.0 * np.sin(d.hour * np.pi / 12),
                    "target_speed_60m": 49.0 + 10.0 * np.sin(d.hour * np.pi / 12),
                })
        self.targets_df = pd.DataFrame(targets)

    def test_feature_extraction_and_training(self):
        forecaster = MultiHorizonForecaster(horizons=["15m", "30m"])
        feat_df = forecaster.extract_features(self.traffic_df, self.network_df)
        
        # Verify feature extraction
        self.assertIn("speed_lag_1", feat_df.columns)
        self.assertIn("speed_trend_15m", feat_df.columns)
        self.assertIn("hour_of_week", feat_df.columns)

        # Train models
        report = forecaster.fit(feat_df, self.targets_df, train_ratio=0.75)
        self.assertIn("15m", report["horizons"])
        self.assertIn("30m", report["horizons"])
        self.assertGreater(report["horizons"]["15m"]["conformal_q90"], 0.0)

        # Predict snapshot
        snapshot = feat_df.groupby("segment_id").last().reset_index()
        preds = forecaster.predict_snapshot(snapshot, horizon="15m")
        
        self.assertEqual(len(preds), 3)
        self.assertTrue((preds["predicted_speed_kmh"] >= 0).all())
        self.assertTrue((preds["congestion_index"] >= 0).all())
        self.assertTrue((preds["congestion_index"] <= 1.0).all())
        self.assertTrue((preds["lower_bound_kmh"] <= preds["predicted_speed_kmh"]).all())
        self.assertTrue((preds["predicted_speed_kmh"] <= preds["upper_bound_kmh"]).all())


if __name__ == "__main__":
    unittest.main()
