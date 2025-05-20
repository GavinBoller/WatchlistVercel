import { useContext } from 'react';
import { JwtAuthContext } from '@/hooks/use-jwt-auth';

export default function EmergencyAuth() {
  const authContext = useContext(JwtAuthContext);

  if (!authContext) {
    return <div>Error: Auth context not available</div>;
  }

  if (!authContext.isAuthenticated) {
    return (
      <div>
        <h2>Emergency Login</h2>
        <p>Please log in to continue.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Emergency Access</h2>
      <p>Welcome, {authContext.user?.displayName || 'User'}!</p>
    </div>
  );
}
