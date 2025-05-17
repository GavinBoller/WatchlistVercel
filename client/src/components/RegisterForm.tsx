import { useState, FormEvent, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserResponse } from '@shared/schema';
import { useJwtAuth } from '../hooks/use-jwt-auth';

interface RegisterFormProps {
  onRegisterSuccess: (user: UserResponse) => void;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onRegisterSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { register } = useJwtAuth();
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
      await register(username, password, displayName);
      toast({
        title: 'Registration Successful',
        description: 'You can now log in with your new account.',
      });
      onRegisterSuccess({ id: 0, username, displayName, role: 'user', createdAt: new Date() });
      setTimeout(() => {
        setIsOpen(false);
        setLocation('/auth');
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      toast({
        title: 'Registration Failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-background p-6 rounded-lg z-50" aria-label="Register Form">
        <div className="space-y-2">
          <DialogTitle className="text-lg font-semibold">Create Account</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Join to start tracking movies and shows you love
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
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              required
              autoComplete="name"
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
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex justify-end space-x-2">
            <Button type="submit">Register</Button>
            <Button variant="outline" onClick={onSwitchToLogin}>
              Back to Login
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}