import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken } from './jwtAuth';
import { UserResponse } from '@shared/schema';

export function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.user = user as UserResponse;
  next();
}

export function isJwtAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}