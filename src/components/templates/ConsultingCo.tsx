import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const C = '#3b82f6';
const BG = '#060a14';

function Globe({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.z = 4;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Wireframe globe
    const globeGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const globeMat = new THREE.MeshBasicMaterial({ color: C, wireframe: true, transparent: true, opacity: 0.12 });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Connection points
    const pointGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const pointMat = new THREE.MeshBasicMaterial({ color: C });
    const cities = [
      [0.7, 0.8, 1.0], [-0.5, 1.1, 0.7], [1.2, -0.3, 0.6], [-0.8, -0.5, 1.1],
      [0.3, 1.2, -0.6], [-1.0, 0.4, -0.8], [0.6, -1.0, -0.7], [-0.3, -1.2, 0.4],
    ];
    const points = cities.map(([x, y, z]) => {
      const p = new THREE.Mesh(pointGeo, pointMat.clone());
      p.position.set(x, y, z).normalize().multiplyScalar(1.52);
      globe.add(p);
      return p;
    });

    // Connection arcs
    const lineMat = new THREE.LineBasicMaterial({ color: C, transparent: true, opacity: 0.2 });
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        if (Math.random() > 0.4) continue;
        const curve = new THREE.QuadraticBezierCurve3(
          points[i].position.clone(),
          points[i].position.clone().add(points[j].position).multiplyScalar(0.6),
          points[j].position.clone()
        );
        const curveGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(20));
        globe.add(new THREE.Line(curveGeo, lineMat));
      }
    }

    let frame;
    const animate = (t) => {
      frame = requestAnimationFrame(animate);
      globe.rotation.y = t * 0.0002;
      points.forEach((p, i) => {
        p.material.opacity = 0.5 + 0.5 * Math.sin(t * 0.003 + i);
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

export default function ConsultingCo() {
  const canvasRef = useRef(null);

  return (
    <div style={{ background: BG, color: '#bfdbfe', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes ccFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ccSlideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
        .cc-card { background:rgba(59,130,246,0.04); border:1px solid rgba(59,130,246,0.1); border-radius:14px; padding:28px; animation:ccFadeUp 0.6s ease-out both; transition:transform 0.3s,border-color 0.3s; }
        .cc-card:hover { transform:translateY(-3px); border-color:${C}33; }
        .cc-case { animation:ccSlideIn 0.5s ease-out both; border-left:3px solid ${C}44; padding-left:20px; margin-bottom:24px; }
      `}</style>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(12px)', background: `${BG}dd` }}>
        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff' }}>Meridian<span style={{ color: C }}>.</span></div>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', fontSize: '0.88rem' }}>
          {['Services', 'Case Studies', 'Team', 'Contact'].map(l => <a key={l} href="#" style={{ color: '#93c5fd', opacity: 0.6, textDecoration: 'none' }}>{l}</a>)}
          <button style={{ padding: '8px 20px', background: C, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C, marginBottom: 16 }}>Strategy · Technology · Growth</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 4.5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px', color: '#eff6ff' }}>
            Transform your business with expert guidance
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#93c5fd', opacity: 0.6, maxWidth: 440, lineHeight: 1.7, marginBottom: 32 }}>
            We partner with Fortune 500 companies and ambitious startups to drive measurable growth.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <button style={{ padding: '14px 28px', background: C, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Schedule Consultation</button>
            <button style={{ padding: '14px 28px', background: 'transparent', color: '#bfdbfe', border: `1px solid ${C}33`, borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Our Work</button>
          </div>
        </div>
        <div style={{ height: '100vh' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
          <Globe canvasRef={canvasRef} />
        </div>
      </section>

      {/* Services */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#eff6ff', textAlign: 'center', marginBottom: 48 }}>What We Do</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { icon: '📊', title: 'Strategy Consulting', desc: 'Market analysis, competitive positioning, and go-to-market strategy.' },
            { icon: '💻', title: 'Digital Transformation', desc: 'Modernize operations with cloud, AI, and automation solutions.' },
            { icon: '📈', title: 'Growth Advisory', desc: 'Revenue optimization, pricing strategy, and expansion planning.' },
            { icon: '🤝', title: 'M&A Support', desc: 'Due diligence, integration planning, and post-merger execution.' },
          ].map((s, i) => (
            <div key={i} className="cc-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>{s.icon}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#eff6ff', marginBottom: 8 }}>{s.title}</h3>
              <p style={{ color: '#93c5fd', opacity: 0.5, fontSize: '0.9rem', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Case Studies */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#eff6ff', textAlign: 'center', marginBottom: 48 }}>Case Studies</h2>
        {[
          { client: 'TechCorp', result: '3x revenue growth in 18 months', desc: 'Redesigned go-to-market strategy and implemented product-led growth model.' },
          { client: 'FinServe Inc', result: '$40M cost reduction', desc: 'Digital transformation of legacy banking systems with cloud-native architecture.' },
          { client: 'RetailMax', result: '200% increase in online sales', desc: 'Omnichannel strategy overhaul with AI-powered personalization engine.' },
        ].map((c, i) => (
          <div key={i} className="cc-case" style={{ animationDelay: `${i * 0.15}s` }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{c.client}</div>
            <div style={{ fontWeight: 700, color: '#eff6ff', fontSize: '1.1rem', marginBottom: 4 }}>{c.result}</div>
            <p style={{ color: '#93c5fd', opacity: 0.5, fontSize: '0.9rem' }}>{c.desc}</p>
          </div>
        ))}
      </section>

      {/* Testimonials */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
        <div className="cc-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', color: C, opacity: 0.3, marginBottom: 12 }}>"</div>
          <p style={{ fontSize: '1.15rem', color: '#dbeafe', lineHeight: 1.8, marginBottom: 24 }}>
            Meridian transformed our approach to growth. Their strategic insights and hands-on execution helped us achieve results we didn't think were possible.
          </p>
          <div style={{ fontWeight: 700, color: '#eff6ff' }}>Michael Torres</div>
          <div style={{ fontSize: '0.82rem', color: '#93c5fd', opacity: 0.5 }}>CEO, TechCorp</div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '80px 24px', background: `linear-gradient(180deg, transparent, ${C}06)` }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#eff6ff', marginBottom: 12 }}>Ready to grow?</h2>
        <p style={{ color: '#93c5fd', opacity: 0.5, marginBottom: 32 }}>Let's start with a free strategy session.</p>
        <button style={{ padding: '16px 40px', background: C, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>Book Free Consultation</button>
      </section>

      <footer style={{ borderTop: `1px solid ${C}10`, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#475569' }}>Consulting Co &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
