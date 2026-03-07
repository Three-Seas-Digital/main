/**
 * Client Document Storage — Cloudflare R2
 *
 * Uploads/downloads client documents (PDFs, etc.) via the R2 worker.
 * Uses the same R2 config as template storage.
 */

import { getR2Config, isR2Enabled } from '../config/r2Config';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a base64-encoded document to R2.
 */
export async function uploadDocumentToR2(
  docId: string,
  base64Data: string,
  mimeType: string = 'application/pdf'
): Promise<UploadResult> {
  if (!isR2Enabled()) {
    return { success: false, error: 'R2 not configured' };
  }

  const config = getR2Config();

  // Convert data URI to blob
  let blob: Blob;
  if (base64Data.startsWith('data:')) {
    const resp = await fetch(base64Data);
    blob = await resp.blob();
  } else {
    // Raw base64
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    blob = new Blob([bytes], { type: mimeType });
  }

  const url = `${config.workerUrl}/documents/${docId}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'X-API-Key': config.apiKey,
      'Content-Type': mimeType,
    },
    body: blob,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as Record<string, string>;
    return { success: false, error: err.error || `Upload failed (${response.status})` };
  }

  return { success: true, url };
}

/**
 * Get the R2 download URL for a document.
 */
export function getDocumentR2Url(docId: string): string | null {
  if (!isR2Enabled()) return null;
  const config = getR2Config();
  return `${config.workerUrl}/documents/${docId}`;
}

/**
 * Download a document from R2 as a data URI.
 */
export async function downloadDocumentFromR2(docId: string): Promise<string | null> {
  if (!isR2Enabled()) return null;
  const config = getR2Config();
  const url = `${config.workerUrl}/documents/${docId}`;

  const response = await fetch(url, {
    headers: { 'X-API-Key': config.apiKey },
  });

  if (!response.ok) return null;

  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

/**
 * Delete a document from R2.
 */
export async function deleteDocumentFromR2(docId: string): Promise<void> {
  if (!isR2Enabled()) return;
  const config = getR2Config();
  await fetch(`${config.workerUrl}/documents/${docId}`, {
    method: 'DELETE',
    headers: { 'X-API-Key': config.apiKey },
  });
}
