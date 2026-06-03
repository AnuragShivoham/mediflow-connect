import { Router, Request, Response } from 'express';
import { sql } from '../lib/db';
import { requireAuth } from '../middleware/requireAuth';

export const contactsRoutes = Router();

// GET /api/contacts — get all contacts
contactsRoutes.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const contacts = await sql`
      SELECT
        c.id,
        json_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'phone', p.phone,
          'role', p.role,
          'email', p.email
        ) AS contact
      FROM contacts c
      JOIN profiles p ON p.id = c.contact_id
      WHERE c.user_id = ${req.userId}
      ORDER BY p.full_name ASC
    `;
    res.json(contacts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts/search — search user by phone + role
contactsRoutes.post('/search', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, role } = req.body;
    if (!phone || !role) {
      res.status(400).json({ error: 'phone and role are required' });
      return;
    }

    const results = await sql`
      SELECT id, full_name, phone, role
      FROM profiles
      WHERE phone = ${phone} AND role = ${role} AND id != ${req.userId}
      LIMIT 1
    `;

    res.json(results[0] ?? null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts — add a contact
contactsRoutes.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { contact_id } = req.body;
    if (!contact_id) {
      res.status(400).json({ error: 'contact_id is required' });
      return;
    }
    if (contact_id === req.userId) {
      res.status(400).json({ error: 'You cannot add yourself as a contact' });
      return;
    }

    // Check target user exists and has the opposite role
    const [myProfile] = await sql`SELECT role FROM profiles WHERE id = ${req.userId}`;
    const [targetProfile] = await sql`SELECT id, role FROM profiles WHERE id = ${contact_id}`;

    if (!targetProfile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (myProfile.role === targetProfile.role) {
      res.status(400).json({ error: 'You can only connect with users of the opposite role' });
      return;
    }

    // Check for duplicate
    const existing = await sql`
      SELECT id FROM contacts WHERE user_id = ${req.userId} AND contact_id = ${contact_id}
    `;
    if (existing.length > 0) {
      res.status(409).json({ error: 'Contact already exists' });
      return;
    }

    await sql`
      INSERT INTO contacts (user_id, contact_id) VALUES (${req.userId}, ${contact_id})
    `;

    res.status(201).json({ message: 'Contact added successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/contacts/:id — remove a contact
contactsRoutes.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await sql`
      SELECT id FROM contacts WHERE id = ${id} AND user_id = ${req.userId}
    `;
    if (existing.length === 0) {
      res.status(404).json({ error: 'Contact not found or access denied' });
      return;
    }

    await sql`DELETE FROM contacts WHERE id = ${id} AND user_id = ${req.userId}`;
    res.json({ message: 'Contact removed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
