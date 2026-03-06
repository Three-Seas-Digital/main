import{j as e}from"./three-DVqDxOd4.js";import{r as c}from"./vendor-BVkUCa2G.js";import{u as E,e as w}from"./index-C4N_OT1C.js";import{i as g,ao as M,K as S,a2 as L,G as D}from"./icons-DCn7vf2g.js";import"./charts-CxIG5shu.js";const N=i=>new Date(i.createdAt),y=i=>N(i).getFullYear(),k=i=>N(i).getMonth();function A(){const{payments:i,expenses:p,EXPENSE_CATEGORIES:j}=E(),[o,b]=c.useState(new Date().getFullYear()),$=c.useMemo(()=>{const s=new Set;return i.forEach(t=>s.add(y(t))),p.forEach(t=>s.add(parseInt(t.date.split("-")[0]))),s.size===0&&s.add(new Date().getFullYear()),Array.from(s).sort((t,n)=>n-t)},[i,p]),x=c.useMemo(()=>i.filter(s=>y(s)===o&&s.status==="completed"),[i,o]),m=c.useMemo(()=>p.filter(s=>s.date.startsWith(o.toString())),[p,o]),d=x.reduce((s,t)=>s+t.amount,0),l=m.reduce((s,t)=>s+t.amount,0),r=d-l,u=d>0?r/d*100:0,h=c.useMemo(()=>{const s=Array.from({length:12},(t,n)=>({month:n,name:new Date(o,n).toLocaleString("en-US",{month:"short"}),fullName:new Date(o,n).toLocaleString("en-US",{month:"long"}),revenue:0,expenses:0,profit:0}));return x.forEach(t=>{const n=k(t);s[n].revenue+=t.amount}),m.forEach(t=>{const n=parseInt(t.date.split("-")[1])-1;s[n].expenses+=t.amount}),s.forEach(t=>{t.profit=t.revenue-t.expenses}),s},[x,m,o]),f=c.useMemo(()=>j.map(s=>({...s,total:m.filter(t=>t.category===s.value).reduce((t,n)=>t+n.amount,0)})).filter(s=>s.total>0),[m,j]),a=s=>`$${Math.abs(s).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}`,v=Math.max(...h.map(s=>Math.max(s.revenue,s.expenses)),1),P=()=>{const s=window.open("","_blank");s.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Profit & Loss - ${o}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; }
          h1 { color: #1e3a5f; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .summary-card { background: #f3f4f6; padding: 18px; border-radius: 8px; text-align: center; }
          .summary-card.profit { background: #ecfdf5; border: 1px solid #10b981; }
          .summary-card.loss { background: #fef2f2; border: 1px solid #ef4444; }
          .summary-card h3 { margin: 0 0 8px; font-size: 11px; color: #6b7280; text-transform: uppercase; }
          .summary-card p { margin: 0; font-size: 20px; font-weight: bold; color: #1e3a5f; }
          .summary-card p.positive { color: #10b981; }
          .summary-card p.negative { color: #ef4444; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; font-size: 12px; }
          td.amount { text-align: right; font-family: monospace; }
          td.positive { color: #10b981; }
          td.negative { color: #ef4444; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Profit & Loss Statement - ${o}</h1>
        <p>Generated: ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</p>

        <div class="summary">
          <div class="summary-card"><h3>Revenue</h3><p>${a(d)}</p></div>
          <div class="summary-card"><h3>Expenses</h3><p>${a(l)}</p></div>
          <div class="summary-card ${r>=0?"profit":"loss"}"><h3>Net Profit</h3><p class="${r>=0?"positive":"negative"}">${r>=0?"":"-"}${a(r)}</p></div>
          <div class="summary-card"><h3>Margin</h3><p>${u.toFixed(1)}%</p></div>
        </div>

        <h2>Monthly Profit & Loss</h2>
        <table>
          <thead><tr><th>Month</th><th class="amount">Revenue</th><th class="amount">Expenses</th><th class="amount">Profit</th></tr></thead>
          <tbody>
            ${h.map(t=>`
              <tr>
                <td>${t.fullName}</td>
                <td class="amount">${a(t.revenue)}</td>
                <td class="amount">${a(t.expenses)}</td>
                <td class="amount ${t.profit>=0?"positive":"negative"}">${t.profit>=0?"":"-"}${a(t.profit)}</td>
              </tr>
            `).join("")}
            <tr style="font-weight:bold;background:#f9fafb">
              <td>TOTAL</td>
              <td class="amount">${a(d)}</td>
              <td class="amount">${a(l)}</td>
              <td class="amount ${r>=0?"positive":"negative"}">${r>=0?"":"-"}${a(r)}</td>
            </tr>
          </tbody>
        </table>

        <h2>Expense Breakdown</h2>
        <table>
          <thead><tr><th>Category</th><th class="amount">Amount</th><th class="amount">% of Expenses</th></tr></thead>
          <tbody>
            ${f.map(t=>`<tr><td>${w(t.label)}</td><td class="amount">${a(t.total)}</td><td class="amount">${l>0?(t.total/l*100).toFixed(1):0}%</td></tr>`).join("")}
          </tbody>
        </table>

        <div class="footer"><p>Three Seas Digital CRM — Profit & Loss Statement</p></div>
      </body>
      </html>
    `),s.document.close(),s.print()};return e.jsxs("div",{className:"profit-tab",children:[e.jsxs("div",{className:"profit-header",children:[e.jsxs("div",{className:"profit-header-left",children:[e.jsxs("h2",{children:[e.jsx(g,{size:24})," Profit & Loss"]}),e.jsx("p",{children:"Monitor your business profitability"})]}),e.jsxs("div",{className:"profit-header-actions",children:[e.jsx("select",{value:o,onChange:s=>b(parseInt(s.target.value)),className:"profit-year-select",children:$.map(s=>e.jsx("option",{value:s,children:s},s))}),e.jsxs("button",{className:"btn btn-primary",onClick:P,children:[e.jsx(M,{size:16})," Print P&L"]})]})]}),e.jsxs("div",{className:"profit-summary-grid",children:[e.jsxs("div",{className:"profit-summary-card revenue",children:[e.jsx("div",{className:"profit-summary-icon",children:e.jsx(S,{size:24})}),e.jsxs("div",{className:"profit-summary-content",children:[e.jsx("span",{className:"profit-summary-label",children:"Total Revenue"}),e.jsx("span",{className:"profit-summary-value",children:a(d)})]})]}),e.jsxs("div",{className:"profit-summary-card expenses",children:[e.jsx("div",{className:"profit-summary-icon",children:e.jsx(L,{size:24})}),e.jsxs("div",{className:"profit-summary-content",children:[e.jsx("span",{className:"profit-summary-label",children:"Total Expenses"}),e.jsx("span",{className:"profit-summary-value",children:a(l)})]})]}),e.jsxs("div",{className:`profit-summary-card ${r>=0?"profit":"loss"}`,children:[e.jsx("div",{className:"profit-summary-icon",children:e.jsx(g,{size:24})}),e.jsxs("div",{className:"profit-summary-content",children:[e.jsx("span",{className:"profit-summary-label",children:"Net Profit"}),e.jsxs("span",{className:"profit-summary-value",children:[r<0?"-":"",a(r)]})]})]}),e.jsxs("div",{className:"profit-summary-card margin",children:[e.jsx("div",{className:"profit-summary-icon",children:e.jsx(D,{size:24})}),e.jsxs("div",{className:"profit-summary-content",children:[e.jsx("span",{className:"profit-summary-label",children:"Profit Margin"}),e.jsxs("span",{className:"profit-summary-value",children:[u.toFixed(1),"%"]})]})]})]}),e.jsxs("div",{className:"profit-chart-section",children:[e.jsx("h3",{children:"Monthly Profit & Loss"}),e.jsxs("div",{className:"profit-chart-legend",children:[e.jsxs("span",{className:"profit-legend-item revenue",children:[e.jsx("span",{className:"profit-legend-dot"})," Revenue"]}),e.jsxs("span",{className:"profit-legend-item expenses",children:[e.jsx("span",{className:"profit-legend-dot"})," Expenses"]})]}),e.jsx("div",{className:"profit-chart",children:h.map(s=>e.jsxs("div",{className:"profit-chart-col",children:[e.jsxs("div",{className:"profit-chart-bars",children:[e.jsx("div",{className:"profit-bar revenue",style:{height:`${s.revenue/v*100}%`},title:`Revenue: ${a(s.revenue)}`}),e.jsx("div",{className:"profit-bar expenses",style:{height:`${s.expenses/v*100}%`},title:`Expenses: ${a(s.expenses)}`})]}),e.jsx("span",{className:"profit-chart-label",children:s.name}),e.jsxs("span",{className:`profit-chart-value ${s.profit>=0?"positive":"negative"}`,children:[s.profit>=0?"+":"-",a(s.profit)]})]},s.month))})]}),e.jsxs("div",{className:"profit-details-grid",children:[e.jsxs("div",{className:"profit-details-card wide",children:[e.jsx("h4",{children:"Monthly Breakdown"}),e.jsx("div",{className:"profit-table-wrapper",children:e.jsxs("table",{className:"profit-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Month"}),e.jsx("th",{className:"amount",children:"Revenue"}),e.jsx("th",{className:"amount",children:"Expenses"}),e.jsx("th",{className:"amount",children:"Profit"}),e.jsx("th",{className:"amount",children:"Margin"})]})}),e.jsx("tbody",{children:h.map(s=>e.jsxs("tr",{children:[e.jsx("td",{children:s.fullName}),e.jsx("td",{className:"amount",children:a(s.revenue)}),e.jsx("td",{className:"amount",children:a(s.expenses)}),e.jsxs("td",{className:`amount ${s.profit>=0?"positive":"negative"}`,children:[s.profit>=0?"":"-",a(s.profit)]}),e.jsxs("td",{className:"amount",children:[s.revenue>0?(s.profit/s.revenue*100).toFixed(1):0,"%"]})]},s.month))}),e.jsx("tfoot",{children:e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Total"})}),e.jsx("td",{className:"amount",children:e.jsx("strong",{children:a(d)})}),e.jsx("td",{className:"amount",children:e.jsx("strong",{children:a(l)})}),e.jsx("td",{className:`amount ${r>=0?"positive":"negative"}`,children:e.jsxs("strong",{children:[r>=0?"":"-",a(r)]})}),e.jsx("td",{className:"amount",children:e.jsxs("strong",{children:[u.toFixed(1),"%"]})})]})})]})})]}),e.jsxs("div",{className:"profit-details-card",children:[e.jsx("h4",{children:"Expense Categories"}),f.length===0?e.jsx("p",{className:"profit-empty",children:"No expenses recorded"}):e.jsx("div",{className:"profit-expense-list",children:f.map(s=>e.jsxs("div",{className:"profit-expense-row",children:[e.jsx("span",{className:"profit-expense-color",style:{background:s.color}}),e.jsx("span",{className:"profit-expense-name",children:s.label}),e.jsx("span",{className:"profit-expense-amount",children:a(s.total)}),e.jsxs("span",{className:"profit-expense-pct",children:[(s.total/l*100).toFixed(0),"%"]})]},s.value))})]})]})]})}export{A as default};
