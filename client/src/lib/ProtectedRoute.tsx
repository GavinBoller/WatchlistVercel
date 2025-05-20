import { Navigate } from 'react-router-dom';
import { useJwtAuth } from '@/hooks/use-jwt-auth';

interface ProtectedRouteProps {
  component: React.ComponentType;
}

export function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const { isAuthenticated } = useJwtAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  return <Component />;
}
