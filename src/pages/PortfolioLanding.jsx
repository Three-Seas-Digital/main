import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Phone, Mail, MapPin, Clock, Star, Check,
  Facebook, Instagram, Twitter, Coffee, Heart, Menu, X, Send,
  ChevronRight, ChevronDown, Users, FileText, Calendar, Shield,
  Award, Briefcase, Scale, BookOpen, MessageSquare, Play,
  Sparkles, Leaf, Droplet, Sun, Moon, CalendarDays, User, Lock,
  CreditCard, CheckCircle, Bell, Settings, Home, Package, Truck,
  BarChart3, TrendingUp, DollarSign, Activity, Database, Globe,
  Layers, Zap, PieChart, Target, Search, Filter, Plus, Edit3, Trash2,
  Eye, Download, Upload, RefreshCw, AlertCircle, UserCheck, PhoneCall
} from 'lucide-react';

/* ==========================================================
   STARTER TIER - COASTAL COFFEE
   Single-page landing for a local coffee shop
   Demonstrates: Landing page, responsive, contact form, social
   ========================================================== */
export function StarterShowcase() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="demo-starter">
      <div className="demo-back-bar">
        <Link to="/portfolio" className="demo-back-link"><ArrowLeft size={16} /> Back to Portfolio</Link>
        <span className="demo-tier-label">Starter Demo</span>
      </div>

      {/* HEADER */}
      <header className="starter-header">
        <div className="starter-container">
          <div className="starter-logo">
            <Coffee size={28} />
            <span>Coastal Coffee</span>
          </div>
          <nav className={`starter-nav ${menuOpen ? 'open' : ''}`}>
            <a href="#about">About</a>
            <a href="#menu">Menu</a>
            <a href="#hours">Hours</a>
            <a href="#contact">Contact</a>
          </nav>
          <button className="starter-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="starter-hero">
        <div className="starter-hero-bg">
          <img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1920&h=800&fit=crop" alt="Coffee" />
          <div className="starter-hero-overlay" />
        </div>
        <div className="starter-hero-content">
          <h1>Brewed with <Heart size={32} className="starter-heart" /> by the Sea</h1>
          <p>Artisan coffee, fresh pastries, and ocean views since 2019</p>
          <a href="#menu" className="starter-btn-primary">View Our Menu</a>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="starter-about">
        <div className="starter-container">
          <div className="starter-about-grid">
            <div className="starter-about-image">
              <img src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&h=400&fit=crop" alt="Barista" />
            </div>
            <div className="starter-about-content">
              <h2>Our Story</h2>
              <p>Coastal Coffee was born from a love of great coffee and the ocean breeze. Located just steps from the boardwalk, we source beans from sustainable farms and roast them in-house every morning.</p>
              <p>Whether you're grabbing a quick espresso before work or settling in with a book on a lazy Sunday, we're here to make your day a little brighter.</p>
              <div className="starter-features">
                <div className="starter-feature"><Check size={16} /> Locally Roasted</div>
                <div className="starter-feature"><Check size={16} /> Organic Options</div>
                <div className="starter-feature"><Check size={16} /> Fresh Daily</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MENU HIGHLIGHTS */}
      <section id="menu" className="starter-menu">
        <div className="starter-container">
          <h2>Menu Highlights</h2>
          <div className="starter-menu-grid">
            {[
              { name: 'Sunrise Latte', price: '$5.50', desc: 'Espresso, oat milk, vanilla, turmeric', img: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=300&fit=crop' },
              { name: 'Cold Brew', price: '$4.50', desc: '24-hour steeped, smooth & bold', img: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=300&h=300&fit=crop' },
              { name: 'Avocado Toast', price: '$9.00', desc: 'Sourdough, avocado, poached egg, everything seasoning', img: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=300&h=300&fit=crop' },
              { name: 'Blueberry Muffin', price: '$3.50', desc: 'Baked fresh every morning', img: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&h=300&fit=crop' },
            ].map((item) => (
              <div key={item.name} className="starter-menu-item">
                <img src={item.img} alt={item.name} />
                <div className="starter-menu-info">
                  <h3>{item.name}</h3>
                  <p>{item.desc}</p>
                  <span className="starter-price">{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOURS & LOCATION */}
      <section id="hours" className="starter-hours">
        <div className="starter-container">
          <div className="starter-hours-grid">
            <div className="starter-hours-info">
              <h2>Hours & Location</h2>
              <div className="starter-hours-list">
                <div><Clock size={18} /> <strong>Mon-Fri:</strong> 6am - 6pm</div>
                <div><Clock size={18} /> <strong>Sat-Sun:</strong> 7am - 7pm</div>
              </div>
              <div className="starter-location">
                <MapPin size={18} /> 123 Oceanfront Drive, Santa Monica, CA 90401
              </div>
              <div className="starter-phone">
                <Phone size={18} /> (310) 555-BREW
              </div>
            </div>
            <div className="starter-map">
              <iframe
                src="https://www.openstreetmap.org/export/embed.html?bbox=-118.52%2C33.99%2C-118.46%2C34.03&layer=mapnik"
                title="Location Map"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section id="contact" className="starter-contact">
        <div className="starter-container">
          <h2>Get in Touch</h2>
          <p>Questions about catering or events? Drop us a line!</p>
          {submitted ? (
            <div className="starter-success">
              <CheckCircle size={24} /> Thanks! We'll get back to you soon.
            </div>
          ) : (
            <form className="starter-form" onSubmit={handleSubmit}>
              <input type="text" placeholder="Your Name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <input type="email" placeholder="Your Email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <textarea placeholder="Your Message" rows={4} required value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
              <button type="submit" className="starter-btn-primary"><Send size={16} /> Send Message</button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="starter-footer">
        <div className="starter-container">
          <div className="starter-footer-grid">
            <div className="starter-footer-brand">
              <div className="starter-logo"><Coffee size={24} /> Coastal Coffee</div>
              <p>Your neighborhood coffee spot by the sea.</p>
            </div>
            <div className="starter-footer-social">
              <span>Follow Us</span>
              <div className="starter-social-links">
                <a href="#"><Facebook size={20} /></a>
                <a href="#"><Instagram size={20} /></a>
                <a href="#"><Twitter size={20} /></a>
              </div>
            </div>
          </div>
          <div className="starter-footer-bottom">
            © {new Date().getFullYear()} Coastal Coffee. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}

/* ==========================================================
   BUSINESS TIER - SUMMIT LAW GROUP
   Multi-page site for a law firm
   Demonstrates: Multi-page, blog, custom branding, advanced SEO
   ========================================================== */
export function BusinessShowcase() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const practiceAreas = [
    { icon: <Briefcase size={24} />, name: 'Business Law', desc: 'Entity formation, contracts, M&A, compliance' },
    { icon: <Users size={24} />, name: 'Employment Law', desc: 'HR policies, disputes, workplace regulations' },
    { icon: <Home size={24} />, name: 'Real Estate', desc: 'Commercial leases, purchases, zoning' },
    { icon: <Shield size={24} />, name: 'Litigation', desc: 'Civil disputes, arbitration, mediation' },
  ];

  const attorneys = [
    { name: 'Sarah Mitchell', title: 'Managing Partner', specialty: 'Business Law', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop' },
    { name: 'James Chen', title: 'Senior Partner', specialty: 'Litigation', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop' },
    { name: 'Emily Rodriguez', title: 'Partner', specialty: 'Employment Law', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop' },
  ];

  const blogPosts = [
    { title: '5 Contract Clauses Every Business Needs', date: 'Jan 15, 2024', category: 'Business', excerpt: 'Protect your business with these essential contract provisions...' },
    { title: 'Employment Law Update: 2024 Changes', date: 'Jan 10, 2024', category: 'Employment', excerpt: 'New regulations affecting California employers this year...' },
    { title: 'Commercial Lease Negotiation Tips', date: 'Jan 5, 2024', category: 'Real Estate', excerpt: 'Key points to negotiate before signing your next lease...' },
  ];

  const faqs = [
    { q: 'How much does a consultation cost?', a: 'We offer a free 30-minute initial consultation for new clients.' },
    { q: 'What areas do you serve?', a: 'We serve clients throughout California with offices in Los Angeles and San Francisco.' },
    { q: 'Do you offer payment plans?', a: 'Yes, we offer flexible payment options for qualified clients.' },
  ];

  return (
    <div className="demo-business">
      <div className="demo-back-bar">
        <Link to="/portfolio" className="demo-back-link"><ArrowLeft size={16} /> Back to Portfolio</Link>
        <span className="demo-tier-label">Business Demo</span>
      </div>

      {/* HEADER */}
      <header className="business-header">
        <div className="business-topbar">
          <div className="business-container">
            <span><Phone size={14} /> (800) 555-LAW1</span>
            <span><Mail size={14} /> info@summitlaw.com</span>
            <span><Clock size={14} /> Mon-Fri 9am-6pm</span>
          </div>
        </div>
        <nav className="business-nav">
          <div className="business-container">
            <div className="business-logo">
              <Scale size={28} />
              <div>
                <strong>SUMMIT</strong>
                <span>LAW GROUP</span>
              </div>
            </div>
            <div className="business-nav-links">
              <a href="#about">About</a>
              <a href="#practice">Practice Areas</a>
              <a href="#team">Our Team</a>
              <a href="#blog">Insights</a>
              <a href="#contact" className="business-btn-nav">Free Consultation</a>
            </div>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="business-hero">
        <div className="business-hero-bg">
          <img src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&h=700&fit=crop" alt="Law Office" />
          <div className="business-hero-overlay" />
        </div>
        <div className="business-hero-content">
          <div className="business-container">
            <span className="business-hero-label">Trusted Legal Counsel Since 1995</span>
            <h1>Strategic Solutions for Complex Legal Challenges</h1>
            <p>Protecting businesses and individuals with experienced, results-driven representation</p>
            <div className="business-hero-btns">
              <a href="#contact" className="business-btn-primary">Schedule Consultation</a>
              <a href="#practice" className="business-btn-secondary">Our Services</a>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST INDICATORS */}
      <section className="business-trust">
        <div className="business-container">
          <div className="business-trust-grid">
            <div className="business-trust-item">
              <strong>500+</strong>
              <span>Cases Won</span>
            </div>
            <div className="business-trust-item">
              <strong>29</strong>
              <span>Years Experience</span>
            </div>
            <div className="business-trust-item">
              <strong>4.9</strong>
              <span>Client Rating</span>
            </div>
            <div className="business-trust-item">
              <Award size={24} />
              <span>Super Lawyers 2024</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRACTICE AREAS */}
      <section id="practice" className="business-practice">
        <div className="business-container">
          <h2>Practice Areas</h2>
          <p className="business-section-sub">Comprehensive legal services for businesses and individuals</p>
          <div className="business-practice-grid">
            {practiceAreas.map((area) => (
              <div key={area.name} className="business-practice-card">
                <div className="business-practice-icon">{area.icon}</div>
                <h3>{area.name}</h3>
                <p>{area.desc}</p>
                <a href="#contact" className="business-link">Learn More <ChevronRight size={14} /></a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section id="team" className="business-team">
        <div className="business-container">
          <h2>Our Attorneys</h2>
          <p className="business-section-sub">Experienced advocates committed to your success</p>
          <div className="business-team-grid">
            {attorneys.map((att) => (
              <div key={att.name} className="business-team-card">
                <img src={att.img} alt={att.name} />
                <h3>{att.name}</h3>
                <span className="business-team-title">{att.title}</span>
                <span className="business-team-specialty">{att.specialty}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG / INSIGHTS */}
      <section id="blog" className="business-blog">
        <div className="business-container">
          <div className="business-blog-header">
            <div>
              <h2>Legal Insights</h2>
              <p>Stay informed with our latest articles and updates</p>
            </div>
            <a href="#" className="business-btn-secondary">View All Articles</a>
          </div>
          <div className="business-blog-grid">
            {blogPosts.map((post) => (
              <article key={post.title} className="business-blog-card">
                <span className="business-blog-cat">{post.category}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="business-blog-meta">
                  <span>{post.date}</span>
                  <a href="#">Read More <ChevronRight size={14} /></a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="business-faq">
        <div className="business-container">
          <h2>Frequently Asked Questions</h2>
          <div className="business-faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`business-faq-item ${expandedFaq === i ? 'expanded' : ''}`}>
                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <ChevronDown size={18} />
                </button>
                {expandedFaq === i && <p>{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section id="contact" className="business-contact">
        <div className="business-container">
          <div className="business-contact-grid">
            <div className="business-contact-info">
              <h2>Schedule Your Free Consultation</h2>
              <p>Take the first step toward resolving your legal matters. Our team is ready to help.</p>
              <div className="business-contact-details">
                <div><Phone size={18} /> (800) 555-LAW1</div>
                <div><Mail size={18} /> info@summitlaw.com</div>
                <div><MapPin size={18} /> 1000 Wilshire Blvd, Suite 500<br />Los Angeles, CA 90017</div>
              </div>
            </div>
            <form className="business-contact-form">
              <div className="business-form-row">
                <input type="text" placeholder="First Name" required />
                <input type="text" placeholder="Last Name" required />
              </div>
              <input type="email" placeholder="Email Address" required />
              <input type="tel" placeholder="Phone Number" />
              <select>
                <option value="">Select Practice Area</option>
                <option>Business Law</option>
                <option>Employment Law</option>
                <option>Real Estate</option>
                <option>Litigation</option>
              </select>
              <textarea placeholder="Briefly describe your legal matter..." rows={4} />
              <button type="submit" className="business-btn-primary">Request Consultation</button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="business-footer">
        <div className="business-container">
          <div className="business-footer-grid">
            <div className="business-footer-brand">
              <div className="business-logo">
                <Scale size={24} />
                <div><strong>SUMMIT</strong><span>LAW GROUP</span></div>
              </div>
              <p>Providing exceptional legal services to businesses and individuals throughout California.</p>
            </div>
            <div className="business-footer-links">
              <h4>Practice Areas</h4>
              <a href="#">Business Law</a>
              <a href="#">Employment Law</a>
              <a href="#">Real Estate</a>
              <a href="#">Litigation</a>
            </div>
            <div className="business-footer-links">
              <h4>Resources</h4>
              <a href="#">Blog</a>
              <a href="#">FAQs</a>
              <a href="#">Client Portal</a>
              <a href="#">Careers</a>
            </div>
            <div className="business-footer-contact">
              <h4>Contact</h4>
              <p>(800) 555-LAW1</p>
              <p>info@summitlaw.com</p>
              <div className="business-social">
                <a href="#"><Facebook size={18} /></a>
                <a href="#"><Twitter size={18} /></a>
                <a href="#"><Instagram size={18} /></a>
              </div>
            </div>
          </div>
          <div className="business-footer-bottom">
            <p>© 2024 Summit Law Group. All rights reserved. | <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
          </div>
        </div>
      </footer>

    </div>
  );
}

/* ==========================================================
   PREMIUM TIER - BELLA SPA & WELLNESS
   Spa with booking system and client portal
   Demonstrates: CMS, auth, client portal, booking, payments
   ========================================================== */
export function PremiumShowcase() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [view, setView] = useState('public'); // 'public' | 'booking' | 'portal'
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const services = [
    { id: 1, name: 'Swedish Massage', duration: '60 min', price: 95, category: 'Massage' },
    { id: 2, name: 'Deep Tissue Massage', duration: '60 min', price: 115, category: 'Massage' },
    { id: 3, name: 'Signature Facial', duration: '75 min', price: 125, category: 'Facial' },
    { id: 4, name: 'Hot Stone Therapy', duration: '90 min', price: 145, category: 'Massage' },
    { id: 5, name: 'Aromatherapy Package', duration: '120 min', price: 195, category: 'Package' },
  ];

  const times = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '5:00 PM'];
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const upcomingAppts = [
    { service: 'Swedish Massage', date: 'Feb 15, 2024', time: '2:00 PM', therapist: 'Anna K.' },
    { service: 'Signature Facial', date: 'Feb 28, 2024', time: '10:30 AM', therapist: 'Maria L.' },
  ];

  return (
    <div className="demo-premium">
      <div className="demo-back-bar">
        <Link to="/portfolio" className="demo-back-link"><ArrowLeft size={16} /> Back to Portfolio</Link>
        <span className="demo-tier-label">Premium Demo</span>
      </div>

      {/* VIEW SWITCHER */}
      <div className="premium-view-switch">
        <button className={view === 'public' ? 'active' : ''} onClick={() => setView('public')}>
          <Globe size={16} /> Public Site
        </button>
        <button className={view === 'booking' ? 'active' : ''} onClick={() => setView('booking')}>
          <CalendarDays size={16} /> Book Appointment
        </button>
        <button className={view === 'portal' ? 'active' : ''} onClick={() => { setView('portal'); setIsLoggedIn(true); }}>
          <User size={16} /> Client Portal
        </button>
      </div>

      {/* PUBLIC SITE VIEW */}
      {view === 'public' && (
        <>
          <header className="premium-header">
            <div className="premium-container">
              <div className="premium-logo">
                <Sparkles size={24} />
                <span>Bella Spa</span>
              </div>
              <nav className="premium-nav">
                <a href="#services">Services</a>
                <a href="#about">About</a>
                <a href="#gallery">Gallery</a>
                <button onClick={() => setView('booking')} className="premium-btn-book">Book Now</button>
                <button onClick={() => { setView('portal'); setIsLoggedIn(true); }} className="premium-btn-login"><User size={16} /></button>
              </nav>
            </div>
          </header>

          <section className="premium-hero">
            <div className="premium-hero-bg">
              <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&h=700&fit=crop" alt="Spa" />
              <div className="premium-hero-overlay" />
            </div>
            <div className="premium-hero-content">
              <span className="premium-hero-tag">Luxury Wellness Experience</span>
              <h1>Restore. Renew. Revive.</h1>
              <p>Escape the everyday and indulge in tranquility</p>
              <button onClick={() => setView('booking')} className="premium-btn-primary">Book Your Experience</button>
            </div>
          </section>

          <section id="services" className="premium-services">
            <div className="premium-container">
              <h2>Our Services</h2>
              <div className="premium-services-grid">
                {services.map((s) => (
                  <div key={s.id} className="premium-service-card">
                    <div className="premium-service-header">
                      <h3>{s.name}</h3>
                      <span className="premium-service-cat">{s.category}</span>
                    </div>
                    <div className="premium-service-details">
                      <span><Clock size={14} /> {s.duration}</span>
                      <span className="premium-service-price">${s.price}</span>
                    </div>
                    <button onClick={() => { setSelectedService(s); setView('booking'); }} className="premium-btn-secondary">
                      Book Now <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="premium-features-section">
            <div className="premium-container">
              <div className="premium-features-grid">
                <div className="premium-feature-item">
                  <Leaf size={32} />
                  <h3>Natural Products</h3>
                  <p>100% organic, sustainably sourced ingredients</p>
                </div>
                <div className="premium-feature-item">
                  <Award size={32} />
                  <h3>Expert Therapists</h3>
                  <p>Certified professionals with 10+ years experience</p>
                </div>
                <div className="premium-feature-item">
                  <Droplet size={32} />
                  <h3>Hydrotherapy</h3>
                  <p>State-of-the-art water therapy facilities</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* BOOKING VIEW */}
      {view === 'booking' && (
        <div className="premium-booking">
          <div className="premium-container">
            <button className="premium-back-btn" onClick={() => setView('public')}>
              <ArrowLeft size={16} /> Back to Site
            </button>
            <div className="premium-booking-header">
              <h1>Book Your Appointment</h1>
              <p>Select a service, date, and time to schedule your visit</p>
            </div>

            <div className="premium-booking-steps">
              {/* Step 1: Service */}
              <div className="premium-booking-step">
                <h3><span className="step-num">1</span> Select Service</h3>
                <div className="premium-service-list">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      className={`premium-service-option ${selectedService?.id === s.id ? 'selected' : ''}`}
                      onClick={() => setSelectedService(s)}
                    >
                      <div>
                        <strong>{s.name}</strong>
                        <span>{s.duration}</span>
                      </div>
                      <span className="premium-option-price">${s.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Date */}
              {selectedService && (
                <div className="premium-booking-step">
                  <h3><span className="step-num">2</span> Select Date</h3>
                  <div className="premium-date-grid">
                    {dates.map((d) => (
                      <button
                        key={d.toISOString()}
                        className={`premium-date-option ${selectedDate?.toDateString() === d.toDateString() ? 'selected' : ''}`}
                        onClick={() => setSelectedDate(d)}
                      >
                        <span className="date-day">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="date-num">{d.getDate()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Time */}
              {selectedDate && (
                <div className="premium-booking-step">
                  <h3><span className="step-num">3</span> Select Time</h3>
                  <div className="premium-time-grid">
                    {times.map((t) => (
                      <button
                        key={t}
                        className={`premium-time-option ${selectedTime === t ? 'selected' : ''}`}
                        onClick={() => setSelectedTime(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary & Checkout */}
              {selectedTime && (
                <div className="premium-booking-summary">
                  <h3>Booking Summary</h3>
                  <div className="premium-summary-details">
                    <div><strong>Service:</strong> {selectedService.name}</div>
                    <div><strong>Duration:</strong> {selectedService.duration}</div>
                    <div><strong>Date:</strong> {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                    <div><strong>Time:</strong> {selectedTime}</div>
                    <div className="premium-summary-total"><strong>Total:</strong> ${selectedService.price}</div>
                  </div>
                  <div className="premium-payment">
                    <h4><CreditCard size={18} /> Payment Details</h4>
                    <input type="text" placeholder="Card Number" />
                    <div className="premium-payment-row">
                      <input type="text" placeholder="MM/YY" />
                      <input type="text" placeholder="CVC" />
                    </div>
                    <button className="premium-btn-primary premium-btn-pay">
                      <Lock size={16} /> Pay ${selectedService.price} & Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CLIENT PORTAL VIEW */}
      {view === 'portal' && (
        <div className="premium-portal">
          <aside className="premium-portal-sidebar">
            <div className="premium-portal-logo">
              <Sparkles size={24} />
              <span>Bella Spa</span>
            </div>
            <nav className="premium-portal-nav">
              <a href="#" className="active"><Home size={18} /> Dashboard</a>
              <a href="#"><CalendarDays size={18} /> Appointments</a>
              <a href="#"><CreditCard size={18} /> Payments</a>
              <a href="#"><Heart size={18} /> Favorites</a>
              <a href="#"><Settings size={18} /> Settings</a>
            </nav>
            <button className="premium-portal-logout" onClick={() => setView('public')}>
              <ArrowLeft size={16} /> Exit Portal
            </button>
          </aside>
          <main className="premium-portal-main">
            <header className="premium-portal-header">
              <div>
                <h1>Welcome back, Jessica!</h1>
                <p>Manage your appointments and wellness journey</p>
              </div>
              <div className="premium-portal-user">
                <Bell size={20} />
                <div className="premium-avatar">JD</div>
              </div>
            </header>

            <div className="premium-portal-grid">
              <div className="premium-portal-card premium-portal-welcome">
                <h2>Your Next Appointment</h2>
                {upcomingAppts[0] && (
                  <div className="premium-next-appt">
                    <div className="premium-appt-icon"><CalendarDays size={32} /></div>
                    <div className="premium-appt-details">
                      <strong>{upcomingAppts[0].service}</strong>
                      <span>{upcomingAppts[0].date} at {upcomingAppts[0].time}</span>
                      <span>with {upcomingAppts[0].therapist}</span>
                    </div>
                    <button className="premium-btn-secondary">Reschedule</button>
                  </div>
                )}
              </div>

              <div className="premium-portal-card">
                <h3>Quick Actions</h3>
                <div className="premium-quick-actions">
                  <button onClick={() => setView('booking')}><Plus size={18} /> Book New</button>
                  <button><Gift size={18} /> Buy Gift Card</button>
                  <button><Star size={18} /> Refer a Friend</button>
                </div>
              </div>

              <div className="premium-portal-card premium-portal-appointments">
                <h3>Upcoming Appointments</h3>
                <div className="premium-appt-list">
                  {upcomingAppts.map((appt, i) => (
                    <div key={i} className="premium-appt-item">
                      <div className="premium-appt-date-badge">
                        <span>{appt.date.split(' ')[0]}</span>
                        <strong>{appt.date.split(' ')[1].replace(',', '')}</strong>
                      </div>
                      <div className="premium-appt-info">
                        <strong>{appt.service}</strong>
                        <span>{appt.time} • {appt.therapist}</span>
                      </div>
                      <button className="premium-btn-sm">Manage</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-portal-card">
                <h3>Membership Status</h3>
                <div className="premium-membership">
                  <div className="premium-member-badge">
                    <Award size={24} />
                    <span>Gold Member</span>
                  </div>
                  <div className="premium-member-stats">
                    <div><strong>12</strong><span>Visits This Year</span></div>
                    <div><strong>$240</strong><span>Rewards Balance</span></div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

    </div>
  );
}

/* ==========================================================
   ENTERPRISE TIER - APEX LOGISTICS CRM
   Full business management system
   Demonstrates: Custom app, database, API, admin dashboard, roles
   ========================================================== */
export function EnterpriseShowcase() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const stats = [
    { label: 'Active Shipments', value: '2,847', change: '+12%', icon: <Package size={20} />, color: '#3b82f6' },
    { label: 'Revenue MTD', value: '$1.2M', change: '+8%', icon: <DollarSign size={20} />, color: '#10b981' },
    { label: 'Delivery Rate', value: '98.5%', change: '+2%', icon: <CheckCircle size={20} />, color: '#8b5cf6' },
    { label: 'Active Drivers', value: '156', change: '+5', icon: <Truck size={20} />, color: '#f59e0b' },
  ];

  const shipments = [
    { id: 'SHP-2847', customer: 'Acme Corp', origin: 'Los Angeles, CA', dest: 'New York, NY', status: 'In Transit', driver: 'John D.', eta: '2 days' },
    { id: 'SHP-2846', customer: 'TechStart Inc', origin: 'Seattle, WA', dest: 'Austin, TX', status: 'Delivered', driver: 'Maria L.', eta: 'Completed' },
    { id: 'SHP-2845', customer: 'Global Imports', origin: 'Miami, FL', dest: 'Chicago, IL', status: 'Pending', driver: 'Unassigned', eta: '3 days' },
    { id: 'SHP-2844', customer: 'Fresh Foods Co', origin: 'Denver, CO', dest: 'Phoenix, AZ', status: 'In Transit', driver: 'Carlos R.', eta: '1 day' },
    { id: 'SHP-2843', customer: 'BuildRight LLC', origin: 'Boston, MA', dest: 'Atlanta, GA', status: 'In Transit', driver: 'Sarah M.', eta: '2 days' },
  ];

  const drivers = [
    { id: 'D-001', name: 'John Davis', status: 'On Route', shipments: 3, rating: 4.9, location: 'I-95, NJ' },
    { id: 'D-002', name: 'Maria Lopez', status: 'Available', shipments: 0, rating: 4.8, location: 'Austin Hub' },
    { id: 'D-003', name: 'Carlos Rivera', status: 'On Route', shipments: 2, rating: 4.7, location: 'I-40, NM' },
  ];

  const getStatusColor = (status) => {
    const colors = { 'In Transit': '#3b82f6', 'Delivered': '#10b981', 'Pending': '#f59e0b', 'On Route': '#3b82f6', 'Available': '#10b981' };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="demo-enterprise">
      <div className="demo-back-bar">
        <Link to="/portfolio" className="demo-back-link"><ArrowLeft size={16} /> Back to Portfolio</Link>
        <span className="demo-tier-label">Enterprise Demo</span>
      </div>

      <div className="enterprise-layout">
        {/* SIDEBAR */}
        <aside className={`enterprise-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="enterprise-sidebar-header">
            <div className="enterprise-logo">
              <Truck size={24} />
              {!sidebarCollapsed && <span>APEX</span>}
            </div>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="enterprise-collapse-btn">
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ArrowLeft size={18} />}
            </button>
          </div>

          <nav className="enterprise-nav">
            {[
              { id: 'dashboard', icon: <Home size={20} />, label: 'Dashboard' },
              { id: 'shipments', icon: <Package size={20} />, label: 'Shipments' },
              { id: 'drivers', icon: <Truck size={20} />, label: 'Drivers' },
              { id: 'customers', icon: <Users size={20} />, label: 'Customers' },
              { id: 'analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
              { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
            ].map((item) => (
              <button
                key={item.id}
                className={`enterprise-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="enterprise-sidebar-footer">
            <div className="enterprise-user">
              <div className="enterprise-avatar">AM</div>
              {!sidebarCollapsed && (
                <div className="enterprise-user-info">
                  <strong>Admin User</strong>
                  <span>Operations Manager</span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="enterprise-main">
          <header className="enterprise-header">
            <div className="enterprise-header-left">
              <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            </div>
            <div className="enterprise-header-right">
              <div className="enterprise-search">
                <Search size={18} />
                <input type="text" placeholder="Search shipments, drivers..." />
              </div>
              <button className="enterprise-btn-icon"><Bell size={20} /></button>
              <button className="enterprise-btn-icon"><RefreshCw size={20} /></button>
            </div>
          </header>

          {activeTab === 'dashboard' && (
            <div className="enterprise-dashboard">
              {/* Stats Grid */}
              <div className="enterprise-stats-grid">
                {stats.map((stat) => (
                  <div key={stat.label} className="enterprise-stat-card">
                    <div className="enterprise-stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                      {stat.icon}
                    </div>
                    <div className="enterprise-stat-content">
                      <span className="enterprise-stat-label">{stat.label}</span>
                      <div className="enterprise-stat-value">
                        <strong>{stat.value}</strong>
                        <span className="enterprise-stat-change" style={{ color: '#10b981' }}>{stat.change}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="enterprise-charts-row">
                <div className="enterprise-card enterprise-chart-card">
                  <div className="enterprise-card-header">
                    <h3>Shipment Volume</h3>
                    <select>
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                      <option>Last 90 days</option>
                    </select>
                  </div>
                  <div className="enterprise-chart-placeholder">
                    <div className="enterprise-bar-chart">
                      {[65, 85, 70, 95, 80, 90, 75].map((h, i) => (
                        <div key={i} className="enterprise-bar" style={{ height: `${h}%` }}>
                          <span>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="enterprise-card enterprise-chart-card">
                  <div className="enterprise-card-header">
                    <h3>Delivery Performance</h3>
                  </div>
                  <div className="enterprise-donut-chart">
                    <div className="enterprise-donut">
                      <span className="enterprise-donut-value">98.5%</span>
                    </div>
                    <div className="enterprise-donut-legend">
                      <div><span style={{ background: '#10b981' }} />On Time: 95.2%</div>
                      <div><span style={{ background: '#f59e0b' }} />Slight Delay: 3.3%</div>
                      <div><span style={{ background: '#ef4444' }} />Late: 1.5%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Shipments Table */}
              <div className="enterprise-card">
                <div className="enterprise-card-header">
                  <h3>Recent Shipments</h3>
                  <button className="enterprise-btn-sm"><Plus size={14} /> New Shipment</button>
                </div>
                <div className="enterprise-table-wrapper">
                  <table className="enterprise-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Route</th>
                        <th>Status</th>
                        <th>Driver</th>
                        <th>ETA</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.map((s) => (
                        <tr key={s.id}>
                          <td><strong>{s.id}</strong></td>
                          <td>{s.customer}</td>
                          <td className="enterprise-route">{s.origin} → {s.dest}</td>
                          <td><span className="enterprise-status-badge" style={{ background: `${getStatusColor(s.status)}20`, color: getStatusColor(s.status) }}>{s.status}</span></td>
                          <td>{s.driver}</td>
                          <td>{s.eta}</td>
                          <td className="enterprise-actions">
                            <button><Eye size={14} /></button>
                            <button><Edit3 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'drivers' && (
            <div className="enterprise-drivers">
              <div className="enterprise-toolbar">
                <div className="enterprise-filters">
                  <button className="enterprise-filter-btn active">All Drivers</button>
                  <button className="enterprise-filter-btn">On Route</button>
                  <button className="enterprise-filter-btn">Available</button>
                </div>
                <button className="enterprise-btn-primary"><Plus size={16} /> Add Driver</button>
              </div>
              <div className="enterprise-drivers-grid">
                {drivers.map((d) => (
                  <div key={d.id} className="enterprise-driver-card">
                    <div className="enterprise-driver-header">
                      <div className="enterprise-driver-avatar">{d.name.split(' ').map(n => n[0]).join('')}</div>
                      <span className="enterprise-driver-status" style={{ background: `${getStatusColor(d.status)}20`, color: getStatusColor(d.status) }}>{d.status}</span>
                    </div>
                    <h3>{d.name}</h3>
                    <span className="enterprise-driver-id">{d.id}</span>
                    <div className="enterprise-driver-stats">
                      <div><Package size={14} /> {d.shipments} active</div>
                      <div><Star size={14} /> {d.rating}</div>
                    </div>
                    <div className="enterprise-driver-location">
                      <MapPin size={14} /> {d.location}
                    </div>
                    <div className="enterprise-driver-actions">
                      <button className="enterprise-btn-sm"><PhoneCall size={14} /> Contact</button>
                      <button className="enterprise-btn-sm"><Eye size={14} /> View</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="enterprise-analytics">
              <div className="enterprise-analytics-grid">
                <div className="enterprise-card enterprise-card-full">
                  <div className="enterprise-card-header">
                    <h3><TrendingUp size={18} /> Revenue Trends</h3>
                    <div className="enterprise-date-range">
                      <button>1W</button>
                      <button className="active">1M</button>
                      <button>3M</button>
                      <button>1Y</button>
                    </div>
                  </div>
                  <div className="enterprise-line-chart">
                    <svg viewBox="0 0 400 150" className="enterprise-line-svg">
                      <polyline points="0,120 50,100 100,110 150,80 200,90 250,60 300,70 350,40 400,50" fill="none" stroke="var(--primary)" strokeWidth="2" />
                      <polyline points="0,120 50,100 100,110 150,80 200,90 250,60 300,70 350,40 400,50" fill="url(#gradient)" stroke="none" />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
                <div className="enterprise-card">
                  <h3><PieChart size={18} /> Top Routes</h3>
                  <div className="enterprise-top-list">
                    {[
                      { route: 'LA → NY', percent: 28 },
                      { route: 'Chicago → Miami', percent: 22 },
                      { route: 'Seattle → Austin', percent: 18 },
                      { route: 'Boston → Atlanta', percent: 15 },
                    ].map((r) => (
                      <div key={r.route} className="enterprise-top-item">
                        <span>{r.route}</span>
                        <div className="enterprise-progress">
                          <div className="enterprise-progress-fill" style={{ width: `${r.percent}%` }} />
                        </div>
                        <span>{r.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="enterprise-card">
                  <h3><Activity size={18} /> Real-Time Activity</h3>
                  <div className="enterprise-activity-feed">
                    {[
                      { text: 'SHP-2847 departed Los Angeles hub', time: '2 min ago', type: 'info' },
                      { text: 'SHP-2846 delivered to TechStart Inc', time: '15 min ago', type: 'success' },
                      { text: 'Driver Carlos R. started shift', time: '1 hr ago', type: 'info' },
                      { text: 'SHP-2845 awaiting driver assignment', time: '2 hr ago', type: 'warning' },
                    ].map((a, i) => (
                      <div key={i} className={`enterprise-activity-item enterprise-activity-${a.type}`}>
                        <span className="enterprise-activity-dot" />
                        <div>
                          <p>{a.text}</p>
                          <span>{a.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>


    </div>
  );
}

// Gift icon for premium portal
function Gift(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}
