# CSV Import Feature - Client Financials

## Overview

The CSV import feature allows bulk uploading of financial data for clients. This is useful for:
- Migrating historical financial data from spreadsheets
- Importing data from accounting software exports
- Bulk updates from client-provided CSV files

## Endpoint

**POST** `/api/clients/:clientId/financials/import`

**Authentication Required**: Yes (Bearer token)

**Content-Type**: `multipart/form-data`

## Request Format

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

### Body
- **file** (required): CSV file (max 2MB)

### CSV Format

#### Required Columns
- `date` — Date in YYYY-MM-DD or MM/DD/YYYY format
- `revenue` — Gross revenue amount (non-negative number)
- `expenses` — Total expenses amount (non-negative number)

#### Optional Columns
- `customers` — Total customer count (non-negative integer)
- `conversion_rate` — Conversion rate as percentage 0-100 (decimal)
- `avg_revenue_per_customer` — Average revenue per customer (non-negative number)
- `new_customers` — New customer count (non-negative integer)
- `churn_rate` — Customer churn rate as percentage 0-100 (decimal)
- `notes` — Text notes for the period

#### Example CSV

```csv
date,revenue,expenses,customers,conversion_rate,avg_revenue_per_customer,new_customers,churn_rate,notes
2026-01-01,15000,5000,120,3.5,125,15,2.1,Strong January performance
2026-02-01,18000,6200,135,4.2,133.33,20,1.8,Valentine's campaign success
2026-03-01,16500,5800,128,3.8,128.90,12,2.5,Seasonal dip expected
```

**Note**: Column headers are case-insensitive and spaces are converted to underscores.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "message": "Successfully imported 3 financial record(s)",
    "imported": 3,
    "total": 3
  }
}
```

**Status Code**: 201 Created

### Validation Error Response
```json
{
  "success": false,
  "error": "CSV contains 2 invalid row(s). Please fix errors and try again.",
  "errors": [
    {
      "row": 2,
      "errors": [
        "Invalid revenue: \"abc\". Must be a non-negative number"
      ]
    },
    {
      "row": 4,
      "errors": [
        "Missing date",
        "Invalid conversion_rate: \"150\". Must be between 0 and 100"
      ]
    }
  ],
  "summary": {
    "totalRows": 3,
    "validRows": 1,
    "errorRows": 2
  }
}
```

**Status Code**: 400 Bad Request

### Client Not Found
```json
{
  "success": false,
  "error": "Client not found"
}
```

**Status Code**: 404 Not Found

### File Type Error
```json
{
  "success": false,
  "error": "Only CSV files are allowed"
}
```

**Status Code**: 400 Bad Request

## Data Mapping

The CSV import uses a simplified schema that maps to the comprehensive database schema:

| CSV Column | Database Column(s) | Notes |
|------------|-------------------|-------|
| date | period_year, period_month | Extracted from date |
| revenue | gross_revenue, net_revenue | Assumes no discounts |
| expenses | total_expenses | Direct mapping |
| customers | total_customers | Direct mapping |
| new_customers | new_customers | Direct mapping |
| conversion_rate | (not stored in main table) | For reference only |
| avg_revenue_per_customer | (not stored in main table) | Can be calculated |
| churn_rate | (not stored in main table) | For reference only |
| notes | notes | Direct mapping |
| (calculated) | gross_profit | revenue - expenses |
| (calculated) | net_profit | revenue - expenses |
| (auto) | data_completeness | Set to 'partial' |
| (auto) | source | Set to 'csv_import' |
| (auto) | entered_by | Current user ID |

## Validation Rules

### Date Field
- Must not be empty
- Must parse to a valid JavaScript Date
- Accepted formats: YYYY-MM-DD, MM/DD/YYYY, or any ISO 8601 format

### Revenue Field
- Must be a valid number
- Must be non-negative (≥ 0)

### Expenses Field
- Must be a valid number
- Must be non-negative (≥ 0)

### Customers Field (optional)
- If provided, must be a non-negative integer

### Conversion Rate (optional)
- If provided, must be a number between 0 and 100 (inclusive)

### Churn Rate (optional)
- If provided, must be a number between 0 and 100 (inclusive)

### New Customers (optional)
- If provided, must be a non-negative integer

## Duplicate Handling

The import uses an **upsert strategy** (INSERT ... ON DUPLICATE KEY UPDATE). This means:

- If a financial record already exists for the same **client_id**, **period_year**, and **period_month**, it will be **updated** with the new values
- If no record exists, a new one will be **created**
- This makes the import **idempotent** — running the same CSV multiple times produces the same result

## Error Handling

### Row-Level Validation
Each row is validated independently. If any row has errors:
- **No data is imported** (all-or-nothing approach for validation)
- All errors across all rows are returned in the response
- Row numbers are 1-indexed and account for the header row (row 2 = first data row)

### Database Errors
If validation passes but database insertion fails:
- HTTP 500 returned
- Error details included in development mode
- In production, generic "Database error during import" message

### File Size Limit
- Maximum file size: **2MB**
- Exceeding this limit results in a 413 Payload Too Large error from multer

## Usage Example

### Using cURL
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@financials-january-2026.csv" \
  https://api.threeseasdigital.com/api/clients/123/financials/import
```

### Using JavaScript Fetch
```javascript
const formData = new FormData();
formData.append('file', csvFileInput.files[0]);

const response = await fetch('/api/clients/123/financials/import', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
  body: formData,
});

const result = await response.json();
if (result.success) {
  console.log(`Imported ${result.data.imported} records`);
} else {
  console.error('Import failed:', result.error);
  if (result.errors) {
    result.errors.forEach(({ row, errors }) => {
      console.error(`Row ${row}:`, errors.join(', '));
    });
  }
}
```

### Using Axios
```javascript
import axios from 'axios';

const formData = new FormData();
formData.append('file', csvFile);

try {
  const response = await axios.post(
    `/api/clients/${clientId}/financials/import`,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  console.log(response.data.data.message);
} catch (error) {
  if (error.response?.data?.errors) {
    // Display row-level errors
    error.response.data.errors.forEach(({ row, errors }) => {
      console.error(`Row ${row}: ${errors.join(', ')}`);
    });
  }
}
```

## Best Practices

1. **Validate CSV client-side first** using the same rules to provide instant feedback
2. **Show row-level errors** clearly in the UI so users can fix issues
3. **Provide a downloadable template** (see `server/templates/financials-import-template.csv`)
4. **Handle large datasets** by chunking (current 2MB limit ≈ 10,000 rows)
5. **Log imports** for audit trail (entered_by field tracks who imported)
6. **Allow re-import** for corrections (duplicate handling via upsert)

## Security Considerations

- Authentication required (JWT bearer token)
- File type restricted to CSV (MIME type validation)
- File size limited to 2MB (prevents DoS)
- SQL injection prevented via parameterized queries
- Client existence verified before import
- All numeric values validated for type and range
- No arbitrary code execution (PapaParse is safe for untrusted input)

## Future Enhancements

- [ ] Add transaction wrapping for atomic bulk inserts
- [ ] Support Excel (.xlsx) format via SheetJS
- [ ] Add progress callback for large imports
- [ ] Implement async/queued processing for files > 1MB
- [ ] Add preview mode (validate without importing)
- [ ] Support custom column mapping UI
- [ ] Add import history tracking table
- [ ] Implement rate limiting (e.g., 5 imports per minute)
- [ ] Add rollback endpoint to undo imports
- [ ] Support date format parameter (currently auto-detects)
