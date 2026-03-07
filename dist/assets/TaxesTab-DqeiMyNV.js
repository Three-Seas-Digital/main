import{j as e}from"./three-DVqDxOd4.js";import{r as j}from"./vendor-BVkUCa2G.js";import{u as _,e as J}from"./index-BsOWJ3rs.js";import{a4 as B,ao as K,K as U,a2 as b,i as V,b1 as H,$ as X,u as Z}from"./icons-DCn7vf2g.js";import"./charts-CxIG5shu.js";function ne(){const{expenses:h,payments:p,clients:N,EXPENSE_CATEGORIES:T}=_(),[d,M]=j.useState(new Date().getFullYear()),[v,Q]=j.useState("sole_proprietor"),C=s=>new Date(s.createdAt).getFullYear(),w=s=>String(new Date(s.createdAt).getMonth()+1).padStart(2,"0"),G=j.useMemo(()=>{const s=new Set;return h.forEach(r=>s.add(parseInt(r.date.split("-")[0]))),p.forEach(r=>s.add(C(r))),s.size===0&&s.add(new Date().getFullYear()),Array.from(s).sort((r,g)=>g-r)},[h,p]),n=j.useMemo(()=>{var D,R,I,k,A,z;const s=d.toString(),r=p.filter(t=>C(t)===d&&t.status==="completed"),g=r.reduce((t,l)=>t+l.amount,0),u=h.filter(t=>t.date.startsWith(s)),E=u.reduce((t,l)=>t+l.amount,0),x=T.map(t=>{const l=u.filter(c=>c.category===t.value);return{...t,total:l.reduce((c,i)=>c+i.amount,0),count:l.length,items:l}}).filter(t=>t.total>0),F=g-E,$=[{name:"Q1",months:["01","02","03"]},{name:"Q2",months:["04","05","06"]},{name:"Q3",months:["07","08","09"]},{name:"Q4",months:["10","11","12"]}].map(t=>{const l=r.filter(i=>t.months.includes(w(i))).reduce((i,o)=>i+o.amount,0),c=u.filter(i=>t.months.some(o=>i.date.startsWith(`${s}-${o}`))).reduce((i,o)=>i+o.amount,0);return{...t,revenue:l,expenses:c,net:l-c}}),S=.153,L=.22,O=$.map(t=>({...t,seTax:Math.max(0,t.net*S),incomeTax:Math.max(0,t.net*L),totalTax:Math.max(0,t.net*(S+L))})),W=Array.from({length:12},(t,l)=>{const c=`${s}-${String(l+1).padStart(2,"0")}`,i=String(l+1).padStart(2,"0"),o=r.filter(m=>w(m)===i).reduce((m,f)=>m+f.amount,0),P=u.filter(m=>m.date.startsWith(c)).reduce((m,f)=>m+f.amount,0);return{name:new Date(d,l).toLocaleString("en-US",{month:"short"}),revenue:o,expenses:P,net:o-P}}),y={advertising:0,carAndTruck:((D=x.find(t=>t.value==="fuel"))==null?void 0:D.total)||0,commissions:0,contractLabor:0,depreciation:0,insurance:0,interest:0,legal:0,officeExpense:0,pensionPlans:0,rentLease:0,repairs:0,supplies:0,taxes:0,travel:((R=x.find(t=>t.value==="trips"))==null?void 0:R.total)||0,meals:(((I=x.find(t=>t.value==="food"))==null?void 0:I.total)||0)+(((k=x.find(t=>t.value==="meetings"))==null?void 0:k.total)||0),utilities:0,wages:((A=x.find(t=>t.value==="wages"))==null?void 0:A.total)||0,otherExpenses:((z=x.find(t=>t.value==="receipts"))==null?void 0:z.total)||0};return y.totalExpenses=Object.values(y).reduce((t,l)=>t+l,0),{grossRevenue:g,totalExpenses:E,netIncome:F,expensesByCategory:x,quarters:$,estimatedQuarterlyTax:O,months:W,scheduleC:y,transactionCount:r.length,expenseCount:u.length,clientCount:N.filter(t=>t.tier&&t.tier!=="free").length}},[d,h,p,N,T]),a=s=>`$${s.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}`,Y=()=>{const s=window.open("","_blank");s&&(s.document.write(`
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
          <p><strong>Business Type:</strong> ${v==="sole_proprietor"?"Sole Proprietor":v==="llc"?"LLC":"S-Corp"}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</p>
        </div>

        <h2>Annual Summary</h2>
        <div class="summary-grid">
          <div class="summary-box">
            <h4>Gross Revenue</h4>
            <p>${a(n.grossRevenue)}</p>
          </div>
          <div class="summary-box">
            <h4>Total Expenses</h4>
            <p>${a(n.totalExpenses)}</p>
          </div>
          <div class="summary-box highlight">
            <h4>Net Income</h4>
            <p>${a(n.netIncome)}</p>
          </div>
        </div>

        <h2>Quarterly Breakdown</h2>
        <table>
          <thead><tr><th>Quarter</th><th class="amount">Revenue</th><th class="amount">Expenses</th><th class="amount">Net Income</th><th class="amount">Est. Tax Due</th></tr></thead>
          <tbody>
            ${n.estimatedQuarterlyTax.map(r=>`
              <tr>
                <td>${r.name}</td>
                <td class="amount">${a(r.revenue)}</td>
                <td class="amount">${a(r.expenses)}</td>
                <td class="amount">${a(r.net)}</td>
                <td class="amount">${a(r.totalTax)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <h2>Expense Categories (Deductions)</h2>
        <table>
          <thead><tr><th>Category</th><th>Count</th><th class="amount">Total</th></tr></thead>
          <tbody>
            ${n.expensesByCategory.map(r=>`
              <tr><td>${J(r.label)}</td><td>${r.count}</td><td class="amount">${a(r.total)}</td></tr>
            `).join("")}
            <tr style="font-weight:bold;border-top:2px solid #1e3a5f">
              <td>TOTAL DEDUCTIONS</td>
              <td>${n.expenseCount}</td>
              <td class="amount">${a(n.totalExpenses)}</td>
            </tr>
          </tbody>
        </table>

        <div class="schedule-c">
          <h3>Schedule C Reference (Profit or Loss from Business)</h3>
          <table>
            <tr><td>Line 1 - Gross receipts or sales</td><td class="amount">${a(n.grossRevenue)}</td></tr>
            <tr><td>Line 4 - Cost of goods sold</td><td class="amount">$0.00</td></tr>
            <tr><td>Line 5 - Gross profit</td><td class="amount">${a(n.grossRevenue)}</td></tr>
            <tr><td>Line 9 - Car and truck expenses</td><td class="amount">${a(n.scheduleC.carAndTruck)}</td></tr>
            <tr><td>Line 24a - Travel</td><td class="amount">${a(n.scheduleC.travel)}</td></tr>
            <tr><td>Line 24b - Meals (50% deductible)</td><td class="amount">${a(n.scheduleC.meals)}</td></tr>
            <tr><td>Line 26 - Wages</td><td class="amount">${a(n.scheduleC.wages)}</td></tr>
            <tr><td>Line 27a - Other expenses</td><td class="amount">${a(n.scheduleC.otherExpenses)}</td></tr>
            <tr style="font-weight:bold;border-top:2px solid #0369a1">
              <td>Line 28 - Total expenses</td>
              <td class="amount">${a(n.totalExpenses)}</td>
            </tr>
            <tr style="font-weight:bold;background:#ecfdf5">
              <td>Line 31 - Net profit (or loss)</td>
              <td class="amount">${a(n.netIncome)}</td>
            </tr>
          </table>
        </div>

        <h2>Estimated Tax Liability</h2>
        <div class="summary-grid">
          <div class="summary-box warning">
            <h4>Self-Employment Tax (15.3%)</h4>
            <p>${a(n.netIncome*.153)}</p>
          </div>
          <div class="summary-box warning">
            <h4>Est. Income Tax (22%)</h4>
            <p>${a(n.netIncome*.22)}</p>
          </div>
          <div class="summary-box warning">
            <h4>Total Est. Tax</h4>
            <p>${a(n.netIncome*.373)}</p>
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
    `),s.document.close(),s.print())};return e.jsxs("div",{className:"taxes-tab",children:[e.jsxs("div",{className:"taxes-header",children:[e.jsxs("div",{className:"taxes-header-left",children:[e.jsxs("h2",{children:[e.jsx(B,{size:24})," Business Tax Center"]}),e.jsx("p",{children:"Auto-generated tax information from your financial records"})]}),e.jsxs("div",{className:"taxes-header-actions",children:[e.jsx("select",{value:d,onChange:s=>M(parseInt(s.target.value)),className:"taxes-year-select",children:G.map(s=>e.jsx("option",{value:s,children:s},s))}),e.jsxs("select",{value:v,onChange:s=>Q(s.target.value),className:"taxes-type-select",children:[e.jsx("option",{value:"sole_proprietor",children:"Sole Proprietor"}),e.jsx("option",{value:"llc",children:"LLC"}),e.jsx("option",{value:"scorp",children:"S-Corp"})]}),e.jsxs("button",{className:"btn btn-primary",onClick:Y,children:[e.jsx(K,{size:16})," Print Tax Summary"]})]})]}),e.jsxs("div",{className:"taxes-summary-grid",children:[e.jsxs("div",{className:"taxes-summary-card",children:[e.jsx("div",{className:"taxes-summary-icon revenue",children:e.jsx(U,{size:24})}),e.jsxs("div",{className:"taxes-summary-content",children:[e.jsx("span",{className:"taxes-summary-label",children:"Gross Revenue"}),e.jsx("span",{className:"taxes-summary-value",children:a(n.grossRevenue)}),e.jsxs("span",{className:"taxes-summary-sub",children:[n.transactionCount," transactions"]})]})]}),e.jsxs("div",{className:"taxes-summary-card",children:[e.jsx("div",{className:"taxes-summary-icon expenses",children:e.jsx(b,{size:24})}),e.jsxs("div",{className:"taxes-summary-content",children:[e.jsx("span",{className:"taxes-summary-label",children:"Total Deductions"}),e.jsx("span",{className:"taxes-summary-value",children:a(n.totalExpenses)}),e.jsxs("span",{className:"taxes-summary-sub",children:[n.expenseCount," expenses"]})]})]}),e.jsxs("div",{className:"taxes-summary-card highlight",children:[e.jsx("div",{className:"taxes-summary-icon net",children:e.jsx(V,{size:24})}),e.jsxs("div",{className:"taxes-summary-content",children:[e.jsx("span",{className:"taxes-summary-label",children:"Net Income"}),e.jsx("span",{className:"taxes-summary-value",children:a(n.netIncome)}),e.jsx("span",{className:"taxes-summary-sub",children:"Taxable income"})]})]}),e.jsxs("div",{className:"taxes-summary-card warning",children:[e.jsx("div",{className:"taxes-summary-icon tax",children:e.jsx(H,{size:24})}),e.jsxs("div",{className:"taxes-summary-content",children:[e.jsx("span",{className:"taxes-summary-label",children:"Est. Tax Liability"}),e.jsx("span",{className:"taxes-summary-value",children:a(n.netIncome*.373)}),e.jsx("span",{className:"taxes-summary-sub",children:"SE + Income tax"})]})]})]}),e.jsxs("div",{className:"taxes-section",children:[e.jsxs("h3",{children:[e.jsx(X,{size:18})," Quarterly Tax Estimates"]}),e.jsx("div",{className:"taxes-quarterly-grid",children:n.estimatedQuarterlyTax.map(s=>e.jsxs("div",{className:"taxes-quarter-card",children:[e.jsxs("div",{className:"taxes-quarter-header",children:[e.jsx("span",{className:"taxes-quarter-name",children:s.name}),e.jsx("span",{className:`taxes-quarter-net ${s.net>=0?"positive":"negative"}`,children:a(s.net)})]}),e.jsxs("div",{className:"taxes-quarter-details",children:[e.jsxs("div",{className:"taxes-quarter-row",children:[e.jsx("span",{children:"Revenue"}),e.jsx("span",{children:a(s.revenue)})]}),e.jsxs("div",{className:"taxes-quarter-row",children:[e.jsx("span",{children:"Expenses"}),e.jsxs("span",{children:["-",a(s.expenses)]})]}),e.jsxs("div",{className:"taxes-quarter-row highlight",children:[e.jsx("span",{children:"Est. Tax Due"}),e.jsx("span",{children:a(s.totalTax)})]})]})]},s.name))})]}),e.jsxs("div",{className:"taxes-section",children:[e.jsxs("h3",{children:[e.jsx(b,{size:18})," Deductible Expenses by Category"]}),n.expensesByCategory.length===0?e.jsxs("div",{className:"taxes-empty",children:[e.jsx(b,{size:48}),e.jsxs("p",{children:["No expenses recorded for ",d]})]}):e.jsxs("div",{className:"taxes-expense-list",children:[n.expensesByCategory.map(s=>e.jsxs("div",{className:"taxes-expense-row",children:[e.jsxs("div",{className:"taxes-expense-info",children:[e.jsx("span",{className:"taxes-expense-color",style:{background:s.color}}),e.jsx("span",{className:"taxes-expense-name",children:s.label}),e.jsxs("span",{className:"taxes-expense-count",children:[s.count," items"]})]}),e.jsx("span",{className:"taxes-expense-amount",children:a(s.total)})]},s.value)),e.jsxs("div",{className:"taxes-expense-row total",children:[e.jsx("div",{className:"taxes-expense-info",children:e.jsx("span",{className:"taxes-expense-name",children:"Total Deductions"})}),e.jsx("span",{className:"taxes-expense-amount",children:a(n.totalExpenses)})]})]})]}),e.jsxs("div",{className:"taxes-section schedule-c",children:[e.jsxs("h3",{children:[e.jsx(B,{size:18})," Schedule C Reference"]}),e.jsx("p",{className:"taxes-section-note",children:"Preview of key Schedule C line items based on your records"}),e.jsxs("div",{className:"taxes-schedule-grid",children:[e.jsxs("div",{className:"taxes-schedule-row",children:[e.jsx("span",{className:"taxes-schedule-line",children:"Line 1"}),e.jsx("span",{className:"taxes-schedule-desc",children:"Gross receipts or sales"}),e.jsx("span",{className:"taxes-schedule-amount",children:a(n.grossRevenue)})]}),e.jsxs("div",{className:"taxes-schedule-row",children:[e.jsx("span",{className:"taxes-schedule-line",children:"Line 5"}),e.jsx("span",{className:"taxes-schedule-desc",children:"Gross profit"}),e.jsx("span",{className:"taxes-schedule-amount",children:a(n.grossRevenue)})]}),e.jsxs("div",{className:"taxes-schedule-row",children:[e.jsx("span",{className:"taxes-schedule-line",children:"Line 9"}),e.jsx("span",{className:"taxes-schedule-desc",children:"Car and truck expenses (Fuel)"}),e.jsx("span",{className:"taxes-schedule-amount",children:a(n.scheduleC.carAndTruck)})]}),e.jsxs("div",{className:"taxes-schedule-row",children:[e.jsx("span",{className:"taxes-schedule-line",children:"Line 24a"}),e.jsx("span",{className:"taxes-schedule-desc",children:"Travel expenses (Trips)"}),e.jsx("span",{className:"taxes-schedule-amount",children:a(n.scheduleC.travel)})]}),e.jsxs("div",{className:"taxes-schedule-row",children:[e.jsx("span",{className:"taxes-schedule-line",children:"Line 24b"}),e.jsx("span",{className:"taxes-schedule-desc",children:"Meals & meetings (50% deductible)"}),e.jsx("span",{className:"taxes-schedule-amount",children:a(n.scheduleC.meals)})]}),e.jsxs("div",{className:"taxes-schedule-row",children:[e.jsx("span",{className:"taxes-schedule-line",children:"Line 26"}),e.jsx("span",{className:"taxes-schedule-desc",children:"Wages paid"}),e.jsx("span",{className:"taxes-schedule-amount",children:a(n.scheduleC.wages)})]}),e.jsxs("div",{className:"taxes-schedule-row",children:[e.jsx("span",{className:"taxes-schedule-line",children:"Line 27a"}),e.jsx("span",{className:"taxes-schedule-desc",children:"Other expenses"}),e.jsx("span",{className:"taxes-schedule-amount",children:a(n.scheduleC.otherExpenses)})]}),e.jsxs("div",{className:"taxes-schedule-row total",children:[e.jsx("span",{className:"taxes-schedule-line",children:"Line 28"}),e.jsx("span",{className:"taxes-schedule-desc",children:"Total expenses"}),e.jsx("span",{className:"taxes-schedule-amount",children:a(n.totalExpenses)})]}),e.jsxs("div",{className:"taxes-schedule-row net-profit",children:[e.jsx("span",{className:"taxes-schedule-line",children:"Line 31"}),e.jsx("span",{className:"taxes-schedule-desc",children:"Net profit (or loss)"}),e.jsx("span",{className:"taxes-schedule-amount",children:a(n.netIncome)})]})]})]}),e.jsxs("div",{className:"taxes-tips",children:[e.jsxs("h3",{children:[e.jsx(Z,{size:18})," Important Tax Reminders"]}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Quarterly Payments:"})," Due April 15, June 15, September 15, January 15"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Meals Deduction:"})," Business meals are typically 50% deductible"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Vehicle Expenses:"})," Track mileage or actual expenses for car deductions"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Record Keeping:"})," Keep all receipts and records for at least 7 years"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Professional Advice:"})," Consult a CPA for accurate tax preparation"]})]})]})]})}export{ne as default};
