# Middleware Testing Guide

## Overview

This guide provides test cases and examples for testing all middleware components in the Three Seas Digital API.

## Prerequisites

- Node.js installed
- Server running on `http://localhost:3001`
- Valid JWT token (obtain via `/api/auth/login`)
- Test files (CSV, images, documents)

---

## 1. Authentication Middleware Tests

### 1.1 Test authenticateToken - Valid Token

**Request**:
```bash
# First, get a token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# Use the token
curl -X GET http://localhost:3001/api/clients \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: 200 OK with client list

---

### 1.2 Test authenticateToken - Missing Token

**Request**:
```bash
curl -X GET http://localhost:3001/api/clients
```

**Expected**:
```json
{
  "error": "Access token required"
}
```
**Status**: 401 Unauthorized

---

### 1.3 Test authenticateToken - Invalid Token

**Request**:
```bash
curl -X GET http://localhost:3001/api/clients \
  -H "Authorization: Bearer invalid.token.here"
```

**Expected**:
```json
{
  "error": "Invalid token"
}
```
**Status**: 403 Forbidden

---

### 1.4 Test requireRole - Authorized

**Request**:
```bash
# Get admin token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# Access admin-only endpoint
curl -X DELETE http://localhost:3001/api/clients/999 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: 200 OK or 404 Not Found (depending on client existence)

---

### 1.5 Test requireRole - Unauthorized

**Request**:
```bash
# Get regular user token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"user123"}' \
  | jq -r '.token')

# Try to access admin-only endpoint
curl -X DELETE http://localhost:3001/api/clients/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:
```json
{
  "error": "Insufficient permissions"
}
```
**Status**: 403 Forbidden

---

## 2. File Upload Middleware Tests

### 2.1 Test Document Upload - Valid PDF

**Request**:
```bash
# Create a test PDF file
echo "%PDF-1.4 Test" > test-doc.pdf

# Upload
curl -X POST http://localhost:3001/api/clients/1/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-doc.pdf" \
  -F "name=Test Document" \
  -F "type=proposal"
```

**Expected**: 201 Created with document ID

---

### 2.2 Test Document Upload - File Too Large

**Request**:
```bash
# Create 6MB file (exceeds 5MB limit)
dd if=/dev/zero of=large-file.pdf bs=1M count=6

curl -X POST http://localhost:3001/api/clients/1/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@large-file.pdf"
```

**Expected**:
```json
{
  "error": "File too large"
}
```
**Status**: 413 Payload Too Large

---

### 2.3 Test Document Upload - Invalid File Type

**Request**:
```bash
# Create executable file
echo "#!/bin/bash\necho test" > test.sh

curl -X POST http://localhost:3001/api/clients/1/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.sh"
```

**Expected**:
```json
{
  "error": "File type application/x-sh not allowed"
}
```
**Status**: 400 Bad Request

---

### 2.4 Test Intervention Screenshot Upload - Valid Image

**Request**:
```bash
# Download a test image or create one
curl -o test-image.png https://via.placeholder.com/800x600

curl -X POST http://localhost:3001/api/interventions/1/screenshot \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test-image.png"
```

**Expected**: 201 Created with file path

---

### 2.5 Test Intervention Screenshot - Non-Image File

**Request**:
```bash
curl -X POST http://localhost:3001/api/interventions/1/screenshot \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test-doc.pdf"
```

**Expected**:
```json
{
  "error": "Only image files (jpg, png, gif, webp) are allowed"
}
```
**Status**: 400 Bad Request

---

### 2.6 Test Multiple File Upload

**Request**:
```bash
curl -X POST http://localhost:3001/api/clients/1/documents/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@doc1.pdf" \
  -F "files=@doc2.pdf" \
  -F "files=@doc3.pdf"
```

**Expected**: 201 Created with array of file IDs

---

## 3. CSV Import Middleware Tests

### 3.1 Test CSV Import - Valid Data

**Request**:
```bash
# Create test CSV
cat > test-financials.csv << 'EOF'
date,revenue,expenses,customers,notes
2026-01-01,15000,5000,120,January sales
2026-02-01,18000,6200,135,Valentine's boost
2026-03-01,16500,5800,128,Normal month
EOF

curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-financials.csv"
```

**Expected**:
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
**Status**: 201 Created

---

### 3.2 Test CSV Import - Missing Required Column

**Request**:
```bash
# CSV missing 'expenses' column
cat > invalid-csv.csv << 'EOF'
date,revenue,customers
2026-01-01,15000,120
EOF

curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@invalid-csv.csv"
```

**Expected**:
```json
{
  "success": false,
  "error": "Missing required columns: expenses. Required: date, revenue, expenses"
}
```
**Status**: 400 Bad Request

---

### 3.3 Test CSV Import - Invalid Data Types

**Request**:
```bash
cat > invalid-data.csv << 'EOF'
date,revenue,expenses,customers
2026-01-01,abc,5000,120
2026-02-01,18000,xyz,135
2026-03-01,16500,5800,-50
EOF

curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@invalid-data.csv"
```

**Expected**:
```json
{
  "success": false,
  "error": "CSV contains 3 invalid row(s). Please fix errors and try again.",
  "errors": [
    {
      "row": 2,
      "errors": ["Invalid revenue: \"abc\". Must be a non-negative number"]
    },
    {
      "row": 3,
      "errors": ["Invalid expenses: \"xyz\". Must be a non-negative number"]
    },
    {
      "row": 4,
      "errors": ["Invalid customers: \"-50\". Must be a non-negative integer"]
    }
  ],
  "summary": {
    "totalRows": 3,
    "validRows": 0,
    "errorRows": 3
  }
}
```
**Status**: 400 Bad Request

---

### 3.4 Test CSV Import - Invalid Date Format

**Request**:
```bash
cat > invalid-dates.csv << 'EOF'
date,revenue,expenses
not-a-date,15000,5000
01/35/2026,18000,6200
EOF

curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@invalid-dates.csv"
```

**Expected**:
```json
{
  "success": false,
  "error": "CSV contains 2 invalid row(s). Please fix errors and try again.",
  "errors": [
    {
      "row": 2,
      "errors": ["Invalid date format: \"not-a-date\". Use YYYY-MM-DD or MM/DD/YYYY"]
    },
    {
      "row": 3,
      "errors": ["Invalid date format: \"01/35/2026\". Use YYYY-MM-DD or MM/DD/YYYY"]
    }
  ]
}
```
**Status**: 400 Bad Request

---

### 3.5 Test CSV Import - Out of Range Values

**Request**:
```bash
cat > out-of-range.csv << 'EOF'
date,revenue,expenses,conversion_rate,churn_rate
2026-01-01,15000,5000,150,120
EOF

curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@out-of-range.csv"
```

**Expected**:
```json
{
  "success": false,
  "error": "CSV contains 1 invalid row(s). Please fix errors and try again.",
  "errors": [
    {
      "row": 2,
      "errors": [
        "Invalid conversion_rate: \"150\". Must be between 0 and 100",
        "Invalid churn_rate: \"120\". Must be between 0 and 100"
      ]
    }
  ]
}
```
**Status**: 400 Bad Request

---

### 3.6 Test CSV Import - Empty File

**Request**:
```bash
cat > empty.csv << 'EOF'
date,revenue,expenses
EOF

curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@empty.csv"
```

**Expected**:
```json
{
  "success": false,
  "error": "CSV contains no valid data rows"
}
```
**Status**: 400 Bad Request

---

### 3.7 Test CSV Import - Non-Existent Client

**Request**:
```bash
cat > test.csv << 'EOF'
date,revenue,expenses
2026-01-01,15000,5000
EOF

curl -X POST http://localhost:3001/api/clients/999999/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.csv"
```

**Expected**:
```json
{
  "success": false,
  "error": "Client not found"
}
```
**Status**: 404 Not Found

---

### 3.8 Test CSV Import - File Too Large

**Request**:
```bash
# Generate CSV with many rows to exceed 2MB
{
  echo "date,revenue,expenses,notes"
  for i in {1..50000}; do
    echo "2026-01-01,15000,5000,This is a very long note with lots of text to increase file size significantly"
  done
} > large-import.csv

curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@large-import.csv"
```

**Expected**: 413 Payload Too Large (multer error)

---

### 3.9 Test CSV Import - Duplicate Periods (Upsert)

**Request**:
```bash
# First import
cat > first-import.csv << 'EOF'
date,revenue,expenses,notes
2026-01-01,15000,5000,Initial data
EOF

curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@first-import.csv"

# Second import with same period, different values
cat > second-import.csv << 'EOF'
date,revenue,expenses,notes
2026-01-01,20000,7000,Updated data
EOF

curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@second-import.csv"
```

**Expected**: Both succeed with 201 Created. Second import updates first record (upsert behavior).

**Verify**:
```bash
curl -X GET http://localhost:3001/api/clients/1/financials \
  -H "Authorization: Bearer $TOKEN"
# Should show revenue=20000, expenses=7000, notes="Updated data"
```

---

### 3.10 Test CSV Import - All Optional Fields

**Request**:
```bash
cat > full-fields.csv << 'EOF'
date,revenue,expenses,customers,conversion_rate,avg_revenue_per_customer,new_customers,churn_rate,notes
2026-01-01,15000,5000,120,3.5,125.00,15,2.1,Complete data with all fields populated
EOF

curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@full-fields.csv"
```

**Expected**: 201 Created with all fields saved

---

## 4. Integration Tests

### 4.1 Full Workflow - CSV Import After Client Creation

**Request**:
```bash
# 1. Create client
CLIENT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Corp",
    "email": "test@example.com",
    "tier": "business"
  }')

CLIENT_ID=$(echo $CLIENT_RESPONSE | jq -r '.id')

# 2. Import financials for new client
cat > client-financials.csv << 'EOF'
date,revenue,expenses,customers
2026-01-01,15000,5000,120
2026-02-01,18000,6200,135
EOF

curl -X POST "http://localhost:3001/api/clients/$CLIENT_ID/financials/import" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@client-financials.csv"

# 3. Verify imported data
curl -X GET "http://localhost:3001/api/clients/$CLIENT_ID/financials" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: All 3 steps succeed, final GET shows 2 financial records

---

### 4.2 Full Workflow - Document Upload Then Intervention Screenshot

**Request**:
```bash
# 1. Upload client document
curl -X POST http://localhost:3001/api/clients/1/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@contract.pdf" \
  -F "name=Service Agreement" \
  -F "type=contract"

# 2. Upload intervention screenshot
curl -X POST http://localhost:3001/api/interventions/1/screenshot \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@before.png"

curl -X POST http://localhost:3001/api/interventions/1/screenshot \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@after.png"
```

**Expected**: All uploads succeed with proper file paths

---

## 5. Error Recovery Tests

### 5.1 Partial CSV Import Failure

**Scenario**: Test that database error during import is handled gracefully

**Request**:
```bash
# Import with duplicate key (assuming unique constraint on period_year + period_month)
cat > duplicate.csv << 'EOF'
date,revenue,expenses
2026-01-01,15000,5000
2026-01-01,18000,6200
EOF

curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@duplicate.csv"
```

**Expected**: Import uses ON DUPLICATE KEY UPDATE, so both rows processed (second updates first)

---

### 5.2 Network Interruption During Upload

**Test**: Use `timeout` to simulate network interruption

**Request**:
```bash
timeout 0.1s curl -X POST http://localhost:3001/api/clients/1/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@large-file.pdf"
```

**Expected**: Connection timeout, no partial file saved (multer cleans up)

---

## 6. Performance Tests

### 6.1 Large CSV Import (Stress Test)

**Request**:
```bash
# Generate 1000 rows
{
  echo "date,revenue,expenses,customers,notes"
  for i in {1..1000}; do
    MONTH=$((i % 12 + 1))
    YEAR=$((2020 + i / 12))
    echo "$YEAR-$(printf %02d $MONTH)-01,$((15000 + RANDOM % 10000)),$((5000 + RANDOM % 3000)),$((100 + RANDOM % 50)),Month $i"
  done
} > stress-test.csv

time curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@stress-test.csv"
```

**Expected**: Completes in < 5 seconds, imports 1000 records successfully

---

### 6.2 Concurrent File Uploads

**Request**:
```bash
# Upload 5 files simultaneously
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/clients/1/documents \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@doc$i.pdf" &
done
wait
```

**Expected**: All 5 uploads succeed, files have unique UUIDs

---

## 7. Security Tests

### 7.1 SQL Injection via CSV

**Request**:
```bash
cat > injection.csv << 'EOF'
date,revenue,expenses,notes
2026-01-01,15000,5000,"'; DROP TABLE clients; --"
EOF

curl -X POST http://localhost:3001/api/clients/1/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@injection.csv"
```

**Expected**: Import succeeds, SQL injection prevented by parameterized queries

---

### 7.2 Path Traversal via Filename

**Request**:
```bash
curl -X POST http://localhost:3001/api/clients/1/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf;filename=../../etc/passwd.pdf"
```

**Expected**: File saved with sanitized UUID-based filename, no path traversal

---

### 7.3 MIME Type Spoofing

**Request**:
```bash
# Rename .exe to .pdf
echo "MZ" > malware.exe
mv malware.exe malware.pdf

curl -X POST http://localhost:3001/api/clients/1/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@malware.pdf"
```

**Expected**: Upload blocked if MIME type doesn't match (depends on multer magic number detection)

---

## Test Automation Script

Save as `test-middleware.sh`:

```bash
#!/bin/bash

# Configuration
API_URL="http://localhost:3001"
ADMIN_USER="admin"
ADMIN_PASS="admin123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Get token
echo "Logging in..."
TOKEN=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}" \
  | jq -r '.token')

if [ "$TOKEN" == "null" ]; then
  echo -e "${RED}Login failed${NC}"
  exit 1
fi

echo -e "${GREEN}Login successful${NC}"

# Test 1: CSV Import Valid Data
echo -e "\nTest 1: CSV Import - Valid Data"
cat > /tmp/test-valid.csv << 'EOF'
date,revenue,expenses,customers
2026-01-01,15000,5000,120
EOF

RESPONSE=$(curl -s -X POST $API_URL/api/clients/1/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-valid.csv")

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL: $RESPONSE${NC}"
fi

# Test 2: CSV Import Invalid Data
echo -e "\nTest 2: CSV Import - Invalid Data"
cat > /tmp/test-invalid.csv << 'EOF'
date,revenue,expenses
invalid-date,abc,xyz
EOF

RESPONSE=$(curl -s -X POST $API_URL/api/clients/1/financials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-invalid.csv")

if echo "$RESPONSE" | jq -e '.success == false and (.errors | length > 0)' > /dev/null; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL: $RESPONSE${NC}"
fi

# Clean up
rm /tmp/test-*.csv

echo -e "\nTests complete"
```

Run with: `chmod +x test-middleware.sh && ./test-middleware.sh`

---

## Notes

- Replace `$TOKEN` with actual JWT token in all examples
- Replace client IDs (1, 999, etc.) with valid IDs from your database
- All test files created in examples should be cleaned up after testing
- For production testing, use dedicated test environment
- Monitor server logs for error details during tests
