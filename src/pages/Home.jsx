import { useEffect, useRef, useLayoutEffect, useState, useCallback, lazy, Suspense } from 'react';
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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Smooth crossfade loop: capture a frame well before the end,
  // slowly fade the canvas over the video, hold through the loop
  // restart, then slowly fade it back out.
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let raf;
    let phase = 'watching'; // watching | snapped | covering | fading

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!video.duration) return;

      const remaining = video.duration - video.currentTime;
      const t = video.currentTime;

      switch (phase) {
        case 'watching':
          // 3s before end: capture a clean mid-motion frame
          if (remaining < 3.0 && remaining > 2.0) {
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            // Use slow fade-in transition
            canvas.style.transition = 'opacity 2s ease-in';
            phase = 'snapped';
          }
          break;

        case 'snapped':
          // 1.5s before end: start fading canvas in
          if (remaining < 1.5) {
            canvas.style.opacity = '1';
            phase = 'covering';
          }
          break;

        case 'covering':
          // After loop restarts, hold canvas until new loop has settled
          if (t > 0 && t < 3.0 && remaining > 5.0) {
            // New loop is playing — wait a beat then start fading out
            if (t > 0.8) {
              canvas.style.transition = 'opacity 2s ease-out';
              canvas.style.opacity = '0';
              phase = 'fading';
            }
          }
          break;

        case 'fading':
          // Wait for fade-out to finish, then reset
          if (t > 3.5) {
            phase = 'watching';
          }
          break;
      }
    };

    const start = () => { raf = requestAnimationFrame(tick); };
    video.addEventListener('playing', start);
    if (!video.paused) start();

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener('playing', start);
    };
  }, []);

  return (
    <section className="video-hero">
      <div className="hero-video-wrap">
        <video
          ref={videoRef}
          className="hero-video"
          src="/images/hero3.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <canvas ref={canvasRef} className="hero-canvas-cover" />
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
          Strategy. Engineering. Design. — One team, zero excuses.
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
          Strategy, engineering, and design — built for businesses that are ready to grow.
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
    const fullText = line.prompt ? line.text : line.text;
    if (line.text === '') {
      const t = setTimeout(() => { setLines(p => [...p, { ...line, typed: '' }]); setLineIdx(i => i + 1); setCurrentChar(0); }, 200);
      return () => clearTimeout(t);
    }
    if (currentChar <= fullText.length) {
      const speed = line.prompt ? 35 + Math.random() * 25 : 8 + Math.random() * 12;
      const t = setTimeout(() => {
        const raw = fullText.slice(0, currentChar);
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

/* ── Brain WebGL Background ── */
const BRAIN_VERT = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_uv;
void main() {
  v_uv = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const BRAIN_FRAG = `
precision mediump float;
uniform sampler2D u_image;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_uv;

void main() {
  // Crop to brain center — zoom 2.2x into center of image
  vec2 uv = v_uv * 0.45 + vec2(0.28, 0.2);

  // Ripple distortion from center
  vec2 center = vec2(0.5, 0.42);
  float dist = distance(uv, center);
  float ripple = sin(dist * 18.0 - u_time * 1.8) * 0.008 * smoothstep(0.6, 0.0, dist);
  float ripple2 = sin(dist * 12.0 + u_time * 1.2) * 0.005;
  uv += (uv - center) * (ripple + ripple2);

  // Chromatic aberration
  float aberration = 0.003 + sin(u_time * 0.5) * 0.001;
  float r = texture2D(u_image, uv + vec2(aberration, 0.0)).r;
  float g = texture2D(u_image, uv).g;
  float b = texture2D(u_image, uv - vec2(aberration, 0.0)).b;
  vec3 color = vec3(r, g, b);

  // Neural pulse glow — radiates from center
  float pulse = sin(u_time * 1.5) * 0.5 + 0.5;
  float glow = smoothstep(0.5, 0.0, dist) * pulse * 0.25;
  color += vec3(0.1, 0.6, 0.9) * glow;

  // Travelling scan line
  float scanY = fract(u_time * 0.08);
  float scan = smoothstep(0.0, 0.01, abs(uv.y - scanY)) ;
  color *= 0.92 + 0.08 * scan;
  // Bright line at scan position
  float scanLine = 1.0 - smoothstep(0.0, 0.006, abs(uv.y - scanY));
  color += vec3(0.15, 0.7, 1.0) * scanLine * 0.4;

  // Subtle vignette
  float vig = smoothstep(0.8, 0.3, dist);
  color *= 0.6 + 0.4 * vig;

  // Slight blue-cyan tint
  color = mix(color, color * vec3(0.7, 0.85, 1.1), 0.3);

  gl_FragColor = vec4(color, 1.0);
}`;

function BrainWebGL() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const glRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;
    glRef.current = gl;

    // Compile shaders
    function createShader(type, source) {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return s;
    }
    const vs = createShader(gl.VERTEX_SHADER, BRAIN_VERT);
    const fs = createShader(gl.FRAGMENT_SHADER, BRAIN_FRAG);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Full-screen quad
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,1, 1,1, 0,0, 1,0]), gl.STATIC_DRAW);
    const aTex = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');

    // Load brain image as texture
    const texture = gl.createTexture();
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      startLoop();
    };
    img.src = '/images/brain.jpeg';

    // Resize
    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    let t0 = performance.now();
    function startLoop() {
      const render = (now) => {
        resize();
        const elapsed = (now - t0) / 1000;
        gl.uniform1f(uTime, elapsed);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        rafRef.current = requestAnimationFrame(render);
      };
      rafRef.current = requestAnimationFrame(render);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="brain-webgl-canvas" />;
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

    function makeProgram(vs, fs) {
      const v = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(v, vs); gl.compileShader(v);
      const f = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(f, fs); gl.compileShader(f);
      const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
      return p;
    }

    const pointProg = makeProgram(PARTICLE_VERT, PARTICLE_FRAG);
    const lineProg = makeProgram(LINE_VERT, LINE_FRAG);

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
      const dpr = Math.min(window.devicePixelRatio, 2);
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
      gl.uniform1f(gl.getUniformLocation(pointProg, 'u_pointSize'), 3.0 * Math.min(window.devicePixelRatio, 2));
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
    const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, FLUID_FRAG); gl.compileShader(fs);
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
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
      const dpr = Math.min(window.devicePixelRatio, 1.5);
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
const VIS_VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const VIS_FRAG = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

float hash(float n) { return fract(sin(n) * 43758.5453); }

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float barCount = 48.0;
  float barIdx = floor(uv.x * barCount);
  float barCenter = (barIdx + 0.5) / barCount;
  float barWidth = 0.6 / barCount;

  // Generate fake audio levels — layered sine waves
  float level = 0.0;
  level += sin(u_time * 1.2 + barIdx * 0.4) * 0.2;
  level += sin(u_time * 2.1 + barIdx * 0.25) * 0.15;
  level += sin(u_time * 0.7 + barIdx * 0.6) * 0.18;
  level += sin(u_time * 3.3 + barIdx * 0.15) * 0.08;
  level += hash(barIdx) * 0.12;
  level = level * 0.5 + 0.35;
  level = clamp(level, 0.05, 0.95);

  // Bar shape
  float inBar = step(abs(uv.x - barCenter), barWidth);
  float inHeight = step(uv.y, level) * inBar;

  // Color gradient — cyan at bottom to gold at top
  vec3 barColor = mix(
    vec3(0.13, 0.83, 0.93),
    vec3(0.78, 0.64, 0.24),
    uv.y
  );

  // Glow at bar tops
  float topGlow = exp(-abs(uv.y - level) * 30.0) * inBar * 0.5;
  vec3 glowColor = vec3(1.0, 0.95, 0.8);

  // Reflection below
  float reflection = step(uv.y, 0.02) * inBar * level * 0.15;

  vec3 color = barColor * inHeight * 0.6;
  color += glowColor * topGlow;
  color += barColor * reflection;

  // Fade edges
  float fade = smoothstep(0.0, 0.1, uv.x) * smoothstep(1.0, 0.9, uv.x);
  color *= fade;

  float alpha = max(inHeight * 0.7, max(topGlow * 0.8, reflection));
  gl_FragColor = vec4(color, alpha * fade);
}`;

function AudioVisualizer() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, VIS_VERT); gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, VIS_FRAG); gl.compileShader(fs);
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
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
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = canvas.clientWidth * dpr, h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
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
        <AudioVisualizer />
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
            Tell us what you're building. We'll reply within 2 business days.
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
    desc: 'From data pipelines to customer-facing products, we design systems that scale.',
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
    desc: 'Clean reporting, attribution models, and dashboards your team will actually use.',
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
    bgComponent: <AnalyticsDashboard />,
  },
  {
    id: 'work',
    zIndex: 40,
    label: 'WEB DEVELOPMENT',
    headline: 'FAST',
    outlineWords: ['AND', 'FINISHED'],
    desc: 'Production-ready frontends, robust backends, and CI/CD that keeps releases boring (in a good way).',
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
    bgImage: '/images/sirius.jpeg',
  },
  {
    id: 'insights',
    zIndex: 50,
    label: 'AI INTEGRATION',
    headline: 'AUTOMATE',
    outlineWords: ['THE', 'WORKFLOW'],
    desc: 'Agents, prompts, and pipelines that connect to your data — securely and measurably.',
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
    desc: 'Roadmaps, rituals, and decision-making frameworks that keep delivery predictable.',
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
