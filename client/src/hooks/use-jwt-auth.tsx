import { useState, useContext, createContext } from 'react';
import { UserResponse } from '@shared/schema';

interface AuthResponse {
  user: UserResponse | null;
  authenticated: boolean;
}

interface JwtAuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const JwtAuthContext = createContext<JwtAuthContextType | undefined>(undefined);

export function JwtAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Mock auth check
  setTimeout(() => {
    console.log('Mock auth check complete');
    setIsChecking(false);
  }, 1000);

  const login = async (username: string, password: string) => {
    try {
      console.log('Attempting login...');
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Login failed');
      }
      const data = await response.json();
      console.log('Login successful:', data);
      setUser(data.user);
      setIsAuthenticated(data.authenticated);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const value: JwtAuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (isChecking) {
    return <div>Loading authentication...</div>;
  }

  return <JwtAuthContext.Provider value={value}>{children}</JwtAuthContext.Provider>;
}

export function useJwtAuth() {
  const context = useContext(JwtAuthContext);
  if (!context) {
    throw new Error('useJwtAuth must be used within a JwtAuthProvider');
  }
  return context;
}
