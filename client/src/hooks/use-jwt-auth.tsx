import { useState, useContext, createContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserResponse } from '@shared/schema';

interface AuthResponse {
  user: UserResponse | null;
  authenticated: boolean;
}

interface JwtAuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
}

export const JwtAuthContext = createContext<JwtAuthContextType | undefined>(undefined);

export function JwtAuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(true);

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async (): Promise<AuthResponse> => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/check', {
          credentials: 'include',
        });
        if (!response.ok) {
          setIsChecking(false);
          return { user: null, authenticated: false };
        }
        const data = await response.json();
        setIsChecking(false);
        return data;
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsChecking(false);
        return { user: null, authenticated: false };
      }
    },
    retry: false,
  });

  const login = async (username: string, password: string) => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });
    if (response.ok) {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    } else {
      throw new Error('Login failed');
    }
  };

  const value: JwtAuthContextType = {
    user: authQuery.data?.user ?? null,
    isAuthenticated: authQuery.data?.authenticated ?? false,
    login,
  };

  if (isChecking || authQuery.isLoading) {
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
