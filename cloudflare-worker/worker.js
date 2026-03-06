/**
 * Cloudflare Worker — R2 Template Storage Proxy
 *
 * Routes:
 *   PUT    /templates/:id   — Upload a ZIP file
 *   GET    /templates/:id   — Download a ZIP file
 *   DELETE /templates/:id   — Delete a ZIP file
 *   HEAD   /templates/:id   — Check if file exists
 *   GET    /templates       — List all stored template IDs
 *
 *   PUT    /images/:id      — Upload a template image
 *   GET    /images/:id      — Download a template image
 *   DELETE /images/:id      — Delete a template image
 *   HEAD   /images/:id      — Check if image exists
 *
 *   PUT    /documents/:id   — Upload a client document (PDF, etc.)
 *   GET    /documents/:id   — Download a client document
 *   DELETE /documents/:id   — Delete a client document
 *   HEAD   /documents/:id   — Check if document exists
 *   GET    /documents       — List all stored document IDs
 *
 * Auth: X-API-Key header must match the R2_API_KEY secret
 * CORS: Configured for your frontend origin
 *
 * Setup:
 *   1. Create R2 bucket named "template-storage" in Cloudflare dashboard
 *   2. Create Worker, paste this code
 *   3. Bind R2 bucket: variable name = BUCKET, bucket = template-storage
 *   4. Add secret: R2_API_KEY = (generate a strong random string)
 *   5. Add variable: ALLOWED_ORIGIN = https://yourdomain.com
 */

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    // Auth check
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || apiKey !== env.R2_API_KEY) {
      return jsonResponse(401, { error: 'Unauthorized' }, env);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Template metadata (JSON manifest of all custom templates)
    if (path === '/metadata' && request.method === 'GET') {
      return handleDownloadJson('metadata/admin-templates.json', env);
    }
    if (path === '/metadata' && request.method === 'PUT') {
      return handleUploadJson(request, 'metadata/admin-templates.json', env);
    }

    // Built-in overrides metadata
    if (path === '/metadata/overrides' && request.method === 'GET') {
      return handleDownloadJson('metadata/builtin-overrides.json', env);
    }
    if (path === '/metadata/overrides' && request.method === 'PUT') {
      return handleUploadJson(request, 'metadata/builtin-overrides.json', env);
    }

    // List all template keys
    if (path === '/templates' && request.method === 'GET') {
      return handleList('templates/', '.zip', env);
    }

    // Route: /templates/:id
    const templateMatch = path.match(/^\/templates\/(.+)$/);
    if (templateMatch) {
      const templateId = templateMatch[1];
      const key = `templates/${templateId}.zip`;
      return handleRoute(request, key, env);
    }

    // List all image keys
    if (path === '/images' && request.method === 'GET') {
      return handleList('images/', '.jpg', env);
    }

    // Route: /images/:id
    const imageMatch = path.match(/^\/images\/(.+)$/);
    if (imageMatch) {
      const imageId = imageMatch[1];
      const key = `images/${imageId}.jpg`;
      return handleRoute(request, key, env);
    }

    // List all document keys
    if (path === '/documents' && request.method === 'GET') {
      return handleList('documents/', '', env);
    }

    // Route: /documents/:id
    const docMatch = path.match(/^\/documents\/(.+)$/);
    if (docMatch) {
      const docId = docMatch[1];
      const key = `documents/${docId}`;
      return handleRoute(request, key, env);
    }

    return jsonResponse(404, { error: 'Not found' }, env);
  },
};

function handleRoute(request, key, env) {
  switch (request.method) {
    case 'PUT':
      return handleUpload(request, key, env);
    case 'GET':
      return handleDownload(key, env);
    case 'DELETE':
      return handleDelete(key, env);
    case 'HEAD':
      return handleHead(key, env);
    default:
      return jsonResponse(405, { error: 'Method not allowed' }, env);
  }
}

async function handleUpload(request, key, env) {
  const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
  const blob = await request.arrayBuffer();

  // Max 50MB
  if (blob.byteLength > 50 * 1024 * 1024) {
    return jsonResponse(413, { error: 'File too large (max 50MB)' }, env);
  }

  await env.BUCKET.put(key, blob, {
    httpMetadata: { contentType },
    customMetadata: {
      uploadedAt: new Date().toISOString(),
      size: String(blob.byteLength),
    },
  });

  return jsonResponse(200, {
    success: true,
    key,
    size: blob.byteLength,
  }, env);
}

async function handleDownload(key, env) {
  const object = await env.BUCKET.get(key);
  if (!object) {
    return jsonResponse(404, { error: 'File not found' }, env);
  }

  const headers = {
    ...corsHeaders(env),
    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    'Content-Length': object.size,
    'Cache-Control': 'private, max-age=3600',
  };

  return new Response(object.body, { status: 200, headers });
}

async function handleDelete(key, env) {
  await env.BUCKET.delete(key);
  return jsonResponse(200, { success: true }, env);
}

async function handleHead(key, env) {
  const object = await env.BUCKET.head(key);
  if (!object) {
    return new Response(null, { status: 404, headers: corsHeaders(env) });
  }
  return new Response(null, {
    status: 200,
    headers: {
      ...corsHeaders(env),
      'Content-Length': object.size,
      'X-Upload-Date': object.customMetadata?.uploadedAt || '',
    },
  });
}

async function handleList(prefix, ext, env) {
  const listed = await env.BUCKET.list({ prefix });
  const ids = listed.objects.map((obj) => ({
    id: obj.key.replace(prefix, '').replace(ext, ''),
    size: obj.size,
    uploaded: obj.uploaded?.toISOString(),
  }));
  return jsonResponse(200, { items: ids }, env);
}

async function handleUploadJson(request, key, env) {
  const body = await request.text();
  // Validate it's valid JSON
  try { JSON.parse(body); } catch {
    return jsonResponse(400, { error: 'Invalid JSON' }, env);
  }
  await env.BUCKET.put(key, body, {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: { uploadedAt: new Date().toISOString() },
  });
  return jsonResponse(200, { success: true }, env);
}

async function handleDownloadJson(key, env) {
  const object = await env.BUCKET.get(key);
  if (!object) {
    return jsonResponse(200, { data: null }, env);
  }
  const text = await object.text();
  return new Response(text, {
    status: 200,
    headers: {
      ...corsHeaders(env),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(status, body, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env),
    },
  });
}
