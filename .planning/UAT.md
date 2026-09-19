# CityFlow AI: User Acceptance Testing (UAT) & Judge Verification Protocol

## Checkpoint 1: README & Architecture Evaluation (15 Marks)
- [ ] **Problem Understanding (5/5)**:
  - Explains urban road network dynamics with specific Hyderabad arterial/flyover/weather realities.
  - Formulates the problem mathematically (network graph, congestion index, spillback).
- [ ] **Architecture (5/5)**:
  - Detailed, professional Mermaid flow diagram covering Ingestion, Graph, AI Models, Advisories, and UI.
  - Clear separation of concerns with modular directory design.
- [ ] **Approach (5/5)**:
  - Justification of model choices, noise-filtering strategies, multi-horizon forecasts, and counterfactual planning algorithms.

## Checkpoint 2: Partial Execution (25 Marks)
- [ ] **Data Cleaner**:
  - Test on corrupted synthetic samples with negative speeds and stuck sensors.
  - Verifies missing value imputation and row-order sorting.
- [ ] **Graph Model**:
  - Successfully parses 120 nodes and 436 segments.
  - Identifies structural bottlenecks and respects turn restrictions.
- [ ] **Incident Baseline**:
  - Precision and recall benchmarked against `incidents_train.csv`.

## Checkpoint 3: Full Evaluation (60 Marks)
- [ ] **Forecasting Performance**:
  - Forecasts 15, 30, 45, 60 minutes evaluated on validation set (RMSE, MAE).
- [ ] **Advisory Engine**:
  - Generates valid turn-restricted detour routing around severe incident segments.
- [ ] **Counterfactual Planning**:
  - Computes ROI for `planning_candidates.csv` based on simulated delay hours reduced.
- [ ] **Interactive Command Center**:
  - Smooth 60fps interaction on map, sliders, and what-if simulation panels.
