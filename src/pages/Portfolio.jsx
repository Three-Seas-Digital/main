import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Layers, ArrowRight, Check, Star } from 'lucide-react';
import FallbackImg from '../components/FallbackImg';

const tiers = [
  {
    id: 'starter',
    name: 'Starter',
    color: '#9ca3af',
    tagline: 'Perfect for getting online fast',
    demo: 'Coastal Coffee',
    demoDesc: 'A charming single-page site for a local coffee shop',
    features: ['Landing Page', 'Mobile Responsive', 'Contact Form', 'Basic SEO', 'Social Links', 'Analytics'],
    img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop',
  },
  {
    id: 'business',
    name: 'Business',
    color: '#3b82f6',
    tagline: 'Full website for established businesses',
    demo: 'Summit Law Group',
    demoDesc: 'A professional multi-page site for a law firm',
    features: ['Multi-Page (5-10)', 'Custom Branding', 'Blog/News', 'Advanced SEO', 'Social Integration', 'Maps'],
    img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop',
  },
  {
    id: 'premium',
    name: 'Premium',
    color: '#8b5cf6',
    tagline: 'Advanced features & custom functionality',
    demo: 'Bella Spa & Wellness',
    demoDesc: 'A spa with booking system and client portal',
    features: ['CMS', 'User Auth', 'Client Portal', 'Booking System', 'Payments', 'Email Marketing'],
    img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=400&fit=crop',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    color: '#f59e0b',
    tagline: 'Full custom web applications',
    demo: 'Apex Logistics CRM',
    demoDesc: 'A complete business management system',
    features: ['Custom Web App', 'Database', 'API', 'Admin Dashboard', 'Multi-User Roles', 'Real-Time'],
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
  },
];

export default function Portfolio() {
  useEffect(() => { document.title = 'Portfolio — Three Seas Digital'; }, []);
  return (
    <div className="page">
      <section className="page-hero">
        <div className="page-hero-bg">
          <FallbackImg
            src="https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1920&h=600&fit=crop"
            alt="Portfolio"
          />
          <div className="hero-overlay" />
        </div>
        <div className="page-hero-content">
          <h1>Our Portfolio</h1>
          <p>Live demos showcasing what we build at every tier</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="portfolio-intro">
            <Layers size={32} className="portfolio-intro-icon" />
            <h2>Choose Your Tier</h2>
            <p>Each showcase is a fully-functional demo of the features included in that package. Click to explore and see exactly what you'll get.</p>
          </div>

          <div className="portfolio-tiers-grid">
            {tiers.map((tier) => (
              <Link
                key={tier.id}
                to={`/portfolio/${tier.id}`}
                className="portfolio-tier-card"
                style={{ '--tier-color': tier.color }}
              >
                <div className="portfolio-tier-badge" style={{ background: tier.color }}>
                  {tier.name}
                </div>
                <div className="portfolio-tier-image">
                  <FallbackImg src={tier.img} alt={tier.demo} />
                  <div className="portfolio-tier-overlay">
                    <ExternalLink size={24} />
                    <span>View Demo</span>
                  </div>
                </div>
                <div className="portfolio-tier-content">
                  <h3>{tier.demo}</h3>
                  <p className="portfolio-tier-tagline">{tier.tagline}</p>
                  <p className="portfolio-tier-desc">{tier.demoDesc}</p>
                  <div className="portfolio-tier-features">
                    {tier.features.slice(0, 4).map((f) => (
                      <span key={f} className="portfolio-tier-feature">
                        <Check size={12} /> {f}
                      </span>
                    ))}
                    {tier.features.length > 4 && (
                      <span className="portfolio-tier-more">+{tier.features.length - 4} more</span>
                    )}
                  </div>
                  <div className="portfolio-tier-cta">
                    <span>Explore Demo</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="portfolio-bottom-cta">
            <div className="portfolio-cta-content">
              <Star size={24} />
              <div>
                <h3>Not sure which tier fits your needs?</h3>
                <p>Let's discuss your project and find the perfect solution</p>
              </div>
              <Link to="/contact" className="btn btn-primary">
                Get a Custom Quote <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
