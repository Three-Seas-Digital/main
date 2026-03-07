import { useEffect, useRef, useState } from 'react';

const C = '#8b5cf6';
const C2 = '#a78bfa';
const BG = '#0c0a1a';

function GradientBlobs() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${C}30, transparent 70%)`,
        top: '-10%', left: '-10%', animation: 'saasFloat1 12s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, #ec489930, transparent 70%)`,
        bottom: '-5%', right: '-5%', animation: 'saasFloat2 15s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, #06b6d420, transparent 70%)`,
        top: '40%', left: '50%', animation: 'saasFloat3 10s ease-in-out infinite',
      }} />
    </div>
  );
}

function TypeWriter({ words, speed = 80 }) {
  const [text, setText] = useState('');
  const [wi, setWi] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[wi];
    const timer = setTimeout(() => {
      if (!deleting) {
        setText(word.slice(0, text.length + 1));
        if (text.length + 1 === word.length) setTimeout(() => setDeleting(true), 1500);
      } else {
        setText(word.slice(0, text.length - 1));
        if (text.length === 0) { setDeleting(false); setWi((wi + 1) % words.length); }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timer);
  }, [text, wi, deleting, words, speed]);
  return <span>{text}<span style={{ animation: 'saasBlink 1s step-end infinite', color: C }}>|</span></span>;
}

export default function SaaSLaunch() {
  const [annual, setAnnual] = useState(true);
  const plans = [
    { name: 'Starter', price: annual ? 29 : 39, features: ['5 Projects', '10GB Storage', 'Email Support', 'Basic Analytics'] },
    { name: 'Pro', price: annual ? 79 : 99, features: ['Unlimited Projects', '100GB Storage', 'Priority Support', 'Advanced Analytics', 'Team Collaboration', 'API Access'], popular: true },
    { name: 'Enterprise', price: annual ? 199 : 249, features: ['Everything in Pro', '1TB Storage', 'Dedicated Account Manager', 'Custom Integrations', 'SLA 99.99%', 'SSO & SAML'] },
  ];

  return (
    <div style={{ background: BG, color: '#e2e8f0', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes saasFloat1 { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(60px,40px) scale(1.1); } }
        @keyframes saasFloat2 { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(-40px,-30px) scale(1.15); } }
        @keyframes saasFloat3 { 0%,100% { transform:translate(-50%,0) scale(1); } 50% { transform:translate(-50%,-40px) scale(1.1); } }
        @keyframes saasBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes saasCardIn { from { opacity:0; transform:translateY(40px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes saasShine { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        .saas-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:20px; padding:36px 28px; animation:saasCardIn 0.7s ease-out both; transition:transform 0.3s,border-color 0.3s; }
        .saas-card:hover { transform:translateY(-4px); border-color:${C}44; }
        .saas-card.popular { border-color:${C}66; background:linear-gradient(135deg,rgba(139,92,246,0.08),rgba(236,72,153,0.04)); }
        .saas-feature { padding:8px 0; display:flex; align-items:center; gap:10px; font-size:0.9rem; color:#94a3b8; }
        .saas-feature::before { content:'✓'; color:${C}; font-weight:700; font-size:0.85rem; }
        .saas-nav { display:flex; justify-content:space-between; align-items:center; padding:20px 40px; position:fixed; top:0; left:0; right:0; z-index:100; backdrop-filter:blur(12px); background:rgba(12,10,26,0.8); border-bottom:1px solid rgba(255,255,255,0.05); }
      `}</style>

      {/* Nav */}
      <nav className="saas-nav">
        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: C }}>SaaSify</div>
        <div style={{ display: 'flex', gap: 32, fontSize: '0.88rem' }}>
          {['Features', 'Pricing', 'Docs', 'Blog'].map(l => (
            <a key={l} href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>{l}</a>
          ))}
          <button style={{ padding: '8px 20px', background: C, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Sign Up</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <GradientBlobs />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 700, padding: '0 24px' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: `${C}15`, border: `1px solid ${C}30`, fontSize: '0.78rem', fontWeight: 600, color: C, marginBottom: 24 }}>
            🚀 Now in public beta
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.08, margin: '0 0 20px' }}>
            Ship your product<br />
            <span style={{ color: C }}><TypeWriter words={['faster', 'smarter', 'better']} /></span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#94a3b8', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.7 }}>
            The all-in-one platform that helps teams build, launch, and scale their SaaS products.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button style={{ padding: '16px 36px', background: `linear-gradient(135deg, ${C}, #ec4899)`, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', backgroundSize: '200% auto', animation: 'saasShine 3s linear infinite' }}>Start Free Trial</button>
            <button style={{ padding: '16px 36px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>Watch Demo</button>
          </div>
          <div style={{ marginTop: 24, fontSize: '0.82rem', color: '#64748b' }}>No credit card required · 14-day free trial</div>
        </div>
      </section>

      {/* Logos */}
      <section style={{ padding: '60px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.78rem', color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 24 }}>Trusted by 2,000+ companies</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap', opacity: 0.3 }}>
          {['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Soylent'].map(c => (
            <span key={c} style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.05em' }}>{c}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Everything you need to scale</h2>
          <p style={{ color: '#64748b', marginTop: 8 }}>Powerful features, simple interface.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {[
            { icon: '⚡', title: 'Lightning Fast', desc: 'Sub-100ms response times with edge computing and smart caching.' },
            { icon: '🔒', title: 'Enterprise Security', desc: 'SOC2 compliant with end-to-end encryption and role-based access.' },
            { icon: '📊', title: 'Deep Analytics', desc: 'Real-time dashboards, funnel tracking, and cohort analysis.' },
            { icon: '🔄', title: 'Seamless Integrations', desc: 'Connect with 200+ tools including Slack, Stripe, and GitHub.' },
            { icon: '🤖', title: 'AI-Powered', desc: 'Smart suggestions, automated workflows, and predictive insights.' },
            { icon: '🌍', title: 'Global CDN', desc: '99.99% uptime with data centers across 6 continents.' },
          ].map((f, i) => (
            <div key={i} className="saas-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Simple, transparent pricing</h2>
          <div style={{ display: 'inline-flex', gap: 0, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, marginTop: 20 }}>
            <button onClick={() => setAnnual(true)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: annual ? C : 'transparent', color: annual ? '#fff' : '#94a3b8', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Annual <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>(-20%)</span></button>
            <button onClick={() => setAnnual(false)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: !annual ? C : 'transparent', color: !annual ? '#fff' : '#94a3b8', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Monthly</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {plans.map((p, i) => (
            <div key={i} className={`saas-card ${p.popular ? 'popular' : ''}`} style={{ animationDelay: `${i * 0.15}s` }}>
              {p.popular && <div style={{ fontSize: '0.72rem', fontWeight: 700, color: C, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Most Popular</div>}
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{p.name}</h3>
              <div style={{ fontSize: '2.8rem', fontWeight: 800, margin: '12px 0' }}>${p.price}<span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 400 }}>/mo</span></div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 0', margin: '16px 0' }}>
                {p.features.map((f, fi) => <div key={fi} className="saas-feature">{f}</div>)}
              </div>
              <button style={{ width: '100%', padding: '14px', background: p.popular ? C : 'rgba(255,255,255,0.06)', color: '#fff', border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Get Started</button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '100px 24px' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16 }}>Ready to launch?</h2>
        <p style={{ color: '#64748b', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>Join 2,000+ companies already using SaaSify to grow faster.</p>
        <button style={{ padding: '16px 40px', background: `linear-gradient(135deg, ${C}, #ec4899)`, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer' }}>Start Your Free Trial</button>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#475569' }}>SaaS Launch &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
