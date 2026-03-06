import { useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import TubeScene from './TubeScene';

export default function TubeCanvas({
  templates, textureMap, activeFilters,
  onCardHover, onCardClick, prefersReduced,
}) {
  const sceneRef = useRef();
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);

  const handleWheel = useCallback((e) => {
    sceneRef.current?.addSpin(e.deltaY);
  }, []);

  const handlePointerDown = useCallback((e) => {
    isDragging.current = true;
    dragMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    if (Math.abs(dx) > 5) dragMoved.current = true;
    sceneRef.current?.addSpin(-dx * 0.3);
    dragStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      className="tube-canvas-container"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
      >
        <ambientLight intensity={0.8} />
        <TubeScene
          ref={sceneRef}
          templates={templates}
          textureMap={textureMap}
          activeFilters={activeFilters}
          onCardHover={onCardHover}
          onCardClick={onCardClick}
          prefersReduced={prefersReduced}
        />
      </Canvas>
    </div>
  );
}
