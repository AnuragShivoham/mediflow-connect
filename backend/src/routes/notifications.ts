import { Router, Request, Response } from 'express';
import { sql } from '../lib/db';
import { requireAuth } from '../middleware/requireAuth';

export const notificationsRoutes = Router();

// GET /api/notifications/unread
// Polled by frontend every 10s to power notification badges
notificationsRoutes.get('/unread', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const [unreadMessages, unreadOrders] = await Promise.all([
      // Senders who have unread messages for me
      sql`
        SELECT DISTINCT sender_id
        FROM messages
        WHERE receiver_id = ${userId} AND is_read = false
      `,
      // New pending orders in last 24h involving me
      sql`
        SELECT id
        FROM orders
        WHERE (doctor_id = ${userId} OR mr_id = ${userId})
          AND status = 'pending'
          AND created_at > NOW() - INTERVAL '24 hours'
      `,
    ]);

    res.json({
      unreadMessageSenders: unreadMessages.map((r: any) => r.sender_id),
      unreadOrderIds: unreadOrders.map((r: any) => r.id),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
