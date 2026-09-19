import unittest
import pandas as pd
import numpy as np
from cityflow.cleaner import TelemetryCleaner


class TestTelemetryCleaner(unittest.TestCase):
    def test_cleaner_handles_negative_values_and_spikes(self):
        raw_data = pd.DataFrame({
            "timestamp": pd.date_range("2026-01-01 00:00:00", periods=10, freq="5min"),
            "segment_id": ["R0001"] * 10,
            "speed_kmh": [50.0, 52.0, -10.0, 49.0, 190.0, 51.0, 50.0, 50.0, 50.0, 50.0],
            "flow_vph": [500.0, 520.0, -50.0, 510.0, 500.0, 500.0, 500.0, 500.0, 500.0, 500.0],
            "free_flow_time_min": [1.5] * 10,
            "congestion_index": [0.1] * 10,
        })

        cleaner = TelemetryCleaner(stuck_sensor_window=4, max_speed_spike=60.0)
        cleaned, report = cleaner.clean_traffic_data(raw_data)

        self.assertEqual(report["negative_speeds_fixed"], 1)
        self.assertEqual(report["negative_flows_fixed"], 1)
        self.assertGreaterEqual(report["spikes_smoothed"], 1)
        self.assertTrue((cleaned["speed_kmh"] >= 0).all())
        self.assertTrue((cleaned["flow_vph"] >= 0).all())

    def test_cleaner_reorders_shuffled_rows_and_deduplicates(self):
        raw_data = pd.DataFrame({
            "timestamp": [
                "2026-01-01 00:10:00",
                "2026-01-01 00:00:00",
                "2026-01-01 00:05:00",
                "2026-01-01 00:00:00",  # Duplicate
            ],
            "segment_id": ["R0001", "R0001", "R0001", "R0001"],
            "speed_kmh": [45.0, 50.0, 48.0, 50.0],
            "flow_vph": [600.0, 500.0, 550.0, 500.0],
        })

        cleaner = TelemetryCleaner()
        cleaned, report = cleaner.clean_traffic_data(raw_data)

        self.assertEqual(report["duplicates_removed"], 1)
        self.assertEqual(len(cleaned), 3)
        timestamps = cleaned["timestamp"].tolist()
        self.assertEqual(timestamps, sorted(timestamps))


if __name__ == "__main__":
    unittest.main()
