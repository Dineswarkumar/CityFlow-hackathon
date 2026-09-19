import unittest
from cityflow.graph import RoadNetworkGraph


class TestRoadNetworkGraph(unittest.TestCase):
    def setUp(self):
        self.net = RoadNetworkGraph("NEURAX_SMART_CITIES_TRAINING_V2")

    def test_graph_dimensions_and_summary(self):
        summary = self.net.get_summary()
        self.assertEqual(summary["total_nodes"], 120)
        self.assertEqual(summary["total_segments"], 436)
        self.assertEqual(summary["structural_bottlenecks_count"], 16)
        self.assertGreater(summary["total_lane_km"], 0)

    def test_bpr_travel_time_increases_with_congestion(self):
        seg_id = "R0001"
        time_free_flow = self.net.calculate_bpr_travel_time(seg_id, flow_vph=100.0)
        time_congested = self.net.calculate_bpr_travel_time(seg_id, flow_vph=3000.0)
        self.assertGreater(time_congested, time_free_flow)

    def test_diversion_path_excludes_blocked_segment(self):
        source = "N001"
        target = "N002"
        blocked_seg = "R0001"  # Directly links N001 -> N002
        diversion = self.net.find_diversion_path(source, target, blocked_segment=blocked_seg)
        if diversion is not None:
            self.assertNotIn(blocked_seg, diversion)


if __name__ == "__main__":
    unittest.main()
