-- ============================================================
-- Three Seas Digital -- Business Intelligence Seed Data
-- ============================================================
-- Seeds the BI tables with base reference data:
--   - 6 audit categories (with weights, icons, colors)
--   - 24 subcriteria (4 per category)
--   - 10 recommendation templates
--
-- DEPENDENCY: Run AFTER schema-bi.sql (which must run after
-- schema.sql and seed.sql).
--
-- Run order:
--   1. schema.sql
--   2. seed.sql
--   3. schema-bi.sql
--   4. seed-bi.sql   (this file)
-- ============================================================

-- ============================================================
-- Audit Categories (6 base categories)
-- ============================================================
-- Using string IDs to match frontend generateId() format.
-- IDs are hardcoded for predictable referencing in subcriteria and templates.

INSERT INTO audit_categories (id, name, slug, description, is_base, default_weight, display_order, sort_order, icon, color) VALUES
('cat-web-presence', 'Web Presence',  'web-presence',  'Website design, performance, mobile responsiveness, and user experience',            TRUE, 25.00, 1, 1, 'Globe',    '#3B82F6'),
('cat-seo',          'SEO',           'seo',           'Search engine optimization, keyword rankings, technical SEO, and local search',       TRUE, 20.00, 2, 2, 'Search',   '#10B981'),
('cat-social-media', 'Social Media',  'social-media',  'Social media presence, engagement, content strategy, and audience growth',            TRUE, 15.00, 3, 3, 'Share2',   '#8B5CF6'),
('cat-branding',     'Branding',      'branding',      'Brand identity, consistency, messaging, and market positioning',                      TRUE, 15.00, 4, 4, 'Palette',  '#F59E0B'),
('cat-operations',   'Operations',    'operations',    'Business operations efficiency, tools, workflows, and customer management',           TRUE, 15.00, 5, 5, 'Settings', '#EF4444'),
('cat-ai-readiness', 'AI Readiness',  'ai-readiness',  'Adoption of AI tools, automation potential, and readiness for AI-driven strategies',  TRUE, 10.00, 6, 6, 'Cpu',      '#06B6D4');


-- ============================================================
-- Audit Subcriteria (4 per category = 24 total)
-- ============================================================
-- Using string IDs with category reference from above.

-- Web Presence (category_id = cat-web-presence)
INSERT INTO audit_subcriteria (id, category_id, name, description, display_order, sort_order) VALUES
('sub-web-design',      'cat-web-presence', 'Visual Design & Layout',      'Overall aesthetic quality, modern design patterns, visual hierarchy, and brand alignment',               1, 1),
('sub-web-responsive',  'cat-web-presence', 'Mobile Responsiveness',       'Responsive behavior across devices, touch targets, mobile navigation, and viewport optimization',        2, 2),
('sub-web-speed',       'cat-web-presence', 'Page Speed & Performance',    'Core Web Vitals (LCP, FID, CLS), load times, asset optimization, and server response',                  3, 3),
('sub-web-content',     'cat-web-presence', 'Content Quality & Structure', 'Content organization, readability, calls-to-action, and information architecture',                      4, 4);

-- SEO (category_id = cat-seo)
INSERT INTO audit_subcriteria (id, category_id, name, description, display_order, sort_order) VALUES
('sub-seo-onpage',      'cat-seo', 'On-Page SEO',           'Title tags, meta descriptions, heading hierarchy, keyword usage, and internal linking',                        1, 1),
('sub-seo-technical',   'cat-seo', 'Technical SEO',         'Crawlability, indexation, sitemap, robots.txt, structured data, and canonical tags',                           2, 2),
('sub-seo-local',       'cat-seo', 'Local SEO',             'Google Business Profile, local citations, NAP consistency, reviews, and local keywords',                       3, 3),
('sub-seo-authority',   'cat-seo', 'Content & Authority',   'Blog presence, content freshness, backlink profile, domain authority, and topical relevance',                  4, 4);

-- Social Media (category_id = cat-social-media)
INSERT INTO audit_subcriteria (id, category_id, name, description, display_order, sort_order) VALUES
('sub-social-presence',  'cat-social-media', 'Platform Presence',       'Active profiles on relevant platforms, profile completeness, and cross-platform consistency',                1, 1),
('sub-social-strategy',  'cat-social-media', 'Content Strategy',        'Posting frequency, content mix, visual quality, hashtag usage, and content calendar',                        2, 2),
('sub-social-engage',    'cat-social-media', 'Engagement & Community',  'Follower interaction, response times, community building, and user-generated content',                      3, 3),
('sub-social-growth',    'cat-social-media', 'Growth & Analytics',      'Follower growth rate, reach trends, engagement metrics, and data-driven optimization',                      4, 4);

-- Branding (category_id = cat-branding)
INSERT INTO audit_subcriteria (id, category_id, name, description, display_order, sort_order) VALUES
('sub-brand-visual',     'cat-branding', 'Visual Identity',              'Logo quality, color palette consistency, typography, and brand asset library',                           1, 1),
('sub-brand-messaging',  'cat-branding', 'Messaging & Voice',            'Brand voice consistency, tagline clarity, value proposition, and storytelling',                          2, 2),
('sub-brand-position',   'cat-branding', 'Market Positioning',           'Competitive differentiation, target audience alignment, and unique selling proposition',                 3, 3),
('sub-brand-consistent', 'cat-branding', 'Brand Consistency',            'Cross-channel consistency, style guide adherence, and professional presentation',                        4, 4);

-- Operations (category_id = cat-operations)
INSERT INTO audit_subcriteria (id, category_id, name, description, display_order, sort_order) VALUES
('sub-ops-crm',          'cat-operations', 'Customer Management',       'CRM usage, customer communication tools, follow-up processes, and retention strategies',                   1, 1),
('sub-ops-tools',        'cat-operations', 'Digital Tools & Software',  'Tech stack evaluation, tool integration, workflow automation, and software utilization',                    2, 2),
('sub-ops-reviews',      'cat-operations', 'Online Reviews & Reputation', 'Review monitoring, response strategy, reputation management, and testimonial collection',                3, 3),
('sub-ops-process',      'cat-operations', 'Process Efficiency',          'Standard operating procedures, team workflows, task management, and bottleneck identification',           4, 4);

-- AI Readiness (category_id = cat-ai-readiness)
INSERT INTO audit_subcriteria (id, category_id, name, description, display_order, sort_order) VALUES
('sub-ai-adoption',      'cat-ai-readiness', 'Current AI Adoption',        'Existing AI tool usage, chatbots, automated responses, and AI-assisted content creation',                 1, 1),
('sub-ai-data',          'cat-ai-readiness', 'Data Infrastructure',        'Data collection practices, analytics setup, data quality, and integration readiness',                     2, 2),
('sub-ai-automation',    'cat-ai-readiness', 'Automation Potential',       'Identifiable automation opportunities, repetitive task analysis, and workflow optimization areas',          3, 3),
('sub-ai-strategy',      'cat-ai-readiness', 'AI Strategy Readiness',      'Team AI literacy, willingness to adopt, budget allocation, and strategic AI implementation potential',      4, 4);


-- ============================================================
-- Recommendation Templates (10 templates)
-- ============================================================
-- Covers common recommendations across all 6 audit categories.
-- category_id references: cat-web-presence, cat-seo, cat-social-media,
--                         cat-branding, cat-operations, cat-ai-readiness

INSERT INTO recommendation_templates
    (id, title, category_id, category, trigger_condition, description, expected_outcome, estimated_cost_min, estimated_cost_max, estimated_timeline, linked_service, priority, impact)
VALUES
    -- Web Presence templates
    ('tpl-web-redesign',
     'Website Redesign - Modern & Mobile-First',
     'cat-web-presence', 'web-presence',
     'Web Presence score below 5.0',
     'Complete website redesign with modern design patterns, mobile-first approach, optimized performance, and clear calls-to-action. Includes UX audit, wireframing, and responsive development.',
     'Improved user engagement, lower bounce rates, higher conversion rates, and professional brand perception.',
     2500.00, 15000.00, '4-8 weeks', 'web-design', 'high', 'high'),

    ('tpl-web-performance',
     'Performance Optimization & Core Web Vitals',
     'cat-web-presence', 'web-presence',
     'Page Speed subcriteria score below 4.0',
     'Optimize page load times, compress assets, implement lazy loading, configure caching, and improve Core Web Vitals (LCP, FID, CLS) to meet Google standards.',
     'Faster page loads, improved search rankings, better user experience, and reduced bounce rates.',
     500.00, 3000.00, '1-2 weeks', 'web-optimization', 'critical', 'high'),

    -- SEO templates
    ('tpl-seo-comprehensive',
     'Comprehensive SEO Audit & Implementation',
     'cat-seo', 'seo',
     'SEO score below 5.0',
     'Full technical SEO audit including on-page optimization, meta tags, structured data implementation, sitemap configuration, and internal linking strategy.',
     'Improved search engine visibility, higher organic traffic, better keyword rankings, and increased qualified leads.',
     1000.00, 5000.00, '2-4 weeks', 'seo', 'high', 'high'),

    ('tpl-seo-local',
     'Local SEO & Google Business Profile Optimization',
     'cat-seo', 'seo',
     'Local SEO subcriteria score below 4.0',
     'Optimize Google Business Profile, build local citations, ensure NAP consistency, implement local schema markup, and develop a review generation strategy.',
     'Higher local search rankings, increased map pack visibility, more local customer inquiries, and improved online reputation.',
     500.00, 2000.00, '1-3 weeks', 'local-seo', 'high', 'high'),

    -- Social Media templates
    ('tpl-social-strategy',
     'Social Media Strategy & Content Plan',
     'cat-social-media', 'social-media',
     'Social Media score below 5.0',
     'Develop a comprehensive social media strategy including platform selection, content calendar, posting schedule, engagement tactics, and performance tracking.',
     'Increased social media presence, higher engagement rates, consistent brand messaging, and growing follower base.',
     750.00, 3000.00, '2-3 weeks', 'social-media', 'medium', 'medium'),

    ('tpl-social-advertising',
     'Social Media Advertising Campaign',
     'cat-social-media', 'social-media',
     'Growth subcriteria score below 3.0',
     'Set up and manage targeted social media advertising campaigns on relevant platforms with audience targeting, A/B testing, and conversion tracking.',
     'Increased brand awareness, targeted reach to ideal customers, measurable ROI, and lead generation.',
     1000.00, 5000.00, '2-4 weeks', 'social-advertising', 'medium', 'high'),

    -- Branding templates
    ('tpl-brand-identity',
     'Brand Identity Package',
     'cat-branding', 'branding',
     'Branding score below 4.0',
     'Create or refresh brand identity including logo design, color palette, typography system, brand guidelines document, and branded asset templates.',
     'Professional and consistent brand identity, improved brand recognition, and cohesive visual communication across all channels.',
     1500.00, 8000.00, '3-6 weeks', 'branding', 'medium', 'high'),

    -- Operations templates
    ('tpl-ops-crm',
     'CRM Setup & Customer Management System',
     'cat-operations', 'operations',
     'Customer Management subcriteria score below 4.0',
     'Implement or optimize a CRM system with contact management, sales pipeline, automated follow-ups, email integration, and reporting dashboards.',
     'Streamlined customer management, improved follow-up rates, better sales tracking, and increased customer retention.',
     1000.00, 5000.00, '2-4 weeks', 'crm-setup', 'high', 'high'),

    -- AI Readiness templates
    ('tpl-ai-chatbot',
     'AI Chatbot & Automated Customer Support',
     'cat-ai-readiness', 'ai-readiness',
     'Current AI Adoption subcriteria score below 3.0',
     'Deploy an AI-powered chatbot for website visitor engagement, automated FAQ responses, lead qualification, and appointment scheduling with human handoff capabilities.',
     'Reduced response times, 24/7 customer support availability, automated lead capture, and improved customer satisfaction.',
     1500.00, 6000.00, '2-4 weeks', 'ai-chatbot', 'medium', 'high'),

    ('tpl-ai-marketing',
     'AI-Powered Marketing Automation',
     'cat-ai-readiness', 'ai-readiness',
     'Automation Potential subcriteria score below 3.0',
     'Implement AI-driven marketing automation including email sequences, content personalization, predictive analytics, and automated social media scheduling.',
     'Increased marketing efficiency, personalized customer journeys, data-driven decision making, and reduced manual workload.',
     2000.00, 8000.00, '4-6 weeks', 'ai-marketing', 'medium', 'medium');
