import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import { AuthRequest } from '../types/index.js';

interface CSVImportOptions {
  requiredFields?: string[];
  allowedFields?: string[];
  maxFileSize?: number;
  maxRecords?: number;
}

interface CSVImportResult {
  success: boolean;
  data?: any[];
  errors?: string[];
  totalRows?: number;
  processedRows?: number;
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

export function csvImport(options: CSVImportOptions = {}) {
  const {
    requiredFields = [],
    allowedFields = [],
    maxFileSize = 10 * 1024 * 1024,
    maxRecords = 1000,
  } = options;

  return [
    upload.single('file'),
    (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (req.file.size > maxFileSize) {
        return res.status(400).json({ error: 'File size exceeds limit' });
      }

      const fileContent = req.file.buffer.toString('utf-8');

      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
          try {
            const { data, errors, meta } = results;

            if (data.length > maxRecords) {
              return res.status(400).json({
                error: `File contains ${data.length} records. Maximum allowed is ${maxRecords}`
              });
            }

            // Validate required fields
            if (requiredFields.length > 0) {
              const missingFields = requiredFields.filter(field =>
                !meta.fields?.includes(field)
              );

              if (missingFields.length > 0) {
                return res.status(400).json({
                  error: `Missing required fields: ${missingFields.join(', ')}`
                });
              }
            }

            // Filter and validate data
            let processedData = data;
            let validationErrors: string[] = [];

            if (allowedFields.length > 0) {
              processedData = data.map((row: any) => {
                const filteredRow: any = {};
                allowedFields.forEach(field => {
                  if (field in row) {
                    filteredRow[field] = row[field];
                  }
                });
                return filteredRow;
              });
            }

            // Basic validation
            processedData = processedData.filter((row: any, index: number) => {
              // Skip completely empty rows
              const hasData = Object.values(row).some(value =>
                value !== null && value !== undefined && (value as string).toString().trim() !== ''
              );

              if (!hasData) {
                validationErrors.push(`Row ${index + 1}: Empty row skipped`);
                return false;
              }

              return true;
            });

            const result: CSVImportResult = {
              success: true,
              data: processedData,
              errors: validationErrors.length > 0 ? validationErrors : undefined,
              totalRows: data.length,
              processedRows: processedData.length,
            };

            req.csvData = result;
            next();
          } catch (error) {
            console.error('CSV parsing error:', error);
            res.status(500).json({ error: 'Failed to parse CSV file' });
          }
        },
        error: (error: Error) => {
          console.error('CSV parsing error:', error);
          res.status(500).json({ error: 'Failed to parse CSV file: ' + error.message });
        },
      });
    },
  ];
}

// Extend the Request interface to include csvData
declare global {
  namespace Express {
    interface Request {
      csvData?: CSVImportResult;
    }
  }
}

export { upload };

// Named aliases used by clientFinancials.ts:
//   csvUpload.single('file')  — multer instance for CSV file uploads
//   parseFinancialsCSV        — standalone middleware that parses uploaded CSV into req.csvData
export const csvUpload = upload;

/**
 * Parse and validate CSV financial data.
 * Expected columns: date, revenue, expenses (required), customers, notes, etc. (optional).
 * Attaches to req.csvData with shape: { valid, errors, totalRows, validRows, errorRows }
 * matching the csvImport.js contract used by clientFinancials.ts.
 */
export function parseFinancialsCSV(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No CSV file uploaded' });
    return;
  }

  const csvContent = req.file.buffer.toString('utf8');

  Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_'),
    complete: (results: Papa.ParseResult<any>) => {
      try {
        const rowErrors: Array<{ row: number; errors: string[] }> = [];
        const validRecords: any[] = [];

        // Required columns
        const requiredCols = ['date', 'revenue', 'expenses'];
        const firstRow = results.data[0] || {};
        const missingCols = requiredCols.filter(col => !(col in firstRow));

        if (missingCols.length > 0) {
          res.status(400).json({
            success: false,
            error: `Missing required columns: ${missingCols.join(', ')}. Required: date, revenue, expenses`,
          });
          return;
        }

        // Validate each row
        results.data.forEach((row: any, index: number) => {
          const errs: string[] = [];
          const rowNum = index + 2; // +2: 0-indexed + header row

          // Validate date
          if (!row.date || !row.date.trim()) {
            errs.push('Missing date');
          } else {
            const dateValue = new Date(row.date);
            if (isNaN(dateValue.getTime())) {
              errs.push(`Invalid date format: "${row.date}". Use YYYY-MM-DD or MM/DD/YYYY`);
            }
          }

          // Validate revenue
          const revenue = parseFloat(row.revenue);
          if (isNaN(revenue) || revenue < 0) {
            errs.push(`Invalid revenue: "${row.revenue}". Must be a non-negative number`);
          }

          // Validate expenses
          const expenses = parseFloat(row.expenses);
          if (isNaN(expenses) || expenses < 0) {
            errs.push(`Invalid expenses: "${row.expenses}". Must be a non-negative number`);
          }

          // Validate optional numeric fields
          if (row.customers !== undefined && row.customers !== '') {
            const customers = parseInt(row.customers, 10);
            if (isNaN(customers) || customers < 0) {
              errs.push(`Invalid customers: "${row.customers}". Must be a non-negative integer`);
            }
          }

          if (row.conversion_rate !== undefined && row.conversion_rate !== '') {
            const cr = parseFloat(row.conversion_rate);
            if (isNaN(cr) || cr < 0 || cr > 100) {
              errs.push(`Invalid conversion_rate: "${row.conversion_rate}". Must be between 0 and 100`);
            }
          }

          if (row.avg_revenue_per_customer !== undefined && row.avg_revenue_per_customer !== '') {
            const avgRev = parseFloat(row.avg_revenue_per_customer);
            if (isNaN(avgRev) || avgRev < 0) {
              errs.push(`Invalid avg_revenue_per_customer: must be non-negative`);
            }
          }

          if (row.new_customers !== undefined && row.new_customers !== '') {
            const nc = parseInt(row.new_customers, 10);
            if (isNaN(nc) || nc < 0) {
              errs.push(`Invalid new_customers: must be a non-negative integer`);
            }
          }

          if (row.churn_rate !== undefined && row.churn_rate !== '') {
            const churn = parseFloat(row.churn_rate);
            if (isNaN(churn) || churn < 0 || churn > 100) {
              errs.push(`Invalid churn_rate: must be between 0 and 100`);
            }
          }

          if (errs.length > 0) {
            rowErrors.push({ row: rowNum, errors: errs });
          } else {
            validRecords.push({
              date: row.date,
              revenue: parseFloat(row.revenue),
              expenses: parseFloat(row.expenses),
              customers: row.customers ? parseInt(row.customers, 10) : null,
              conversion_rate: row.conversion_rate ? parseFloat(row.conversion_rate) : null,
              avg_revenue_per_customer: row.avg_revenue_per_customer ? parseFloat(row.avg_revenue_per_customer) : null,
              new_customers: row.new_customers ? parseInt(row.new_customers, 10) : null,
              churn_rate: row.churn_rate ? parseFloat(row.churn_rate) : null,
              notes: row.notes ? row.notes.trim() : null,
            });
          }
        });

        // Attach with shape matching csvImport.js (used by clientFinancials.ts)
        (req as any).csvData = {
          valid: validRecords,
          errors: rowErrors,
          totalRows: results.data.length,
          validRows: validRecords.length,
          errorRows: rowErrors.length,
        };

        next();
      } catch (error) {
        console.error('parseFinancialsCSV error:', error);
        res.status(500).json({ error: 'Failed to parse CSV file' });
      }
    },
    error: (error: Error) => {
      console.error('parseFinancialsCSV parse error:', error);
      res.status(400).json({
        success: false,
        error: `CSV parsing failed: ${error.message}`,
      });
    },
  });
}