import { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle, Clock, Search, Users, BarChart3 } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { safeGetItem } from '../../../constants';

const AUDITS_KEY = 'threeseas_bi_audits';

interface AuditQueueProps {
  onStartAudit?: (clientId: string) => void;
  biClientId: string | null;
  onBiClientChange: (id: string) => void;
}

export default function AuditQueue({ onStartAudit, biClientId, onBiClientChange }: AuditQueueProps) {
  const { clients } = useAppContext();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const activeClients = clients.filter(c => c.status !== 'archived' && c.status !== 'rejected');
  const allAudits = useMemo(() => safeGetItem(AUDITS_KEY, []), []); // eslint-disable-line react-hooks/exhaustive-deps -- re-reads on remount

  const clientAuditData = useMemo(() => {
    return activeClients.map(client => {
      const audits = allAudits.filter((a: any) => a.clientId === client.id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latest = audits[0];
      const daysSince = latest ? Math.floor((Date.now() - new Date(latest.createdAt).getTime()) / 86400000) : Infinity;
      let trafficLight = 'red';
      if (daysSince <= 90) trafficLight = 'green';
      else if (daysSince <= 180) trafficLight = 'amber';
      const score = latest && latest.scores ? (() => {
        const vals = Object.values(latest.scores).filter((v: any) => v > 0) as number[];
        return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : '--';
      })() : '--';
      return { client, latest, daysSince, trafficLight, score, auditCount: audits.length };
    });
  }, [activeClients, allAudits]);

  const filtered = useMemo(() => {
    let list = clientAuditData;
    if (search) list = list.filter(d => d.client.name.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'needs') list = list.filter(d => d.trafficLight !== 'green');
    if (filter === 'recent') list = list.filter(d => d.trafficLight === 'green');
    return list.sort((a, b) => {
      if (a.trafficLight === 'red' && b.trafficLight !== 'red') return -1;
      if (b.trafficLight === 'red' && a.trafficLight !== 'red') return 1;
      return a.daysSince > b.daysSince ? -1 : 1;
    });
  }, [clientAuditData, search, filter]);

  const stats = useMemo(() => ({
    total: clientAuditData.length,
    needsAudit: clientAuditData.filter(d => d.trafficLight !== 'green').length,
    recent: clientAuditData.filter(d => d.trafficLight === 'green').length,
    avgScore: (() => {
      const nums = clientAuditData.map(d => parseFloat(d.score)).filter(n => !isNaN(n));
      return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : '--';
    })(),
  }), [clientAuditData]);

  const TL = ({ color }: { color: 'red' | 'amber' | 'green' }) => {
    const colors = { red: '#ef4444', amber: '#f59e0b', green: '#22c55e' };
    const icons = { red: AlertCircle, amber: Clock, green: CheckCircle };
    const Icon = icons[color];
    return <span className="bi-traffic-light" style={{ color: colors[color] }}><Icon size={16} /></span>;
  };

  return (
    <div className="bi-audit-queue">
      <div className="bi-header"><h3><Users size={20} /> Audit Queue</h3></div>
      <div className="bi-stats-row">
        <div className="bi-stat"><Users size={16} /><span>{stats.total}</span><small>Total</small></div>
        <div className="bi-stat" style={{ color: '#ef4444' }}><AlertCircle size={16} /><span>{stats.needsAudit}</span><small>Needs Audit</small></div>
        <div className="bi-stat" style={{ color: '#22c55e' }}><CheckCircle size={16} /><span>{stats.recent}</span><small>Recent</small></div>
        <div className="bi-stat"><BarChart3 size={16} /><span>{stats.avgScore}</span><small>Avg Score</small></div>
      </div>
      {/* Distribution Bar */}
      <div className="bi-audit-distribution">
        <div className="bi-audit-dist-bar">
          {(() => {
            const green = filtered.filter(q => q.trafficLight === 'green').length;
            const amber = filtered.filter(q => q.trafficLight === 'amber').length;
            const red = filtered.filter(q => q.trafficLight === 'red').length;
            const total = green + amber + red || 1;
            return (
              <>
                {green > 0 && <div className="bi-audit-dist-segment" style={{ width: `${(green/total)*100}%`, background: '#22c55e' }} title={`${green} green`}>{green}</div>}
                {amber > 0 && <div className="bi-audit-dist-segment" style={{ width: `${(amber/total)*100}%`, background: '#f59e0b' }} title={`${amber} amber`}>{amber}</div>}
                {red > 0 && <div className="bi-audit-dist-segment" style={{ width: `${(red/total)*100}%`, background: '#ef4444' }} title={`${red} red`}>{red}</div>}
              </>
            );
          })()}
        </div>
        <div className="bi-audit-dist-legend">
          <span><span className="bi-audit-dot" style={{background:'#22c55e'}} /> Up to date</span>
          <span><span className="bi-audit-dot" style={{background:'#f59e0b'}} /> Due soon</span>
          <span><span className="bi-audit-dot" style={{background:'#ef4444'}} /> Overdue</span>
        </div>
      </div>
      <div className="bi-filter-bar">
        <div className="bi-search"><Search size={16} /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." /></div>
      </div>
      <div className="bi-queue-list">
        {filtered.map(d=>(<div key={d.client.id} className={`bi-queue-row${d.client.id === biClientId ? ' highlighted' : ''}`} onClick={() => onBiClientChange?.(d.client.id)}><span>{d.client.name}</span><span>{d.score}/10</span><span className="bi-audit-queue-days">{d.daysSince !== Infinity ? `${d.daysSince}d ago` : 'Never'}</span><TL color={d.trafficLight}/></div>))}
      </div>
    </div>
  );
}
