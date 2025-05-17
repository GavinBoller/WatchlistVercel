import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useJwtAuth } from "../hooks/use-jwt-auth";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { PasswordResetForm } from "@/components/PasswordResetForm";
import { UserResponse } from "@shared/schema";

declare global {
  interface Window {
    __authBackup?: {
      userId: number;
      username: string;
      timestamp: number;
    } | null;
  }
}

type AuthView = "login" | "register" | "passwordReset";

export default function AuthPage() {
  const [view, setView] = useState<AuthView>("login");
  const { user, isLoading } = useJwtAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const loadEnvironmentUtils = async () => {
      const {
        isProductionEnvironment,
        getEnvironmentName,
        clearAllClientSideStorage
      } = await import('../lib/environment-utils');
      
      const urlParams = new URLSearchParams(window.location.search);
      const isPreload = urlParams.get('preload') === 'true';
      const fromLogout = urlParams.get('fromLogout') === 'true';
      const forceFlag = urlParams.get('force') === 'true';
      const clearFlag = urlParams.get('clear') === 'true';
      const hardFlag = urlParams.get('hard') === 'true';
      
      const isProd = isProductionEnvironment();
      console.log(`Auth page loaded in ${getEnvironmentName()} environment`);
      console.log("URL flags:", { isPreload, fromLogout, forceFlag, clearFlag, hardFlag });
      
      let justLoggedOut = false;
      try {
        justLoggedOut = localStorage.getItem('jusT_logged_out') === 'true' || 
                        sessionStorage.getItem('jusT_logged_out') === 'true';
        localStorage.removeItem('jusT_logged_out');
        sessionStorage.removeItem('jusT_logged_out');
        if (justLoggedOut) {
          console.log("Detected recent logout - will forcibly clear state");
        }
      } catch (e) {
        console.error("Error checking logout flag:", e);
      }
      
      if (isPreload) {
        console.log("Auth page preloaded for faster logout transition");
        return;
      }
      
      const needStateClear = isProd || hardFlag || clearFlag || fromLogout || forceFlag || justLoggedOut;
      
      if (needStateClear) {
        console.log(`Clearing client-side state in ${getEnvironmentName()} environment`);
        // Preserve connect.sid cookie
        try {
          localStorage.removeItem('jwt_token');
          sessionStorage.removeItem('jwt_token');
          document.cookie = 'jwt_token=; path=/; max-age=0';
          localStorage.removeItem('auth_backup');
          sessionStorage.removeItem('auth_backup');
          
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('token') || key.includes('user') || key.includes('auth'))) {
              localStorage.removeItem(key);
            }
          }
          
          if (window.__authBackup) {
            try {
              delete window.__authBackup;
            } catch (e) {
              window.__authBackup = null;
            }
          }
        } catch (e) {
          console.error("Error clearing auth state:", e);
        }
        
        if ((isProd || hardFlag || justLoggedOut) && !isPreload) {
          console.log("Making additional logout request from auth page");
          try {
            fetch('/api/auth/logout', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              },
              cache: 'no-store'
            }).catch(() => {});
          } catch (e) {
            console.error("Error during additional logout:", e);
          }
        }
      }
    };
    loadEnvironmentUtils();
  }, []);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reload = urlParams.get('reload') === 'true';
    
    if (reload) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('reload');
      window.history.replaceState({}, '', newUrl.toString());
      
      if (window.location.hostname.includes('replit.app')) {
        console.log("Production environment detected, applying special cookie clearing...");
        const allCookies = document.cookie.split(';');
        for (let i = 0; i < allCookies.length; i++) {
          const cookie = allCookies[i];
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          if (name.trim() !== 'connect.sid') {
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;';
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      console.log('[AUTH PAGE] User authenticated, redirecting to /');
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  const handleAuthSuccess = (user: UserResponse) => {
    console.log('[AUTH PAGE] Auth success, redirecting to /');
    setLocation('/');
  };

  const handleSwitchToRegister = () => {
    setView("register");
  };

  const handleSwitchToLogin = () => {
    setView("login");
  };

  const handleSwitchToPasswordReset = () => {
    setView("passwordReset");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row">
      <div className="md:w-1/2 p-6 md:p-10 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              {view === "login" ? "Welcome Back" : view === "register" ? "Create Account" : "Reset Password"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {view === "login"
                ? "Sign in to access your personalized movie watchlist"
                : view === "register"
                ? "Join to start tracking movies and shows you love"
                : "Enter your details to reset your password"}
            </p>
          </div>

          {view === "login" && (
            <LoginForm
              onLoginSuccess={handleAuthSuccess}
              onSwitchToRegister={handleSwitchToRegister}
              onForgotPassword={handleSwitchToPasswordReset}
            />
          )}
          
          {view === "register" && (
            <RegisterForm
              onRegisterSuccess={handleAuthSuccess}
              onSwitchToLogin={handleSwitchToLogin}
            />
          )}
          
          {view === "passwordReset" && (
            <PasswordResetForm
              onBack={handleSwitchToLogin}
            />
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