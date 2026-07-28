import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AppProviders } from './providers';
import { PWAUpdatePrompt } from '@/components/feedback/PWAUpdatePrompt';
import { runLocalSeedIfNeeded } from '@/db/seed';

export const App: React.FC = () => {
  useEffect(() => {
    void runLocalSeedIfNeeded();

    // In local development mode, unregister any stale service workers from preview runs
    if (import.meta.env.DEV && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
    }
  }, []);

  return (
    <AppProviders>
      <RouterProvider router={router} />
      <PWAUpdatePrompt />
    </AppProviders>
  );
};
