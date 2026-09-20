/**
 * CityFlow AI — Leaflet GIS Map Controller
 * Zero-API-key architecture with multi-CDN tile fallback & corridor segment rendering.
 */

window.CityFlowMap = (function() {
  let mapInstance = null;
  let currentTileLayer = null;
  let mapSegmentsGroup = null;
  let networkData = null;

  function init(containerId = 'map-commuter') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (typeof L === 'undefined') {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-900/40 text-slate-300">
          <p class="font-bold text-amber-400 mb-2 font-heading text-base">Leaflet GIS Offline</p>
          <p class="text-xs text-slate-400 max-w-md">Could not reach the map CDN. Please check your internet connection or reload.</p>
        </div>
      `;
      return;
    }

    if (mapInstance) {
      try { mapInstance.remove(); } catch(e) {}
      mapInstance = null;
    }
    if (container._leaflet_id) {
      container._leaflet_id = null;
    }

    const hyderabadCenter = [17.435, 78.375]; // HITEC City / Gachibowli Tech Corridor
    mapInstance = L.map(containerId, {
      center: hyderabadCenter,
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    updateTiles();

    // Staggered size invalidations to ensure proper canvas layout across flexbox reflows
    [80, 250, 600, 1200].forEach(delay => {
      setTimeout(() => {
        if (mapInstance) mapInstance.invalidateSize();
      }, delay);
    });

    window.addEventListener('resize', () => {
      if (mapInstance) mapInstance.invalidateSize();
    });

    window.addEventListener('themeChanged', () => {
      updateTiles();
    });

    // Load GIS network data
    loadNetwork();
  }

  function updateTiles() {
    if (!mapInstance) return;
    if (currentTileLayer) {
      try { mapInstance.removeLayer(currentTileLayer); } catch(e) {}
    }

    const isDark = document.documentElement.classList.contains('dark');

    // Zero-API-key, completely free enterprise GIS endpoints:
    // Dark: ArcGIS World Dark Gray Base (clean dark theme with zero keys, zero watermarks)
    // Light: ArcGIS World Street Map (crisp street grid, zero keys, zero 403 blocks)
    const primaryUrl = isDark 
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

    const fallbackUrl = isDark
      ? 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';

    const attribution = '&copy; Esri, HERE, Garmin';

    currentTileLayer = L.tileLayer(primaryUrl, {
      maxZoom: 19,
      maxNativeZoom: isDark ? 16 : 19,
      attribution: attribution
    }).addTo(mapInstance);

    let failedCount = 0;
    currentTileLayer.on('tileerror', function() {
      failedCount++;
      if (failedCount === 3) {
        console.warn("Primary map tile endpoint unreachable. Hot-swapping to secondary provider...");
        try { mapInstance.removeLayer(currentTileLayer); } catch(e) {}
        currentTileLayer = L.tileLayer(fallbackUrl, {
          maxZoom: 19,
          maxNativeZoom: isDark ? 16 : 19,
          attribution: attribution
        }).addTo(mapInstance);
      }
    });
  }

  function loadNetwork() {
    if (window.CITYFLOW_NETWORK_DATA) {
      networkData = window.CITYFLOW_NETWORK_DATA;
      renderSegments(networkData);
    } else {
      fetch('assets/data/network_data.json')
        .then(res => res.json())
        .then(data => {
          networkData = data;
          renderSegments(data);
        })
        .catch(err => {
          console.warn("Fallback fetch to network_data.json:", err);
        });
    }
  }

  function renderSegments(data) {
    if (!mapInstance || !data || !data.segments) return;
    if (mapSegmentsGroup) mapInstance.removeLayer(mapSegmentsGroup);
    mapSegmentsGroup = L.layerGroup().addTo(mapInstance);

    data.segments.forEach(seg => {
      let color = '#10B981'; // Green (Smooth flow)
      let weight = 3.5;
      let dashArray = null;

      if (seg.id === 'R0067') {
        color = '#EF4444'; // Red Blocked Choke Point
        weight = 5.5;
      } else if (seg.bottleneck === 1) {
        color = '#F59E0B'; // Amber Moderate Congestion
        weight = 4;
      }

      const polyline = L.polyline(seg.coords, {
        color: color,
        weight: weight,
        opacity: 0.82,
        dashArray: dashArray,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapSegmentsGroup);

      polyline.bindTooltip(`
        <div class="font-bold text-xs">${seg.name || seg.id} (${seg.id})</div>
        <div>Class: ${seg.class.toUpperCase()} • Speed: ${seg.free_speed} km/h • Lanes: ${seg.lanes}</div>
        <div>Status: ${seg.id === 'R0067' ? '🚨 CRITICAL CHOKEPOINT (Blocked)' : (seg.bottleneck ? '⚠️ Moderate Slowdown' : '✅ Smooth Arterial Flow')}</div>
      `, { className: 'leaflet-tooltip-custom', sticky: true });

      polyline.on('click', () => {
        if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(700, 'triangle', 0.05);
        polyline.bindPopup(`
          <div class="p-1 text-slate-100 text-xs">
            <p class="font-bold text-sm font-heading mb-1 text-cyan-400">${seg.name || 'Corridor ' + seg.id}</p>
            <p><strong>Corridor ID:</strong> ${seg.id} (${seg.class.toUpperCase()})</p>
            <p><strong>Lanes:</strong> ${seg.lanes} | <strong>Capacity:</strong> ${seg.capacity} vph</p>
            <p><strong>Length:</strong> ${seg.length} km</p>
            <p><strong>Free Speed:</strong> ${seg.free_speed} km/h</p>
            ${seg.id === 'R0067' ? '<div class="mt-2 text-rose-400 font-bold">⚠️ CRITICAL: Stalled truck causing queue spillback! +34m delay.</div>' : '<div class="mt-2 text-emerald-400">Flow optimal under current traffic assignment.</div>'}
          </div>
        `).openPopup();
      });
    });

    // Incident Marker on R0067 (Mindspace Inbound)
    const incidentCoords = [17.4390, 78.3770];
    const alertHtml = `
      <div class="incident-pulse-icon">
        <div class="incident-ring"></div>
        <div class="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white">!</div>
      </div>
    `;
    const alertIcon = L.divIcon({ html: alertHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });

    L.marker(incidentCoords, { icon: alertIcon }).addTo(mapSegmentsGroup)
      .bindPopup(`
        <div class="p-1 text-slate-100 text-xs">
          <p class="font-bold text-sm font-heading mb-1 text-rose-400">🚨 Incident Alert: Stalled Heavy Truck</p>
          <p><strong>Location:</strong> Mindspace Inbound (Corridor R0067)</p>
          <p><strong>Impact:</strong> 2 lanes blocked. Queue spillback toward Cyber Gateway.</p>
          <p class="mt-1 text-cyan-300 font-semibold">⚡ NeurAX AI Detour active via Bio-Diversity Flyover.</p>
        </div>
      `);

    // Load and render citizen-reported incidents from localStorage
    try {
      const storedIncidents = localStorage.getItem('cityflow_incidents');
      if (storedIncidents) {
        const incidents = JSON.parse(storedIncidents);
        incidents.forEach(inc => {
          if (!inc.coords || !Array.isArray(inc.coords)) return;
          if (inc.corridor === 'R0067' && Math.abs(inc.coords[0] - incidentCoords[0]) < 0.002) return;

          const isCritical = inc.severity === 'critical';
          const pinColor = isCritical ? 'bg-rose-600' : 'bg-amber-500';
          const pulseColor = isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)';

          const customPinHtml = `
            <div class="incident-pulse-icon">
              <div class="incident-ring" style="background: ${pulseColor}"></div>
              <div class="w-6 h-6 rounded-full ${pinColor} text-white flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white">!</div>
            </div>
          `;
          const customIcon = L.divIcon({ html: customPinHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });

          L.marker(inc.coords, { icon: customIcon }).addTo(mapSegmentsGroup)
            .bindPopup(`
              <div class="p-1 text-slate-100 text-xs">
                <p class="font-bold text-sm font-heading mb-1 text-rose-400">Citizen Report: ${inc.id}</p>
                <p><strong>Type:</strong> ${inc.typeName}</p>
                <p><strong>Corridor:</strong> ${inc.corridorName || inc.corridor}</p>
                <p><strong>Lanes:</strong> ${inc.lanesBlocked}</p>
                <p class="mt-1 text-slate-300">${inc.description || ''}</p>
                <div class="mt-1.5 pt-1.5 border-t border-white/10 text-[10px] text-emerald-400 font-semibold">
                  Status: ${inc.statusText}
                </div>
              </div>
            `);
        });
      }
    } catch(e) {
      console.warn("Could not load citizen incidents on map:", e);
    }
  }

  let routeLayersGroup = null;
  let vehicleMarker = null;
  let animTimer = null;
  let isPickingMode = false;
  let pickingCallback = null;

  function clearDynamicRoutes() {
    stopVehicleSimulation();
    if (routeLayersGroup && mapInstance) {
      mapInstance.removeLayer(routeLayersGroup);
      routeLayersGroup = null;
    }
  }

  function drawDynamicRoute(route, routeType = 'detour') {
    if (!mapInstance || !route || !route.coords || route.coords.length < 2) return;

    if (!routeLayersGroup) {
      routeLayersGroup = L.layerGroup().addTo(mapInstance);
    } else {
      routeLayersGroup.clearLayers();
    }

    const colorMap = {
      detour: { color: '#06b6d4', class: 'route-polyline-detour', weight: 6 },
      standard: { color: '#ef4444', class: 'route-polyline-standard', weight: 5.5 },
      eco: { color: '#10b981', class: 'route-polyline-eco', weight: 6 }
    };
    const style = colorMap[routeType] || colorMap.detour;

    // Glowing background trace
    L.polyline(route.coords, {
      color: style.color,
      weight: style.weight + 4,
      opacity: 0.28,
      lineCap: 'round'
    }).addTo(routeLayersGroup);

    // Foreground dynamic polyline
    const routeLine = L.polyline(route.coords, {
      color: style.color,
      weight: style.weight,
      opacity: 0.95,
      className: style.class,
      lineCap: 'round'
    }).addTo(routeLayersGroup);

    routeLine.bindTooltip(`
      <div class="font-bold text-xs text-white">${route.name || 'Calculated Route'}</div>
      <div class="text-[10px] text-cyan-300">ETA: ${route.eta} mins • ${route.distance} km</div>
    `, { className: 'leaflet-tooltip-custom', sticky: true });

    // Waypoint Markers
    const startCoord = route.coords[0];
    const endCoord = route.coords[route.coords.length - 1];

    const pinAHtml = `
      <div class="route-waypoint-pin">
        <div class="route-pin-badge bg-cyan-500 shadow-cyan-500/50">A</div>
      </div>
    `;
    const pinAIcon = L.divIcon({ html: pinAHtml, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
    L.marker(startCoord, { icon: pinAIcon }).addTo(routeLayersGroup)
      .bindPopup(`<strong>Origin (Point A)</strong><br>${route.originName || 'Starting Point'}`);

    const pinBHtml = `
      <div class="route-waypoint-pin">
        <div class="route-pin-badge bg-purple-600 shadow-purple-500/50">B</div>
      </div>
    `;
    const pinBIcon = L.divIcon({ html: pinBHtml, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
    L.marker(endCoord, { icon: pinBIcon }).addTo(routeLayersGroup)
      .bindPopup(`<strong>Destination (Point B)</strong><br>${route.destName || 'Ending Hub'}`);

    // Fit bounds nicely
    try {
      const bounds = L.latLngBounds(route.coords);
      mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } catch(e) {}
  }

  function getBearing(p1, p2) {
    const lat1 = p1[0] * Math.PI / 180;
    const lon1 = p1[1] * Math.PI / 180;
    const lat2 = p2[0] * Math.PI / 180;
    const lon2 = p2[1] * Math.PI / 180;
    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  function startVehicleSimulation(coords, onTick) {
    stopVehicleSimulation();
    if (!mapInstance || !coords || coords.length < 2) return;

    if (!routeLayersGroup) {
      routeLayersGroup = L.layerGroup().addTo(mapInstance);
    }

    // Interpolate points for buttery smooth motion
    const denseCoords = [];
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const steps = 15;
      for (let s = 0; s < steps; s++) {
        denseCoords.push([
          p1[0] + (p2[0] - p1[0]) * (s / steps),
          p1[1] + (p2[1] - p1[1]) * (s / steps)
        ]);
      }
    }
    denseCoords.push(coords[coords.length - 1]);

    let stepIdx = 0;
    const totalSteps = denseCoords.length;

    function renderVehicleMarker(pos, heading) {
      const vehicleHtml = `
        <div class="nav-vehicle-marker" style="transform: rotate(${Math.round(heading)}deg);">
          <div class="nav-vehicle-pulse"></div>
          <div class="nav-vehicle-body">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#ffffff" stroke="#0f172a" stroke-width="2">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
          </div>
        </div>
      `;
      const vehicleIcon = L.divIcon({ html: vehicleHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });

      if (!vehicleMarker) {
        vehicleMarker = L.marker(pos, { icon: vehicleIcon, zIndexOffset: 1000 }).addTo(routeLayersGroup);
      } else {
        vehicleMarker.setLatLng(pos);
        vehicleMarker.setIcon(vehicleIcon);
      }
    }

    renderVehicleMarker(denseCoords[0], 0);

    animTimer = setInterval(() => {
      if (stepIdx >= totalSteps - 1) {
        stepIdx = 0; // Loop simulation
      } else {
        stepIdx++;
      }

      const currentPos = denseCoords[stepIdx];
      const nextPos = denseCoords[Math.min(stepIdx + 1, totalSteps - 1)];
      const heading = getBearing(currentPos, nextPos);

      renderVehicleMarker(currentPos, heading);

      const progress = stepIdx / totalSteps;
      const speedKmH = 40 + Math.sin(stepIdx * 0.1) * 8; // realistic fluctuating speed 36-48 km/h

      if (typeof onTick === 'function') {
        onTick({
          currentPos,
          progress: Math.min(100, Math.round(progress * 100)),
          speed: Math.round(speedKmH),
          step: stepIdx,
          total: totalSteps
        });
      }
    }, 180);
  }

  function stopVehicleSimulation() {
    if (animTimer) {
      clearInterval(animTimer);
      animTimer = null;
    }
    if (vehicleMarker && routeLayersGroup) {
      try { routeLayersGroup.removeLayer(vehicleMarker); } catch(e) {}
      vehicleMarker = null;
    }
  }

  function enableMapPicker(onNodeSelected) {
    isPickingMode = true;
    pickingCallback = onNodeSelected;
    const container = document.getElementById('map-commuter');
    if (container) container.classList.add('map-picking-active');

    if (mapInstance) {
      mapInstance.once('click', handleMapPickClick);
    }
  }

  function disableMapPicker() {
    isPickingMode = false;
    pickingCallback = null;
    const container = document.getElementById('map-commuter');
    if (container) container.classList.remove('map-picking-active');
  }

  function handleMapPickClick(e) {
    if (!isPickingMode || !pickingCallback || !networkData || !networkData.nodes) {
      disableMapPicker();
      return;
    }

    const clickLat = e.latlng.lat;
    const clickLng = e.latlng.lng;

    // Find closest node in networkData
    let closestNodeId = null;
    let minDistance = Infinity;

    Object.entries(networkData.nodes).forEach(([nodeId, coords]) => {
      const dist = Math.hypot(coords[0] - clickLat, coords[1] - clickLng);
      if (dist < minDistance) {
        minDistance = dist;
        closestNodeId = nodeId;
      }
    });

    const cb = pickingCallback;
    disableMapPicker();
    if (cb && closestNodeId) {
      cb(closestNodeId, networkData.nodes[closestNodeId]);
    }
  }

  window.addEventListener('cityflowIncidentsUpdated', () => {
    if (networkData) renderSegments(networkData);
  });

  function invalidate() {
    if (mapInstance) mapInstance.invalidateSize();
  }

  return {
    init,
    updateTiles,
    invalidate,
    getNetworkData: () => networkData,
    drawDynamicRoute,
    clearDynamicRoutes,
    startVehicleSimulation,
    stopVehicleSimulation,
    enableMapPicker,
    disableMapPicker
  };
})();

