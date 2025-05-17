import { createContext, useContext } from 'react';

export interface UserContextValue {
  currentUser: any;
  setCurrentUser: () => void;
  login: () => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const UserContext = createContext<UserContextValue>({
  currentUser: null,
  setCurrentUser: () => {},
  login: () => {},
  logout: async () => {},
  isAuthenticated: false,
});

export const useUserContext = () => useContext(UserContext);
