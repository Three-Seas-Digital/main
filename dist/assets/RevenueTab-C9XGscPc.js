import{j as a}from"./three-DVqDxOd4.js";import{r as o}from"./vendor-BVkUCa2G.js";import{u as C,e as f}from"./index-CaZr8fXF.js";import{K as w,ao as z,aq as P,i as Y,$ as E}from"./icons-DCn7vf2g.js";import"./charts-CxIG5shu.js";const p=c=>new Date(c.createdAt),M=c=>p(c).getFullYear(),A=c=>p(c).getMonth(),B=c=>Math.floor(p(c).getMonth()/3);function I(){const{payments:c,SUBSCRIPTION_TIERS:x}=C(),[i,k]=o.useState("monthly"),[l,R]=o.useState(new Date().getFullYear()),$=o.useMemo(()=>{const e=new Set;return c.forEach(n=>e.add(M(n))),e.size===0&&e.add(new Date().getFullYear()),Array.from(e).sort((n,s)=>s-n)},[c]),t=o.useMemo(()=>c.filter(e=>M(e)===l&&e.status==="completed"),[c,l]),m=t.reduce((e,n)=>e+n.amount,0),d=o.useMemo(()=>{const e=Array.from({length:12},(n,s)=>({month:s,name:new Date(l,s).toLocaleString("en-US",{month:"short"}),fullName:new Date(l,s).toLocaleString("en-US",{month:"long"}),revenue:0,count:0,payments:[]}));return t.forEach(n=>{const s=A(n);e[s].revenue+=n.amount,e[s].count+=1,e[s].payments.push(n)}),e},[t,l]),b=o.useMemo(()=>{const e=[{name:"Q1",months:"Jan - Mar",revenue:0,count:0},{name:"Q2",months:"Apr - Jun",revenue:0,count:0},{name:"Q3",months:"Jul - Sep",revenue:0,count:0},{name:"Q4",months:"Oct - Dec",revenue:0,count:0}];return t.forEach(n=>{const s=B(n);e[s].revenue+=n.amount,e[s].count+=1}),e},[t]),u=o.useMemo(()=>{const e={};return t.forEach(n=>{const s=n.service||"other";e[s]||(e[s]={name:s,revenue:0,count:0}),e[s].revenue+=n.amount,e[s].count+=1}),Object.values(e).sort((n,s)=>s.revenue-n.revenue)},[t]),h=o.useMemo(()=>{const e={};return t.forEach(n=>{var g;const s=n.serviceTier||"basic";e[s]||(e[s]={name:s,label:((g=x[s])==null?void 0:g.label)||s,revenue:0,count:0}),e[s].revenue+=n.amount,e[s].count+=1}),Object.values(e).sort((n,s)=>s.revenue-n.revenue)},[t,x]),y=o.useMemo(()=>{const e={};return t.forEach(n=>{const s=n.method||"other";e[s]||(e[s]={name:s,revenue:0,count:0}),e[s].revenue+=n.amount,e[s].count+=1}),Object.values(e).sort((n,s)=>s.revenue-n.revenue)},[t]),T=Math.max(...d.map(e=>e.revenue),1),j=m/12,S=new Date().getMonth(),N=d.slice(0,S+1).reduce((e,n)=>e+n.revenue,0),r=e=>`$${e.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}`,v=e=>e.replace(/-/g," ").replace(/\b\w/g,n=>n.toUpperCase()),D=()=>{const e=window.open("","_blank");e.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Revenue Report - ${l}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; }
          h1 { color: #1e3a5f; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .summary-card { background: #f3f4f6; padding: 18px; border-radius: 8px; text-align: center; }
          .summary-card.highlight { background: #ecfdf5; border: 1px solid #10b981; }
          .summary-card h3 { margin: 0 0 8px; font-size: 11px; color: #6b7280; text-transform: uppercase; }
          .summary-card p { margin: 0; font-size: 20px; font-weight: bold; color: #1e3a5f; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; font-size: 12px; }
          td.amount { text-align: right; font-family: monospace; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Revenue Report - ${l}</h1>
        <p>Generated: ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</p>

        <div class="summary">
          <div class="summary-card highlight"><h3>Total Revenue</h3><p>${r(m)}</p></div>
          <div class="summary-card"><h3>Transactions</h3><p>${t.length}</p></div>
          <div class="summary-card"><h3>Avg Monthly</h3><p>${r(j)}</p></div>
          <div class="summary-card"><h3>YTD Revenue</h3><p>${r(N)}</p></div>
        </div>

        <h2>Monthly Breakdown</h2>
        <table>
          <thead><tr><th>Month</th><th>Transactions</th><th class="amount">Revenue</th><th class="amount">% of Total</th></tr></thead>
          <tbody>
            ${d.map(n=>`<tr><td>${n.fullName}</td><td>${n.count}</td><td class="amount">${r(n.revenue)}</td><td class="amount">${m>0?(n.revenue/m*100).toFixed(1):0}%</td></tr>`).join("")}
          </tbody>
        </table>

        <h2>By Service</h2>
        <table>
          <thead><tr><th>Service</th><th>Transactions</th><th class="amount">Revenue</th></tr></thead>
          <tbody>${u.map(n=>`<tr><td>${f(v(n.name))}</td><td>${n.count}</td><td class="amount">${r(n.revenue)}</td></tr>`).join("")}</tbody>
        </table>

        <h2>By Tier</h2>
        <table>
          <thead><tr><th>Tier</th><th>Transactions</th><th class="amount">Revenue</th></tr></thead>
          <tbody>${h.map(n=>`<tr><td>${f(n.label)}</td><td>${n.count}</td><td class="amount">${r(n.revenue)}</td></tr>`).join("")}</tbody>
        </table>

        <div class="footer"><p>Three Seas Digital CRM — Revenue Report</p></div>
      </body>
      </html>
    `),e.document.close(),e.print()};return a.jsxs("div",{className:"revenue-tab",children:[a.jsxs("div",{className:"revenue-header",children:[a.jsxs("div",{className:"revenue-header-left",children:[a.jsxs("h2",{children:[a.jsx(w,{size:24})," Revenue Overview"]}),a.jsx("p",{children:"Track and analyze your business income"})]}),a.jsxs("div",{className:"revenue-header-actions",children:[a.jsx("select",{value:l,onChange:e=>R(parseInt(e.target.value)),className:"revenue-year-select",children:$.map(e=>a.jsx("option",{value:e,children:e},e))}),a.jsx("div",{className:"revenue-view-toggle",children:["monthly","quarterly"].map(e=>a.jsx("button",{className:i===e?"active":"",onClick:()=>k(e),children:e.charAt(0).toUpperCase()+e.slice(1)},e))}),a.jsxs("button",{className:"btn btn-primary",onClick:D,children:[a.jsx(z,{size:16})," Print Report"]})]})]}),a.jsxs("div",{className:"revenue-summary-grid",children:[a.jsxs("div",{className:"revenue-summary-card highlight",children:[a.jsx("div",{className:"revenue-summary-icon",children:a.jsx(w,{size:24})}),a.jsxs("div",{className:"revenue-summary-content",children:[a.jsx("span",{className:"revenue-summary-label",children:"Total Revenue"}),a.jsx("span",{className:"revenue-summary-value",children:r(m)}),a.jsx("span",{className:"revenue-summary-sub",children:l})]})]}),a.jsxs("div",{className:"revenue-summary-card",children:[a.jsx("div",{className:"revenue-summary-icon",children:a.jsx(P,{size:24})}),a.jsxs("div",{className:"revenue-summary-content",children:[a.jsx("span",{className:"revenue-summary-label",children:"Transactions"}),a.jsx("span",{className:"revenue-summary-value",children:t.length}),a.jsx("span",{className:"revenue-summary-sub",children:"Completed payments"})]})]}),a.jsxs("div",{className:"revenue-summary-card",children:[a.jsx("div",{className:"revenue-summary-icon",children:a.jsx(Y,{size:24})}),a.jsxs("div",{className:"revenue-summary-content",children:[a.jsx("span",{className:"revenue-summary-label",children:"Avg Monthly"}),a.jsx("span",{className:"revenue-summary-value",children:r(j)}),a.jsx("span",{className:"revenue-summary-sub",children:"Per month avg"})]})]}),a.jsxs("div",{className:"revenue-summary-card",children:[a.jsx("div",{className:"revenue-summary-icon",children:a.jsx(E,{size:24})}),a.jsxs("div",{className:"revenue-summary-content",children:[a.jsx("span",{className:"revenue-summary-label",children:"YTD Revenue"}),a.jsx("span",{className:"revenue-summary-value",children:r(N)}),a.jsx("span",{className:"revenue-summary-sub",children:"Year to date"})]})]})]}),a.jsxs("div",{className:"revenue-chart-section",children:[a.jsx("h3",{children:i==="monthly"?"Monthly Revenue":"Quarterly Revenue"}),a.jsx("div",{className:"revenue-bars",children:i==="monthly"?d.map(e=>a.jsxs("div",{className:"revenue-bar-item",children:[a.jsx("div",{className:"revenue-bar-wrapper",children:a.jsx("div",{className:"revenue-bar-fill",style:{height:`${e.revenue/T*100}%`}})}),a.jsx("span",{className:"revenue-bar-label",children:e.name}),a.jsx("span",{className:"revenue-bar-value",children:r(e.revenue)})]},e.month)):b.map((e,n)=>a.jsxs("div",{className:"revenue-bar-item quarterly",children:[a.jsx("div",{className:"revenue-bar-wrapper",children:a.jsx("div",{className:"revenue-bar-fill",style:{height:`${e.revenue/Math.max(...b.map(s=>s.revenue),1)*100}%`}})}),a.jsx("span",{className:"revenue-bar-label",children:e.name}),a.jsx("span",{className:"revenue-bar-value",children:r(e.revenue)}),a.jsxs("span",{className:"revenue-bar-sub",children:[e.count," txns"]})]},n))})]}),a.jsxs("div",{className:"revenue-breakdown-grid",children:[a.jsxs("div",{className:"revenue-breakdown-card",children:[a.jsx("h4",{children:"By Service"}),u.length===0?a.jsx("p",{className:"revenue-empty",children:"No data"}):a.jsx("div",{className:"revenue-breakdown-list",children:u.map(e=>a.jsxs("div",{className:"revenue-breakdown-row",children:[a.jsx("span",{className:"revenue-breakdown-name",children:v(e.name)}),a.jsx("span",{className:"revenue-breakdown-count",children:e.count}),a.jsx("span",{className:"revenue-breakdown-amount",children:r(e.revenue)})]},e.name))})]}),a.jsxs("div",{className:"revenue-breakdown-card",children:[a.jsx("h4",{children:"By Tier"}),h.length===0?a.jsx("p",{className:"revenue-empty",children:"No data"}):a.jsx("div",{className:"revenue-breakdown-list",children:h.map(e=>a.jsxs("div",{className:"revenue-breakdown-row",children:[a.jsx("span",{className:"revenue-breakdown-name",children:e.label}),a.jsx("span",{className:"revenue-breakdown-count",children:e.count}),a.jsx("span",{className:"revenue-breakdown-amount",children:r(e.revenue)})]},e.name))})]}),a.jsxs("div",{className:"revenue-breakdown-card",children:[a.jsx("h4",{children:"By Payment Method"}),y.length===0?a.jsx("p",{className:"revenue-empty",children:"No data"}):a.jsx("div",{className:"revenue-breakdown-list",children:y.map(e=>a.jsxs("div",{className:"revenue-breakdown-row",children:[a.jsx("span",{className:"revenue-breakdown-name",children:v(e.name)}),a.jsx("span",{className:"revenue-breakdown-count",children:e.count}),a.jsx("span",{className:"revenue-breakdown-amount",children:r(e.revenue)})]},e.name))})]})]})]})}export{I as default};
