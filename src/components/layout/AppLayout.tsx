import React, { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart3, Settings, WifiOff, CloudCheck } from 'lucide-react';
import { ToastContainer } from '../feedback/Toast';
import { PWAUpdatePrompt } from '../feedback/PWAUpdatePrompt';
import { initializeRealtimeSubscriptions } from '@/services/realtime.service';
import { useAuthStore } from '@/store/authStore';
import { BrandLogo } from '@/components/common/BrandLogo';

export const AppLayout: React.FC = () => {
  const { user } = useAuthStore();
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize Supabase Realtime listeners
    const unsubscribeRealtime = initializeRealtimeSubscriptions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeRealtime();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 pb-28 md:pb-6 selection:bg-sky-500 selection:text-white">
      {/* Toast Notification Mount Point */}
      <ToastContainer />

      {/* Ultra-Premium Glass Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-2xl border-b border-slate-800/90 px-4 py-3 shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative group cursor-pointer">
              <BrandLogo size={44} variant="mark" className="transition-transform group-hover:scale-105" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-950 rounded-full animate-ping" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="heading-font font-black text-lg md:text-xl text-slate-100 tracking-tight leading-none gradient-text-sky">
                  उधारी खाता
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 bg-sky-500/15 border border-sky-500/30 text-sky-300 rounded-full text-[10px] font-extrabold glow-sky">
                  <CloudCheck className="w-3 h-3 mr-1 text-sky-400" />
                  क्लाऊड सिंक
                </span>
              </div>
              <p className="text-xs text-slate-400 font-bold leading-tight mt-0.5">
                {user?.displayName || 'बापू शिंदे (मालक)'} •{' '}
                <span className="text-sky-400 uppercase tracking-wider">{user?.role || 'OWNER'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {isOffline && (
              <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded-full text-xs font-bold shadow-lg glow-amber animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span>ऑफलाईन</span>
              </div>
            )}

            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-750 flex items-center justify-center font-black text-sky-400 text-sm shadow-md glow-sky">
              {user?.displayName?.charAt(0) || 'द'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 animate-in fade-in duration-300">
        <Outlet />
      </main>

      {/* Ultra-Premium Floating Glass Capsule Navigation Bar */}
      <nav className="fixed bottom-3 left-4 right-4 z-40 max-w-sm mx-auto">
        <div className="glass-nav rounded-full px-3 py-2 border border-slate-800/90 shadow-2xl flex items-center justify-around backdrop-blur-2xl bg-slate-950/90">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center py-1.5 px-4 rounded-full text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/40 glow-sky shadow-xl scale-105'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">होम</span>
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `flex flex-col items-center py-1.5 px-4 rounded-full text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/40 glow-sky shadow-xl scale-105'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">ग्राहक</span>
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex flex-col items-center py-1.5 px-4 rounded-full text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/40 glow-sky shadow-xl scale-105'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">रिपोर्ट</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center py-1.5 px-4 rounded-full text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/40 glow-sky shadow-xl scale-105'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <Settings className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">सेटिंग्ज</span>
          </NavLink>
        </div>
      </nav>

      {/* PWA Update Banner */}
      <PWAUpdatePrompt />
    </div>
  );
};
