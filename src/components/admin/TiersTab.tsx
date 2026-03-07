import { Layers, Briefcase } from 'lucide-react';

export default function TiersTab() {
  const packages = [
    {
      name: 'Starter',
      color: '#9ca3af',
      description: 'Perfect for personal sites & small businesses getting online',
      total: '$800 - $1,500',
      components: [
        { name: 'Landing Page Design', price: '$300-500', desc: 'Single page with sections (hero, about, services, contact)' },
        { name: 'Mobile Responsive', price: '$150-200', desc: 'Optimized for all screen sizes' },
        { name: 'Contact Form', price: '$100-150', desc: 'Basic form with email notifications' },
        { name: 'Basic SEO Setup', price: '$100-150', desc: 'Meta tags, sitemap, Google indexing' },
        { name: 'Social Media Links', price: '$50', desc: 'Icons linking to your profiles' },
        { name: 'Google Analytics', price: '$100', desc: 'Traffic tracking setup' },
      ],
    },
    {
      name: 'Business',
      color: '#3b82f6',
      description: 'Full website for established businesses',
      total: '$2,500 - $5,000',
      components: [
        { name: 'Multi-Page Website (5-10 pages)', price: '$1,200-2,000', desc: 'Home, About, Services, Portfolio, Contact, etc.' },
        { name: 'Custom Design & Branding', price: '$500-800', desc: 'Unique look matching your brand identity' },
        { name: 'Mobile Responsive', price: '$200-300', desc: 'Tablet & mobile optimized' },
        { name: 'Contact Forms (Advanced)', price: '$150-250', desc: 'Multiple forms, file uploads, validation' },
        { name: 'Blog/News Section', price: '$300-500', desc: 'Post articles, categories, archive' },
        { name: 'SEO Optimization', price: '$200-400', desc: 'On-page SEO, schema markup, speed optimization' },
        { name: 'Social Media Integration', price: '$100-200', desc: 'Feeds, sharing buttons, embeds' },
        { name: 'Google Maps Integration', price: '$100', desc: 'Location map on contact page' },
        { name: 'Analytics Dashboard', price: '$150-250', desc: 'Google Analytics + basic reporting' },
      ],
    },
    {
      name: 'Premium',
      color: '#8b5cf6',
      description: 'Advanced features & custom functionality',
      total: '$5,000 - $12,000',
      components: [
        { name: 'Multi-Page Website (10-20 pages)', price: '$2,000-4,000', desc: 'Comprehensive site structure' },
        { name: 'Custom UI/UX Design', price: '$1,000-2,000', desc: 'User research, wireframes, prototypes' },
        { name: 'Content Management System (CMS)', price: '$800-1,500', desc: 'Edit content without code knowledge' },
        { name: 'User Authentication', price: '$500-1,000', desc: 'Login, registration, password reset' },
        { name: 'Client Portal/Dashboard', price: '$800-1,500', desc: 'Private area for clients to view info' },
        { name: 'Booking/Scheduling System', price: '$600-1,200', desc: 'Appointment booking with calendar' },
        { name: 'Payment Integration', price: '$500-800', desc: 'Stripe, PayPal, invoice generation' },
        { name: 'Email Marketing Integration', price: '$200-400', desc: 'Mailchimp, newsletters, automation' },
        { name: 'Advanced SEO', price: '$400-800', desc: 'Technical SEO, local SEO, content strategy' },
        { name: 'Performance Optimization', price: '$300-500', desc: 'Fast load times, caching, CDN setup' },
      ],
    },
    {
      name: 'Enterprise',
      color: '#f59e0b',
      description: 'Full custom web applications & complex solutions',
      total: '$12,000 - $50,000+',
      components: [
        { name: 'Custom Web Application', price: '$5,000-20,000', desc: 'Built from scratch to your specifications' },
        { name: 'Database Design & Setup', price: '$1,000-3,000', desc: 'Data modeling, relationships, optimization' },
        { name: 'API Development', price: '$2,000-5,000', desc: 'Custom APIs for integrations' },
        { name: 'Third-Party Integrations', price: '$500-2,000/each', desc: 'CRM, ERP, payment gateways, etc.' },
        { name: 'Admin Dashboard', price: '$2,000-5,000', desc: 'Full control panel for your business' },
        { name: 'Multi-User Roles & Permissions', price: '$800-1,500', desc: 'Admin, staff, client access levels' },
        { name: 'E-Commerce Platform', price: '$3,000-8,000', desc: 'Product catalog, cart, checkout, inventory' },
        { name: 'Real-Time Features', price: '$1,500-4,000', desc: 'Live chat, notifications, updates' },
        { name: 'Mobile App (React Native)', price: '$8,000-25,000', desc: 'iOS & Android from same codebase' },
        { name: 'Ongoing Support Package', price: '$500-2,000/mo', desc: 'Maintenance, updates, priority support' },
      ],
    },
  ];

  const getTotalRange = (components: { name: string; price: string; desc: string }[]) => {
    let min = 0; let max = 0;
    components.forEach((c) => {
      const match = c.price.match(/\$([0-9,]+)(?:-([0-9,]+))?/);
      if (match) {
        min += parseInt(match[1].replace(/,/g, ''), 10);
        max += parseInt((match[2] || match[1]).replace(/,/g, ''), 10);
      }
    });
    return { min, max };
  };

  return (
    <div className="tiers-tab">
      <div className="tiers-header">
        <h2><Layers size={20} /> Development Packages</h2>
        <p>One-time fees — you own the code. Customized to your needs.</p>
      </div>
      <div className="tiers-list">
        {packages.map((pkg) => {
          const range = getTotalRange(pkg.components);
          return (
            <div key={pkg.name} className="tier-package" style={{ borderLeftColor: pkg.color }}>
              <div className="tier-package-header">
                <div className="tier-package-title">
                  <span className="tier-dot" style={{ background: pkg.color }} />
                  <h3>{pkg.name}</h3>
                  <span className="tier-total">{pkg.total}</span>
                </div>
                <p className="tier-package-desc">{pkg.description}</p>
              </div>
              <div className="tier-components">
                <table className="tier-components-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Description</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pkg.components.map((comp, idx) => (
                      <tr key={idx}>
                        <td className="comp-name">{comp.name}</td>
                        <td className="comp-desc">{comp.desc}</td>
                        <td className="comp-price">{comp.price}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}><strong>Package Total (all components)</strong></td>
                      <td className="comp-price"><strong>${range.min.toLocaleString()} - ${range.max.toLocaleString()}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Featured Example */}
      <div className="tier-example">
        <div className="tier-example-header">
          <h3><Briefcase size={18} /> Example: CRM & Business Management System</h3>
          <span className="tier-example-badge" style={{ background: '#f59e0b' }}>Enterprise</span>
        </div>
        <p className="tier-example-desc">
          A complete business management platform like this admin dashboard — with client management,
          appointment scheduling, lead prospecting, sales pipeline, expense tracking, and analytics.
        </p>
        <div className="tier-example-breakdown">
          <table className="tier-components-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>What's Included</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="comp-name">Public Website</td>
                <td className="comp-desc">Home, About, Portfolio, Contact pages with responsive design</td>
                <td className="comp-price">$1,500</td>
              </tr>
              <tr>
                <td className="comp-name">Custom UI/UX Design</td>
                <td className="comp-desc">Dashboard layout, calendar views, data tables, forms</td>
                <td className="comp-price">$1,500</td>
              </tr>
              <tr>
                <td className="comp-name">User Authentication</td>
                <td className="comp-desc">Admin login + client registration with password reset</td>
                <td className="comp-price">$800</td>
              </tr>
              <tr>
                <td className="comp-name">Client Portal</td>
                <td className="comp-desc">Client dashboard, invoice viewing, project tracking</td>
                <td className="comp-price">$1,200</td>
              </tr>
              <tr>
                <td className="comp-name">Booking System</td>
                <td className="comp-desc">Appointment scheduling with calendar, confirmations</td>
                <td className="comp-price">$1,000</td>
              </tr>
              <tr>
                <td className="comp-name">Payment Integration</td>
                <td className="comp-desc">Stripe-ready checkout, invoice generation</td>
                <td className="comp-price">$600</td>
              </tr>
              <tr>
                <td className="comp-name">CRM Core System</td>
                <td className="comp-desc">Client database, notes, tags, VIP tracking, history</td>
                <td className="comp-price">$3,500</td>
              </tr>
              <tr>
                <td className="comp-name">Admin Dashboard</td>
                <td className="comp-desc">Multi-tab control panel, stats, quick actions</td>
                <td className="comp-price">$4,000</td>
              </tr>
              <tr>
                <td className="comp-name">Roles & Permissions</td>
                <td className="comp-desc">Admin, manager, staff, client access levels</td>
                <td className="comp-price">$1,200</td>
              </tr>
              <tr>
                <td className="comp-name">Database Architecture</td>
                <td className="comp-desc">7 data models with relationships and persistence</td>
                <td className="comp-price">$2,000</td>
              </tr>
              <tr>
                <td className="comp-name">Lead Prospecting</td>
                <td className="comp-desc">Address search, OSM/Overpass API, manual entry, pipeline</td>
                <td className="comp-price">$2,000</td>
              </tr>
              <tr>
                <td className="comp-name">Sales Pipeline</td>
                <td className="comp-desc">Lead → Follow-Up → Pipeline → Client workflow</td>
                <td className="comp-price">$1,800</td>
              </tr>
              <tr>
                <td className="comp-name">Follow-Up Tracker</td>
                <td className="comp-desc">Call scheduling, notes, status tracking, archiving</td>
                <td className="comp-price">$1,200</td>
              </tr>
              <tr>
                <td className="comp-name">Expense Tracking</td>
                <td className="comp-desc">Categories, receipt uploads, filtering, summaries</td>
                <td className="comp-price">$1,000</td>
              </tr>
              <tr>
                <td className="comp-name">Analytics Dashboard</td>
                <td className="comp-desc">Revenue charts, P&L, monthly trends, projections</td>
                <td className="comp-price">$1,500</td>
              </tr>
              <tr>
                <td className="comp-name">Third-Party Integration</td>
                <td className="comp-desc">OpenStreetMap/Overpass API for business search</td>
                <td className="comp-price">$800</td>
              </tr>
              <tr>
                <td className="comp-name">Business Database</td>
                <td className="comp-desc">Intel storage, enrichment forms, lookup links, archiving</td>
                <td className="comp-price">$1,200</td>
              </tr>
              <tr>
                <td className="comp-name">Client Approval Workflow</td>
                <td className="comp-desc">Pending registration, admin approval, rejection flow</td>
                <td className="comp-price">$600</td>
              </tr>
              <tr>
                <td className="comp-name">Market Research Dashboard</td>
                <td className="comp-desc">Census API demographics, population, income, charts, saved research</td>
                <td className="comp-price">$2,500</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}><strong>Total Project Value</strong></td>
                <td className="comp-price"><strong>$29,900</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="tiers-note">
        <p><strong>Note:</strong> Prices are estimates. Final quote depends on project complexity and customization. All projects include source code ownership and deployment assistance.</p>
      </div>
    </div>
  );
}
