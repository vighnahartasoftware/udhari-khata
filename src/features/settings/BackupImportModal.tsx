import React, { useState } from 'react';
import { X, Upload, AlertTriangle } from 'lucide-react';
import { db } from '@/db/dexie';
import { useToastStore } from '@/components/feedback/ToastStore';
import type { Customer, Transaction } from '@/types/domain';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface BackupJSON {
  version: number;
  exportedAt: string;
  customers: Customer[];
  transactions: Transaction[];
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB Max

export const BackupImportModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { addToast } = useToastStore();
  const [parsedData, setParsedData] = useState<BackupJSON | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setParsedData(null);
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg('फाईल आकार ५MB पेक्षा जास्त आहे. (File size exceeds 5MB limit)');
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const json = JSON.parse(content) as BackupJSON;

        if (!json || typeof json !== 'object') {
          throw new Error('अवैध JSON फाईल स्वरूप. (Invalid JSON format)');
        }

        if (!Array.isArray(json.customers) || !Array.isArray(json.transactions)) {
          throw new Error('अवैध बॅकअप फाईल रचना. (Missing customers or transactions array)');
        }

        // Schema validation check for customer items
        for (const c of json.customers) {
          if (!c.id || !c.name) {
            throw new Error('बॅकअप मधील ग्राहक रेकॉर्ड अवैध आहे. (Invalid customer structure)');
          }
        }

        setParsedData(json);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'JSON फाईल वाचता आली नाही';
        setErrorMsg(msg);
      }
    };

    reader.readAsText(file);
  };

  const handleImportConfirm = async () => {
    if (!parsedData) return;

    try {
      setIsImporting(true);

      await db.transaction('rw', [db.customers, db.transactions], async () => {
        for (const c of parsedData.customers) {
          await db.customers.put(c);
        }
        for (const t of parsedData.transactions) {
          await db.transactions.put(t);
        }
      });

      addToast({
        type: 'success',
        message: `बॅकअप यशस्वीरित्या रीस्टोर केला! (${parsedData.customers.length} ग्राहक, ${parsedData.transactions.length} नोंदी)`,
      });

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'रीस्टोर करताना त्रुटी आली';
      addToast({ type: 'error', message: msg });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold">बॅकअप फाईल रीस्टोर करा (Import Backup)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-300">
            कृपया पूर्वी डाऊनलोड केलेली JSON बॅकअप फाईल निवडा (कमाल ५MB):
          </p>

          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-500/20 file:text-sky-300 hover:file:bg-sky-500/30 cursor-pointer"
          />

          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-700/50 rounded-xl text-xs text-rose-300 font-medium">
              {errorMsg}
            </div>
          )}

          {parsedData && (
            <div className="p-3 bg-sky-950/40 border border-sky-700/40 rounded-xl space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-sky-300 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>बॅकअप माहिती पडताळली:</span>
              </div>
              <ul className="text-slate-300 space-y-1 pl-4 list-disc text-[11px]">
                <li>ग्राहक संख्या: {parsedData.customers.length}</li>
                <li>एकूण नोंदी: {parsedData.transactions.length}</li>
                <li>तारीख: {new Date(parsedData.exportedAt).toLocaleString('mr-IN')}</li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            रद्द करा (Cancel)
          </button>
          <button
            type="button"
            disabled={!parsedData || isImporting}
            onClick={() => void handleImportConfirm()}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {isImporting ? 'रीस्टोर होत आहे...' : 'रीस्टोर करा (Restore)'}
          </button>
        </div>
      </div>
    </div>
  );
};
