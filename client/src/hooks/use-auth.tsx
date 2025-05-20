import { useState, useContext, createContext } from 'react';
import { InsertUser, User as SelectUser } from '@shared/schema';

interface UserContextValue {
  user: SelectUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addUser: (user: InsertUser) => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SelectUser | null>(null);

  const login = async (username: string, password: string) => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });
    const data = await response.json();
    if (data.user) {
      setUser(data.user);
    }
  };

  const logout = async () => {
    await fetch('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  };

  const addUser = async (user: InsertUser) => {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
      credentials: 'include',
    });
    const data = await response.json();
    if (data.user) {
      setUser(data.user);
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout, addUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
