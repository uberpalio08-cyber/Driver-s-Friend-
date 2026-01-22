
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Registro de Service Worker para PWA (Play Store Ready)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registrado com sucesso:', reg.scope))
      .catch(err => console.log('Falha ao registrar SW:', err));
  });
}

// Native Bridge: Haptic Feedback e Gestão de Hardware
const NativeBridge = {
  vibrate: (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },
  requestLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject('GPS não disponível');
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
  }
};

(window as any).NativeBridge = NativeBridge;

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
