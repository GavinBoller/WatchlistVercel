import React, { useState } from 'react';
import { useLocation, Switch, Route } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import Header from '@/components/Header';
import SearchPage from '@/pages/SearchPage';
import WatchlistPage from '@/pages/WatchlistPage';
import { AuthPage } from '@/pages/auth-page';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import { ProtectedRoute } from './lib/ProtectedRoute';
import { JwtAuthProvider } from './hooks/use-jwt-auth';
import { AuthModal } from '@/components/AuthModal';
import { useJwtAuth } from './hooks/use-jwt-auth';

function AppInternal() {
  const [location, setLocation] = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isAuthenticated, isLoading } = useJwtAuth();

  // Redirect to /auth if not authenticated and not on /auth
  if (!isLoading && !isAuthenticated && location !== '/auth') {
    setLocation('/auth');
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        onTabChange={(tab) => {
          if (tab === 'search') {
            setLocation('/');
          } else if (tab === 'watchlist') {
            setLocation('/watched');
          }
        }}
        activeTab={location === '/' ? 'search' : 'watchlist'}
        onAuthClick={() => setIsAuthModalOpen(true)}
      />
      <main className="flex-grow">
        <Switch>
          <ProtectedRoute path="/" component={SearchPage} />
          <ProtectedRoute path="/watched" component={WatchlistPage} />
          <ProtectedRoute path="/admin" component={AdminDashboardPage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/api/:rest*">
            {() => null}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={() => {
          setIsAuthModalOpen(false);
          setLocation('/');
        }}
      />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <React.StrictMode>
      <JwtAuthProvider>
        <QueryClientProvider client={queryClient}>
          <AppInternal />
        </QueryClientProvider>
      </JwtAuthProvider>
    </React.StrictMode>
  );
}

export default App;
