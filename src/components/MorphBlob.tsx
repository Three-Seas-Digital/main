import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const blobVertex = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;
    float displacement = sin(pos.x * 3.0 + uTime * 0.5) * 0.2
                       + sin(pos.y * 2.5 + uTime * 0.7) * 0.15
                       + sin(pos.z * 4.0 + uTime * 0.3) * 0.1
                       + sin(pos.x * 1.5 + pos.y * 2.0 + uTime * 0.4) * 0.12;
    pos += normal * displacement;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const blobFragment = `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.0);
    vec3 gold = vec3(0.784, 0.643, 0.243);
    vec3 amber = vec3(0.722, 0.376, 0.180);
    vec3 color = mix(gold, amber, fresnel);
    float alpha = 0.25 - fresnel * 0.1;
    gl_FragColor = vec4(color, alpha);
  }
`;

function Blob() {
  const meshRef = useRef(null);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  useFrame((state) => {
    if (!meshRef.current || prefersReduced) return;
    meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
    meshRef.current.rotation.y += 0.003;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.5, 8]} />
      <shaderMaterial
        vertexShader={blobVertex}
        fragmentShader={blobFragment}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function MorphBlob() {
  return (
    <div className="morph-blob">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        dpr={[1, 1]}
        gl={{ antialias: false, alpha: true }}
      >
        <Blob />
      </Canvas>
    </div>
  );
}
