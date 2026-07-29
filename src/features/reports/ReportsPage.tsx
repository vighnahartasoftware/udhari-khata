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
  RotateCcw,
  Filter,
} from 'lucide-react';
import { parseISO, isWithinInterval, format, subDays, startOfMonth } from 'date-fns';

export const ReportsPage: React.FC = () => {
  const { addToast } = useToastStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');

  const { customers, transactions, totals: shopTotals } = useRealtimeData();

  const handleSelectPreset = (preset: 'all' | 'today' | 'week' | 'month') => {
    setActivePreset(preset);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'week') {
      const weekAgoStr = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      setStartDate(weekAgoStr);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const monthStartStr = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      setStartDate(monthStartStr);
      setEndDate(todayStr);
    }
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    setActivePreset('custom');
    if (type === 'start') setStartDate(value);
    if (type === 'end') setEndDate(value);
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    setActivePreset('all');
  };

  const filteredTransactions = transactions.filter((t) => {
    if (!startDate && !endDate) return true;
    try {
      const tDate = parseISO(t.transactionDate);
      const start = startDate ? parseISO(startDate) : new Date(0);
      const end = endDate ? parseISO(`${endDate}T23:59:59`) : new Date(2099, 11, 31);
      return isWithinInterval(tDate, { start, end });
    } catch {
      return true;
    }
  });

  const isFilterActive = Boolean(startDate || endDate);

  const handleExportCSV = () => {
    if (customers.length === 0) {
      addToast({ type: 'warning', message: 'एक्सपोर्ट करण्यासाठी ग्राहक डेटा उपलब्ध नाही.' });
      return;
    }

    try {
      exportCustomersToCSV(customers, filteredTransactions);
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
          <div className="flex items-center space-x-1.5 text-sky-600 dark:text-sky-400 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>व्यवसाय अहवाल</span>
          </div>
          <h2 className="heading-font text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
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
          <div className="flex items-center space-x-1 text-rose-500 dark:text-rose-400 text-[11px] font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>आजची उधारी</span>
          </div>
          <p className="heading-font text-base md:text-lg font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(shopTotals.todayCredit)}
          </p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl space-y-1">
          <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>आजची वसुली</span>
          </div>
          <p className="heading-font text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(shopTotals.todayPayment)}
          </p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl space-y-1 border-sky-500/30">
          <div className="flex items-center space-x-1 text-sky-600 dark:text-sky-300 text-[11px] font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>एकूण बाकी</span>
          </div>
          <p className="heading-font text-base md:text-lg font-black text-sky-600 dark:text-sky-300">
            {formatCurrency(shopTotals.totalBalance)}
          </p>
        </div>
      </div>

      {/* Redesigned Date Range Filter Box */}
      <div className="glass-card p-4 rounded-2xl space-y-3.5 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Calendar className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <span>कालावधी फिल्टर (Date Range Filter):</span>
          </div>

          {isFilterActive && (
            <button
              onClick={clearFilter}
              className="flex items-center space-x-1 text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>रीसेट</span>
            </button>
          )}
        </div>

        {/* Preset Quick Buttons */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl text-xs">
          <button
            onClick={() => handleSelectPreset('all')}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              activePreset === 'all'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            सर्व (All)
          </button>
          <button
            onClick={() => handleSelectPreset('today')}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              activePreset === 'today'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            आज
          </button>
          <button
            onClick={() => handleSelectPreset('week')}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              activePreset === 'week'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            ७ दिवस
          </button>
          <button
            onClick={() => handleSelectPreset('month')}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              activePreset === 'month'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            हा महिना
          </button>
        </div>

        {/* Clean Theme-Aware Date Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-0.5">
          <div className="space-y-1">
            <label className="block text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
              पासून (Start Date)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 font-medium transition-colors cursor-pointer shadow-sm [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
              पर्यंत (End Date)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 font-medium transition-colors cursor-pointer shadow-sm [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
        </div>

        {/* Filter Indicator Badge */}
        {isFilterActive && (
          <div className="pt-1 flex items-center justify-between text-[11px] text-sky-700 dark:text-sky-300 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-xl font-medium">
            <span className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-sky-500" />
              <span>निवडलेला कालावधी: {filteredTransactions.length} व्यवहार आढळले</span>
            </span>
          </div>
        )}
      </div>

      {/* Customer Balance Summary List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 px-1">
          ग्राहकनिहाय उधारी तक्ता
        </h3>

        <div className="space-y-2">
          {customers.map((c) => {
            const totals = calculateCustomerTotals(c, filteredTransactions);
            return (
              <div
                key={c.id}
                className="glass-card glass-card-hover p-3.5 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{c.name}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    उधारी: {formatCurrency(totals.totalCredit)} | वसुली: {formatCurrency(totals.totalPayment)}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`heading-font text-sm font-black ${
                      totals.balance > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
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
