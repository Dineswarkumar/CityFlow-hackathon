# CityFlow AI: Project Roadmap & Milestone Tracker

## Overview
- **Domain**: NeuraX Hackathon 3.0 - AI in Smart Cities (Domain 1)
- **Challenge**: Urban Traffic Flow & Incident Intelligence
- **Target Context**: Hyderabad-style dense multimodal road network (Hitec City / Gachibowli corridor dynamics, flyovers, signal bottlenecks, monsoon flash floods)
- **Goal**: Win first place by securing maximum points across all three evaluation checkpoints (100 Marks total).

---

## Checkpoint Milestones

### Milestone 1: Checkpoint 1 - Architecture & Approach (15 Marks)
- [ ] Initialize Git repository, branch workflows, and robust `.gitignore`.
- [ ] Create comprehensive `README.md`:
  - Problem Understanding (5 Marks): Urban traffic dynamics, Hyderabad context, incident spillback, weather sensitivity.
  - System Architecture (5 Marks): End-to-end data flow, multi-layer analytics, counterfactual engine, Mermaid diagrams.
  - Technical Approach (5 Marks): Mathematical formulation of congestion indices, multi-horizon gradient boosted forecasting, turn-restricted dynamic graph rerouting, counterfactual ROI.
- [ ] Create Checkpoint 1 testable baseline.

### Milestone 2: Checkpoint 2 - Partial Execution & Data Engine (25 Marks)
- [x] Build `cityflow/cleaner.py`:
  - Handle manifest-specified noise: stuck sensors (0 variance), negative speed/flow values, row shuffle (timestamp sorting), missing values, duplicate records.
- [x] Build `cityflow/graph.py`:
  - Parse 120 nodes and 436 segments from `nodes.csv` and `network.csv`.
  - Enforce `turn_restrictions.csv` and link signal plans from `signal_plans.csv`.
  - Calculate bottleneck criticality and betweenness centrality.
- [x] Build `cityflow/baseline.py`:
  - Causal time-based validation without leakage.
  - Benchmarked Persistence, Historical Average, and Blend baselines across 15, 30, and 60 minutes.
- [x] Build `cityflow/incident_detector.py`:
  - Implement residual-based detection + spatial-temporal consensus.
  - Multi-class Cause Attribution: Incident, Weather Slowdown, Roadwork, Event Surge, Recurring Bottleneck.
  - Confidence scoring (High/Medium/Low) and explainability strings.
- [x] Build unit test suite in `tests/` (100% pass rate).
- [x] Build `verify_checkpoint2.py` judge audit CLI (runs in 0.32s).

### Milestone 3: Checkpoint 3 - Full AI & Decision Command Center (60 Marks)
- [ ] Build `cityflow/forecaster.py`:
  - Multi-target LightGBM models for 15, 30, 45, and 60-minute predictions on speed, flow, and congestion.
  - Zero target leakage validation using `context_*.csv` and `traffic_*.csv`.
  - Uncertainty / confidence intervals calculation.
- [ ] Build `cityflow/advisory_engine.py`:
  - Incident diversion routes using Dijkstra with turn penalty constraints.
  - Compute diverted volume, delay hours avoided, and spillback reduction.
- [ ] Build `cityflow/infrastructure_planner.py`:
  - Ingest `planning_candidates.csv`.
  - Identify persistent structural bottlenecks across training history.
  - Run counterfactual simulations for each planning candidate to calculate ROI ($\Delta\text{Delay Hours} / \text{Cost Index}$).
- [ ] Build `app.py` (Interactive Streamlit Command Center):
  - 2D/3D GIS road network map colored by congestion index / speed.
  - Real-time incident alert feed with confidence rating and explainability cards.
  - Multi-horizon forecast trends.
  - Tactical "What-If" Incident Diversion simulator.
  - Strategic "What-If" Infrastructure Investment planner.
- [ ] Comprehensive verification, end-to-end testing, and presentation rehearse guide.
