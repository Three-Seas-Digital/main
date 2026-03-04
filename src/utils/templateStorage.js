/**
 * Template Storage — Cloudflare R2 (primary) + IndexedDB (local cache/fallback)
 *
 * Handles both ZIP files and template images.
 *
 * When R2 is configured and enabled:
 *   Upload  → R2 + IndexedDB cache
 *   Download → IndexedDB cache first, then R2 (caches on download)
 *   Delete  → R2 + IndexedDB cache
 *
 * When R2 is NOT configured:
 *   Everything uses IndexedDB only (works offline, limited by disk)
 */

import { getR2Config, isR2Enabled } from '../config/r2Config';

// ===== IndexedDB (local cache) =====

const DB_NAME = 'threeseas_templates';
const DB_VERSION = 2;
const ZIP_STORE = 'zips';
const IMG_STORE = 'images';

function openTemplateDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(ZIP_STORE)) {
        db.createObjectStore(ZIP_STORE);
      }
      if (!db.objectStoreNames.contains(IMG_STORE)) {
        db.createObjectStore(IMG_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(storeName, key, blob) {
  const db = await openTemplateDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(blob, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function idbGet(storeName, key) {
  const db = await openTemplateDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

async function idbDelete(storeName, key) {
  const db = await openTemplateDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function idbGetAllKeys(storeName) {
  const db = await openTemplateDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAllKeys();
    req.onsuccess = () => { db.close(); resolve(req.result); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

// ===== Cloudflare R2 API =====

async function r2Request(method, route, body, contentType) {
  const config = getR2Config();
  const url = `${config.workerUrl.replace(/\/$/, '')}/${route}`;
  const headers = { 'X-API-Key': config.apiKey };
  if (body && contentType) headers['Content-Type'] = contentType;

  const res = await fetch(url, { method, headers, body });
  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `R2 ${method} failed: ${res.status}`);
  }
  return res;
}

// ===== ZIP Public API =====

export async function storeTemplateZip(templateId, blob) {
  await idbPut(ZIP_STORE, templateId, blob);
  if (isR2Enabled()) {
    await r2Request('PUT', `templates/${templateId}`, blob, 'application/zip');
  }
}

export async function getTemplateZip(templateId) {
  const cached = await idbGet(ZIP_STORE, templateId).catch(() => null);
  if (cached) return cached;

  if (isR2Enabled()) {
    const res = await r2Request('GET', `templates/${templateId}`);
    if (res.status === 404) return null;
    const blob = await res.blob();
    await idbPut(ZIP_STORE, templateId, blob).catch(() => {});
    return blob;
  }

  return null;
}

export async function deleteTemplateZip(templateId) {
  await idbDelete(ZIP_STORE, templateId).catch(() => {});
  if (isR2Enabled()) {
    await r2Request('DELETE', `templates/${templateId}`).catch(() => {});
  }
}

export async function getAllTemplateZipIds() {
  return idbGetAllKeys(ZIP_STORE);
}

export async function hasTemplateZip(templateId) {
  const local = await idbGet(ZIP_STORE, templateId).catch(() => null);
  if (local) return true;
  if (isR2Enabled()) {
    const res = await r2Request('HEAD', `templates/${templateId}`).catch(() => null);
    return res?.status === 200;
  }
  return false;
}

// ===== Image Public API =====

export async function storeTemplateImage(templateId, blob) {
  await idbPut(IMG_STORE, templateId, blob);
  if (isR2Enabled()) {
    await r2Request('PUT', `images/${templateId}`, blob, 'image/jpeg');
  }
}

export async function getTemplateImage(templateId) {
  const cached = await idbGet(IMG_STORE, templateId).catch(() => null);
  if (cached) return cached;

  if (isR2Enabled()) {
    const res = await r2Request('GET', `images/${templateId}`);
    if (res.status === 404) return null;
    const blob = await res.blob();
    await idbPut(IMG_STORE, templateId, blob).catch(() => {});
    return blob;
  }

  return null;
}

export async function deleteTemplateImage(templateId) {
  await idbDelete(IMG_STORE, templateId).catch(() => {});
  if (isR2Enabled()) {
    await r2Request('DELETE', `images/${templateId}`).catch(() => {});
  }
}

// ===== Metadata Sync (R2 ↔ localStorage) =====

export async function syncMetadataToR2(adminTemplates, builtInOverrides) {
  if (!isR2Enabled()) return;
  await r2Request('PUT', 'metadata', JSON.stringify(adminTemplates), 'application/json');
  await r2Request('PUT', 'metadata/overrides', JSON.stringify(builtInOverrides), 'application/json');
}

export async function fetchMetadataFromR2() {
  if (!isR2Enabled()) return null;
  try {
    const res = await r2Request('GET', 'metadata');
    if (!res.ok) return null;
    const data = await res.json();
    // Worker returns { data: null } when key doesn't exist, or raw array when it does
    if (Array.isArray(data)) return { adminTemplates: data };
    return null;
  } catch {
    return null;
  }
}

export async function fetchOverridesFromR2() {
  if (!isR2Enabled()) return null;
  try {
    const res = await r2Request('GET', 'metadata/overrides');
    if (!res.ok) return null;
    const data = await res.json();
    // Worker returns { data: null } when key doesn't exist, or raw object when it does
    if (data && typeof data === 'object' && !Array.isArray(data) && !('data' in data)) return data;
    return null;
  } catch {
    return null;
  }
}

// Discover template ZIPs in R2 that have no metadata entry yet
export async function discoverR2Templates() {
  if (!isR2Enabled()) return [];
  try {
    const [zipRes, imgRes] = await Promise.all([
      r2Request('GET', 'templates'),
      r2Request('GET', 'images').catch(() => null),
    ]);
    if (!zipRes.ok) return [];
    const zipData = await zipRes.json();
    const items = zipData.items || [];

    // Check which templates also have images
    let imageIds = new Set();
    if (imgRes?.ok) {
      const imgData = await imgRes.json();
      imageIds = new Set((imgData.items || []).map((i) => i.id));
    }

    return items.map((f) => ({
      ...f,
      hasImage: imageIds.has(f.id),
    }));
  } catch {
    return [];
  }
}
