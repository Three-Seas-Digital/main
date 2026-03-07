import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Check, Circle, FileText, CheckCircle, ChevronDown, ChevronUp, Eye, Plus,
  ClipboardCheck, User, Star, Shield, Mail, Briefcase, FolderKanban,
  AlertCircle, PenTool, Type, RotateCcw, BookOpen,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SITE_INFO, safeGetItem } from '../../constants';
import { generateContractPdf, generateProposalPdf } from '../../utils/generateOnboardingPdfs';

const DOC_LABELS = {
  intake: 'Intake Questionnaire',
  contract: 'Service Contract',
  proposal: 'Service Proposal',
  welcome_packet: 'Welcome Packet',
};

const DOC_STATUS_COLORS = {
  pending: { bg: '#f3f4f6', color: '#6b7280', label: 'Pending' },
  generated: { bg: '#dbeafe', color: '#2563eb', label: 'Ready' },
  downloaded: { bg: '#e0e7ff', color: '#4f46e5', label: 'Downloaded' },
  uploaded: { bg: '#fef3c7', color: '#d97706', label: 'Under Review' },
  approved: { bg: '#dcfce7', color: '#16a34a', label: 'Approved' },
};

const STEP_ICONS = [User, Star, Shield, Mail, FileText, FolderKanban];
const STEP_LABELS = [
  'Profile Complete',
  'Service Tier Assigned',
  'Portal Access Set Up',
  'Welcome Email Sent',
  'Documents Reviewed',
  'First Project Created',
];

// Intake form field definitions grouped by section
const INTAKE_SECTIONS = [
  {
    title: 'Business Overview',
    fields: [
      { key: 'industry', label: 'Industry', type: 'text' },
      { key: 'sub_industry', label: 'Sub-Industry', type: 'text' },
      { key: 'years_in_operation', label: 'Years in Operation', type: 'text' },
      { key: 'employee_count_range', label: 'Employee Count Range', type: 'select', options: ['1-5', '6-20', '21-50', '51-200', '200+'] },
      { key: 'annual_revenue_range', label: 'Annual Revenue Range', type: 'select', options: ['Under $100K', '$100K-$500K', '$500K-$1M', '$1M-$5M', '$5M+'] },
      { key: 'target_market', label: 'Target Market', type: 'text' },
      { key: 'business_model', label: 'Business Model', type: 'select', options: ['B2B', 'B2C', 'B2B2C', 'D2C', 'Marketplace', 'SaaS', 'Other'] },
    ],
  },
  {
    title: 'Digital Presence',
    fields: [
      { key: 'current_website_url', label: 'Current Website URL', type: 'text', placeholder: 'https://' },
      { key: 'hosting_provider', label: 'Hosting Provider', type: 'text' },
      { key: 'tech_stack', label: 'Tech Stack', type: 'text' },
      { key: 'domain_age_years', label: 'Domain Age (Years)', type: 'text' },
      { key: 'has_ssl', label: 'Has SSL Certificate', type: 'toggle' },
      { key: 'is_mobile_responsive', label: 'Mobile Responsive', type: 'toggle' },
      { key: 'last_website_update', label: 'Last Website Update', type: 'text', placeholder: 'e.g. January 2025' },
    ],
  },
  {
    title: 'Marketing',
    fields: [
      { key: 'social_platforms', label: 'Social Media Platforms', type: 'text', placeholder: 'e.g. Facebook, Instagram, LinkedIn' },
      { key: 'email_marketing_tool', label: 'Email Marketing Tool', type: 'text', placeholder: 'e.g. Mailchimp, Constant Contact' },
      { key: 'paid_advertising', label: 'Paid Advertising', type: 'text', placeholder: 'e.g. Google Ads, Facebook Ads' },
      { key: 'content_marketing', label: 'Content Marketing', type: 'text', placeholder: 'e.g. Blog, YouTube, Podcast' },
      { key: 'seo_efforts', label: 'SEO Efforts', type: 'text', placeholder: 'Describe your current SEO strategy' },
    ],
  },
  {
    title: 'Pain Points & Goals',
    fields: [
      { key: 'pain_points', label: 'Pain Points', type: 'textarea', placeholder: 'What challenges are you facing with your digital presence?' },
      { key: 'goals', label: 'Goals', type: 'textarea', placeholder: 'What do you want to achieve?' },
      { key: 'budget_range', label: 'Budget Range', type: 'select', options: ['Under $1,000', '$1,000-$5,000', '$5,000-$10,000', '$10,000-$25,000', '$25,000+'] },
      { key: 'timeline_expectations', label: 'Timeline Expectations', type: 'text', placeholder: 'e.g. 3 months, ASAP' },
    ],
  },
  {
    title: 'Additional Notes',
    fields: [
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional information you\'d like to share?' },
    ],
  },
];

/* ===== Branded Header ===== */
function BrandedHeader() {
  return (
    <div className="portal-onboarding-branded-header">
      <img src="/images/brand-icon.svg" alt="" className="portal-onboarding-brand-logo" />
      <div>
        <div className="portal-onboarding-brand-name">{SITE_INFO.name || 'Three Seas Digital'}</div>
        <div className="portal-onboarding-brand-tagline">Premium Digital Solutions</div>
      </div>
    </div>
  );
}

/* ===== Signature Pad ===== */
interface SignaturePadProps {
  onSign: (data: string) => void;
  disabled?: boolean;
}

function SignaturePad({ onSign, disabled }: SignaturePadProps) {
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const getPos = useCallback((e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const startDraw = useCallback((e: any) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    lastPos.current = getPos(e, canvas);
  }, [getPos]);

  const draw = useCallback((e: any) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }, [getPos]);

  const stopDraw = useCallback(() => {
    isDrawing.current = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== 'draw') return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [mode]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const isCanvasEmpty = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) return false;
    }
    return true;
  };

  const handleSign = () => {
    if (mode === 'draw') {
      if (isCanvasEmpty()) return;
      const sigData = canvasRef.current.toDataURL('image/png');
      onSign(sigData);
    } else {
      if (!typedName.trim()) return;
      onSign(typedName.trim());
    }
  };

  const canSign = mode === 'draw' ? true : !!typedName.trim();

  return (
    <div className="portal-onboarding-signature">
      <h4><PenTool size={16} /> Signature</h4>
      <div className="portal-onboarding-sig-toggle">
        <button
          className={mode === 'draw' ? 'active' : ''}
          onClick={() => setMode('draw')}
          type="button"
        >
          <PenTool size={14} /> Draw
        </button>
        <button
          className={mode === 'type' ? 'active' : ''}
          onClick={() => setMode('type')}
          type="button"
        >
          <Type size={14} /> Type
        </button>
      </div>

      {mode === 'draw' ? (
        <div className="portal-onboarding-sig-draw">
          <canvas
            ref={canvasRef}
            width={600}
            height={240}
            className="portal-onboarding-sig-canvas"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          <button type="button" className="portal-onboarding-sig-clear" onClick={clearCanvas}>
            <RotateCcw size={14} /> Clear
          </button>
        </div>
      ) : (
        <div className="portal-onboarding-sig-type">
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Type your full legal name"
            className="portal-onboarding-sig-input"
          />
          {typedName.trim() && (
            <div className="portal-onboarding-sig-typed-preview">{typedName}</div>
          )}
        </div>
      )}

      <button
        className="btn btn-primary portal-onboarding-sign-btn"
        onClick={handleSign}
        disabled={disabled || !canSign}
        type="button"
      >
        <CheckCircle size={16} /> Sign Document
      </button>
    </div>
  );
}


/* ===== Main Component ===== */

interface PortalOnboardingProps {
  client: any;
}

export default function PortalOnboarding({ client }: PortalOnboardingProps) {
  const { updateClientOnboarding, submitClientIntake, addProject, SUBSCRIPTION_TIERS } = useAppContext();

  // Intake form state
  const existingIntake = useMemo(
    () => safeGetItem('threeseas_bi_intakes', {})[client.id] || {},
    [client.id]
  );
  const [intakeForm, setIntakeForm] = useState<Record<string, any>>(() => {
    const form: Record<string, any> = {};
    INTAKE_SECTIONS.forEach((section) => {
      section.fields.forEach((f) => {
        const val = existingIntake[f.key];
        if (f.type === 'toggle') {
          form[f.key] = val === true;
        } else if (Array.isArray(val)) {
          form[f.key] = val.join(', ');
        } else {
          form[f.key] = val || '';
        }
      });
    });
    return form;
  });
  const [intakeSubmitted, setIntakeSubmitted] = useState(false);

  // Expand/collapse state for completed documents
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const toggleDocExpand = (key: string) => setExpandedDocs((prev) => ({ ...prev, [key]: !prev[key] }));

  // Project form state
  const [projectForm, setProjectForm] = useState({ title: '', description: '' });
  const [localProjects, setLocalProjects] = useState<any[]>([]);

  const onboarding = client.onboarding || {};
  const docs = onboarding.documents || {};
  const docsGenerated = !!onboarding.documentsGeneratedAt;

  // Merge server projects with locally created ones (before sync completes)
  const clientProjects = useMemo(() => {
    const serverProjects = client.projects || [];
    const allIds = new Set(serverProjects.map(p => p.id));
    const merged = [...serverProjects];
    for (const lp of localProjects) {
      if (!allIds.has(lp.id)) merged.push(lp);
    }
    return merged;
  }, [client.projects, localProjects]);

  const tierData = SUBSCRIPTION_TIERS?.[client.tier] || {};
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Step checklist
  const stepStatuses = useMemo(() => {
    const hasProfile = !!(client.businessName && client.phone && (client.street || client.city));
    const hasTier = client.tier && client.tier !== 'free';
    const hasPassword = !!client.password;
    const welcomeSent = !!onboarding.welcomeEmailSent;
    const allDocsApproved = docsGenerated && Object.values(docs).every((d: any) => d.status === 'approved');
    const hasProject = clientProjects.length > 0;
    return [hasProfile, hasTier, hasPassword, welcomeSent, allDocsApproved, hasProject];
  }, [client, onboarding, docs, docsGenerated, clientProjects]);

  const completedCount = stepStatuses.filter(Boolean).length;

  // Handle intake form field change
  const handleIntakeChange = (key: string, value: any) => {
    setIntakeForm((prev) => ({ ...prev, [key]: value }));
  };

  // Submit intake form
  const handleSubmitIntake = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...intakeForm };
    // Convert social_platforms string back to array
    if (typeof data.social_platforms === 'string') {
      data.social_platforms = data.social_platforms.split(',').map((s) => s.trim()).filter(Boolean);
    }
    submitClientIntake(client.id, data);
    setIntakeSubmitted(true);
  };

  // Welcome packet mark as read
  const handleMarkWelcomeRead = () => {
    const updatedDocs = { ...docs };
    updatedDocs.welcome_packet = {
      ...updatedDocs.welcome_packet,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
    };
    updateClientOnboarding(client.id, { documents: updatedDocs });
  };

  // Sign proposal/contract — regenerate PDF with signature embedded
  const handleSign = async (docKey: string, signatureData: string) => {
    const signedAt = new Date().toISOString();
    const updatedDocs = { ...docs };
    updatedDocs[docKey] = {
      ...updatedDocs[docKey],
      status: 'uploaded',
      signatureData,
      signedAt,
      signedBy: client.name,
      uploadedAt: signedAt,
    };
    updateClientOnboarding(client.id, { documents: updatedDocs });

    // Regenerate the PDF with signature embedded (async, non-blocking)
    try {
      const sigOpts = { signatureData, signedAt };
      let signedPdf;
      if (docKey === 'contract') {
        signedPdf = await generateContractPdf(client, tierData, sigOpts);
      } else if (docKey === 'proposal') {
        signedPdf = await generateProposalPdf(client, tierData, existingIntake, {}, sigOpts);
      }
      if (signedPdf) {
        updatedDocs[docKey].signedPdfData = signedPdf.fileData;
        updatedDocs[docKey].signedPdfName = signedPdf.name;
        updateClientOnboarding(client.id, { documents: updatedDocs });
      }
    } catch (err) {
      console.error(`[Onboarding] Failed to regenerate signed ${docKey} PDF:`, err);
    }
  };

  // Create first project
  const handleCreateProject = () => {
    if (!projectForm.title.trim()) return;
    const created = addProject(client.id, {
      title: projectForm.title.trim(),
      description: projectForm.description.trim(),
      status: 'planning',
    });
    // Track locally for instant UI update (before parent re-renders with new client.projects)
    if (created) setLocalProjects((prev) => [...prev, created]);
    setProjectForm({ title: '', description: '' });
  };

  /* ===== Render: Intake Form ===== */
  const renderIntakeForm = (docEntry: any) => {
    const statusInfo = DOC_STATUS_COLORS[docEntry.status] || DOC_STATUS_COLORS.pending;
    const isComplete = docEntry.status === 'uploaded' || docEntry.status === 'approved';

    return (
      <div className="portal-onboarding-doc-card">
        <BrandedHeader />
        <div className="portal-onboarding-doc-title-row">
          <h4><ClipboardCheck size={18} /> {DOC_LABELS.intake}</h4>
          <span className="portal-onboarding-doc-status" style={{ background: statusInfo.bg, color: statusInfo.color }}>
            {statusInfo.label}
          </span>
        </div>

        {isComplete || intakeSubmitted ? (
          <>
            <div className="portal-onboarding-doc-done">
              <CheckCircle size={24} />
              <p>Intake questionnaire submitted. Your account manager will review your responses.</p>
            </div>
            <button
              type="button"
              className="portal-onboarding-expand-btn"
              onClick={() => toggleDocExpand('intake')}
            >
              <Eye size={14} />
              {expandedDocs.intake ? 'Hide Responses' : 'View Responses'}
              {expandedDocs.intake ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {expandedDocs.intake && (
              <div className="portal-onboarding-intake-readonly">
                {INTAKE_SECTIONS.map((section) => {
                  const filled = section.fields.filter((f) => {
                    const v = intakeForm[f.key];
                    return v && v !== '' && v !== false;
                  });
                  if (filled.length === 0) return null;
                  return (
                    <div key={section.title} className="portal-onboarding-intake-section">
                      <h5>{section.title}</h5>
                      <div className="portal-onboarding-intake-grid">
                        {filled.map((field) => {
                          const val = intakeForm[field.key];
                          const display = field.type === 'toggle'
                            ? (val ? 'Yes' : 'No')
                            : String(val);
                          return (
                            <div
                              key={field.key}
                              className={`portal-onboarding-intake-field ${field.type === 'textarea' ? 'full-width' : ''}`}
                            >
                              <label>{field.label}</label>
                              <div className="portal-onboarding-readonly-value">{display}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <form className="portal-onboarding-intake-form" onSubmit={handleSubmitIntake}>
            {INTAKE_SECTIONS.map((section) => (
              <div key={section.title} className="portal-onboarding-intake-section">
                <h5>{section.title}</h5>
                <div className="portal-onboarding-intake-grid">
                  {section.fields.map((field) => (
                    <div
                      key={field.key}
                      className={`portal-onboarding-intake-field ${field.type === 'textarea' ? 'full-width' : ''}`}
                    >
                      <label htmlFor={`intake-${field.key}`}>{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          id={`intake-${field.key}`}
                          value={intakeForm[field.key] || ''}
                          onChange={(e) => handleIntakeChange(field.key, e.target.value)}
                          placeholder={field.placeholder || ''}
                          rows={3}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          id={`intake-${field.key}`}
                          value={intakeForm[field.key] || ''}
                          onChange={(e) => handleIntakeChange(field.key, e.target.value)}
                        >
                          <option value="">Select...</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'toggle' ? (
                        <label className="portal-onboarding-toggle">
                          <input
                            type="checkbox"
                            checked={!!intakeForm[field.key]}
                            onChange={(e) => handleIntakeChange(field.key, e.target.checked)}
                          />
                          <span className="portal-onboarding-toggle-slider" />
                          <span className="portal-onboarding-toggle-label">
                            {intakeForm[field.key] ? 'Yes' : 'No'}
                          </span>
                        </label>
                      ) : (
                        <input
                          id={`intake-${field.key}`}
                          type="text"
                          value={intakeForm[field.key] || ''}
                          onChange={(e) => handleIntakeChange(field.key, e.target.value)}
                          placeholder={field.placeholder || ''}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button type="submit" className="btn btn-primary portal-onboarding-submit-btn">
              <CheckCircle size={16} /> Submit Questionnaire
            </button>
          </form>
        )}
      </div>
    );
  };

  /* ===== Render: Welcome Packet ===== */
  const renderWelcomePacket = (docEntry: any) => {
    const statusInfo = DOC_STATUS_COLORS[docEntry.status] || DOC_STATUS_COLORS.pending;
    const isRead = docEntry.status === 'approved';

    const features = [
      'Dashboard \u2014 At-a-glance business health score and key metrics',
      'Business Scorecard \u2014 Detailed audit scores across 6 categories',
      'Growth Metrics \u2014 Track your KPIs with progress visualization',
      'Projects \u2014 Real-time progress on active projects and tasks',
      'Invoices \u2014 View, pay, and download invoices',
      'Recommendations \u2014 Strategic recommendations from your team',
      'Service Requests \u2014 Submit requests and track responses',
      'Messages \u2014 Communicate directly with your team',
    ];

    const steps = [
      'Log in to your Client Portal',
      'Complete the Intake Questionnaire',
      'Review and sign the Service Contract',
      'Review and sign the Service Proposal',
      'Schedule your kickoff call with your account manager',
      'Provide access to existing digital assets (website login, analytics, social media)',
    ];

    return (
      <div className="portal-onboarding-doc-card">
        <BrandedHeader />
        <div className="portal-onboarding-doc-title-row">
          <h4><BookOpen size={18} /> {DOC_LABELS.welcome_packet}</h4>
          <span className="portal-onboarding-doc-status" style={{ background: statusInfo.bg, color: statusInfo.color }}>
            {statusInfo.label}
          </span>
        </div>

        <div className="portal-onboarding-welcome-content">
          <div className="portal-onboarding-welcome-section">
            <h5>Welcome!</h5>
            <p>
              Dear {client.name}, thank you for choosing {SITE_INFO.name || 'Three Seas Digital'}!
              We are excited to partner with you on your digital journey.
              This packet contains everything you need to get started.
            </p>
          </div>

          <div className="portal-onboarding-welcome-section">
            <h5>Portal Features</h5>
            <ul>
              {features.map((feat, i) => <li key={i}>{feat}</li>)}
            </ul>
          </div>

          <div className="portal-onboarding-welcome-section">
            <h5>Getting Started Checklist</h5>
            <ol>
              {steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>

          <div className="portal-onboarding-welcome-section">
            <h5>Contact Information</h5>
            <p>
              <strong>Email:</strong> {SITE_INFO.email}<br />
              {SITE_INFO.phone && <><strong>Phone:</strong> {SITE_INFO.phone}<br /></>}
              <strong>Office Hours:</strong> Monday \u2014 Friday, 9:00 AM \u2014 5:00 PM EST
            </p>
          </div>
        </div>

        {isRead && (
          <div className="portal-onboarding-doc-done">
            <CheckCircle size={20} />
            <p>You've reviewed this welcome packet.</p>
          </div>
        )}
        {!isRead && (
          <button
            className="btn btn-primary portal-onboarding-submit-btn"
            onClick={handleMarkWelcomeRead}
            type="button"
          >
            <Check size={16} /> Mark as Read
          </button>
        )}
      </div>
    );
  };

  /* ===== Render: Proposal ===== */
  const renderProposal = (docEntry: any) => {
    const statusInfo = DOC_STATUS_COLORS[docEntry.status] || DOC_STATUS_COLORS.pending;
    const isSigned = docEntry.status === 'uploaded' || docEntry.status === 'approved';
    const painPoints = existingIntake.pain_points || 'To be identified during intake';
    const goals = existingIntake.goals || 'To be identified during intake';

    const services = [
      'Website design and development',
      'Search engine optimization (SEO)',
      'Content strategy and creation',
      'Social media management',
      'Analytics and reporting',
      'Ongoing maintenance and support',
    ];

    return (
      <div className="portal-onboarding-doc-card">
        <BrandedHeader />
        <div className="portal-onboarding-doc-title-row">
          <h4><FileText size={18} /> {DOC_LABELS.proposal}</h4>
          <span className="portal-onboarding-doc-status" style={{ background: statusInfo.bg, color: statusInfo.color }}>
            {statusInfo.label}
          </span>
        </div>

        {isSigned && (
          <div className="portal-onboarding-doc-done">
            <CheckCircle size={20} />
            <p>
              Proposal signed{docEntry.signedAt ? ` on ${new Date(docEntry.signedAt).toLocaleDateString()}` : ''}.
              {docEntry.status === 'uploaded' && ' Awaiting admin review.'}
              {docEntry.status === 'approved' && ' Approved.'}
            </p>
          </div>
        )}

        {isSigned && (
          <button type="button" className="portal-onboarding-expand-btn" onClick={() => toggleDocExpand('proposal')}>
            <Eye size={14} />
            {expandedDocs.proposal ? 'Hide Document' : 'View Document'}
            {expandedDocs.proposal ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}

        {(!isSigned || expandedDocs.proposal) && (
          <div className="portal-onboarding-doc-view">
            <div className="portal-onboarding-doc-meta-line">
              <span>Prepared for: <strong>{client.name}{client.businessName ? ` \u2014 ${client.businessName}` : ''}</strong></span>
              <span>Date: <strong>{today}</strong></span>
            </div>

            <div className="portal-onboarding-doc-section">
              <h5>Executive Summary</h5>
              <p>Based on our assessment, we have identified the following challenges: {painPoints}</p>
              <p>Our goal is to help you achieve: {goals}</p>
            </div>

            <div className="portal-onboarding-doc-section">
              <h5>Proposed Services</h5>
              <p><strong>Service Tier:</strong> {tierData.label || 'To be determined'}</p>
              {tierData.description && <p>{tierData.description}</p>}
              <p>Services included in this engagement:</p>
              <ul>
                {services.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            <div className="portal-onboarding-doc-section">
              <h5>Timeline</h5>
              <ol>
                <li><strong>Phase 1: Discovery & Strategy (Week 1-2)</strong> \u2014 Intake review, competitor analysis, strategic planning</li>
                <li><strong>Phase 2: Design & Development (Week 3-6)</strong> \u2014 Wireframes, mockups, development, content creation</li>
                <li><strong>Phase 3: Testing & Launch (Week 7-8)</strong> \u2014 QA testing, client review, deployment</li>
                <li><strong>Phase 4: Ongoing Optimization</strong> \u2014 Monthly reporting, SEO updates, content refreshes</li>
              </ol>
            </div>

            <div className="portal-onboarding-doc-section">
              <h5>Investment</h5>
              <p>Pricing is based on the selected service tier and scope of work. Detailed pricing will be included in the final contract.</p>
              <p><strong>Payment Terms:</strong> Net 15 \u2014 invoices due within 15 days of issue</p>
            </div>

            <div className="portal-onboarding-doc-section">
              <h5>Next Steps</h5>
              <ol>
                <li>Review this proposal and complete the Intake Questionnaire</li>
                <li>Schedule a strategy call to discuss your goals</li>
                <li>Sign the Service Contract to begin the engagement</li>
                <li>Access your Client Portal for project tracking and communication</li>
              </ol>
            </div>

            {isSigned && docEntry.signatureData && (
              <div className="portal-onboarding-doc-section portal-onboarding-sig-record">
                <h5>Signature</h5>
                {docEntry.signatureData.startsWith('data:') ? (
                  <img src={docEntry.signatureData} alt="Signature" style={{ maxWidth: '300px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px', background: '#fff' }} />
                ) : (
                  <div className="portal-onboarding-sig-typed-preview">{docEntry.signatureData}</div>
                )}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Signed by {docEntry.signedBy || client.name}{docEntry.signedAt ? ` on ${new Date(docEntry.signedAt).toLocaleDateString()}` : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {!isSigned && <SignaturePad onSign={(sig) => handleSign('proposal', sig)} />}
      </div>
    );
  };

  /* ===== Render: Contract ===== */
  const renderContract = (docEntry: any) => {
    const statusInfo = DOC_STATUS_COLORS[docEntry.status] || DOC_STATUS_COLORS.pending;
    const isSigned = docEntry.status === 'uploaded' || docEntry.status === 'approved';

    return (
      <div className="portal-onboarding-doc-card">
        <BrandedHeader />
        <div className="portal-onboarding-doc-title-row">
          <h4><Shield size={18} /> {DOC_LABELS.contract}</h4>
          <span className="portal-onboarding-doc-status" style={{ background: statusInfo.bg, color: statusInfo.color }}>
            {statusInfo.label}
          </span>
        </div>

        {isSigned && (
          <div className="portal-onboarding-doc-done">
            <CheckCircle size={20} />
            <p>
              Contract signed{docEntry.signedAt ? ` on ${new Date(docEntry.signedAt).toLocaleDateString()}` : ''}.
              {docEntry.status === 'uploaded' && ' Awaiting admin review.'}
              {docEntry.status === 'approved' && ' Approved.'}
            </p>
          </div>
        )}

        {isSigned && (
          <button type="button" className="portal-onboarding-expand-btn" onClick={() => toggleDocExpand('contract')}>
            <Eye size={14} />
            {expandedDocs.contract ? 'Hide Document' : 'View Document'}
            {expandedDocs.contract ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}

        {(!isSigned || expandedDocs.contract) && (
          <div className="portal-onboarding-doc-view">
            <div className="portal-onboarding-doc-section">
              <h5>Parties</h5>
              <p>
                This Service Contract ("Agreement") is entered into as of {today} between:
              </p>
              <p><strong>Provider:</strong> {SITE_INFO.name || 'Three Seas Digital'}</p>
              <p><strong>Client:</strong> {client.name}{client.businessName ? ` (${client.businessName})` : ''}</p>
            </div>

            <div className="portal-onboarding-doc-section">
              <h5>Service Tier</h5>
              <p><strong>Selected Tier:</strong> {tierData.label || 'N/A'}</p>
              {tierData.description && <p>{tierData.description}</p>}
            </div>

            <div className="portal-onboarding-doc-section">
              <h5>Terms</h5>
              <p><strong>Effective Date:</strong> {today}</p>
              <p><strong>Term:</strong> Month-to-month, renewable automatically</p>
              <p><strong>Payment Terms:</strong> Net 15 \u2014 invoices due within 15 days of issue</p>
            </div>

            <div className="portal-onboarding-doc-section">
              <h5>Scope of Services</h5>
              <p>
                Provider agrees to deliver digital marketing, web development, and consulting services as outlined
                in the associated Proposal document, subject to the selected Service Tier.
              </p>
              <p>
                Any additional services beyond the agreed scope will be quoted separately and require written approval.
              </p>
            </div>

            <div className="portal-onboarding-doc-section">
              <h5>Confidentiality</h5>
              <p>
                Both parties agree to keep confidential any proprietary information shared during the engagement.
                This obligation survives termination of this Agreement.
              </p>
            </div>

            <div className="portal-onboarding-doc-section">
              <h5>Limitation of Liability</h5>
              <p>
                Provider liability shall not exceed the total fees paid by Client in the twelve (12) months
                preceding the claim. Neither party shall be liable for indirect, incidental, or consequential damages.
              </p>
            </div>

            <div className="portal-onboarding-doc-section">
              <h5>Termination</h5>
              <p>
                Either party may terminate this Agreement with 30 days written notice. Upon termination,
                Client shall pay for all services rendered through the termination date.
              </p>
            </div>

            {isSigned && docEntry.signatureData && (
              <div className="portal-onboarding-doc-section portal-onboarding-sig-record">
                <h5>Signature</h5>
                {docEntry.signatureData.startsWith('data:') ? (
                  <img src={docEntry.signatureData} alt="Signature" style={{ maxWidth: '300px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px', background: '#fff' }} />
                ) : (
                  <div className="portal-onboarding-sig-typed-preview">{docEntry.signatureData}</div>
                )}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Signed by {docEntry.signedBy || client.name}{docEntry.signedAt ? ` on ${new Date(docEntry.signedAt).toLocaleDateString()}` : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {!isSigned && <SignaturePad onSign={(sig) => handleSign('contract', sig)} />}
      </div>
    );
  };


  /* ===== Main Render ===== */

  if (onboarding.complete) {
    return (
      <div className="portal-onboarding">
        <div className="portal-onboarding-complete-banner">
          <CheckCircle size={40} />
          <h3>Onboarding Complete!</h3>
          <p>You're all set. Explore your portal to track projects, view invoices, and more.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-onboarding">
      <h2><ClipboardCheck size={22} /> Getting Started</h2>
      <p className="portal-onboarding-subtitle">
        Welcome! Complete the steps below to finish your onboarding.
      </p>

      {/* Progress Bar */}
      <div className="portal-onboarding-progress">
        <div className="portal-onboarding-progress-bar">
          <div
            className="portal-onboarding-progress-fill"
            style={{ width: `${(completedCount / 6) * 100}%` }}
          />
        </div>
        <span className="portal-onboarding-progress-text">{completedCount} of 6 steps complete</span>
      </div>

      {/* Step Checklist */}
      <div className="portal-onboarding-checklist">
        {STEP_LABELS.map((label, i) => {
          const Icon = STEP_ICONS[i];
          const done = stepStatuses[i];
          return (
            <div key={i} className={`portal-onboarding-check-item ${done ? 'done' : ''}`}>
              {done ? <CheckCircle size={18} /> : <Circle size={18} />}
              <Icon size={16} />
              <span>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Documents Section */}
      <h3 className="portal-onboarding-docs-title"><FileText size={18} /> Your Documents</h3>

      {!docsGenerated ? (
        <div className="portal-onboarding-docs-empty">
          <AlertCircle size={32} />
          <p>Your account manager is preparing your onboarding documents. Check back soon!</p>
        </div>
      ) : (
        <div className="portal-onboarding-docs-interactive">
          {docs.intake && renderIntakeForm(docs.intake)}
          {docs.welcome_packet && renderWelcomePacket(docs.welcome_packet)}
          {docs.proposal && renderProposal(docs.proposal)}
          {docs.contract && renderContract(docs.contract)}
        </div>
      )}

      {/* Create First Project */}
      <h3 className="portal-onboarding-docs-title"><FolderKanban size={18} /> Create Your First Project</h3>
      {clientProjects.length > 0 ? (
        <div className="portal-onboarding-doc-card">
          <div className="portal-onboarding-doc-done">
            <CheckCircle size={24} />
            <p>Project created! You can manage it from your portal dashboard.</p>
          </div>
          <div style={{ marginTop: '12px' }}>
            {clientProjects.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', marginBottom: '6px' }}>
                <FolderKanban size={16} style={{ color: 'var(--emerald)' }} />
                <strong style={{ fontSize: '0.9rem' }}>{p.title}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', textTransform: 'capitalize' }}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="portal-onboarding-doc-card">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Set up your first project so your team can start tracking progress.
          </p>
          <div className="portal-onboarding-project-form">
            <input
              type="text"
              placeholder="Project title (e.g. Website Redesign)"
              value={projectForm.title}
              onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
            />
            <input
              type="text"
              placeholder="Brief description (optional)"
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
            />
            <button
              className="portal-onboarding-project-btn"
              onClick={handleCreateProject}
              disabled={!projectForm.title.trim()}
            >
              <Plus size={14} /> Create Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
