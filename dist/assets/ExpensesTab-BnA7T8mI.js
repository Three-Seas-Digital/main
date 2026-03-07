import{j as t}from"./three-DVqDxOd4.js";import{r as i}from"./vendor-BVkUCa2G.js";import{u as fe,e as y}from"./index-SrnUUU2y.js";import{ab as X,X as E,a4 as _,a2 as L,ao as q,q as Ne,ae as De}from"./icons-DCn7vf2g.js";import"./charts-CxIG5shu.js";function Fe(){const{expenses:h,addExpense:J,deleteExpense:Q,EXPENSE_CATEGORIES:v}=fe(),[l,f]=i.useState({category:"",amount:"",date:new Date().toISOString().split("T")[0],vendor:"",description:""}),[Z,C]=i.useState(null),[$,T]=i.useState(""),[R,D]=i.useState(null),[M,ee]=i.useState("all"),[S,te]=i.useState("date-desc"),[ae,z]=i.useState(null),[d,P]=i.useState(null),[se,A]=i.useState(!1),[G,B]=i.useState(""),[ne,w]=i.useState(!1),[s,j]=i.useState({reportType:"month",selectedMonth:`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}`,startDate:"",endDate:"",selectedYear:new Date().getFullYear(),category:"all",groupBy:"none"}),re=e=>new Promise(a=>{if(e.type==="application/pdf"){const o=new FileReader;o.onload=()=>a(o.result),o.readAsDataURL(e);return}const r=new FileReader;r.onload=o=>{const p=new Image;p.onload=()=>{const g=document.createElement("canvas"),x=800;let m=p.width,n=p.height;(m>x||n>x)&&(m>n?(n=Math.round(n*x/m),m=x):(m=Math.round(m*x/n),n=x)),g.width=m,g.height=n,g.getContext("2d").drawImage(p,0,0,m,n),a(g.toDataURL("image/jpeg",.6))},p.src=o.target.result},r.readAsDataURL(e)}),V=async e=>{if(!e)return;T(e.name);const a=await re(e);C(a),e.type.startsWith("image/")?D(a):D(null)},oe=e=>{e.preventDefault(),A(!1);const a=e.dataTransfer.files[0];a&&V(a)},le=e=>{if(e.preventDefault(),B(""),!l.category||!l.amount||!l.date){B("Category, amount, and date are required");return}const a=J({...l,receipt:Z,receiptName:$});a.success?(f({category:"",amount:"",date:new Date().toISOString().split("T")[0],vendor:"",description:""}),C(null),T(""),D(null)):B(a.error)},ie=e=>{Q(e),z(null)},b=new Date,ce=`${b.getFullYear()}-${String(b.getMonth()+1).padStart(2,"0")}`,de=`${b.getMonth()===0?b.getFullYear()-1:b.getFullYear()}-${String(b.getMonth()===0?12:b.getMonth()).padStart(2,"0")}`,H=h.filter(e=>e.date.startsWith(ce)),pe=h.filter(e=>e.date.startsWith(de)),K=H.reduce((e,a)=>e+a.amount,0),I=pe.reduce((e,a)=>e+a.amount,0),F=I>0?((K-I)/I*100).toFixed(1):null,Y=v.map(e=>{const a=H.filter(r=>r.category===e.value).reduce((r,o)=>r+o.amount,0);return{...e,total:a}}).filter(e=>e.total>0),me=Math.max(...Y.map(e=>e.total),1),U=h.filter(e=>M==="all"||e.category===M).sort((e,a)=>S==="date-desc"?a.date.localeCompare(e.date):S==="date-asc"?e.date.localeCompare(a.date):S==="amount-desc"?a.amount-e.amount:S==="amount-asc"?e.amount-a.amount:0),N=e=>{var a;return((a=v.find(r=>r.value===e))==null?void 0:a.label)||e},ue=e=>{var a;return((a=v.find(r=>r.value===e))==null?void 0:a.color)||"#6b7280"},he=i.useMemo(()=>{const e=new Set;return h.forEach(a=>{const[r,o]=a.date.split("-");e.add(`${r}-${o}`)}),Array.from(e).sort().reverse()},[h]),ge=i.useMemo(()=>{const e=new Set;return h.forEach(a=>e.add(parseInt(a.date.split("-")[0]))),e.size===0&&e.add(new Date().getFullYear()),Array.from(e).sort((a,r)=>r-a)},[h]),W=()=>{let e=[...h];return s.reportType==="month"?e=e.filter(a=>a.date.startsWith(s.selectedMonth)):s.reportType==="year"?e=e.filter(a=>a.date.startsWith(s.selectedYear.toString())):s.reportType==="dateRange"&&s.startDate&&s.endDate&&(e=e.filter(a=>a.date>=s.startDate&&a.date<=s.endDate)),s.category!=="all"&&(e=e.filter(a=>a.category===s.category)),e.sort((a,r)=>a.date.localeCompare(r.date))},xe=()=>{if(s.reportType==="month"){const[e,a]=s.selectedMonth.split("-");return new Date(parseInt(e),parseInt(a)-1).toLocaleDateString("en-US",{month:"long",year:"numeric"})}else{if(s.reportType==="year")return`Year ${s.selectedYear}`;if(s.reportType==="dateRange"&&s.startDate&&s.endDate){const e=new Date(s.startDate+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),a=new Date(s.endDate+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});return`${e} - ${a}`}}return"All Time"},ye=e=>{if(s.groupBy==="none")return null;const a={};return e.forEach(r=>{let o;if(s.groupBy==="category")o=N(r.category);else if(s.groupBy==="day")o=r.date;else if(s.groupBy==="week"){const p=new Date(r.date+"T00:00:00"),g=new Date(p);g.setDate(p.getDate()-p.getDay()),o=g.toISOString().split("T")[0]}a[o]||(a[o]=[]),a[o].push(r)}),a},be=()=>{const e=W(),a=e.reduce((n,c)=>n+c.amount,0),r=v.map(n=>({...n,total:e.filter(c=>c.category===n.value).reduce((c,k)=>c+k.amount,0),count:e.filter(c=>c.category===n.value).length})).filter(n=>n.total>0),o=ye(e),p=xe(),g=s.category==="all"?"All Categories":N(s.category);let x="";o&&(x=Object.keys(o).sort().map(c=>{const k=o[c],ve=k.reduce((u,je)=>u+je.amount,0);let O=c;if(s.groupBy==="day")O=new Date(c+"T00:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});else if(s.groupBy==="week"){const u=new Date(c+"T00:00:00");u.setDate(u.getDate()+6),O=`Week of ${new Date(c+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})} - ${u.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`}return`
          <div class="group-section">
            <h3 class="group-header">${y(O)} <span class="group-total">$${ve.toLocaleString(void 0,{minimumFractionDigits:2})}</span></h3>
            <table class="expense-table">
              <thead><tr><th>Date</th><th>Category</th><th>Vendor</th><th>Description</th><th class="amount">Amount</th></tr></thead>
              <tbody>
                ${k.map(u=>`
                  <tr>
                    <td>${new Date(u.date+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td>
                    <td>${y(N(u.category))}</td>
                    <td>${y(u.vendor)||"-"}</td>
                    <td>${y(u.description)||"-"}</td>
                    <td class="amount">$${u.amount.toLocaleString(void 0,{minimumFractionDigits:2})}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `}).join(""));const m=window.open("","_blank");m.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Report - ${p}</title>
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
          <span><strong>Period:</strong> ${p}</span>
          <span><strong>Category:</strong> ${y(g)}</span>
          <span><strong>Generated:</strong> ${b.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</span>
        </div>

        <div class="summary">
          <div class="summary-card">
            <h3>Total Expenses</h3>
            <p>$${a.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
          </div>
          <div class="summary-card">
            <h3>Transactions</h3>
            <p>${e.length}</p>
          </div>
          <div class="summary-card">
            <h3>Categories</h3>
            <p>${r.length}</p>
          </div>
          <div class="summary-card">
            <h3>Avg per Transaction</h3>
            <p>$${e.length>0?(a/e.length).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2}):"0.00"}</p>
          </div>
        </div>

        <h2>Summary by Category</h2>
        <table class="category-table">
          <thead><tr><th>Category</th><th>Count</th><th style="text-align:right">Amount</th><th style="text-align:right">% of Total</th></tr></thead>
          <tbody>
            ${r.map(n=>`
              <tr>
                <td>${y(n.label)}</td>
                <td>${n.count}</td>
                <td style="text-align:right">$${n.total.toLocaleString(void 0,{minimumFractionDigits:2})}</td>
                <td style="text-align:right">${a>0?(n.total/a*100).toFixed(1):0}%</td>
              </tr>
            `).join("")}
            <tr>
              <td>TOTAL</td>
              <td>${e.length}</td>
              <td style="text-align:right">$${a.toLocaleString(void 0,{minimumFractionDigits:2})}</td>
              <td style="text-align:right">100%</td>
            </tr>
          </tbody>
        </table>

        <h2>Expense Details${s.groupBy!=="none"?` (Grouped by ${s.groupBy==="category"?"Category":s.groupBy==="day"?"Day":"Week"})`:""}</h2>
        ${o?x:`
          <table class="expense-table">
            <thead><tr><th>Date</th><th>Category</th><th>Vendor</th><th>Description</th><th class="amount">Amount</th></tr></thead>
            <tbody>
              ${e.map(n=>`
                <tr>
                  <td>${new Date(n.date+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</td>
                  <td>${y(N(n.category))}</td>
                  <td>${y(n.vendor)||"-"}</td>
                  <td>${y(n.description)||"-"}</td>
                  <td class="amount">$${n.amount.toLocaleString(void 0,{minimumFractionDigits:2})}</td>
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
    `),m.document.close(),m.print(),w(!1)};return t.jsxs("div",{className:"expenses-tab",children:[t.jsxs("div",{className:"expense-summary",children:[t.jsxs("div",{className:"expense-summary-card",children:[t.jsx("span",{className:"expense-summary-label",children:"This Month"}),t.jsxs("span",{className:"expense-summary-value",children:["$",K.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})]}),F!==null&&t.jsxs("span",{className:`expense-summary-change ${parseFloat(F)>0?"up":"down"}`,children:[parseFloat(F)>0?"+":"",F,"% vs last month"]})]}),t.jsxs("div",{className:"expense-summary-card",children:[t.jsx("span",{className:"expense-summary-label",children:"Total Expenses"}),t.jsxs("span",{className:"expense-summary-value",children:["$",h.reduce((e,a)=>e+a.amount,0).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})]}),t.jsxs("span",{className:"expense-summary-change neutral",children:[h.length," recorded"]})]}),Y.length>0&&t.jsxs("div",{className:"expense-summary-card wide",children:[t.jsx("span",{className:"expense-summary-label",children:"This Month by Category"}),t.jsx("div",{className:"expense-category-bars",children:Y.map(e=>t.jsxs("div",{className:"expense-category-bar",children:[t.jsxs("div",{className:"expense-cat-bar-label",children:[t.jsx("span",{style:{color:e.color},children:e.label}),t.jsxs("span",{children:["$",e.total.toLocaleString(void 0,{minimumFractionDigits:2})]})]}),t.jsx("div",{className:"expense-cat-bar-track",children:t.jsx("div",{className:"expense-cat-bar-fill",style:{width:`${e.total/me*100}%`,background:e.color}})})]},e.value))})]})]}),t.jsxs("div",{className:"expense-form-wrapper",children:[t.jsxs("h3",{children:[t.jsx(X,{size:16})," Record Expense"]}),G&&t.jsx("div",{className:"login-error",children:G}),t.jsxs("form",{className:"expense-form",onSubmit:le,children:[t.jsxs("div",{className:"expense-form-group",children:[t.jsx("label",{children:"Category *"}),t.jsxs("select",{value:l.category,onChange:e=>f({...l,category:e.target.value}),required:!0,children:[t.jsx("option",{value:"",children:"Select category..."}),v.map(e=>t.jsx("option",{value:e.value,children:e.label},e.value))]})]}),t.jsxs("div",{className:"expense-form-group",children:[t.jsx("label",{children:"Amount *"}),t.jsx("input",{type:"number",step:"0.01",min:"0.01",value:l.amount,onChange:e=>f({...l,amount:e.target.value}),placeholder:"0.00",required:!0})]}),t.jsxs("div",{className:"expense-form-group",children:[t.jsx("label",{children:"Date *"}),t.jsx("input",{type:"date",value:l.date,onChange:e=>f({...l,date:e.target.value}),required:!0})]}),t.jsxs("div",{className:"expense-form-group",children:[t.jsx("label",{children:"Vendor"}),t.jsx("input",{type:"text",value:l.vendor,onChange:e=>f({...l,vendor:e.target.value}),placeholder:"Vendor name"})]}),t.jsxs("div",{className:"expense-form-group full-width",children:[t.jsx("label",{children:"Description"}),t.jsx("textarea",{value:l.description,onChange:e=>f({...l,description:e.target.value}),placeholder:"Expense details...",rows:2})]}),t.jsxs("div",{className:"expense-form-group full-width",children:[t.jsx("label",{children:"Receipt"}),t.jsxs("div",{className:`receipt-upload-area ${se?"dragover":""} ${R?"has-file":""}`,onDragOver:e=>{e.preventDefault(),A(!0)},onDragLeave:()=>A(!1),onDrop:oe,onClick:()=>document.getElementById("receipt-file-input").click(),children:[t.jsx("input",{id:"receipt-file-input",type:"file",accept:"image/*,.pdf",style:{display:"none"},onChange:e=>V(e.target.files[0])}),R?t.jsxs("div",{className:"receipt-preview",children:[t.jsx("img",{src:R,alt:"Receipt preview"}),t.jsx("button",{type:"button",className:"receipt-remove-btn",onClick:e=>{e.stopPropagation(),C(null),T(""),D(null)},children:t.jsx(E,{size:14})}),t.jsx("span",{className:"receipt-filename",children:$})]}):$?t.jsxs("div",{className:"receipt-preview",children:[t.jsx(_,{size:32}),t.jsx("button",{type:"button",className:"receipt-remove-btn",onClick:e=>{e.stopPropagation(),C(null),T(""),D(null)},children:t.jsx(E,{size:14})}),t.jsx("span",{className:"receipt-filename",children:$})]}):t.jsxs("div",{className:"receipt-upload-placeholder",children:[t.jsx(L,{size:24}),t.jsx("span",{children:"Drop receipt here or click to upload"}),t.jsx("span",{className:"receipt-upload-hint",children:"Images or PDF"})]})]})]}),t.jsx("div",{className:"expense-form-actions",children:t.jsxs("button",{type:"submit",className:"btn btn-primary",children:[t.jsx(X,{size:14})," Add Expense"]})})]})]}),t.jsxs("div",{className:"expense-list-section",children:[t.jsxs("div",{className:"expense-list-header",children:[t.jsxs("h3",{children:[t.jsx(L,{size:16})," Expense Records (",U.length,")"]}),t.jsxs("div",{className:"expense-list-filters",children:[t.jsxs("button",{className:"btn btn-outline btn-sm",onClick:()=>w(!0),title:"Print expense report",children:[t.jsx(q,{size:14})," Print Report"]}),t.jsxs("select",{value:M,onChange:e=>ee(e.target.value),children:[t.jsx("option",{value:"all",children:"All Categories"}),v.map(e=>t.jsx("option",{value:e.value,children:e.label},e.value))]}),t.jsxs("select",{value:S,onChange:e=>te(e.target.value),children:[t.jsx("option",{value:"date-desc",children:"Newest First"}),t.jsx("option",{value:"date-asc",children:"Oldest First"}),t.jsx("option",{value:"amount-desc",children:"Highest Amount"}),t.jsx("option",{value:"amount-asc",children:"Lowest Amount"})]})]})]}),U.length===0?t.jsxs("div",{className:"empty-state",children:[t.jsx(L,{size:48}),t.jsx("p",{children:"No expenses recorded yet"})]}):t.jsx("div",{className:"expense-list",children:U.map(e=>t.jsxs("div",{className:"expense-card",children:[t.jsxs("div",{className:"expense-card-top",children:[t.jsx("span",{className:"expense-category-badge",style:{background:ue(e.category)},children:N(e.category)}),t.jsxs("span",{className:"expense-amount",children:["$",e.amount.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})]})]}),e.vendor&&t.jsx("div",{className:"expense-vendor",children:e.vendor}),e.description&&t.jsx("div",{className:"expense-description",children:e.description}),t.jsxs("div",{className:"expense-card-bottom",children:[t.jsx("span",{className:"expense-date",children:new Date(e.date+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}),t.jsxs("div",{className:"expense-card-actions",children:[e.receipt&&t.jsxs("button",{className:"receipt-indicator",title:"View receipt",onClick:()=>P(e),children:[t.jsx(Ne,{size:14})," Receipt"]}),ae===e.id?t.jsxs(t.Fragment,{children:[t.jsx("button",{className:"btn btn-sm btn-delete",onClick:()=>ie(e.id),children:"Confirm"}),t.jsx("button",{className:"btn btn-sm btn-outline",onClick:()=>z(null),children:"Cancel"})]}):t.jsx("button",{className:"btn btn-sm btn-delete",onClick:()=>z(e.id),children:t.jsx(De,{size:14})})]})]})]},e.id))})]}),d&&t.jsx("div",{className:"receipt-modal",onClick:()=>P(null),children:t.jsxs("div",{className:"receipt-modal-content",onClick:e=>e.stopPropagation(),children:[t.jsx("button",{className:"receipt-modal-close",onClick:()=>P(null),"aria-label":"Close",children:t.jsx(E,{size:20})}),t.jsxs("h3",{children:["Receipt — ",N(d.category)]}),d.vendor&&t.jsxs("p",{children:[d.vendor," — $",d.amount.toLocaleString(void 0,{minimumFractionDigits:2})]}),d.receipt&&d.receipt.startsWith("data:image")?t.jsx("img",{src:d.receipt,alt:"Receipt",className:"receipt-modal-image"}):d.receipt?t.jsxs("div",{className:"receipt-modal-pdf",children:[t.jsx(_,{size:48}),t.jsx("p",{children:d.receiptName||"PDF Receipt"}),t.jsx("a",{href:d.receipt,download:d.receiptName||"receipt.pdf",className:"btn btn-primary btn-sm",children:"Download PDF"})]}):null]})}),ne&&t.jsx("div",{className:"print-modal-overlay",onClick:()=>w(!1),children:t.jsxs("div",{className:"print-modal",onClick:e=>e.stopPropagation(),children:[t.jsxs("div",{className:"print-modal-header",children:[t.jsxs("h3",{children:[t.jsx(q,{size:20})," Print Expense Report"]}),t.jsx("button",{className:"print-modal-close",onClick:()=>w(!1),"aria-label":"Close",children:t.jsx(E,{size:20})})]}),t.jsxs("div",{className:"print-modal-body",children:[t.jsxs("div",{className:"print-option-group",children:[t.jsx("label",{className:"print-option-label",children:"Report Period"}),t.jsx("div",{className:"print-option-buttons",children:[{value:"month",label:"Month"},{value:"year",label:"Year"},{value:"dateRange",label:"Date Range"},{value:"all",label:"All Time"}].map(e=>t.jsx("button",{className:`print-option-btn ${s.reportType===e.value?"active":""}`,onClick:()=>j({...s,reportType:e.value}),children:e.label},e.value))})]}),s.reportType==="month"&&t.jsxs("div",{className:"print-option-group",children:[t.jsx("label",{className:"print-option-label",children:"Select Month"}),t.jsx("select",{value:s.selectedMonth,onChange:e=>j({...s,selectedMonth:e.target.value}),className:"print-select",children:he.map(e=>{const[a,r]=e.split("-"),o=new Date(parseInt(a),parseInt(r)-1).toLocaleDateString("en-US",{month:"long",year:"numeric"});return t.jsx("option",{value:e,children:o},e)})})]}),s.reportType==="year"&&t.jsxs("div",{className:"print-option-group",children:[t.jsx("label",{className:"print-option-label",children:"Select Year"}),t.jsx("select",{value:s.selectedYear,onChange:e=>j({...s,selectedYear:parseInt(e.target.value)}),className:"print-select",children:ge.map(e=>t.jsx("option",{value:e,children:e},e))})]}),s.reportType==="dateRange"&&t.jsxs("div",{className:"print-option-group",children:[t.jsx("label",{className:"print-option-label",children:"Date Range"}),t.jsxs("div",{className:"print-date-range",children:[t.jsx("input",{type:"date",value:s.startDate,onChange:e=>j({...s,startDate:e.target.value}),className:"print-date-input"}),t.jsx("span",{children:"to"}),t.jsx("input",{type:"date",value:s.endDate,onChange:e=>j({...s,endDate:e.target.value}),className:"print-date-input"})]})]}),t.jsxs("div",{className:"print-option-group",children:[t.jsx("label",{className:"print-option-label",children:"Category"}),t.jsxs("select",{value:s.category,onChange:e=>j({...s,category:e.target.value}),className:"print-select",children:[t.jsx("option",{value:"all",children:"All Categories"}),v.map(e=>t.jsx("option",{value:e.value,children:e.label},e.value))]})]}),t.jsxs("div",{className:"print-option-group",children:[t.jsx("label",{className:"print-option-label",children:"Group By"}),t.jsx("div",{className:"print-option-buttons",children:[{value:"none",label:"None"},{value:"day",label:"Day"},{value:"week",label:"Week"},{value:"category",label:"Category"}].map(e=>t.jsx("button",{className:`print-option-btn ${s.groupBy===e.value?"active":""}`,onClick:()=>j({...s,groupBy:e.value}),children:e.label},e.value))})]}),t.jsxs("div",{className:"print-preview-info",children:[t.jsx(L,{size:16}),t.jsxs("span",{children:[W().length," expenses will be included in this report"]})]})]}),t.jsxs("div",{className:"print-modal-footer",children:[t.jsx("button",{className:"btn btn-outline",onClick:()=>w(!1),children:"Cancel"}),t.jsxs("button",{className:"btn btn-primary",onClick:be,disabled:W().length===0,children:[t.jsx(q,{size:16})," Generate Report"]})]})]})})]})}export{Fe as default};
