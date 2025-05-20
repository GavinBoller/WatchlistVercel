import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@radix-ui/react-dialog';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { PasswordResetForm } from './PasswordResetForm';
import { UserResponse } from '@shared/schema';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserResponse) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'register' | 'passwordReset'>('login');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle>
          {view === 'login' ? 'Sign In' : view === 'register' ? 'Register' : 'Reset Password'}
        </DialogTitle>
        {view === 'login' && (
          <LoginForm
            onLoginSuccess={onAuthSuccess}
            onSwitchToRegister={() => setView('register')}
            onForgotPassword={() => setView('passwordReset')}
          />
        )}
        {view === 'register' && (
          <RegisterForm
            onRegisterSuccess={onAuthSuccess}
            onSwitchToLogin={() => setView('login')}
          />
        )}
        {view === 'passwordReset' && (
          <PasswordResetForm onBack={() => setView('login')} />
        )}
      </DialogContent>
    </Dialog>
  );
}
