/**
 * CityFlow AI — Aerial Drone Canvas Engine
 * Simulates high-resolution tactical surveillance quadcopters patrolling the corridor network.
 */

(function() {
  function initDroneAnimation() {
    const canvas = document.getElementById('droneCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const drones = [
      {
        id: 'CY-DRONE-01',
        name: 'HYD-Alpha Recon',
        x: canvas.width * 0.2,
        y: canvas.height * 0.3,
        targetX: canvas.width * 0.65,
        targetY: canvas.height * 0.65,
        speed: 1.15,
        angle: 0.4,
        propRotation: 0,
        altitude: '124m',
        battery: 88,
        searchlightBeam: 160
      },
      {
        id: 'CY-DRONE-02',
        name: 'HITEC-Sector Patrol',
        x: canvas.width * 0.8,
        y: canvas.height * 0.25,
        targetX: canvas.width * 0.3,
        targetY: canvas.height * 0.75,
        speed: 0.95,
        angle: -1.2,
        propRotation: 0,
        altitude: '150m',
        battery: 94,
        searchlightBeam: 140
      }
    ];

    function pickNewTarget(d) {
      d.targetX = 100 + Math.random() * (canvas.width - 200);
      d.targetY = 100 + Math.random() * (canvas.height - 200);
    }

    function drawRealisticDrone(d, isDark) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);

      // Searchlight Beam
      const beamLen = d.searchlightBeam;
      const beamWidth = 85;
      const grad = ctx.createRadialGradient(0, -beamLen * 0.6, 10, 0, -beamLen * 0.6, beamLen * 0.85);
      if (isDark) {
        grad.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
        grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.10)');
        grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      } else {
        grad.addColorStop(0, 'rgba(8, 145, 178, 0.18)');
        grad.addColorStop(0.5, 'rgba(8, 145, 178, 0.06)');
        grad.addColorStop(1, 'rgba(8, 145, 178, 0)');
      }
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-beamWidth, -beamLen);
      ctx.lineTo(beamWidth, -beamLen);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Drone Shadow
      ctx.save();
      ctx.translate(14, 18);
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.15)';
      ctx.fill();
      ctx.restore();

      // Carbon Fiber Quad Arms (X-Frame)
      ctx.strokeStyle = isDark ? '#334155' : '#64748b';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      const arm = 22;
      ctx.beginPath();
      ctx.moveTo(-arm, -arm); ctx.lineTo(arm, arm);
      ctx.moveTo(arm, -arm); ctx.lineTo(-arm, arm);
      ctx.stroke();

      // Center Fuselage Chassis
      ctx.fillStyle = isDark ? '#0f172a' : '#1e293b';
      ctx.strokeStyle = isDark ? '#06b6d4' : '#0891b2';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sensor Pod / Gimbal Glass
      ctx.beginPath();
      ctx.arc(0, -11, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#22d3ee' : '#0284c7';
      ctx.fill();

      // Rotor Motors & Spinning Blades
      const motorPositions = [
        { x: -arm, y: -arm, dir: 1 },
        { x: arm, y: -arm, dir: -1 },
        { x: -arm, y: arm, dir: -1 },
        { x: arm, y: arm, dir: 1 }
      ];

      motorPositions.forEach(m => {
        // Motor bell
        ctx.beginPath();
        ctx.arc(m.x, m.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#475569' : '#94a3b8';
        ctx.fill();

        // Rotor blur disk
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(d.propRotation * m.dir);
        ctx.beginPath();
        ctx.ellipse(0, 0, 13, 13, 0, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(34, 211, 238, 0.20)' : 'rgba(8, 145, 178, 0.20)';
        ctx.fill();

        // Rotor blades
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(15, 23, 42, 0.75)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-12, 0); ctx.lineTo(12, 0);
        ctx.stroke();
        ctx.restore();
      });

      // Navigation LEDs
      ctx.beginPath();
      ctx.arc(-arm - 1, arm + 1, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444'; // Red (Port)
      ctx.fill();

      ctx.beginPath();
      ctx.arc(arm + 1, arm + 1, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981'; // Green (Starboard)
      ctx.fill();

      // Tactical Telemetry HUD
      ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.85)' : 'rgba(51, 65, 85, 0.95)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${d.id} • ${d.altitude}`, 18, -14);
      ctx.fillText(`PWR ${d.battery}% • PATROL`, 18, -4);

      ctx.restore();
    }

    function animate() {
      const isDark = document.documentElement.classList.contains('dark');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drones.forEach(d => {
        d.propRotation += 0.45;

        // Waypoint navigation
        const dx = d.targetX - d.x;
        const dy = d.targetY - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 40) {
          pickNewTarget(d);
        }

        const targetAngle = Math.atan2(dy, dx) - Math.PI / 2;
        let diff = targetAngle - d.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        d.angle += diff * 0.035;

        const moveAngle = d.angle + Math.PI / 2;
        d.x += Math.cos(moveAngle) * d.speed;
        d.y += Math.sin(moveAngle) * d.speed;

        drawRealisticDrone(d, isDark);
      });

      requestAnimationFrame(animate);
    }

    animate();
  }

  window.addEventListener('DOMContentLoaded', initDroneAnimation);
})();
