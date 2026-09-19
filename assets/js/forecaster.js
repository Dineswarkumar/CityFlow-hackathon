/**
 * CityFlow AI — NeurAX Multi-Horizon AI Forecaster Controller
 * Canvas multi-horizon predictive curves, LightGBM latency telemetry, and attribution graphs.
 */

window.CityFlowForecaster = (function() {
  let activeHorizon = '15m';

  const HORIZON_DATA = {
    '15m': { mae: 0.14, r2: 0.998, baselineMae: 3.82, timeAhead: '15 Minutes Ahead', dataPoints: [22, 25, 31, 48, 59, 64, 62, 58, 51, 44, 38, 32] },
    '30m': { mae: 0.28, r2: 0.994, baselineMae: 4.65, timeAhead: '30 Minutes Ahead', dataPoints: [23, 27, 35, 52, 63, 68, 65, 60, 53, 46, 39, 34] },
    '45m': { mae: 0.46, r2: 0.989, baselineMae: 5.41, timeAhead: '45 Minutes Ahead', dataPoints: [25, 29, 38, 55, 67, 72, 69, 63, 56, 48, 41, 35] },
    '60m': { mae: 0.69, r2: 0.982, baselineMae: 6.12, timeAhead: '60 Minutes Ahead', dataPoints: [26, 31, 42, 58, 70, 75, 71, 65, 58, 50, 43, 37] }
  };

  function init() {
    const tabs = document.querySelectorAll('.horizon-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const horizon = e.currentTarget.getAttribute('data-horizon');
        setHorizon(horizon);
      });
    });

    renderChart('15m');
    window.addEventListener('resize', () => renderChart(activeHorizon));
  }

  function setHorizon(horizon) {
    if (window.CityFlow && window.CityFlow.playBeep) window.CityFlow.playBeep(980, 'sine', 0.05);
    activeHorizon = horizon;

    const tabs = document.querySelectorAll('.horizon-tab');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-horizon') === horizon) {
        tab.classList.add('bg-cyan-500', 'text-white', 'shadow-md');
        tab.classList.remove('text-slate-500', 'hover:text-slate-900', 'dark:text-slate-400');
      } else {
        tab.classList.remove('bg-cyan-500', 'text-white', 'shadow-md');
        tab.classList.add('text-slate-500', 'hover:text-slate-900', 'dark:text-slate-400');
      }
    });

    const info = HORIZON_DATA[horizon];
    const maeDisp = document.getElementById('stat-mae');
    const r2Disp = document.getElementById('stat-r2');
    const baselineDisp = document.getElementById('stat-baseline');
    const titleDisp = document.getElementById('forecast-curve-title');

    if (maeDisp) maeDisp.textContent = `${info.mae} km/h`;
    if (r2Disp) r2Disp.textContent = info.r2;
    if (baselineDisp) baselineDisp.textContent = `${info.baselineMae} km/h`;
    if (titleDisp) titleDisp.textContent = `Predicted Traffic Speed Profile (${info.timeAhead})`;

    renderChart(horizon);
  }

  function renderChart(horizon) {
    const canvas = document.getElementById('forecastCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 320;

    const isDark = document.documentElement.classList.contains('dark');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = HORIZON_DATA[horizon].dataPoints;
    const padding = { top: 40, right: 30, bottom: 40, left: 45 };
    const w = canvas.width - padding.left - padding.right;
    const h = canvas.height - padding.top - padding.bottom;

    // Draw Gridlines
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + w, y);
      ctx.stroke();

      ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(100, 116, 139, 0.6)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${80 - i * 20}k`, padding.left - 8, y + 3);
    }

    // Baseline historical curve (dashed amber)
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    data.forEach((val, i) => {
      const baselineVal = val * 0.85 + 4;
      const x = padding.left + (w / (data.length - 1)) * i;
      const y = padding.top + h - (baselineVal / 80) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();

    // NeurAX LightGBM Gradient Fill
    const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + h);
    if (isDark) {
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
    } else {
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
    }

    ctx.beginPath();
    data.forEach((val, i) => {
      const x = padding.left + (w / (data.length - 1)) * i;
      const y = padding.top + h - (val / 80) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(padding.left + w, padding.top + h);
    ctx.lineTo(padding.left, padding.top + h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // NeurAX LightGBM Predicted Curve (solid cyan glow)
    ctx.save();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = isDark ? 12 : 6;
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = padding.left + (w / (data.length - 1)) * i;
      const y = padding.top + h - (val / 80) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();

    // Plot Data Dots
    data.forEach((val, i) => {
      const x = padding.left + (w / (data.length - 1)) * i;
      const y = padding.top + h - (val / 80) * h;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      ctx.strokeStyle = isDark ? '#0f172a' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  window.addEventListener('DOMContentLoaded', init);

  return {
    setHorizon,
    renderChart
  };
})();
