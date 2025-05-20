import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import App from './App';
import './index.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

// Log font loading for debugging
const fontFamilies = Array.from(document.fonts).map(font => font.family);
console.log('Loaded font families:', fontFamilies);
try {
  const fontImports = Array.from(document.styleSheets)
    .flatMap(sheet => {
      try {
        return Array.from(sheet.cssRules);
      } catch (e) {
        console.warn('Cannot access cssRules for stylesheet:', sheet.href, e);
        return [];
      }
    })
    .filter(rule => rule instanceof CSSFontFaceRule)
    .map(rule => rule.style.getPropertyValue('font-family'));
  console.log('Font imports:', fontImports);
} catch (e) {
  console.error('Error accessing font imports:', e);
}
