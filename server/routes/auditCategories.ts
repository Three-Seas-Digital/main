import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/audit-categories - List all categories with subcriteria
router.get('/', authenticateToken, async (req: any, res: Response) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM audit_categories ORDER BY sort_order'
    );

    for (const cat of (categories as any[])) {
      const [subs] = await pool.query(
        'SELECT * FROM audit_subcriteria WHERE category_id = ? ORDER BY sort_order',
        [cat.id]
      );
      cat.subcriteria = subs;
    }

    res.json({ success: true, data: categories });
  } catch (err) {
    console.error('GET /api/audit-categories error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/audit-categories - Create custom category
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response) => {
  try {
    const { name, description, max_score, sort_order } = req.body;
    const id = generateId();
    const slug = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await pool.query(
      'INSERT INTO audit_categories (id, name, slug, description, max_score, is_base, sort_order, display_order) VALUES (?, ?, ?, ?, ?, false, ?, ?)',
      [id, name, slug, description || null, max_score || 10, sort_order || 999, sort_order || 999]
    );
    res.status(201).json({ success: true, data: { id, message: 'Category created' } });
  } catch (err) {
    console.error('POST /api/audit-categories error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/audit-categories/:id - Update category
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response) => {
  try {
    const { name, description, max_score, sort_order } = req.body;
    await pool.query(
      'UPDATE audit_categories SET name = ?, description = ?, max_score = ?, sort_order = ? WHERE id = ?',
      [name, description || null, max_score || 10, sort_order || 999, req.params.id]
    );
    res.json({ success: true, data: { message: 'Category updated' } });
  } catch (err) {
    console.error('PUT /api/audit-categories/:id error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/audit-categories/:id - Delete category (protect is_base=true)
router.delete('/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response) => {
  try {
    const [cats] = await pool.query(
      'SELECT is_base FROM audit_categories WHERE id = ?',
      [req.params.id]
    );
    const catsArray = Array.isArray(cats) ? cats : [];
    if (catsArray.length === 0) return res.status(404).json({ success: false, error: 'Category not found' });
    if ((catsArray[0] as any).is_base) return res.status(403).json({ success: false, error: 'Cannot delete base category' });

    await pool.query('DELETE FROM audit_categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Category deleted' } });
  } catch (err) {
    console.error('DELETE /api/audit-categories/:id error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/audit-categories/:id/subcriteria - Add subcriteria to category
router.post('/:id/subcriteria', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response) => {
  try {
    const { name, description, max_score, sort_order } = req.body;
    const id = generateId();
    await pool.query(
      'INSERT INTO audit_subcriteria (id, category_id, name, description, max_score, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.params.id, name, description || null, max_score || 10, sort_order || 999]
    );
    res.status(201).json({ success: true, data: { id, message: 'Subcriteria added' } });
  } catch (err) {
    console.error('POST /api/audit-categories/:id/subcriteria error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Note: These routes use a different base path, mounted separately at /api/audit-subcriteria
// But since they share the same router, we handle them with full paths

// PUT /api/audit-subcriteria/:id - Update subcriteria
// Mounted at /api/audit-categories, so this matches /api/audit-categories/subcriteria/:id
router.put('/subcriteria/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response) => {
  try {
    const { name, description, max_score, sort_order } = req.body;
    await pool.query(
      'UPDATE audit_subcriteria SET name = ?, description = ?, max_score = ?, sort_order = ? WHERE id = ?',
      [name, description || null, max_score || 10, sort_order || 999, req.params.id]
    );
    res.json({ success: true, data: { message: 'Subcriteria updated' } });
  } catch (err) {
    console.error('PUT /api/audit-categories/subcriteria/:id error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/audit-subcriteria/:id - Delete subcriteria
router.delete('/subcriteria/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response) => {
  try {
    await pool.query('DELETE FROM audit_subcriteria WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Subcriteria deleted' } });
  } catch (err) {
    console.error('DELETE /api/audit-categories/subcriteria/:id error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
