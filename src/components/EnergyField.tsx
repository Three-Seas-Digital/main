import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  uniform float uScroll;

  void main() {
    vUv = uv;
    vPosition = position;

    vec3 pos = position;
    float scrollAmp = 1.0 + uScroll * 0.3;
    float wave = sin(pos.x * 2.0 + uTime * 0.1) * 0.15 * scrollAmp;
    wave += sin(pos.y * 1.5 + uTime * 0.07) * 0.1 * scrollAmp;
    pos.z += wave;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uMouse;
  uniform float uLight;
  varying vec2 vUv;
  varying vec3 vPosition;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;

    vec2 q = vec2(0.0);
    q.x = fbm(uv + uTime * 0.01 + uScroll * 0.8);
    q.y = fbm(uv + vec2(1.0) + uScroll * 0.8);

    vec2 r = vec2(0.0);
    r.x = fbm(uv + q + vec2(1.7, 9.2) + 0.05 * uTime + uScroll * 0.6);
    r.y = fbm(uv + q + vec2(8.3, 2.8) + 0.042 * uTime + uScroll * 0.6);

    float f = fbm(uv + r);

    float mouseDist = distance(uv, uMouse);
    float mouseInfluence = smoothstep(0.5, 0.0, mouseDist) * 0.15;
    f += mouseInfluence;

    // Dark palette
    vec3 dBase = vec3(0.02, 0.02, 0.025);
    vec3 dSecondary = vec3(0.08, 0.08, 0.09);
    vec3 dAccent = vec3(0.28, 0.28, 0.30);
    vec3 dGlow = vec3(0.45, 0.45, 0.48);

    // Light palette — warm taupe/stone tones with visible contrast
    vec3 lBase = vec3(0.78, 0.75, 0.72);
    vec3 lSecondary = vec3(0.68, 0.64, 0.60);
    vec3 lAccent = vec3(0.55, 0.48, 0.38);
    vec3 lGlow = vec3(0.45, 0.36, 0.22);

    vec3 base = mix(dBase, lBase, uLight);
    vec3 secondary = mix(dSecondary, lSecondary, uLight);
    vec3 accent = mix(dAccent, lAccent, uLight);
    vec3 glowColor = mix(dGlow, lGlow, uLight);

    vec3 color = mix(base, secondary, clamp(f * 2.0, 0.0, 1.0));

    float accentMask = smoothstep(0.4, 0.7, f) * smoothstep(0.9, 0.6, f);
    color = mix(color, accent, accentMask * 0.25);

    float glow = smoothstep(0.65, 0.85, f) * 0.15;
    color += glowColor * glow;

    float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5) * 1.5);
    color *= vignette * 0.7 + 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function EnergyPlane() {
  const meshRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const scrollRef = useRef(0);
  const scrollMaxRef = useRef(0);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const update = () => {
      scrollMaxRef.current = document.body.scrollHeight - window.innerHeight;
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uLight: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material;

    // Theme detection every frame — guaranteed mesh exists
    const isLight = document.documentElement.classList.contains('light-theme') ? 1.0 : 0.0;
    material.uniforms.uLight.value = isLight;

    if (prefersReduced) return;

    material.uniforms.uTime.value = state.clock.elapsedTime;

    const target = scrollMaxRef.current > 0 ? window.scrollY / scrollMaxRef.current : 0;
    scrollRef.current += (target - scrollRef.current) * 0.03;
    material.uniforms.uScroll.value = scrollRef.current;

    mouseRef.current.x += (state.pointer.x * 0.5 + 0.5 - mouseRef.current.x) * 0.05;
    mouseRef.current.y += (state.pointer.y * 0.5 + 0.5 - mouseRef.current.y) * 0.05;
    material.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);
  });

  return (
    <mesh ref={meshRef} scale={[3, 2, 1]}>
      <planeGeometry args={[2, 2, 32, 32]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function EnergyField() {
  return (
    <div className="energy-field-bg">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false }}
      >
        <EnergyPlane />
      </Canvas>
    </div>
  );
}
