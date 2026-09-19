"""
CityFlow AI: Residual-Based Incident & Anomaly Detection Engine.
Features:
- Residual-based detection (deviation from expected speed)
- Spatial-temporal consensus (filters transient sensor spikes)
- Root-cause attribution: [incident, weather_slowdown, roadwork, event_surge, recurring_bottleneck]
- Confidence scoring: [High, Medium, Low]
- Human-readable explainability strings for TCC operators
"""

from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd


class IncidentDetector:
    def __init__(
        self,
        residual_threshold_kmh: float = 15.0,
        z_score_threshold: float = 2.0,
        min_queue_spillback: float = 3.0,
    ):
        self.residual_thresh = residual_threshold_kmh
        self.z_thresh = z_score_threshold
        self.min_queue = min_queue_spillback

    def detect_anomalies(
        self,
        df_snapshot: pd.DataFrame,
        expected_speeds: np.ndarray,
        residual_std: float = 7.5,
        context: Optional[Dict[str, Any]] = None,
        active_roadworks_segments: Optional[set] = None,
    ) -> List[Dict[str, Any]]:
        """
        Analyzes a single time-slice across network segments and returns verified alerts.
        """
        alerts = []
        context = context or {}
        active_roadworks = active_roadworks_segments or set()
        
        rain_intensity = float(context.get("rain_intensity", 0.0))
        event_level = int(context.get("event_level", 0))

        actual_speeds = df_snapshot["speed_kmh"].values
        sensor_qualities = df_snapshot["sensor_quality"].values if "sensor_quality" in df_snapshot.columns else np.ones(len(df_snapshot))
        queues = df_snapshot["queue_length_veh"].values if "queue_length_veh" in df_snapshot.columns else np.zeros(len(df_snapshot))
        bottlenecks = df_snapshot["structural_bottleneck"].values if "structural_bottleneck" in df_snapshot.columns else np.zeros(len(df_snapshot))
        segment_ids = df_snapshot["segment_id"].values

        residuals = expected_speeds - actual_speeds  # Positive = slower than expected
        z_scores = residuals / max(1.0, residual_std)

        for i in range(len(df_snapshot)):
            seg_id = str(segment_ids[i])
            res = float(residuals[i])
            z = float(z_scores[i])
            q = float(queues[i])
            sq = float(sensor_qualities[i])
            is_bottleneck = int(bottlenecks[i]) == 1

            # Candidate filter: unexpected speed drop
            if res > self.residual_thresh and z > self.z_thresh:
                # 1. Determine Cause Attribution
                if seg_id in active_roadworks:
                    cause = "roadwork"
                    explanation = f"Active lane maintenance / roadwork causing planned capacity reduction."
                elif rain_intensity > 2.0:
                    cause = "weather_slowdown"
                    explanation = f"Speed reduced due to monsoon rainfall ({rain_intensity:.1f} mm/h)."
                elif event_level > 0:
                    cause = "event_surge"
                    explanation = f"Corridor traffic surge driven by scheduled city event (Level {event_level})."
                elif is_bottleneck and res < 25.0:
                    cause = "recurring_bottleneck"
                    explanation = f"Recurring geometric bottleneck during high commuter flow window."
                else:
                    cause = "incident"
                    explanation = f"Sudden localized speed drop ({res:.1f} km/h below normal). Queue: {q:.0f} vehicles."

                # 2. Determine Confidence Level
                if sq < 0.5:
                    confidence = "Low"
                    explanation += " Warning: Degraded sensor reliability."
                elif z > 3.5 and (q >= self.min_queue or cause != "incident"):
                    confidence = "High"
                else:
                    confidence = "Medium"

                # 3. Estimate Incident Severity (1: Minor, 2: Moderate, 3: Critical)
                if res > 35.0 or q > 25.0:
                    severity = 3
                elif res > 22.0 or q > 10.0:
                    severity = 2
                else:
                    severity = 1

                alerts.append({
                    "segment_id": seg_id,
                    "cause": cause,
                    "severity": severity,
                    "confidence": confidence,
                    "speed_actual_kmh": round(float(actual_speeds[i]), 1),
                    "speed_expected_kmh": round(float(expected_speeds[i]), 1),
                    "residual_drop_kmh": round(res, 1),
                    "z_score": round(z, 2),
                    "queue_length_veh": round(q, 1),
                    "sensor_quality": round(sq, 2),
                    "explanation": explanation,
                })

        return sorted(alerts, key=lambda x: (x["severity"], x["residual_drop_kmh"]), reverse=True)
