# CityFlow AI: Complete UI/UX Design Specification for Google Stitch

**Project Name**: CityFlow AI (Urban Traffic Flow & Incident Intelligence System)  
**Operating Environment**: Hyderabad Metropolitan Area (Hitec City, Gachibowli, ORR, Arterials & Flyovers)  
**Core Concept**: Dual-Portal Architecture serving both **Commuters (Citizens)** and **Traffic Police / Municipal City Authorities (GHMC/HMDA)** based on evaluator guidance.

---

## 1. Global Visual Identity & Design Tokens

### Color Palette (Cyber-Municipal Dark Mode)
- **Background Base**: `#0B0F19` (Deep Obsidian / Midnight Charcoal)
- **Card & Surface**: `#111827` (Dark Slate Glassmorphism with 1px border `rgba(255, 255, 255, 0.08)`)
- **Card Hover**: `#1F2937`
- **Primary Brand / AI Accent**: `#06B6D4` (Electric Cyan / Neon Sky)
- **Flow / Success (Normal Speed)**: `#10B981` (Emerald Green)
- **Caution / Congestion / Weather**: `#F59E0B` (Vibrant Amber)
- **Emergency / Incident / Bottleneck**: `#EF4444` (Crimson Ruby)
- **Strategic Planning / Police Accent**: `#8B5CF6` (Indigo Violet)
- **Text Primary**: `#F9FAFB` (High-contrast pure white)
- **Text Secondary**: `#9CA3AF` (Muted silver)
- **Border / Divider**: `rgba(255, 255, 255, 0.08)`

### Typography & Styling
- **Heading Font**: `Inter`, `Plus Jakarta Sans`, or `Space Grotesk` (Geometric, crisp, authoritative)
- **Body & Data Font**: `Inter` / `JetBrains Mono` for telemetry values (`km/h`, `vph`, timestamps)
- **Card Style**: Glassmorphism with subtle backdrop blur (`backdrop-filter: blur(12px)`), rounded corners (`12px`), and fine inner glow.

---

## 2. Global Navigation & Role Switcher

The top navigation bar is persistent across all pages:
- **Left**: `CityFlow AI` logo (Hexagonal road node icon glowing in Electric Cyan) + subtitle: *"Hyderabad Urban Intelligence"*.
- **Center**: Real-Time System Status Badges:
  - `● 120 Nodes Monitored`
  - `● 436 Corridors Active`
  - `● 3 Urgent Alerts`
  - `● Weather: Monsoon Rain (3.8 mm/h)`
- **Right**: **Profile Switcher Tabs**:
  - `[🚗 Commuter Portal]` (Active / Inactive)
  - `[👮 Traffic Police & Municipal Command]` (Active / Inactive)
  - Profile Avatar / Badge: `"Officer On Duty: Banjara Hills TCC"`

---

## 3. Page Specifications for Google Stitch

---

### Page 1: Dual-Portal Landing / Role Selector

**Objective**: Give visitors and hackathon evaluators an immediate choice between the citizen experience and the police/city authority experience.

**Layout**:
- **Hero Header**: 
  - Title: *"Next-Generation Urban Mobility Decision Support"*
  - Subtitle: *"AI-powered continuous network inference, tactical police officer dispatch, and data-driven road widening capital planning for Hyderabad."*
- **Two Major Interactive Selection Cards**:
  1. **Commuter & Citizen Card (`#06B6D4` glow)**:
     - Icon: Modern sports hatchback / commuter icon.
     - Headline: *"Commuter & Driver Portal"*
     - Features: Real-time corridor speed maps, turn-restricted detour advisories, accident warning alerts, time saved.
     - CTA Button: `[Enter Commuter View →]`
  2. **Traffic Police & Municipal Authority Card (`#8B5CF6` glow)**:
     - Icon: Police badge / Municipal Command Center shield icon.
     - Headline: *"Traffic Police & Municipal Authority"*
     - Features: Instant officer dispatch to gridlocked junctions, automated signal cycle retiming, chronic recurring bottleneck detection, and road widening / flyover ROI simulator (`planning_candidates.csv`).
     - CTA Button: `[Enter Command Center →]`

---

### Page 2: Commuter Portal ("Driver & Citizen View")

**Target User**: Commuter driving through Hyderabad tech corridors (e.g., Gachibowli to Hitec City).

**Layout**:
- **Top Search & Route Bar**:
  - Origin Input: `Gachibowli Junction (N015)`
  - Destination Input: `Cyber Towers / Mindspace (N082)`
  - Departure Time: `Current (Peak Commuter Flow: 17:45)`
- **Main Interactive GIS Map (Full Width with Overlay Cards)**:
  - Dark-mode road network map showing segments color-coded by real-time speed.
  - **Blocked Segment Alert Marker**: Crimson red pulsating pin on `Segment R0067: Arterial Flyover` with warning badge *"Stalled Multi-Axle Vehicle — 2 Lanes Blocked"*.
  - **Highlighted Reroute**: Glowing neon cyan detour corridor avoiding `R0067`, strictly respecting turn restrictions at Junction `N023`.
- **Floating Route Advisory Card (Left Sidebar / Drawer)**:
  - **Badge**: `⚠️ Congestion Bypass Recommended`
  - **Alternative Route**: `Via Corridor R0088 → Financial Dist Outer Bypass`
  - **Key Metrics**:
    - `⏱️ Time Saved: 14.2 mins` (Current ETA: 16m vs Original ETA: 30m)
    - `📏 Extra Distance: +1.1 km`
    - `🚦 Signals Encountered: 2 (Optimized Green Wave)`
  - **Primary CTA**: `[Accept Detour & Start Navigation]`
  - **Secondary CTA**: `[Report Road Hazard / Feedback]`

---

### Page 3: Traffic Police Tactical Command ("Officer Dispatch & Signal Override")

**Target User**: Hyderabad Traffic Police / Traffic Control Room Operator.

**Layout**:
- **Top KPI Metrics Grid (4 Glassmorphism Cards)**:
  1. `Network Flow Index`: `74.2% Capacity` (Amber)
  2. `Active Incidents`: `3 Detected (2 Severe, 1 Minor)` (Crimson)
  3. `Police Officers Dispatched`: `12 On-Site` (Cyan)
  4. `Automated Signal Sync`: `Active (94% Coordination)` (Emerald)
- **Left Panel (60%): Live GIS Tactical Map**:
  - Shows 120 nodes and 436 road segments.
  - Active incident markers pulsating with cause badges: `[INCIDENT]`, `[WEATHER SLOWDOWN]`, `[ROADWORK]`.
  - Police patrol units shown as small tactical badges (`P-01`, `P-04`, `P-09`).
- **Right Panel (40%): Actionable Incident & Dispatch Feed**:
  - **Active Emergency Card (High Priority)**:
    - Title: `🚨 Critical Congestion Alert: Junction N015 / Segment R0067`
    - Telemetry: `Speed: 11.2 km/h (Normal: 52.0 km/h) | Queue: 28 Vehicles | Spillback: 1.4 km`
    - Explainability: *"Sudden localized speed drop (-38.8 km/h). Dry weather and no scheduled roadworks. Confidence: High (94%)."*
    - **Recommended Police Action**:
      - `[🚔 Dispatch Traffic Officer to Junction N015]`: *"Manually override turn restrictions and clear gridlock spillback."*
      - Status: `[Click to Dispatch Patrol Unit #7]`
    - **Recommended Signal Action**:
      - `[🚦 Adaptive Signal Retiming]`: *"Increase Green Ratio on SIG001 by +20s on Northbound approach."*
      - Status: `[Authorize Signal Adjustment]`

---

### Page 4: Municipal Infrastructure & Road Widening Planner ("GHMC / HMDA View")

**Target User**: Municipal City Engineers, Urban Transport Planners, and Road Infrastructure Authorities.

**Layout**:
- **Header**:
  - Title: `Strategic Capital Infrastructure & Bottleneck Resolution Sandbox`
  - Subtitle: `Data-driven simulation of 90 planning candidates to resolve chronic recurring congestion.`
- **Top Insight Banner**:
  - `⚠️ 16 Structural Bottlenecks Identified Across Hyderabad Network` (Persisting across 14+ peak commuter days).
- **Project Selection Table / Filter**:
  - Filter by Intervention Type: `[All]`, `[Road Widening / Lane Addition]`, `[Flyover Connector]`, `[Turn Lane Extension]`, `[Signal Retiming]`
  - Filter by Feasibility: `[High Feasibility]`, `[Medium]`, `[Low Cost]`
- **Interactive "Before vs After" Counterfactual Simulator (Center Card)**:
  - Candidate Selected: `PLAN0376 (Target Segment: R0377 - Financial District Arterial)`
  - Intervention Type: `Lane Addition (+500 vph capacity)` | Cost Index: `12` | Feasibility: `Medium`
  - **Side-by-Side Comparison**:
    - **Before (Baseline Status Quo)**:
      - `Avg Peak Speed`: `18.4 km/h`
      - `Monthly Commuter Delay`: `1,840.5 Vehicle-Hours`
      - `Bottleneck Severity`: `Critical (CI: 0.72)`
    - **After (Simulated Counterfactual Upgrade)**:
      - `Avg Peak Speed`: `41.2 km/h`
      - `Monthly Commuter Delay`: `1,210.2 Vehicle-Hours`
      - `Delay Saved`: `630.3 Vehicle-Hours Saved / Month`
  - **Data-Driven Investment Score**:
    - `⭐ ROI Score = 52.53 Delay Hours Saved / Cost Unit`
    - `Payback Rank: #1 in Hyderabad Tech Corridor`
  - **Action Buttons**:
    - `[📥 Export Detailed Project Report (DPR)]`
    - `[Simulate Alternative Project]`

---

## 4. UI Components & Mock Data Quick Reference

```json
{
  "commuter_alert": {
    "segment": "R0067",
    "cause": "Accident / Stalled Vehicle",
    "detour_time_saved_min": 14.2,
    "recommended_detour": "Via Cyber Gateway Bypass"
  },
  "officer_action": {
    "junction": "N015",
    "action": "Dispatch Patrol Unit #7",
    "signal_plan": "SIG001",
    "signal_delta_s": "+20s green wave"
  },
  "infrastructure_plan": {
    "candidate_id": "PLAN0376",
    "target_segment": "R0377",
    "intervention": "Lane Addition / Road Widening",
    "capacity_delta_vph": 500,
    "cost_index": 12,
    "delay_hours_saved": 630.3,
    "roi_score": 52.53
  }
}
```

---

## 5. Google Stitch Generation Tips
1. Paste each page prompt individually for maximum detail.
2. Select **"Dark mode, high-tech dashboard, GIS telemetry, clean glassmorphism"**.
3. Emphasize that this is a **dual-user decision support system** (citizens get rerouting, officers get dispatch, city engineers get road widening).
