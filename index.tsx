
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Ponte Nativa Robusta
const NativeBridge = {
  vibrate: async (style: 'LIGHT' | 'MEDIUM' | 'HEAVY' = 'MEDIUM') => {
    try {
      // Tenta usar a API nativa de Haptics se disponível (via Capacitor/Plugins)
      if (navigator.vibrate) navigator.vibrate(20);
    } catch (e) {}
  },
  getPreciseLocation: async () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
    });
  }
};

(window as any).NativeBridge = NativeBridge;

// Bloqueio de Gestos Indesejados de Navegador
document.addEventListener('gesturestart', (e) => e.preventDefault());

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
