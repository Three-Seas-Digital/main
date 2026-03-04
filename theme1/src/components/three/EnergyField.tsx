import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Shader for the energy field
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    vec3 pos = position;
    float wave = sin(pos.x * 2.0 + uTime * 0.3) * 0.15;
    wave += sin(pos.y * 1.5 + uTime * 0.2) * 0.1;
    pos.z += wave;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  // Simplex noise function
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
    
    // Create flowing noise
    vec2 q = vec2(0.0);
    q.x = fbm(uv + uTime * 0.03);
    q.y = fbm(uv + vec2(1.0));
    
    vec2 r = vec2(0.0);
    r.x = fbm(uv + q + vec2(1.7, 9.2) + 0.15 * uTime);
    r.y = fbm(uv + q + vec2(8.3, 2.8) + 0.126 * uTime);
    
    float f = fbm(uv + r);
    
    // Mouse influence
    float mouseDist = distance(uv, uMouse);
    float mouseInfluence = smoothstep(0.5, 0.0, mouseDist) * 0.15;
    f += mouseInfluence;
    
    // Color palette - dark with orange accents
    vec3 darkBase = vec3(0.02, 0.024, 0.043); // #05060B
    vec3 darkSecondary = vec3(0.043, 0.055, 0.078); // #0B0E14
    vec3 orangeAccent = vec3(1.0, 0.416, 0.0); // #FF6A00
    vec3 orangeGlow = vec3(1.0, 0.6, 0.2);
    
    // Mix colors based on noise
    vec3 color = mix(darkBase, darkSecondary, clamp(f * 2.0, 0.0, 1.0));
    
    // Add orange wisps
    float orangeMask = smoothstep(0.4, 0.7, f) * smoothstep(0.9, 0.6, f);
    color = mix(color, orangeAccent, orangeMask * 0.25);
    
    // Add subtle glow spots
    float glow = smoothstep(0.65, 0.85, f) * 0.15;
    color += orangeGlow * glow;
    
    // Vignette
    float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5) * 1.5);
    color *= vignette * 0.7 + 0.3;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

function EnergyPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    }),
    []
  );
  
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Smooth mouse follow
      mouseRef.current.x += (state.pointer.x * 0.5 + 0.5 - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (state.pointer.y * 0.5 + 0.5 - mouseRef.current.y) * 0.05;
      material.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);
    }
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
    <div className="fixed inset-0 -z-10">
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
