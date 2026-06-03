import { Router, Request, Response } from 'express';
import { sql } from '../lib/db';
import { requireAuth } from '../middleware/requireAuth';

export const messagesRoutes = Router();

// GET /api/messages/:contactId — get conversation
messagesRoutes.get('/:contactId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { contactId } = req.params;

    const messages = await sql`
      SELECT id, sender_id, receiver_id, content, is_read, created_at
      FROM messages
      WHERE
        (sender_id = ${req.userId} AND receiver_id = ${contactId})
        OR
        (sender_id = ${contactId} AND receiver_id = ${req.userId})
      ORDER BY created_at ASC
    `;

    // Mark received messages as read
    await sql`
      UPDATE messages SET is_read = true
      WHERE sender_id = ${contactId} AND receiver_id = ${req.userId} AND is_read = false
    `;

    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages — send a message
messagesRoutes.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { receiver_id, content } = req.body;

    if (!receiver_id || !content?.trim()) {
      res.status(400).json({ error: 'receiver_id and content are required' });
      return;
    }

    const [message] = await sql`
      INSERT INTO messages (sender_id, receiver_id, content, is_read)
      VALUES (${req.userId}, ${receiver_id}, ${content.trim()}, false)
      RETURNING *
    `;

    res.status(201).json(message);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/messages/read/:senderId — mark all messages from sender as read
messagesRoutes.patch('/read/:senderId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { senderId } = req.params;

    await sql`
      UPDATE messages SET is_read = true
      WHERE sender_id = ${senderId} AND receiver_id = ${req.userId} AND is_read = false
    `;

    res.json({ message: 'Messages marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
