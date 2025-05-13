import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwtAuth';
import { UserResponse } from '@shared/schema';

declare global {
  namespace Express {
    interface Request {
      user?: UserResponse;
    }
  }
}

export function isJwtAuthenticated(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  try {
    const decoded = verifyToken(token) as UserResponse;
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[JWT_MIDDLEWARE] Error:', err);
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
}