import { UserResponse } from '@shared/schema'; // Adjust the import based on your schema location

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserResponse;
    session?: any; // Use a more specific type if possible
    sessionID?: string;
    isAuthenticated?: () => boolean;
    logout?: (callback: (err?: any) => void) => void;
  }
}

declare module 'express-session' {
  interface SessionData {
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
}