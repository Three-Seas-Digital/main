# CSV Import Middleware - Installation & Verification

## Quick Start

Follow these steps to install and verify the CSV import middleware functionality.

## Step 1: Install Dependencies

```bash
cd D:\Projects\ThreeSeasDigital\server
npm install
```

**Expected Output**:
```
added 1 package, and audited X packages in Xs
```

This installs `papaparse@^5.4.1` which is required for CSV parsing.

---

## Step 2: Verify File Structure

Check that all middleware files exist:

```bash
ls middleware/csvImport.js
ls middleware/upload.js
ls routes/clientFinancials.js
ls templates/financials-import-template.csv
```

All four files should exist.

---

## Step 3: Start the Server

```bash
npm run dev
```

**Expected Output**:
```
Three Seas Digital API running on port 3001
```

Watch for any import errors in the console. If you see errors about missing modules, run `npm install` again.

---

## Step 4: Get Authentication Token

In a new terminal, get a JWT token:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_ADMIN_PASSWORD"}'
```

**Expected Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

Copy the token value for next steps.

---

## Step 5: Test CSV Import (Valid Data)

Create a test CSV file:

```bash
cat > test-import.csv << 'EOF'
date,revenue,expenses,customers,notes
2026-01-01,15000,5000,120,Test January data
2026-02-01,18000,6200,135,Test February data
EOF
```

Import the CSV (replace TOKEN and CLIENT_ID):

```bash
curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@test-import.csv"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "message": "Successfully imported 2 financial record(s)",
    "imported": 2,
    "total": 2
  }
}
```

**Status Code**: 201 Created

---

## Step 6: Test CSV Import (Invalid Data)

Create an invalid CSV:

```bash
cat > invalid-import.csv << 'EOF'
date,revenue,expenses
not-a-date,abc,xyz
EOF
```

Try to import:

```bash
curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@invalid-import.csv"
```

**Expected Response**:
```json
{
  "success": false,
  "error": "CSV contains 1 invalid row(s). Please fix errors and try again.",
  "errors": [
    {
      "row": 2,
      "errors": [
        "Invalid date format: \"not-a-date\". Use YYYY-MM-DD or MM/DD/YYYY",
        "Invalid revenue: \"abc\". Must be a non-negative number",
        "Invalid expenses: \"xyz\". Must be a non-negative number"
      ]
    }
  ],
  "summary": {
    "totalRows": 1,
    "validRows": 0,
    "errorRows": 1
  }
}
```

**Status Code**: 400 Bad Request

This confirms validation is working correctly.

---

## Step 7: Test Intervention Screenshot Upload

Download a test image:

```bash
curl -o test-screenshot.png https://via.placeholder.com/800x600.png
```

Upload the screenshot (if you have interventions table set up):

```bash
curl -X POST http://localhost:3001/api/interventions/1/screenshot \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "image=@test-screenshot.png"
```

**Expected**: File uploaded to `./uploads/screenshots/` with UUID-based filename.

---

## Step 8: Verify Uploaded Files

Check that upload directories were created:

```bash
ls -la uploads/
```

**Expected**:
```
drwxr-xr-x documents/
drwxr-xr-x receipts/
drwxr-xr-x screenshots/
```

If you uploaded files, they should appear in the respective directories with UUID-based filenames.

---

## Step 9: Verify Database Records

Check that imported financial records are in the database:

```bash
curl -X GET http://localhost:3001/api/clients/1/financials \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected**: Array of financial records including the ones you just imported.

---

## Step 10: Test Template CSV

Use the provided template:

```bash
curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@templates/financials-import-template.csv"
```

**Expected**: Successful import of 3 records from the template.

---

## Troubleshooting

### Error: "Cannot find module 'papaparse'"

**Solution**: Run `npm install` again. Make sure you're in the `server/` directory.

```bash
cd D:\Projects\ThreeSeasDigital\server
npm install
```

---

### Error: "Access token required"

**Solution**: Make sure you're including the Authorization header:

```bash
-H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Replace `YOUR_TOKEN_HERE` with the actual token from Step 4.

---

### Error: "Client not found"

**Solution**: Replace `1` in the URL with an actual client ID from your database:

```bash
# List clients first
curl -X GET http://localhost:3001/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Use a valid client ID from the response
curl -X POST http://localhost:3001/api/clients/VALID_ID/financials/import \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@test-import.csv"
```

---

### Error: "Only CSV files are allowed"

**Solution**: Make sure your file has a `.csv` extension and is actually a CSV file (not Excel .xlsx or other format).

---

### Error: "Payload too large"

**Solution**: CSV file exceeds 2MB limit. Try with a smaller file or increase the limit in `csvImport.js`:

```javascript
// In server/middleware/csvImport.js
export const csvUpload = multer({
  storage,
  fileFilter: csvFilter,
  limits: { fileSize: 5242880 }, // Change to 5MB
});
```

---

## Verification Checklist

- [ ] Dependencies installed (`npm install` successful)
- [ ] Server starts without errors (`npm run dev`)
- [ ] Can get JWT token from `/api/auth/login`
- [ ] Valid CSV import succeeds (201 status)
- [ ] Invalid CSV import returns validation errors (400 status)
- [ ] Validation errors include row numbers and field-level messages
- [ ] Duplicate period import uses upsert (updates existing record)
- [ ] Screenshot upload works (if interventions endpoints exist)
- [ ] Upload directories created: `documents/`, `receipts/`, `screenshots/`
- [ ] Uploaded files have UUID-based filenames
- [ ] Financial records appear in database after import
- [ ] Missing token returns 401 Unauthorized
- [ ] Non-existent client returns 404 Not Found

---

## Next Steps

Once verification is complete:

1. **Read Documentation**:
   - `docs/CSV_IMPORT.md` — Complete CSV import feature documentation
   - `docs/MIDDLEWARE_REFERENCE.md` — All middleware reference
   - `docs/MIDDLEWARE_TESTING.md` — 40+ test cases

2. **Frontend Integration**:
   - Create CSV upload component in admin BI section
   - Add file input with CSV validation
   - Display row-level errors in UI
   - Provide template download link

3. **Production Deployment**:
   - Set `JWT_SECRET` environment variable
   - Configure `UPLOAD_DIR` if needed
   - Set `MAX_FILE_SIZE` limits as appropriate
   - Add rate limiting to import endpoints
   - Monitor upload directory disk usage

---

## Success!

If all verification steps pass, your CSV import middleware is working correctly and ready for integration with the frontend.

For detailed usage examples and best practices, see:
- `server/docs/CSV_IMPORT.md`
- `server/docs/MIDDLEWARE_REFERENCE.md`
