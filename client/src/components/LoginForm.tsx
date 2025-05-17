import { useState, FormEvent, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserResponse } from '@shared/schema';
import { useJwtAuth } from '../hooks/use-jwt-auth';

interface LoginFormProps {
  onLoginSuccess: (user: UserResponse) => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
}

export function LoginForm({ onLoginSuccess, onSwitchToRegister, onForgotPassword }: LoginFormProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { login } = useJwtAuth();
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(username, password);
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      onLoginSuccess({ id: 0, username, displayName: username, role: 'user', createdAt: new Date() });
      setTimeout(() => setIsOpen(false), 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      toast({
        title: 'Login Failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-background p-6 rounded-lg z-50" aria-label="Login Form">
        <div className="space-y-2">
          <DialogTitle className="text-lg font-semibold">Sign In</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Sign in to access your personalized movie watchlist
          </DialogDescription>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
              ref={usernameInputRef}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex justify-end space-x-2">
            <Button type="submit">Sign In</Button>
            <Button variant="outline" onClick={onSwitchToRegister}>
              Create Account
            </Button>
            <Button variant="outline" onClick={onForgotPassword}>
              Forgot Password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}