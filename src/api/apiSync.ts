export async function syncToApi(apiFn: () => Promise<unknown>, label: string = ''): Promise<void> {
  try {
    const hasToken = !!localStorage.getItem('threeseas_access_token');
    if (!hasToken) return;
    await apiFn();
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number; data?: { error?: string } }; message?: string };
    const status = axiosErr.response?.status;
    const detail = axiosErr.response?.data?.error || axiosErr.message;
    console.warn(`[Sync] ${label} failed${status ? ` (${status})` : ''}:`, detail);
  }
}

export async function syncAllToApi(calls: Array<{ fn: () => Promise<unknown>; label: string }>): Promise<void> {
  try {
    const hasToken = !!localStorage.getItem('threeseas_access_token');
    if (!hasToken) return;
    await Promise.allSettled(
      calls.map(({ fn, label }) =>
        fn().catch((err: Error) => console.warn(`[Sync] ${label} failed:`, err.message))
      )
    );
  } catch {
    // Top-level failure — silently ignore
  }
}
