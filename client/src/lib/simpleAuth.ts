import { UserResponse } from '@shared/schema';

const API_BASE_URL = 'http://localhost:3000';

export interface JwtUser {
  id: number;
  displayName: string;
  createdAt: string;
}

export const login = async (username: string, password: string): Promise<UserResponse | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const register = async (username: string, password: string, displayName: string): Promise<UserResponse | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password, displayName }),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Register error:', error);
    return null;
  }
};

export const logout = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

export const getAuthStatus = async (): Promise<{ authenticated: boolean; user: UserResponse | null }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return { authenticated: false, user: null };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Auth status error:', error);
    return { authenticated: false, user: null };
  }
};
