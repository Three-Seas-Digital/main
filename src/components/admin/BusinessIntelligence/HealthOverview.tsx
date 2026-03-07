import { useState, useMemo } from 'react';
import { Grid3x3, TrendingUp, TrendingDown } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { safeGetItem } from '../../../constants';

const AUDITS_KEY = 'threeseas_bi_audits';
const CATS = [{id:'cat-seo',name:'SEO'},{id:'cat-design',name:'Design'},{id:'cat-content',name:'Content'},{id:'cat-tech',name:'Technical'},{id:'cat-social',name:'Social'}];

const cellBg = (s: string | undefined) => {
  if(!s||s==="--")return "#f3f4f6";const n=parseFloat(s);
  if(n<=3)return "rgba(239,68,68,"+(0.2+n*0.1)+")";
  if(n<=6)return "rgba(245,158,11,"+(0.2+(n-3)*0.1)+")";
  return "rgba(34,197,94,"+(0.2+(n-6)*0.1)+")";
};

interface HealthOverviewProps {
  biClientId: string | null;
  onBiClientChange: (id: string) => void;
}

export default function HealthOverview({ biClientId, onBiClientChange }: HealthOverviewProps) {
  const { clients } = useAppContext();
  const [sortBy, setSortBy] = useState('name');
  const [filterTier, setFilterTier] = useState('all');
  const [selectedCell, setSelectedCell] = useState<any>(null);
  const activeClients = clients.filter(c => c.status !== 'archived' && c.status !== 'rejected');
  const allAudits = useMemo(() => safeGetItem(AUDITS_KEY, []), []); // eslint-disable-line react-hooks/exhaustive-deps -- re-reads on remount

  const gridData = useMemo(() => {
    return activeClients.map(client => {
      const latest = allAudits.filter((a: any) => a.clientId === client.id).sort((a: any, b: any) => new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())[0];
      const catScores = {};
      if (latest && latest.scores) {
        CATS.forEach(cat => {
          const pre = cat.id.replace('cat-','sc-');
          const vals = Object.entries(latest.scores).filter(([k])=>k.startsWith(pre)).map(([,v])=>v as number).filter((v: number)=>v>0);
          catScores[cat.id] = vals.length ? (vals.reduce((a: number, b: number)=>a+b,0)/vals.length).toFixed(1) : '--';
        });
      }
      const allVals = Object.values(catScores).map((v: any)=>parseFloat(v)).filter((v: number)=>!isNaN(v));
      const overall = allVals.length ? (allVals.reduce((a,b)=>a+b,0)/allVals.length).toFixed(1) : '--';
      return { client, catScores, overall };
    });
  }, [activeClients, allAudits]);

  const sorted = useMemo(() => {
    let d = [...gridData];
    if (filterTier !== 'all') d = d.filter(x => (x.client.tier||'free') === filterTier);
    if (sortBy === 'name') d.sort((a,b) => a.client.name.localeCompare(b.client.name));
    else if (sortBy === 'score') d.sort((a,b) => (parseFloat(b.overall)||0)-(parseFloat(a.overall)||0));
    else { const catId = sortBy; d.sort((a,b) => (parseFloat(b.catScores[catId])||0)-(parseFloat(a.catScores[catId])||0)); }
    return d;
  }, [gridData, sortBy, filterTier]);

  const stats = useMemo(() => {
    const scores = gridData.map(d=>parseFloat(d.overall)).filter(n=>!isNaN(n));
    const avg = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : '--';
    let best='--',worst='--';
    if (gridData.length > 0) {
      const catAvgs = CATS.map(cat => {
        const vs = gridData.map(d=>parseFloat(d.catScores[cat.id])).filter(n=>!isNaN(n));
        return { name: cat.name, avg: vs.length ? vs.reduce((a,b)=>a+b,0)/vs.length : 0 };
      }).filter(c=>c.avg>0);
      if (catAvgs.length) { catAvgs.sort((a,b)=>b.avg-a.avg); best=catAvgs[0].name; worst=catAvgs[catAvgs.length-1].name; }
    }
    return { avg, best, worst };
  }, [gridData]);

  return (
    <div className="bi-health-overview">
      <div className="bi-header"><h3><Grid3x3 size={20} /> Health Overview</h3></div>
      <div className="bi-stats-row">
        <div className="bi-stat"><span>{stats.avg}</span><small>Avg Score</small></div>
        <div className="bi-stat"><TrendingUp size={16} /><span>{stats.best}</span><small>Strongest</small></div>
        <div className="bi-stat"><TrendingDown size={16} /><span>{stats.worst}</span><small>Weakest</small></div>
      </div>
      <div className="bi-filter-bar">
        <select value={filterTier} onChange={e=>setFilterTier(e.target.value)}>
          <option value="all">All Tiers</option>
          <option value="free">Free</option><option value="basic">Basic</option>
          <option value="premium">Premium</option><option value="enterprise">Enterprise</option>
        </select>
      </div>
      <div className="bi-heatmap">
        {sorted.map(d=>(
          <div key={d.client.id} className={`bi-heatmap-row${d.client.id === biClientId ? ' highlighted' : ''}`} onClick={() => onBiClientChange?.(d.client.id)}>
            <div className="bi-hm-cell">{d.client.name}</div>
            {CATS.map(c=><div key={c.id} className="bi-hm-cell" style={{background:cellBg(d.catScores[c.id])}}>{d.catScores[c.id]||"--"}</div>)}
            <div className="bi-hm-cell" style={{background:cellBg(d.overall)}}>{d.overall}</div>
          </div>))}
      </div>
    </div>
  );
}
