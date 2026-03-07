import express from 'express';
import { db } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { Appointment } from '../types/models.js';

const router = express.Router();

// Get all appointments
router.get('/', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, c.name as client_name 
      FROM appointments a 
      LEFT JOIN clients c ON a.client_id = c.id 
      ORDER BY a.start_time DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get appointment by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT a.*, c.name as client_name 
      FROM appointments a 
      LEFT JOIN clients c ON a.client_id = c.id 
      WHERE a.id = ?
    `, [id]);
    
    if (Array.isArray(rows) && rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json((rows as any[])[0]);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Create new appointment
router.post('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: express.Response) => {
  try {
    const appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'> = req.body;
    
    const [result] = await db.query(
      'INSERT INTO appointments (client_id, title, description, start_time, end_time, status, location, meeting_link, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [appointment.client_id, appointment.title, appointment.description, appointment.start_time, appointment.end_time, appointment.status, appointment.location, appointment.meeting_link, appointment.notes]
    );
    
    res.status(201).json({ 
      message: 'Appointment created successfully',
      id: (result as any).insertId 
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Update appointment
router.put('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const appointment: Partial<Appointment> = req.body;
    
    const [result] = await db.query(
      'UPDATE appointments SET client_id = ?, title = ?, description = ?, start_time = ?, end_time = ?, status = ?, location = ?, meeting_link = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [appointment.client_id, appointment.title, appointment.description, appointment.start_time, appointment.end_time, appointment.status, appointment.location, appointment.meeting_link, appointment.notes, id]
    );
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Delete appointment
router.delete('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.query('DELETE FROM appointments WHERE id = ?', [id]);
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// Get appointments by date range
router.get('/range/:start/:end', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { start, end } = req.params;
    
    const [rows] = await db.query(`
      SELECT a.*, c.name as client_name 
      FROM appointments a 
      LEFT JOIN clients c ON a.client_id = c.id 
      WHERE a.start_time >= ? AND a.start_time <= ? 
      ORDER BY a.start_time ASC
    `, [start, end]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching appointments by date range:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get appointments by client
router.get('/client/:clientId', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { clientId } = req.params;
    
    const [rows] = await db.query(`
      SELECT a.*, c.name as client_name 
      FROM appointments a 
      LEFT JOIN clients c ON a.client_id = c.id 
      WHERE a.client_id = ? 
      ORDER BY a.start_time DESC
    `, [clientId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching appointments by client:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

export default router;