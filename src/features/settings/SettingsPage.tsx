import React, { useState } from 'react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { db } from '@/db/dexie';
import { syncEngine } from '@/services/sync.service';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useToastStore } from '@/components/feedback/ToastStore';
import { env } from '@/lib/env';
import { DEMO_OWNER_PROFILE, DEMO_STAFF_PROFILE, runLocalSeedIfNeeded } from '@/db/seed';
import { BackupImportModal } from './BackupImportModal';
import {
  User,
  RefreshCw,
  Download,
  Upload,
  LogOut,
  Smartphone,
  CheckCircle2,
  RotateCcw,
  Users,
  Sun,
  Moon,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';

export const SettingsPage: React.FC = () => {
  const { user, logout, isOwner, setUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { addToast } = useToastStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { pendingSyncCount, refreshData } = useRealtimeData();

  const isLocalMode = env.VITE_DATA_MODE === 'local';

  const handleManualSync = async () => {
    if (isLocalMode) {
      addToast({
        type: 'info',
        message: 'स्थानिक मोडमध्ये सर्व डेटा फोनमध्ये सुरक्षित आहे. (Local mode active)',
      });
      return;
    }

    try {
      setIsSyncing(true);
      const res = await syncEngine.processQueue();
      refreshData();
      if (res.processed > 0) {
        addToast({
          type: 'success',
          message: `सिंक पूर्ण! (${res.processed} नोंदी जतन झाल्या)`,
        });
      } else if (res.failed > 0) {
        addToast({
          type: 'warning',
          message: `सिंकमध्ये ${res.failed} त्रुटी आल्या.`,
        });
      } else {
        addToast({
          type: 'info',
          message: 'सर्व नोंदी आधीच सिंक आहेत. (All records synced)',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'सिंक त्रुटी';
      addToast({ type: 'error', message: msg });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSwitchDemoUser = async (targetRole: 'owner' | 'staff') => {
    const target = targetRole === 'owner' ? DEMO_OWNER_PROFILE : DEMO_STAFF_PROFILE;
    const newProfile = {
      id: target.id,
      displayName: target.displayName,
      role: target.role,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.appSettings.put({
      key: 'activeSessionProfile',
      value: newProfile,
      updatedAt: new Date().toISOString(),
    });

    setUser(newProfile);
    addToast({
      type: 'info',
      message: `प्रोफाईल बदलली: ${newProfile.displayName}`,
    });
  };

  const handleResetDemoData = async () => {
    try {
      await runLocalSeedIfNeeded(true);
      addToast({
        type: 'success',
        message: 'डेमो डेटा रीसेट केला गेला!',
      });
      setShowResetConfirm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'रीसेट त्रुटी';
      addToast({ type: 'error', message: msg });
    }
  };

  const handleExportBackup = async () => {
    try {
      const customers = await db.customers.toArray();
      const transactions = await db.transactions.toArray();

      const backupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        customers,
        transactions,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `udhari_khata_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: 'डेटाबेस बॅकअप JSON फाईल डाऊनलोड झाली!',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'बॅकअप त्रुटी';
      addToast({ type: 'error', message: msg });
    }
  };

  return (
    <div className="space-y-4 pb-20" data-testid="settings-page">
      <header>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">सेटिंग्ज (Settings)</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">थीम, प्रोफाईल, सिंक आणि बॅकअप</p>
      </header>

      {/* Theme Settings Selection Card */}
      <div className="glass-card p-4 rounded-2xl space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <span>थीम निवडा (App Theme):</span>
        </h3>

        <div className="grid grid-cols-2 gap-3 pt-0.5">
          {/* Light Theme Option */}
          <button
            onClick={() => setTheme('light')}
            className={`relative p-3.5 rounded-xl border flex items-center space-x-3 transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/30 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-300'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <span className="block font-bold text-xs">लाइट मोड</span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400">Light Mode</span>
            </div>
            {theme === 'light' && (
              <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
          </button>

          {/* Dark Theme Option */}
          <button
            onClick={() => setTheme('dark')}
            className={`relative p-3.5 rounded-xl border flex items-center space-x-3 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-sky-950/40 border-sky-500 text-sky-300 ring-2 ring-sky-500/30 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-300'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-sky-400 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <span className="block font-bold text-xs">डार्क मोड</span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400">Dark Mode</span>
            </div>
            {theme === 'dark' && (
              <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{user?.displayName || 'वापरकर्ता'}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              भूमिका:{' '}
              <span className="text-sky-600 dark:text-sky-400 font-semibold uppercase">
                {user?.role === 'owner' ? 'दुकान मालक (Owner)' : 'स्टाफ (Staff)'}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={() => void logout()}
          className="flex items-center space-x-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>साइन आउट</span>
        </button>
      </div>

      {/* Fast Demo User Switcher (Local mode only) */}
      {isLocalMode && (
        <div className="glass-card p-4 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-sky-700 dark:text-sky-300 font-bold">
            <Users className="w-4 h-4 text-sky-500" />
            <span>डेमो प्रोफाईल बदला:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => void handleSwitchDemoUser('owner')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-colors ${
                user?.role === 'owner'
                  ? 'bg-sky-500/20 border-sky-500 text-sky-700 dark:text-sky-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              मालक (Owner)
            </button>

            <button
              onClick={() => void handleSwitchDemoUser('staff')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-colors ${
                user?.role === 'staff'
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              स्टाफ (Staff)
            </button>
          </div>
        </div>
      )}

      {/* Sync Status / Cloud Sync */}
      <div className="glass-card p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isLocalMode ? 'स्थानिक डेटा मोड (Local Mode)' : 'क्लाऊड सिंक स्थिती'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isLocalMode
                ? 'सर्व हिशोब डेटा तुमच्या या फोनमध्ये सुरक्षित जतन आहे.'
                : `पेंडिंग सिंक नोंदी: ${pendingSyncCount}`}
            </p>
          </div>

          <button
            onClick={() => void handleManualSync()}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shrink-0 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isLocalMode ? 'सुरक्षित मोड' : isSyncing ? 'सिंक होत आहे...' : 'सिंक करा'}</span>
          </button>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="glass-card p-4 rounded-2xl space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">डेटा बॅकअप व रीस्टोर</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          इतर फोनवर डेटा पाठवण्यासाठी किंवा बॅकअप डाउनलोड करण्यासाठी.
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => void handleExportBackup()}
            className="flex items-center justify-center space-x-1.5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>बॅकअप डाऊनलोड</span>
          </button>

          {isOwner() ? (
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center justify-center space-x-1.5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4 text-sky-500" />
              <span>बॅकअप रीस्टोर</span>
            </button>
          ) : (
            <div className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] text-slate-500 text-center flex items-center justify-center">
              रीस्टोर मालकांसाठी राखीव
            </div>
          )}
        </div>

        {/* Reset Demo Data Button (Owner only in Local Mode) */}
        {isLocalMode && isOwner() && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>डेमो डेटा रीसेट करा (Reset Demo Data)</span>
            </button>
          </div>
        )}
      </div>

      {/* PWA Mobile Installation Tip */}
      <div className="glass-card p-4 rounded-2xl space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-bold">
          <Smartphone className="w-4 h-4 text-sky-500" />
          <span>फोनवर अ‍ॅप इन्स्टॉल करा (Install PWA)</span>
        </div>
        <ul className="text-slate-600 dark:text-slate-400 space-y-1 pl-5 list-disc text-[11px]">
          <li>
            <strong className="text-slate-800 dark:text-slate-300">Android Chrome:</strong> मेनूमध्ये &quot;Add to Home screen&quot; निवडा.
          </li>
          <li>
            <strong className="text-slate-800 dark:text-slate-300">iPhone Safari:</strong> &quot;Share&quot; आयकॉन दाबून &quot;Add to Home Screen&quot; निवडा.
          </li>
        </ul>
      </div>

      {/* App Info Footer */}
      <div className="text-center text-[11px] text-slate-500 pt-2 space-y-1">
        <p className="flex items-center justify-center space-x-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Udhari Khata v0.1.0 • {isLocalMode ? 'Local Demo Mode' : 'Cloud Sync'}</span>
        </p>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-xs w-full p-4 space-y-3 text-center shadow-xl">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">डेमो डेटा रीसेट करायचा आहे का?</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              सर्व नोंदी काढून मूळ ५ मराठी डेमो ग्राहक रीस्टोर केले जातील.
            </p>
            <div className="flex items-center justify-center space-x-2 pt-1">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg"
              >
                रद्द करा
              </button>
              <button
                onClick={() => void handleResetDemoData()}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg"
              >
                होय, रीसेट करा
              </button>
            </div>
          </div>
        </div>
      )}

      <BackupImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  );
};
