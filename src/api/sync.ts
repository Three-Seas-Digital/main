// API Sync Layer
// This module provides background sync between localStorage state and the API.
// It does NOT replace the existing contexts — it runs alongside them,
// pushing changes to the API when available and pulling on startup.
//
// Usage: import { initSync } from './api/sync' in App.jsx
// Call initSync() once after providers are mounted.

import { authApi } from './auth';
import { clientAuthApi } from './clientAuth';
import { clientsApi } from './clients';
import { appointmentsApi } from './appointments';
import { invoicesApi } from './invoices';
import { projectsApi } from './projects';
import { prospectsApi } from './prospects';
import { leadsApi } from './leads';
import { expensesApi } from './expenses';
import { paymentsApi } from './payments';
import { timeEntriesApi } from './timeEntries';
import { emailTemplatesApi } from './emailTemplates';
import { notificationsApi } from './notifications';
import { activityLogApi } from './activityLog';
import { businessDbApi } from './businessDb';
import { researchApi } from './research';
import { usersApi } from './users';
import { isApiAvailable } from './useApi';

interface ApiService {
  getAll?: (...args: any[]) => Promise<any>;
  create?: (...args: any[]) => Promise<any>;
  [key: string]: any;
}

interface SyncEntry {
  api: ApiService;
  label: string;
}

interface SyncResult {
  status: string;
  count?: number;
  message?: string;
  created?: number;
  errors?: number;
  reason?: string;
}

type SyncResults = Record<string, SyncResult>;
type SyncCallback = (results: SyncResults) => void;

// Maps localStorage keys to their API service and expected data shape
const SYNC_MAP: Record<string, SyncEntry> = {
  threeseas_users: { api: usersApi, label: 'users' },
  threeseas_clients: { api: clientsApi, label: 'clients' },
  threeseas_appointments: { api: appointmentsApi, label: 'appointments' },
  threeseas_payments: { api: paymentsApi, label: 'payments' },
  threeseas_expenses: { api: expensesApi, label: 'expenses' },
  threeseas_leads: { api: leadsApi, label: 'leads' },
  threeseas_prospects: { api: prospectsApi, label: 'prospects' },
  threeseas_time_entries: { api: timeEntriesApi, label: 'time entries' },
  threeseas_email_templates: { api: emailTemplatesApi, label: 'email templates' },
  threeseas_notifications: { api: notificationsApi, label: 'notifications' },
};

let _syncing = false;
let _syncCallbacks: SyncCallback[] = [];

export function onSyncComplete(cb: SyncCallback): () => void {
  _syncCallbacks.push(cb);
  return () => {
    _syncCallbacks = _syncCallbacks.filter(fn => fn !== cb);
  };
}

// Pull data from API and update localStorage (initial sync on app load)
export async function pullFromApi(): Promise<{ synced: boolean; reason?: string; results?: SyncResults }> {
  // Don't attempt to pull protected data when no user is logged in
  const hasToken = !!localStorage.getItem('threeseas_access_token');
  if (!hasToken) return { synced: false, reason: 'No auth token' };

  const available = await isApiAvailable();
  if (!available) return { synced: false, reason: 'API unavailable' };

  if (_syncing) return { synced: false, reason: 'Already syncing' };
  _syncing = true;

  const results: SyncResults = {};

  try {
    // Pull each entity type in parallel
    const entries = Object.entries(SYNC_MAP);
    const promises = entries.map(async ([storageKey, { api, label }]) => {
      try {
        if (typeof api.getAll === 'function') {
          const data = await api.getAll();
          // Only update localStorage if API returned data
          if (Array.isArray(data) && data.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(data));
            results[label] = { status: 'ok', count: data.length };
          } else {
            results[label] = { status: 'empty' };
          }
        }
      } catch (err) {
        results[label] = { status: 'error', message: (err as Error).message };
      }
    });

    await Promise.allSettled(promises);
  } finally {
    _syncing = false;
    _syncCallbacks.forEach(cb => cb(results));
  }

  return { synced: true, results };
}

// Push localStorage data to API (one-time upload for migration)
export async function pushToApi(): Promise<{ pushed: boolean; reason?: string; results?: SyncResults }> {
  const available = await isApiAvailable();
  if (!available) return { pushed: false, reason: 'API unavailable' };

  const results: SyncResults = {};

  for (const [storageKey, { api, label }] of Object.entries(SYNC_MAP)) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        results[label] = { status: 'skipped', reason: 'No local data' };
        continue;
      }

      const items = JSON.parse(raw);
      if (!Array.isArray(items) || items.length === 0) {
        results[label] = { status: 'skipped', reason: 'Empty array' };
        continue;
      }

      // Push each item individually
      let created = 0;
      let errors = 0;
      for (const item of items) {
        try {
          if (typeof api.create === 'function') {
            await api.create(item);
            created++;
          }
        } catch {
          errors++;
        }
      }
      results[label] = { status: 'ok', created, errors };
    } catch (err) {
      results[label] = { status: 'error', message: (err as Error).message };
    }
  }

  return { pushed: true, results };
}

// Initialize sync: check API availability and pull if available
export async function initSync(): Promise<{ mode: string; synced?: boolean; results?: SyncResults }> {
  // Skip sync entirely when no admin is logged in
  const hasToken = !!localStorage.getItem('threeseas_access_token');
  if (!hasToken) {
    console.log('[Sync] No auth token, skipping sync');
    return { mode: 'local' };
  }

  const available = await isApiAvailable();
  if (!available) {
    console.log('[Sync] API not available, running in localStorage-only mode');
    return { mode: 'local' };
  }

  console.log('[Sync] API available, pulling latest data...');
  const result = await pullFromApi();
  console.log('[Sync] Pull complete:', result);
  return { mode: 'api', ...result };
}

// Export individual API services for direct use
export {
  authApi,
  clientAuthApi,
  clientsApi,
  appointmentsApi,
  invoicesApi,
  projectsApi,
  prospectsApi,
  leadsApi,
  expensesApi,
  paymentsApi,
  timeEntriesApi,
  emailTemplatesApi,
  notificationsApi,
  activityLogApi,
  businessDbApi,
  researchApi,
  usersApi,
};
