import { useState } from 'react';

const C = '#d946ef';
const BG = '#0d0510';

export default function ArtisanGallery() {
  const [filter, setFilter] = useState('all');
  const works = [
    { title: 'Ethereal Bloom', cat: 'painting', ratio: '4/5', color: '#d946ef' },
    { title: 'Urban Geometry', cat: 'photography', ratio: '3/4', color: '#8b5cf6' },
    { title: 'Ocean Whisper', cat: 'painting', ratio: '1/1', color: '#06b6d4' },
    { title: 'Neon Dreams', cat: 'digital', ratio: '4/3', color: '#f43f5e' },
    { title: 'Silent Forest', cat: 'photography', ratio: '3/4', color: '#10b981' },
    { title: 'Abstract Flow', cat: 'digital', ratio: '1/1', color: '#f59e0b' },
    { title: 'Golden Hour', cat: 'photography', ratio: '4/5', color: '#ef4444' },
    { title: 'Chromatic Pulse', cat: 'digital', ratio: '4/3', color: '#3b82f6' },
    { title: 'Marble Veins', cat: 'painting', ratio: '3/4', color: '#6366f1' },
  ];
  const filtered = filter === 'all' ? works : works.filter(w => w.cat === filter);

  return (
    <div style={{ background: BG, color: '#f5d0fe', fontFamily: "'Space Grotesk', 'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes agFadeUp { from { opacity:0; transform:translateY(20px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes agReveal { from { clip-path:inset(100% 0 0 0); } to { clip-path:inset(0); } }
        .ag-item { border-radius:12px; overflow:hidden; animation:agFadeUp 0.6s ease-out both; cursor:pointer; position:relative; }
        .ag-item:hover .ag-overlay { opacity:1; }
        .ag-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0; transition:opacity 0.3s; }
        .ag-img { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:2.5rem; }
      `}</style>

      <nav style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'24px 48px',position:'fixed',top:0,left:0,right:0,zIndex:100,backdropFilter:'blur(12px)',background:`${BG}dd`}}>
        <div style={{fontWeight:800,fontSize:'1.2rem'}}>Artisan<span style={{color:C}}>.</span></div>
        <div style={{display:'flex',gap:28,fontSize:'0.85rem',alignItems:'center'}}>
          {['Gallery','About','Contact'].map(l=><a key={l} href="#" style={{color:'#e879f9',opacity:0.6,textDecoration:'none'}}>{l}</a>)}
        </div>
      </nav>

      {/* Hero */}
      <section style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'0 24px'}}>
        <h1 style={{fontSize:'clamp(3.5rem,8vw,6rem)',fontWeight:800,lineHeight:1,margin:'0 0 12px',color:'#fdf4ff',letterSpacing:'-0.02em'}}>
          Art<span style={{color:C}}>.</span>
        </h1>
        <p style={{fontSize:'1.1rem',color:'#e879f9',opacity:0.5,maxWidth:400,lineHeight:1.7,fontFamily:"'Inter', sans-serif"}}>
          A curated collection of works exploring color, form, and emotion.
        </p>
        <div style={{width:60,height:2,background:C,margin:'32px auto 0',opacity:0.5}} />
      </section>

      {/* Filter */}
      <section style={{maxWidth:1200,margin:'0 auto',padding:'0 24px 24px'}}>
        <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:40}}>
          {['all','painting','photography','digital'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:'8px 20px',borderRadius:20,border:`1px solid ${filter===f?C:'rgba(255,255,255,0.08)'}`,background:filter===f?`${C}15`:'transparent',color:filter===f?C:'#e879f9',fontWeight:600,fontSize:'0.82rem',cursor:'pointer',textTransform:'capitalize',fontFamily:"'Inter', sans-serif"}}>
              {f}
            </button>
          ))}
        </div>

        {/* Masonry Grid */}
        <div style={{columns:'3 300px',gap:16}}>
          {filtered.map((w,i)=>(
            <div key={`${w.title}-${filter}`} className="ag-item" style={{animationDelay:`${i*0.08}s`,breakInside:'avoid',marginBottom:16,aspectRatio:w.ratio,background:`linear-gradient(135deg,${w.color}22,${w.color}08)`}}>
              <div className="ag-img" style={{background:`linear-gradient(135deg,${w.color}30,${w.color}10)`}}>
                <span style={{opacity:0.15,fontSize:'4rem'}}>🎨</span>
              </div>
              <div className="ag-overlay">
                <div style={{fontWeight:700,color:'#fff',fontSize:'1.1rem',marginBottom:4}}>{w.title}</div>
                <div style={{fontSize:'0.78rem',color:C,textTransform:'capitalize'}}>{w.cat}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section style={{maxWidth:700,margin:'0 auto',padding:'80px 24px',textAlign:'center'}}>
        <div style={{width:80,height:80,borderRadius:'50%',background:`linear-gradient(135deg,${C},#8b5cf6)`,margin:'0 auto 24px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:'1.5rem'}}>EM</div>
        <h2 style={{fontSize:'1.8rem',fontWeight:700,color:'#fdf4ff',marginBottom:8}}>Elena Martinez</h2>
        <p style={{color:C,fontSize:'0.88rem',fontWeight:600,marginBottom:16,fontFamily:"'Inter', sans-serif"}}>Visual Artist & Photographer</p>
        <p style={{color:'#e879f9',opacity:0.5,lineHeight:1.8,fontFamily:"'Inter', sans-serif",fontSize:'0.95rem'}}>
          Based in Barcelona. Exploring the intersection of light, color, and human emotion through painting, photography, and digital art. Exhibited in galleries across Europe and North America.
        </p>
      </section>

      {/* Contact */}
      <section style={{textAlign:'center',padding:'80px 24px',background:`linear-gradient(180deg,transparent,${C}06)`}}>
        <h2 style={{fontSize:'2rem',fontWeight:800,color:'#fdf4ff',marginBottom:12}}>Get in Touch</h2>
        <p style={{color:'#e879f9',opacity:0.5,marginBottom:32,fontFamily:"'Inter', sans-serif"}}>Commissions, exhibitions, and collaborations welcome.</p>
        <button style={{padding:'14px 36px',background:C,color:'#fff',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer',fontFamily:"'Inter', sans-serif"}}>Contact Me</button>
      </section>

      <footer style={{borderTop:`1px solid ${C}10`,padding:'40px 24px',textAlign:'center'}}>
        <div style={{fontSize:'0.82rem',color:'#475569',fontFamily:"'Inter', sans-serif"}}>Artisan Gallery &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
