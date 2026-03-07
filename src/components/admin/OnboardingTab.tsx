import { useState, useMemo } from 'react';
import {
  ClipboardCheck, User, Mail, Phone, Building2, MapPin,
  Check, Circle, ChevronRight, Copy, Eye, Send, Briefcase,
  Plus, SkipForward, CheckCircle, FileText, Shield, Star, Edit3,
  ArrowRight, Clock, Hash, Download, Upload, CheckSquare, X,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { syncToApi } from '../../api/apiSync';
import { clientsApi } from '../../api/clients';
import { emailTemplatesApi } from '../../api/emailTemplates';
import { generateId, safeGetItem, safeSetItem } from '../../constants';
import { generateAllOnboardingPdfs, generateContractPdf, generateProposalPdf, generateIntakePdf } from '../../utils/generateOnboardingPdfs';

const STEPS = [
  { id: 'profile', label: 'Complete Profile', description: 'Business name, phone, and address' },
  { id: 'tier', label: 'Assign Tier', description: 'Select a service tier' },
  { id: 'portal', label: 'Portal Access', description: 'Set a temporary password' },
  { id: 'welcome', label: 'Send Welcome Email', description: 'Preview and mark sent' },
  { id: 'documents', label: 'Generate & Review Documents', description: 'Create onboarding PDFs and review uploads' },
  { id: 'project', label: 'Create First Project', description: 'Set up initial project' },
];

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  pipeline: { label: 'Pipeline', color: '#3b82f6' },
  'self-registration': { label: 'Self-Reg', color: '#22c55e' },
  manual: { label: 'Manual', color: '#6b7280' },
  appointment: { label: 'Appointment', color: '#8b5cf6' },
};

const DOC_LABELS: Record<string, string> = {
  intake: 'Intake Questionnaire',
  contract: 'Service Contract',
  proposal: 'Service Proposal',
  welcome_packet: 'Welcome Packet',
};

const DOC_STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: '#f3f4f6', color: '#6b7280', label: 'Pending' },
  generated: { bg: '#dbeafe', color: '#2563eb', label: 'Generated' },
  downloaded: { bg: '#e0e7ff', color: '#4f46e5', label: 'Downloaded' },
  uploaded: { bg: '#fef3c7', color: '#d97706', label: 'Under Review' },
  approved: { bg: '#dcfce7', color: '#16a34a', label: 'Approved' },
};

const INTAKE_SECTIONS = [
  {
    title: 'Business Overview',
    fields: [
      { key: 'industry', label: 'Industry' },
      { key: 'sub_industry', label: 'Sub-Industry' },
      { key: 'years_in_operation', label: 'Years in Operation' },
      { key: 'employee_count_range', label: 'Employee Count' },
      { key: 'annual_revenue_range', label: 'Annual Revenue' },
      { key: 'target_market', label: 'Target Market' },
      { key: 'business_model', label: 'Business Model' },
    ],
  },
  {
    title: 'Digital Presence',
    fields: [
      { key: 'current_website_url', label: 'Website URL' },
      { key: 'hosting_provider', label: 'Hosting Provider' },
      { key: 'tech_stack', label: 'Tech Stack' },
      { key: 'domain_age_years', label: 'Domain Age (Years)' },
      { key: 'has_ssl', label: 'Has SSL', type: 'toggle' },
      { key: 'is_mobile_responsive', label: 'Mobile Responsive', type: 'toggle' },
      { key: 'last_website_update', label: 'Last Website Update' },
    ],
  },
  {
    title: 'Marketing',
    fields: [
      { key: 'social_platforms', label: 'Social Platforms' },
      { key: 'email_marketing_tool', label: 'Email Marketing Tool' },
      { key: 'paid_advertising', label: 'Paid Advertising' },
      { key: 'content_marketing', label: 'Content Marketing' },
      { key: 'seo_efforts', label: 'SEO Efforts' },
    ],
  },
  {
    title: 'Pain Points & Goals',
    fields: [
      { key: 'pain_points', label: 'Pain Points' },
      { key: 'goals', label: 'Goals' },
      { key: 'budget_range', label: 'Budget Range' },
      { key: 'timeline_expectations', label: 'Timeline' },
    ],
  },
  {
    title: 'Additional Notes',
    fields: [
      { key: 'notes', label: 'Notes' },
    ],
  },
];

export default function OnboardingTab() {
  const {
    clients, updateClient, addProject, changeClientPassword, addClientDocument,
    completeOnboarding, updateClientOnboarding,
    emailTemplates, addNotification, logActivity, currentUser,
    prospects, SUBSCRIPTION_TIERS,
  } = useAppContext();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Profile form state
  const [profileForm, setProfileForm] = useState({ email: '', businessName: '', phone: '', street: '', city: '', state: '', zip: '' });
  const [profileEditing, setProfileEditing] = useState(false);

  // Tier state
  const [tierValue, setTierValue] = useState('free');
  const [tierEditing, setTierEditing] = useState(false);

  // Password state
  const [tempPassword, setTempPassword] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Welcome email state
  const [showWelcomePreview, setShowWelcomePreview] = useState(false);
  const [sendingWelcome, setSendingWelcome] = useState(false);
  const [welcomeError, setWelcomeError] = useState('');

  // Project form state
  const [projectForm, setProjectForm] = useState({ title: '', description: '' });

  // Doc generation loading
  const [generating, setGenerating] = useState(false);

  // Document preview modal
  const [viewingDoc, setViewingDoc] = useState<any>(null);

  // Intake responses viewer
  const [viewingIntake, setViewingIntake] = useState(false);

  // Signature viewer
  const [viewingSignature, setViewingSignature] = useState<any>(null);

  // Queue derivation
  const onboardingQueue = useMemo(() => {
    let queue = clients.filter((c) => c.onboarding && !c.onboarding.complete && c.status !== 'archived');

    if (filter !== 'all') {
      queue = queue.filter((c) => {
        if (filter === 'pipeline') return c.sourceProspectId || c.source === 'pipeline';
        if (filter === 'self-registration') return c.source === 'self-registration';
        if (filter === 'manual') return c.source === 'manual';
        return true;
      });
    }

    queue.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'newest' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

    return queue;
  }, [clients, filter, sortOrder]);

  const completedThisWeek = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return clients.filter((c) => c.onboarding?.complete && c.onboarding.completedAt && new Date(c.onboarding.completedAt) > weekAgo).length;
  }, [clients]);

  const inProgressCount = useMemo(() =>
    onboardingQueue.filter((c) => c.onboarding?.startedAt).length,
  [onboardingQueue]);

  const selectedClient = useMemo(() =>
    clients.find((c) => c.id === selectedId),
  [clients, selectedId]);

  // Step completion checks
  const getStepStatus = (client: any) => {
    if (!client) return {};
    const hasProfile = !!(client.businessName && client.phone && (client.street || client.city));
    const hasTier = client.tier && client.tier !== 'free';
    const hasPassword = !!(client.hasPassword || client.password_hash || client.password);
    const welcomeSent = !!client.onboarding?.welcomeEmailSent;

    // Step 5: documents generated AND all approved
    const docs = client.onboarding?.documents;
    const docsGenerated = !!client.onboarding?.documentsGeneratedAt;
    const allApproved = docsGenerated && docs && Object.values(docs).every((d: any) => d.status === 'approved');
    const hasDocuments = allApproved;

    const hasProject = (client.projects || []).length > 0;

    return {
      profile: hasProfile,
      tier: hasTier,
      portal: hasPassword,
      welcome: welcomeSent,
      documents: hasDocuments,
      project: hasProject,
    };
  };

  const stepStatus = selectedClient ? getStepStatus(selectedClient) : {};
  const completedSteps = Object.values(stepStatus).filter(Boolean).length;
  const requiredComplete = stepStatus.profile && stepStatus.tier && stepStatus.portal && stepStatus.welcome && stepStatus.documents;

  // Prospect notes for pipeline conversions
  const sourceProspect = useMemo(() => {
    if (!selectedClient?.sourceProspectId) return null;
    return prospects.find((p) => p.id === selectedClient.sourceProspectId) || null;
  }, [selectedClient, prospects]);

  // Handlers
  const handleSelectClient = (client: any) => {
    setSelectedId(client.id);
    if (!client.onboarding?.startedAt) {
      updateClientOnboarding(client.id, { startedAt: new Date().toISOString() });
    } else if (client.onboarding) {
      // Sync existing local onboarding state to DB (may not have been pushed yet)
      syncToApi(() => clientsApi.update(client.id, { onboarding: client.onboarding }), 'syncOnboardingState');
    }
    setProfileForm({
      email: client.email || '',
      businessName: client.businessName || '',
      phone: client.phone || '',
      street: client.street || '',
      city: client.city || '',
      state: client.state || '',
      zip: client.zip || '',
    });
    setProfileEditing(false);
    setTierValue(client.tier || 'free');
    setTierEditing(false);
    setTempPassword('');
    setPasswordCopied(false);
    setShowWelcomePreview(false);
    setProjectForm({ title: '', description: '' });
  };

  const handleSaveProfile = () => {
    if (!selectedClient) return;
    const updates: Record<string, any> = {
      businessName: profileForm.businessName,
      phone: profileForm.phone,
      street: profileForm.street,
      city: profileForm.city,
      state: profileForm.state,
      zip: profileForm.zip,
      profileComplete: true,
    };
    if (profileForm.email && profileForm.email !== selectedClient.email) {
      updates.email = profileForm.email;
    }
    updateClient(selectedClient.id, updates);
    updateClientOnboarding(selectedClient.id, { profileSavedAt: new Date().toISOString() });
    setProfileEditing(false);
  };

  const handleSaveTier = () => {
    if (!selectedClient) return;
    updateClient(selectedClient.id, { tier: tierValue });
    updateClientOnboarding(selectedClient.id, { tierAssignedAt: new Date().toISOString(), tierAssigned: tierValue });
  };

  const handleGeneratePassword = async () => {
    if (!selectedClient) return;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setTempPassword(pwd);
    // Call API directly to ensure bcrypt hash is stored in DB
    try {
      await clientsApi.setPassword(selectedClient.id, pwd, true);
      changeClientPassword(selectedClient.id, pwd, true, true); // update local state only, API already called
      updateClientOnboarding(selectedClient.id, { passwordSetAt: new Date().toISOString() });
    } catch (err) {
      console.error('[Onboarding] Failed to set password via API:', err);
      // Fallback: still update local state, sync will retry
      changeClientPassword(selectedClient.id, pwd, true);
      updateClientOnboarding(selectedClient.id, { passwordSetAt: new Date().toISOString() });
      addNotification({ type: 'warning', title: 'Password may not be saved', message: 'API call failed — password might not work for login. Try setting it again.' });
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword).then(() => {
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    });
  };

  const handleSendWelcome = async () => {
    if (!selectedClient) return;
    setSendingWelcome(true);
    setWelcomeError('');
    let skipped = false;
    try {
      const template = welcomeTemplate;
      const result = await emailTemplatesApi.sendWelcome(selectedClient.id, {
        customSubject: template?.subject?.replace(/{clientName}/g, selectedClient.name) || undefined,
        customBody: template?.body?.replace(/{clientName}/g, selectedClient.name) || undefined,
        tempPassword: tempPassword || undefined,
      });
      skipped = result.skipped;
    } catch (err: any) {
      // If server is down or route not found, fall back to marking locally
      const status = err.response?.status;
      if (status === 401 || status === 404 || !err.response) {
        skipped = true;
      } else {
        const msg = err.response?.data?.error || err.message || 'Failed to send email';
        setWelcomeError(msg);
        addNotification({ type: 'error', title: 'Email Failed', message: msg });
        setSendingWelcome(false);
        return;
      }
    }
    updateClientOnboarding(selectedClient.id, { welcomeEmailSent: true, welcomeEmailSentAt: new Date().toISOString() });
    logActivity('welcome_email_sent', { clientId: selectedClient.id, clientName: selectedClient.name });
    if (skipped) {
      addNotification({ type: 'info', title: 'Welcome Email Marked', message: `Marked as sent (email not configured — will deliver once email provider is set up)` });
    } else {
      addNotification({ type: 'success', title: 'Welcome Email Sent', message: `Welcome email sent to ${selectedClient.email}` });
    }
    setShowWelcomePreview(false);
    setSendingWelcome(false);
  };

  // Step 5: Generate Documents
  const handleGenerateDocuments = async () => {
    if (!selectedClient) return;
    setGenerating(true);
    const id = selectedClient.id;

    try {
      // Read intake data + tier data
      const intakes = safeGetItem('threeseas_bi_intakes', {});
      const intakeData = intakes[id] || {};
      const tierData = SUBSCRIPTION_TIERS[selectedClient.tier] || SUBSCRIPTION_TIERS.free;

      // Generate all 4 PDFs
      const pdfs = await generateAllOnboardingPdfs(selectedClient, tierData, intakeData);

      // Check for pre-existing proposal from pipeline
      const existingProposal = (selectedClient.documents || []).find((d: any) => d.type === 'proposal');

      // Attach each as a client document and track IDs
      const docUpdates: Record<string, any> = {};
      for (const [key, pdfData] of Object.entries(pdfs) as [string, any][]) {
        // Skip proposal generation if one already exists from pipeline
        if (key === 'proposal' && existingProposal) {
          docUpdates[key] = {
            status: 'generated',
            generatedDocId: existingProposal.id,
            uploadedDocId: null,
            generatedAt: existingProposal.uploadedAt || new Date().toISOString(),
            downloadedAt: null, uploadedAt: null,
            reviewedAt: null, reviewedBy: null, adminNotes: '',
          };
          continue;
        }

        const result = addClientDocument(id, {
          name: pdfData.name,
          type: pdfData.type,
          description: pdfData.description,
          fileData: pdfData.fileData,
          fileType: pdfData.fileType,
          fileSize: pdfData.fileSize,
        });

        docUpdates[key] = {
          status: 'generated',
          generatedDocId: result.document.id,
          uploadedDocId: null,
          generatedAt: new Date().toISOString(),
          downloadedAt: null, uploadedAt: null,
          reviewedAt: null, reviewedBy: null, adminNotes: '',
        };
      }

      // Update onboarding with doc references
      updateClientOnboarding(id, {
        documents: docUpdates,
        documentsGeneratedAt: new Date().toISOString(),
        documentsGeneratedBy: currentUser?.name || 'Admin',
      });

      // Also run BI scaffolding (preserve old behavior)
      _initBiTemplates(id);

      addNotification({ type: 'success', title: 'Documents Generated', message: `4 onboarding documents created for ${selectedClient.name}` });
      logActivity('onboarding_docs_generated', { clientId: id, clientName: selectedClient.name });
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Generation Failed', message: `Failed to generate documents: ${e.message}` });
    } finally {
      setGenerating(false);
    }
  };

  // BI template scaffolding (extracted from old handleInitBi)
  const _initBiTemplates = (id: string) => {
    try {
      const intakes = safeGetItem('threeseas_bi_intakes', {});
      if (!intakes[id]) {
        intakes[id] = {
          id: generateId(),
          industry: '', sub_industry: '', years_in_operation: '', employee_count_range: '',
          annual_revenue_range: '', target_market: '', business_model: '',
          current_website_url: '', hosting_provider: '', tech_stack: '', domain_age_years: '',
          has_ssl: false, is_mobile_responsive: false, last_website_update: '',
          social_platforms: [], email_marketing_tool: '', paid_advertising: '',
          content_marketing: '', seo_efforts: '',
          pain_points: '', goals: '', budget_range: '', timeline_expectations: '',
          notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        safeSetItem('threeseas_bi_intakes', JSON.stringify(intakes));
      }

      const financials = safeGetItem('threeseas_bi_client_financials', {});
      if (!financials[id]) {
        financials[id] = { clientId: id, entries: [], createdAt: new Date().toISOString() };
        safeSetItem('threeseas_bi_client_financials', JSON.stringify(financials));
      }

      const targets = safeGetItem('threeseas_bi_growth_targets', []);
      const hasTargets = targets.some((t: any) => t.clientId === id);
      if (!hasTargets) {
        const now = new Date().toISOString();
        const defaultMetrics = [
          { name: 'Website Traffic', unit: 'visitors/mo', baseline: 0, current: 0, target: 500, status: 'active' },
          { name: 'Conversion Rate', unit: '%', baseline: 0, current: 0, target: 3, status: 'active' },
          { name: 'Monthly Revenue', unit: '$', baseline: 0, current: 0, target: 5000, status: 'active' },
          { name: 'Social Media Followers', unit: 'followers', baseline: 0, current: 0, target: 500, status: 'active' },
        ];
        const newTargets = defaultMetrics.map((m) => ({
          id: generateId(), clientId: id, ...m, createdAt: now,
        }));
        safeSetItem('threeseas_bi_growth_targets', JSON.stringify([...targets, ...newTargets]));
      }
    } catch (_e) {
      // BI scaffold is non-critical
    }
  };

  // Persist a signed onboarding doc as a proper client_document (R2 + DB)
  const persistSignedDoc = async (docKey: string, docEntry: any) => {
    if (!selectedClient) return;
    const clientId = selectedClient.id;
    const tierData = SUBSCRIPTION_TIERS[selectedClient.tier] || SUBSCRIPTION_TIERS.free;
    const intakes = safeGetItem('threeseas_bi_intakes', {});
    const intakeData = intakes[clientId] || {};

    let pdfData = null;
    try {
      if (docEntry.signedPdfData) {
        // Already have the signed PDF inline — use it directly
        const label = DOC_LABELS[docKey] || docKey;
        pdfData = {
          name: `${label.replace(/\s+/g, '_')}_Signed_${selectedClient.name.replace(/\s+/g, '_')}.pdf`,
          type: docKey,
          fileData: docEntry.signedPdfData,
          fileType: 'application/pdf',
          fileSize: Math.ceil((docEntry.signedPdfData.split(',')[1] || '').length * 0.75),
          description: `${label} — signed and approved`,
        };
      } else if (docEntry.signatureData) {
        // Regenerate the signed PDF from signature data
        const sigOpts = { signatureData: docEntry.signatureData, signedAt: docEntry.signedAt };
        if (docKey === 'contract') {
          pdfData = await generateContractPdf(selectedClient, tierData, sigOpts);
        } else if (docKey === 'proposal') {
          pdfData = await generateProposalPdf(selectedClient, tierData, intakeData, {}, sigOpts);
        }
      }
    } catch (err: any) {
      console.error(`[OnboardingTab] Failed to generate signed ${docKey} PDF:`, err);
    }

    if (pdfData) {
      pdfData.description = `${DOC_LABELS[docKey] || docKey} — signed and approved`;
      const result = addClientDocument(clientId, pdfData);
      return result?.document?.id;
    }
    return null;
  };

  // Approve individual doc
  const handleApproveDocument = async (docKey: string) => {
    if (!selectedClient) return;
    const docs = { ...(selectedClient.onboarding?.documents || {}) };
    const now = new Date().toISOString();
    docs[docKey] = {
      ...docs[docKey],
      status: 'approved',
      reviewedAt: now,
      reviewedBy: currentUser?.name || 'Admin',
    };

    // Persist signed version as a downloadable client_document
    const signedDocId = await persistSignedDoc(docKey, docs[docKey]);
    if (signedDocId) docs[docKey].approvedDocId = signedDocId;

    updateClientOnboarding(selectedClient.id, { documents: docs });
    addNotification({ type: 'success', title: 'Document Approved', message: `${DOC_LABELS[docKey]} approved for ${selectedClient.name}` });
  };

  // Approve all uploaded docs
  const handleApproveAllDocuments = async () => {
    if (!selectedClient) return;
    const docs = { ...(selectedClient.onboarding?.documents || {}) };
    const now = new Date().toISOString();
    for (const key of Object.keys(docs)) {
      if (docs[key].status === 'uploaded') {
        docs[key] = { ...docs[key], status: 'approved', reviewedAt: now, reviewedBy: currentUser?.name || 'Admin' };
        const signedDocId = await persistSignedDoc(key, docs[key]);
        if (signedDocId) docs[key].approvedDocId = signedDocId;
      }
    }
    updateClientOnboarding(selectedClient.id, { documents: docs });
    addNotification({ type: 'success', title: 'All Documents Approved', message: `All uploaded documents approved for ${selectedClient.name}` });
  };

  const handleCreateProject = () => {
    if (!selectedClient || !projectForm.title.trim()) return;
    addProject(selectedClient.id, {
      title: projectForm.title.trim(),
      description: projectForm.description.trim(),
      status: 'planning',
    });
    setProjectForm({ title: '', description: '' });
  };

  const handleComplete = () => {
    if (!selectedClient) return;
    completeOnboarding(selectedClient.id);
    setSelectedId(null);
  };

  const handleSkip = () => {
    if (!selectedClient) return;
    if (!window.confirm(`Skip onboarding for ${selectedClient.name}? They can still be set up later via the Clients tab.`)) return;
    completeOnboarding(selectedClient.id);
    setSelectedId(null);
  };

  const getProgressForClient = (client: any) => {
    const s = getStepStatus(client);
    return Object.values(s).filter(Boolean).length;
  };

  const welcomeTemplate = emailTemplates.find((t) => t.id === 'welcome');

  const getSourceInfo = (client: any) => {
    if (client.sourceProspectId || client.source === 'pipeline') return SOURCE_LABELS.pipeline;
    return SOURCE_LABELS[client.source] || SOURCE_LABELS.manual;
  };

  // Document status helpers
  const docsGenerated = !!selectedClient?.onboarding?.documentsGeneratedAt;
  const onbDocs = selectedClient?.onboarding?.documents || {};
  const allUploaded = docsGenerated && Object.values(onbDocs).every((d: any) => d.status === 'uploaded' || d.status === 'approved');
  const allApproved = docsGenerated && Object.values(onbDocs).every((d: any) => d.status === 'approved');

  return (
    <div className="onboarding-tab">
      {/* Stats Row */}
      <div className="onboarding-stats">
        <div className="onboarding-stat">
          <Hash size={16} />
          <div>
            <span className="onboarding-stat-value">{onboardingQueue.length}</span>
            <span className="onboarding-stat-label">Pending</span>
          </div>
        </div>
        <div className="onboarding-stat">
          <Clock size={16} />
          <div>
            <span className="onboarding-stat-value">{inProgressCount}</span>
            <span className="onboarding-stat-label">In Progress</span>
          </div>
        </div>
        <div className="onboarding-stat">
          <CheckCircle size={16} />
          <div>
            <span className="onboarding-stat-value">{completedThisWeek}</span>
            <span className="onboarding-stat-label">This Week</span>
          </div>
        </div>
      </div>

      <div className="onboarding-layout">
        {/* Left Panel — Queue */}
        <div className="onboarding-queue">
          <div className="onboarding-queue-header">
            <h3>Onboarding Queue</h3>
            <div className="onboarding-filters">
              {['all', 'pipeline', 'self-registration', 'manual'].map((f) => (
                <button
                  key={f}
                  className={`onboarding-filter-pill ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'self-registration' ? 'Self-Reg' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <select className="onboarding-sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {onboardingQueue.length === 0 ? (
            <div className="onboarding-empty">
              <ClipboardCheck size={40} />
              <p>No clients awaiting onboarding</p>
            </div>
          ) : (
            <div className="onboarding-list">
              {onboardingQueue.map((client) => {
                const progress = getProgressForClient(client);
                const source = getSourceInfo(client);
                return (
                  <button
                    key={client.id}
                    className={`onboarding-card ${selectedId === client.id ? 'active' : ''}`}
                    onClick={() => handleSelectClient(client)}
                  >
                    <div className="onboarding-card-top">
                      <div className="onboarding-card-avatar">
                        {client.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="onboarding-card-info">
                        <span className="onboarding-card-name">{client.name}</span>
                        <span className="onboarding-card-email">{client.email}</span>
                      </div>
                      <ChevronRight size={16} className="onboarding-card-arrow" />
                    </div>
                    <div className="onboarding-card-bottom">
                      <span className="onboarding-source-badge" style={{ background: source.color + '20', color: source.color, borderColor: source.color }}>
                        {source.label}
                      </span>
                      <div className="onboarding-progress-mini">
                        <div className="onboarding-progress-bar">
                          <div className="onboarding-progress-fill" style={{ width: `${(progress / 6) * 100}%` }} />
                        </div>
                        <span className="onboarding-progress-text">{progress}/6</span>
                      </div>
                      <span className="onboarding-card-date">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel — Detail */}
        <div className="onboarding-detail">
          {!selectedClient ? (
            <div className="onboarding-empty">
              <ArrowRight size={40} />
              <p>Select a client from the queue to begin onboarding</p>
            </div>
          ) : (
            <>
              {/* Client Header */}
              <div className="onboarding-detail-header">
                <div className="onboarding-detail-avatar">
                  {selectedClient.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="onboarding-detail-info">
                  <h3>{selectedClient.name}</h3>
                  <span>{selectedClient.email}</span>
                  <span className="onboarding-source-badge" style={{
                    background: getSourceInfo(selectedClient).color + '20',
                    color: getSourceInfo(selectedClient).color,
                    borderColor: getSourceInfo(selectedClient).color,
                  }}>
                    {getSourceInfo(selectedClient).label}
                  </span>
                </div>
                <div className="onboarding-progress-ring">
                  <svg viewBox="0 0 36 36" className="onboarding-ring-svg">
                    <path
                      className="onboarding-ring-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="onboarding-ring-fill"
                      strokeDasharray={`${(completedSteps / 6) * 100}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.35" className="onboarding-ring-text">{completedSteps}/6</text>
                  </svg>
                </div>
              </div>

              {/* Checklist */}
              <div className="onboarding-checklist">
                {/* Step 1: Profile */}
                <div className={`onboarding-step ${stepStatus.profile ? 'complete' : ''}`}>
                  <div className="onboarding-step-header">
                    {stepStatus.profile ? <Check size={18} /> : <Circle size={18} />}
                    <div>
                      <span className="onboarding-step-label">1. Complete Profile</span>
                      <span className="onboarding-step-desc">Business name, phone, and address</span>
                    </div>
                    {stepStatus.profile && !profileEditing && (
                      <button className="btn btn-sm btn-outline" onClick={() => setProfileEditing(true)} style={{ marginLeft: 'auto' }}>
                        <Edit3 size={14} /> Edit
                      </button>
                    )}
                  </div>
                  {(!stepStatus.profile || profileEditing) && (
                    <div className="onboarding-step-body">
                      {!stepStatus.profile && !profileEditing ? (
                        <button className="btn btn-sm btn-outline" onClick={() => setProfileEditing(true)}>
                          <Building2 size={14} /> Fill Profile
                        </button>
                      ) : (
                        <div className="onboarding-form-grid">
                          <input type="email" placeholder="Email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} style={{ gridColumn: '1 / -1' }} />
                          <input placeholder="Business Name" value={profileForm.businessName} onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })} />
                          <input placeholder="Phone" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                          <input placeholder="Street" value={profileForm.street} onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })} />
                          <input placeholder="City" value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} />
                          <input placeholder="State" value={profileForm.state} onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })} />
                          <input placeholder="ZIP" value={profileForm.zip} onChange={(e) => setProfileForm({ ...profileForm, zip: e.target.value })} />
                          <div className="onboarding-form-actions">
                            <button className="btn btn-sm btn-primary" onClick={() => { handleSaveProfile(); }} disabled={!profileForm.businessName || !profileForm.phone}>
                              <Check size={14} /> Save
                            </button>
                            <button className="btn btn-sm btn-outline" onClick={() => setProfileEditing(false)}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 2: Tier */}
                <div className={`onboarding-step ${stepStatus.tier ? 'complete' : ''}`}>
                  <div className="onboarding-step-header">
                    {stepStatus.tier ? <Check size={18} /> : <Circle size={18} />}
                    <div>
                      <span className="onboarding-step-label">2. Assign Tier</span>
                      <span className="onboarding-step-desc">Current: {selectedClient.tier || 'free'}</span>
                    </div>
                    {stepStatus.tier && !tierEditing && (
                      <button className="btn btn-sm btn-outline" onClick={() => { setTierEditing(true); setTierValue(selectedClient.tier || 'free'); }} style={{ marginLeft: 'auto' }}>
                        <Edit3 size={14} /> Reassign
                      </button>
                    )}
                  </div>
                  {(!stepStatus.tier || tierEditing) && (
                    <div className="onboarding-step-body">
                      <div className="onboarding-tier-row">
                        <select value={tierValue} onChange={(e) => setTierValue(e.target.value)}>
                          <option value="free">Free</option>
                          <option value="starter">Starter</option>
                          <option value="business">Business</option>
                          <option value="premium">Premium</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                        <button className="btn btn-sm btn-primary" onClick={() => { handleSaveTier(); setTierEditing(false); }} disabled={tierValue === 'free'}>
                          <Star size={14} /> {stepStatus.tier ? 'Update' : 'Assign'}
                        </button>
                        {tierEditing && (
                          <button className="btn btn-sm btn-outline" onClick={() => setTierEditing(false)}>Cancel</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 3: Portal Access */}
                <div className={`onboarding-step ${stepStatus.portal ? 'complete' : ''}`}>
                  <div className="onboarding-step-header">
                    {stepStatus.portal ? <Check size={18} /> : <Circle size={18} />}
                    <div>
                      <span className="onboarding-step-label">3. Portal Access</span>
                      <span className="onboarding-step-desc">{stepStatus.portal ? 'Password set' : 'No password set'}</span>
                    </div>
                  </div>
                  <div className="onboarding-step-body">
                    {tempPassword ? (
                      <div className="onboarding-password-row">
                        <code className="onboarding-password">{tempPassword}</code>
                        <button className="btn btn-sm btn-outline" onClick={handleCopyPassword}>
                          <Copy size={14} /> {passwordCopied ? 'Copied!' : 'Copy'}
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={handleGeneratePassword}>
                          <Shield size={14} /> Regenerate
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-sm btn-outline" onClick={handleGeneratePassword}>
                        <Shield size={14} /> {stepStatus.portal ? 'Reset Password' : 'Generate Temp Password'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 4: Welcome Email */}
                <div className={`onboarding-step ${stepStatus.welcome ? 'complete' : ''}`}>
                  <div className="onboarding-step-header">
                    {stepStatus.welcome ? <Check size={18} /> : <Circle size={18} />}
                    <div>
                      <span className="onboarding-step-label">4. Send Welcome Email</span>
                      <span className="onboarding-step-desc">{stepStatus.welcome ? 'Sent' : 'Not sent'}</span>
                    </div>
                  </div>
                  <div className="onboarding-step-body">
                    {stepStatus.welcome && !showWelcomePreview && (
                      <button className="btn btn-sm btn-outline" onClick={() => { setShowWelcomePreview(true); setWelcomeError(''); }}>
                        <Send size={14} /> Resend
                      </button>
                    )}
                    {!stepStatus.welcome && !showWelcomePreview && (
                      <button className="btn btn-sm btn-outline" onClick={() => { setShowWelcomePreview(true); setWelcomeError(''); }}>
                        <Eye size={14} /> Preview & Send
                      </button>
                    )}
                    {showWelcomePreview && (
                      <div className="onboarding-welcome-preview">
                        <div className="onboarding-email-preview">
                          <strong>To:</strong> {selectedClient.email || <span style={{ color: '#ef4444' }}>No email set</span>}
                          <br />
                          <strong>Subject:</strong> {welcomeTemplate?.subject?.replace(/{clientName}/g, selectedClient.name) || 'Welcome to Three Seas Digital!'}
                          <hr />
                          <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                            {welcomeTemplate?.body?.replace(/{clientName}/g, selectedClient.name) || `Hi ${selectedClient.name},\n\nWelcome to Three Seas Digital! We're thrilled to have you on board. Your client account is ready and we've set up everything you need to get started.`}
                          </div>
                          <hr />
                          {tempPassword && (
                            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px 14px', marginBottom: '10px' }}>
                              <p style={{ fontSize: '0.8rem', color: '#92400e', margin: 0, fontWeight: 600 }}>
                                Temporary password will be included: <code style={{ background: '#fff', padding: '1px 6px', borderRadius: '3px' }}>{tempPassword}</code>
                              </p>
                              <p style={{ fontSize: '0.75rem', color: '#a16207', margin: '4px 0 0' }}>Client will be required to change it on first login.</p>
                            </div>
                          )}
                          {!tempPassword && stepStatus.portal && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 14px', marginBottom: '10px' }}>
                              <p style={{ fontSize: '0.8rem', color: '#991b1b', margin: 0 }}>
                                No temp password in this session. The email will note a password was set but won't include it. Generate a new one in Step 3 to include it.
                              </p>
                            </div>
                          )}
                          <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                            Sent as a branded HTML email with portal login link, onboarding checklist, and tier info.
                            Edit template text in the Email Templates tab.
                          </p>
                        </div>
                        {welcomeError && (
                          <div style={{ color: '#ef4444', fontSize: '0.85rem', margin: '8px 0' }}>{welcomeError}</div>
                        )}
                        <div className="onboarding-form-actions">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={handleSendWelcome}
                            disabled={sendingWelcome || !selectedClient.email}
                          >
                            {sendingWelcome ? (
                              <><span className="onboarding-spinner" /> Sending...</>
                            ) : (
                              <><Send size={14} /> {stepStatus.welcome ? 'Resend Welcome Email' : 'Send Welcome Email'}</>
                            )}
                          </button>
                          <button className="btn btn-sm btn-outline" onClick={() => setShowWelcomePreview(false)} disabled={sendingWelcome}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 5: Generate & Review Documents */}
                <div className={`onboarding-step ${stepStatus.documents ? 'complete' : ''}`}>
                  <div className="onboarding-step-header">
                    {stepStatus.documents ? <Check size={18} /> : <Circle size={18} />}
                    <div>
                      <span className="onboarding-step-label">5. Generate & Review Documents</span>
                      <span className="onboarding-step-desc">
                        {allApproved ? 'All documents approved' : docsGenerated ? 'Awaiting client uploads / review' : 'Generate onboarding PDFs'}
                      </span>
                    </div>
                  </div>
                  {(!stepStatus.documents || docsGenerated) && (
                    <div className="onboarding-step-body">
                      {!docsGenerated ? (
                        <button
                          className="btn btn-sm btn-primary onboarding-generate-btn"
                          onClick={handleGenerateDocuments}
                          disabled={generating}
                        >
                          {generating ? (
                            <><span className="onboarding-spinner" /> Generating...</>
                          ) : (
                            <><FileText size={14} /> Generate Documents</>
                          )}
                        </button>
                      ) : (
                        <div className="onboarding-doc-table-wrap">
                          <table className="onboarding-doc-table">
                            <thead>
                              <tr>
                                <th>Document</th>
                                <th>Generated</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(onbDocs).map(([key, doc]: [string, any]) => {
                                const statusInfo = DOC_STATUS_COLORS[doc.status] || DOC_STATUS_COLORS.pending;
                                const genDoc = (selectedClient.documents || []).find((d) => d.id === doc.generatedDocId);
                                const uploadDoc = doc.uploadedDocId ? (selectedClient.documents || []).find((d) => d.id === doc.uploadedDocId) : null;
                                return (
                                  <tr key={key}>
                                    <td className="onboarding-doc-name">
                                      <FileText size={14} />
                                      {DOC_LABELS[key]}
                                    </td>
                                    <td className="onboarding-doc-date">
                                      {doc.generatedAt ? new Date(doc.generatedAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td>
                                      <span
                                        className="onboarding-doc-status"
                                        style={{ background: statusInfo.bg, color: statusInfo.color }}
                                      >
                                        {statusInfo.label}
                                      </span>
                                    </td>
                                    <td className="onboarding-doc-actions">
                                      {key === 'intake' && (
                                        <button
                                          className="btn btn-sm btn-outline"
                                          onClick={() => setViewingIntake(true)}
                                          title="View intake questionnaire responses"
                                        >
                                          <ClipboardCheck size={14} /> Responses
                                        </button>
                                      )}
                                      {(key === 'contract' || key === 'proposal') && doc.signatureData && (
                                        <button
                                          className="btn btn-sm btn-outline"
                                          onClick={() => setViewingSignature({ key, doc })}
                                          title={`View ${DOC_LABELS[key]} signature`}
                                        >
                                          <Edit3 size={14} /> Signature
                                        </button>
                                      )}
                                      {(key === 'contract' || key === 'proposal') && !doc.signatureData && (doc.status === 'pending' || doc.status === 'generated') && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not signed</span>
                                      )}
                                      {genDoc?.fileData && (
                                        <button
                                          className="btn btn-sm btn-outline"
                                          onClick={() => setViewingDoc(genDoc)}
                                          title="View generated document"
                                        >
                                          <Eye size={14} /> View
                                        </button>
                                      )}
                                      {uploadDoc?.fileData && (
                                        <button
                                          className="btn btn-sm btn-outline"
                                          onClick={() => setViewingDoc(uploadDoc)}
                                          title="View uploaded version"
                                        >
                                          <Upload size={14} /> Uploaded
                                        </button>
                                      )}
                                      {doc.status === 'uploaded' && (
                                        <button
                                          className="btn btn-sm btn-primary"
                                          onClick={() => handleApproveDocument(key)}
                                        >
                                          <Check size={14} /> Approve
                                        </button>
                                      )}
                                      {doc.status === 'approved' && (
                                        <span className="onboarding-doc-approved-icon"><CheckCircle size={16} /></span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {allUploaded && !allApproved && (
                            <button className="btn btn-sm btn-primary" style={{ marginTop: 8 }} onClick={handleApproveAllDocuments}>
                              <CheckSquare size={14} /> Approve All
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 6: First Project */}
                <div className={`onboarding-step ${stepStatus.project ? 'complete' : ''}`}>
                  <div className="onboarding-step-header">
                    {stepStatus.project ? <Check size={18} /> : <Circle size={18} />}
                    <div>
                      <span className="onboarding-step-label">6. Create First Project</span>
                      <span className="onboarding-step-desc">{stepStatus.project ? `${(selectedClient.projects || []).length} project(s)` : 'No projects'}</span>
                    </div>
                  </div>
                  {!stepStatus.project && (
                    <div className="onboarding-step-body">
                      <div className="onboarding-form-grid">
                        <input placeholder="Project Title" value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} />
                        <input placeholder="Description (optional)" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
                        <div className="onboarding-form-actions">
                          <button className="btn btn-sm btn-primary" onClick={handleCreateProject} disabled={!projectForm.title.trim()}>
                            <Plus size={14} /> Create Project
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Transferred Notes & Documents */}
              {(selectedClient.notes?.length > 0 || selectedClient.documents?.length > 0) && (
                <div className="onboarding-transferred">
                  {selectedClient.notes?.length > 0 && (
                    <div className="onboarding-transferred-section">
                      <h4><FileText size={14} /> Transferred Notes ({selectedClient.notes.length})</h4>
                      <div className="onboarding-notes-list">
                        {selectedClient.notes.slice(0, 5).map((note) => (
                          <div key={note.id} className="onboarding-note">
                            <p>{note.text}</p>
                            <span className="onboarding-note-meta">{note.author} &middot; {new Date(note.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                        {selectedClient.notes.length > 5 && <p className="onboarding-more">+{selectedClient.notes.length - 5} more</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="onboarding-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleComplete}
                  disabled={!requiredComplete}
                  title={!requiredComplete ? 'Complete steps 1-5 first' : 'Mark onboarding as complete'}
                >
                  <CheckCircle size={16} /> Complete Onboarding
                </button>
                <button className="btn btn-outline btn-sm" onClick={handleSkip}>
                  <SkipForward size={14} /> Skip Onboarding
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Signature Viewer Modal */}
      {viewingSignature && (() => {
        const { key, doc } = viewingSignature;
        return (
          <div className="modal-overlay" onClick={() => setViewingSignature(null)}>
            <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setViewingSignature(null)} aria-label="Close"><X size={20} /></button>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>
                  <Edit3 size={18} style={{ verticalAlign: '-3px', marginRight: '6px' }} />
                  {DOC_LABELS[key]} — Signature
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Signed By</span>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{doc.signedBy || selectedClient?.name || '—'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Date</span>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{doc.signedAt ? new Date(doc.signedAt).toLocaleDateString() : '—'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Status</span>
                    <div>
                      <span
                        className="onboarding-doc-status"
                        style={{ background: (DOC_STATUS_COLORS[doc.status] || DOC_STATUS_COLORS.pending).bg, color: (DOC_STATUS_COLORS[doc.status] || DOC_STATUS_COLORS.pending).color }}
                      >
                        {(DOC_STATUS_COLORS[doc.status] || DOC_STATUS_COLORS.pending).label}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}>
                  {doc.signatureData?.startsWith('data:') ? (
                    <img src={doc.signatureData} alt="Signature" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                  ) : (
                    <div style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive", fontSize: '2rem', color: '#1a1a2e', padding: '20px 0' }}>
                      {doc.signatureData}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Intake Responses Modal */}
      {viewingIntake && selectedClient && (() => {
        const intakes = safeGetItem('threeseas_bi_intakes', {});
        const data = intakes[selectedClient.id] || {};
        const hasData = Object.values(data).some(v => v && v !== '' && !(Array.isArray(v) && v.length === 0));
        return (
          <div className="modal-overlay" onClick={() => setViewingIntake(false)}>
            <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setViewingIntake(false)} aria-label="Close"><X size={20} /></button>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>
                  <ClipboardCheck size={18} style={{ verticalAlign: '-3px', marginRight: '6px' }} />
                  Intake Responses — {selectedClient.name}
                </h3>
                {data.submittedAt && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                    Submitted {new Date(data.submittedAt).toLocaleDateString()} {data.submittedBy === 'client' ? '(by client)' : '(by admin)'}
                  </p>
                )}
              </div>
              {!hasData ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <ClipboardCheck size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>No intake responses yet.</p>
                  <p style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>The client hasn't submitted their questionnaire.</p>
                </div>
              ) : (
                INTAKE_SECTIONS.map((section) => {
                  const filled = section.fields.filter(f => {
                    const v = data[f.key];
                    return v && v !== '' && !(Array.isArray(v) && v.length === 0);
                  });
                  if (filled.length === 0) return null;
                  return (
                    <div key={section.title} style={{ marginBottom: '20px' }}>
                      <h4 style={{
                        fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.05em', color: 'var(--emerald)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        paddingBottom: '6px', marginBottom: '10px',
                      }}>
                        {section.title}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                        {filled.map((field) => {
                          const val = data[field.key];
                          const display = field.type === 'toggle'
                            ? (val ? 'Yes' : 'No')
                            : Array.isArray(val)
                              ? val.join(', ')
                              : String(val);
                          const isLong = display.length > 60;
                          return (
                            <div key={field.key} style={isLong ? { gridColumn: '1 / -1' } : {}}>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '2px' }}>
                                {field.label}
                              </div>
                              <div style={{
                                fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5,
                                ...(field.type === 'toggle' ? {
                                  color: val ? '#22c55e' : '#ef4444',
                                  fontWeight: 500,
                                } : {}),
                              }}>
                                {display || '—'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* Document Preview Modal */}
      {viewingDoc && (
        <div className="modal-overlay" onClick={() => setViewingDoc(null)}>
          <div className="modal-content document-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setViewingDoc(null)} aria-label="Close"><X size={20} /></button>
            <div className="document-preview-header">
              <h3>{viewingDoc.name}</h3>
              {viewingDoc.type && (
                <span className="onboarding-doc-status" style={{
                  background: DOC_STATUS_COLORS.generated.bg,
                  color: DOC_STATUS_COLORS.generated.color,
                }}>
                  {DOC_LABELS[viewingDoc.type] || viewingDoc.type}
                </span>
              )}
            </div>
            {viewingDoc.description && <p className="document-preview-desc">{viewingDoc.description}</p>}
            <div className="document-preview-content">
              {viewingDoc.fileType?.startsWith('image/') ? (
                <img src={viewingDoc.fileData} alt={viewingDoc.name} />
              ) : viewingDoc.fileType === 'application/pdf' ? (
                <iframe src={viewingDoc.fileData} title={viewingDoc.name} />
              ) : (
                <div className="document-no-preview">
                  <FileText size={48} />
                  <p>Preview not available for this file type</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
