import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const C = '#10b981';
const BG = '#051a12';

function DNAHelix({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const mat1 = new THREE.MeshStandardMaterial({ color: C, emissive: C, emissiveIntensity: 0.4 });
    const mat2 = new THREE.MeshStandardMaterial({ color: '#06b6d4', emissive: '#06b6d4', emissiveIntensity: 0.4 });
    const sphereGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const lineGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 6);
    const group = new THREE.Group();
    const pairs = 30;
    for (let i = 0; i < pairs; i++) {
      const t = (i / pairs) * Math.PI * 4;
      const y = (i - pairs / 2) * 0.35;
      const s1 = new THREE.Mesh(sphereGeo, mat1);
      s1.position.set(Math.cos(t) * 1.5, y, Math.sin(t) * 1.5);
      const s2 = new THREE.Mesh(sphereGeo, mat2);
      s2.position.set(Math.cos(t + Math.PI) * 1.5, y, Math.sin(t + Math.PI) * 1.5);
      group.add(s1, s2);
      if (i % 3 === 0) {
        const conn = new THREE.Mesh(lineGeo, new THREE.MeshStandardMaterial({ color: '#ffffff', opacity: 0.15, transparent: true }));
        conn.position.set(0, y, 0);
        const dx = s2.position.x - s1.position.x, dz = s2.position.z - s1.position.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        conn.scale.y = len;
        conn.rotation.z = Math.atan2(dz, dx) - Math.PI / 2;
        conn.lookAt(s2.position);
        conn.position.copy(s1.position).lerp(s2.position, 0.5);
        group.add(conn);
      }
    }
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 0.6);
    dl.position.set(3, 5, 3);
    scene.add(dl);

    let frame;
    const animate = (t) => {
      frame = requestAnimationFrame(animate);
      group.rotation.y = t * 0.0003;
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

function HeartbeatLine() {
  return (
    <svg viewBox="0 0 400 60" style={{ width: '100%', height: 60, opacity: 0.5 }} preserveAspectRatio="none">
      <path
        d="M0 30 L60 30 L80 30 L90 10 L100 50 L110 20 L120 40 L130 30 L200 30 L220 30 L230 10 L240 50 L250 20 L260 40 L270 30 L400 30"
        fill="none" stroke={C} strokeWidth="2"
        strokeDasharray="800" strokeDashoffset="800"
        style={{ animation: 'medHeartbeat 3s linear infinite' }}
      />
    </svg>
  );
}

export default function MedicalPlus() {
  const canvasRef = useRef(null);
  const doctors = [
    { name: 'Dr. Sarah Mitchell', spec: 'Cardiology', exp: '15 years' },
    { name: 'Dr. James Park', spec: 'Neurology', exp: '12 years' },
    { name: 'Dr. Amara Osei', spec: 'Pediatrics', exp: '10 years' },
    { name: 'Dr. Elena Rodriguez', spec: 'Orthopedics', exp: '18 years' },
  ];

  return (
    <div style={{ background: BG, color: '#d1fae5', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes medHeartbeat { 0% { stroke-dashoffset:800; } 100% { stroke-dashoffset:0; } }
        @keyframes medFadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes medPulseRing { 0% { transform:scale(1); opacity:0.6; } 100% { transform:scale(2); opacity:0; } }
        .med-card { background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.12); border-radius:16px; padding:28px; animation:medFadeUp 0.6s ease-out both; transition:transform 0.3s,border-color 0.3s; }
        .med-card:hover { transform:translateY(-3px); border-color:${C}44; }
        .med-doc { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:28px; text-align:center; animation:medFadeUp 0.6s ease-out both; transition:transform 0.3s; }
        .med-doc:hover { transform:translateY(-4px); }
        .med-avatar { width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg,${C},#06b6d4); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:1.6rem; font-weight:800; color:#fff; }
      `}</style>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(12px)', background: `${BG}cc`, borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.85rem' }}>+</div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>MedicalPlus</span>
        </div>
        <div style={{ display: 'flex', gap: 28, fontSize: '0.88rem' }}>
          {['Services', 'Doctors', 'Appointments', 'Contact'].map(l => <a key={l} href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>{l}</a>)}
          <button style={{ padding: '8px 20px', background: C, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Book Now</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.6 }} />
        <DNAHelix canvasRef={canvasRef} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 650, margin: '0 auto', textAlign: 'center', padding: '0 24px' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: C, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${C}`, animation: 'medPulseRing 2s ease-out infinite' }} />
            </div>
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px', color: '#ecfdf5' }}>
            Healthcare<br />Reimagined
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6ee7b7', maxWidth: 480, margin: '0 auto 16px', lineHeight: 1.7, opacity: 0.8 }}>
            Modern medical practice management with telehealth, booking, and patient portals.
          </p>
          <HeartbeatLine />
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 24 }}>
            <button style={{ padding: '14px 32px', background: C, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Book Appointment</button>
            <button style={{ padding: '14px 32px', background: 'transparent', color: '#d1fae5', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}>Patient Portal</button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ecfdf5' }}>Our Services</h2>
          <p style={{ color: '#6ee7b7', opacity: 0.7, marginTop: 8 }}>Comprehensive care for you and your family.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
          {[
            { icon: '🫀', title: 'Cardiology', desc: 'Heart health monitoring, ECG, and preventive care programs.' },
            { icon: '🧠', title: 'Neurology', desc: 'Brain and nervous system diagnostics with cutting-edge imaging.' },
            { icon: '🦴', title: 'Orthopedics', desc: 'Joint replacement, sports medicine, and rehabilitation.' },
            { icon: '👶', title: 'Pediatrics', desc: 'Well-child visits, vaccinations, and developmental screening.' },
          ].map((s, i) => (
            <div key={i} className="med-card" style={{ animationDelay: `${i * 0.12}s` }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>{s.icon}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ecfdf5', marginBottom: 8 }}>{s.title}</h3>
              <p style={{ color: '#6ee7b7', opacity: 0.7, fontSize: '0.9rem', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Doctors */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ecfdf5' }}>Meet Our Doctors</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {doctors.map((d, i) => (
            <div key={i} className="med-doc" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="med-avatar">{d.name.split(' ').map(n => n[0]).join('')}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ecfdf5', marginBottom: 4 }}>{d.name}</h3>
              <p style={{ color: C, fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>{d.spec}</p>
              <p style={{ color: '#6ee7b7', opacity: 0.5, fontSize: '0.8rem' }}>{d.exp} experience</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '80px 24px', background: `linear-gradient(180deg, transparent, ${C}08)` }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ecfdf5', marginBottom: 12 }}>Your Health, Our Priority</h2>
        <p style={{ color: '#6ee7b7', opacity: 0.7, marginBottom: 32 }}>Schedule your consultation today.</p>
        <button style={{ padding: '16px 40px', background: C, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>Get Started</button>
      </section>

      <footer style={{ borderTop: '1px solid rgba(16,185,129,0.1)', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#475569' }}>Medical Plus &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
