import { useRef, useMemo, useImperativeHandle, forwardRef, Ref } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import TubeCard from './TubeCard';
import { TUBE } from './tubeConfig';

interface TubeSceneProps {
  templates: any[];
  textureMap: React.MutableRefObject<Map<any, any> | null>;
  activeFilters: { tier: string | null; category: string | null };
  onCardHover?: (template: any, event: any) => void;
  onCardClick?: (template: any) => void;
  prefersReduced: boolean;
}

export interface TubeSceneHandle {
  addSpin: (delta: number) => void;
  setHovering: (isHovering: boolean) => void;
}

const TubeScene = forwardRef(function TubeScene(
  { templates, textureMap, activeFilters, onCardHover, onCardClick, prefersReduced }: TubeSceneProps,
  ref: Ref<TubeSceneHandle>
) {
  const groupRef = useRef<THREE.Group>(null);
  const scrollTargetRef = useRef(0);
  const scrollCurrentRef = useRef(0);
  const spinVelocityRef = useRef(0);
  const angleRef = useRef(0);
  const speedScaleRef = useRef(1);
  const speedScaleTargetRef = useRef(1);

  // Expose scroll/spin methods to parent
  useImperativeHandle(ref, () => ({
    addSpin(delta) {
      spinVelocityRef.current += delta * TUBE.scrollSensitivity;
      spinVelocityRef.current = Math.max(
        -TUBE.maxSpinVelocity,
        Math.min(TUBE.maxSpinVelocity, spinVelocityRef.current)
      );
    },
    setHovering(isHovering) {
      speedScaleTargetRef.current = isHovering ? TUBE.hoverSpeedScale : 1;
    },
  }));

  // Compute cylindrical layout
  const layout = useMemo(() => {
    const count = templates.length;
    if (count === 0) return { items: [], rows: 0, loopHeight: 0, rowSpeeds: [] };

    const cols = TUBE.cols;
    const rows = Math.ceil(count / cols);
    const loopHeight = rows * TUBE.ySpacing;
    const totalRows = rows * TUBE.repeatCount;

    // Per-row speed multipliers
    const [sMin, sMax] = TUBE.rowSpeedRange;
    const rowSpeeds = [];
    for (let r = 0; r < rows; r++) {
      const t = rows > 1 ? r / (rows - 1) : 0.5;
      rowSpeeds.push(sMin + t * (sMax - sMin));
    }

    const items = [];
    for (let tr = 0; tr < totalRows; tr++) {
      const baseRow = tr % rows;
      const rowOffset = baseRow % 2 === 0 ? 0 : 0.5;
      const y = (tr - (totalRows - 1) / 2) * TUBE.ySpacing;

      for (let c = 0; c < cols; c++) {
        const templateIdx = (baseRow * cols + c) % count;
        if (baseRow * cols + c >= count && tr < rows) continue; // skip empty slots in base

        const theta = ((c + rowOffset) / cols) * Math.PI * 2;
        const x = Math.cos(theta) * TUBE.radius;
        const z = Math.sin(theta) * TUBE.radius;
        const ry = -(theta + Math.PI / 2);

        items.push({
          key: `${tr}-${c}`,
          templateIdx,
          position: [x, y, z],
          rotation: [0, ry, 0],
          baseRow,
        });
      }
    }

    return { items, rows, loopHeight, rowSpeeds };
  }, [templates]);

  // Check if a template passes current filters
  const isFiltered = useMemo(() => {
    const set = new Set();
    templates.forEach((t, i) => {
      const tierMatch = !activeFilters.tier || t.tier === activeFilters.tier;
      const catMatch = !activeFilters.category || t.category === activeFilters.category;
      if (!tierMatch || !catMatch) set.add(i);
    });
    return set;
  }, [templates, activeFilters]);

  // Animation loop
  useFrame((_, dt) => {
    if (prefersReduced || !groupRef.current) return;

    // Smooth vertical scroll
    scrollCurrentRef.current +=
      (scrollTargetRef.current - scrollCurrentRef.current) * TUBE.scrollLerp;

    // Infinite loop wrap
    if (layout.loopHeight > 0) {
      const half = layout.loopHeight / 2;
      if (scrollCurrentRef.current > half) {
        scrollCurrentRef.current -= layout.loopHeight;
        scrollTargetRef.current -= layout.loopHeight;
      } else if (scrollCurrentRef.current < -half) {
        scrollCurrentRef.current += layout.loopHeight;
        scrollTargetRef.current += layout.loopHeight;
      }
    }

    // Damp spin velocity
    spinVelocityRef.current *= Math.pow(TUBE.damping, dt * 60);

    // Interpolate speed scale (hover slowdown)
    speedScaleRef.current +=
      (speedScaleTargetRef.current - speedScaleRef.current) * TUBE.hoverLerpSpeed;

    // Advance angle
    const scaledDt = dt * speedScaleRef.current;
    angleRef.current += (TUBE.baseSpeed + spinVelocityRef.current) * scaledDt;

    // Apply to group
    groupRef.current.position.y = -scrollCurrentRef.current;
    groupRef.current.rotation.y = angleRef.current;
  });

  const handlePointerOver = (template: any, e: any) => {
    speedScaleTargetRef.current = TUBE.hoverSpeedScale;
    onCardHover?.(template, e);
  };

  const handlePointerOut = () => {
    speedScaleTargetRef.current = 1;
    onCardHover?.(null, null);
  };

  return (
    <group ref={groupRef}>
      {layout.items.map((item) => {
        const t = templates[item.templateIdx];
        if (!t) return null;
        const tex = textureMap.current?.get(t.id) || null;

        return (
          <TubeCard
            key={item.key}
            template={t}
            texture={tex}
            position={item.position}
            rotation={item.rotation}
            isFiltered={isFiltered.has(item.templateIdx)}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={onCardClick}
          />
        );
      })}
    </group>
  );
});

export default TubeScene;
