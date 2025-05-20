import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { jwtUtils } from '../lib/jwtUtils';
import { sessionUtils } from '../lib/session-utils';

export interface UserResponse {
  id: number;
  username: string;
  displayName: string;
  role: string;
  created_at?: string;
}

interface AuthResponse {
  authenticated: boolean;
  user?: UserResponse;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  password: string;
  displayName: string;
}

interface JwtAuthContextType {
  user: UserResponse | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const JwtAuthContext = React.createContext<JwtAuthContextType | undefined>(undefined);

export function JwtAuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Check authentication status
  const authQuery = useQuery<AuthResponse, Error>({
    queryKey: ['authStatus'],
    queryFn: async () => {
      console.log('[JWT AUTH] Starting user authentication check');
      const response = await fetch('http://localhost:3000/api/auth/status', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch auth status: ${response.status}`);
      }
      const data = await response.json();
      console.log('[JWT AUTH] Status response:', data);
      return data;
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    onError: (error) => {
      console.log('[JWT AUTH] No session found:', error);
    },
  });

  // Login mutation
  const loginMutation = useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: async (credentials) => {
      console.log('[JWT AUTH] Login mutation triggered with:', credentials);
      try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
          credentials: 'include',
        });
        console.log('[JWT AUTH] Login response status:', response.status);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Login failed: ${response.status} - ${text}`);
        }
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[JWT AUTH] Error parsing login response:', parseError);
          throw new Error('Invalid response format from server');
        }
        console.log('[JWT AUTH] Login response data:', data);
        return data;
      } catch (error) {
        console.error('[JWT AUTH] Login mutation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('[JWT AUTH] Login success:', data);
      queryClient.setQueryData(['authStatus'], data);
      toast.success('Login Successful');
      setLocation('/');
    },
    onError: (error) => {
      console.log('[JWT AUTH] Login error:', error);
      toast.error(error.message || 'Login failed');
    },
  });

  // Register mutation
  const registerMutation = useMutation<void, Error, RegisterCredentials>({
    mutationFn: async (credentials) => {
      console.log('[JWT AUTH] Register mutation triggered with:', credentials);
      try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
          credentials: 'include',
        });
        console.log('[JWT AUTH] Register response status:', response.status);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Registration failed: ${response.status} - ${text}`);
        }
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[JWT AUTH] Error parsing register response:', parseError);
          throw new Error('Invalid response format from server');
        }
        console.log('[JWT AUTH] Register response data:', data);
        return data;
      } catch (error) {
        console.error('[JWT AUTH] Register mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[JWT AUTH] Register success');
      toast.success('Registration Successful');
      setLocation('/auth');
    },
    onError: (error) => {
      console.log('[JWT AUTH] Register error:', error);
      toast.error(error.message || 'Registration failed');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation<void, Error>({
    mutationFn: async () => {
      console.log('[JWT AUTH] Logout mutation triggered');
      try {
        const response = await fetch('http://localhost:3000/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        console.log('[JWT AUTH] Logout response status:', response.status);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Logout failed: ${response.status} - ${text}`);
        }
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[JWT AUTH] Error parsing logout response:', parseError);
          throw new Error('Invalid response format from server');
        }
        console.log('[JWT AUTH] Logout response data:', data);
        return data;
      } catch (error) {
        console.error('[JWT AUTH] Logout mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[JWT AUTH] Logout success');
      queryClient.setQueryData(['authStatus'], { authenticated: false });
      sessionUtils.removeToken();
      toast.success('Logged out');
      setLocation('/auth?fromLogout=true');
    },
    onError: (error) => {
      console.log('[JWT AUTH] Logout error:', error);
      toast.error(error.message || 'Logout failed');
    },
  });

  const auth: JwtAuthContextType = {
    user: authQuery.data?.user,
    isAuthenticated: authQuery.data?.authenticated || false,
    isLoading: authQuery.isLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  };

  console.log('[JWT AUTH] Auth state:', {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    loginMutation: loginMutation.status,
    registerMutation: registerMutation.status,
    hasLoginMutateAsync: !!loginMutation.mutateAsync,
    hasRegisterMutateAsync: !!registerMutation.mutateAsync,
  });

  return <JwtAuthContext.Provider value={auth}>{children}</JwtAuthContext.Provider>;
}

export function useJwtAuth() {
  const context = React.useContext(JwtAuthContext);
  if (!context) {
    throw new Error('useJwtAuth must be used within a JwtAuthProvider');
  }
  return context;
}
