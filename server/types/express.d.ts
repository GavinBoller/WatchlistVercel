import { Session } from 'express-session';
import { UserResponse } from '@shared/schema';

// Interface for JWT payload (used in server/jwtAuthRoutes.ts)
interface JwtUser {
  id: string;
  iat: number;
  exp: number;
}

// Custom SessionData interface
interface CustomSessionData {
  authenticated?: boolean;
  lastChecked?: number;
  createdAt?: number;
  userData?: UserResponse;
  preservedUserId?: number;
  preservedUsername?: string;
  preservedDisplayName?: string;
  preservedTimestamp?: number;
  enhancedProtection?: boolean;
  autoLogoutPrevented?: boolean;
  userAuthenticated?: boolean;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserResponse | JwtUser;
    session: Session & Partial<CustomSessionData>;
    sessionID?: string;
    isAuthenticated?: () => boolean;
    logout?: (callback: (err?: Error) => void) => void;
  }
}

declare module 'express-session' {
  interface SessionData extends CustomSessionData {}
}