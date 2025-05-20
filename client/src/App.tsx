import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from '@/pages/auth-page';
import { SearchPage } from '@/pages/SearchPage';
import WatchlistPage from '@/pages/WatchlistPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { ProtectedRoute } from '@/lib/ProtectedRoute';
import { useJwtAuth } from '@/hooks/use-jwt-auth';

interface SearchPageProps {
  movie: any; // Adjust based on actual type
}

export default function App() {
  const { user } = useJwtAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute
              component={() => <SearchPage movie={{} as any} />}
            />
          }
        />
        <Route
          path="/watchlist"
          element={<ProtectedRoute component={WatchlistPage} />}
        />
        <Route
          path="/admin"
          element={
            user?.role === 'admin' ? (
              <ProtectedRoute component={AdminDashboardPage} />
            ) : (
              <AuthPage />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
