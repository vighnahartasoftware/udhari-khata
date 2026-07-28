import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (import.meta.env.DEV) {
        console.log('SW Registered:', r);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-label="PWA Update Available"
      className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl text-slate-100 flex items-center justify-between z-50 animate-bounce-short"
    >
      <div className="flex items-center space-x-3">
        <RefreshCw className="w-5 h-5 text-sky-400 animate-spin-slow" />
        <div>
          <h4 className="text-sm font-semibold">New Update Available</h4>
          <p className="text-xs text-slate-400">Click reload to update Udhari Khata</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => void updateServiceWorker(true)}
          className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-lg transition-colors"
        >
          Reload
        </button>
        <button
          onClick={close}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
