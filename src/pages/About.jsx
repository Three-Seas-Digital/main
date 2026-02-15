import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Clock, CheckCircle, BarChart3, Target, Lock, Database, Cog, TrendingUp, Zap } from 'lucide-react';
import FallbackImg from '../components/FallbackImg';

const commitments = [
  {
    title: '99.9% Platform Uptime',
    desc: 'SLA-backed availability across all managed platforms with real-time monitoring and incident response.',
    icon: Shield,
  },
  {
    title: '48-Hour Response Guarantee',
    desc: 'Critical issues addressed within 4 hours. Standard requests within 48. No exceptions.',
    icon: Clock,
  },
  {
    title: 'SOC 2 Compliant Processes',
    desc: 'Enterprise-grade security practices, data governance protocols, and regulatory compliance built into every engagement.',
    icon: Lock,
  },
  {
    title: 'Quarterly Strategic Reviews',
    desc: 'Data-driven performance reviews with actionable insights, ROI analysis, and roadmap adjustments.',
    icon: BarChart3,
  },
];

const capabilities = [
  {
    title: 'Digital Transformation',
    desc: 'End-to-end infrastructure modernization with measurable business outcomes.',
    icon: Zap,
  },
  {
    title: 'Business Intelligence',
    desc: 'Data strategy and analytics platforms that drive executive decision-making.',
    icon: TrendingUp,
  },
  {
    title: 'Platform Engineering',
    desc: 'Scalable architecture designed for high-availability enterprise workloads.',
    icon: Cog,
  },
  {
    title: 'Security & Compliance',
    desc: 'Regulatory adherence frameworks including SOC 2, GDPR, and industry-specific standards.',
    icon: Shield,
  },
  {
    title: 'Data Strategy',
    desc: 'Integration, governance, and analytics infrastructure for enterprise data ecosystems.',
    icon: Database,
  },
  {
    title: 'Growth Operations',
    desc: 'Revenue optimization through systematic performance measurement and continuous improvement.',
    icon: Target,
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Audit',
    desc: 'Comprehensive digital infrastructure assessment',
  },
  {
    number: '02',
    title: 'Strategy',
    desc: 'Prioritized roadmap with ROI projections',
  },
  {
    number: '03',
    title: 'Execute',
    desc: 'Precision implementation with milestone tracking',
  },
  {
    number: '04',
    title: 'Optimize',
    desc: 'Continuous improvement through data intelligence',
  },
];

export default function About() {
  useEffect(() => { document.title = 'Philosophy & Methodology — Three Seas Digital'; }, []);
  return (
    <div className="page">
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero-bg">
          <FallbackImg
            src="/images/about-hero.jpg"
            alt="Our Methodology"
          />
          <div className="hero-overlay" />
        </div>
        <div className="page-hero-content">
          <h1>The Philosophy</h1>
          <p>Precision-engineered digital solutions for enterprise scale</p>
        </div>
      </section>

      {/* Our Methodology */}
      <section className="section">
        <div className="container">
          <div className="about-story-grid">
            <div className="about-story-text">
              <h2>Our Methodology</h2>
              <p>
                Enterprises lose millions annually to fragmented digital infrastructure.
                We apply a systematic methodology to eliminate that friction — from audit
                through implementation to continuous optimization.
              </p>
              <p>
                Every engagement begins with a comprehensive digital audit. We map your
                current infrastructure, identify friction points, and deliver a prioritized
                roadmap with measurable ROI projections.
              </p>
              <p>
                Our approach combines technical precision with business intelligence,
                ensuring every solution delivers quantifiable value to stakeholders while
                maintaining institutional standards for security, compliance, and scale.
              </p>
            </div>
            <div className="about-story-image">
              <FallbackImg
                src="/images/about-team.jpg"
                alt="Enterprise methodology"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Commitments */}
      <section className="section values-section">
        <div className="container">
          <div className="section-header">
            <h2>Enterprise Commitments</h2>
            <p>SLA-backed guarantees for mission-critical operations</p>
          </div>
          <div className="values-grid">
            {commitments.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="value-card">
                  <div className="value-icon"><Icon size={32} /></div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Credentials & Capabilities */}
      <section className="section credentials-section">
        <div className="container">
          <div className="section-header">
            <h2>Credentials & Capabilities</h2>
            <p>Full-spectrum digital transformation for enterprise organizations</p>
          </div>
          <div className="capabilities-grid">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div key={cap.title} className="capability-card">
                  <div className="capability-icon"><Icon size={28} /></div>
                  <h3>{cap.title}</h3>
                  <p>{cap.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Process */}
      <section className="section process-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Process</h2>
            <p>A systematic approach to digital transformation</p>
          </div>
          <div className="process-steps">
            {processSteps.map((step, i) => (
              <div key={step.number} className="process-step">
                <div className="process-step-number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {i < processSteps.length - 1 && <div className="process-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>Begin Your Digital Audit</h2>
          <p>
            Identify infrastructure gaps, quantify ROI opportunities, and receive
            a prioritized roadmap tailored to your enterprise objectives.
          </p>
          <Link to="/contact" className="btn btn-primary btn-lg">
            Schedule Consultation <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
