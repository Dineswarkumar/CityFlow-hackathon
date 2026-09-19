"""
CityFlow AI: Road Network Topology & Turn-Restricted Graph Engine.
Models the 120-node, 436-segment Hyderabad urban road network using NetworkX.
Enforces turn restrictions, signal cycle parameters, and BPR congestion latency.
"""

import os
from typing import Dict, List, Tuple, Optional, Any
import pandas as pd
import networkx as nx


class RoadNetworkGraph:
    def __init__(self, data_dir: str = "NEURAX_SMART_CITIES_TRAINING_V2"):
        self.data_dir = data_dir
        self.nodes_df = pd.read_csv(os.path.join(data_dir, "nodes.csv"))
        self.network_df = pd.read_csv(os.path.join(data_dir, "network.csv"))
        self.turns_df = pd.read_csv(os.path.join(data_dir, "turn_restrictions.csv"))
        
        signal_file = os.path.join(data_dir, "signal_plans.csv")
        self.signals_df = pd.read_csv(signal_file) if os.path.exists(signal_file) else pd.DataFrame()

        self.graph = nx.DiGraph()
        self.segment_map: Dict[str, Dict[str, Any]] = {}
        self.turn_restrictions: set = set()
        
        self._build_graph()

    def _build_graph(self):
        # 1. Add Nodes with spatial coordinates
        for _, row in self.nodes_df.iterrows():
            self.graph.add_node(
                row["node_id"],
                x=float(row["x"]),
                y=float(row["y"]),
                lat=float(row["lat"]),
                lon=float(row["lon"])
            )

        # 2. Add Edges / Segments
        for _, row in self.network_df.iterrows():
            seg_id = str(row["segment_id"])
            u = str(row["source_node"])
            v = str(row["target_node"])
            
            seg_data = {
                "segment_id": seg_id,
                "source": u,
                "target": v,
                "road_class": str(row["road_class"]),
                "lanes": int(row["lanes"]),
                "free_flow_speed": float(row["free_flow_speed_kmh"]),
                "capacity_vph": float(row["capacity_vph"]),
                "length_km": float(row["length_km"]),
                "grade_pct": float(row["grade_pct"]),
                "signal_id": str(row["signal_id"]) if pd.notnull(row["signal_id"]) else None,
                "structural_bottleneck": int(row["structural_bottleneck"]),
                "importance": float(row["importance"]),
                "peak_capacity_factor": float(row["peak_capacity_factor"]),
                # Baseline travel time (hours) = length / free_flow_speed
                "free_flow_time_hours": float(row["length_km"]) / max(1.0, float(row["free_flow_speed_kmh"])),
            }
            self.segment_map[seg_id] = seg_data
            
            # Use free flow time in minutes as default edge weight
            self.graph.add_edge(u, v, weight=seg_data["free_flow_time_hours"] * 60.0, **seg_data)

        # 3. Add Turn Restrictions: tuple of (from_segment, to_segment)
        for _, row in self.turns_df.iterrows():
            self.turn_restrictions.add((str(row["from_segment"]), str(row["to_segment"])))

    def calculate_bpr_travel_time(
        self,
        segment_id: str,
        flow_vph: float,
        capacity_override: Optional[float] = None,
        alpha: float = 0.15,
        beta: float = 4.0
    ) -> float:
        """
        Computes link travel time (in minutes) using the standard BPR (Bureau of Public Roads) function:
        t = t0 * [1 + alpha * (flow / capacity)^beta]
        """
        seg = self.segment_map.get(segment_id)
        if not seg:
            return 1.0
        
        t0 = seg["free_flow_time_hours"] * 60.0  # minutes
        cap = capacity_override if capacity_override is not None else (seg["capacity_vph"] * seg["peak_capacity_factor"])
        cap = max(10.0, cap)
        
        ratio = max(0.0, flow_vph) / cap
        return t0 * (1.0 + alpha * (ratio ** beta))

    def get_structural_bottlenecks(self) -> List[str]:
        """Returns list of pre-identified structural bottleneck segment IDs."""
        return [
            seg_id for seg_id, data in self.segment_map.items()
            if data["structural_bottleneck"] == 1
        ]

    def find_diversion_path(
        self,
        source_node: str,
        target_node: str,
        blocked_segment: Optional[str] = None
    ) -> Optional[List[str]]:
        """
        Finds the shortest alternative path avoiding the blocked segment
        while strictly observing turn restrictions.
        Returns a list of segment_ids.
        """
        if source_node not in self.graph or target_node not in self.graph:
            return None

        # Build a temporary copy of graph without blocked segment
        sub_graph = self.graph.copy()
        if blocked_segment and blocked_segment in self.segment_map:
            blocked_edge = (self.segment_map[blocked_segment]["source"], self.segment_map[blocked_segment]["target"])
            if sub_graph.has_edge(*blocked_edge):
                sub_graph.remove_edge(*blocked_edge)

        import itertools
        try:
            # Find up to 10 shortest candidate paths using islice
            candidate_node_paths = list(itertools.islice(nx.shortest_simple_paths(sub_graph, source_node, target_node, weight="weight"), 10))
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None

        # Check turn restrictions for each candidate path
        for node_path in candidate_node_paths:
            seg_path = []
            valid = True
            for i in range(len(node_path) - 1):
                u, v = node_path[i], node_path[i+1]
                edge_data = sub_graph.get_edge_data(u, v)
                if not edge_data:
                    valid = False
                    break
                seg_id = edge_data["segment_id"]
                if seg_path:
                    prev_seg = seg_path[-1]
                    if (prev_seg, seg_id) in self.turn_restrictions:
                        valid = False
                        break
                seg_path.append(seg_id)
            if valid and seg_path:
                return seg_path

        return None

    def get_summary(self) -> Dict[str, Any]:
        """Returns network statistics for operator summary and evaluation."""
        return {
            "total_nodes": self.graph.number_of_nodes(),
            "total_segments": self.graph.number_of_edges(),
            "turn_restrictions_count": len(self.turn_restrictions),
            "structural_bottlenecks_count": len(self.get_structural_bottlenecks()),
            "total_lane_km": round(sum(d["length_km"] * d["lanes"] for d in self.segment_map.values()), 2),
            "is_strongly_connected": nx.is_strongly_connected(self.graph),
        }
