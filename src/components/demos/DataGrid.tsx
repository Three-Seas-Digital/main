import { useRef, useEffect } from 'react';

export default function DataGrid() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    const SPACING = isMobile ? 60 : 50;
    const DOT_COUNT = isMobile ? 5 : 8;
    const MOUSE_RADIUS = 120;

    const mouse = { x: -1000, y: -1000, active: false };

    const dots = Array.from({ length: DOT_COUNT }, () => spawnDot(canvas));

    function spawnDot(c) {
      const horizontal = Math.random() > 0.5;
      const w = c.width || 400, h = c.height || 400;
      return {
        horizontal,
        track: Math.floor(Math.random() * (horizontal ? Math.floor(h / SPACING) : Math.floor(w / SPACING))) * SPACING,
        pos: Math.random() * (horizontal ? w : h),
        speed: 0.4 + Math.random() * 0.6,
        dir: Math.random() > 0.5 ? 1 : -1,
      };
    }

    function resize() {
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();

    // Mouse tracking
    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    }
    function onMouseLeave() {
      mouse.active = false;
    }

    canvas.style.pointerEvents = 'auto';
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    let raf;
    function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // grid lines — brighten near mouse
      for (let x = SPACING; x < w; x += SPACING) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        if (mouse.active) {
          const dist = Math.abs(x - mouse.x);
          const alpha = dist < MOUSE_RADIUS ? 0.15 + 0.25 * (1 - dist / MOUSE_RADIUS) : 0.15;
          ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
        } else {
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
        }
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      for (let y = SPACING; y < h; y += SPACING) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        if (mouse.active) {
          const dist = Math.abs(y - mouse.y);
          const alpha = dist < MOUSE_RADIUS ? 0.15 + 0.25 * (1 - dist / MOUSE_RADIUS) : 0.15;
          ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
        } else {
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
        }
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Mouse glow at intersections
      if (mouse.active) {
        // soft radial glow centered on cursor
        const mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, MOUSE_RADIUS);
        mg.addColorStop(0, 'rgba(59, 130, 246, 0.12)');
        mg.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = mg;
        ctx.fillRect(mouse.x - MOUSE_RADIUS, mouse.y - MOUSE_RADIUS, MOUSE_RADIUS * 2, MOUSE_RADIUS * 2);

        // highlight grid intersections near mouse (bounded to radius)
        const startGx = Math.max(SPACING, Math.ceil((mouse.x - MOUSE_RADIUS) / SPACING) * SPACING);
        const endGx = Math.min(w, Math.floor((mouse.x + MOUSE_RADIUS) / SPACING) * SPACING);
        const startGy = Math.max(SPACING, Math.ceil((mouse.y - MOUSE_RADIUS) / SPACING) * SPACING);
        const endGy = Math.min(h, Math.floor((mouse.y + MOUSE_RADIUS) / SPACING) * SPACING);
        for (let gx = startGx; gx <= endGx; gx += SPACING) {
          for (let gy = startGy; gy <= endGy; gy += SPACING) {
            const dx = gx - mouse.x, dy = gy - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_RADIUS) {
              const intensity = 1 - dist / MOUSE_RADIUS;
              ctx.beginPath();
              ctx.arc(gx, gy, 2 + intensity * 3, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(59, 130, 246, ${0.15 + intensity * 0.5})`;
              ctx.fill();
            }
          }
        }
      }

      // traveling dots
      for (const d of dots) {
        d.pos += d.speed * d.dir;
        const limit = d.horizontal ? w : h;
        if (d.pos > limit + 10 || d.pos < -10) {
          d.dir *= -1;
          d.pos = Math.max(-10, Math.min(limit + 10, d.pos));
        }

        const x = d.horizontal ? d.pos : d.track;
        const y = d.horizontal ? d.track : d.pos;

        // boost dots near mouse
        let dotScale = 1;
        if (mouse.active) {
          const dx = x - mouse.x, dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS) dotScale = 1 + 1.5 * (1 - dist / MOUSE_RADIUS);
        }

        // glow
        const r = 16 * dotScale;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(59, 130, 246, ${0.4 * dotScale})`);
        grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);

        // core dot
        ctx.beginPath();
        ctx.arc(x, y, 3 * dotScale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${0.6 * Math.min(dotScale, 1.5)})`;
        ctx.fill();
      }

      if (!reducedMotion) raf = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="demo-canvas-bg demo-canvas-interactive" />;
}
