import { useEffect, useRef, useLayoutEffect, useState, useCallback, lazy, Suspense, Fragment } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  ChevronRight,
  BarChart3,
  Code2,
  Brain,
  Compass,
  TrendingUp,
  Shield,
  Bell,
  Lock,
  Zap,
  Accessibility,
  Palette,
  TestTube,
  MessageSquare,
  Database,
  Bot,
  Eye,
  Map,
  Users,
  Target,
  MessageCircle,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const EnergyField = lazy(() => import('../components/EnergyField'));

/* ── Reusable pinned-section animation ── */
function usePinnedSection(sectionRef, leftRef, rightRef, headlineRef, opts = {}) {
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!section || !left || !right) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        },
      });

      // Background image if present
      if (opts.bgRef?.current) {
        tl.fromTo(opts.bgRef.current, { scale: 1.12, opacity: 0 }, { scale: 1.0, opacity: 1, ease: 'none' }, 0)
          .fromTo(opts.bgRef.current, { scale: 1.0, opacity: 1 }, { scale: 1.08, opacity: 0, ease: 'power2.in' }, 0.7);
      }

      // Panels enter
      tl.fromTo(left, { x: '-60vw', opacity: 0 }, { x: 0, opacity: 1, ease: 'power2.out' }, 0);
      tl.fromTo(right, { x: '60vw', opacity: 0 }, { x: 0, opacity: 1, ease: 'power2.out' }, 0);

      // Headline words
      if (headlineRef?.current) {
        const words = headlineRef.current.querySelectorAll('.word');
        tl.fromTo(words, { y: 28, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.02, ease: 'power2.out' }, 0.05);
      }

      // Panels exit
      tl.fromTo(left, { x: 0, opacity: 1 }, { x: '-55vw', opacity: 0, ease: 'power2.in' }, 0.7);
      tl.fromTo(right, { x: 0, opacity: 1 }, { x: '55vw', opacity: 0, ease: 'power2.in' }, 0.7);
    }, section);

    return () => ctx.revert();
  }, []);
}

/* ── Video Hero (static, not pinned) ── */
function VideoHero() {
  const videoARef = useRef(null);
  const videoBRef = useRef(null);

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
        active.style.opacity = activeOpacity;
        standby.style.opacity = standbyOpacity;

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
    <section className="video-hero">
      <div className="hero-video-wrap">
        <video ref={videoARef} {...videoProps} autoPlay />
        <video ref={videoBRef} {...videoProps} style={{ opacity: 0 }} />
        <div className="hero-video-overlay" />
      </div>
      <div className="hero-hook">
        <span className="hero-hook-label">THREE SEAS DIGITAL</span>
        <h1 className="hero-hook-headline">
          We build the digital<br />
          your competitors<br />
          <span className="hero-hook-accent">wish they had.</span>
        </h1>
        <p className="hero-hook-sub">
          Strategy. Engineering. Design. — <em className="desc-accent">One team, zero excuses.</em>
        </p>
      </div>
    </section>
  );
}

/* ── Navigate Section (first pinned GSAP) ── */
function NavigateSection() {
  const sectionRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const headlineRef = useRef(null);
  const microcopyRef = useRef(null);
  const bgRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    const headline = headlineRef.current;
    const microcopy = microcopyRef.current;
    const bg = bgRef.current;
    if (!section || !left || !right || !headline || !microcopy) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.set([left, right], { opacity: 0 });
      gsap.set(left, { x: '-60vw' });
      gsap.set(right, { x: '60vw' });
      gsap.set(microcopy, { opacity: 0, y: 16 });

      const words = headline.querySelectorAll('.word');
      gsap.set(words, { opacity: 0, y: 24 });

      // Scroll-driven entrance + exit
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        },
      });

      // Background image parallax
      if (bg) {
        scrollTl.fromTo(bg, { scale: 1.12, opacity: 0 }, { scale: 1.0, opacity: 1, ease: 'none' }, 0);
        scrollTl.fromTo(bg, { scale: 1.0, opacity: 1 }, { scale: 1.08, opacity: 0, ease: 'power2.in' }, 0.7);
      }

      // ENTRANCE (0–30%)
      scrollTl.fromTo(left, { x: '-60vw', opacity: 0 }, { x: 0, opacity: 1, ease: 'power2.out' }, 0);
      scrollTl.fromTo(right, { x: '60vw', opacity: 0 }, { x: 0, opacity: 1, ease: 'power2.out' }, 0);
      scrollTl.fromTo(words, { y: 28, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.02, ease: 'power2.out' }, 0.05);
      scrollTl.fromTo(microcopy, { opacity: 0, y: 16 }, { opacity: 1, y: 0, ease: 'power2.out' }, 0.1);

      // EXIT (70–100%)
      scrollTl.fromTo(left, { x: 0, opacity: 1 }, { x: '-55vw', opacity: 0, ease: 'power2.in' }, 0.7);
      scrollTl.fromTo(right, { x: 0, opacity: 1 }, { x: '55vw', opacity: 0, ease: 'power2.in' }, 0.7);
      scrollTl.fromTo(microcopy, { opacity: 1 }, { opacity: 0, ease: 'power2.in' }, 0.65);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section-pinned" style={{ zIndex: 10 }}>
      <div ref={bgRef} className="editorial-bg" style={{ backgroundImage: 'url(/images/lighthouse2.jpeg)', backgroundPosition: 'center top' }}>
        <LighthouseBeam />
        <div className="editorial-bg-overlay" />
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
          <Link to="/portfolio" className="btn btn-outline editorial-btn">
            See our work <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      <div ref={rightRef} className="editorial-right glass-panel">
        <h3 className="editorial-right-title">Capabilities</h3>
        <ul className="editorial-list">
          {['Analytics & Attribution', 'Web Development', 'AI Integration', 'Consulting'].map(item => (
            <li key={item} className="editorial-list-item">
              <span className="editorial-dot" />
              {item}
            </li>
          ))}
        </ul>
        <Link to="/portfolio" className="editorial-link">
          Explore services <ArrowRight size={16} />
        </Link>
      </div>

      <div ref={microcopyRef} className="editorial-microcopy">
        <p>Serving businesses across every digital frontier.</p>
      </div>
    </section>
  );
}

/* ── Lighthouse Beam WebGL ── */
const BEAM_VERT = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const BEAM_FRAG = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_origin;
varying vec2 v_uv;

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;

  // Origin in aspect-corrected space
  vec2 origin = vec2(u_origin.x * aspect, u_origin.y);

  vec2 dir = uv - origin;
  float dist = length(dir);
  float angle = atan(dir.x, dir.y);

  // Rotating beam — two opposing cones
  float beamAngle = u_time * 0.1;
  float cone1 = cos(angle - beamAngle);
  float cone2 = cos(angle - beamAngle + 3.14159);

  // Narrow the beam cone (lower power = wider beam)
  float beam1 = pow(max(0.0, cone1), 2.0);
  float beam2 = pow(max(0.0, cone2), 2.0);
  float beam = max(beam1, beam2);

  // Distance falloff — light fades with distance
  float falloff = 1.0 / (1.0 + dist * 2.2);

  // Atmospheric scattering — soft glow around origin
  float glow = exp(-dist * 3.0) * 0.6;

  // Fog/haze interaction — beam picks up more near the bottom
  float haze = smoothstep(0.9, 0.0, uv.y) * 0.3;

  // Subtle flicker
  float flicker = 0.92 + 0.08 * sin(u_time * 3.7 + sin(u_time * 7.3) * 0.5);

  // Combine
  float intensity = (beam * falloff + glow + beam * haze) * flicker;

  // Warm white light with slight gold tint
  vec3 lightColor = vec3(1.0, 0.95, 0.8);
  vec3 color = lightColor * intensity * 0.35;

  // God rays — streaks radiating outward
  float rays = 0.0;
  for (float i = 0.0; i < 6.0; i++) {
    float rayAngle = beamAngle + i * 1.0472; // 60deg spacing
    float rayAlign = pow(max(0.0, cos(angle - rayAngle)), 5.0);
    rays += rayAlign * falloff * 0.25;
  }
  color += lightColor * rays;

  float alpha = clamp(intensity * 0.6 + rays * 0.4, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}`;

function LighthouseBeam() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, BEAM_VERT); gl.compileShader(vs);
    if (!checkShader(gl, vs, 'beam-vert')) return;
    const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, BEAM_FRAG); gl.compileShader(fs);
    if (!checkShader(gl, fs, 'beam-frag')) return;
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

    let t0 = performance.now();
    const render = (now) => {
      resize();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uOrigin, 0.5, 0.75);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return <canvas ref={canvasRef} className="lighthouse-beam-canvas" />;
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

function parseAnsi(raw) {
  const parts = [];
  let rest = raw;
  let key = 0;
  const colorMap = { '31': '#f87171', '32': '#4ade80', '33': '#facc15', '34': '#60a5fa', '35': '#c084fc', '36': '#22d3ee', '37': '#e2e8f0', '90': '#64748b', '0': null };
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
  const termRef = useRef(null);

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
  { label: 'Revenue', prefix: '$', value: 284600, suffix: '', color: '#4ade80' },
  { label: 'Conversions', prefix: '', value: 1247, suffix: '', color: '#22d3ee' },
  { label: 'ROAS', prefix: '', value: 4.8, suffix: 'x', color: '#facc15' },
  { label: 'Sessions', prefix: '', value: 38420, suffix: '', color: '#a78bfa' },
];

const DASH_BAR_DATA = [
  { label: 'Organic', value: 42 },
  { label: 'Paid', value: 28 },
  { label: 'Social', value: 18 },
  { label: 'Email', value: 31 },
  { label: 'Referral', value: 14 },
  { label: 'Direct', value: 22 },
];

function generateSparkline(points, amplitude, offset) {
  const pts = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const y = offset + Math.sin(t * Math.PI * 2.5 + offset) * amplitude + Math.sin(t * Math.PI * 5 + offset * 2) * (amplitude * 0.3);
    pts.push(y);
  }
  return pts;
}

const DASH_LINE_SETS = [
  { color: '#4ade80', data: generateSparkline(24, 18, 0), label: 'Revenue' },
  { color: '#22d3ee', data: generateSparkline(24, 14, 2), label: 'Traffic' },
  { color: '#facc15', data: generateSparkline(24, 10, 4), label: 'Conv Rate' },
];

function AnimatedCounter({ value, prefix, suffix, duration = 2000 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    startRef.current = performance.now();
    const isFloat = value % 1 !== 0;
    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * value;
      setDisplay(isFloat ? current.toFixed(1) : Math.floor(current));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  const formatted = typeof display === 'string' ? display :
    display >= 1000 ? display.toLocaleString() : display;
  return <>{prefix}{formatted}{suffix}</>;
}

function MiniLineChart({ datasets, width = 320, height = 100 }) {
  const svgRef = useRef(null);
  const rafRef = useRef(null);

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

function DonutChart({ segments, size = 90 }) {
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

const BAR_COLORS = ['#4ade80', '#22d3ee', '#facc15', '#a78bfa', '#f472b6', '#fb923c'];

function AnalyticsDashboard() {
  const barsRef = useRef(null);
  const valsRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const container = barsRef.current;
    if (!container) return;
    const fills = container.querySelectorAll('.dash-bar-fill');
    const vals = container.querySelectorAll('.dash-bar-val');
    let t0 = performance.now();

    const animate = (now) => {
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
          <div key={i} className="dash-kpi" style={{ '--kpi-color': kpi.color }}>
            <span className="dash-kpi-label">{kpi.label}</span>
            <span className="dash-kpi-value">
              <AnimatedCounter value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} duration={1800 + i * 200} />
            </span>
            <span className="dash-kpi-delta" style={{ color: '#4ade80' }}>+{(3 + i * 2.1).toFixed(1)}%</span>
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
                }} />
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
function genCandles(n) {
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
function genScatter(n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push({ x: 5 + Math.random() * 90, y: 10 + Math.random() * 75, r: 2 + Math.random() * 4 });
  }
  return pts;
}
function genHisto(n) {
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
  const svgRef = useRef(null);
  const tickerRef = useRef(null);
  const pieRef = useRef(null);
  const rafRef = useRef(null);

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
          candles[i].setAttribute('y', yTop);
          candles[i].setAttribute('height', Math.max(1, yBot - yTop));
          candles[i].setAttribute('fill', bull ? '#4ade80' : '#f472b6');
          candles[i].setAttribute('opacity', '0.8');
        }
        if (wicks[i]) {
          wicks[i].setAttribute('y1', yH);
          wicks[i].setAttribute('y2', yL);
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
          tDeltas[i].style.color = d >= 0 ? '#4ade80' : '#f472b6';
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
  const comboRef = useRef(null);
  const histoRef = useRef(null);
  const scatterRef = useRef(null);
  const rafRef = useRef(null);

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
        if (bars[i]) bars[i].setAttribute('height', (h / 50) * H);
        if (bars[i]) bars[i].setAttribute('y', H - (h / 50) * H);
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
          histoBars[i].setAttribute('height', (h / 55) * 80);
          histoBars[i].setAttribute('y', 80 - (h / 55) * 80);
        }
      });
      // Scatter dots drift
      SCATTER_DATA.forEach((p, i) => {
        const dx = Math.sin(elapsed * 0.3 + i * 0.9) * 2;
        const dy = Math.cos(elapsed * 0.4 + i * 1.1) * 2;
        if (dots[i]) {
          dots[i].setAttribute('cx', `${p.x + dx}%`);
          dots[i].setAttribute('cy', `${p.y + dy}%`);
          dots[i].setAttribute('opacity', 0.4 + Math.sin(elapsed * 0.5 + i) * 0.25);
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
  const barsRef = useRef(null);
  const gaugesRef = useRef(null);
  const rafRef = useRef(null);

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
          <div key={i} className="dash-kpi" style={{ '--kpi-color': kpi.color }}>
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
  const barsRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const container = barsRef.current;
    if (!container) return;
    const fills = container.querySelectorAll('.dash-bar-fill');
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
              <div className="dash-bar-fill" style={{ width: `${(bar.value / 45) * 100}%`, '--bar-color': BAR_COLORS[i] }} />
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

function checkShader(gl, shader, label) {
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(`Shader compile error (${label}):`, gl.getShaderInfoLog(shader));
    return false;
  }
  return true;
}

function checkProgram(gl, program) {
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Program link error:', gl.getProgramInfoLog(program));
    return false;
  }
  return true;
}

/* ── Animated 3D Blob (WebGL) ── */
const BLOB_VERT = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;

const BLOB_FRAG = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

// Fast value noise (single octave)
vec4 perm(vec4 x) { x = ((x * 34.0) + 1.0) * x; return x - floor(x * (1.0/289.0)) * 289.0; }
float noise(vec3 p) {
  vec3 a = floor(p);
  vec3 d = p - a;
  d = d * d * (3.0 - 2.0 * d);
  vec4 b = a.xxyy + vec4(0.0,1.0,0.0,1.0);
  vec4 k1 = perm(b.xyxy);
  vec4 k2 = perm(k1.xyxy + b.zzww);
  vec4 c = k2 + a.zzzz;
  vec4 k3 = perm(c);
  vec4 k4 = perm(c + 1.0);
  vec4 o3 = fract(k4 * (1.0/41.0)) * d.z + fract(k3 * (1.0/41.0)) * (1.0 - d.z);
  vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
  return o4.y * d.y + o4.x * (1.0 - d.y);
}

// SDF: sphere + 2 noise layers (was 3)
float blobSDF(vec3 p, float t) {
  float n = noise(p * 2.0 + t * 0.15) * 0.35;
  n += noise(p * 3.5 - t * 0.2) * 0.18;
  return length(p) - 0.9 - n;
}

// Normal via central differences — uses larger epsilon for fewer artifacts + cheaper
vec3 calcNormal(vec3 p, float t) {
  vec2 e = vec2(0.005, 0.0);
  return normalize(vec3(
    blobSDF(p + e.xyy, t) - blobSDF(p - e.xyy, t),
    blobSDF(p + e.yxy, t) - blobSDF(p - e.yxy, t),
    blobSDF(p + e.yyx, t) - blobSDF(p - e.yyx, t)
  ));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
  float t = u_time;

  // Very slow orbit — pulled back for half-size blob
  float camAngle = t * 0.06;
  vec3 ro = vec3(sin(camAngle) * 5.6, sin(t * 0.04) * 0.3, cos(camAngle) * 5.6);
  vec3 fwd = normalize(-ro);
  vec3 right = normalize(cross(fwd, vec3(0,1,0)));
  vec3 up = cross(right, fwd);
  vec3 rd = normalize(fwd + uv.x * right + uv.y * up);

  // March — 48 steps (was 64), larger step multiplier
  float dist = 0.0;
  float hit = 0.0;
  for (int i = 0; i < 48; i++) {
    float d = blobSDF(ro + rd * dist, t);
    if (d < 0.005) { hit = 1.0; break; }
    if (dist > 5.0) break;
    dist += d * 0.8;
  }

  vec3 color = vec3(0.0);
  float alpha = 0.0;

  if (hit > 0.5) {
    vec3 p = ro + rd * dist;
    vec3 n = calcNormal(p, t);

    // Lighting
    vec3 L = normalize(vec3(0.5, 0.8, 0.6));
    float diff = max(dot(n, L), 0.0);
    float spec = pow(max(dot(reflect(-L, n), -rd), 0.0), 24.0);
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);

    // Gold/amber material
    vec3 gold = vec3(0.92, 0.72, 0.20);
    vec3 amber = vec3(0.85, 0.45, 0.12);
    vec3 baseColor = mix(gold, amber, noise(p * 1.5 + t * 0.08));

    color = baseColor * (0.18 + diff * 0.62);
    color += vec3(1.0, 0.92, 0.7) * spec * 0.55;
    color += gold * rim * 0.35;
    color += amber * max(dot(n, -rd), 0.0) * 0.15;

    alpha = 0.95;
  }

  // Ambient glow
  float glow = exp(-dot(uv, uv) * 5.0) * 0.15;
  color += vec3(0.9, 0.7, 0.2) * glow;
  alpha = max(alpha, glow * 0.8);

  gl_FragColor = vec4(color, alpha);
}`;

function AnimatedBlob() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, BLOB_VERT); gl.compileShader(vs);
    if (!checkShader(gl, vs, 'blob-vert')) return;
    const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, BLOB_FRAG); gl.compileShader(fs);
    if (!checkShader(gl, fs, 'blob-frag')) return;
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

    // Render at reduced resolution for performance (0.5x pixel density)
    function resize() {
      const dpr = Math.min(window.devicePixelRatio, MAX_DPR) * 0.5;
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    // Only render when visible
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

/* ── Particle Network (WebGL) ── */
const PARTICLE_VERT = `
attribute vec2 a_position;
uniform float u_pointSize;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  gl_PointSize = u_pointSize;
}`;

const PARTICLE_FRAG = `
precision mediump float;
uniform vec4 u_color;
void main() {
  float d = distance(gl_PointCoord, vec2(0.5));
  if (d > 0.5) discard;
  float alpha = smoothstep(0.5, 0.15, d) * u_color.a;
  gl_FragColor = vec4(u_color.rgb, alpha);
}`;

const LINE_VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const LINE_FRAG = `
precision mediump float;
uniform vec4 u_color;
void main() {
  gl_FragColor = u_color;
}`;

function ParticleNetwork() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
    if (!gl) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    function makeProgram(vsSrc, fsSrc) {
      const v = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(v, vsSrc); gl.compileShader(v);
      if (!checkShader(gl, v, 'particle-vert')) return null;
      const f = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(f, fsSrc); gl.compileShader(f);
      if (!checkShader(gl, f, 'particle-frag')) return null;
      const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
      if (!checkProgram(gl, p)) return null;
      return p;
    }

    const pointProg = makeProgram(PARTICLE_VERT, PARTICLE_FRAG);
    const lineProg = makeProgram(LINE_VERT, LINE_FRAG);
    if (!pointProg || !lineProg) return;

    const COUNT = 80;
    const particles = [];
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * 2 - 1, y: Math.random() * 2 - 1,
        vx: (Math.random() - 0.5) * 0.002, vy: (Math.random() - 0.5) * 0.002,
        size: 1.5 + Math.random() * 2.5,
      });
    }

    const posBuf = gl.createBuffer();
    const lineBuf = gl.createBuffer();
    const connectDist = 0.28;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
      const w = canvas.clientWidth * dpr, h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    }

    const render = () => {
      resize();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Update particles
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -1 || p.x > 1) p.vx *= -1;
        if (p.y < -1 || p.y > 1) p.vy *= -1;
      }

      // Draw lines
      const lineVerts = [];
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          if (Math.sqrt(dx * dx + dy * dy) < connectDist) {
            lineVerts.push(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
          }
        }
      }
      if (lineVerts.length) {
        gl.useProgram(lineProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVerts), gl.DYNAMIC_DRAW);
        const aPos = gl.getAttribLocation(lineProg, 'a_position');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
        gl.uniform4f(gl.getUniformLocation(lineProg, 'u_color'), 0.13, 0.83, 0.93, 0.12);
        gl.drawArrays(gl.LINES, 0, lineVerts.length / 2);
      }

      // Draw points
      const posData = new Float32Array(COUNT * 2);
      particles.forEach((p, i) => { posData[i * 2] = p.x; posData[i * 2 + 1] = p.y; });
      gl.useProgram(pointProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW);
      const aPos = gl.getAttribLocation(pointProg, 'a_position');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(gl.getUniformLocation(pointProg, 'u_pointSize'), 3.0 * Math.min(window.devicePixelRatio, MAX_DPR));
      gl.uniform4f(gl.getUniformLocation(pointProg, 'u_color'), 0.13, 0.83, 0.93, 0.7);
      gl.drawArrays(gl.POINTS, 0, COUNT);

      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return <canvas ref={canvasRef} className="particle-network-canvas" />;
}

/* ── Fluid Simulation (WebGL) ── */
const FLUID_VERT = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_uv;
void main() {
  v_uv = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FLUID_FRAG = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_uv;

vec3 palette(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.05, 0.33, 0.53);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;
  vec2 uv0 = uv;
  vec3 finalColor = vec3(0.0);

  for (float i = 0.0; i < 3.0; i++) {
    uv = fract(uv * 1.8) - 0.5;
    float d = length(uv) * exp(-length(uv0));

    vec3 col = palette(length(uv0) + i * 0.4 + u_time * 0.15);

    d = sin(d * 8.0 + u_time * 0.6) / 8.0;
    d = abs(d);
    d = pow(0.012 / d, 1.4);

    finalColor += col * d;
  }

  finalColor *= 0.35;
  gl_FragColor = vec4(finalColor, 1.0);
}`;

function FluidSimulation() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;

    const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, FLUID_VERT); gl.compileShader(vs);
    if (!checkShader(gl, vs, 'fluid-vert')) return;
    const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, FLUID_FRAG); gl.compileShader(fs);
    if (!checkShader(gl, fs, 'fluid-frag')) return;
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!checkProgram(gl, prog)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const texBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,1,1,1,0,0,1,0]), gl.STATIC_DRAW);
    const aTex = gl.getAttribLocation(prog, 'a_texCoord');
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
      const w = canvas.clientWidth * dpr, h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    }

    let t0 = performance.now();
    const render = (now) => {
      resize();
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return <canvas ref={canvasRef} className="fluid-sim-canvas" />;
}

/* ── Audio Visualizer Bars (WebGL) ── */
/* ── 3D Polyhedra geometry ── */
const TETRA_V = [[0,1,0],[0.943,-0.333,0],[-0.471,-0.333,0.816],[-0.471,-0.333,-0.816]];
const TETRA_E = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
const OCTA_V = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const OCTA_E = [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[2,5],[3,4],[3,5]];
const PHI = (1 + Math.sqrt(5)) / 2;
const ICO_V = [[-1,PHI,0],[1,PHI,0],[-1,-PHI,0],[1,-PHI,0],[0,-1,PHI],[0,1,PHI],[0,-1,-PHI],[0,1,-PHI],[PHI,0,-1],[PHI,0,1],[-PHI,0,-1],[-PHI,0,1]].map(v => { const l = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]); return [v[0]/l,v[1]/l,v[2]/l]; });
const ICO_E = [[0,1],[0,5],[0,7],[0,10],[0,11],[1,5],[1,7],[1,8],[1,9],[2,3],[2,4],[2,6],[2,10],[2,11],[3,4],[3,6],[3,8],[3,9],[4,5],[4,9],[4,11],[5,9],[5,11],[6,7],[6,8],[6,10],[7,8],[7,10],[8,9],[9,3]];

const SHAPES = [
  { verts: TETRA_V, edges: TETRA_E },
  { verts: OCTA_V, edges: OCTA_E },
  { verts: ICO_V, edges: ICO_E },
];

function buildPolyhedra() {
  const items = [];
  for (let i = 0; i < 14; i++) {
    const shape = SHAPES[i % 3];
    items.push({
      verts: shape.verts,
      edges: shape.edges,
      x: (Math.random() - 0.5) * 1.6,
      y: (Math.random() - 0.5) * 1.0,
      z: 2 + Math.random() * 3,
      z0: 2 + Math.random() * 3,
      scale: 0.08 + Math.random() * 0.14,
      rx: Math.random() * Math.PI * 2,
      ry: Math.random() * Math.PI * 2,
      rz: Math.random() * Math.PI * 2,
      sx: (0.15 + Math.random() * 0.25) * (Math.random() > 0.5 ? 1 : -1),
      sy: (0.1 + Math.random() * 0.2) * (Math.random() > 0.5 ? 1 : -1),
      sz: (0.08 + Math.random() * 0.15) * (Math.random() > 0.5 ? 1 : -1),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2,
      zPhase: Math.random() * Math.PI * 2,
      hue: Math.random(),
    });
  }
  return items;
}

function PolyhedraField() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const polyRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!polyRef.current) polyRef.current = buildPolyhedra();
    const polys = polyRef.current;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    function rotX(v, a) {
      const c = Math.cos(a), s = Math.sin(a);
      return [v[0], v[1]*c - v[2]*s, v[1]*s + v[2]*c];
    }
    function rotY(v, a) {
      const c = Math.cos(a), s = Math.sin(a);
      return [v[0]*c + v[2]*s, v[1], -v[0]*s + v[2]*c];
    }
    function rotZ(v, a) {
      const c = Math.cos(a), s = Math.sin(a);
      return [v[0]*c - v[1]*s, v[0]*s + v[1]*c, v[2]];
    }

    function project(v, w, h, fov) {
      const f = fov / Math.max(v[2], 0.1);
      return [w / 2 + v[0] * f, h / 2 - v[1] * f, 1 / Math.max(v[2], 0.1)];
    }

    let t0 = performance.now();
    let lastT = 0;
    const BOUNDS_X = 1.2, BOUNDS_Y = 0.8;
    const render = (now) => {
      resize();
      const w = canvas.width, h = canvas.height;
      const t = (now - t0) / 1000;
      const dt = Math.min(t - lastT, 0.05);
      lastT = t;
      ctx.clearRect(0, 0, w, h);
      const fov = Math.min(w, h) * 0.9;

      // Physics update — move, bounce off edges
      for (const p of polys) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        // Bounce off horizontal bounds
        if (p.x > BOUNDS_X) { p.x = BOUNDS_X; p.vx *= -1; p.sx *= -1; }
        if (p.x < -BOUNDS_X) { p.x = -BOUNDS_X; p.vx *= -1; p.sx *= -1; }
        // Bounce off vertical bounds
        if (p.y > BOUNDS_Y) { p.y = BOUNDS_Y; p.vy *= -1; p.sy *= -1; }
        if (p.y < -BOUNDS_Y) { p.y = -BOUNDS_Y; p.vy *= -1; p.sy *= -1; }
        // Bob in z
        p.z = p.z0 + Math.sin(t * 0.5 + p.zPhase) * 0.6;
      }

      // Sort by z for back-to-front
      polys.sort((a, b) => b.z - a.z);

      for (const p of polys) {
        // Rotate
        const ax = p.rx + t * p.sx;
        const ay = p.ry + t * p.sy;
        const az = p.rz + t * p.sz;

        const px = p.x;
        const py = p.y;

        // Transform vertices
        const projected = p.verts.map(v => {
          let r = [v[0] * p.scale, v[1] * p.scale, v[2] * p.scale];
          r = rotX(r, ax);
          r = rotY(r, ay);
          r = rotZ(r, az);
          r = [r[0] + px, r[1] + py, r[2] + p.z];
          return project(r, w, h, fov);
        });

        // Depth-based opacity and glow
        const depthAlpha = Math.max(0.15, Math.min(1, 1.2 - p.z / 5));
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.8 + p.hue * Math.PI * 2);

        // Gold/amber palette based on shape hue
        const gR = Math.round(210 + p.hue * 40);
        const gG = Math.round(155 + p.hue * 50);
        const gB = Math.round(40 + p.hue * 20);

        // Draw edges
        ctx.lineWidth = Math.max(1, 2.5 * depthAlpha);
        ctx.strokeStyle = `rgba(${gR},${gG},${gB},${(depthAlpha * pulse * 0.9).toFixed(3)})`;
        ctx.shadowColor = `rgba(${gR},${gG},${gB},${(depthAlpha * 0.5).toFixed(3)})`;
        ctx.shadowBlur = 8 * depthAlpha;
        ctx.beginPath();
        for (const [a, b] of p.edges) {
          ctx.moveTo(projected[a][0], projected[a][1]);
          ctx.lineTo(projected[b][0], projected[b][1]);
        }
        ctx.stroke();

        // Draw vertices as bright dots
        ctx.shadowBlur = 12 * depthAlpha;
        ctx.fillStyle = `rgba(255,240,200,${(depthAlpha * pulse * 0.8).toFixed(3)})`;
        for (const pt of projected) {
          const r = Math.max(1.5, 3 * pt[2] * depthAlpha);
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return <canvas ref={canvasRef} className="audio-vis-canvas" />;
}

/* ── Editorial Section (reusable) ── */
function EditorialSection({ id, zIndex, label, headline, outlineWords, desc, cta, ctaHref, rightTitle, items, rightLink, rightLinkHref, bgImage, bgComponent, rightComponent }) {
  const sectionRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const headlineRef = useRef(null);
  const bgRef = useRef(null);

  usePinnedSection(sectionRef, leftRef, rightRef, headlineRef, { bgRef: (bgImage || bgComponent) ? bgRef : undefined });

  return (
    <section ref={sectionRef} id={id} className="section-pinned" style={{ zIndex }}>
      {bgImage && (
        <div ref={bgRef} className="editorial-bg" style={{ backgroundImage: `url(${bgImage})` }}>
          <div className="editorial-bg-overlay" />
        </div>
      )}
      {bgComponent && (
        <div ref={bgRef} className="editorial-bg editorial-bg-component">
          {bgComponent}
          <div className="editorial-bg-overlay editorial-bg-overlay--light" />
        </div>
      )}

      <div ref={leftRef} className="editorial-left glass-panel">
        <span className="micro-label">{label}</span>
        <div ref={headlineRef} className="editorial-headline">
          <h2>
            <span className="word">{headline}</span>
            <br />
            {outlineWords.map((w, i) => (
              <span key={i}>
                <span className="word text-outline">{w}</span>
                {i < outlineWords.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h2>
        </div>
        <p className="editorial-desc">{desc}</p>
        {ctaHref.startsWith('/') ? (
          <Link to={ctaHref} className="btn btn-primary editorial-btn">
            {cta} <ArrowRight size={18} />
          </Link>
        ) : (
          <a href={ctaHref} className="btn btn-primary editorial-btn">
            {cta} <ArrowRight size={18} />
          </a>
        )}
      </div>

      <div ref={rightRef} className="editorial-right glass-panel">
        <h3 className="editorial-right-title">{rightTitle}</h3>
        <ul className="editorial-list">
          {items.map(({ icon: Icon, label: itemLabel }) => (
            <li key={itemLabel} className="editorial-list-item editorial-list-item--icon">
              <div className="editorial-icon-box">
                <Icon size={18} />
              </div>
              {itemLabel}
            </li>
          ))}
        </ul>
        {rightLink && (
          rightLinkHref?.startsWith('/') ? (
            <Link to={rightLinkHref} className="editorial-link">
              {rightLink} <ArrowRight size={16} />
            </Link>
          ) : (
            <a href={rightLinkHref || '#'} className="editorial-link">
              {rightLink} <ArrowRight size={16} />
            </a>
          )
        )}
        {rightComponent && (
          <div className="editorial-right-component">
            {rightComponent}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Contact CTA (flowing section) ── */
function ContactCTA() {
  const sectionRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!section || !left || !right) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(left, { y: '10vh', opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 45%', scrub: 0.5 },
      });
      gsap.fromTo(right, { y: '10vh', opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 75%', end: 'top 40%', scrub: 0.5 },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="contact-cta-section" style={{ zIndex: 70 }}>
      <div className="contact-cta-bg">
        <PolyhedraField />
      </div>
      <div className="contact-cta-grid">
        <div ref={leftRef} className="glass-panel contact-cta-left">
          <span className="micro-label">GET STARTED</span>
          <div className="editorial-headline">
            <h2>
              <span>LET'S</span>
              <br />
              <span className="text-outline">TALK</span>
            </h2>
          </div>
          <p className="editorial-desc">
            Tell us what you're building. We'll reply within <em className="desc-accent">2 business days.</em>
          </p>
          <Link to="/contact" className="btn btn-primary editorial-btn">
            Book a consultation <ArrowRight size={18} />
          </Link>
        </div>

        <div ref={rightRef} className="glass-panel contact-cta-right">
          <h3 className="editorial-right-title">Quick links</h3>
          <ul className="editorial-list">
            <li className="editorial-list-item">
              <span className="editorial-dot" />
              <Link to="/portfolio">View our portfolio</Link>
            </li>
            <li className="editorial-list-item">
              <span className="editorial-dot" />
              <Link to="/about">About us</Link>
            </li>
            <li className="editorial-list-item">
              <span className="editorial-dot" />
              <Link to="/services">Client portal</Link>
            </li>
            <li className="editorial-list-item">
              <span className="editorial-dot" />
              <Link to="/contact">Contact form</Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── Section Data ── */
const SECTIONS = [
  {
    id: 'services',
    zIndex: 20,
    label: 'CAPABILITIES',
    headline: 'FULL-STACK',
    outlineWords: ['DELIVERY'],
    desc: <>From data pipelines to customer-facing products, we design <em className="desc-accent">systems that scale.</em></>,
    cta: 'Meet the team',
    ctaHref: '/about',
    rightTitle: 'What we do',
    items: [
      { icon: BarChart3, label: 'Data & Analytics' },
      { icon: Code2, label: 'Web & Platform Engineering' },
      { icon: Brain, label: 'AI & Automation' },
      { icon: Compass, label: 'Advisory & Roadmapping' },
    ],
    rightLink: 'Explore services',
    rightLinkHref: '/portfolio',
    bgComponent: <TypingTerminal />,
  },
  {
    id: 'analytics',
    zIndex: 30,
    label: 'ANALYTICS',
    headline: 'MEASURE',
    outlineWords: ['WHAT', 'MATTERS'],
    desc: <>Clean reporting, attribution models, and dashboards your team will <em className="desc-accent">actually use.</em></>,
    cta: 'Request a data audit',
    ctaHref: '/contact',
    rightTitle: 'Data stack',
    items: [
      { icon: TrendingUp, label: 'Tracking & Governance' },
      { icon: Shield, label: 'Attribution Modeling' },
      { icon: Bell, label: 'Dashboards & Alerts' },
      { icon: Lock, label: 'Privacy-First Design' },
    ],
    rightLink: 'See case studies',
    rightLinkHref: '/portfolio',
    bgComponent: <AnalyticsTriptych />,
  },
  {
    id: 'work',
    zIndex: 40,
    label: 'WEB DEVELOPMENT',
    headline: 'FAST',
    outlineWords: ['AND', 'FINISHED'],
    desc: <>Production-ready frontends, robust backends, and CI/CD that keeps releases <em className="desc-accent">boring</em> (in a good way).</>,
    cta: 'View tech stack',
    ctaHref: '/portfolio',
    rightTitle: 'Build standards',
    items: [
      { icon: Zap, label: 'Performance Budgets' },
      { icon: Accessibility, label: 'Accessibility (WCAG)' },
      { icon: Palette, label: 'Design Systems' },
      { icon: TestTube, label: 'Testing & Observability' },
    ],
    rightLink: 'Read engineering notes',
    rightLinkHref: '/about',
    bgComponent: <AnimatedBlob />,
  },
  {
    id: 'insights',
    zIndex: 50,
    label: 'AI INTEGRATION',
    headline: 'AUTOMATE',
    outlineWords: ['THE', 'WORKFLOW'],
    desc: <>Agents, prompts, and pipelines that connect to your data — <em className="desc-accent">securely and measurably.</em></>,
    cta: 'Explore AI solutions',
    ctaHref: '/contact',
    rightTitle: 'AI delivery',
    items: [
      { icon: MessageSquare, label: 'Prompt Engineering' },
      { icon: Database, label: 'RAG & Knowledge Bases' },
      { icon: Bot, label: 'Agent Orchestration' },
      { icon: Eye, label: 'Safety & Monitoring' },
    ],
    rightLink: 'See AI experiments',
    rightLinkHref: '/portfolio',
    bgComponent: <ParticleNetwork />,
  },
  {
    id: 'team',
    zIndex: 60,
    label: 'CONSULTING',
    headline: 'ALIGN',
    outlineWords: ['THE', 'TEAM'],
    desc: <>Roadmaps, rituals, and decision-making frameworks that keep delivery <em className="desc-accent">predictable.</em></>,
    cta: 'Book a discovery call',
    ctaHref: '/contact',
    rightTitle: 'Advisory',
    items: [
      { icon: Map, label: 'Product Roadmapping' },
      { icon: Users, label: 'Team Operating Model' },
      { icon: Target, label: 'Metrics & Goals' },
      { icon: MessageCircle, label: 'Stakeholder Communication' },
    ],
    rightLink: 'Read playbooks',
    rightLinkHref: '/about',
    bgComponent: <FluidSimulation />,
  },
];

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
      {/* WebGL Background */}
      <Suspense fallback={null}>
        <EnergyField />
      </Suspense>

      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Sections */}
      <main className="home-main">
        <VideoHero />
        <NavigateSection />
        {SECTIONS.map(s => (
          <EditorialSection key={s.id} {...s} />
        ))}
        <ContactCTA />
      </main>
    </div>
  );
}
