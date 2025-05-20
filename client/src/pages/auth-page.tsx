import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useJwtAuth } from '../hooks/use-jwt-auth';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { PasswordResetForm } from '@/components/PasswordResetForm';
import { toast } from 'sonner';
import { isProductionEnvironment } from '../lib/environment-utils';
import { UserResponse } from '@shared/schema';

type AuthView = 'login' | 'register' | 'passwordReset';

export function AuthPage() {
  const { user, isAuthenticated, isLoading } = useJwtAuth();
  const [location, setLocation] = useLocation();
  const [view, setView] = useState<AuthView>('login');

  console.log('[AUTH PAGE] Auth page loaded in', isProductionEnvironment() ? 'PRODUCTION' : 'DEVELOPMENT', 'environment');

  // Parse URL flags
  const urlFlags = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      fromLogout: params.get('fromLogout') === 'true',
      preload: params.get('preload') === 'true',
      force: params.get('force') === 'true',
      clear: params.get('clear') === 'true',
      hard: params.get('hard') === 'true',
      reload: params.get('reload') === 'true',
    };
  }, []);

  console.log('[AUTH PAGE] URL flags:', urlFlags);

  // Handle logout toast and cleanup
  useEffect(() => {
    if (urlFlags.fromLogout) {
      toast.success('You have been logged out');
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('fromLogout');
      window.history.replaceState({}, '', newUrl.toString());
    }
    if (urlFlags.reload) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('reload');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [urlFlags]);

  // Redirect if authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && location !== '/') {
      console.log('[AUTH PAGE] User authenticated, redirecting to /');
      setLocation('/');
    }
  }, [isAuthenticated, user, isLoading, location, setLocation]);

  if (urlFlags.preload) {
    console.log('[AUTH PAGE] Preloaded for faster logout transition');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p>Verifying Authentication</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row">
      <div className="md:w-1/2 p-6 md:p-10 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              {view === 'login' ? 'Welcome Back' : view === 'register' ? 'Create Account' : 'Reset Password'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {view === 'login'
                ? 'Sign in to access your personalized movie watchlist'
                : view === 'register'
                ? 'Join to start tracking movies and shows you love'
                : 'Enter your details to reset your password'}
            </p>
          </div>

          {view === 'login' && (
            <LoginForm
              onLoginSuccess={() => setLocation('/')}
              onSwitchToRegister={() => setView('register')}
              onForgotPassword={() => setView('passwordReset')}
            />
          )}
          {view === 'register' && (
            <RegisterForm
              onRegisterSuccess={() => setLocation('/auth')}
              onSwitchToLogin={() => setView('login')}
            />
          )}
          {view === 'passwordReset' && (
            <PasswordResetForm onBack={() => setView('login')} />
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium mb-2">Having trouble logging in?</h3>
            <p className="text-xs text-muted-foreground mb-2">
              If you're experiencing login issues, try resetting your password or clearing your browser cache.
            </p>
          </div>
        </div>
      </div>
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/90 to-primary/50 p-10 flex-col justify-center">
        <div className="max-w-lg">
          <h2 className="text-4xl font-bold text-white mb-6">Discover and Track Your Favorite Movies</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <svg className="h-6 w-6 text-white mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white">Create your personalized watchlist</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-white mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white">Track movies you've watched, are watching, or want to watch</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-white mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white">Search over 500,000 movies and TV shows</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-white mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white">Keep your watchlist private and secure</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
