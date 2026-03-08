import{j as t}from"./three-DVqDxOd4.js";import{r as b}from"./vendor-BVkUCa2G.js";import{u as P,s as k,e as y}from"./index-BB4oee78.js";import{a5 as T,bk as S,$ as C,ac as F,ao as D}from"./icons-CXGulwir.js";import"./charts-CxIG5shu.js";const L=["3M","6M","1Y","All"],z=o=>{const[x,d]=o.split("-");return new Date(x,d-1).toLocaleDateString("en-US",{month:"short",year:"numeric"})},w=o=>{const x=new Date;return x.setMonth(x.getMonth()-o),x.toISOString().slice(0,7)},a=o=>"$"+Number(o||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}),j=o=>Number(o||0).toFixed(1)+"%";function Y(){const{currentClient:o}=P(),x=o==null?void 0:o.id,[d,M]=b.useState("All"),N=b.useMemo(()=>k("threeseas_bi_client_financials",{}),[])[x],$=b.useMemo(()=>((N==null?void 0:N.entries)||[]).slice().sort((s,i)=>s.month.localeCompare(i.month)),[N]),r=b.useMemo(()=>{if(d==="All")return $;let s;const i=new Date().toISOString().slice(0,7);return d==="3M"?s=w(3):d==="6M"?s=w(6):d==="1Y"&&(s=w(12)),$.filter(c=>(!s||c.month>=s)&&c.month<=i)},[$,d]),e=b.useMemo(()=>{const s=r.reduce((p,m)=>p+(m.revenue||0),0),i=r.reduce((p,m)=>p+(m.expenses||0),0),c=r.reduce((p,m)=>p+(m.adSpend||0),0),g=s-i,v=s>0?g/s*100:0,h=r.reduce((p,m)=>p+(m.newCustomers||0),0),n=r.reduce((p,m)=>p+(m.leadCount||0),0),u=r.length>0?s/r.length:0,f=r.length>0?i/r.length:0,l=r.length>0?r.reduce((p,m)=>p+(m.conversionRate||0),0)/r.length:0;return{revenue:s,expenses:i,adSpend:c,profit:g,margin:v,customers:h,leads:n,avgRevenue:u,avgExpenses:f,conversionRate:l,monthCount:r.length}},[r]),R=b.useMemo(()=>{const s=r.reduce((c,g)=>c+(g.adSpend||0),0),i=e.expenses-s;return[{category:"Ad Spend",amount:s},{category:"Other Expenses",amount:Math.max(i,0)}].filter(c=>c.amount>0)},[r,e.expenses]),A=()=>{var f;const s=["Month","Revenue","Expenses","Profit","Profit Margin %","Ad Spend","Customers","Leads","Conversion Rate"],i=r.map(l=>[l.month,l.revenue||0,l.expenses||0,(l.revenue||0)-(l.expenses||0),l.revenue>0?((l.revenue-l.expenses)/l.revenue*100).toFixed(1):0,l.adSpend||0,l.newCustomers||0,l.leadCount||0,(l.conversionRate||0).toFixed(1)].join(",")),c=[s.join(","),...i].join(`
`),g=new Blob([c],{type:"text/csv"}),v=URL.createObjectURL(g),h=document.createElement("a");h.href=v;const n=((f=o==null?void 0:o.name)==null?void 0:f.replace(/\s+/g,"_"))||"client",u=d.toLowerCase();h.download=`financial_report_${n}_${u}_${new Date().toISOString().slice(0,10)}.csv`,h.click(),URL.revokeObjectURL(v)},E=()=>{const s=o?y(o.name):"Unknown",i=o!=null&&o.businessName?y(o.businessName):"",c=d==="All"?"All Time":`Last ${d}`,g=r.map(n=>{const u=(n.revenue||0)-(n.expenses||0),f=n.revenue>0?(u/n.revenue*100).toFixed(1):"0.0";return`<tr>
        <td>${y(z(n.month))}</td>
        <td>${a(n.revenue)}</td>
        <td>${a(n.expenses)}</td>
        <td style="color: ${u>=0?"#22c55e":"#ef4444"}">${a(u)}</td>
        <td>${f}%</td>
      </tr>`}).join(""),v=R.map(n=>`<tr>
      <td>${y(n.category)}</td>
      <td>${a(n.amount)}</td>
      <td>${e.expenses>0?(n.amount/e.expenses*100).toFixed(1):0}%</td>
    </tr>`).join(""),h=window.open("","_blank");h.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Financial Report - ${s}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 32px;
      max-width: 1000px;
      margin: 0 auto;
    }
    h1 {
      color: #1f2937;
      margin: 0 0 8px;
      font-size: 2rem;
    }
    .subtitle {
      color: #6b7280;
      margin: 0 0 24px;
      font-size: 1rem;
    }
    .report-header {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .section {
      margin-bottom: 32px;
    }
    h2 {
      color: #374151;
      font-size: 1.3rem;
      margin: 0 0 12px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      border-left: 4px solid #3b82f6;
    }
    .summary-card.positive {
      border-left-color: #22c55e;
    }
    .summary-card.negative {
      border-left-color: #ef4444;
    }
    .summary-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th, td {
      text-align: left;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
    }
    th {
      background: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }
    td {
      color: #1f2937;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    .totals-row {
      font-weight: 700;
      background: #e5e7eb !important;
    }
    .text-right {
      text-align: right;
    }
    @media print {
      body {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <h1>Financial Report</h1>
    <p class="subtitle">
      ${i?`${i} — `:""}${s}<br/>
      Report Period: ${y(c)} (${r.length} month${r.length!==1?"s":""})<br/>
      Generated: ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}
    </p>
  </div>

  <div class="section">
    <h2>Executive Summary</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">Total Revenue</div>
        <div class="summary-value">${a(e.revenue)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Total Expenses</div>
        <div class="summary-value">${a(e.expenses)}</div>
      </div>
      <div class="summary-card ${e.profit>=0?"positive":"negative"}">
        <div class="summary-label">Net Profit</div>
        <div class="summary-value" style="color: ${e.profit>=0?"#22c55e":"#ef4444"}">${a(e.profit)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Profit Margin</div>
        <div class="summary-value">${j(e.margin)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Revenue Summary</h2>
    <table>
      <tr>
        <td>Average Monthly Revenue</td>
        <td class="text-right"><strong>${a(e.avgRevenue)}</strong></td>
      </tr>
      <tr>
        <td>Total Customers Acquired</td>
        <td class="text-right"><strong>${e.customers}</strong></td>
      </tr>
      <tr>
        <td>Total Leads Generated</td>
        <td class="text-right"><strong>${e.leads}</strong></td>
      </tr>
      <tr>
        <td>Average Conversion Rate</td>
        <td class="text-right"><strong>${j(e.conversionRate)}</strong></td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Expense Breakdown</h2>
    ${R.length>0?`
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th class="text-right">Amount</th>
          <th class="text-right">% of Total</th>
        </tr>
      </thead>
      <tbody>
        ${v}
        <tr class="totals-row">
          <td>Total Expenses</td>
          <td class="text-right">${a(e.expenses)}</td>
          <td class="text-right">100.0%</td>
        </tr>
      </tbody>
    </table>
    `:"<p>No expense breakdown available.</p>"}
  </div>

  <div class="section">
    <h2>Profit Analysis</h2>
    <table>
      <tr>
        <td>Gross Revenue</td>
        <td class="text-right"><strong>${a(e.revenue)}</strong></td>
      </tr>
      <tr>
        <td>Total Expenses</td>
        <td class="text-right"><strong>${a(e.expenses)}</strong></td>
      </tr>
      <tr class="totals-row">
        <td>Net Profit</td>
        <td class="text-right" style="color: ${e.profit>=0?"#22c55e":"#ef4444"}"><strong>${a(e.profit)}</strong></td>
      </tr>
      <tr>
        <td>Profit Margin</td>
        <td class="text-right"><strong>${j(e.margin)}</strong></td>
      </tr>
      <tr>
        <td>Average Monthly Profit</td>
        <td class="text-right"><strong>${a(e.profit/(r.length||1))}</strong></td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Monthly Breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Month</th>
          <th class="text-right">Revenue</th>
          <th class="text-right">Expenses</th>
          <th class="text-right">Profit</th>
          <th class="text-right">Margin %</th>
        </tr>
      </thead>
      <tbody>
        ${g}
        <tr class="totals-row">
          <td>Totals</td>
          <td class="text-right">${a(e.revenue)}</td>
          <td class="text-right">${a(e.expenses)}</td>
          <td class="text-right" style="color: ${e.profit>=0?"#22c55e":"#ef4444"}">${a(e.profit)}</td>
          <td class="text-right">${j(e.margin)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Key Metrics</h2>
    <table>
      <tr>
        <td>Total Months Analyzed</td>
        <td class="text-right"><strong>${e.monthCount}</strong></td>
      </tr>
      <tr>
        <td>Average Monthly Revenue</td>
        <td class="text-right"><strong>${a(e.avgRevenue)}</strong></td>
      </tr>
      <tr>
        <td>Average Monthly Expenses</td>
        <td class="text-right"><strong>${a(e.avgExpenses)}</strong></td>
      </tr>
      <tr>
        <td>Total Ad Spend</td>
        <td class="text-right"><strong>${a(e.adSpend)}</strong></td>
      </tr>
      <tr>
        <td>Marketing % of Expenses</td>
        <td class="text-right"><strong>${e.expenses>0?(e.adSpend/e.expenses*100).toFixed(1):0}%</strong></td>
      </tr>
    </table>
  </div>
</body>
</html>`),h.document.close(),h.print()};return x?$.length===0?t.jsxs("div",{className:"portal-reports",children:[t.jsxs("div",{className:"portal-reports-header",children:[t.jsx("h2",{children:"Financial Reports"}),t.jsx("p",{className:"portal-reports-subtitle",children:"Export and print your financial summaries."})]}),t.jsxs("div",{className:"portal-empty-state",children:[t.jsx(S,{size:48}),t.jsx("h3",{children:"No Financial Data"}),t.jsx("p",{children:"Your financial data has not been recorded yet. Check back soon."})]})]}):t.jsxs("div",{className:"portal-reports",children:[t.jsxs("div",{className:"portal-reports-header",children:[t.jsx("h2",{children:"Financial Reports"}),t.jsx("p",{className:"portal-reports-subtitle",children:"Generate and download comprehensive financial reports for your business."})]}),t.jsx("div",{className:"portal-reports-controls",children:t.jsxs("div",{className:"portal-reports-filters",children:[t.jsx(C,{size:16}),t.jsx("span",{className:"portal-reports-label",children:"Report Period:"}),L.map(s=>t.jsx("button",{className:`portal-filter-btn ${d===s?"portal-filter-btn-active":""}`,onClick:()=>M(s),children:s},s))]})}),r.length===0?t.jsxs("div",{className:"portal-empty-state",children:[t.jsx(S,{size:48}),t.jsx("h3",{children:"No Data for This Period"}),t.jsx("p",{children:"No financial entries found for the selected period. Try a different range."})]}):t.jsxs(t.Fragment,{children:[t.jsxs("div",{className:"portal-reports-preview",children:[t.jsx("h3",{className:"portal-section-title",children:"Report Summary"}),t.jsxs("div",{className:"portal-reports-summary",children:[t.jsxs("div",{className:"portal-reports-stat",children:[t.jsx("span",{className:"portal-reports-stat-label",children:"Period"}),t.jsx("strong",{className:"portal-reports-stat-value",children:d==="All"?"All Time":`Last ${d}`})]}),t.jsxs("div",{className:"portal-reports-stat",children:[t.jsx("span",{className:"portal-reports-stat-label",children:"Months Included"}),t.jsx("strong",{className:"portal-reports-stat-value",children:r.length})]}),t.jsxs("div",{className:"portal-reports-stat",children:[t.jsx("span",{className:"portal-reports-stat-label",children:"Total Revenue"}),t.jsx("strong",{className:"portal-reports-stat-value",children:a(e.revenue)})]}),t.jsxs("div",{className:"portal-reports-stat",children:[t.jsx("span",{className:"portal-reports-stat-label",children:"Total Expenses"}),t.jsx("strong",{className:"portal-reports-stat-value",children:a(e.expenses)})]}),t.jsxs("div",{className:"portal-reports-stat",children:[t.jsx("span",{className:"portal-reports-stat-label",children:"Net Profit"}),t.jsx("strong",{className:"portal-reports-stat-value",style:{color:e.profit>=0?"#22c55e":"#ef4444"},children:a(e.profit)})]}),t.jsxs("div",{className:"portal-reports-stat",children:[t.jsx("span",{className:"portal-reports-stat-label",children:"Profit Margin"}),t.jsx("strong",{className:"portal-reports-stat-value",children:j(e.margin)})]})]})]}),t.jsxs("div",{className:"portal-reports-actions",children:[t.jsx("h3",{className:"portal-section-title",children:"Export Options"}),t.jsxs("div",{className:"portal-reports-buttons",children:[t.jsxs("button",{className:"portal-btn-primary",onClick:A,children:[t.jsx(F,{size:18}),t.jsx("span",{children:"Download CSV"})]}),t.jsxs("button",{className:"portal-btn-secondary",onClick:E,children:[t.jsx(D,{size:18}),t.jsx("span",{children:"Print Report"})]})]}),t.jsx("p",{className:"portal-reports-help",children:"Download as CSV to import into spreadsheet software, or print a formatted report for your records."})]})]})]}):t.jsxs("div",{className:"portal-empty-state",children:[t.jsx(T,{size:48}),t.jsx("h3",{children:"Not Logged In"}),t.jsx("p",{children:"Please log in to generate financial reports."})]})}export{Y as default};
