import React, { useEffect, useState } from 'react';
import { useLocation, Switch, Route } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import Header from '@/components/Header';
import SearchPage from '@/pages/SearchPage';
import WatchlistPage from '@/pages/WatchlistPage';
import AuthPage from '@/pages/auth-page';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import { ProtectedRoute } from './lib/ProtectedRoute';

interface User {
  id: number;
  username: string;
  displayName: string;
}

interface UserContextValue {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const UserContext = React.createContext<UserContextValue>({
  currentUser: null,
  setCurrentUser: () => {},
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

function AppInternal() {
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/status', {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.isAuthenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const userContextValue: UserContextValue = {
    currentUser: user,
    setCurrentUser: setUser,
    login: () => {},
    logout: async () => {
      try {
        await fetch('http://localhost:3000/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        setUser(null);
      } catch (error) {
        console.error('Logout failed:', error);
      }
    },
    isAuthenticated: !!user,
  };

  return (
    <UserContext.Provider value={userContextValue}>
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
        <Toaster />
      </div>
    </UserContext.Provider>
  );
}

function App() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppInternal />
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;