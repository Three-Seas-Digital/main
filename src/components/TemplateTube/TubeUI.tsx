import { useRef, useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Eye, ShoppingCart, MessageSquare, Filter, ChevronDown } from 'lucide-react';
import { TIER_CONFIG, formatPrice } from './tubeConfig';

interface FilterState {
  tier: string | null;
  category: string | null;
}

function FilterBar({ templates, activeFilters, onFilterChange }: { templates: any[]; activeFilters: FilterState; onFilterChange: (f: FilterState) => void }) {
  const [catOpen, setCatOpen] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    templates.forEach((t: any) => { if (t.category) cats.add(t.category); });
    return [...cats].sort();
  }, [templates]);

  const tiers = ['Starter', 'Business', 'Premium', 'Enterprise'];
  const hasFilters = activeFilters.tier || activeFilters.category;

  return (
    <div className="tube-filters">
      <Filter size={16} className="tube-filters-icon" />

      {tiers.map((tier) => {
        const cfg = TIER_CONFIG[tier];
        const active = activeFilters.tier === tier;
        return (
          <button
            key={tier}
            className={`tube-filter-chip ${active ? 'tube-filter-chip--active' : ''}`}
            style={{
              '--chip-color': cfg.color,
              '--chip-bg': cfg.bgColor,
            } as React.CSSProperties}
            onClick={() => onFilterChange({
              ...activeFilters,
              tier: active ? null : tier,
            })}
          >
            {tier}
          </button>
        );
      })}

      <div className="tube-filter-divider" />

      <div className="tube-filter-dropdown">
        <button
          className={`tube-filter-chip ${activeFilters.category ? 'tube-filter-chip--active' : ''}`}
          onClick={() => setCatOpen(!catOpen)}
        >
          {activeFilters.category || 'Category'} <ChevronDown size={14} />
        </button>
        {catOpen && (
          <div className="tube-filter-dropdown-menu">
            <button
              className="tube-filter-dropdown-item"
              onClick={() => { onFilterChange({ ...activeFilters, category: null }); setCatOpen(false); }}
            >
              All Categories
            </button>
            {categories.map((cat: string) => (
              <button
                key={cat}
                className={`tube-filter-dropdown-item ${activeFilters.category === cat ? 'active' : ''}`}
                onClick={() => { onFilterChange({ ...activeFilters, category: cat }); setCatOpen(false); }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {hasFilters && (
        <button
          className="tube-filter-clear"
          onClick={() => onFilterChange({ tier: null, category: null })}
        >
          Clear
        </button>
      )}
    </div>
  );
}

function DetailPanel({ template, onClose, onPreview, navigate }: { template: any; onClose: () => void; onPreview: (t: any) => void; navigate: (path: string) => void }) {
  if (!template) return null;

  const tierCfg = TIER_CONFIG[template.tier];
  const isEnterprise = template.price === null;

  const handlePurchase = () => {
    if (isEnterprise) {
      navigate('/contact?template=' + encodeURIComponent(template.name) + '&tier=Enterprise');
    } else {
      navigate('/checkout?template=' + template.id +
        '&tier=' + encodeURIComponent(template.tier) +
        '&price=' + template.price);
    }
  };

  return (
    <>
      <div className="tube-detail-backdrop" onClick={onClose} />
      <div className="tube-detail tube-detail--open">
        <button className="tube-detail-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div
          className="tube-detail-header"
          style={{
            background: template.imageUrl || template.image
              ? `url(${template.imageUrl || template.image}) center/cover`
              : `linear-gradient(135deg, ${template.color || '#667eea'}, #333)`,
          }}
        >
          <div className="tube-detail-header-overlay" />
          {tierCfg && (
            <span
              className="tube-detail-tier"
              style={{ color: tierCfg.color, background: tierCfg.bgColor }}
            >
              {template.tier}
            </span>
          )}
        </div>

        <div className="tube-detail-body">
          <h2 className="tube-detail-name">{template.name}</h2>
          <div className="tube-detail-meta">
            <span className="tube-detail-category">{template.category}</span>
            <span className="tube-detail-price">
              {isEnterprise ? 'Custom' : formatPrice(template.price)}
            </span>
          </div>

          <p className="tube-detail-desc">
            {template.longDesc || template.description}
          </p>

          {template.tags && (
            <div className="tube-detail-tags">
              {template.tags.map((tag) => (
                <span key={tag} className="tube-detail-tag">{tag}</span>
              ))}
            </div>
          )}

          <div className="tube-detail-actions">
            <button className="tube-detail-btn tube-detail-btn--primary" onClick={() => onPreview(template)}>
              <Eye size={16} /> Live Preview
            </button>
            <button className="tube-detail-btn tube-detail-btn--secondary" onClick={handlePurchase}>
              {isEnterprise ? <><MessageSquare size={16} /> Book Consultation</> : <><ShoppingCart size={16} /> Get This Template</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function HoverTooltip({ template, mousePos }: { template: any; mousePos: { x: number; y: number } | null }) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!template || !mousePos) return;
    let raf;
    const tick = () => {
      posRef.current.x += (mousePos.x - posRef.current.x) * 0.15;
      posRef.current.y += (mousePos.y - posRef.current.y) * 0.15;
      if (tooltipRef.current) {
        tooltipRef.current.style.transform =
          `translate3d(${posRef.current.x + 16}px, ${posRef.current.y - 12}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [template, mousePos]);

  if (!template) return null;
  const tierCfg = TIER_CONFIG[template.tier];

  return (
    <div ref={tooltipRef} className="tube-tooltip">
      <span className="tube-tooltip-name">{template.name}</span>
      {tierCfg && (
        <span className="tube-tooltip-tier" style={{ color: tierCfg.color }}>
          {template.tier}
        </span>
      )}
      <span className="tube-tooltip-price">
        {template.price === null ? 'Custom' : formatPrice(template.price)}
      </span>
    </div>
  );
}

interface TubeUIProps {
  templates: any[];
  activeFilters: FilterState;
  onFilterChange: (f: FilterState) => void;
  selectedTemplate: any;
  onSelectTemplate: (t: any) => void;
  onPreview: (t: any) => void;
  navigate: (path: string) => void;
  hoveredTemplate: any;
  mousePos: { x: number; y: number } | null;
}

export default function TubeUI({
  templates, activeFilters, onFilterChange,
  selectedTemplate, onSelectTemplate,
  onPreview, navigate,
  hoveredTemplate, mousePos,
}: TubeUIProps) {
  return (
    <div className="tube-ui-overlay">
      <FilterBar
        templates={templates}
        activeFilters={activeFilters}
        onFilterChange={onFilterChange}
      />

      <HoverTooltip template={hoveredTemplate} mousePos={mousePos} />

      <DetailPanel
        template={selectedTemplate}
        onClose={() => onSelectTemplate(null)}
        onPreview={onPreview}
        navigate={navigate}
      />

      <div className="tube-scroll-hint">
        <span>Scroll to explore</span>
        <div className="tube-scroll-hint-line" />
      </div>
    </div>
  );
}
