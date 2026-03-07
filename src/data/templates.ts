/* ===== TEMPLATES DATA =====
 * Shared template library data
 * Used by Templates page and Builder for remixing
 */

export const TEMPLATE_TIERS = {
  STARTER: 'Starter',
  BUSINESS: 'Business',
  PREMIUM: 'Premium',
  ENTERPRISE: 'Enterprise',
} as const;

export type TemplateTier = typeof TEMPLATE_TIERS[keyof typeof TEMPLATE_TIERS];

export interface Template {
  id: number | string;
  name: string;
  tier: string;
  category: string;
  description: string;
  longDesc?: string;
  image?: string;
  color: string;
  tags: string[];
  path: string;
  price: number | null;
  remixable: boolean;
  components: string[];
  // Admin-created templates may have these
  status?: string;
  [key: string]: unknown;
}

export interface CategoryRow {
  id: string;
  title: string;
  items: Template[];
}

// All available templates
export const ALL_TEMPLATES: Template[] = [
  // TRENDING
  {
    id: 1,
    name: 'Coastal Coffee',
    tier: TEMPLATE_TIERS.STARTER,
    category: 'Landing Pages',
    description: 'A blazing-fast single-page experience engineered for conversion.',
    longDesc: 'Sub-second load times, scroll-driven storytelling, mobile-first architecture, and a warm aesthetic that turns visitors into regulars.',
    image: '/images/portfolio-coffee.jpg',
    color: '#ff6b9d',
    tags: ['Mobile-First', 'Fast Load', 'Conversion Optimized'],
    path: '/pricing/starter',
    price: 499,
    remixable: true,
    components: ['hero', 'features', 'menu', 'location', 'footer'],
  },
  {
    id: 2,
    name: 'Summit Law',
    tier: TEMPLATE_TIERS.BUSINESS,
    category: 'Business',
    description: 'A multi-page platform with content management and lead generation.',
    longDesc: 'Attorney profiles, practice areas, case studies, and a lead generation pipeline that qualifies prospects before they ever pick up the phone.',
    image: '/images/portfolio-law.jpg',
    color: '#c084fc',
    tags: ['Full CMS', 'Lead Pipeline', 'Professional'],
    path: '/pricing/business',
    price: 1999,
    remixable: true,
    components: ['navbar', 'hero', 'services', 'team', 'contact', 'footer'],
  },
  {
    id: 3,
    name: 'Bella Spa',
    tier: TEMPLATE_TIERS.PREMIUM,
    category: 'Booking',
    description: 'A booking-first client portal with real-time availability.',
    longDesc: 'Real-time availability, membership management, treatment history, and payment processing that keeps clients engaged between visits.',
    image: '/images/portfolio-spa.jpg',
    color: '#22d3ee',
    tags: ['Booking Engine', 'Client Portal', 'Payments'],
    path: '/pricing/premium',
    price: 3499,
    remixable: true,
    components: ['navbar', 'hero', 'booking', 'services', 'testimonials', 'footer'],
  },
  {
    id: 4,
    name: 'Apex Logistics',
    tier: TEMPLATE_TIERS.ENTERPRISE,
    category: 'Dashboard',
    description: 'A comprehensive CRM and BI dashboard for data-driven decisions.',
    longDesc: 'Audit scoring, financial analytics, intervention tracking, and automated reporting that turns raw data into strategic decisions.',
    image: '/images/portfolio-logistics.jpg',
    color: '#60a5fa',
    tags: ['BI Dashboard', 'CRM', 'Analytics'],
    path: '/pricing/enterprise',
    price: null,
    remixable: true,
    components: ['sidebar', 'header', 'dashboard', 'charts', 'tables', 'footer'],
  },
  {
    id: 5,
    name: 'Brew & Bean',
    tier: TEMPLATE_TIERS.STARTER,
    category: 'Landing Pages',
    description: 'Warm landing page for cafes with menu and location map.',
    longDesc: 'Beautiful coffee shop landing page with menu showcase, location map, hours, and online ordering capabilities.',
    image: '/images/demo-coffee-hero.jpg',
    color: '#fbbf24',
    tags: ['Menu', 'Location', 'Ordering'],
    path: '/pricing/starter',
    price: 599,
    remixable: true,
    components: ['hero', 'menu', 'about', 'location', 'footer'],
  },
  {
    id: 6,
    name: 'Nova Dashboard',
    tier: TEMPLATE_TIERS.ENTERPRISE,
    category: 'Dashboard',
    color: '#0ea5e9',
    description: 'Full admin dashboard with charts, tables, and dark mode.',
    longDesc: 'Comprehensive admin interface with data visualization, user management, and customizable dark/light themes.',
    tags: ['Charts', 'Tables', 'Dark Mode'],
    path: '/pricing/enterprise',
    price: null,
    remixable: true,
    components: ['sidebar', 'header', 'stats', 'charts', 'recent-activity', 'footer'],
  },
  // NEW RELEASES
  {
    id: 7,
    name: 'SaaS Launch',
    tier: TEMPLATE_TIERS.BUSINESS,
    category: 'Landing Pages',
    color: '#8b5cf6',
    description: 'Conversion-focused product page with pricing tables.',
    longDesc: 'Everything you need to launch a SaaS product - pricing tables, feature comparisons, testimonials, and FAQ sections.',
    tags: ['SaaS', 'Pricing', 'Modern'],
    path: '/pricing/business',
    price: 1499,
    remixable: true,
    components: ['navbar', 'hero', 'features', 'pricing', 'testimonials', 'faq', 'footer'],
  },
  {
    id: 8,
    name: 'Medical Plus',
    tier: TEMPLATE_TIERS.PREMIUM,
    category: 'Healthcare',
    color: '#10b981',
    description: 'Healthcare clinic site with doctor profiles.',
    longDesc: 'Professional medical practice website with doctor profiles, appointment booking, patient portal, and telehealth integration.',
    tags: ['Healthcare', 'Booking', 'Portal'],
    path: '/pricing/premium',
    price: 3999,
    remixable: true,
    components: ['navbar', 'hero', 'services', 'doctors', 'booking', 'footer'],
  },
  {
    id: 9,
    name: 'Tech Startup',
    tier: TEMPLATE_TIERS.STARTER,
    category: 'Landing Pages',
    color: '#f59e0b',
    description: 'Modern landing page for tech companies.',
    longDesc: 'Clean, modern design perfect for tech startups with feature highlights, team section, and investor information.',
    tags: ['Tech', 'Modern', 'Clean'],
    path: '/pricing/starter',
    price: 549,
    remixable: true,
    components: ['hero', 'features', 'team', 'contact', 'footer'],
  },
  {
    id: 10,
    name: 'Finance Pro',
    tier: TEMPLATE_TIERS.ENTERPRISE,
    category: 'Dashboard',
    color: '#06b6d4',
    description: 'Financial overview with P&L charts and invoicing.',
    longDesc: 'Complete financial management dashboard with profit/loss tracking, invoicing, expense management, and cash flow analysis.',
    tags: ['Finance', 'Invoicing', 'Reports'],
    path: '/pricing/enterprise',
    price: null,
    remixable: true,
    components: ['sidebar', 'header', 'overview', 'charts', 'invoices', 'footer'],
  },
  // LANDING PAGES
  {
    id: 11,
    name: 'Event Launch',
    tier: TEMPLATE_TIERS.STARTER,
    category: 'Events',
    color: '#f97316',
    description: 'Countdown timer hero with speaker bios.',
    longDesc: 'Event landing page with countdown timer, speaker lineup, schedule, ticket purchase, and venue information.',
    tags: ['Events', 'Countdown', 'Tickets'],
    path: '/pricing/starter',
    price: 699,
    remixable: true,
    components: ['hero', 'countdown', 'speakers', 'schedule', 'tickets', 'footer'],
  },
  {
    id: 12,
    name: 'App Promo',
    tier: TEMPLATE_TIERS.BUSINESS,
    category: 'Mobile',
    color: '#6366f1',
    description: 'Mobile app showcase with device mockups.',
    longDesc: 'Showcase your mobile app with device mockups, feature highlights, download buttons, and user testimonials.',
    tags: ['Mobile App', 'Mockups', 'Download'],
    path: '/pricing/business',
    price: 1799,
    remixable: true,
    components: ['navbar', 'hero', 'features', 'screenshots', 'download', 'footer'],
  },
  {
    id: 13,
    name: 'Startup Pitch',
    tier: TEMPLATE_TIERS.STARTER,
    category: 'Venture',
    color: '#14b8a6',
    description: 'Investor pitch deck site with metrics.',
    longDesc: 'Investor-focused landing page with metrics, team bios, traction proof, and funding information.',
    tags: ['Pitch', 'Investors', 'Metrics'],
    path: '/pricing/starter',
    price: 649,
    remixable: true,
    components: ['hero', 'problem', 'solution', 'metrics', 'team', 'contact', 'footer'],
  },
  {
    id: 14,
    name: 'Product Hunt',
    tier: TEMPLATE_TIERS.BUSINESS,
    category: 'Launch',
    color: '#a855f7',
    description: 'Startup launch page with social proof.',
    longDesc: 'Product launch page designed for Product Hunt with upvote integration, feature list, and early access signup.',
    tags: ['Launch', 'Social Proof', 'Signup'],
    path: '/pricing/business',
    price: 1699,
    remixable: true,
    components: ['hero', 'features', 'social-proof', 'signup', 'footer'],
  },
  {
    id: 15,
    name: 'Course Sales',
    tier: TEMPLATE_TIERS.PREMIUM,
    category: 'Education',
    color: '#e11d48',
    description: 'Course sales page with curriculum and bio.',
    longDesc: 'Online course landing page with curriculum outline, instructor bio, testimonials, and enrollment options.',
    tags: ['Course', 'Education', 'Sales'],
    path: '/pricing/premium',
    price: 2999,
    remixable: true,
    components: ['hero', 'curriculum', 'instructor', 'testimonials', 'pricing', 'footer'],
  },
  // BUSINESS & CORPORATE
  {
    id: 16,
    name: 'Consulting Co',
    tier: TEMPLATE_TIERS.BUSINESS,
    category: 'Services',
    color: '#3b82f6',
    description: 'Corporate site with testimonials and forms.',
    longDesc: 'Professional consulting firm website with service offerings, client testimonials, case studies, and lead capture forms.',
    tags: ['Consulting', 'Corporate', 'Forms'],
    path: '/pricing/business',
    price: 2499,
    remixable: true,
    components: ['navbar', 'hero', 'services', 'case-studies', 'testimonials', 'contact', 'footer'],
  },
  {
    id: 17,
    name: 'Luxe Realty',
    tier: TEMPLATE_TIERS.PREMIUM,
    category: 'Real Estate',
    color: '#f59e0b',
    description: 'Luxury real estate with virtual tours.',
    longDesc: 'High-end real estate website featuring luxury listings, virtual tours, agent profiles, and mortgage tools.',
    tags: ['Luxury', 'Virtual Tours', 'High-End'],
    path: '/pricing/premium',
    price: 4499,
    remixable: true,
    components: ['navbar', 'hero', 'listings', 'agents', 'mortgage', 'footer'],
  },
  // DASHBOARDS & ADMIN
  {
    id: 18,
    name: 'Analytics Pro',
    tier: TEMPLATE_TIERS.ENTERPRISE,
    category: 'Analytics',
    color: '#0ea5e9',
    description: 'Data-rich analytics with KPI cards.',
    longDesc: 'Advanced analytics dashboard with real-time KPIs, trend charts, custom reports, and data export capabilities.',
    tags: ['Analytics', 'KPIs', 'Reports'],
    path: '/pricing/enterprise',
    price: null,
    remixable: true,
    components: ['sidebar', 'header', 'kpi-cards', 'charts', 'data-tables', 'footer'],
  },
  {
    id: 19,
    name: 'CRM Panel',
    tier: TEMPLATE_TIERS.PREMIUM,
    category: 'Management',
    color: '#8b5cf6',
    description: 'Client management with pipeline view.',
    longDesc: 'Customer relationship management dashboard with sales pipeline, contact management, and activity tracking.',
    tags: ['CRM', 'Pipeline', 'Sales'],
    path: '/pricing/premium',
    price: 3799,
    remixable: true,
    components: ['sidebar', 'header', 'pipeline', 'contacts', 'activities', 'footer'],
  },
  {
    id: 20,
    name: 'Project Tracker',
    tier: TEMPLATE_TIERS.ENTERPRISE,
    category: 'PM',
    color: '#10b981',
    description: 'Kanban board with time tracking.',
    longDesc: 'Project management dashboard with Kanban boards, time tracking, sprint planning, and team workload views.',
    tags: ['Kanban', 'Time Tracking', 'Agile'],
    path: '/pricing/enterprise',
    price: null,
    remixable: true,
    components: ['sidebar', 'header', 'kanban', 'timeline', 'team', 'footer'],
  },
  // PORTFOLIOS & CREATIVE
  {
    id: 21,
    name: 'Artisan Gallery',
    tier: TEMPLATE_TIERS.STARTER,
    category: 'Gallery',
    color: '#d946ef',
    description: 'Masonry gallery with lightbox.',
    longDesc: 'Creative portfolio with masonry grid layout, lightbox gallery, smooth scroll, and category filtering.',
    tags: ['Gallery', 'Masonry', 'Creative'],
    path: '/pricing/starter',
    price: 799,
    remixable: true,
    components: ['navbar', 'gallery', 'about', 'contact', 'footer'],
  },
  {
    id: 22,
    name: 'Pixel Studio',
    tier: TEMPLATE_TIERS.BUSINESS,
    category: 'Agency',
    color: '#6366f1',
    description: 'Creative agency with case studies.',
    longDesc: 'Design agency portfolio with bold visuals, case studies, team section, and client showcase.',
    tags: ['Agency', 'Case Studies', 'Bold'],
    path: '/pricing/business',
    price: 1999,
    remixable: true,
    components: ['navbar', 'hero', 'work', 'services', 'team', 'contact', 'footer'],
  },
  {
    id: 23,
    name: 'Dev Portfolio',
    tier: TEMPLATE_TIERS.STARTER,
    category: 'Developer',
    color: '#14b8a6',
    description: 'Developer portfolio with code snippets.',
    longDesc: 'Developer-focused portfolio with GitHub integration, code snippet highlighting, and project timelines.',
    tags: ['Developer', 'Code', 'GitHub'],
    path: '/pricing/starter',
    price: 499,
    remixable: true,
    components: ['hero', 'projects', 'skills', 'code', 'contact', 'footer'],
  },
];

// Get template by ID
export function getTemplateById(id: number | string): Template | undefined {
  return ALL_TEMPLATES.find((t) => t.id === parseInt(id as string));
}

// Get templates by category
export function getTemplatesByCategory(category: string): Template[] {
  return ALL_TEMPLATES.filter((t) => t.category === category);
}

// Get templates by tier
export function getTemplatesByTier(tier: string): Template[] {
  return ALL_TEMPLATES.filter((t) => t.tier === tier);
}

// Get remixable templates
export function getRemixableTemplates(): Template[] {
  return ALL_TEMPLATES.filter((t) => t.remixable);
}

// Categories for display
export const CATEGORIES: CategoryRow[] = [
  {
    id: 'trending',
    title: 'Trending Now',
    items: ALL_TEMPLATES.filter((t) => [1, 2, 3, 4, 5, 6].includes(t.id as number)),
  },
  {
    id: 'new',
    title: 'New Releases',
    items: ALL_TEMPLATES.filter((t) => [7, 8, 9, 10].includes(t.id as number)),
  },
  {
    id: 'landing',
    title: 'Landing Pages',
    items: ALL_TEMPLATES.filter((t) => t.category === 'Landing Pages'),
  },
  {
    id: 'business',
    title: 'Business & Corporate',
    items: ALL_TEMPLATES.filter((t) => ['Business', 'Services', 'Real Estate', 'Finance'].includes(t.category)),
  },
  {
    id: 'dashboard',
    title: 'Dashboards & Admin',
    items: ALL_TEMPLATES.filter((t) => t.category === 'Dashboard'),
  },
  {
    id: 'portfolio',
    title: 'Portfolios & Creative',
    items: ALL_TEMPLATES.filter((t) => ['Gallery', 'Agency', 'Developer', 'Photography'].includes(t.category)),
  },
];

// ===== Merge utilities — bridge admin overrides/uploads to public pages =====

// Combine built-in templates (with admin overrides) + active custom uploads
export function getAllMergedTemplates(builtInOverrides: Record<string | number, Partial<Template>> = {}, adminTemplates: Template[] = []): Template[] {
  const merged = ALL_TEMPLATES.map((t) => {
    const override = builtInOverrides[t.id];
    return override ? { ...t, ...override } : t;
  });
  const activeCustom = adminTemplates.filter((t) => t.status === 'active');
  return [...merged, ...activeCustom];
}

// Look up any template by ID from merged sources
export function getTemplateByIdFromAll(id: number | string, builtInOverrides: Record<string | number, Partial<Template>> = {}, adminTemplates: Template[] = []): Template | null {
  const parsedId = typeof id === 'string' && /^\d+$/.test(id) ? parseInt(id) : id;
  const builtIn = ALL_TEMPLATES.find((t) => t.id === parsedId);
  if (builtIn) {
    const override = builtInOverrides[builtIn.id];
    return override ? { ...builtIn, ...override } : builtIn;
  }
  return adminTemplates.find((t) => t.id === parsedId || t.id === id) || null;
}

// Build dynamic category rows from merged templates (replaces static CATEGORIES on public page)
export function getDynamicCategories(mergedTemplates: Template[]): CategoryRow[] {
  const active = mergedTemplates.filter((t) => !t.status || t.status === 'active');

  // Categories that map to specific rows (includes both built-in and custom)
  const categoryRows = {
    'Landing Pages': 'landing',
    'Business': 'business', 'Services': 'business', 'Real Estate': 'business', 'Finance': 'business',
    'Dashboard': 'dashboard', 'Analytics': 'dashboard', 'Management': 'dashboard', 'PM': 'dashboard',
    'Gallery': 'portfolio', 'Agency': 'portfolio', 'Developer': 'portfolio', 'Photography': 'portfolio', 'Portfolio': 'portfolio',
    'Healthcare': 'healthcare',
    'E-Commerce': 'ecommerce',
    'Education': 'education',
    'Events': 'events',
    'SaaS': 'saas',
    'Blog': 'blog',
  };

  // Track which custom templates are placed in a category row
  const placedCustomIds = new Set();

  const rows = [
    {
      id: 'trending',
      title: 'Trending Now',
      items: active.filter((t) => [1, 2, 3, 4, 5, 6].includes(t.id as number)),
    },
    {
      id: 'new',
      title: 'New Releases',
      items: active.filter((t) => [7, 8, 9, 10].includes(t.id as number)),
    },
    {
      id: 'landing',
      title: 'Landing Pages',
      items: active.filter((t) => t.category === 'Landing Pages'),
    },
    {
      id: 'business',
      title: 'Business & Corporate',
      items: active.filter((t) => ['Business', 'Services', 'Real Estate', 'Finance'].includes(t.category)),
    },
    {
      id: 'dashboard',
      title: 'Dashboards & Admin',
      items: active.filter((t) => ['Dashboard', 'Analytics', 'Management', 'PM'].includes(t.category)),
    },
    {
      id: 'portfolio',
      title: 'Portfolios & Creative',
      items: active.filter((t) => ['Gallery', 'Agency', 'Developer', 'Photography', 'Portfolio'].includes(t.category)),
    },
    {
      id: 'ecommerce',
      title: 'E-Commerce & Stores',
      items: active.filter((t) => t.category === 'E-Commerce'),
    },
    {
      id: 'healthcare',
      title: 'Healthcare & Wellness',
      items: active.filter((t) => t.category === 'Healthcare'),
    },
    {
      id: 'education',
      title: 'Education & Learning',
      items: active.filter((t) => t.category === 'Education'),
    },
    {
      id: 'saas',
      title: 'SaaS & Software',
      items: active.filter((t) => ['SaaS', 'Launch', 'Venture'].includes(t.category)),
    },
  ];

  // Mark custom templates that landed in a category row
  for (const row of rows) {
    for (const t of row.items) {
      if (typeof t.id === 'string') placedCustomIds.add(t.id);
    }
  }

  // Custom Uploads row for custom templates not in any category row
  const unplacedCustom = active.filter((t) => typeof t.id === 'string' && !placedCustomIds.has(t.id));
  rows.push({
    id: 'custom',
    title: 'Custom Uploads',
    items: unplacedCustom,
  });

  return rows.filter((cat) => cat.items.length > 0);
}

// Instantiate a template into builder components (legacy — superseded by the
// full instantiateTemplate export below which uses TEMPLATE_STRUCTURES and
// SECTION_BLUEPRINTS; kept here only for reference, not exported)
function _instantiateTemplateLegacy(templateId: number | string) {
  const template = getTemplateById(templateId);
  if (!template) return [];

  const genId = () => `comp_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;

  const navbar = {
    id: genId(), type: 'navbar', locked: false, visible: true,
    name: 'Navbar',
    styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', backgroundColor: 'rgba(8,8,10,0.95)', backdropFilter: 'blur(20px)' },
    content: { brand: template.name, links: ['Home', 'About', 'Services', 'Contact'] },
    children: [],
  };

  const hero = {
    id: genId(), type: 'hero', locked: false, visible: true,
    name: 'Hero Section',
    styles: { minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '80px 20px', background: template.color ? `linear-gradient(135deg, ${template.color}30, #0a0a0f)` : 'linear-gradient(135deg, #0a0a0f, #1a1a24)' },
    content: null,
    children: [
      { id: genId(), type: 'heading', locked: false, visible: true, name: 'Hero Heading', styles: { fontSize: '52px', fontWeight: '700', color: '#f0f9ff', margin: '0 0 20px 0', textAlign: 'center' }, content: template.name, children: [] },
      { id: genId(), type: 'text', locked: false, visible: true, name: 'Hero Subtext', styles: { fontSize: '18px', color: '#a0a0a8', lineHeight: '1.6', margin: '0 0 32px 0', textAlign: 'center', maxWidth: '600px' }, content: template.description, children: [] },
      { id: genId(), type: 'button', locked: false, visible: true, name: 'CTA Button', styles: { padding: '14px 32px', backgroundColor: template.color || '#c8a43e', color: '#08080a', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }, content: 'Get Started', children: [] },
    ],
  };

  const features = {
    id: genId(), type: 'features-grid', locked: false, visible: true,
    name: 'Features',
    styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', padding: '60px 20px', backgroundColor: '#0f0f14' },
    content: null,
    children: (template.components || ['hero', 'features', 'contact']).slice(0, 3).map((compName) => ({
      id: genId(), type: 'testimonial-card', locked: false, visible: true,
      name: compName,
      styles: { padding: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' },
      content: { quote: `"${compName.charAt(0).toUpperCase() + compName.slice(1).replace(/-/g, ' ')} — a core feature of this template."`, author: template.name, role: template.category },
      children: [],
    })),
  };

  const footer = {
    id: genId(), type: 'footer', locked: false, visible: true,
    name: 'Footer',
    styles: { padding: '48px 20px', backgroundColor: '#050508', textAlign: 'center' },
    content: { brand: template.name, copyright: `© 2026 ${template.name}. All rights reserved.` },
    children: [],
  };

  return [navbar, hero, features, footer];
}

export default ALL_TEMPLATES;

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE_STRUCTURES — hand-crafted component trees for templates 1-4
// ─────────────────────────────────────────────────────────────────────────────

const _s = (extra: Record<string, any> = {}): Record<string, any> => ({ locked: false, visible: true, children: [], ...extra });

export const TEMPLATE_STRUCTURES: Record<number, Record<string, any>[]> = {
  // ── Template 1: Coastal Coffee ───────────────────────────────────────────
  1: [
    {
      ..._s(),
      type: 'navbar', name: 'Navbar',
      styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 48px', backgroundColor: 'rgba(20,10,5,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: '0', zIndex: '100', borderBottom: '1px solid rgba(255,140,60,0.15)' },
      content: { brand: 'Coastal Coffee', links: ['About', 'Menu', 'Hours', 'Contact'] },
    },
    {
      ..._s(),
      type: 'hero', name: 'Hero Section',
      styles: { minHeight: '620px', background: 'linear-gradient(135deg, #3b1a08 0%, #7c3a12 40%, #c8641e 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '100px 24px' },
      content: null,
      children: [
        { ..._s(), type: 'badge', name: 'Tag', styles: { display: 'inline-block', padding: '6px 16px', backgroundColor: 'rgba(255,165,60,0.2)', border: '1px solid rgba(255,165,60,0.4)', borderRadius: '20px', color: '#ffb347', fontSize: '13px', letterSpacing: '0.08em', marginBottom: '20px' }, content: 'Artisan Coffee Since 2009' },
        { ..._s(), type: 'heading', name: 'Hero Heading', styles: { fontSize: '58px', fontWeight: '800', color: '#fff8f0', margin: '0 0 20px 0', lineHeight: '1.15', maxWidth: '700px' }, content: 'Brewed with Love by the Sea' },
        { ..._s(), type: 'text', name: 'Hero Subtitle', styles: { fontSize: '19px', color: '#f5d9b8', lineHeight: '1.7', margin: '0 0 36px 0', maxWidth: '540px' }, content: 'Every cup tells a story. Hand-selected single-origin beans, roasted in small batches, served steps from the Pacific coast.' },
        { ..._s(), type: 'flex-row', name: 'CTA Row', styles: { display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }, children: [
          { ..._s(), type: 'button', name: 'Primary CTA', styles: { padding: '15px 36px', backgroundColor: '#c8641e', color: '#fff8f0', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.02em' }, content: 'View Our Menu' },
          { ..._s(), type: 'button', name: 'Secondary CTA', styles: { padding: '15px 36px', backgroundColor: 'transparent', color: '#ffb347', border: '2px solid #ffb347', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }, content: 'Find Us' },
        ]},
      ],
    },
    {
      ..._s(),
      type: 'section', name: 'About Section',
      styles: { padding: '90px 48px', backgroundColor: '#fdf6ee', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' },
      content: null,
      children: [
        { ..._s(), type: 'container', name: 'About Text', styles: {}, children: [
          { ..._s(), type: 'badge', name: 'Section Label', styles: { display: 'inline-block', padding: '4px 14px', backgroundColor: '#fde8cc', borderRadius: '20px', color: '#c8641e', fontSize: '12px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }, content: 'Our Story' },
          { ..._s(), type: 'heading', name: 'About Heading', styles: { fontSize: '40px', fontWeight: '800', color: '#2d1a0a', margin: '0 0 20px 0', lineHeight: '1.2' }, content: 'Where the Coast Meets the Cup' },
          { ..._s(), type: 'text', name: 'About Para 1', styles: { fontSize: '16px', color: '#5a3e2b', lineHeight: '1.8', marginBottom: '16px' }, content: 'Coastal Coffee was born from a simple belief: great coffee should feel like home. We source our beans directly from family farms in Ethiopia, Colombia, and Guatemala, building relationships that span decades.' },
          { ..._s(), type: 'text', name: 'About Para 2', styles: { fontSize: '16px', color: '#5a3e2b', lineHeight: '1.8', marginBottom: '28px' }, content: 'Our master roaster, Elena Vasquez, has spent 20 years perfecting the craft. Every roast profile is dialed in to highlight the natural sweetness, acidity, and complexity of each origin.' },
          { ..._s(), type: 'button', name: 'Learn More', styles: { padding: '12px 28px', backgroundColor: '#c8641e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'inline-block' }, content: 'Meet the Team' },
        ]},
        { ..._s(), type: 'image', name: 'About Image', styles: { width: '100%', height: '420px', objectFit: 'cover', borderRadius: '16px', backgroundColor: '#d4956a' }, content: { src: '/images/demo-coffee-hero.jpg', alt: 'Barista crafting espresso' } },
      ],
    },
    {
      ..._s(),
      type: 'section', name: 'Menu Section',
      styles: { padding: '90px 48px', backgroundColor: '#0f0a06' },
      content: null,
      children: [
        { ..._s(), type: 'container', name: 'Menu Header', styles: { textAlign: 'center', marginBottom: '56px' }, children: [
          { ..._s(), type: 'badge', name: 'Section Label', styles: { display: 'inline-block', padding: '4px 14px', backgroundColor: 'rgba(200,100,30,0.15)', borderRadius: '20px', color: '#ffb347', fontSize: '12px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }, content: 'What We Serve' },
          { ..._s(), type: 'heading', name: 'Menu Heading', styles: { fontSize: '42px', fontWeight: '800', color: '#fff8f0', margin: '0 0 12px 0' }, content: 'Our Menu' },
          { ..._s(), type: 'text', name: 'Menu Subtext', styles: { fontSize: '16px', color: '#a08060', maxWidth: '500px', margin: '0 auto' }, content: 'Crafted with intention. Every item on our menu is made to order with premium ingredients.' },
        ]},
        { ..._s(), type: 'grid', name: 'Menu Grid', styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }, children: [
          { ..._s(), type: 'container', name: 'Espresso Card', styles: { padding: '28px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,165,60,0.12)', borderRadius: '14px' }, children: [
            { ..._s(), type: 'heading', name: 'Item Name', styles: { fontSize: '20px', fontWeight: '700', color: '#fff8f0', marginBottom: '8px' }, content: 'Espresso' },
            { ..._s(), type: 'text', name: 'Item Desc', styles: { fontSize: '14px', color: '#a08060', lineHeight: '1.6', marginBottom: '16px' }, content: 'A bold, concentrated shot with velvety crema. Our signature blend balances dark chocolate and brown sugar notes.' },
            { ..._s(), type: 'badge', name: 'Item Price', styles: { display: 'inline-block', padding: '4px 12px', backgroundColor: 'rgba(200,100,30,0.2)', borderRadius: '6px', color: '#ffb347', fontSize: '15px', fontWeight: '700' }, content: '$3.50' },
          ]},
          { ..._s(), type: 'container', name: 'Latte Card', styles: { padding: '28px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,165,60,0.12)', borderRadius: '14px' }, children: [
            { ..._s(), type: 'heading', name: 'Item Name', styles: { fontSize: '20px', fontWeight: '700', color: '#fff8f0', marginBottom: '8px' }, content: 'Coastal Latte' },
            { ..._s(), type: 'text', name: 'Item Desc', styles: { fontSize: '14px', color: '#a08060', lineHeight: '1.6', marginBottom: '16px' }, content: 'Double espresso with steamed oat milk and a hint of vanilla bean. Silky, smooth, and utterly satisfying.' },
            { ..._s(), type: 'badge', name: 'Item Price', styles: { display: 'inline-block', padding: '4px 12px', backgroundColor: 'rgba(200,100,30,0.2)', borderRadius: '6px', color: '#ffb347', fontSize: '15px', fontWeight: '700' }, content: '$5.25' },
          ]},
          { ..._s(), type: 'container', name: 'Cold Brew Card', styles: { padding: '28px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,165,60,0.12)', borderRadius: '14px' }, children: [
            { ..._s(), type: 'heading', name: 'Item Name', styles: { fontSize: '20px', fontWeight: '700', color: '#fff8f0', marginBottom: '8px' }, content: 'Cold Brew' },
            { ..._s(), type: 'text', name: 'Item Desc', styles: { fontSize: '14px', color: '#a08060', lineHeight: '1.6', marginBottom: '16px' }, content: 'Steeped for 18 hours in filtered water. Smooth, low-acid, and naturally sweet with notes of dark cherry.' },
            { ..._s(), type: 'badge', name: 'Item Price', styles: { display: 'inline-block', padding: '4px 12px', backgroundColor: 'rgba(200,100,30,0.2)', borderRadius: '6px', color: '#ffb347', fontSize: '15px', fontWeight: '700' }, content: '$5.75' },
          ]},
          { ..._s(), type: 'container', name: 'Pastries Card', styles: { padding: '28px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,165,60,0.12)', borderRadius: '14px' }, children: [
            { ..._s(), type: 'heading', name: 'Item Name', styles: { fontSize: '20px', fontWeight: '700', color: '#fff8f0', marginBottom: '8px' }, content: 'Pastries' },
            { ..._s(), type: 'text', name: 'Item Desc', styles: { fontSize: '14px', color: '#a08060', lineHeight: '1.6', marginBottom: '16px' }, content: 'Freshly baked daily. Croissants, scones, and seasonal muffins sourced from Harbor Bakehouse down the street.' },
            { ..._s(), type: 'badge', name: 'Item Price', styles: { display: 'inline-block', padding: '4px 12px', backgroundColor: 'rgba(200,100,30,0.2)', borderRadius: '6px', color: '#ffb347', fontSize: '15px', fontWeight: '700' }, content: 'From $3.00' },
          ]},
          { ..._s(), type: 'container', name: 'Breakfast Card', styles: { padding: '28px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,165,60,0.12)', borderRadius: '14px' }, children: [
            { ..._s(), type: 'heading', name: 'Item Name', styles: { fontSize: '20px', fontWeight: '700', color: '#fff8f0', marginBottom: '8px' }, content: 'Breakfast Bowls' },
            { ..._s(), type: 'text', name: 'Item Desc', styles: { fontSize: '14px', color: '#a08060', lineHeight: '1.6', marginBottom: '16px' }, content: 'Açaí, granola, and seasonal fruit bowls. Satisfying, nutritious, and ready in under 5 minutes.' },
            { ..._s(), type: 'badge', name: 'Item Price', styles: { display: 'inline-block', padding: '4px 12px', backgroundColor: 'rgba(200,100,30,0.2)', borderRadius: '6px', color: '#ffb347', fontSize: '15px', fontWeight: '700' }, content: '$9.50' },
          ]},
          { ..._s(), type: 'container', name: 'Smoothies Card', styles: { padding: '28px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,165,60,0.12)', borderRadius: '14px' }, children: [
            { ..._s(), type: 'heading', name: 'Item Name', styles: { fontSize: '20px', fontWeight: '700', color: '#fff8f0', marginBottom: '8px' }, content: 'Smoothies' },
            { ..._s(), type: 'text', name: 'Item Desc', styles: { fontSize: '14px', color: '#a08060', lineHeight: '1.6', marginBottom: '16px' }, content: 'Blended fresh to order. Mango Sunrise, Green Detox, and Berry Bliss — all made with whole fruit, no syrups.' },
            { ..._s(), type: 'badge', name: 'Item Price', styles: { display: 'inline-block', padding: '4px 12px', backgroundColor: 'rgba(200,100,30,0.2)', borderRadius: '6px', color: '#ffb347', fontSize: '15px', fontWeight: '700' }, content: '$7.50' },
          ]},
        ]},
      ],
    },
    {
      ..._s(),
      type: 'section', name: 'Hours & Location',
      styles: { padding: '90px 48px', backgroundColor: '#fdf6ee', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'start' },
      content: null,
      children: [
        { ..._s(), type: 'container', name: 'Location Info', styles: {}, children: [
          { ..._s(), type: 'heading', name: 'Location Heading', styles: { fontSize: '40px', fontWeight: '800', color: '#2d1a0a', margin: '0 0 24px 0' }, content: 'Visit Us' },
          { ..._s(), type: 'text', name: 'Address', styles: { fontSize: '16px', color: '#5a3e2b', marginBottom: '8px', fontWeight: '600' }, content: '142 Shoreline Drive, Santa Cruz, CA 95060' },
          { ..._s(), type: 'divider', name: 'Divider', styles: { height: '1px', backgroundColor: '#e8d8c4', margin: '24px 0' }, content: null },
          { ..._s(), type: 'heading', name: 'Hours Heading', styles: { fontSize: '22px', fontWeight: '700', color: '#2d1a0a', marginBottom: '16px' }, content: 'Hours' },
          { ..._s(), type: 'list', name: 'Hours List', styles: { listStyle: 'none', padding: '0', margin: '0', display: 'flex', flexDirection: 'column', gap: '10px' }, content: [
            { label: 'Mon – Fri', value: '6:30 AM – 7:00 PM' },
            { label: 'Saturday', value: '7:00 AM – 8:00 PM' },
            { label: 'Sunday', value: '8:00 AM – 6:00 PM' },
          ]},
        ]},
        { ..._s(), type: 'map-embed', name: 'Map', styles: { width: '100%', height: '380px', borderRadius: '16px', backgroundColor: '#d4c4b0', border: '1px solid #e8d8c4' }, content: { lat: 36.9741, lng: -122.0308, zoom: 15, address: '142 Shoreline Drive, Santa Cruz, CA' } },
      ],
    },
    {
      ..._s(),
      type: 'contact-section', name: 'Contact Form',
      styles: { padding: '90px 48px', backgroundColor: '#0f0a06' },
      content: null,
      children: [
        { ..._s(), type: 'heading', name: 'Contact Heading', styles: { fontSize: '40px', fontWeight: '800', color: '#fff8f0', textAlign: 'center', marginBottom: '12px' }, content: 'Get in Touch' },
        { ..._s(), type: 'text', name: 'Contact Subtext', styles: { fontSize: '16px', color: '#a08060', textAlign: 'center', marginBottom: '48px' }, content: 'Questions, catering inquiries, or just want to say hello? We love hearing from our community.' },
        { ..._s(), type: 'form', name: 'Contact Form', styles: { maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }, content: { fields: [{ name: 'name', label: 'Your Name', type: 'text' }, { name: 'email', label: 'Email Address', type: 'email' }, { name: 'message', label: 'Message', type: 'textarea' }], submitLabel: 'Send Message' } },
      ],
    },
    {
      ..._s(),
      type: 'footer', name: 'Footer',
      styles: { padding: '48px 48px 32px', backgroundColor: '#050302', borderTop: '1px solid rgba(255,165,60,0.1)' },
      content: { brand: 'Coastal Coffee', copyright: '© 2026 Coastal Coffee. All rights reserved.', links: ['Instagram', 'Facebook', 'TikTok'] },
    },
  ],

  // ── Template 2: Summit Law ───────────────────────────────────────────────
  2: [
    {
      ..._s(),
      type: 'navbar', name: 'Navbar',
      styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 56px', backgroundColor: '#0d1b2a', borderBottom: '1px solid rgba(192,132,252,0.12)', position: 'sticky', top: '0', zIndex: '100' },
      content: { brand: 'Summit Law Group', links: ['Practice Areas', 'Attorneys', 'Case Results', 'Contact'] },
    },
    {
      ..._s(),
      type: 'hero', name: 'Hero Section',
      styles: { minHeight: '640px', background: 'linear-gradient(135deg, #0d1b2a 0%, #1a2d45 50%, #0f2347 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '100px 24px' },
      content: null,
      children: [
        { ..._s(), type: 'badge', name: 'Credential Badge', styles: { display: 'inline-block', padding: '6px 16px', backgroundColor: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.35)', borderRadius: '20px', color: '#c084fc', fontSize: '13px', letterSpacing: '0.08em', marginBottom: '24px' }, content: 'Serving California Since 1998' },
        { ..._s(), type: 'heading', name: 'Hero Heading', styles: { fontSize: '62px', fontWeight: '800', color: '#f0f8ff', margin: '0 0 20px 0', lineHeight: '1.1', maxWidth: '760px' }, content: 'Justice. Strategy. Results.' },
        { ..._s(), type: 'text', name: 'Hero Subtitle', styles: { fontSize: '19px', color: '#94b8d8', lineHeight: '1.75', margin: '0 0 40px 0', maxWidth: '580px' }, content: 'When the stakes are high, you need counsel that combines rigorous legal strategy with unwavering commitment to your outcome.' },
        { ..._s(), type: 'flex-row', name: 'CTA Row', styles: { display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }, children: [
          { ..._s(), type: 'button', name: 'Primary CTA', styles: { padding: '16px 40px', backgroundColor: '#c084fc', color: '#0d1b2a', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }, content: 'Free Consultation' },
          { ..._s(), type: 'button', name: 'Secondary CTA', styles: { padding: '16px 40px', backgroundColor: 'transparent', color: '#94b8d8', border: '2px solid #94b8d8', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }, content: 'View Case Results' },
        ]},
      ],
    },
    {
      ..._s(),
      type: 'section', name: 'Practice Areas',
      styles: { padding: '96px 56px', backgroundColor: '#f8fafc' },
      content: null,
      children: [
        { ..._s(), type: 'container', name: 'Section Header', styles: { textAlign: 'center', marginBottom: '60px' }, children: [
          { ..._s(), type: 'badge', name: 'Label', styles: { display: 'inline-block', padding: '4px 14px', backgroundColor: '#ede9fe', borderRadius: '20px', color: '#7c3aed', fontSize: '12px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }, content: 'What We Do' },
          { ..._s(), type: 'heading', name: 'Section Heading', styles: { fontSize: '44px', fontWeight: '800', color: '#0d1b2a', margin: '0 0 14px 0' }, content: 'Practice Areas' },
          { ..._s(), type: 'text', name: 'Section Subtext', styles: { fontSize: '17px', color: '#64748b', maxWidth: '540px', margin: '0 auto' }, content: 'Decades of specialized expertise across the full spectrum of civil and criminal law.' },
        ]},
        { ..._s(), type: 'grid', name: 'Practice Grid', styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }, children: [
          { ..._s(), type: 'container', name: 'Personal Injury', styles: { padding: '32px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', borderTop: '4px solid #c084fc' }, children: [
            { ..._s(), type: 'icon', name: 'Icon', styles: { fontSize: '32px', marginBottom: '16px' }, content: '⚖️' },
            { ..._s(), type: 'heading', name: 'Area Title', styles: { fontSize: '20px', fontWeight: '700', color: '#0d1b2a', marginBottom: '10px' }, content: 'Personal Injury' },
            { ..._s(), type: 'text', name: 'Area Desc', styles: { fontSize: '14px', color: '#64748b', lineHeight: '1.7' }, content: 'Accidents, medical malpractice, and wrongful death. We fight for maximum compensation with no upfront fees.' },
          ]},
          { ..._s(), type: 'container', name: 'Business Litigation', styles: { padding: '32px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', borderTop: '4px solid #c084fc' }, children: [
            { ..._s(), type: 'icon', name: 'Icon', styles: { fontSize: '32px', marginBottom: '16px' }, content: '🏛️' },
            { ..._s(), type: 'heading', name: 'Area Title', styles: { fontSize: '20px', fontWeight: '700', color: '#0d1b2a', marginBottom: '10px' }, content: 'Business Litigation' },
            { ..._s(), type: 'text', name: 'Area Desc', styles: { fontSize: '14px', color: '#64748b', lineHeight: '1.7' }, content: 'Contract disputes, shareholder conflicts, trade secret protection, and commercial litigation at every stage.' },
          ]},
          { ..._s(), type: 'container', name: 'Family Law', styles: { padding: '32px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', borderTop: '4px solid #c084fc' }, children: [
            { ..._s(), type: 'icon', name: 'Icon', styles: { fontSize: '32px', marginBottom: '16px' }, content: '🏠' },
            { ..._s(), type: 'heading', name: 'Area Title', styles: { fontSize: '20px', fontWeight: '700', color: '#0d1b2a', marginBottom: '10px' }, content: 'Family Law' },
            { ..._s(), type: 'text', name: 'Area Desc', styles: { fontSize: '14px', color: '#64748b', lineHeight: '1.7' }, content: 'Divorce, custody, adoption, and domestic partnerships handled with discretion and compassion.' },
          ]},
          { ..._s(), type: 'container', name: 'Estate Planning', styles: { padding: '32px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', borderTop: '4px solid #c084fc' }, children: [
            { ..._s(), type: 'icon', name: 'Icon', styles: { fontSize: '32px', marginBottom: '16px' }, content: '📋' },
            { ..._s(), type: 'heading', name: 'Area Title', styles: { fontSize: '20px', fontWeight: '700', color: '#0d1b2a', marginBottom: '10px' }, content: 'Estate Planning' },
            { ..._s(), type: 'text', name: 'Area Desc', styles: { fontSize: '14px', color: '#64748b', lineHeight: '1.7' }, content: 'Wills, trusts, powers of attorney, and probate administration. Protect your legacy on your terms.' },
          ]},
          { ..._s(), type: 'container', name: 'Criminal Defense', styles: { padding: '32px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', borderTop: '4px solid #c084fc' }, children: [
            { ..._s(), type: 'icon', name: 'Icon', styles: { fontSize: '32px', marginBottom: '16px' }, content: '🛡️' },
            { ..._s(), type: 'heading', name: 'Area Title', styles: { fontSize: '20px', fontWeight: '700', color: '#0d1b2a', marginBottom: '10px' }, content: 'Criminal Defense' },
            { ..._s(), type: 'text', name: 'Area Desc', styles: { fontSize: '14px', color: '#64748b', lineHeight: '1.7' }, content: 'Felonies, misdemeanors, DUI, and white-collar crime. Aggressive defense from arraignment through trial.' },
          ]},
          { ..._s(), type: 'container', name: 'Employment Law', styles: { padding: '32px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', borderTop: '4px solid #c084fc' }, children: [
            { ..._s(), type: 'icon', name: 'Icon', styles: { fontSize: '32px', marginBottom: '16px' }, content: '💼' },
            { ..._s(), type: 'heading', name: 'Area Title', styles: { fontSize: '20px', fontWeight: '700', color: '#0d1b2a', marginBottom: '10px' }, content: 'Employment Law' },
            { ..._s(), type: 'text', name: 'Area Desc', styles: { fontSize: '14px', color: '#64748b', lineHeight: '1.7' }, content: 'Wrongful termination, discrimination, harassment, wage theft, and whistleblower protection.' },
          ]},
        ]},
      ],
    },
    {
      ..._s(),
      type: 'section', name: 'Attorney Team',
      styles: { padding: '96px 56px', backgroundColor: '#0d1b2a' },
      content: null,
      children: [
        { ..._s(), type: 'container', name: 'Section Header', styles: { textAlign: 'center', marginBottom: '60px' }, children: [
          { ..._s(), type: 'heading', name: 'Team Heading', styles: { fontSize: '44px', fontWeight: '800', color: '#f0f8ff', marginBottom: '12px' }, content: 'Our Attorneys' },
          { ..._s(), type: 'text', name: 'Team Subtext', styles: { fontSize: '17px', color: '#94b8d8', maxWidth: '520px', margin: '0 auto' }, content: 'A team of dedicated legal professionals with proven track records across dozens of practice areas.' },
        ]},
        { ..._s(), type: 'team-grid', name: 'Attorney Grid', styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }, content: { members: [
          { name: 'Margaret Chen', title: 'Managing Partner', specialty: 'Business Litigation', image: '/images/team-1.jpg' },
          { name: 'David Okafor', title: 'Senior Partner', specialty: 'Personal Injury', image: '/images/team-2.jpg' },
          { name: 'Sarah Reyes', title: 'Partner', specialty: 'Family Law & Estate', image: '/images/team-3.jpg' },
        ]}},
      ],
    },
    {
      ..._s(),
      type: 'stats-counter', name: 'Case Results',
      styles: { padding: '80px 56px', backgroundColor: '#1a2d45', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', textAlign: 'center' },
      content: { stats: [
        { value: '500+', label: 'Cases Won' },
        { value: '$50M+', label: 'Recovered for Clients' },
        { value: '25+', label: 'Years of Experience' },
        { value: '98%', label: 'Client Success Rate' },
      ]},
    },
    {
      ..._s(),
      type: 'section', name: 'Testimonials',
      styles: { padding: '96px 56px', backgroundColor: '#f8fafc' },
      content: null,
      children: [
        { ..._s(), type: 'heading', name: 'Testimonials Heading', styles: { fontSize: '44px', fontWeight: '800', color: '#0d1b2a', textAlign: 'center', marginBottom: '48px' }, content: 'What Our Clients Say' },
        { ..._s(), type: 'grid', name: 'Testimonials Grid', styles: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }, children: [
          { ..._s(), type: 'testimonial-card', name: 'Testimonial 1', styles: { padding: '36px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', borderLeft: '4px solid #c084fc' }, content: { quote: '"Summit Law Group fought tirelessly for my family after a devastating accident. Their expertise and genuine care made all the difference. We recovered far more than we expected."', author: 'James Holloway', role: 'Personal Injury Client' } },
          { ..._s(), type: 'testimonial-card', name: 'Testimonial 2', styles: { padding: '36px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', borderLeft: '4px solid #c084fc' }, content: { quote: '"The business litigation team at Summit handled our contract dispute with remarkable precision. They understood the commercial stakes and delivered a favorable resolution efficiently."', author: 'Priya Nambiar', role: 'Business Litigation Client' } },
        ]},
      ],
    },
    {
      ..._s(),
      type: 'contact-section', name: 'Contact',
      styles: { padding: '96px 56px', backgroundColor: '#0d1b2a', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'start' },
      content: null,
      children: [
        { ..._s(), type: 'container', name: 'Contact Info', styles: {}, children: [
          { ..._s(), type: 'heading', name: 'Contact Heading', styles: { fontSize: '40px', fontWeight: '800', color: '#f0f8ff', marginBottom: '20px' }, content: 'Schedule a Free Consultation' },
          { ..._s(), type: 'text', name: 'Contact Para', styles: { fontSize: '16px', color: '#94b8d8', lineHeight: '1.8', marginBottom: '32px' }, content: 'Your first consultation is always free. Speak with an attorney who will listen, evaluate your case honestly, and explain your options clearly.' },
          { ..._s(), type: 'list', name: 'Contact Details', styles: { listStyle: 'none', padding: '0', display: 'flex', flexDirection: 'column', gap: '12px' }, content: [
            { label: 'Phone', value: '(415) 882-4400' },
            { label: 'Email', value: 'consult@summitlawgroup.com' },
            { label: 'Address', value: '350 Market Street, Suite 2200, San Francisco, CA 94105' },
          ]},
        ]},
        { ..._s(), type: 'form', name: 'Contact Form', styles: { display: 'flex', flexDirection: 'column', gap: '16px' }, content: { fields: [{ name: 'name', label: 'Full Name', type: 'text' }, { name: 'phone', label: 'Phone Number', type: 'tel' }, { name: 'area', label: 'Practice Area', type: 'select', options: ['Personal Injury', 'Business Litigation', 'Family Law', 'Estate Planning', 'Criminal Defense', 'Employment Law'] }, { name: 'message', label: 'Brief Description', type: 'textarea' }], submitLabel: 'Request Consultation' } },
      ],
    },
    {
      ..._s(),
      type: 'footer', name: 'Footer',
      styles: { padding: '64px 56px 32px', backgroundColor: '#060d14', borderTop: '1px solid rgba(192,132,252,0.1)' },
      content: { brand: 'Summit Law Group', copyright: '© 2026 Summit Law Group LLP. All rights reserved. Attorney advertising. Prior results do not guarantee similar outcomes.', columns: [
        { heading: 'Quick Links', links: ['Home', 'About the Firm', 'Attorneys', 'Contact'] },
        { heading: 'Practice Areas', links: ['Personal Injury', 'Business Litigation', 'Family Law', 'Estate Planning', 'Criminal Defense'] },
        { heading: 'Contact', lines: ['350 Market Street, Suite 2200', 'San Francisco, CA 94105', '(415) 882-4400', 'consult@summitlawgroup.com'] },
      ]},
    },
  ],

  // ── Template 3: Bella Spa ────────────────────────────────────────────────
  3: [
    {
      ..._s(),
      type: 'navbar', name: 'Navbar',
      styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 48px', backgroundColor: 'rgba(252,245,251,0.96)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(220,160,200,0.2)', position: 'sticky', top: '0', zIndex: '100' },
      content: { brand: 'Bella Spa & Wellness', links: ['Services', 'Booking', 'Membership', 'Gallery', 'Contact'] },
    },
    {
      ..._s(),
      type: 'hero', name: 'Hero Section',
      styles: { minHeight: '640px', background: 'linear-gradient(135deg, #fce4f0 0%, #e8d5f5 50%, #d4e8f8 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '100px 24px' },
      content: null,
      children: [
        { ..._s(), type: 'badge', name: 'Tag', styles: { display: 'inline-block', padding: '6px 18px', backgroundColor: 'rgba(180,100,160,0.12)', border: '1px solid rgba(180,100,160,0.3)', borderRadius: '20px', color: '#9b4fa0', fontSize: '13px', letterSpacing: '0.08em', marginBottom: '24px' }, content: 'Luxury Wellness Since 2015' },
        { ..._s(), type: 'heading', name: 'Hero Heading', styles: { fontSize: '60px', fontWeight: '800', color: '#3a1f3a', margin: '0 0 20px 0', lineHeight: '1.15', maxWidth: '680px', fontStyle: 'italic' }, content: 'Relax. Renew. Rejuvenate.' },
        { ..._s(), type: 'text', name: 'Hero Subtitle', styles: { fontSize: '19px', color: '#6b4470', lineHeight: '1.75', margin: '0 0 40px 0', maxWidth: '520px' }, content: 'A sanctuary of calm in the heart of the city. Award-winning treatments, expert therapists, and an atmosphere designed for your total well-being.' },
        { ..._s(), type: 'flex-row', name: 'CTA Row', styles: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }, children: [
          { ..._s(), type: 'button', name: 'Book Now', styles: { padding: '16px 40px', backgroundColor: '#9b4fa0', color: '#fff', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.02em' }, content: 'Book Now' },
          { ..._s(), type: 'button', name: 'View Services', styles: { padding: '16px 40px', backgroundColor: 'transparent', color: '#9b4fa0', border: '2px solid #9b4fa0', borderRadius: '50px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }, content: 'Explore Services' },
        ]},
      ],
    },
    {
      ..._s(),
      type: 'section', name: 'Services',
      styles: { padding: '96px 48px', backgroundColor: '#fdf8fc' },
      content: null,
      children: [
        { ..._s(), type: 'container', name: 'Section Header', styles: { textAlign: 'center', marginBottom: '60px' }, children: [
          { ..._s(), type: 'heading', name: 'Services Heading', styles: { fontSize: '44px', fontWeight: '800', color: '#3a1f3a', marginBottom: '12px' }, content: 'Our Services' },
          { ..._s(), type: 'text', name: 'Services Subtext', styles: { fontSize: '17px', color: '#6b4470', maxWidth: '500px', margin: '0 auto' }, content: 'Every treatment is a ritual. Every ritual is an experience. Crafted exclusively for you.' },
        ]},
        { ..._s(), type: 'grid', name: 'Services Grid', styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }, children: [
          { ..._s(), type: 'container', name: 'Deep Tissue', styles: { padding: '32px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f0d8ec', textAlign: 'center' }, children: [
            { ..._s(), type: 'icon', name: 'Icon', styles: { fontSize: '40px', marginBottom: '16px', display: 'block' }, content: '🌿' },
            { ..._s(), type: 'heading', name: 'Service Name', styles: { fontSize: '20px', fontWeight: '700', color: '#3a1f3a', marginBottom: '8px' }, content: 'Deep Tissue Massage' },
            { ..._s(), type: 'text', name: 'Service Desc', styles: { fontSize: '14px', color: '#7a5080', lineHeight: '1.7', marginBottom: '16px' }, content: 'Targeted muscle tension relief using advanced therapeutic techniques. Ideal for chronic pain and athletic recovery.' },
            { ..._s(), type: 'flex-row', name: 'Meta Row', styles: { display: 'flex', justifyContent: 'center', gap: '16px' }, children: [
              { ..._s(), type: 'badge', name: 'Duration', styles: { padding: '4px 12px', backgroundColor: '#f5e8f5', borderRadius: '6px', color: '#9b4fa0', fontSize: '13px', fontWeight: '600' }, content: '60 / 90 min' },
              { ..._s(), type: 'badge', name: 'Price', styles: { padding: '4px 12px', backgroundColor: '#f5e8f5', borderRadius: '6px', color: '#9b4fa0', fontSize: '13px', fontWeight: '600' }, content: 'From $95' },
            ]},
          ]},
          { ..._s(), type: 'container', name: 'Facial', styles: { padding: '32px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f0d8ec', textAlign: 'center' }, children: [
            { ..._s(), type: 'icon', name: 'Icon', styles: { fontSize: '40px', marginBottom: '16px', display: 'block' }, content: '✨' },
            { ..._s(), type: 'heading', name: 'Service Name', styles: { fontSize: '20px', fontWeight: '700', color: '#3a1f3a', marginBottom: '8px' }, content: 'Signature Facial' },
            { ..._s(), type: 'text', name: 'Service Desc', styles: { fontSize: '14px', color: '#7a5080', lineHeight: '1.7', marginBottom: '16px' }, content: 'Customized to your skin type using professional-grade botanicals. Includes cleanse, exfoliation, mask, and targeted serums.' },
            { ..._s(), type: 'flex-row', name: 'Meta Row', styles: { display: 'flex', justifyContent: 'center', gap: '16px' }, children: [
              { ..._s(), type: 'badge', name: 'Duration', styles: { padding: '4px 12px', backgroundColor: '#f5e8f5', borderRadius: '6px', color: '#9b4fa0', fontSize: '13px', fontWeight: '600' }, content: '75 min' },
              { ..._s(), type: 'badge', name: 'Price', styles: { padding: '4px 12px', backgroundColor: '#f5e8f5', borderRadius: '6px', color: '#9b4fa0', fontSize: '13px', fontWeight: '600' }, content: 'From $120' },
            ]},
          ]},
          { ..._s(), type: 'container', name: 'Aromatherapy', styles: { padding: '32px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f0d8ec', textAlign: 'center' }, children: [
            { ..._s(), type: 'icon', name: 'Icon', styles: { fontSize: '40px', marginBottom: '16px', display: 'block' }, content: '🌸' },
            { ..._s(), type: 'heading', name: 'Service Name', styles: { fontSize: '20px', fontWeight: '700', color: '#3a1f3a', marginBottom: '8px' }, content: 'Aromatherapy' },
            { ..._s(), type: 'text', name: 'Service Desc', styles: { fontSize: '14px', color: '#7a5080', lineHeight: '1.7', marginBottom: '16px' }, content: 'Full-body relaxation with therapeutic essential oil blends. Lavender, eucalyptus, and rose blends for total sensory immersion.' },
            { ..._s(), type: 'flex-row', name: 'Meta Row', styles: { display: 'flex', justifyContent: 'center', gap: '16px' }, children: [
              { ..._s(), type: 'badge', name: 'Duration', styles: { padding: '4px 12px', backgroundColor: '#f5e8f5', borderRadius: '6px', color: '#9b4fa0', fontSize: '13px', fontWeight: '600' }, content: '60 min' },
              { ..._s(), type: 'badge', name: 'Price', styles: { padding: '4px 12px', backgroundColor: '#f5e8f5', borderRadius: '6px', color: '#9b4fa0', fontSize: '13px', fontWeight: '600' }, content: 'From $85' },
            ]},
          ]},
          { ..._s(), type: 'container', name: 'Hot Stone', styles: { padding: '32px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f0d8ec', textAlign: 'center' }, children: [
            { ..._s(), type: 'icon', name: 'Icon', styles: { fontSize: '40px', marginBottom: '16px', display: 'block' }, content: '🪨' },
            { ..._s(), type: 'heading', name: 'Service Name', styles: { fontSize: '20px', fontWeight: '700', color: '#3a1f3a', marginBottom: '8px' }, content: 'Hot Stone Therapy' },
            { ..._s(), type: 'text', name: 'Service Desc', styles: { fontSize: '14px', color: '#7a5080', lineHeight: '1.7', marginBottom: '16px' }, content: 'Heated basalt stones melt away tension while improving circulation and promoting deep muscular relaxation.' },
            { ..._s(), type: 'flex-row', name: 'Meta Row', styles: { display: 'flex', justifyContent: 'center', gap: '16px' }, children: [
              { ..._s(), type: 'badge', name: 'Duration', styles: { padding: '4px 12px', backgroundColor: '#f5e8f5', borderRadius: '6px', color: '#9b4fa0', fontSize: '13px', fontWeight: '600' }, content: '90 min' },
              { ..._s(), type: 'badge', name: 'Price', styles: { padding: '4px 12px', backgroundColor: '#f5e8f5', borderRadius: '6px', color: '#9b4fa0', fontSize: '13px', fontWeight: '600' }, content: 'From $135' },
            ]},
          ]},
          { ..._s(), type: 'container', name: 'Mani Pedi', styles: { padding: '32px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f0d8ec', textAlign: 'center' }, children: [
            { ..._s(), type: 'icon', name: 'Icon', styles: { fontSize: '40px', marginBottom: '16px', display: 'block' }, content: '💅' },
            { ..._s(), type: 'heading', name: 'Service Name', styles: { fontSize: '20px', fontWeight: '700', color: '#3a1f3a', marginBottom: '8px' }, content: 'Manicure & Pedicure' },
            { ..._s(), type: 'text', name: 'Service Desc', styles: { fontSize: '14px', color: '#7a5080', lineHeight: '1.7', marginBottom: '16px' }, content: 'Luxurious nail care with premium polishes, cuticle treatment, and paraffin dip. Classic and gel options available.' },
            { ..._s(), type: 'flex-row', name: 'Meta Row', styles: { display: 'flex', justifyContent: 'center', gap: '16px' }, children: [
              { ..._s(), type: 'badge', name: 'Duration', styles: { padding: '4px 12px', backgroundColor: '#f5e8f5', borderRadius: '6px', color: '#9b4fa0', fontSize: '13px', fontWeight: '600' }, content: '75 min' },
              { ..._s(), type: 'badge', name: 'Price', styles: { padding: '4px 12px', backgroundColor: '#f5e8f5', borderRadius: '6px', color: '#9b4fa0', fontSize: '13px', fontWeight: '600' }, content: 'From $75' },
            ]},
          ]},
          { ..._s(), type: 'container', name: 'Body Wrap', styles: { padding: '32px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f0d8ec', textAlign: 'center' }, children: [
            { ..._s(), type: 'icon', name: 'Icon', styles: { fontSize: '40px', marginBottom: '16px', display: 'block' }, content: '🫧' },
            { ..._s(), type: 'heading', name: 'Service Name', styles: { fontSize: '20px', fontWeight: '700', color: '#3a1f3a', marginBottom: '8px' }, content: 'Detox Body Wrap' },
            { ..._s(), type: 'text', name: 'Service Desc', styles: { fontSize: '14px', color: '#7a5080', lineHeight: '1.7', marginBottom: '16px' }, content: 'Mineral-rich seaweed and clay wrap that draws out toxins, tightens skin, and leaves you feeling completely renewed.' },
            { ..._s(), type: 'flex-row', name: 'Meta Row', styles: { display: 'flex', justifyContent: 'center', gap: '16px' }, children: [
              { ..._s(), type: 'badge', name: 'Duration', styles: { padding: '4px 12px', backgroundColor: '#f5e8f5', borderRadius: '6px', color: '#9b4fa0', fontSize: '13px', fontWeight: '600' }, content: '90 min' },
              { ..._s(), type: 'badge', name: 'Price', styles: { padding: '4px 12px', backgroundColor: '#f5e8f5', borderRadius: '6px', color: '#9b4fa0', fontSize: '13px', fontWeight: '600' }, content: 'From $140' },
            ]},
          ]},
        ]},
      ],
    },
    {
      ..._s(),
      type: 'section', name: 'Booking',
      styles: { padding: '96px 48px', background: 'linear-gradient(135deg, #f5e8f5, #e8d5f5)' },
      content: null,
      children: [
        { ..._s(), type: 'container', name: 'Booking Inner', styles: { maxWidth: '640px', margin: '0 auto', textAlign: 'center' }, children: [
          { ..._s(), type: 'heading', name: 'Booking Heading', styles: { fontSize: '44px', fontWeight: '800', color: '#3a1f3a', marginBottom: '12px' }, content: 'Book Your Treatment' },
          { ..._s(), type: 'text', name: 'Booking Subtext', styles: { fontSize: '17px', color: '#6b4470', marginBottom: '40px' }, content: 'Reserve your session in minutes. We confirm within 2 hours and send a reminder the day before.' },
          { ..._s(), type: 'form', name: 'Booking Form', styles: { display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }, content: { fields: [{ name: 'service', label: 'Select Service', type: 'select', options: ['Deep Tissue Massage', 'Signature Facial', 'Aromatherapy', 'Hot Stone Therapy', 'Manicure & Pedicure', 'Detox Body Wrap'] }, { name: 'date', label: 'Preferred Date', type: 'date' }, { name: 'time', label: 'Preferred Time', type: 'select', options: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'] }, { name: 'name', label: 'Full Name', type: 'text' }, { name: 'phone', label: 'Phone Number', type: 'tel' }], submitLabel: 'Request Appointment' } },
        ]},
      ],
    },
    {
      ..._s(),
      type: 'section', name: 'Gallery',
      styles: { padding: '96px 48px', backgroundColor: '#fdf8fc' },
      content: null,
      children: [
        { ..._s(), type: 'heading', name: 'Gallery Heading', styles: { fontSize: '44px', fontWeight: '800', color: '#3a1f3a', textAlign: 'center', marginBottom: '48px' }, content: 'Our Space' },
        { ..._s(), type: 'image-gallery', name: 'Gallery Grid', styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }, content: { images: [
          { src: '/images/spa-1.jpg', alt: 'Treatment room' },
          { src: '/images/spa-2.jpg', alt: 'Relaxation lounge' },
          { src: '/images/spa-3.jpg', alt: 'Massage suite' },
          { src: '/images/spa-4.jpg', alt: 'Facial room' },
          { src: '/images/spa-5.jpg', alt: 'Reception' },
          { src: '/images/spa-6.jpg', alt: 'Steam room' },
        ]}},
      ],
    },
    {
      ..._s(),
      type: 'section', name: 'Testimonials',
      styles: { padding: '96px 48px', background: 'linear-gradient(180deg, #f5e8f5 0%, #fdf8fc 100%)' },
      content: null,
      children: [
        { ..._s(), type: 'heading', name: 'Testimonials Heading', styles: { fontSize: '44px', fontWeight: '800', color: '#3a1f3a', textAlign: 'center', marginBottom: '48px' }, content: 'Guest Experiences' },
        { ..._s(), type: 'grid', name: 'Testimonials Grid', styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }, children: [
          { ..._s(), type: 'testimonial-card', name: 'Testimonial 1', styles: { padding: '32px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f0d8ec' }, content: { quote: '"I come to Bella Spa monthly and every visit feels like the first. The deep tissue therapist, Marco, has completely transformed my chronic back pain. Worth every penny."', author: 'Natalie Park', role: 'Monthly Member' } },
          { ..._s(), type: 'testimonial-card', name: 'Testimonial 2', styles: { padding: '32px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f0d8ec' }, content: { quote: '"The signature facial left my skin glowing for two weeks. I have tried spas across the country and Bella sets the standard. The ambiance alone is worth the trip."', author: 'Rachel Torres', role: 'Verified Guest' } },
          { ..._s(), type: 'testimonial-card', name: 'Testimonial 3', styles: { padding: '32px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f0d8ec' }, content: { quote: '"Booked the VIP membership for my anniversary and we have not looked back. The hot stone couples massage was transcendent. Our new monthly tradition."', author: 'Marcus & Elena Webb', role: 'VIP Members' } },
        ]},
      ],
    },
    {
      ..._s(),
      type: 'section', name: 'Membership',
      styles: { padding: '96px 48px', backgroundColor: '#3a1f3a' },
      content: null,
      children: [
        { ..._s(), type: 'container', name: 'Section Header', styles: { textAlign: 'center', marginBottom: '56px' }, children: [
          { ..._s(), type: 'heading', name: 'Pricing Heading', styles: { fontSize: '44px', fontWeight: '800', color: '#fce4f0', marginBottom: '12px' }, content: 'Membership Plans' },
          { ..._s(), type: 'text', name: 'Pricing Subtext', styles: { fontSize: '17px', color: '#c8a0c8', maxWidth: '500px', margin: '0 auto' }, content: 'Make self-care a habit. Members save up to 30% and enjoy priority booking year-round.' },
        ]},
        { ..._s(), type: 'grid', name: 'Pricing Grid', styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }, children: [
          { ..._s(), type: 'pricing-card', name: 'Essential', styles: { padding: '36px', backgroundColor: 'rgba(252,228,240,0.08)', border: '1px solid rgba(252,228,240,0.2)', borderRadius: '16px', textAlign: 'center' }, content: { plan: 'Essential', price: '$79', period: '/month', features: ['1 massage or facial per month', 'Priority booking', '10% retail discount', 'Member lounge access'], cta: 'Get Started' } },
          { ..._s(), type: 'pricing-card', name: 'Premium', styles: { padding: '36px', backgroundColor: 'rgba(155,79,160,0.25)', border: '2px solid #9b4fa0', borderRadius: '16px', textAlign: 'center', position: 'relative' }, content: { plan: 'Premium', price: '$149', period: '/month', badge: 'Most Popular', features: ['2 treatments per month', 'Priority booking', '20% retail discount', 'Guest pass included', 'Complimentary aromatherapy'], cta: 'Start Premium' } },
          { ..._s(), type: 'pricing-card', name: 'VIP', styles: { padding: '36px', backgroundColor: 'rgba(252,228,240,0.08)', border: '1px solid rgba(252,228,240,0.2)', borderRadius: '16px', textAlign: 'center' }, content: { plan: 'VIP', price: '$249', period: '/month', features: ['4 treatments per month', 'Concierge booking', '30% retail discount', '2 guest passes/month', 'Spa suite access', 'Birthday treatment gift'], cta: 'Go VIP' } },
        ]},
      ],
    },
    {
      ..._s(),
      type: 'cta-banner', name: 'CTA Banner',
      styles: { padding: '80px 48px', background: 'linear-gradient(135deg, #fce4f0, #e8d5f5)', textAlign: 'center' },
      content: null,
      children: [
        { ..._s(), type: 'heading', name: 'CTA Heading', styles: { fontSize: '48px', fontWeight: '800', color: '#3a1f3a', marginBottom: '16px' }, content: 'Ready to Unwind?' },
        { ..._s(), type: 'text', name: 'CTA Subtext', styles: { fontSize: '18px', color: '#6b4470', marginBottom: '36px' }, content: 'Your perfect treatment is one click away. New clients receive 20% off their first visit.' },
        { ..._s(), type: 'button', name: 'CTA Button', styles: { padding: '18px 48px', backgroundColor: '#9b4fa0', color: '#fff', border: 'none', borderRadius: '50px', fontSize: '17px', fontWeight: '700', cursor: 'pointer' }, content: 'Book Your First Visit' },
      ],
    },
    {
      ..._s(),
      type: 'footer', name: 'Footer',
      styles: { padding: '48px 48px 32px', backgroundColor: '#1e0a1e', borderTop: '1px solid rgba(155,79,160,0.2)', textAlign: 'center' },
      content: { brand: 'Bella Spa & Wellness', copyright: '© 2026 Bella Spa & Wellness. All rights reserved.', links: ['Instagram', 'Pinterest', 'Facebook'] },
    },
  ],

  // ── Template 4: Apex Logistics ───────────────────────────────────────────
  4: [
    {
      ..._s(),
      type: 'navbar', name: 'Dashboard Navbar',
      styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', backgroundColor: '#0a1628', borderBottom: '1px solid rgba(96,165,250,0.15)', position: 'sticky', top: '0', zIndex: '100' },
      content: { brand: 'Apex Logistics', searchPlaceholder: 'Search shipments, routes, clients...', hasNotifications: true, notificationCount: 4 },
    },
    {
      ..._s(),
      type: 'stats-counter', name: 'KPI Stats Row',
      styles: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', padding: '28px 32px', backgroundColor: '#0d1f3c' },
      content: { stats: [
        { value: '12,847', label: 'Total Shipments', trend: '+8.3%', trendUp: true, icon: '📦' },
        { value: '$2.4M', label: 'Revenue MTD', trend: '+12.1%', trendUp: true, icon: '💰' },
        { value: '342', label: 'Active Routes', trend: '+5', trendUp: true, icon: '🗺️' },
        { value: '99.2%', label: 'On-Time Rate', trend: '+0.4%', trendUp: true, icon: '⏱️' },
      ]},
    },
    {
      ..._s(),
      type: 'section', name: 'Charts Section',
      styles: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '24px 32px', backgroundColor: '#0a1628' },
      content: null,
      children: [
        { ..._s(), type: 'container', name: 'Shipment Volume Chart', styles: { padding: '24px', backgroundColor: '#0d1f3c', borderRadius: '12px', border: '1px solid rgba(96,165,250,0.12)' }, children: [
          { ..._s(), type: 'heading', name: 'Chart Title', styles: { fontSize: '16px', fontWeight: '700', color: '#e0f0ff', marginBottom: '4px' }, content: 'Shipment Volume (Last 12 Months)' },
          { ..._s(), type: 'text', name: 'Chart Subtitle', styles: { fontSize: '13px', color: '#6b8fb5', marginBottom: '20px' }, content: 'Total packages processed by month' },
          { ..._s(), type: 'container', name: 'Chart Placeholder', styles: { height: '220px', backgroundColor: 'rgba(96,165,250,0.06)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(96,165,250,0.2)' }, children: [
            { ..._s(), type: 'text', name: 'Chart Label', styles: { color: '#4a7ab5', fontSize: '14px' }, content: 'Bar Chart — Monthly Shipments' },
          ]},
        ]},
        { ..._s(), type: 'container', name: 'Revenue Breakdown Chart', styles: { padding: '24px', backgroundColor: '#0d1f3c', borderRadius: '12px', border: '1px solid rgba(96,165,250,0.12)' }, children: [
          { ..._s(), type: 'heading', name: 'Chart Title', styles: { fontSize: '16px', fontWeight: '700', color: '#e0f0ff', marginBottom: '4px' }, content: 'Revenue by Service Type' },
          { ..._s(), type: 'text', name: 'Chart Subtitle', styles: { fontSize: '13px', color: '#6b8fb5', marginBottom: '20px' }, content: 'Ground vs Air vs Freight vs Express' },
          { ..._s(), type: 'container', name: 'Chart Placeholder', styles: { height: '220px', backgroundColor: 'rgba(96,165,250,0.06)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(96,165,250,0.2)' }, children: [
            { ..._s(), type: 'text', name: 'Chart Label', styles: { color: '#4a7ab5', fontSize: '14px' }, content: 'Donut Chart — Revenue Split' },
          ]},
        ]},
      ],
    },
    {
      ..._s(),
      type: 'section', name: 'Recent Shipments',
      styles: { padding: '0 32px 24px', backgroundColor: '#0a1628' },
      content: null,
      children: [
        { ..._s(), type: 'container', name: 'Shipments Table Card', styles: { backgroundColor: '#0d1f3c', borderRadius: '12px', border: '1px solid rgba(96,165,250,0.12)', overflow: 'hidden' }, children: [
          { ..._s(), type: 'container', name: 'Table Header', styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(96,165,250,0.1)' }, children: [
            { ..._s(), type: 'heading', name: 'Table Title', styles: { fontSize: '16px', fontWeight: '700', color: '#e0f0ff', margin: '0' }, content: 'Recent Shipments' },
            { ..._s(), type: 'button', name: 'View All', styles: { padding: '7px 16px', backgroundColor: 'transparent', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }, content: 'View All' },
          ]},
          { ..._s(), type: 'list', name: 'Shipments List', styles: {}, content: [
            { id: 'SHP-8841', origin: 'Los Angeles, CA', destination: 'Seattle, WA', status: 'In Transit', eta: 'Feb 23', weight: '142 lbs' },
            { id: 'SHP-8840', origin: 'Chicago, IL', destination: 'Miami, FL', status: 'Delivered', eta: 'Feb 21', weight: '88 lbs' },
            { id: 'SHP-8839', origin: 'New York, NY', destination: 'Dallas, TX', status: 'Processing', eta: 'Feb 25', weight: '210 lbs' },
            { id: 'SHP-8838', origin: 'Phoenix, AZ', destination: 'Denver, CO', status: 'In Transit', eta: 'Feb 24', weight: '55 lbs' },
            { id: 'SHP-8837', origin: 'Atlanta, GA', destination: 'Boston, MA', status: 'Delayed', eta: 'Feb 27', weight: '173 lbs' },
          ]},
        ]},
      ],
    },
    {
      ..._s(),
      type: 'section', name: 'Operations Team',
      styles: { padding: '0 32px 28px', backgroundColor: '#0a1628' },
      content: null,
      children: [
        { ..._s(), type: 'container', name: 'Team Card', styles: { backgroundColor: '#0d1f3c', borderRadius: '12px', border: '1px solid rgba(96,165,250,0.12)', padding: '24px' }, children: [
          { ..._s(), type: 'heading', name: 'Team Heading', styles: { fontSize: '16px', fontWeight: '700', color: '#e0f0ff', marginBottom: '20px' }, content: 'Operations Team' },
          { ..._s(), type: 'team-grid', name: 'Team Members', styles: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }, content: { members: [
            { name: 'Sandra Liu', title: 'VP Operations', status: 'online' },
            { name: 'Kevin Marsh', title: 'Fleet Manager', status: 'online' },
            { name: 'Aisha Patel', title: 'Route Analyst', status: 'away' },
            { name: 'Tom Bridges', title: 'Logistics Lead', status: 'online' },
          ]}},
        ]},
      ],
    },
    {
      ..._s(),
      type: 'footer', name: 'Dashboard Footer',
      styles: { padding: '16px 32px', backgroundColor: '#060f1e', borderTop: '1px solid rgba(96,165,250,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
      content: { brand: 'Apex Logistics', copyright: '© 2026 Apex Logistics Inc. All rights reserved.', version: 'v4.2.1' },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION_BLUEPRINTS — generic section node generators keyed by component name
// Usage: SECTION_BLUEPRINTS['hero'](templateName, accentColor) => nodeObject
// ─────────────────────────────────────────────────────────────────────────────

export const SECTION_BLUEPRINTS: Record<string, (templateName: string, color: string) => Record<string, any>> = {
  hero: (templateName: string, color: string) => ({
    type: 'hero', name: 'Hero Section', locked: false, visible: true,
    styles: { minHeight: '500px', background: `linear-gradient(135deg, ${color}22, #0a0a0f)`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '80px 20px' },
    content: null,
    children: [
      { type: 'heading', name: 'Hero Heading', locked: false, visible: true, styles: { fontSize: '48px', fontWeight: '700', color: '#f0f9ff', marginBottom: '16px' }, content: templateName, children: [] },
      { type: 'text', name: 'Hero Subtitle', locked: false, visible: true, styles: { fontSize: '18px', color: '#a0a0a8', maxWidth: '600px', marginBottom: '24px', lineHeight: '1.7' }, content: 'Welcome to our platform. Discover what makes us different.', children: [] },
      { type: 'button', name: 'CTA Button', locked: false, visible: true, styles: { padding: '14px 32px', backgroundColor: color, color: '#08080a', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }, content: 'Get Started', children: [] },
    ],
  }),

  navbar: (templateName: string, color: string) => ({
    type: 'navbar', name: 'Navbar', locked: false, visible: true,
    styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', backgroundColor: 'rgba(8,8,10,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: '0', zIndex: '100', borderBottom: `1px solid ${color}22` },
    content: { brand: templateName, links: ['Home', 'About', 'Services', 'Contact'] },
    children: [],
  }),

  footer: (templateName: string, color: string) => ({
    type: 'footer', name: 'Footer', locked: false, visible: true,
    styles: { padding: '48px 40px 28px', backgroundColor: '#050508', borderTop: `1px solid ${color}22`, textAlign: 'center' },
    content: { brand: templateName, copyright: `© 2026 ${templateName}. All rights reserved.` },
    children: [],
  }),

  features: (templateName: string, color: string) => ({
    type: 'section', name: 'Features', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0f0f14' },
    content: null,
    children: [
      { type: 'heading', name: 'Features Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '12px' }, content: 'Key Features', children: [] },
      { type: 'text', name: 'Features Subtext', locked: false, visible: true, styles: { fontSize: '16px', color: '#a0a0a8', textAlign: 'center', marginBottom: '48px' }, content: 'Everything you need to succeed, built in from day one.', children: [] },
      { type: 'grid', name: 'Features Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }, children: [
        { type: 'container', name: 'Feature 1', locked: false, visible: true, styles: { padding: '28px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: '12px' }, children: [
          { type: 'icon', name: 'Icon', locked: false, visible: true, styles: { fontSize: '28px', marginBottom: '12px', display: 'block', color: color }, content: '⚡', children: [] },
          { type: 'heading', name: 'Feature Title', locked: false, visible: true, styles: { fontSize: '18px', fontWeight: '700', color: '#f0f9ff', marginBottom: '8px' }, content: 'Lightning Fast', children: [] },
          { type: 'text', name: 'Feature Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8', lineHeight: '1.6' }, content: 'Optimized for performance at every layer. Sub-second load times guaranteed.', children: [] },
        ], content: null },
        { type: 'container', name: 'Feature 2', locked: false, visible: true, styles: { padding: '28px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: '12px' }, children: [
          { type: 'icon', name: 'Icon', locked: false, visible: true, styles: { fontSize: '28px', marginBottom: '12px', display: 'block', color: color }, content: '🔒', children: [] },
          { type: 'heading', name: 'Feature Title', locked: false, visible: true, styles: { fontSize: '18px', fontWeight: '700', color: '#f0f9ff', marginBottom: '8px' }, content: 'Secure by Default', children: [] },
          { type: 'text', name: 'Feature Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8', lineHeight: '1.6' }, content: 'Enterprise-grade security with end-to-end encryption and SOC 2 compliance.', children: [] },
        ], content: null },
        { type: 'container', name: 'Feature 3', locked: false, visible: true, styles: { padding: '28px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: '12px' }, children: [
          { type: 'icon', name: 'Icon', locked: false, visible: true, styles: { fontSize: '28px', marginBottom: '12px', display: 'block', color: color }, content: '📈', children: [] },
          { type: 'heading', name: 'Feature Title', locked: false, visible: true, styles: { fontSize: '18px', fontWeight: '700', color: '#f0f9ff', marginBottom: '8px' }, content: 'Built to Scale', children: [] },
          { type: 'text', name: 'Feature Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8', lineHeight: '1.6' }, content: 'Handles millions of users without breaking a sweat. Scales automatically with demand.', children: [] },
        ], content: null },
      ], content: null },
    ],
  }),

  services: (templateName: string, color: string) => ({
    type: 'section', name: 'Services', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f' },
    content: null,
    children: [
      { type: 'heading', name: 'Services Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'Our Services', children: [] },
      { type: 'grid', name: 'Services Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }, children: [
        { type: 'container', name: 'Service 1', locked: false, visible: true, styles: { padding: '28px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: '12px', textAlign: 'center' }, content: null, children: [
          { type: 'heading', name: 'Service Name', locked: false, visible: true, styles: { fontSize: '18px', fontWeight: '700', color: '#f0f9ff', marginBottom: '10px' }, content: 'Core Service', children: [] },
          { type: 'text', name: 'Service Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8', lineHeight: '1.6', marginBottom: '16px' }, content: 'Professional service delivered with precision and care.', children: [] },
          { type: 'badge', name: 'Service Price', locked: false, visible: true, styles: { display: 'inline-block', padding: '4px 12px', backgroundColor: `${color}22`, borderRadius: '6px', color: color, fontSize: '14px', fontWeight: '600' }, content: 'From $99', children: [] },
        ]},
        { type: 'container', name: 'Service 2', locked: false, visible: true, styles: { padding: '28px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: '12px', textAlign: 'center' }, content: null, children: [
          { type: 'heading', name: 'Service Name', locked: false, visible: true, styles: { fontSize: '18px', fontWeight: '700', color: '#f0f9ff', marginBottom: '10px' }, content: 'Premium Service', children: [] },
          { type: 'text', name: 'Service Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8', lineHeight: '1.6', marginBottom: '16px' }, content: 'Enhanced delivery with priority access and dedicated support.', children: [] },
          { type: 'badge', name: 'Service Price', locked: false, visible: true, styles: { display: 'inline-block', padding: '4px 12px', backgroundColor: `${color}22`, borderRadius: '6px', color: color, fontSize: '14px', fontWeight: '600' }, content: 'From $199', children: [] },
        ]},
        { type: 'container', name: 'Service 3', locked: false, visible: true, styles: { padding: '28px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: '12px', textAlign: 'center' }, content: null, children: [
          { type: 'heading', name: 'Service Name', locked: false, visible: true, styles: { fontSize: '18px', fontWeight: '700', color: '#f0f9ff', marginBottom: '10px' }, content: 'Enterprise Service', children: [] },
          { type: 'text', name: 'Service Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8', lineHeight: '1.6', marginBottom: '16px' }, content: 'Full-scale solution with custom integrations and SLA guarantees.', children: [] },
          { type: 'badge', name: 'Service Price', locked: false, visible: true, styles: { display: 'inline-block', padding: '4px 12px', backgroundColor: `${color}22`, borderRadius: '6px', color: color, fontSize: '14px', fontWeight: '600' }, content: 'Custom Pricing', children: [] },
        ]},
      ], content: null },
    ],
  }),

  team: (templateName: string, color: string) => ({
    type: 'section', name: 'Team', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0f0f14' },
    content: null,
    children: [
      { type: 'heading', name: 'Team Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '12px' }, content: 'Meet Our Team', children: [] },
      { type: 'text', name: 'Team Subtext', locked: false, visible: true, styles: { fontSize: '16px', color: '#a0a0a8', textAlign: 'center', marginBottom: '48px' }, content: 'The talented people behind our success.', children: [] },
      { type: 'team-grid', name: 'Team Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }, content: { members: [
        { name: 'Alex Morgan', title: 'Chief Executive Officer' },
        { name: 'Jordan Lee', title: 'Head of Operations' },
        { name: 'Sam Rivera', title: 'Lead Designer' },
      ]}, children: [] },
    ],
  }),

  contact: (templateName: string, color: string) => ({
    type: 'contact-section', name: 'Contact', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f' },
    content: null,
    children: [
      { type: 'heading', name: 'Contact Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '12px' }, content: 'Get in Touch', children: [] },
      { type: 'text', name: 'Contact Subtext', locked: false, visible: true, styles: { fontSize: '16px', color: '#a0a0a8', textAlign: 'center', marginBottom: '40px' }, content: "Have a question or ready to get started? We'd love to hear from you.", children: [] },
      { type: 'form', name: 'Contact Form', locked: false, visible: true, styles: { maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }, content: { fields: [{ name: 'name', label: 'Name', type: 'text' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'message', label: 'Message', type: 'textarea' }], submitLabel: 'Send Message' }, children: [] },
    ],
  }),

  testimonials: (templateName: string, color: string) => ({
    type: 'section', name: 'Testimonials', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0f0f14' },
    content: null,
    children: [
      { type: 'heading', name: 'Testimonials Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'What Our Clients Say', children: [] },
      { type: 'grid', name: 'Testimonials Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }, children: [
        { type: 'testimonial-card', name: 'Testimonial 1', locked: false, visible: true, styles: { padding: '32px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: '12px', borderLeft: `4px solid ${color}` }, content: { quote: '"Working with this team transformed our business. The results exceeded every expectation we had going in."', author: 'Jennifer Clarke', role: 'CEO, Northgate Partners' }, children: [] },
        { type: 'testimonial-card', name: 'Testimonial 2', locked: false, visible: true, styles: { padding: '32px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: '12px', borderLeft: `4px solid ${color}` }, content: { quote: '"The professionalism and quality of work are unmatched. I refer every colleague who asks who I trust most."', author: 'Marcus Dunne', role: 'Director, Apex Ventures' }, children: [] },
      ], content: null },
    ],
  }),

  pricing: (templateName: string, color: string) => ({
    type: 'section', name: 'Pricing', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f' },
    content: null,
    children: [
      { type: 'heading', name: 'Pricing Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '12px' }, content: 'Simple, Transparent Pricing', children: [] },
      { type: 'text', name: 'Pricing Subtext', locked: false, visible: true, styles: { fontSize: '16px', color: '#a0a0a8', textAlign: 'center', marginBottom: '48px' }, content: 'No hidden fees. No surprises. Cancel anytime.', children: [] },
      { type: 'grid', name: 'Pricing Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }, children: [
        { type: 'pricing-card', name: 'Starter Plan', locked: false, visible: true, styles: { padding: '32px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: '12px', textAlign: 'center' }, content: { plan: 'Starter', price: '$29', period: '/month', features: ['5 projects', '10 GB storage', 'Email support'], cta: 'Get Started' }, children: [] },
        { type: 'pricing-card', name: 'Pro Plan', locked: false, visible: true, styles: { padding: '32px', backgroundColor: `${color}18`, border: `2px solid ${color}`, borderRadius: '12px', textAlign: 'center' }, content: { plan: 'Pro', price: '$79', period: '/month', badge: 'Most Popular', features: ['Unlimited projects', '100 GB storage', 'Priority support', 'Advanced analytics'], cta: 'Start Pro' }, children: [] },
        { type: 'pricing-card', name: 'Enterprise Plan', locked: false, visible: true, styles: { padding: '32px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: '12px', textAlign: 'center' }, content: { plan: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited everything', 'Dedicated infrastructure', '24/7 phone support', 'Custom integrations', 'SLA guarantees'], cta: 'Contact Sales' }, children: [] },
      ], content: null },
    ],
  }),

  faq: (templateName: string, color: string) => ({
    type: 'section', name: 'FAQ', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0f0f14' },
    content: null,
    children: [
      { type: 'heading', name: 'FAQ Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'Frequently Asked Questions', children: [] },
      { type: 'accordion', name: 'FAQ Accordion', locked: false, visible: true, styles: { maxWidth: '700px', margin: '0 auto' }, content: { items: [
        { question: 'How do I get started?', answer: 'Sign up for a free account and follow the onboarding steps. You can be live in under 15 minutes.' },
        { question: 'Is there a free trial?', answer: 'Yes, we offer a 14-day free trial with full access to all features. No credit card required.' },
        { question: 'Can I cancel anytime?', answer: 'Absolutely. Cancel at any time from your account settings with no cancellation fees.' },
        { question: 'Do you offer custom integrations?', answer: 'Yes, our Enterprise plan includes custom integrations. Contact our sales team to discuss your needs.' },
      ]}, children: [] },
    ],
  }),

  menu: (templateName: string, color: string) => ({
    type: 'section', name: 'Menu', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f' },
    content: null,
    children: [
      { type: 'heading', name: 'Menu Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '12px' }, content: 'Our Menu', children: [] },
      { type: 'text', name: 'Menu Subtext', locked: false, visible: true, styles: { fontSize: '16px', color: '#a0a0a8', textAlign: 'center', marginBottom: '48px' }, content: 'Fresh ingredients, prepared with care. Something for everyone.', children: [] },
      { type: 'grid', name: 'Menu Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }, children: [
        { type: 'container', name: 'Menu Item 1', locked: false, visible: true, styles: { padding: '24px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: '10px' }, content: null, children: [
          { type: 'heading', name: 'Item Name', locked: false, visible: true, styles: { fontSize: '18px', fontWeight: '700', color: '#f0f9ff', marginBottom: '8px' }, content: 'Signature Item', children: [] },
          { type: 'text', name: 'Item Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8', lineHeight: '1.6', marginBottom: '12px' }, content: 'Made fresh daily with premium ingredients.', children: [] },
          { type: 'badge', name: 'Item Price', locked: false, visible: true, styles: { display: 'inline-block', padding: '3px 10px', backgroundColor: `${color}22`, borderRadius: '6px', color: color, fontWeight: '600', fontSize: '14px' }, content: '$12.00', children: [] },
        ]},
        { type: 'container', name: 'Menu Item 2', locked: false, visible: true, styles: { padding: '24px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: '10px' }, content: null, children: [
          { type: 'heading', name: 'Item Name', locked: false, visible: true, styles: { fontSize: '18px', fontWeight: '700', color: '#f0f9ff', marginBottom: '8px' }, content: 'Daily Special', children: [] },
          { type: 'text', name: 'Item Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8', lineHeight: '1.6', marginBottom: '12px' }, content: 'Seasonal selection chosen by our chef each morning.', children: [] },
          { type: 'badge', name: 'Item Price', locked: false, visible: true, styles: { display: 'inline-block', padding: '3px 10px', backgroundColor: `${color}22`, borderRadius: '6px', color: color, fontWeight: '600', fontSize: '14px' }, content: '$14.00', children: [] },
        ]},
        { type: 'container', name: 'Menu Item 3', locked: false, visible: true, styles: { padding: '24px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: '10px' }, content: null, children: [
          { type: 'heading', name: 'Item Name', locked: false, visible: true, styles: { fontSize: '18px', fontWeight: '700', color: '#f0f9ff', marginBottom: '8px' }, content: 'House Favorite', children: [] },
          { type: 'text', name: 'Item Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8', lineHeight: '1.6', marginBottom: '12px' }, content: 'Our most popular item, loved by regulars for years.', children: [] },
          { type: 'badge', name: 'Item Price', locked: false, visible: true, styles: { display: 'inline-block', padding: '3px 10px', backgroundColor: `${color}22`, borderRadius: '6px', color: color, fontWeight: '600', fontSize: '14px' }, content: '$11.00', children: [] },
        ]},
      ], content: null },
    ],
  }),

  about: (templateName: string, color: string) => ({
    type: 'section', name: 'About', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0f0f14', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' },
    content: null,
    children: [
      { type: 'container', name: 'About Text', locked: false, visible: true, styles: {}, content: null, children: [
        { type: 'heading', name: 'About Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', marginBottom: '16px' }, content: 'Our Story', children: [] },
        { type: 'text', name: 'About Para 1', locked: false, visible: true, styles: { fontSize: '16px', color: '#a0a0a8', lineHeight: '1.8', marginBottom: '16px' }, content: 'Founded with a clear mission: to deliver exceptional quality and service to every client, every time. We have spent years perfecting our craft.', children: [] },
        { type: 'text', name: 'About Para 2', locked: false, visible: true, styles: { fontSize: '16px', color: '#a0a0a8', lineHeight: '1.8', marginBottom: '28px' }, content: 'Our team brings deep expertise and genuine passion to everything we do. We believe the best results come from honest partnerships built on trust.', children: [] },
        { type: 'button', name: 'Learn More', locked: false, visible: true, styles: { padding: '12px 28px', backgroundColor: color, color: '#08080a', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'inline-block' }, content: 'Learn More', children: [] },
      ]},
      { type: 'image', name: 'About Image', locked: false, visible: true, styles: { width: '100%', height: '380px', objectFit: 'cover', borderRadius: '16px', backgroundColor: `${color}33` }, content: { src: '', alt: 'About us' }, children: [] },
    ],
  }),

  location: (templateName: string, color: string) => ({
    type: 'section', name: 'Location', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start' },
    content: null,
    children: [
      { type: 'container', name: 'Location Info', locked: false, visible: true, styles: {}, content: null, children: [
        { type: 'heading', name: 'Location Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', marginBottom: '24px' }, content: 'Find Us', children: [] },
        { type: 'text', name: 'Address', locked: false, visible: true, styles: { fontSize: '16px', color: '#a0a0a8', marginBottom: '24px' }, content: '123 Main Street, Your City, ST 00000', children: [] },
        { type: 'list', name: 'Hours', locked: false, visible: true, styles: { listStyle: 'none', padding: '0', display: 'flex', flexDirection: 'column', gap: '8px' }, content: [{ label: 'Mon – Fri', value: '9:00 AM – 6:00 PM' }, { label: 'Saturday', value: '10:00 AM – 4:00 PM' }, { label: 'Sunday', value: 'Closed' }], children: [] },
      ]},
      { type: 'map-embed', name: 'Map', locked: false, visible: true, styles: { width: '100%', height: '320px', borderRadius: '16px', backgroundColor: `${color}22`, border: `1px solid ${color}33` }, content: { lat: 40.7128, lng: -74.006, zoom: 14 }, children: [] },
    ],
  }),

  booking: (templateName: string, color: string) => ({
    type: 'section', name: 'Booking', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0f0f14' },
    content: null,
    children: [
      { type: 'heading', name: 'Booking Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '12px' }, content: 'Book an Appointment', children: [] },
      { type: 'text', name: 'Booking Subtext', locked: false, visible: true, styles: { fontSize: '16px', color: '#a0a0a8', textAlign: 'center', marginBottom: '40px' }, content: 'Choose your service and preferred time. We will confirm within 24 hours.', children: [] },
      { type: 'form', name: 'Booking Form', locked: false, visible: true, styles: { maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }, content: { fields: [{ name: 'service', label: 'Service', type: 'select', options: ['Option A', 'Option B', 'Option C'] }, { name: 'date', label: 'Date', type: 'date' }, { name: 'time', label: 'Time', type: 'select', options: ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM'] }, { name: 'name', label: 'Name', type: 'text' }, { name: 'phone', label: 'Phone', type: 'tel' }], submitLabel: 'Book Now' }, children: [] },
    ],
  }),

  sidebar: (templateName: string, color: string) => ({
    type: 'section', name: 'Sidebar', locked: false, visible: true,
    styles: { display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh', backgroundColor: '#0a1628' },
    content: null,
    children: [
      { type: 'container', name: 'Sidebar Nav', locked: false, visible: true, styles: { backgroundColor: '#06101e', borderRight: `1px solid ${color}22`, padding: '24px 16px' }, content: null, children: [
        { type: 'heading', name: 'Sidebar Brand', locked: false, visible: true, styles: { fontSize: '18px', fontWeight: '700', color: '#f0f9ff', marginBottom: '32px', padding: '0 8px' }, content: templateName, children: [] },
        { type: 'list', name: 'Nav Links', locked: false, visible: true, styles: { listStyle: 'none', padding: '0', display: 'flex', flexDirection: 'column', gap: '4px' }, content: [{ label: 'Dashboard', active: true }, { label: 'Analytics' }, { label: 'Reports' }, { label: 'Settings' }], children: [] },
      ]},
      { type: 'container', name: 'Main Content', locked: false, visible: true, styles: { padding: '32px' }, content: null, children: [] },
    ],
  }),

  header: (templateName: string, color: string) => ({
    type: 'section', name: 'Dashboard Header', locked: false, visible: true,
    styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', backgroundColor: '#0d1f3c', borderBottom: `1px solid ${color}22` },
    content: null,
    children: [
      { type: 'heading', name: 'Page Title', locked: false, visible: true, styles: { fontSize: '24px', fontWeight: '700', color: '#f0f9ff', margin: '0' }, content: 'Dashboard', children: [] },
      { type: 'flex-row', name: 'Header Actions', locked: false, visible: true, styles: { display: 'flex', gap: '12px', alignItems: 'center' }, content: null, children: [
        { type: 'button', name: 'Action Button', locked: false, visible: true, styles: { padding: '9px 20px', backgroundColor: color, color: '#08080a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }, content: 'New Report', children: [] },
      ]},
    ],
  }),

  dashboard: (templateName: string, color: string) => ({
    type: 'section', name: 'Dashboard Overview', locked: false, visible: true,
    styles: { padding: '24px 32px', backgroundColor: '#0a1628' },
    content: null,
    children: [
      { type: 'stats-counter', name: 'KPI Row', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }, content: { stats: [{ value: '2,847', label: 'Total Records' }, { value: '$142K', label: 'Revenue' }, { value: '94%', label: 'Satisfaction' }, { value: '18', label: 'Active Users' }] }, children: [] },
    ],
  }),

  charts: (templateName: string, color: string) => ({
    type: 'section', name: 'Charts', locked: false, visible: true,
    styles: { padding: '0 32px 24px', backgroundColor: '#0a1628' },
    content: null,
    children: [
      { type: 'grid', name: 'Charts Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }, content: null, children: [
        { type: 'container', name: 'Chart Card 1', locked: false, visible: true, styles: { padding: '24px', backgroundColor: '#0d1f3c', borderRadius: '12px', border: `1px solid ${color}22` }, content: null, children: [
          { type: 'heading', name: 'Chart Title', locked: false, visible: true, styles: { fontSize: '16px', fontWeight: '700', color: '#f0f9ff', marginBottom: '16px' }, content: 'Revenue Trend', children: [] },
          { type: 'container', name: 'Chart Area', locked: false, visible: true, styles: { height: '200px', backgroundColor: `${color}0a`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${color}33` }, content: null, children: [
            { type: 'text', name: 'Chart Placeholder', locked: false, visible: true, styles: { color: `${color}88`, fontSize: '14px' }, content: 'Line Chart', children: [] },
          ]},
        ]},
        { type: 'container', name: 'Chart Card 2', locked: false, visible: true, styles: { padding: '24px', backgroundColor: '#0d1f3c', borderRadius: '12px', border: `1px solid ${color}22` }, content: null, children: [
          { type: 'heading', name: 'Chart Title', locked: false, visible: true, styles: { fontSize: '16px', fontWeight: '700', color: '#f0f9ff', marginBottom: '16px' }, content: 'Breakdown', children: [] },
          { type: 'container', name: 'Chart Area', locked: false, visible: true, styles: { height: '200px', backgroundColor: `${color}0a`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${color}33` }, content: null, children: [
            { type: 'text', name: 'Chart Placeholder', locked: false, visible: true, styles: { color: `${color}88`, fontSize: '14px' }, content: 'Donut Chart', children: [] },
          ]},
        ]},
      ]},
    ],
  }),

  tables: (templateName: string, color: string) => ({
    type: 'section', name: 'Data Table', locked: false, visible: true,
    styles: { padding: '0 32px 24px', backgroundColor: '#0a1628' },
    content: null,
    children: [
      { type: 'container', name: 'Table Card', locked: false, visible: true, styles: { backgroundColor: '#0d1f3c', borderRadius: '12px', border: `1px solid ${color}22`, overflow: 'hidden' }, content: null, children: [
        { type: 'container', name: 'Table Header Row', locked: false, visible: true, styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${color}18` }, content: null, children: [
          { type: 'heading', name: 'Table Title', locked: false, visible: true, styles: { fontSize: '16px', fontWeight: '700', color: '#f0f9ff', margin: '0' }, content: 'Recent Records', children: [] },
          { type: 'button', name: 'View All', locked: false, visible: true, styles: { padding: '7px 16px', backgroundColor: 'transparent', color: color, border: `1px solid ${color}55`, borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }, content: 'View All', children: [] },
        ]},
        { type: 'list', name: 'Table Rows', locked: false, visible: true, styles: { padding: '8px 0' }, content: [{ id: '#001', name: 'Sample Record', status: 'Active', date: 'Feb 22' }, { id: '#002', name: 'Another Record', status: 'Pending', date: 'Feb 21' }, { id: '#003', name: 'Third Record', status: 'Complete', date: 'Feb 20' }], children: [] },
      ]},
    ],
  }),

  stats: (templateName: string, color: string) => ({
    type: 'stats-counter', name: 'Stats', locked: false, visible: true,
    styles: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', padding: '24px 32px', backgroundColor: '#0d1f3c' },
    content: { stats: [{ value: '10K+', label: 'Users' }, { value: '$1M+', label: 'Revenue' }, { value: '99%', label: 'Uptime' }, { value: '50+', label: 'Countries' }] },
    children: [],
  }),

  gallery: (templateName: string, color: string) => ({
    type: 'section', name: 'Gallery', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f' },
    content: null,
    children: [
      { type: 'heading', name: 'Gallery Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'Gallery', children: [] },
      { type: 'image-gallery', name: 'Gallery Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }, content: { images: [{ src: '', alt: 'Image 1' }, { src: '', alt: 'Image 2' }, { src: '', alt: 'Image 3' }, { src: '', alt: 'Image 4' }, { src: '', alt: 'Image 5' }, { src: '', alt: 'Image 6' }] }, children: [] },
    ],
  }),

  work: (templateName: string, color: string) => ({
    type: 'section', name: 'Work', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0f0f14' },
    content: null,
    children: [
      { type: 'heading', name: 'Work Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'Selected Work', children: [] },
      { type: 'grid', name: 'Work Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }, content: null, children: [
        { type: 'container', name: 'Project Card 1', locked: false, visible: true, styles: { borderRadius: '12px', overflow: 'hidden', backgroundColor: `${color}18`, border: `1px solid ${color}33` }, content: null, children: [
          { type: 'container', name: 'Project Image', locked: false, visible: true, styles: { height: '240px', backgroundColor: `${color}22` }, content: null, children: [] },
          { type: 'container', name: 'Project Info', locked: false, visible: true, styles: { padding: '24px' }, content: null, children: [
            { type: 'heading', name: 'Project Name', locked: false, visible: true, styles: { fontSize: '20px', fontWeight: '700', color: '#f0f9ff', marginBottom: '8px' }, content: 'Project Alpha', children: [] },
            { type: 'text', name: 'Project Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8' }, content: 'Brand identity and digital experience design for a leading technology firm.', children: [] },
          ]},
        ]},
        { type: 'container', name: 'Project Card 2', locked: false, visible: true, styles: { borderRadius: '12px', overflow: 'hidden', backgroundColor: `${color}18`, border: `1px solid ${color}33` }, content: null, children: [
          { type: 'container', name: 'Project Image', locked: false, visible: true, styles: { height: '240px', backgroundColor: `${color}22` }, content: null, children: [] },
          { type: 'container', name: 'Project Info', locked: false, visible: true, styles: { padding: '24px' }, content: null, children: [
            { type: 'heading', name: 'Project Name', locked: false, visible: true, styles: { fontSize: '20px', fontWeight: '700', color: '#f0f9ff', marginBottom: '8px' }, content: 'Project Beta', children: [] },
            { type: 'text', name: 'Project Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8' }, content: 'Full-stack web application with custom CMS and payment processing.', children: [] },
          ]},
        ]},
      ]},
    ],
  }),

  projects: (templateName: string, color: string) => ({
    type: 'section', name: 'Projects', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f' },
    content: null,
    children: [
      { type: 'heading', name: 'Projects Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'Projects', children: [] },
      { type: 'grid', name: 'Projects Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }, content: null, children: [
        { type: 'container', name: 'Project 1', locked: false, visible: true, styles: { padding: '24px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33`, borderRadius: '10px' }, content: null, children: [
          { type: 'badge', name: 'Project Tag', locked: false, visible: true, styles: { display: 'inline-block', padding: '3px 10px', backgroundColor: `${color}22`, borderRadius: '6px', color: color, fontSize: '12px', fontWeight: '600', marginBottom: '12px' }, content: 'React', children: [] },
          { type: 'heading', name: 'Project Name', locked: false, visible: true, styles: { fontSize: '18px', fontWeight: '700', color: '#f0f9ff', marginBottom: '8px' }, content: 'Portfolio Site', children: [] },
          { type: 'text', name: 'Project Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8' }, content: 'Personal portfolio with dark theme and animated transitions.', children: [] },
        ]},
        { type: 'container', name: 'Project 2', locked: false, visible: true, styles: { padding: '24px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33`, borderRadius: '10px' }, content: null, children: [
          { type: 'badge', name: 'Project Tag', locked: false, visible: true, styles: { display: 'inline-block', padding: '3px 10px', backgroundColor: `${color}22`, borderRadius: '6px', color: color, fontSize: '12px', fontWeight: '600', marginBottom: '12px' }, content: 'Node.js', children: [] },
          { type: 'heading', name: 'Project Name', locked: false, visible: true, styles: { fontSize: '18px', fontWeight: '700', color: '#f0f9ff', marginBottom: '8px' }, content: 'API Gateway', children: [] },
          { type: 'text', name: 'Project Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8' }, content: 'REST API with authentication, rate limiting, and full OpenAPI docs.', children: [] },
        ]},
        { type: 'container', name: 'Project 3', locked: false, visible: true, styles: { padding: '24px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33`, borderRadius: '10px' }, content: null, children: [
          { type: 'badge', name: 'Project Tag', locked: false, visible: true, styles: { display: 'inline-block', padding: '3px 10px', backgroundColor: `${color}22`, borderRadius: '6px', color: color, fontSize: '12px', fontWeight: '600', marginBottom: '12px' }, content: 'Python', children: [] },
          { type: 'heading', name: 'Project Name', locked: false, visible: true, styles: { fontSize: '18px', fontWeight: '700', color: '#f0f9ff', marginBottom: '8px' }, content: 'Data Pipeline', children: [] },
          { type: 'text', name: 'Project Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8' }, content: 'ETL pipeline processing 50K records per minute with automated alerts.', children: [] },
        ]},
      ]},
    ],
  }),

  skills: (templateName: string, color: string) => ({
    type: 'section', name: 'Skills', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0f0f14' },
    content: null,
    children: [
      { type: 'heading', name: 'Skills Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'Technical Skills', children: [] },
      { type: 'grid', name: 'Skills Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }, content: null, children: [
        ...['React', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'AWS', 'TypeScript', 'GraphQL'].map(skill => ({
          type: 'badge', name: `Skill: ${skill}`, locked: false, visible: true, styles: { padding: '12px 20px', backgroundColor: `${color}18`, border: `1px solid ${color}44`, borderRadius: '8px', color: '#f0f9ff', fontSize: '14px', fontWeight: '600', textAlign: 'center' }, content: skill, children: [],
        })),
      ]},
    ],
  }),

  code: (templateName: string, color: string) => ({
    type: 'section', name: 'Code Showcase', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f' },
    content: null,
    children: [
      { type: 'heading', name: 'Code Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'Code Samples', children: [] },
      { type: 'container', name: 'Code Block', locked: false, visible: true, styles: { maxWidth: '700px', margin: '0 auto', backgroundColor: '#0d1117', borderRadius: '12px', border: `1px solid ${color}33`, padding: '32px', fontFamily: 'monospace', overflow: 'hidden' }, content: null, children: [
        { type: 'text', name: 'Code Content', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0d8af', lineHeight: '1.7', whiteSpace: 'pre' }, content: 'const greet = (name) => {\n  return `Hello, ${name}!`;\n};\n\nconsole.log(greet("World"));', children: [] },
      ]},
    ],
  }),

  countdown: (templateName: string, color: string) => ({
    type: 'section', name: 'Countdown', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0f0f14', textAlign: 'center' },
    content: null,
    children: [
      { type: 'heading', name: 'Countdown Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', marginBottom: '12px' }, content: 'Event Starts In', children: [] },
      { type: 'text', name: 'Event Date', locked: false, visible: true, styles: { fontSize: '16px', color: '#a0a0a8', marginBottom: '40px' }, content: 'March 15, 2026 — Live & In Person', children: [] },
      { type: 'flex-row', name: 'Countdown Timer', locked: false, visible: true, styles: { display: 'flex', justifyContent: 'center', gap: '24px' }, content: null, children: [
        ...['Days', 'Hours', 'Minutes', 'Seconds'].map(unit => ({
          type: 'container', name: unit, locked: false, visible: true, styles: { textAlign: 'center', padding: '24px 32px', backgroundColor: `${color}18`, border: `1px solid ${color}44`, borderRadius: '12px' }, content: null, children: [
            { type: 'heading', name: 'Count', locked: false, visible: true, styles: { fontSize: '48px', fontWeight: '800', color: color, margin: '0 0 8px 0' }, content: '--', children: [] },
            { type: 'text', name: 'Unit', locked: false, visible: true, styles: { fontSize: '13px', color: '#a0a0a8', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' }, content: unit, children: [] },
          ],
        })),
      ]},
    ],
  }),

  speakers: (templateName: string, color: string) => ({
    type: 'section', name: 'Speakers', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f' },
    content: null,
    children: [
      { type: 'heading', name: 'Speakers Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'Featured Speakers', children: [] },
      { type: 'team-grid', name: 'Speakers Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }, content: { members: [{ name: 'Dr. Amara Chen', title: 'AI Research Lead, DeepMind' }, { name: 'Robert Vance', title: 'CTO, Scale AI' }, { name: 'Priya Singh', title: 'VP Product, Stripe' }] }, children: [] },
    ],
  }),

  schedule: (templateName: string, color: string) => ({
    type: 'section', name: 'Schedule', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0f0f14' },
    content: null,
    children: [
      { type: 'heading', name: 'Schedule Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'Event Schedule', children: [] },
      { type: 'list', name: 'Schedule List', locked: false, visible: true, styles: { maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }, content: [
        { time: '9:00 AM', title: 'Registration & Networking', speaker: '' },
        { time: '10:00 AM', title: 'Opening Keynote', speaker: 'Dr. Amara Chen' },
        { time: '11:30 AM', title: 'Panel: The Future of AI', speaker: 'Robert Vance & Priya Singh' },
        { time: '1:00 PM', title: 'Lunch Break', speaker: '' },
        { time: '2:00 PM', title: 'Workshop Sessions', speaker: 'Various' },
        { time: '5:00 PM', title: 'Closing Remarks & Cocktails', speaker: '' },
      ], children: [] },
    ],
  }),

  tickets: (templateName: string, color: string) => ({
    type: 'section', name: 'Tickets', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f' },
    content: null,
    children: [
      { type: 'heading', name: 'Tickets Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'Get Your Tickets', children: [] },
      { type: 'grid', name: 'Tickets Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }, content: null, children: [
        { type: 'pricing-card', name: 'General Admission', locked: false, visible: true, styles: { padding: '32px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33`, borderRadius: '12px', textAlign: 'center' }, content: { plan: 'General', price: '$299', period: '', features: ['Full conference access', 'Lunch included', 'Digital recordings'], cta: 'Buy General' }, children: [] },
        { type: 'pricing-card', name: 'VIP', locked: false, visible: true, styles: { padding: '32px', backgroundColor: `${color}18`, border: `2px solid ${color}`, borderRadius: '12px', textAlign: 'center' }, content: { plan: 'VIP', price: '$599', period: '', badge: 'Best Value', features: ['General + VIP lounge', 'Speaker meet & greet', 'Workshop sessions', 'Premium swag bag'], cta: 'Buy VIP' }, children: [] },
        { type: 'pricing-card', name: 'Virtual', locked: false, visible: true, styles: { padding: '32px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33`, borderRadius: '12px', textAlign: 'center' }, content: { plan: 'Virtual', price: '$99', period: '', features: ['Live stream access', 'Q&A participation', '30-day recording access'], cta: 'Buy Virtual' }, children: [] },
      ]},
    ],
  }),

  screenshots: (templateName: string, color: string) => ({
    type: 'section', name: 'Screenshots', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0f0f14', textAlign: 'center' },
    content: null,
    children: [
      { type: 'heading', name: 'Screenshots Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', marginBottom: '12px' }, content: 'See It in Action', children: [] },
      { type: 'text', name: 'Screenshots Subtext', locked: false, visible: true, styles: { fontSize: '16px', color: '#a0a0a8', marginBottom: '48px' }, content: 'A polished experience across every device and screen size.', children: [] },
      { type: 'image-gallery', name: 'Screenshots Gallery', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }, content: { images: [{ src: '', alt: 'App screenshot 1' }, { src: '', alt: 'App screenshot 2' }, { src: '', alt: 'App screenshot 3' }] }, children: [] },
    ],
  }),

  download: (templateName: string, color: string) => ({
    type: 'cta-banner', name: 'Download CTA', locked: false, visible: true,
    styles: { padding: '80px 40px', background: `linear-gradient(135deg, ${color}22, #0a0a0f)`, textAlign: 'center' },
    content: null,
    children: [
      { type: 'heading', name: 'Download Heading', locked: false, visible: true, styles: { fontSize: '44px', fontWeight: '800', color: '#f0f9ff', marginBottom: '16px' }, content: 'Download the App', children: [] },
      { type: 'text', name: 'Download Subtext', locked: false, visible: true, styles: { fontSize: '18px', color: '#a0a0a8', marginBottom: '36px' }, content: 'Available on iOS and Android. Free to download.', children: [] },
      { type: 'flex-row', name: 'Download Buttons', locked: false, visible: true, styles: { display: 'flex', gap: '16px', justifyContent: 'center' }, content: null, children: [
        { type: 'button', name: 'App Store', locked: false, visible: true, styles: { padding: '14px 32px', backgroundColor: color, color: '#08080a', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }, content: 'App Store', children: [] },
        { type: 'button', name: 'Google Play', locked: false, visible: true, styles: { padding: '14px 32px', backgroundColor: 'transparent', color: color, border: `2px solid ${color}`, borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }, content: 'Google Play', children: [] },
      ]},
    ],
  }),

  curriculum: (templateName: string, color: string) => ({
    type: 'section', name: 'Curriculum', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f' },
    content: null,
    children: [
      { type: 'heading', name: 'Curriculum Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'What You Will Learn', children: [] },
      { type: 'accordion', name: 'Curriculum Accordion', locked: false, visible: true, styles: { maxWidth: '700px', margin: '0 auto' }, content: { items: [
        { question: 'Module 1: Foundations', answer: 'Core concepts and principles. Setting up your environment and understanding the fundamentals.' },
        { question: 'Module 2: Core Skills', answer: 'Hands-on projects and exercises to build proficiency. Real-world application of what you have learned.' },
        { question: 'Module 3: Advanced Techniques', answer: 'Industry-standard workflows, optimization strategies, and professional best practices.' },
        { question: 'Module 4: Final Project', answer: 'Build a complete, portfolio-ready project from scratch with instructor feedback.' },
      ]}, children: [] },
    ],
  }),

  instructor: (templateName: string, color: string) => ({
    type: 'section', name: 'Instructor', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0f0f14', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '60px', alignItems: 'center', maxWidth: '900px', margin: '0 auto' },
    content: null,
    children: [
      { type: 'image', name: 'Instructor Photo', locked: false, visible: true, styles: { width: '100%', height: '320px', objectFit: 'cover', borderRadius: '16px', backgroundColor: `${color}33` }, content: { src: '', alt: 'Instructor' }, children: [] },
      { type: 'container', name: 'Instructor Info', locked: false, visible: true, styles: {}, content: null, children: [
        { type: 'badge', name: 'Label', locked: false, visible: true, styles: { display: 'inline-block', padding: '4px 12px', backgroundColor: `${color}22`, borderRadius: '6px', color: color, fontSize: '12px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }, content: 'Your Instructor', children: [] },
        { type: 'heading', name: 'Instructor Name', locked: false, visible: true, styles: { fontSize: '36px', fontWeight: '800', color: '#f0f9ff', marginBottom: '8px' }, content: 'Dr. Jane Hoffman', children: [] },
        { type: 'text', name: 'Instructor Title', locked: false, visible: true, styles: { fontSize: '16px', color: color, fontWeight: '600', marginBottom: '16px' }, content: 'Senior Instructor & Industry Practitioner', children: [] },
        { type: 'text', name: 'Instructor Bio', locked: false, visible: true, styles: { fontSize: '15px', color: '#a0a0a8', lineHeight: '1.8' }, content: '15 years of hands-on industry experience. Taught over 40,000 students worldwide. Former lead at Google and Stripe.', children: [] },
      ]},
    ],
  }),

  problem: (templateName: string, color: string) => ({
    type: 'section', name: 'Problem', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f', textAlign: 'center' },
    content: null,
    children: [
      { type: 'heading', name: 'Problem Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', marginBottom: '20px' }, content: 'The Problem We Solve', children: [] },
      { type: 'text', name: 'Problem Desc', locked: false, visible: true, styles: { fontSize: '18px', color: '#a0a0a8', lineHeight: '1.8', maxWidth: '700px', margin: '0 auto 40px' }, content: 'Businesses lose thousands of hours and millions of dollars each year to inefficient, disconnected tools that do not talk to each other. Teams are drowning in data with no way to act on it.', children: [] },
      { type: 'grid', name: 'Pain Points', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '800px', margin: '0 auto' }, content: null, children: [
        { type: 'container', name: 'Pain Point 1', locked: false, visible: true, styles: { padding: '24px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }, content: null, children: [
          { type: 'icon', name: 'Icon', locked: false, visible: true, styles: { fontSize: '28px', marginBottom: '10px', display: 'block' }, content: '😤', children: [] },
          { type: 'text', name: 'Pain Point Text', locked: false, visible: true, styles: { fontSize: '14px', color: '#fca5a5' }, content: 'Manual data entry wasting 10+ hours per week', children: [] },
        ]},
        { type: 'container', name: 'Pain Point 2', locked: false, visible: true, styles: { padding: '24px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }, content: null, children: [
          { type: 'icon', name: 'Icon', locked: false, visible: true, styles: { fontSize: '28px', marginBottom: '10px', display: 'block' }, content: '🔀', children: [] },
          { type: 'text', name: 'Pain Point Text', locked: false, visible: true, styles: { fontSize: '14px', color: '#fca5a5' }, content: 'Disconnected tools creating data silos and blind spots', children: [] },
        ]},
        { type: 'container', name: 'Pain Point 3', locked: false, visible: true, styles: { padding: '24px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }, content: null, children: [
          { type: 'icon', name: 'Icon', locked: false, visible: true, styles: { fontSize: '28px', marginBottom: '10px', display: 'block' }, content: '📉', children: [] },
          { type: 'text', name: 'Pain Point Text', locked: false, visible: true, styles: { fontSize: '14px', color: '#fca5a5' }, content: 'Decisions based on outdated reports instead of live data', children: [] },
        ]},
      ]},
    ],
  }),

  solution: (templateName: string, color: string) => ({
    type: 'section', name: 'Solution', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0f0f14', textAlign: 'center' },
    content: null,
    children: [
      { type: 'heading', name: 'Solution Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', marginBottom: '20px' }, content: 'Our Solution', children: [] },
      { type: 'text', name: 'Solution Desc', locked: false, visible: true, styles: { fontSize: '18px', color: '#a0a0a8', lineHeight: '1.8', maxWidth: '680px', margin: '0 auto 48px' }, content: `${templateName} unifies your data, automates your workflows, and surfaces the insights you need — in real time, on any device.`, children: [] },
      { type: 'grid', name: 'Solution Points', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }, content: null, children: [
        { type: 'container', name: 'Solution 1', locked: false, visible: true, styles: { padding: '24px', backgroundColor: `${color}0f`, border: `1px solid ${color}33`, borderRadius: '10px' }, content: null, children: [
          { type: 'icon', name: 'Icon', locked: false, visible: true, styles: { fontSize: '28px', marginBottom: '10px', display: 'block' }, content: '🔗', children: [] },
          { type: 'heading', name: 'Solution Title', locked: false, visible: true, styles: { fontSize: '16px', fontWeight: '700', color: '#f0f9ff', marginBottom: '8px' }, content: 'Unified Data', children: [] },
          { type: 'text', name: 'Solution Text', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8' }, content: 'Connect all your tools into a single source of truth.', children: [] },
        ]},
        { type: 'container', name: 'Solution 2', locked: false, visible: true, styles: { padding: '24px', backgroundColor: `${color}0f`, border: `1px solid ${color}33`, borderRadius: '10px' }, content: null, children: [
          { type: 'icon', name: 'Icon', locked: false, visible: true, styles: { fontSize: '28px', marginBottom: '10px', display: 'block' }, content: '⚡', children: [] },
          { type: 'heading', name: 'Solution Title', locked: false, visible: true, styles: { fontSize: '16px', fontWeight: '700', color: '#f0f9ff', marginBottom: '8px' }, content: 'Automated Workflows', children: [] },
          { type: 'text', name: 'Solution Text', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8' }, content: 'Eliminate repetitive tasks with intelligent automation.', children: [] },
        ]},
        { type: 'container', name: 'Solution 3', locked: false, visible: true, styles: { padding: '24px', backgroundColor: `${color}0f`, border: `1px solid ${color}33`, borderRadius: '10px' }, content: null, children: [
          { type: 'icon', name: 'Icon', locked: false, visible: true, styles: { fontSize: '28px', marginBottom: '10px', display: 'block' }, content: '📊', children: [] },
          { type: 'heading', name: 'Solution Title', locked: false, visible: true, styles: { fontSize: '16px', fontWeight: '700', color: '#f0f9ff', marginBottom: '8px' }, content: 'Real-Time Insights', children: [] },
          { type: 'text', name: 'Solution Text', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8' }, content: 'Live dashboards built for fast decisions.', children: [] },
        ]},
      ]},
    ],
  }),

  metrics: (templateName: string, color: string) => ({
    type: 'stats-counter', name: 'Metrics', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', textAlign: 'center' },
    content: { stats: [{ value: '$2.4M', label: 'Raised' }, { value: '12K+', label: 'Customers' }, { value: '320%', label: 'YoY Growth' }, { value: '4.9★', label: 'Avg Rating' }] },
    children: [],
  }),

  doctors: (templateName: string, color: string) => ({
    type: 'section', name: 'Doctors', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0f0f14' },
    content: null,
    children: [
      { type: 'heading', name: 'Doctors Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'Our Physicians', children: [] },
      { type: 'team-grid', name: 'Doctors Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }, content: { members: [{ name: 'Dr. Emily Tran', title: 'Family Medicine, MD' }, { name: 'Dr. James Osei', title: 'Internal Medicine, MD' }, { name: 'Dr. Laura Kim', title: 'Pediatrics, MD' }] }, children: [] },
    ],
  }),

  'case-studies': (templateName: string, color: string) => ({
    type: 'section', name: 'Case Studies', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f' },
    content: null,
    children: [
      { type: 'heading', name: 'Case Studies Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'Case Studies', children: [] },
      { type: 'grid', name: 'Case Studies Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '28px' }, content: null, children: [
        { type: 'container', name: 'Case Study 1', locked: false, visible: true, styles: { padding: '32px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33`, borderRadius: '12px' }, content: null, children: [
          { type: 'badge', name: 'Industry', locked: false, visible: true, styles: { display: 'inline-block', padding: '3px 10px', backgroundColor: `${color}22`, borderRadius: '6px', color: color, fontSize: '12px', fontWeight: '600', marginBottom: '12px' }, content: 'SaaS', children: [] },
          { type: 'heading', name: 'Case Title', locked: false, visible: true, styles: { fontSize: '22px', fontWeight: '700', color: '#f0f9ff', marginBottom: '10px' }, content: 'Scaled Revenue 3x in 18 Months', children: [] },
          { type: 'text', name: 'Case Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8', lineHeight: '1.7' }, content: 'How we helped a Series A startup restructure their GTM strategy and triple recurring revenue without expanding headcount.', children: [] },
        ]},
        { type: 'container', name: 'Case Study 2', locked: false, visible: true, styles: { padding: '32px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33`, borderRadius: '12px' }, content: null, children: [
          { type: 'badge', name: 'Industry', locked: false, visible: true, styles: { display: 'inline-block', padding: '3px 10px', backgroundColor: `${color}22`, borderRadius: '6px', color: color, fontSize: '12px', fontWeight: '600', marginBottom: '12px' }, content: 'Retail', children: [] },
          { type: 'heading', name: 'Case Title', locked: false, visible: true, styles: { fontSize: '22px', fontWeight: '700', color: '#f0f9ff', marginBottom: '10px' }, content: 'Cut Operational Costs by 40%', children: [] },
          { type: 'text', name: 'Case Desc', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8', lineHeight: '1.7' }, content: 'A national retail chain reduced waste and overhead by integrating our inventory and supply-chain optimization platform.', children: [] },
        ]},
      ]},
    ],
  }),

  'social-proof': (templateName: string, color: string) => ({
    type: 'section', name: 'Social Proof', locked: false, visible: true,
    styles: { padding: '60px 40px', backgroundColor: '#0f0f14', textAlign: 'center' },
    content: null,
    children: [
      { type: 'text', name: 'Social Proof Label', locked: false, visible: true, styles: { fontSize: '13px', color: '#a0a0a8', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '24px' }, content: 'Trusted by teams at', children: [] },
      { type: 'flex-row', name: 'Logo Row', locked: false, visible: true, styles: { display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap', opacity: '0.5' }, content: null, children: [
        ...['Acme Corp', 'NovaTech', 'Brightline', 'Apex Inc', 'Streamline'].map(brand => ({
          type: 'text', name: `Logo: ${brand}`, locked: false, visible: true, styles: { fontSize: '18px', fontWeight: '800', color: '#f0f9ff', letterSpacing: '0.04em' }, content: brand, children: [],
        })),
      ]},
    ],
  }),

  signup: (templateName: string, color: string) => ({
    type: 'cta-banner', name: 'Signup CTA', locked: false, visible: true,
    styles: { padding: '80px 40px', background: `linear-gradient(135deg, ${color}22, #0a0a0f)`, textAlign: 'center' },
    content: null,
    children: [
      { type: 'heading', name: 'Signup Heading', locked: false, visible: true, styles: { fontSize: '44px', fontWeight: '800', color: '#f0f9ff', marginBottom: '16px' }, content: 'Get Early Access', children: [] },
      { type: 'text', name: 'Signup Subtext', locked: false, visible: true, styles: { fontSize: '18px', color: '#a0a0a8', marginBottom: '36px' }, content: 'Join 5,000+ people on the waitlist. No spam. Unsubscribe anytime.', children: [] },
      { type: 'form', name: 'Signup Form', locked: false, visible: true, styles: { display: 'flex', gap: '12px', justifyContent: 'center', maxWidth: '480px', margin: '0 auto' }, content: { fields: [{ name: 'email', label: '', type: 'email', placeholder: 'Enter your email' }], submitLabel: 'Join Waitlist', inline: true }, children: [] },
    ],
  }),

  listings: (templateName: string, color: string) => ({
    type: 'section', name: 'Listings', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f' },
    content: null,
    children: [
      { type: 'heading', name: 'Listings Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'Featured Properties', children: [] },
      { type: 'grid', name: 'Listings Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }, content: null, children: [
        { type: 'container', name: 'Listing 1', locked: false, visible: true, styles: { borderRadius: '12px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33` }, content: null, children: [
          { type: 'container', name: 'Listing Image', locked: false, visible: true, styles: { height: '200px', backgroundColor: `${color}22` }, content: null, children: [] },
          { type: 'container', name: 'Listing Info', locked: false, visible: true, styles: { padding: '20px' }, content: null, children: [
            { type: 'heading', name: 'Price', locked: false, visible: true, styles: { fontSize: '22px', fontWeight: '800', color: color, marginBottom: '6px' }, content: '$1,850,000', children: [] },
            { type: 'text', name: 'Address', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8', marginBottom: '8px' }, content: '4 bed · 3 bath · 2,800 sqft', children: [] },
            { type: 'text', name: 'Location', locked: false, visible: true, styles: { fontSize: '13px', color: '#606068' }, content: 'Nob Hill, San Francisco, CA', children: [] },
          ]},
        ]},
        { type: 'container', name: 'Listing 2', locked: false, visible: true, styles: { borderRadius: '12px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33` }, content: null, children: [
          { type: 'container', name: 'Listing Image', locked: false, visible: true, styles: { height: '200px', backgroundColor: `${color}22` }, content: null, children: [] },
          { type: 'container', name: 'Listing Info', locked: false, visible: true, styles: { padding: '20px' }, content: null, children: [
            { type: 'heading', name: 'Price', locked: false, visible: true, styles: { fontSize: '22px', fontWeight: '800', color: color, marginBottom: '6px' }, content: '$2,400,000', children: [] },
            { type: 'text', name: 'Address', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8', marginBottom: '8px' }, content: '5 bed · 4 bath · 3,600 sqft', children: [] },
            { type: 'text', name: 'Location', locked: false, visible: true, styles: { fontSize: '13px', color: '#606068' }, content: 'Pacific Heights, San Francisco, CA', children: [] },
          ]},
        ]},
        { type: 'container', name: 'Listing 3', locked: false, visible: true, styles: { borderRadius: '12px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33` }, content: null, children: [
          { type: 'container', name: 'Listing Image', locked: false, visible: true, styles: { height: '200px', backgroundColor: `${color}22` }, content: null, children: [] },
          { type: 'container', name: 'Listing Info', locked: false, visible: true, styles: { padding: '20px' }, content: null, children: [
            { type: 'heading', name: 'Price', locked: false, visible: true, styles: { fontSize: '22px', fontWeight: '800', color: color, marginBottom: '6px' }, content: '$3,200,000', children: [] },
            { type: 'text', name: 'Address', locked: false, visible: true, styles: { fontSize: '14px', color: '#a0a0a8', marginBottom: '8px' }, content: '6 bed · 5 bath · 4,200 sqft', children: [] },
            { type: 'text', name: 'Location', locked: false, visible: true, styles: { fontSize: '13px', color: '#606068' }, content: 'Presidio Heights, San Francisco, CA', children: [] },
          ]},
        ]},
      ]},
    ],
  }),

  agents: (templateName: string, color: string) => ({
    type: 'section', name: 'Agents', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0f0f14' },
    content: null,
    children: [
      { type: 'heading', name: 'Agents Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '48px' }, content: 'Our Agents', children: [] },
      { type: 'team-grid', name: 'Agents Grid', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }, content: { members: [{ name: 'Victoria Chase', title: 'Senior Agent · $40M+ Sold' }, { name: 'Daniel Park', title: 'Luxury Specialist · $30M+ Sold' }, { name: 'Sophia Grant', title: 'Buyer\'s Agent · 200+ Transactions' }] }, children: [] },
    ],
  }),

  mortgage: (templateName: string, color: string) => ({
    type: 'section', name: 'Mortgage Calculator', locked: false, visible: true,
    styles: { padding: '80px 40px', backgroundColor: '#0a0a0f' },
    content: null,
    children: [
      { type: 'heading', name: 'Mortgage Heading', locked: false, visible: true, styles: { fontSize: '40px', fontWeight: '700', color: '#f0f9ff', textAlign: 'center', marginBottom: '12px' }, content: 'Mortgage Calculator', children: [] },
      { type: 'text', name: 'Mortgage Subtext', locked: false, visible: true, styles: { fontSize: '16px', color: '#a0a0a8', textAlign: 'center', marginBottom: '40px' }, content: 'Estimate your monthly payment in seconds.', children: [] },
      { type: 'form', name: 'Mortgage Form', locked: false, visible: true, styles: { maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }, content: { fields: [{ name: 'price', label: 'Home Price', type: 'number', placeholder: '$1,000,000' }, { name: 'down', label: 'Down Payment (%)', type: 'number', placeholder: '20' }, { name: 'rate', label: 'Interest Rate (%)', type: 'number', placeholder: '6.5' }, { name: 'term', label: 'Loan Term', type: 'select', options: ['30 years', '20 years', '15 years'] }], submitLabel: 'Calculate' }, children: [] },
    ],
  }),

  'kpi-cards': (templateName: string, color: string) => ({
    type: 'stats-counter', name: 'KPI Cards', locked: false, visible: true,
    styles: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', padding: '24px 32px', backgroundColor: '#0d1f3c' },
    content: { stats: [{ value: '8,492', label: 'Active Users', trend: '+12%', trendUp: true }, { value: '$584K', label: 'MRR', trend: '+8.3%', trendUp: true }, { value: '2.4%', label: 'Churn Rate', trend: '-0.3%', trendUp: true }, { value: '94', label: 'NPS Score', trend: '+6', trendUp: true }] },
    children: [],
  }),

  'data-tables': (templateName: string, color: string) => ({
    type: 'section', name: 'Data Tables', locked: false, visible: true,
    styles: { padding: '0 32px 24px', backgroundColor: '#0a1628' },
    content: null,
    children: [
      { type: 'container', name: 'Data Table Card', locked: false, visible: true, styles: { backgroundColor: '#0d1f3c', borderRadius: '12px', border: `1px solid ${color}22`, overflow: 'hidden' }, content: null, children: [
        { type: 'container', name: 'Table Header', locked: false, visible: true, styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${color}18` }, content: null, children: [
          { type: 'heading', name: 'Table Title', locked: false, visible: true, styles: { fontSize: '16px', fontWeight: '700', color: '#f0f9ff', margin: '0' }, content: 'Data Records', children: [] },
          { type: 'button', name: 'Export', locked: false, visible: true, styles: { padding: '7px 16px', backgroundColor: 'transparent', color: color, border: `1px solid ${color}55`, borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }, content: 'Export CSV', children: [] },
        ]},
        { type: 'list', name: 'Table Data', locked: false, visible: true, styles: { padding: '8px 0' }, content: [{ col1: 'Record Alpha', col2: 'Category A', col3: '$12,400', col4: 'Active' }, { col1: 'Record Beta', col2: 'Category B', col3: '$8,900', col4: 'Pending' }, { col1: 'Record Gamma', col2: 'Category A', col3: '$21,000', col4: 'Active' }, { col1: 'Record Delta', col2: 'Category C', col3: '$5,600', col4: 'Inactive' }], children: [] },
      ]},
    ],
  }),

  overview: (templateName: string, color: string) => ({
    type: 'section', name: 'Overview', locked: false, visible: true,
    styles: { padding: '24px 32px', backgroundColor: '#0a1628' },
    content: null,
    children: [
      { type: 'heading', name: 'Overview Title', locked: false, visible: true, styles: { fontSize: '24px', fontWeight: '700', color: '#f0f9ff', marginBottom: '20px' }, content: 'Overview', children: [] },
      { type: 'grid', name: 'Overview Cards', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }, content: null, children: [
        { type: 'container', name: 'Card 1', locked: false, visible: true, styles: { padding: '20px', backgroundColor: '#0d1f3c', borderRadius: '10px', border: `1px solid ${color}22` }, content: null, children: [
          { type: 'text', name: 'Card Label', locked: false, visible: true, styles: { fontSize: '12px', color: '#6b8fb5', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }, content: 'Total Revenue', children: [] },
          { type: 'heading', name: 'Card Value', locked: false, visible: true, styles: { fontSize: '28px', fontWeight: '800', color: '#f0f9ff', margin: '0' }, content: '$284,000', children: [] },
        ]},
        { type: 'container', name: 'Card 2', locked: false, visible: true, styles: { padding: '20px', backgroundColor: '#0d1f3c', borderRadius: '10px', border: `1px solid ${color}22` }, content: null, children: [
          { type: 'text', name: 'Card Label', locked: false, visible: true, styles: { fontSize: '12px', color: '#6b8fb5', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }, content: 'Active Clients', children: [] },
          { type: 'heading', name: 'Card Value', locked: false, visible: true, styles: { fontSize: '28px', fontWeight: '800', color: '#f0f9ff', margin: '0' }, content: '1,284', children: [] },
        ]},
        { type: 'container', name: 'Card 3', locked: false, visible: true, styles: { padding: '20px', backgroundColor: '#0d1f3c', borderRadius: '10px', border: `1px solid ${color}22` }, content: null, children: [
          { type: 'text', name: 'Card Label', locked: false, visible: true, styles: { fontSize: '12px', color: '#6b8fb5', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }, content: 'Pending Invoices', children: [] },
          { type: 'heading', name: 'Card Value', locked: false, visible: true, styles: { fontSize: '28px', fontWeight: '800', color: '#f0f9ff', margin: '0' }, content: '47', children: [] },
        ]},
      ]},
    ],
  }),

  invoices: (templateName: string, color: string) => ({
    type: 'section', name: 'Invoices', locked: false, visible: true,
    styles: { padding: '0 32px 24px', backgroundColor: '#0a1628' },
    content: null,
    children: [
      { type: 'container', name: 'Invoices Card', locked: false, visible: true, styles: { backgroundColor: '#0d1f3c', borderRadius: '12px', border: `1px solid ${color}22`, overflow: 'hidden' }, content: null, children: [
        { type: 'container', name: 'Invoices Header', locked: false, visible: true, styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${color}18` }, content: null, children: [
          { type: 'heading', name: 'Table Title', locked: false, visible: true, styles: { fontSize: '16px', fontWeight: '700', color: '#f0f9ff', margin: '0' }, content: 'Recent Invoices', children: [] },
          { type: 'button', name: 'New Invoice', locked: false, visible: true, styles: { padding: '7px 16px', backgroundColor: color, color: '#08080a', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }, content: '+ New Invoice', children: [] },
        ]},
        { type: 'list', name: 'Invoice Rows', locked: false, visible: true, styles: {}, content: [{ id: 'INV-0041', client: 'Acme Corp', amount: '$4,200', status: 'Paid', due: 'Feb 15' }, { id: 'INV-0042', client: 'NovaTech', amount: '$7,800', status: 'Pending', due: 'Feb 28' }, { id: 'INV-0043', client: 'Brightline', amount: '$2,100', status: 'Overdue', due: 'Feb 10' }], children: [] },
      ]},
    ],
  }),

  pipeline: (templateName: string, color: string) => ({
    type: 'section', name: 'Pipeline', locked: false, visible: true,
    styles: { padding: '24px 32px', backgroundColor: '#0a1628' },
    content: null,
    children: [
      { type: 'heading', name: 'Pipeline Title', locked: false, visible: true, styles: { fontSize: '20px', fontWeight: '700', color: '#f0f9ff', marginBottom: '20px' }, content: 'Sales Pipeline', children: [] },
      { type: 'flex-row', name: 'Pipeline Stages', locked: false, visible: true, styles: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }, content: null, children: [
        ...['Lead', 'Qualified', 'Proposal', 'Closed'].map((stage, i) => ({
          type: 'container', name: `Stage: ${stage}`, locked: false, visible: true, styles: { backgroundColor: '#0d1f3c', borderRadius: '10px', border: `1px solid ${color}22`, padding: '16px', minHeight: '200px' }, content: null, children: [
            { type: 'text', name: 'Stage Label', locked: false, visible: true, styles: { fontSize: '12px', fontWeight: '700', color: color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }, content: stage, children: [] },
            { type: 'text', name: 'Stage Count', locked: false, visible: true, styles: { fontSize: '20px', fontWeight: '800', color: '#f0f9ff' }, content: `${[12, 8, 5, 3][i]} deals`, children: [] },
          ],
        })),
      ]},
    ],
  }),

  contacts: (templateName: string, color: string) => ({
    type: 'section', name: 'Contacts', locked: false, visible: true,
    styles: { padding: '0 32px 24px', backgroundColor: '#0a1628' },
    content: null,
    children: [
      { type: 'container', name: 'Contacts Card', locked: false, visible: true, styles: { backgroundColor: '#0d1f3c', borderRadius: '12px', border: `1px solid ${color}22`, overflow: 'hidden' }, content: null, children: [
        { type: 'container', name: 'Contacts Header', locked: false, visible: true, styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${color}18` }, content: null, children: [
          { type: 'heading', name: 'Title', locked: false, visible: true, styles: { fontSize: '16px', fontWeight: '700', color: '#f0f9ff', margin: '0' }, content: 'Contacts', children: [] },
          { type: 'button', name: 'Add Contact', locked: false, visible: true, styles: { padding: '7px 16px', backgroundColor: color, color: '#08080a', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }, content: '+ Add Contact', children: [] },
        ]},
        { type: 'list', name: 'Contacts List', locked: false, visible: true, styles: {}, content: [{ name: 'Sarah Johnson', company: 'Acme Corp', email: 'sarah@acme.com', stage: 'Qualified' }, { name: 'Mike Torres', company: 'NovaTech', email: 'mike@novatech.com', stage: 'Lead' }, { name: 'Anna Wei', company: 'Brightline', email: 'anna@brightline.com', stage: 'Proposal' }], children: [] },
      ]},
    ],
  }),

  activities: (templateName: string, color: string) => ({
    type: 'section', name: 'Activities', locked: false, visible: true,
    styles: { padding: '0 32px 24px', backgroundColor: '#0a1628' },
    content: null,
    children: [
      { type: 'container', name: 'Activities Card', locked: false, visible: true, styles: { backgroundColor: '#0d1f3c', borderRadius: '12px', border: `1px solid ${color}22`, padding: '24px' }, content: null, children: [
        { type: 'heading', name: 'Activities Title', locked: false, visible: true, styles: { fontSize: '16px', fontWeight: '700', color: '#f0f9ff', marginBottom: '20px' }, content: 'Recent Activity', children: [] },
        { type: 'list', name: 'Activity Feed', locked: false, visible: true, styles: { display: 'flex', flexDirection: 'column', gap: '14px' }, content: [{ action: 'Deal closed with Acme Corp', time: '2 hours ago', type: 'success' }, { action: 'New lead: Mike Torres from NovaTech', time: '4 hours ago', type: 'info' }, { action: 'Invoice #041 paid — $4,200', time: 'Yesterday', type: 'success' }, { action: 'Follow-up scheduled with Brightline', time: 'Yesterday', type: 'info' }], children: [] },
      ]},
    ],
  }),

  kanban: (templateName: string, color: string) => ({
    type: 'section', name: 'Kanban Board', locked: false, visible: true,
    styles: { padding: '24px 32px', backgroundColor: '#0a1628', overflowX: 'auto' },
    content: null,
    children: [
      { type: 'heading', name: 'Kanban Title', locked: false, visible: true, styles: { fontSize: '20px', fontWeight: '700', color: '#f0f9ff', marginBottom: '20px' }, content: 'Project Board', children: [] },
      { type: 'flex-row', name: 'Kanban Columns', locked: false, visible: true, styles: { display: 'flex', gap: '16px', minWidth: '800px' }, content: null, children: [
        ...['Backlog', 'In Progress', 'Review', 'Done'].map(col => ({
          type: 'container', name: `Column: ${col}`, locked: false, visible: true, styles: { flex: '1', backgroundColor: '#0d1f3c', borderRadius: '10px', border: `1px solid ${color}22`, padding: '16px', minHeight: '300px' }, content: null, children: [
            { type: 'text', name: 'Column Label', locked: false, visible: true, styles: { fontSize: '12px', fontWeight: '700', color: color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px', display: 'block' }, content: col, children: [] },
            { type: 'container', name: 'Task Card', locked: false, visible: true, styles: { padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px', border: `1px solid ${color}1a` }, content: null, children: [
              { type: 'text', name: 'Task Name', locked: false, visible: true, styles: { fontSize: '14px', color: '#e0f0ff', fontWeight: '500' }, content: 'Sample task item', children: [] },
            ]},
          ],
        })),
      ]},
    ],
  }),

  timeline: (templateName: string, color: string) => ({
    type: 'section', name: 'Timeline', locked: false, visible: true,
    styles: { padding: '24px 32px', backgroundColor: '#0a1628' },
    content: null,
    children: [
      { type: 'heading', name: 'Timeline Title', locked: false, visible: true, styles: { fontSize: '20px', fontWeight: '700', color: '#f0f9ff', marginBottom: '24px' }, content: 'Sprint Timeline', children: [] },
      { type: 'list', name: 'Timeline Items', locked: false, visible: true, styles: { display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '20px', borderLeft: `2px solid ${color}44` }, content: [{ milestone: 'Project kickoff', date: 'Feb 1', status: 'done' }, { milestone: 'Sprint 1 complete', date: 'Feb 15', status: 'done' }, { milestone: 'Beta launch', date: 'Mar 1', status: 'in-progress' }, { milestone: 'Full release', date: 'Mar 15', status: 'upcoming' }], children: [] },
    ],
  }),

  'recent-activity': (templateName: string, color: string) => ({
    type: 'section', name: 'Recent Activity', locked: false, visible: true,
    styles: { padding: '0 32px 24px', backgroundColor: '#0a1628' },
    content: null,
    children: [
      { type: 'container', name: 'Activity Card', locked: false, visible: true, styles: { backgroundColor: '#0d1f3c', borderRadius: '12px', border: `1px solid ${color}22`, padding: '24px' }, content: null, children: [
        { type: 'heading', name: 'Activity Title', locked: false, visible: true, styles: { fontSize: '16px', fontWeight: '700', color: '#f0f9ff', marginBottom: '20px' }, content: 'Recent Activity', children: [] },
        { type: 'list', name: 'Activity Feed', locked: false, visible: true, styles: { display: 'flex', flexDirection: 'column', gap: '12px' }, content: [{ event: 'New user registered', detail: 'john@example.com', time: '5 min ago' }, { event: 'Report generated', detail: 'Q4 Financial Summary', time: '1 hour ago' }, { event: 'Alert triggered', detail: 'CPU usage > 90%', time: '2 hours ago' }, { event: 'Backup completed', detail: 'All systems nominal', time: '6 hours ago' }], children: [] },
      ]},
    ],
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deep-clone an array of component nodes, assigning fresh unique IDs to every
 * node in the tree so that multiple instantiations of the same template never
 * share IDs.
 *
 * @param {Array} nodes - Array of component node objects
 * @returns {Array} New array with cloned nodes, each having a fresh id
 */
export function deepCloneWithIds(nodes: Record<string, any>[]): Record<string, any>[] {
  return nodes.map((node) => ({
    ...node,
    id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
    children: node.children ? deepCloneWithIds(node.children) : [],
    locked: node.locked || false,
    visible: node.visible !== false,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER → BASE TEMPLATE MAPPING
// Templates without hand-crafted structures clone the base template for their
// tier and get re-skinned with the template's own name, color, and description.
// ─────────────────────────────────────────────────────────────────────────────
const TIER_BASE_ID: Record<string, number> = {
  [TEMPLATE_TIERS.STARTER]: 1,    // Coastal Coffee
  [TEMPLATE_TIERS.BUSINESS]: 2,   // Summit Law
  [TEMPLATE_TIERS.PREMIUM]: 3,    // Bella Spa
  [TEMPLATE_TIERS.ENTERPRISE]: 4, // Apex Logistics
};

// Brand names as they appear in the hand-crafted structures (may differ from
// the short name in ALL_TEMPLATES).  reskinNode replaces all of these.
const BASE_TEMPLATE_BRANDS: Record<number, string[]> = {
  1: ['Coastal Coffee'],
  2: ['Summit Law Group LLP', 'Summit Law Group', 'Summit Law'],
  3: ['Bella Spa & Wellness', 'Bella Spa'],
  4: ['Apex Logistics Inc', 'Apex Logistics'],
};

/**
 * Replace all occurrences of each string in `baseNames` with `newName`
 * within a single string value.  Longest names replaced first to avoid
 * partial-match issues (e.g. "Summit Law Group LLP" before "Summit Law").
 */
function replaceNames(str: string, baseNames: string[], newName: string): string {
  for (const bn of baseNames) {
    if (str.includes(bn)) str = str.split(bn).join(newName);
  }
  return str;
}

/**
 * Recursively re-skin a cloned component tree: replace the base template's
 * brand name(s) with the new template's name, and swap the accent color in
 * all style values.  Returns a new tree (does not mutate input).
 */
function reskinNode(node: Record<string, any>, baseNames: string[], newName: string, baseColor: string, newColor: string): Record<string, any> {
  const cloned = { ...node };

  // — Replace brand name in string content —
  if (typeof cloned.content === 'string') {
    cloned.content = replaceNames(cloned.content, baseNames, newName);
  }

  // — Replace brand in object-shaped content (navbar brand, footer copyright, etc.) —
  if (cloned.content && typeof cloned.content === 'object' && !Array.isArray(cloned.content)) {
    cloned.content = { ...cloned.content };
    for (const key of Object.keys(cloned.content)) {
      if (typeof cloned.content[key] === 'string') {
        cloned.content[key] = replaceNames(cloned.content[key], baseNames, newName);
      }
    }
  }

  // — Swap accent color in style values —
  if (cloned.styles && baseColor && newColor) {
    cloned.styles = { ...cloned.styles };
    const baseLower = baseColor.toLowerCase();
    for (const key of Object.keys(cloned.styles)) {
      const val = cloned.styles[key];
      if (typeof val === 'string' && val.toLowerCase().includes(baseLower)) {
        cloned.styles[key] = val.replace(new RegExp(baseLower.replace('#', '#?'), 'gi'), newColor);
      }
    }
  }

  // — Recurse into children —
  if (cloned.children && cloned.children.length) {
    cloned.children = cloned.children.map((child) =>
      reskinNode(child, baseNames, newName, baseColor, newColor)
    );
  }

  return cloned;
}

function reskinStructure(structure: Record<string, any>[], baseNames: string[], newName: string, baseColor: string, newColor: string): Record<string, any>[] {
  return structure.map((node) => reskinNode(node, baseNames, newName, baseColor, newColor));
}

/**
 * Instantiate a template into a ready-to-use builder component tree.
 *
 * Resolution order:
 *   1. Hand-crafted TEMPLATE_STRUCTURES[templateId] (templates 1-4)
 *   2. Clone the base tier template and re-skin with this template's identity
 *   3. Fallback to SECTION_BLUEPRINTS if no tier base exists
 *
 * @param {number|string} templateId - Template ID (numeric or string)
 * @returns {Array} Array of component node objects with fresh IDs
 */
export function instantiateTemplate(templateId: number | string): Record<string, any>[] {
  const id = parseInt(String(templateId));

  // 1. Use hand-crafted structure if available (templates 1-4)
  const structure = TEMPLATE_STRUCTURES[id];
  if (structure) {
    return deepCloneWithIds(structure);
  }

  // 2. Clone the base tier template and re-skin it
  const template = ALL_TEMPLATES.find((t) => t.id === id);
  if (!template) return [];

  const baseId = TIER_BASE_ID[template.tier];
  const baseStructure = baseId ? TEMPLATE_STRUCTURES[baseId] : null;

  if (baseStructure) {
    const baseNames = BASE_TEMPLATE_BRANDS[baseId] || [];
    const baseTemplate = ALL_TEMPLATES.find((t) => t.id === baseId);
    const baseColor = baseTemplate ? baseTemplate.color : null;
    const reskinned = reskinStructure(baseStructure, baseNames, template.name, baseColor, template.color);
    return deepCloneWithIds(reskinned);
  }

  // 3. Fallback to blueprint-based generation
  return (template.components || []).map((compName) => {
    const blueprint = SECTION_BLUEPRINTS[compName];
    if (blueprint) {
      return deepCloneWithIds([blueprint(template.name, template.color || '#c8a43e')])[0];
    }

    const label = compName.charAt(0).toUpperCase() + compName.slice(1).replace(/-/g, ' ');
    return {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      type: 'section',
      name: label,
      content: null,
      styles: { padding: '60px 20px', backgroundColor: '#0a0a0f', minHeight: '300px' },
      locked: false,
      visible: true,
      children: [
        {
          id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
          type: 'heading',
          name: `${label} Heading`,
          content: label,
          styles: { fontSize: '32px', fontWeight: '600', color: '#f0f9ff', textAlign: 'center', marginBottom: '16px' },
          locked: false,
          visible: true,
          children: [],
        },
        {
          id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
          type: 'text',
          name: `${label} Body`,
          content: `This is the ${label.toLowerCase()} section. Add your content here.`,
          styles: { fontSize: '16px', color: '#a0a0a8', textAlign: 'center', maxWidth: '600px', margin: '0 auto', lineHeight: '1.7' },
          locked: false,
          visible: true,
          children: [],
        },
      ],
    };
  });
}

/**
 * Return the raw (un-cloned) hand-crafted structure for a given template ID,
 * or null if no hand-crafted structure exists.
 *
 * @param {number|string} templateId
 * @returns {Array|null}
 */
export function getTemplateStructure(templateId: number | string): Record<string, any>[] | null {
  return TEMPLATE_STRUCTURES[parseInt(String(templateId))] || null;
}
