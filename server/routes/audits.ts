import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/audits/client/:clientId - List all audit versions for client
router.get('/client/:clientId', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(
      `SELECT id, client_id, version, status, overall_score, audit_date,
              published_at, created_by, created_at, updated_at
       FROM business_audits WHERE client_id = ? ORDER BY version DESC`,
      [req.params.clientId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/audits/client/:clientId error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/audits/client/:clientId - Create new audit version
router.post('/client/:clientId', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    const { audit_date, notes } = req.body;

    // Get next version number
    const [last] = await pool.query(
      'SELECT MAX(version) as maxVersion FROM business_audits WHERE client_id = ?',
      [clientId]
    );
    const nextVersion = (last[0].maxVersion || 0) + 1;

    const id = generateId();
    await pool.query(
      `INSERT INTO business_audits (id, client_id, version, status, audit_date, notes, created_by, created_at)
       VALUES (?, ?, ?, 'draft', ?, ?, ?, NOW())`,
      [id, clientId, nextVersion, audit_date || new Date().toISOString().slice(0, 10), notes || null, req.user?.id]
    );
    res.status(201).json({ success: true, data: { id, version: nextVersion, message: 'Audit created' } });
  } catch (err) {
    console.error('POST /api/audits/client/:clientId error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/audits/:id - Get audit detail with all scores
router.get('/:id', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const [audits] = await pool.query(
      'SELECT * FROM business_audits WHERE id = ?',
      [req.params.id]
    );
    if (audits.length === 0) {
      res.status(404).json({ success: false, error: 'Audit not found' });
      return;
    }

    const audit = audits[0];

    // Fetch category scores with category names
    const [scores] = await pool.query(
      `SELECT s.*, c.name as category_name, c.max_score
       FROM audit_scores s
       JOIN audit_categories c ON s.category_id = c.id
       WHERE s.audit_id = ?
       ORDER BY c.sort_order`,
      [req.params.id]
    );

    // Fetch subcriteria scores for each category score
    for (const score of scores) {
      const [subScores] = await pool.query(
        `SELECT ss.*, sub.name as subcriteria_name, sub.max_score as sub_max_score
         FROM audit_subcriteria_scores ss
         JOIN audit_subcriteria sub ON ss.subcriteria_id = sub.id
         WHERE ss.audit_score_id = ?`,
        [score.id]
      );
      score.subcriteria_scores = subScores;
      // Parse JSON fields
      if (score.evidence_urls && typeof score.evidence_urls === 'string') {
        try { score.evidence_urls = JSON.parse(score.evidence_urls); } catch { /* leave as-is */ }
      }
    }

    audit.scores = scores;
    res.json({ success: true, data: audit });
  } catch (err) {
    console.error('GET /api/audits/:id error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/audits/:id - Update audit
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response): Promise<void> => {
  try {
    const { audit_date, notes } = req.body;
    await pool.query(
      'UPDATE business_audits SET audit_date = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [audit_date || null, notes || null, req.params.id]
    );
    res.json({ success: true, data: { message: 'Audit updated' } });
  } catch (err) {
    console.error('PUT /api/audits/:id error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/audits/:id/publish - Publish audit
router.post('/:id/publish', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response): Promise<void> => {
  try {
    await pool.query(
      "UPDATE business_audits SET status = 'published', published_at = NOW(), updated_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    res.json({ success: true, data: { message: 'Audit published' } });
  } catch (err) {
    console.error('POST /api/audits/:id/publish error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/audits/:id/scores - Bulk upsert category scores
router.post('/:id/scores', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response): Promise<void> => {
  try {
    const { scores } = req.body; // [{category_id, score, weight, internal_notes, client_summary, evidence_urls}]
    const auditId = req.params.id;

    if (!Array.isArray(scores) || scores.length === 0) {
      res.status(400).json({ success: false, error: 'Scores array required' });
      return;
    }

    for (const s of scores) {
      // Check if score exists for this audit + category
      const [existing] = await pool.query(
        'SELECT id FROM audit_scores WHERE audit_id = ? AND category_id = ?',
        [auditId, s.category_id]
      );

      if (existing.length > 0) {
        await pool.query(
          `UPDATE audit_scores SET score = ?, weight = ?, internal_notes = ?,
           client_summary = ?, evidence_urls = ? WHERE id = ?`,
          [s.score, s.weight || 1, s.internal_notes || null,
           s.client_summary || null, s.evidence_urls ? JSON.stringify(s.evidence_urls) : null,
           existing[0].id]
        );
      } else {
        const scoreId = generateId();
        await pool.query(
          `INSERT INTO audit_scores (id, audit_id, category_id, score, weight, internal_notes, client_summary, evidence_urls)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [scoreId, auditId, s.category_id, s.score, s.weight || 1, s.internal_notes || null,
           s.client_summary || null, s.evidence_urls ? JSON.stringify(s.evidence_urls) : null]
        );
      }
    }

    // Auto-calculate overall_score as weighted average
    const [allScores] = await pool.query(
      'SELECT score, weight FROM audit_scores WHERE audit_id = ?',
      [auditId]
    );
    let totalWeight = 0;
    let weightedSum = 0;
    for (const r of allScores) {
      totalWeight += r.weight;
      weightedSum += r.score * r.weight;
    }
    const overall = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
    await pool.query(
      'UPDATE business_audits SET overall_score = ?, updated_at = NOW() WHERE id = ?',
      [overall, auditId]
    );

    res.json({ success: true, data: { overall_score: overall, message: 'Scores saved' } });
  } catch (err) {
    console.error('POST /api/audits/:id/scores error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/audits/:id/subcriteria-scores - Bulk upsert subcriteria scores
router.post('/:id/subcriteria-scores', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response): Promise<void> => {
  try {
    const { scores } = req.body; // [{audit_score_id, subcriteria_id, score, notes}]

    if (!Array.isArray(scores) || scores.length === 0) {
      res.status(400).json({ success: false, error: 'Scores array required' });
      return;
    }

    for (const s of scores) {
      const [existing] = await pool.query(
        'SELECT id FROM audit_subcriteria_scores WHERE audit_score_id = ? AND subcriteria_id = ?',
        [s.audit_score_id, s.subcriteria_id]
      );

      if (existing.length > 0) {
        await pool.query(
          'UPDATE audit_subcriteria_scores SET score = ?, notes = ? WHERE id = ?',
          [s.score, s.notes || null, existing[0].id]
        );
      } else {
        const subScoreId = generateId();
        await pool.query(
          'INSERT INTO audit_subcriteria_scores (id, audit_score_id, subcriteria_id, score, notes) VALUES (?, ?, ?, ?, ?)',
          [subScoreId, s.audit_score_id, s.subcriteria_id, s.score, s.notes || null]
        );
      }
    }

    res.json({ success: true, data: { message: 'Subcriteria scores saved' } });
  } catch (err) {
    console.error('POST /api/audits/:id/subcriteria-scores error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/audits/:auditId/recommendations - Add recommendation to audit
router.post('/:auditId/recommendations', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response): Promise<void> => {
  try {
    const { auditId } = req.params;
    const { category_id, title, description, priority, estimated_cost_min, estimated_cost_max, estimated_timeline } = req.body;
    // Look up client_id from the audit
    const [auditRow] = await pool.query('SELECT client_id FROM business_audits WHERE id = ?', [auditId]);
    if (auditRow.length === 0) {
      res.status(404).json({ success: false, error: 'Audit not found' });
      return;
    }
    const clientId = auditRow[0].client_id;
    const id = generateId();
    await pool.query(
      `INSERT INTO audit_recommendations (id, audit_id, client_id, category_id, title, description, priority,
       estimated_cost_min, estimated_cost_max, estimated_timeline, status, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [id, auditId, clientId, category_id || null, title, description || null, priority || 'medium',
       estimated_cost_min || null, estimated_cost_max || null, estimated_timeline || null, req.user?.id]
    );
    res.status(201).json({ success: true, data: { id, message: 'Recommendation added' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
