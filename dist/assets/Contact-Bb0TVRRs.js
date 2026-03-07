import{j as e}from"./three-DVqDxOd4.js";import{r as m,h as w}from"./vendor-BVkUCa2G.js";/* empty css             */import{C as _}from"./Calendar-D82D_qcE.js";import{u as C,S as N}from"./index-KDagTXH3.js";import{m as P,n as R,o as D,b as E}from"./icons-DCn7vf2g.js";import"./charts-CxIG5shu.js";const F=1.5,T=`
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`,k=`
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_uv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float val = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    val += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return val;
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 centered = (uv - 0.5) * vec2(aspect, 1.0);
  float dist = length(centered);
  float angle = atan(centered.y, centered.x);

  // Organic ring distortion
  float n = fbm(centered * 3.0 + u_time * 0.15);
  float distorted = dist + n * 0.06;

  // Concentric rings — 3 sets at different speeds
  float speed = u_time * 0.25;
  float ringFreq = 12.0;
  float rings = 0.0;
  rings += smoothstep(0.85, 1.0, sin(distorted * ringFreq - speed * 6.0));
  rings += smoothstep(0.88, 1.0, sin(distorted * ringFreq * 0.7 - speed * 4.5 + 1.5)) * 0.5;
  rings += smoothstep(0.92, 1.0, sin(distorted * ringFreq * 1.4 - speed * 8.0 + 3.0)) * 0.25;

  // Radar sweep
  float sweepAngle = u_time * 0.6;
  float angleDiff = mod(angle - sweepAngle + 3.14159, 6.28318) - 3.14159;
  float sweep = smoothstep(0.8, 0.0, abs(angleDiff)) * 0.6;
  float sweepEdge = smoothstep(0.15, 0.0, abs(angleDiff)) * 0.4;

  // Distance falloff
  float falloff = exp(-dist * 1.8);
  float outerFade = smoothstep(1.2, 0.3, dist);

  // Combine
  float ringIntensity = rings * falloff * (0.4 + sweep * 1.2 + sweepEdge * 0.8);
  float sweepGlow = (sweep + sweepEdge) * falloff * 0.3;
  float centerGlow = exp(-dist * 8.0) * 0.5 * (0.8 + 0.2 * sin(u_time * 2.0));
  float intensity = (ringIntensity + sweepGlow + centerGlow) * outerFade;

  // Color: emerald at center → cyan at edges
  vec3 emerald = vec3(0.243, 0.812, 0.557);
  vec3 cyan = vec3(0.133, 0.827, 0.933);
  vec3 color = mix(emerald, cyan, smoothstep(0.0, 0.8, dist)) * intensity;

  // Vignette
  color *= 1.0 - smoothstep(0.3, 1.1, dist);

  float alpha = clamp(intensity * 0.8, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}`;function A(i,r,a){const t=i.createShader(a);return i.shaderSource(t,r),i.compileShader(t),i.getShaderParameter(t,i.COMPILE_STATUS)?t:null}function M(){const i=m.useRef(null),r=m.useRef(null);return m.useEffect(()=>{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const a=i.current;if(!a)return;const t=a.getContext("webgl",{alpha:!0,premultipliedAlpha:!1});if(!t)return;t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE);const g=A(t,T,t.VERTEX_SHADER),s=A(t,k,t.FRAGMENT_SHADER);if(!g||!s)return;const o=t.createProgram();if(t.attachShader(o,g),t.attachShader(o,s),t.linkProgram(o),!t.getProgramParameter(o,t.LINK_STATUS))return;t.useProgram(o);const d=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,d),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),t.STATIC_DRAW);const p=t.getAttribLocation(o,"a_position");t.enableVertexAttribArray(p),t.vertexAttribPointer(p,2,t.FLOAT,!1,0,0);const b=t.getUniformLocation(o,"u_time"),x=t.getUniformLocation(o,"u_resolution");function l(){const c=Math.min(window.devicePixelRatio,F),f=Math.round(a.clientWidth*c),h=Math.round(a.clientHeight*c);(a.width!==f||a.height!==h)&&(a.width=f,a.height=h,t.viewport(0,0,f,h))}const v=performance.now(),j=c=>{l(),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),t.uniform1f(b,(c-v)/1e3),t.uniform2f(x,a.width,a.height),t.drawArrays(t.TRIANGLE_STRIP,0,4),r.current=requestAnimationFrame(j)};return r.current=requestAnimationFrame(j),()=>{r.current&&cancelAnimationFrame(r.current)}},[]),e.jsx("canvas",{ref:i,className:"sonar-pulse-canvas","aria-hidden":"true"})}const I=["9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];function H(){const[i]=w(),r=i.get("template"),a=i.get("tier");m.useEffect(()=>{document.title="Contact Us — Three Seas Digital"},[]);const{addAppointment:t,getBookedTimesForDate:g}=C(),[s,o]=m.useState(""),[d,p]=m.useState(""),[b,x]=m.useState(!1),[l,v]=m.useState({name:"",email:"",phone:"",service:r?"consulting":"",message:r?`I'm interested in the ${r} (${a||"Enterprise"}) template. Please reach out to discuss custom pricing and implementation.`:""}),j=s?g(s):[],c=n=>{v({...l,[n.target.name]:n.target.value})},f=n=>{n.preventDefault(),!(!s||!d)&&(t({...l,date:s,time:d}),x(!0),setTimeout(()=>{x(!1),v({name:"",email:"",phone:"",service:"",message:""}),o(""),p("")},4e3))},h=n=>{if(!n)return"";const[u,S,y]=n.split("-");return new Date(u,S-1,y).toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})};return e.jsxs("div",{className:"page",children:[e.jsxs("section",{className:"contact-hero",children:[e.jsxs("div",{className:"contact-hero-bg",children:[e.jsx(M,{}),e.jsx("div",{className:"contact-hero-overlay"})]}),e.jsxs("div",{className:"contact-hero-content",children:[e.jsx("span",{className:"micro-label",children:"// Establish Connection"}),e.jsx("h1",{className:"contact-hero-title",children:"Initiate Contact"}),e.jsx("p",{className:"contact-hero-subtitle",children:e.jsx("span",{className:"glass-pill",children:"Open a communication frequency and let's explore the depths together"})})]})]}),e.jsx("section",{className:"section",children:e.jsxs("div",{className:"container",children:[r&&e.jsxs("div",{className:"contact-template-banner",style:{background:"linear-gradient(135deg, rgba(200,164,62,0.1), rgba(200,164,62,0.05))",border:"1px solid rgba(200,164,62,0.25)",borderRadius:"12px",padding:"16px 24px",marginBottom:"32px",display:"flex",alignItems:"center",gap:"12px",color:"#c8a43e",fontSize:"0.95rem",fontWeight:600},children:["Interested in ",e.jsx("strong",{style:{color:"var(--text-bright)",margin:"0 4px"},children:r})," — Enterprise Template"]}),e.jsxs("div",{className:"contact-grid",children:[e.jsxs("div",{className:"contact-calendar-side",children:[e.jsx("h2",{children:"Pick a Date & Time"}),e.jsx(_,{onDateSelect:o,selectedDate:s,showDots:!0}),s&&e.jsxs("div",{className:"time-slots",children:[e.jsxs("h3",{children:[e.jsx(P,{size:18}),"Available Times for ",h(s)]}),e.jsx("div",{className:"time-grid",children:I.map(n=>{const u=j.includes(n);return e.jsxs("button",{className:`time-btn ${d===n?"active":""} ${u?"booked":""}`,onClick:()=>!u&&p(n),disabled:u,children:[n,u&&e.jsx("span",{className:"booked-label",children:"Booked"})]},n)})})]})]}),e.jsxs("div",{className:"contact-form-side",children:[b?e.jsxs("div",{className:"success-message",children:[e.jsx(R,{size:48}),e.jsx("h2",{children:"Appointment Booked!"}),e.jsxs("p",{children:["We've received your booking for"," ",e.jsx("strong",{children:h(s)})," at"," ",e.jsx("strong",{children:d}),". We'll send you a confirmation email shortly."]})]}):e.jsxs(e.Fragment,{children:[e.jsx("h2",{children:"Your Details"}),e.jsxs("form",{onSubmit:f,className:"contact-form",children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Full Name *"}),e.jsx("input",{type:"text",name:"name",value:l.name,onChange:c,placeholder:"John Doe",required:!0})]}),e.jsxs("div",{className:"form-row",children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Email *"}),e.jsx("input",{type:"email",name:"email",value:l.email,onChange:c,placeholder:"john@example.com",required:!0})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Phone"}),e.jsx("input",{type:"tel",name:"phone",value:l.phone,onChange:c,placeholder:"(555) 123-4567"})]})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Service Interested In"}),e.jsxs("select",{name:"service",value:l.service,onChange:c,children:[e.jsx("option",{value:"",children:"Select a service"}),e.jsx("option",{value:"web-design",children:"Web Design"}),e.jsx("option",{value:"branding",children:"Branding"}),e.jsx("option",{value:"marketing",children:"Digital Marketing"}),e.jsx("option",{value:"app-dev",children:"App Development"}),e.jsx("option",{value:"consulting",children:"Consulting"})]})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Message"}),e.jsx("textarea",{name:"message",value:l.message,onChange:c,placeholder:"Tell us about your project...",rows:4})]}),s&&d?e.jsxs("div",{className:"booking-summary",children:[e.jsx("strong",{children:"Booking Summary:"})," ",h(s)," at ",d]}):e.jsx("div",{className:"booking-hint",children:s?"Please select a time slot":"Please select a date from the calendar"}),e.jsxs("button",{type:"submit",className:"btn btn-primary btn-full",disabled:!s||!d||!l.name||!l.email,children:[e.jsx(D,{size:18}),"Book Appointment"]})]})]}),e.jsxs("div",{className:"contact-info-cards",children:[e.jsxs("div",{className:"info-card",children:[e.jsx(E,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"Email"}),e.jsx("span",{children:N.email})]})]}),N.phone,N.address]})]})]})]})})]})}export{H as default};
