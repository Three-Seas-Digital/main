import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const C = '#f59e0b';
const BG = '#0f0d08';

function WireframeSphere({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.z = 4;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const geo = new THREE.IcosahedronGeometry(1.8, 2);
    const wire = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: C, wireframe: true, transparent: true, opacity: 0.25 }));
    scene.add(wire);

    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.2, 1),
      new THREE.MeshBasicMaterial({ color: C, wireframe: true, transparent: true, opacity: 0.1 })
    );
    scene.add(inner);

    // Orbiting dots
    const dotGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: C });
    const dots = [];
    for (let i = 0; i < 8; i++) {
      const d = new THREE.Mesh(dotGeo, dotMat);
      d.userData = { angle: (i / 8) * Math.PI * 2, speed: 0.3 + Math.random() * 0.3, radius: 2 + Math.random() * 0.5, tilt: Math.random() * 0.5 };
      scene.add(d);
      dots.push(d);
    }

    let frame;
    const animate = (t) => {
      frame = requestAnimationFrame(animate);
      const s = t * 0.001;
      wire.rotation.y = s * 0.15;
      wire.rotation.x = s * 0.08;
      inner.rotation.y = -s * 0.2;
      inner.rotation.z = s * 0.1;
      dots.forEach(d => {
        const a = d.userData.angle + s * d.userData.speed;
        d.position.set(
          Math.cos(a) * d.userData.radius,
          Math.sin(a * 0.7) * d.userData.tilt * d.userData.radius,
          Math.sin(a) * d.userData.radius
        );
      });
      renderer.render(scene, camera);
    };
    animate(0);
    const onResize = () => {
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', onResize); renderer.dispose(); };
  }, [canvasRef]);
  return null;
}

export default function TechStartup() {
  const canvasRef = useRef(null);

  return (
    <div style={{ background: BG, color: '#fef3c7', fontFamily: "'Space Grotesk', 'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes tsGlowPulse { 0%,100% { text-shadow:0 0 20px ${C}44; } 50% { text-shadow:0 0 40px ${C}66; } }
        @keyframes tsSlideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes tsFadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .ts-card { background:rgba(245,158,11,0.04); border:1px solid rgba(245,158,11,0.1); border-radius:14px; padding:32px 24px; animation:tsFadeUp 0.6s ease-out both; transition:transform 0.3s,border-color 0.3s; }
        .ts-card:hover { transform:translateY(-3px); border-color:${C}44; }
        .ts-metric { text-align:center; }
        .ts-metric-val { font-size:2.5rem; font-weight:800; color:${C}; animation:tsGlowPulse 3s ease infinite; }
      `}</style>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(12px)', background: `${BG}dd` }}>
        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: C }}>Nexus<span style={{ color: '#fef3c7' }}>Tech</span></div>
        <div style={{ display: 'flex', gap: 28, fontSize: '0.88rem', alignItems: 'center' }}>
          {['Product', 'Team', 'Careers', 'Blog'].map(l => <a key={l} href="#" style={{ color: '#a3a3a3', textDecoration: 'none' }}>{l}</a>)}
          <button style={{ padding: '8px 20px', background: C, color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Contact</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C, marginBottom: 16, animation: 'tsSlideIn 0.6s ease-out' }}>
            We build the future
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 4.5vw, 3.8rem)', fontWeight: 800, lineHeight: 1.08, margin: '0 0 20px', color: '#fefce8' }}>
            Innovation at the<br />
            <span style={{ color: C }}>speed of thought</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#a3a3a3', maxWidth: 440, lineHeight: 1.7, marginBottom: 36 }}>
            We are a technology company building intelligent systems that transform how businesses operate.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <button style={{ padding: '14px 28px', background: C, color: '#000', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>See Our Work</button>
            <button style={{ padding: '14px 28px', background: 'transparent', color: '#fef3c7', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Learn More</button>
          </div>
        </div>
        <div style={{ position: 'relative', height: '100vh' }}>
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          <WireframeSphere canvasRef={canvasRef} />
        </div>
      </section>

      {/* Metrics */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {[
            { val: '50M+', label: 'Users Worldwide' },
            { val: '99.9%', label: 'Uptime' },
            { val: '150+', label: 'Team Members' },
            { val: '$40M', label: 'Series B' },
          ].map((m, i) => (
            <div key={i} className="ts-metric" style={{ animation: 'tsFadeUp 0.6s ease-out both', animationDelay: `${i * 0.1}s` }}>
              <div className="ts-metric-val">{m.val}</div>
              <div style={{ fontSize: '0.82rem', color: '#78716c', marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fefce8' }}>What We Build</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {[
            { icon: '🧠', title: 'AI Infrastructure', desc: 'Scalable machine learning pipelines processing billions of data points daily.' },
            { icon: '🔗', title: 'Blockchain Solutions', desc: 'Decentralized systems for secure, transparent transactions at enterprise scale.' },
            { icon: '☁️', title: 'Cloud Architecture', desc: 'Multi-cloud orchestration that automatically optimizes cost and performance.' },
          ].map((f, i) => (
            <div key={i} className="ts-card" style={{ animationDelay: `${i * 0.15}s` }}>
              <div style={{ fontSize: '2rem', marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fefce8', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#a3a3a3', fontSize: '0.92rem', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fefce8', textAlign: 'center', marginBottom: 48 }}>Our Team</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {[
            { name: 'Alex Kim', role: 'CEO & Co-founder' },
            { name: 'Jordan Lee', role: 'CTO' },
            { name: 'Maya Singh', role: 'VP Engineering' },
            { name: 'Ryan Chen', role: 'Head of AI' },
          ].map((p, i) => (
            <div key={i} className="ts-card" style={{ textAlign: 'center', animationDelay: `${i * 0.1}s` }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${C}, #d97706)`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: '1.1rem' }}>
                {p.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ fontWeight: 700, color: '#fefce8', marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontSize: '0.82rem', color: '#78716c' }}>{p.role}</div>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(245,158,11,0.1)', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#475569' }}>Tech Startup &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
