import { useState } from 'react';

const C = '#e11d48';
const BG = '#120508';

export default function CourseSales() {
  const [open, setOpen] = useState(0);
  const modules = [
    { title: 'Module 1: Foundations', lessons: 8, duration: '2h 30m', items: ['Introduction to Design Systems', 'Color Theory & Typography', 'Layout Principles', 'Responsive Design Basics'] },
    { title: 'Module 2: Component Design', lessons: 12, duration: '4h 15m', items: ['Atomic Design Methodology', 'Building Reusable Components', 'State & Variant Management', 'Accessibility Standards'] },
    { title: 'Module 3: Advanced Patterns', lessons: 10, duration: '3h 45m', items: ['Motion & Microinteractions', 'Dark Mode Implementation', 'Performance Optimization', 'Testing & Documentation'] },
    { title: 'Module 4: Real-World Projects', lessons: 6, duration: '5h 00m', items: ['E-Commerce Design System', 'SaaS Dashboard Kit', 'Portfolio Capstone Project'] },
  ];

  return (
    <div style={{ background: BG, color: '#fecdd3', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes csFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes csPlayPulse { 0%,100% { box-shadow:0 0 0 0 ${C}44; } 50% { box-shadow:0 0 0 20px ${C}00; } }
        @keyframes csRing { 0% { transform:scale(1); opacity:0.4; } 100% { transform:scale(2.5); opacity:0; } }
        .cs-card { background:rgba(225,29,72,0.04); border:1px solid rgba(225,29,72,0.1); border-radius:14px; padding:24px; animation:csFadeUp 0.6s ease-out both; }
        .cs-accordion { border:1px solid rgba(225,29,72,0.1); border-radius:14px; overflow:hidden; margin-bottom:8px; transition:border-color 0.3s; }
        .cs-accordion.open { border-color:${C}33; }
        .cs-accordion-head { padding:20px 24px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:background 0.2s; }
        .cs-accordion-head:hover { background:rgba(225,29,72,0.04); }
        .cs-accordion-body { padding:0 24px 20px; }
        .cs-lesson { display:flex; align-items:center; gap:10px; padding:8px 0; font-size:0.88rem; color:#fda4af; }
        .cs-lesson::before { content:'▶'; font-size:0.6rem; color:${C}; }
      `}</style>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(12px)', background: `${BG}dd` }}>
        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: C }}>DesignMastery</div>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', fontSize: '0.88rem' }}>
          {['Curriculum', 'Instructor', 'Pricing'].map(l => <a key={l} href="#" style={{ color: '#fda4af', opacity: 0.6, textDecoration: 'none' }}>{l}</a>)}
          <button style={{ padding: '8px 20px', background: C, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Enroll Now</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ maxWidth: 700 }}>
          {/* Play button */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: `linear-gradient(135deg, ${C}, #be123c)`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', animation: 'csPlayPulse 2s ease infinite', position: 'relative', zIndex: 1 }}>
              <span style={{ fontSize: '2rem', color: '#fff', marginLeft: 4 }}>▶</span>
            </div>
            <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: `2px solid ${C}`, animation: 'csRing 2s ease-out infinite' }} />
            <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: `2px solid ${C}`, animation: 'csRing 2s ease-out 0.5s infinite' }} />
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C, marginBottom: 16 }}>Online Course</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4rem)', fontWeight: 800, lineHeight: 1.08, margin: '0 0 20px', color: '#fff1f2' }}>
            Master Design Systems<br /><span style={{ color: C }}>From Zero to Pro</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#fda4af', opacity: 0.6, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
            36 lessons, 15+ hours of content, real-world projects. Learn to build design systems used by top companies.
          </p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', fontSize: '0.85rem', color: '#fda4af', opacity: 0.5, marginBottom: 32 }}>
            <span>📚 36 Lessons</span><span>⏱ 15+ Hours</span><span>📜 Certificate</span>
          </div>
          <button style={{ padding: '16px 40px', background: C, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>Enroll Now — $199</button>
        </div>
      </section>

      {/* Curriculum */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff1f2', textAlign: 'center', marginBottom: 40 }}>Curriculum</h2>
        {modules.map((m, i) => (
          <div key={i} className={`cs-accordion ${open === i ? 'open' : ''}`}>
            <div className="cs-accordion-head" onClick={() => setOpen(open === i ? -1 : i)}>
              <div>
                <div style={{ fontWeight: 700, color: '#fff1f2', fontSize: '0.95rem' }}>{m.title}</div>
                <div style={{ fontSize: '0.78rem', color: '#fda4af', opacity: 0.5, marginTop: 2 }}>{m.lessons} lessons · {m.duration}</div>
              </div>
              <span style={{ color: C, fontSize: '1.2rem', transform: open === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>▼</span>
            </div>
            {open === i && (
              <div className="cs-accordion-body">
                {m.items.map((item, j) => <div key={j} className="cs-lesson">{item}</div>)}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Instructor */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 80px' }}>
        <div className="cs-card" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: `linear-gradient(135deg, ${C}, #f43f5e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '2rem', flexShrink: 0 }}>JD</div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff1f2', marginBottom: 4 }}>Jordan Davis</h3>
            <div style={{ fontSize: '0.85rem', color: C, fontWeight: 600, marginBottom: 8 }}>Senior Design Lead — ex-Airbnb, Figma</div>
            <p style={{ fontSize: '0.9rem', color: '#fda4af', opacity: 0.6, lineHeight: 1.6 }}>
              10+ years of design experience. Built design systems used by millions. Taught 5,000+ students worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[
            { text: '"This course changed my career. I went from junior to senior designer in 6 months."', name: 'Alex R.', stars: 5 },
            { text: '"The projects are incredibly practical. I used my capstone in my portfolio."', name: 'Mia L.', stars: 5 },
            { text: '"Best investment I\'ve made in my design education. Worth every penny."', name: 'Sam K.', stars: 5 },
          ].map((t, i) => (
            <div key={i} className="cs-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ color: '#fbbf24', marginBottom: 8 }}>{'★'.repeat(t.stars)}</div>
              <p style={{ fontSize: '0.92rem', color: '#fecdd3', lineHeight: 1.6, marginBottom: 12 }}>{t.text}</p>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff1f2' }}>{t.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '80px 24px', background: `linear-gradient(180deg, transparent, ${C}08)` }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff1f2', marginBottom: 12 }}>Start learning today</h2>
        <p style={{ color: '#fda4af', opacity: 0.5, marginBottom: 8 }}>30-day money-back guarantee. No questions asked.</p>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', margin: '16px 0 28px' }}>$199 <span style={{ fontSize: '1rem', color: '#fda4af', opacity: 0.4, textDecoration: 'line-through' }}>$399</span></div>
        <button style={{ padding: '16px 40px', background: C, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>Enroll Now</button>
      </section>

      <footer style={{ borderTop: `1px solid ${C}10`, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#475569' }}>Course Sales &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
