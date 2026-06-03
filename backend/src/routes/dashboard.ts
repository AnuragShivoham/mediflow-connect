import { Router, Request, Response } from 'express';
import { sql } from '../lib/db';
import { requireAuth } from '../middleware/requireAuth';

export const dashboardRoutes = Router();

// GET /api/dashboard/stats
dashboardRoutes.get('/stats', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const [
      totalResult,
      pendingResult,
      deliveredResult,
      lowStockResult,
      recentOrders,
      upcomingDeliveries,
      inventoryAlerts,
    ] = await Promise.all([
      // Total orders
      sql`
        SELECT COUNT(*) as count FROM orders
        WHERE doctor_id = ${userId} OR mr_id = ${userId}
      `,
      // Pending orders
      sql`
        SELECT COUNT(*) as count FROM orders
        WHERE (doctor_id = ${userId} OR mr_id = ${userId}) AND status = 'pending'
      `,
      // Delivered orders
      sql`
        SELECT COUNT(*) as count FROM orders
        WHERE (doctor_id = ${userId} OR mr_id = ${userId}) AND status = 'delivered'
      `,
      // Low stock items
      sql`
        SELECT COUNT(*) as count FROM inventory_items
        WHERE user_id = ${userId} AND quantity <= low_stock_threshold
      `,
      // Recent 5 orders with profile names
      sql`
        SELECT
          o.id, o.status, o.created_at, o.preferred_delivery_date,
          o.special_instructions, o.delivery_method,
          d.full_name AS doctor_name,
          m.full_name AS mr_name
        FROM orders o
        JOIN profiles d ON d.id = o.doctor_id
        JOIN profiles m ON m.id = o.mr_id
        WHERE o.doctor_id = ${userId} OR o.mr_id = ${userId}
        ORDER BY o.created_at DESC
        LIMIT 5
      `,
      // Upcoming deliveries (out_for_delivery)
      sql`
        SELECT
          o.id, o.status, o.preferred_delivery_date,
          d.full_name AS doctor_name,
          m.full_name AS mr_name
        FROM orders o
        JOIN profiles d ON d.id = o.doctor_id
        JOIN profiles m ON m.id = o.mr_id
        WHERE (o.doctor_id = ${userId} OR o.mr_id = ${userId})
          AND o.status = 'out_for_delivery'
        ORDER BY o.preferred_delivery_date ASC
        LIMIT 5
      `,
      // Inventory alerts (low stock items)
      sql`
        SELECT id, name, quantity, low_stock_threshold, expiry_date
        FROM inventory_items
        WHERE user_id = ${userId} AND quantity <= low_stock_threshold
        ORDER BY quantity ASC
        LIMIT 5
      `,
    ]);

    res.json({
      totalOrders:       Number(totalResult[0].count),
      pendingOrders:     Number(pendingResult[0].count),
      deliveredOrders:   Number(deliveredResult[0].count),
      lowStockCount:     Number(lowStockResult[0].count),
      recentOrders,
      upcomingDeliveries,
      inventoryAlerts,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
