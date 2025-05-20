import { Session } from 'express-session';
import { UserResponse } from '@shared/schema';

interface JwtUser {
  id: number;
  iat: number;
  exp: number;
}

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
  userId?: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserResponse | JwtUser;
    session: Session & Partial<CustomSessionData>;
    sessionID?: string;
  }
}

declare module 'express-session' {
  interface SessionData extends CustomSessionData {}
}
