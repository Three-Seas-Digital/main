import{j as s}from"./three-DVqDxOd4.js";import{r as b}from"./vendor-BVkUCa2G.js";import{u as V,e as H}from"./index-Ddo9v0aO.js";import{a4 as Y,ao as X,K as Z,a2 as C,i as ee,b1 as se,$ as ae,u as te}from"./icons-DCn7vf2g.js";import"./charts-CxIG5shu.js";function de(){const{expenses:j,payments:v,clients:w,EXPENSE_CATEGORIES:E}=V(),[d,F]=b.useState(new Date().getFullYear()),[N,O]=b.useState("sole_proprietor"),S=n=>new Date(n.createdAt).getFullYear(),L=n=>String(new Date(n.createdAt).getMonth()+1).padStart(2,"0"),W=b.useMemo(()=>{const n=new Set;return j.forEach(i=>n.add(parseInt(e.date.split("-")[0]))),v.forEach(i=>n.add(S(p))),n.size===0&&n.add(new Date().getFullYear()),Array.from(n).sort((i,f)=>f-i)},[j,v]),t=b.useMemo(()=>{var A,z,P,B,M,Q;const n=d.toString(),i=v.filter(r=>S(p)===d&&p.status==="completed"),f=i.reduce((r,l)=>r+l.amount,0),h=j.filter(r=>e.date.startsWith(n)),D=h.reduce((r,l)=>r+l.amount,0),m=E.map(r=>{const l=h.filter(u=>e.category===r.value);return{...r,total:l.reduce((u,o)=>u+o.amount,0),count:l.length,items:l}}).filter(r=>c.total>0),J=f-D,R=[{name:"Q1",months:["01","02","03"]},{name:"Q2",months:["04","05","06"]},{name:"Q3",months:["07","08","09"]},{name:"Q4",months:["10","11","12"]}].map(r=>{const l=i.filter(o=>q.months.includes(L(p))).reduce((o,x)=>o+x.amount,0),u=h.filter(o=>q.months.some(x=>e.date.startsWith(`${n}-${x}`))).reduce((o,x)=>o+x.amount,0);return{...q,revenue:l,expenses:u,net:l-u}}),I=.153,k=.22,K=R.map(r=>({...q,seTax:Math.max(0,q.net*I),incomeTax:Math.max(0,q.net*k),totalTax:Math.max(0,q.net*(I+k))})),U=Array.from({length:12},(r,l)=>{const u=`${n}-${String(l+1).padStart(2,"0")}`,o=String(l+1).padStart(2,"0"),x=i.filter(g=>L(p)===o).reduce((g,T)=>g+T.amount,0),G=h.filter(g=>e.date.startsWith(u)).reduce((g,T)=>g+T.amount,0);return{name:new Date(d,l).toLocaleString("en-US",{month:"short"}),revenue:x,expenses:G,net:x-G}}),$={advertising:0,carAndTruck:((A=m.find(r=>r.value==="fuel"))==null?void 0:A.total)||0,commissions:0,contractLabor:0,depreciation:0,insurance:0,interest:0,legal:0,officeExpense:0,pensionPlans:0,rentLease:0,repairs:0,supplies:0,taxes:0,travel:((z=m.find(r=>r.value==="trips"))==null?void 0:z.total)||0,meals:(((P=m.find(r=>r.value==="food"))==null?void 0:P.total)||0)+(((B=m.find(r=>r.value==="meetings"))==null?void 0:B.total)||0),utilities:0,wages:((M=m.find(r=>r.value==="wages"))==null?void 0:M.total)||0,otherExpenses:((Q=m.find(r=>r.value==="receipts"))==null?void 0:Q.total)||0};return $.totalExpenses=Object.values($).reduce((r,l)=>r+l,0),{grossRevenue:f,totalExpenses:D,netIncome:J,expensesByCategory:m,quarters:R,estimatedQuarterlyTax:K,months:U,scheduleC:$,transactionCount:i.length,expenseCount:h.length,clientCount:w.filter(r=>c.tier&&c.tier!=="free").length}},[d,j,v,w,E]),a=n=>`$${n.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}`,_=()=>{const n=window.open("","_blank");n&&(n.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Summary - ${d}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
          h1 { color: #1e3a5f; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          h3 { color: #4b5563; margin-top: 20px; }
          .header-info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .header-info p { margin: 5px 0; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .summary-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-box.highlight { background: #ecfdf5; border-color: #10b981; }
          .summary-box.warning { background: #fef3c7; border-color: #f59e0b; }
          .summary-box h4 { margin: 0 0 5px; font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .summary-box p { margin: 0; font-size: 20px; font-weight: bold; color: #1e3a5f; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          td.amount { text-align: right; font-family: monospace; }
          .schedule-c { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .schedule-c h3 { margin-top: 0; color: #0369a1; }
          .note { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; }
          @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <h1>Business Tax Summary - ${d}</h1>

        <div class="header-info">
          <p><strong>Business Name:</strong> Three Seas Digital</p>
          <p><strong>Tax Year:</strong> ${d}</p>
          <p><strong>Business Type:</strong> ${N==="sole_proprietor"?"Sole Proprietor":N==="llc"?"LLC":"S-Corp"}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</p>
        </div>

        <h2>Annual Summary</h2>
        <div class="summary-grid">
          <div class="summary-box">
            <h4>Gross Revenue</h4>
            <p>${a(t.grossRevenue)}</p>
          </div>
          <div class="summary-box">
            <h4>Total Expenses</h4>
            <p>${a(t.totalExpenses)}</p>
          </div>
          <div class="summary-box highlight">
            <h4>Net Income</h4>
            <p>${a(t.netIncome)}</p>
          </div>
        </div>

        <h2>Quarterly Breakdown</h2>
        <table>
          <thead><tr><th>Quarter</th><th class="amount">Revenue</th><th class="amount">Expenses</th><th class="amount">Net Income</th><th class="amount">Est. Tax Due</th></tr></thead>
          <tbody>
            ${t.estimatedQuarterlyTax.map(i=>`
              <tr>
                <td>${q.name}</td>
                <td class="amount">${a(q.revenue)}</td>
                <td class="amount">${a(q.expenses)}</td>
                <td class="amount">${a(q.net)}</td>
                <td class="amount">${a(q.totalTax)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <h2>Expense Categories (Deductions)</h2>
        <table>
          <thead><tr><th>Category</th><th>Count</th><th class="amount">Total</th></tr></thead>
          <tbody>
            ${t.expensesByCategory.map(i=>`
              <tr><td>${H(c.label)}</td><td>${c.count}</td><td class="amount">${a(c.total)}</td></tr>
            `).join("")}
            <tr style="font-weight:bold;border-top:2px solid #1e3a5f">
              <td>TOTAL DEDUCTIONS</td>
              <td>${t.expenseCount}</td>
              <td class="amount">${a(t.totalExpenses)}</td>
            </tr>
          </tbody>
        </table>

        <div class="schedule-c">
          <h3>Schedule C Reference (Profit or Loss from Business)</h3>
          <table>
            <tr><td>Line 1 - Gross receipts or sales</td><td class="amount">${a(t.grossRevenue)}</td></tr>
            <tr><td>Line 4 - Cost of goods sold</td><td class="amount">$0.00</td></tr>
            <tr><td>Line 5 - Gross profit</td><td class="amount">${a(t.grossRevenue)}</td></tr>
            <tr><td>Line 9 - Car and truck expenses</td><td class="amount">${a(t.scheduleC.carAndTruck)}</td></tr>
            <tr><td>Line 24a - Travel</td><td class="amount">${a(t.scheduleC.travel)}</td></tr>
            <tr><td>Line 24b - Meals (50% deductible)</td><td class="amount">${a(t.scheduleC.meals)}</td></tr>
            <tr><td>Line 26 - Wages</td><td class="amount">${a(t.scheduleC.wages)}</td></tr>
            <tr><td>Line 27a - Other expenses</td><td class="amount">${a(t.scheduleC.otherExpenses)}</td></tr>
            <tr style="font-weight:bold;border-top:2px solid #0369a1">
              <td>Line 28 - Total expenses</td>
              <td class="amount">${a(t.totalExpenses)}</td>
            </tr>
            <tr style="font-weight:bold;background:#ecfdf5">
              <td>Line 31 - Net profit (or loss)</td>
              <td class="amount">${a(t.netIncome)}</td>
            </tr>
          </table>
        </div>

        <h2>Estimated Tax Liability</h2>
        <div class="summary-grid">
          <div class="summary-box warning">
            <h4>Self-Employment Tax (15.3%)</h4>
            <p>${a(t.netIncome*.153)}</p>
          </div>
          <div class="summary-box warning">
            <h4>Est. Income Tax (22%)</h4>
            <p>${a(t.netIncome*.22)}</p>
          </div>
          <div class="summary-box warning">
            <h4>Total Est. Tax</h4>
            <p>${a(t.netIncome*.373)}</p>
          </div>
        </div>

        <div class="note">
          <strong>Important Notes:</strong>
          <ul>
            <li>This is an estimate only. Consult a tax professional for accurate tax advice.</li>
            <li>Meals and entertainment are typically 50% deductible.</li>
            <li>Vehicle expenses may be calculated using actual expenses or standard mileage rate.</li>
            <li>Keep all receipts and documentation for at least 7 years.</li>
            <li>Quarterly estimated taxes are due Apr 15, Jun 15, Sep 15, and Jan 15.</li>
          </ul>
        </div>

        <div class="footer">
          <p>Generated by Three Seas Digital CRM | This document is for reference purposes only and does not constitute tax advice.</p>
        </div>
      </body>
      </html>
    `),n.document.close(),n.print())};return s.jsxs("div",{className:"taxes-tab",children:[s.jsxs("div",{className:"taxes-header",children:[s.jsxs("div",{className:"taxes-header-left",children:[s.jsxs("h2",{children:[s.jsx(Y,{size:24})," Business Tax Center"]}),s.jsx("p",{children:"Auto-generated tax information from your financial records"})]}),s.jsxs("div",{className:"taxes-header-actions",children:[s.jsx("select",{value:d,onChange:n=>F(parseInt(n.target.value)),className:"taxes-year-select",children:W.map(n=>s.jsx("option",{value:y,children:y},y))}),s.jsxs("select",{value:N,onChange:n=>O(n.target.value),className:"taxes-type-select",children:[s.jsx("option",{value:"sole_proprietor",children:"Sole Proprietor"}),s.jsx("option",{value:"llc",children:"LLC"}),s.jsx("option",{value:"scorp",children:"S-Corp"})]}),s.jsxs("button",{className:"btn btn-primary",onClick:_,children:[s.jsx(X,{size:16})," Print Tax Summary"]})]})]}),s.jsxs("div",{className:"taxes-summary-grid",children:[s.jsxs("div",{className:"taxes-summary-card",children:[s.jsx("div",{className:"taxes-summary-icon revenue",children:s.jsx(Z,{size:24})}),s.jsxs("div",{className:"taxes-summary-content",children:[s.jsx("span",{className:"taxes-summary-label",children:"Gross Revenue"}),s.jsx("span",{className:"taxes-summary-value",children:a(t.grossRevenue)}),s.jsxs("span",{className:"taxes-summary-sub",children:[t.transactionCount," transactions"]})]})]}),s.jsxs("div",{className:"taxes-summary-card",children:[s.jsx("div",{className:"taxes-summary-icon expenses",children:s.jsx(C,{size:24})}),s.jsxs("div",{className:"taxes-summary-content",children:[s.jsx("span",{className:"taxes-summary-label",children:"Total Deductions"}),s.jsx("span",{className:"taxes-summary-value",children:a(t.totalExpenses)}),s.jsxs("span",{className:"taxes-summary-sub",children:[t.expenseCount," expenses"]})]})]}),s.jsxs("div",{className:"taxes-summary-card highlight",children:[s.jsx("div",{className:"taxes-summary-icon net",children:s.jsx(ee,{size:24})}),s.jsxs("div",{className:"taxes-summary-content",children:[s.jsx("span",{className:"taxes-summary-label",children:"Net Income"}),s.jsx("span",{className:"taxes-summary-value",children:a(t.netIncome)}),s.jsx("span",{className:"taxes-summary-sub",children:"Taxable income"})]})]}),s.jsxs("div",{className:"taxes-summary-card warning",children:[s.jsx("div",{className:"taxes-summary-icon tax",children:s.jsx(se,{size:24})}),s.jsxs("div",{className:"taxes-summary-content",children:[s.jsx("span",{className:"taxes-summary-label",children:"Est. Tax Liability"}),s.jsx("span",{className:"taxes-summary-value",children:a(t.netIncome*.373)}),s.jsx("span",{className:"taxes-summary-sub",children:"SE + Income tax"})]})]})]}),s.jsxs("div",{className:"taxes-section",children:[s.jsxs("h3",{children:[s.jsx(ae,{size:18})," Quarterly Tax Estimates"]}),s.jsx("div",{className:"taxes-quarterly-grid",children:t.estimatedQuarterlyTax.map(n=>s.jsxs("div",{className:"taxes-quarter-card",children:[s.jsxs("div",{className:"taxes-quarter-header",children:[s.jsx("span",{className:"taxes-quarter-name",children:q.name}),s.jsx("span",{className:`taxes-quarter-net ${q.net>=0?"positive":"negative"}`,children:a(q.net)})]}),s.jsxs("div",{className:"taxes-quarter-details",children:[s.jsxs("div",{className:"taxes-quarter-row",children:[s.jsx("span",{children:"Revenue"}),s.jsx("span",{children:a(q.revenue)})]}),s.jsxs("div",{className:"taxes-quarter-row",children:[s.jsx("span",{children:"Expenses"}),s.jsxs("span",{children:["-",a(q.expenses)]})]}),s.jsxs("div",{className:"taxes-quarter-row highlight",children:[s.jsx("span",{children:"Est. Tax Due"}),s.jsx("span",{children:a(q.totalTax)})]})]})]},q.name))})]}),s.jsxs("div",{className:"taxes-section",children:[s.jsxs("h3",{children:[s.jsx(C,{size:18})," Deductible Expenses by Category"]}),t.expensesByCategory.length===0?s.jsxs("div",{className:"taxes-empty",children:[s.jsx(C,{size:48}),s.jsxs("p",{children:["No expenses recorded for ",d]})]}):s.jsxs("div",{className:"taxes-expense-list",children:[t.expensesByCategory.map(n=>s.jsxs("div",{className:"taxes-expense-row",children:[s.jsxs("div",{className:"taxes-expense-info",children:[s.jsx("span",{className:"taxes-expense-color",style:{background:n.color}}),s.jsx("span",{className:"taxes-expense-name",children:n.label}),s.jsxs("span",{className:"taxes-expense-count",children:[n.count," items"]})]}),s.jsx("span",{className:"taxes-expense-amount",children:a(n.total)})]},n.value)),s.jsxs("div",{className:"taxes-expense-row total",children:[s.jsx("div",{className:"taxes-expense-info",children:s.jsx("span",{className:"taxes-expense-name",children:"Total Deductions"})}),s.jsx("span",{className:"taxes-expense-amount",children:a(t.totalExpenses)})]})]})]}),s.jsxs("div",{className:"taxes-section schedule-c",children:[s.jsxs("h3",{children:[s.jsx(Y,{size:18})," Schedule C Reference"]}),s.jsx("p",{className:"taxes-section-note",children:"Preview of key Schedule C line items based on your records"}),s.jsxs("div",{className:"taxes-schedule-grid",children:[s.jsxs("div",{className:"taxes-schedule-row",children:[s.jsx("span",{className:"taxes-schedule-line",children:"Line 1"}),s.jsx("span",{className:"taxes-schedule-desc",children:"Gross receipts or sales"}),s.jsx("span",{className:"taxes-schedule-amount",children:a(t.grossRevenue)})]}),s.jsxs("div",{className:"taxes-schedule-row",children:[s.jsx("span",{className:"taxes-schedule-line",children:"Line 5"}),s.jsx("span",{className:"taxes-schedule-desc",children:"Gross profit"}),s.jsx("span",{className:"taxes-schedule-amount",children:a(t.grossRevenue)})]}),s.jsxs("div",{className:"taxes-schedule-row",children:[s.jsx("span",{className:"taxes-schedule-line",children:"Line 9"}),s.jsx("span",{className:"taxes-schedule-desc",children:"Car and truck expenses (Fuel)"}),s.jsx("span",{className:"taxes-schedule-amount",children:a(t.scheduleC.carAndTruck)})]}),s.jsxs("div",{className:"taxes-schedule-row",children:[s.jsx("span",{className:"taxes-schedule-line",children:"Line 24a"}),s.jsx("span",{className:"taxes-schedule-desc",children:"Travel expenses (Trips)"}),s.jsx("span",{className:"taxes-schedule-amount",children:a(t.scheduleC.travel)})]}),s.jsxs("div",{className:"taxes-schedule-row",children:[s.jsx("span",{className:"taxes-schedule-line",children:"Line 24b"}),s.jsx("span",{className:"taxes-schedule-desc",children:"Meals & meetings (50% deductible)"}),s.jsx("span",{className:"taxes-schedule-amount",children:a(t.scheduleC.meals)})]}),s.jsxs("div",{className:"taxes-schedule-row",children:[s.jsx("span",{className:"taxes-schedule-line",children:"Line 26"}),s.jsx("span",{className:"taxes-schedule-desc",children:"Wages paid"}),s.jsx("span",{className:"taxes-schedule-amount",children:a(t.scheduleC.wages)})]}),s.jsxs("div",{className:"taxes-schedule-row",children:[s.jsx("span",{className:"taxes-schedule-line",children:"Line 27a"}),s.jsx("span",{className:"taxes-schedule-desc",children:"Other expenses"}),s.jsx("span",{className:"taxes-schedule-amount",children:a(t.scheduleC.otherExpenses)})]}),s.jsxs("div",{className:"taxes-schedule-row total",children:[s.jsx("span",{className:"taxes-schedule-line",children:"Line 28"}),s.jsx("span",{className:"taxes-schedule-desc",children:"Total expenses"}),s.jsx("span",{className:"taxes-schedule-amount",children:a(t.totalExpenses)})]}),s.jsxs("div",{className:"taxes-schedule-row net-profit",children:[s.jsx("span",{className:"taxes-schedule-line",children:"Line 31"}),s.jsx("span",{className:"taxes-schedule-desc",children:"Net profit (or loss)"}),s.jsx("span",{className:"taxes-schedule-amount",children:a(t.netIncome)})]})]})]}),s.jsxs("div",{className:"taxes-tips",children:[s.jsxs("h3",{children:[s.jsx(te,{size:18})," Important Tax Reminders"]}),s.jsxs("ul",{children:[s.jsxs("li",{children:[s.jsx("strong",{children:"Quarterly Payments:"})," Due April 15, June 15, September 15, January 15"]}),s.jsxs("li",{children:[s.jsx("strong",{children:"Meals Deduction:"})," Business meals are typically 50% deductible"]}),s.jsxs("li",{children:[s.jsx("strong",{children:"Vehicle Expenses:"})," Track mileage or actual expenses for car deductions"]}),s.jsxs("li",{children:[s.jsx("strong",{children:"Record Keeping:"})," Keep all receipts and records for at least 7 years"]}),s.jsxs("li",{children:[s.jsx("strong",{children:"Professional Advice:"})," Consult a CPA for accurate tax preparation"]})]})]})]})}export{de as default};
