// Dual-mode API utility: tries API first, falls back to localStorage.
// When the backend is unavailable, all operations silently fall back
// to the existing localStorage-based logic — zero disruption.

const API_AVAILABLE_KEY = 'threeseas_api_available';

// Cache the API availability check for 60 seconds
let _apiAvailable = null;
let _lastCheck = 0;
const CHECK_INTERVAL = 60000;

export async function isApiAvailable() {
  const now = Date.now();
  if (_apiAvailable !== null && now - _lastCheck < CHECK_INTERVAL) {
    return _apiAvailable;
  }

  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${baseUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
    _apiAvailable = res.ok;
  } catch {
    _apiAvailable = false;
  }
  _lastCheck = now;

  // Persist so other tabs can read it
  try {
    localStorage.setItem(API_AVAILABLE_KEY, JSON.stringify(_apiAvailable));
  } catch { /* ignore */ }

  return _apiAvailable;
}

// Try an API call; if it fails, run the localStorage fallback.
// Returns { data, source: 'api' | 'local' }
export async function tryApi(apiFn, localFn) {
  const available = await isApiAvailable();
  if (available) {
    try {
      const data = await apiFn();
      return { data, source: 'api' };
    } catch (err) {
      // API call failed — fall back to localStorage
      console.warn('API call failed, using localStorage fallback:', err.message);
    }
  }
  const data = localFn();
  return { data, source: 'local' };
}

// Synchronous fallback-only mode — for when we know API isn't ready
export function useLocalOnly() {
  return !_apiAvailable;
}

// Reset the API availability cache (e.g., after user changes settings)
export function resetApiCheck() {
  _apiAvailable = null;
  _lastCheck = 0;
}
