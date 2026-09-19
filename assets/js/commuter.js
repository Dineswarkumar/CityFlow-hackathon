/**
 * CityFlow AI — Commuter Portal Controller
 * Origin-Destination routing, detour recommendations, and dynamic delay calculator.
 */

window.CityFlowCommuter = (function() {
  function init() {
    // Initialize map
    if (window.CityFlowMap) {
      window.CityFlowMap.init('map-commuter');
    }

    const routeBtn = document.getElementById('calc-route-btn');
    if (routeBtn) {
      routeBtn.addEventListener('click', calculateRoute);
    }
  }

  function calculateRoute() {
    if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(900, 'sine', 0.06);

    const resultBox = document.getElementById('route-result-box');
    if (resultBox) {
      resultBox.classList.remove('hidden');
      resultBox.classList.add('animate-fadeIn');
    }
  }

  window.addEventListener('DOMContentLoaded', init);

  return {
    calculateRoute
  };
})();
