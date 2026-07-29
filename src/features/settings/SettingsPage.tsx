import React, { useState } from 'react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { db } from '@/db/dexie';
import { syncEngine } from '@/services/sync.service';
import { useAuthStore } from '@/store/authStore';
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
  Copy,
  RotateCcw,
  Info,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';

export const SettingsPage: React.FC = () => {
  const { user, logout, isOwner, setUser } = useAuthStore();
  const { addToast } = useToastStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { customers, transactions, pendingSyncCount, refreshData } = useRealtimeData();
  const customerCount = customers.length;
  const transactionCount = transactions.length;

  const isLocalMode = env.VITE_DATA_MODE === 'local';

  const handleManualSync = async () => {
    if (isLocalMode) {
      addToast({
        type: 'info',
        message: 'स्थानिक डेमो मोडमध्ये सर्व डेटा या फोनमध्येच सुरक्षित आहे. (Local mode data stored locally)',
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
          message: `सिंक पूर्ण! (${res.processed} नोंदी ऑनलाइन जतन झाल्या)`,
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
      message: `डेमो युझर बदलला: ${newProfile.displayName}`,
    });
  };

  const handleResetDemoData = async () => {
    try {
      await runLocalSeedIfNeeded(true);
      addToast({
        type: 'success',
        message: 'डेमो डेटा यशस्वीरित्या रीसेट केला गेला! (Demo data reset completed)',
      });
      setShowResetConfirm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'रीसेट करताना त्रुटी आली';
      addToast({ type: 'error', message: msg });
    }
  };

  const handleCopyDiagnostics = () => {
    const diagText = `--- Udhari Khata Diagnostics ---
Data Mode: ${env.VITE_DATA_MODE}
App Version: v0.1.0
Environment: ${env.VITE_APP_ENV}
Current User: ${user?.displayName || 'None'} (${user?.role || 'N/A'})
IndexedDB Status: Ready (Active)
Customers: ${customerCount}
Transactions: ${transactionCount}
Pending Sync Items: ${pendingSyncCount}
Online Status: ${typeof navigator !== 'undefined' ? navigator.onLine : 'Unknown'}
PWA Status: Registered & Active
Timestamp: ${new Date().toISOString()}
--------------------------------`;

    void navigator.clipboard.writeText(diagText);
    addToast({
      type: 'success',
      message: 'डायग्नोस्टिक्स कॉपी केले गेले! (Diagnostics copied to clipboard)',
    });
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
        message: 'स्थानिक डेटाबेस बॅकअप JSON फाईल डाऊनलोड झाली!',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'बॅकअप डाऊनलोड करताना त्रुटी';
      addToast({ type: 'error', message: msg });
    }
  };

  return (
    <div className="space-y-4 pb-20" data-testid="settings-page">
      <header>
        <h1 className="text-xl font-bold text-slate-100">सेटिंग्ज व अ‍ॅप व्यवस्थापन</h1>
        <p className="text-xs text-slate-400">सिंक, बॅकअप आणि युझर प्रोफाईल</p>
      </header>

      {/* User Profile Card */}
      <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-sky-600/30 text-sky-400 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">{user?.displayName || 'वापरकर्ता'}</h3>
            <p className="text-xs text-slate-400">
              भूमिका (Role):{' '}
              <span className="text-sky-400 font-semibold uppercase">
                {user?.role === 'owner' ? 'दुकान मालक (Owner)' : 'स्टाफ (Staff)'}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={() => void logout()}
          className="flex items-center space-x-1 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-700/50 text-rose-300 rounded-xl text-xs font-semibold"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>साइन आउट</span>
        </button>
      </div>

      {/* Fast Demo User Switcher (Local mode only) */}
      {isLocalMode && (
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-sky-300 font-bold">
            <Users className="w-4 h-4 text-sky-400" />
            <span>डेमो युझर स्विच करा (Switch Demo Role):</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => void handleSwitchDemoUser('owner')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-colors ${
                user?.role === 'owner'
                  ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              अ‍ॅडमिन मालक (Owner)
            </button>

            <button
              onClick={() => void handleSwitchDemoUser('staff')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-colors ${
                user?.role === 'staff'
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              भाऊ स्टाफ (Staff)
            </button>
          </div>
        </div>
      )}

      {/* Sync Status / Local Mode Notice */}
      <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              {isLocalMode ? 'स्थानिक डेटा मोड (Local Demo Mode)' : 'क्लाऊड सिंक स्थिती (Cloud Sync)'}
            </h3>
            <p className="text-xs text-slate-400">
              {isLocalMode
                ? 'Local Demo Mode stores data only in this browser. Cross-device sync will be enabled after Supabase setup.'
                : `पेंडिंग सिंक नोंदी: ${pendingSyncCount}`}
            </p>
          </div>

          <button
            onClick={() => void handleManualSync()}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isLocalMode ? 'लोकल स्थिती' : isSyncing ? 'सिंक होत आहे...' : 'पुन्हा सिंक करा'}</span>
          </button>
        </div>
      </div>

      {/* JSON Backup & Restore */}
      <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl space-y-3">
        <h3 className="text-sm font-bold text-slate-100">डेटा बॅकअप व रीस्टोर (JSON Backup)</h3>
        <p className="text-xs text-slate-400">
          स्थानिक डेटाबेस सुरक्षित ठेवा किंवा इतर फोनवर ट्रान्सफर करा.
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => void handleExportBackup()}
            className="flex items-center justify-center space-x-1.5 py-2.5 bg-slate-750 hover:bg-slate-700 border border-slate-650 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>बॅकअप डाऊनलोड</span>
          </button>

          {isOwner() ? (
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center justify-center space-x-1.5 py-2.5 bg-slate-750 hover:bg-slate-700 border border-slate-650 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <Upload className="w-4 h-4 text-sky-400" />
              <span>बॅकअप रीस्टोर</span>
            </button>
          ) : (
            <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-500 text-center flex items-center justify-center">
              रीस्टोर मालकांसाठी राखीव
            </div>
          )}
        </div>

        {/* Reset Demo Data Button (Owner only in Local Mode) */}
        {isLocalMode && isOwner() && (
          <div className="pt-2 border-t border-slate-750">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2.5 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-700/40 text-rose-300 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>डेमो डेटा रीसेट करा (Reset Demo Data)</span>
            </button>
          </div>
        )}
      </div>

      {/* Diagnostics Panel */}
      <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-200 font-bold text-xs">
            <Info className="w-4 h-4 text-sky-400" />
            <span>अ‍ॅप डायग्नोस्टिक्स (Diagnostics Info)</span>
          </div>
          <button
            onClick={handleCopyDiagnostics}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-lg text-[11px] font-semibold"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>कॉपी करा</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-slate-900/70 p-3 rounded-xl border border-slate-750">
          <div>
            <span className="text-slate-500">डेटा मोड:</span>{' '}
            <span className="font-bold text-sky-400 uppercase">{env.VITE_DATA_MODE}</span>
          </div>
          <div>
            <span className="text-slate-500">व्हर्जन:</span> <span className="font-bold">v0.1.0</span>
          </div>
          <div>
            <span className="text-slate-500">IndexedDB:</span>{' '}
            <span className="font-bold text-emerald-400">सक्रिय (Active)</span>
          </div>
          <div>
            <span className="text-slate-500">एकूण ग्राहक:</span>{' '}
            <span className="font-bold text-slate-100">{customerCount}</span>
          </div>
          <div>
            <span className="text-slate-500">एकूण व्यवहार:</span>{' '}
            <span className="font-bold text-slate-100">{transactionCount}</span>
          </div>
          <div>
            <span className="text-slate-500">पेंडिंग सिंक:</span>{' '}
            <span className="font-bold text-amber-400">{pendingSyncCount}</span>
          </div>
        </div>
      </div>

      {/* PWA Mobile Installation Guide */}
      <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-200 font-bold">
          <Smartphone className="w-4 h-4 text-sky-400" />
          <span>फोनवर अ‍ॅप इन्स्टॉल करा (Install PWA)</span>
        </div>
        <ul className="text-slate-400 space-y-1.5 pl-5 list-disc text-[11px]">
          <li>
            <strong className="text-slate-300">Android Chrome:</strong> ब्राउझर मेनूमध्ये जाऊन &quot;Add to Home screen&quot; किंवा &quot;Install App&quot; निवडा.
          </li>
          <li>
            <strong className="text-slate-300">iPhone Safari:</strong> खालील &quot;Share&quot; आयकॉनवर क्लिक करून &quot;Add to Home Screen&quot; निवडा.
          </li>
        </ul>
      </div>

      {/* App Info Footer */}
      <div className="text-center text-[11px] text-slate-500 pt-2 space-y-1">
        <p className="flex items-center justify-center space-x-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Udhari Khata v0.1.0 • {isLocalMode ? 'Local Demo Mode' : 'Supabase Production'}</span>
        </p>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xs w-full p-4 space-y-3 text-center">
            <h4 className="text-sm font-bold text-slate-100">डेमो डेटा रीसेट करायचा आहे का?</h4>
            <p className="text-xs text-slate-400">
              स्थानिक फोनमधील सर्व नोंदी काढून मूळ ५ मराठी डेमो ग्राहक रीस्टोर केले जातील.
            </p>
            <div className="flex items-center justify-center space-x-2 pt-1">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
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
