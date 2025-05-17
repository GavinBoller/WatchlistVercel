import { createContext, useContext, useState, useEffect } from 'react';
import { getToken } from '../lib/jwtUtils';

interface UserResponse {
  id: number;
  username: string;
  displayName: string;
  role: string;
  createdAt: Date;
}

export interface JwtAuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, password: string, displayName: string) => Promise<void>;
}

export const JwtAuthContext = createContext<JwtAuthContextType | undefined>(undefined);

export const JwtAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        throw new Error('Login failed');
      }
      const userData = await response.json();
      console.log('[JWT AUTH] Login successful:', userData.username);
      setUser(userData);
    } catch (error) {
      console.error('[JWT AUTH] Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      console.log('[JWT AUTH] Logout successful');
      setUser(null);
      sessionStorage.removeItem('jwt_token');
      localStorage.removeItem('jwt_token');
    } catch (error) {
      console.error('[JWT AUTH] Logout error:', error);
      setUser(null); // Clear user state even if server call fails
    }
  };

  const register = async (username: string, password: string, displayName: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName }),
      });
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      const userData = await response.json();
      console.log('[JWT AUTH] Registration successful:', userData.username);
      setUser(userData);
    } catch (error) {
      console.error('[JWT AUTH] Registration error:', error);
      throw error;
    }
  };

  useEffect(() => {
    async function checkAuth() {
      console.log('[JWT AUTH] Starting user authentication check');
      try {
        const response = await fetch('http://localhost:3000/api/auth/status', {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const userData = await response.json();
          console.log('[JWT AUTH] Session authenticated:', userData.username);
          setUser(userData);
        } else {
          console.log('[JWT AUTH] No session found');
          const token = getToken();
          if (token) {
            console.log('[JWT AUTH] JWT token found, verifying...');
            // Add JWT verification logic if needed
            setUser(null); // Placeholder: clear user if token invalid
          } else {
            console.log('[JWT AUTH] No token found in storage');
          }
        }
      } catch (err) {
        console.error('[JWT AUTH] Error checking auth:', err);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  return (
    <JwtAuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </JwtAuthContext.Provider>
  );
};

export const useJwtAuth = () => {
  const context = useContext(JwtAuthContext);
  if (!context) {
    throw new Error('useJwtAuth must be used within a JwtAuthProvider');
  }
  return context;
};
