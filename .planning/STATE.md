# CityFlow AI: Current Project State

## Current Position
- **Phase**: Major Frontend & Backend Modularization
- **Active Branch**: `checkpoint-3`
- **Current Objective**: Refactoring monolithic `index.html` (1,490 lines) into a clean, modular Multi-Page Application (MPA) with dedicated pages (`index.html`, `commuter.html`, `police.html`, `planner.html`, `forecaster.html`), dedicated CSS (`assets/css/`), and modular JS (`assets/js/`). Organizing backend scripts and services (`backend/`, `scripts/`, `run.py`).

## Key Decisions
1. **Multi-Page Architecture (MPA)**:
   - Split monolithic `index.html` into 5 distinct, uncluttered pages with dedicated URLs.
   - Utilize modern `@view-transition { navigation: auto; }` for seamless, app-like page navigations.
   - Separate styles into `assets/css/main.css` and `assets/css/map.css`.
   - Separate logic into `assets/js/common.js`, `drone.js`, `map.js`, `commuter.js`, `police.js`, `planner.js`, and `forecaster.js`.
2. **Backend Organization**:
   - Create `backend/server.py` to serve REST endpoints and static files cleanly.
   - Move evaluation and verification scripts to `scripts/` while retaining root forwards for backward compatibility.
   - Provide a 1-command launcher `run.py` (`python run.py`, `python run.py --test`, `python run.py --eval`).
3. **Preserve Tested ML Engine**:
   - `cityflow/` package remains the core verified algorithmic backend with 100% test pass rate.

## Next Steps
1. Review implementation plan with user.
2. Upon approval, execute frontend modularization and asset separation.
3. Organize backend directories and add unified runner.
4. Verify all tests, pages, and interactive components.
