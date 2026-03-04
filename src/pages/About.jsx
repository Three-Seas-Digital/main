import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  ChevronRight,
  Code2,
  Sparkles,
  TrendingUp,
  Shield,
  HeartHandshake,
  Lightbulb,
  Rocket,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const differentiators = [
  {
    icon: HeartHandshake,
    title: 'Partnership First',
    desc: "We don't just build websites — we become your digital partner. Your success metrics become our mission.",
  },
  {
    icon: Lightbulb,
    title: 'Creative Innovation',
    desc: 'Every project gets fresh thinking. No templates. No recycled solutions. Just bespoke digital experiences.',
  },
  {
    icon: Rocket,
    title: 'Rapid Delivery',
    desc: 'Agile methodology means faster launches without sacrificing quality. Get to market in weeks, not months.',
  },
];

const stats = [
  { value: '50+', label: 'Projects Delivered', suffix: '' },
  { value: '98', label: 'Client Satisfaction', suffix: '%' },
  { value: '3', label: 'Years Experience', suffix: '+' },
  { value: '24', label: 'Hour Support', suffix: '/7' },
];

const processSteps = [
  { number: '01', title: 'Discover', desc: 'Deep dive into your brand, goals, and audience to uncover opportunities.' },
  { number: '02', title: 'Design', desc: 'Craft visual narratives that resonate and convert visitors into customers.' },
  { number: '03', title: 'Develop', desc: 'Build with cutting-edge tech — performant, scalable, and future-proof.' },
  { number: '04', title: 'Deploy', desc: 'Launch with confidence, backed by analytics, SEO, and ongoing support.' },
];

const capabilities = [
  { icon: Code2, title: 'Web Development', desc: 'React, Node.js, modern architectures' },
  { icon: Sparkles, title: 'Brand Design', desc: 'Visual identities that captivate' },
  { icon: TrendingUp, title: 'Growth Strategy', desc: 'Data-driven marketing solutions' },
  { icon: Shield, title: 'Maintenance', desc: '24/7 support and optimization' },
];

export default function About() {
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const heroContentRef = useRef(null);
  const videoARef = useRef(null);
  const videoBRef = useRef(null);
  const missionRef = useRef(null);
  const processSectionRef = useRef(null);
  const capabilitiesRef = useRef(null);

  useEffect(() => {
    document.title = 'About Us — Three Seas Digital';
  }, []);

  // Dual-video ping-pong loop (seamless crossfade, no stutter)
  useEffect(() => {
    const vA = videoARef.current;
    const vB = videoBRef.current;
    if (!vA || !vB) return;

    const CROSSFADE = 2.4;
    const FPS = 1 / 60;
    const SPEED = 1 / CROSSFADE;

    let raf;
    let active = vA;
    let standby = vB;
    let fading = false;
    let activeOpacity = 1;
    let standbyOpacity = 0;

    standby.preload = 'auto';
    standby.currentTime = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!active.duration) return;

      const remaining = active.duration - active.currentTime;

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

        if (standbyOpacity >= 1) {
          active.pause();
          active.style.opacity = '0';

          const tmp = active;
          active = standby;
          standby = tmp;
          activeOpacity = 1;
          standbyOpacity = 0;
          fading = false;

          standby.currentTime = 0;
        }
      }
    };

    vA.play().catch(() => {});
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, []);

  // GSAP scroll animations
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      // Hero entrance
      const heroChildren = heroContentRef.current?.children;
      if (heroChildren?.length) {
        gsap.from(heroChildren, {
          y: 60,
          opacity: 0,
          stagger: 0.15,
          duration: 1,
          ease: 'power3.out',
        });
      }

      // Section 1: Mission + Stats — glass panels fade in
      if (missionRef.current) {
        gsap.from(missionRef.current.querySelectorAll('.glass-panel'), {
          y: 50,
          opacity: 0,
          stagger: 0.12,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: missionRef.current,
            start: 'top 70%',
          },
        });

        // Stats counter animation
        const statValues = missionRef.current.querySelectorAll('.about-stat-value');
        statValues?.forEach((el) => {
          gsap.from(el, {
            textContent: 0,
            duration: 2,
            ease: 'power2.out',
            snap: { textContent: 1 },
            scrollTrigger: { trigger: el, start: 'top 80%' },
            onUpdate: function () {
              el.textContent = Math.round(this.targets()[0].textContent);
            },
          });
        });
      }

      // Section 2: Process + Differentiators
      if (processSectionRef.current) {
        const line = processSectionRef.current.querySelector('.about-process-line');
        if (line) {
          gsap.from(line, {
            scaleX: 0,
            transformOrigin: 'left center',
            duration: 1.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: processSectionRef.current,
              start: 'top 60%',
            },
          });
        }

        gsap.from(processSectionRef.current.querySelectorAll('.about-process-node'), {
          y: 40,
          opacity: 0,
          stagger: 0.12,
          duration: 0.7,
          scrollTrigger: {
            trigger: processSectionRef.current,
            start: 'top 70%',
          },
        });

        const diffGrid = processSectionRef.current.querySelector('.about-diff-grid');
        if (diffGrid) {
          gsap.from(diffGrid.querySelectorAll('.about-diff-card'), {
            y: 60,
            opacity: 0,
            stagger: 0.15,
            duration: 0.8,
            scrollTrigger: {
              trigger: diffGrid,
              start: 'top 75%',
            },
          });
        }
      }

      // Section 3: Capabilities + CTA
      if (capabilitiesRef.current) {
        gsap.from(capabilitiesRef.current.querySelectorAll('.about-cap-card'), {
          y: 40,
          opacity: 0,
          stagger: 0.1,
          duration: 0.7,
          scrollTrigger: {
            trigger: capabilitiesRef.current,
            start: 'top 70%',
          },
        });

        const ctaPanel = capabilitiesRef.current.querySelector('.about-cta-panel');
        if (ctaPanel) {
          gsap.from(ctaPanel, {
            y: 40,
            opacity: 0,
            duration: 0.8,
            scrollTrigger: {
              trigger: ctaPanel,
              start: 'top 80%',
            },
          });
        }
      }
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="about-page" ref={pageRef}>
      {/* ── HERO ── */}
      <section className="about-hero" ref={heroRef}>
        <div className="about-hero-bg">
          <video ref={videoARef} className="about-hero-video" src="/images/lightmovie.mp4" muted playsInline preload="auto" autoPlay />
          <video ref={videoBRef} className="about-hero-video" src="/images/lightmovie.mp4" muted playsInline preload="auto" style={{ opacity: 0 }} />
          <div className="about-hero-overlay" />
        </div>
        <div className="about-hero-content" ref={heroContentRef}>
          <span className="micro-label">Our Story</span>
          <div className="editorial-headline">
            <h1>
              <span className="word">WHERE</span>{' '}
              <span className="word text-outline">VISION</span>
              <br />
              <span className="word">MEETS</span>{' '}
              <span className="word text-outline">PRECISION</span>
            </h1>
          </div>
          <p className="editorial-desc">
            We turn <em className="desc-accent">bold ideas</em> into digital experiences
            that outperform, outlast, and outshine.
          </p>
          <div className="editorial-actions">
            <Link to="/pricing" className="btn btn-primary editorial-btn">
              View Our Work <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="btn btn-outline editorial-btn">
              Start a Project <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── MISSION / STORY + STATS ── */}
      <section className="about-mission" ref={missionRef}>
        <div className="about-mission-grid">
          <div className="glass-panel about-mission-left">
            <span className="micro-label">OUR PURPOSE</span>
            <div className="editorial-headline">
              <h2>
                <span className="word">EVERY</span>{' '}
                <span className="word text-outline">BRAND</span>
                <br />
                <span className="word">HAS A</span>{' '}
                <span className="word text-outline">STORY</span>
              </h2>
            </div>
            <p className="editorial-desc">
              In a world drowning in digital noise, standing out requires more than
              just a pretty website. It demands <em className="desc-accent">strategic thinking</em>,
              creative excellence, and technical mastery working in harmony.
            </p>
            <p className="editorial-desc">
              Three Seas Digital was founded on a simple belief: every business deserves
              a digital presence that truly represents their vision and drives{' '}
              <em className="desc-accent">real results</em>.
            </p>
          </div>

          <div className="glass-panel about-stats-panel">
            <h3 className="editorial-right-title">By the Numbers</h3>
            {stats.map((stat, i) => (
              <div key={i} className="about-stat-row">
                <div className="about-stat-number">
                  <span className="about-stat-value" data-value={parseInt(stat.value)}>
                    {stat.value}
                  </span>
                  <span className="about-stat-suffix">{stat.suffix}</span>
                </div>
                <div className="about-stat-label">
                  <span className="editorial-dot" />
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS + DIFFERENTIATORS ── */}
      <section className="about-process-section" ref={processSectionRef}>
        <div className="container">
          <span className="micro-label">HOW WE WORK</span>
          <div className="editorial-headline about-section-headline">
            <h2>
              <span className="word">A PROVEN</span>{' '}
              <span className="word text-outline">PROCESS</span>
            </h2>
          </div>
          <p className="editorial-desc about-section-desc">
            A methodology refined across <em className="desc-accent">50+ successful projects</em> —
            built for speed without sacrificing quality.
          </p>

          <div className="about-process-track">
            <div className="about-process-line" />
            {processSteps.map((step, i) => (
              <div key={i} className="about-process-node">
                <div className="about-process-number">{step.number}</div>
                <div className="about-process-dot" />
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="about-diff-grid">
            {differentiators.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="glass-panel about-diff-card">
                  <div className="editorial-icon-box">
                    <Icon size={24} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES + CTA ── */}
      <section className="about-capabilities" ref={capabilitiesRef}>
        <div className="container">
          <span className="micro-label">CAPABILITIES</span>
          <div className="editorial-headline about-section-headline">
            <h2>
              <span className="word">WHAT WE</span>{' '}
              <span className="word text-outline">DO BEST</span>
            </h2>
          </div>
          <p className="editorial-desc about-section-desc">
            Full-spectrum digital services under <em className="desc-accent">one roof</em>.
          </p>

          <div className="about-caps-grid">
            {capabilities.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <div key={i} className="glass-panel about-cap-card">
                  <div className="editorial-icon-box">
                    <Icon size={24} />
                  </div>
                  <div className="about-cap-content">
                    <h3>{cap.title}</h3>
                    <p>{cap.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass-panel about-cta-panel">
            <div className="about-cta-text">
              <span className="micro-label">GET STARTED</span>
              <div className="editorial-headline">
                <h2>
                  <span className="word">READY</span>{' '}
                  <span className="word text-outline">TO</span>
                  <br />
                  <span className="word">BUILD?</span>
                </h2>
              </div>
              <p className="editorial-desc">
                Let's discuss how Three Seas Digital can{' '}
                <em className="desc-accent">transform your digital presence</em> and help your
                business thrive.
              </p>
            </div>
            <div className="editorial-actions">
              <Link to="/contact" className="btn btn-primary editorial-btn">
                Start Your Project <ArrowRight size={18} />
              </Link>
              <Link to="/pricing" className="btn btn-outline editorial-btn">
                See Our Work <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
