import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { userId: string; role: 'DOCTOR' | 'PATIENT' };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user as AuthRequest['user'];
    next();
  });
};

export const requireRole = (role: 'DOCTOR' | 'PATIENT') =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role)
      return res.status(403).json({ error: `Access restricted to ${role} role only.` });
    next();
  };
