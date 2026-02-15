// Fire-and-forget API sync utility.
// After each context mutation updates localStorage, we also fire the
// corresponding API call in the background. Failures are silently
// logged — localStorage remains the authoritative source.

import { isApiAvailable } from './useApi.js';

// Fire-and-forget: run an async API call, swallow errors.
export async function syncToApi(apiFn, label = '') {
  try {
    const available = await isApiAvailable();
    if (!available) return;
    await apiFn();
  } catch (err) {
    console.warn(`[Sync] ${label} failed:`, err.message);
  }
}

// Batch version: fire multiple sync calls in parallel
export async function syncAllToApi(calls) {
  try {
    const available = await isApiAvailable();
    if (!available) return;
    await Promise.allSettled(
      calls.map(({ fn, label }) =>
        fn().catch((err) => console.warn(`[Sync] ${label} failed:`, err.message))
      )
    );
  } catch {
    // Top-level failure — silently ignore
  }
}
