import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { useJwtAuth } from '../hooks/use-jwt-auth';
import { UserResponse } from '@shared/schema';

interface LoginFormProps {
  onLoginSuccess: (user: UserResponse) => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
}

export function LoginForm({ onLoginSuccess, onSwitchToRegister, onForgotPassword }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useJwtAuth();
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Focus username input on mount
  useEffect(() => {
    if (usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginForm] Submitting:', { username });
    try {
      const response = await login({ username, password });
      console.log('[LoginForm] Login response:', response);
      if (response.user) {
        onLoginSuccess(response.user);
      }
      setUsername('');
      setPassword('');
    } catch (error) {
      console.error('[LoginForm] Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          ref={usernameInputRef}
          disabled={isLoading}
          required
          autoComplete="username"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="current-password"
        />
      </div>
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="link"
          onClick={onForgotPassword}
          disabled={isLoading}
        >
          Forgot Password?
        </Button>
        <Button
          type="button"
          variant="link"
          onClick={onSwitchToRegister}
          disabled={isLoading}
        >
          Register
        </Button>
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </div>
    </form>
  );
}
