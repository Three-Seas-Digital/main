import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { csvUpload, parseFinancialsCSV } from '../middleware/csvImport.js';
import { generateId } from '../utils/generateId.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/clients/:clientId/financials - List all financial records for a client
router.get('/:clientId/financials', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    const { startYear, startMonth, endYear, endMonth } = req.query;

    let query = 'SELECT * FROM client_financials WHERE client_id = ?';
    const params: any[] = [clientId];

    // Add date range filters if provided
    if (startYear && startMonth) {
      query += ' AND (period_year > ? OR (period_year = ? AND period_month >= ?))';
      params.push(parseInt(startYear as string), parseInt(startYear as string), parseInt(startMonth as string));
    }
    if (endYear && endMonth) {
      query += ' AND (period_year < ? OR (period_year = ? AND period_month <= ?))';
      params.push(parseInt(endYear as string), parseInt(endYear as string), parseInt(endMonth as string));
    }

    query += ' ORDER BY period_year DESC, period_month DESC';

    const [rows] = await // @ts-ignore
  pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching financials:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/clients/:clientId/financials - Create a new financial record
router.post('/:clientId/financials', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    const {
      period_year,
      period_month,
      gross_revenue,
      net_revenue,
      online_revenue,
      offline_revenue,
      new_customer_revenue,
      returning_customer_revenue,
      transaction_count,
      average_order_value,
      cost_of_goods_sold,
      total_marketing_spend,
      our_fees,
      total_expenses,
      gross_profit,
      net_profit,
      profit_margin,
      new_customers,
      total_customers,
      customer_acquisition_cost,
      data_completeness,
      source,
      notes
    } = req.body;

    // Validate required fields
    if (!period_year || !period_month) {
      res.status(400).json({ success: false, error: 'Period year and month are required' });
      return;
    }

    // Check for duplicate period
    const [existing] = await // @ts-ignore
  pool.query(
      'SELECT id FROM client_financials WHERE client_id = ? AND period_year = ? AND period_month = ?',
      [clientId, period_year, period_month]
    );

    if (existing.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Financial record already exists for this period. Use PUT to update.'
      });
      return;
    }

    const id = generateId();
    await // @ts-ignore
  pool.query(
      `INSERT INTO client_financials (
        id, client_id, period_year, period_month, gross_revenue, net_revenue,
        online_revenue, offline_revenue, new_customer_revenue, returning_customer_revenue,
        transaction_count, average_order_value, cost_of_goods_sold, total_marketing_spend,
        our_fees, total_expenses, gross_profit, net_profit, profit_margin,
        new_customers, total_customers, customer_acquisition_cost,
        data_completeness, source, notes, entered_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id, clientId, period_year, period_month, gross_revenue || null, net_revenue || null,
        online_revenue || null, offline_revenue || null, new_customer_revenue || null,
        returning_customer_revenue || null, transaction_count || null, average_order_value || null,
        cost_of_goods_sold || null, total_marketing_spend || null, our_fees || null,
        total_expenses || null, gross_profit || null, net_profit || null, profit_margin || null,
        new_customers || null, total_customers || null, customer_acquisition_cost || null,
        data_completeness || 'partial', source || 'manual', notes || null, req.user?.userId
      ]
    );

    res.status(201).json({
      success: true,
      data: { id, message: 'Financial record created' }
    });
  } catch (err) {
    console.error('Error creating financial record:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/clients/:clientId/financials/:id - Update a financial record
router.put('/:clientId/financials/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response): Promise<void> => {
  try {
    const { id, clientId } = req.params;
    const {
      gross_revenue,
      net_revenue,
      online_revenue,
      offline_revenue,
      new_customer_revenue,
      returning_customer_revenue,
      transaction_count,
      average_order_value,
      cost_of_goods_sold,
      total_marketing_spend,
      our_fees,
      total_expenses,
      gross_profit,
      net_profit,
      profit_margin,
      new_customers,
      total_customers,
      customer_acquisition_cost,
      data_completeness,
      source,
      notes
    } = req.body;

    // Verify record exists and belongs to client
    const [existing] = await // @ts-ignore
  pool.query(
      'SELECT id FROM client_financials WHERE id = ? AND client_id = ?',
      [id, clientId]
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Financial record not found' });
      return;
    }

    await // @ts-ignore
  pool.query(
      `UPDATE client_financials SET
        gross_revenue = ?, net_revenue = ?, online_revenue = ?, offline_revenue = ?,
        new_customer_revenue = ?, returning_customer_revenue = ?, transaction_count = ?,
        average_order_value = ?, cost_of_goods_sold = ?, total_marketing_spend = ?,
        our_fees = ?, total_expenses = ?, gross_profit = ?, net_profit = ?,
        profit_margin = ?, new_customers = ?, total_customers = ?,
        customer_acquisition_cost = ?, data_completeness = ?, source = ?, notes = ?,
        updated_at = NOW()
      WHERE id = ? AND client_id = ?`,
      [
        gross_revenue || null, net_revenue || null, online_revenue || null, offline_revenue || null,
        new_customer_revenue || null, returning_customer_revenue || null, transaction_count || null,
        average_order_value || null, cost_of_goods_sold || null, total_marketing_spend || null,
        our_fees || null, total_expenses || null, gross_profit || null, net_profit || null,
        profit_margin || null, new_customers || null, total_customers || null,
        customer_acquisition_cost || null, data_completeness || 'partial', source || 'manual',
        notes || null, id, clientId
      ]
    );

    res.json({ success: true, data: { message: 'Financial record updated' } });
  } catch (err) {
    console.error('Error updating financial record:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/clients/:clientId/financials/:id - Delete a financial record
router.delete('/:clientId/financials/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response): Promise<void> => {
  try {
    const { id, clientId } = req.params;

    // Verify record exists and belongs to client
    const [existing] = await // @ts-ignore
  pool.query(
      'SELECT id FROM client_financials WHERE id = ? AND client_id = ?',
      [id, clientId]
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Financial record not found' });
      return;
    }

    // Cascade delete related records
    await // @ts-ignore
  pool.query('DELETE FROM client_revenue_channels WHERE financial_id = ?', [id]);
    await // @ts-ignore
  pool.query('DELETE FROM client_revenue_products WHERE financial_id = ?', [id]);
    await // @ts-ignore
  pool.query('DELETE FROM client_financials WHERE id = ? AND client_id = ?', [id, clientId]);

    res.json({ success: true, data: { message: 'Financial record deleted' } });
  } catch (err) {
    console.error('Error deleting financial record:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/clients/:clientId/financials/summary - Aggregate summary
router.get('/:clientId/financials/summary', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    const { startYear, startMonth, endYear, endMonth } = req.query;

    let whereClause = 'WHERE client_id = ?';
    const params: any[] = [clientId];

    // Add date range filters if provided
    if (startYear && startMonth) {
      whereClause += ' AND (period_year > ? OR (period_year = ? AND period_month >= ?))';
      params.push(parseInt(startYear as string), parseInt(startYear as string), parseInt(startMonth as string));
    }
    if (endYear && endMonth) {
      whereClause += ' AND (period_year < ? OR (period_year = ? AND period_month <= ?))';
      params.push(parseInt(endYear as string), parseInt(endYear as string), parseInt(endMonth as string));
    }

    const [summary] = await // @ts-ignore
  pool.query(
      `SELECT
        SUM(gross_revenue) as total_revenue,
        SUM(total_expenses) as total_expenses,
        SUM(net_profit) as total_profit,
        AVG(gross_revenue) as avg_monthly_revenue,
        AVG(total_expenses) as avg_monthly_expenses,
        AVG(net_profit) as avg_monthly_profit,
        AVG(profit_margin) as avg_profit_margin,
        SUM(transaction_count) as total_transactions,
        AVG(average_order_value) as avg_order_value,
        SUM(new_customers) as total_new_customers,
        AVG(customer_acquisition_cost) as avg_cac,
        COUNT(*) as period_count,
        MIN(CONCAT(period_year, '-', LPAD(period_month, 2, '0'))) as first_period,
        MAX(CONCAT(period_year, '-', LPAD(period_month, 2, '0'))) as last_period
      FROM client_financials
      ${whereClause}`,
      params
    );

    // Calculate conversion metrics if we have transaction and customer data
    const [conversion] = await // @ts-ignore
  pool.query(
      `SELECT
        SUM(transaction_count) / NULLIF(SUM(total_customers), 0) as avg_conversion_rate,
        SUM(gross_revenue) / NULLIF(SUM(total_customers), 0) as revenue_per_customer,
        SUM(total_marketing_spend) / NULLIF(SUM(new_customers), 0) as cost_per_lead
      FROM client_financials
      ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        ...summary[0],
        ...conversion[0]
      }
    });
  } catch (err) {
    console.error('Error fetching financial summary:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/clients/:clientId/financials/channels - Revenue by channel breakdown
router.get('/:clientId/financials/channels', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    const { startYear, startMonth, endYear, endMonth } = req.query;

    let whereClause = 'WHERE rc.client_id = ?';
    const params: any[] = [clientId];

    // Add date range filters if provided
    if (startYear && startMonth) {
      whereClause += ' AND (cf.period_year > ? OR (cf.period_year = ? AND cf.period_month >= ?))';
      params.push(parseInt(startYear as string), parseInt(startYear as string), parseInt(startMonth as string));
    }
    if (endYear && endMonth) {
      whereClause += ' AND (cf.period_year < ? OR (cf.period_year = ? AND cf.period_month <= ?))';
      params.push(parseInt(endYear as string), parseInt(endYear as string), parseInt(endMonth as string));
    }

    const [channels] = await // @ts-ignore
  pool.query(
      `SELECT
        rc.channel_name,
        SUM(rc.revenue) as total_revenue,
        SUM(rc.transaction_count) as total_transactions,
        AVG(rc.conversion_rate) as avg_conversion_rate,
        SUM(rc.cost) as total_cost,
        AVG(rc.roi) as avg_roi,
        COUNT(DISTINCT rc.financial_id) as period_count
      FROM client_revenue_channels rc
      JOIN client_financials cf ON rc.financial_id = cf.id
      ${whereClause}
      GROUP BY rc.channel_name
      ORDER BY total_revenue DESC`,
      params
    );

    res.json({ success: true, data: channels });
  } catch (err) {
    console.error('Error fetching revenue channels:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/clients/:clientId/financials/products - Revenue by product breakdown
router.get('/:clientId/financials/products', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    const { startYear, startMonth, endYear, endMonth } = req.query;

    let whereClause = 'WHERE rp.client_id = ?';
    const params: any[] = [clientId];

    // Add date range filters if provided
    if (startYear && startMonth) {
      whereClause += ' AND (cf.period_year > ? OR (cf.period_year = ? AND cf.period_month >= ?))';
      params.push(parseInt(startYear as string), parseInt(startYear as string), parseInt(startMonth as string));
    }
    if (endYear && endMonth) {
      whereClause += ' AND (cf.period_year < ? OR (cf.period_year = ? AND cf.period_month <= ?))';
      params.push(parseInt(endYear as string), parseInt(endYear as string), parseInt(endMonth as string));
    }

    const [products] = await // @ts-ignore
  pool.query(
      `SELECT
        rp.product_name,
        SUM(rp.revenue) as total_revenue,
        SUM(rp.units_sold) as total_units,
        AVG(rp.average_price) as avg_price,
        AVG(rp.margin_percent) as avg_margin,
        COUNT(DISTINCT rp.financial_id) as period_count
      FROM client_revenue_products rp
      JOIN client_financials cf ON rp.financial_id = cf.id
      ${whereClause}
      GROUP BY rp.product_name
      ORDER BY total_revenue DESC`,
      params
    );

    res.json({ success: true, data: products });
  } catch (err) {
    console.error('Error fetching revenue products:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/clients/:clientId/financials/ad-spend - Ad spend data with ROAS calculation
router.get('/:clientId/financials/ad-spend', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    const { startYear, startMonth, endYear, endMonth } = req.query;

    let whereClause = 'WHERE client_id = ?';
    const params: any[] = [clientId];

    // Add date range filters if provided
    if (startYear && startMonth) {
      whereClause += ' AND (period_year > ? OR (period_year = ? AND period_month >= ?))';
      params.push(parseInt(startYear as string), parseInt(startYear as string), parseInt(startMonth as string));
    }
    if (endYear && endMonth) {
      whereClause += ' AND (period_year < ? OR (period_year = ? AND period_month <= ?))';
      params.push(parseInt(endYear as string), parseInt(endYear as string), parseInt(endMonth as string));
    }

    const [adSpend] = await // @ts-ignore
  pool.query(
      `SELECT
        id, client_id, platform, period_year, period_month, spend,
        impressions, clicks, conversions, conversion_value, ctr, cpc, cpa, roas,
        source, created_at
      FROM client_ad_spend
      ${whereClause}
      ORDER BY period_year DESC, period_month DESC, platform`,
      params
    );

    // Calculate summary metrics
    const [summary] = await // @ts-ignore
  pool.query(
      `SELECT
        SUM(spend) as total_spend,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions,
        SUM(conversion_value) as total_conversion_value,
        AVG(ctr) as avg_ctr,
        AVG(cpc) as avg_cpc,
        AVG(cpa) as avg_cpa,
        SUM(conversion_value) / NULLIF(SUM(spend), 0) as overall_roas
      FROM client_ad_spend
      ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        records: adSpend,
        summary: summary[0]
      }
    });
  } catch (err) {
    console.error('Error fetching ad spend:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/clients/:clientId/financials/ad-spend - Create ad spend record
router.post('/:clientId/financials/ad-spend', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    const {
      platform,
      period_year,
      period_month,
      spend,
      impressions,
      clicks,
      conversions,
      conversion_value,
      ctr,
      cpc,
      cpa,
      roas,
      source
    } = req.body;

    // Validate required fields
    if (!platform || !period_year || !period_month || spend === undefined) {
      res.status(400).json({
        success: false,
        error: 'Platform, period, and spend are required'
      });
      return;
    }

    // Check for duplicate
    const [existing] = await // @ts-ignore
  pool.query(
      `SELECT id FROM client_ad_spend
       WHERE client_id = ? AND platform = ? AND period_year = ? AND period_month = ?`,
      [clientId, platform, period_year, period_month]
    );

    if (existing.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Ad spend record already exists for this platform and period. Use PUT to update.'
      });
      return;
    }

    const id = generateId();
    await // @ts-ignore
  pool.query(
      `INSERT INTO client_ad_spend (
        id, client_id, platform, period_year, period_month, spend,
        impressions, clicks, conversions, conversion_value,
        ctr, cpc, cpa, roas, source, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id, clientId, platform, period_year, period_month, spend,
        impressions || null, clicks || null, conversions || null, conversion_value || null,
        ctr || null, cpc || null, cpa || null, roas || null, source || 'manual'
      ]
    );

    res.status(201).json({
      success: true,
      data: { id, message: 'Ad spend record created' }
    });
  } catch (err) {
    console.error('Error creating ad spend record:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/clients/:clientId/financials/ad-spend/:id - Update ad spend record
router.put('/:clientId/financials/ad-spend/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response): Promise<void> => {
  try {
    const { id, clientId } = req.params;
    const {
      spend,
      impressions,
      clicks,
      conversions,
      conversion_value,
      ctr,
      cpc,
      cpa,
      roas,
      source
    } = req.body;

    // Verify record exists and belongs to client
    const [existing] = await // @ts-ignore
  pool.query(
      'SELECT id FROM client_ad_spend WHERE id = ? AND client_id = ?',
      [id, clientId]
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Ad spend record not found' });
      return;
    }

    await // @ts-ignore
  pool.query(
      `UPDATE client_ad_spend SET
        spend = ?, impressions = ?, clicks = ?, conversions = ?,
        conversion_value = ?, ctr = ?, cpc = ?, cpa = ?, roas = ?, source = ?
      WHERE id = ? AND client_id = ?`,
      [
        spend || null, impressions || null, clicks || null, conversions || null,
        conversion_value || null, ctr || null, cpc || null, cpa || null,
        roas || null, source || 'manual', id, clientId
      ]
    );

    res.json({ success: true, data: { message: 'Ad spend record updated' } });
  } catch (err) {
    console.error('Error updating ad spend record:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/clients/:clientId/financials/import - Bulk import from CSV
router.post(
  '/:clientId/financials/import',
  authenticateToken,
  requireRole('owner', 'admin', 'manager'),
  csvUpload.single('file'),
  parseFinancialsCSV,
  async (req: any, res: Response): Promise<void> => {
    try {
      const { clientId } = req.params;
      const { valid, errors, totalRows, validRows, errorRows } = (req as any).csvData;

      // Verify client exists
      const [clients] = await // @ts-ignore
  pool.query('SELECT id FROM clients WHERE id = ?', [clientId]);
      if (clients.length === 0) {
        res.status(404).json({ success: false, error: 'Client not found' });
        return;
      }

      // If there are validation errors, return them without importing
      if (errorRows > 0) {
        res.status(400).json({
          success: false,
          error: `CSV contains ${errorRows} invalid row(s). Please fix errors and try again.`,
          errors: errors,
          summary: {
            totalRows,
            validRows,
            errorRows,
          },
        });
        return;
      }

      // No valid records to import
      if (validRows === 0) {
        res.status(400).json({
          success: false,
          error: 'CSV contains no valid data rows',
        });
        return;
      }

      // Map CSV columns to database schema
      const insertPromises = valid.map((record: any) => {
        const recordDate = new Date(record.date);
        const periodYear = recordDate.getFullYear();
        const periodMonth = recordDate.getMonth() + 1; // JS months are 0-indexed

        // Map simple CSV format to comprehensive DB schema
        return // @ts-ignore
  pool.query(
          `INSERT INTO client_financials (
            client_id, period_year, period_month, gross_revenue, net_revenue,
            total_expenses, gross_profit, net_profit, new_customers, total_customers,
            data_completeness, source, notes, entered_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            gross_revenue = VALUES(gross_revenue),
            net_revenue = VALUES(net_revenue),
            total_expenses = VALUES(total_expenses),
            gross_profit = VALUES(gross_profit),
            net_profit = VALUES(net_profit),
            new_customers = VALUES(new_customers),
            total_customers = VALUES(total_customers),
            notes = VALUES(notes),
            updated_at = NOW()`,
          [
            clientId,
            periodYear,
            periodMonth,
            record.revenue, // gross_revenue
            record.revenue, // net_revenue (assume no discounts in simple CSV)
            record.expenses,
            record.revenue - record.expenses, // gross_profit
            record.revenue - record.expenses, // net_profit
            record.new_customers,
            record.customers,
            'partial', // data_completeness (CSV has limited fields)
            'imported',
            record.notes,
            req.user?.userId,
          ]
        );
      });

      await Promise.all(insertPromises);

      res.status(201).json({
        success: true,
        data: {
          message: `Successfully imported ${validRows} financial record(s)`,
          imported: validRows,
          total: totalRows,
        },
      });
    } catch (err) {
      console.error('Error importing financials:', err);
      // Check for specific DB errors
      if ((err as any).code === 'ER_DUP_ENTRY') {
        res.status(400).json({
          success: false,
          error: 'Duplicate records found. CSV import uses ON DUPLICATE KEY UPDATE to handle conflicts.',
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: 'Database error during import',
      });
    }
  }
);

export default router;
