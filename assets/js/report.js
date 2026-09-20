/**
 * CityFlow AI — Citizen Incident Reporting & Authority Dispatch Controller
 * Handles interactive map coordinate selection, photo preview, AI triage computation,
 * persistent storage in localStorage, audio telemetry, and real-time dispatch status tracking.
 */

window.CityFlowReport = (function() {
  const STORAGE_KEY = 'cityflow_incidents';
  let reportMap = null;
  let reportMarker = null;
  let selectedCoords = [17.439, 78.381]; // Default around HITEC City / Cyber Towers

  // Initial seed incidents if localStorage is empty
  const SEED_INCIDENTS = [
    {
      id: 'HYD-INC-7821',
      type: 'stalled_vehicle',
      typeName: 'Stalled Commercial Vehicle',
      corridor: 'R0067',
      corridorName: 'Mindspace Inbound Bottleneck (Near Raheja Mindspace)',
      coords: [17.436, 78.380],
      severity: 'critical',
      severityLabel: 'Priority 1 — Critical Blockage',
      lanesBlocked: '2 of 3 lanes blocked',
      description: 'Heavy multi-axle freight truck broke down on the right and center lanes. Significant queue forming towards Cyber Gateway.',
      reporter: 'Ramesh K. (Commuter)',
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      status: 'dispatched',
      statusText: 'PCR Unit 14 En Route',
      upvotes: 8,
      authority: 'Cyberabad Traffic Police (Sector 4)'
    },
    {
      id: 'HYD-INC-7819',
      type: 'waterlogging',
      typeName: 'Severe Monsoon Waterlogging',
      corridor: 'R0069',
      corridorName: 'Cyber Towers to Bio-Diversity Bypass (Underpass)',
      coords: [17.4285, 78.3790],
      severity: 'moderate',
      severityLabel: 'Priority 2 — High Congestion',
      lanesBlocked: 'Left lane submerged (1.5 ft water)',
      description: 'Drainage overflow after thunderstorm. Traffic crawled to 12 km/h. GHMC drainage motor required.',
      reporter: 'Anonymous Citizen',
      timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      status: 'action_taken',
      statusText: 'GHMC DRF Team Deployed',
      upvotes: 14,
      authority: 'GHMC Disaster Management + Cyberabad Police'
    }
  ];

  function getStoredIncidents() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn("Could not read from localStorage:", e);
    }
    // Seed initial data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_INCIDENTS));
    return SEED_INCIDENTS;
  }

  function saveIncidents(incidents) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
      window.dispatchEvent(new CustomEvent('cityflowIncidentsUpdated', { detail: incidents }));
    } catch (e) {
      console.error("Failed to save incidents:", e);
    }
  }

  function init() {
    initReportMiniMap();
    initPhotoUpload();
    initFormHandlers();
    renderIncidentFeed();
  }

  // Mini Leaflet Map for pinpointing exact location
  function initReportMiniMap() {
    const mapContainer = document.getElementById('report-mini-map');
    if (!mapContainer || typeof L === 'undefined') return;

    if (reportMap) {
      try { reportMap.remove(); } catch(e) {}
      reportMap = null;
    }
    if (mapContainer._leaflet_id) {
      mapContainer._leaflet_id = null;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const tileUrl = isDark
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

    reportMap = L.map('report-mini-map', {
      center: selectedCoords,
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      maxNativeZoom: isDark ? 16 : 19,
      attribution: '&copy; Esri, HERE, Garmin'
    }).addTo(reportMap);

    // Initial pin marker
    const pinIcon = L.divIcon({
      html: `
        <div class="flex items-center justify-center">
          <div class="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-xl border-2 border-white ring-4 ring-rose-500/30 animate-bounce">
            📍
          </div>
        </div>
      `,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    reportMarker = L.marker(selectedCoords, { icon: pinIcon, draggable: true }).addTo(reportMap);

    reportMarker.on('dragend', function(e) {
      const pos = e.target.getLatLng();
      updateCoordinates(pos.lat, pos.lng);
    });

    reportMap.on('click', function(e) {
      if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(650, 'sine', 0.04);
      reportMarker.setLatLng(e.latlng);
      updateCoordinates(e.latlng.lat, e.latlng.lng);
    });

    // Handle theme toggle tile update
    window.addEventListener('themeChanged', function() {
      if (!reportMap) return;
      reportMap.eachLayer(layer => {
        if (layer instanceof L.TileLayer) reportMap.removeLayer(layer);
      });
      const darkNow = document.documentElement.classList.contains('dark');
      const newUrl = darkNow
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
      L.tileLayer(newUrl, { 
        maxZoom: 19, 
        maxNativeZoom: darkNow ? 16 : 19,
        attribution: '&copy; Esri, HERE, Garmin'
      }).addTo(reportMap);
    });

    // Invalidate size once visible
    setTimeout(() => {
      if (reportMap) reportMap.invalidateSize();
    }, 200);
  }

  function updateCoordinates(lat, lng) {
    selectedCoords = [lat, lng];
    const coordEl = document.getElementById('incident-coords-display');
    if (coordEl) {
      coordEl.textContent = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
    }
  }

  // Simulated GPS button
  function useCurrentGPS() {
    if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(850, 'triangle', 0.06);

    const gpsBtn = document.getElementById('gps-locate-btn');
    if (gpsBtn) {
      gpsBtn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Locking GPS...</span>`;
      if (window.lucide) window.lucide.createIcons();
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          finishGPSLocate(lat, lng);
        },
        () => {
          // Fallback to central Hyderabad tech corridor
          finishGPSLocate(17.4435, 78.3772);
        },
        { timeout: 3000 }
      );
    } else {
      finishGPSLocate(17.4435, 78.3772);
    }
  }

  function finishGPSLocate(lat, lng) {
    selectedCoords = [lat, lng];
    if (reportMap && reportMarker) {
      reportMap.flyTo([lat, lng], 14, { duration: 1 });
      reportMarker.setLatLng([lat, lng]);
    }
    updateCoordinates(lat, lng);

    const gpsBtn = document.getElementById('gps-locate-btn');
    if (gpsBtn) {
      gpsBtn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i><span>GPS Locked</span>`;
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => {
        gpsBtn.innerHTML = `<i data-lucide="crosshair" class="w-3.5 h-3.5"></i><span>Pinpoint My GPS</span>`;
        if (window.lucide) window.lucide.createIcons();
      }, 2500);
    }
  }

  // Photo upload preview
  function initPhotoUpload() {
    const fileInput = document.getElementById('incident-photo');
    const previewContainer = document.getElementById('photo-preview-box');
    const previewImg = document.getElementById('photo-preview-img');
    const dropZone = document.getElementById('photo-dropzone');

    if (!fileInput || !previewContainer || !previewImg || !dropZone) return;

    fileInput.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          previewImg.src = e.target.result;
          previewContainer.classList.remove('hidden');
          dropZone.classList.add('hidden');
        };
        reader.readAsDataURL(file);
      }
    });

    const removeBtn = document.getElementById('remove-photo-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        fileInput.value = '';
        previewImg.src = '';
        previewContainer.classList.add('hidden');
        dropZone.classList.remove('hidden');
      });
    }
  }

  // Form submission & Authority Dispatch Pipeline
  function initFormHandlers() {
    const form = document.getElementById('incident-report-form');
    if (!form) return;

    const gpsBtn = document.getElementById('gps-locate-btn');
    if (gpsBtn) {
      gpsBtn.addEventListener('click', useCurrentGPS);
    }

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      submitIncident();
    });
  }

  function submitIncident() {
    const typeSelect = document.getElementById('incident-type');
    const corridorSelect = document.getElementById('incident-corridor');
    const severitySelect = document.getElementById('incident-severity');
    const lanesInput = document.getElementById('incident-lanes');
    const descInput = document.getElementById('incident-desc');
    const reporterInput = document.getElementById('incident-reporter');
    const anonCheck = document.getElementById('incident-anonymous');

    if (!typeSelect || !corridorSelect || !severitySelect) return;

    const type = typeSelect.value;
    const typeName = typeSelect.options[typeSelect.selectedIndex].text;
    const corridor = corridorSelect.value;
    const corridorName = corridorSelect.options[corridorSelect.selectedIndex].text;
    const severity = severitySelect.value;
    const severityLabel = severitySelect.options[severitySelect.selectedIndex].text;
    const lanesBlocked = lanesInput ? (lanesInput.value.trim() || 'Unspecified lanes') : 'Lane blockage';
    const description = descInput ? descInput.value.trim() : '';
    const isAnonymous = anonCheck ? anonCheck.checked : false;
    const reporter = isAnonymous ? 'Anonymous Citizen' : (reporterInput && reporterInput.value.trim() ? reporterInput.value.trim() : 'Concerned Commuter');

    // Generate unique ID
    const incId = 'HYD-INC-' + Math.floor(1000 + Math.random() * 9000);

    // Audio confirmation
    if (window.CityFlow && window.CityFlow.playBeep) {
      window.CityFlow.playBeep(980, 'triangle', 0.12);
      setTimeout(() => window.CityFlow.playBeep(1320, 'sine', 0.18), 120);
    }

    const newIncident = {
      id: incId,
      type: type,
      typeName: typeName,
      corridor: corridor,
      corridorName: corridorName,
      coords: selectedCoords,
      severity: severity,
      severityLabel: severityLabel,
      lanesBlocked: lanesBlocked,
      description: description,
      reporter: reporter,
      timestamp: new Date().toISOString(),
      status: 'dispatched',
      statusText: 'Dispatched to Cyberabad Traffic Control',
      upvotes: 1,
      authority: 'Cyberabad Traffic Police & PCR Dispatch'
    };

    // Save to list
    const incidents = getStoredIncidents();
    incidents.unshift(newIncident);
    saveIncidents(incidents);

    // Show Live Dispatch Timeline Tracker
    showDispatchTracker(newIncident);

    // Reset Form fields
    document.getElementById('incident-desc').value = '';
    const previewContainer = document.getElementById('photo-preview-box');
    const dropZone = document.getElementById('photo-dropzone');
    if (previewContainer && dropZone) {
      previewContainer.classList.add('hidden');
      dropZone.classList.remove('hidden');
    }

    // Refresh feed
    renderIncidentFeed();
  }

  // Animated Dispatch Pipeline Status Modal/Card
  function showDispatchTracker(incident) {
    const modal = document.getElementById('dispatch-status-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Populate incident card info
    document.getElementById('tracker-inc-id').textContent = incident.id;
    document.getElementById('tracker-inc-type').textContent = incident.typeName;
    document.getElementById('tracker-inc-location').textContent = incident.corridorName;
    document.getElementById('tracker-inc-severity').textContent = incident.severityLabel;

    // Reset timeline stages
    const step1 = document.getElementById('dispatch-step-1');
    const step2 = document.getElementById('dispatch-step-2');
    const step3 = document.getElementById('dispatch-step-3');
    const step4 = document.getElementById('dispatch-step-4');

    [step1, step2, step3, step4].forEach(s => {
      if (s) {
        s.classList.remove('border-emerald-500', 'bg-emerald-500/10', 'text-emerald-400', 'border-cyan-500', 'bg-cyan-500/10', 'border-amber-500', 'bg-amber-500/10');
        s.classList.add('opacity-40');
      }
    });

    // Step 1: Immediate receipt
    setTimeout(() => {
      if (step1) {
        step1.classList.remove('opacity-40');
        step1.classList.add('border-emerald-500', 'bg-emerald-500/10');
        if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(700, 'sine', 0.05);
      }
    }, 400);

    // Step 2: NeurAX AI triage
    setTimeout(() => {
      if (step2) {
        step2.classList.remove('opacity-40');
        step2.classList.add('border-cyan-500', 'bg-cyan-500/10');
        if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(850, 'sine', 0.05);
      }
    }, 1200);

    // Step 3: Authority dispatch
    setTimeout(() => {
      if (step3) {
        step3.classList.remove('opacity-40');
        step3.classList.add('border-amber-500', 'bg-amber-500/10');
        if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(1050, 'triangle', 0.08);
      }
    }, 2100);

    // Step 4: Commuter map advisory broadcast
    setTimeout(() => {
      if (step4) {
        step4.classList.remove('opacity-40');
        step4.classList.add('border-emerald-500', 'bg-emerald-500/10');
        if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(1200, 'sine', 0.1);
      }
    }, 3000);
  }

  function closeDispatchTracker() {
    const modal = document.getElementById('dispatch-status-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  // Render Live Citizen Reports Feed
  function renderIncidentFeed() {
    const feedContainer = document.getElementById('incident-feed-list');
    if (!feedContainer) return;

    const incidents = getStoredIncidents();

    if (incidents.length === 0) {
      feedContainer.innerHTML = `
        <div class="p-8 text-center text-slate-400 text-xs">
          No incidents currently reported on the network.
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = incidents.map(inc => {
      const timeStr = formatTimeAgo(inc.timestamp);
      const isCritical = inc.severity === 'critical';
      const badgeColor = isCritical 
        ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
        : (inc.severity === 'moderate' ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30');

      return `
        <div class="liquid-glass-subtle p-4 rounded-2xl flex flex-col gap-3 border border-slate-200/50 dark:border-white/10 hover:border-cyan-500/30 transition-all">
          <div class="flex items-start justify-between gap-3">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-mono font-bold text-cyan-400">${inc.id}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}">${inc.typeName}</span>
                <span class="text-[10px] text-slate-400">• ${timeStr}</span>
              </div>
              <h4 class="text-sm font-bold text-slate-900 dark:text-white font-heading mt-1">${inc.corridorName}</h4>
              <p class="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">${inc.description || 'Reported blockage obstructing flow.'}</p>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/5 text-xs">
            <div class="flex items-center gap-2 text-slate-400 text-[11px]">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span class="text-emerald-500 font-medium">${inc.statusText}</span>
            </div>

            <button onclick="CityFlowReport.corroborateIncident('${inc.id}')" class="px-2.5 py-1 rounded-lg liquid-glass text-slate-600 dark:text-slate-300 hover:text-cyan-400 text-[11px] font-bold flex items-center gap-1.5 transition-colors" title="Corroborate report">
              <span>👍 Confirm Blockage</span>
              <span class="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-mono text-[10px]">${inc.upvotes || 1}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function corroborateIncident(id) {
    if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(900, 'sine', 0.05);
    const incidents = getStoredIncidents();
    const target = incidents.find(i => i.id === id);
    if (target) {
      target.upvotes = (target.upvotes || 1) + 1;
      saveIncidents(incidents);
      renderIncidentFeed();
    }
  }

  function formatTimeAgo(isoString) {
    if (!isoString) return 'Just now';
    const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  window.addEventListener('DOMContentLoaded', init);

  return {
    getIncidents: getStoredIncidents,
    submitIncident,
    useCurrentGPS,
    corroborateIncident,
    closeDispatchTracker
  };
})();
