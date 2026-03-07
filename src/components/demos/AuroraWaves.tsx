import { useRef, useEffect } from 'react';

const BANDS = [
  { color: '220,190,160', yOffset: 0.25, amplitude: 50, freq: 0.003, speed: 0.008, opacity: 0.35 },
  { color: '180,160,220', yOffset: 0.42, amplitude: 45, freq: 0.004, speed: -0.006, opacity: 0.30 },
  { color: '230,210,180', yOffset: 0.58, amplitude: 55, freq: 0.0025, speed: 0.005, opacity: 0.25 },
  { color: '200,170,190', yOffset: 0.74, amplitude: 40, freq: 0.0035, speed: -0.007, opacity: 0.20 },
];

export default function AuroraWaves() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let gradients = [];

    function buildGradients(h) {
      gradients = BANDS.map(b => {
        const baseY = h * b.yOffset;
        const g = ctx.createLinearGradient(0, baseY - b.amplitude, 0, baseY + b.amplitude + 60);
        g.addColorStop(0, `rgba(${b.color}, 0)`);
        g.addColorStop(0.5, `rgba(${b.color}, ${b.opacity})`);
        g.addColorStop(1, `rgba(${b.color}, 0)`);
        return g;
      });
    }

    function resize() {
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      buildGradients(rect.height);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();

    let t = 0;
    let raf;
    function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < BANDS.length; i++) {
        const b = BANDS[i];
        const baseY = h * b.yOffset;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 4) {
          ctx.lineTo(x, baseY + Math.sin(x * b.freq + t * b.speed) * b.amplitude);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = gradients[i];
        ctx.fill();
      }

      t++;
      if (!reducedMotion) raf = requestAnimationFrame(draw);
    }

    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} className="demo-canvas-bg" />;
}
