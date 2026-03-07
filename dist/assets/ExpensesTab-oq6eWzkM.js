import{j as a}from"./three-DVqDxOd4.js";import{r as d}from"./vendor-BVkUCa2G.js";import{u as De,e as b}from"./index-Ddo9v0aO.js";import{ab as J,X as R,a4 as Q,a2 as M,ao as V,q as $e,ae as Se}from"./icons-DCn7vf2g.js";import"./charts-CxIG5shu.js";function Ee(){const{expenses:g,addExpense:Z,deleteExpense:ee,EXPENSE_CATEGORIES:j}=De(),[i,N]=d.useState({category:"",amount:"",date:new Date().toISOString().split("T")[0],vendor:"",description:""}),[te,T]=d.useState(null),[F,k]=d.useState(""),[z,S]=d.useState(null),[P,ae]=d.useState("all"),[w,se]=d.useState("date-desc"),[ne,A]=d.useState(null),[p,B]=d.useState(null),[re,I]=d.useState(!1),[H,Y]=d.useState(""),[oe,C]=d.useState(!1),[n,f]=d.useState({reportType:"month",selectedMonth:`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}`,startDate:"",endDate:"",selectedYear:new Date().getFullYear(),category:"all",groupBy:"none"}),le=t=>new Promise(s=>{if(t.type==="application/pdf"){const r=new FileReader;r.onload=()=>s(r.result),r.readAsDataURL(t);return}const o=new FileReader;o.onload=r=>{const m=new Image;m.onload=()=>{const x=document.createElement("canvas"),y=800;let u=m.width,l=m.height;(u>y||l>y)&&(u>l?(l=Math.round(l*y/u),u=y):(u=Math.round(u*y/l),l=y)),x.width=u,x.height=l,x.getContext("2d").drawImage(m,0,0,u,l),s(x.toDataURL("image/jpeg",.6))},m.src=r.target.result},o.readAsDataURL(t)}),K=async t=>{if(!t)return;k(t.name);const s=await le(t);T(s),t.type.startsWith("image/")?S(s):S(null)},ie=t=>{t.preventDefault(),I(!1);const s=t.dataTransfer.files[0];s&&K(s)},ce=t=>{if(t.preventDefault(),Y(""),!i.category||!i.amount||!i.date){Y("Category, amount, and date are required");return}const s=Z({...i,receipt:te,receiptName:F});s.success?(N({category:"",amount:"",date:new Date().toISOString().split("T")[0],vendor:"",description:""}),T(null),k(""),S(null)):Y(s.error)},de=t=>{ee(t),A(null)},v=new Date,pe=`${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,"0")}`,me=`${v.getMonth()===0?v.getFullYear()-1:v.getFullYear()}-${String(v.getMonth()===0?12:v.getMonth()).padStart(2,"0")}`,X=g.filter(t=>e.date.startsWith(pe)),ue=g.filter(t=>e.date.startsWith(me)),_=X.reduce((t,s)=>t+s.amount,0),U=ue.reduce((t,s)=>t+s.amount,0),E=U>0?((_-U)/U*100).toFixed(1):null,W=j.map(t=>{const s=X.filter(o=>e.category===t.value).reduce((o,r)=>o+r.amount,0);return{...t,total:s}}).filter(t=>c.total>0),he=Math.max(...W.map(t=>c.total),1),O=g.filter(t=>P==="all"||e.category===P).sort((t,s)=>w==="date-desc"?s.date.localeCompare(t.date):w==="date-asc"?t.date.localeCompare(s.date):w==="amount-desc"?s.amount-t.amount:w==="amount-asc"?t.amount-s.amount:0),D=t=>{var s;return((s=j.find(o=>o.value===t))==null?void 0:s.label)||t},ge=t=>{var s;return((s=j.find(o=>o.value===t))==null?void 0:s.color)||"#6b7280"},xe=d.useMemo(()=>{const t=new Set;return g.forEach(s=>{const[o,r]=e.date.split("-");t.add(`${o}-${r}`)}),Array.from(t).sort().reverse()},[g]),ye=d.useMemo(()=>{const t=new Set;return g.forEach(s=>t.add(parseInt(e.date.split("-")[0]))),t.size===0&&t.add(new Date().getFullYear()),Array.from(t).sort((s,o)=>o-s)},[g]),q=()=>{let t=[...g];return n.reportType==="month"?t=t.filter(s=>e.date.startsWith(n.selectedMonth)):n.reportType==="year"?t=t.filter(s=>e.date.startsWith(n.selectedYear.toString())):n.reportType==="dateRange"&&n.startDate&&n.endDate&&(t=t.filter(s=>e.date>=n.startDate&&e.date<=n.endDate)),n.category!=="all"&&(t=t.filter(s=>e.category===n.category)),t.sort((s,o)=>s.date.localeCompare(o.date))},be=()=>{if(n.reportType==="month"){const[t,s]=n.selectedMonth.split("-");return new Date(parseInt(t),parseInt(s)-1).toLocaleDateString("en-US",{month:"long",year:"numeric"})}else{if(n.reportType==="year")return`Year ${n.selectedYear}`;if(n.reportType==="dateRange"&&n.startDate&&n.endDate){const t=new Date(n.startDate+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),s=new Date(n.endDate+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});return`${t} - ${s}`}}return"All Time"},ve=t=>{if(n.groupBy==="none")return null;const s={};return t.forEach(o=>{let r;if(n.groupBy==="category")r=D(e.category);else if(n.groupBy==="day")r=e.date;else if(n.groupBy==="week"){const m=new Date(e.date+"T00:00:00"),x=new Date(m);x.setDate(m.getDate()-m.getDay()),r=x.toISOString().split("T")[0]}s[r]||(s[r]=[]),s[r].push(e)}),s},je=()=>{const t=q(),s=t.reduce((l,h)=>l+h.amount,0),o=j.map(l=>({...l,total:t.filter(h=>e.category===l.value).reduce((h,L)=>h+L.amount,0),count:t.filter(h=>e.category===l.value).length})).filter(l=>c.total>0),r=ve(t),m=be(),x=n.category==="all"?"All Categories":D(n.category);let y="";r&&(y=Object.keys(r).sort().map(h=>{const L=r[h],fe=L.reduce(($,Ne)=>$+Ne.amount,0);let G=h;if(n.groupBy==="day")G=new Date(h+"T00:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});else if(n.groupBy==="week"){const $=new Date(h+"T00:00:00");$.setDate($.getDate()+6),G=`Week of ${new Date(h+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})} - ${$.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`}return`
          <div class="group-section">
            <h3 class="group-header">${b(G)} <span class="group-total">$${fe.toLocaleString(void 0,{minimumFractionDigits:2})}</span></h3>
            <table class="expense-table">
              <thead><tr><th>Date</th><th>Category</th><th>Vendor</th><th>Description</th><th class="amount">Amount</th></tr></thead>
              <tbody>
                ${L.map($=>`
                  <tr>
                    <td>${new Date(e.date+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td>
                    <td>${b(D(e.category))}</td>
                    <td>${b(e.vendor)||"-"}</td>
                    <td>${b(e.description)||"-"}</td>
                    <td class="amount">$${e.amount.toLocaleString(void 0,{minimumFractionDigits:2})}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `}).join(""));const u=window.open("","_blank");u.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Report - ${m}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; }
          h1 { color: #1e3a5f; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 5px; }
          h2 { color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
          .report-meta { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
          .report-meta span { display: inline-block; margin-right: 20px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 25px 0; }
          .summary-card { background: #f3f4f6; padding: 18px; border-radius: 8px; text-align: center; }
          .summary-card h3 { margin: 0 0 8px; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .summary-card p { margin: 0; font-size: 22px; font-weight: bold; color: #1e3a5f; }
          .category-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .category-table th, .category-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          .category-table th { background: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          .category-table tr:last-child { background: #f0f9ff; }
          .category-table tr:last-child td { font-weight: bold; border-top: 2px solid #1e3a5f; }
          .expense-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
          .expense-table th, .expense-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          .expense-table th { background: #f9fafb; font-weight: 600; }
          .expense-table .amount { text-align: right; font-family: monospace; }
          .group-section { margin-bottom: 25px; page-break-inside: avoid; }
          .group-header { display: flex; justify-content: space-between; align-items: center; background: #f0f9ff; padding: 10px 15px; border-radius: 6px; margin: 0 0 10px; font-size: 14px; }
          .group-total { color: #1e3a5f; font-weight: bold; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
          @media print {
            body { padding: 20px; }
            .group-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>Expense Report</h1>
        <div class="report-meta">
          <span><strong>Period:</strong> ${m}</span>
          <span><strong>Category:</strong> ${b(x)}</span>
          <span><strong>Generated:</strong> ${v.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</span>
        </div>

        <div class="summary">
          <div class="summary-card">
            <h3>Total Expenses</h3>
            <p>$${s.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
          </div>
          <div class="summary-card">
            <h3>Transactions</h3>
            <p>${t.length}</p>
          </div>
          <div class="summary-card">
            <h3>Categories</h3>
            <p>${o.length}</p>
          </div>
          <div class="summary-card">
            <h3>Avg per Transaction</h3>
            <p>$${t.length>0?(s/t.length).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2}):"0.00"}</p>
          </div>
        </div>

        <h2>Summary by Category</h2>
        <table class="category-table">
          <thead><tr><th>Category</th><th>Count</th><th style="text-align:right">Amount</th><th style="text-align:right">% of Total</th></tr></thead>
          <tbody>
            ${o.map(l=>`
              <tr>
                <td>${b(c.label)}</td>
                <td>${c.count}</td>
                <td style="text-align:right">$${c.total.toLocaleString(void 0,{minimumFractionDigits:2})}</td>
                <td style="text-align:right">${s>0?(c.total/s*100).toFixed(1):0}%</td>
              </tr>
            `).join("")}
            <tr>
              <td>TOTAL</td>
              <td>${t.length}</td>
              <td style="text-align:right">$${s.toLocaleString(void 0,{minimumFractionDigits:2})}</td>
              <td style="text-align:right">100%</td>
            </tr>
          </tbody>
        </table>

        <h2>Expense Details${n.groupBy!=="none"?` (Grouped by ${n.groupBy==="category"?"Category":n.groupBy==="day"?"Day":"Week"})`:""}</h2>
        ${r?y:`
          <table class="expense-table">
            <thead><tr><th>Date</th><th>Category</th><th>Vendor</th><th>Description</th><th class="amount">Amount</th></tr></thead>
            <tbody>
              ${t.map(l=>`
                <tr>
                  <td>${new Date(e.date+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</td>
                  <td>${b(D(e.category))}</td>
                  <td>${b(e.vendor)||"-"}</td>
                  <td>${b(e.description)||"-"}</td>
                  <td class="amount">$${e.amount.toLocaleString(void 0,{minimumFractionDigits:2})}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `}

        <div class="footer">
          <p>Three Seas Digital CRM — Expense Report — Keep this document for your tax records</p>
        </div>
      </body>
      </html>
    `),u.document.close(),u.print(),C(!1)};return a.jsxs("div",{className:"expenses-tab",children:[a.jsxs("div",{className:"expense-summary",children:[a.jsxs("div",{className:"expense-summary-card",children:[a.jsx("span",{className:"expense-summary-label",children:"This Month"}),a.jsxs("span",{className:"expense-summary-value",children:["$",_.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})]}),E!==null&&a.jsxs("span",{className:`expense-summary-change ${parseFloat(E)>0?"up":"down"}`,children:[parseFloat(E)>0?"+":"",E,"% vs last month"]})]}),a.jsxs("div",{className:"expense-summary-card",children:[a.jsx("span",{className:"expense-summary-label",children:"Total Expenses"}),a.jsxs("span",{className:"expense-summary-value",children:["$",g.reduce((t,s)=>t+s.amount,0).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})]}),a.jsxs("span",{className:"expense-summary-change neutral",children:[g.length," recorded"]})]}),W.length>0&&a.jsxs("div",{className:"expense-summary-card wide",children:[a.jsx("span",{className:"expense-summary-label",children:"This Month by Category"}),a.jsx("div",{className:"expense-category-bars",children:W.map(t=>a.jsxs("div",{className:"expense-category-bar",children:[a.jsxs("div",{className:"expense-cat-bar-label",children:[a.jsx("span",{style:{color:t.color},children:t.label}),a.jsxs("span",{children:["$",t.total.toLocaleString(void 0,{minimumFractionDigits:2})]})]}),a.jsx("div",{className:"expense-cat-bar-track",children:a.jsx("div",{className:"expense-cat-bar-fill",style:{width:`${t.total/he*100}%`,background:t.color}})})]},t.value))})]})]}),a.jsxs("div",{className:"expense-form-wrapper",children:[a.jsxs("h3",{children:[a.jsx(J,{size:16})," Record Expense"]}),H&&a.jsx("div",{className:"login-error",children:H}),a.jsxs("form",{className:"expense-form",onSubmit:ce,children:[a.jsxs("div",{className:"expense-form-group",children:[a.jsx("label",{children:"Category *"}),a.jsxs("select",{value:i.category,onChange:t=>N({...i,category:t.target.value}),required:!0,children:[a.jsx("option",{value:"",children:"Select category..."}),j.map(t=>a.jsx("option",{value:c.value,children:c.label},c.value))]})]}),a.jsxs("div",{className:"expense-form-group",children:[a.jsx("label",{children:"Amount *"}),a.jsx("input",{type:"number",step:"0.01",min:"0.01",value:i.amount,onChange:t=>N({...i,amount:t.target.value}),placeholder:"0.00",required:!0})]}),a.jsxs("div",{className:"expense-form-group",children:[a.jsx("label",{children:"Date *"}),a.jsx("input",{type:"date",value:i.date,onChange:t=>N({...i,date:t.target.value}),required:!0})]}),a.jsxs("div",{className:"expense-form-group",children:[a.jsx("label",{children:"Vendor"}),a.jsx("input",{type:"text",value:i.vendor,onChange:t=>N({...i,vendor:t.target.value}),placeholder:"Vendor name"})]}),a.jsxs("div",{className:"expense-form-group full-width",children:[a.jsx("label",{children:"Description"}),a.jsx("textarea",{value:i.description,onChange:t=>N({...i,description:t.target.value}),placeholder:"Expense details...",rows:2})]}),a.jsxs("div",{className:"expense-form-group full-width",children:[a.jsx("label",{children:"Receipt"}),a.jsxs("div",{className:`receipt-upload-area ${re?"dragover":""} ${z?"has-file":""}`,onDragOver:t=>{t.preventDefault(),I(!0)},onDragLeave:()=>I(!1),onDrop:ie,onClick:()=>document.getElementById("receipt-file-input").click(),children:[a.jsx("input",{id:"receipt-file-input",type:"file",accept:"image/*,.pdf",style:{display:"none"},onChange:t=>K(t.target.files[0])}),z?a.jsxs("div",{className:"receipt-preview",children:[a.jsx("img",{src:z,alt:"Receipt preview"}),a.jsx("button",{type:"button",className:"receipt-remove-btn",onClick:t=>{t.stopPropagation(),T(null),k(""),S(null)},children:a.jsx(R,{size:14})}),a.jsx("span",{className:"receipt-filename",children:F})]}):F?a.jsxs("div",{className:"receipt-preview",children:[a.jsx(Q,{size:32}),a.jsx("button",{type:"button",className:"receipt-remove-btn",onClick:t=>{t.stopPropagation(),T(null),k(""),S(null)},children:a.jsx(R,{size:14})}),a.jsx("span",{className:"receipt-filename",children:F})]}):a.jsxs("div",{className:"receipt-upload-placeholder",children:[a.jsx(M,{size:24}),a.jsx("span",{children:"Drop receipt here or click to upload"}),a.jsx("span",{className:"receipt-upload-hint",children:"Images or PDF"})]})]})]}),a.jsx("div",{className:"expense-form-actions",children:a.jsxs("button",{type:"submit",className:"btn btn-primary",children:[a.jsx(J,{size:14})," Add Expense"]})})]})]}),a.jsxs("div",{className:"expense-list-section",children:[a.jsxs("div",{className:"expense-list-header",children:[a.jsxs("h3",{children:[a.jsx(M,{size:16})," Expense Records (",O.length,")"]}),a.jsxs("div",{className:"expense-list-filters",children:[a.jsxs("button",{className:"btn btn-outline btn-sm",onClick:()=>C(!0),title:"Print expense report",children:[a.jsx(V,{size:14})," Print Report"]}),a.jsxs("select",{value:P,onChange:t=>ae(t.target.value),children:[a.jsx("option",{value:"all",children:"All Categories"}),j.map(t=>a.jsx("option",{value:c.value,children:c.label},c.value))]}),a.jsxs("select",{value:w,onChange:t=>se(t.target.value),children:[a.jsx("option",{value:"date-desc",children:"Newest First"}),a.jsx("option",{value:"date-asc",children:"Oldest First"}),a.jsx("option",{value:"amount-desc",children:"Highest Amount"}),a.jsx("option",{value:"amount-asc",children:"Lowest Amount"})]})]})]}),O.length===0?a.jsxs("div",{className:"empty-state",children:[a.jsx(M,{size:48}),a.jsx("p",{children:"No expenses recorded yet"})]}):a.jsx("div",{className:"expense-list",children:O.map(t=>a.jsxs("div",{className:"expense-card",children:[a.jsxs("div",{className:"expense-card-top",children:[a.jsx("span",{className:"expense-category-badge",style:{background:ge(t.category)},children:D(t.category)}),a.jsxs("span",{className:"expense-amount",children:["$",t.amount.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})]})]}),t.vendor&&a.jsx("div",{className:"expense-vendor",children:t.vendor}),t.description&&a.jsx("div",{className:"expense-description",children:t.description}),a.jsxs("div",{className:"expense-card-bottom",children:[a.jsx("span",{className:"expense-date",children:new Date(t.date+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}),a.jsxs("div",{className:"expense-card-actions",children:[t.receipt&&a.jsxs("button",{className:"receipt-indicator",title:"View receipt",onClick:()=>B(t),children:[a.jsx($e,{size:14})," Receipt"]}),ne===t.id?a.jsxs(a.Fragment,{children:[a.jsx("button",{className:"btn btn-sm btn-delete",onClick:()=>de(t.id),children:"Confirm"}),a.jsx("button",{className:"btn btn-sm btn-outline",onClick:()=>A(null),children:"Cancel"})]}):a.jsx("button",{className:"btn btn-sm btn-delete",onClick:()=>A(t.id),children:a.jsx(Se,{size:14})})]})]})]},t.id))})]}),p&&a.jsx("div",{className:"receipt-modal",onClick:()=>B(null),children:a.jsxs("div",{className:"receipt-modal-content",onClick:t=>t.stopPropagation(),children:[a.jsx("button",{className:"receipt-modal-close",onClick:()=>B(null),"aria-label":"Close",children:a.jsx(R,{size:20})}),a.jsxs("h3",{children:["Receipt — ",D(p.category)]}),p.vendor&&a.jsxs("p",{children:[p.vendor," — $",p.amount.toLocaleString(void 0,{minimumFractionDigits:2})]}),p.receipt&&p.receipt.startsWith("data:image")?a.jsx("img",{src:p.receipt,alt:"Receipt",className:"receipt-modal-image"}):p.receipt?a.jsxs("div",{className:"receipt-modal-pdf",children:[a.jsx(Q,{size:48}),a.jsx("p",{children:p.receiptName||"PDF Receipt"}),a.jsx("a",{href:p.receipt,download:p.receiptName||"receipt.pdf",className:"btn btn-primary btn-sm",children:"Download PDF"})]}):null]})}),oe&&a.jsx("div",{className:"print-modal-overlay",onClick:()=>C(!1),children:a.jsxs("div",{className:"print-modal",onClick:t=>t.stopPropagation(),children:[a.jsxs("div",{className:"print-modal-header",children:[a.jsxs("h3",{children:[a.jsx(V,{size:20})," Print Expense Report"]}),a.jsx("button",{className:"print-modal-close",onClick:()=>C(!1),"aria-label":"Close",children:a.jsx(R,{size:20})})]}),a.jsxs("div",{className:"print-modal-body",children:[a.jsxs("div",{className:"print-option-group",children:[a.jsx("label",{className:"print-option-label",children:"Report Period"}),a.jsx("div",{className:"print-option-buttons",children:[{value:"month",label:"Month"},{value:"year",label:"Year"},{value:"dateRange",label:"Date Range"},{value:"all",label:"All Time"}].map(t=>a.jsx("button",{className:`print-option-btn ${n.reportType===t.value?"active":""}`,onClick:()=>f({...n,reportType:t.value}),children:t.label},t.value))})]}),n.reportType==="month"&&a.jsxs("div",{className:"print-option-group",children:[a.jsx("label",{className:"print-option-label",children:"Select Month"}),a.jsx("select",{value:n.selectedMonth,onChange:t=>f({...n,selectedMonth:t.target.value}),className:"print-select",children:xe.map(t=>{const[s,o]=t.split("-"),r=new Date(parseInt(s),parseInt(o)-1).toLocaleDateString("en-US",{month:"long",year:"numeric"});return a.jsx("option",{value:t,children:r},t)})})]}),n.reportType==="year"&&a.jsxs("div",{className:"print-option-group",children:[a.jsx("label",{className:"print-option-label",children:"Select Year"}),a.jsx("select",{value:n.selectedYear,onChange:t=>f({...n,selectedYear:parseInt(t.target.value)}),className:"print-select",children:ye.map(t=>a.jsx("option",{value:t,children:t},t))})]}),n.reportType==="dateRange"&&a.jsxs("div",{className:"print-option-group",children:[a.jsx("label",{className:"print-option-label",children:"Date Range"}),a.jsxs("div",{className:"print-date-range",children:[a.jsx("input",{type:"date",value:n.startDate,onChange:t=>f({...n,startDate:t.target.value}),className:"print-date-input"}),a.jsx("span",{children:"to"}),a.jsx("input",{type:"date",value:n.endDate,onChange:t=>f({...n,endDate:t.target.value}),className:"print-date-input"})]})]}),a.jsxs("div",{className:"print-option-group",children:[a.jsx("label",{className:"print-option-label",children:"Category"}),a.jsxs("select",{value:n.category,onChange:t=>f({...n,category:t.target.value}),className:"print-select",children:[a.jsx("option",{value:"all",children:"All Categories"}),j.map(t=>a.jsx("option",{value:c.value,children:c.label},c.value))]})]}),a.jsxs("div",{className:"print-option-group",children:[a.jsx("label",{className:"print-option-label",children:"Group By"}),a.jsx("div",{className:"print-option-buttons",children:[{value:"none",label:"None"},{value:"day",label:"Day"},{value:"week",label:"Week"},{value:"category",label:"Category"}].map(t=>a.jsx("button",{className:`print-option-btn ${n.groupBy===t.value?"active":""}`,onClick:()=>f({...n,groupBy:t.value}),children:t.label},t.value))})]}),a.jsxs("div",{className:"print-preview-info",children:[a.jsx(M,{size:16}),a.jsxs("span",{children:[q().length," expenses will be included in this report"]})]})]}),a.jsxs("div",{className:"print-modal-footer",children:[a.jsx("button",{className:"btn btn-outline",onClick:()=>C(!1),children:"Cancel"}),a.jsxs("button",{className:"btn btn-primary",onClick:je,disabled:q().length===0,children:[a.jsx(V,{size:16})," Generate Report"]})]})]})})]})}export{Ee as default};
