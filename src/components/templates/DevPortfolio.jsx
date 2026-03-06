import { useEffect, useRef, useState } from 'react';

const C = '#14b8a6';
const BG = '#0a0f0d';

function MatrixRain({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = canvas.clientWidth;
    let h = canvas.height = canvas.clientHeight;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*(){}[]|/\\<>?;:~`'.split('');
    const fontSize = 14;
    const columns = Math.floor(w / fontSize);
    const drops = Array(columns).fill(1);

    let frame;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      ctx.fillStyle = `${BG}18`;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = `${C}55`;
      ctx.font = `${fontSize}px monospace`;
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, y * fontSize);
        if (y * fontSize > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    };
    draw();
    const onResize = () => { w = canvas.width = canvas.clientWidth; h = canvas.height = canvas.clientHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', onResize); };
  }, [canvasRef]);
  return null;
}

function TerminalTyping() {
  const lines = [
    { prompt: '~$', text: 'whoami', delay: 0 },
    { output: 'Alex Chen — Full Stack Developer', delay: 800 },
    { prompt: '~$', text: 'cat skills.txt', delay: 1600 },
    { output: 'TypeScript, React, Node.js, Python, Go, PostgreSQL, Docker, AWS', delay: 2400 },
    { prompt: '~$', text: 'echo $STATUS', delay: 3200 },
    { output: 'Open to new opportunities ✓', delay: 4000 },
  ];
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const timers = lines.map((_, i) =>
      setTimeout(() => setVisible(i + 1), lines[i].delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(20,184,166,0.15)', borderRadius: 12, overflow: 'hidden', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '0.82rem' }}>
      <div style={{ display: 'flex', gap: 6, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
        <span style={{ marginLeft: 8, fontSize: '0.72rem', color: '#5eead4', opacity: 0.4 }}>terminal</span>
      </div>
      <div style={{ padding: '16px 18px', minHeight: 180 }}>
        {lines.slice(0, visible).map((line, i) => (
          <div key={i} style={{ marginBottom: 4, display: 'flex', gap: 8 }}>
            {line.prompt && <span style={{ color: C }}>{line.prompt}</span>}
            {line.text && <span style={{ color: '#e2e8f0' }}>{line.text}</span>}
            {line.output && <span style={{ color: '#94a3b8', paddingLeft: line.prompt ? 0 : 0 }}>{line.output}</span>}
          </div>
        ))}
        {visible < lines.length && <span style={{ color: C, animation: 'devBlink 1s step-end infinite' }}>▌</span>}
      </div>
    </div>
  );
}

export default function DevPortfolio() {
  const canvasRef = useRef(null);
  const projects = [
    { name: 'CloudSync', desc: 'Real-time file sync engine with conflict resolution. Built with Go and WebSockets.', tags: ['Go', 'WebSockets', 'Redis'], stars: 342 },
    { name: 'QueryForge', desc: 'Visual SQL query builder with AI-powered optimization suggestions.', tags: ['TypeScript', 'React', 'PostgreSQL'], stars: 891 },
    { name: 'DeployBot', desc: 'GitHub bot that automates deployment pipelines with zero-config setup.', tags: ['Node.js', 'Docker', 'GitHub API'], stars: 1247 },
    { name: 'PixelML', desc: 'Image classification API with custom model training and real-time inference.', tags: ['Python', 'PyTorch', 'FastAPI'], stars: 567 },
  ];

  const skills = [
    { name: 'TypeScript', level: 95 }, { name: 'React', level: 92 },
    { name: 'Node.js', level: 90 }, { name: 'Python', level: 85 },
    { name: 'Go', level: 78 }, { name: 'PostgreSQL', level: 88 },
    { name: 'Docker', level: 82 }, { name: 'AWS', level: 80 },
  ];

  return (
    <div style={{ background: BG, color: '#ccfbf1', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes devFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes devBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes devSkillBar { from { width:0; } to { width:var(--level); } }
        .dev-card { background:rgba(20,184,166,0.04); border:1px solid rgba(20,184,166,0.1); border-radius:12px; padding:24px; animation:devFadeUp 0.6s ease-out both; transition:transform 0.3s,border-color 0.3s; }
        .dev-card:hover { transform:translateY(-3px); border-color:${C}33; }
        .dev-tag { display:inline-block; padding:3px 10px; border-radius:6px; background:rgba(20,184,166,0.1); color:${C}; font-size:0.72rem; font-weight:600; font-family:'JetBrains Mono','Fira Code',monospace; }
        .dev-skill-bar { height:6px; border-radius:3px; background:rgba(255,255,255,0.06); overflow:hidden; }
        .dev-skill-fill { height:100%; border-radius:3px; background:linear-gradient(90deg,${C},#06b6d4); animation:devSkillBar 1.5s ease-out both; }
      `}</style>

      <nav style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 40px',position:'fixed',top:0,left:0,right:0,zIndex:100,backdropFilter:'blur(12px)',background:`${BG}dd`}}>
        <div style={{fontWeight:800,fontSize:'1.1rem',fontFamily:"'JetBrains Mono','Fira Code',monospace",color:C}}>{'<'}alex{' />'}</div>
        <div style={{display:'flex',gap:28,fontSize:'0.85rem',alignItems:'center'}}>
          {['Projects','Skills','About','Contact'].map(l=><a key={l} href="#" style={{color:'#5eead4',opacity:0.6,textDecoration:'none'}}>{l}</a>)}
          <a href="#" style={{padding:'8px 16px',background:C,color:'#fff',borderRadius:8,fontWeight:600,textDecoration:'none',fontSize:'0.82rem'}}>Resume</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{position:'relative',minHeight:'100vh',display:'grid',gridTemplateColumns:'1fr 1fr',alignItems:'center',maxWidth:1200,margin:'0 auto',padding:'0 40px',gap:40}}>
        <canvas ref={canvasRef} style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.3,zIndex:0}} />
        <MatrixRain canvasRef={canvasRef} />
        <div style={{position:'relative',zIndex:1}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.15em',color:C,marginBottom:16,fontFamily:"'JetBrains Mono',monospace"}}>// Hello, World!</div>
          <h1 style={{fontSize:'clamp(2.5rem,5vw,3.8rem)',fontWeight:800,lineHeight:1.1,margin:'0 0 20px',color:'#f0fdfa',fontFamily:"'Space Grotesk',sans-serif"}}>
            Alex Chen
          </h1>
          <p style={{fontSize:'1.15rem',color:'#5eead4',opacity:0.6,maxWidth:440,lineHeight:1.7,marginBottom:32}}>
            Full Stack Developer crafting performant, scalable applications. Open source enthusiast with 3K+ GitHub stars.
          </p>
          <div style={{display:'flex',gap:12}}>
            <button style={{padding:'12px 24px',background:C,color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer',fontFamily:"'JetBrains Mono',monospace",fontSize:'0.82rem'}}>View Projects</button>
            <button style={{padding:'12px 24px',background:'transparent',color:C,border:`1px solid ${C}33`,borderRadius:8,fontWeight:600,cursor:'pointer',fontFamily:"'JetBrains Mono',monospace",fontSize:'0.82rem'}}>GitHub →</button>
          </div>
        </div>
        <div style={{position:'relative',zIndex:1}}>
          <TerminalTyping />
        </div>
      </section>

      {/* Projects */}
      <section style={{position:'relative',zIndex:1,maxWidth:1100,margin:'0 auto',padding:'80px 24px'}}>
        <h2 style={{fontSize:'2rem',fontWeight:800,color:'#f0fdfa',marginBottom:40,fontFamily:"'Space Grotesk',sans-serif"}}>Open Source Projects</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20}}>
          {projects.map((p,i)=>(
            <div key={i} className="dev-card" style={{animationDelay:`${i*0.1}s`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{fontWeight:700,color:'#f0fdfa',fontSize:'1.05rem',fontFamily:"'JetBrains Mono',monospace"}}>{p.name}</div>
                <div style={{display:'flex',alignItems:'center',gap:4,fontSize:'0.78rem',color:'#fbbf24'}}>⭐ {p.stars}</div>
              </div>
              <p style={{color:'#5eead4',opacity:0.5,fontSize:'0.88rem',lineHeight:1.6,marginBottom:16}}>{p.desc}</p>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {p.tags.map(t=><span key={t} className="dev-tag">{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section style={{position:'relative',zIndex:1,maxWidth:700,margin:'0 auto',padding:'0 24px 80px'}}>
        <h2 style={{fontSize:'2rem',fontWeight:800,color:'#f0fdfa',marginBottom:32,fontFamily:"'Space Grotesk',sans-serif"}}>Skills</h2>
        <div style={{display:'grid',gap:16}}>
          {skills.map((s,i)=>(
            <div key={i} style={{animation:'devFadeUp 0.5s ease-out both',animationDelay:`${i*0.06}s`}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontWeight:600,color:'#f0fdfa',fontSize:'0.88rem',fontFamily:"'JetBrains Mono',monospace"}}>{s.name}</span>
                <span style={{fontSize:'0.78rem',color:C}}>{s.level}%</span>
              </div>
              <div className="dev-skill-bar"><div className="dev-skill-fill" style={{'--level':`${s.level}%`}} /></div>
            </div>
          ))}
        </div>
      </section>

      {/* Code Snippet */}
      <section style={{position:'relative',zIndex:1,maxWidth:700,margin:'0 auto',padding:'0 24px 80px'}}>
        <div style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(20,184,166,0.12)',borderRadius:12,overflow:'hidden',fontFamily:"'JetBrains Mono','Fira Code',monospace",fontSize:'0.78rem'}}>
          <div style={{padding:'10px 16px',background:'rgba(255,255,255,0.03)',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{color:'#5eead4',opacity:0.5}}>about.ts</span>
            <span style={{fontSize:'0.68rem',color:'#5eead4',opacity:0.3}}>TypeScript</span>
          </div>
          <pre style={{padding:'16px 18px',margin:0,color:'#e2e8f0',lineHeight:1.8,overflow:'auto'}}>
{`interface Developer {
  name: string;
  location: string;
  experience: number;
  passions: string[];
}

const alex: Developer = {
  name: "Alex Chen",
  location: "San Francisco, CA",
  experience: 8, // years
  passions: [
    "open-source",
    "system-design",
    "developer-experience",
  ],
};`}
          </pre>
        </div>
      </section>

      {/* Contact */}
      <section style={{position:'relative',zIndex:1,textAlign:'center',padding:'80px 24px',background:`linear-gradient(180deg,transparent,${C}06)`}}>
        <h2 style={{fontSize:'2rem',fontWeight:800,color:'#f0fdfa',marginBottom:12,fontFamily:"'Space Grotesk',sans-serif"}}>Let's build something</h2>
        <p style={{color:'#5eead4',opacity:0.5,marginBottom:32}}>Open to freelance, consulting, and full-time roles.</p>
        <button style={{padding:'14px 32px',background:C,color:'#fff',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer'}}>Get in Touch</button>
      </section>

      <footer style={{position:'relative',zIndex:1,borderTop:`1px solid ${C}10`,padding:'40px 24px',textAlign:'center'}}>
        <div style={{fontSize:'0.82rem',color:'#475569'}}>Dev Portfolio &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
