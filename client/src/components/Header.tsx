import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useJwtAuth } from '@/hooks/use-jwt-auth';
import AuthModal from '@/components/AuthModal';
import { UserResponse } from '@shared/schema';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { user, logout } = useJwtAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleAuthSuccess = (user: UserResponse) => {
    setIsAuthModalOpen(false);
    console.log('Auth success:', user);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="flex justify-between items-center p-4">
      <Link to="/">Watchlist</Link>
      <nav>
        {user ? (
          <>
            <span>Welcome, {user.displayName}</span>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsAuthModalOpen(true)}>Login</Button>
        )}
      </nav>
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </header>
  );
}
