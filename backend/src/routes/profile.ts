import { Router, Request, Response } from 'express';
import { sql } from '../lib/db';
import { requireAuth } from '../middleware/requireAuth';

export const profileRoutes = Router();

// GET /api/profile
profileRoutes.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const profiles = await sql`
      SELECT id, email, full_name, phone, role, created_at, updated_at
      FROM profiles
      WHERE id = ${req.userId}
    `;
    if (profiles.length === 0) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(profiles[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/profile
profileRoutes.patch('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, phone } = req.body;

    if (!full_name && !phone) {
      res.status(400).json({ error: 'Provide at least full_name or phone to update' });
      return;
    }

    const [updated] = await sql`
      UPDATE profiles SET
        full_name  = COALESCE(${full_name ?? null}, full_name),
        phone      = COALESCE(${phone ?? null}, phone),
        updated_at = NOW()
      WHERE id = ${req.userId}
      RETURNING id, email, full_name, phone, role, updated_at
    `;

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
