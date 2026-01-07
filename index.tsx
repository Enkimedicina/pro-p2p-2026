import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  const root = createRoot(rootElement);
  
  try {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Ocultar el loader cuando React tome el control
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.style.display = 'none', 500);
    }
  } catch (err) {
    console.error("Mount error:", err);
    throw err; // Esto activará el error boundary del HTML
  }
};

mountApp();