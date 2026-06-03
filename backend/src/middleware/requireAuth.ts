import { Request, Response, NextFunction } from "express";
import { verifyToken, type MedFlowToken } from "../lib/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
      token: MedFlowToken;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = header.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return;
  }
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    req.token = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
