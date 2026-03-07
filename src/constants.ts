// Escape HTML special characters to prevent XSS in print reports
export function escapeHtml(str: unknown): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Collision-resistant ID generator
export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Site info — single source of truth for contact details
export const SITE_INFO = {
  phone: '',
  email: 'contactus@threeseasdigital.com',
  address: '',
  name: 'Three Seas Digital',
} as const;

// Safe localStorage wrappers — handle quota exceeded and corrupted data
let _storageWarningCallback: ((key: string, usage: { bytes: number; mb: string }) => void) | null = null;

export function onStorageWarning(callback: (key: string, usage: { bytes: number; mb: string }) => void): void {
  _storageWarningCallback = callback;
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: unknown) {
    const err = e as { name?: string; code?: number };
    if (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014) {
      if (_storageWarningCallback) {
        _storageWarningCallback(key, getStorageUsage());
      }
    }
    return false;
  }
}

export function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Fetch with timeout — prevents hanging requests to external APIs
export function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

export function getStorageUsage(): { bytes: number; mb: string } {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    total += (localStorage.getItem(key!) || '').length * 2;
  }
  return { bytes: total, mb: (total / (1024 * 1024)).toFixed(2) };
}

export function canFitInStorage(value: string): boolean {
  const valueSize = new Blob([value]).size;
  const { bytes } = getStorageUsage();
  const estimatedLimit = 5 * 1024 * 1024;
  return bytes + valueSize < estimatedLimit;
}
