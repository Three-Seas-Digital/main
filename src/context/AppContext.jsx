import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useFinance } from './FinanceContext';
import { useSales } from './SalesContext';
import { generateId, safeSetItem, safeGetItem, onStorageWarning } from '../constants';
import { syncToApi } from '../api/apiSync.js';
import { appointmentsApi } from '../api/appointments.js';
import { clientsApi } from '../api/clients.js';
import { invoicesApi } from '../api/invoices.js';
import { projectsApi } from '../api/projects.js';
import { timeEntriesApi } from '../api/timeEntries.js';
import { emailTemplatesApi } from '../api/emailTemplates.js';
import { notificationsApi } from '../api/notifications.js';
import { paymentsApi } from '../api/payments.js';
import { clientAuthApi } from '../api/clientAuth.js';

const AppContext = createContext();

const STORAGE_KEY = 'threeseas_appointments';
const CLIENTS_KEY = 'threeseas_clients';
const ACTIVITY_LOG_KEY = 'threeseas_activity_log';
const TIME_ENTRIES_KEY = 'threeseas_time_entries';
const EMAIL_TEMPLATES_KEY = 'threeseas_email_templates';
const NOTIFICATIONS_KEY = 'threeseas_notifications';


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
    subject: 'Welcome to Three Seas Digital!',
    body: `Hi {clientName},

Welcome aboard! We're excited to have you as a client.

Your account has been set up and you can access your portal anytime.

Best regards,
Three Seas Digital`,
    category: 'general',
  },
];


export function AppProvider({ children }) {
  const auth = useAuth();
  const finance = useFinance();
  const sales = useSales();
  const { currentUser, currentClient, setCurrentClient, hashPassword } = auth;
  const { addPaymentRecord, removePaymentByInvoice, RECURRING_FREQUENCIES } = finance;
  const { prospects, closeProspect, saveToBusinessDb } = sales;

  const [appointments, setAppointments] = useState(() => safeGetItem(STORAGE_KEY, []));
  const [clients, setClients] = useState(() => safeGetItem(CLIENTS_KEY, []));
  const [activityLog, setActivityLog] = useState(() => safeGetItem(ACTIVITY_LOG_KEY, []));
  const [timeEntries, setTimeEntries] = useState(() => safeGetItem(TIME_ENTRIES_KEY, []));
  const [emailTemplates, setEmailTemplates] = useState(() => safeGetItem(EMAIL_TEMPLATES_KEY, DEFAULT_EMAIL_TEMPLATES));
  const [notifications, setNotifications] = useState(() => safeGetItem(NOTIFICATIONS_KEY, []));

  useEffect(() => {
    safeSetItem(STORAGE_KEY, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    safeSetItem(CLIENTS_KEY, JSON.stringify(clients));
  }, [clients]);

  // Keep currentClient in sync when clients array changes
  useEffect(() => {
    if (!currentClient) return;
    const fresh = clients.find(c => c.id === currentClient.id);
    if (fresh && fresh !== currentClient) {
      const changed = JSON.stringify(fresh) !== JSON.stringify(currentClient);
      if (changed) setCurrentClient(fresh);
    }
  }, [clients, currentClient, setCurrentClient]);

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
  const logActivity = (action, details = {}) => {
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
  const addNotification = (notification) => {
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

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    syncToApi(() => notificationsApi.markRead(id), 'markNotificationRead');
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    syncToApi(() => notificationsApi.markAllRead(), 'markAllNotificationsRead');
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    syncToApi(() => notificationsApi.delete(id), 'deleteNotification');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    syncToApi(() => notificationsApi.clearAll(), 'clearAllNotifications');
  };

  // Wire up storage quota warnings → notification system
  useEffect(() => {
    onStorageWarning((key, usage) => {
      addNotification({
        type: 'warning',
        title: 'Storage Full',
        message: `Could not save ${key.replace('threeseas_', '')} data. Storage is at ${usage?.mb || '?'}MB. Try removing old documents or expenses with receipts.`,
      });
    });
    return () => onStorageWarning(null);
  }, []);

  // Time Tracking
  const addTimeEntry = (entry) => {
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

  const updateTimeEntry = (id, updates) => {
    setTimeEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    syncToApi(() => timeEntriesApi.update(id, updates), 'updateTimeEntry');
  };

  const deleteTimeEntry = (id) => {
    setTimeEntries((prev) => prev.filter((e) => e.id !== id));
    syncToApi(() => timeEntriesApi.delete(id), 'deleteTimeEntry');
  };

  const markTimeEntryBilled = (id) => {
    setTimeEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, billed: true, billedAt: new Date().toISOString() } : e))
    );
    syncToApi(() => timeEntriesApi.update(id, { billed: true, billedAt: new Date().toISOString() }), 'markTimeEntryBilled');
  };

  // Email Templates
  const addEmailTemplate = (template) => {
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

  const updateEmailTemplate = (id, updates) => {
    setEmailTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    syncToApi(() => emailTemplatesApi.update(id, updates), 'updateEmailTemplate');
  };

  const deleteEmailTemplate = (id) => {
    // Don't allow deleting default templates
    if (['invoice-reminder', 'appointment-confirmation', 'follow-up', 'project-complete', 'welcome'].includes(id)) {
      return { success: false, error: 'Cannot delete default templates' };
    }
    setEmailTemplates((prev) => prev.filter((t) => t.id !== id));
    syncToApi(() => emailTemplatesApi.delete(id), 'deleteEmailTemplate');
    return { success: true };
  };

  const resetEmailTemplates = () => {
    setEmailTemplates(DEFAULT_EMAIL_TEMPLATES);
  };

  // Appointments
  const addAppointment = (appointment) => {
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

  const updateAppointmentStatus = (id, status) => {
    setAppointments((prev) =>
      prev.map((appt) => (appt.id === id ? { ...appt, status } : appt))
    );
    syncToApi(() => appointmentsApi.updateStatus(id, status), 'updateAppointmentStatus');
  };

  const updateAppointment = (id, updates) => {
    setAppointments((prev) =>
      prev.map((appt) => (appt.id === id ? { ...appt, ...updates } : appt))
    );
    syncToApi(() => appointmentsApi.update(id, updates), 'updateAppointment');
  };

  const assignAppointment = (appointmentId, userId) => {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === appointmentId
          ? { ...appt, assignedTo: userId || null }
          : appt
      )
    );
    syncToApi(() => appointmentsApi.update(appointmentId, { assignedTo: userId || null }), 'assignAppointment');
  };

  const markFollowUp = (id, followUpData) => {
    setAppointments((prev) =>
      prev.map((appt) =>
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

  const updateFollowUp = (id, updates) => {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === id
          ? { ...appt, followUp: { ...appt.followUp, ...updates } }
          : appt
      )
    );
    syncToApi(() => appointmentsApi.update(id, { followUp: updates }), 'updateFollowUp');
  };

  const addFollowUpNote = (appointmentId, noteText) => {
    if (!noteText?.trim()) return;
    setAppointments((prev) =>
      prev.map((appt) => {
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

  const deleteFollowUpNote = (appointmentId, noteId) => {
    setAppointments((prev) =>
      prev.map((appt) => {
        if (appt.id !== appointmentId || !appt.followUp) return appt;
        return {
          ...appt,
          followUp: {
            ...appt.followUp,
            notes: (appt.followUp.notes || []).filter((n) => n.id !== noteId),
          },
        };
      })
    );
  };

  const deleteAppointment = (id) => {
    setAppointments((prev) => prev.filter((appt) => appt.id !== id));
    syncToApi(() => appointmentsApi.delete(id), 'deleteAppointment');
  };

  const getAppointmentsForDate = (dateStr) => {
    return appointments.filter((appt) => appt.date === dateStr);
  };

  // Clients
  const convertToClient = (appointmentId) => {
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return { success: false, error: 'Appointment not found' };

    const existing = clients.find(
      (c) => c.email.toLowerCase() === appt.email.toLowerCase()
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

  const addClientManually = (clientData) => {
    const existing = clients.find(
      (c) => c.email.toLowerCase() === clientData.email.toLowerCase()
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
      onboarding: { complete: false, welcomeEmailSent: false, startedAt: null, completedAt: null, completedBy: null },
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [...prev, newClient]);
    syncToApi(() => clientsApi.create(newClient), 'addClientManually');
    return { success: true, client: newClient };
  };

  const updateClient = (id, updates) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    syncToApi(() => clientsApi.update(id, updates), 'updateClient');
  };

  const addClientNote = (id, note) => {
    setClients((prev) =>
      prev.map((c) =>
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

  const deleteClientNote = (clientId, noteId) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, notes: (c.notes || []).filter((n) => n.id !== noteId) }
          : c
      )
    );
    syncToApi(() => clientsApi.deleteNote(clientId, noteId), 'deleteClientNote');
  };

  const addClientTag = (id, tag) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id && !(c.tags || []).includes(tag)
          ? { ...c, tags: [...(c.tags || []), tag] }
          : c
      )
    );
    syncToApi(() => clientsApi.addTag(id, tag), 'addClientTag');
  };

  const removeClientTag = (id, tag) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, tags: (c.tags || []).filter((t) => t !== tag) } : c
      )
    );
    syncToApi(() => clientsApi.removeTag(id, tag), 'removeClientTag');
  };

  // Document types for categorization
  const DOCUMENT_TYPES = {
    proposal: { label: 'Proposal', color: '#6366f1' },
    contract: { label: 'Contract', color: '#22c55e' },
    agreement: { label: 'Agreement', color: '#0ea5e9' },
    invoice: { label: 'Invoice', color: '#f59e0b' },
    receipt: { label: 'Receipt', color: '#8b5cf6' },
    report: { label: 'Report', color: '#ec4899' },
    other: { label: 'Other', color: '#6b7280' },
  };

  const addClientDocument = (clientId, document) => {
    const newDoc = {
      id: generateId(),
      name: document.name,
      type: document.type || 'other',
      description: document.description || '',
      fileData: document.fileData, // base64 encoded file
      fileType: document.fileType, // mime type
      fileSize: document.fileSize,
      uploadedBy: currentUser?.name || 'System',
      uploadedAt: new Date().toISOString(),
    };
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, documents: [...(c.documents || []), newDoc] }
          : c
      )
    );
    syncToApi(() => clientsApi.uploadDocument(clientId, document), 'addClientDocument');
    return { success: true, document: newDoc };
  };

  const updateClientDocument = (clientId, docId, updates) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              documents: (c.documents || []).map((d) =>
                d.id === docId ? { ...d, ...updates } : d
              ),
            }
          : c
      )
    );
  };

  const deleteClientDocument = (clientId, docId) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, documents: (c.documents || []).filter((d) => d.id !== docId) }
          : c
      )
    );
    syncToApi(() => clientsApi.deleteDocument(clientId, docId), 'deleteClientDocument');
  };

  const archiveClient = (id) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'archived', archivedAt: new Date().toISOString(), archivedBy: currentUser?.name || 'System' }
          : c
      )
    );
    syncToApi(() => clientsApi.archive(id), 'archiveClient');
  };

  const restoreClient = (id) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'active', archivedAt: null, archivedBy: null, restoredAt: new Date().toISOString() }
          : c
      )
    );
    syncToApi(() => clientsApi.restore(id), 'restoreClient');
  };

  const permanentlyDeleteClient = (id) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    syncToApi(() => clientsApi.delete(id), 'permanentlyDeleteClient');
  };

  // Keep deleteClient as alias for archiveClient for backward compatibility
  const deleteClient = archiveClient;

  const approveClient = (id) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const hasProfile = c.businessName && c.phone && c.street && c.city && c.state && c.zip;
        return {
          ...c,
          status: 'active',
          profileComplete: hasProfile ? true : c.profileComplete || false,
          approvedAt: new Date().toISOString(),
          approvedBy: currentUser?.name || 'Admin',
          onboarding: c.onboarding || { complete: false, welcomeEmailSent: false, startedAt: null, completedAt: null, completedBy: null },
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

      // Create default growth targets template
      const targets = safeGetItem('threeseas_bi_growth_targets', []);
      const hasTargets = targets.some((t) => t.clientId === id);
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
    } catch (e) {
      // BI template creation is non-critical — don't block approval
      console.warn('[BI] Template scaffold failed:', e.message);
    }
  };

  const rejectClient = (id) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    syncToApi(() => clientsApi.reject(id), 'rejectClient');
  };

  // Payments / Invoices
  const addInvoice = (clientId, invoice) => {
    const client = clients.find((c) => c.id === clientId);
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
      prev.map((c) =>
        c.id === clientId
          ? { ...c, invoices: [...(c.invoices || []), newInvoice] }
          : c
      )
    );
    syncToApi(() => invoicesApi.create(clientId, newInvoice), 'addInvoice');
    logActivity('invoice_created', { clientId, clientName: client?.name, amount: newInvoice.amount, title: invoice.title });
    return newInvoice;
  };

  // Generate next recurring invoice
  const generateRecurringInvoice = (clientId, invoiceId) => {
    const client = clients.find((c) => c.id === clientId);
    const invoice = client?.invoices?.find((i) => i.id === invoiceId);
    if (!invoice || !invoice.recurring) return null;

    const freq = RECURRING_FREQUENCIES.find((f) => f.value === invoice.frequency);
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
      prev.map((c) =>
        c.id === clientId
          ? { ...c, invoices: [...(c.invoices || []), newInvoice] }
          : c
      )
    );
    syncToApi(() => invoicesApi.generateRecurring(clientId, invoiceId), 'generateRecurringInvoice');

    // Update the original invoice's nextDueDate
    updateInvoice(clientId, invoiceId, { nextDueDate: nextDate.toISOString().split('T')[0] });

    logActivity('recurring_invoice_generated', { clientId, clientName: client?.name, amount: newInvoice.amount });
    return newInvoice;
  };

  const updateInvoice = (clientId, invoiceId, updates) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              invoices: (c.invoices || []).map((inv) =>
                inv.id === invoiceId ? { ...inv, ...updates } : inv
              ),
            }
          : c
      )
    );
    syncToApi(() => invoicesApi.update(clientId, invoiceId, updates), 'updateInvoice');
  };

  const markInvoicePaid = (clientId, invoiceId) => {
    const client = clients.find((c) => c.id === clientId);
    const invoice = client?.invoices?.find((i) => i.id === invoiceId);

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
        prev.map((c) =>
          c.id === clientId
            ? {
                ...c,
                invoices: (c.invoices || []).map((i) =>
                  i.id === invoiceId
                    ? { ...i, status: 'paid', paidAt: new Date().toISOString() }
                    : i
                ),
              }
            : c
        )
      );
      syncToApi(() => invoicesApi.markPaid(clientId, invoiceId), 'markInvoicePaid');

      // Log activity
      logActivity('invoice_paid', { clientId, clientName: client.name, amount: invoice.amount, invoiceId });

      // If recurring, generate the next invoice
      if (invoice.recurring) {
        setTimeout(() => generateRecurringInvoice(clientId, invoiceId), 100);
      }
    }
  };

  const unmarkInvoicePaid = (clientId, invoiceId) => {
    // Remove the associated payment record
    removePaymentByInvoice(invoiceId);

    // Set invoice status back to unpaid
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              invoices: (c.invoices || []).map((i) =>
                i.id === invoiceId ? { ...i, status: 'unpaid', paidAt: null } : i
              ),
            }
          : c
      )
    );
    syncToApi(() => invoicesApi.unmarkPaid(clientId, invoiceId), 'unmarkInvoicePaid');
  };

  const deleteInvoice = (clientId, invoiceId) => {
    // Remove associated payment record
    removePaymentByInvoice(invoiceId);

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, invoices: (c.invoices || []).filter((inv) => inv.id !== invoiceId) }
          : c
      )
    );
    syncToApi(() => invoicesApi.delete(clientId, invoiceId), 'deleteInvoice');
  };

  // Projects (all clients)
  const addProject = (clientId, project) => {
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
      prev.map((c) =>
        c.id === clientId
          ? { ...c, projects: [...(c.projects || []), newProject] }
          : c
      )
    );
    syncToApi(() => projectsApi.create({ ...newProject, clientId }), 'addProject');
    return newProject;
  };

  const updateProject = (clientId, projectId, updates) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p) =>
                p.id === projectId ? { ...p, ...updates } : p
              ),
            }
          : c
      )
    );
    syncToApi(() => projectsApi.update(projectId, updates), 'updateProject');
  };

  const deleteProject = (clientId, projectId) => {
    // Remove associated time entries
    setTimeEntries((prev) => prev.filter((te) => te.projectId !== projectId));

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, projects: (c.projects || []).filter((p) => p.id !== projectId) }
          : c
      )
    );
    syncToApi(() => projectsApi.delete(projectId), 'deleteProject');
  };

  const addProjectTask = (clientId, projectId, task) => {
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
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p) =>
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

  const updateProjectTask = (clientId, projectId, taskId, updates) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p) =>
                p.id === projectId
                  ? {
                      ...p,
                      tasks: (p.tasks || []).map((t) =>
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

  const deleteProjectTask = (clientId, projectId, taskId) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p) =>
                p.id === projectId
                  ? { ...p, tasks: (p.tasks || []).filter((t) => t.id !== taskId) }
                  : p
              ),
            }
          : c
      )
    );
    syncToApi(() => projectsApi.deleteTask(projectId, taskId), 'deleteProjectTask');
  };

  const addMilestone = (clientId, projectId, milestone) => {
    const newMilestone = {
      id: generateId(),
      title: milestone.title,
      dueDate: milestone.dueDate || '',
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p) =>
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

  const toggleMilestone = (clientId, projectId, milestoneId) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p) =>
                p.id === projectId
                  ? {
                      ...p,
                      milestones: (p.milestones || []).map((m) =>
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

  const deleteMilestone = (clientId, projectId, milestoneId) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p) =>
                p.id === projectId
                  ? { ...p, milestones: (p.milestones || []).filter((m) => m.id !== milestoneId) }
                  : p
              ),
            }
          : c
      )
    );
    syncToApi(() => projectsApi.deleteMilestone(projectId, milestoneId), 'deleteMilestone');
  };

  // Developer assignment to projects
  const assignDeveloperToProject = (clientId, projectId, userId) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p) =>
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

  const removeDeveloperFromProject = (clientId, projectId, userId) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              projects: (c.projects || []).map((p) =>
                p.id === projectId
                  ? { ...p, developers: (p.developers || []).filter((id) => id !== userId) }
                  : p
              ),
            }
          : c
      )
    );
    syncToApi(() => projectsApi.removeDeveloper(projectId, userId), 'removeDeveloperFromProject');
  };

  // Project completion workflow
  const completeProject = (clientId, projectId, options = {}) => {
    const client = clients.find((c) => c.id === clientId);
    const project = client?.projects?.find((p) => p.id === projectId);
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


  // Onboarding
  const completeOnboarding = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, onboarding: { ...c.onboarding, complete: true, completedAt: new Date().toISOString(), completedBy: currentUser?.name || 'Admin' } }
          : c
      )
    );
    syncToApi(() => clientsApi.update(clientId, { onboarding: { ...client.onboarding, complete: true, completedAt: new Date().toISOString(), completedBy: currentUser?.name || 'Admin' } }), 'completeOnboarding');
    logActivity('onboarding_completed', { clientId, clientName: client.name });
    addNotification({ type: 'success', title: 'Onboarding Complete', message: `${client.name} has been fully onboarded` });
  };

  const updateClientOnboarding = (clientId, updates) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, onboarding: { ...c.onboarding, ...updates } }
          : c
      )
    );
    syncToApi(() => clientsApi.update(clientId, { onboarding: updates }), 'updateClientOnboarding');
  };

  // Convert prospect to client (cross-context: reads from SalesContext, writes to clients)
  const convertProspectToClient = (prospectId) => {
    const prospect = prospects.find((p) => p.id === prospectId);
    if (!prospect) return { success: false, error: 'Prospect not found' };

    // Check for existing client only if prospect has email
    if (prospect.email) {
      const existingClient = clients.find((c) => c.email && c.email.toLowerCase() === prospect.email.toLowerCase());
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
      onboarding: { complete: false, welcomeEmailSent: false, startedAt: null, completedAt: null, completedBy: null },
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
  const registerClient = (data) => {
    const existing = clients.find(
      (c) => c.email.toLowerCase() === data.email.toLowerCase()
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

  const clientLogin = (email, password) => {
    const result = auth.clientLogin(email, password, clients);
    // Handle plaintext password migration if needed
    if (result.migrateFn) {
      setClients((prev) => prev.map((x) => x.id === result.migrateFn.id ? { ...x, password: result.migrateFn.hashed } : x));
    }
    return result;
  };

  const checkClientEmail = (email) => {
    return clients.some((c) => c.email.toLowerCase() === email.toLowerCase());
  };

  const clientLogout = () => auth.clientLogout();

  const recordPayment = (clientId, paymentData) => {
    const payment = finance.recordPayment(clientId, paymentData);

    // Auto-create a paid invoice on the client
    const invoice = {
      id: (Date.now() + 1).toString(),
      title: `${paymentData.service} - ${paymentData.serviceTier}`,
      amount: paymentData.amount,
      status: 'paid',
      dueDate: '',
      description: `Payment via ${paymentData.method}`,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    };
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, invoices: [...(c.invoices || []), invoice] }
          : c
      )
    );

    return payment;
  };

  const updateClientTier = (clientId, tier) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, tier } : c))
    );
    syncToApi(() => clientsApi.update(clientId, { tier }), 'updateClientTier');
    if (currentClient?.id === clientId) {
      setCurrentClient((prev) => ({ ...prev, tier }));
    }
  };

  return (
    <AppContext.Provider
      value={{
        // Appointments
        appointments,
        addAppointment,
        updateAppointmentStatus,
        updateAppointment,
        assignAppointment,
        markFollowUp,
        updateFollowUp,
        addFollowUpNote,
        deleteFollowUpNote,
        deleteAppointment,
        getAppointmentsForDate,
        // Clients
        clients,
        convertToClient,
        addClientManually,
        updateClient,
        addClientNote,
        deleteClientNote,
        addClientTag,
        removeClientTag,
        addClientDocument,
        updateClientDocument,
        deleteClientDocument,
        DOCUMENT_TYPES,
        deleteClient,
        archiveClient,
        restoreClient,
        permanentlyDeleteClient,
        approveClient,
        rejectClient,
        // Onboarding
        completeOnboarding,
        updateClientOnboarding,
        // Invoices
        addInvoice,
        updateInvoice,
        markInvoicePaid,
        unmarkInvoicePaid,
        deleteInvoice,
        // Projects
        addProject,
        updateProject,
        deleteProject,
        addProjectTask,
        updateProjectTask,
        deleteProjectTask,
        addMilestone,
        toggleMilestone,
        deleteMilestone,
        assignDeveloperToProject,
        removeDeveloperFromProject,
        completeProject,
        // Finance (cross-context: invoices mutate clients)
        recordPayment,
        updateClientTier,
        // Cross-context: prospect → client conversion
        convertProspectToClient,
        // Client Portal
        registerClient,
        checkClientEmail,
        clientLogin,
        clientLogout,
        // Activity Log
        activityLog,
        logActivity,
        clearActivityLog,
        // Notifications
        notifications,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearAllNotifications,
        // Time Tracking
        timeEntries,
        addTimeEntry,
        updateTimeEntry,
        deleteTimeEntry,
        markTimeEntryBilled,
        // Email Templates
        emailTemplates,
        addEmailTemplate,
        updateEmailTemplate,
        deleteEmailTemplate,
        resetEmailTemplates,
        DEFAULT_EMAIL_TEMPLATES,
        // Recurring Invoices
        generateRecurringInvoice,
      }}
    >
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
