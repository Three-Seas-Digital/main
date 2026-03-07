import { useState } from 'react';

const C = '#a855f7';
const BG = '#0d0815';

export default function ProductHunt() {
  const [upvotes, setUpvotes] = useState(847);
  const [voted, setVoted] = useState(false);

  return (
    <div style={{ background: BG, color: '#e9d5ff', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes phFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes phPop { 0% { transform:scale(1); } 50% { transform:scale(1.2); } 100% { transform:scale(1); } }
        @keyframes phCascade { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes phShimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        .ph-card { background:rgba(168,85,247,0.04); border:1px solid rgba(168,85,247,0.1); border-radius:14px; padding:24px; animation:phFadeUp 0.6s ease-out both; transition:transform 0.3s,border-color 0.3s; }
        .ph-card:hover { transform:translateY(-2px); border-color:${C}33; }
        .ph-upvote { display:flex; flex-direction:column; align-items:center; gap:4px; padding:14px 16px; border-radius:12px; border:2px solid ${C}44; background:rgba(168,85,247,0.06); cursor:pointer; transition:all 0.3s; min-width:60px; }
        .ph-upvote.voted { background:${C}; border-color:${C}; }
        .ph-upvote:hover { border-color:${C}; }
        .ph-testimonial { animation:phCascade 0.5s ease-out both; }
      `}</style>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(12px)', background: `${BG}dd` }}>
        <div style={{ fontWeight: 800, fontSize: '1.15rem' }}><span style={{ color: C }}>Flow</span>Board</div>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', fontSize: '0.88rem' }}>
          {['Features', 'Testimonials', 'Pricing'].map(l => <a key={l} href="#" style={{ color: '#c4b5fd', opacity: 0.6, textDecoration: 'none' }}>{l}</a>)}
          <button style={{ padding: '8px 20px', background: C, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Get Early Access</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: 700 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 24, background: `${C}12`, border: `1px solid ${C}25`, marginBottom: 28 }}>
            <span style={{ fontSize: '0.85rem' }}>🏆</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: C }}>Featured on Product Hunt — #1 Product of the Day</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.08, margin: '0 0 20px', color: '#faf5ff' }}>
            The whiteboard<br />that <span style={{ background: `linear-gradient(135deg, ${C}, #ec4899)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% auto', animation: 'phShimmer 4s linear infinite' }}>thinks with you</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#c4b5fd', opacity: 0.6, maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.7 }}>
            AI-powered visual collaboration for teams that want to move faster. Brainstorm, plan, and execute — all in one space.
          </p>

          {/* Upvote Hero */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 40 }}>
            <div className={`ph-upvote ${voted ? 'voted' : ''}`} onClick={() => { setVoted(!voted); setUpvotes(voted ? upvotes - 1 : upvotes + 1); }}>
              <span style={{ fontSize: '1.2rem', transition: 'transform 0.3s', transform: voted ? 'scale(1.2)' : 'scale(1)' }}>▲</span>
              <span style={{ fontWeight: 800, color: voted ? '#fff' : C, fontSize: '1.1rem' }}>{upvotes}</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, color: '#faf5ff', fontSize: '1.1rem' }}>FlowBoard</div>
              <div style={{ fontSize: '0.82rem', color: '#c4b5fd', opacity: 0.5 }}>AI-powered collaborative whiteboard</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button style={{ padding: '14px 32px', background: C, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Try It Free</button>
            <button style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.04)', color: '#e9d5ff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Watch Demo</button>
          </div>

          {/* Social proof avatars */}
          <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ display: 'flex' }}>
              {[C, '#ec4899', '#06b6d4', '#f59e0b', '#10b981'].map((clr, i) => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: clr, border: `2px solid ${BG}`, marginLeft: i > 0 ? -10 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: '#fff' }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span style={{ fontSize: '0.82rem', color: '#c4b5fd', opacity: 0.5 }}>2,400+ early adopters</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {[
            { icon: '🧠', title: 'AI Suggestions', desc: 'Get smart recommendations as you brainstorm. The AI learns your patterns.' },
            { icon: '🎨', title: 'Infinite Canvas', desc: 'No boundaries. Zoom, pan, and organize ideas across unlimited space.' },
            { icon: '👥', title: 'Real-Time Collab', desc: 'See cursors, edit together, and communicate without leaving the board.' },
            { icon: '📦', title: 'Template Library', desc: '100+ templates for sprints, retrospectives, user story maps, and more.' },
            { icon: '🔌', title: 'Integrations', desc: 'Connect with Jira, Notion, Slack, GitHub, and 50+ other tools.' },
            { icon: '🔒', title: 'Enterprise Ready', desc: 'SOC2, SSO, audit logs, and custom data residency options.' },
          ].map((f, i) => (
            <div key={i} className="ph-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#faf5ff', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#c4b5fd', opacity: 0.5, fontSize: '0.88rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#faf5ff', textAlign: 'center', marginBottom: 48 }}>What People Are Saying</h2>
        {[
          { name: 'Sarah K.', role: 'Product Lead at Stripe', text: '"FlowBoard replaced our Miro + Notion setup. The AI suggestions alone save us hours per sprint."', avatar: 'SK' },
          { name: 'Alex M.', role: 'Founder, DevTools Inc', text: '"We used FlowBoard for our Series B strategy session. The auto-clustering feature is mind-blowing."', avatar: 'AM' },
          { name: 'Priya R.', role: 'Design Director', text: '"Finally a whiteboard that doesn\'t feel like it was built in 2010. Clean, fast, and actually helpful."', avatar: 'PR' },
        ].map((t, i) => (
          <div key={i} className="ph-testimonial ph-card" style={{ animationDelay: `${i * 0.15}s`, marginBottom: 16 }}>
            <p style={{ fontSize: '1rem', color: '#e9d5ff', lineHeight: 1.7, marginBottom: 16 }}>{t.text}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${C}, #ec4899)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.7rem' }}>{t.avatar}</div>
              <div>
                <div style={{ fontWeight: 600, color: '#faf5ff', fontSize: '0.88rem' }}>{t.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#c4b5fd', opacity: 0.5 }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '80px 24px', background: `linear-gradient(180deg, transparent, ${C}08)` }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#faf5ff', marginBottom: 12 }}>Join the waitlist</h2>
        <p style={{ color: '#c4b5fd', opacity: 0.5, marginBottom: 28 }}>Be the first to try new features.</p>
        <div style={{ display: 'flex', gap: 8, maxWidth: 420, margin: '0 auto' }}>
          <input type="email" placeholder="your@email.com" style={{ flex: 1, padding: '14px 16px', borderRadius: 10, border: `1px solid ${C}22`, background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: '0.92rem', outline: 'none' }} />
          <button style={{ padding: '14px 24px', background: C, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Sign Up</button>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C}10`, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#475569' }}>Product Hunt &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
