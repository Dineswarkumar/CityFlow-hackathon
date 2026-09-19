# NeuraX Smart Cities Dataset v2 - Training

Large software-only urban traffic intelligence dataset. Traffic observations are separated from forecast targets to reduce target leakage. Use network, OD demand, signals, turn restrictions, roadworks and planning candidates for network-aware reasoning.

Files: traffic_train.csv, forecast_targets_train.csv, traffic_validation.csv, forecast_targets_validation.csv, incidents_*.csv, context_*.csv, roadworks_*.csv, network.csv, nodes.csv, signal_plans.csv, turn_restrictions.csv, planning_candidates.csv, od_demand_profiles.csv, scenario_examples.csv.

Do not treat forecast target files as model input features. The final challenge is not only forecasting: teams are expected to reason about incidents, propagation, diversions, recurring bottlenecks and counterfactual interventions.