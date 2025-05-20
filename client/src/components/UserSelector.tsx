import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserResponse } from '@shared/schema';
import { useJwtAuth } from '@/hooks/use-jwt-auth';

export default function UserSelector() {
  const [cachedUser, setCachedUser] = useState<UserResponse | null>(null);
  const { user, logout } = useJwtAuth();

  useEffect(() => {
    if (user) {
      setCachedUser({
        ...user,
        createdAt: user.createdAt || new Date().toISOString(),
      });
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setCachedUser(null);
  };

  if (!cachedUser) {
    return <div>Please log in</div>;
  }

  return (
    <div className="flex items-center space-x-4">
      <span>{cachedUser.displayName}</span>
      <Button onClick={handleLogout}>Logout</Button>
    </div>
  );
}
