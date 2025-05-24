import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

console.log('main.tsx: Script loaded');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('main.tsx: Root element not found');
  } else {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  }
} catch (error) {
  console.error('main.tsx: Error during rendering:', error);
}
