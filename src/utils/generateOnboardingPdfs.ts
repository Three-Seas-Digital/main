import { SITE_INFO } from '../constants';

type RGBTuple = [number, number, number];

interface PdfOutputDoc {
  name: string;
  type: string;
  fileData: string;
  fileType: string;
  fileSize: number;
  description: string;
}

interface SignatureOptions {
  signatureData?: string;
  signedAt?: string;
}

interface ProposalOptions {
  services?: string[];
  timeline?: string;
  customPrice?: string;
  discount?: string;
  discountType?: string;
  paymentTerms?: string;
  notes?: string;
}

let jsPDFModule: any = null;
async function getJsPDF(): Promise<any> {
  if (!jsPDFModule) jsPDFModule = (await import('jspdf')).jsPDF;
  return jsPDFModule;
}

/* ===== Shared Helpers ===== */

const BRAND_COLOR: RGBTuple = [15, 76, 117]; // #0f4c75
const GRAY: RGBTuple = [107, 114, 128];
const DARK: RGBTuple = [26, 26, 46];
const PAGE_WIDTH = 210;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function addHeader(doc: any, title: string): number {
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, PAGE_WIDTH, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(SITE_INFO.name || 'Three Seas Digital', MARGIN, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Premium Digital Solutions', MARGIN, 24);

  doc.setTextColor(...DARK);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN, 46);
  doc.setDrawColor(...BRAND_COLOR);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, 49, PAGE_WIDTH - MARGIN, 49);
  return 56;
}

function addFooter(doc: any, pageNum: number): void {
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, pageH - 16, PAGE_WIDTH - MARGIN, pageH - 16);
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${SITE_INFO.name || 'Three Seas Digital'} | Confidential`, MARGIN, pageH - 10);
  doc.text(`Page ${pageNum}`, PAGE_WIDTH - MARGIN, pageH - 10, { align: 'right' });
}

function addSection(doc: any, y: number, title: string): number {
  if (y > 260) {
    doc.addPage();
    addFooter(doc, doc.internal.getNumberOfPages());
    y = 20;
  }
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLOR);
  doc.text(title, MARGIN, y);
  doc.setLineWidth(0.3);
  doc.setDrawColor(...BRAND_COLOR);
  doc.line(MARGIN, y + 2, MARGIN + CONTENT_WIDTH, y + 2);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  return y + 8;
}

function addField(doc: any, y: number, label: string, value?: string): number {
  if (y > 270) {
    doc.addPage();
    addFooter(doc, doc.internal.getNumberOfPages());
    y = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(label, MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  const val = value || '[To be completed]';
  const lines = doc.splitTextToSize(val, CONTENT_WIDTH);
  doc.text(lines, MARGIN, y + 5);
  return y + 5 + lines.length * 5;
}

function addParagraph(doc: any, y: number, text: string): number {
  if (y > 270) {
    doc.addPage();
    addFooter(doc, doc.internal.getNumberOfPages());
    y = 20;
  }
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  doc.text(lines, MARGIN, y);
  return y + lines.length * 5 + 3;
}

function addSignatureToDoc(doc: any, y: number, signatureData: string, signerName: string, signedAt?: string): void {
  if (signatureData.startsWith('data:image')) {
    // Drawn signature — embed as image
    try {
      doc.addImage(signatureData, 'PNG', MARGIN, y - 4, 60, 16);
    } catch {
      // Fallback if image fails
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(12);
      doc.text('[Signed]', MARGIN, y + 6);
    }
  } else {
    // Typed signature
    doc.setFont('courier', 'bolditalic');
    doc.setFontSize(14);
    doc.setTextColor(...DARK);
    doc.text(signatureData, MARGIN, y + 8);
  }
  doc.setDrawColor(...GRAY);
  doc.line(MARGIN, y + 12, MARGIN + 70, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`${signerName} (Client)`, MARGIN, y + 18);

  // Date
  const dateStr = signedAt
    ? new Date(signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(dateStr, MARGIN + 90, y + 8);
  doc.line(MARGIN + 90, y + 12, MARGIN + CONTENT_WIDTH, y + 12);
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text('Date', MARGIN + 90, y + 18);
}

function toBase64Output(doc: any, name: string, type: string, description: string): PdfOutputDoc {
  const pdfData: string = doc.output('datauristring');
  // Strip jsPDF's filename param from data URI — it triggers browser download instead of display
  // Before: data:application/pdf;filename=generated.pdf;base64,JVBERi0...
  // After:  data:application/pdf;base64,JVBERi0...
  const cleanData = pdfData.replace(/;filename=[^;]+/, '');
  const base64 = cleanData.split(',')[1];
  const byteLength = Math.ceil(base64.length * 0.75);
  return {
    name,
    type,
    fileData: cleanData,
    fileType: 'application/pdf',
    fileSize: byteLength,
    description,
  };
}

/* ===== 1. Intake Questionnaire ===== */

export async function generateIntakePdf(client: Record<string, any>, intakeData: Record<string, any>): Promise<PdfOutputDoc> {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF();
  let y = addHeader(doc, 'Intake Questionnaire');

  // Client info
  y = addField(doc, y, 'Client', client.name);
  y = addField(doc, y, 'Email', client.email);
  if (client.businessName) y = addField(doc, y, 'Business', client.businessName);
  y += 4;

  // Business Overview
  y = addSection(doc, y, 'Business Overview');
  y = addField(doc, y, 'Industry', intakeData?.industry);
  y = addField(doc, y, 'Sub-Industry', intakeData?.sub_industry);
  y = addField(doc, y, 'Years in Operation', intakeData?.years_in_operation);
  y = addField(doc, y, 'Employee Count', intakeData?.employee_count_range);
  y = addField(doc, y, 'Annual Revenue Range', intakeData?.annual_revenue_range);
  y = addField(doc, y, 'Target Market', intakeData?.target_market);
  y = addField(doc, y, 'Business Model', intakeData?.business_model);
  y += 4;

  // Digital Presence
  y = addSection(doc, y, 'Digital Presence');
  y = addField(doc, y, 'Current Website URL', intakeData?.current_website_url);
  y = addField(doc, y, 'Hosting Provider', intakeData?.hosting_provider);
  y = addField(doc, y, 'Tech Stack', intakeData?.tech_stack);
  y = addField(doc, y, 'Domain Age (Years)', intakeData?.domain_age_years);
  y = addField(doc, y, 'Has SSL', intakeData?.has_ssl === true ? 'Yes' : intakeData?.has_ssl === false ? 'No' : undefined);
  y = addField(doc, y, 'Mobile Responsive', intakeData?.is_mobile_responsive === true ? 'Yes' : intakeData?.is_mobile_responsive === false ? 'No' : undefined);
  y = addField(doc, y, 'Last Website Update', intakeData?.last_website_update);
  y += 4;

  // Marketing
  y = addSection(doc, y, 'Marketing');
  y = addField(doc, y, 'Social Platforms', Array.isArray(intakeData?.social_platforms) ? intakeData.social_platforms.join(', ') : intakeData?.social_platforms);
  y = addField(doc, y, 'Email Marketing Tool', intakeData?.email_marketing_tool);
  y = addField(doc, y, 'Paid Advertising', intakeData?.paid_advertising);
  y = addField(doc, y, 'Content Marketing', intakeData?.content_marketing);
  y = addField(doc, y, 'SEO Efforts', intakeData?.seo_efforts);
  y += 4;

  // Pain Points & Goals
  y = addSection(doc, y, 'Pain Points & Goals');
  y = addField(doc, y, 'Pain Points', intakeData?.pain_points);
  y = addField(doc, y, 'Goals', intakeData?.goals);
  y = addField(doc, y, 'Budget Range', intakeData?.budget_range);
  y = addField(doc, y, 'Timeline Expectations', intakeData?.timeline_expectations);
  y += 4;

  // Notes
  y = addSection(doc, y, 'Additional Notes');
  y = addField(doc, y, 'Notes', intakeData?.notes);

  addFooter(doc, 1);
  for (let i = 2; i <= doc.internal.getNumberOfPages(); i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }

  return toBase64Output(doc, `Intake_Questionnaire_${client.name.replace(/\s+/g, '_')}.pdf`, 'intake', 'Business intake questionnaire — please review and complete all blank fields.');
}

/* ===== 2. Service Contract ===== */

export async function generateContractPdf(
  client: Record<string, any>,
  tierData: Record<string, any>,
  { signatureData, signedAt }: SignatureOptions = {}
): Promise<PdfOutputDoc> {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF();
  let y = addHeader(doc, 'Service Contract');
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  y = addSection(doc, y, 'Parties');
  y = addParagraph(doc, y, `This Service Contract ("Agreement") is entered into as of ${today} between:`);
  y = addField(doc, y, 'Provider', SITE_INFO.name || 'Three Seas Digital');
  y = addField(doc, y, 'Client', client.name + (client.businessName ? ` (${client.businessName})` : ''));
  y = addField(doc, y, 'Email', client.email);
  y += 4;

  y = addSection(doc, y, 'Service Tier');
  y = addField(doc, y, 'Selected Tier', tierData?.label || 'N/A');
  y = addField(doc, y, 'Description', tierData?.description || 'N/A');
  y += 4;

  y = addSection(doc, y, 'Terms');
  y = addField(doc, y, 'Effective Date', today);
  y = addField(doc, y, 'Term', 'Month-to-month, renewable automatically');
  y = addField(doc, y, 'Payment Terms', 'Net 15 — invoices due within 15 days of issue');
  y += 4;

  y = addSection(doc, y, 'Scope of Services');
  y = addParagraph(doc, y, 'Provider agrees to deliver digital marketing, web development, and consulting services as outlined in the associated Proposal document, subject to the selected Service Tier.');
  y = addParagraph(doc, y, 'Any additional services beyond the agreed scope will be quoted separately and require written approval.');
  y += 4;

  y = addSection(doc, y, 'Confidentiality');
  y = addParagraph(doc, y, 'Both parties agree to keep confidential any proprietary information shared during the engagement. This obligation survives termination of this Agreement.');
  y += 4;

  y = addSection(doc, y, 'Limitation of Liability');
  y = addParagraph(doc, y, 'Provider liability shall not exceed the total fees paid by Client in the twelve (12) months preceding the claim. Neither party shall be liable for indirect, incidental, or consequential damages.');
  y += 4;

  y = addSection(doc, y, 'Termination');
  y = addParagraph(doc, y, 'Either party may terminate this Agreement with 30 days written notice. Upon termination, Client shall pay for all services rendered through the termination date.');
  y += 8;

  // Signature lines
  y = addSection(doc, y, 'Signatures');
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);

  // Client signature
  if (signatureData) {
    addSignatureToDoc(doc, y, signatureData, client.name, signedAt);
  } else {
    doc.line(MARGIN, y + 10, MARGIN + 70, y + 10);
    doc.text('Client Signature', MARGIN, y + 16);
    doc.line(MARGIN + 90, y + 10, MARGIN + CONTENT_WIDTH, y + 10);
    doc.text('Date', MARGIN + 90, y + 16);
  }

  y += 26;
  doc.line(MARGIN, y + 10, MARGIN + 70, y + 10);
  doc.text(`${SITE_INFO.name || 'Three Seas Digital'} Representative`, MARGIN, y + 16);
  doc.line(MARGIN + 90, y + 10, MARGIN + CONTENT_WIDTH, y + 10);
  doc.text('Date', MARGIN + 90, y + 16);

  addFooter(doc, 1);
  for (let i = 2; i <= doc.internal.getNumberOfPages(); i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }

  return toBase64Output(doc, `Service_Contract_${client.name.replace(/\s+/g, '_')}.pdf`, 'contract', 'Service contract — signed and executed.');
}

/* ===== 3. Service Proposal ===== */

export async function generateProposalPdf(
  client: Record<string, any>,
  tierData: Record<string, any>,
  intakeData: Record<string, any>,
  proposalOptions: ProposalOptions = {},
  { signatureData, signedAt }: SignatureOptions = {}
): Promise<PdfOutputDoc> {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF();
  let y = addHeader(doc, 'Service Proposal');
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  y = addField(doc, y, 'Prepared For', client.name + (client.businessName ? ` — ${client.businessName}` : ''));
  y = addField(doc, y, 'Date', today);
  y += 4;

  // Executive Summary
  y = addSection(doc, y, 'Executive Summary');
  const painPoints = intakeData?.pain_points || '[Client pain points to be identified during intake]';
  const goals = intakeData?.goals || '[Client goals to be identified during intake]';
  y = addParagraph(doc, y, `Based on our assessment, we have identified the following challenges: ${painPoints}`);
  y = addParagraph(doc, y, `Our goal is to help you achieve: ${goals}`);
  y += 4;

  // Proposed Services
  y = addSection(doc, y, 'Proposed Services');
  y = addField(doc, y, 'Service Tier', tierData?.label || 'To be determined');
  y = addField(doc, y, 'Tier Description', tierData?.description || 'N/A');
  y += 2;

  const services = (Array.isArray(proposalOptions.services) && proposalOptions.services.length > 0)
    ? proposalOptions.services
    : [
      'Website design and development',
      'Search engine optimization (SEO)',
      'Content strategy and creation',
      'Social media management',
      'Analytics and reporting',
      'Ongoing maintenance and support',
    ];
  y = addParagraph(doc, y, 'Services included in this engagement:');
  services.forEach((svc) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(`  \u2022  ${svc}`, MARGIN, y);
    y += 5;
  });
  y += 4;

  // Timeline
  y = addSection(doc, y, 'Timeline');
  if (proposalOptions.timeline) {
    y = addField(doc, y, 'Estimated Timeline', proposalOptions.timeline);
  } else {
    y = addParagraph(doc, y, 'Phase 1: Discovery & Strategy (Week 1-2) — Intake review, competitor analysis, strategic planning');
    y = addParagraph(doc, y, 'Phase 2: Design & Development (Week 3-6) — Wireframes, mockups, development, content creation');
    y = addParagraph(doc, y, 'Phase 3: Testing & Launch (Week 7-8) — QA testing, client review, deployment');
    y = addParagraph(doc, y, 'Phase 4: Ongoing Optimization — Monthly reporting, SEO updates, content refreshes');
  }
  y += 4;

  // Investment
  y = addSection(doc, y, 'Investment');
  const PAYMENT_TERMS_MAP: Record<string, string> = {
    'net15': 'Net 15 — invoices due within 15 days of issue',
    'net30': 'Net 30 — invoices due within 30 days of issue',
    'net45': 'Net 45 — invoices due within 45 days of issue',
    'due-on-receipt': 'Due on receipt',
  };
  if (proposalOptions.customPrice) {
    const price = parseFloat(proposalOptions.customPrice);
    if (proposalOptions.discount && parseFloat(proposalOptions.discount) > 0) {
      const discountVal = parseFloat(proposalOptions.discount);
      const discountType = proposalOptions.discountType || 'percent';
      const discountAmt = discountType === 'percent' ? price * (discountVal / 100) : discountVal;
      const finalPrice = Math.max(0, price - discountAmt);
      y = addField(doc, y, 'Project Investment', `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      y = addField(doc, y, 'Discount', discountType === 'percent'
        ? `${discountVal}% (-$${discountAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
        : `-$${discountVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      y = addField(doc, y, 'Total', `$${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    } else {
      y = addField(doc, y, 'Project Investment', `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    }
  } else {
    y = addParagraph(doc, y, 'Pricing will be based on the selected service tier and scope of work. Detailed pricing is available upon request and will be included in the final contract.');
  }
  y = addField(doc, y, 'Payment Terms', PAYMENT_TERMS_MAP[proposalOptions.paymentTerms || 'net15'] || PAYMENT_TERMS_MAP['net15']);
  y += 4;

  // Additional Notes (if provided)
  if (proposalOptions.notes && proposalOptions.notes.trim()) {
    y = addSection(doc, y, 'Additional Notes');
    y = addParagraph(doc, y, proposalOptions.notes.trim());
    y += 4;
  }

  // Next Steps
  y = addSection(doc, y, 'Next Steps');
  y = addParagraph(doc, y, '1. Review this proposal and complete the Intake Questionnaire');
  y = addParagraph(doc, y, '2. Schedule a strategy call to discuss your goals');
  y = addParagraph(doc, y, '3. Sign the Service Contract to begin the engagement');
  y = addParagraph(doc, y, '4. Access your Client Portal for project tracking and communication');

  // Signature (if signed)
  if (signatureData) {
    y += 4;
    y = addSection(doc, y, 'Acceptance');
    y += 6;
    addSignatureToDoc(doc, y, signatureData, client.name, signedAt);
    y += 26;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.line(MARGIN, y + 10, MARGIN + 70, y + 10);
    doc.text(`${SITE_INFO.name || 'Three Seas Digital'} Representative`, MARGIN, y + 16);
    doc.line(MARGIN + 90, y + 10, MARGIN + CONTENT_WIDTH, y + 10);
    doc.text('Date', MARGIN + 90, y + 16);
  }

  addFooter(doc, 1);
  for (let i = 2; i <= doc.internal.getNumberOfPages(); i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }

  const desc = signatureData ? 'Service proposal — signed and accepted.' : 'Service proposal — review our recommended plan for your business.';
  return toBase64Output(doc, `Service_Proposal_${client.name.replace(/\s+/g, '_')}.pdf`, 'proposal', desc);
}

/* ===== 4. Welcome Packet ===== */

export async function generateWelcomePacketPdf(client: Record<string, any>): Promise<PdfOutputDoc> {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF();
  let y = addHeader(doc, 'Welcome Packet');

  // Welcome
  y = addSection(doc, y, 'Welcome!');
  y = addParagraph(doc, y, `Dear ${client.name},`);
  y = addParagraph(doc, y, `Thank you for choosing ${SITE_INFO.name || 'Three Seas Digital'}! We are excited to partner with you on your digital journey. This packet contains everything you need to get started.`);
  y += 4;

  // About Us
  y = addSection(doc, y, 'About Us');
  y = addParagraph(doc, y, `${SITE_INFO.name || 'Three Seas Digital'} provides premium digital solutions including web design, development, SEO, content marketing, and business intelligence. We are committed to helping businesses grow through strategic digital services.`);
  y += 4;

  // Portal Access
  y = addSection(doc, y, 'Client Portal Access');
  y = addParagraph(doc, y, 'Your client portal is your hub for everything — project tracking, invoices, messages, and business insights.');
  y = addField(doc, y, 'Portal URL', `${window.location.origin}/services`);
  y = addField(doc, y, 'Login Email', client.email);
  y = addField(doc, y, 'Password', 'Use the temporary password provided by your account manager. You can change it in Settings after logging in.');
  y += 4;

  // Portal Features
  y = addSection(doc, y, 'Portal Features');
  const features = [
    'Dashboard — At-a-glance business health score and key metrics',
    'Business Scorecard — Detailed audit scores across 6 categories',
    'Growth Metrics — Track your KPIs with progress visualization',
    'Projects — Real-time progress on active projects and tasks',
    'Invoices — View, pay, and download invoices',
    'Recommendations — Strategic recommendations from your team',
    'Service Requests — Submit requests and track responses',
    'Messages — Communicate directly with your team',
    'Financial Reports — Revenue, expenses, and profitability views',
  ];
  features.forEach((feat) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.text(`  \u2022  ${feat}`, MARGIN, y);
    y += 5;
  });
  y += 4;

  // Getting Started
  y = addSection(doc, y, 'Getting Started Checklist');
  const steps = [
    'Log in to your Client Portal',
    'Complete the Intake Questionnaire (attached separately)',
    'Review and sign the Service Contract',
    'Review the Service Proposal',
    'Schedule your kickoff call with your account manager',
    'Provide access to existing digital assets (website login, analytics, social media)',
  ];
  steps.forEach((step, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.text(`  ${i + 1}. ${step}`, MARGIN, y);
    y += 6;
  });
  y += 4;

  // Contact
  y = addSection(doc, y, 'Contact Information');
  y = addField(doc, y, 'Email', SITE_INFO.email);
  if (SITE_INFO.phone) y = addField(doc, y, 'Phone', SITE_INFO.phone);
  y = addField(doc, y, 'Office Hours', 'Monday — Friday, 9:00 AM — 5:00 PM EST');
  y += 4;

  y = addParagraph(doc, y, 'We look forward to working with you!');

  addFooter(doc, 1);
  for (let i = 2; i <= doc.internal.getNumberOfPages(); i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }

  return toBase64Output(doc, `Welcome_Packet_${client.name.replace(/\s+/g, '_')}.pdf`, 'welcome_packet', 'Welcome packet — your guide to getting started with us.');
}

/* ===== 5. BI Discovery Questionnaire ===== */

export async function generateBiDiscoveryPdf(client: Record<string, any>, intakeData: Record<string, any>): Promise<PdfOutputDoc> {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF();
  let y = addHeader(doc, 'Business Intelligence Discovery Questionnaire');

  // Client info
  y = addField(doc, y, 'Client', client.name);
  y = addField(doc, y, 'Email', client.email);
  if (client.businessName) y = addField(doc, y, 'Business', client.businessName);
  y += 4;

  y = addParagraph(doc, y, 'This questionnaire gathers comprehensive business information for our Business Intelligence analysis. Please review any pre-filled data for accuracy and complete all blank fields so we can deliver the most effective insights and recommendations for your business.');
  y += 4;

  // Section 1: Business Overview
  y = addSection(doc, y, 'Section 1: Business Overview');
  y = addField(doc, y, 'Industry', intakeData?.industry);
  y = addField(doc, y, 'Sub-Industry', intakeData?.sub_industry);
  y = addField(doc, y, 'Years in Operation', intakeData?.years_in_operation);
  y = addField(doc, y, 'Employee Count Range', intakeData?.employee_count_range);
  y = addField(doc, y, 'Annual Revenue Range', intakeData?.annual_revenue_range);
  y = addField(doc, y, 'Target Market', intakeData?.target_market);
  y = addField(doc, y, 'Business Model', intakeData?.business_model);
  y += 4;

  // Section 2: Digital Presence
  y = addSection(doc, y, 'Section 2: Digital Presence');
  y = addField(doc, y, 'Current Website URL', intakeData?.current_website_url);
  y = addField(doc, y, 'Hosting Provider', intakeData?.hosting_provider);
  y = addField(doc, y, 'Tech Stack', intakeData?.tech_stack);
  y = addField(doc, y, 'Domain Age (Years)', intakeData?.domain_age_years);
  y = addField(doc, y, 'Has SSL', intakeData?.has_ssl === true ? 'Yes' : intakeData?.has_ssl === false ? 'No' : undefined);
  y = addField(doc, y, 'Mobile Responsive', intakeData?.is_mobile_responsive === true ? 'Yes' : intakeData?.is_mobile_responsive === false ? 'No' : undefined);
  y = addField(doc, y, 'Last Website Update', intakeData?.last_website_update);
  y += 4;

  // Section 3: Marketing
  y = addSection(doc, y, 'Section 3: Marketing');
  y = addField(doc, y, 'Social Platforms', Array.isArray(intakeData?.social_platforms) ? intakeData.social_platforms.join(', ') : intakeData?.social_platforms);
  y = addField(doc, y, 'Email Marketing Tool', intakeData?.email_marketing_tool);
  y = addField(doc, y, 'Paid Advertising', intakeData?.paid_advertising);
  y = addField(doc, y, 'Content Marketing', intakeData?.content_marketing);
  y = addField(doc, y, 'SEO Efforts', intakeData?.seo_efforts);
  y += 4;

  // Section 4: Pain Points & Goals
  y = addSection(doc, y, 'Section 4: Pain Points & Goals');
  y = addField(doc, y, 'Pain Points', intakeData?.pain_points);
  y = addField(doc, y, 'Goals', intakeData?.goals);
  y = addField(doc, y, 'Budget Range', intakeData?.budget_range);
  y = addField(doc, y, 'Timeline Expectations', intakeData?.timeline_expectations);
  y += 4;

  // Section 5: Additional Notes
  y = addSection(doc, y, 'Section 5: Additional Notes');
  y = addField(doc, y, 'Notes', intakeData?.notes);

  addFooter(doc, 1);
  for (let i = 2; i <= doc.internal.getNumberOfPages(); i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }

  return toBase64Output(doc, `BI_Discovery_${client.name.replace(/\s+/g, '_')}.pdf`, 'bi_discovery', 'Business Intelligence discovery questionnaire — please review and complete all sections.');
}

/* ===== Master Export ===== */

export async function generateAllOnboardingPdfs(
  client: Record<string, any>,
  tierData: Record<string, any>,
  intakeData: Record<string, any>
): Promise<{ intake: PdfOutputDoc; contract: PdfOutputDoc; proposal: PdfOutputDoc; welcome_packet: PdfOutputDoc }> {
  const [intake, contract, proposal, welcome_packet] = await Promise.all([
    generateIntakePdf(client, intakeData),
    generateContractPdf(client, tierData),
    generateProposalPdf(client, tierData, intakeData),
    generateWelcomePacketPdf(client),
  ]);
  return { intake, contract, proposal, welcome_packet };
}
