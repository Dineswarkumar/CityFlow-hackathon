import unittest
import pandas as pd
import numpy as np
from cityflow.baseline import HistoricalBaselineModel


class TestHistoricalBaseline(unittest.TestCase):
    def test_fit_and_predict(self):
        # Create 2 days of 5-min intervals for segment R0001
        dates = pd.date_range("2026-01-01 00:00:00", periods=288 * 2, freq="5min")
        train_df = pd.DataFrame({
            "timestamp": dates,
            "segment_id": ["R0001"] * len(dates),
            "speed_kmh": np.random.uniform(40.0, 60.0, size=len(dates)),
        })

        model = HistoricalBaselineModel()
        model.fit(train_df)

        test_df = pd.DataFrame({
            "timestamp": pd.date_range("2026-01-03 00:00:00", periods=24, freq="5min"),
            "segment_id": ["R0001"] * 24,
            "speed_kmh": [50.0] * 24,
        })

        metrics = model.evaluate_baselines(test_df, horizons_steps={"15m": 3})
        self.assertIn("15m", metrics)
        self.assertIn("Persistence", metrics["15m"])
        self.assertIn("Historical_Avg", metrics["15m"])
        self.assertIn("Blend", metrics["15m"])
        self.assertGreaterEqual(metrics["15m"]["Persistence"]["MAE"], 0.0)


if __name__ == "__main__":
    unittest.main()
