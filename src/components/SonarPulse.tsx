import { useEffect, useRef } from 'react';

const MAX_DPR = 1.5;

const VERT = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAG = `
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
}`;

function compileShader(gl, src, type) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
  return s;
}

export default function SonarPulse() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const vs = compileShader(gl, VERT, gl.VERTEX_SHADER);
    const fs = compileShader(gl, FRAG, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    const t0 = performance.now();
    const render = (now) => {
      resize();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return <canvas ref={canvasRef} className="sonar-pulse-canvas" aria-hidden="true" />;
}
