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

    const hyderabadCenter = [17.345, 78.410];
    mapInstance = L.map(containerId, {
      center: hyderabadCenter,
      zoom: 12,
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

    // Load GIS network data
    loadNetwork();
  }

  function updateTiles() {
    if (!mapInstance) return;
    if (currentTileLayer) {
      try { mapInstance.removeLayer(currentTileLayer); } catch(e) {}
    }

    const isDark = document.documentElement.classList.contains('dark');

    // Clean, crisp endpoints:
    // Dark: CartoDB Dark Matter (fast 4-node CDN)
    // Light: OpenStreetMap standard
    const primaryUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const fallbackUrl = isDark
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    currentTileLayer = L.tileLayer(primaryUrl, {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap & CartoDB'
    }).addTo(mapInstance);

    let failedCount = 0;
    currentTileLayer.on('tileerror', function() {
      failedCount++;
      if (failedCount === 3) {
        console.warn("Primary map tile endpoint unreachable. Hot-swapping to secondary provider...");
        try { mapInstance.removeLayer(currentTileLayer); } catch(e) {}
        currentTileLayer = L.tileLayer(fallbackUrl, {
          subdomains: 'abcd',
          maxZoom: 18,
          attribution: '&copy; Map Providers'
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
      let weight = 2.5;
      let dashArray = null;

      if (seg.id === 'R0067') {
        color = '#EF4444'; // Red Blocked Choke Point
        weight = 5.5;
      } else if (['R0069', 'R0115', 'R0120', 'R0070'].includes(seg.id)) {
        color = '#06B6D4'; // Cyan Detour Corridor
        weight = 4;
        dashArray = '6, 6';
      } else if (seg.bottleneck === 1) {
        color = '#F59E0B'; // Amber Moderate Congestion
        weight = 3.5;
      }

      const polyline = L.polyline(seg.coords, {
        color: color,
        weight: weight,
        opacity: 0.88,
        dashArray: dashArray
      }).addTo(mapSegmentsGroup);

      polyline.bindTooltip(`
        <div class="font-bold">${seg.id} (${seg.class.toUpperCase()})</div>
        <div>Speed: ${seg.free_speed} km/h • Lanes: ${seg.lanes}</div>
        <div>Status: ${seg.id === 'R0067' ? '🚨 BLOCKED (Choke Point)' : (seg.bottleneck ? '⚠️ Moderate' : '✅ Flowing')}</div>
      `, { className: 'leaflet-tooltip-custom', sticky: true });

      polyline.on('click', () => {
        if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(700, 'triangle', 0.05);
        polyline.bindPopup(`
          <div class="p-1 text-slate-100 text-xs">
            <p class="font-bold text-sm font-heading mb-1 text-cyan-400">Corridor ${seg.id}</p>
            <p><strong>Class:</strong> ${seg.class}</p>
            <p><strong>Lanes:</strong> ${seg.lanes} | <strong>Capacity:</strong> ${seg.capacity} vph</p>
            <p><strong>Length:</strong> ${seg.length} km</p>
            <p><strong>Free Flow:</strong> ${seg.free_speed} km/h</p>
            ${seg.id === 'R0067' ? '<div class="mt-2 text-rose-400 font-bold">⚠️ CRITICAL: Stalled vehicle causing queue spillback!</div>' : ''}
          </div>
        `).openPopup();
      });
    });

    // Incident Marker on R0067
    const incidentCoords = [17.318, 78.449];
    const alertHtml = `
      <div class="incident-pulse-icon">
        <div class="incident-ring"></div>
        <div class="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white">!</div>
      </div>
    `;
    const alertIcon = L.divIcon({ html: alertHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });

    L.marker(incidentCoords, { icon: alertIcon }).addTo(mapSegmentsGroup)
      .bindPopup("<strong>Incident Alert:</strong> Corridor R0067 blocked due to stalled vehicle.");
  }

  function invalidate() {
    if (mapInstance) mapInstance.invalidateSize();
  }

  return {
    init,
    updateTiles,
    invalidate,
    getNetworkData: () => networkData
  };
})();
