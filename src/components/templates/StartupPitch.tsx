import { useEffect, useRef, useState } from 'react';

const C = '#14b8a6';
const BG = '#071210';

function Counter({ end, prefix = '', suffix = '', decimals = 0 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        obs.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / 2200, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          setVal(decimals ? parseFloat((end * eased).toFixed(decimals)) : Math.round(end * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, decimals]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

function GrowthChart() {
  const pathRef = useRef(null);
  useEffect(() => {
    const p = pathRef.current;
    if (!p) return;
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        p.style.transition = 'stroke-dashoffset 2.5s cubic-bezier(0.4,0,0.2,1)';
        p.style.strokeDashoffset = '0';
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(p);
    return () => obs.disconnect();
  }, []);
  return (
    <svg viewBox="0 0 400 200" style={{ width: '100%', height: 200 }}>
      <defs>
        <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C} stopOpacity="0.25" />
          <stop offset="100%" stopColor={C} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 180 Q40 175 60 170 T120 155 T180 135 T220 120 T260 90 T300 55 T340 30 T400 5" fill="none" stroke={C} strokeWidth="3" ref={pathRef} />
      <path d="M0 180 Q40 175 60 170 T120 155 T180 135 T220 120 T260 90 T300 55 T340 30 T400 5 V200 H0 Z" fill="url(#spGrad)" />
    </svg>
  );
}

export default function StartupPitch() {
  return (
    <div style={{ background: BG, color: '#ccfbf1', fontFamily: "'Space Grotesk', 'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes spFadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spScale { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
        @keyframes spSlideLeft { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
        .sp-card { background:rgba(20,184,166,0.04); border:1px solid rgba(20,184,166,0.1); border-radius:14px; padding:28px; animation:spFadeUp 0.6s ease-out both; }
        .sp-metric { text-align:center; animation:spScale 0.6s ease-out both; }
        .sp-timeline { position:relative; padding-left:32px; }
        .sp-timeline::before { content:''; position:absolute; left:10px; top:0; bottom:0; width:2px; background:${C}22; }
        .sp-timeline-item { position:relative; margin-bottom:32px; animation:spSlideLeft 0.5s ease-out both; }
        .sp-timeline-item::before { content:''; position:absolute; left:-28px; top:4px; width:12px; height:12px; border-radius:50%; background:${C}; border:2px solid ${BG}; }
      `}</style>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C, marginBottom: 16 }}>Series A · $12M Raised</div>
        <h1 style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.08, margin: '0 0 20px', color: '#f0fdfa' }}>
          We're reinventing<br /><span style={{ color: C }}>how teams work</span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#5eead4', opacity: 0.6, maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.7 }}>
          AI-native collaboration platform that reduces meeting time by 60% and increases output by 3x.
        </p>
        <button style={{ padding: '16px 36px', background: C, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>View Pitch Deck</button>
      </section>

      {/* Problem / Solution */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div className="sp-card">
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ef4444', marginBottom: 12 }}>The Problem</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f0fdfa', marginBottom: 12 }}>Teams waste 31 hours per month in unnecessary meetings</h3>
            <p style={{ color: '#5eead4', opacity: 0.6, lineHeight: 1.7, fontSize: '0.92rem' }}>Knowledge workers spend more time coordinating than creating. Context switching kills productivity. Important decisions get lost in chat.</p>
          </div>
          <div className="sp-card">
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C, marginBottom: 12 }}>Our Solution</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f0fdfa', marginBottom: 12 }}>AI that handles coordination so humans can create</h3>
            <p style={{ color: '#5eead4', opacity: 0.6, lineHeight: 1.7, fontSize: '0.92rem' }}>Our platform automatically summarizes discussions, tracks decisions, assigns action items, and eliminates the need for status update meetings.</p>
          </div>
        </div>
      </section>

      {/* Traction Metrics */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f0fdfa', textAlign: 'center', marginBottom: 48 }}>Traction</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { val: 50000, suffix: '+', label: 'Active Users' },
            { val: 12, prefix: '$', suffix: 'M', label: 'ARR' },
            { val: 340, suffix: '%', label: 'YoY Growth' },
            { val: 4.8, label: 'NPS Score', decimals: 1 },
          ].map((m, i) => (
            <div key={i} className="sp-metric" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: C }}>
                <Counter end={m.val} prefix={m.prefix || ''} suffix={m.suffix || ''} decimals={m.decimals || 0} />
              </div>
              <div style={{ fontSize: '0.82rem', color: '#5eead4', opacity: 0.5, marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Growth Chart */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
        <div className="sp-card">
          <div style={{ fontWeight: 700, color: '#f0fdfa', marginBottom: 4 }}>Revenue Growth</div>
          <div style={{ fontSize: '0.82rem', color: '#5eead4', opacity: 0.5, marginBottom: 16 }}>Monthly Recurring Revenue</div>
          <GrowthChart />
        </div>
      </section>

      {/* Timeline */}
      <section style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f0fdfa', textAlign: 'center', marginBottom: 48 }}>Our Journey</h2>
        <div className="sp-timeline">
          {[
            { date: 'Jan 2024', title: 'Founded', desc: 'Started with 3 co-founders in a garage.' },
            { date: 'Jun 2024', title: 'Seed Round ($2M)', desc: 'Backed by Y Combinator and angel investors.' },
            { date: 'Jan 2025', title: 'Product-Market Fit', desc: 'Reached 10K users and 95% retention.' },
            { date: 'Sep 2025', title: 'Series A ($12M)', desc: 'Led by Sequoia Capital with 340% YoY growth.' },
            { date: '2026', title: 'Global Expansion', desc: 'Launching in EU and APAC markets.' },
          ].map((t, i) => (
            <div key={i} className="sp-timeline-item" style={{ animationDelay: `${i * 0.12}s` }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C, marginBottom: 4 }}>{t.date}</div>
              <div style={{ fontWeight: 700, color: '#f0fdfa', marginBottom: 4 }}>{t.title}</div>
              <div style={{ fontSize: '0.88rem', color: '#5eead4', opacity: 0.5 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f0fdfa', textAlign: 'center', marginBottom: 48 }}>The Team</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {[
            { name: 'Emma Torres', role: 'CEO', bg: 'Ex-Google PM' },
            { name: 'Marcus Lee', role: 'CTO', bg: 'Ex-Stripe Eng' },
            { name: 'Priya Sharma', role: 'CPO', bg: 'Ex-Figma Design' },
          ].map((p, i) => (
            <div key={i} className="sp-card" style={{ textAlign: 'center', animationDelay: `${i * 0.1}s` }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${C}, #06b6d4)`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>
                {p.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ fontWeight: 700, color: '#f0fdfa' }}>{p.name}</div>
              <div style={{ fontSize: '0.85rem', color: C, fontWeight: 600 }}>{p.role}</div>
              <div style={{ fontSize: '0.78rem', color: '#5eead4', opacity: 0.4, marginTop: 2 }}>{p.bg}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '80px 24px', background: `linear-gradient(180deg, transparent, ${C}06)` }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f0fdfa', marginBottom: 12 }}>Interested in investing?</h2>
        <p style={{ color: '#5eead4', opacity: 0.5, marginBottom: 32 }}>Let's schedule a conversation about the future.</p>
        <button style={{ padding: '16px 40px', background: C, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>Contact Us</button>
      </section>

      <footer style={{ borderTop: `1px solid ${C}10`, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#475569' }}>Startup Pitch &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
