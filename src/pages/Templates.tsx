import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ShoppingCart, MessageSquare } from 'lucide-react';
import '../styles/templates.css';
import Navbar from '../components/Navbar';
import TemplatePreview from '../components/TemplatePreview';
import { useAppContext } from '../context/AppContext';
import { getAllMergedTemplates } from '../data/templates';
import { getTemplateImage } from '../utils/templateStorage';
import TubeUI from '../components/TemplateTube/TubeUI';
import { useGradientTextures, getTemplatePreviewUrl } from '../components/TemplateTube/useGradientTextures';
import { TIER_CONFIG, formatPrice } from '../components/TemplateTube/tubeConfig';

const TubeCanvas = lazy(() => import('../components/TemplateTube/TubeCanvas'));

// Mobile fallback grid card
function FallbackCard({ template, previewUrl, onClick }: { template: any; previewUrl: string | undefined; onClick: (t: any) => void }) {
  const tierCfg = TIER_CONFIG[template.tier];
  const isEnterprise = template.price === null;
  const bgImage = template.image || previewUrl;

  return (
    <div className="tube-fallback-card" onClick={() => onClick(template)}>
      <div
        className="tube-fallback-card-img"
        style={{
          background: bgImage
            ? `url(${bgImage}) center/cover`
            : template.color || '#333',
        }}
      >
        {tierCfg && (
          <span
            className="tube-fallback-tier"
            style={{ color: tierCfg.color, background: tierCfg.bgColor }}
          >
            {template.tier}
          </span>
        )}
      </div>
      <div className="tube-fallback-card-body">
        <h3 className="tube-fallback-name">{template.name}</h3>
        <span className="tube-fallback-cat">{template.category}</span>
        <span className="tube-fallback-price">
          {isEnterprise ? 'Custom' : formatPrice(template.price)}
        </span>
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

  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [hoveredTemplate, setHoveredTemplate] = useState<any>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [activeFilters, setActiveFilters] = useState<{ tier: string | null; category: string | null }>({ tier: null, category: null });
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [prefersReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    document.title = 'Template Library — Three Seas Digital';
  }, []);

  // Responsive check
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Load images from R2/IndexedDB
  useEffect(() => {
    const toLoad = mergedTemplates.filter((t: any) => t.hasImage && !imageUrls[t.id]);
    if (toLoad.length === 0) return;
    let cancelled = false;
    (async () => {
      const newUrls = {};
      await Promise.all(toLoad.map(async (t: any) => {
        try {
          const blob = await getTemplateImage(String(t.id));
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
  const enrichedTemplates = useMemo(
    () => mergedTemplates.map((t) => imageUrls[t.id] ? { ...t, imageUrl: imageUrls[t.id] } : t),
    [mergedTemplates, imageUrls]
  );

  // Generate canvas preview URLs for mobile fallback (templates without images)
  const previewUrls = useMemo(() => {
    const urls = {};
    enrichedTemplates.forEach((t) => {
      if (!t.image && !t.imageUrl) {
        urls[t.id] = getTemplatePreviewUrl(t);
      }
    });
    return urls;
  }, [enrichedTemplates]);

  // Texture map for 3D tube (only on desktop)
  const textureMap = useGradientTextures(isMobile || prefersReduced ? [] : enrichedTemplates);

  const handleCardHover = useCallback((template: any, event: any) => {
    setHoveredTemplate(template);
    if (event?.nativeEvent) {
      setMousePos({ x: event.nativeEvent.clientX, y: event.nativeEvent.clientY });
    } else if (event === null) {
      setMousePos(null);
    }
  }, []);

  const handleCardClick = useCallback((template: any) => {
    setSelectedTemplate(template);
  }, []);

  const useTube = !isMobile && !prefersReduced;

  // Mobile / reduced-motion fallback
  if (!useTube) {
    return (
      <div className="tube-page tube-page--fallback">
        <Navbar />
        <div className="tube-fallback-header">
          <h1>Template Library</h1>
          <p>Browse our collection of professionally designed templates.</p>
        </div>
        <div className="tube-grid-fallback">
          {enrichedTemplates.map((t) => (
            <FallbackCard key={t.id} template={t} previewUrl={previewUrls[t.id]} onClick={setSelectedTemplate} />
          ))}
        </div>

        {selectedTemplate && (
          <TubeUI
            templates={enrichedTemplates}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            onPreview={setPreviewTemplate}
            navigate={navigate}
            hoveredTemplate={null}
            mousePos={null}
          />
        )}

        {previewTemplate && (
          <TemplatePreview
            templateId={previewTemplate.id}
            templateName={previewTemplate.name}
            templatePath={previewTemplate.id >= 6 && previewTemplate.id <= 23 ? `/templates/preview/${previewTemplate.id}` : previewTemplate.path}
            onClose={() => setPreviewTemplate(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="tube-page">
      <Navbar />

      <Suspense fallback={<div className="tube-loading"><div className="tube-loading-spinner" /></div>}>
        <TubeCanvas
          templates={enrichedTemplates}
          textureMap={textureMap}
          activeFilters={activeFilters}
          onCardHover={handleCardHover}
          onCardClick={handleCardClick}
          prefersReduced={prefersReduced}
        />
      </Suspense>

      <TubeUI
        templates={enrichedTemplates}
        activeFilters={activeFilters}
        onFilterChange={setActiveFilters}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={setSelectedTemplate}
        onPreview={setPreviewTemplate}
        navigate={navigate}
        hoveredTemplate={hoveredTemplate}
        mousePos={mousePos}
      />

      {previewTemplate && (
        <TemplatePreview
          templateId={previewTemplate.id}
          templateName={previewTemplate.name}
          templatePath={previewTemplate.id >= 6 && previewTemplate.id <= 23 ? `/templates/preview/${previewTemplate.id}` : previewTemplate.path}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}
