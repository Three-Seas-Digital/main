import multer from 'multer';
import Papa from 'papaparse';

// Use memory storage for CSV files (they're typically small)
const storage = multer.memoryStorage();

const csvFilter = (req, file, cb) => {
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
  if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

// Multer instance for CSV uploads
export const csvUpload = multer({
  storage,
  fileFilter: csvFilter,
  limits: { fileSize: 2097152 }, // 2MB limit for CSV files
});

/**
 * Parse and validate CSV financial data
 * Expected columns: date, revenue, expenses, customers, notes (minimum)
 * Optional columns: conversion_rate, avg_revenue_per_customer, new_customers, churn_rate
 */
export function parseFinancialsCSV(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No CSV file uploaded'
    });
  }

  const csvContent = req.file.buffer.toString('utf8');

  Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
    complete: (results) => {
      const errors = [];
      const validRecords = [];

      // Required columns
      const requiredCols = ['date', 'revenue', 'expenses'];
      const firstRow = results.data[0] || {};
      const missingCols = requiredCols.filter(col => !(col in firstRow));

      if (missingCols.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required columns: ${missingCols.join(', ')}. Required: date, revenue, expenses`,
        });
      }

      // Validate each row
      results.data.forEach((row, index) => {
        const rowErrors = [];
        const rowNum = index + 2; // +2 because: 0-indexed + 1 for header row

        // Validate date
        if (!row.date || !row.date.trim()) {
          rowErrors.push(`Missing date`);
        } else {
          const dateValue = new Date(row.date);
          if (isNaN(dateValue.getTime())) {
            rowErrors.push(`Invalid date format: "${row.date}". Use YYYY-MM-DD or MM/DD/YYYY`);
          }
        }

        // Validate revenue
        const revenue = parseFloat(row.revenue);
        if (isNaN(revenue) || revenue < 0) {
          rowErrors.push(`Invalid revenue: "${row.revenue}". Must be a non-negative number`);
        }

        // Validate expenses
        const expenses = parseFloat(row.expenses);
        if (isNaN(expenses) || expenses < 0) {
          rowErrors.push(`Invalid expenses: "${row.expenses}". Must be a non-negative number`);
        }

        // Validate optional numeric fields
        if (row.customers !== undefined && row.customers !== '') {
          const customers = parseInt(row.customers, 10);
          if (isNaN(customers) || customers < 0) {
            rowErrors.push(`Invalid customers: "${row.customers}". Must be a non-negative integer`);
          }
        }

        if (row.conversion_rate !== undefined && row.conversion_rate !== '') {
          const conversionRate = parseFloat(row.conversion_rate);
          if (isNaN(conversionRate) || conversionRate < 0 || conversionRate > 100) {
            rowErrors.push(`Invalid conversion_rate: "${row.conversion_rate}". Must be between 0 and 100`);
          }
        }

        if (row.avg_revenue_per_customer !== undefined && row.avg_revenue_per_customer !== '') {
          const avgRev = parseFloat(row.avg_revenue_per_customer);
          if (isNaN(avgRev) || avgRev < 0) {
            rowErrors.push(`Invalid avg_revenue_per_customer: "${row.avg_revenue_per_customer}". Must be non-negative`);
          }
        }

        if (row.new_customers !== undefined && row.new_customers !== '') {
          const newCustomers = parseInt(row.new_customers, 10);
          if (isNaN(newCustomers) || newCustomers < 0) {
            rowErrors.push(`Invalid new_customers: "${row.new_customers}". Must be a non-negative integer`);
          }
        }

        if (row.churn_rate !== undefined && row.churn_rate !== '') {
          const churnRate = parseFloat(row.churn_rate);
          if (isNaN(churnRate) || churnRate < 0 || churnRate > 100) {
            rowErrors.push(`Invalid churn_rate: "${row.churn_rate}". Must be between 0 and 100`);
          }
        }

        if (rowErrors.length > 0) {
          errors.push({ row: rowNum, errors: rowErrors });
        } else {
          // Build valid record
          const record = {
            date: row.date,
            revenue: parseFloat(row.revenue),
            expenses: parseFloat(row.expenses),
            customers: row.customers ? parseInt(row.customers, 10) : null,
            conversion_rate: row.conversion_rate ? parseFloat(row.conversion_rate) : null,
            avg_revenue_per_customer: row.avg_revenue_per_customer ? parseFloat(row.avg_revenue_per_customer) : null,
            new_customers: row.new_customers ? parseInt(row.new_customers, 10) : null,
            churn_rate: row.churn_rate ? parseFloat(row.churn_rate) : null,
            notes: row.notes ? row.notes.trim() : null,
          };
          validRecords.push(record);
        }
      });

      // Attach parsed data and errors to request
      req.csvData = {
        valid: validRecords,
        errors: errors,
        totalRows: results.data.length,
        validRows: validRecords.length,
        errorRows: errors.length,
      };

      next();
    },
    error: (error) => {
      return res.status(400).json({
        success: false,
        error: `CSV parsing failed: ${error.message}`,
      });
    },
  });
}

/**
 * Async wrapper for middleware
 */
export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
