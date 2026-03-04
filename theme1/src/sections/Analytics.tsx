import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, TrendingUp, Shield, Bell, Lock } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Analytics() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const leftPanel = leftPanelRef.current;
    const rightPanel = rightPanelRef.current;

    if (!section || !leftPanel || !rightPanel) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        },
      });

      // Left panel entrance
      scrollTl.fromTo(
        leftPanel,
        { x: '-60vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0
      );

      // Right panel entrance
      scrollTl.fromTo(
        rightPanel,
        { x: '60vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0
      );

      // Headline reveal
      const words = leftPanel.querySelectorAll('.word');
      scrollTl.fromTo(
        words,
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.02, ease: 'power2.out' },
        0.05
      );

      // EXIT animations
      scrollTl.fromTo(
        leftPanel,
        { x: 0, opacity: 1 },
        { x: '-55vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        rightPanel,
        { x: 0, opacity: 1 },
        { x: '55vw', opacity: 0, ease: 'power2.in' },
        0.7
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const dataStack = [
    { icon: TrendingUp, label: 'Tracking & Governance' },
    { icon: Shield, label: 'Attribution Modeling' },
    { icon: Bell, label: 'Dashboards & Alerts' },
    { icon: Lock, label: 'Privacy-First Design' },
  ];

  return (
    <section
      ref={sectionRef}
      className="section-pinned flex items-center justify-center z-30"
    >
      {/* Left Editorial Panel */}
      <div
        ref={leftPanelRef}
        className="absolute left-[6vw] top-[18vh] w-[90vw] lg:w-[46vw] glass-panel p-6 lg:p-10"
      >
        <span className="micro-label block mb-6">ANALYTICS</span>

        <div className="mb-6">
          <h2 className="font-heading font-bold text-[clamp(32px,4.5vw,64px)] leading-[0.95] tracking-[-0.02em]">
            <span className="word inline-block text-[#F2F5FA]">MEASURE</span>
            <br />
            <span className="word inline-block text-outline text-[#F2F5FA]">
              WHAT
            </span>{' '}
            <span className="word inline-block text-outline text-[#F2F5FA]">
              MATTERS
            </span>
          </h2>
        </div>

        <p className="text-[#A7AFBF] text-base lg:text-lg leading-relaxed mb-8 max-w-md">
          Clean reporting, attribution models, and dashboards your team will
          actually use.
        </p>

        <a href="#contact" className="btn-primary flex items-center gap-2 w-fit">
          Request a data audit
          <ArrowRight size={18} />
        </a>
      </div>

      {/* Right Info Panel */}
      <div
        ref={rightPanelRef}
        className="hidden lg:block absolute right-[6vw] top-[18vh] w-[34vw] glass-panel p-8"
      >
        <h3 className="font-heading font-semibold text-xl text-[#F2F5FA] mb-6">
          Data stack
        </h3>

        <ul className="space-y-4">
          {dataStack.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-4 text-[#A7AFBF] hover:text-[#F2F5FA] transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-[rgba(255,106,0,0.1)] flex items-center justify-center group-hover:bg-[rgba(255,106,0,0.2)] transition-colors">
                <Icon size={18} className="text-[#FF6A00]" />
              </div>
              {label}
            </li>
          ))}
        </ul>

        <a
          href="#work"
          className="inline-flex items-center gap-2 mt-8 text-sm font-medium text-[#FF6A00] hover:text-[#FF8533] transition-colors"
        >
          See case studies
          <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}
