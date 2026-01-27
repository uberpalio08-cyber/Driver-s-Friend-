
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

// Ponte Nativa Inteligente (Web + Native)
const NativeBridge = {
  isNative: () => isNative,
  vibrate: async (style: 'LIGHT' | 'MEDIUM' | 'HEAVY' = 'MEDIUM') => {
    try {
      if (isNative) {
        const impactStyle = style === 'LIGHT' ? ImpactStyle.Light : style === 'HEAVY' ? ImpactStyle.Heavy : ImpactStyle.Medium;
        await Haptics.impact({ style: impactStyle });
      } else if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    } catch (e) {
      console.warn("Haptics not available");
    }
  },
  getPreciseLocation: async () => {
    try {
      if (isNative) {
        return await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
      }
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });
    } catch (e) {
      throw e;
    }
  }
};

(window as any).NativeBridge = NativeBridge;

// Bloqueio de Gestos (Apenas Nativo)
if (isNative) {
  document.addEventListener('gesturestart', (e) => e.preventDefault());
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
