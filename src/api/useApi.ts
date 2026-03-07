const API_AVAILABLE_KEY = 'threeseas_api_available';

let _apiAvailable: boolean | null = null;
let _lastCheck = 0;
const CHECK_INTERVAL = 60000;

export async function isApiAvailable(): Promise<boolean> {
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

  try {
    localStorage.setItem(API_AVAILABLE_KEY, JSON.stringify(_apiAvailable));
  } catch { /* ignore */ }

  return _apiAvailable!;
}

export async function tryApi<T>(
  apiFn: () => Promise<T>,
  localFn: () => T
): Promise<{ data: T; source: 'api' | 'local' }> {
  const available = await isApiAvailable();
  if (available) {
    try {
      const data = await apiFn();
      return { data, source: 'api' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('API call failed, using localStorage fallback:', message);
    }
  }
  const data = localFn();
  return { data, source: 'local' };
}

export function useLocalOnly(): boolean {
  return !_apiAvailable;
}

export function resetApiCheck(): void {
  _apiAvailable = null;
  _lastCheck = 0;
}
