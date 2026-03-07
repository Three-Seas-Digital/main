import { useRef, useEffect } from 'react';

export default function SteamParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    const COUNT = isMobile ? 18 : 30;

    const particles = Array.from({ length: COUNT }, () => spawn(canvas));

    function spawn(c) {
      return {
        x: Math.random() * (c.width || 400),
        y: (c.height || 400) + Math.random() * 60,
        r: 6 + Math.random() * 14,
        speed: 0.3 + Math.random() * 0.5,
        drift: Math.random() * Math.PI * 2,
        driftSpeed: 0.003 + Math.random() * 0.004,
        opacity: 0.25 + Math.random() * 0.2,
        color: Math.random() > 0.5 ? '210, 180, 140' : '218, 185, 110',
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

    let raf;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y -= p.speed;
        p.drift += p.driftSpeed;
        p.x += Math.sin(p.drift) * 0.4;
        if (p.y < -20) Object.assign(p, spawn(canvas));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fill();
      }
      if (!reducedMotion) raf = requestAnimationFrame(draw);
    }

    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} className="demo-canvas-bg" />;
}
