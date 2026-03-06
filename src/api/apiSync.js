// Fire-and-forget API sync utility.
// After each context mutation updates localStorage, we also fire the
// corresponding API call in the background. Failures are silently
// logged — localStorage remains the authoritative source.

// Fire-and-forget: run an async API call, swallow errors.
// Skips the health check if we have a JWT token — just try the call directly.
export async function syncToApi(apiFn, label = '') {
  try {
    const hasToken = !!localStorage.getItem('threeseas_access_token');
    if (!hasToken) return;
    await apiFn();
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data?.error || err.message;
    console.warn(`[Sync] ${label} failed${status ? ` (${status})` : ''}:`, detail);
  }
}

// Batch version: fire multiple sync calls in parallel
export async function syncAllToApi(calls) {
  try {
    const hasToken = !!localStorage.getItem('threeseas_access_token');
    if (!hasToken) return;
    await Promise.allSettled(
      calls.map(({ fn, label }) =>
        fn().catch((err) => console.warn(`[Sync] ${label} failed:`, err.message))
      )
    );
  } catch {
    // Top-level failure — silently ignore
  }
}
