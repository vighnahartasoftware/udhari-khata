import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { formatCurrency } from '@/utils';
import { AddCustomerModal } from './AddCustomerModal';
import { deleteCustomer } from '@/services/customerService';
import { useToastStore } from '@/components/feedback/ToastStore';
import {
  Search,
  UserPlus,
  Phone,
  MapPin,
  ChevronRight,
  Sparkles,
  User,
  LayoutGrid,
  List,
  Trash2,
} from 'lucide-react';
import type { Customer } from '@/types/domain';

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  const { customers, calculateBalance } = useRealtimeData();

  const filtered = customers
    .filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const nameMatch = c.name.toLowerCase().includes(q);
      const altMatch = c.alternateName ? c.alternateName.toLowerCase().includes(q) : false;
      const mobileMatch = c.mobile ? c.mobile.includes(q) : false;
      return nameMatch || altMatch || mobileMatch;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'mr-IN'));

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    try {
      await deleteCustomer(deletingCustomer.id);
      addToast({
        type: 'success',
        message: `ग्राहक '${deletingCustomer.name}' खात्यातून काढून टाकला! (Customer deleted)`,
      });
      setDeletingCustomer(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ग्राहक डीलीट करताना त्रुटी आली';
      addToast({ type: 'error', message: msg });
    }
  };

  return (
    <div className="space-y-5 pb-24" data-testid="customer-list-page">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-1.5 text-sky-400 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ग्राहक डिरेक्टरी</span>
          </div>
          <h2 className="heading-font text-xl md:text-2xl font-black text-slate-100 tracking-tight">
            ग्राहक यादी ({customers.length})
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="p-1 bg-slate-900 border border-slate-800 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Zoom Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-sky-500/20 glow-sky active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>नवीन ग्राहक</span>
          </button>
        </div>
      </header>

      {/* Glass Search Input */}
      <div className="relative">
        <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="नाव, टोपणनाव किंवा मोबाईल नंबरने शोधा..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-800/90 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/80 focus:ring-4 focus:ring-sky-500/10 text-sm font-medium transition-all shadow-inner"
        />
      </div>

      {/* Customer Cards List */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center text-slate-500 text-xs glass-card rounded-3xl space-y-2">
          <p>कोणताही ग्राहक मिळाला नाही. (No matching customers)</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Zoom App Video-Grid Style Layout */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          {filtered.map((customer) => {
            const bal = calculateBalance(customer);
            const isFemale = customer.gender === 'female';
            const recorderName = customer.recordedBy === 'nikhil' ? 'निखिल' : 'विवेक';

            return (
              <div
                key={customer.id}
                onClick={() => navigate(`/customers/${customer.id}`)}
                className="glass-card glass-card-hover p-4 rounded-3xl flex flex-col items-center justify-between cursor-pointer transition-all space-y-3 relative overflow-hidden group text-center border-slate-800/90 hover:border-sky-500/50 shadow-2xl"
              >
                {/* Delete Icon Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingCustomer(customer);
                  }}
                  title="ग्राहक डीलीट करा"
                  className="absolute top-3 right-3 p-1.5 rounded-xl bg-slate-950/80 hover:bg-rose-950/90 text-slate-400 hover:text-rose-300 transition-all opacity-0 group-hover:opacity-100 z-10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Zoom Box Photo Frame */}
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
                  <span className="absolute bottom-0 right-0 px-1.5 py-0.5 text-[10px] bg-slate-950/90 font-bold rounded-tl-lg border-t border-l border-slate-800">
                    {isFemale ? '♀️' : '♂️'}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="w-full space-y-1">
                  <h3 className="font-bold text-base text-slate-100 truncate">{customer.name}</h3>
                  <p className="text-xs text-slate-400 font-medium truncate">
                    {customer.mobile || 'मोबाईल नोंद नाही'}
                  </p>

                  <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-slate-900 border border-slate-800 rounded-full text-[10px] text-slate-400 font-extrabold">
                    <User className="w-3 h-3 text-sky-400" />
                    <span>नोंदणी: {recorderName}</span>
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
      ) : (
        /* Classic List View */
        <div className="space-y-2.5">
          {filtered.map((customer) => {
            const bal = calculateBalance(customer);
            const recorderName = customer.recordedBy === 'nikhil' ? 'निखिल' : 'विवेक';

            return (
              <div
                key={customer.id}
                onClick={() => navigate(`/customers/${customer.id}`)}
                className="glass-card glass-card-hover p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all space-x-3 group"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/80 overflow-hidden flex items-center justify-center font-black text-sky-400 text-base shadow-md shrink-0">
                    {customer.photoUrl ? (
                      <img src={customer.photoUrl} alt={customer.name} className="w-full h-full object-cover" />
                    ) : (
                      customer.name.charAt(0)
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-base text-slate-100 truncate">{customer.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-full font-semibold shrink-0">
                        {customer.gender === 'female' ? '♀️ महिला' : '♂️ पुरुष'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400 font-medium">
                      {customer.mobile && (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{customer.mobile}</span>
                        </span>
                      )}
                      {customer.address && (
                        <span className="flex items-center space-x-1 truncate max-w-[130px]">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-sky-400 font-semibold">
                        नोंद: {recorderName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right">
                    <span
                      className={`heading-font text-sm font-black ${
                        bal > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {formatCurrency(bal)}
                    </span>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      {bal > 0 ? 'उधारी बाकी' : 'निल'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingCustomer(customer);
                    }}
                    title="ग्राहक डीलीट करा"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-5 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto font-bold">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-100">ग्राहक डीलीट करायचा आहे का?</h4>
              <p className="text-xs text-slate-400 mt-1">
                ग्राहक <span className="font-bold text-rose-300">'{deletingCustomer.name}'</span> यांचे खाते यादीतून काढले जाईल.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                रद्द करा (Cancel)
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteCustomer()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-rose-600/30"
              >
                डीलीट करा (Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsAddCustomerOpen(true)}
        aria-label="Add new customer"
        className="fixed bottom-24 right-5 z-40 w-14 h-14 bg-gradient-to-tr from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-sky-500/30 glow-sky transition-transform active:scale-95"
      >
        <UserPlus className="w-6 h-6" />
      </button>

      <AddCustomerModal isOpen={isAddCustomerOpen} onClose={() => setIsAddCustomerOpen(false)} />
    </div>
  );
};
