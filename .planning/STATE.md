# CityFlow AI: Current Project State

## Current Position
- **Phase**: Milestone 1 (Checkpoint 1 Setup)
- **Active Branch**: `feat/checkpoint1-docs`
- **Current Objective**: Complete Git initialization, `.gitignore`, and high-impact `README.md` for Checkpoint 1 evaluation (15 Marks).

## Key Decisions
1. **Model Selection**: Use LightGBM tabular multi-output regression for 15, 30, 45, and 60-minute forecasts. It is orders of magnitude faster to train and evaluate than graph neural networks while demonstrating superior accuracy on tabular sensor time-series without risk of GPU OOM or slow convergence during live judging.
2. **Dashboard Architecture**: Use Streamlit + PyDeck + Plotly for the Operator Command Center. This delivers high-fidelity 2D/3D map interactions, responsive sliders, and instant what-if counterfactual scenario recalculation.
3. **Data Protection**: Strict `.gitignore` on raw CSVs larger than 25MB to prevent GitHub push rejections.

## Next Steps
1. Initialize git repo, create `.gitignore`, checkout `feat/checkpoint1-docs`.
2. Generate comprehensive `README.md` targeting all Checkpoint 1 rubric items.
3. Commit Checkpoint 1 deliverables.
4. Move immediately to Milestone 2 (Data sanitization, graph engine, incident detector).
