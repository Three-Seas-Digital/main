import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Mouse-tracking parallax using gsap.quickTo and CSS custom properties.
 * Writes --mx / --my which are consumed via CSS `translate: var(--mx) var(--my)`.
 *
 * @param {React.RefObject} containerRef - IntersectionObserver target
 * @param {Array<{ref: React.RefObject, depth: number, selector?: string}>} layers
 */
export function useMouseParallax(containerRef, layers) {
  const settersRef = useRef([]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobile = window.innerWidth <= 768;
    if (prefersReduced || isTouchDevice || isMobile) return;

    const container = containerRef.current;
    if (!container) return;

    const setters = [];
    layers.forEach(({ ref, depth, selector }) => {
      if (!ref.current) return;
      const elements = selector
        ? ref.current.querySelectorAll(selector)
        : [ref.current];

      elements.forEach((el, i) => {
        const d = selector ? depth * (0.7 + i * 0.15) : depth;
        gsap.set(el, { '--mx': '0px', '--my': '0px' });
        setters.push({
          el,
          depth: d,
          qx: gsap.quickTo(el, '--mx', { duration: 0.6, ease: 'power3.out' }),
          qy: gsap.quickTo(el, '--my', { duration: 0.6, ease: 'power3.out' }),
        });
      });
    });
    settersRef.current = setters;

    let isVisible = false;
    const obs = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0.1 }
    );
    obs.observe(container);

    const onMouseMove = (e) => {
      if (!isVisible) return;
      const nx = (e.clientX / window.innerWidth) - 0.5;
      const ny = (e.clientY / window.innerHeight) - 0.5;
      setters.forEach(({ depth, qx, qy }) => {
        qx(nx * depth + 'px');
        qy(ny * depth + 'px');
      });
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      obs.disconnect();
      setters.forEach(({ el }) => {
        gsap.to(el, { '--mx': '0px', '--my': '0px', duration: 0.4, ease: 'power2.out' });
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
