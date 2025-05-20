import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from '@/pages/auth-page';
import SearchPage from '@/pages/SearchPage';
import WatchlistPage from '@/pages/WatchlistPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import ProtectedRoute from '@/lib/ProtectedRoute';
import { useJwtAuth } from '@/hooks/use-jwt-auth';

export default function App() {
  const { user, isAuthenticated } = useJwtAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/watchlist"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <WatchlistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            user?.role === 'admin' ? (
              <AdminDashboardPage />
            ) : (
              <AuthPage />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
