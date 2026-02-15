import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb } from 'lucide-react';
import FallbackImg from '../components/FallbackImg';

const capabilities = [
  {
    id: 'starter',
    category: 'Digital Presence',
    title: 'High-Performance Web Properties',
    description: 'High-performance landing pages and web properties engineered for conversion. Sub-second load times, accessibility compliance, mobile-first architecture.',
    metrics: '< 1s load time | WCAG 2.1 AA | 99.9% uptime',
    path: '/portfolio/starter',
  },
  {
    id: 'business',
    category: 'Multi-Platform Solutions',
    title: 'Integrated Platform Ecosystems',
    description: 'Integrated multi-page platforms with content management, lead generation, and analytics infrastructure.',
    metrics: 'Full CMS | Analytics Suite | Lead Pipeline',
    path: '/portfolio/business',
  },
  {
    id: 'premium',
    category: 'Client Experience Platforms',
    title: 'White-Label Client Portals',
    description: 'White-label client portals with booking systems, document management, and real-time communication channels.',
    metrics: 'Booking Engine | Client Portal | Real-time Messaging',
    path: '/portfolio/premium',
  },
  {
    id: 'enterprise',
    category: 'Enterprise Intelligence Systems',
    title: 'Full-Scale Business Intelligence',
    description: 'Full-scale CRM and business intelligence dashboards with audit scoring, financial analytics, and intervention tracking.',
    metrics: 'BI Dashboard | Audit System | Financial Analytics',
    path: '/portfolio/enterprise',
  },
];

export default function Portfolio() {
  useEffect(() => { document.title = 'Capabilities — Three Seas Digital'; }, []);
  return (
    <div className="page">
      <section className="page-hero">
        <div className="page-hero-bg">
          <FallbackImg
            src="/images/portfolio-hero.jpg"
            alt="Capabilities"
          />
          <div className="hero-overlay" />
        </div>
        <div className="page-hero-content">
          <h1>Capabilities</h1>
          <p>End-to-end digital solutions engineered for enterprise performance</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="capabilities-grid">
            {capabilities.map((capability) => (
              <Link
                key={capability.id}
                to={capability.path}
                className="capability-card"
              >
                <div className="capability-category">{capability.category}</div>
                <h3 className="capability-title">{capability.title}</h3>
                <p className="capability-description">{capability.description}</p>
                <div className="capability-metrics">{capability.metrics}</div>
                <div className="capability-cta">
                  <span>Explore Demo</span>
                  <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>

          <div className="portfolio-bottom-cta">
            <div className="portfolio-cta-content">
              <Lightbulb size={28} />
              <div>
                <h3>Custom Solutions</h3>
                <p>Every enterprise has unique requirements. Our team architects bespoke digital platforms tailored to your specific infrastructure, compliance needs, and growth targets.</p>
              </div>
              <Link to="/contact" className="btn btn-primary">
                Discuss Your Requirements <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
