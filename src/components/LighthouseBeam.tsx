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
uniform vec2 u_origin;
varying vec2 v_uv;

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;
  vec2 origin = vec2(u_origin.x * aspect, u_origin.y);
  vec2 dir = uv - origin;
  float dist = length(dir);
  float angle = atan(dir.x, dir.y);
  float beamAngle = u_time * 0.1;
  float cone1 = cos(angle - beamAngle);
  float cone2 = cos(angle - beamAngle + 3.14159);
  float beam1 = pow(max(0.0, cone1), 2.0);
  float beam2 = pow(max(0.0, cone2), 2.0);
  float beam = max(beam1, beam2);
  float falloff = 1.0 / (1.0 + dist * 2.2);
  float glow = exp(-dist * 3.0) * 0.6;
  float haze = smoothstep(0.9, 0.0, uv.y) * 0.3;
  float flicker = 0.92 + 0.08 * sin(u_time * 3.7 + sin(u_time * 7.3) * 0.5);
  float intensity = (beam * falloff + glow + beam * haze) * flicker;
  vec3 lightColor = vec3(1.0, 0.95, 0.8);
  vec3 color = lightColor * intensity * 0.35;
  float rays = 0.0;
  for (float i = 0.0; i < 6.0; i++) {
    float rayAngle = beamAngle + i * 1.0472;
    float rayAlign = pow(max(0.0, cos(angle - rayAngle)), 5.0);
    rays += rayAlign * falloff * 0.25;
  }
  color += lightColor * rays;
  float alpha = clamp(intensity * 0.6 + rays * 0.4, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}`;

function compileShader(gl, src, type) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
  return s;
}

export default function LighthouseBeam({ originX = 0.5, originY = 0.75 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
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
    const uOrigin = gl.getUniformLocation(prog, 'u_origin');

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
      gl.uniform2f(uOrigin, originX, originY);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [originX, originY]);

  return <canvas ref={canvasRef} className="lighthouse-beam-canvas" aria-hidden="true" />;
}
