const C = '#8b5cf6';
const BG = '#0a0815';

export default function CRMPanel() {
  const pipeline = [
    { stage: 'Lead', color: '#64748b', deals: [
      { name: 'Acme Corp', value: '$24K', contact: 'Sarah M.', days: 2 },
      { name: 'Globex Inc', value: '$18K', contact: 'John D.', days: 5 },
    ]},
    { stage: 'Qualified', color: '#f59e0b', deals: [
      { name: 'Initech', value: '$42K', contact: 'Priya R.', days: 3 },
    ]},
    { stage: 'Proposal', color: C, deals: [
      { name: 'Stark Ind', value: '$85K', contact: 'Tony S.', days: 1 },
      { name: 'Wayne Tech', value: '$120K', contact: 'Bruce W.', days: 4 },
    ]},
    { stage: 'Closed Won', color: '#10b981', deals: [
      { name: 'Pied Piper', value: '$35K', contact: 'Richard H.', days: 0 },
    ]},
  ];

  return (
    <div style={{ background: BG, color: '#e9d5ff', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes crmFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes crmSlideRight { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes crmPipeFlow { 0% { background-position:0 0; } 100% { background-position:40px 0; } }
        .crm-card { background:rgba(139,92,246,0.04); border:1px solid rgba(139,92,246,0.1); border-radius:14px; padding:24px; animation:crmFadeUp 0.6s ease-out both; transition:transform 0.3s; }
        .crm-card:hover { transform:translateY(-2px); }
        .crm-deal { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:14px; margin-bottom:8px; animation:crmSlideRight 0.5s ease-out both; cursor:grab; transition:border-color 0.2s; }
        .crm-deal:hover { border-color:${C}33; }
        .crm-stage { flex:1; min-width:200px; }
        .crm-pipe-bar { height:3px; background:repeating-linear-gradient(90deg,${C}44 0,${C}44 20px,transparent 20px,transparent 40px); background-size:40px 3px; animation:crmPipeFlow 1s linear infinite; border-radius:2px; }
      `}</style>

      <nav style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 40px',position:'fixed',top:0,left:0,right:0,zIndex:100,backdropFilter:'blur(12px)',background:`${BG}dd`}}>
        <div style={{fontWeight:800,fontSize:'1.15rem'}}><span style={{color:C}}>CRM</span>Panel</div>
        <div style={{display:'flex',gap:28,fontSize:'0.88rem',alignItems:'center'}}>
          {['Pipeline','Contacts','Reports'].map(l=><a key={l} href="#" style={{color:'#c4b5fd',opacity:0.6,textDecoration:'none'}}>{l}</a>)}
          <button style={{padding:'8px 20px',background:C,color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer'}}>Add Deal</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'0 24px'}}>
        <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',color:C,marginBottom:16}}>Sales CRM Platform</div>
        <h1 style={{fontSize:'clamp(2.5rem,5vw,4rem)',fontWeight:800,lineHeight:1.1,margin:'0 0 20px',color:'#faf5ff'}}>Close deals<br /><span style={{color:C}}>faster</span></h1>
        <p style={{fontSize:'1.1rem',color:'#c4b5fd',opacity:0.6,maxWidth:480,margin:'0 auto 16px',lineHeight:1.7}}>Visual pipeline, contact management, and activity tracking in one powerful CRM.</p>
        <div className="crm-pipe-bar" style={{maxWidth:300,marginBottom:32}} />
        <button style={{padding:'14px 32px',background:C,color:'#fff',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer'}}>Start Free Trial</button>
      </section>

      {/* Pipeline View */}
      <section style={{maxWidth:1200,margin:'0 auto',padding:'0 24px 80px'}}>
        <h2 style={{fontSize:'1.5rem',fontWeight:800,color:'#faf5ff',marginBottom:24}}>Sales Pipeline</h2>
        <div style={{display:'flex',gap:16,overflowX:'auto',paddingBottom:16}}>
          {pipeline.map((stage,si) => (
            <div key={si} className="crm-stage">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:stage.color}} />
                  <span style={{fontWeight:700,color:'#faf5ff',fontSize:'0.88rem'}}>{stage.stage}</span>
                </div>
                <span style={{fontSize:'0.75rem',color:'#c4b5fd',opacity:0.4}}>{stage.deals.length}</span>
              </div>
              {stage.deals.map((deal,di) => (
                <div key={di} className="crm-deal" style={{animationDelay:`${si*0.1+di*0.08}s`}}>
                  <div style={{fontWeight:600,color:'#faf5ff',fontSize:'0.88rem',marginBottom:4}}>{deal.name}</div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.78rem'}}>
                    <span style={{color:C,fontWeight:700}}>{deal.value}</span>
                    <span style={{color:'#c4b5fd',opacity:0.4}}>{deal.contact}</span>
                  </div>
                  {deal.days > 0 && <div style={{fontSize:'0.7rem',color:'#c4b5fd',opacity:0.3,marginTop:4}}>{deal.days}d in stage</div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{maxWidth:1100,margin:'0 auto',padding:'0 24px 100px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20}}>
          {[{icon:'🎯',title:'Visual Pipeline',desc:'Drag-and-drop deals across custom stages. See your entire funnel at a glance.'},{icon:'👥',title:'Contact Management',desc:'360° view of every contact with activity timeline and communication history.'},{icon:'📧',title:'Email Tracking',desc:'Know when prospects open emails. Automate follow-ups with smart sequences.'}].map((f,i)=>(
            <div key={i} className="crm-card" style={{animationDelay:`${i*0.12}s`}}>
              <div style={{fontSize:'2rem',marginBottom:12}}>{f.icon}</div>
              <h3 style={{fontSize:'1.05rem',fontWeight:700,color:'#faf5ff',marginBottom:8}}>{f.title}</h3>
              <p style={{color:'#c4b5fd',opacity:0.5,fontSize:'0.9rem',lineHeight:1.6}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{borderTop:`1px solid ${C}10`,padding:'40px 24px',textAlign:'center'}}>
        <div style={{fontSize:'0.82rem',color:'#475569'}}>CRM Panel &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
