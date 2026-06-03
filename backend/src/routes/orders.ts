import { Router, Request, Response } from 'express';
import { sql } from '../lib/db';
import { requireAuth } from '../middleware/requireAuth';
import { logAudit } from '../utils/audit';

export const ordersRoutes = Router();

// GET /api/orders — get all orders for this user
ordersRoutes.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await sql`
      SELECT
        o.id, o.status, o.created_at, o.updated_at,
        o.preferred_delivery_date, o.preferred_delivery_time,
        o.special_instructions, o.delivery_method, o.delivery_notes,
        o.delivery_timestamp,
        o.doctor_id, o.mr_id,
        json_build_object('full_name', d.full_name, 'phone', d.phone) AS doctor,
        json_build_object('full_name', m.full_name, 'phone', m.phone) AS mr,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'quantity', oi.quantity,
              'item', json_build_object('name', inv.name)
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS order_items
      FROM orders o
      JOIN profiles d ON d.id = o.doctor_id
      JOIN profiles m ON m.id = o.mr_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN inventory_items inv ON inv.id = oi.inventory_item_id
      WHERE o.doctor_id = ${req.userId} OR o.mr_id = ${req.userId}
      GROUP BY o.id, d.full_name, d.phone, m.full_name, m.phone
      ORDER BY o.created_at DESC
    `;
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders — create a new order with items
ordersRoutes.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      mr_id,
      items,
      preferred_delivery_date,
      preferred_delivery_time,
      special_instructions,
      delivery_method,
    } = req.body;

    if (!mr_id || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'mr_id and at least one item are required' });
      return;
    }

    // Insert order
    const [order] = await sql`
      INSERT INTO orders (doctor_id, mr_id, preferred_delivery_date, preferred_delivery_time, special_instructions, delivery_method)
      VALUES (
        ${req.userId},
        ${mr_id},
        ${preferred_delivery_date ?? null},
        ${preferred_delivery_time ?? null},
        ${special_instructions ?? null},
        ${delivery_method ?? null}
      )
      RETURNING *
    `;

    // Insert order items
    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, inventory_item_id, quantity)
        VALUES (${order.id}, ${item.inventory_item_id}, ${Number(item.quantity)})
      `;
    }

    await logAudit(req.userId, 'INSERT', 'order', order.id, null, { order, items });
    res.status(201).json({ order });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status — update order status
ordersRoutes.patch('/:id/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'accepted', 'packed', 'out_for_delivery', 'delivered', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    // Verify user is part of this order
    const existing = await sql`
      SELECT * FROM orders WHERE id = ${id} AND (doctor_id = ${req.userId} OR mr_id = ${req.userId})
    `;
    if (existing.length === 0) {
      res.status(404).json({ error: 'Order not found or access denied' });
      return;
    }

    const [updated] = await sql`
      UPDATE orders SET
        status             = ${status},
        delivery_timestamp = CASE WHEN ${status} = 'delivered' THEN NOW() ELSE delivery_timestamp END,
        updated_at         = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    await logAudit(req.userId, 'UPDATE_STATUS', 'order', id, { status: existing[0].status }, { status });
    res.json({ order: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
