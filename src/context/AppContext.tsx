import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useFinance } from './FinanceContext';
import { useSales } from './SalesContext';
import { generateId, safeSetItem, safeGetItem, onStorageWarning } from '../constants';
import { generateBiDiscoveryPdf } from '../utils/generateOnboardingPdfs';
import { generateKpisForClient } from '../components/admin/BusinessIntelligence/kpiRegistry';
import { syncToApi } from '../api/apiSync';
import { syncMetadataToR2, fetchMetadataFromR2, fetchOverridesFromR2, discoverR2Templates } from '../utils/templateStorage';
import { uploadDocumentToR2, getDocumentR2Url, downloadDocumentFromR2 } from '../utils/documentStorage';
import { appointmentsApi } from '../api/appointments';
import { clientsApi } from '../api/clients';
import { invoicesApi } from '../api/invoices';
import { projectsApi } from '../api/projects';
import { timeEntriesApi } from '../api/timeEntries';
import { emailTemplatesApi } from '../api/emailTemplates';
import { notificationsApi } from '../api/notifications';
import { paymentsApi } from '../api/payments';
import { clientAuthApi } from '../api/clientAuth';
import { portalApi } from '../api/portal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AppContext = createContext<any>(null);

// Onboarding document entry factory
const createOnboardingDocEntry = () => ({
  status: 'pending',       // pending -> generated -> downloaded -> uploaded -> approved
  generatedDocId: null,    // ID in client.documents[] for admin-generated PDF
  uploadedDocId: null,     // ID in client.documents[] for client-uploaded version
  generatedAt: null, downloadedAt: null, uploadedAt: null,
  reviewedAt: null, reviewedBy: null, adminNotes: '',
});

const createDefaultOnboarding = () => ({
  complete: false, welcomeEmailSent: false,
  startedAt: null, completedAt: null, completedBy: null,
  documents: {
    intake: createOnboardingDocEntry(),
    contract: createOnboardingDocEntry(),
    proposal: createOnboardingDocEntry(),
    welcome_packet: createOnboardingDocEntry(),
  },
  documentsGeneratedAt: null, documentsGeneratedBy: null,
});

const ONBOARDING_DOC_LABELS: Record<string, string> = {
  intake: 'Intake Questionnaire',
  contract: 'Service Contract',
  proposal: 'Service Proposal',
  welcome_packet: 'Welcome Packet',
};

/**
 * Ensure onboarding document entries appear in client.documents.
 * If the onboarding JSON has a generatedDocId or approvedDocId, check
 * if that ID is already in the documents array. If not, synthesize
 * a metadata entry so it shows up in admin and client document views.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeOnboardingDocs(client: any) {
  const onb = client.onboarding;
  if (!onb?.documents || !onb.documentsGeneratedAt) return client;

  // Deduplicate by document type — if a real document of this type already
  // exists in the array (from DB or local state), skip synthesizing a duplicate
  const existingTypes = new Set((client.documents || []).map((d: any) => d.type));
  const additions: any[] = [];

  for (const [key, entry] of Object.entries(onb.documents) as [string, any][]) {
    if (!entry || entry.status === 'pending') continue;
    const docId = entry.approvedDocId || entry.generatedDocId;
    if (!docId || existingTypes.has(key)) continue;

    // Synthesize a document entry from onboarding metadata
    // Include R2 URL so Documents view can fetch the file
    const r2Url = getDocumentR2Url(docId);
    additions.push({
      id: docId,
      name: `${ONBOARDING_DOC_LABELS[key] || key}${entry.signedPdfName ? ' (Signed)' : ''}`,
      type: key,
      description: entry.approvedDocId
        ? `${ONBOARDING_DOC_LABELS[key]} — signed and approved`
        : `${ONBOARDING_DOC_LABELS[key]} — generated during onboarding`,
      filePath: r2Url,
      fileType: 'application/pdf',
      fileSize: 0,
      uploadedBy: entry.reviewedBy || onb.documentsGeneratedBy || 'System',
      uploadedAt: entry.reviewedAt || entry.generatedAt || onb.documentsGeneratedAt,
    });
  }

  if (additions.length === 0) return client;
  return { ...client, documents: [...(client.documents || []), ...additions] };
}

const STORAGE_KEY = 'threeseas_appointments';
const CLIENTS_KEY = 'threeseas_clients';
const ACTIVITY_LOG_KEY = 'threeseas_activity_log';
const TIME_ENTRIES_KEY = 'threeseas_time_entries';
const EMAIL_TEMPLATES_KEY = 'threeseas_email_templates';
const NOTIFICATIONS_KEY = 'threeseas_notifications';
const ADMIN_TEMPLATES_KEY = 'threeseas_admin_templates';
const BUILTIN_OVERRIDES_KEY = 'threeseas_builtin_overrides';


const DEFAULT_EMAIL_TEMPLATES = [
  {
    id: 'invoice-reminder',
    name: 'Invoice Reminder',
    subject: 'Reminder: Invoice #{invoiceId} Due',
    body: `Hi {clientName},

This is a friendly reminder that invoice #{invoiceId} for ${'{amount}'} is due on {dueDate}.

Please let us know if you have any questions.

Best regards,
Three Seas Digital`,
    category: 'invoice',
  },
  {
    id: 'appointment-confirmation',
    name: 'Appointment Confirmation',
    subject: 'Your Appointment is Confirmed',
    body: `Hi {clientName},

Your appointment has been confirmed for {date} at {time}.

Service: {service}

If you need to reschedule, please contact us.

Best regards,
Three Seas Digital`,
    category: 'appointment',
  },
  {
    id: 'follow-up',
    name: 'Follow-Up Outreach',
    subject: 'Following Up on Our Conversation',
    body: `Hi {clientName},

I wanted to follow up on our recent conversation about {service}.

Do you have any questions or would you like to schedule a call to discuss further?

Best regards,
Three Seas Digital`,
    category: 'follow-up',
  },
  {
    id: 'project-complete',
    name: 'Project Completion',
    subject: 'Your Project is Complete!',
    body: `Hi {clientName},

Great news! Your project "{projectName}" has been completed.

Please review and let us know if you need any adjustments.

Best regards,
Three Seas Digital`,
    category: 'project',
  },
  {
    id: 'welcome',
    name: 'Welcome New Client',
    subject: 'Welcome to Three Seas Digital, {clientName}!',
    body: `Hi {clientName},

Welcome to Three Seas Digital! We're thrilled to have you on board. Your client account is ready and we've set up everything you need to get started.

Here's what happens next: log in to your client portal, set a permanent password, and complete your business profile. From there, we'll review your onboarding documents together and schedule a kickoff call to map out your project roadmap.

We're committed to making this a great experience. If you have any questions at all, just reply to this email.

Best regards,
Three Seas Digital`,
    category: 'general',
  },
];


export function AppProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const finance = useFinance();
  const sales = useSales();
  const { currentUser, currentClient, setCurrentClient, hashPassword } = auth;
  const { addPaymentRecord, removePaymentByInvoice, RECURRING_FREQUENCIES } = finance;
  const { prospects, closeProspect, saveToBusinessDb } = sales;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appointments, setAppointments] = useState<any[]>(() => safeGetItem(STORAGE_KEY, []));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clients, setClients] = useState<any[]>(() => safeGetItem(CLIENTS_KEY, []));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activityLog, setActivityLog] = useState<any[]>(() => safeGetItem(ACTIVITY_LOG_KEY, []));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [timeEntries, setTimeEntries] = useState<any[]>(() => safeGetItem(TIME_ENTRIES_KEY, []));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emailTemplates, setEmailTemplates] = useState<any[]>(() => safeGetItem(EMAIL_TEMPLATES_KEY, DEFAULT_EMAIL_TEMPLATES));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifications, setNotifications] = useState<any[]>(() => safeGetItem(NOTIFICATIONS_KEY, []));

  useEffect(() => {
    safeSetItem(STORAGE_KEY, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    // Strip large base64 fileData from documents before saving to localStorage
    // to prevent quota exceeded errors. Documents are persisted in R2 + DB.
    const stripped = clients.map((c: any) => {
      if (!c.documents?.length) return c;
      return {
        ...c,
        documents: c.documents.map((d: any) => {
          if (!d.fileData || d.fileData.length < 1000) return d;
          const { fileData, ...rest } = d;
          return rest;
        }),
      };
    });
    safeSetItem(CLIENTS_KEY, JSON.stringify(stripped));
  }, [clients]);

  // Enrich clients with onboarding docs merged into documents array
  const enrichedClients = useMemo(() => clients.map(mergeOnboardingDocs), [clients]);

  // Keep currentClient in sync when clients array changes
  useEffect(() => {
    if (!currentClient) return;
    const fresh = enrichedClients.find((c: any) => c.id === currentClient.id);
    if (fresh && fresh !== currentClient) {
      const changed = JSON.stringify(fresh) !== JSON.stringify(currentClient);
      if (changed) setCurrentClient(fresh);
    }
  }, [enrichedClients, currentClient, setCurrentClient]);

  useEffect(() => {
    safeSetItem(ACTIVITY_LOG_KEY, JSON.stringify(activityLog));
  }, [activityLog]);

  useEffect(() => {
    safeSetItem(TIME_ENTRIES_KEY, JSON.stringify(timeEntries));
  }, [timeEntries]);

  useEffect(() => {
    safeSetItem(EMAIL_TEMPLATES_KEY, JSON.stringify(emailTemplates));
  }, [emailTemplates]);

  useEffect(() => {
    safeSetItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Activity Log - tracks all significant actions
  const logActivity = (action: string, details: Record<string, any> = {}) => {
    const entry = {
      id: generateId(),
      action, // e.g., 'client_created', 'invoice_paid', 'appointment_confirmed'
      details, // { clientId, clientName, amount, etc. }
      userId: currentUser?.id || null,
      userName: currentUser?.name || 'System',
      createdAt: new Date().toISOString(),
    };
    setActivityLog((prev) => [entry, ...prev].slice(0, 500)); // Keep last 500 entries
  };

  const clearActivityLog = () => setActivityLog([]);

  // Notifications
  const addNotification = (notification: Record<string, any>) => {
    const newNotif = {
      id: generateId(),
      type: notification.type, // 'warning', 'info', 'success', 'error'
      title: notification.title,
      message: notification.message,
      link: notification.link || null, // Optional link to navigate
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
    syncToApi(() => notificationsApi.create(newNotif), 'addNotification');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n: any) => (n.id === id ? { ...n, read: true } : n))
    );
    syncToApi(() => notificationsApi.markRead(id), 'markNotificationRead');
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n: any) => ({ ...n, read: true })));
    syncToApi(() => notificationsApi.markAllRead(), 'markAllNotificationsRead');
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n: any) => n.id !== id));
    syncToApi(() => notificationsApi.delete(id), 'deleteNotification');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    syncToApi(() => notificationsApi.clearAll(), 'clearAllNotifications');
  };

  // Wire up storage quota warnings -> notification system
  useEffect(() => {
    onStorageWarning((key: string, usage: any) => {
      addNotification({
        type: 'warning',
        title: 'Storage Full',
        message: `Could not save ${key.replace('threeseas_', '')} data. Storage is at ${usage?.mb || '?'}MB. Try removing old documents or expenses with receipts.`,
      });
    });
    return () => onStorageWarning(null);
  }, []);

  // Time Tracking
  const addTimeEntry = (entry: Record<string, any>) => {
    const newEntry = {
      id: generateId(),
      clientId: entry.clientId,
      projectId: entry.projectId,
      taskId: entry.taskId || null,
      description: entry.description || '',
      hours: parseFloat(entry.hours) || 0,
      date: entry.date || new Date().toISOString().split('T')[0],
      billable: entry.billable !== false,
      billed: false,
      userId: currentUser?.id || null,
      userName: currentUser?.name || 'Unknown',
      createdAt: new Date().toISOString(),
    };
    setTimeEntries((prev) => [...prev, newEntry]);
    syncToApi(() => timeEntriesApi.create(newEntry), 'addTimeEntry');
    logActivity('time_entry_added', { hours: newEntry.hours, projectId: entry.projectId });
    return newEntry;
  };

  const updateTimeEntry = (id: string, updates: Record<string, any>) => {
    setTimeEntries((prev) =>
      prev.map((e: any) => (e.id === id ? { ...e, ...updates } : e))
    );
    syncToApi(() => timeEntriesApi.update(id, updates), 'updateTimeEntry');
  };

  const deleteTimeEntry = (id: string) => {
    setTimeEntries((prev) => prev.filter((e: any) => e.id !== id));
    syncToApi(() => timeEntriesApi.delete(id), 'deleteTimeEntry');
  };

  const markTimeEntryBilled = (id: string) => {
    setTimeEntries((prev) =>
      prev.map((e: any) => (e.id === id ? { ...e, billed: true, billedAt: new Date().toISOString() } : e))
    );
    syncToApi(() => timeEntriesApi.update(id, { billed: true, billedAt: new Date().toISOString() }), 'markTimeEntryBilled');
  };

  // Email Templates
  const addEmailTemplate = (template: Record<string, any>) => {
    const newTemplate = {
      id: generateId(),
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category || 'general',
      createdAt: new Date().toISOString(),
    };
    setEmailTemplates((prev) => [...prev, newTemplate]);
    syncToApi(() => emailTemplatesApi.create(newTemplate), 'addEmailTemplate');
    return newTemplate;
  };

  const updateEmailTemplate = (id: string, updates: Record<string, any>) => {
    setEmailTemplates((prev) =>
      prev.map((t: any) => (t.id === id ? { ...t, ...updates } : t))
    );
    syncToApi(() => emailTemplatesApi.update(id, updates), 'updateEmailTemplate');
  };

  const deleteEmailTemplate = (id: string) => {
    // Don't allow deleting default templates
    if (['invoice-reminder', 'appointment-confirmation', 'follow-up', 'project-complete', 'welcome'].includes(id)) {
      return { success: false, error: 'Cannot delete default templates' };
    }
    setEmailTemplates((prev) => prev.filter((t: any) => t.id !== id));
    syncToApi(() => emailTemplatesApi.delete(id), 'deleteEmailTemplate');
    return { success: true };
  };

  const resetEmailTemplates = () => {
    setEmailTemplates(DEFAULT_EMAIL_TEMPLATES);
  };

  // Admin Templates — uploaded custom templates managed from admin dashboard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [adminTemplates, setAdminTemplates] = useState<any[]>(() => safeGetItem(ADMIN_TEMPLATES_KEY, []));

  useEffect(() => {
    safeSetItem(ADMIN_TEMPLATES_KEY, JSON.stringify(adminTemplates));
  }, [adminTemplates]);

  const addAdminTemplate = (template: Record<string, any>) => {
    const newTemplate = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: 'active',
      ...template,
    };
    setAdminTemplates((prev) => [...prev, newTemplate]);
    return newTemplate;
  };

  const updateAdminTemplate = (id: string, updates: Record<string, any>) => {
    setAdminTemplates((prev) =>
      prev.map((t: any) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
  };

  const deleteAdminTemplate = (id: string) => {
    setAdminTemplates((prev) => prev.filter((t: any) => t.id !== id));
  };

  // Built-in template overrides — lets admin edit price/status of static templates
  const [builtInOverrides, setBuiltInOverrides] = useState<Record<string, any>>(() => safeGetItem(BUILTIN_OVERRIDES_KEY, {}));

  useEffect(() => {
    safeSetItem(BUILTIN_OVERRIDES_KEY, JSON.stringify(builtInOverrides));
  }, [builtInOverrides]);

  const setBuiltInOverride = (templateId: string, overrides: Record<string, any>) => {
    setBuiltInOverrides((prev) => ({
      ...prev,
      [templateId]: { ...(prev[templateId] || {}), ...overrides },
    }));
  };

  const clearBuiltInOverride = (templateId: string) => {
    setBuiltInOverrides((prev) => {
      const next = { ...prev };
      delete next[templateId];
      return next;
    });
  };

  // R2 cloud sync — fetch metadata on mount, push changes back
  const [r2Synced, setR2Synced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Step 1: Fetch saved metadata from R2
        const [r2Templates, r2Overrides] = await Promise.all([
          fetchMetadataFromR2(),
          fetchOverridesFromR2(),
        ]);

        if (cancelled) return;

        let knownIds = new Set<string>();

        if (r2Templates?.adminTemplates) {
          setAdminTemplates((local) => {
            const localIds = new Set(local.map((t: any) => t.id));
            const merged = [...local];
            for (const rt of r2Templates.adminTemplates) {
              if (!localIds.has((rt as any).id)) {
                merged.push(rt);
              }
            }
            knownIds = new Set(merged.map((t: any) => t.id));
            return merged;
          });
        }

        if (r2Overrides) {
          setBuiltInOverrides((local) => ({ ...r2Overrides, ...local }));
        }

        if (cancelled) return;

        // Step 2: Discover orphaned ZIPs in R2 that have no metadata
        const r2Files = await discoverR2Templates();
        if (cancelled || r2Files.length === 0) {
          if (!cancelled) setR2Synced(true);
          return;
        }

        setAdminTemplates((current) => {
          const currentIds = new Set(current.map((t: any) => t.id));
          const orphans = r2Files.filter((f: any) => !currentIds.has(f.id));
          if (orphans.length === 0) return current;

          const stubs = orphans.map((f: any) => ({
            id: f.id,
            name: `Cloud Template (${f.id.slice(0, 8)})`,
            tier: 'Starter',
            category: 'Other',
            description: 'Imported from cloud storage',
            status: 'active',
            hasZip: true,
            hasImage: f.hasImage || false,
            zipSize: f.size || 0,
            createdAt: f.uploaded || new Date().toISOString(),
          }));
          return [...current, ...stubs];
        });
      } catch { /* R2 unavailable, continue with localStorage */ }
      if (!cancelled) setR2Synced(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!r2Synced) return;
    syncMetadataToR2(adminTemplates, builtInOverrides).catch(() => {});
  }, [adminTemplates, builtInOverrides, r2Synced]);

  // Appointments
  const addAppointment = (appointment: Record<string, any>) => {
    const newAppt = {
      id: generateId(),
      status: 'pending',
      followUp: null,
      createdAt: new Date().toISOString(),
      ...appointment,
    };
    setAppointments((prev) => [...prev, newAppt]);
    syncToApi(() => appointmentsApi.create(newAppt), 'addAppointment');
    return newAppt;
  };

  const updateAppointmentStatus = (id: string, status: string) => {
    setAppointments((prev) =>
      prev.map((appt: any) => (appt.id === id ? { ...appt, status } : appt))
    );
    syncToApi(() => appointmentsApi.updateStatus(id, status), 'updateAppointmentStatus');
  };

  const updateAppointment = (id: string, updates: Record<string, any>) => {
    setAppointments((prev) =>
      prev.map((appt: any) => (appt.id === id ? { ...appt, ...updates } : appt))
    );
    syncToApi(() => appointmentsApi.update(id, updates), 'updateAppointment');
  };

  const assignAppointment = (appointmentId: string, userId: string | null) => {
    setAppointments((prev) =>
      prev.map((appt: any) =>
        appt.id === appointmentId
          ? { ...appt, assignedTo: userId || null }
          : appt
      )
    );
    syncToApi(() => appointmentsApi.update(appointmentId, { assignedTo: userId || null }), 'assignAppointment');
  };

  const markFollowUp = (id: string, followUpData: Record<string, any>) => {
    setAppointments((prev) =>
      prev.map((appt: any) =>
        appt.id === id
          ? {
              ...appt,
              followUp: {
                ...followUpData,
                createdAt: new Date().toISOString(),
              },
            }
          : appt
      )
    );
    syncToApi(() => appointmentsApi.update(id, { followUp: { ...followUpData, createdAt: new Date().toISOString() } }), 'markFollowUp');
  };

  const updateFollowUp = (id: string, updates: Record<string, any>) => {
    setAppointments((prev) =>
      prev.map((appt: any) =>
        appt.id === id
          ? { ...appt, followUp: { ...appt.followUp, ...updates } }
          : appt
      )
    );
    syncToApi(() => appointmentsApi.update(id, { followUp: updates }), 'updateFollowUp');
  };

  const addFollowUpNote = (appointmentId: string, noteText: string) => {
    if (!noteText?.trim()) return;
    setAppointments((prev) =>
      prev.map((appt: any) => {
        if (appt.id !== appointmentId || !appt.followUp) return appt;
        const existingNotes = appt.followUp.notes || [];
        return {
          ...appt,
          followUp: {
            ...appt.followUp,
            notes: [
              ...existingNotes,
              {
                id: generateId(),
                text: noteText.trim(),
                author: currentUser?.name || 'System',
                createdAt: new Date().toISOString(),
              },
            ],
          },
        };
      })
    );
    syncToApi(() => appointmentsApi.addFollowUpNote(appointmentId, { text: noteText.trim(), author: currentUser?.name || 'System' }), 'addFollowUpNote');
  };

  const deleteFollowUpNote = (appointmentId: string, noteId: string) => {
    setAppointments((prev) =>
      prev.map((appt: any) => {
        if (appt.id !== appointmentId || !appt.followUp) return appt;
        return {
          ...appt,
          followUp: {
            ...appt.followUp,
            notes: (appt.followUp.notes || []).filter((n: any) => n.id !== noteId),
          },
        };
      })
    );
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((appt: any) => appt.id !== id));
    syncToApi(() => appointmentsApi.delete(id), 'deleteAppointment');
  };

  const getAppointmentsForDate = (dateStr: string) => {
    return appointments.filter((appt: any) => appt.date === dateStr);
  };

  const getBookedTimesForDate = (dateStr: string, excludeApptId?: string) => {
    return getAppointmentsForDate(dateStr)
      .filter((a: any) => a.status !== 'cancelled' && a.id !== excludeApptId)
      .map((a: any) => a.time);
  };

  // Clients
  const convertToClient = (appointmentId: string) => {
    const appt = appointments.find((a: any) => a.id === appointmentId);
    if (!appt) return { success: false, error: 'Appointment not found' };

    const existing = clients.find(
      (c: any) => c.email.toLowerCase() === appt.email.toLowerCase()
    );
    if (existing) return { success: false, error: 'Client with this email already exists', client: existing };

    const newClient = {
      id: generateId(),
      name: appt.name,
      email: appt.email,
      phone: appt.phone || '',
      service: appt.service || '',
      status: 'active',
      source: 'appointment',
      sourceAppointmentId: appointmentId,
      notes: [],
      tags: [],
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [...prev, newClient]);
    syncToApi(() => clientsApi.create(newClient), 'convertToClient');

    // Mark appointment as converted
    updateAppointment(appointmentId, { convertedToClient: newClient.id });

    return { success: true, client: newClient };
  };

  const addClientManually = (clientData: Record<string, any>) => {
    const existing = clients.find(
      (c: any) => c.email.toLowerCase() === clientData.email.toLowerCase()
    );
    if (existing) return { success: false, error: 'Client with this email already exists' };

    const newClient = {
      ...clientData,
      id: generateId(),
      status: 'active',
      source: 'manual',
      notes: [],
      tags: [],
      invoices: [],
      projects: [],
      documents: [],
      onboarding: createDefaultOnboarding(),
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [...prev, newClient]);
    syncToApi(() => clientsApi.create(newClient), 'addClientManually');
    return { success: true, client: newClient };
  };

  const updateClient = (id: string, updates: Record<string, any>) => {
    setClients((prev) =>
      prev.map((c: any) => (c.id === id ? { ...c, ...updates } : c))
    );
    const isClientSession = !!localStorage.getItem('threeseas_current_client');
    if (isClientSession) {
      syncToApi(() => portalApi.updateProfile(updates), 'updateClient');
    } else {
      syncToApi(() => clientsApi.update(id, updates), 'updateClient');
    }
  };

  const addClientNote = (id: string, note: string) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === id
          ? {
              ...c,
              notes: [
                ...(c.notes || []),
                {
                  id: generateId(),
                  text: note,
                  author: currentUser?.name || 'System',
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : c
      )
    );
    syncToApi(() => clientsApi.addNote(id, { text: note, author: currentUser?.name || 'System' }), 'addClientNote');
  };

  const deleteClientNote = (clientId: string, noteId: string) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? { ...c, notes: (c.notes || []).filter((n: any) => n.id !== noteId) }
          : c
      )
    );
    syncToApi(() => clientsApi.deleteNote(clientId, noteId), 'deleteClientNote');
  };

  const addClientTag = (id: string, tag: string) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === id && !(c.tags || []).includes(tag)
          ? { ...c, tags: [...(c.tags || []), tag] }
          : c
      )
    );
    syncToApi(() => clientsApi.addTag(id, tag), 'addClientTag');
  };

  const removeClientTag = (id: string, tag: string) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === id ? { ...c, tags: (c.tags || []).filter((t: string) => t !== tag) } : c
      )
    );
    syncToApi(() => clientsApi.removeTag(id, tag), 'removeClientTag');
  };

  // Document types for categorization
  const DOCUMENT_TYPES: Record<string, { label: string; color: string }> = {
    intake: { label: 'Intake Questionnaire', color: '#14b8a6' },
    proposal: { label: 'Proposal', color: '#6366f1' },
    contract: { label: 'Contract', color: '#22c55e' },
    agreement: { label: 'Agreement', color: '#0ea5e9' },
    invoice: { label: 'Invoice', color: '#f59e0b' },
    receipt: { label: 'Receipt', color: '#8b5cf6' },
    report: { label: 'Report', color: '#ec4899' },
    welcome_packet: { label: 'Welcome Packet', color: '#f97316' },
    bi_discovery: { label: 'BI Discovery', color: '#a855f7' },
    other: { label: 'Other', color: '#6b7280' },
  };

  const addClientDocument = (clientId: string, document: Record<string, any>) => {
    const newDoc = {
      id: generateId(),
      name: document.name,
      type: document.type || 'other',
      description: document.description || '',
      fileData: document.fileData, // base64 encoded file (kept for local display)
      fileType: document.fileType, // mime type
      fileSize: document.fileSize,
      uploadedBy: currentUser?.name || 'System',
      uploadedAt: new Date().toISOString(),
    };
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? { ...c, documents: [...(c.documents || []), newDoc] }
          : c
      )
    );

    if (document instanceof FormData || document.file) {
      // File upload — use multipart endpoint
      syncToApi(() => clientsApi.uploadDocument(clientId, document as any), 'addClientDocument');
    } else if (document.fileData) {
      // Base64 document — upload to R2 and save metadata to DB
      syncToApi(async () => {
        const r2Result = await uploadDocumentToR2(newDoc.id, document.fileData, document.fileType);
        const filePath = r2Result.success ? r2Result.url : null;
        await clientsApi.saveDocumentMetadata(clientId, {
          id: newDoc.id,
          name: newDoc.name,
          type: newDoc.type,
          description: newDoc.description,
          filePath,
          fileSize: newDoc.fileSize,
          mimeType: newDoc.fileType,
          uploadedBy: newDoc.uploadedBy,
        });
      }, 'addClientDocument');
    }

    return { success: true, document: newDoc };
  };

  const updateClientDocument = (clientId: string, docId: string, updates: Record<string, any>) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? {
              ...c,
              documents: (c.documents || []).map((d: any) =>
                d.id === docId ? { ...d, ...updates } : d
              ),
            }
          : c
      )
    );
  };

  const deleteClientDocument = (clientId: string, docId: string) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? { ...c, documents: (c.documents || []).filter((d: any) => d.id !== docId) }
          : c
      )
    );
    syncToApi(() => clientsApi.deleteDocument(clientId, docId), 'deleteClientDocument');
  };

  const archiveClient = (id: string) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === id
          ? { ...c, status: 'archived', archivedAt: new Date().toISOString(), archivedBy: currentUser?.name || 'System' }
          : c
      )
    );
    syncToApi(() => clientsApi.archive(id), 'archiveClient');
  };

  const restoreClient = (id: string) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === id
          ? { ...c, status: 'active', archivedAt: null, archivedBy: null, restoredAt: new Date().toISOString() }
          : c
      )
    );
    syncToApi(() => clientsApi.restore(id), 'restoreClient');
  };

  const permanentlyDeleteClient = (id: string) => {
    setClients((prev) => prev.filter((c: any) => c.id !== id));
    syncToApi(() => clientsApi.delete(id), 'permanentlyDeleteClient');
  };

  // Keep deleteClient as alias for archiveClient for backward compatibility
  const deleteClient = archiveClient;

  const approveClient = async (id: string) => {
    setClients((prev) =>
      prev.map((c: any) => {
        if (c.id !== id) return c;
        const hasProfile = c.businessName && c.phone && c.street && c.city && c.state && c.zip;
        return {
          ...c,
          status: 'active',
          profileComplete: hasProfile ? true : c.profileComplete || false,
          approvedAt: new Date().toISOString(),
          approvedBy: currentUser?.name || 'Admin',
          onboarding: c.onboarding || createDefaultOnboarding(),
        };
      })
    );
    syncToApi(() => clientsApi.approve(id), 'approveClient');

    // Auto-scaffold BI template for newly approved client
    try {
      // Create empty intake template
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

      // Create empty financials template
      const financials = safeGetItem('threeseas_bi_client_financials', {});
      if (!financials[id]) {
        financials[id] = { clientId: id, entries: [], createdAt: new Date().toISOString() };
        safeSetItem('threeseas_bi_client_financials', JSON.stringify(financials));
      }

      // Create growth targets — use industry KPIs if intake has industry, else generic defaults
      const targets = safeGetItem('threeseas_bi_growth_targets', []);
      const hasTargets = targets.some((t: any) => t.clientId === id);
      if (!hasTargets) {
        const intake = intakes[id];
        if (intake && intake.industry && intake.industry !== 'Other') {
          generateKpisForClient(id, intake.industry);
        } else {
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
      }
    } catch (e: any) {
      // BI template creation is non-critical — don't block approval
      console.warn('[BI] Template scaffold failed:', e.message);
    }
  };

  const rejectClient = (id: string) => {
    setClients((prev) => prev.filter((c: any) => c.id !== id));
    syncToApi(() => clientsApi.reject(id), 'rejectClient');
  };

  // Payments / Invoices
  const addInvoice = (clientId: string, invoice: Record<string, any>) => {
    const client = clients.find((c: any) => c.id === clientId);
    const newInvoice = {
      id: generateId(),
      title: invoice.title,
      amount: parseFloat(invoice.amount),
      status: 'unpaid',
      dueDate: invoice.dueDate || '',
      description: invoice.description || '',
      recurring: invoice.recurring || false,
      frequency: invoice.frequency || null, // 'weekly', 'monthly', 'quarterly', 'yearly'
      nextDueDate: invoice.recurring ? invoice.dueDate : null,
      createdAt: new Date().toISOString(),
      paidAt: null,
    };
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? { ...c, invoices: [...(c.invoices || []), newInvoice] }
          : c
      )
    );
    syncToApi(() => invoicesApi.create({ ...newInvoice, clientId }), 'addInvoice');
    logActivity('invoice_created', { clientId, clientName: client?.name, amount: newInvoice.amount, title: invoice.title });
    return newInvoice;
  };

  // Generate next recurring invoice
  const generateRecurringInvoice = (clientId: string, invoiceId: string) => {
    const client = clients.find((c: any) => c.id === clientId);
    const invoice = client?.invoices?.find((i: any) => i.id === invoiceId);
    if (!invoice || !invoice.recurring) return null;

    const freq = RECURRING_FREQUENCIES.find((f: any) => f.value === invoice.frequency);
    if (!freq) return null;

    const nextDate = new Date(invoice.nextDueDate || invoice.dueDate);
    nextDate.setDate(nextDate.getDate() + freq.days);

    const newId = generateId();
    const newInvoice = {
      ...invoice,
      id: newId,
      status: 'unpaid',
      dueDate: nextDate.toISOString().split('T')[0],
      nextDueDate: nextDate.toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      paidAt: null,
      parentInvoiceId: invoiceId,
    };

    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? { ...c, invoices: [...(c.invoices || []), newInvoice] }
          : c
      )
    );
    syncToApi(() => invoicesApi.generateRecurring(invoiceId), 'generateRecurringInvoice');

    // Update the original invoice's nextDueDate
    updateInvoice(clientId, invoiceId, { nextDueDate: nextDate.toISOString().split('T')[0] });

    logActivity('recurring_invoice_generated', { clientId, clientName: client?.name, amount: newInvoice.amount });
    return newInvoice;
  };

  const updateInvoice = (clientId: string, invoiceId: string, updates: Record<string, any>) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? {
              ...c,
              invoices: (c.invoices || []).map((inv: any) =>
                inv.id === invoiceId ? { ...inv, ...updates } : inv
              ),
            }
          : c
      )
    );
    syncToApi(() => invoicesApi.update(invoiceId, updates), 'updateInvoice');
  };

  const markInvoicePaid = (clientId: string, invoiceId: string) => {
    const client = clients.find((c: any) => c.id === clientId);
    const invoice = client?.invoices?.find((i: any) => i.id === invoiceId);

    if (invoice && invoice.status !== 'paid') {
      // Create payment record for revenue tracking
      const payment = {
        id: generateId(),
        clientId,
        clientName: client.name,
        service: client.service || 'general',
        serviceTier: client.tier || 'basic',
        amount: invoice.amount,
        method: 'invoice',
        status: 'completed',
        invoiceId: invoiceId,
        createdAt: new Date().toISOString(),
      };
      addPaymentRecord(payment);

      // Update invoice status
      setClients((prev) =>
        prev.map((c: any) =>
          c.id === clientId
            ? {
                ...c,
                invoices: (c.invoices || []).map((i: any) =>
                  i.id === invoiceId
                    ? { ...i, status: 'paid', paidAt: new Date().toISOString() }
                    : i
                ),
              }
            : c
        )
      );
      syncToApi(() => invoicesApi.markPaid(invoiceId), 'markInvoicePaid');

      // Log activity
      logActivity('invoice_paid', { clientId, clientName: client.name, amount: invoice.amount, invoiceId });

      // If recurring, generate the next invoice
      if (invoice.recurring) {
        setTimeout(() => generateRecurringInvoice(clientId, invoiceId), 100);
      }
    }
  };

  const unmarkInvoicePaid = (clientId: string, invoiceId: string) => {
    // Remove the associated payment record
    removePaymentByInvoice(invoiceId);

    // Set invoice status back to unpaid
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? {
              ...c,
              invoices: (c.invoices || []).map((i: any) =>
                i.id === invoiceId ? { ...i, status: 'unpaid', paidAt: null } : i
              ),
            }
          : c
      )
    );
    syncToApi(() => invoicesApi.unmarkPaid(invoiceId), 'unmarkInvoicePaid');
  };

  const deleteInvoice = (clientId: string, invoiceId: string) => {
    // Remove associated payment record
    removePaymentByInvoice(invoiceId);

    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? { ...c, invoices: (c.invoices || []).filter((inv: any) => inv.id !== invoiceId) }
          : c
      )
    );
    syncToApi(() => invoicesApi.delete(invoiceId), 'deleteInvoice');
  };

  // Projects (all clients)
  const addProject = (clientId: string, project: Record<string, any>) => {
    const newProject = {
      id: generateId(),
      title: project.title,
      description: project.description || '',
      status: 'planning', // planning, in-progress, review, completed, archived
      progress: 0,
      developers: project.developers || [], // Array of user IDs
      tasks: [],
      milestones: [],
      startDate: project.startDate || null,
      dueDate: project.dueDate || null,
      createdAt: new Date().toISOString(),
    };
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? { ...c, projects: [...(c.projects || []), newProject] }
          : c
      )
    );
    const isClientSession = !!localStorage.getItem('threeseas_current_client');
    if (isClientSession) {
      syncToApi(() => portalApi.createProject({ title: newProject.title, description: newProject.description }), 'addProject');
    } else {
      syncToApi(() => projectsApi.create({ ...newProject, clientId }), 'addProject');
    }
    return newProject;
  };

  const updateProject = (clientId: string, projectId: string, updates: Record<string, any>) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p: any) =>
                p.id === projectId ? { ...p, ...updates } : p
              ),
            }
          : c
      )
    );
    syncToApi(() => projectsApi.update(projectId, updates), 'updateProject');
  };

  const deleteProject = (clientId: string, projectId: string) => {
    // Remove associated time entries
    setTimeEntries((prev) => prev.filter((te: any) => te.projectId !== projectId));

    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? { ...c, projects: (c.projects || []).filter((p: any) => p.id !== projectId) }
          : c
      )
    );
    syncToApi(() => projectsApi.delete(projectId), 'deleteProject');
  };

  const addProjectTask = (clientId: string, projectId: string, task: Record<string, any>) => {
    const newTask = {
      id: generateId(),
      title: task.title,
      status: task.status || 'todo',
      goal: task.goal || '',
      assignee: task.assignee || '',
      dueDate: task.dueDate || '',
      priority: task.priority || 'normal',
      createdAt: new Date().toISOString(),
    };
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p: any) =>
                p.id === projectId
                  ? { ...p, tasks: [...(p.tasks || []), newTask] }
                  : p
              ),
            }
          : c
      )
    );
    syncToApi(() => projectsApi.addTask(projectId, newTask), 'addProjectTask');
  };

  const updateProjectTask = (clientId: string, projectId: string, taskId: string, updates: Record<string, any>) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p: any) =>
                p.id === projectId
                  ? {
                      ...p,
                      tasks: (p.tasks || []).map((t: any) =>
                        t.id === taskId ? { ...t, ...updates } : t
                      ),
                    }
                  : p
              ),
            }
          : c
      )
    );
    syncToApi(() => projectsApi.updateTask(projectId, taskId, updates), 'updateProjectTask');
  };

  const deleteProjectTask = (clientId: string, projectId: string, taskId: string) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p: any) =>
                p.id === projectId
                  ? { ...p, tasks: (p.tasks || []).filter((t: any) => t.id !== taskId) }
                  : p
              ),
            }
          : c
      )
    );
    syncToApi(() => projectsApi.deleteTask(projectId, taskId), 'deleteProjectTask');
  };

  const addMilestone = (clientId: string, projectId: string, milestone: Record<string, any>) => {
    const newMilestone = {
      id: generateId(),
      title: milestone.title,
      dueDate: milestone.dueDate || '',
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p: any) =>
                p.id === projectId
                  ? { ...p, milestones: [...(p.milestones || []), newMilestone] }
                  : p
              ),
            }
          : c
      )
    );
    syncToApi(() => projectsApi.addMilestone(projectId, newMilestone), 'addMilestone');
  };

  const toggleMilestone = (clientId: string, projectId: string, milestoneId: string) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p: any) =>
                p.id === projectId
                  ? {
                      ...p,
                      milestones: (p.milestones || []).map((m: any) =>
                        m.id === milestoneId ? { ...m, completed: !m.completed } : m
                      ),
                    }
                  : p
              ),
            }
          : c
      )
    );
    syncToApi(() => projectsApi.updateMilestone(projectId, milestoneId, {}), 'toggleMilestone');
  };

  const deleteMilestone = (clientId: string, projectId: string, milestoneId: string) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p: any) =>
                p.id === projectId
                  ? { ...p, milestones: (p.milestones || []).filter((m: any) => m.id !== milestoneId) }
                  : p
              ),
            }
          : c
      )
    );
    syncToApi(() => projectsApi.deleteMilestone(projectId, milestoneId), 'deleteMilestone');
  };

  // Developer assignment to projects
  const assignDeveloperToProject = (clientId: string, projectId: string, userId: string) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p: any) =>
                p.id === projectId && !p.developers?.includes(userId)
                  ? { ...p, developers: [...(p.developers || []), userId] }
                  : p
              ),
            }
          : c
      )
    );
    syncToApi(() => projectsApi.addDeveloper(projectId, userId), 'assignDeveloperToProject');
  };

  const removeDeveloperFromProject = (clientId: string, projectId: string, userId: string) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p: any) =>
                p.id === projectId
                  ? { ...p, developers: (p.developers || []).filter((id: string) => id !== userId) }
                  : p
              ),
            }
          : c
      )
    );
    syncToApi(() => projectsApi.removeDeveloper(projectId, userId), 'removeDeveloperFromProject');
  };

  // Project completion workflow
  const completeProject = (clientId: string, projectId: string, options: Record<string, any> = {}) => {
    const client = clients.find((c: any) => c.id === clientId);
    const project = client?.projects?.find((p: any) => p.id === projectId);
    if (!project) return { success: false, error: 'Project not found' };

    // Archive project if requested
    if (options.archive) {
      updateProject(clientId, projectId, {
        status: 'archived',
        completedAt: new Date().toISOString(),
      });
    }

    // Create follow-up appointment if requested
    if (options.createFollowUp && options.followUpData) {
      const followUpAppt = {
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        date: options.followUpData.date || new Date().toISOString().split('T')[0],
        time: options.followUpData.time || '10:00',
        service: options.followUpData.service || 'maintenance',
        message: options.followUpData.message || `Follow-up for completed project: ${project.title}`,
        status: 'pending',
        followUp: {
          note: options.followUpData.note || `Maintenance check for ${project.title}`,
          priority: options.followUpData.priority || 'normal',
          followUpDate: options.followUpData.date || '',
          status: 'pending',
          createdAt: new Date().toISOString(),
          notes: [],
        },
      };
      setAppointments((prev) => [
        ...prev,
        {
          ...followUpAppt,
          id: generateId(),
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    // Create final invoice if requested
    if (options.createInvoice && options.invoiceData) {
      addInvoice(clientId, {
        title: options.invoiceData.title || `Final Invoice - ${project.title}`,
        amount: options.invoiceData.amount,
        dueDate: options.invoiceData.dueDate || '',
        description: options.invoiceData.description || `Final payment for project: ${project.title}`,
      });
    }

    // Add completion note to client
    addClientNote(clientId, `Project "${project.title}" completed`);

    return { success: true };
  };


  // Submit client intake from portal (saves to BI + updates onboarding status)
  const submitClientIntake = (clientId: string, intakeData: Record<string, any>) => {
    const intakes = safeGetItem('threeseas_bi_intakes', {});
    intakes[clientId] = {
      ...intakes[clientId],
      ...intakeData,
      submittedAt: new Date().toISOString(),
      submittedBy: 'client',
    };
    safeSetItem('threeseas_bi_intakes', JSON.stringify(intakes));

    const client = clients.find((c: any) => c.id === clientId);
    const currentDocs = client?.onboarding?.documents || {};
    updateClientOnboarding(clientId, {
      documents: {
        ...currentDocs,
        intake: {
          ...currentDocs.intake,
          status: 'uploaded',
          uploadedAt: new Date().toISOString(),
        },
      },
    });
  };

  // Onboarding
  const completeOnboarding = async (clientId: string) => {
    const client = clients.find((c: any) => c.id === clientId);
    if (!client) return;
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? { ...c, onboarding: { ...c.onboarding, complete: true, completedAt: new Date().toISOString(), completedBy: currentUser?.name || 'Admin' } }
          : c
      )
    );
    syncToApi(() => clientsApi.update(clientId, { onboarding: { ...client.onboarding, complete: true, completedAt: new Date().toISOString(), completedBy: currentUser?.name || 'Admin' } }), 'completeOnboarding');
    logActivity('onboarding_completed', { clientId, clientName: client.name });
    addNotification({ type: 'success', title: 'Onboarding Complete', message: `${client.name} has been fully onboarded` });

    // Generate BI Discovery Questionnaire
    try {
      const intakes = safeGetItem('threeseas_bi_intakes', {});
      const intakeData = intakes[clientId] || {};
      const biDoc = await generateBiDiscoveryPdf(
        { name: client.name, email: client.email, businessName: client.businessName },
        intakeData
      );
      addClientDocument(clientId, biDoc);
    } catch (err: any) {
      addNotification({ type: 'warning', title: 'BI Discovery PDF Failed', message: `Could not generate BI Discovery PDF: ${err.message}` });
    }
  };

  const reopenOnboarding = (clientId: string) => {
    const client = clients.find((c: any) => c.id === clientId);
    if (!client) return;
    const updatedOnboarding = { ...client.onboarding, complete: false, completedAt: null, completedBy: null, reopenedAt: new Date().toISOString(), reopenedBy: currentUser?.name || 'Admin' };
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? { ...c, onboarding: updatedOnboarding }
          : c
      )
    );
    syncToApi(() => clientsApi.update(clientId, { onboarding: updatedOnboarding }), 'reopenOnboarding');
    logActivity('onboarding_reopened', { clientId, clientName: client.name });
    addNotification({ type: 'info', title: 'Onboarding Reopened', message: `${client.name} has been sent back to onboarding` });
  };

  const updateClientOnboarding = (clientId: string, updates: Record<string, any>) => {
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? { ...c, onboarding: { ...c.onboarding, ...updates } }
          : c
      )
    );
    // Use portal endpoint for client sessions, admin endpoint otherwise
    const isClientSession = !!localStorage.getItem('threeseas_current_client');
    if (isClientSession && currentClient?.id === clientId) {
      syncToApi(() => portalApi.updateOnboarding(updates), 'updateClientOnboarding');
    } else {
      syncToApi(() => clientsApi.update(clientId, { onboarding: updates }), 'updateClientOnboarding');
    }
  };

  // Convert prospect to client (cross-context: reads from SalesContext, writes to clients)
  const convertProspectToClient = (prospectId: string) => {
    const prospect = prospects.find((p: any) => p.id === prospectId);
    if (!prospect) return { success: false, error: 'Prospect not found' };

    // Check for existing client only if prospect has email
    if (prospect.email) {
      const existingClient = clients.find((c: any) => c.email && c.email.toLowerCase() === prospect.email.toLowerCase());
      if (existingClient) {
        closeProspect(prospectId, 'won');
        return { success: true, message: 'Client already exists, prospect marked as won', client: existingClient };
      }
    }

    const newClient = {
      id: generateId(),
      name: prospect.name,
      email: prospect.email || '',
      phone: prospect.phone || '',
      service: prospect.service || '',
      status: 'active',
      tier: 'free',
      notes: prospect.notes || [], // Pass notes from prospect
      tags: [],
      invoices: [],
      projects: [],
      documents: prospect.documents || [], // Pass documents from prospect
      sourceProspectId: prospectId,
      onboarding: createDefaultOnboarding(),
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);
    syncToApi(() => clientsApi.create(newClient), 'convertProspectToClient');
    closeProspect(prospectId, 'won');

    // Auto-update business database with client conversion data
    saveToBusinessDb({
      name: prospect.name,
      address: '',
      phone: prospect.phone || '',
      type: prospect.service || '',
      source: 'pipeline',
      enrichment: {
        pipelineStatus: 'client',
        convertedToClientAt: new Date().toISOString(),
        clientId: newClient.id,
        pointOfContact: prospect.name,
        contactEmail: prospect.email || '',
        contactPhone: prospect.phone || '',
        serviceInterest: prospect.service || '',
        dealValue: prospect.dealValue || 0,
        clientTier: 'free',
        clientStatus: 'active',
      },
    });

    logActivity('prospect_converted', {
      clientId: newClient.id,
      clientName: newClient.name,
      prospectId,
      service: prospect.service,
    });

    addNotification({
      type: 'success',
      title: 'New Client',
      message: `${prospect.name} converted from prospect to client`,
    });

    return { success: true, client: newClient };
  };

  // Client self-registration
  const registerClient = (data: Record<string, any>) => {
    const existing = clients.find(
      (c: any) => c.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existing) return { success: false, error: 'An account with this email already exists' };

    const newClient = {
      id: generateId(),
      name: data.name,
      email: data.email,
      password: data.password ? hashPassword(data.password) : '',
      businessName: data.businessName || '',
      phone: data.phone || '',
      street: data.street || '',
      city: data.city || '',
      state: data.state || '',
      zip: data.zip || '',
      dateOfBirth: data.dateOfBirth || '',
      service: '',
      status: 'pending',
      tier: 'free',
      authMethod: data.authMethod || 'email',
      source: 'self-registration',
      notes: [],
      tags: [],
      invoices: [],
      profileComplete: data.profileComplete || false,
      projects: [],
      documents: [],
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [...prev, newClient]);
    syncToApi(() => clientAuthApi.register({ name: data.name, email: data.email, password: data.password || '', phone: data.phone || '', businessName: data.businessName || '' }), 'registerClient');
    return { success: true, client: newClient, pendingApproval: true };
  };

  const changeClientPassword = (clientId: string, newPassword: string, mustChangePassword: boolean = true, skipApi: boolean = false) => {
    if (!newPassword || newPassword.length < 6) return { success: false, error: 'Password must be at least 6 characters' };
    setClients((prev) => prev.map((c: any) => c.id === clientId ? { ...c, hasPassword: true, mustChangePassword } : c));
    if (!skipApi) {
      syncToApi(() => clientsApi.setPassword(clientId, newPassword, mustChangePassword), 'changeClientPassword');
    }
    return { success: true };
  };

  const clientLogin = (email: string, password: string) => {
    const result = auth.clientLogin(email, password, clients);
    // Handle plaintext password migration if needed
    if (result.migrateFn) {
      setClients((prev) => prev.map((x: any) => x.id === result.migrateFn.id ? { ...x, password: result.migrateFn.hashed } : x));
    }
    return result;
  };

  const checkClientEmail = (email: string): boolean => {
    return clients.some((c: any) => c.email.toLowerCase() === email.toLowerCase());
  };

  const clientLogout = () => auth.clientLogout();

  const recordPayment = (clientId: string, paymentData: Record<string, any>) => {
    const payment = finance.recordPayment(clientId, paymentData);

    // Auto-create a paid invoice on the client
    const invoice = {
      id: generateId(),
      title: `${paymentData.service} - ${paymentData.serviceTier}`,
      amount: paymentData.amount,
      status: 'paid',
      dueDate: '',
      description: `Payment via ${paymentData.method}`,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    };
    setClients((prev) =>
      prev.map((c: any) =>
        c.id === clientId
          ? { ...c, invoices: [...(c.invoices || []), invoice] }
          : c
      )
    );

    return payment;
  };

  const updateClientTier = (clientId: string, tier: string) => {
    setClients((prev) =>
      prev.map((c: any) => (c.id === clientId ? { ...c, tier } : c))
    );
    syncToApi(() => clientsApi.update(clientId, { tier }), 'updateClientTier');
    if (currentClient?.id === clientId) {
      setCurrentClient((prev: any) => ({ ...prev, tier }));
    }
  };

  const value = useMemo(() => ({
    appointments, addAppointment, updateAppointmentStatus, updateAppointment, assignAppointment,
    markFollowUp, updateFollowUp, addFollowUpNote, deleteFollowUpNote, deleteAppointment, getAppointmentsForDate, getBookedTimesForDate,
    clients: enrichedClients, convertToClient, addClientManually, updateClient, addClientNote, deleteClientNote,
    addClientTag, removeClientTag, addClientDocument, updateClientDocument, deleteClientDocument, DOCUMENT_TYPES,
    deleteClient, archiveClient, restoreClient, permanentlyDeleteClient, approveClient, rejectClient,
    completeOnboarding, reopenOnboarding, updateClientOnboarding, submitClientIntake,
    addInvoice, updateInvoice, markInvoicePaid, unmarkInvoicePaid, deleteInvoice,
    addProject, updateProject, deleteProject, addProjectTask, updateProjectTask, deleteProjectTask,
    addMilestone, toggleMilestone, deleteMilestone, assignDeveloperToProject, removeDeveloperFromProject, completeProject,
    recordPayment, updateClientTier, convertProspectToClient,
    registerClient, checkClientEmail, clientLogin, clientLogout, changeClientPassword,
    activityLog, logActivity, clearActivityLog,
    notifications, addNotification, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications,
    timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry, markTimeEntryBilled,
    emailTemplates, addEmailTemplate, updateEmailTemplate, deleteEmailTemplate, resetEmailTemplates, DEFAULT_EMAIL_TEMPLATES,
    generateRecurringInvoice,
    adminTemplates, addAdminTemplate, updateAdminTemplate, deleteAdminTemplate,
    builtInOverrides, setBuiltInOverride, clearBuiltInOverride,
  }), [appointments, enrichedClients, activityLog, notifications, timeEntries, emailTemplates, adminTemplates, builtInOverrides]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// useAppContext merges Auth, Finance, Sales, and App contexts for backward compatibility.
// Components can also use useAuth(), useFinance(), or useSales() directly for domain-specific needs.
// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const appCtx = useContext(AppContext);
  const authCtx = useAuth();
  const finCtx = useFinance();
  const salesCtx = useSales();
  return { ...authCtx, ...finCtx, ...salesCtx, ...appCtx };
};
