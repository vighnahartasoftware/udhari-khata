import React from 'react';

export const NewTransactionPage: React.FC = () => {
  return (
    <div className="space-y-4" data-testid="new-transaction-page">
      <header>
        <h1 className="text-xl font-bold text-slate-100">Add New Transaction</h1>
        <p className="text-xs text-slate-400">Record credit (udhari) or payment received</p>
      </header>

      <form className="p-4 bg-slate-800 border border-slate-700 rounded-xl space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Transaction Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="py-2 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold"
            >
              Credit (Udhari)
            </button>
            <button
              type="button"
              className="py-2 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold"
            >
              Payment Received
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
