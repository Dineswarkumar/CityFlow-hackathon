# CityFlow AI: ML Model Changes Required

Scope: the forecaster (15/30/45/60 min) and the incident/anomaly detector. These two carry about 40 of the 60 marks in Checkpoint 3 (detection 10, forecasting 10, robustness 10, explainability/confidence 5, plus part of innovation).

> **Assumptions to verify against the real data:** 5-minute sampling, presence of `speed`, `flow`/`volume`, `occupancy`, `rain`, `event`, `roadwork` columns, and whether incident labels exist. If any differ, adjust the matching sections.

---

## 0. Priority summary

| # | Change | Why it matters | Priority |
|---|--------|----------------|----------|
| 1 | Time-based validation with no leakage | Forecast accuracy on "unseen conditions" is graded; a leaky split gives fake scores | **Critical** |
| 2 | Add baselines (persistence, historical average) | Proves the model adds value | **Critical** |
| 3 | Predict a residual over the historical average | Better accuracy and better behavior under shift | High |
| 4 | Quantile models or conformal intervals | README promises uncertainty but Huber loss gives none | **Critical** |
| 5 | Robustness training: missing data, stuck sensors, demand scaling | 10 marks for robustness | **Critical** |
| 6 | Use forecast residuals as the anomaly signal | Fewer false alarms than a raw z-score | High |
| 7 | Cause attribution (incident / rain / roadwork / event / recurring) | The problem statement lists these causes explicitly | High |
| 8 | SHAP-based explanations per prediction | Explainability (5 marks) | Medium |
| 9 | Per-regime metrics (peak, rain, congested only) | Average MAE hides failure during congestion | High |
| 10 | Reproducibility: seeds, saved artifacts, feature list, latency test | Technical implementation (5 marks) | Medium |

---

## 1. Problem framing changes

### 1.1 Define the target precisely
Choose the target that downstream modules need. Recommended:

- **Primary target:** future speed `v_e(t+τ)`. Derive CI from the predicted speed: `CI = clip(1 - v/v_f, 0, 1)`.
- Do not train on CI directly as well. It is a deterministic function of speed, so keep one source of truth.
- Also forecast flow only if it is needed for BPR delay. Otherwise skip it, which saves time and reduces error.

### 1.2 Horizons = steps ahead
At 5-minute sampling, 15/30/45/60 min = **3/6/9/12 steps**. Use the **direct strategy**: one model per horizon (4 models), each trained on `target = value at t+h`.

Correction to the README: LightGBM has no native "multi-target" mode. Say "one model per horizon (direct multi-horizon)".

### 1.3 One global model, not 436 models
- Train **one model across all segments** with static segment features (free-flow speed, lanes, length, capacity, betweenness).
- This shares strength across segments, handles segments with little data, and is easier to maintain.
- Optionally pass `segment_id` as a categorical feature. Test with and without it, since it can hurt generalization to new segments.

---

## 2. Validation (biggest fix)

### 2.1 Never shuffle
Use a **chronological split**, for example:

```
train : first ~70% of days
valid : next ~15% (for early stopping, tuning, conformal calibration)
test  : last ~15% (touch only once at the end)
```

Better: **rolling-origin (walk-forward) CV** with 3–4 folds, reporting the mean and standard deviation of metrics.

### 2.2 Stress-test splits for "unseen patterns"
Report separate scores for:
- **Held-out weather:** train mostly on dry days and test on rain days (or the reverse).
- **Held-out event/holiday days.**
- **Demand shift:** multiply flow or occupancy features by 0.8 and 1.2 at test time.
- **Held-out segments (optional):** a spatial holdout to show generalization.

### 2.3 Leakage checklist (check every item)
- [ ] Rolling means and std are computed with `shift(1)` or a closed window, so the current target is never inside the feature.
- [ ] Historical baselines μ(hour, day), σ(hour, day) come from **training data only**.
- [ ] **Imputation is causal.** Do not linearly interpolate using future readings for features. Use forward-fill or past-only neighbor values.
- [ ] Weather at time t+τ is not used unless you can justify it as a forecast. Use weather at time t only, or a clearly labeled forecast.
- [ ] Scalers and encoders are fit on training data only.
- [ ] Early stopping uses the validation set, never the test set.

---

## 3. Baselines (must be in the report)

| Baseline | Definition |
|----------|-----------|
| Persistence | `ŷ(t+τ) = y(t)` |
| Historical average | mean speed for the same segment, hour-of-week, from training data |
| Blend | `0.5 * persistence + 0.5 * historical average` |

Report the improvement of the LightGBM model over the best baseline per horizon. Expect persistence to win at 15 min and historical average to catch up at 60 min. A good model should beat both at every horizon.

---

## 4. Feature engineering changes

### 4.1 Keep
Lags (t, t-5, t-10, t-15), rolling mean and volatility, sensor quality, sin/cos hour, rain, temperature, holiday.

### 4.2 Add

| Group | Features |
|-------|----------|
| Temporal | hour-of-week (0–167), sin/cos of it, weekend flag, minutes since peak start |
| Same-time history | speed at same time yesterday, same time last week, historical average for that hour-of-week |
| Trend | `v(t) - v(t-5)`, `v(t) - v(t-15)`, rolling slope over 30 min |
| Network | mean speed/CI of upstream neighbors (1-hop, 2-hop) and downstream neighbors, max upstream CI (spillback signal) |
| Signals | green ratio, cycle length of the downstream junction |
| Static | free-flow speed, length, lanes, capacity, betweenness centrality, is-flyover / is-arterial |
| Context | rain intensity (lagged 15–30 min too), event flag, roadwork flag and capacity factor φ |
| Data quality | `sensor_quality`, fraction of the last 6 steps that were imputed, minutes since last valid reading |

### 4.3 Predict the residual, not the raw speed
Set the target to `y(t+τ) - baseline(hour-of-week)` and add the baseline back at inference.

- Reduces the burden on the model to learn the daily cycle.
- Behaves better under demand shift, because deviations from normal are easier to generalize than absolute levels.
- Test both variants and keep the one with the better validation score.

---

## 5. Objective and hyperparameters

- **Point forecast:** LightGBM with `objective="huber"` is fine, but tune `alpha` (the Huber threshold) on validation. If the headline metric is MAE, also compare against `objective="l1"`. Match the objective to the metric you report.
- **Sample weighting (optional):** upweight congested periods (e.g., CI > 0.5), because free-flow rows dominate and the model can look good while failing on the cases that matter.
- Starting hyperparameters: `num_leaves=63`, `learning_rate=0.05`, `n_estimators` up to 2000 with `early_stopping(100)`, `feature_fraction=0.8`, `bagging_fraction=0.8`, `min_child_samples=50`. Tune with Optuna in a limited budget (about 30 trials), using walk-forward folds.
- Set `random_state` and `seed` everywhere.

---

## 6. Uncertainty and confidence (currently missing)

Pick one approach and implement it fully.

**Option A: Quantile LightGBM (simple)**
Train `objective="quantile"` with `alpha` in {0.1, 0.5, 0.9} per horizon. This gives 12 models. Use P50 as the point forecast and P10 to P90 as the interval.

**Option B: Split-conformal intervals (rigorous, cheaper)**
1. Train the point model on the training set.
2. On the validation set, compute absolute residuals per horizon (optionally per regime such as peak/off-peak).
3. Take the 90th percentile of the residuals as `q`. The interval is `ŷ ± q`.
4. Report empirical **coverage on the test set**. It should be close to 80–90%. Reporting coverage is a strong signal to judges.

```python
resid = np.abs(y_val - model.predict(X_val))
q = np.quantile(resid, 0.9)          # per horizon (and optionally per regime)
lo, hi = pred - q, pred + q
coverage = np.mean((y_test >= lo) & (y_test <= hi))
```

**Confidence score (used by advisories):** combine
1. interval width (relative to free-flow speed),
2. `sensor_quality` and the share of imputed inputs,
3. agreement between forecaster and incident detector,
4. distance from training distribution (e.g., input outside the training range).

Map to High / Medium / Low. **Gate advisories:** Low confidence means "monitor only", not a diversion order.

---

## 7. Robustness changes (10 marks)

### 7.1 Train with corruption augmentation
During training, randomly corrupt a fraction of rows so the model sees bad data:
- mask 5–15% of feature values to NaN (LightGBM handles NaN natively),
- inject stuck-sensor stretches (constant value for 6–24 steps),
- add spikes and negative values before the cleaner runs,
- scale flow/occupancy features by 0.8–1.3 to simulate demand change.

### 7.2 Fallback logic at inference
- If `sensor_quality` is low for a segment, replace its inputs with neighbor-based estimates and widen the interval.
- If too many inputs are missing (e.g., > 50%), fall back to the historical-average baseline and mark confidence Low.

### 7.3 Show a robustness table in the report

| Scenario | MAE 15m | MAE 60m | Change vs clean |
|----------|---------|---------|-----------------|
| Clean test | | | |
| 10% missing | | | |
| 20% missing | | | |
| Stuck sensors | | | |
| Demand ×1.2 | | | |
| Rain days only | | | |

### 7.4 Drift monitor (optional, cheap innovation)
Compare recent input distributions to training (PSI or KS test). Raise a "model may be unreliable" flag when drift is high.

---

## 8. Incident and anomaly detection changes

### 8.1 Replace the raw z-score with a residual-based detector
Current: `Z = (v - μ(h,d)) / σ(h,d) < -2.5`.
Problem: it flags any recurring peak-hour slowdown and any rain slowdown.

Better: use the **forecaster's own error** as the anomaly signal.
- Expected speed `v̂(t)` comes from a 5-minute-ahead model (or a baseline conditioned on hour, weather and neighbors).
- Anomaly score = `(v̂(t) - v(t)) / σ_resid`, where `σ_resid` is the validation residual scale.
- A recurring bottleneck or rain slowdown is already "expected", so it does not trigger. A sudden, unexplained drop does.

Keep your consensus rule: confirm only if the anomaly persists for 2 or more steps or the upstream queue is growing.

### 8.2 If incident labels exist in the data
- Train a **LightGBM classifier** on features such as speed drop, occupancy jump, upstream and downstream deltas, residual score, and time-of-day.
- Metrics: **PR-AUC, precision, recall, F1, false alarms per day**. Do not report accuracy, because incidents are rare.
- Choose the threshold on the validation set for a target false-alarm rate, and report it.

### 8.3 If there are no labels
- State clearly that detection is unsupervised/rule-based plus consensus.
- Build a proxy evaluation: inject synthetic incidents (speed drop with a queue) into held-out data and measure detection rate, detection delay and false alarms on clean data.

### 8.4 Add cause attribution
Classify each alert into one of:

| Class | Signature |
|-------|-----------|
| Incident | sudden, localized drop, upstream queue growth, no weather/event/roadwork flag |
| Weather slowdown | many segments slow gradually, rain flag active |
| Roadwork | roadwork flag or capacity factor φ < 1 on the segment |
| Event surge | event flag, inflow surge toward one area |
| Recurring bottleneck | same segment slow at the same hour-of-week on most days |

A simple rule set on top of the residual score is enough. The point is that each cause drives a different response, and recurring bottlenecks feed the infrastructure planner rather than the diversion engine.

### 8.5 Congestion levels
Define and document thresholds, e.g. CI < 0.3 free, 0.3–0.5 moderate, 0.5–0.7 heavy, > 0.7 severe. Report per-class F1 for forecasted congestion state (using predicted speed to derive class).

---

## 9. Explainability

- Use **SHAP `TreeExplainer`** for the point model. Store the top 3 contributing features per prediction.
- Turn them into plain text for the dashboard, for example: "Forecast slowdown on Segment 214 driven by upstream congestion (+), rain in last 15 min (+), and evening peak (+)."
- Show global feature importance in the report, and check it is sensible (lags and neighbors dominate short horizons, temporal features dominate long horizons).
- Add a **limitations panel**: horizons where the model is weak, conditions it has not seen, and low-confidence cases.

---

## 10. Metrics to report

| Task | Metrics | Slice by |
|------|---------|----------|
| Speed forecast | MAE, RMSE, MAPE (careful with small denominators), R² | horizon, peak vs off-peak, rain vs dry, **congested-only** rows |
| Uncertainty | interval coverage, mean interval width | horizon |
| Congestion class | precision/recall/F1 per class | horizon |
| Incident detection | precision, recall, F1, PR-AUC, false alarms/day, detection delay | incident type |
| System | inference time per snapshot, model size | n/a |

Always show the baseline next to each number.

---

## 11. Engineering and reproducibility

- Fix seeds for LightGBM, NumPy and Python `random`.
- Save artifacts with `joblib` or the LightGBM text format: models, feature list and order, baseline tables, conformal quantiles, config.
- One `config.yaml` for horizons, split dates, thresholds and hyperparameters.
- Provide `python -m cityflow.train` and `python -m cityflow.evaluate`, which write a metrics JSON and plots to `reports/`.
- Measure and report real inference latency instead of claiming "sub-second".
- Tests to add in `tests/test_forecaster.py`:
  - output shape is (n_segments, 4 horizons),
  - no NaN or negative speeds in output,
  - no future-timestamp leakage in feature building (assert features at t use only data ≤ t),
  - model beats persistence on a small fixture,
  - handles a fully-missing segment without crashing.

---

## 12. Suggested build order

1. Cleaner outputs a sanitized, causal time series with quality flags.
2. Chronological split plus baselines and the evaluation harness (numbers exist before the model).
3. Feature builder with leakage test.
4. Global LightGBM per horizon, residual target, tuned on walk-forward folds.
5. Conformal intervals or quantile models, then the confidence score.
6. Robustness augmentation and the robustness table.
7. Residual-based incident detector, consensus rule, cause attribution.
8. SHAP explanations wired to the dashboard.
9. Freeze the config, retrain, and generate the final report.

---

## 13. README edits for the ML section

- Replace "Multi-target LightGBM trained with Huber loss" with: "Direct multi-horizon LightGBM (one model per horizon), residual target over the hour-of-week baseline, conformal prediction intervals."
- Add the evaluation protocol (split, baselines, metrics, stress tests) as its own section.
- Replace the raw z-score rule with the residual-based detector and cause attribution.
- Remove unmeasured claims (sub-second inference); add measured latency once available.
