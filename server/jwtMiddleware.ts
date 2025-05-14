import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserResponse } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'movie-watchlist-secure-jwt-secret-key';

export function isJwtAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; iat: number; exp: number };
    req.user = { id: parseInt(decoded.id, 10) } as UserResponse; // Simplified for compatibility
    next();
  } catch (error) {
    console.error('[JWT] Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}