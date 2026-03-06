import { useEffect, useRef } from 'react';

const C = '#6366f1';
const BG = '#0a0a1a';

function FloatingElements() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      {[
        { icon: '💬', x: '15%', y: '20%', delay: '0s', size: 44 },
        { icon: '📊', x: '80%', y: '15%', delay: '1s', size: 40 },
        { icon: '🔔', x: '75%', y: '70%', delay: '2s', size: 36 },
        { icon: '❤️', x: '20%', y: '75%', delay: '0.5s', size: 38 },
        { icon: '⚡', x: '90%', y: '45%', delay: '1.5s', size: 42 },
        { icon: '🎯', x: '8%', y: '50%', delay: '2.5s', size: 34 },
      ].map((el, i) => (
        <div key={i} style={{
          position: 'absolute', left: el.x, top: el.y, fontSize: el.size * 0.5,
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
          width: el.size, height: el.size, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: `apFloat 6s ease-in-out ${el.delay} infinite`,
        }}>{el.icon}</div>
      ))}
    </div>
  );
}

function PhoneMockup() {
  return (
    <div style={{ width: 280, height: 560, borderRadius: 40, border: '3px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', overflow: 'hidden', position: 'relative', boxShadow: `0 20px 60px rgba(99,102,241,0.2)` }}>
      {/* Notch */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 28, background: '#000', borderRadius: '0 0 16px 16px', zIndex: 2 }} />
      {/* Screen */}
      <div style={{ padding: '40px 16px 16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Status bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#fff', opacity: 0.6, marginBottom: 20, padding: '0 4px' }}>
          <span>9:41</span>
          <span>⚡ 100%</span>
        </div>
        {/* App header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C}, #8b5cf6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.8rem' }}>A</div>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>AppFlow</div>
            <div style={{ fontSize: '0.68rem', color: '#a5b4fc' }}>Your Daily Dashboard</div>
          </div>
        </div>
        {/* Mini stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[{ label: 'Tasks', val: '12' }, { label: 'Progress', val: '78%' }].map((s, i) => (
            <div key={i} style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{s.val}</div>
              <div style={{ fontSize: '0.65rem', color: '#a5b4fc' }}>{s.label}</div>
            </div>
          ))}
        </div>
        {/* Activity list */}
        {['Meeting with Team', 'Review PR #142', 'Update Dashboard'].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? C : 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: '0.78rem', color: '#e0e7ff' }}>{item}</span>
          </div>
        ))}
        {/* Tab bar */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-around', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {['🏠', '📊', '➕', '💬', '👤'].map((ic, i) => (
            <span key={i} style={{ fontSize: '1.1rem', opacity: i === 0 ? 1 : 0.4 }}>{ic}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AppPromo() {
  return (
    <div style={{ background: BG, color: '#e0e7ff', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes apFloat { 0%,100% { transform:translateY(0) rotate(0deg); } 50% { transform:translateY(-20px) rotate(5deg); } }
        @keyframes apFadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes apPhoneIn { from { opacity:0; transform:translateY(40px) rotateY(-10deg); } to { opacity:1; transform:translateY(0) rotateY(0); } }
        @keyframes apBounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        .ap-card { background:rgba(99,102,241,0.04); border:1px solid rgba(99,102,241,0.1); border-radius:16px; padding:28px; animation:apFadeUp 0.6s ease-out both; transition:transform 0.3s; }
        .ap-card:hover { transform:translateY(-3px); }
        .ap-step { display:flex; gap:20px; align-items:flex-start; animation:apFadeUp 0.5s ease-out both; }
      `}</style>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(12px)', background: `${BG}dd` }}>
        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: C }}>AppFlow</div>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', fontSize: '0.88rem' }}>
          {['Features', 'Screenshots', 'Pricing'].map(l => <a key={l} href="#" style={{ color: '#a5b4fc', opacity: 0.7, textDecoration: 'none' }}>{l}</a>)}
          <button style={{ padding: '8px 20px', background: C, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Download</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <FloatingElements />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 20, background: `${C}15`, border: `1px solid ${C}25`, fontSize: '0.75rem', fontWeight: 600, color: C, marginBottom: 20 }}>
            ✨ Now available on iOS & Android
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: 800, lineHeight: 1.08, margin: '0 0 20px', color: '#fff' }}>
            Your productivity,<br /><span style={{ color: C }}>supercharged</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#a5b4fc', opacity: 0.7, maxWidth: 420, lineHeight: 1.7, marginBottom: 32 }}>
            The smartest app for managing tasks, tracking goals, and collaborating with your team.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={{ padding: '14px 24px', background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
              <span style={{ fontSize: '1.2rem' }}></span> App Store
            </button>
            <button style={{ padding: '14px 24px', background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
              <span style={{ fontSize: '1rem' }}>▶</span> Google Play
            </button>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 24, fontSize: '0.82rem', color: '#a5b4fc', opacity: 0.5 }}>
            <span>⭐ 4.9 Rating</span>
            <span>📥 1M+ Downloads</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', animation: 'apPhoneIn 0.8s ease-out both', perspective: 1000 }}>
          <div style={{ animation: 'apBounce 4s ease-in-out infinite' }}>
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>Why AppFlow?</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { icon: '⚡', title: 'Lightning Fast', desc: 'Instant sync across all your devices with offline support.' },
            { icon: '🔔', title: 'Smart Notifications', desc: 'AI-powered alerts that know when to nudge you.' },
            { icon: '🤝', title: 'Team Collaboration', desc: 'Real-time editing, comments, and shared workspaces.' },
            { icon: '📊', title: 'Analytics Dashboard', desc: 'Visual insights into your productivity patterns.' },
            { icon: '🔒', title: 'End-to-End Encrypted', desc: 'Your data stays private with military-grade encryption.' },
            { icon: '🎨', title: 'Customizable', desc: 'Themes, widgets, and layouts that adapt to your workflow.' },
          ].map((f, i) => (
            <div key={i} className="ap-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#a5b4fc', opacity: 0.6, fontSize: '0.88rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px 100px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 48 }}>How It Works</h2>
        {[
          { step: 1, title: 'Download the App', desc: 'Available free on iOS and Android.' },
          { step: 2, title: 'Create Your Workspace', desc: 'Set up your projects and invite your team.' },
          { step: 3, title: 'Start Shipping', desc: 'Track tasks, hit goals, and celebrate wins.' },
        ].map((s, i) => (
          <div key={i} className="ap-step" style={{ animationDelay: `${i * 0.15}s`, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${C}, #8b5cf6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>{s.step}</div>
            <div>
              <h3 style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>{s.title}</h3>
              <p style={{ color: '#a5b4fc', opacity: 0.6, fontSize: '0.9rem' }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '80px 24px', background: `linear-gradient(180deg, transparent, ${C}08)` }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: 12 }}>Ready to get started?</h2>
        <p style={{ color: '#a5b4fc', opacity: 0.6, marginBottom: 32 }}>Join a million users already loving AppFlow.</p>
        <button style={{ padding: '16px 40px', background: C, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>Download Free</button>
      </section>

      <footer style={{ borderTop: `1px solid ${C}10`, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#475569' }}>App Promo &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
