import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Log font details
const logFontImports = () => {
  const fonts = Array.from(document.fonts).map(font => ({
    family: font.family,
    status: font.status,
    weight: font.weight
  }));
  console.log('Loaded font families:', fonts);

  const links = document.querySelectorAll('link[rel="stylesheet"]');
  console.log('Font imports:', Array.from(links).map(link => ({
    href: link.href,
    initiator: link.dataset.initiator || 'unknown'
  })));
};

document.fonts.ready.then(() => {
  logFontImports();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);