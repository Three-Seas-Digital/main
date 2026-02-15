# Middleware Reference - Three Seas Digital API

## Table of Contents
1. [Authentication Middleware](#authentication-middleware)
2. [File Upload Middleware](#file-upload-middleware)
3. [CSV Import Middleware](#csv-import-middleware)
4. [Error Handling](#error-handling)

---

## Authentication Middleware

**Location**: `server/middleware/auth.js`

### authenticateToken

Verifies JWT Bearer token and attaches user to request.

**Usage**:
```javascript
import { authenticateToken } from '../middleware/auth.js';

router.get('/protected', authenticateToken, (req, res) => {
  // req.user is now available
  console.log(req.user.id, req.user.username, req.user.role);
  res.json({ message: 'Authenticated' });
});
```

**Attaches to req**:
- `req.user` — Decoded JWT payload (includes id, username, role, email)

**Error Responses**:
- 401 Unauthorized — Missing token
- 401 Unauthorized — Token expired (code: `TOKEN_EXPIRED`)
- 403 Forbidden — Invalid token

---

### requireRole

Checks if authenticated user has one of the allowed roles.

**Usage**:
```javascript
import { authenticateToken, requireRole } from '../middleware/auth.js';

// Only admin and manager can access
router.delete('/clients/:id',
  authenticateToken,
  requireRole('admin', 'manager'),
  (req, res) => {
    // Role check passed
  }
);
```

**Notes**:
- Must be used **after** `authenticateToken`
- Supports multiple roles (OR logic)
- Common roles: `'admin'`, `'manager'`, `'user'`

**Error Responses**:
- 401 Unauthorized — User not authenticated
- 403 Forbidden — User role not in allowed list

---

### authenticateClient

Verifies JWT for client portal access (separate from admin auth).

**Usage**:
```javascript
import { authenticateClient } from '../middleware/auth.js';

router.get('/portal/dashboard', authenticateClient, (req, res) => {
  // req.user.clientId is now available
  res.json({ message: 'Client authenticated' });
});
```

**Attaches to req**:
- `req.user` — Decoded client JWT (includes clientId, email, userType: 'client')

---

## File Upload Middleware

**Location**: `server/middleware/upload.js`

### upload (default)

Standard file upload with 5MB limit, supports documents and receipts.

**Usage**:
```javascript
import { upload, setUploadType } from '../middleware/upload.js';

// Single file upload
router.post('/documents',
  authenticateToken,
  setUploadType('document'), // or 'receipt'
  upload.single('file'),
  (req, res) => {
    console.log(req.file.filename); // UUID-basename.ext
    console.log(req.file.path); // ./uploads/documents/UUID-basename.ext
    res.json({ filename: req.file.filename });
  }
);

// Multiple files
router.post('/documents/bulk',
  authenticateToken,
  setUploadType('document'),
  upload.array('files', 10), // max 10 files
  (req, res) => {
    console.log(req.files); // Array of files
  }
);
```

**Configuration**:
- Max size: 5MB (configurable via `MAX_FILE_SIZE` env var)
- Allowed types: images (jpg/png/gif/webp), PDF, Word, Excel, text, CSV
- Storage: Disk (`./uploads/documents/` or `./uploads/receipts/`)
- Filename format: `{uuid}-{sanitized-basename}{ext}`

**Multer Methods**:
- `.single('fieldName')` — Single file
- `.array('fieldName', maxCount)` — Multiple files
- `.fields([{name: 'file1'}, {name: 'file2'}])` — Multiple fields

---

### interventionScreenshots

Image-only upload with 10MB limit for intervention before/after screenshots.

**Usage**:
```javascript
import { interventionScreenshots, setUploadType } from '../middleware/upload.js';

router.post('/interventions/:id/screenshot',
  authenticateToken,
  setUploadType('screenshot'),
  interventionScreenshots.single('image'),
  (req, res) => {
    // File saved to ./uploads/screenshots/
    res.json({ path: `/uploads/${req.file.filename}` });
  }
);
```

**Configuration**:
- Max size: 10MB
- Allowed types: jpg, png, gif, webp (images only)
- Storage: Disk (`./uploads/screenshots/`)
- Filename format: `{uuid}-{sanitized-basename}{ext}`

---

### setUploadType

Middleware to set the upload subdirectory.

**Usage**:
```javascript
import { upload, setUploadType } from '../middleware/upload.js';

router.post('/receipts',
  setUploadType('receipt'), // Sets req.uploadType = 'receipt'
  upload.single('file'),
  handler
);
```

**Supported Types**:
- `'document'` → `./uploads/documents/`
- `'receipt'` → `./uploads/receipts/`
- `'screenshot'` → `./uploads/screenshots/`

---

## CSV Import Middleware

**Location**: `server/middleware/csvImport.js`

### csvUpload

Multer instance for CSV file uploads (memory storage).

**Usage**:
```javascript
import { csvUpload } from '../middleware/csvImport.js';

router.post('/import',
  authenticateToken,
  csvUpload.single('file'),
  (req, res) => {
    console.log(req.file.buffer); // CSV file content as Buffer
  }
);
```

**Configuration**:
- Max size: 2MB
- Allowed types: text/csv, application/vnd.ms-excel, or .csv extension
- Storage: Memory (no disk write)

---

### parseFinancialsCSV

Parses and validates CSV financial data, attaches parsed data to request.

**Usage**:
```javascript
import { csvUpload, parseFinancialsCSV } from '../middleware/csvImport.js';

router.post('/financials/import',
  authenticateToken,
  csvUpload.single('file'),
  parseFinancialsCSV, // Parses and validates
  (req, res) => {
    const { valid, errors, totalRows, validRows, errorRows } = req.csvData;

    if (errorRows > 0) {
      return res.status(400).json({
        success: false,
        error: `${errorRows} invalid row(s)`,
        errors: errors, // [{ row: 2, errors: ['Invalid revenue'] }]
      });
    }

    // Process valid records
    valid.forEach(record => {
      console.log(record.date, record.revenue, record.expenses);
    });
  }
);
```

**Attaches to req**:
- `req.csvData.valid` — Array of validated records
- `req.csvData.errors` — Array of `{ row: number, errors: string[] }`
- `req.csvData.totalRows` — Total data rows in CSV
- `req.csvData.validRows` — Count of valid rows
- `req.csvData.errorRows` — Count of invalid rows

**Expected CSV Columns**:
- **Required**: date, revenue, expenses
- **Optional**: customers, conversion_rate, avg_revenue_per_customer, new_customers, churn_rate, notes

**Validation Rules**:
- date: Must parse to valid Date
- revenue: Non-negative number
- expenses: Non-negative number
- customers: Non-negative integer (if present)
- conversion_rate: 0-100 (if present)
- churn_rate: 0-100 (if present)
- new_customers: Non-negative integer (if present)

---

### catchAsync

Async error wrapper for route handlers.

**Usage**:
```javascript
import { catchAsync } from '../middleware/csvImport.js';

router.get('/data', catchAsync(async (req, res) => {
  const data = await someAsyncOperation();
  res.json(data);
  // Errors automatically caught and passed to next(err)
}));
```

**Alternative** (inline):
```javascript
router.get('/data', async (req, res, next) => {
  try {
    const data = await someAsyncOperation();
    res.json(data);
  } catch (err) {
    next(err);
  }
});
```

---

## Error Handling

### Global Error Handler

**Location**: `server/index.js` (lines 85-90)

All uncaught errors are handled by the global error middleware:

```javascript
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});
```

### Middleware Error Patterns

**File Upload Errors**:
```javascript
// Multer errors
if (err.code === 'LIMIT_FILE_SIZE') {
  return res.status(413).json({ error: 'File too large' });
}
if (err.code === 'LIMIT_UNEXPECTED_FILE') {
  return res.status(400).json({ error: 'Unexpected field' });
}
```

**Database Errors**:
```javascript
// Duplicate key
if (err.code === 'ER_DUP_ENTRY') {
  return res.status(400).json({ error: 'Record already exists' });
}
// Foreign key constraint
if (err.code === 'ER_NO_REFERENCED_ROW_2') {
  return res.status(404).json({ error: 'Referenced record not found' });
}
```

**Validation Errors**:
```javascript
// Return structured errors
res.status(400).json({
  success: false,
  errors: [
    { field: 'email', message: 'Invalid email format' },
    { field: 'age', message: 'Must be 18 or older' }
  ]
});
```

---

## Middleware Chaining Order

**Correct Order**:
```javascript
router.post('/endpoint',
  authenticateToken,        // 1. Auth first
  requireRole('admin'),     // 2. Then authorization
  setUploadType('document'),// 3. Configure upload
  upload.single('file'),    // 4. Handle upload
  parseData,                // 5. Parse/validate data
  handler                   // 6. Business logic
);
```

**Important**:
- Auth middleware must come before role checks
- File upload middleware must come after setUploadType
- Parsing middleware must come after file upload
- Always end with a handler that sends a response

---

## Environment Variables

**Upload Configuration**:
```bash
UPLOAD_DIR=./uploads        # Default: ./uploads
MAX_FILE_SIZE=5242880       # Default: 5MB (in bytes)
```

**Auth Configuration**:
```bash
JWT_SECRET=your-secret-key  # Default: 'dev-secret' (CHANGE IN PRODUCTION)
JWT_EXPIRES_IN=1h           # Token expiration time
```

**CORS Configuration**:
```bash
CORS_ORIGIN=http://localhost:5173  # Default: localhost:5173
```

---

## Testing Examples

### Test CSV Import
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-data.csv" \
  http://localhost:3001/api/clients/1/financials/import
```

### Test File Upload
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf" \
  http://localhost:3001/api/clients/1/documents
```

### Test Auth
```bash
# Login to get token
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  http://localhost:3001/api/auth/login

# Use token
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/clients
```

---

## Best Practices

1. **Always use authenticateToken** for protected routes
2. **Chain requireRole** after authenticateToken for RBAC
3. **Use catchAsync** for async route handlers
4. **Validate file uploads** client-side first for better UX
5. **Set appropriate file size limits** based on use case
6. **Return structured errors** with field-level details
7. **Log errors** but don't expose internal details in production
8. **Use transactions** for multi-step database operations
9. **Clean up uploaded files** on validation failure
10. **Rate limit** sensitive endpoints (auth, imports)
