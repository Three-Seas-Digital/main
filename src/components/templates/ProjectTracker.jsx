import { useState } from 'react';

const C = '#10b981';
const BG = '#060f0b';

export default function ProjectTracker() {
  const [activeView, setActiveView] = useState('board');
  const columns = [
    { title: 'To Do', color: '#64748b', tasks: [
      { title: 'Design system audit', priority: 'High', tag: 'Design', assignee: 'AK' },
      { title: 'API documentation', priority: 'Medium', tag: 'Backend', assignee: 'JL' },
    ]},
    { title: 'In Progress', color: '#f59e0b', tasks: [
      { title: 'User auth flow', priority: 'High', tag: 'Frontend', assignee: 'PS' },
      { title: 'Database migration', priority: 'High', tag: 'Backend', assignee: 'RC' },
      { title: 'Landing page redesign', priority: 'Low', tag: 'Design', assignee: 'AK' },
    ]},
    { title: 'Review', color: C, tasks: [
      { title: 'Payment integration', priority: 'High', tag: 'Backend', assignee: 'JL' },
    ]},
    { title: 'Done', color: '#10b981', tasks: [
      { title: 'CI/CD pipeline', priority: 'Medium', tag: 'DevOps', assignee: 'RC' },
      { title: 'Onboarding flow', priority: 'Medium', tag: 'Frontend', assignee: 'PS' },
    ]},
  ];

  const priorityColor = { High: '#ef4444', Medium: '#f59e0b', Low: '#64748b' };

  return (
    <div style={{ background: BG, color: '#d1fae5', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes ptFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ptSlideIn { from { opacity:0; transform:translateY(20px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes ptProgress { from { width:0; } to { width:var(--prog); } }
        .pt-task { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:14px; margin-bottom:8px; cursor:grab; transition:border-color 0.2s,transform 0.2s; animation:ptSlideIn 0.5s ease-out both; }
        .pt-task:hover { border-color:${C}33; transform:translateY(-1px); }
        .pt-card { background:rgba(16,185,129,0.04); border:1px solid rgba(16,185,129,0.1); border-radius:14px; padding:24px; animation:ptFadeUp 0.6s ease-out both; }
        .pt-progress-bar { height:6px; border-radius:3px; background:rgba(255,255,255,0.06); overflow:hidden; }
        .pt-progress-fill { height:100%; border-radius:3px; background:${C}; animation:ptProgress 1.5s ease-out both; }
      `}</style>

      <nav style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 40px',position:'fixed',top:0,left:0,right:0,zIndex:100,backdropFilter:'blur(12px)',background:`${BG}dd`}}>
        <div style={{fontWeight:800,fontSize:'1.15rem'}}><span style={{color:C}}>Project</span>Tracker</div>
        <div style={{display:'flex',gap:28,fontSize:'0.88rem',alignItems:'center'}}>
          {['Board','Timeline','Team'].map(l=><a key={l} href="#" style={{color:'#6ee7b7',opacity:0.6,textDecoration:'none'}}>{l}</a>)}
          <button style={{padding:'8px 20px',background:C,color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer'}}>+ New Task</button>
        </div>
      </nav>

      <section style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'0 24px'}}>
        <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',color:C,marginBottom:16}}>Project Management</div>
        <h1 style={{fontSize:'clamp(2.5rem,5vw,4rem)',fontWeight:800,lineHeight:1.1,margin:'0 0 20px',color:'#ecfdf5'}}>Ship projects<br /><span style={{color:C}}>on time, every time</span></h1>
        <p style={{fontSize:'1.1rem',color:'#6ee7b7',opacity:0.6,maxWidth:480,margin:'0 auto 36px',lineHeight:1.7}}>Kanban boards, time tracking, sprint planning, and team workload — all in one place.</p>
        <button style={{padding:'14px 32px',background:C,color:'#fff',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer'}}>Try Free</button>
      </section>

      {/* Kanban Board */}
      <section style={{maxWidth:1200,margin:'0 auto',padding:'0 24px 80px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <h2 style={{fontSize:'1.3rem',fontWeight:800,color:'#ecfdf5'}}>Sprint 14 — Product Launch</h2>
          <div style={{display:'flex',gap:4,background:'rgba(255,255,255,0.04)',borderRadius:8,padding:4}}>
            {['board','list'].map(v=><button key={v} onClick={()=>setActiveView(v)} style={{padding:'6px 14px',borderRadius:6,border:'none',background:activeView===v?`${C}22`:'transparent',color:activeView===v?C:'#6ee7b7',fontWeight:600,fontSize:'0.78rem',cursor:'pointer',textTransform:'capitalize'}}>{v}</button>)}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.78rem',color:'#6ee7b7',opacity:0.5,marginBottom:6}}>
            <span>Sprint Progress</span><span>68%</span>
          </div>
          <div className="pt-progress-bar"><div className="pt-progress-fill" style={{'--prog':'68%'}} /></div>
        </div>

        <div style={{display:'flex',gap:16,overflowX:'auto',paddingBottom:16}}>
          {columns.map((col,ci)=>(
            <div key={ci} style={{flex:1,minWidth:220}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:col.color}} />
                  <span style={{fontWeight:700,color:'#ecfdf5',fontSize:'0.85rem'}}>{col.title}</span>
                </div>
                <span style={{fontSize:'0.72rem',color:'#6ee7b7',opacity:0.4,background:'rgba(255,255,255,0.04)',padding:'2px 8px',borderRadius:10}}>{col.tasks.length}</span>
              </div>
              {col.tasks.map((task,ti)=>(
                <div key={ti} className="pt-task" style={{animationDelay:`${ci*0.1+ti*0.06}s`}}>
                  <div style={{fontWeight:600,color:'#ecfdf5',fontSize:'0.85rem',marginBottom:8}}>{task.title}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{display:'flex',gap:6}}>
                      <span style={{fontSize:'0.68rem',padding:'2px 8px',borderRadius:4,background:`${priorityColor[task.priority]}18`,color:priorityColor[task.priority],fontWeight:600}}>{task.priority}</span>
                      <span style={{fontSize:'0.68rem',padding:'2px 8px',borderRadius:4,background:'rgba(255,255,255,0.04)',color:'#6ee7b7',opacity:0.6}}>{task.tag}</span>
                    </div>
                    <div style={{width:24,height:24,borderRadius:'50%',background:`${C}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.55rem',fontWeight:700,color:C}}>{task.assignee}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{maxWidth:1100,margin:'0 auto',padding:'0 24px 100px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20}}>
          {[{icon:'📋',title:'Kanban Boards',desc:'Visual task management with custom columns, labels, and priorities.'},{icon:'⏱',title:'Time Tracking',desc:'Built-in timer with automatic timesheet generation and reporting.'},{icon:'📊',title:'Sprint Analytics',desc:'Velocity charts, burndown tracking, and team performance metrics.'}].map((f,i)=>(
            <div key={i} className="pt-card" style={{animationDelay:`${i*0.12}s`}}>
              <div style={{fontSize:'2rem',marginBottom:12}}>{f.icon}</div>
              <h3 style={{fontSize:'1.05rem',fontWeight:700,color:'#ecfdf5',marginBottom:8}}>{f.title}</h3>
              <p style={{color:'#6ee7b7',opacity:0.5,fontSize:'0.9rem',lineHeight:1.6}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{borderTop:`1px solid ${C}10`,padding:'40px 24px',textAlign:'center'}}>
        <div style={{fontSize:'0.82rem',color:'#475569'}}>Project Tracker &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
