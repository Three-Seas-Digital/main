import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import '../styles/portfolio.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowRight, 
  Check, 
  X, 
  Sparkles,
  Zap,
  ChevronDown,
  Star,
  Users,
  Shield
} from 'lucide-react';
import FallbackImg from '../components/FallbackImg';
import LighthouseBeam from '../components/LighthouseBeam';

gsap.registerPlugin(ScrollTrigger);

const allFeatures = [
  { name: 'Single/Multi-page', starter: '1 page', business: '5 pages', premium: '10 pages', enterprise: 'Unlimited' },
  { name: 'Mobile Responsive', starter: true, business: true, premium: true, enterprise: true },
  { name: 'CMS Integration', starter: false, business: true, premium: true, enterprise: true },
  { name: 'Blog Functionality', starter: false, business: true, premium: true, enterprise: true },
  { name: 'SEO Package', starter: 'Basic', business: 'Advanced', premium: 'Premium', enterprise: 'Enterprise' },
  { name: 'Custom Animations', starter: false, business: true, premium: true, enterprise: true },
  { name: 'Client Portal', starter: false, business: false, premium: true, enterprise: true },
  { name: 'Online Booking', starter: false, business: false, premium: true, enterprise: true },
  { name: 'Payment Processing', starter: false, business: false, premium: true, enterprise: true },
  { name: 'Membership System', starter: false, business: false, premium: true, enterprise: true },
  { name: 'Custom CRM', starter: false, business: false, premium: false, enterprise: true },
  { name: 'Analytics Dashboard', starter: false, business: 'Basic', premium: 'Advanced', enterprise: 'Custom BI' },
  { name: 'API Development', starter: false, business: false, premium: false, enterprise: true },
  { name: 'Support', starter: 'Email', business: 'Priority', premium: '24/7 Chat', enterprise: 'Dedicated' },
];

const faqs = [
  {
    q: 'How long does each project typically take?',
    a: 'Timelines vary by tier: Starter (1 week), Business (2 weeks), Premium (4 weeks), and Enterprise (custom timeline). We\'ll provide a detailed schedule during our kickoff call.',
  },
  {
    q: 'What happens after my website launches?',
    a: 'All plans include 30 days of post-launch support. We also offer monthly maintenance packages for updates, security patches, and content changes.',
  },
  {
    q: 'Can I upgrade my plan later?',
    a: 'Absolutely! Many clients start with Starter or Business and upgrade as they grow. We\'ll credit your existing investment toward the new tier.',
  },
  {
    q: 'Do you provide hosting and domains?',
    a: 'We can recommend hosting providers optimized for your tech stack, or manage hosting for you as part of our maintenance packages. Domain registration assistance is included.',
  },
  {
    q: 'What technologies do you use?',
    a: 'We build with modern frameworks like React, Next.js, and Node.js. For CMS, we work with headless solutions, WordPress, or custom admin panels depending on your needs.',
  },
  {
    q: 'Is there a payment schedule?',
    a: 'Yes — we typically structure payments as 50% upfront, 25% at midpoint, and 25% upon launch. Enterprise plans can accommodate custom billing cycles.',
  },
];

export default function Portfolio() {
  const [openFaq, setOpenFaq] = useState(null);
  const pageRef = useRef(null);
  const heroRef = useRef(null);

  useEffect(() => {
    document.title = 'Website Packages — Three Seas Digital';
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      // Hero parallax
      gsap.to('.portfolio-hero-bg', {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Hero content entrance
      gsap.from('.hero-content > *', {
        y: 60,
        opacity: 0,
        stagger: 0.15,
        duration: 1,
        ease: 'power3.out',
      });

      // Content sections stagger in
      gsap.from('.pricing-content > *', {
        y: 40,
        opacity: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.pricing-content',
          start: 'top 85%',
        },
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="portfolio-page" ref={pageRef}>
      {/* ── HERO ── */}
      <section className="portfolio-hero" ref={heroRef}>
        <div className="portfolio-hero-bg">
          <FallbackImg src="/images/lighthouse2.jpeg" alt="Website templates" />
          <LighthouseBeam originX={0.5} originY={0.77} />
          <div className="portfolio-hero-overlay" />
        </div>
        <div className="hero-content">
          <span className="hero-eyebrow">
            <Sparkles size={16} />
            Professional Website Packages
          </span>
          <h1 className="hero-title">
            Get a Website That
            <br />
            <span className="gradient-text">Works as Hard as You Do</span>
          </h1>
          <p className="hero-subtitle">
            Four tiers of digital excellence. Choose the perfect package for your business,
            or let us craft a custom solution for your unique needs.
          </p>
          <div className="hero-buttons">
            <a href="#pricing" className="btn btn-glow btn-lg">
              View Packages <ArrowRight size={20} />
            </a>
            <Link to="/contact" className="btn btn-outline">
              Get Custom Quote
            </Link>
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className="stats-bar">
          <div className="stat-item">
            <Star size={20} />
            <span className="stat-text">4.9/5 Client Rating</span>
          </div>
          <div className="stat-item">
            <Users size={20} />
            <span className="stat-text">50+ Happy Clients</span>
          </div>
          <div className="stat-item">
            <Shield size={20} />
            <span className="stat-text">100% Satisfaction</span>
          </div>
          <div className="stat-item">
            <Zap size={20} />
            <span className="stat-text">Live Demos Available</span>
          </div>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <section className="pricing-content" id="pricing">

        {/* Intro */}
        <div className="pricing-intro">
          <Sparkles size={20} className="bento-accent-icon" />
          <h2>Built for Real Businesses</h2>
          <p>
            From single-page landing sites to enterprise BI dashboards —
            four tiers of digital excellence.
          </p>
          <div className="pricing-intro-stats">
            <div className="pricing-stat">
              <span className="pricing-stat-number">98%</span>
              <span className="pricing-stat-label">Satisfaction</span>
            </div>
            <div className="pricing-stat">
              <span className="pricing-stat-number">50+</span>
              <span className="pricing-stat-label">Projects</span>
            </div>
            <div className="pricing-stat">
              <span className="pricing-stat-number">3+</span>
              <span className="pricing-stat-label">Years</span>
            </div>
          </div>
        </div>

        {/* Feature comparison */}
        <div className="pricing-comparison">
          <h3 className="pricing-comparison-title">Feature Comparison</h3>
          <div className="pricing-table-wrap">
            <div className="feature-header">
              <div className="feature-name">Features</div>
              <div className="feature-plans">
                <span>Starter</span>
                <span>Business</span>
                <span>Premium</span>
                <span>Enterprise</span>
              </div>
            </div>
            {allFeatures.map((feature, index) => (
              <div key={index} className="feature-row">
                <div className="feature-name">{feature.name}</div>
                <div className="feature-plans">
                  <span className={getFeatureClass(feature.starter)}>{renderFeatureValue(feature.starter)}</span>
                  <span className={getFeatureClass(feature.business)}>{renderFeatureValue(feature.business)}</span>
                  <span className={getFeatureClass(feature.premium)}>{renderFeatureValue(feature.premium)}</span>
                  <span className={getFeatureClass(feature.enterprise)}>{renderFeatureValue(feature.enterprise)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="pricing-faq">
          <div className="pricing-faq-header">
            <span className="bento-eyebrow">FAQ</span>
            <h2>Common Questions</h2>
            <p>Everything you need to know about our packages and process.</p>
          </div>
          <div className="pricing-faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item ${openFaq === index ? 'faq-item--open' : ''}`}>
                <button className="faq-question" onClick={() => toggleFaq(index)}>
                  {faq.q}
                  <ChevronDown size={18} className="faq-icon" />
                </button>
                <div className="faq-answer"><p>{faq.a}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="pricing-cta">
          <h2>Ready to Launch Your New Website?</h2>
          <p>Let's discuss which package is right for your business, or build something completely custom.</p>
          <div className="pricing-cta-buttons">
            <Link to="/contact" className="btn btn-primary btn-lg">
              Start Your Project <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="btn btn-outline">
              Get Custom Quote
            </Link>
          </div>
          <span className="pricing-cta-guarantee">
            <Shield size={14} /> 100% satisfaction guarantee
          </span>
        </div>

      </section>
    </div>
  );
}

function getFeatureClass(value) {
  if (value === true) return 'feature-included';
  if (value === false) return 'feature-excluded';
  return 'feature-text';
}

function renderFeatureValue(value) {
  if (value === true) return <Check size={18} />;
  if (value === false) return <X size={18} />;
  return value;
}
