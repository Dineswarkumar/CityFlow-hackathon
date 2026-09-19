import unittest
import pandas as pd
import numpy as np
from cityflow.incident_detector import IncidentDetector


class TestIncidentDetector(unittest.TestCase):
    def setUp(self):
        self.detector = IncidentDetector(residual_threshold_kmh=15.0, z_score_threshold=2.0)

    def test_detects_incident_and_attributes_cause(self):
        snapshot = pd.DataFrame({
            "segment_id": ["R0001", "R0002", "R0003"],
            "speed_kmh": [20.0, 48.0, 25.0],  # R0001 severe drop, R0002 normal, R0003 moderate drop with rain
            "sensor_quality": [1.0, 1.0, 1.0],
            "queue_length_veh": [15.0, 0.0, 2.0],
            "structural_bottleneck": [0, 0, 0],
        })
        expected_speeds = np.array([55.0, 50.0, 50.0])

        # Test with no rain: R0001 should be classified as incident
        alerts = self.detector.detect_anomalies(snapshot, expected_speeds, context={"rain_intensity": 0.0})
        self.assertGreaterEqual(len(alerts), 1)
        r1_alert = next(a for a in alerts if a["segment_id"] == "R0001")
        self.assertEqual(r1_alert["cause"], "incident")
        self.assertEqual(r1_alert["confidence"], "High")

        # Test with rain: R0003 drop should be attributed to weather_slowdown
        alerts_rain = self.detector.detect_anomalies(snapshot, expected_speeds, context={"rain_intensity": 5.0})
        r3_alert = next(a for a in alerts_rain if a["segment_id"] == "R0003")
        self.assertEqual(r3_alert["cause"], "weather_slowdown")


if __name__ == "__main__":
    unittest.main()
