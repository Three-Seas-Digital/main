import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ChevronRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const microcopyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const leftPanel = leftPanelRef.current;
    const rightPanel = rightPanelRef.current;
    const headline = headlineRef.current;
    const microcopy = microcopyRef.current;

    if (!section || !leftPanel || !rightPanel || !headline || !microcopy) return;

    const ctx = gsap.context(() => {
      // Initial state - elements hidden
      gsap.set([leftPanel, rightPanel], { opacity: 0 });
      gsap.set(leftPanel, { x: '-60vw' });
      gsap.set(rightPanel, { x: '60vw' });
      gsap.set(microcopy, { opacity: 0, y: 16 });

      // Split headline into words for animation
      const words = headline.querySelectorAll('.word');
      gsap.set(words, { opacity: 0, y: 24 });

      // AUTO-PLAY entrance animation on page load
      const loadTl = gsap.timeline({ delay: 0.3 });

      loadTl
        .to(leftPanel, {
          x: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
        })
        .to(
          rightPanel,
          {
            x: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power3.out',
          },
          '<'
        )
        .to(
          words,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.03,
            ease: 'power2.out',
          },
          '-=0.5'
        )
        .to(
          microcopy,
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
          },
          '-=0.3'
        );

      // Scroll-driven EXIT animation
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 0.6,
          onLeaveBack: () => {
            // Reset to visible when scrolling back to top
            gsap.to([leftPanel, rightPanel], { opacity: 1, x: 0, duration: 0.3 });
            gsap.to(microcopy, { opacity: 1, duration: 0.3 });
          },
        },
      });

      // ENTRANCE (0-30%): Hold position (already visible from load animation)
      // SETTLE (30-70%): Hold position
      // EXIT (70-100%): Panels slide out
      scrollTl
        .fromTo(
          leftPanel,
          { x: 0, opacity: 1 },
          { x: '-55vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(
          rightPanel,
          { x: 0, opacity: 1 },
          { x: '55vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(
          microcopy,
          { opacity: 1 },
          { opacity: 0, ease: 'power2.in' },
          0.65
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-pinned flex items-center justify-center z-10"
    >
      {/* Left Editorial Panel */}
      <div
        ref={leftPanelRef}
        className="absolute left-[6vw] top-[18vh] w-[90vw] lg:w-[46vw] glass-panel p-6 lg:p-10"
      >
        <span className="micro-label block mb-6">THREE SEAS DIGITAL</span>

        <div ref={headlineRef} className="mb-6">
          <h1 className="font-heading font-bold text-[clamp(36px,5vw,72px)] leading-[0.95] tracking-[-0.02em]">
            <span className="word inline-block text-[#F2F5FA]">BUILD</span>
            <br />
            <span className="word inline-block text-outline text-[#F2F5FA]">
              WHAT'S
            </span>{' '}
            <span className="word inline-block text-outline text-[#F2F5FA]">
              NEXT
            </span>
          </h1>
        </div>

        <p className="text-[#A7AFBF] text-base lg:text-lg leading-relaxed mb-8 max-w-md">
          Strategy, engineering, and AI—built for teams that ship.
        </p>

        <div className="flex flex-wrap gap-4">
          <a href="#contact" className="btn-primary flex items-center gap-2">
            Start a project
            <ArrowRight size={18} />
          </a>
          <a href="#work" className="btn-secondary flex items-center gap-2">
            See selected work
            <ChevronRight size={18} />
          </a>
        </div>
      </div>

      {/* Right Info Panel */}
      <div
        ref={rightPanelRef}
        className="hidden lg:block absolute right-[6vw] top-[18vh] w-[34vw] glass-panel p-8"
      >
        <h3 className="font-heading font-semibold text-xl text-[#F2F5FA] mb-6">
          Capabilities
        </h3>

        <ul className="space-y-4">
          {[
            'Analytics & Attribution',
            'Web Development',
            'AI Integration',
            'Consulting',
          ].map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 text-[#A7AFBF] hover:text-[#F2F5FA] transition-colors cursor-pointer group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00] group-hover:scale-125 transition-transform" />
              {item}
            </li>
          ))}
        </ul>

        <a
          href="#services"
          className="inline-flex items-center gap-2 mt-8 text-sm font-medium text-[#FF6A00] hover:text-[#FF8533] transition-colors"
        >
          Explore services
          <ArrowRight size={16} />
        </a>
      </div>

      {/* Bottom Microcopy */}
      <div
        ref={microcopyRef}
        className="absolute left-[6vw] bottom-[6vh] w-[90vw] lg:w-[40vw]"
      >
        <p className="text-sm text-[#A7AFBF]">
          Remote-first. Working with teams in NA, EU, and APAC.
        </p>
      </div>
    </section>
  );
}
