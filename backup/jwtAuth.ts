import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserResponse } from '@shared/schema';

export const JWT_SECRET = process.env.JWT_SECRET || 'movie-watchlist-secure-jwt-secret-key';
export const TOKEN_EXPIRATION = '7d';

export function generateToken(user: UserResponse): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRATION }
  );
}

export function verifyToken(token: string): UserResponse | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserResponse;
    return decoded;
  } catch (error) {
    console.error('[JWT] Token verification error:', error);
    return null;
  }
}

export function createUserResponse(user: UserResponse): UserResponse {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function extractTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}