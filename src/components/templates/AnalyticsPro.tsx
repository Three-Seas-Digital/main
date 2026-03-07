import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const C = '#0ea5e9';
const BG = '#060d14';

function BarChart3D({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(4, 3, 4);
    camera.lookAt(0, 0.5, 0);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const mat = new THREE.MeshStandardMaterial({ color: C, emissive: C, emissiveIntensity: 0.2, metalness: 0.4, roughness: 0.3 });
    const geo = new THREE.BoxGeometry(0.4, 1, 0.4);
    const bars = [];
    const data = [0.3, 0.6, 0.45, 0.8, 0.55, 0.9, 0.7, 1.0, 0.65, 0.85];
    data.forEach((h, i) => {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.position.set((i - data.length / 2) * 0.55, 0, 0);
      mesh.scale.y = 0.01;
      mesh.userData = { targetH: h * 2.5, phase: i * 0.3 };
      scene.add(mesh);
      bars.push(mesh);
    });

    // Grid floor
    const gridHelper = new THREE.GridHelper(8, 16, 0x0ea5e9, 0x0ea5e9);
    gridHelper.material.opacity = 0.05;
    gridHelper.material.transparent = true;
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 0.7);
    dl.position.set(3, 5, 3);
    scene.add(dl);

    let frame, startT = 0;
    const animate = (t) => {
      frame = requestAnimationFrame(animate);
      if (!startT) startT = t;
      const elapsed = (t - startT) * 0.001;
      bars.forEach(b => {
        const progress = Math.min(1, Math.max(0, (elapsed - b.userData.phase) / 1.2));
        const eased = 1 - Math.pow(1 - progress, 3);
        b.scale.y = Math.max(0.01, b.userData.targetH * eased);
        b.position.y = b.scale.y / 2;
        b.material.emissiveIntensity = 0.15 + 0.15 * Math.sin(t * 0.002 + b.userData.phase);
      });
      camera.position.x = 4 + Math.sin(t * 0.0003) * 0.5;
      camera.lookAt(0, 0.5, 0);
      renderer.render(scene, camera);
    };
    animate(0);
    const onResize = () => {
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', onResize); renderer.dispose(); };
  }, [canvasRef]);
  return null;
}

function Counter({ end, prefix = '', suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { obs.disconnect(); const s = performance.now(); const tick = n => { const p = Math.min((n-s)/2000,1); setVal(Math.round(end*(1-Math.pow(1-p,3)))); if(p<1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

export default function AnalyticsPro() {
  const canvasRef = useRef(null);

  return (
    <div style={{ background: BG, color: '#bae6fd', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes apFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes apDataStream { 0% { opacity:0; transform:translateX(-100%); } 50% { opacity:1; } 100% { opacity:0; transform:translateX(100%); } }
        .ap2-card { background:rgba(14,165,233,0.04); border:1px solid rgba(14,165,233,0.1); border-radius:14px; padding:24px; animation:apFadeUp 0.6s ease-out both; transition:transform 0.3s; }
        .ap2-card:hover { transform:translateY(-2px); }
        .ap2-kpi { text-align:center; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:14px; padding:28px; }
        .ap2-stream { height:2px; background:linear-gradient(90deg,transparent,${C},transparent); animation:apDataStream 3s linear infinite; border-radius:2px; }
      `}</style>

      <nav style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 40px',position:'fixed',top:0,left:0,right:0,zIndex:100,backdropFilter:'blur(12px)',background:`${BG}dd`}}>
        <div style={{fontWeight:800,fontSize:'1.15rem'}}><span style={{color:C}}>Analytics</span>Pro</div>
        <div style={{display:'flex',gap:28,fontSize:'0.88rem',alignItems:'center'}}>
          {['Dashboard','Reports','Integrations'].map(l=><a key={l} href="#" style={{color:'#7dd3fc',opacity:0.6,textDecoration:'none'}}>{l}</a>)}
        </div>
      </nav>

      <section style={{position:'relative',minHeight:'100vh',display:'grid',gridTemplateColumns:'1fr 1fr',alignItems:'center',maxWidth:1200,margin:'0 auto',padding:'0 40px'}}>
        <div style={{zIndex:1}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',color:C,marginBottom:16}}>Real-Time Analytics</div>
          <h1 style={{fontSize:'clamp(2.5rem,4.5vw,3.5rem)',fontWeight:800,lineHeight:1.1,margin:'0 0 20px',color:'#f0f9ff'}}>Data insights that drive decisions</h1>
          <p style={{fontSize:'1.05rem',color:'#7dd3fc',opacity:0.6,maxWidth:440,lineHeight:1.7,marginBottom:16}}>KPI dashboards, trend analysis, and custom reporting for data-driven teams.</p>
          <div className="ap2-stream" style={{maxWidth:300,marginBottom:32}} />
          <button style={{padding:'14px 28px',background:C,color:'#fff',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer'}}>Start Free Trial</button>
        </div>
        <div style={{height:'80vh'}}><canvas ref={canvasRef} style={{width:'100%',height:'100%'}} /><BarChart3D canvasRef={canvasRef} /></div>
      </section>

      <section style={{maxWidth:1000,margin:'0 auto',padding:'40px 24px 80px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20}}>
          {[{l:'Active Users',v:24500},{l:'Events/Day',v:1200000,suffix:'+'},{l:'Avg Load Time',v:120,suffix:'ms'},{l:'Uptime',v:99,suffix:'.99%'}].map((k,i)=>(
            <div key={i} className="ap2-kpi" style={{animation:'apFadeUp 0.6s ease-out both',animationDelay:`${i*0.1}s`}}>
              <div style={{fontSize:'0.78rem',color:'#7dd3fc',opacity:0.5,marginBottom:8}}>{k.l}</div>
              <div style={{fontSize:'2rem',fontWeight:800,color:'#f0f9ff'}}><Counter end={k.v} suffix={k.suffix||''} /></div>
            </div>
          ))}
        </div>
      </section>

      <section style={{maxWidth:1100,margin:'0 auto',padding:'0 24px 100px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20}}>
          {[{icon:'📊',title:'Custom Dashboards',desc:'Drag-and-drop dashboard builder with 50+ widget types.'},{icon:'🔔',title:'Smart Alerts',desc:'Anomaly detection that notifies you before issues become problems.'},{icon:'📤',title:'Export Anywhere',desc:'PDF, CSV, API webhooks — get data where you need it.'}].map((f,i)=>(
            <div key={i} className="ap2-card" style={{animationDelay:`${i*0.12}s`}}>
              <div style={{fontSize:'2rem',marginBottom:12}}>{f.icon}</div>
              <h3 style={{fontSize:'1.05rem',fontWeight:700,color:'#f0f9ff',marginBottom:8}}>{f.title}</h3>
              <p style={{color:'#7dd3fc',opacity:0.5,fontSize:'0.9rem',lineHeight:1.6}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{borderTop:`1px solid ${C}10`,padding:'40px 24px',textAlign:'center'}}>
        <div style={{fontSize:'0.82rem',color:'#475569'}}>Analytics Pro &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
