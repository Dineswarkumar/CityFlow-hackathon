/**
 * CityFlow AI — Tactical Police Command Controller
 * Adaptive signal green-split optimizer and emergency unit dispatch.
 */

window.CityFlowPolice = (function() {
  function init() {
    const sliderA = document.getElementById('signal-phase-a');
    const sliderB = document.getElementById('signal-phase-b');
    const applyBtn = document.getElementById('apply-signal-btn');
    const dispatchBtn = document.getElementById('dispatch-unit-btn');

    if (sliderA) sliderA.addEventListener('input', updateSignalMetrics);
    if (sliderB) sliderB.addEventListener('input', updateSignalMetrics);
    if (applyBtn) applyBtn.addEventListener('click', applySignalPlan);
    if (dispatchBtn) dispatchBtn.addEventListener('click', dispatchPatrol);

    updateSignalMetrics();
  }

  function updateSignalMetrics() {
    const sliderA = document.getElementById('signal-phase-a');
    const sliderB = document.getElementById('signal-phase-b');
    const valA = sliderA ? parseInt(sliderA.value) : 65;
    const valB = sliderB ? parseInt(sliderB.value) : 25;

    const valADisp = document.getElementById('val-phase-a');
    const valBDisp = document.getElementById('val-phase-b');
    const cycleDisp = document.getElementById('val-cycle-time');
    const queueDisp = document.getElementById('val-queue-time');
    const reliefDisp = document.getElementById('val-relief-pct');

    if (valADisp) valADisp.textContent = `${valA}s`;
    if (valBDisp) valBDisp.textContent = `${valB}s`;

    const amber = 6;
    const totalCycle = valA + valB + amber;
    if (cycleDisp) cycleDisp.textContent = `${totalCycle}s`;

    // Queue dissipation model based on green split allocation
    const reliefPct = Math.min(38, Math.round(((valA - 40) / 40) * 22 + 14));
    const queueMinutes = Math.max(3.2, (18.5 * (1 - reliefPct / 100)).toFixed(1));

    if (queueDisp) queueDisp.textContent = `${queueMinutes} min`;
    if (reliefDisp) reliefDisp.textContent = `+${reliefPct}% Flow`;
  }

  function applySignalPlan() {
    if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(1040, 'triangle', 0.08);
    const toast = document.getElementById('police-toast');
    if (toast) {
      toast.textContent = "✅ Adaptive timing broadcast to Signal Controller SIG-HYD-042!";
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 4000);
    }
  }

  function dispatchPatrol() {
    if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(650, 'sawtooth', 0.12);
    const logList = document.getElementById('dispatch-log-list');
    if (logList) {
      const timeStr = new Date().toLocaleTimeString();
      const li = document.createElement('li');
      li.className = 'text-xs p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-slate-800 dark:text-cyan-200 flex items-center justify-between';
      li.innerHTML = `
        <span>🚓 <strong>PCR Unit 07</strong> dispatched to Corridor R0067</span>
        <span class="font-mono text-[10px] text-slate-400">${timeStr}</span>
      `;
      logList.prepend(li);
    }
  }

  window.addEventListener('DOMContentLoaded', init);

  return {
    updateSignalMetrics,
    applySignalPlan,
    dispatchPatrol
  };
})();
