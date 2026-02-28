import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);
  const [theme, setTheme] = useState('dark'); // Default to dark, sync on mount
  const [isMounted, setIsMounted] = useState(false);
  const location = useLocation();

  // Sync theme after mount to avoid SSR/hydration issues
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('threeseas_theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
    localStorage.setItem('threeseas_theme', theme);
  }, [theme, isMounted]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const links = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'Philosophy' },
    { to: '/templates', label: 'Templates' },
    { to: '/contact', label: 'Initiate' },
  ];

  const enterpriseLinks = [
    { to: '/portfolio', label: 'Portfolio' },
    { to: '/services', label: 'Client Portal' },
  ];

  const isActive = (path) => location.pathname === path;
  const isEnterpriseActive = enterpriseLinks.some(link => location.pathname === link.to);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <img src="/images/brand-icon.png" alt="Three Seas Digital" className="nav-logo-icon" />
          <span>Three Seas Digital</span>
        </Link>

        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="nav-toggle" onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? 'Close menu' : 'Open menu'}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <ul className={`nav-links ${isOpen ? 'active' : ''}`}>
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={isActive(link.to) ? 'nav-active' : ''}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
          
          {/* Enterprise Dropdown */}
          <li className="nav-dropdown">
            <button 
              className={`nav-dropdown-toggle ${isEnterpriseActive ? 'nav-active' : ''}`}
              onClick={(e) => {
                // Only toggle on mobile (when nav is open)
                if (isOpen) {
                  e.preventDefault();
                  setEnterpriseOpen(!enterpriseOpen);
                }
              }}
            >
              Enterprise
              <ChevronDown size={14} className={`dropdown-icon ${enterpriseOpen ? 'open' : ''}`} />
            </button>
            <ul className={`nav-dropdown-menu ${isOpen && enterpriseOpen ? 'open' : ''}`}>
              {enterpriseLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={isActive(link.to) ? 'nav-active' : ''}
                    onClick={() => {
                      setIsOpen(false);
                      setEnterpriseOpen(false);
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>
        <Link to="/templates" className="nav-cta" onClick={() => setIsOpen(false)}>Browse Templates</Link>
      </div>
    </nav>
  );
}
