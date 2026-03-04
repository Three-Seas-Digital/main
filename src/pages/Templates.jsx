import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Sparkles,
  ShoppingCart,
  MessageSquare
} from 'lucide-react';
import FallbackImg from '../components/FallbackImg';
import Navbar from '../components/Navbar';
import TemplatePreview from '../components/TemplatePreview';
import { useAppContext } from '../context/AppContext';
import { ALL_TEMPLATES, getAllMergedTemplates, getDynamicCategories, getTemplateByIdFromAll } from '../data/templates';
import { getTemplateImage } from '../utils/templateStorage';

// Tier configuration
const TIER_CONFIG = {
  Starter: { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.2)' },
  Business: { color: '#22d3ee', bgColor: 'rgba(34, 211, 238, 0.2)' },
  Premium: { color: '#c084fc', bgColor: 'rgba(168, 85, 247, 0.2)' },
  Enterprise: { color: '#c8a43e', bgColor: 'rgba(200, 164, 62, 0.2)' },
};

// Default featured template
const DEFAULT_FEATURED = {
  id: 1,
  name: 'Coastal Coffee',
  tier: 'Starter',
  category: 'Landing Pages',
  description: 'A blazing-fast single-page experience engineered for conversion. Perfect for cafes, restaurants, and local businesses.',
  longDesc: 'Sub-second load times, scroll-driven storytelling, mobile-first architecture, and a warm aesthetic that turns visitors into regulars.',
  image: '/images/portfolio-coffee.jpg',
  color: '#ff6b9d',
  tags: ['Mobile-First', 'Fast Load', 'Conversion Optimized'],
  path: '/pricing/starter',
  price: 499,
};

// Gradient backgrounds for templates without images
const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff8a80 0%, #ea6100 100%)',
  'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
];

function getGradient(id) {
  if (typeof id === 'string') {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
    return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
  }
  return GRADIENTS[id % GRADIENTS.length];
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
}

// Hero Section Component
function HeroSection({ template, isTransitioning, navigate, onPreview }) {
  const tierConfig = TIER_CONFIG[template.tier];
  const isEnterprise = template.price === null;

  const handlePurchase = () => {
    if (isEnterprise) {
      navigate('/contact?template=' + encodeURIComponent(template.name) + '&tier=Enterprise');
    } else {
      navigate('/checkout?template=' + template.id);
    }
  };

  return (
    <div className={`netflix-hero ${isTransitioning ? 'netflix-hero--transitioning' : ''}`}>
      <div className="netflix-hero-bg">
        {template.image ? (
          <div className="netflix-hero-image-wrapper">
            <FallbackImg src={template.image} alt={template.name} />
          </div>
        ) : (
          <div className="netflix-hero-gradient" style={{ background: getGradient(template.id) }} />
        )}
        <div className="netflix-hero-overlay" />
        <div className="netflix-hero-vignette" />
      </div>

      <div className="netflix-hero-content">
        <div className="netflix-hero-tags">
          <span
            className="netflix-hero-tier-badge"
            style={{
              background: tierConfig.bgColor,
              color: tierConfig.color,
              border: `1px solid ${tierConfig.color}40`
            }}
          >
            {template.tier}
          </span>
          {template.tags?.slice(0, 2).map((tag, i) => (
            <span key={i} className="netflix-hero-tag">{tag}</span>
          ))}
        </div>

        <h1 className="netflix-hero-title">{template.name}</h1>
        <div className="netflix-hero-meta">
          <span className="netflix-hero-category">{template.category}</span>
          <span className="netflix-hero-rating">
            <Sparkles size={14} />
            Top Pick
          </span>
          <span className="netflix-hero-price" style={{ color: isEnterprise ? tierConfig.color : 'var(--emerald-light)' }}>
            {isEnterprise ? 'Custom Pricing' : formatPrice(template.price)}
          </span>
        </div>

        <p className="netflix-hero-desc">{template.longDesc || template.description}</p>

        <div className="netflix-hero-buttons">
          {(template.hasZip || template.path) && (
            <button className="netflix-btn netflix-btn-primary" onClick={() => onPreview(template)}>
              <Eye size={24} />
              Live Preview
            </button>
          )}

          <button
            className="netflix-btn netflix-btn-secondary"
            onClick={handlePurchase}
          >
            {isEnterprise ? (
              <>
                <MessageSquare size={20} />
                Book Consultation
              </>
            ) : (
              <>
                <ShoppingCart size={20} />
                Get This Template
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="netflix-hero-scroll">
        <ChevronDown size={32} />
      </div>
    </div>
  );
}

// Template Card Component
function TemplateCard({ item, onSelect, isSelected, onPreview }) {
  const [isHovered, setIsHovered] = useState(false);
  const tierConfig = TIER_CONFIG[item.tier];
  const isEnterprise = item.price === null;

  return (
    <div
      className={`netflix-card ${isHovered ? 'netflix-card--hovered' : ''} ${isSelected ? 'netflix-card--selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(item)}
    >
      <div className="netflix-card-inner">
        {/* Thumbnail */}
        <div className="netflix-card-thumb" style={{
          background: item.image ? undefined : getGradient(item.id),
        }}>
          {item.image ? (
            <FallbackImg src={item.image} alt={item.name} />
          ) : (
            <div className="netflix-card-gradient" style={{ background: getGradient(item.id) }} />
          )}

          {/* Tier Badge */}
          <div
            className="netflix-card-tier-badge"
            style={{
              background: tierConfig.bgColor,
              color: tierConfig.color,
              border: `1px solid ${tierConfig.color}40`
            }}
          >
            {item.tier}
          </div>

          {/* Price Badge */}
          <div className="netflix-card-price-badge">
            {isEnterprise ? 'Custom' : formatPrice(item.price)}
          </div>

          {/* Selected indicator */}
          {isSelected && (
            <div className="netflix-card-selected-indicator">
              <Sparkles size={16} />
              Featured
            </div>
          )}

          {/* Hover Overlay */}
          <div className="netflix-card-overlay">
            <div className="netflix-card-actions">
              <button
                className="netflix-card-btn netflix-card-btn-preview"
                title="Live Preview"
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.hasZip || item.path) {
                    onPreview(item);
                  }
                }}
              >
                <Eye size={18} />
              </button>
            </div>

            <div className="netflix-card-meta">
              <span className="netflix-card-cat">{item.category}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="netflix-card-title-wrap">
          <h3 className="netflix-card-title">{item.name}</h3>
        </div>
      </div>
    </div>
  );
}

// Row Component with horizontal scroll
function TemplateRow({ category, selectedId, onSelect, onPreview }) {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  const scroll = (direction) => {
    if (!rowRef.current) return;
    const scrollAmount = direction === 'left' ? -rowRef.current.clientWidth * 0.75 : rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    row.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
    return () => row.removeEventListener('scroll', checkScroll);
  }, [checkScroll]);

  return (
    <div className="netflix-row">
      <h2 className="netflix-row-title">{category.title}</h2>

      <div className="netflix-row-container">
        {/* Left Arrow */}
        <button
          className={`netflix-row-arrow netflix-row-arrow--left ${canScrollLeft ? 'netflix-row-arrow--visible' : ''}`}
          onClick={() => scroll('left')}
        >
          <ChevronLeft size={40} />
        </button>

        {/* Cards Container */}
        <div className="netflix-row-scroll" ref={rowRef}>
          {category.items.map((item) => (
            <TemplateCard
              key={item.id}
              item={item}
              onSelect={onSelect}
              isSelected={item.id === selectedId}
              onPreview={onPreview}
            />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          className={`netflix-row-arrow netflix-row-arrow--right ${canScrollRight ? 'netflix-row-arrow--visible' : ''}`}
          onClick={() => scroll('right')}
        >
          <ChevronRight size={40} />
        </button>
      </div>
    </div>
  );
}

export default function Templates() {
  const navigate = useNavigate();
  const { builtInOverrides, adminTemplates } = useAppContext();

  const mergedTemplates = useMemo(
    () => getAllMergedTemplates(builtInOverrides, adminTemplates),
    [builtInOverrides, adminTemplates]
  );
  const categories = useMemo(() => getDynamicCategories(mergedTemplates), [mergedTemplates]);

  const [featuredTemplate, setFeaturedTemplate] = useState(DEFAULT_FEATURED);
  const [selectedId, setSelectedId] = useState(DEFAULT_FEATURED.id);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const heroRef = useRef(null);

  useEffect(() => {
    document.title = 'Template Library — Three Seas Digital';
  }, []);

  // Load images from R2/IndexedDB for templates with hasImage
  useEffect(() => {
    const toLoad = mergedTemplates.filter((t) => t.hasImage && !imageUrls[t.id]);
    if (toLoad.length === 0) return;
    let cancelled = false;
    (async () => {
      const newUrls = {};
      await Promise.all(toLoad.map(async (t) => {
        try {
          const blob = await getTemplateImage(t.id);
          if (blob && !cancelled) newUrls[t.id] = URL.createObjectURL(blob);
        } catch { /* skip */ }
      }));
      if (!cancelled && Object.keys(newUrls).length > 0) {
        setImageUrls((prev) => ({ ...prev, ...newUrls }));
      }
    })();
    return () => { cancelled = true; };
  }, [mergedTemplates]);

  // Enrich templates with loaded R2 image URLs
  const enrichedTemplates = useMemo(() =>
    mergedTemplates.map((t) => imageUrls[t.id] ? { ...t, image: imageUrls[t.id] } : t),
    [mergedTemplates, imageUrls]
  );
  const enrichedCategories = useMemo(() => getDynamicCategories(enrichedTemplates), [enrichedTemplates]);

  const handleSelectTemplate = (template) => {
    if (template.id === selectedId) return;

    setIsTransitioning(true);
    setSelectedId(template.id);

    if (window.scrollY > window.innerHeight * 0.3) {
      heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setTimeout(() => {
      const enriched = imageUrls[template.id] ? { ...template, image: imageUrls[template.id] } : template;
      setFeaturedTemplate(enriched);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className="netflix-page" ref={heroRef}>
      {/* Navigation - Main Navbar */}
      <Navbar />

      {/* Hero - Updates when template is selected */}
      <HeroSection
        template={featuredTemplate}
        isTransitioning={isTransitioning}
        navigate={navigate}
        onPreview={setPreviewTemplate}
      />

      {/* Template Rows */}
      <div className="netflix-rows">
        {enrichedCategories.map((category) => (
          <TemplateRow
            key={category.id}
            category={category}
            selectedId={selectedId}
            onSelect={handleSelectTemplate}
            onPreview={setPreviewTemplate}
          />
        ))}
      </div>

      {/* Protected Preview Overlay */}
      {previewTemplate && (
        <TemplatePreview
          templateId={previewTemplate.id}
          templateName={previewTemplate.name}
          templatePath={previewTemplate.path}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {/* Footer */}
      <footer className="netflix-footer">
        <div className="netflix-footer-content">
          <div className="netflix-footer-links">
            <Link to="/">Home</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <p className="netflix-footer-copy">
            &copy; 2026 Three Seas Digital. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
