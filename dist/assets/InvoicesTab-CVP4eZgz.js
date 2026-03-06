import{j as e}from"./three-DVqDxOd4.js";import{r as l}from"./vendor-BVkUCa2G.js";import{u as M,e as C}from"./index-BB5AwYME.js";import{a2 as D,ao as O,Y as T,aB as R,n as U,s as B,ad as H}from"./icons-CswKOwji.js";import"./charts-CxIG5shu.js";function J(){const{clients:g,markInvoicePaid:A,unmarkInvoicePaid:y,deleteInvoice:I,hasPermission:b}=M(),N=b("manage_finance")||b("manage_clients"),[h,$]=l.useState(""),[u,S]=l.useState("all"),[p,k]=l.useState("all"),[v,z]=l.useState("newest"),[x,P]=l.useState("all"),[E,f]=l.useState(null),o=l.useMemo(()=>{const t=[];return g.forEach(a=>{(a.invoices||[]).forEach(s=>{t.push({...s,clientId:a.id,clientName:a.name,clientEmail:a.email,clientTier:a.tier||"free"})})}),t},[g]),F=l.useMemo(()=>{const t=new Set;return o.forEach(a=>{const s=new Date(a.createdAt).getFullYear();t.add(s)}),t.size===0&&t.add(new Date().getFullYear()),Array.from(t).sort((a,s)=>s-a)},[o]),L=l.useMemo(()=>{const t=new Map;return o.forEach(a=>{t.has(a.clientId)||t.set(a.clientId,{id:a.clientId,name:a.clientName})}),Array.from(t.values()).sort((a,s)=>a.name.localeCompare(s.name))},[o]),r=l.useMemo(()=>{let t=[...o];if(x!=="all"&&(t=t.filter(a=>new Date(a.createdAt).getFullYear()===parseInt(x))),u!=="all"&&(u==="overdue"?t=t.filter(a=>a.status==="unpaid"&&a.dueDate&&new Date(a.dueDate)<new Date):t=t.filter(a=>a.status===u)),p!=="all"&&(t=t.filter(a=>a.clientId===p)),h.trim()){const a=h.toLowerCase();t=t.filter(s=>s.title.toLowerCase().includes(a)||s.clientName.toLowerCase().includes(a)||s.clientEmail.toLowerCase().includes(a)||(s.description||"").toLowerCase().includes(a))}return t.sort((a,s)=>{switch(v){case"oldest":return new Date(a.createdAt)-new Date(s.createdAt);case"amount-high":return s.amount-a.amount;case"amount-low":return a.amount-s.amount;case"due-date":return new Date(a.dueDate||"9999-12-31")-new Date(s.dueDate||"9999-12-31");case"client":return a.clientName.localeCompare(s.clientName);default:return new Date(s.createdAt)-new Date(a.createdAt)}}),t},[o,x,u,p,h,v]),n=l.useMemo(()=>{const t=r.reduce((i,d)=>i+d.amount,0),a=r.filter(i=>i.status==="paid"),s=r.filter(i=>i.status==="unpaid"),w=s.filter(i=>i.dueDate&&new Date(i.dueDate)<new Date);return{count:r.length,total:t,paidCount:a.length,paidAmount:a.reduce((i,d)=>i+d.amount,0),unpaidCount:s.length,unpaidAmount:s.reduce((i,d)=>i+d.amount,0),overdueCount:w.length,overdueAmount:w.reduce((i,d)=>i+d.amount,0)}},[r]),c=t=>`$${t.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}`,j=t=>t?new Date(t).toLocaleDateString():"-",m=t=>t.status==="unpaid"&&t.dueDate&&new Date(t.dueDate)<new Date,Y=()=>{const t=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoices Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .summary { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
          .summary-card { background: #f5f5f5; padding: 15px; border-radius: 8px; min-width: 120px; }
          .summary-card h4 { margin: 0 0 5px 0; font-size: 12px; color: #666; }
          .summary-card p { margin: 0; font-size: 18px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: 600; }
          .paid { color: #22c55e; }
          .unpaid { color: #f59e0b; }
          .overdue { color: #ef4444; }
          .text-right { text-align: right; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Invoices Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <div class="summary">
          <div class="summary-card"><h4>Total Invoices</h4><p>${n.count}</p></div>
          <div class="summary-card"><h4>Total Amount</h4><p>${c(n.total)}</p></div>
          <div class="summary-card"><h4>Paid</h4><p class="paid">${c(n.paidAmount)}</p></div>
          <div class="summary-card"><h4>Unpaid</h4><p class="unpaid">${c(n.unpaidAmount)}</p></div>
          <div class="summary-card"><h4>Overdue</h4><p class="overdue">${c(n.overdueAmount)}</p></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Client</th>
              <th>Created</th>
              <th>Due Date</th>
              <th>Status</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${r.map(s=>`
              <tr>
                <td>${C(s.title)}</td>
                <td>${C(s.clientName)}</td>
                <td>${j(s.createdAt)}</td>
                <td>${j(s.dueDate)}</td>
                <td class="${m(s)?"overdue":s.status}">${m(s)?"Overdue":s.status}</td>
                <td class="text-right">${c(s.amount)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `,a=window.open("","_blank");a.document.write(t),a.document.close(),a.print()};return e.jsxs("div",{className:"invoices-tab",children:[e.jsxs("div",{className:"invoices-header",children:[e.jsxs("h2",{children:[e.jsx(D,{size:20})," All Invoices"]}),e.jsxs("button",{className:"btn btn-outline",onClick:Y,children:[e.jsx(O,{size:16})," Print Report"]})]}),e.jsxs("div",{className:"invoices-summary",children:[e.jsxs("div",{className:"invoice-stat-card",children:[e.jsx("span",{className:"invoice-stat-label",children:"Total Invoices"}),e.jsx("span",{className:"invoice-stat-value",children:n.count})]}),e.jsxs("div",{className:"invoice-stat-card",children:[e.jsx("span",{className:"invoice-stat-label",children:"Total Amount"}),e.jsx("span",{className:"invoice-stat-value",children:c(n.total)})]}),e.jsxs("div",{className:"invoice-stat-card paid",children:[e.jsxs("span",{className:"invoice-stat-label",children:["Paid (",n.paidCount,")"]}),e.jsx("span",{className:"invoice-stat-value",children:c(n.paidAmount)})]}),e.jsxs("div",{className:"invoice-stat-card unpaid",children:[e.jsxs("span",{className:"invoice-stat-label",children:["Unpaid (",n.unpaidCount,")"]}),e.jsx("span",{className:"invoice-stat-value",children:c(n.unpaidAmount)})]}),n.overdueCount>0&&e.jsxs("div",{className:"invoice-stat-card overdue",children:[e.jsxs("span",{className:"invoice-stat-label",children:["Overdue (",n.overdueCount,")"]}),e.jsx("span",{className:"invoice-stat-value",children:c(n.overdueAmount)})]})]}),e.jsxs("div",{className:"invoices-filters",children:[e.jsxs("div",{className:"search-box",children:[e.jsx(T,{size:16}),e.jsx("input",{type:"text",placeholder:"Search invoices...",value:h,onChange:t=>$(t.target.value)})]}),e.jsxs("select",{value:x,onChange:t=>P(t.target.value),className:"filter-select",children:[e.jsx("option",{value:"all",children:"All Years"}),F.map(t=>e.jsx("option",{value:t,children:t},t))]}),e.jsxs("select",{value:u,onChange:t=>S(t.target.value),className:"filter-select",children:[e.jsx("option",{value:"all",children:"All Status"}),e.jsx("option",{value:"paid",children:"Paid"}),e.jsx("option",{value:"unpaid",children:"Unpaid"}),e.jsx("option",{value:"overdue",children:"Overdue"})]}),e.jsxs("select",{value:p,onChange:t=>k(t.target.value),className:"filter-select",children:[e.jsx("option",{value:"all",children:"All Clients"}),L.map(t=>e.jsx("option",{value:t.id,children:t.name},t.id))]}),e.jsxs("select",{value:v,onChange:t=>z(t.target.value),className:"filter-select",children:[e.jsx("option",{value:"newest",children:"Newest First"}),e.jsx("option",{value:"oldest",children:"Oldest First"}),e.jsx("option",{value:"amount-high",children:"Amount (High to Low)"}),e.jsx("option",{value:"amount-low",children:"Amount (Low to High)"}),e.jsx("option",{value:"due-date",children:"Due Date"}),e.jsx("option",{value:"client",children:"Client Name"})]})]}),r.length===0?e.jsxs("div",{className:"empty-state",children:[e.jsx(D,{size:48}),e.jsx("p",{children:"No invoices found"})]}):e.jsx("div",{className:"invoices-table-wrapper",children:e.jsxs("table",{className:"invoices-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Invoice"}),e.jsx("th",{children:"Client"}),e.jsx("th",{children:"Created"}),e.jsx("th",{children:"Due Date"}),e.jsx("th",{children:"Status"}),e.jsx("th",{className:"text-right",children:"Amount"}),N&&e.jsx("th",{children:"Actions"})]})}),e.jsx("tbody",{children:r.map(t=>e.jsxs("tr",{className:m(t)?"overdue-row":"",children:[e.jsx("td",{children:e.jsxs("div",{className:"invoice-title-cell",children:[e.jsx("strong",{children:t.title}),t.description&&e.jsx("span",{className:"invoice-desc",children:t.description}),t.recurring&&e.jsxs("span",{className:"recurring-badge",children:[e.jsx(R,{size:10})," Recurring"]})]})}),e.jsx("td",{children:e.jsxs("div",{className:"invoice-client-cell",children:[e.jsx("span",{children:t.clientName}),e.jsx("small",{children:t.clientEmail})]})}),e.jsx("td",{children:j(t.createdAt)}),e.jsx("td",{children:j(t.dueDate)}),e.jsx("td",{children:e.jsx("span",{className:`invoice-status-badge ${m(t)?"overdue":t.status}`,children:m(t)?"Overdue":t.status==="paid"?"Paid":"Unpaid"})}),e.jsx("td",{className:"text-right",children:e.jsx("strong",{children:c(t.amount)})}),N&&e.jsx("td",{children:e.jsxs("div",{className:"invoice-actions",children:[t.status==="unpaid"?e.jsx("button",{className:"btn btn-xs btn-confirm",onClick:()=>A(t.clientId,t.id),title:"Mark as paid",children:e.jsx(U,{size:14})}):e.jsx("button",{className:"btn btn-xs btn-outline",onClick:()=>y(t.clientId,t.id),title:"Undo payment",children:e.jsx(B,{size:14})}),E===`${t.clientId}-${t.id}`?e.jsxs("div",{className:"delete-confirm-inline",children:[e.jsx("span",{children:"Delete?"}),e.jsx("button",{className:"btn btn-xs btn-delete",onClick:()=>{I(t.clientId,t.id),f(null)},children:"Yes"}),e.jsx("button",{className:"btn btn-xs btn-outline",onClick:()=>f(null),children:"No"})]}):e.jsx("button",{className:"btn btn-xs btn-delete",onClick:()=>f(`${t.clientId}-${t.id}`),title:"Delete invoice",children:e.jsx(H,{size:14})})]})})]},`${t.clientId}-${t.id}`))})]})})]})}export{J as default};
