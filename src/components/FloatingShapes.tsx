import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

function WireShape({ geometry, position, rotationSpeed, floatSpeed, floatAmp, color, opacity }) {
  const meshRef = useRef(null);
  const baseY = position[1];
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useFrame((state) => {
    if (!meshRef.current || reduced) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x += rotationSpeed[0];
    meshRef.current.rotation.y += rotationSpeed[1];
    meshRef.current.position.y = baseY + Math.sin(t * floatSpeed) * floatAmp;
  });

  return (
    <mesh ref={meshRef} position={position}>
      {geometry === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
      {geometry === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
      {geometry === 'tetrahedron' && <tetrahedronGeometry args={[1, 0]} />}
      <meshBasicMaterial wireframe color={color} opacity={opacity} transparent />
    </mesh>
  );
}

const PRESETS = {
  services: [
    { geometry: 'icosahedron', position: [-3.5, 1.5, -2], rotationSpeed: [0.002, 0.003], floatSpeed: 0.4, floatAmp: 0.3, color: '#C8A43E', opacity: 0.3 },
    { geometry: 'icosahedron', position: [4, -1, -3], rotationSpeed: [0.003, 0.002], floatSpeed: 0.5, floatAmp: 0.25, color: '#C8A43E', opacity: 0.2 },
    { geometry: 'icosahedron', position: [0, 2.5, -4], rotationSpeed: [0.001, 0.004], floatSpeed: 0.3, floatAmp: 0.35, color: '#C8A43E', opacity: 0.25 },
    { geometry: 'octahedron', position: [3, 1, -2.5], rotationSpeed: [0.004, 0.002], floatSpeed: 0.6, floatAmp: 0.2, color: '#C8A43E', opacity: 0.35 },
    { geometry: 'octahedron', position: [-2, -1.5, -3.5], rotationSpeed: [0.002, 0.005], floatSpeed: 0.35, floatAmp: 0.28, color: '#C8A43E', opacity: 0.22 },
  ],
  about: [
    { geometry: 'tetrahedron', position: [-4, 0.5, -2], rotationSpeed: [0.003, 0.002], floatSpeed: 0.45, floatAmp: 0.3, color: '#B8602E', opacity: 0.3 },
    { geometry: 'tetrahedron', position: [3.5, -1.5, -3], rotationSpeed: [0.002, 0.004], floatSpeed: 0.35, floatAmp: 0.25, color: '#B8602E', opacity: 0.25 },
    { geometry: 'icosahedron', position: [-1.5, 2, -4], rotationSpeed: [0.001, 0.003], floatSpeed: 0.5, floatAmp: 0.35, color: '#B8602E', opacity: 0.2 },
    { geometry: 'icosahedron', position: [2, 1.5, -2.5], rotationSpeed: [0.004, 0.001], floatSpeed: 0.4, floatAmp: 0.2, color: '#C8A43E', opacity: 0.25 },
    { geometry: 'octahedron', position: [-3, -1, -3.5], rotationSpeed: [0.002, 0.003], floatSpeed: 0.55, floatAmp: 0.28, color: '#C8A43E', opacity: 0.22 },
  ],
};

export default function FloatingShapes({ preset = 'services' }) {
  const shapes = useMemo(() => PRESETS[preset] || PRESETS.services, [preset]);

  return (
    <div className="floating-shapes">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1]}
        gl={{ antialias: false, alpha: true }}
      >
        {shapes.map((s, i) => (
          <WireShape key={i} {...s} />
        ))}
      </Canvas>
    </div>
  );
}
