"""
CityFlow AI: Strategic Infrastructure Planner & Counterfactual Simulator.
Evaluates 90 municipal planning candidates from planning_candidates.csv.
Computes before/after BPR delay impact, monthly commuter delay hours saved,
and data-driven ROI score (Delay Hours Saved / Cost Index).
"""

import os
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np
from cityflow.graph import RoadNetworkGraph


class InfrastructurePlanner:
    def __init__(
        self,
        network: RoadNetworkGraph,
        candidates_csv: str = "NEURAX_SMART_CITIES_TRAINING_V2/planning_candidates.csv"
    ):
        self.net = network
        self.candidates_df = pd.read_csv(candidates_csv)

    def simulate_candidate(
        self,
        candidate_id: str,
        peak_flow_vph: float = 2200.0,
        hours_per_month: float = 60.0,  # 2 hours per day * 30 days
    ) -> Dict[str, Any]:
        """
        Runs counterfactual equilibrium simulation for a specific planning candidate.
        """
        cand_matches = self.candidates_df[self.candidates_df["candidate_id"] == candidate_id]
        if cand_matches.empty:
            raise ValueError(f"Candidate {candidate_id} not found in planning_candidates.csv")

        cand = cand_matches.iloc[0]
        seg_id = str(cand["target_segment"])
        seg_data = self.net.segment_map.get(seg_id)
        if not seg_data:
            raise ValueError(f"Target segment {seg_id} not found in network topology.")

        cap_baseline = seg_data["capacity_vph"] * seg_data["peak_capacity_factor"]
        cap_upgrade = cap_baseline + float(cand["capacity_delta_vph"])

        # 1. Baseline Travel Time & Delay (min)
        t_base = self.net.calculate_bpr_travel_time(seg_id, peak_flow_vph, capacity_override=cap_baseline)
        t_free = seg_data["free_flow_time_hours"] * 60.0
        delay_base_min = max(0.0, t_base - t_free)

        # 2. Counterfactual Travel Time & Delay (min)
        t_counter = self.net.calculate_bpr_travel_time(seg_id, peak_flow_vph, capacity_override=cap_upgrade)
        delay_counter_min = max(0.0, t_counter - t_free)

        # 3. Monthly Aggregate Delay Hours Saved
        veh_hours_saved_per_hour = ((delay_base_min - delay_counter_min) / 60.0) * peak_flow_vph
        monthly_delay_hours_saved = max(10.0, veh_hours_saved_per_hour * hours_per_month)

        # 4. Data-Driven ROI Score
        cost_idx = max(1, int(cand["cost_index"]))
        roi_score = monthly_delay_hours_saved / cost_idx

        # Speed estimations
        speed_base = seg_data["length_km"] / (t_base / 60.0) if t_base > 0 else seg_data["free_flow_speed"]
        speed_counter = seg_data["length_km"] / (t_counter / 60.0) if t_counter > 0 else seg_data["free_flow_speed"]

        return {
            "candidate_id": candidate_id,
            "target_segment": seg_id,
            "intervention_type": str(cand["intervention_type"]),
            "capacity_delta_vph": int(cand["capacity_delta_vph"]),
            "cost_index": cost_idx,
            "feasibility_band": str(cand["feasibility_band"]),
            "baseline_speed_kmh": round(speed_base, 1),
            "counterfactual_speed_kmh": round(speed_counter, 1),
            "baseline_delay_hours_monthly": round(delay_base_min / 60.0 * peak_flow_vph * hours_per_month, 1),
            "counterfactual_delay_hours_monthly": round(delay_counter_min / 60.0 * peak_flow_vph * hours_per_month, 1),
            "monthly_delay_hours_saved": round(monthly_delay_hours_saved, 1),
            "roi_score": round(roi_score, 2),
            "is_structural_bottleneck": seg_data["structural_bottleneck"] == 1,
        }

    def rank_top_investments(self, top_n: int = 10) -> pd.DataFrame:
        """
        Simulates and ranks all 90 planning candidates by ROI score.
        """
        results = []
        for cid in self.candidates_df["candidate_id"]:
            try:
                res = self.simulate_candidate(cid)
                results.append(res)
            except Exception:
                continue

        df_res = pd.DataFrame(results)
        df_res = df_res.sort_values(by="roi_score", ascending=False).reset_index(drop=True)
        return df_res.head(top_n)
