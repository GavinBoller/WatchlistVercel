import React from 'react';
import ReactDOM from 'react-dom/client';
import { JwtAuthProvider } from '@/hooks/use-jwt-auth';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please refresh the page.</h1>;
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <JwtAuthProvider>
        <App />
      </JwtAuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
