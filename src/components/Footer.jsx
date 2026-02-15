import { Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SITE_INFO } from '../constants';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-logo">
            <img src="/images/brand-icon.png" alt={SITE_INFO.name} style={{ width: 28, height: 28 }} />
            <span>THREE SEAS</span>
          </div>
          <p>Illuminating the complexities of the modern web with maritime precision and bioluminescent clarity.</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">Philosophy</Link></li>
            <li><Link to="/portfolio">Portfolio</Link></li>
            <li><Link to="/services">Portal</Link></li>
            <li><Link to="/contact">Initiate</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact Info</h4>
          <ul className="footer-contact">
            {SITE_INFO.email && <li><Mail size={16} /> {SITE_INFO.email}</li>}
            {SITE_INFO.phone && <li><Phone size={16} /> {SITE_INFO.phone}</li>}
            {SITE_INFO.address && <li><MapPin size={16} /> {SITE_INFO.address}</li>}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} {SITE_INFO.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
