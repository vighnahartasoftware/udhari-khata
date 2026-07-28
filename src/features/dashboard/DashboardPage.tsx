import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { calculateShopTotals, calculateCustomerBalance } from '@/utils/balance';
import { formatCurrency } from '@/utils';
import { AddCustomerModal } from '../customers/AddCustomerModal';
import { AddCreditModal } from '../transactions/AddCreditModal';
import { AddPaymentModal } from '../transactions/AddPaymentModal';
import {
  UserPlus,
  PlusCircle,
  CheckCircle2,
  Users,
  Search,
  RefreshCw,
  ChevronRight,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  User,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddCreditOpen, setIsAddCreditOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);

  // Live queries for real-time reactivity with IndexedDB
  const customers = useLiveQuery(() => db.customers.filter((c) => Boolean(c.isActive)).toArray(), []) || [];
  const transactions = useLiveQuery(() => db.transactions.filter((t) => t.deletedAt === null).toArray(), []) || [];
  const pendingSyncCount = useLiveQuery(() => db.syncQueue.count(), []) || 0;

  const totals = calculateShopTotals(customers, transactions);

  const filteredCustomers = customers.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = c.name.toLowerCase().includes(query);
    const altMatch = c.alternateName ? c.alternateName.toLowerCase().includes(query) : false;
    const mobileMatch = c.mobile ? c.mobile.includes(query) : false;
    return nameMatch || altMatch || mobileMatch;
  });

  return (
    <div className="space-y-5" data-testid="dashboard-page">
      {/* Header Summary & Pending Sync Badge */}
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-1.5 text-sky-400 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>लाइव्ह डॅशबोर्ड</span>
          </div>
          <h2 className="heading-font text-xl md:text-2xl font-black text-slate-100 tracking-tight">
            दूध विक्री व खाते सारांश
          </h2>
        </div>

        {pendingSyncCount > 0 && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs font-semibold glow-amber animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>सिंक: {pendingSyncCount}</span>
          </div>
        )}
      </header>

      {/* Main KPI Cards with Glowing Accents */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-4">
        {/* Today Credit */}
        <div className="glass-card glass-card-hover p-3.5 rounded-3xl relative overflow-hidden group border-rose-500/20">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all" />
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400">आजची उधारी</span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="heading-font text-base md:text-lg font-black text-rose-400 tracking-tight">
            {formatCurrency(totals.todayCredit)}
          </p>
        </div>

        {/* Today Payment */}
        <div className="glass-card glass-card-hover p-3.5 rounded-3xl relative overflow-hidden group border-emerald-500/20">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400">आजची वसुली</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="heading-font text-base md:text-lg font-black text-emerald-400 tracking-tight">
            {formatCurrency(totals.todayPayment)}
          </p>
        </div>

        {/* Total Outstanding Balance */}
        <div className="glass-card glass-card-hover p-3.5 rounded-3xl relative overflow-hidden group border-sky-500/30">
          <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/15 rounded-full blur-xl group-hover:bg-sky-500/25 transition-all" />
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-sky-300">एकूण बाकी</span>
            <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="heading-font text-base md:text-lg font-black text-sky-300 tracking-tight">
            {formatCurrency(totals.totalBalance)}
          </p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-4 gap-2.5 pt-1">
        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="flex flex-col items-center justify-center p-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 rounded-3xl space-y-1.5 transition-all transform hover:-translate-y-0.5 shadow-xl group"
        >
          <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
            <UserPlus className="w-4.5 h-4.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-200">नवीन ग्राहक</span>
        </button>

        <button
          onClick={() => setIsAddCreditOpen(true)}
          className="flex flex-col items-center justify-center p-3.5 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-800/40 hover:border-rose-500/50 rounded-3xl space-y-1.5 transition-all transform hover:-translate-y-0.5 shadow-xl group"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
            <PlusCircle className="w-4.5 h-4.5" />
          </div>
          <span className="text-[11px] font-bold text-rose-300">उधारी जोडा</span>
        </button>

        <button
          onClick={() => setIsAddPaymentOpen(true)}
          className="flex flex-col items-center justify-center p-3.5 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-800/40 hover:border-emerald-500/50 rounded-3xl space-y-1.5 transition-all transform hover:-translate-y-0.5 shadow-xl group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
          <span className="text-[11px] font-bold text-emerald-300">पेमेंट घ्या</span>
        </button>

        <button
          onClick={() => navigate('/customers')}
          className="flex flex-col items-center justify-center p-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-3xl space-y-1.5 transition-all transform hover:-translate-y-0.5 shadow-xl group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
            <Users className="w-4.5 h-4.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-200">सर्व ग्राहक</span>
        </button>
      </div>

      {/* Customer Quick Search & Ultra-Premium Zoom-Grid Layout */}
      <div className="space-y-3 pt-2">
        <div className="relative">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ग्राहक शोधा (नाव किंवा मोबाईल नंबर)..."
            className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-800/90 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/80 focus:ring-4 focus:ring-sky-500/10 text-sm font-medium transition-all shadow-inner"
          />
        </div>

        {/* Ultra-Premium Zoom-Style Customer Photo Video Grid Container */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-bold">
            <span className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>ग्राहक यादी Zoom Grid ({filteredCustomers.length})</span>
            </span>
            <span>फोटो व बाकी रक्कम</span>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs glass-card rounded-3xl">
              कोणताही ग्राहक आढळला नाही. नवीन ग्राहक जोडण्यासाठी वर क्लिक करा.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
              {filteredCustomers.slice(0, 8).map((customer) => {
                const bal = calculateCustomerBalance(customer, transactions);
                const isFemale = customer.gender === 'female';
                const recorderName = customer.recordedBy === 'nikhil' ? 'निखिल' : 'विवेक';

                return (
                  <div
                    key={customer.id}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    className="glass-card glass-card-hover p-4 rounded-3xl flex flex-col items-center justify-between cursor-pointer transition-all space-y-3 relative overflow-hidden group text-center border-slate-800/90 hover:border-sky-500/50 hover:shadow-sky-500/10 shadow-2xl"
                  >
                    {/* Ambient Glow on Hover */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all pointer-events-none" />

                    {/* Ultra-Premium Zoom Photo Frame */}
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700/80 group-hover:border-sky-400 group-hover:scale-105 transition-all shrink-0 shadow-xl">
                      {customer.photoUrl ? (
                        <img
                          src={customer.photoUrl}
                          alt={customer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-sky-400 text-xl bg-gradient-to-br from-slate-800 to-slate-900">
                          {customer.name.charAt(0)}
                        </div>
                      )}
                      {/* Gender Badge */}
                      <span className="absolute bottom-0 right-0 px-1.5 py-0.5 text-[10px] bg-slate-950/90 font-bold rounded-tl-lg border-t border-l border-slate-800">
                        {isFemale ? '♀️' : '♂️'}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="w-full space-y-1">
                      <h3 className="font-bold text-base text-slate-100 truncate">{customer.name}</h3>
                      <p className="text-xs text-slate-400 font-medium truncate">
                        {customer.mobile || 'मोबाईल नोंद नाही'}
                      </p>

                      {/* Performer Tag */}
                      <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-slate-900/90 border border-slate-800 text-sky-300 rounded-full text-[10px] font-extrabold">
                        <User className="w-3 h-3 text-sky-400" />
                        <span>नोंद: {recorderName}</span>
                      </div>
                    </div>

                    {/* Balance Footer */}
                    <div className="w-full pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span
                        className={`heading-font text-sm font-black ${
                          bal > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {formatCurrency(bal)}
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400 group-hover:text-sky-400 transition-colors">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddCustomerModal isOpen={isAddCustomerOpen} onClose={() => setIsAddCustomerOpen(false)} />
      <AddCreditModal isOpen={isAddCreditOpen} onClose={() => setIsAddCreditOpen(false)} />
      <AddPaymentModal isOpen={isAddPaymentOpen} onClose={() => setIsAddPaymentOpen(false)} />
    </div>
  );
};
