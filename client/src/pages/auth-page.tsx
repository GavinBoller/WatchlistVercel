import { useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { UserResponse } from '@shared/schema';
import { useJwtAuth } from '@/hooks/use-jwt-auth';
import { Navigate } from 'react-router-dom';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, isAuthenticated } = useJwtAuth();

  const handleAuthSuccess = (user: UserResponse) => {
    console.log('Auth success:', user);
  };

  if (isAuthenticated && user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="space-y-4">
      <h1>{isLogin ? 'Login' : 'Register'}</h1>
      {isLogin ? (
        <LoginForm
          onLoginSuccess={handleAuthSuccess}
          onSwitchToRegister={() => setIsLogin(false)}
        />
      ) : (
        <RegisterForm
          onRegisterSuccess={handleAuthSuccess}
          onSwitchToLogin={() => setIsLogin(true)}
        />
      )}
    </div>
  );
}
