import express from 'express';
import { db } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { Client } from '../types/models.js';

const router = express.Router();

// Get all clients
router.get('/', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const [rows] = await db.query('SELECT * FROM clients ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get client by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM clients WHERE id = ?', [id]);
    
    if (Array.isArray(rows) && rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json((rows as any[])[0]);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create new client
router.post('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: express.Response) => {
  try {
    const client: Omit<Client, 'id' | 'created_at' | 'updated_at'> = req.body;
    
    const [result] = await db.query(
      'INSERT INTO clients (name, email, phone, address, city, state, country, postal_code, industry, website, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [client.name, client.email, client.phone, client.address, client.city, client.state, client.country, client.postal_code, client.industry, client.website, client.notes, client.status]
    );
    
    res.status(201).json({ 
      message: 'Client created successfully',
      id: (result as any).insertId 
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client
router.put('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const client: Partial<Client> = req.body;
    
    const [result] = await db.query(
      'UPDATE clients SET name = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, country = ?, postal_code = ?, industry = ?, website = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [client.name, client.email, client.phone, client.address, client.city, client.state, client.country, client.postal_code, client.industry, client.website, client.notes, client.status, id]
    );
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Delete client
router.delete('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.query('DELETE FROM clients WHERE id = ?', [id]);
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// Search clients
router.get('/search/:query', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { query } = req.params;
    const searchTerm = `%${query}%`;
    
    const [rows] = await db.query(
      'SELECT * FROM clients WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY name',
      [searchTerm, searchTerm, searchTerm]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({ error: 'Failed to search clients' });
  }
});

export default router;