import { useEffect, useRef, useLayoutEffect, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import '../styles/home.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMouseParallax } from '../hooks/useMouseParallax';
import {
  ArrowRight,
  ChevronRight,
  Code2,
  Brain,
  Zap,
  Accessibility,
  Palette,
  TestTube,
  Database,
  Bot,
  Users,
  Target,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Lazy load heavy components for better initial load performance
const DeepSeaCreatures = lazy(() => import('../components/DeepSeaCreatures'));

/* ── Reusable pinned-section animation ── */
// ANIMATION STYLE OPTIONS:
// 'converge' - Original: panels slide from sides toward center
// 'slide-up' - Panels slide up from bottom  
// 'fade-scale' - Fade in with scale, minimal movement
// 'reveal-up' - Cards reveal upward like stacking
// 'diagonal' - Panels come from opposite corners

// Performance optimization: Use smooth easing constants
const EASE_SMOOTH = 'power3.out';
const EASE_EXIT = 'power2.inOut';

function usePinnedSection(sectionRef: React.RefObject<HTMLElement | null>, leftRef: React.RefObject<HTMLElement | null>, rightRef: React.RefObject<HTMLElement | null>, headlineRef: React.RefObject<HTMLElement | null>, opts: Record<string, any> = {}, animationStyle: string = 'slide-up') {
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!section || !left || !right) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Enable GPU acceleration for smoother animations
    gsap.set([left, right], { 
      willChange: 'transform, opacity',
      force3D: true 
    });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
        },
      });

      // Background image if present
      if (opts.bgRef?.current) {
        tl.fromTo(opts.bgRef.current, { scale: 1.12, opacity: 0 }, { scale: 1.0, opacity: 1, ease: 'none' }, 0)
          .fromTo(opts.bgRef.current, { scale: 1.0, opacity: 1 }, { scale: 1.08, opacity: 0, ease: 'power2.in' }, 0.7);
      }

      // Depth parallax: background drifts at different rate than foreground
      const depthBg = opts.bgRef?.current || section.querySelector('.editorial-bg');
      if (depthBg) {
        const depthScale = (window.innerWidth <= 768) ? 0.4 : 1.0;
        tl.fromTo(depthBg, { yPercent: 3 * depthScale }, { yPercent: -3 * depthScale, ease: 'none' }, 0);
      }

      // Get card items for stagger animations
      const cardItems = right.querySelectorAll('.editorial-list-item');

      switch (animationStyle) {
        case 'slide-up':
          // === Panels slide up from bottom - SMOOTH ===
          tl.fromTo(left, { y: '45vh', opacity: 0 }, { y: 0, opacity: 1, ease: EASE_SMOOTH }, 0);
          tl.fromTo(right, { y: '45vh', opacity: 0 }, { y: 0, opacity: 1, ease: EASE_SMOOTH }, 0.04);
          
          if (headlineRef?.current) {
            const words = headlineRef.current.querySelectorAll('.word');
            tl.fromTo(words, { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.025, ease: EASE_SMOOTH }, 0.08);
          }
          
          if (cardItems.length > 0) {
            tl.fromTo(cardItems, 
              { y: 30, opacity: 0 }, 
              { y: 0, opacity: 1, stagger: 0.06, ease: EASE_SMOOTH }, 
              0.15
            );
          }
          
          // Exit - smooth fade out
          if (cardItems.length > 0) {
            tl.fromTo(cardItems, 
              { y: 0, opacity: 1 }, 
              { y: -20, opacity: 0, stagger: 0.03, ease: EASE_EXIT }, 
              0.68
            );
          }
          tl.fromTo([left, right], { y: 0, opacity: 1 }, { y: '-30vh', opacity: 0, ease: EASE_EXIT }, 0.75);
          break;

        case 'fade-scale':
          // === Fade in with scale - SMOOTH ===
          tl.fromTo(left, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, ease: EASE_SMOOTH }, 0);
          tl.fromTo(right, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, ease: EASE_SMOOTH }, 0.04);
          
          if (headlineRef?.current) {
            const words = headlineRef.current.querySelectorAll('.word');
            tl.fromTo(words, { y: 16, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.025, ease: EASE_SMOOTH }, 0.08);
          }
          
          if (cardItems.length > 0) {
            tl.fromTo(cardItems, 
              { scale: 0.95, opacity: 0 }, 
              { scale: 1, opacity: 1, stagger: 0.06, ease: 'power3.out' }, 
              0.12
            );
          }
          
          // Exit - smooth scale down
          if (cardItems.length > 0) {
            tl.fromTo(cardItems, 
              { scale: 1, opacity: 1 }, 
              { scale: 0.97, opacity: 0, stagger: 0.03, ease: EASE_EXIT }, 
              0.68
            );
          }
          tl.fromTo([left, right], { scale: 1, opacity: 1 }, { scale: 0.95, opacity: 0, ease: EASE_EXIT }, 0.75);
          break;

        case 'reveal-up':
          // === Reveal upward - SMOOTH ===
          tl.fromTo([left, right], { y: '15vh', opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, ease: EASE_SMOOTH }, 0);
          
          if (headlineRef?.current) {
            const words = headlineRef.current.querySelectorAll('.word');
            tl.fromTo(words, { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.03, ease: EASE_SMOOTH }, 0.08);
          }
          
          if (cardItems.length > 0) {
            tl.fromTo(cardItems, 
              { y: 40, opacity: 0 }, 
              { y: 0, opacity: 1, stagger: 0.08, ease: EASE_SMOOTH }, 
              0.15
            );
          }
          
          // Exit - smooth reveal away
          if (cardItems.length > 0) {
            tl.fromTo(cardItems, 
              { y: 0, opacity: 1 }, 
              { y: -20, opacity: 0, stagger: 0.04, ease: EASE_EXIT }, 
              0.66
            );
          }
          tl.fromTo([left, right], { y: 0, opacity: 1 }, { y: '-20vh', opacity: 0, ease: EASE_EXIT }, 0.75);
          break;

        case 'diagonal':
          // === Panels from corners - SMOOTH ===
          tl.fromTo(left, { x: '-35vw', y: '20vh', opacity: 0 }, { x: 0, y: 0, opacity: 1, ease: EASE_SMOOTH }, 0);
          tl.fromTo(right, { x: '35vw', y: '20vh', opacity: 0 }, { x: 0, y: 0, opacity: 1, ease: EASE_SMOOTH }, 0);
          
          if (headlineRef?.current) {
            const words = headlineRef.current.querySelectorAll('.word');
            tl.fromTo(words, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.025, ease: EASE_SMOOTH }, 0.08);
          }
          
          if (cardItems.length > 0) {
            tl.fromTo(cardItems, 
              { x: 20, opacity: 0 }, 
              { x: 0, opacity: 1, stagger: 0.06, ease: EASE_SMOOTH }, 
              0.12
            );
          }
          
          // Exit - smooth return
          if (cardItems.length > 0) {
            tl.fromTo(cardItems, 
              { x: 0, opacity: 1 }, 
              { x: -15, opacity: 0, stagger: 0.03, ease: EASE_EXIT }, 
              0.68
            );
          }
          tl.fromTo(left, { x: 0, y: 0, opacity: 1 }, { x: '-30vw', y: '-15vh', opacity: 0, ease: EASE_EXIT }, 0.75);
          tl.fromTo(right, { x: 0, y: 0, opacity: 1 }, { x: '30vw', y: '-15vh', opacity: 0, ease: EASE_EXIT }, 0.75);
          break;

        case 'converge':
        default:
          // === Panels from sides - SMOOTH ===
          tl.fromTo(left, { x: '-30vw', opacity: 0 }, { x: 0, opacity: 1, ease: EASE_SMOOTH }, 0);
          tl.fromTo(right, { x: '30vw', opacity: 0 }, { x: 0, opacity: 1, ease: EASE_SMOOTH }, 0.04);

          if (headlineRef?.current) {
            const words = headlineRef.current.querySelectorAll('.word');
            tl.fromTo(words, { y: 16, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.025, ease: EASE_SMOOTH }, 0.06);
          }

          if (cardItems.length > 0) {
            tl.fromTo(cardItems, 
              { x: 40, opacity: 0 }, 
              { x: 0, opacity: 1, stagger: 0.06, ease: EASE_SMOOTH }, 
              0.12
            );
          }

          if (cardItems.length > 0) {
            tl.fromTo(cardItems, 
              { x: 0, opacity: 1 }, 
              { x: -20, opacity: 0, stagger: 0.03, ease: EASE_EXIT }, 
              0.68
            );
          }
          tl.fromTo(left, { x: 0, opacity: 1 }, { x: '-35vw', opacity: 0, ease: EASE_EXIT }, 0.75);
          tl.fromTo(right, { x: 0, opacity: 1 }, { x: '35vw', opacity: 0, ease: EASE_EXIT }, 0.75);
          break;
      }
    }, section);

    return () => {
      ctx.revert();
      // Clean up will-change to free GPU memory
      gsap.set([left, right], { willChange: 'auto' });
    };
  }, []);
}

/* ── Video Hero (static, not pinned) ── */
function VideoHero() {
  const heroSectionRef = useRef<HTMLElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const hookRef = useRef<HTMLDivElement>(null);
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);

  // Hero scroll parallax: video at 0.3x speed, text fades out faster
  useEffect(() => {
    const section = heroSectionRef.current;
    const videoWrap = videoWrapRef.current;
    const hook = hookRef.current;
    if (!section || !videoWrap || !hook) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const isMobile = window.innerWidth <= 768;
    const intensity = isMobile ? 0.5 : 1.0;

    gsap.set(videoWrap, { scale: 1.12, willChange: 'transform', force3D: true });
    gsap.set(hook, { willChange: 'transform, opacity', force3D: true });

    const ctx = gsap.context(() => {
      gsap.to(videoWrap, {
        y: () => -window.innerHeight * 0.3 * intensity,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      gsap.to(hook, {
        y: () => -window.innerHeight * 0.35 * intensity,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '60% top',
          scrub: true,
        },
      });
    }, section);

    return () => {
      ctx.revert();
      gsap.set([videoWrap, hook], { willChange: 'auto' });
    };
  }, []);

  // Mouse parallax: hero text and video respond to cursor
  useMouseParallax(heroSectionRef, [
    { ref: hookRef, depth: 10 },
    { ref: videoWrapRef, depth: 4 },
  ]);

  // Dual-video ping-pong: two identical <video> elements alternate.
  // When the active one nears its end, the standby one starts from 0
  // and crossfades in. No native loop, no seek stutter, no canvas.
  useEffect(() => {
    const vA = videoARef.current;
    const vB = videoBRef.current;
    if (!vA || !vB) return;

    const CROSSFADE = 2.4; // seconds — overlap window
    const FPS = 1 / 60;
    const SPEED = 1 / CROSSFADE; // opacity change per second

    let raf;
    let active = vA;       // currently visible
    let standby = vB;      // waiting off-screen
    let fading = false;    // true during crossfade
    let activeOpacity = 1;
    let standbyOpacity = 0;

    // Preload standby so it's ready instantly
    standby.preload = 'auto';
    standby.currentTime = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!active.duration) return;

      const remaining = active.duration - active.currentTime;

      // Start crossfade when active approaches end
      if (!fading && remaining < CROSSFADE && remaining > 0.05) {
        fading = true;
        standby.currentTime = 0;
        standby.play().catch(() => {});
      }

      if (fading) {
        activeOpacity = Math.max(0, activeOpacity - SPEED * FPS);
        standbyOpacity = Math.min(1, standbyOpacity + SPEED * FPS);
        active.style.opacity = String(activeOpacity);
        standby.style.opacity = String(standbyOpacity);

        // Crossfade complete — swap roles
        if (standbyOpacity >= 1) {
          active.pause();
          active.style.opacity = '0';

          // Swap
          const tmp = active;
          active = standby;
          standby = tmp;
          activeOpacity = 1;
          standbyOpacity = 0;
          fading = false;

          // Pre-seek standby for next cycle
          standby.currentTime = 0;
        }
      }
    };

    // Kick off
    vA.play().catch(() => {});
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, []);

  const videoProps = {
    className: 'hero-video',
    src: '/images/hero3.mp4',
    muted: true,
    playsInline: true,
    preload: 'auto',
  };

  return (
    <section className="video-hero" ref={heroSectionRef}>
      <div className="hero-video-wrap" ref={videoWrapRef}>
        <video ref={videoARef} {...videoProps} autoPlay />
        <video ref={videoBRef} {...videoProps} style={{ opacity: 0 }} />
        <div className="hero-video-overlay" />
      </div>
      <div className="hero-hook" ref={hookRef}>
        <span className="hero-hook-label">THREE SEAS DIGITAL</span>
        <h1 className="hero-hook-headline">
          Navigate the <span className="hero-hook-accent">digital deep</span><br />
          with a crew that never<br />
          <span className="hero-hook-accent">loses course.</span>
        </h1>
        <p className="hero-hook-sub">
          <em className="desc-accent">Strategy.</em> <em className="desc-accent">Design.</em> <em className="desc-accent">Engineering.</em> — Three seas, one mission.
        </p>
      </div>
    </section>
  );
}

/* ── Navigate Section — Two-Panel Glass (converge) ── */
function NavigateSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Lazy-load the background video: only fetch + play when section is near viewport
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Trigger load and play once section enters viewport
          video.load();
          video.play().catch(() => {});
          obs.disconnect();
        }
      },
      { rootMargin: '200px' }  // start loading 200px before it enters view
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  usePinnedSection(sectionRef, leftRef, rightRef, headlineRef, { bgRef }, 'converge');
  useMouseParallax(sectionRef, [
    { ref: leftRef, depth: 6 },
    { ref: rightRef, depth: 6 },
    { ref: bgRef, depth: 4 },
  ]);

  return (
    <section ref={sectionRef} className="section-pinned" style={{ zIndex: 10 }}>
      <div ref={bgRef} className="editorial-bg">
        {/* preload="none" prevents eager network fetch — IntersectionObserver triggers load */}
        <video
          ref={videoRef}
          src="/images/admiral.mp4"
          preload="none"
          loop
          muted
          playsInline
          className="editorial-bg-video"
        />
        <div className="editorial-bg-overlay editorial-bg-overlay--dark" />
      </div>

      <div ref={leftRef} className="editorial-left glass-panel">
        <span className="micro-label">THREE SEAS DIGITAL</span>

        <div ref={headlineRef} className="editorial-headline">
          <h1>
            <span className="word">NAVIGATE</span>
            <br />
            <span className="word text-outline">THE DIGITAL</span>{' '}
            <span className="word text-outline">SEAS</span>
          </h1>
        </div>

        <p className="editorial-desc">
          Strategy, engineering, and design — built for businesses that are <em className="desc-accent">ready to grow.</em>
        </p>

        <div className="editorial-actions">
          <Link to="/contact" className="btn btn-primary editorial-btn">
            Start a project <ArrowRight size={18} />
          </Link>
          <Link to="/pricing" className="btn btn-outline editorial-btn">
            See our work <ChevronRight size={18} />
          </Link>
        </div>

        <div className="manifesto-caps">
          <span className="editorial-dot" />
          <span>Full-stack web dev</span>
          <span className="editorial-dot" />
          <span>Data analytics</span>
          <span className="editorial-dot" />
          <span>AI strategy</span>
          <span className="editorial-dot" />
          <span>Consulting</span>
        </div>
      </div>

      <div ref={rightRef} className="editorial-right glass-panel">
        <h3 className="editorial-right-title">What We Deliver</h3>
        <div className="editorial-list-item"><span className="editorial-dot" />Full-stack web development</div>
        <div className="editorial-list-item"><span className="editorial-dot" />Data analytics & dashboards</div>
        <div className="editorial-list-item"><span className="editorial-dot" />AI strategy & integration</div>
        <div className="editorial-list-item"><span className="editorial-dot" />Performance optimization</div>
        <div className="editorial-list-item"><span className="editorial-dot" />Growth consulting</div>
      </div>
    </section>
  );
}

/* ── Circuit Board WebGL ── */
const CIRCUIT_VERT = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const CIRCUIT_FRAG = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_uv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Rounded box SDF for pads
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_time;

  vec3 color = vec3(0.0);

  // Grid scale — denser grid = more detail
  float scale = 12.0;
  vec2 gp = p * scale;
  vec2 cell = floor(gp);
  vec2 fp = fract(gp);

  // ── Traces (horizontal + vertical lines along grid) ──
  float traceBright = 0.0;

  // Horizontal trace — razor-thin lines
  float hRand = hash(vec2(cell.y, 0.0));
  if (hRand > 0.35) {
    float hDist = abs(fp.y - 0.5);
    // Sharp core + soft bloom
    float hCore = smoothstep(0.015, 0.0, hDist) * 0.5;
    float hBloom = exp(-hDist * 120.0) * 0.2;
    float hLine = hCore + hBloom;
    // Pulse traveling along the trace
    float pulseX = fract(t * 0.2 * (0.5 + hRand) + hRand * 5.0);
    float pDist = abs((gp.x - cell.x) / scale - pulseX);
    float pulse = exp(-pDist * 12.0 * scale) * 0.8;
    traceBright += hLine + hLine * pulse * 2.5;
  }

  // Vertical trace
  float vRand = hash(vec2(0.0, cell.x));
  if (vRand > 0.35) {
    float vDist = abs(fp.x - 0.5);
    float vCore = smoothstep(0.015, 0.0, vDist) * 0.5;
    float vBloom = exp(-vDist * 120.0) * 0.2;
    float vLine = vCore + vBloom;
    float pulseY = fract(t * 0.18 * (0.5 + vRand) + vRand * 7.0);
    float pDist = abs((gp.y - cell.y) / scale - pulseY);
    float pulse = exp(-pDist * 12.0 * scale) * 0.8;
    traceBright += vLine + vLine * pulse * 2.5;
  }

  // ── Corner turns / elbows at intersections ──
  float cornerRand = hash(cell);
  if (cornerRand > 0.6) {
    float cornerDist = length(fp - 0.5);
    float cornerCore = smoothstep(0.012, 0.0, abs(cornerDist - 0.15)) * 0.35;
    float cornerBloom = exp(-abs(cornerDist - 0.15) * 80.0) * 0.15;
    float cornerArc = cornerCore + cornerBloom;
    // Only show quarter arcs based on hash
    float quadrant = floor(cornerRand * 4.0);
    vec2 dir = fp - 0.5;
    bool show = (quadrant < 1.0 && dir.x > 0.0 && dir.y > 0.0) ||
                (quadrant < 2.0 && dir.x < 0.0 && dir.y > 0.0) ||
                (quadrant < 3.0 && dir.x < 0.0 && dir.y < 0.0) ||
                (dir.x > 0.0 && dir.y < 0.0);
    traceBright += show ? cornerArc : 0.0;
  }

  // Trace color — matrix green with slight variation
  vec3 traceColor = mix(
    vec3(0.0, 0.9, 0.25),
    vec3(0.0, 0.65, 0.18),
    hash(cell * 0.37)
  );
  color += traceColor * traceBright;

  // ── IC Pads / Components at some intersections ──
  for (float dy = -1.0; dy <= 1.0; dy++) {
    for (float dx = -1.0; dx <= 1.0; dx++) {
      vec2 nc = cell + vec2(dx, dy);
      float padRand = hash(nc * 1.73);

      if (padRand > 0.72) {
        vec2 padCenter = (nc + 0.5) / scale;
        float padType = floor(padRand * 3.0);

        vec2 diff = p - padCenter;

        if (padType < 1.0) {
          // Square IC chip — hard edge + tight glow
          float d = sdRoundBox(diff, vec2(0.018, 0.018), 0.003);
          float chip = smoothstep(0.002, 0.0, d) * 0.7;
          float ring = exp(-abs(d) * 140.0) * 0.35;
          // Pulse — chip activates periodically
          float fireRate = 2.0 + padRand * 4.0;
          float fire = smoothstep(0.0, 0.05, fract(t / fireRate))
                     * smoothstep(0.3, 0.05, fract(t / fireRate));
          color += vec3(0.0, 1.0, 0.35) * (chip + ring) * (0.5 + fire * 0.8);
        } else if (padType < 2.0) {
          // Circular via/pad — tighter falloff
          float d = length(diff);
          float outer = exp(-d * 200.0) * 0.5;
          float inner = exp(-d * 350.0) * 0.4;
          float pulse = sin(t * 1.5 + padRand * 6.28) * 0.5 + 0.5;
          color += vec3(0.0, 1.0, 0.4) * (outer * (0.4 + pulse * 0.6) + inner);
        } else {
          // Rectangular capacitor — crisper edges
          float d = sdRoundBox(diff, vec2(0.025, 0.008), 0.002);
          float cap = smoothstep(0.0015, 0.0, d) * 0.5;
          float glow = exp(-abs(d) * 100.0) * 0.2;
          color += vec3(0.0, 0.8, 0.25) * (cap + glow);
        }
      }
    }
  }

  // ── Data pulses — bright dots traveling along traces ──
  for (float i = 0.0; i < 6.0; i++) {
    float seed = i * 3.71;
    float row = floor(hash(vec2(seed, 0.0)) * scale);
    float speed = 0.3 + hash(vec2(seed, 1.0)) * 0.4;
    float phase = fract(t * speed + hash(vec2(seed, 2.0)));
    vec2 pulsePos = vec2(phase * aspect, (row + 0.5) / scale);
    float d = length(p - pulsePos);
    float bright = exp(-d * 80.0) * 0.8;
    // Trailing glow — tighter
    vec2 trail = p - pulsePos;
    float trailDist = abs(trail.y);
    float trailLen = max(0.0, -trail.x);
    float trailGlow = exp(-trailDist * 140.0) * exp(-trailLen * 20.0) * 0.25;
    color += vec3(0.5, 1.0, 0.55) * bright + vec3(0.0, 0.8, 0.25) * trailGlow;
  }

  // Vertical data pulses
  for (float i = 0.0; i < 4.0; i++) {
    float seed = i * 5.13 + 100.0;
    float col = floor(hash(vec2(seed, 0.0)) * scale);
    float speed = 0.25 + hash(vec2(seed, 1.0)) * 0.35;
    float phase = fract(t * speed + hash(vec2(seed, 2.0)));
    vec2 pulsePos = vec2((col + 0.5) / scale, phase);
    float d = length(p - pulsePos);
    float bright = exp(-d * 80.0) * 0.6;
    color += vec3(0.4, 1.0, 0.45) * bright;
  }

  // Crisp grid dots at every intersection
  vec2 gridFrac = fract(gp);
  float dotDist = length(gridFrac - 0.5);
  float gridDot = smoothstep(0.04, 0.02, dotDist) * 0.12;
  color += vec3(0.0, 0.5, 0.15) * gridDot;

  // Central processor glow
  vec2 center = vec2(aspect * 0.5, 0.5);
  float centerDist = length(p - center);
  float cpuGlow = exp(-centerDist * 5.0) * 0.12;
  color += vec3(0.0, 0.8, 0.25) * cpuGlow;

  // Vignette
  float vig = smoothstep(0.75, 0.25, length(uv - 0.5));
  color *= vig;

  float alpha = clamp(length(color) * 1.8, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}`;

function CircuitBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, CIRCUIT_VERT); gl.compileShader(vs);
    if (!checkShader(gl, vs, 'circuit-vert')) return;
    const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, CIRCUIT_FRAG); gl.compileShader(fs);
    if (!checkShader(gl, fs, 'circuit-frag')) return;
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!checkProgram(gl, prog)) return;
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

    let t0 = performance.now();
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

  return <canvas ref={canvasRef} className="circuit-board-canvas" aria-hidden="true" />;
}

/* ── Typing Terminal Background ── */
const TERMINAL_LINES = [
  // ── System boot ──
  { text: '\x1b[90m[system]\x1b[0m Initializing Three Seas build environment...' },
  { text: '\x1b[36m◆\x1b[0m Node \x1b[32mv22.4.0\x1b[0m  │  pnpm \x1b[32mv9.1.2\x1b[0m  │  Vite \x1b[32mv6.0.3\x1b[0m' },
  { text: '' },

  // ── Install dependencies ──
  { prompt: true, text: 'pnpm install' },
  { text: '\x1b[36m⠋\x1b[0m Resolving dependencies...' },
  { text: '\x1b[36m⠙\x1b[0m Fetching packages...' },
  { text: '\x1b[36m⠹\x1b[0m Linking workspace packages...' },
  { text: '\x1b[32m✓\x1b[0m Packages:  \x1b[32m+847\x1b[0m  (412 cached)' },
  { text: '\x1b[32m✓\x1b[0m Dependencies installed in \x1b[33m3.2s\x1b[0m' },
  { text: '' },
  { text: '\x1b[35m┌─────────────────────────────────────┐\x1b[0m' },
  { text: '\x1b[35m│\x1b[0m  \x1b[37mInstallation complete\x1b[0m              \x1b[35m│\x1b[0m' },
  { text: '\x1b[35m│\x1b[0m  \x1b[90m847 packages, 0 vulnerabilities\x1b[0m    \x1b[35m│\x1b[0m' },
  { text: '\x1b[35m└─────────────────────────────────────┘\x1b[0m' },
  { text: '' },

  // ── Build ──
  { prompt: true, text: 'pnpm build' },
  { text: '\x1b[36m◆\x1b[0m \x1b[37mvite v6.0.3\x1b[0m building for \x1b[33mproduction\x1b[0m...' },
  { text: '\x1b[32m█████████████████████████████░\x1b[0m  97%  transforming' },
  { text: '\x1b[32m██████████████████████████████\x1b[0m 100%  \x1b[32mdone\x1b[0m' },
  { text: '' },
  { text: '\x1b[36m❯\x1b[0m dist/assets/\x1b[36mindex-3f8a2c.js\x1b[0m    \x1b[33m 142.8 kB\x1b[0m │ gzip: \x1b[32m 48.2 kB\x1b[0m' },
  { text: '\x1b[36m❯\x1b[0m dist/assets/\x1b[36mvendor-a91bc4.js\x1b[0m   \x1b[33m  89.4 kB\x1b[0m │ gzip: \x1b[32m 31.7 kB\x1b[0m' },
  { text: '\x1b[36m❯\x1b[0m dist/assets/\x1b[36mstyles-d4e7f1.css\x1b[0m  \x1b[33m  24.1 kB\x1b[0m │ gzip: \x1b[32m  5.8 kB\x1b[0m' },
  { text: '\x1b[32m✓\x1b[0m Built in \x1b[33m4.12s\x1b[0m' },
  { text: '' },

  // ── Testing ──
  { prompt: true, text: 'pnpm test:ci' },
  { text: '\x1b[32m PASS \x1b[0m src/auth/__tests__/login.test.ts       \x1b[90m(1.2s)\x1b[0m' },
  { text: '\x1b[32m PASS \x1b[0m src/api/__tests__/endpoints.test.ts    \x1b[90m(0.8s)\x1b[0m' },
  { text: '\x1b[32m PASS \x1b[0m src/hooks/__tests__/useAnalytics.test  \x1b[90m(0.4s)\x1b[0m' },
  { text: '\x1b[32m PASS \x1b[0m src/utils/__tests__/transforms.test    \x1b[90m(0.3s)\x1b[0m' },
  { text: '\x1b[32m PASS \x1b[0m e2e/checkout.spec.ts                   \x1b[90m(3.1s)\x1b[0m' },
  { text: '' },
  { text: '\x1b[37mTest Suites:\x1b[0m  \x1b[32m48 passed\x1b[0m, 48 total' },
  { text: '\x1b[37mTests:\x1b[0m        \x1b[32m312 passed\x1b[0m, 312 total' },
  { text: '\x1b[37mCoverage:\x1b[0m     \x1b[32m94.7%\x1b[0m statements │ \x1b[32m91.2%\x1b[0m branches' },
  { text: '\x1b[37mTime:\x1b[0m         \x1b[33m8.41s\x1b[0m' },
  { text: '' },

  // ── Docker ──
  { prompt: true, text: 'docker compose up -d --build' },
  { text: '\x1b[34m[+]\x1b[0m Building \x1b[36mnginx\x1b[0m...' },
  { text: '\x1b[34m[+]\x1b[0m Building \x1b[36mapi-server\x1b[0m...' },
  { text: '\x1b[32m██████████████████████████████\x1b[0m  \x1b[36mnginx\x1b[0m        \x1b[32mbuilt\x1b[0m' },
  { text: '\x1b[32m██████████████████████████████\x1b[0m  \x1b[36mapi-server\x1b[0m   \x1b[32mbuilt\x1b[0m' },
  { text: '' },
  { text: '\x1b[32m✓\x1b[0m Container \x1b[36mdb-postgres\x1b[0m     \x1b[32mRunning\x1b[0m       \x1b[90m:5432\x1b[0m' },
  { text: '\x1b[32m✓\x1b[0m Container \x1b[36mredis-cache\x1b[0m     \x1b[32mRunning\x1b[0m       \x1b[90m:6379\x1b[0m' },
  { text: '\x1b[32m✓\x1b[0m Container \x1b[36mapi-server\x1b[0m      \x1b[32mStarted\x1b[0m       \x1b[90m:8080\x1b[0m' },
  { text: '\x1b[32m✓\x1b[0m Container \x1b[36mnginx-proxy\x1b[0m     \x1b[32mStarted\x1b[0m       \x1b[90m:443\x1b[0m' },
  { text: '\x1b[32m✓\x1b[0m Container \x1b[36mworker-queue\x1b[0m    \x1b[32mStarted\x1b[0m       \x1b[90m:—\x1b[0m' },
  { text: '' },

  // ── Deploy ──
  { prompt: true, text: 'pnpm deploy:prod --region us-east-1' },
  { text: '\x1b[35m⬡\x1b[0m Uploading assets to CDN...' },
  { text: '\x1b[32m████████████░░░░░░░░░░░░░░░░░░\x1b[0m  40%  \x1b[90mstyles...\x1b[0m' },
  { text: '\x1b[32m████████████████████░░░░░░░░░░\x1b[0m  67%  \x1b[90mscripts...\x1b[0m' },
  { text: '\x1b[32m██████████████████████████████\x1b[0m 100%  \x1b[32mcomplete\x1b[0m' },
  { text: '' },
  { text: '\x1b[36m❯\x1b[0m Running database migrations...' },
  { text: '\x1b[32m✓\x1b[0m Migration \x1b[33m20260214_add_analytics\x1b[0m applied' },
  { text: '\x1b[32m✓\x1b[0m Migration \x1b[33m20260214_update_schema\x1b[0m applied' },
  { text: '\x1b[36m❯\x1b[0m Invalidating edge cache...' },
  { text: '\x1b[32m✓\x1b[0m Cache purged across \x1b[33m24 edge nodes\x1b[0m' },
  { text: '' },

  // ── Health check ──
  { prompt: true, text: 'curl -s https://api.client.io/health | jq' },
  { text: '{' },
  { text: '  "status": \x1b[32m"operational"\x1b[0m,' },
  { text: '  "uptime": \x1b[32m"99.97%"\x1b[0m,' },
  { text: '  "latency_p99": \x1b[33m"12ms"\x1b[0m,' },
  { text: '  "active_connections": \x1b[36m2847\x1b[0m,' },
  { text: '  "version": \x1b[35m"3.2.1"\x1b[0m' },
  { text: '}' },
  { text: '' },

  // ── Git log ──
  { prompt: true, text: 'git log --oneline --graph -8' },
  { text: '\x1b[31m*\x1b[0m \x1b[33mf4a2c1e\x1b[0m \x1b[32m(HEAD → main)\x1b[0m deploy: v3.2.1 production' },
  { text: '\x1b[31m*\x1b[0m \x1b[33md8b7a3f\x1b[0m feat: real-time analytics dashboard' },
  { text: '\x1b[31m*\x1b[0m \x1b[33m91c5e2d\x1b[0m fix: auth token refresh race condition' },
  { text: '\x1b[31m*\x1b[0m \x1b[33ma7f8b4c\x1b[0m perf: reduce TTFB by 340ms' },
  { text: '\x1b[31m*\x1b[0m \x1b[33m3e1d9f7\x1b[0m feat: webhook event streaming' },
  { text: '\x1b[31m*\x1b[0m \x1b[33mc92e4a1\x1b[0m chore: upgrade to Node 22 LTS' },
  { text: '\x1b[31m*\x1b[0m \x1b[33m7b3f8d2\x1b[0m refactor: migrate to ESM modules' },
  { text: '\x1b[31m*\x1b[0m \x1b[33me15a6c9\x1b[0m feat: add OpenTelemetry tracing' },
  { text: '' },

  // ── Final status ──
  { text: '\x1b[32m┌─────────────────────────────────────┐\x1b[0m' },
  { text: '\x1b[32m│\x1b[0m                                     \x1b[32m│\x1b[0m' },
  { text: '\x1b[32m│\x1b[0m   \x1b[32m✓ DEPLOYMENT SUCCESSFUL\x1b[0m            \x1b[32m│\x1b[0m' },
  { text: '\x1b[32m│\x1b[0m                                     \x1b[32m│\x1b[0m' },
  { text: '\x1b[32m│\x1b[0m   \x1b[37mVersion:\x1b[0m  \x1b[36m3.2.1\x1b[0m                  \x1b[32m│\x1b[0m' },
  { text: '\x1b[32m│\x1b[0m   \x1b[37mRegion:\x1b[0m   \x1b[36mus-east-1\x1b[0m              \x1b[32m│\x1b[0m' },
  { text: '\x1b[32m│\x1b[0m   \x1b[37mURL:\x1b[0m      \x1b[34mhttps://app.client.io\x1b[0m  \x1b[32m│\x1b[0m' },
  { text: '\x1b[32m│\x1b[0m   \x1b[37mTime:\x1b[0m     \x1b[33m47.3s total\x1b[0m             \x1b[32m│\x1b[0m' },
  { text: '\x1b[32m│\x1b[0m                                     \x1b[32m│\x1b[0m' },
  { text: '\x1b[32m└─────────────────────────────────────┘\x1b[0m' },
];

function parseAnsi(raw: string) {
  const parts: React.ReactNode[] = [];
  let rest = raw;
  let key = 0;
  const colorMap = { '31': '#EF4444', '32': '#10B981', '33': '#D4AF37', '34': '#3B82F6', '35': '#A855F7', '36': '#34D399', '37': '#E8E6E1', '90': '#6B7280', '0': null };
  while (rest.length) {
    const idx = rest.indexOf('\x1b[');
    if (idx === -1) { parts.push(rest); break; }
    if (idx > 0) parts.push(rest.slice(0, idx));
    rest = rest.slice(idx + 2);
    const m = rest.match(/^(\d+)m/);
    if (m) {
      rest = rest.slice(m[0].length);
      const color = colorMap[m[1]];
      const end = rest.indexOf('\x1b[');
      const chunk = end === -1 ? rest : rest.slice(0, end);
      if (color) parts.push(<span key={key++} style={{ color }}>{chunk}</span>);
      else parts.push(chunk);
      rest = end === -1 ? '' : rest.slice(end);
    }
  }
  return parts;
}

function TypingTerminal() {
  const [lines, setLines] = useState([]);
  const [currentChar, setCurrentChar] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const blink = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(blink);
  }, []);

  useEffect(() => {
    if (lineIdx >= TERMINAL_LINES.length) {
      const reset = setTimeout(() => { setLines([]); setLineIdx(0); setCurrentChar(0); }, 4000);
      return () => clearTimeout(reset);
    }
    const line = TERMINAL_LINES[lineIdx];
    const fullText = line.text;
    if (line.text === '') {
      const t = setTimeout(() => { setLines(p => [...p, { ...line, typed: '' }]); setLineIdx(i => i + 1); setCurrentChar(0); }, 200);
      return () => clearTimeout(t);
    }
    if (currentChar <= fullText.length) {
      const speed = line.prompt ? 35 + Math.random() * 25 : 8 + Math.random() * 12;
      const t = setTimeout(() => {
        if (currentChar === fullText.length) {
          setLines(p => [...p, { ...line, typed: fullText }]);
          setLineIdx(i => i + 1);
          setCurrentChar(0);
        } else {
          setCurrentChar(c => c + 1);
        }
      }, speed);
      return () => clearTimeout(t);
    }
  }, [lineIdx, currentChar]);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [lines, currentChar]);

  const activeLine = lineIdx < TERMINAL_LINES.length ? TERMINAL_LINES[lineIdx] : null;
  const activeRaw = activeLine ? activeLine.text.slice(0, currentChar) : '';

  return (
    <div className="typing-terminal" ref={termRef}>
      <div className="terminal-chrome">
        <span className="terminal-dot" style={{ background: '#ff5f57' }} />
        <span className="terminal-dot" style={{ background: '#febc2e' }} />
        <span className="terminal-dot" style={{ background: '#28c840' }} />
        <span className="terminal-title">zsh — three-seas</span>
      </div>
      <div className="terminal-body">
        {lines.map((l, i) => (
          <div key={i} className="terminal-line">
            {l.prompt && <span className="terminal-prompt">❯ </span>}
            <span>{parseAnsi(l.typed)}</span>
          </div>
        ))}
        {activeLine && (
          <div className="terminal-line">
            {activeLine.prompt && <span className="terminal-prompt">❯ </span>}
            <span>{parseAnsi(activeRaw)}</span>
            <span className="terminal-cursor" style={{ opacity: cursorVisible ? 1 : 0 }}>▌</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Animated Analytics Dashboard Background ── */
const DASH_KPIS = [
  { label: 'Revenue', prefix: '$', value: 284600, suffix: '', color: '#10B981' },
  { label: 'Conversions', prefix: '', value: 1247, suffix: '', color: '#34D399' },
  { label: 'ROAS', prefix: '', value: 4.8, suffix: 'x', color: '#D4AF37' },
  { label: 'Sessions', prefix: '', value: 38420, suffix: '', color: '#E8E6E1' },
];

const DASH_BAR_DATA = [
  { label: 'Organic', value: 42 },
  { label: 'Paid', value: 28 },
  { label: 'Social', value: 18 },
  { label: 'Email', value: 31 },
  { label: 'Referral', value: 14 },
  { label: 'Direct', value: 22 },
];

function generateSparkline(points: number, amplitude: number, offset: number): number[] {
  const pts = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const y = offset + Math.sin(t * Math.PI * 2.5 + offset) * amplitude + Math.sin(t * Math.PI * 5 + offset * 2) * (amplitude * 0.3);
    pts.push(y);
  }
  return pts;
}

const DASH_LINE_SETS = [
  { color: '#10B981', data: generateSparkline(24, 18, 0), label: 'Revenue' },
  { color: '#34D399', data: generateSparkline(24, 14, 2), label: 'Traffic' },
  { color: '#D4AF37', data: generateSparkline(24, 10, 4), label: 'Conv Rate' },
];

function AnimatedCounter({ value, prefix, suffix, duration = 2000 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = performance.now();
    const isFloat = value % 1 !== 0;
    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * value;
      setDisplay(isFloat ? parseFloat(current.toFixed(1)) : Math.floor(current));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  const formatted = typeof display === 'string' ? display :
    display >= 1000 ? display.toLocaleString() : display;
  return <>{prefix}{formatted}{suffix}</>;
}

function MiniLineChart({ datasets, width = 320, height = 100 }: { datasets: any[]; width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const lines = svg.querySelectorAll('.dash-line-path');
    const fills = svg.querySelectorAll('.dash-fill-path');
    let t0 = performance.now();

    const animate = (now) => {
      const elapsed = (now - t0) / 1000;
      datasets.forEach((set, si) => {
        const pts = set.data.map((v, i) => {
          const x = (i / (set.data.length - 1)) * width;
          const wave1 = Math.sin(elapsed * 0.6 + i * 0.35 + si * 1.8) * 6;
          const wave2 = Math.sin(elapsed * 0.25 + i * 0.18 + si * 3.1) * 4;
          const wave3 = Math.sin(elapsed * 1.1 + i * 0.55 + si * 0.7) * 2;
          const y = height - 10 - ((v + wave1 + wave2 + wave3) / 55) * (height - 20);
          return `${x},${y}`;
        }).join(' ');
        if (lines[si]) lines[si].setAttribute('points', pts);
        if (fills[si]) fills[si].setAttribute('points', `0,${height} ${pts} ${width},${height}`);
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [datasets, width, height]);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="dash-line-chart" preserveAspectRatio="none">
      {datasets.map((set, si) => {
        const initPts = set.data.map((v, i) => {
          const x = (i / (set.data.length - 1)) * width;
          const y = height - 10 - (v / 55) * (height - 20);
          return `${x},${y}`;
        }).join(' ');
        return (
          <g key={si}>
            <polygon className="dash-fill-path" points={`0,${height} ${initPts} ${width},${height}`} fill={set.color} opacity="0.08" />
            <polyline className="dash-line-path" points={initPts} fill="none" stroke={set.color} strokeWidth="2" strokeLinejoin="round" />
          </g>
        );
      })}
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1="0" y1={height * f} x2={width} y2={height * f} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
    </svg>
  );
}

function DonutChart({ segments, size = 90 }: { segments: any[]; size?: number }) {
  const total = segments.reduce((s, v) => s + v.value, 0);
  const r = 34, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="dash-donut">
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circ;
        const gap = circ - dash;
        const rot = offset * 360 - 90;
        offset += pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="7"
            strokeDasharray={`${dash} ${gap}`}
            transform={`rotate(${rot} ${cx} ${cy})`}
            className="dash-donut-seg"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        );
      })}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.6)" fontSize="11" fontWeight="600">
        {total.toLocaleString()}
      </text>
    </svg>
  );
}

const BAR_COLORS = ['#10B981', '#34D399', '#D4AF37', '#E8E6E1', '#059669', '#6B7280'];

function AnalyticsDashboard() {
  const barsRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = barsRef.current;
    if (!container) return;
    const fills = container.querySelectorAll<HTMLElement>('.dash-bar-fill');
    const vals = container.querySelectorAll('.dash-bar-val');
    let t0 = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - t0) / 1000;
      DASH_BAR_DATA.forEach((bar, i) => {
        const wave = Math.sin(elapsed * 0.5 + i * 1.2) * 5
                   + Math.sin(elapsed * 0.8 + i * 2.3) * 3
                   + Math.sin(elapsed * 0.2 + i * 0.5) * 2;
        const live = Math.max(4, Math.min(44, bar.value + wave));
        const pct = (live / 45) * 100;
        if (fills[i]) fills[i].style.width = `${pct}%`;
        if (vals[i]) vals[i].textContent = `${Math.round(live)}%`;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div className="analytics-dash">
      {/* Header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-live-dot" />
          <span className="dash-header-title">Performance Overview</span>
        </div>
        <div className="dash-header-pills">
          <span className="dash-pill">7d</span>
          <span className="dash-pill dash-pill--active">30d</span>
          <span className="dash-pill">90d</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="dash-kpi-row">
        {DASH_KPIS.map((kpi, i) => (
          <div key={i} className="dash-kpi" style={{ '--kpi-color': kpi.color } as React.CSSProperties}>
            <span className="dash-kpi-label">{kpi.label}</span>
            <span className="dash-kpi-value">
              <AnimatedCounter value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} duration={1800 + i * 200} />
            </span>
            <span className="dash-kpi-delta" style={{ color: '#10B981' }}>+{(3 + i * 2.1).toFixed(1)}%</span>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="dash-charts-row">
        {/* Line chart */}
        <div className="dash-chart-card dash-chart-card--wide">
          <div className="dash-chart-head">
            <span>Trends</span>
            <div className="dash-chart-legend">
              {DASH_LINE_SETS.map((s, i) => (
                <span key={i} className="dash-legend-item"><span className="dash-legend-dot" style={{ background: s.color }} />{s.label}</span>
              ))}
            </div>
          </div>
          <MiniLineChart datasets={DASH_LINE_SETS} width={360} height={110} />
        </div>

        {/* Donut */}
        <div className="dash-chart-card">
          <div className="dash-chart-head"><span>Channels</span></div>
          <DonutChart segments={[
            { value: 42, color: '#4ade80' },
            { value: 28, color: '#22d3ee' },
            { value: 18, color: '#facc15' },
            { value: 12, color: '#a78bfa' },
          ]} />
          <div className="dash-donut-labels">
            <span><span className="dash-legend-dot" style={{ background: '#4ade80' }} />Organic</span>
            <span><span className="dash-legend-dot" style={{ background: '#22d3ee' }} />Paid</span>
            <span><span className="dash-legend-dot" style={{ background: '#facc15' }} />Social</span>
            <span><span className="dash-legend-dot" style={{ background: '#a78bfa' }} />Other</span>
          </div>
        </div>
      </div>

      {/* Bar chart row */}
      <div className="dash-bar-section" ref={barsRef}>
        <div className="dash-chart-head"><span>Channel Performance</span></div>
        <div className="dash-bars">
          {DASH_BAR_DATA.map((bar, i) => (
            <div key={i} className="dash-bar-item">
              <span className="dash-bar-label">{bar.label}</span>
              <div className="dash-bar-track">
                <div className="dash-bar-fill" style={{
                  width: `${(bar.value / 45) * 100}%`,
                  '--bar-color': BAR_COLORS[i],
                } as React.CSSProperties} />
              </div>
              <span className="dash-bar-val">{bar.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Analytics Triptych — 3 chart-heavy dashboards ── */

/* -- Seed data generators -- */
function genCandles(n: number) {
  const c = [];
  let p = 142;
  for (let i = 0; i < n; i++) {
    const open = p;
    const close = open + (Math.random() - 0.48) * 8;
    const high = Math.max(open, close) + Math.random() * 4;
    const low = Math.min(open, close) - Math.random() * 4;
    c.push({ open, close, high, low });
    p = close;
  }
  return c;
}
function genScatter(n: number) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push({ x: 5 + Math.random() * 90, y: 10 + Math.random() * 75, r: 2 + Math.random() * 4 });
  }
  return pts;
}
function genHisto(n: number) {
  const bins = [];
  for (let i = 0; i < n; i++) {
    bins.push(5 + Math.pow(Math.sin(i * 0.5 + 1) * 0.5 + 0.5, 0.7) * 40 + Math.random() * 10);
  }
  return bins;
}

const CANDLE_DATA = genCandles(20);
const SCATTER_DATA = genScatter(35);
const HISTO_DATA = genHisto(14);

const TICKER_ITEMS = [
  { sym: 'AAPL', price: 187.42, delta: 2.14 },
  { sym: 'GOOGL', price: 142.68, delta: -0.87 },
  { sym: 'MSFT', price: 378.91, delta: 4.32 },
  { sym: 'AMZN', price: 178.25, delta: 1.56 },
  { sym: 'NVDA', price: 824.17, delta: 12.83 },
  { sym: 'META', price: 502.30, delta: -3.21 },
  { sym: 'TSLA', price: 248.62, delta: 5.74 },
  { sym: 'JPM', price: 196.85, delta: 0.93 },
];

const COMBO_BARS = [
  { label: 'Jan', bar: 28, line: 32 },
  { label: 'Feb', bar: 35, line: 30 },
  { label: 'Mar', bar: 22, line: 38 },
  { label: 'Apr', bar: 40, line: 42 },
  { label: 'May', bar: 32, line: 36 },
  { label: 'Jun', bar: 45, line: 48 },
  { label: 'Jul', bar: 38, line: 44 },
  { label: 'Aug', bar: 42, line: 40 },
];

const PIE_SEGS = [
  { label: 'Organic', value: 34, color: '#4ade80' },
  { label: 'Paid', value: 26, color: '#22d3ee' },
  { label: 'Social', value: 18, color: '#facc15' },
  { label: 'Email', value: 14, color: '#a78bfa' },
  { label: 'Direct', value: 8, color: '#f472b6' },
];

/* ── Panel 1: Candlestick + Ticker Tape + Pie ── */
function ChartPanel1() {
  const svgRef = useRef<SVGSVGElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const ticker = tickerRef.current;
    const pie = pieRef.current;
    if (!svg || !ticker || !pie) return;
    const candles = svg.querySelectorAll('.tri-candle');
    const wicks = svg.querySelectorAll('.tri-wick');
    const tPrices = ticker.querySelectorAll('.tri-tk-price');
    const tDeltas = ticker.querySelectorAll('.tri-tk-delta');
    const pieSegs = pie.querySelectorAll('.tri-pie-seg');
    let t0 = performance.now();

    const animate = (now) => {
      const elapsed = (now - t0) / 1000;
      // Candles
      CANDLE_DATA.forEach((c, i) => {
        const wave = Math.sin(elapsed * 0.5 + i * 0.7) * 3;
        const o = c.open + wave;
        const cl = c.close + wave * 0.8;
        const h = c.high + wave * 0.6;
        const l = c.low + wave * 0.4;
        const minP = 120, maxP = 175, H = 140;
        const yTop = ((maxP - Math.max(o, cl)) / (maxP - minP)) * H;
        const yBot = ((maxP - Math.min(o, cl)) / (maxP - minP)) * H;
        const yH = ((maxP - h) / (maxP - minP)) * H;
        const yL = ((maxP - l) / (maxP - minP)) * H;
        const bull = cl >= o;
        if (candles[i]) {
          candles[i].setAttribute('y', String(yTop));
          candles[i].setAttribute('height', String(Math.max(1, yBot - yTop)));
          candles[i].setAttribute('fill', bull ? '#4ade80' : '#f472b6');
          candles[i].setAttribute('opacity', '0.8');
        }
        if (wicks[i]) {
          wicks[i].setAttribute('y1', String(yH));
          wicks[i].setAttribute('y2', String(yL));
          wicks[i].setAttribute('stroke', bull ? '#4ade80' : '#f472b6');
        }
      });
      // Ticker
      TICKER_ITEMS.forEach((t, i) => {
        const w = Math.sin(elapsed * 0.6 + i * 1.3) * (t.price * 0.005);
        const dw = Math.sin(elapsed * 0.4 + i * 1.8) * 0.8;
        const p = t.price + w;
        const d = t.delta + dw;
        if (tPrices[i]) tPrices[i].textContent = p.toFixed(2);
        if (tDeltas[i]) {
          tDeltas[i].textContent = (d >= 0 ? '+' : '') + d.toFixed(2);
          (tDeltas[i] as HTMLElement).style.color = d >= 0 ? '#4ade80' : '#f472b6';
        }
      });
      // Pie rotation
      if (pieSegs.length) {
        const rot = elapsed * 8;
        pie.querySelector('.tri-pie-group').setAttribute('transform', `rotate(${rot} 50 50)`);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const W = 320, CH = 140, bw = W / CANDLE_DATA.length;

  return (
    <div className="analytics-dash">
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-live-dot" style={{ background: '#4ade80', boxShadow: '0 0 8px rgba(74,222,128,0.5)' }} />
          <span className="dash-header-title">Market Data</span>
        </div>
        <div className="dash-header-pills">
          <span className="dash-pill">1D</span>
          <span className="dash-pill dash-pill--active">1W</span>
          <span className="dash-pill">1M</span>
        </div>
      </div>
      {/* Ticker tape */}
      <div className="tri-ticker-wrap" ref={tickerRef}>
        <div className="tri-ticker-tape">
          {TICKER_ITEMS.map((t, i) => (
            <div key={i} className="tri-tk-item">
              <span className="tri-tk-sym">{t.sym}</span>
              <span className="tri-tk-price">{t.price.toFixed(2)}</span>
              <span className="tri-tk-delta" style={{ color: t.delta >= 0 ? '#4ade80' : '#f472b6' }}>
                {t.delta >= 0 ? '+' : ''}{t.delta.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Candlestick chart */}
      <div className="dash-chart-card" style={{ flex: 1 }}>
        <div className="dash-chart-head"><span>Candlestick</span></div>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${CH}`} className="tri-candle-svg" preserveAspectRatio="none">
          {[0.25, 0.5, 0.75].map(f => (
            <line key={f} x1="0" y1={CH * f} x2={W} y2={CH * f} stroke="rgba(255,255,255,0.04)" />
          ))}
          {CANDLE_DATA.map((c, i) => {
            const x = i * bw + bw * 0.15;
            const cx = i * bw + bw * 0.5;
            return (
              <g key={i}>
                <line className="tri-wick" x1={cx} x2={cx} y1="0" y2={CH} stroke="#4ade80" strokeWidth="1" opacity="0.4" />
                <rect className="tri-candle" x={x} width={bw * 0.7} y="0" height="10" rx="1" fill="#4ade80" />
              </g>
            );
          })}
        </svg>
      </div>
      {/* Pie chart */}
      <div className="dash-chart-card">
        <div className="dash-chart-head"><span>Channels</span></div>
        <div className="tri-pie-row">
          <svg ref={pieRef} viewBox="0 0 100 100" className="tri-pie-svg">
            <g className="tri-pie-group">
              {(() => {
                const total = PIE_SEGS.reduce((s, v) => s + v.value, 0);
                let cum = 0;
                return PIE_SEGS.map((seg, i) => {
                  const pct = seg.value / total;
                  const startAngle = cum * 2 * Math.PI - Math.PI / 2;
                  cum += pct;
                  const endAngle = cum * 2 * Math.PI - Math.PI / 2;
                  const large = pct > 0.5 ? 1 : 0;
                  const x1 = 50 + 40 * Math.cos(startAngle);
                  const y1 = 50 + 40 * Math.sin(startAngle);
                  const x2 = 50 + 40 * Math.cos(endAngle);
                  const y2 = 50 + 40 * Math.sin(endAngle);
                  return <path key={i} className="tri-pie-seg" d={`M50,50 L${x1},${y1} A40,40 0 ${large} 1 ${x2},${y2} Z`} fill={seg.color} opacity="0.75" />;
                });
              })()}
            </g>
          </svg>
          <div className="tri-pie-labels">
            {PIE_SEGS.map((s, i) => (
              <span key={i}><span className="dash-legend-dot" style={{ background: s.color }} />{s.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Panel 2: Combo Bar+Line + Histogram + Scatter ── */
function ChartPanel2() {
  const comboRef = useRef<SVGSVGElement>(null);
  const histoRef = useRef<SVGSVGElement>(null);
  const scatterRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const combo = comboRef.current;
    const histo = histoRef.current;
    const scatter = scatterRef.current;
    if (!combo || !histo || !scatter) return;
    const bars = combo.querySelectorAll('.tri-combo-bar');
    const linePts = combo.querySelector('.tri-combo-line');
    const histoBars = histo.querySelectorAll('.tri-histo-bar');
    const dots = scatter.querySelectorAll('.tri-scatter-dot');
    let t0 = performance.now();

    const animate = (now) => {
      const elapsed = (now - t0) / 1000;
      const W = 320, H = 100;
      // Combo bars
      COMBO_BARS.forEach((b, i) => {
        const wave = Math.sin(elapsed * 0.5 + i * 0.9) * 5;
        const h = Math.max(3, Math.min(50, b.bar + wave));
        if (bars[i]) (bars[i] as SVGElement).setAttribute('height', String((h / 50) * H));
        if (bars[i]) (bars[i] as SVGElement).setAttribute('y', String(H - (h / 50) * H));
      });
      // Combo line overlay
      if (linePts) {
        const pts = COMBO_BARS.map((b, i) => {
          const x = (i / (COMBO_BARS.length - 1)) * W;
          const wave = Math.sin(elapsed * 0.6 + i * 0.8) * 5;
          const y = H - ((b.line + wave) / 55) * H;
          return `${x},${y}`;
        }).join(' ');
        linePts.setAttribute('points', pts);
      }
      // Histogram
      HISTO_DATA.forEach((v, i) => {
        const wave = Math.sin(elapsed * 0.4 + i * 0.6) * 4;
        const h = Math.max(2, v + wave);
        if (histoBars[i]) {
          histoBars[i].setAttribute('height', String((h / 55) * 80));
          histoBars[i].setAttribute('y', String(80 - (h / 55) * 80));
        }
      });
      // Scatter dots drift
      SCATTER_DATA.forEach((p, i) => {
        const dx = Math.sin(elapsed * 0.3 + i * 0.9) * 2;
        const dy = Math.cos(elapsed * 0.4 + i * 1.1) * 2;
        if (dots[i]) {
          dots[i].setAttribute('cx', `${p.x + dx}%`);
          dots[i].setAttribute('cy', `${p.y + dy}%`);
          (dots[i] as Element).setAttribute('opacity', String(0.4 + Math.sin(elapsed * 0.5 + i) * 0.25));
        }
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const W = 320, H = 100;
  const bw = W / COMBO_BARS.length;
  const hw = 280 / HISTO_DATA.length;
  const SCATTER_COLORS = ['#4ade80', '#22d3ee', '#facc15', '#a78bfa', '#f472b6'];

  return (
    <div className="analytics-dash">
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-live-dot" style={{ background: '#facc15', boxShadow: '0 0 8px rgba(250,204,21,0.5)' }} />
          <span className="dash-header-title">Performance Mix</span>
        </div>
        <div className="dash-header-pills">
          <span className="dash-pill">MTD</span>
          <span className="dash-pill dash-pill--active">QTD</span>
          <span className="dash-pill">YTD</span>
        </div>
      </div>
      {/* Combo bar + line */}
      <div className="dash-chart-card" style={{ flex: 1 }}>
        <div className="dash-chart-head">
          <span>Revenue vs Target</span>
          <div className="dash-chart-legend">
            <span className="dash-legend-item"><span className="dash-legend-dot" style={{ background: '#22d3ee' }} />Revenue</span>
            <span className="dash-legend-item"><span className="dash-legend-dot" style={{ background: '#facc15' }} />Target</span>
          </div>
        </div>
        <svg ref={comboRef} viewBox={`0 0 ${W} ${H}`} className="tri-combo-svg" preserveAspectRatio="none">
          {[0.25, 0.5, 0.75].map(f => (
            <line key={f} x1="0" y1={H * f} x2={W} y2={H * f} stroke="rgba(255,255,255,0.04)" />
          ))}
          {COMBO_BARS.map((b, i) => (
            <rect key={i} className="tri-combo-bar" x={i * bw + bw * 0.15} width={bw * 0.7} y={H - (b.bar / 50) * H} height={(b.bar / 50) * H} fill="#22d3ee" opacity="0.6" rx="2" />
          ))}
          <polyline className="tri-combo-line" points={COMBO_BARS.map((b, i) => `${(i / (COMBO_BARS.length - 1)) * W},${H - (b.line / 55) * H}`).join(' ')}
            fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(250,204,21,0.4))' }} />
        </svg>
      </div>
      {/* Scatter plot */}
      <div className="dash-chart-card">
        <div className="dash-chart-head"><span>Scatter — Cost vs ROI</span></div>
        <svg ref={scatterRef} viewBox="0 0 100 100" className="tri-scatter-svg" preserveAspectRatio="xMidYMid meet">
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.04)" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.04)" />
          {SCATTER_DATA.map((p, i) => (
            <circle key={i} className="tri-scatter-dot" cx={`${p.x}%`} cy={`${p.y}%`} r={p.r}
              fill={SCATTER_COLORS[i % SCATTER_COLORS.length]} opacity="0.6" />
          ))}
        </svg>
      </div>
      {/* Histogram */}
      <div className="dash-chart-card">
        <div className="dash-chart-head"><span>Distribution</span></div>
        <svg ref={histoRef} viewBox={`0 0 280 80`} className="tri-histo-svg" preserveAspectRatio="none">
          {HISTO_DATA.map((v, i) => (
            <rect key={i} className="tri-histo-bar" x={i * hw + 1} width={hw - 2} y={80 - (v / 55) * 80} height={(v / 55) * 80}
              fill="#a78bfa" opacity="0.65" rx="1" />
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ── Panel 3: Horizontal Bars + Donut + Area Lines + Gauges ── */
function ChartPanel3() {
  const barsRef = useRef<SVGGElement>(null);
  const gaugesRef = useRef<SVGGElement>(null);
  const rafRef = useRef<number | null>(null);

  return (
    <div className="analytics-dash">
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-live-dot" style={{ background: '#a78bfa', boxShadow: '0 0 8px rgba(167,139,250,0.5)' }} />
          <span className="dash-header-title">Campaign Analytics</span>
        </div>
        <div className="dash-header-pills">
          <span className="dash-pill">Week</span>
          <span className="dash-pill dash-pill--active">Month</span>
        </div>
      </div>
      {/* KPI row */}
      <div className="dash-kpi-row">
        {DASH_KPIS.map((kpi, i) => (
          <div key={i} className="dash-kpi" style={{ '--kpi-color': kpi.color } as React.CSSProperties}>
            <span className="dash-kpi-label">{kpi.label}</span>
            <span className="dash-kpi-value">
              <AnimatedCounter value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} duration={1800 + i * 200} />
            </span>
            <span className="dash-kpi-delta" style={{ color: '#4ade80' }}>+{(3 + i * 2.1).toFixed(1)}%</span>
          </div>
        ))}
      </div>
      {/* Line + Donut row */}
      <div className="dash-charts-row">
        <div className="dash-chart-card dash-chart-card--wide">
          <div className="dash-chart-head">
            <span>Trends</span>
            <div className="dash-chart-legend">
              {DASH_LINE_SETS.map((s, i) => (
                <span key={i} className="dash-legend-item"><span className="dash-legend-dot" style={{ background: s.color }} />{s.label}</span>
              ))}
            </div>
          </div>
          <MiniLineChart datasets={DASH_LINE_SETS} width={360} height={110} />
        </div>
        <div className="dash-chart-card">
          <div className="dash-chart-head"><span>Sources</span></div>
          <DonutChart segments={[
            { value: 42, color: '#4ade80' },
            { value: 28, color: '#22d3ee' },
            { value: 18, color: '#facc15' },
            { value: 12, color: '#a78bfa' },
          ]} />
          <div className="dash-donut-labels">
            <span><span className="dash-legend-dot" style={{ background: '#4ade80' }} />Organic</span>
            <span><span className="dash-legend-dot" style={{ background: '#22d3ee' }} />Paid</span>
            <span><span className="dash-legend-dot" style={{ background: '#facc15' }} />Social</span>
            <span><span className="dash-legend-dot" style={{ background: '#a78bfa' }} />Other</span>
          </div>
        </div>
      </div>
      {/* Horizontal bars */}
      <BarSection />
    </div>
  );
}

function BarSection() {
  const barsRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = barsRef.current;
    if (!container) return;
    const fills = container.querySelectorAll<HTMLElement>('.dash-bar-fill');
    const vals = container.querySelectorAll('.dash-bar-val');
    let t0 = performance.now();
    const animate = (now) => {
      const elapsed = (now - t0) / 1000;
      DASH_BAR_DATA.forEach((bar, i) => {
        const wave = Math.sin(elapsed * 0.5 + i * 1.2) * 5 + Math.sin(elapsed * 0.8 + i * 2.3) * 3;
        const live = Math.max(4, Math.min(44, bar.value + wave));
        if (fills[i]) fills[i].style.width = `${(live / 45) * 100}%`;
        if (vals[i]) vals[i].textContent = `${Math.round(live)}%`;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div className="dash-bar-section" ref={barsRef}>
      <div className="dash-chart-head"><span>Channel Performance</span></div>
      <div className="dash-bars">
        {DASH_BAR_DATA.map((bar, i) => (
          <div key={i} className="dash-bar-item">
            <span className="dash-bar-label">{bar.label}</span>
            <div className="dash-bar-track">
              <div className="dash-bar-fill" style={{ width: `${(bar.value / 45) * 100}%`, '--bar-color': BAR_COLORS[i] } as React.CSSProperties} />
            </div>
            <span className="dash-bar-val">{bar.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsTriptych() {
  return (
    <div className="analytics-triptych">
      <div className="triptych-col triptych-col--1">
        <ChartPanel1 />
      </div>
      <div className="triptych-col triptych-col--2">
        <ChartPanel2 />
      </div>
      <div className="triptych-col triptych-col--3">
        <ChartPanel3 />
      </div>
    </div>
  );
}

/* ── Shared WebGL constants ── */
const MAX_DPR = 1.5;

function checkShader(gl: WebGLRenderingContext, shader: WebGLShader, label: string) {
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(`Shader compile error (${label}):`, gl.getShaderInfoLog(shader));
    return false;
  }
  return true;
}

function checkProgram(gl: WebGLRenderingContext, program: WebGLProgram) {
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Program link error:', gl.getProgramInfoLog(program));
    return false;
  }
  return true;
}

/* ── Bioluminescent Ocean Depths (WebGL) ── */
const OCEAN_VERT = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;

const OCEAN_FRAG = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

// Simplex noise functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p) {
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
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t = u_time * 0.15;
  
  // Create flowing ocean currents
  vec3 p = vec3(uv * 3.0, t);
  
  // Multiple layers of noise for organic movement
  float n1 = fbm(p + vec3(t * 0.5, t * 0.3, 0.0));
  float n2 = fbm(p * 1.5 + vec3(-t * 0.4, t * 0.2, 1.0) + n1 * 0.5);
  float n3 = fbm(p * 2.0 + vec3(t * 0.2, -t * 0.3, 2.0) + n2 * 0.3);
  
  // Create flowing light patterns like bioluminescent plankton
  float flow = sin(uv.x * 8.0 + n1 * 4.0 + t) * cos(uv.y * 6.0 + n2 * 3.0 - t * 0.7);
  flow += sin(uv.x * 12.0 - t * 0.8) * sin(uv.y * 10.0 + t * 0.5) * 0.5;
  flow = flow * 0.5 + 0.5;
  
  // Color palette - bioluminescent cyan, purple, pink
  vec3 cyan = vec3(0.13, 0.83, 0.93);    // #22d3ee
  vec3 purple = vec3(0.75, 0.52, 0.99);   // #c084fc
  vec3 pink = vec3(1.0, 0.42, 0.62);      // #ff6b9d
  vec3 deepBlue = vec3(0.02, 0.05, 0.18); // #02052e
  
  // Mix colors based on noise patterns
  vec3 color = deepBlue;
  color = mix(color, purple, smoothstep(-0.3, 0.5, n1) * 0.4);
  color = mix(color, cyan, smoothstep(0.0, 0.7, n2) * 0.5);
  color = mix(color, pink, smoothstep(0.2, 0.8, n3) * flow * 0.6);
  
  // Add glowing veins like underwater light trails
  float veins = pow(abs(n3), 3.0) * 2.0;
  color += cyan * veins * 0.3;
  color += pink * pow(abs(n2), 4.0) * 0.2;
  
  // Soft vignette
  float vignette = 1.0 - length((uv - 0.5) * 1.2);
  vignette = smoothstep(0.0, 0.7, vignette);
  
  // Add depth layers
  float depth = sin(uv.y * 3.14159) * 0.3 + 0.7;
  color *= depth;
  
  // Final glow
  float glow = exp(-length(uv - 0.5) * 1.5) * 0.15;
  color += cyan * glow;
  
  // Subtle pulsing brightness
  float pulse = sin(t * 2.0) * 0.05 + 0.95;
  color *= pulse;
  
  float alpha = 0.85 * vignette;
  
  gl_FragColor = vec4(color, alpha);
}`;

function BioluminescentDepths() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, OCEAN_VERT); gl.compileShader(vs);
    if (!checkShader(gl, vs, 'ocean-vert')) return;
    const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, OCEAN_FRAG); gl.compileShader(fs);
    if (!checkShader(gl, fs, 'ocean-frag')) return;
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!checkProgram(gl, prog)) return;
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
      const dpr = Math.min(window.devicePixelRatio, MAX_DPR) * 0.6;
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    let visible = false;
    const obs = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !rafRef.current) rafRef.current = requestAnimationFrame(render);
    }, { threshold: 0.05 });
    obs.observe(canvas);

    let t0 = performance.now();
    const render = (now) => {
      if (!visible) { rafRef.current = null; return; }
      resize();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => {
      obs.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="blob-canvas" />;
}




/* ── BUILD Section — Wide Left + Terminal Right ── */
function BuildSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);

  usePinnedSection(sectionRef, leftRef, rightRef, headlineRef, {}, 'slide-up');
  useMouseParallax(sectionRef, [
    { ref: leftRef, depth: 6 },
    { ref: rightRef, depth: 6 },
  ]);

  return (
    <section ref={sectionRef} id="build" className="section-pinned" style={{ zIndex: 20 }}>
      <div className="editorial-bg editorial-bg-component">
        <BioluminescentDepths />
        <div className="editorial-bg-overlay editorial-bg-overlay--light" />
      </div>

      <div className="build-layout" style={{ display: 'flex', alignItems: 'stretch', width: '100%', height: '100%', position: 'relative', zIndex: 2 }}>
        <div ref={leftRef} className="editorial-left glass-panel">
          <span className="micro-label">BUILD</span>
          <div ref={headlineRef} className="editorial-headline">
            <h2>
              <span className="word">FULL-STACK</span>
              <br />
              <span className="word text-outline">DELIVERY</span>
            </h2>
          </div>
          <p className="editorial-desc">
            From data pipelines to production frontends, we design <em className="desc-accent">systems that scale.</em>
          </p>
          <div className="editorial-items-grid">
            <div className="editorial-list-item"><div className="editorial-icon-box"><Code2 size={16} /></div>Engineering</div>
            <div className="editorial-list-item"><div className="editorial-icon-box"><Palette size={16} /></div>Design Systems</div>
            <div className="editorial-list-item"><div className="editorial-icon-box"><Zap size={16} /></div>Performance</div>
            <div className="editorial-list-item"><div className="editorial-icon-box"><TestTube size={16} /></div>Testing</div>
            <div className="editorial-list-item"><div className="editorial-icon-box"><Accessibility size={16} /></div>Accessibility</div>
          </div>
          <Link to="/about" className="btn btn-primary editorial-btn" style={{ marginTop: '24px' }}>
            Meet the team <ArrowRight size={18} />
          </Link>
        </div>

        <div ref={rightRef} className="editorial-right glass-panel build-terminal-wrap">
          <TypingTerminal />
        </div>
      </div>
    </section>
  );
}

/* ── MEASURE Section — Featured Triptych + Overlay Card ── */
function MeasureSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const triptychRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useMouseParallax(sectionRef, [
    { ref: triptychRef, depth: 4 },
    { ref: cardRef, depth: 6 },
  ]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const triptych = triptychRef.current;
    const card = cardRef.current;
    if (!section || !triptych || !card) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    gsap.set([triptych, card], { willChange: 'transform, opacity', force3D: true });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=100%',
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
        },
      });

      // Triptych fades + scales in first
      tl.fromTo(triptych, { scale: 1.06, opacity: 0 }, { scale: 1, opacity: 1, ease: EASE_SMOOTH }, 0);
      // Depth parallax: triptych drifts behind overlay card
      const depthScale = (window.innerWidth <= 768) ? 0.4 : 1.0;
      tl.fromTo(triptych, { yPercent: 2 * depthScale }, { yPercent: -2 * depthScale, ease: 'none' }, 0);
      // Overlay card slides up
      tl.fromTo(card, { y: '8vh', opacity: 0 }, { y: 0, opacity: 1, ease: EASE_SMOOTH }, 0.12);
      // EXIT — card fades first, then triptych
      tl.fromTo(card, { y: 0, opacity: 1 }, { y: '-4vh', opacity: 0, ease: EASE_EXIT }, 0.68);
      tl.fromTo(triptych, { scale: 1, opacity: 1 }, { scale: 1.04, opacity: 0, ease: EASE_EXIT }, 0.75);
    }, section);

    return () => {
      ctx.revert();
      gsap.set([triptych, card], { willChange: 'auto' });
    };
  }, []);

  return (
    <section ref={sectionRef} id="measure" className="section-pinned" style={{ zIndex: 30 }}>
      <div className="measure-layout">
        <div ref={triptychRef} className="measure-triptych-featured">
          <AnalyticsTriptych />
        </div>

        <div ref={cardRef} className="measure-overlay-card glass-panel">
          <span className="micro-label">MEASURE</span>
          <div className="editorial-headline">
            <h2>
              <span className="word">DATA</span>
              <br />
              <span className="word text-outline">THAT</span>{' '}
              <span className="word text-outline">MOVES</span>
            </h2>
          </div>
          <p className="editorial-desc">
            Clean reporting, attribution models, and dashboards your team will <em className="desc-accent">actually use.</em>
          </p>
          <Link to="/contact" className="btn btn-primary editorial-btn">
            Request a data audit <ArrowRight size={18} />
          </Link>
          <div className="capability-pills">
            <span className="capability-pill">Analytics</span>
            <span className="capability-pill">Attribution</span>
            <span className="capability-pill">Governance</span>
            <span className="capability-pill">Alerts</span>
            <span className="capability-pill">Privacy</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── AUTOMATE Section — Centered + Floating Glass Cards ── */
function AutomateSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);

  useMouseParallax(sectionRef, [
    { ref: centerRef, depth: 6 },
    { ref: cardsRef, depth: 16, selector: '.floating-card' },
  ]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const center = centerRef.current;
    const cardsWrap = cardsRef.current;
    const beam = beamRef.current;
    if (!section || !center) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    gsap.set(center, { willChange: 'transform, opacity', force3D: true });

    const ctx = gsap.context(() => {
      const floaters = cardsWrap?.querySelectorAll('.floating-card') || [];

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=90%',
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
        },
      });

      // Center content appears first
      tl.fromTo(center, { y: '6vh', opacity: 0 }, { y: 0, opacity: 1, ease: EASE_SMOOTH }, 0);
      // Floating cards stagger in
      if (floaters.length) {
        tl.fromTo(floaters, { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, ease: EASE_SMOOTH }, 0.06);
      }

      // Depth parallax: each floating card drifts at a unique rate
      if (floaters.length && window.innerWidth > 768) {
        const cardDepths = [3.6, 3.0, -2.4, -3.0, 1.8]; // tl, tr, bl, br, rc
        floaters.forEach((card, i) => {
          const d = cardDepths[i] ?? 2;
          tl.fromTo(card, { yPercent: d }, { yPercent: -d, ease: 'none' }, 0);
        });
      }

      // CircuitBoard fades in
      if (beam) {
        tl.fromTo(beam, { opacity: 0 }, { opacity: 0.6, ease: 'none' }, 0.15);
      }
      // EXIT — all fade together
      if (floaters.length) {
        tl.fromTo(floaters, { opacity: 1 }, { opacity: 0, stagger: 0.02, ease: EASE_EXIT }, 0.68);
      }
      if (beam) {
        tl.fromTo(beam, { opacity: 0.6 }, { opacity: 0, ease: EASE_EXIT }, 0.7);
      }
      tl.fromTo(center, { y: 0, opacity: 1 }, { y: '-15vh', opacity: 0, ease: EASE_EXIT }, 0.72);
    }, section);

    return () => {
      ctx.revert();
      gsap.set(center, { willChange: 'auto' });
    };
  }, []);

  return (
    <section ref={sectionRef} id="automate" className="section-pinned" style={{ zIndex: 40 }}>
      <div className="automate-layout">
        <div ref={beamRef} className="measure-triptych-featured" style={{ mixBlendMode: 'screen', opacity: 0, zIndex: 0 }}>
          <CircuitBoard />
        </div>

        <div ref={centerRef} className="automate-center">
          <span className="micro-label">AUTOMATE</span>
          <div className="editorial-headline" style={{ textAlign: 'center' }}>
            <h2>
              <span className="word">INTELLIGENT</span>
              <br />
              <span className="word text-outline">SYSTEMS</span>
            </h2>
          </div>
          <p className="editorial-desc" style={{ textAlign: 'center', maxWidth: '520px' }}>
            Agents, prompts, and pipelines that connect to your data — <em className="desc-accent">securely and measurably.</em>
          </p>
          <Link to="/contact" className="btn btn-primary editorial-btn">
            Explore AI solutions <ArrowRight size={18} />
          </Link>
        </div>

        <div ref={cardsRef} className="automate-layout">
          <div className="floating-card glass-panel floating-card--tl">
            <div className="floating-card-icon"><Brain size={20} /></div>
            <div className="floating-card-text">
              <div className="floating-card-label">AI Strategy</div>
              <div className="floating-card-stat">Custom roadmaps</div>
            </div>
          </div>
          <div className="floating-card glass-panel floating-card--tr">
            <div className="floating-card-icon"><Bot size={20} /></div>
            <div className="floating-card-text">
              <div className="floating-card-label">Agents</div>
              <div className="floating-card-stat">Autonomous workflows</div>
            </div>
          </div>
          <div className="floating-card glass-panel floating-card--bl">
            <div className="floating-card-icon"><Database size={20} /></div>
            <div className="floating-card-text">
              <div className="floating-card-label">RAG</div>
              <div className="floating-card-stat">Context-aware AI</div>
            </div>
          </div>
          <div className="floating-card glass-panel floating-card--br">
            <div className="floating-card-icon"><Target size={20} /></div>
            <div className="floating-card-text">
              <div className="floating-card-label">Roadmapping</div>
              <div className="floating-card-stat">Data-driven plans</div>
            </div>
          </div>
          <div className="floating-card glass-panel floating-card--rc">
            <div className="floating-card-icon"><Users size={20} /></div>
            <div className="floating-card-text">
              <div className="floating-card-label">Advisory</div>
              <div className="floating-card-stat">Expert guidance</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Contact CTA — Two-Panel Glass ── */
function ContactCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useMouseParallax(sectionRef, [
    { ref: leftRef, depth: 6 },
    { ref: rightRef, depth: 6 },
  ]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!section || !left || !right) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    gsap.set([left, right], { willChange: 'transform, opacity', force3D: true });

    const ctx = gsap.context(() => {
      // Depth parallax: DeepSeaCreatures bg moves at ~0.6x content scroll speed
      const bgEl = section.querySelector('.contact-cta-bg');
      if (bgEl) {
        const depthScale = (window.innerWidth <= 768) ? 0.4 : 1.0;
        gsap.fromTo(bgEl, { yPercent: -8 * depthScale }, {
          yPercent: 8 * depthScale, ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      }

      gsap.fromTo(left, { y: '6vh', opacity: 0 }, {
        y: 0, opacity: 1, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 50%', scrub: 0.4 },
      });
      gsap.fromTo(right, { y: '6vh', opacity: 0 }, {
        y: 0, opacity: 1, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 75%', end: 'top 45%', scrub: 0.4 },
      });
    }, section);

    return () => {
      ctx.revert();
      gsap.set([left, right], { willChange: 'auto' });
    };
  }, []);

  return (
    <section ref={sectionRef} className="contact-cta-section" style={{ zIndex: 70 }}>
      <div className="contact-cta-bg">
        <Suspense fallback={null}><DeepSeaCreatures /></Suspense>
      </div>

      <div className="contact-cta-grid">
        <div ref={leftRef} className="contact-cta-left glass-panel">
          <span className="micro-label">GET STARTED</span>
          <div className="editorial-headline">
            <h2>
              <span className="word">LET'S</span>
              <br />
              <span className="word text-outline">TALK</span>
            </h2>
          </div>
          <p className="editorial-desc">
            Tell us what you're building. We'll reply within <em className="desc-accent">2 business days.</em>
          </p>
          <Link to="/contact" className="btn btn-primary editorial-btn">
            Book a consultation <ArrowRight size={18} />
          </Link>
        </div>

        <div ref={rightRef} className="contact-cta-right glass-panel">
          <h3 className="editorial-right-title">Quick Links</h3>
          <div className="editorial-list-item"><span className="editorial-dot" /><Link to="/pricing" className="editorial-link">Our Work</Link></div>
          <div className="editorial-list-item"><span className="editorial-dot" /><Link to="/about" className="editorial-link">About</Link></div>
          <div className="editorial-list-item"><span className="editorial-dot" /><Link to="/contact" className="editorial-link">Contact</Link></div>
          <div className="editorial-list-item"><span className="editorial-dot" /><Link to="/pricing" className="editorial-link">Pricing</Link></div>
        </div>
      </div>
    </section>
  );
}

/* ── Main Home Component ── */
export default function Home() {
  useEffect(() => {
    document.title = 'Three Seas Digital — Web Design & Development';
  }, []);

  // Global snap between pinned sections
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const timeout = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter(st => st.vars.pin)
        .sort((a, b) => a.start - b.start);

      const maxScroll = ScrollTrigger.maxScroll(window);
      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map(st => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      ScrollTrigger.create({
        snap: {
          snapTo: (value) => {
            const inPinned = pinnedRanges.some(
              r => value >= r.start - 0.02 && value <= r.end + 0.02
            );
            if (!inPinned) return value;
            return pinnedRanges.reduce(
              (closest, r) =>
                Math.abs(r.center - value) < Math.abs(closest - value) ? r.center : closest,
              pinnedRanges[0]?.center ?? 0
            );
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        },
      });
    }, 100);

    return () => {
      clearTimeout(timeout);
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div className="home-page">
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Sections */}
      <main className="home-main">
        <VideoHero />
        <NavigateSection />
        <BuildSection />
        <MeasureSection />
        <AutomateSection />
        <ContactCTA />
      </main>
    </div>
  );
}
