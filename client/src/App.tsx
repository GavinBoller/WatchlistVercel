import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import AuthPage from './pages/auth-page'; // Updated import
import SearchPage from './pages/SearchPage';
import WatchlistPage from './pages/WatchlistPage';
import { useJwtAuth } from './hooks/use-jwt-auth';

function App() {
  const { checkAuth } = useJwtAuth();
  useEffect(() => {
    checkAuth();
    console.log('App component rendered');
  }, [checkAuth]);
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/watchlist" element={<WatchlistPage />} />
      <Route path="/" element={<SearchPage />} />
    </Routes>
  );
}
export default App;
