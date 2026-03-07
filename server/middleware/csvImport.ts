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