/**
 * CityFlow AI — Common UI Orchestrator
 * Manages themes, responsive navigation, sidebar state, audio telemetry, and icon initialization.
 */

window.CityFlow = (function() {
  let audioMuted = false;
  let audioCtx = null;

  // 1. Synthesized Web Audio Telemetry (Zero external MP3 dependencies)
  function playBeep(freq = 880, type = 'sine', duration = 0.08) {
    if (audioMuted) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio context might be restricted before first interaction
    }
  }

  // 2. Theme Toggle (Dark / Light)
  function initTheme() {
    const savedTheme = localStorage.getItem('cityflow_theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    updateThemeIcon();
  }

  function toggleTheme() {
    playBeep(1200, 'sine', 0.05);
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cityflow_theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cityflow_theme', 'dark');
    }
    updateThemeIcon();
    if (window.CityFlowMap && typeof window.CityFlowMap.updateTiles === 'function') {
      window.CityFlowMap.updateTiles();
    }
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark: !isDark } }));
  }

  function updateThemeIcon() {
    const isDark = document.documentElement.classList.contains('dark');
    const moonIcon = document.getElementById('theme-moon');
    const sunIcon = document.getElementById('theme-sun');
    if (moonIcon && sunIcon) {
      if (isDark) {
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
      } else {
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
      }
    }
  }

  // 3. Sidebar Collapse / Expand
  function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const isCollapsed = localStorage.getItem('cityflow_sidebar') === 'true';
    if (isCollapsed) {
      sidebar.classList.add('collapsed');
    }
  }

  function toggleSidebar() {
    playBeep(950, 'sine', 0.04);
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const collapsed = sidebar.classList.toggle('collapsed');
    localStorage.setItem('cityflow_sidebar', collapsed);

    // Invalidate Leaflet map size smoothly
    setTimeout(() => {
      if (window.CityFlowMap && typeof window.CityFlowMap.invalidate === 'function') {
        window.CityFlowMap.invalidate();
      }
      window.dispatchEvent(new Event('resize'));
    }, 320);
  }

  // 4. Highlight Active Navigation Item
  function highlightActiveNav() {
    const path = window.location.pathname.toLowerCase();
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    navItems.forEach(item => {
      const href = (item.getAttribute('href') || '').toLowerCase();
      if (!href) return;
      
      const isMatch = (href === 'index.html' && (path.endsWith('/') || path.endsWith('/index.html') || path === '')) ||
                      (href !== 'index.html' && path.endsWith(href));

      if (isMatch) {
        item.classList.add('bg-cyan-500/15', 'text-cyan-500', 'dark:text-cyan-400', 'font-semibold', 'border-cyan-500/30');
        item.classList.remove('text-slate-600', 'dark:text-slate-400', 'border-transparent');
      } else {
        item.classList.remove('bg-cyan-500/15', 'text-cyan-500', 'dark:text-cyan-400', 'font-semibold', 'border-cyan-500/30');
        item.classList.add('text-slate-600', 'dark:text-slate-400', 'border-transparent');
      }
    });
  }

  // 5. Global Initialization on DOM Ready
  window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    highlightActiveNav();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  return {
    playBeep,
    toggleTheme,
    toggleSidebar
  };
})();
