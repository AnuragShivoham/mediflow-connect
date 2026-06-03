import { Router, Request, Response } from 'express';
import { sql } from '../lib/db';
import { requireAuth } from '../middleware/requireAuth';
import { logAudit } from '../utils/audit';

export const inventoryRoutes = Router();

// GET /api/inventory — get my inventory
inventoryRoutes.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await sql`
      SELECT id, name, quantity, batch_number, expiry_date, low_stock_threshold, created_at, updated_at
      FROM inventory_items
      WHERE user_id = ${req.userId}
      ORDER BY name ASC
    `;
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inventory/mr/:mrId — get an MR's inventory (for doctor's order form)
inventoryRoutes.get('/mr/:mrId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { mrId } = req.params;

    // Verify the requesting user has the MR in their contacts
    const contact = await sql`
      SELECT id FROM contacts
      WHERE user_id = ${req.userId} AND contact_id = ${mrId}
      LIMIT 1
    `;
    if (contact.length === 0) {
      res.status(403).json({ error: 'You are not connected to this MR' });
      return;
    }

    const items = await sql`
      SELECT id, name, quantity, batch_number, expiry_date, low_stock_threshold
      FROM inventory_items
      WHERE user_id = ${mrId} AND quantity > 0
      ORDER BY name ASC
    `;
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory — add item
inventoryRoutes.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, quantity, batch_number, expiry_date, low_stock_threshold } = req.body;

    if (!name || quantity === undefined) {
      res.status(400).json({ error: 'name and quantity are required' });
      return;
    }

    const [item] = await sql`
      INSERT INTO inventory_items (user_id, name, quantity, batch_number, expiry_date, low_stock_threshold)
      VALUES (
        ${req.userId},
        ${name},
        ${Number(quantity)},
        ${batch_number ?? null},
        ${expiry_date ?? null},
        ${Number(low_stock_threshold ?? 10)}
      )
      RETURNING *
    `;

    await logAudit(req.userId, 'INSERT', 'inventory_item', item.id, null, item);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/inventory/:id — update item
inventoryRoutes.patch('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existing = await sql`
      SELECT * FROM inventory_items WHERE id = ${id} AND user_id = ${req.userId}
    `;
    if (existing.length === 0) {
      res.status(404).json({ error: 'Item not found or access denied' });
      return;
    }

    const { name, quantity, batch_number, expiry_date, low_stock_threshold } = req.body;

    const [updated] = await sql`
      UPDATE inventory_items SET
        name                = COALESCE(${name ?? null}, name),
        quantity            = COALESCE(${quantity !== undefined ? Number(quantity) : null}, quantity),
        batch_number        = COALESCE(${batch_number ?? null}, batch_number),
        expiry_date         = COALESCE(${expiry_date ?? null}, expiry_date),
        low_stock_threshold = COALESCE(${low_stock_threshold !== undefined ? Number(low_stock_threshold) : null}, low_stock_threshold),
        updated_at          = NOW()
      WHERE id = ${id} AND user_id = ${req.userId}
      RETURNING *
    `;

    await logAudit(req.userId, 'UPDATE', 'inventory_item', id, existing[0], updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/inventory/:id — delete item
inventoryRoutes.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await sql`
      SELECT * FROM inventory_items WHERE id = ${id} AND user_id = ${req.userId}
    `;
    if (existing.length === 0) {
      res.status(404).json({ error: 'Item not found or access denied' });
      return;
    }

    await sql`DELETE FROM inventory_items WHERE id = ${id} AND user_id = ${req.userId}`;
    await logAudit(req.userId, 'DELETE', 'inventory_item', id, existing[0], null);

    res.json({ message: 'Item deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
