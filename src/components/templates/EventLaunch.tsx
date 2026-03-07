import { useEffect, useState } from 'react';

const C = '#f97316';
const C2 = '#fb923c';
const BG = '#120c06';

function Countdown() {
  const target = new Date('2026-06-15T18:00:00');
  const [diff, setDiff] = useState(target.getTime() - Date.now());
  useEffect(() => {
    const timer = setInterval(() => setDiff(target.getTime() - Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const d = Math.max(0, Math.floor(diff / 86400000));
  const h = Math.max(0, Math.floor((diff % 86400000) / 3600000));
  const m = Math.max(0, Math.floor((diff % 3600000) / 60000));
  const s = Math.max(0, Math.floor((diff % 60000) / 1000));
  const units = [
    { val: d, label: 'Days' },
    { val: h, label: 'Hours' },
    { val: m, label: 'Minutes' },
    { val: s, label: 'Seconds' },
  ];
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
      {units.map((u, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#fff', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 14, padding: '16px 20px', minWidth: 80, fontVariantNumeric: 'tabular-nums' }}>
            {String(u.val).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '0.72rem', color: C, fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{u.label}</div>
        </div>
      ))}
    </div>
  );
}

function StageLights() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      {[
        { x: '10%', color: C, delay: '0s', size: 500 },
        { x: '50%', color: '#ec4899', delay: '1.5s', size: 600 },
        { x: '85%', color: '#8b5cf6', delay: '3s', size: 450 },
      ].map((l, i) => (
        <div key={i} style={{
          position: 'absolute', left: l.x, top: '-20%', width: l.size, height: l.size,
          background: `radial-gradient(ellipse at center, ${l.color}18, transparent 70%)`,
          animation: `elPulseLight 4s ease-in-out ${l.delay} infinite`,
          transform: 'translateX(-50%)',
        }} />
      ))}
    </div>
  );
}

export default function EventLaunch() {
  const speakers = [
    { name: 'Maya Johnson', role: 'Keynote Speaker', topic: 'The Future of AI' },
    { name: 'David Park', role: 'CTO, TechCorp', topic: 'Scaling to Millions' },
    { name: 'Sarah Lewis', role: 'Design Lead', topic: 'Design Systems 2.0' },
    { name: 'Raj Patel', role: 'VP Engineering', topic: 'DevOps at Scale' },
  ];

  const schedule = [
    { time: '9:00 AM', title: 'Registration & Coffee', type: 'break' },
    { time: '10:00 AM', title: 'Opening Keynote — Maya Johnson', type: 'keynote' },
    { time: '11:30 AM', title: 'Workshop: Building with AI', type: 'workshop' },
    { time: '1:00 PM', title: 'Lunch & Networking', type: 'break' },
    { time: '2:00 PM', title: 'Panel: Future of Tech', type: 'panel' },
    { time: '4:00 PM', title: 'Closing Remarks & After Party', type: 'keynote' },
  ];

  return (
    <div style={{ background: BG, color: '#fed7aa', fontFamily: "'Space Grotesk', 'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes elPulseLight { 0%,100% { opacity:0.3; transform:translateX(-50%) scale(1); } 50% { opacity:0.7; transform:translateX(-50%) scale(1.2); } }
        @keyframes elFadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes elGlow { 0%,100% { box-shadow:0 0 0 0 ${C}44; } 50% { box-shadow:0 0 30px 8px ${C}22; } }
        .el-card { background:rgba(249,115,22,0.04); border:1px solid rgba(249,115,22,0.1); border-radius:16px; padding:28px; animation:elFadeUp 0.6s ease-out both; transition:transform 0.3s,border-color 0.3s; }
        .el-card:hover { transform:translateY(-3px); border-color:${C}44; }
        .el-ticket { background:linear-gradient(135deg,rgba(249,115,22,0.08),rgba(236,72,153,0.04)); border:1px solid rgba(249,115,22,0.15); border-radius:16px; padding:32px; text-align:center; transition:transform 0.3s; position:relative; overflow:hidden; }
        .el-ticket:hover { transform:translateY(-4px); }
        .el-ticket.featured { border-color:${C}44; animation:elGlow 3s ease infinite; }
        .el-schedule-item { display:flex; gap:20px; padding:16px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
      `}</style>

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
        <StageLights />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700 }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: `${C}15`, border: `1px solid ${C}30`, fontSize: '0.78rem', fontWeight: 600, color: C, marginBottom: 24 }}>
            June 15, 2026 — San Francisco, CA
          </div>
          <h1 style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 800, lineHeight: 1.05, margin: '0 0 16px', color: '#fff' }}>
            LAUNCH<span style={{ color: C }}>CON</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#fed7aa', opacity: 0.7, maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.6 }}>
            The premier conference for builders, creators, and innovators.
          </p>
          <Countdown />
          <div style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button style={{ padding: '16px 36px', background: C, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>Get Tickets</button>
            <button style={{ padding: '16px 36px', background: 'transparent', color: '#fed7aa', border: `1px solid ${C}33`, borderRadius: 12, fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>View Agenda</button>
          </div>
        </div>
      </section>

      {/* Speakers */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }}>Featured Speakers</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {speakers.map((sp, i) => (
            <div key={i} className="el-card" style={{ textAlign: 'center', animationDelay: `${i * 0.1}s` }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${C}, #ec4899)`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1.2rem' }}>
                {sp.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 2 }}>{sp.name}</div>
              <div style={{ fontSize: '0.82rem', color: C, fontWeight: 600, marginBottom: 6 }}>{sp.role}</div>
              <div style={{ fontSize: '0.82rem', color: '#a3a3a3' }}>{sp.topic}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Schedule */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 40 }}>Schedule</h2>
        {schedule.map((s, i) => (
          <div key={i} className="el-schedule-item" style={{ animation: 'elFadeUp 0.5s ease-out both', animationDelay: `${i * 0.08}s` }}>
            <div style={{ minWidth: 90, fontSize: '0.88rem', fontWeight: 700, color: C }}>{s.time}</div>
            <div>
              <div style={{ fontWeight: 600, color: '#fff' }}>{s.title}</div>
              <div style={{ fontSize: '0.78rem', color: '#a3a3a3', marginTop: 2, textTransform: 'capitalize' }}>{s.type}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Tickets */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 100px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 40 }}>Get Your Pass</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {[
            { name: 'General', price: 299, perks: ['All Sessions', 'Lunch Included', 'Swag Bag'] },
            { name: 'VIP', price: 599, perks: ['All Sessions', 'VIP Lounge', 'Speaker Dinner', 'Workshop Access', 'Recording Access'], featured: true },
            { name: 'Group (5+)', price: 199, perks: ['All Sessions', 'Lunch Included', 'Group Discount', 'Team Coordination'] },
          ].map((t, i) => (
            <div key={i} className={`el-ticket ${t.featured ? 'featured' : ''}`}>
              {t.featured && <div style={{ fontSize: '0.7rem', fontWeight: 700, color: C, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Best Value</div>}
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{t.name}</h3>
              <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#fff', margin: '12px 0' }}>${t.price}<span style={{ fontSize: '1rem', color: '#a3a3a3', fontWeight: 400 }}>/person</span></div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 0', margin: '8px 0' }}>
                {t.perks.map((p, pi) => (
                  <div key={pi} style={{ padding: '6px 0', fontSize: '0.88rem', color: '#d4d4d4', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <span style={{ color: C }}>✓</span> {p}
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', padding: '14px', background: t.featured ? C : 'rgba(255,255,255,0.06)', color: '#fff', border: t.featured ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Reserve Spot</button>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C}10`, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#475569' }}>Event Launch &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
