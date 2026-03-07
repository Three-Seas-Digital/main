import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';

const router = Router();

// GET /api/projects — List all projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM projects ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[projects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/projects/:id — Get single project with tasks, milestones, developers
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const project = rows[0];

    // Fetch related data
    const [tasks] = await pool.query('SELECT * FROM project_tasks WHERE project_id = ? ORDER BY sort_order ASC', [req.params.id]);
    const [milestones] = await pool.query('SELECT * FROM project_milestones WHERE project_id = ? ORDER BY due_date ASC', [req.params.id]);
    const [developers] = await pool.query(
      `SELECT u.id, u.username, u.display_name FROM project_developers pd
       JOIN users u ON pd.user_id = u.id WHERE pd.project_id = ?`,
      [req.params.id]
    );

    project.tasks = tasks;
    project.milestones = milestones;
    project.developers = developers;

    res.json(project);
  } catch (err) {
    console.error('[projects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects — Create project
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'developer'), async (req, res) => {
  try {
    const { id: bodyId, clientId, name, title, description, status, startDate, dueDate, endDate } = req.body;
    const id = bodyId || generateId();
    const projectName = title || name || 'Untitled';
    await pool.query(
      `INSERT INTO projects (id, client_id, name, title, description, status, start_date, due_date, end_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, clientId, projectName, projectName, description || null, status || 'planning', startDate || null, dueDate || null, endDate || null]
    );
    res.status(201).json({ id, message: 'Project created' });
  } catch (err) {
    console.error('[projects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:id — Update project
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'developer'), async (req, res) => {
  try {
    const { name, description, status, startDate, endDate } = req.body;
    await pool.query(
      `UPDATE projects SET name = ?, description = ?, status = ?, start_date = ?, end_date = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, description, status, startDate, endDate, req.params.id]
    );
    res.json({ message: 'Project updated' });
  } catch (err) {
    console.error('[projects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id — Delete project (cascades to tasks, milestones, time entries)
router.delete('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'developer'), async (req, res) => {
  try {
    // time_entries has ON DELETE SET NULL — don't delete manually; let FK handle it
    // project_tasks, project_milestones, project_developers have ON DELETE CASCADE
    await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('[projects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Tasks sub-routes ---

// POST /api/projects/:id/tasks — Add task
router.post('/:id/tasks', authenticateToken, requireRole('owner', 'admin', 'manager', 'developer'), async (req, res) => {
  try {
    const { title, description, status, assignedTo, sortOrder } = req.body;
    const taskId = generateId();
    await pool.query(
      `INSERT INTO project_tasks (id, project_id, title, description, status, assigned_to, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [taskId, req.params.id, title, description || null, status || 'todo', assignedTo || null, sortOrder || 0]
    );
    res.status(201).json({ id: taskId, message: 'Task added' });
  } catch (err) {
    console.error('[projects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:id/tasks/:taskId — Update task
router.put('/:id/tasks/:taskId', authenticateToken, requireRole('owner', 'admin', 'manager', 'developer'), async (req, res) => {
  try {
    const { title, description, status, assignedTo, sortOrder } = req.body;
    await pool.query(
      `UPDATE project_tasks SET title = ?, description = ?, status = ?, assigned_to = ?, sort_order = ?, updated_at = NOW()
       WHERE id = ? AND project_id = ?`,
      [title, description, status, assignedTo, sortOrder, req.params.taskId, req.params.id]
    );
    res.json({ message: 'Task updated' });
  } catch (err) {
    console.error('[projects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id/tasks/:taskId — Delete task
router.delete('/:id/tasks/:taskId', authenticateToken, requireRole('owner', 'admin', 'manager', 'developer'), async (req, res) => {
  try {
    await pool.query('DELETE FROM project_tasks WHERE id = ? AND project_id = ?', [req.params.taskId, req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('[projects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Milestones sub-routes ---

// POST /api/projects/:id/milestones — Add milestone
router.post('/:id/milestones', authenticateToken, requireRole('owner', 'admin', 'manager', 'developer'), async (req, res) => {
  try {
    const { title, description, dueDate, completed } = req.body;
    const msId = generateId();
    await pool.query(
      `INSERT INTO project_milestones (id, project_id, title, description, due_date, completed, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [msId, req.params.id, title, description || null, dueDate || null, completed || false]
    );
    res.status(201).json({ id: msId, message: 'Milestone added' });
  } catch (err) {
    console.error('[projects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:id/milestones/:milestoneId — Update milestone
router.put('/:id/milestones/:milestoneId', authenticateToken, requireRole('owner', 'admin', 'manager', 'developer'), async (req, res) => {
  try {
    const { title, description, dueDate, completed } = req.body;
    await pool.query(
      `UPDATE project_milestones SET title = ?, description = ?, due_date = ?, completed = ?, updated_at = NOW()
       WHERE id = ? AND project_id = ?`,
      [title, description, dueDate, completed, req.params.milestoneId, req.params.id]
    );
    res.json({ message: 'Milestone updated' });
  } catch (err) {
    console.error('[projects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id/milestones/:milestoneId — Delete milestone
router.delete('/:id/milestones/:milestoneId', authenticateToken, requireRole('owner', 'admin', 'manager', 'developer'), async (req, res) => {
  try {
    await pool.query('DELETE FROM project_milestones WHERE id = ? AND project_id = ?', [req.params.milestoneId, req.params.id]);
    res.json({ message: 'Milestone deleted' });
  } catch (err) {
    console.error('[projects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Developers sub-routes ---

// POST /api/projects/:id/developers — Assign developer
router.post('/:id/developers', authenticateToken, requireRole('owner', 'admin', 'manager', 'developer'), async (req, res) => {
  try {
    const { userId } = req.body;
    await pool.query(
      'INSERT IGNORE INTO project_developers (project_id, user_id) VALUES (?, ?)',
      [req.params.id, userId]
    );
    res.status(201).json({ message: 'Developer assigned' });
  } catch (err) {
    console.error('[projects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id/developers/:userId — Unassign developer
router.delete('/:id/developers/:userId', authenticateToken, requireRole('owner', 'admin', 'manager', 'developer'), async (req, res) => {
  try {
    await pool.query('DELETE FROM project_developers WHERE project_id = ? AND user_id = ?', [req.params.id, req.params.userId]);
    res.json({ message: 'Developer unassigned' });
  } catch (err) {
    console.error('[projects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
