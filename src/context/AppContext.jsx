import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AppContext = createContext();

const STORAGE_KEY = 'threeseas_appointments';
const CLIENTS_KEY = 'threeseas_clients';
const PAYMENTS_KEY = 'threeseas_payments';
const EXPENSES_KEY = 'threeseas_expenses';
const LEADS_KEY = 'threeseas_leads';
const PROSPECTS_KEY = 'threeseas_prospects';
const BUSINESS_DB_KEY = 'threeseas_business_database';
const RESEARCH_KEY = 'threeseas_market_research';
const ACTIVITY_LOG_KEY = 'threeseas_activity_log';
const TIME_ENTRIES_KEY = 'threeseas_time_entries';
const EMAIL_TEMPLATES_KEY = 'threeseas_email_templates';
const NOTIFICATIONS_KEY = 'threeseas_notifications';

const PROSPECT_STAGES = [
  { value: 'inquiry', label: 'Inquiry', color: '#6b7280' },
  { value: 'booked', label: 'Booked', color: '#3b82f6' },
  { value: 'confirmed', label: 'Confirmed', color: '#8b5cf6' },
  { value: 'negotiating', label: 'Negotiating', color: '#f59e0b' },
  { value: 'closed', label: 'Closed', color: '#10b981' },
];

const LOSS_REASONS = [
  { value: 'budget', label: 'Budget constraints' },
  { value: 'timing', label: 'Bad timing' },
  { value: 'competitor', label: 'Chose competitor' },
  { value: 'no-response', label: 'No response' },
  { value: 'scope', label: 'Scope mismatch' },
  { value: 'other', label: 'Other' },
];

const EXPENSE_CATEGORIES = [
  { value: 'wages', label: 'Wages', color: '#3b82f6' },
  { value: 'fuel', label: 'Fuel', color: '#f59e0b' },
  { value: 'food', label: 'Food', color: '#10b981' },
  { value: 'meetings', label: 'Meetings', color: '#8b5cf6' },
  { value: 'trips', label: 'Trips', color: '#ec4899' },
  { value: 'receipts', label: 'Receipts / Other', color: '#6b7280' },
];

const SUBSCRIPTION_TIERS = {
  free: { label: 'Free', color: '#9ca3af', description: 'Basic access with limited features' },
  basic: { label: 'Basic', color: '#3b82f6', description: 'Essential tools for small businesses' },
  premium: { label: 'Premium', color: '#8b5cf6', description: 'Advanced features for growing teams' },
  enterprise: { label: 'Enterprise', color: '#f59e0b', description: 'Full suite with priority support' },
};

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

const RECURRING_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'biweekly', label: 'Bi-Weekly', days: 14 },
  { value: 'monthly', label: 'Monthly', days: 30 },
  { value: 'quarterly', label: 'Quarterly', days: 90 },
  { value: 'yearly', label: 'Yearly', days: 365 },
];

export function AppProvider({ children }) {
  const auth = useAuth();
  const { currentUser, currentClient, setCurrentClient, hashPassword } = auth;

  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem(CLIENTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem(PAYMENTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem(EXPENSES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem(LEADS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [prospects, setProspects] = useState(() => {
    const saved = localStorage.getItem(PROSPECTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [businessDatabase, setBusinessDatabase] = useState(() => {
    const saved = localStorage.getItem(BUSINESS_DB_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [marketResearch, setMarketResearch] = useState(() => {
    const saved = localStorage.getItem(RESEARCH_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [activityLog, setActivityLog] = useState(() => {
    const saved = localStorage.getItem(ACTIVITY_LOG_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [timeEntries, setTimeEntries] = useState(() => {
    const saved = localStorage.getItem(TIME_ENTRIES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [emailTemplates, setEmailTemplates] = useState(() => {
    const saved = localStorage.getItem(EMAIL_TEMPLATES_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_EMAIL_TEMPLATES;
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem(NOTIFICATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(PROSPECTS_KEY, JSON.stringify(prospects));
  }, [prospects]);

  useEffect(() => {
    localStorage.setItem(BUSINESS_DB_KEY, JSON.stringify(businessDatabase));
  }, [businessDatabase]);

  useEffect(() => {
    localStorage.setItem(RESEARCH_KEY, JSON.stringify(marketResearch));
  }, [marketResearch]);

  useEffect(() => {
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(activityLog));
  }, [activityLog]);

  useEffect(() => {
    localStorage.setItem(TIME_ENTRIES_KEY, JSON.stringify(timeEntries));
  }, [timeEntries]);

  useEffect(() => {
    localStorage.setItem(EMAIL_TEMPLATES_KEY, JSON.stringify(emailTemplates));
  }, [emailTemplates]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Activity Log - tracks all significant actions
  const logActivity = (action, details = {}) => {
    const entry = {
      id: Date.now().toString(),
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
      id: Date.now().toString(),
      type: notification.type, // 'warning', 'info', 'success', 'error'
      title: notification.title,
      message: notification.message,
      link: notification.link || null, // Optional link to navigate
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => setNotifications([]);

  // Time Tracking
  const addTimeEntry = (entry) => {
    const newEntry = {
      id: Date.now().toString(),
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
    logActivity('time_entry_added', { hours: newEntry.hours, projectId: entry.projectId });
    return newEntry;
  };

  const updateTimeEntry = (id, updates) => {
    setTimeEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const deleteTimeEntry = (id) => {
    setTimeEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const markTimeEntryBilled = (id) => {
    setTimeEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, billed: true, billedAt: new Date().toISOString() } : e))
    );
  };

  // Email Templates
  const addEmailTemplate = (template) => {
    const newTemplate = {
      id: Date.now().toString(),
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category || 'general',
      createdAt: new Date().toISOString(),
    };
    setEmailTemplates((prev) => [...prev, newTemplate]);
    return newTemplate;
  };

  const updateEmailTemplate = (id, updates) => {
    setEmailTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteEmailTemplate = (id) => {
    // Don't allow deleting default templates
    if (['invoice-reminder', 'appointment-confirmation', 'follow-up', 'project-complete', 'welcome'].includes(id)) {
      return { success: false, error: 'Cannot delete default templates' };
    }
    setEmailTemplates((prev) => prev.filter((t) => t.id !== id));
    return { success: true };
  };

  const resetEmailTemplates = () => {
    setEmailTemplates(DEFAULT_EMAIL_TEMPLATES);
  };

  // Appointments
  const addAppointment = (appointment) => {
    const newAppt = {
      id: Date.now().toString(),
      status: 'pending',
      followUp: null,
      createdAt: new Date().toISOString(),
      ...appointment,
    };
    setAppointments((prev) => [...prev, newAppt]);
    return newAppt;
  };

  const updateAppointmentStatus = (id, status) => {
    setAppointments((prev) =>
      prev.map((appt) => (appt.id === id ? { ...appt, status } : appt))
    );
  };

  const updateAppointment = (id, updates) => {
    setAppointments((prev) =>
      prev.map((appt) => (appt.id === id ? { ...appt, ...updates } : appt))
    );
  };

  const assignAppointment = (appointmentId, userId) => {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === appointmentId
          ? { ...appt, assignedTo: userId || null }
          : appt
      )
    );
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
  };

  const updateFollowUp = (id, updates) => {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === id
          ? { ...appt, followUp: { ...appt.followUp, ...updates } }
          : appt
      )
    );
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
                id: Date.now().toString(),
                text: noteText.trim(),
                author: currentUser?.name || 'System',
                createdAt: new Date().toISOString(),
              },
            ],
          },
        };
      })
    );
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
      id: Date.now().toString(),
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
      id: Date.now().toString(),
      status: 'active',
      source: 'manual',
      notes: [],
      tags: [],
      invoices: [],
      projects: [],
      documents: [],
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [...prev, newClient]);
    return { success: true, client: newClient };
  };

  const updateClient = (id, updates) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
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
                  id: Date.now().toString(),
                  text: note,
                  author: currentUser?.name || 'System',
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : c
      )
    );
  };

  const deleteClientNote = (clientId, noteId) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, notes: (c.notes || []).filter((n) => n.id !== noteId) }
          : c
      )
    );
  };

  const addClientTag = (id, tag) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id && !(c.tags || []).includes(tag)
          ? { ...c, tags: [...(c.tags || []), tag] }
          : c
      )
    );
  };

  const removeClientTag = (id, tag) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, tags: (c.tags || []).filter((t) => t !== tag) } : c
      )
    );
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
      id: Date.now().toString(),
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
  };

  const archiveClient = (id) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'archived', archivedAt: new Date().toISOString(), archivedBy: currentUser?.name || 'System' }
          : c
      )
    );
  };

  const restoreClient = (id) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'active', archivedAt: null, archivedBy: null, restoredAt: new Date().toISOString() }
          : c
      )
    );
  };

  const permanentlyDeleteClient = (id) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  // Keep deleteClient as alias for archiveClient for backward compatibility
  const deleteClient = archiveClient;

  const approveClient = (id) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'active', approvedAt: new Date().toISOString(), approvedBy: currentUser?.name || 'Admin' } : c
      )
    );
  };

  const rejectClient = (id) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  // Payments / Invoices
  const addInvoice = (clientId, invoice) => {
    const client = clients.find((c) => c.id === clientId);
    const newInvoice = {
      id: Date.now().toString(),
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

    const newInvoice = {
      ...invoice,
      id: Date.now().toString(),
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
  };

  const markInvoicePaid = (clientId, invoiceId) => {
    const client = clients.find((c) => c.id === clientId);
    const invoice = client?.invoices?.find((i) => i.id === invoiceId);

    if (invoice && invoice.status !== 'paid') {
      // Create payment record for revenue tracking
      const payment = {
        id: Date.now().toString(),
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
      setPayments((prev) => [...prev, payment]);

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
    setPayments((prev) => prev.filter((p) => p.invoiceId !== invoiceId));

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
  };

  const deleteInvoice = (clientId, invoiceId) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, invoices: (c.invoices || []).filter((inv) => inv.id !== invoiceId) }
          : c
      )
    );
  };

  // Projects (all clients)
  const addProject = (clientId, project) => {
    const newProject = {
      id: Date.now().toString(),
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
  };

  const deleteProject = (clientId, projectId) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, projects: (c.projects || []).filter((p) => p.id !== projectId) }
          : c
      )
    );
  };

  const addProjectTask = (clientId, projectId, task) => {
    const newTask = {
      id: Date.now().toString(),
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
  };

  const addMilestone = (clientId, projectId, milestone) => {
    const newMilestone = {
      id: Date.now().toString(),
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
          id: Date.now().toString(),
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

  // Expenses
  const addExpense = (data) => {
    if (!data.category || !data.amount || !data.date) {
      return { success: false, error: 'Category, amount, and date are required' };
    }
    const expense = {
      id: Date.now().toString(),
      category: data.category,
      amount: parseFloat(data.amount),
      description: data.description || '',
      date: data.date,
      receipt: data.receipt || null,
      receiptName: data.receiptName || '',
      vendor: data.vendor || '',
      createdBy: currentUser?.name || 'Unknown',
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [...prev, expense]);
    return { success: true, expense };
  };

  const updateExpense = (id, updates) => {
    const exists = expenses.find((e) => e.id === id);
    if (!exists) return { success: false, error: 'Expense not found' };
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    return { success: true };
  };

  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    return { success: true };
  };

  // Leads
  const addLead = (data) => {
    if (!data.businessName?.trim()) return { success: false, error: 'Business name is required' };
    const lead = {
      id: Date.now().toString(),
      businessName: data.businessName.trim(),
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      type: data.type || '',
      website: data.website || '',
      status: 'new',
      notes: [],
      source: data.source || 'manual',
      coordinates: data.coordinates || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLeads((prev) => [...prev, lead]);
    return { success: true, lead };
  };

  const updateLead = (id, updates) => {
    const exists = leads.find((l) => l.id === id);
    if (!exists) return { success: false, error: 'Lead not found' };
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l))
    );
    return { success: true };
  };

  const deleteLead = (id) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    return { success: true };
  };

  const addLeadNote = (id, text) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              updatedAt: new Date().toISOString(),
              notes: [
                ...l.notes,
                {
                  id: Date.now().toString(),
                  text,
                  author: currentUser?.name || 'System',
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : l
      )
    );
  };

  const deleteLeadNote = (leadId, noteId) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, notes: l.notes.filter((n) => n.id !== noteId) }
          : l
      )
    );
  };

  // Business Database (for storing researched business intel)
  const saveToBusinessDb = (data) => {
    // Create unique key from name + address
    const key = `${(data.name || '').toLowerCase().trim()}_${(data.address || '').toLowerCase().trim()}`;
    const existing = businessDatabase.find((b) => b.key === key);

    if (existing) {
      // Update existing entry
      setBusinessDatabase((prev) =>
        prev.map((b) => b.key === key ? {
          ...b,
          ...data,
          enrichment: { ...b.enrichment, ...data.enrichment },
          updatedAt: new Date().toISOString(),
        } : b)
      );
      return { success: true, updated: true };
    }

    // Create new entry
    const entry = {
      id: Date.now().toString(),
      key,
      name: data.name || '',
      address: data.address || '',
      phone: data.phone || '',
      website: data.website || '',
      type: data.type || '',
      coordinates: data.coordinates || null,
      enrichment: data.enrichment || {},
      source: data.source || 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBusinessDatabase((prev) => [...prev, entry]);
    return { success: true, entry };
  };

  const getFromBusinessDb = (name, address) => {
    const key = `${(name || '').toLowerCase().trim()}_${(address || '').toLowerCase().trim()}`;
    return businessDatabase.find((b) => b.key === key) || null;
  };

  const updateBusinessDb = (id, updates) => {
    setBusinessDatabase((prev) =>
      prev.map((b) => b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b)
    );
  };

  const deleteFromBusinessDb = (id) => {
    setBusinessDatabase((prev) => prev.filter((b) => b.id !== id));
  };

  // Market Research
  const saveResearch = (data) => {
    const key = `${(data.location || '').toLowerCase().trim()}`;
    const existing = marketResearch.find((r) => r.key === key);
    if (existing) {
      setMarketResearch((prev) =>
        prev.map((r) => r.key === key ? { ...r, ...data, updatedAt: new Date().toISOString() } : r)
      );
      return { success: true, updated: true };
    }
    const entry = {
      id: Date.now().toString(),
      key,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMarketResearch((prev) => [...prev, entry]);
    return { success: true, entry };
  };

  const updateResearch = (id, updates) => {
    setMarketResearch((prev) =>
      prev.map((r) => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)
    );
  };

  const deleteResearch = (id) => {
    setMarketResearch((prev) => prev.filter((r) => r.id !== id));
  };

  // Prospects / Pipeline
  const addProspect = (data) => {
    if (!data.name?.trim()) return { success: false, error: 'Name is required' };
    const newProspect = {
      id: Date.now().toString(),
      name: data.name.trim(),
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      service: data.service || '',
      stage: data.stage || 'inquiry',
      dealValue: data.dealValue || 0,
      probability: data.probability || 25,
      expectedCloseDate: data.expectedCloseDate || '',
      notes: data.notes || [], // Accept notes from previous stages
      documents: data.documents || [], // Accept documents from previous stages
      outcome: null, // 'won', 'lost', 'deferred'
      lossReason: '',
      revisitDate: '',
      source: data.source || 'manual', // 'manual', 'appointment', 'lead'
      appointmentId: data.appointmentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProspects((prev) => [newProspect, ...prev]);
    return { success: true, prospect: newProspect };
  };

  const updateProspect = (id, updates) => {
    setProspects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const deleteProspect = (id) => {
    setProspects((prev) => prev.filter((p) => p.id !== id));
  };

  const addProspectNote = (prospectId, noteText) => {
    if (!noteText?.trim()) return;
    setProspects((prev) =>
      prev.map((p) => {
        if (p.id !== prospectId) return p;
        return {
          ...p,
          notes: [
            ...p.notes,
            {
              id: Date.now().toString(),
              text: noteText.trim(),
              author: currentUser?.name || 'System',
              createdAt: new Date().toISOString(),
            },
          ],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteProspectNote = (prospectId, noteId) => {
    setProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId
          ? { ...p, notes: (p.notes || []).filter((n) => n.id !== noteId), updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const addProspectDocument = (prospectId, document) => {
    const newDoc = {
      id: Date.now().toString(),
      name: document.name,
      type: document.type || 'other',
      description: document.description || '',
      fileData: document.fileData,
      fileType: document.fileType,
      fileSize: document.fileSize,
      uploadedBy: currentUser?.name || 'System',
      uploadedAt: new Date().toISOString(),
    };
    setProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId
          ? { ...p, documents: [...(p.documents || []), newDoc], updatedAt: new Date().toISOString() }
          : p
      )
    );
    return { success: true, document: newDoc };
  };

  const deleteProspectDocument = (prospectId, docId) => {
    setProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId
          ? { ...p, documents: (p.documents || []).filter((d) => d.id !== docId), updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const closeProspect = (id, outcome, details = {}) => {
    setProspects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          stage: 'closed',
          outcome, // 'won', 'lost', 'deferred'
          lossReason: details.lossReason || '',
          revisitDate: details.revisitDate || '',
          closedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const reopenProspect = (id, stage = 'negotiating') => {
    setProspects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, stage, outcome: null, lossReason: '', closedAt: null, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

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
      id: Date.now().toString(),
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
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);
    closeProspect(prospectId, 'won');
    return { success: true, client: newClient };
  };

  // Client self-registration
  const registerClient = (data) => {
    const existing = clients.find(
      (c) => c.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existing) return { success: false, error: 'An account with this email already exists' };

    const newClient = {
      id: Date.now().toString(),
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
    const payment = {
      id: Date.now().toString(),
      clientId,
      service: paymentData.service,
      serviceTier: paymentData.serviceTier,
      amount: paymentData.amount,
      method: paymentData.method,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    setPayments((prev) => [...prev, payment]);

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
        // Finance
        payments,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        EXPENSE_CATEGORIES,
        recordPayment,
        updateClientTier,
        SUBSCRIPTION_TIERS,
        // Leads
        leads,
        addLead,
        updateLead,
        deleteLead,
        addLeadNote,
        deleteLeadNote,
        businessDatabase,
        saveToBusinessDb,
        getFromBusinessDb,
        updateBusinessDb,
        deleteFromBusinessDb,
        // Research
        marketResearch,
        saveResearch,
        updateResearch,
        deleteResearch,
        // Pipeline
        prospects,
        addProspect,
        updateProspect,
        deleteProspect,
        addProspectNote,
        deleteProspectNote,
        addProspectDocument,
        deleteProspectDocument,
        closeProspect,
        reopenProspect,
        convertProspectToClient,
        PROSPECT_STAGES,
        LOSS_REASONS,
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
        RECURRING_FREQUENCIES,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// useAppContext merges both AuthContext and AppContext for backward compatibility.
// Components can also use useAuth() directly for auth-only needs (better performance).
export const useAppContext = () => {
  const appCtx = useContext(AppContext);
  const authCtx = useAuth();
  return { ...authCtx, ...appCtx };
};
