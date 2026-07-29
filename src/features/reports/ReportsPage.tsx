import React, { useState } from 'react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { calculateCustomerTotals } from '@/utils/balance';
import { formatCurrency } from '@/utils';
import { exportCustomersToCSV } from '@/utils/csvExport';
import { useToastStore } from '@/components/feedback/ToastStore';
import {
  FileSpreadsheet,
  Calendar,
  Users,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { parseISO, isWithinInterval } from 'date-fns';

export const ReportsPage: React.FC = () => {
  const { addToast } = useToastStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { customers, transactions, totals: shopTotals } = useRealtimeData();

  const filteredTransactions = transactions.filter((t) => {
    if (!startDate && !endDate) return true;
    try {
      const tDate = parseISO(t.transactionDate);
      const start = startDate ? parseISO(startDate) : new Date(0);
      const end = endDate ? parseISO(endDate) : new Date(2099, 11, 31);
      return isWithinInterval(tDate, { start, end });
    } catch {
      return true;
    }
  });

  const handleExportCSV = () => {
    if (customers.length === 0) {
      addToast({ type: 'warning', message: 'एक्सपोर्ट करण्यासाठी ग्राहक डेटा उपलब्ध नाही.' });
      return;
    }

    try {
      exportCustomersToCSV(customers, transactions);
      addToast({
        type: 'success',
        message: 'ग्राहक उधारी रिपोर्ट CSV फाईल डाऊनलोड झाली!',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'CSV एक्सपोर्ट त्रुटी';
      addToast({ type: 'error', message: msg });
    }
  };

  return (
    <div className="space-y-5 pb-24" data-testid="reports-page">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-1.5 text-sky-400 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>व्यवसाय अहवाल</span>
          </div>
          <h2 className="heading-font text-xl md:text-2xl font-black text-slate-100 tracking-tight">
            रिपोर्ट व हिशोब (Reports)
          </h2>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-3.5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 glow-emerald active:scale-95 shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>CSV डाऊनलोड</span>
        </button>
      </header>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-4">
        <div className="glass-card p-3.5 rounded-2xl space-y-1">
          <div className="flex items-center space-x-1 text-rose-400 text-[11px] font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>आजची उधारी</span>
          </div>
          <p className="heading-font text-base md:text-lg font-black text-rose-400">
            {formatCurrency(shopTotals.todayCredit)}
          </p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl space-y-1">
          <div className="flex items-center space-x-1 text-emerald-400 text-[11px] font-bold">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>आजची वसुली</span>
          </div>
          <p className="heading-font text-base md:text-lg font-black text-emerald-400">
            {formatCurrency(shopTotals.todayPayment)}
          </p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl space-y-1 border-sky-500/30">
          <div className="flex items-center space-x-1 text-sky-300 text-[11px] font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>एकूण बाकी</span>
          </div>
          <p className="heading-font text-base md:text-lg font-black text-sky-300">
            {formatCurrency(shopTotals.totalBalance)}
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="glass-card p-4 rounded-2xl space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
          <Calendar className="w-4 h-4 text-sky-400" />
          <span>कालावधी फिल्टर (Date Filter):</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-semibold">पासून (Start Date)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-semibold">पर्यंत (End Date)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Customer Balance Summary List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-100 px-1">ग्राहकनिहाय उधारी तक्ता</h3>

        <div className="space-y-2">
          {customers.map((c) => {
            const totals = calculateCustomerTotals(c, filteredTransactions);
            return (
              <div
                key={c.id}
                className="glass-card glass-card-hover p-3.5 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-100">{c.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    उधारी: {formatCurrency(totals.totalCredit)} | वसुली: {formatCurrency(totals.totalPayment)}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`heading-font text-sm font-black ${
                      totals.balance > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatCurrency(totals.balance)}
                  </span>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    {totals.balance > 0 ? 'बाकी' : 'निल'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
