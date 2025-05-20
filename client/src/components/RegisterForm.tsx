import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { useJwtAuth } from '../hooks/use-jwt-auth';
import { UserResponse } from '@shared/schema';

interface RegisterFormProps {
  onRegisterSuccess: (user: UserResponse) => void;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onRegisterSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const { register, isLoading } = useJwtAuth();
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[RegisterForm] Submitting:', { username, displayName });
    try {
      await register({ username, password, displayName });
      console.log('[RegisterForm] Register success');
      onRegisterSuccess({ id: 0, username, displayName, role: 'user' }); // Temporary user object
      setUsername('');
      setPassword('');
      setDisplayName('');
    } catch (error) {
      console.error('[RegisterForm] Register error:', error);
      toast.error(error instanceof Error ? error.message : 'Registration failed');
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
          placeholder="Enter your username"
        />
      </div>
      <div>
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="name"
          placeholder="Enter your display name"
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
          autoComplete="new-password"
          placeholder="Enter your password"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSwitchToLogin}
          disabled={isLoading}
        >
          Back to Login
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </Button>
      </div>
    </form>
  );
}
