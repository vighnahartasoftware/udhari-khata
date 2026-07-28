import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { calculateCustomerTotals } from '@/utils/balance';
import { formatCurrency } from '@/utils';
import { exportCustomerLedgerToCSV } from '@/utils/csvExport';
import { localCustomerRepository } from '@/services/customer.local.repository';
import { localTransactionRepository } from '@/services/transaction.local.repository';
import { AddCreditModal } from '../transactions/AddCreditModal';
import { AddPaymentModal } from '../transactions/AddPaymentModal';
import { useToastStore } from '@/components/feedback/ToastStore';
import {
  ArrowLeft,
  Phone,
  MapPin,
  PlusCircle,
  CheckCircle2,
  Download,
  Trash2,
  TrendingUp,
  TrendingDown,
  Clock,
  Check,
  User,
} from 'lucide-react';
import { format } from 'date-fns';

export const CustomerDetailPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [isCreditOpen, setIsCreditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [deletingTxnId, setDeletingTxnId] = useState<string | null>(null);
  const [isDeleteCustomerOpen, setIsDeleteCustomerOpen] = useState(false);

  const customer = useLiveQuery(
    () => (customerId ? db.customers.get(customerId) : undefined),
    [customerId]
  );

  const allTransactions = useLiveQuery(
    () => (customerId ? localTransactionRepository.getByCustomerId(customerId) : []),
    [customerId]
  ) || [];

  if (!customer) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-3" data-testid="customer-detail-page">
        <p>ग्राहक सापडला नाही. (Customer not found)</p>
        <button
          onClick={() => navigate('/customers')}
          className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-sky-400"
        >
          मागे जा
        </button>
      </div>
    );
  }

  const totals = calculateCustomerTotals(customer, allTransactions);
  const isFemale = customer.gender === 'female';
  const customerRecorder = customer.recordedBy === 'nikhil' ? 'निखिल' : 'विवेक';

  const handleDeleteTransaction = async (id: string) => {
    try {
      await localTransactionRepository.deleteSoft(id);
      addToast({
        type: 'success',
        message: 'नोंद काढून टाकली. (Transaction deleted)',
      });
      setDeletingTxnId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'डीलीट करताना त्रुटी';
      addToast({ type: 'error', message: msg });
    }
  };

  const handleDeleteCustomerAccount = async () => {
    try {
      await localCustomerRepository.delete(customer.id);
      addToast({
        type: 'success',
        message: `ग्राहक '${customer.name}' चे खाते डीलीट झाले!`,
      });
      setIsDeleteCustomerOpen(false);
      navigate('/customers', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ग्राहक डीलीट करताना त्रुटी';
      addToast({ type: 'error', message: msg });
    }
  };

  return (
    <div className="space-y-4 pb-20" data-testid="customer-detail-page">
      {/* Top Bar */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsDeleteCustomerOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-950/80 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-bold hover:bg-rose-900 transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>ग्राहक खाते डीलीट</span>
          </button>

          <button
            onClick={() => exportCustomerLedgerToCSV(customer, allTransactions)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>CSV</span>
          </button>
        </div>
      </header>

      {/* Customer Info Header Card (Zoom Photo Box Style) */}
      <div className="glass-card p-5 rounded-3xl space-y-4">
        <div className="flex items-start space-x-4">
          {/* Zoom Photo Frame */}
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700/80 shrink-0 shadow-lg">
            {customer.photoUrl ? (
              <img src={customer.photoUrl} alt={customer.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-sky-400 text-2xl bg-gradient-to-br from-slate-800 to-slate-900">
                {customer.name.charAt(0)}
              </div>
            )}
            <span className="absolute bottom-0 right-0 px-1.5 py-0.5 text-[10px] bg-slate-950/90 font-bold rounded-tl-lg">
              {isFemale ? '♀️' : '♂️'}
            </span>
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-100 truncate">{customer.name}</h1>
              <span className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-full font-bold">
                {isFemale ? '♀️ महिला' : '♂️ पुरुष'}
              </span>
            </div>

            {customer.alternateName && (
              <p className="text-xs text-slate-400 font-medium">टोपणनाव: {customer.alternateName}</p>
            )}

            <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-slate-900/90 border border-slate-800 text-sky-400 rounded-full text-[11px] font-semibold">
              <User className="w-3 h-3" />
              <span>ग्राहक जोडणारा: {customerRecorder}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-300 font-medium pt-1">
          {customer.mobile && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900/90 rounded-xl border border-slate-800">
              <Phone className="w-3.5 h-3.5 text-sky-400" />
              <span>{customer.mobile}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900/90 rounded-xl border border-slate-800">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>{customer.address}</span>
            </div>
          )}
        </div>

        {customer.notes && (
          <p className="text-xs bg-slate-950/70 p-3 rounded-2xl text-slate-400 border border-slate-800/80 font-medium">
            टीप: {customer.notes}
          </p>
        )}

        {/* Balance Card */}
        <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl flex items-center justify-between shadow-inner">
          <div>
            <p className="text-xs text-slate-400 font-bold">सध्याची एकूण बाकी (Net Balance)</p>
            <p
              className={`heading-font text-2xl font-black mt-0.5 ${
                totals.balance > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {formatCurrency(totals.balance)}
            </p>
          </div>
          <div className="text-right text-xs space-y-1 font-bold">
            <p className="text-rose-400">
              उधारी: {formatCurrency(totals.totalCredit)}
            </p>
            <p className="text-emerald-400">
              जमा: {formatCurrency(totals.totalPayment)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => setIsCreditOpen(true)}
            className="flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-rose-600/25 glow-rose active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>उधारी जोडा (+ Credit)</span>
          </button>

          <button
            onClick={() => setIsPaymentOpen(true)}
            className="flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/25 glow-emerald active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>पेमेंट घ्या (- Payment)</span>
          </button>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-bold text-slate-200 px-1">
          लेजर व्यवहार इतिहास (Transaction History)
        </h3>

        {allTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs glass-card rounded-2xl">
            कोणताही व्यवहार नोंदवलेला नाही. (No transactions yet)
          </div>
        ) : (
          <div className="space-y-2.5">
            {allTransactions.map((t) => {
              const isCredit = t.type === 'credit';
              const txnRecorder = t.recordedBy === 'nikhil' ? 'निखिल' : 'विवेक';

              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border flex items-start justify-between space-x-3 transition-all ${
                    isCredit
                      ? 'bg-rose-950/20 border-rose-800/40'
                      : 'bg-emerald-950/20 border-emerald-800/40'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isCredit
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isCredit ? 'उधारी (Credit)' : 'पेमेंट (Payment)'}
                      </span>
                      {t.paymentMode && (
                        <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full font-semibold">
                          {t.paymentMode === 'cash'
                            ? 'रोख'
                            : t.paymentMode === 'upi'
                              ? 'UPI'
                              : t.paymentMode === 'bank_transfer'
                                ? 'बँक'
                                : 'इतर'}
                        </span>
                      )}

                      {/* Performer Tag */}
                      <span className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-sky-300 rounded-full font-bold">
                        नोंद: {txnRecorder}
                      </span>

                      {t.syncStatus === 'pending' ? (
                        <span title="सिंक बाकी">
                          <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                        </span>
                      ) : (
                        <span title="सिंक पूर्ण">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-200 font-bold">
                      {t.description || (isCredit ? 'दूध / डेअरी साहित्य' : 'पेमेंट जमा')}
                    </p>

                    <p className="text-[11px] text-slate-400 font-medium">
                      {format(new Date(t.transactionDate), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>

                  <div className="flex flex-col items-end space-y-2 shrink-0">
                    <div className="flex items-center space-x-1">
                      {isCredit ? (
                        <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span
                        className={`heading-font text-sm font-black ${
                          isCredit ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {formatCurrency(t.amount)}
                      </span>
                    </div>

                    <button
                      onClick={() => setDeletingTxnId(t.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="नोंद डीलीट करा"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Transaction Confirmation Modal */}
      {deletingTxnId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xs w-full p-4 space-y-3 text-center">
            <h4 className="text-sm font-bold text-slate-100">नोंद डीलीट करायची आहे का?</h4>
            <p className="text-xs text-slate-400">ही व्यवहार नोंद डीलीट केली जाईल.</p>
            <div className="flex items-center justify-center space-x-2 pt-1">
              <button
                onClick={() => setDeletingTxnId(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
              >
                रद्द करा
              </button>
              <button
                onClick={() => void handleDeleteTransaction(deletingTxnId)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg"
              >
                डीलीट करा
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Entire Customer Account Confirmation Modal */}
      {isDeleteCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-5 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto font-bold">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-100">ग्राहक खाते डीलीट करायचे आहे का?</h4>
              <p className="text-xs text-slate-400 mt-1">
                ग्राहक <span className="font-bold text-rose-300">'{customer.name}'</span> यांचे खाते आणि सर्व व्यवहार इतिहास डीलीट केला जाईल.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteCustomerOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                रद्द करा (Cancel)
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteCustomerAccount()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-rose-600/30"
              >
                होय, डीलीट करा (Delete Account)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddCreditModal
        isOpen={isCreditOpen}
        onClose={() => setIsCreditOpen(false)}
        preselectedCustomerId={customer.id}
      />
      <AddPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        preselectedCustomerId={customer.id}
      />
    </div>
  );
};
