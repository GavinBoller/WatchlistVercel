import { useState, useRef, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { ChevronDown, UserCircle, Users, LogOut, LockKeyhole } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { useJwtAuth } from '../hooks/use-jwt-auth';
import { useToast } from '@/hooks/use-toast';

interface UserResponse {
  id: number;
  username: string;
  displayName: string;
  role: string;
  createdAt: Date;
}

declare global {
  interface Window {
    __authBackup?: {
      userId: number;
      username: string;
      timestamp: number;
    } | null;
    __loggedOut?: boolean;
  }
}

interface UserSelectorProps {
  isMobile?: boolean;
}

const UserSelector = ({ isMobile = false }: UserSelectorProps) => {
  const { user, isLoading, logout } = useJwtAuth();
  const [cachedUser, setCachedUser] = useState<UserResponse | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setCachedUser(user);
  }, [user]);

  const [hasRecentlyLoggedOut, setHasRecentlyLoggedOut] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      console.log('[UserSelector] User logged in, clearing logout flags');
      setHasRecentlyLoggedOut(false);
      localStorage.removeItem('just_logged_out');
      sessionStorage.removeItem('just_logged_out');
      window.__loggedOut = false;
    }
  }, [user]);

  useEffect(() => {
    try {
      const localStorageFlag = localStorage.getItem('just_logged_out') === 'true';
      const sessionStorageFlag = sessionStorage.getItem('just_logged_out') === 'true';
      const globalFlag = typeof window !== 'undefined' && window.__loggedOut === true;
      const justLoggedOut = localStorageFlag || sessionStorageFlag || globalFlag;
      setHasRecentlyLoggedOut(justLoggedOut);

      const isOnAuthPage =
        window.location.pathname === '/auth' ||
        window.location.href.includes('/login') ||
        window.location.href.includes('/register');
      if (isOnAuthPage) {
        console.log('[UserSelector] On auth page, setting logged out state');
        setHasRecentlyLoggedOut(true);
        setCachedUser(null);
      }
    } catch (e) {
      console.error('[UserSelector] Error checking logout flags:', e);
    }
  }, []);

  const isAuthenticated = !!user && !!cachedUser && !hasRecentlyLoggedOut;

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const actualIsMobile = useIsMobile();

  useEffect(() => {
    if (!actualIsMobile) {
      setSheetOpen(false);
    }
  }, [actualIsMobile]);

  const handleLogout = async () => {
    try {
      setCachedUser(null);
      setHasRecentlyLoggedOut(true);
      sessionStorage.setItem('just_logged_out', 'true');
      localStorage.setItem('just_logged_out', 'true');
      window.__loggedOut = true;
      sessionStorage.removeItem('jwt_token');
      localStorage.removeItem('jwt_token');
      document.cookie = 'connect.sid=; path=/; max-age=0';
      await logout();
      toast({ title: 'Logged out successfully' });
      window.location.href = '/auth';
    } catch (error) {
      console.error('[UserSelector] Logout error:', error);
      toast({ title: 'Logout failed', variant: 'destructive' });
    }
  };

  const handleLoginModal = () => {
    setIsAuthModalOpen(true);
    setSheetOpen(false);
  };

  const displayName = isAuthenticated
    ? cachedUser?.displayName || cachedUser?.username
    : 'Guest';

  if (actualIsMobile && isMobile) {
    return (
      <div className="relative">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center space-x-2 bg-[#292929] rounded-full px-3 py-1">
              <UserCircle className="h-5 w-5 text-[#E50914]" />
              <span className="max-w-[100px] truncate">{isAuthenticated ? displayName : 'Sign In'}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-[#292929] text-white border-t border-gray-700 rounded-t-xl px-0">
            <SheetHeader className="px-4">
              <SheetTitle className="text-center text-white flex items-center justify-center">
                <Users className="h-5 w-5 mr-2 text-[#E50914]" />
                {isAuthenticated ? 'Account' : 'Sign In'}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-1">
              {isAuthenticated ? (
                <>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 py-3 text-white"
                      disabled
                    >
                      <UserCircle className="h-5 w-5 mr-3 text-[#E50914]" />
                      {displayName}
                    </Button>
                  </SheetClose>
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-3 text-red-400 hover:bg-red-900 hover:text-white"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start px-4 py-3 text-[#44C8E8] hover:bg-[#E50914] hover:text-white"
                  onClick={handleLoginModal}
                >
                  <LockKeyhole className="h-5 w-5 mr-3" />
                  Sign In / Register
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={(user) => {
            setHasRecentlyLoggedOut(false);
            localStorage.removeItem('just_logged_out');
            sessionStorage.removeItem('just_logged_out');
            window.__loggedOut = false;
            console.log('[UserSelector] Auth success, cleared logout flags');
            setCachedUser(user);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${isMobile ? '' : 'hidden md:block'}`}>
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={triggerRef}
          className="flex items-center space-x-2 bg-[#292929] rounded-full px-3 py-1"
        >
          <UserCircle className="h-5 w-5 text-[#E50914]" />
          <span>{isAuthenticated ? displayName : 'Sign In'}</span>
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#292929] text-white border-gray-700">
          {isAuthenticated ? (
            <>
              <DropdownMenuItem className="text-white cursor-default" disabled>
                <UserCircle className="h-4 w-4 mr-2 text-[#E50914]" />
                {displayName}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                className="text-red-400 hover:bg-red-900 hover:text-white cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              className="text-[#44C8E8] hover:bg-[#E50914] hover:text-white cursor-pointer"
              onClick={handleLoginModal}
            >
              <LockKeyhole className="h-4 w-4 mr-2" />
              Sign In / Register
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setHasRecentlyLoggedOut(false);
          localStorage.removeItem('just_logged_out');
          sessionStorage.removeItem('just_logged_out');
          window.__loggedOut = false;
          console.log('[UserSelector] Auth success, cleared logout flags');
          setCachedUser(user);
        }}
      />
    </div>
  );
};

export default UserSelector;
