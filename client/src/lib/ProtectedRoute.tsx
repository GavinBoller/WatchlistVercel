import React from 'react';
import { Route, Redirect } from 'wouter';
import { useJwtAuth } from '../hooks/use-jwt-auth';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { isAuthenticated, isLoading } = useJwtAuth();

  if (isLoading && !isAuthenticated) {
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

  return <Route path={path}><Component /></Route>;
}
