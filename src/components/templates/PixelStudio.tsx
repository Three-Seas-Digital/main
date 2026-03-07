import { useEffect, useRef } from 'react';

const C = '#6366f1';
const BG = '#08081a';

function CursorTrail() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const trail = [];
    const maxTrail = 30;
    let mx = w/2, my = h/2;

    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', onMove);
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    let frame;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      trail.push({ x: mx, y: my, life: 1 });
      if (trail.length > maxTrail) trail.shift();
      ctx.clearRect(0, 0, w, h);
      trail.forEach((p, i) => {
        p.life -= 0.03;
        if (p.life <= 0) return;
        const size = p.life * 16;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.life * 0.3})`;
        ctx.fill();
      });
    };
    draw();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('mousemove', onMove); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

export default function PixelStudio() {
  const caseStudies = [
    { client: 'Modernize', type: 'Brand Identity', year: '2025', desc: 'Complete visual rebrand for a fintech startup.' },
    { client: 'Zenith App', type: 'Product Design', year: '2025', desc: 'UI/UX for a meditation and wellness application.' },
    { client: 'Volt Motors', type: 'Website', year: '2024', desc: 'E-commerce platform for an electric vehicle brand.' },
    { client: 'Aura Music', type: 'Brand + Web', year: '2024', desc: 'Identity and streaming platform design for indie label.' },
  ];

  return (
    <div style={{ background: BG, color: '#e0e7ff', fontFamily: "'Space Grotesk', 'Inter', sans-serif", minHeight: '100vh', position: 'relative' }}>
      <CursorTrail />
      <style>{`
        @keyframes pxReveal { from { clip-path:inset(0 100% 0 0); } to { clip-path:inset(0 0 0 0); } }
        @keyframes pxFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pxTypeIn { from { width:0; } to { width:100%; } }
        .px-case { padding:32px 0; border-bottom:1px solid rgba(99,102,241,0.08); display:grid; grid-template-columns:120px 1fr auto; gap:24px; align-items:center; animation:pxFadeUp 0.5s ease-out both; transition:background 0.3s; cursor:pointer; }
        .px-case:hover { background:rgba(99,102,241,0.03); }
        .px-card { background:rgba(99,102,241,0.04); border:1px solid rgba(99,102,241,0.1); border-radius:14px; padding:28px; animation:pxFadeUp 0.6s ease-out both; }
      `}</style>

      <nav style={{ position:'relative',zIndex:2,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'24px 48px'}}>
        <div style={{fontWeight:800,fontSize:'1.3rem',color:'#fff'}}>PIXEL<span style={{color:C}}>.</span></div>
        <div style={{display:'flex',gap:32,fontSize:'0.82rem',alignItems:'center'}}>
          {['Work','Services','About','Contact'].map(l=><a key={l} href="#" style={{color:'#a5b4fc',opacity:0.6,textDecoration:'none',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600}}>{l}</a>)}
        </div>
      </nav>

      {/* Hero */}
      <section style={{position:'relative',zIndex:1,minHeight:'90vh',display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 48px',maxWidth:1200,margin:'0 auto'}}>
        <div style={{overflow:'hidden'}}>
          <h1 style={{fontSize:'clamp(4rem,10vw,8rem)',fontWeight:800,lineHeight:0.95,color:'#fff',margin:0,animation:'pxReveal 1s ease-out both'}}>
            We make
          </h1>
        </div>
        <div style={{overflow:'hidden'}}>
          <h1 style={{fontSize:'clamp(4rem,10vw,8rem)',fontWeight:800,lineHeight:0.95,color:C,margin:0,animation:'pxReveal 1s ease-out 0.15s both'}}>
            brands bold.
          </h1>
        </div>
        <p style={{fontSize:'1.1rem',color:'#a5b4fc',opacity:0.5,maxWidth:500,lineHeight:1.7,marginTop:32,fontFamily:"'Inter', sans-serif"}}>
          Creative agency specializing in brand identity, product design, and digital experiences that captivate.
        </p>
        <div style={{marginTop:32}}>
          <button style={{padding:'14px 32px',background:C,color:'#fff',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer'}}>View Our Work</button>
        </div>
      </section>

      {/* Case Studies */}
      <section style={{position:'relative',zIndex:1,maxWidth:1000,margin:'0 auto',padding:'80px 48px'}}>
        <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',color:C,marginBottom:8}}>Selected Work</div>
        <h2 style={{fontSize:'2rem',fontWeight:800,color:'#fff',marginBottom:40}}>Case Studies</h2>
        {caseStudies.map((cs,i)=>(
          <div key={i} className="px-case" style={{animationDelay:`${i*0.12}s`}}>
            <div style={{fontSize:'0.82rem',color:'#a5b4fc',opacity:0.4,fontFamily:"'Inter', sans-serif"}}>{cs.year}</div>
            <div>
              <div style={{fontWeight:700,color:'#fff',fontSize:'1.2rem',marginBottom:4}}>{cs.client}</div>
              <div style={{fontSize:'0.88rem',color:'#a5b4fc',opacity:0.5,fontFamily:"'Inter', sans-serif"}}>{cs.desc}</div>
            </div>
            <div style={{fontSize:'0.75rem',padding:'4px 12px',borderRadius:20,background:`${C}12`,color:C,fontWeight:600,fontFamily:"'Inter', sans-serif"}}>{cs.type}</div>
          </div>
        ))}
      </section>

      {/* Services */}
      <section style={{position:'relative',zIndex:1,maxWidth:1100,margin:'0 auto',padding:'0 48px 100px'}}>
        <h2 style={{fontSize:'2rem',fontWeight:800,color:'#fff',textAlign:'center',marginBottom:48}}>What We Do</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20}}>
          {[{title:'Brand Identity',desc:'Logo, visual system, and brand guidelines that make you unforgettable.',num:'01'},{title:'Product Design',desc:'User-centered UI/UX for apps and platforms that people actually love.',num:'02'},{title:'Web Development',desc:'Custom websites built with cutting-edge tech and beautiful craft.',num:'03'},{title:'Motion Design',desc:'Animation and video that bring your brand story to life.',num:'04'}].map((s,i)=>(
            <div key={i} className="px-card" style={{animationDelay:`${i*0.1}s`}}>
              <div style={{fontSize:'2rem',fontWeight:800,color:C,opacity:0.3,marginBottom:16}}>{s.num}</div>
              <h3 style={{fontSize:'1.1rem',fontWeight:700,color:'#fff',marginBottom:8}}>{s.title}</h3>
              <p style={{color:'#a5b4fc',opacity:0.5,fontSize:'0.9rem',lineHeight:1.6,fontFamily:"'Inter', sans-serif"}}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{position:'relative',zIndex:1,textAlign:'center',padding:'100px 24px'}}>
        <h2 style={{fontSize:'clamp(2rem,5vw,3.5rem)',fontWeight:800,color:'#fff',marginBottom:12}}>Got a project?</h2>
        <p style={{color:'#a5b4fc',opacity:0.5,marginBottom:32,fontFamily:"'Inter', sans-serif"}}>Let's make something bold together.</p>
        <button style={{padding:'16px 40px',background:C,color:'#fff',border:'none',borderRadius:12,fontWeight:700,fontSize:'1rem',cursor:'pointer'}}>Start a Project</button>
      </section>

      <footer style={{position:'relative',zIndex:1,borderTop:`1px solid ${C}10`,padding:'40px 24px',textAlign:'center'}}>
        <div style={{fontSize:'0.82rem',color:'#475569',fontFamily:"'Inter', sans-serif"}}>Pixel Studio &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
