/**
 * CityFlow AI — Municipal Infrastructure Planner Controller
 * Simulates capital road widening, lane expansions, and returns ROI rankings.
 */

window.CityFlowPlanner = (function() {
  const CANDIDATES = [
    { id: 'CAND_A', name: 'Gachibowli Ring Junction (R0018-R0030)', currentLanes: 2, proposedLanes: 4, costCr: 4.8, vmtReduction: '18.4%', roi: 3.84, priority: 'CRITICAL' },
    { id: 'CAND_B', name: 'Madhapur Cyber Towers Spine (R0042-R0043)', currentLanes: 2, proposedLanes: 3, costCr: 2.2, vmtReduction: '14.1%', roi: 3.20, priority: 'HIGH' },
    { id: 'CAND_C', name: 'Kondapur Radial Bypass (R0067-R0068)', currentLanes: 3, proposedLanes: 4, costCr: 3.5, vmtReduction: '11.8%', roi: 2.75, priority: 'HIGH' },
    { id: 'CAND_D', name: 'Jubilee Hills Road 36 Feeder (R0015-R0016)', currentLanes: 2, proposedLanes: 3, costCr: 1.8, vmtReduction: '8.9%', roi: 2.10, priority: 'MEDIUM' },
    { id: 'CAND_E', name: 'Financial District Outer Loop (R0081-R0082)', currentLanes: 2, proposedLanes: 4, costCr: 5.4, vmtReduction: '9.2%', roi: 1.82, priority: 'MEDIUM' }
  ];

  function init() {
    const selectElem = document.getElementById('planner-candidate-select');
    if (selectElem) {
      selectElem.innerHTML = CANDIDATES.map(c => `<option value="${c.id}">${c.id}: ${c.name}</option>`).join('');
      selectElem.addEventListener('change', (e) => updateCandidateView(e.target.value));
      updateCandidateView(CANDIDATES[0].id);
    }
  }

  function updateCandidateView(candId) {
    if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(840, 'sine', 0.04);
    const cand = CANDIDATES.find(c => c.id === candId) || CANDIDATES[0];

    const titleElem = document.getElementById('cand-name');
    const costElem = document.getElementById('cand-cost');
    const vmtElem = document.getElementById('cand-vmt');
    const roiElem = document.getElementById('cand-roi');
    const lanesElem = document.getElementById('cand-lanes');
    const priorityElem = document.getElementById('cand-priority');

    if (titleElem) titleElem.textContent = cand.name;
    if (costElem) costElem.textContent = `₹${cand.costCr} Cr`;
    if (vmtElem) vmtElem.textContent = cand.vmtReduction;
    if (roiElem) roiElem.textContent = `${cand.roi}x`;
    if (lanesElem) lanesElem.textContent = `${cand.currentLanes} Lanes ➔ ${cand.proposedLanes} Lanes`;
    
    if (priorityElem) {
      priorityElem.textContent = cand.priority;
      priorityElem.className = cand.priority === 'CRITICAL' 
        ? 'px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30'
        : (cand.priority === 'HIGH' 
          ? 'px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30'
          : 'px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-500 border border-cyan-500/30');
    }
  }

  window.addEventListener('DOMContentLoaded', init);

  return {
    updateCandidateView
  };
})();
