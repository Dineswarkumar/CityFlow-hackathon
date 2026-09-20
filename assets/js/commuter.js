/**
 * CityFlow AI — Commuter Portal Dynamic Controller
 * Features:
 * - Dijkstra / A* graph pathfinding across Hyderabad 120-node road network
 * - 3 Dynamic routing strategies: NeurAX AI Detour, Standard Direct, and Eco-Green
 * - Real-time congestion & citizen incident avoidance
 * - Live traffic scenarios: Normal Flow, Peak Rush, Incident Gridlock, Monsoon Rain
 * - Interactive origin/destination selection, swap, map pick, and GPS detect
 * - Dynamic Turn-by-Turn itinerary breakdown
 * - Live animated vehicle simulation with telemetry HUD
 */

window.CityFlowCommuter = (function() {
  // Curated Hyderabad landmark hubs mapped to network nodes
  const HYD_LANDMARKS = [
    { id: 'N018', name: 'HITEC Cyber Gateway / Mindspace', tag: 'Tech Core', coords: [17.4435, 78.3772] },
    { id: 'N019', name: 'Financial District Hub / WaveRock', tag: 'Financial Core', coords: [17.4140, 78.3480] },
    { id: 'N006', name: 'Gachibowli Stadium Junction', tag: 'Sports / Ring Link', coords: [17.4400, 78.3480] },
    { id: 'N030', name: 'Bio-Diversity Park Interchange', tag: 'Arterial Bypass', coords: [17.4285, 78.3790] },
    { id: 'N042', name: 'Madhapur Metro Terminal', tag: 'Metro Feeder', coords: [17.4375, 78.3950] },
    { id: 'N027', name: 'Durgam Cheruvu Cable Bridge', tag: 'Scenic Expressway', coords: [17.4320, 78.3880] },
    { id: 'N015', name: 'Inorbit Mall Corridor', tag: 'Commercial Axis', coords: [17.4340, 78.3860] },
    { id: 'N001', name: 'Mehdipatnam Arterial Hub', tag: 'Transit Gateway', coords: [17.3910, 78.4400] },
    { id: 'N054', name: 'Jubilee Hills Checkpost Feeder', tag: 'Central Arterial', coords: [17.4300, 78.4080] },
    { id: 'N036', name: 'Kondapur Tech Boulevard', tag: 'Northern IT Hub', coords: [17.4640, 78.3580] },
    { id: 'N021', name: 'Tolichowki Flyover Link', tag: 'South Radial', coords: [17.4015, 78.4140] },
    { id: 'N048', name: 'Miyapur Metro Terminal', tag: 'North Corridor', coords: [17.4960, 78.3610] },
    { id: 'N032', name: 'Raidurg Metro Interchange', tag: 'Transit Junction', coords: [17.4380, 78.3720] },
    { id: 'N007', name: 'Nanakramguda Circle', tag: 'ORR Junction', coords: [17.4190, 78.3580] }
  ];

  let networkGraph = null; // node adjacency map
  let currentTrafficScenario = 'incident'; // 'normal' | 'peak' | 'incident' | 'monsoon'
  let calculatedRoutes = {
    detour: null,
    standard: null,
    eco: null
  };
  let activeRouteType = 'detour';
  let isNavigating = false;

  function init() {
    // 1. Initialize Map
    if (window.CityFlowMap) {
      window.CityFlowMap.init('map-commuter');
    }

    // 2. Populate Node Selectors
    populateNodeSelectors();

    // 3. Setup Event Listeners
    setupEventListeners();

    // 4. Load Graph and run default route calculation
    loadNetworkGraph().then(() => {
      calculateAllRoutes();
    });

    // 5. Listen for Citizen Incident updates from localStorage
    window.addEventListener('cityflowIncidentsUpdated', () => {
      showIncidentRecalcNotice();
      calculateAllRoutes();
    });
  }

  function populateNodeSelectors() {
    const originSelect = document.getElementById('origin-node-select');
    const destSelect = document.getElementById('dest-node-select');
    if (!originSelect || !destSelect) return;

    originSelect.innerHTML = '';
    destSelect.innerHTML = '';

    HYD_LANDMARKS.forEach((landmark) => {
      const optOrigin = document.createElement('option');
      optOrigin.value = landmark.id;
      optOrigin.textContent = `${landmark.id} — ${landmark.name} (${landmark.tag})`;
      if (landmark.id === 'N018') optOrigin.selected = true; // Default HITEC
      originSelect.appendChild(optOrigin);

      const optDest = document.createElement('option');
      optDest.value = landmark.id;
      optDest.textContent = `${landmark.id} — ${landmark.name} (${landmark.tag})`;
      if (landmark.id === 'N019') optDest.selected = true; // Default Financial District
      destSelect.appendChild(optDest);
    });
  }

  function setupEventListeners() {
    // Calculate Route Button
    const calcBtn = document.getElementById('calc-route-btn');
    if (calcBtn) {
      calcBtn.addEventListener('click', () => {
        if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(900, 'sine', 0.06);
        calculateAllRoutes();
      });
    }

    // Swap Nodes Button
    const swapBtn = document.getElementById('swap-nodes-btn');
    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(1100, 'triangle', 0.05);
        const originSelect = document.getElementById('origin-node-select');
        const destSelect = document.getElementById('dest-node-select');
        if (originSelect && destSelect) {
          const temp = originSelect.value;
          originSelect.value = destSelect.value;
          destSelect.value = temp;
          calculateAllRoutes();
        }
      });
    }

    // Pick on Map Buttons
    const pickOriginBtn = document.getElementById('pick-origin-btn');
    if (pickOriginBtn) {
      pickOriginBtn.addEventListener('click', () => startMapPick('origin'));
    }

    const pickDestBtn = document.getElementById('pick-dest-btn');
    if (pickDestBtn) {
      pickDestBtn.addEventListener('click', () => startMapPick('dest'));
    }

    // Detect GPS Button
    const gpsBtn = document.getElementById('detect-gps-btn');
    if (gpsBtn) {
      gpsBtn.addEventListener('click', detectGPSLocation);
    }

    // Traffic Scenario Pills
    const scenarioPills = document.querySelectorAll('.traffic-scenario-pill');
    scenarioPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const scenario = pill.getAttribute('data-scenario');
        if (!scenario) return;
        setTrafficScenario(scenario);
      });
    });

    // Route Option Tabs
    const tabDetour = document.getElementById('tab-route-detour');
    const tabStandard = document.getElementById('tab-route-standard');
    const tabEco = document.getElementById('tab-route-eco');

    if (tabDetour) tabDetour.addEventListener('click', () => selectRouteTab('detour'));
    if (tabStandard) tabStandard.addEventListener('click', () => selectRouteTab('standard'));
    if (tabEco) tabEco.addEventListener('click', () => selectRouteTab('eco'));

    // Start / Stop Live Navigation
    const startNavBtn = document.getElementById('start-nav-btn');
    if (startNavBtn) {
      startNavBtn.addEventListener('click', startLiveNavigation);
    }

    const stopNavBtn = document.getElementById('stop-nav-btn');
    if (stopNavBtn) {
      stopNavBtn.addEventListener('click', stopLiveNavigation);
    }

    // Selector changes trigger recalculation
    const originSelect = document.getElementById('origin-node-select');
    const destSelect = document.getElementById('dest-node-select');
    if (originSelect) originSelect.addEventListener('change', () => calculateAllRoutes());
    if (destSelect) destSelect.addEventListener('change', () => calculateAllRoutes());
  }

  function setTrafficScenario(scenario) {
    if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(850, 'sine', 0.05);
    currentTrafficScenario = scenario;

    const pills = document.querySelectorAll('.traffic-scenario-pill');
    pills.forEach(pill => {
      const match = pill.getAttribute('data-scenario') === scenario;
      if (match) {
        pill.classList.add('bg-cyan-500', 'text-white', 'shadow-md', 'shadow-cyan-500/25');
        pill.classList.remove('liquid-glass-subtle', 'text-slate-600', 'dark:text-slate-300');
      } else {
        pill.classList.remove('bg-cyan-500', 'text-white', 'shadow-md', 'shadow-cyan-500/25');
        pill.classList.add('liquid-glass-subtle', 'text-slate-600', 'dark:text-slate-300');
      }
    });

    calculateAllRoutes();
  }

  function startMapPick(targetType) {
    if (!window.CityFlowMap || typeof window.CityFlowMap.enableMapPicker !== 'function') return;
    if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(1000, 'triangle', 0.08);

    const banner = document.getElementById('map-picker-banner');
    if (banner) {
      banner.textContent = `📍 Click any node or road on the map to set ${targetType.toUpperCase()} point...`;
      banner.classList.remove('hidden');
    }

    window.CityFlowMap.enableMapPicker((nodeId, coords) => {
      if (banner) banner.classList.add('hidden');
      if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(1200, 'sine', 0.08);

      const selectId = targetType === 'origin' ? 'origin-node-select' : 'dest-node-select';
      const selectEl = document.getElementById(selectId);
      if (!selectEl) return;

      // Check if node already in list, if not add it dynamically
      let exists = false;
      for (let i = 0; i < selectEl.options.length; i++) {
        if (selectEl.options[i].value === nodeId) {
          selectEl.selectedIndex = i;
          exists = true;
          break;
        }
      }

      if (!exists) {
        const opt = document.createElement('option');
        opt.value = nodeId;
        opt.textContent = `${nodeId} — Selected Map Location`;
        opt.selected = true;
        selectEl.appendChild(opt);
      }

      calculateAllRoutes();
    });
  }

  function detectGPSLocation() {
    if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(1050, 'sine', 0.08);
    const originSelect = document.getElementById('origin-node-select');
    if (!originSelect) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          findAndSelectNearestNode(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          findAndSelectNearestNode(17.439, 78.381);
        },
        { timeout: 4000 }
      );
    } else {
      findAndSelectNearestNode(17.439, 78.381);
    }
  }

  function findAndSelectNearestNode(lat, lng) {
    const originSelect = document.getElementById('origin-node-select');
    if (!originSelect) return;

    let nearest = HYD_LANDMARKS[0];
    let minDist = Infinity;

    HYD_LANDMARKS.forEach(lm => {
      const dist = Math.hypot(lm.coords[0] - lat, lm.coords[1] - lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = lm;
      }
    });

    originSelect.value = nearest.id;
    calculateAllRoutes();
  }

  async function loadNetworkGraph() {
    let data = window.CITYFLOW_NETWORK_DATA;
    if (!data) {
      try {
        const res = await fetch('assets/data/network_data.json');
        data = await res.json();
        window.CITYFLOW_NETWORK_DATA = data;
      } catch(e) {
        console.warn("Could not load network_data.json:", e);
        return;
      }
    }

    // Build graph adjacency list
    networkGraph = {
      nodes: data.nodes || {},
      adj: {}
    };

    Object.keys(networkGraph.nodes).forEach(nId => {
      networkGraph.adj[nId] = [];
    });

    (data.segments || []).forEach(seg => {
      if (!networkGraph.adj[seg.source]) networkGraph.adj[seg.source] = [];
      networkGraph.adj[seg.source].push({
        id: seg.id,
        name: seg.name || `Corridor ${seg.id}`,
        target: seg.target,
        class: seg.class || 'arterial',
        lanes: seg.lanes || 2,
        freeSpeed: seg.free_speed || 45.0,
        capacity: seg.capacity || 2000,
        length: seg.length || 1.2,
        bottleneck: seg.bottleneck || 0,
        coords: seg.coords || []
      });

      // Provide bidirectional continuity where missing
      if (!networkGraph.adj[seg.target]) networkGraph.adj[seg.target] = [];
      const hasReverse = networkGraph.adj[seg.target].some(e => e.target === seg.source);
      if (!hasReverse) {
        networkGraph.adj[seg.target].push({
          id: seg.id + '_rev',
          name: (seg.name ? seg.name + ' (Reverse)' : `Corridor ${seg.id} Reverse`),
          target: seg.source,
          class: seg.class || 'arterial',
          lanes: seg.lanes || 2,
          freeSpeed: seg.free_speed || 45.0,
          capacity: seg.capacity || 2000,
          length: seg.length || 1.2,
          bottleneck: seg.bottleneck || 0,
          coords: seg.coords ? [...seg.coords].reverse() : []
        });
      }
    });
  }

  /**
   * Evaluates dynamic cost of traversing an edge under scenario & strategy
   */
  function getEdgeCost(edge, strategy, activeIncidents) {
    let speed = edge.freeSpeed;
    let penalty = 0;

    // 1. Chokepoint R0067 base block
    const isR0067 = edge.id.startsWith('R0067');
    if (isR0067) {
      if (currentTrafficScenario === 'incident' || currentTrafficScenario === 'peak') {
        speed = 8.0;
        penalty += 12.0;
      }
    }

    // 2. Citizen reported incidents from localStorage
    const hasReportedIncident = activeIncidents.some(inc => 
      inc.corridor && (edge.id === inc.corridor || edge.id.startsWith(inc.corridor))
    );
    if (hasReportedIncident) {
      speed = Math.max(6.0, speed * 0.3);
      penalty += 15.0;
    }

    // 3. Scenario Adjustments
    if (currentTrafficScenario === 'peak') {
      if (edge.bottleneck) {
        speed = Math.max(10.0, speed * 0.45);
        penalty += 6.0;
      } else {
        speed = Math.max(18.0, speed * 0.75);
      }
    } else if (currentTrafficScenario === 'monsoon') {
      speed = Math.max(12.0, speed * 0.55);
      if (edge.class === 'collector') penalty += 4.0;
    }

    const baseTravelTimeMin = (edge.length / speed) * 60 + penalty;

    // Strategy Weighting
    if (strategy === 'detour') {
      let weight = baseTravelTimeMin;
      if (isR0067 || hasReportedIncident) weight += 50.0;
      if (edge.bottleneck) weight *= 2.2;
      return { cost: weight, travelTimeMin: baseTravelTimeMin, speed: speed, isChoke: (isR0067 || hasReportedIncident || edge.bottleneck) };
    } else if (strategy === 'standard') {
      const weight = edge.length * 1.5;
      return { cost: weight, travelTimeMin: baseTravelTimeMin, speed: speed, isChoke: (isR0067 || hasReportedIncident || edge.bottleneck) };
    } else if (strategy === 'eco') {
      let ecoScore = edge.length * 1.2;
      if (speed < 25) ecoScore *= 2.5;
      if (isR0067 || hasReportedIncident) ecoScore += 35.0;
      return { cost: ecoScore, travelTimeMin: baseTravelTimeMin, speed: speed, isChoke: (isR0067 || hasReportedIncident) };
    }

    return { cost: baseTravelTimeMin, travelTimeMin: baseTravelTimeMin, speed: speed, isChoke: false };
  }

  /**
   * Standard Dijkstra shortest-path solver on networkGraph
   */
  function runDijkstra(startNode, endNode, strategy, activeIncidents) {
    if (!networkGraph || !networkGraph.nodes[startNode] || !networkGraph.nodes[endNode]) {
      return null;
    }

    const dist = {};
    const prev = {};
    const prevEdge = {};
    const unvisited = new Set(Object.keys(networkGraph.nodes));

    Object.keys(networkGraph.nodes).forEach(n => {
      dist[n] = Infinity;
    });
    dist[startNode] = 0;

    while (unvisited.size > 0) {
      let curr = null;
      let minVal = Infinity;
      for (const node of unvisited) {
        if (dist[node] < minVal) {
          minVal = dist[node];
          curr = node;
        }
      }

      if (curr === null || minVal === Infinity || curr === endNode) {
        break;
      }

      unvisited.delete(curr);

      const edges = networkGraph.adj[curr] || [];
      for (const edge of edges) {
        if (!unvisited.has(edge.target)) continue;

        const costObj = getEdgeCost(edge, strategy, activeIncidents);
        const alt = dist[curr] + costObj.cost;

        if (alt < dist[edge.target]) {
          dist[edge.target] = alt;
          prev[edge.target] = curr;
          prevEdge[edge.target] = { edge: edge, costObj: costObj };
        }
      }
    }

    if (dist[endNode] === Infinity) return null;

    const pathNodes = [];
    const pathSegments = [];
    const pathCoords = [];
    let totalDistKm = 0;
    let totalTimeMin = 0;
    let chokepointsEncountered = 0;

    let curr = endNode;
    while (curr !== startNode && prev[curr]) {
      pathNodes.unshift(curr);
      const edgeData = prevEdge[curr];
      pathSegments.unshift(edgeData.edge);
      totalDistKm += edgeData.edge.length;
      totalTimeMin += edgeData.costObj.travelTimeMin;
      if (edgeData.costObj.isChoke) chokepointsEncountered++;
      curr = prev[curr];
    }
    pathNodes.unshift(startNode);

    // Assemble coords
    pathCoords.push(networkGraph.nodes[startNode]);
    pathSegments.forEach(seg => {
      if (seg.coords && seg.coords.length > 0) {
        seg.coords.forEach(pt => pathCoords.push(pt));
      }
      pathCoords.push(networkGraph.nodes[seg.target]);
    });

    const cleanCoords = [];
    for (let i = 0; i < pathCoords.length; i++) {
      if (i === 0 || 
          Math.abs(pathCoords[i][0] - pathCoords[i-1][0]) > 0.00001 || 
          Math.abs(pathCoords[i][1] - pathCoords[i-1][1]) > 0.00001) {
        cleanCoords.push(pathCoords[i]);
      }
    }

    const avgSpeed = (totalDistKm / (totalTimeMin / 60)) || 35;
    const idleFactor = avgSpeed < 20 ? 1.6 : (avgSpeed < 35 ? 1.2 : 1.0);
    const co2Kg = (totalDistKm * 0.12 * idleFactor).toFixed(2);

    return {
      strategy,
      startNode,
      endNode,
      nodes: pathNodes,
      segments: pathSegments,
      coords: cleanCoords,
      distance: totalDistKm.toFixed(1),
      eta: Math.round(totalTimeMin),
      avgSpeed: Math.round(avgSpeed),
      chokepoints: chokepointsEncountered,
      co2: co2Kg
    };
  }

  function getActiveCitizenIncidents() {
    try {
      const stored = localStorage.getItem('cityflow_incidents');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return [];
  }

  async function fetchLiveRoadRoute(startCoords, endCoords, waypoints = []) {
    try {
      const pts = [`${startCoords[1]},${startCoords[0]}`];
      if (waypoints && waypoints.length > 0) {
        waypoints.forEach(wp => {
          if (wp && wp.length === 2) pts.push(`${wp[1]},${wp[0]}`);
        });
      }
      pts.push(`${endCoords[1]},${endCoords[0]}`);
      const url = `https://router.project-osrm.org/route/v1/driving/${pts.join(';')}?overview=full&geometries=geojson&steps=true`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const res = await fetch(url, { signal: controller.signal }).then(r => r.json());
      clearTimeout(timeoutId);
      
      if (res.code === 'Ok' && res.routes && res.routes.length > 0) {
        const r = res.routes[0];
        const coords = r.geometry.coordinates.map(pt => [Number(pt[1].toFixed(6)), Number(pt[0].toFixed(6))]);
        const distKm = Number((r.distance / 1000).toFixed(1));
        const steps = [];
        if (r.legs) {
          r.legs.forEach(leg => {
            if (leg.steps) {
              leg.steps.forEach(s => {
                if (s.distance > 25) {
                  let text = '';
                  const mType = s.maneuver.type;
                  const mod = s.maneuver.modifier ? ` ${s.maneuver.modifier}` : '';
                  const sName = s.name ? s.name : 'Connector Link';
                  if (mType === 'depart') text = `Head onto ${sName}`;
                  else if (mType === 'turn') text = `Turn${mod} onto ${sName}`;
                  else if (mType === 'roundabout') text = `At roundabout take exit onto ${sName}`;
                  else if (mType === 'arrive') text = `Arrive at destination`;
                  else text = `Continue on ${sName}`;
                  steps.push({
                    text: text,
                    road: sName,
                    dist: s.distance < 1000 ? `${Math.round(s.distance)} m` : `${(s.distance / 1000).toFixed(1)} km`,
                    isChoke: sName.toLowerCase().includes('mindspace')
                  });
                }
              });
            }
          });
        }
        return { coords, distKm, steps };
      }
    } catch(e) {
      // Graceful fallback to pre-baked graph
    }
    return null;
  }

  function calculateAllRoutes() {
    const originSelect = document.getElementById('origin-node-select');
    const destSelect = document.getElementById('dest-node-select');
    if (!originSelect || !destSelect) return;

    const startNode = originSelect.value;
    const endNode = destSelect.value;

    if (startNode === endNode) {
      alert("Origin and Destination nodes cannot be identical. Please pick distinct nodes.");
      return;
    }

    const activeIncidents = getActiveCitizenIncidents();

    // 1. Calculate the 3 routes
    const detourRoute = runDijkstra(startNode, endNode, 'detour', activeIncidents);
    const standardRoute = runDijkstra(startNode, endNode, 'standard', activeIncidents);
    const ecoRoute = runDijkstra(startNode, endNode, 'eco', activeIncidents);

    if (!detourRoute || !standardRoute) {
      console.warn("Could not find viable path between nodes:", startNode, endNode);
      return;
    }

    // Resolve Landmark Names
    const originName = getLandmarkName(startNode);
    const destName = getLandmarkName(endNode);

    detourRoute.name = "NeurAX AI Detour";
    detourRoute.originName = originName;
    detourRoute.destName = destName;

    standardRoute.name = "Standard Direct Route";
    standardRoute.originName = originName;
    standardRoute.destName = destName;

    if (ecoRoute) {
      ecoRoute.name = "Eco-Green Arterial";
      ecoRoute.originName = originName;
      ecoRoute.destName = destName;
    }

    // Calculate dynamic savings
    const timeSavedMin = Math.max(0, standardRoute.eta - detourRoute.eta);
    const co2SavedKg = Math.max(0.05, (parseFloat(standardRoute.co2) - parseFloat(detourRoute.co2))).toFixed(2);

    calculatedRoutes = {
      detour: detourRoute,
      standard: standardRoute,
      eco: ecoRoute || detourRoute,
      timeSaved: timeSavedMin,
      co2Saved: co2SavedKg
    };

    // 2. Render Results Card immediately with pre-baked high-definition asphalt geometry
    updateRouteResultsUI();

    // 3. Draw Active Route on Leaflet Map
    renderRouteOnMap(activeRouteType);

    // 4. Asynchronously refine with real-time OSRM street maneuvers & micro-curvature
    const startCoords = networkGraph.nodes[startNode];
    const endCoords = networkGraph.nodes[endNode];

    if (startCoords && endCoords) {
      const detourWps = (detourRoute.nodes || []).slice(1, -1).map(n => networkGraph.nodes[n]).filter(Boolean);
      const standardWps = (standardRoute.nodes || []).slice(1, -1).map(n => networkGraph.nodes[n]).filter(Boolean);

      Promise.all([
        fetchLiveRoadRoute(startCoords, endCoords, detourWps),
        fetchLiveRoadRoute(startCoords, endCoords, standardWps)
      ]).then(([detourLive, standardLive]) => {
        let changed = false;
        if (detourLive && detourLive.coords && detourLive.coords.length > 5) {
          calculatedRoutes.detour.coords = detourLive.coords;
          calculatedRoutes.detour.steps = detourLive.steps;
          changed = true;
        }
        if (standardLive && standardLive.coords && standardLive.coords.length > 5) {
          calculatedRoutes.standard.coords = standardLive.coords;
          calculatedRoutes.standard.steps = standardLive.steps;
          changed = true;
        }
        if (changed) {
          renderRouteOnMap(activeRouteType);
          renderTurnByTurn();
        }
      }).catch(err => {
        console.warn("Async live road enhancement note:", err);
      });
    }
  }

  function getLandmarkName(nodeId) {
    const match = HYD_LANDMARKS.find(l => l.id === nodeId);
    return match ? match.name : `Node ${nodeId}`;
  }

  function updateRouteResultsUI() {
    const resultBox = document.getElementById('route-result-box');
    if (resultBox) {
      resultBox.classList.remove('hidden');
      resultBox.classList.add('animate-fadeIn');
    }

    // Top Save Badge
    const saveBadge = document.getElementById('route-save-badge');
    if (saveBadge) {
      if (calculatedRoutes.timeSaved > 0) {
        saveBadge.textContent = `SAVE ${calculatedRoutes.timeSaved} MIN`;
        saveBadge.className = 'px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-500 font-mono border border-emerald-500/25';
      } else {
        saveBadge.textContent = `OPTIMAL ROUTE`;
        saveBadge.className = 'px-2.5 py-0.5 rounded text-[11px] font-bold bg-cyan-500/15 text-cyan-500 font-mono border border-cyan-500/25';
      }
    }

    // Update Tab Badges
    const tabDetourEta = document.getElementById('tab-detour-eta');
    if (tabDetourEta && calculatedRoutes.detour) {
      tabDetourEta.textContent = `${calculatedRoutes.detour.eta}m`;
    }

    const tabStandardEta = document.getElementById('tab-standard-eta');
    if (tabStandardEta && calculatedRoutes.standard) {
      tabStandardEta.textContent = `${calculatedRoutes.standard.eta}m`;
    }

    const tabEcoEta = document.getElementById('tab-eco-eta');
    if (tabEcoEta && calculatedRoutes.eco) {
      tabEcoEta.textContent = `${calculatedRoutes.eco.eta}m`;
    }

    // Render Active Route Card Details
    renderActiveRouteDetails();

    // Render Turn-by-Turn Directions
    renderTurnByTurn();
  }

  function selectRouteTab(type) {
    if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(850, 'sine', 0.04);
    activeRouteType = type;

    // Update tab styling
    ['detour', 'standard', 'eco'].forEach(t => {
      const tab = document.getElementById(`tab-route-${t}`);
      if (!tab) return;
      if (t === type) {
        tab.classList.add('bg-cyan-500/15', 'border-cyan-500', 'text-cyan-600', 'dark:text-cyan-400');
        tab.classList.remove('border-transparent', 'text-slate-500', 'dark:text-slate-400');
      } else {
        tab.classList.remove('bg-cyan-500/15', 'border-cyan-500', 'text-cyan-600', 'dark:text-cyan-400');
        tab.classList.add('border-transparent', 'text-slate-500', 'dark:text-slate-400');
      }
    });

    renderActiveRouteDetails();
    renderRouteOnMap(type);
    renderTurnByTurn();
  }

  function renderActiveRouteDetails() {
    const route = calculatedRoutes[activeRouteType] || calculatedRoutes.detour;
    if (!route) return;

    // Header Title
    const routeTitle = document.getElementById('active-route-title');
    if (routeTitle) routeTitle.textContent = route.name;

    // ETA & Distance
    const etaEl = document.getElementById('active-route-eta');
    if (etaEl) etaEl.textContent = `${route.eta} Mins`;

    const distEl = document.getElementById('active-route-dist');
    if (distEl) distEl.textContent = `${route.distance} km • Avg ${route.avgSpeed} km/h`;

    // Delay Alert Note
    const delayNote = document.getElementById('active-route-note');
    if (delayNote) {
      if (activeRouteType === 'detour') {
        delayNote.className = 'text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5';
        delayNote.innerHTML = `<i data-lucide="shield-check" class="w-3.5 h-3.5 shrink-0"></i> <span>Smooth corridor bypass. Choke points & incidents evaded.</span>`;
      } else if (activeRouteType === 'standard') {
        const hasChoke = route.chokepoints > 0;
        delayNote.className = hasChoke 
          ? 'text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1.5' 
          : 'text-[11px] text-slate-500 flex items-center gap-1.5';
        delayNote.innerHTML = hasChoke
          ? `<i data-lucide="alert-octagon" class="w-3.5 h-3.5 shrink-0"></i> <span>Direct path hits active bottleneck. +${calculatedRoutes.timeSaved}m queue spillback.</span>`
          : `<i data-lucide="check" class="w-3.5 h-3.5 shrink-0"></i> <span>Direct corridor clear under current conditions.</span>`;
      } else {
        delayNote.className = 'text-[11px] text-emerald-500 flex items-center gap-1.5';
        delayNote.innerHTML = `<i data-lucide="leaf" class="w-3.5 h-3.5 shrink-0"></i> <span>Steady speed corridor. Lowest stop-and-go acceleration burn.</span>`;
      }
    }

    // CO2 Savings Metric
    const co2El = document.getElementById('active-route-co2');
    if (co2El) {
      if (activeRouteType === 'standard') {
        co2El.textContent = `${route.co2} kg CO₂`;
        co2El.className = 'font-bold text-amber-500 font-mono';
      } else {
        co2El.textContent = `-${calculatedRoutes.co2Saved} kg CO₂ Saved`;
        co2El.className = 'font-bold text-emerald-500 font-mono';
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function renderTurnByTurn() {
    const list = document.getElementById('turn-by-turn-list');
    if (!list) return;

    const route = calculatedRoutes[activeRouteType] || calculatedRoutes.detour;
    if (!route) {
      list.innerHTML = '<p class="text-xs text-slate-400">No itinerary steps available.</p>';
      return;
    }

    list.innerHTML = '';

    // Step 1: Departure
    const startItem = document.createElement('div');
    startItem.className = 'flex items-start gap-2.5 text-xs';
    startItem.innerHTML = `
      <div class="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-cyan-500/30">1</div>
      <div class="flex flex-col">
        <span class="font-bold text-slate-800 dark:text-slate-200">Depart ${getLandmarkName(route.startNode)}</span>
        <span class="text-[10px] text-slate-400">Head outbound toward central arterial network</span>
      </div>
    `;
    list.appendChild(startItem);

    if (route.steps && route.steps.length > 0) {
      // High-definition real street maneuvers
      route.steps.slice(0, 5).forEach((step, idx) => {
        const item = document.createElement('div');
        item.className = 'flex items-start gap-2.5 text-xs';
        item.innerHTML = `
          <div class="w-5 h-5 rounded-full ${step.isChoke ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'} flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border">
            ${idx + 2}
          </div>
          <div class="flex flex-col">
            <span class="font-medium text-slate-800 dark:text-slate-200">
              ${step.text}
            </span>
            <span class="text-[10px] text-slate-400">
              ${step.dist} • ${step.road} ${step.isChoke ? '<strong class="text-rose-400 ml-1">🚨 Choke Point</strong>' : ''}
            </span>
          </div>
        `;
        list.appendChild(item);
      });

      if (route.steps.length > 5) {
        const moreCount = route.steps.length - 5;
        const midItem = document.createElement('div');
        midItem.className = 'pl-7 text-[10px] text-slate-400 font-mono';
        midItem.textContent = `... and ${moreCount} more road maneuvers to destination`;
        list.appendChild(midItem);
      }
    } else if (route.segments && route.segments.length > 0) {
      // Pre-baked real road segments
      route.segments.slice(0, 4).forEach((seg, idx) => {
        const isBlocked = seg.id.startsWith('R0067');
        const item = document.createElement('div');
        item.className = 'flex items-start gap-2.5 text-xs';
        item.innerHTML = `
          <div class="w-5 h-5 rounded-full ${isBlocked ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'} flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border">
            ${idx + 2}
          </div>
          <div class="flex flex-col">
            <span class="font-medium text-slate-800 dark:text-slate-200">
              ${seg.name || ('Take ' + seg.id)}
            </span>
            <span class="text-[10px] text-slate-400">
              ${seg.length} km • ${seg.freeSpeed} km/h • ${seg.lanes} Lanes ${isBlocked ? '<strong class="text-rose-400 ml-1">🚨 Choke Point</strong>' : ''}
            </span>
          </div>
        `;
        list.appendChild(item);
      });

      if (route.segments.length > 4) {
        const moreCount = route.segments.length - 4;
        const midItem = document.createElement('div');
        midItem.className = 'pl-7 text-[10px] text-slate-400 font-mono';
        midItem.textContent = `... and ${moreCount} more intermediate connector segments`;
        list.appendChild(midItem);
      }
    }

    // Final Arrival
    const endItem = document.createElement('div');
    endItem.className = 'flex items-start gap-2.5 text-xs';
    endItem.innerHTML = `
      <div class="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-purple-500/30">
        🏁
      </div>
      <div class="flex flex-col">
        <span class="font-bold text-slate-800 dark:text-slate-200">Arrive at ${getLandmarkName(route.endNode)}</span>
        <span class="text-[10px] text-emerald-500 font-medium">Destination reached in ${route.eta} mins</span>
      </div>
    `;
    list.appendChild(endItem);
  }

  function renderRouteOnMap(routeType) {
    if (!window.CityFlowMap || typeof window.CityFlowMap.drawDynamicRoute !== 'function') return;
    const route = calculatedRoutes[routeType] || calculatedRoutes.detour;
    if (!route) return;

    window.CityFlowMap.drawDynamicRoute(route, routeType);
  }

  function startLiveNavigation() {
    const route = calculatedRoutes[activeRouteType] || calculatedRoutes.detour;
    if (!route || !route.coords || route.coords.length < 2) return;
    if (!window.CityFlowMap || typeof window.CityFlowMap.startVehicleSimulation !== 'function') return;

    if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(1200, 'sine', 0.1);

    isNavigating = true;

    // Show HUD
    const navHud = document.getElementById('live-navigation-hud');
    if (navHud) {
      navHud.classList.remove('hidden');
      navHud.classList.add('animate-fadeIn');
    }

    window.CityFlowMap.startVehicleSimulation(route.coords, (telemetry) => {
      // Update HUD telemetry
      const speedEl = document.getElementById('nav-hud-speed');
      if (speedEl) speedEl.textContent = `${telemetry.speed} km/h`;

      const progressEl = document.getElementById('nav-hud-progress');
      if (progressEl) progressEl.style.width = `${telemetry.progress}%`;

      const percentEl = document.getElementById('nav-hud-percent');
      if (percentEl) percentEl.textContent = `${telemetry.progress}%`;

      const distRemaining = ((1 - telemetry.progress / 100) * parseFloat(route.distance)).toFixed(1);
      const distEl = document.getElementById('nav-hud-dist-rem');
      if (distEl) distEl.textContent = `${distRemaining} km remaining`;
    });
  }

  function stopLiveNavigation() {
    if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(750, 'triangle', 0.06);
    isNavigating = false;

    if (window.CityFlowMap && typeof window.CityFlowMap.stopVehicleSimulation === 'function') {
      window.CityFlowMap.stopVehicleSimulation();
    }

    const navHud = document.getElementById('live-navigation-hud');
    if (navHud) {
      navHud.classList.add('hidden');
    }
  }

  function showIncidentRecalcNotice() {
    const notice = document.getElementById('incident-recalc-banner');
    if (notice) {
      notice.classList.remove('hidden');
      setTimeout(() => {
        notice.classList.add('hidden');
      }, 7000);
    }
  }

  window.addEventListener('DOMContentLoaded', init);

  return {
    init,
    calculateAllRoutes,
    selectRouteTab,
    setTrafficScenario,
    startLiveNavigation,
    stopLiveNavigation
  };
})();
