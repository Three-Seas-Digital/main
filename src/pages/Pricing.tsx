import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Check, ArrowLeft, Sparkles, ArrowRight,
  Code, Smartphone, Headphones, RefreshCw, Shield, Building2
} from 'lucide-react';
import LighthouseBeam from '../components/LighthouseBeam';
import '../styles/pricing.css';

const TIERS = [
  {
    name: 'Starter',
    price: '$499 – $799',
    color: '#6b7280',
    description: 'Single-page landing sites built for speed and conversion.',
    features: [
      'Full source code',
      'Responsive mobile-first design',
      'SEO-optimized markup',
      '30-day email support',
      'One revision round',
    ],
  },
  {
    name: 'Business',
    price: '$1,499 – $2,499',
    color: '#22d3ee',
    popular: true,
    description: 'Multi-page sites with CMS, lead capture, and integrations.',
    features: [
      'Full source code',
      'Responsive design',
      'CMS integration',
      'Lead capture forms',
      '6-month priority support',
      'Free updates for 1 year',
      'Three revision rounds',
    ],
  },
  {
    name: 'Premium',
    price: '$2,999 – $4,499',
    color: '#c084fc',
    description: 'Booking engines, client portals, and payment processing.',
    features: [
      'Full source code + CMS integration',
      'Responsive design',
      'Booking / payment system',
      'Client portal',
      '1-year priority support',
      'Lifetime updates',
      'Commercial license',
      'Unlimited revisions',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    color: '#c8a43e',
    description: 'Full CRM dashboards, BI analytics, and custom solutions.',
    features: [
      'Custom architecture',
      'BI dashboards & analytics',
      'CRM integration',
      'API development',
      'Dedicated project manager',
      'SLA-backed support',
      'Commercial license',
      'Ongoing maintenance plans',
    ],
    cta: 'Book Consultation',
    ctaLink: '/contact',
  },
];

export default function Pricing() {
  useEffect(() => {
    document.title = 'Pricing — Three Seas Digital';
  }, []);

  return (
    <div className="pricing-page">
      <div className="pricing-bg">
        <div className="pricing-gradient" />
        <LighthouseBeam originX={0.5} originY={0.2} />
      </div>

      <Link to="/templates" className="pricing-back">
        <ArrowLeft size={18} />
        Back to Templates
      </Link>

      <div className="pricing-container">
        <div className="pricing-header-section">
          <h1>Template Pricing by Tier</h1>
          <p>Every template is a one-time purchase. Pick the tier that fits your project, then choose a template.</p>
        </div>

        <div className="pricing-grid">
          {TIERS.map((tier) => (
            <div key={tier.name} className={`pricing-card ${tier.popular ? 'pricing-card--popular' : ''}`}>
              {tier.popular && (
                <div className="pricing-popular-badge">
                  <Sparkles size={14} />
                  Most Popular
                </div>
              )}
              <div className="pricing-header">
                <h3 className="pricing-name" style={{ color: tier.color }}>{tier.name}</h3>
                <p className="pricing-desc">{tier.description}</p>
              </div>

              <div className="pricing-amount">
                <span className="pricing-number" style={{ fontSize: tier.name === 'Enterprise' ? '1.8rem' : undefined }}>
                  {tier.price}
                </span>
                {tier.name !== 'Enterprise' && <span className="pricing-period">per template</span>}
              </div>

              <ul className="pricing-features">
                {tier.features.map((feature, i) => (
                  <li key={i}>
                    <Check size={18} style={{ color: tier.color }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={tier.ctaLink || '/templates'}
                className={`pricing-btn pricing-btn--${tier.name.toLowerCase()}`}
                style={{ backgroundColor: tier.color, color: tier.name === 'Starter' ? '#fff' : undefined }}
              >
                {tier.cta || 'Browse Templates'}
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="pricing-trust">
          <div className="pricing-trust-item">
            <Shield size={20} />
            <span>Secure Checkout</span>
          </div>
          <div className="pricing-trust-item">
            <RefreshCw size={20} />
            <span>30-Day Money Back</span>
          </div>
          <div className="pricing-trust-item">
            <Code size={20} />
            <span>Full Source Code</span>
          </div>
        </div>

        {/* FAQ */}
        <div className="pricing-faq">
          <h3>Frequently Asked Questions</h3>
          <div className="pricing-faq-grid">
            <div className="pricing-faq-item">
              <h4>Is this a one-time payment?</h4>
              <p>Yes. Each template is a one-time purchase — no subscriptions or recurring fees.</p>
            </div>
            <div className="pricing-faq-item">
              <h4>Can I use templates commercially?</h4>
              <p>Premium and Enterprise templates include a commercial license. Starter and Business are for single-site use.</p>
            </div>
            <div className="pricing-faq-item">
              <h4>Do you offer refunds?</h4>
              <p>We offer a 30-day money-back guarantee if you're not satisfied with your purchase.</p>
            </div>
            <div className="pricing-faq-item">
              <h4>What about Enterprise pricing?</h4>
              <p>Enterprise templates are custom-scoped. Book a consultation and we'll provide a tailored quote.</p>
            </div>
          </div>
        </div>

        <div className="pricing-cta">
          <p>Have questions? <Link to="/contact">Contact us</Link></p>
        </div>
      </div>
    </div>
  );
}
