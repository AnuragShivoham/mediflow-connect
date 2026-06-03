import { Request, Response, NextFunction } from 'express';
import { supabaseAuth } from '../lib/auth';

// Extend Express Request to carry userId and userEmail
declare global {
  namespace Express {
    interface Request {
      userId: string;
      userEmail: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: missing Bearer token' });
    return;
  }

  const token = header.slice(7);

  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
    return;
  }

  req.userId = user.id;
  req.userEmail = user.email ?? '';
  next();
}
