import { useRef, useEffect } from 'react';

const COLS = 8;
const ROWS = 6;
const DOT_SPACING = 22;
const DOT_R = 4;
const MOUSE_RADIUS = 80;

export default function ThroughputMap() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLight = document.documentElement.classList.contains('light-theme');

    const w = COLS * DOT_SPACING;
    const h = ROWS * DOT_SPACING;
    canvas.width = w;
    canvas.height = h;

    const mouse = { x: -1000, y: -1000, active: false };

    // Build dot grid with staggered pulse phase
    const dots = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        dots.push({
          x: c * DOT_SPACING + DOT_SPACING / 2,
          y: r * DOT_SPACING + DOT_SPACING / 2,
          phase: (c * 0.15 + r * 0.2) * Math.PI * 2,
          brightness: 0, // 0 = idle, 1 = fully lit
        });
      }
    }

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    }
    function onMouseLeave() {
      mouse.active = false;
    }

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    let t = 0;
    let raf;

    function draw() {
      ctx.clearRect(0, 0, w, h);
      t += 0.02;

      for (const d of dots) {
        // Ambient pulse
        const pulse = 0.5 + 0.5 * Math.sin(t * 2 + d.phase);
        const ambientAlpha = isLight ? 0.12 + pulse * 0.15 : 0.04 + pulse * 0.12;

        // Mouse proximity boost
        let mouseBoost = 0;
        if (mouse.active) {
          const dx = d.x - mouse.x, dy = d.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS) {
            mouseBoost = 1 - dist / MOUSE_RADIUS;
          }
        }

        // Smooth brightness toward target
        const target = mouseBoost;
        d.brightness += (target - d.brightness) * 0.15;

        const intensity = d.brightness;
        const radius = DOT_R + intensity * 3;

        // Glow ring
        if (intensity > 0.05) {
          const glowR = radius + 6 * intensity;
          const glow = ctx.createRadialGradient(d.x, d.y, radius * 0.5, d.x, d.y, glowR);
          if (isLight) {
            glow.addColorStop(0, `rgba(154, 122, 30, ${0.4 * intensity})`);
            glow.addColorStop(1, 'rgba(154, 122, 30, 0)');
          } else {
            glow.addColorStop(0, `rgba(200, 164, 62, ${0.4 * intensity})`);
            glow.addColorStop(1, 'rgba(200, 164, 62, 0)');
          }
          ctx.fillStyle = glow;
          ctx.fillRect(d.x - glowR, d.y - glowR, glowR * 2, glowR * 2);
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);

        if (isLight) {
          const a = 0.15 + intensity * 0.65 + ambientAlpha * 0.3;
          ctx.fillStyle = intensity > 0.1
            ? `rgba(154, 122, 30, ${a})`
            : `rgba(0, 0, 0, ${ambientAlpha + intensity * 0.3})`;
        } else {
          const a = ambientAlpha + intensity * 0.55;
          ctx.fillStyle = intensity > 0.1
            ? `rgba(200, 164, 62, ${a})`
            : `rgba(255, 255, 255, ${a})`;
        }

        ctx.fill();
      }

      if (!reducedMotion) raf = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="throughput-canvas"
      style={{
        width: COLS * DOT_SPACING,
        height: ROWS * DOT_SPACING,
        cursor: 'crosshair',
      }}
    />
  );
}
