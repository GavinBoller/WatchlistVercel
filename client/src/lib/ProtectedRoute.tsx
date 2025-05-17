import { useState, useEffect } from 'react';
import { Route, Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/status', {
          credentials: 'include',
        });
        const data = await response.json();
        setIsAuthenticated(data.isAuthenticated);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
          <span className="ml-2 text-muted-foreground">Verifying authentication...</span>
        </div>
      </Route>
    );
  }

  if (!isAuthenticated) {
    return <Route path={path}><Redirect to="/auth" /></Route>;
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}