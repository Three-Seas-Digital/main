import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TUBE, TIER_CONFIG } from './tubeConfig';

export default function TubeCard({
  template, texture, position, rotation, isFiltered,
  onPointerOver, onPointerOut, onClick,
}) {
  const meshRef = useRef();
  const glowRef = useRef();
  const hoverT = useRef(0);
  const opacityT = useRef(1);
  const targetHover = useRef(0);

  const tierColor = useMemo(() => {
    const cfg = TIER_CONFIG[template.tier];
    return cfg ? new THREE.Color(cfg.color) : new THREE.Color(TUBE.glowColor);
  }, [template.tier]);

  const glowMat = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: tierColor,
      transparent: true,
      opacity: 0,
      side: THREE.FrontSide,
      depthWrite: false,
    }),
    [tierColor]
  );

  // Card material — DoubleSide with UV flip on back face so text isn't mirrored
  const cardMat = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 1,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
          vec2 mapUv = gl_FrontFacing ? vMapUv : vec2(1.0 - vMapUv.x, vMapUv.y);
          vec4 sampledDiffuseColor = texture2D(map, mapUv);
          diffuseColor *= sampledDiffuseColor;
        #endif`
      );
    };
    mat.customProgramCacheKey = () => 'tube-card-uv-flip';
    return mat;
  }, []);

  // Update texture when it changes
  useEffect(() => {
    cardMat.map = texture || null;
    cardMat.needsUpdate = true;
  }, [texture, cardMat]);

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    const glow = glowRef.current;
    if (!mesh) return;

    // Hover interpolation
    hoverT.current += (targetHover.current - hoverT.current) * Math.min(dt * 8, 1);

    // Filter opacity
    const targetOpacity = isFiltered ? 0 : 1;
    opacityT.current += (targetOpacity - opacityT.current) * Math.min(dt * 5, 1);

    // Apply scale
    const s = 1 + hoverT.current * (TUBE.hoverScale - 1);
    mesh.scale.setScalar(s);

    // Apply opacity
    cardMat.opacity = opacityT.current;
    mesh.visible = opacityT.current > 0.01;

    // Glow
    if (glow) {
      glow.material.opacity = hoverT.current * 0.4 * opacityT.current;
      glow.visible = hoverT.current > 0.01 && opacityT.current > 0.01;
      glow.scale.setScalar(s);
    }
  });

  const handlePointerOver = (e) => {
    e.stopPropagation();
    targetHover.current = 1;
    onPointerOver?.(template, e);
  };

  const handlePointerOut = (e) => {
    targetHover.current = 0;
    onPointerOut?.(e);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(template);
  };

  return (
    <group position={position} rotation={rotation}>
      {/* Glow plane behind card */}
      <mesh ref={glowRef} position={[0, 0, -0.02]} visible={false}>
        <planeGeometry args={[TUBE.tileW + 0.08, TUBE.tileH + 0.08]} />
        <primitive object={glowMat} />
      </mesh>

      {/* Card plane */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <planeGeometry args={[TUBE.tileW, TUBE.tileH]} />
        <primitive object={cardMat} />
      </mesh>
    </group>
  );
}
