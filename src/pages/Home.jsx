import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Palette,
  TrendingUp,
  Code,
  ArrowRight,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import FallbackImg from '../components/FallbackImg';

const services = [
  {
    icon: <Globe size={32} />,
    title: 'Web Development',
    desc: 'Custom websites built with modern technologies that load fast and look stunning on every device.',
  },
  {
    icon: <Palette size={32} />,
    title: 'Brand Design',
    desc: 'Visual identities that capture your essence and make lasting impressions in a crowded market.',
  },
  {
    icon: <TrendingUp size={32} />,
    title: 'Digital Marketing',
    desc: 'Data-driven strategies that amplify your reach and convert visitors into loyal customers.',
  },
  {
    icon: <Code size={32} />,
    title: 'App Development',
    desc: 'Native and cross-platform applications that deliver seamless user experiences.',
  },
];

const stats = [
  { icon: <Users size={24} />, value: 'Client-First', label: 'Approach' },
  { icon: <Code size={24} />, value: 'Modern', label: 'Tech Stack' },
  { icon: <Star size={24} />, value: 'Transparent', label: 'Process' },
  { icon: <Zap size={24} />, value: 'Fast', label: 'Turnaround' },
];



export default function Home() {
  useEffect(() => { document.title = 'Three Seas Digital — Web Design & Development'; }, []);
  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <FallbackImg
            src="/images/home-hero.jpg"
            alt="Digital ocean"
          />
          <div className="hero-overlay" />
        </div>
        <div className="hero-content">
          <h1>Navigate the Digital Seas</h1>
          <p>
            We craft exceptional digital experiences that drive growth, build
            brands, and transform businesses across every digital frontier.
          </p>
          <div className="hero-buttons">
            <Link to="/portfolio" className="btn btn-primary">
              View Our Work <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="btn btn-outline">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                {stat.icon}
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Our Services</h2>
            <p>
              Comprehensive digital solutions tailored to elevate your business
            </p>
          </div>
          <div className="services-grid">
            {services.map((service) => (
              <div key={service.title} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="section about-preview">
        <div className="container">
          <div className="about-grid">
            <div className="about-image">
              <FallbackImg
                src="/images/home-approach.jpg"
                alt="Team collaboration"
              />
            </div>
            <div className="about-text">
              <h2>Who We Are</h2>
              <p>
                Three Seas Digital is a growing digital agency passionate
                about creating impactful online experiences. Our team of
                designers, developers, and strategists work together to
                deliver real results for businesses ready to level up their
                digital presence.
              </p>
              <p>
                We believe every brand has a unique story. Our job is to tell
                that story across the digital landscape in the most compelling
                way possible.
              </p>
              <Link to="/contact" className="btn btn-primary">
                Work With Us <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Philosophy</h2>
            <p>What drives everything we build</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">
                <Star size={16} fill="currentColor" />
              </div>
              <p>"Every business deserves a digital presence that actually works — not just looks pretty. We build tools that help you grow."</p>
              <div className="testimonial-author">
                <div>
                  <strong>Three Seas Digital</strong>
                  <span>Our Promise</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">
                <Zap size={16} />
              </div>
              <p>"We're a small team that moves fast, communicates honestly, and treats your project like it's our own."</p>
              <div className="testimonial-author">
                <div>
                  <strong>Built Different</strong>
                  <span>No fluff, just results</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">
                <Code size={16} />
              </div>
              <p>"We use the same modern tech stack that powers the apps you use every day — because your business deserves nothing less."</p>
              <div className="testimonial-author">
                <div>
                  <strong>Modern Standards</strong>
                  <span>React, Node.js, and more</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Set Sail?</h2>
          <p>
            Let's chart a course for your digital success. Schedule a free
            consultation today.
          </p>
          <Link to="/contact" className="btn btn-primary btn-lg">
            Book a Consultation <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
