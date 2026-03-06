import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const C = '#0ea5e9';
const BG = '#0b1120';

function DataGrid({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Grid of bars
    const bars = [];
    const geo = new THREE.BoxGeometry(0.15, 1, 0.15);
    const mat = new THREE.MeshStandardMaterial({ color: C, emissive: C, emissiveIntensity: 0.3, metalness: 0.5, roughness: 0.3 });
    for (let x = -3; x <= 3; x += 0.5) {
      for (let z = -2; z <= 2; z += 0.5) {
        const mesh = new THREE.Mesh(geo, mat.clone());
        const h = Math.random() * 2 + 0.2;
        mesh.scale.y = h;
        mesh.position.set(x, h / 2, z);
        mesh.userData = { baseH: h, phase: Math.random() * Math.PI * 2 };
        scene.add(mesh);
        bars.push(mesh);
      }
    }

    // Particles
    const pGeo = new THREE.BufferGeometry();
    const pCount = 200;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 10;
      pPos[i * 3 + 1] = Math.random() * 5;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: C, size: 0.04, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(pGeo, pMat));

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8);
    dl.position.set(3, 5, 3);
    scene.add(dl);

    let frame;
    const animate = (t) => {
      frame = requestAnimationFrame(animate);
      const s = t * 0.001;
      bars.forEach(b => {
        const h = b.userData.baseH * (0.5 + 0.5 * Math.sin(s + b.userData.phase));
        b.scale.y = Math.max(0.1, h);
        b.position.y = b.scale.y / 2;
        b.material.emissiveIntensity = 0.2 + 0.3 * Math.sin(s * 2 + b.userData.phase);
      });
      camera.position.x = Math.sin(s * 0.2) * 1.5;
      camera.lookAt(0, 1, 0);
      renderer.render(scene, camera);
    };
    animate(0);

    const onResize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', onResize); renderer.dispose(); };
  }, [canvasRef]);
  return null;
}

function Counter({ end, suffix = '', duration = 2000 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        obs.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          setVal(Math.round(end * p));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

export default function NovaDashboard() {
  const canvasRef = useRef(null);

  return (
    <div style={{ background: BG, color: '#e2e8f0', fontFamily: "'Inter', 'Space Grotesk', sans-serif", minHeight: '100vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes ndSlideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ndPulse { 0%,100% { box-shadow: 0 0 0 0 ${C}33; } 50% { box-shadow: 0 0 20px 4px ${C}33; } }
        .nd-stat { background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:28px 24px; animation: ndSlideUp 0.6s ease-out both; }
        .nd-stat:nth-child(1){animation-delay:0.1s} .nd-stat:nth-child(2){animation-delay:0.2s} .nd-stat:nth-child(3){animation-delay:0.3s} .nd-stat:nth-child(4){animation-delay:0.4s}
        .nd-stat:hover { border-color: ${C}44; animation: ndPulse 2s ease infinite; }
        .nd-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:0.72rem; font-weight:600; }
        .nd-chart-bar { background: linear-gradient(180deg, ${C}, ${C}44); border-radius:4px 4px 0 0; transition: height 0.8s cubic-bezier(0.34,1.56,0.64,1); }
        .nd-sidebar-item { padding:12px 16px; border-radius:10px; display:flex; align-items:center; gap:12px; font-size:0.88rem; cursor:pointer; transition:background 0.2s; }
        .nd-sidebar-item:hover { background: rgba(255,255,255,0.06); }
        .nd-table-row { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; padding:14px 20px; border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.88rem; }
        .nd-table-row:hover { background: rgba(255,255,255,0.02); }
      `}</style>

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        <DataGrid canvasRef={canvasRef} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto', textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C, marginBottom: 16 }}>Enterprise Dashboard</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px', background: `linear-gradient(135deg, #fff 40%, ${C})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Nova Dashboard
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#94a3b8', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Real-time analytics, dark mode UI, and data visualization built for teams that move fast.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{ padding: '14px 32px', background: C, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>Get Started</button>
            <button style={{ padding: '14px 32px', background: 'transparent', color: '#fff', border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 12, fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>Live Demo</button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {[
            { label: 'Active Users', value: 12847, suffix: '', change: '+12.5%', up: true },
            { label: 'Revenue', value: 284, suffix: 'K', change: '+8.2%', up: true },
            { label: 'Conversion', value: 3.8, suffix: '%', change: '+0.4%', up: true },
            { label: 'Bounce Rate', value: 24, suffix: '%', change: '-2.1%', up: false },
          ].map((s, i) => (
            <div key={i} className="nd-stat">
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9' }}>
                {s.suffix === 'K' ? <><Counter end={s.value} />{s.suffix}</> : s.suffix === '%' ? <>{s.value}{s.suffix}</> : <Counter end={s.value} />}
              </div>
              <div className="nd-badge" style={{ background: s.up ? '#10b98122' : '#ef444422', color: s.up ? '#10b981' : '#ef4444', marginTop: 8 }}>{s.change}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mock Dashboard UI */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden', minHeight: 500 }}>
          {/* Sidebar */}
          <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: '24px 12px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, padding: '0 16px 20px', color: C }}>nova</div>
            {['Dashboard', 'Analytics', 'Users', 'Reports', 'Settings'].map((item, i) => (
              <div key={i} className="nd-sidebar-item" style={i === 0 ? { background: `${C}15`, color: C } : {}}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? C : 'rgba(255,255,255,0.15)' }} />
                {item}
              </div>
            ))}
          </div>
          {/* Content */}
          <div style={{ padding: 24 }}>
            {/* Mini bar chart */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 16 }}>Revenue Overview</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                {[65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100, 88].map((h, i) => (
                  <div key={i} className="nd-chart-bar" style={{ flex: 1, height: `${h}%` }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.7rem', color: '#475569' }}>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
              </div>
            </div>
            {/* Table */}
            <div>
              <div className="nd-table-row" style={{ color: '#64748b', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>User</span><span>Status</span><span>Role</span><span>Revenue</span>
              </div>
              {[
                { name: 'Sarah Chen', status: 'Active', role: 'Admin', rev: '$12,400' },
                { name: 'Marcus Wright', status: 'Active', role: 'Manager', rev: '$8,200' },
                { name: 'Aisha Patel', status: 'Away', role: 'Analyst', rev: '$15,800' },
                { name: 'Jake Morrison', status: 'Active', role: 'Developer', rev: '$6,900' },
              ].map((row, i) => (
                <div key={i} className="nd-table-row">
                  <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{row.name}</span>
                  <span><span className="nd-badge" style={{ background: row.status === 'Active' ? '#10b98118' : '#f59e0b18', color: row.status === 'Active' ? '#10b981' : '#f59e0b' }}>{row.status}</span></span>
                  <span style={{ color: '#94a3b8' }}>{row.role}</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{row.rev}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9' }}>Built for Modern Teams</h2>
          <p style={{ color: '#64748b', marginTop: 8 }}>Everything you need to manage data at scale.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { title: 'Real-Time Analytics', desc: 'Live data updates every second with WebSocket integration.' },
            { title: 'Dark Mode', desc: 'Purpose-built dark theme that reduces eye strain and looks sharp.' },
            { title: 'Custom Reports', desc: 'Build and export reports in PDF, CSV, or connect via API.' },
          ].map((f, i) => (
            <div key={i} className="nd-stat" style={{ animationDelay: `${0.1 + i * 0.15}s` }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C, fontSize: '1.2rem', fontWeight: 800, marginBottom: 16 }}>{i + 1}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#475569' }}>Nova Dashboard &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
