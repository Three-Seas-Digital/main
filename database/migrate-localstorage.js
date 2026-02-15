// ============================================================
// Three Seas Digital — localStorage → SQL Migration Script
// Usage: node database/migrate-localstorage.js <export.json> [output.sql]
// No npm dependencies required — Node.js 18+ ESM only
// ============================================================

import { readFileSync, writeFileSync } from 'fs';

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node migrate-localstorage.js <export.json> [output.sql]');
  console.error('  Reads a JSON export of localStorage and outputs SQL INSERT statements.');
  console.error('  If output.sql is omitted, writes to stdout.');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(readFileSync(inputFile, 'utf-8'));
} catch (err) {
  console.error(`Error reading ${inputFile}: ${err.message}`);
  process.exit(1);
}

const output = [];
let totalInserts = 0;

// ── Helpers ─────────────────────────────────────────────────

/** Escape a value for SQL single-quoted strings. */
function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'number') return val.toString();
  return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

/** Escape a date/datetime value to 'YYYY-MM-DD HH:MM:SS' or NULL. */
function escDate(val) {
  if (!val) return 'NULL';
  const d = new Date(val);
  if (isNaN(d.getTime())) return 'NULL';
  // Format: YYYY-MM-DD HH:MM:SS
  return esc(d.toISOString().slice(0, 19).replace('T', ' '));
}

/** Escape a date-only value to 'YYYY-MM-DD' or NULL. */
function escDateOnly(val) {
  if (!val) return 'NULL';
  // If already YYYY-MM-DD, use as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return esc(val);
  const d = new Date(val);
  if (isNaN(d.getTime())) return 'NULL';
  return esc(d.toISOString().slice(0, 10));
}

/** Escape a JSON value for storage in a JSON column. */
function escJSON(val) {
  if (val === null || val === undefined) return 'NULL';
  return esc(JSON.stringify(val));
}

/** Safely get an array from the export, handling null/missing keys. */
function getArr(key) {
  const val = data[key];
  if (Array.isArray(val)) return val;
  return [];
}

/** Safely get an object/array from the export. */
function getObj(key) {
  const val = data[key];
  if (val && typeof val === 'object') return val;
  return Array.isArray(val) ? val : [];
}

/** Push an INSERT statement and increment count. */
function insert(table, columns, values) {
  output.push(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`);
  totalInserts++;
}

// ── Header ──────────────────────────────────────────────────

output.push('-- ============================================================');
output.push('-- Three Seas Digital — localStorage Migration');
output.push(`-- Generated: ${new Date().toISOString()}`);
output.push(`-- Source: ${inputFile}`);
output.push('-- ============================================================');
output.push('-- NOTE: User passwords are set to a placeholder hash.');
output.push('-- You MUST rehash all passwords with bcrypt before production use.');
output.push('-- NOTE: Document file data (base64) is NOT migrated.');
output.push('-- Re-upload documents after migration.');
output.push('-- ============================================================');
output.push('');
output.push('SET FOREIGN_KEY_CHECKS = 0;');
output.push('');

// ── 1. Users ────────────────────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 1. users');
output.push('-- WARNING: password_hash is the original localStorage hash.');
output.push('-- Rehash with bcrypt before enabling authentication.');
output.push('-- ---------------------------------------------------------');

const users = getArr('threeseas_users');
for (const u of users) {
  insert('users',
    ['id', 'username', 'email', 'name', 'password_hash', 'role', 'status', 'color', 'created_at'],
    [
      esc(u.id),
      esc(u.username || ''),
      esc(u.email || ''),
      esc(u.name || ''),
      esc(u.password || 'NEEDS_REHASH'),
      esc(u.role || 'pending'),
      esc(u.status || 'pending'),
      esc(u.color || '#3b82f6'),
      escDate(u.createdAt),
    ]
  );
}
output.push('');

// ── 2. Clients (flat fields only) ───────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 2. clients');
output.push('-- ---------------------------------------------------------');

const clients = getArr('threeseas_clients');
for (const c of clients) {
  // Map source values: 'self-registration' -> 'signup'
  let source = c.source || 'manual';
  if (source === 'self-registration') source = 'signup';
  // Ensure source is one of the ENUM values
  if (!['manual', 'appointment', 'signup', 'prospect'].includes(source)) source = 'manual';

  // Build business_address from component fields
  const addrParts = [c.street, c.city, c.state, c.zip].filter(Boolean);
  const businessAddress = addrParts.length > 0 ? addrParts.join(', ') : (c.businessAddress || '');

  insert('clients',
    [
      'id', 'name', 'email', 'phone', 'password_hash',
      'service', 'tier', 'status', 'source',
      'source_prospect_id', 'source_appointment_id',
      'business_name', 'business_address', 'date_of_birth',
      'approved_at', 'approved_by', 'archived_at', 'archived_by', 'restored_at',
      'created_at',
    ],
    [
      esc(c.id),
      esc(c.name || ''),
      esc(c.email || ''),
      esc(c.phone || ''),
      esc(c.password || null),
      esc(c.service || ''),
      esc(c.tier || 'free'),
      esc(c.status || 'active'),
      esc(source),
      esc(c.sourceProspectId || null),
      esc(c.sourceAppointmentId || null),
      esc(c.businessName || ''),
      esc(businessAddress || ''),
      escDateOnly(c.dateOfBirth || null),
      escDate(c.approvedAt || null),
      esc(c.approvedBy || null),
      escDate(c.archivedAt || null),
      esc(c.archivedBy || null),
      escDate(c.restoredAt || null),
      escDate(c.createdAt),
    ]
  );
}
output.push('');

// ── 3. Client Notes ─────────────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 3. client_notes');
output.push('-- ---------------------------------------------------------');

for (const c of clients) {
  const notes = c.notes || [];
  for (const n of notes) {
    insert('client_notes',
      ['id', 'client_id', 'text', 'author', 'created_at'],
      [
        esc(n.id),
        esc(c.id),
        esc(n.text || ''),
        esc(n.author || 'System'),
        escDate(n.createdAt),
      ]
    );
  }
}
output.push('');

// ── 4. Client Tags ──────────────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 4. client_tags');
output.push('-- ---------------------------------------------------------');

for (const c of clients) {
  const tags = c.tags || [];
  for (const tag of tags) {
    if (!tag) continue;
    // client_tags uses AUTO_INCREMENT id, so we omit it
    insert('client_tags',
      ['client_id', 'tag'],
      [esc(c.id), esc(tag)]
    );
  }
}
output.push('');

// ── 5. Client Documents ─────────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 5. documents (client-owned)');
output.push('-- NOTE: file_path is NULL — base64 data was not migrated.');
output.push('-- ---------------------------------------------------------');

for (const c of clients) {
  const docs = c.documents || [];
  for (const d of docs) {
    insert('documents',
      ['id', 'owner_type', 'owner_id', 'name', 'type', 'description', 'file_path', 'file_type', 'file_size', 'uploaded_by', 'uploaded_at'],
      [
        esc(d.id),
        esc('client'),
        esc(c.id),
        esc(d.name || ''),
        esc(d.type || 'other'),
        esc(d.description || ''),
        'NULL', // file_path: base64 data skipped
        esc(d.fileType || null),
        d.fileSize ? d.fileSize.toString() : 'NULL',
        esc(d.uploadedBy || 'System'),
        escDate(d.uploadedAt),
      ]
    );
  }
}
output.push('');

// ── 6. Invoices ─────────────────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 6. invoices');
output.push('-- ---------------------------------------------------------');

for (const c of clients) {
  const invoices = c.invoices || [];
  for (const inv of invoices) {
    insert('invoices',
      [
        'id', 'client_id', 'title', 'amount', 'status',
        'due_date', 'description', 'recurring', 'frequency',
        'next_due_date', 'parent_invoice_id', 'paid_at', 'created_at',
      ],
      [
        esc(inv.id),
        esc(c.id),
        esc(inv.title || ''),
        inv.amount != null ? parseFloat(inv.amount).toString() : '0',
        esc(inv.status || 'unpaid'),
        escDateOnly(inv.dueDate || null),
        esc(inv.description || ''),
        inv.recurring ? '1' : '0',
        esc(inv.frequency || null),
        escDateOnly(inv.nextDueDate || null),
        esc(inv.parentInvoiceId || null),
        escDate(inv.paidAt || null),
        escDate(inv.createdAt),
      ]
    );
  }
}
output.push('');

// ── 7. Projects ─────────────────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 7. projects');
output.push('-- ---------------------------------------------------------');

for (const c of clients) {
  const projects = c.projects || [];
  for (const p of projects) {
    insert('projects',
      ['id', 'client_id', 'title', 'description', 'status', 'progress', 'start_date', 'due_date', 'created_at'],
      [
        esc(p.id),
        esc(c.id),
        esc(p.title || ''),
        esc(p.description || ''),
        esc(p.status || 'planning'),
        (p.progress || 0).toString(),
        escDateOnly(p.startDate || null),
        escDateOnly(p.dueDate || null),
        escDate(p.createdAt),
      ]
    );
  }
}
output.push('');

// ── 8. Project Tasks ────────────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 8. project_tasks');
output.push('-- ---------------------------------------------------------');

for (const c of clients) {
  const projects = c.projects || [];
  for (const p of projects) {
    const tasks = p.tasks || [];
    for (const t of tasks) {
      insert('project_tasks',
        ['id', 'project_id', 'title', 'status', 'goal', 'assignee', 'due_date', 'priority', 'created_at'],
        [
          esc(t.id),
          esc(p.id),
          esc(t.title || ''),
          esc(t.status || 'todo'),
          esc(t.goal || ''),
          esc(t.assignee || null),
          escDateOnly(t.dueDate || null),
          esc(t.priority || 'normal'),
          escDate(t.createdAt),
        ]
      );
    }
  }
}
output.push('');

// ── 9. Project Milestones ───────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 9. project_milestones');
output.push('-- ---------------------------------------------------------');

for (const c of clients) {
  const projects = c.projects || [];
  for (const p of projects) {
    const milestones = p.milestones || [];
    for (const m of milestones) {
      insert('project_milestones',
        ['id', 'project_id', 'title', 'due_date', 'completed', 'created_at'],
        [
          esc(m.id),
          esc(p.id),
          esc(m.title || ''),
          escDateOnly(m.dueDate || null),
          m.completed ? '1' : '0',
          escDate(m.createdAt),
        ]
      );
    }
  }
}
output.push('');

// ── 10. Project Developers ──────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 10. project_developers');
output.push('-- ---------------------------------------------------------');

for (const c of clients) {
  const projects = c.projects || [];
  for (const p of projects) {
    const devs = p.developers || [];
    for (const userId of devs) {
      if (!userId) continue;
      insert('project_developers',
        ['project_id', 'user_id'],
        [esc(p.id), esc(userId)]
      );
    }
  }
}
output.push('');

// ── 11. Appointments + Follow-Up Notes ──────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 11. appointments');
output.push('-- ---------------------------------------------------------');

const appointments = getArr('threeseas_appointments');
for (const a of appointments) {
  const fu = a.followUp || {};
  insert('appointments',
    [
      'id', 'name', 'email', 'phone', 'service', 'message',
      'date', 'time', 'status', 'assigned_to', 'converted_to_client',
      'follow_up_status', 'follow_up_date', 'follow_up_priority',
      'created_at',
    ],
    [
      esc(a.id),
      esc(a.name || ''),
      esc(a.email || ''),
      esc(a.phone || ''),
      esc(a.service || ''),
      esc(a.message || ''),
      escDateOnly(a.date),
      esc(a.time || ''),
      esc(a.status || 'pending'),
      esc(a.assignedTo || null),
      esc(a.convertedToClient || null),
      a.followUp ? esc(fu.status || 'pending') : 'NULL',
      a.followUp ? escDateOnly(fu.followUpDate || null) : 'NULL',
      a.followUp ? esc(fu.priority || 'medium') : 'NULL',
      escDate(a.createdAt),
    ]
  );
}
output.push('');

output.push('-- ---------------------------------------------------------');
output.push('-- 12. follow_up_notes');
output.push('-- ---------------------------------------------------------');

for (const a of appointments) {
  if (!a.followUp) continue;
  const notes = a.followUp.notes || [];
  for (const n of notes) {
    insert('follow_up_notes',
      ['id', 'appointment_id', 'text', 'author', 'created_at'],
      [
        esc(n.id),
        esc(a.id),
        esc(n.text || ''),
        esc(n.author || 'System'),
        escDate(n.createdAt),
      ]
    );
  }
}
output.push('');

// ── 12. Prospects + Notes + Documents ───────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 13. prospects');
output.push('-- ---------------------------------------------------------');

const prospects = getArr('threeseas_prospects');
for (const p of prospects) {
  insert('prospects',
    [
      'id', 'name', 'email', 'phone', 'service',
      'stage', 'deal_value', 'probability',
      'expected_close_date', 'outcome', 'loss_reason',
      'revisit_date', 'source', 'appointment_id',
      'closed_at', 'created_at', 'updated_at',
    ],
    [
      esc(p.id),
      esc(p.name || ''),
      esc(p.email || ''),
      esc(p.phone || ''),
      esc(p.service || ''),
      esc(p.stage || 'inquiry'),
      (p.dealValue || 0).toString(),
      (p.probability || 25).toString(),
      escDateOnly(p.expectedCloseDate || null),
      esc(p.outcome || null),
      esc(p.lossReason || null),
      escDateOnly(p.revisitDate || null),
      esc(p.source || 'manual'),
      esc(p.appointmentId || null),
      escDate(p.closedAt || null),
      escDate(p.createdAt),
      escDate(p.updatedAt),
    ]
  );
}
output.push('');

output.push('-- ---------------------------------------------------------');
output.push('-- 14. prospect_notes');
output.push('-- ---------------------------------------------------------');

for (const p of prospects) {
  const notes = p.notes || [];
  for (const n of notes) {
    insert('prospect_notes',
      ['id', 'prospect_id', 'text', 'author', 'created_at'],
      [
        esc(n.id),
        esc(p.id),
        esc(n.text || ''),
        esc(n.author || 'System'),
        escDate(n.createdAt),
      ]
    );
  }
}
output.push('');

output.push('-- ---------------------------------------------------------');
output.push('-- 15. documents (prospect-owned)');
output.push('-- NOTE: file_path is NULL — base64 data was not migrated.');
output.push('-- ---------------------------------------------------------');

for (const p of prospects) {
  const docs = p.documents || [];
  for (const d of docs) {
    insert('documents',
      ['id', 'owner_type', 'owner_id', 'name', 'type', 'description', 'file_path', 'file_type', 'file_size', 'uploaded_by', 'uploaded_at'],
      [
        esc(d.id),
        esc('prospect'),
        esc(p.id),
        esc(d.name || ''),
        esc(d.type || 'other'),
        esc(d.description || ''),
        'NULL', // file_path: base64 data skipped
        esc(d.fileType || null),
        d.fileSize ? d.fileSize.toString() : 'NULL',
        esc(d.uploadedBy || 'System'),
        escDate(d.uploadedAt),
      ]
    );
  }
}
output.push('');

// ── 13. Leads + Lead Notes ──────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 16. leads');
output.push('-- ---------------------------------------------------------');

const leads = getArr('threeseas_leads');
for (const l of leads) {
  insert('leads',
    [
      'id', 'business_name', 'address', 'phone', 'email',
      'type', 'website', 'status', 'source', 'coordinates',
      'created_at', 'updated_at',
    ],
    [
      esc(l.id),
      esc(l.businessName || ''),
      esc(l.address || ''),
      esc(l.phone || ''),
      esc(l.email || ''),
      esc(l.type || ''),
      esc(l.website || ''),
      esc(l.status || 'new'),
      esc(l.source || 'manual'),
      escJSON(l.coordinates || null),
      escDate(l.createdAt),
      escDate(l.updatedAt),
    ]
  );
}
output.push('');

output.push('-- ---------------------------------------------------------');
output.push('-- 17. lead_notes');
output.push('-- ---------------------------------------------------------');

for (const l of leads) {
  const notes = l.notes || [];
  for (const n of notes) {
    insert('lead_notes',
      ['id', 'lead_id', 'text', 'author', 'created_at'],
      [
        esc(n.id),
        esc(l.id),
        esc(n.text || ''),
        esc(n.author || 'System'),
        escDate(n.createdAt),
      ]
    );
  }
}
output.push('');

// ── 14. Expenses ────────────────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 18. expenses');
output.push('-- NOTE: receipt_path is NULL — base64 receipt data was not migrated.');
output.push('-- ---------------------------------------------------------');

const expenses = getArr('threeseas_expenses');
for (const e of expenses) {
  insert('expenses',
    [
      'id', 'category', 'amount', 'description', 'date',
      'receipt_path', 'receipt_name', 'vendor', 'created_by', 'created_at',
    ],
    [
      esc(e.id),
      esc(e.category || 'receipts'),
      e.amount != null ? parseFloat(e.amount).toString() : '0',
      esc(e.description || ''),
      escDateOnly(e.date),
      'NULL', // receipt_path: base64 data skipped
      esc(e.receiptName || ''),
      esc(e.vendor || ''),
      esc(e.createdBy || 'Unknown'),
      escDate(e.createdAt),
    ]
  );
}
output.push('');

// ── 15. Payments ────────────────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 19. payments');
output.push('-- ---------------------------------------------------------');

const payments = getArr('threeseas_payments');
for (const p of payments) {
  insert('payments',
    [
      'id', 'client_id', 'invoice_id', 'client_name',
      'service', 'service_tier', 'amount', 'method', 'status', 'created_at',
    ],
    [
      esc(p.id),
      esc(p.clientId || ''),
      esc(p.invoiceId || null),
      esc(p.clientName || ''),
      esc(p.service || ''),
      esc(p.serviceTier || ''),
      p.amount != null ? parseFloat(p.amount).toString() : '0',
      esc(p.method || 'invoice'),
      esc(p.status || 'completed'),
      escDate(p.createdAt),
    ]
  );
}
output.push('');

// ── 16. Time Entries ────────────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 20. time_entries');
output.push('-- ---------------------------------------------------------');

const timeEntries = getArr('threeseas_time_entries');
for (const te of timeEntries) {
  insert('time_entries',
    [
      'id', 'client_id', 'project_id', 'task_id',
      'user_id', 'user_name', 'description',
      'hours', 'date', 'billable', 'billed', 'billed_at', 'created_at',
    ],
    [
      esc(te.id),
      esc(te.clientId || null),
      esc(te.projectId || null),
      esc(te.taskId || null),
      esc(te.userId || null),
      esc(te.userName || ''),
      esc(te.description || ''),
      te.hours != null ? parseFloat(te.hours).toString() : '0',
      escDateOnly(te.date),
      te.billable !== false ? '1' : '0',
      te.billed ? '1' : '0',
      escDate(te.billedAt || null),
      escDate(te.createdAt),
    ]
  );
}
output.push('');

// ── 17. Email Templates ─────────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 21. email_templates');
output.push('-- ---------------------------------------------------------');

const DEFAULT_IDS = ['invoice-reminder', 'appointment-confirmation', 'follow-up', 'project-complete', 'welcome'];
const emailTemplates = getArr('threeseas_email_templates');
for (const et of emailTemplates) {
  const isDefault = DEFAULT_IDS.includes(et.id);
  insert('email_templates',
    ['id', 'name', 'subject', 'body', 'category', 'is_default', 'created_at'],
    [
      esc(et.id),
      esc(et.name || ''),
      esc(et.subject || ''),
      esc(et.body || ''),
      esc(et.category || 'general'),
      isDefault ? '1' : '0',
      escDate(et.createdAt),
    ]
  );
}
output.push('');

// ── 18. Notifications (skipped — ephemeral) ─────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 22. notifications — SKIPPED (ephemeral data)');
output.push('-- Uncomment the section below if you want to migrate them.');
output.push('-- ---------------------------------------------------------');

const notifications = getArr('threeseas_notifications');
if (notifications.length > 0) {
  output.push('/*');
  for (const n of notifications) {
    output.push(`INSERT INTO notifications (id, user_id, type, title, message, link, is_read, created_at) VALUES (${[
      esc(n.id),
      'NULL', // user_id not tracked per-user in localStorage
      esc(n.type || 'info'),
      esc(n.title || ''),
      esc(n.message || ''),
      esc(n.link || null),
      n.read ? '1' : '0',
      escDate(n.createdAt),
    ].join(', ')});`);
  }
  output.push('*/');
}
output.push('');

// ── 19. Activity Log ────────────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 23. activity_log');
output.push('-- ---------------------------------------------------------');

const activityLog = getArr('threeseas_activity_log');
for (const a of activityLog) {
  insert('activity_log',
    ['id', 'action', 'details', 'user_id', 'user_name', 'created_at'],
    [
      esc(a.id),
      esc(a.action || ''),
      escJSON(a.details || null),
      esc(a.userId || null),
      esc(a.userName || 'System'),
      escDate(a.createdAt),
    ]
  );
}
output.push('');

// ── 20. Business Database ───────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 24. business_database');
output.push('-- ---------------------------------------------------------');

const bizDb = getObj('threeseas_business_database');
const bizArr = Array.isArray(bizDb) ? bizDb : Object.values(bizDb);
for (const b of bizArr) {
  if (!b || typeof b !== 'object') continue;
  insert('business_database',
    [
      'id', 'lookup_key', 'name', 'address', 'phone',
      'website', 'type', 'coordinates', 'enrichment',
      'source', 'created_at', 'updated_at',
    ],
    [
      esc(b.id),
      esc(b.key || ''),
      esc(b.name || ''),
      esc(b.address || ''),
      esc(b.phone || ''),
      esc(b.website || ''),
      esc(b.type || ''),
      escJSON(b.coordinates || null),
      escJSON(b.enrichment || null),
      esc(b.source || 'manual'),
      escDate(b.createdAt),
      escDate(b.updatedAt),
    ]
  );
}
output.push('');

// ── 21. Market Research ─────────────────────────────────────

output.push('-- ---------------------------------------------------------');
output.push('-- 25. market_research');
output.push('-- ---------------------------------------------------------');

const research = getObj('threeseas_market_research');
const researchArr = Array.isArray(research) ? research : Object.values(research);
for (const r of researchArr) {
  if (!r || typeof r !== 'object') continue;
  // Store all research fields except id/key/createdAt/updatedAt as JSON data blob
  const { id, key, createdAt, updatedAt, location, ...rest } = r;
  insert('market_research',
    ['id', 'lookup_key', 'location', 'data', 'created_at', 'updated_at'],
    [
      esc(id),
      esc(key || ''),
      esc(location || ''),
      escJSON(rest),
      escDate(createdAt),
      escDate(updatedAt),
    ]
  );
}
output.push('');

// ── Footer ──────────────────────────────────────────────────

output.push('SET FOREIGN_KEY_CHECKS = 1;');
output.push('');
output.push(`-- ============================================================`);
output.push(`-- Migration complete. ${totalInserts} INSERT statements generated.`);
output.push(`-- ============================================================`);
output.push(`-- Summary:`);
output.push(`--   users:              ${users.length}`);
output.push(`--   clients:            ${clients.length}`);

let clientNotesCount = 0, clientTagsCount = 0, clientDocsCount = 0;
let invoicesCount = 0, projectsCount = 0, tasksCount = 0, milestonesCount = 0, devsCount = 0;
for (const c of clients) {
  clientNotesCount += (c.notes || []).length;
  clientTagsCount += (c.tags || []).length;
  clientDocsCount += (c.documents || []).length;
  invoicesCount += (c.invoices || []).length;
  const pjs = c.projects || [];
  projectsCount += pjs.length;
  for (const p of pjs) {
    tasksCount += (p.tasks || []).length;
    milestonesCount += (p.milestones || []).length;
    devsCount += (p.developers || []).length;
  }
}
output.push(`--   client_notes:       ${clientNotesCount}`);
output.push(`--   client_tags:        ${clientTagsCount}`);
output.push(`--   documents (client): ${clientDocsCount}`);
output.push(`--   invoices:           ${invoicesCount}`);
output.push(`--   projects:           ${projectsCount}`);
output.push(`--   project_tasks:      ${tasksCount}`);
output.push(`--   project_milestones: ${milestonesCount}`);
output.push(`--   project_developers: ${devsCount}`);
output.push(`--   appointments:       ${appointments.length}`);

let fuNotesCount = 0;
for (const a of appointments) {
  fuNotesCount += (a.followUp?.notes || []).length;
}
output.push(`--   follow_up_notes:    ${fuNotesCount}`);
output.push(`--   prospects:          ${prospects.length}`);

let prospectNotesCount = 0, prospectDocsCount = 0;
for (const p of prospects) {
  prospectNotesCount += (p.notes || []).length;
  prospectDocsCount += (p.documents || []).length;
}
output.push(`--   prospect_notes:     ${prospectNotesCount}`);
output.push(`--   documents (prosp):  ${prospectDocsCount}`);
output.push(`--   leads:              ${leads.length}`);

let leadNotesCount = 0;
for (const l of leads) {
  leadNotesCount += (l.notes || []).length;
}
output.push(`--   lead_notes:         ${leadNotesCount}`);
output.push(`--   expenses:           ${expenses.length}`);
output.push(`--   payments:           ${payments.length}`);
output.push(`--   time_entries:       ${timeEntries.length}`);
output.push(`--   email_templates:    ${emailTemplates.length}`);
output.push(`--   notifications:      ${notifications.length} (skipped)`);
output.push(`--   activity_log:       ${activityLog.length}`);
output.push(`--   business_database:  ${bizArr.length}`);
output.push(`--   market_research:    ${researchArr.length}`);
output.push(`-- ============================================================`);

// ── Output ──────────────────────────────────────────────────

const sql = output.join('\n');

if (process.argv[3]) {
  writeFileSync(process.argv[3], sql, 'utf-8');
  console.error(`Written ${totalInserts} INSERT statements to ${process.argv[3]}`);
} else {
  console.log(sql);
}
