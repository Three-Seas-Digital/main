/**
 * Cloudflare R2 Storage Configuration
 *
 * After deploying your Cloudflare Worker, set these values:
 *   WORKER_URL — Your Worker's URL (e.g. https://threeseas-template-storage.yourname.workers.dev)
 *   API_KEY    — The R2_API_KEY secret you set on the Worker
 *
 * These are stored in localStorage so they can be configured from the admin dashboard
 * without rebuilding the app. On first run, the defaults below are used.
 */

const CONFIG_KEY = 'threeseas_r2_config';

const DEFAULT_CONFIG = {
  workerUrl: '',  // Set after deploying Worker
  apiKey: '',     // Set after deploying Worker
  enabled: false, // Toggle R2 on/off — falls back to IndexedDB when off
};

export function getR2Config() {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG };
}

export function setR2Config(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function isR2Enabled() {
  const config = getR2Config();
  return config.enabled && config.workerUrl && config.apiKey;
}
