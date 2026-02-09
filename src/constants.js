// Collision-resistant ID generator
export const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Site info — single source of truth for contact details
export const SITE_INFO = {
  phone: '',       // TODO: Add your real phone number
  email: 'hello@threeseasdigital.com',
  address: '',     // TODO: Add your real business address
  name: 'Three Seas Digital',
};

// Safe localStorage wrappers — handle quota exceeded and corrupted data
let _storageWarningCallback = null;

export function onStorageWarning(callback) {
  _storageWarningCallback = callback;
}

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
      if (_storageWarningCallback) {
        _storageWarningCallback(key);
      }
    }
    return false;
  }
}

export function safeGetItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Fetch with timeout — prevents hanging requests to external APIs
export function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

export function getStorageUsage() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    total += (localStorage.getItem(key) || '').length * 2; // UTF-16 = 2 bytes/char
  }
  return { bytes: total, mb: (total / (1024 * 1024)).toFixed(2) };
}
