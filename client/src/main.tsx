import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JwtAuthProvider } from '@/hooks/use-jwt-auth';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <JwtAuthProvider>
        <App />
      </JwtAuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
