import unittest
from cityflow.graph import RoadNetworkGraph
from cityflow.advisory_engine import TacticalAdvisoryEngine
from cityflow.infrastructure_planner import InfrastructurePlanner


class TestAdvisoryAndPlanner(unittest.TestCase):
    def setUp(self):
        self.net = RoadNetworkGraph("NEURAX_SMART_CITIES_TRAINING_V2")
        self.advisory = TacticalAdvisoryEngine(self.net)
        self.planner = InfrastructurePlanner(self.net, "NEURAX_SMART_CITIES_TRAINING_V2/planning_candidates.csv")

    def test_advisory_generates_detour_and_dispatch(self):
        alert = {
            "segment_id": "R0067",
            "cause": "incident",
            "severity": 2,
            "residual_drop_kmh": 25.0,
        }
        res = self.advisory.generate_incident_advisory(alert)
        self.assertEqual(res["status"], "DIVERSION_RECOMMENDED")
        self.assertIn("officer_dispatch", res)
        self.assertEqual(res["officer_dispatch"]["priority"], "HIGH")
        self.assertGreater(res["time_saved_minutes"], 0.0)

    def test_counterfactual_infrastructure_simulation(self):
        # Simulate PLAN0376
        res = self.planner.simulate_candidate("PLAN0376")
        self.assertEqual(res["candidate_id"], "PLAN0376")
        self.assertGreater(res["monthly_delay_hours_saved"], 0.0)
        self.assertGreater(res["roi_score"], 0.0)
        self.assertGreater(res["counterfactual_speed_kmh"], res["baseline_speed_kmh"])

    def test_rank_top_investments(self):
        top_df = self.planner.rank_top_investments(top_n=5)
        self.assertEqual(len(top_df), 5)
        self.assertIn("roi_score", top_df.columns)
        # Verify descending order of ROI
        self.assertTrue(top_df["roi_score"].is_monotonic_decreasing)


if __name__ == "__main__":
    unittest.main()
