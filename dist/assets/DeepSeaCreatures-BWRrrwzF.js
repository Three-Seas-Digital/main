import{j as x}from"./three-DVqDxOd4.js";import{r as c}from"./vendor-BVkUCa2G.js";import"./charts-CxIG5shu.js";const y=1.5,A=`
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`,_=`
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_lightMode;
varying vec2 v_uv;

#define PI 3.14159265

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
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// SDF for a jellyfish bell (parabolic dome)
float bellSDF(vec2 p, float w, float h) {
  // Upper dome: ellipse top half
  float ex = p.x / w;
  float ey = p.y / h;
  float ellipse = ex * ex + ey * ey - 1.0;
  // Only top half
  if (p.y < 0.0) {
    // Underside: concave scoop
    float scoop = length(vec2(p.x / (w * 0.85), (p.y + h * 0.15) / (h * 0.5))) - 1.0;
    return min(ellipse, scoop);
  }
  return ellipse;
}

// One full jellyfish: bell + oral arms + tentacles + glow
// Returns vec4(rgb color, intensity)
vec4 drawJellyfish(vec2 uv, vec2 center, float scale, float t, float seed, vec3 tint) {
  vec2 p = (uv - center) / scale;
  float pulse = sin(t * 1.8 + seed * 6.28) * 0.5 + 0.5;

  // Bell dimensions that breathe
  float bw = 0.12 + 0.02 * pulse;
  float bh = 0.09 + 0.015 * pulse;

  // --- BELL ---
  float bd = bellSDF(p, bw, bh);
  float bell = smoothstep(0.01, -0.01, bd);
  // Softer outer glow around bell
  float bellGlow = exp(-max(bd, 0.0) * 30.0) * 0.6;

  // Internal vein/channel pattern on the bell
  float angle = atan(p.y, p.x);
  float veins = sin(angle * 8.0 + seed * 3.0) * 0.5 + 0.5;
  veins *= smoothstep(0.1, 0.0, abs(bd + 0.03)); // only near the surface
  float veinGlow = veins * 0.4 * bell;

  // Radial ribs on the dome
  float ribs = pow(abs(sin(angle * 16.0 + seed * 5.0)), 8.0);
  ribs *= smoothstep(0.12, 0.04, length(p)) * 0.25 * bell;

  // --- ORAL ARMS (thick, wavy, short) ---
  float arms = 0.0;
  for (float i = 0.0; i < 4.0; i++) {
    float spread = (i - 1.5) * 0.025;
    float waveFreq = 15.0 + i * 3.0;
    float waveAmp = 0.006 + 0.004 * sin(t * 1.2 + i * 1.8 + seed);
    float wave = sin(p.y * waveFreq - t * 2.5 + i * 1.5 + seed * 4.0) * waveAmp;
    // Grow wider as they trail down
    float thickness = 0.004 + abs(p.y) * 0.02;
    float ax = p.x - spread - wave;
    float arm = exp(-(ax * ax) / (thickness * thickness * 2.0));
    // Only below bell, short
    arm *= smoothstep(0.0, -0.02, p.y) * smoothstep(-0.12, -0.04, p.y);
    arms += arm * 0.35;
  }

  // --- TENTACLES (thin, long, flowing) ---
  float tentacles = 0.0;
  for (float i = 0.0; i < 6.0; i++) {
    float spread = (i - 2.5) * 0.02;
    // Each tentacle has its own wave pattern
    float waveFreq = 20.0 + i * 5.0;
    float waveAmp = 0.008 + 0.006 * sin(t * 0.8 + i * 2.0 + seed * 3.0);
    float wave = sin(p.y * waveFreq - t * 3.0 + i * 2.1 + seed * 5.0) * waveAmp;
    wave += sin(p.y * waveFreq * 0.5 + t * 1.5 + i * 3.0) * waveAmp * 0.5;
    float tx = p.x - spread - wave;
    // Very thin
    float tent = exp(-abs(tx) * 400.0);
    // Below the arms, fade out at the tips
    float yMask = smoothstep(-0.05, -0.1, p.y) * smoothstep(-0.35 - i * 0.02, -0.2, p.y);
    tentacles += tent * yMask * 0.2;
  }

  // --- CENTER GLOW (gut/nucleus) ---
  float nucleus = exp(-length(p - vec2(0.0, 0.02)) * 25.0) * 0.7 * (0.7 + 0.3 * pulse);

  // --- BIOLUMINESCENT EDGE ---
  float edgeGlow = smoothstep(0.01, -0.005, bd) * smoothstep(-0.02, -0.005, bd) * 0.8;

  // Combine all intensities
  float intensity = bell * 0.3 + bellGlow + veinGlow + ribs + arms + tentacles + nucleus + edgeGlow;

  // Color: brighter at core, tinted at edges
  vec3 col = tint * intensity;
  // Whiter at the nucleus
  col += vec3(0.8, 0.9, 1.0) * nucleus * 0.5;
  // Edge rim gets slightly different hue
  col += tint * 1.3 * edgeGlow;

  return vec4(col, intensity);
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;
  float t = u_time;
  float lm = u_lightMode;

  // Deep ocean background — dark abyss or pale ocean
  vec3 deepA = mix(vec3(0.005, 0.01, 0.04), vec3(0.92, 0.95, 0.97), lm);
  vec3 deepB = mix(vec3(0.01, 0.025, 0.07), vec3(0.88, 0.92, 0.96), lm);
  vec3 color = mix(deepB, deepA, uv.y);

  // Subtle underwater caustics (shadows on white, light on dark)
  float c1 = fbm(uv * 3.0 + vec2(t * 0.08, t * 0.05));
  float c2 = fbm(uv * 4.0 - vec2(t * 0.06, -t * 0.07));
  color += mix(vec3(0.01, 0.03, 0.06), vec3(-0.012, -0.008, -0.004), lm) * pow(c1 * c2, 1.5);

  // === JELLYFISH 1: Large, slow drifter — emerald ===
  {
    float cx = 0.5 * aspect + sin(t * 0.12) * 0.25 * aspect;
    float cy = 0.5 + cos(t * 0.08) * 0.15;
    vec3 tint = vec3(0.2, 0.9, 0.55);
    vec4 j = drawJellyfish(uv, vec2(cx, cy), 1.0, t, 0.0, tint);
    color += j.rgb * (1.0 - lm);
    color = mix(color, tint * 0.9, min(j.a, 1.0) * lm);
  }

  // === JELLYFISH 2: Medium, drifts right-to-left — cyan ===
  {
    float cx = mod(1.2 * aspect - t * 0.04, 1.6 * aspect) - 0.3 * aspect;
    float cy = 0.38 + sin(t * 0.15 + 2.0) * 0.08;
    vec3 tint = vec3(0.15, 0.75, 0.95);
    vec4 j = drawJellyfish(uv, vec2(cx, cy), 0.75, t, 0.33, tint);
    color += j.rgb * (1.0 - lm);
    color = mix(color, tint * 0.85, min(j.a, 1.0) * lm);
  }

  // === JELLYFISH 3: Small, background — soft purple ===
  {
    float cx = 0.3 * aspect + sin(t * 0.1 + 4.0) * 0.15 * aspect;
    float cy = 0.65 + cos(t * 0.13 + 1.0) * 0.1;
    vec3 tint = vec3(0.45, 0.25, 0.8);
    vec4 j = drawJellyfish(uv, vec2(cx, cy), 0.5, t, 0.66, tint);
    color += j.rgb * 0.6 * (1.0 - lm);
    color = mix(color, tint * 0.8, min(j.a * 0.6, 1.0) * lm);
  }

  // === JELLYFISH 4: Tiny, far background — gold ===
  {
    float cx = 0.75 * aspect + sin(t * 0.09 + 3.0) * 0.1 * aspect;
    float cy = 0.72 + cos(t * 0.11 + 5.0) * 0.06;
    vec3 tint = vec3(0.8, 0.65, 0.2);
    vec4 j = drawJellyfish(uv, vec2(cx, cy), 0.35, t, 0.5, tint);
    color += j.rgb * 0.4 * (1.0 - lm);
    color = mix(color, tint * 0.85, min(j.a * 0.4, 1.0) * lm);
  }

  // Floating particle motes (marine snow / dust specks)
  for (float i = 0.0; i < 12.0; i++) {
    vec2 pp = vec2(
      hash(vec2(i, 0.0)) * aspect,
      fract(hash(vec2(i, 1.0)) + t * (0.008 + hash(vec2(i, 2.0)) * 0.012))
    );
    float d = length(uv - pp);
    float glow = exp(-d * 350.0) * (0.2 + 0.15 * sin(t * 1.5 + i * 2.7));
    color += mix(vec3(0.15, 0.3, 0.4), vec3(-0.04, -0.06, -0.08), lm) * glow;
  }

  // Depth fog (less fog in light mode to keep colors vibrant)
  vec3 fogColor = mix(deepA, vec3(1.0, 1.0, 1.0), lm);
  color = mix(color, fogColor, smoothstep(0.8, 0.0, uv.y) * mix(0.2, 0.03, lm));

  // Vignette (lighter in light mode)
  vec2 vc = (v_uv - 0.5) * 2.0;
  color *= 1.0 - dot(vc, vc) * mix(0.25, 0.04, lm);

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;function m(a,l,t){const e=a.createShader(t);return a.shaderSource(e,l),a.compileShader(e),a.getShaderParameter(e,a.COMPILE_STATUS)?e:null}function F(){const a=c.useRef(null),l=c.useRef(null);return c.useEffect(()=>{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const t=a.current;if(!t)return;const e=t.getContext("webgl",{alpha:!1,antialias:!1});if(!e)return;const s=m(e,A,e.VERTEX_SHADER),f=m(e,_,e.FRAGMENT_SHADER);if(!s||!f)return;const o=e.createProgram();if(e.attachShader(o,s),e.attachShader(o,f),e.linkProgram(o),!e.getProgramParameter(o,e.LINK_STATUS))return;e.useProgram(o);const u=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,u),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW);const v=e.getAttribLocation(o,"a_position");e.enableVertexAttribArray(v),e.vertexAttribPointer(v,2,e.FLOAT,!1,0,0);const h=e.getUniformLocation(o,"u_time"),d=e.getUniformLocation(o,"u_resolution"),g=e.getUniformLocation(o,"u_lightMode");function w(){const i=Math.min(window.devicePixelRatio,y),r=Math.round(t.clientWidth*i),n=Math.round(t.clientHeight*i);(t.width!==r||t.height!==n)&&(t.width=r,t.height=n,e.viewport(0,0,r,n))}const b=performance.now(),p=i=>{w(),e.uniform1f(h,(i-b)/1e3),e.uniform2f(d,t.width,t.height),e.uniform1f(g,document.documentElement.classList.contains("light-theme")?1:0),e.drawArrays(e.TRIANGLE_STRIP,0,4),l.current=requestAnimationFrame(p)};return l.current=requestAnimationFrame(p),()=>{l.current&&cancelAnimationFrame(l.current)}},[]),x.jsx("canvas",{ref:a,className:"deep-sea-canvas","aria-hidden":"true"})}export{F as default};
