import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserResponse } from '@shared/schema';
import { useJwtAuth } from '@/hooks/use-jwt-auth';

interface LoginFormProps {
  onLoginSuccess: (user: UserResponse) => void;
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onLoginSuccess, onSwitchToRegister }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useJwtAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      const response = await fetch('http://localhost:3000/api/auth/check', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.user) {
        onLoginSuccess(data.user);
      }
    } catch (error) {
      console.error('Login failed:', error);
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
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit">Login</Button>
      <Button variant="outline" onClick={onSwitchToRegister}>
        Register
      </Button>
    </form>
  );
}
