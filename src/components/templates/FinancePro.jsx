import { useEffect, useRef, useState } from 'react';

const C = '#06b6d4';
const BG = '#070d14';

function AnimatedChart() {
  const pathRef = useRef(null);
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        path.style.transition = 'stroke-dashoffset 2s ease-out';
        path.style.strokeDashoffset = '0';
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(path);
    return () => obs.disconnect();
  }, []);

  return (
    <svg viewBox="0 0 500 200" style={{ width: '100%', height: 200 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="fpGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 180 Q50 160 80 140 T160 100 T240 120 T320 60 T400 80 T500 20" fill="none" stroke={C} strokeWidth="2.5" ref={pathRef} />
      <path d="M0 180 Q50 160 80 140 T160 100 T240 120 T320 60 T400 80 T500 20 V200 H0 Z" fill="url(#fpGrad)" opacity="0.5" />
    </svg>
  );
}

function Ticker() {
  const items = ['AAPL +2.4%', 'GOOG -0.8%', 'TSLA +5.1%', 'AMZN +1.2%', 'MSFT +0.9%', 'NVDA +3.7%', 'META -1.1%', 'BTC +4.2%'];
  return (
    <div style={{ overflow: 'hidden', borderTop: `1px solid ${C}15`, borderBottom: `1px solid ${C}15`, padding: '12px 0' }}>
      <div style={{ display: 'flex', gap: 48, animation: 'fpScroll 20s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
        {[...items, ...items].map((item, i) => {
          const up = item.includes('+');
          return <span key={i} style={{ fontSize: '0.82rem', fontWeight: 600, color: up ? '#10b981' : '#ef4444' }}>{item}</span>;
        })}
      </div>
    </div>
  );
}

function Counter({ end, prefix = '', suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        obs.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / 2000, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(end * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

export default function FinancePro() {
  return (
    <div style={{ background: BG, color: '#cffafe', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes fpScroll { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @keyframes fpFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fpPulse { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
        .fp-card { background:rgba(6,182,212,0.04); border:1px solid rgba(6,182,212,0.1); border-radius:14px; padding:24px; animation:fpFadeUp 0.6s ease-out both; transition:border-color 0.3s; }
        .fp-card:hover { border-color:${C}44; }
        .fp-stat { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:14px; padding:28px; text-align:center; }
        .fp-invoice-row { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; padding:14px 20px; border-bottom:1px solid rgba(255,255,255,0.03); font-size:0.88rem; transition:background 0.2s; }
        .fp-invoice-row:hover { background:rgba(255,255,255,0.02); }
      `}</style>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(12px)', background: `${BG}dd` }}>
        <div style={{ fontWeight: 800, fontSize: '1.15rem' }}><span style={{ color: C }}>Finance</span>Pro</div>
        <div style={{ display: 'flex', gap: 28, fontSize: '0.88rem', alignItems: 'center' }}>
          {['Dashboard', 'Reports', 'Invoices', 'Settings'].map(l => <a key={l} href="#" style={{ color: '#7dd3fc', opacity: 0.6, textDecoration: 'none' }}>{l}</a>)}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 800, margin: '0 auto', padding: '120px 24px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C, marginBottom: 16 }}>Financial Management Platform</div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px', background: `linear-gradient(135deg, #fff 40%, ${C})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Your Finances,<br />Crystal Clear
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#7dd3fc', opacity: 0.7, maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.7 }}>
          P&L tracking, invoicing, expense management, and cash flow analysis in one powerful dashboard.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button style={{ padding: '14px 32px', background: C, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Start Free</button>
          <button style={{ padding: '14px 32px', background: 'transparent', color: '#cffafe', border: `1px solid ${C}33`, borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>See Demo</button>
        </div>
      </section>

      <Ticker />

      {/* Stats */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {[
            { label: 'Total Revenue', val: 847200, prefix: '$' },
            { label: 'Net Profit', val: 284100, prefix: '$' },
            { label: 'Invoices Sent', val: 1284 },
            { label: 'Collection Rate', val: 97, suffix: '%' },
          ].map((s, i) => (
            <div key={i} className="fp-stat" style={{ animation: 'fpFadeUp 0.6s ease-out both', animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: '0.78rem', color: '#7dd3fc', opacity: 0.5, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ecfeff' }}>
                <Counter end={s.val} prefix={s.prefix || ''} suffix={s.suffix || ''} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Chart */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <div className="fp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, color: '#ecfeff' }}>Revenue Overview</div>
              <div style={{ fontSize: '0.82rem', color: '#7dd3fc', opacity: 0.5 }}>Last 12 months</div>
            </div>
            <div style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: 8, background: `${C}15`, color: C, fontWeight: 600 }}>+24.5% YoY</div>
          </div>
          <AnimatedChart />
        </div>
      </section>

      {/* Invoices Table */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <div className="fp-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 0', fontWeight: 700, color: '#ecfeff' }}>Recent Invoices</div>
          <div style={{ marginTop: 16 }}>
            <div className="fp-invoice-row" style={{ color: '#7dd3fc', opacity: 0.5, fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Client</span><span>Amount</span><span>Status</span><span>Due Date</span>
            </div>
            {[
              { client: 'Acme Corp', amount: '$12,500', status: 'Paid', due: 'Mar 1, 2026' },
              { client: 'Globex Inc', amount: '$8,200', status: 'Pending', due: 'Mar 15, 2026' },
              { client: 'Initech LLC', amount: '$3,400', status: 'Overdue', due: 'Feb 20, 2026' },
              { client: 'Stark Industries', amount: '$24,000', status: 'Paid', due: 'Feb 28, 2026' },
            ].map((inv, i) => (
              <div key={i} className="fp-invoice-row">
                <span style={{ fontWeight: 600, color: '#ecfeff' }}>{inv.client}</span>
                <span style={{ color: '#ecfeff' }}>{inv.amount}</span>
                <span><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: inv.status === 'Paid' ? '#10b98118' : inv.status === 'Pending' ? '#f59e0b18' : '#ef444418', color: inv.status === 'Paid' ? '#10b981' : inv.status === 'Pending' ? '#f59e0b' : '#ef4444' }}>{inv.status}</span></span>
                <span style={{ color: '#7dd3fc', opacity: 0.6 }}>{inv.due}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {[
            { icon: '📈', title: 'P&L Tracking', desc: 'Real-time profit and loss statements with drill-down capabilities.' },
            { icon: '🧾', title: 'Smart Invoicing', desc: 'Auto-generate invoices with payment tracking and reminders.' },
            { icon: '💰', title: 'Cash Flow', desc: 'Forecast cash flow with AI-powered predictions and alerts.' },
          ].map((f, i) => (
            <div key={i} className="fp-card" style={{ animationDelay: `${i * 0.12}s` }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ecfeff', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#7dd3fc', opacity: 0.6, fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C}10`, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#475569' }}>Finance Pro &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
