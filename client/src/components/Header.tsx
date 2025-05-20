import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Search, List, Film, AlertTriangle, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJwtAuth } from '@/hooks/use-jwt-auth';
import { useQueryClient } from '@tanstack/react-query';
import { PlatformManagementModal } from './PlatformManagementModal';

interface HeaderProps {
  onTabChange: (tab: 'search' | 'watchlist') => void;
  activeTab: 'search' | 'watchlist';
  onAuthClick: () => void;
}

const Header = ({ onTabChange, activeTab, onAuthClick }: HeaderProps) => {
  const isMobile = useIsMobile();
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const { user, isAuthenticated, logout } = useJwtAuth();
  const queryClient = useQueryClient();

  // Fetch platforms when needed
  const fetchPlatforms = async (userId: number) => {
    try {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${userId}`] });
    } catch (error) {
      console.error('Error fetching platforms:', error);
    }
  };

  // Check emergency mode
  React.useEffect(() => {
    const checkEmergencyMode = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const emergencyLogin = urlParams.get('emergencyLogin') === 'true';
        const directAuth = urlParams.get('directAuth') === 'true';
        const storedEmergencyAuth = sessionStorage.getItem('emergency_auth') === 'true';
        setIsEmergencyMode(emergencyLogin || directAuth || storedEmergencyAuth);
      } catch (e) {
        console.error('[EMERGENCY] Error checking emergency mode:', e);
      }
    };
    checkEmergencyMode();
    window.addEventListener('popstate', checkEmergencyMode);
    return () => window.removeEventListener('popstate', checkEmergencyMode);
  }, []);

  return (
    <header className="bg-[#141414] border-b border-[#292929] sticky top-0 z-50 ios-safe-area-padding">
      <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center">
        {/* Logo area */}
        <div className="flex items-center justify-between mb-2 md:mb-0 md:w-1/4">
          <div className="flex items-center">
            <Film className="h-6 w-6 text-[#E50914] mr-2" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#E50914] tracking-tight">Watchlist</h1>
            {isEmergencyMode && (
              <div className="ml-2 flex items-center bg-yellow-700/30 text-yellow-500 text-xs px-2 py-1 rounded-md">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span>Emergency Mode</span>
              </div>
            )}
          </div>
          {/* Mobile auth and platform buttons */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center p-2 h-8"
                onClick={() => setIsPlatformModalOpen(true)}
                aria-label="Manage Platforms"
              >
                <Monitor className="h-4 w-4" />
              </Button>
            )}
            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Logout
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={onAuthClick}>
                Sign In
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:justify-between md:flex-1">
          {/* Navigation */}
          <nav className="w-full md:w-auto md:mx-auto">
            {isMobile ? (
              <ul className="grid grid-cols-2 gap-1 bg-[#1a1a1a] rounded-lg p-1">
                <li className="w-full">
                  <button
                    className={`w-full rounded-md py-2 flex items-center justify-center text-center ${
                      activeTab === 'search'
                        ? 'bg-[#292929] text-white font-medium'
                        : 'text-[#E5E5E5] hover:bg-[#292929]/50'
                    }`}
                    onClick={() => onTabChange('search')}
                    aria-label="Search tab"
                  >
                    <Search className={`h-4 w-4 mr-2 ${activeTab === 'search' ? 'text-[#E50914]' : ''}`} />
                    <span>Search</span>
                  </button>
                </li>
                <li className="w-full">
                  <button
                    className={`w-full rounded-md py-2 flex items-center justify-center text-center ${
                      activeTab === 'watchlist'
                        ? 'bg-[#292929] text-white font-medium'
                        : 'text-[#E5E5E5] hover:bg-[#292929]/50'
                    }`}
                    onClick={() => onTabChange('watchlist')}
                    aria-label="Watchlist tab"
                  >
                    <List className={`h-4 w-4 mr-2 ${activeTab === 'watchlist' ? 'text-[#E50914]' : ''}`} />
                    <span>My Watchlist</span>
                  </button>
                </li>
              </ul>
            ) : (
              <ul className="flex space-x-8">
                <li>
                  <button
                    className={`px-3 py-2 font-medium border-b-2 flex items-center text-base ${
                      activeTab === 'search'
                        ? 'border-[#E50914] text-white'
                        : 'border-transparent text-[#E5E5E5] hover:text-white transition'
                    }`}
                    onClick={() => onTabChange('search')}
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Search
                  </button>
                </li>
                <li>
                  <button
                    className={`px-3 py-2 font-medium border-b-2 flex items-center text-base ${
                      activeTab === 'watchlist'
                        ? 'border-[#E50914] text-white'
                        : 'border-transparent text-[#E5E5E5] hover:text-white transition'
                    }`}
                    onClick={() => onTabChange('watchlist')}
                  >
                    <List className="h-5 w-5 mr-2" />
                    My Watchlist
                  </button>
                </li>
              </ul>
            )}
          </nav>
          {/* Desktop auth and platform buttons */}
          {!isMobile && (
            <div className="flex items-center gap-3 md:w-1/4 md:justify-end">
              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => setIsPlatformModalOpen(true)}
                  aria-label="Manage Platforms"
                >
                  <Monitor className="h-4 w-4" />
                  <span className="hidden sm:inline">Platforms</span>
                </Button>
              )}
              {isAuthenticated ? (
                <Button variant="outline" size="sm" onClick={() => logout()}>
                  Logout
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={onAuthClick}>
                  Sign In
                </Button>
              )}
            </div>
          )}
          {/* Platform Management Modal */}
          {isAuthenticated && (
            <PlatformManagementModal
              isOpen={isPlatformModalOpen}
              onClose={() => setIsPlatformModalOpen(false)}
              onPlatformsUpdated={() => {
                if (user?.id) {
                  queryClient.invalidateQueries({ queryKey: [`/api/platforms/${user.id}`] });
                }
              }}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
