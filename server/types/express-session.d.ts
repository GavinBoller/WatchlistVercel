import { User } from '../src/db';

declare module 'express-session' {
  interface SessionData {
    user?: User;
  }
}
